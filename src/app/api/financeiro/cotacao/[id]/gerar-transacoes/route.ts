import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/financeiro/cotacao/[id]/gerar-transacoes
// Gera automaticamente as transações financeiras (Receita do Cliente + Despesa dos Fornecedores) a partir de uma cotação fechada
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const cotacaoId = params.id;

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      include: {
        hoteis: {
          include: {
            canais: true,
          },
        },
        sections: {
          include: {
            options: true,
          },
        },
        transacoes: true,
        sales: {
          include: {
            comissoes: true,
          },
        },
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada." },
        { status: 404 }
      );
    }

    // 1. Para cada hotel, pegar o canal escolhido manualmente ou o menor custo
    const canaisEscolhidos = (cotacao.hoteis || []).map((h) => {
      const manual = h.canais.find((c) => c.escolhido_manual);
      if (manual) return { hotelNome: h.hotel_nome, canal: manual };
      const menorCusto = h.canais.find((c) => c.menor_custo_do_grupo);
      if (menorCusto) return { hotelNome: h.hotel_nome, canal: menorCusto };
      return { hotelNome: h.hotel_nome, canal: h.canais[0] };
    }).filter((item) => item.canal != null);

    // 2. Opções multiproduto selecionadas (Aéreo, Carro, Parques, Seguros, Transfers, etc.)
    const secoesOpcoesEscolhidas = (cotacao.sections || []).flatMap((sec) => {
      const selecionadas = (sec.options || []).filter((opt) => opt.selected);
      return selecionadas.map((opt) => {
        let meta: Record<string, any> = {};
        try {
          meta = typeof opt.metadata === "string" ? JSON.parse(opt.metadata) : opt.metadata || {};
        } catch {
          meta = {};
        }

        const precoVendaBRL =
          Number(meta.price_with_baggage ?? meta.with_baggage_price) ||
          Number(meta.price_without_baggage ?? meta.without_baggage_price) ||
          Number(opt.price) ||
          0;

        const custoInformado = Number(meta.cost_price ?? meta.custo_fornecedor);
        const margemAgenciaPct = cotacao.comissao_padrao_agencia_pct || 14.0;
        const custoFornecedorBRL = !isNaN(custoInformado) && custoInformado > 0
          ? custoInformado
          : Number((precoVendaBRL * (1 - margemAgenciaPct / 100)).toFixed(2));

        return {
          sectionTitle: sec.title,
          productType: sec.product_type,
          option: opt,
          metadata: meta,
          precoVendaBRL,
          custoFornecedorBRL,
        };
      });
    });

    const totalHospedagemVenda = canaisEscolhidos.reduce(
      (acc, item) => acc + item.canal.valor_final_venda,
      0
    );
    const totalHospedagemCusto = canaisEscolhidos.reduce(
      (acc, item) => acc + item.canal.custo_em_brl,
      0
    );

    const totalProdutosVenda = secoesOpcoesEscolhidas.reduce(
      (acc, item) => acc + item.precoVendaBRL,
      0
    );
    const totalProdutosCusto = secoesOpcoesEscolhidas.reduce(
      (acc, item) => acc + item.custoFornecedorBRL,
      0
    );

    const totalVendaBRL = totalHospedagemVenda + totalProdutosVenda;
    const totalCustoBRL = totalHospedagemCusto + totalProdutosCusto;
    const agencyRevenue = Math.max(0, totalVendaBRL - totalCustoBRL);
    const grossMarginPct = totalVendaBRL > 0 ? (agencyRevenue / totalVendaBRL) * 100 : 0;

    if (totalVendaBRL <= 0 && canaisEscolhidos.length === 0 && secoesOpcoesEscolhidas.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item ou produto selecionado para lançamento financeiro." },
        { status: 400 }
      );
    }

    // Buscar plano de comissão do consultor ativo ou default 10% do lucro da agência
    const activePlan = await prisma.commissionPlan.findFirst({
      where: { ativo: true },
    });
    const commissionRate = activePlan ? activePlan.percentual_padrao : 10.0;
    const consultantCommissionTotal = Number(
      (agencyRevenue * (commissionRate / 100)).toFixed(2)
    );
    const contributionMargin = agencyRevenue - consultantCommissionTotal;
    const contributionMarginPct = totalVendaBRL > 0 ? (contributionMargin / totalVendaBRL) * 100 : 0;

    // Gerar número sequencial de venda
    const countSales = await prisma.sale.count();
    const saleNumber = `VEN-${new Date().getFullYear()}-${String(
      countSales + 1
    ).padStart(4, "0")}`;

    // Executar transação atômica
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Limpar transações anteriores vinculadas a esta cotação (se houver) para evitar duplicações
      await tx.transacaoFinanceira.deleteMany({
        where: { cotacao_id: cotacao.id },
      });

      // 2. Limpar Vendas anteriores vinculadas a esta cotação (se houver)
      await tx.sale.deleteMany({
        where: { cotacao_id: cotacao.id },
      });

      const transacoesCriadas = [];

      // 3. Criar a RECEITA da venda ao cliente (Pacote Completo: Hospedagem + Produtos)
      const receitaCliente = await tx.transacaoFinanceira.create({
        data: {
          descricao: `Venda Pacote Viagem - ${cotacao.cliente_nome} (${cotacao.destino})`,
          tipo: "RECEITA",
          categoria: "VENDA_CLIENTE",
          valor_original: totalVendaBRL,
          moeda_original: "BRL",
          cotacao_cambio: 1.0,
          valor_brl: Number(totalVendaBRL.toFixed(2)),
          status: "PAGO",
          data_vencimento: new Date(cotacao.data_ida),
          data_pagamento: new Date(),
          metodo_pagamento: "PIX",
          comprovante_ref: `COT-${cotacao.id.slice(0, 8).toUpperCase()}`,
          observacoes: `Gerado automaticamente da Cotação para ${cotacao.cliente_nome}. Destino: ${cotacao.destino}`,
          cotacao_id: cotacao.id,
          usuario_id: user.id,
        },
      });
      transacoesCriadas.push(receitaCliente);

      // 4. Criar a DESPESA para cada fornecedor hoteleiro
      for (const item of canaisEscolhidos) {
        const despesaHotel = await tx.transacaoFinanceira.create({
          data: {
            descricao: `Pgto Fornecedor: ${item.canal.canal_nome} - Hotel ${item.hotelNome}`,
            tipo: "DESPESA",
            categoria: "PAGAMENTO_FORNECEDOR",
            valor_original: item.canal.custo_liquido,
            moeda_original: item.canal.moeda,
            cotacao_cambio: item.canal.cotacao_utilizada,
            valor_brl: Number(item.canal.custo_em_brl.toFixed(2)),
            status: "PENDENTE",
            data_vencimento: new Date(cotacao.data_ida),
            metodo_pagamento: "FATURADO",
            comprovante_ref: `FORN-${item.canal.canal_nome.toUpperCase()}`,
            observacoes: `Custo líquido do canal ${item.canal.canal_nome} para o hotel ${item.hotelNome}. Quarto: ${item.canal.categoria_quarto}`,
            cotacao_id: cotacao.id,
            usuario_id: user.id,
          },
        });
        transacoesCriadas.push(despesaHotel);
      }

      // 5. Criar a DESPESA para fornecedores dos demais produtos (Aéreo, Carros, Parques, etc.)
      for (const prod of secoesOpcoesEscolhidas) {
        const despesaProd = await tx.transacaoFinanceira.create({
          data: {
            descricao: `Pgto ${prod.sectionTitle}: ${prod.option.title}`,
            tipo: "DESPESA",
            categoria: "PAGAMENTO_FORNECEDOR",
            valor_original: prod.custoFornecedorBRL,
            moeda_original: prod.option.currency || "BRL",
            cotacao_cambio: 1.0,
            valor_brl: Number(prod.custoFornecedorBRL.toFixed(2)),
            status: "PENDENTE",
            data_vencimento: new Date(cotacao.data_ida),
            metodo_pagamento: "FATURADO",
            comprovante_ref: `PROD-${prod.productType.toUpperCase()}`,
            observacoes: `Fornecedor: ${prod.metadata.supplier_name || prod.metadata.cia_aerea || prod.sectionTitle}`,
            cotacao_id: cotacao.id,
            usuario_id: user.id,
          },
        });
        transacoesCriadas.push(despesaProd);
      }

      // 6. Criar Venda Canônica (Sale) para registro do GMV e Comissões do Agente
      const sale = await tx.sale.create({
        data: {
          sale_number: saleNumber,
          cotacao_id: cotacao.id,
          cliente_nome: cotacao.cliente_nome,
          destino: cotacao.destino,
          data_viagem_inicio: cotacao.data_ida,
          data_viagem_fim: cotacao.data_volta,
          consultor_id: cotacao.criado_por_usuario_id || user.id,
          status: "CONFIRMED",
          moeda: "BRL",
          gross_sale_amount: Number(totalVendaBRL.toFixed(2)),
          supplier_cost: Number(totalCustoBRL.toFixed(2)),
          agency_revenue: Number(agencyRevenue.toFixed(2)),
          gross_margin_pct: Number(grossMarginPct.toFixed(2)),
          consultant_commission_total: consultantCommissionTotal,
          contribution_margin: Number(contributionMargin.toFixed(2)),
          contribution_margin_pct: Number(contributionMarginPct.toFixed(2)),
          net_sale_amount: Number(totalVendaBRL.toFixed(2)),
          observacoes: `Venda gerada da Cotação ${cotacao.id.slice(0, 8)}.`,
        },
      });

      // 7. Criar SaleItems para Hotéis
      for (const item of canaisEscolhidos) {
        const saleItem = await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            item_type: "HOTEL",
            descricao: `Hotel ${item.hotelNome} (${item.canal.categoria_quarto})`,
            fornecedor_nome: item.canal.canal_nome,
            moeda_original: item.canal.moeda,
            valor_original: item.canal.custo_liquido,
            cotacao_cambio: item.canal.cotacao_utilizada,
            custo_fornecedor_brl: Number(item.canal.custo_em_brl.toFixed(2)),
            preco_venda_brl: Number(item.canal.valor_final_venda.toFixed(2)),
            comissao_fornecedor_pct: item.canal.comissao_fornecedor_pct,
            comissao_fornecedor_valor: Number(item.canal.valor_comissao.toFixed(2)),
          },
        });

        await tx.payable.create({
          data: {
            sale_id: sale.id,
            sale_item_id: saleItem.id,
            fornecedor_nome: item.canal.canal_nome,
            descricao: `Pgto Hotel: ${item.hotelNome} - Canal ${item.canal.canal_nome}`,
            categoria: "PAGAMENTO_FORNECEDOR",
            valor_original: item.canal.custo_liquido,
            moeda_original: item.canal.moeda,
            cotacao_cambio: item.canal.cotacao_utilizada,
            valor_brl: Number(item.canal.custo_em_brl.toFixed(2)),
            valor_pago: 0,
            saldo: Number(item.canal.custo_em_brl.toFixed(2)),
            data_vencimento: cotacao.data_ida,
            status: "OPEN",
            metodo_pagamento: "FATURADO",
            comprovante_ref: `FORN-${item.canal.canal_nome.toUpperCase()}`,
          },
        });
      }

      // 8. Criar SaleItems para Produtos
      for (const prod of secoesOpcoesEscolhidas) {
        const saleItem = await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            item_type: prod.productType,
            descricao: `${prod.sectionTitle} — ${prod.option.title}`,
            fornecedor_nome: prod.metadata.supplier_name || prod.metadata.cia_aerea || prod.sectionTitle,
            moeda_original: prod.option.currency || "BRL",
            valor_original: prod.custoFornecedorBRL,
            cotacao_cambio: 1.0,
            custo_fornecedor_brl: Number(prod.custoFornecedorBRL.toFixed(2)),
            preco_venda_brl: Number(prod.precoVendaBRL.toFixed(2)),
            comissao_fornecedor_pct: 0,
            comissao_fornecedor_valor: 0,
          },
        });

        await tx.payable.create({
          data: {
            sale_id: sale.id,
            sale_item_id: saleItem.id,
            fornecedor_nome: prod.metadata.supplier_name || prod.metadata.cia_aerea || prod.sectionTitle,
            descricao: `Pgto ${prod.sectionTitle}: ${prod.option.title}`,
            categoria: "PAGAMENTO_FORNECEDOR",
            valor_original: prod.custoFornecedorBRL,
            moeda_original: prod.option.currency || "BRL",
            cotacao_cambio: 1.0,
            valor_brl: Number(prod.custoFornecedorBRL.toFixed(2)),
            valor_pago: 0,
            saldo: Number(prod.custoFornecedorBRL.toFixed(2)),
            data_vencimento: cotacao.data_ida,
            status: "OPEN",
            metodo_pagamento: "FATURADO",
            comprovante_ref: `PROD-${prod.productType.toUpperCase()}`,
          },
        });
      }

      // 9. Criar Conta a Receber (Receivable)
      await tx.receivable.create({
        data: {
          sale_id: sale.id,
          numero_parcela: 1,
          total_parcelas: 1,
          valor_parcela: Number(totalVendaBRL.toFixed(2)),
          valor_pago: 0,
          saldo: Number(totalVendaBRL.toFixed(2)),
          data_vencimento: cotacao.data_ida,
          metodo_pagamento: "PIX",
          status: "OPEN",
          documento_ref: `${saleNumber}/P1`,
        },
      });

      // 10. Provisionar Comissão do Consultor (Aparece no Meu Financeiro)
      await tx.consultantCommission.create({
        data: {
          sale_id: sale.id,
          consultor_id: cotacao.criado_por_usuario_id || user.id,
          plan_id: activePlan?.id || null,
          base_calculo_tipo: activePlan?.base_calculo || "AGENCY_REVENUE",
          base_calculo_valor: Number(agencyRevenue.toFixed(2)),
          percentual_aplicado: commissionRate,
          valor_comissao: consultantCommissionTotal,
          status: "ACCRUED",
        },
      });

      // 11. Trilha de Auditoria
      await tx.financialAuditLog.create({
        data: {
          usuario_id: user.id,
          entidade: "Cotacao",
          entidade_id: cotacao.id,
          acao: "GERAR_FINANCEIRO",
          detalhes_json: JSON.stringify({
            sale_number: saleNumber,
            totalVendaBRL,
            totalCustoBRL,
            agencyRevenue,
            consultantCommissionTotal,
            transacoesQtd: transacoesCriadas.length,
          }),
        },
      });

      return {
        transacoesCriadas,
        sale,
        consultantCommissionTotal,
      };
    });

    return NextResponse.json({
      success: true,
      mensagem: `${resultado.transacoesCriadas.length} transações financeiras e comissão de ${resultado.consultantCommissionTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} lançadas com sucesso!`,
      sale: resultado.sale,
      transacoes: resultado.transacoesCriadas,
    });
  } catch (err: any) {
    console.error("Erro ao gerar transações da cotação:", err);
    return NextResponse.json(
      { error: "Erro interno ao gerar transações financeiras." },
      { status: 500 }
    );
  }
}
