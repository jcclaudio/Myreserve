import { prisma } from "@/lib/db";

export interface CreateSaleOptions {
  cotacaoId: string;
  consultorId: string;
  clienteDocumento?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  totalParcelas?: number;
  metodoPagamento?: string;
  observacoes?: string;
}

/**
 * Cria uma Venda Canônica (Sale) a partir de uma Cotação Confirmada,
 * gerando atomicamente os itens de venda, contas a receber (receivables),
 * contas a pagar aos fornecedores (payables) e apuração de comissão do consultor.
 */
export async function createSaleFromCotacao(options: CreateSaleOptions) {
  const { cotacaoId, consultorId } = options;

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
    },
  });

  if (!cotacao) {
    throw new Error("Cotação não encontrada.");
  }

  // Obter canais escolhidos ou o de menor custo nos hotéis
  const canaisEscolhidos = (cotacao.hoteis || []).map((h) => {
    const manual = h.canais.find((c) => c.escolhido_manual);
    if (manual) return { hotelNome: h.hotel_nome, canal: manual };
    const menorCusto = h.canais.find((c) => c.menor_custo_do_grupo);
    if (menorCusto) return { hotelNome: h.hotel_nome, canal: menorCusto };
    return { hotelNome: h.hotel_nome, canal: h.canais[0] };
  }).filter((item) => item.canal != null);

  // Obter opções multiproduto selecionadas (Aéreo, Carros, Parques, Seguros, Transfers, etc.)
  const secoesOpcoesEscolhidas = (cotacao.sections || []).flatMap((sec) => {
    const selecionadas = (sec.options || []).filter((opt) => opt.selected);
    return selecionadas.map((opt) => {
      let meta: Record<string, any> = {};
      try {
        meta = typeof opt.metadata === "string" ? JSON.parse(opt.metadata) : opt.metadata || {};
      } catch {
        meta = {};
      }

      // Preço de venda: verificar bagagens no aéreo ou preço geral
      const precoVendaBRL =
        Number(meta.price_with_baggage ?? meta.with_baggage_price) ||
        Number(meta.price_without_baggage ?? meta.without_baggage_price) ||
        Number(opt.price) ||
        0;

      // Custo do fornecedor (se não informado, aplicar margem padrão)
      const custoInformado = Number(meta.cost_price ?? meta.custo_fornecedor);
      const margemAgenciaPct = cotacao.comissao_padrao_agencia_pct || 14.0;
      const custoFornecedorBRL = !isNaN(custoInformado) && custoInformado > 0
        ? custoInformado
        : Number((precoVendaBRL * (1 - margemAgenciaPct / 100)).toFixed(2));

      return {
        sectionId: sec.id,
        productType: sec.product_type,
        sectionTitle: sec.title,
        option: opt,
        metadata: meta,
        precoVendaBRL,
        custoFornecedorBRL,
      };
    });
  });

  if (canaisEscolhidos.length === 0 && secoesOpcoesEscolhidas.length === 0) {
    throw new Error("A cotação não possui itens ou serviços selecionados.");
  }

  // Cálculos financeiros consolidados
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

  const grossSaleAmount = totalHospedagemVenda + totalProdutosVenda;
  const supplierCost = totalHospedagemCusto + totalProdutosCusto;
  const agencyRevenue = Math.max(0, grossSaleAmount - supplierCost);
  const grossMarginPct =
    grossSaleAmount > 0 ? (agencyRevenue / grossSaleAmount) * 100 : 0;

  // Buscar plano de comissão do consultor ativo ou default 10% do lucro da agência
  const activePlan = await prisma.commissionPlan.findFirst({
    where: { ativo: true },
  });
  const commissionRate = activePlan ? activePlan.percentual_padrao : 10.0;
  const consultantCommissionTotal = Number(
    (agencyRevenue * (commissionRate / 100)).toFixed(2)
  );

  const contributionMargin = agencyRevenue - consultantCommissionTotal;
  const contributionMarginPct =
    grossSaleAmount > 0 ? (contributionMargin / grossSaleAmount) * 100 : 0;

  // Gerar número sequencial de venda
  const countSales = await prisma.sale.count();
  const saleNumber = `VEN-${new Date().getFullYear()}-${String(
    countSales + 1
  ).padStart(4, "0")}`;

  const totalParcelas = Math.max(1, options.totalParcelas || 1);
  const valorParcela = Number((grossSaleAmount / totalParcelas).toFixed(2));

  // Transação Atômica no Prisma
  const novaVenda = await prisma.$transaction(async (tx) => {
    // 1. Criar Sale
    const sale = await tx.sale.create({
      data: {
        sale_number: saleNumber,
        cotacao_id: cotacao.id,
        cliente_nome: cotacao.cliente_nome,
        cliente_documento: options.clienteDocumento || "",
        cliente_email: options.clienteEmail || "",
        cliente_telefone: options.clienteTelefone || "",
        destino: cotacao.destino,
        data_viagem_inicio: cotacao.data_ida,
        data_viagem_fim: cotacao.data_volta,
        consultor_id: consultorId,
        status: "CONFIRMED",
        moeda: "BRL",
        gross_sale_amount: Number(grossSaleAmount.toFixed(2)),
        supplier_cost: Number(supplierCost.toFixed(2)),
        agency_revenue: Number(agencyRevenue.toFixed(2)),
        gross_margin_pct: Number(grossMarginPct.toFixed(2)),
        consultant_commission_total: consultantCommissionTotal,
        contribution_margin: Number(contributionMargin.toFixed(2)),
        contribution_margin_pct: Number(contributionMarginPct.toFixed(2)),
        net_sale_amount: Number(grossSaleAmount.toFixed(2)),
        observacoes: options.observacoes || "",
      },
    });

    // 2. Criar SaleItems & Payables para Hotéis
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

      // Conta a pagar ao fornecedor de hotel
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

    // 3. Criar SaleItems & Payables para Produtos Multiproduto (Aéreo, Carros, Parques, etc.)
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

      // Conta a pagar ao fornecedor do produto
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

    // 4. Criar Contas a Receber (Receivables)
    for (let p = 1; p <= totalParcelas; p++) {
      const dataVenc = new Date(cotacao.data_ida);
      dataVenc.setMonth(dataVenc.getMonth() + (p - 1));

      await tx.receivable.create({
        data: {
          sale_id: sale.id,
          numero_parcela: p,
          total_parcelas: totalParcelas,
          valor_parcela: valorParcela,
          valor_pago: 0,
          saldo: valorParcela,
          data_vencimento: dataVenc,
          metodo_pagamento: options.metodoPagamento || "PIX",
          status: "OPEN",
          documento_ref: `${saleNumber}/P${p}`,
        },
      });
    }

    // 5. Provisionar Comissão do Consultor
    await tx.consultantCommission.create({
      data: {
        sale_id: sale.id,
        consultor_id: consultorId,
        plan_id: activePlan?.id || null,
        base_calculo_tipo: activePlan?.base_calculo || "AGENCY_REVENUE",
        base_calculo_valor: Number(agencyRevenue.toFixed(2)),
        percentual_aplicado: commissionRate,
        valor_comissao: consultantCommissionTotal,
        status: "ACCRUED",
      },
    });

    // 6. Auditoria Financeira
    await tx.financialAuditLog.create({
      data: {
        usuario_id: consultorId,
        entidade: "Sale",
        entidade_id: sale.id,
        acao: "CREATE",
        detalhes_json: JSON.stringify({
          sale_number: saleNumber,
          gross_sale_amount: grossSaleAmount,
          supplier_cost: supplierCost,
          agency_revenue: agencyRevenue,
          consultant_commission: consultantCommissionTotal,
        }),
      },
    });

    return sale;
  });

  return novaVenda;
}
