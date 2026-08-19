import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/dre -> Demonstrativo do Resultado do Exercício Gerencial (P&L)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira e administração." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");

    const whereSales: any = {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    };

    if (dataInicio || dataFim) {
      whereSales.criado_em = {};
      if (dataInicio) whereSales.criado_em.gte = new Date(dataInicio);
      if (dataFim) {
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        whereSales.criado_em.lte = end;
      }
    }

    const [sales, despesasOperacionais] = await Promise.all([
      prisma.sale.findMany({ where: whereSales }),
      prisma.transacaoFinanceira.findMany({
        where: {
          tipo: "DESPESA",
          categoria: "DESPESA_OPERACIONAL",
          status: "PAGO",
        },
      }),
    ]);

    // 1. GMV e Faturamento Bruto
    const gmv = sales.reduce((acc, s) => acc + s.gross_sale_amount, 0);
    const reembolsos = sales.reduce((acc, s) => acc + s.refunded_amount, 0);
    const vendaLiquida = gmv - reembolsos;

    // 2. Custos Diretos de Fornecedores Hoteleiros
    const custosFornecedores = sales.reduce((acc, s) => acc + s.supplier_cost, 0);

    // 3. Receita Bruta da Agência (Lucro Bruto FixTur)
    const receitaAgencia = vendaLiquida - custosFornecedores;
    const margemBrutaPct = vendaLiquida > 0 ? (receitaAgencia / vendaLiquida) * 100 : 0;

    // 4. Custos Variáveis de Venda
    const comissoesConsultores = sales.reduce(
      (acc, s) => acc + s.consultant_commission_total,
      0
    );
    const taxasProcessamento = sales.reduce(
      (acc, s) => acc + s.payment_processing_fee,
      0
    );
    const outrosCustosVariaveis = sales.reduce(
      (acc, s) => acc + s.other_variable_costs,
      0
    );
    const totalCustosVariaveis =
      comissoesConsultores + taxasProcessamento + outrosCustosVariaveis;

    // 5. Margem de Contribuição Líquida
    const margemContribuicao = receitaAgencia - totalCustosVariaveis;
    const margemContribuicaoPct =
      vendaLiquida > 0 ? (margemContribuicao / vendaLiquida) * 100 : 0;

    // 6. Despesas Operacionais Fixas / Administrativas
    const totalDespesasOperacionais = despesasOperacionais.reduce(
      (acc, d) => acc + d.valor_brl,
      0
    );

    // 7. Resultado Operacional Gerencial
    const resultadoOperacional = margemContribuicao - totalDespesasOperacionais;

    // 8. Resultado Cambial & Financeiro (Hedge / Flutuações)
    const paidPayables = await prisma.payable.findMany({
      where: {
        status: "PAID",
        moeda_original: { in: ["USD", "EUR"] },
      },
    });

    let resultadoCambial = 0;
    paidPayables.forEach((p) => {
      // Diferença entre valor original * câmbio inicial e valor_pago
      const custoPrevisto = (p.valor_original || 0) * (p.cotacao_cambio || 1);
      const custoEfetivo = p.valor_pago || p.valor_brl;
      resultadoCambial += (custoPrevisto - custoEfetivo);
    });

    const resultadoLiquidoFinal = resultadoOperacional + resultadoCambial;

    return NextResponse.json({
      success: true,
      dre: {
        gmv: Number(gmv.toFixed(2)),
        reembolsos: Number(reembolsos.toFixed(2)),
        vendaLiquida: Number(vendaLiquida.toFixed(2)),
        custosFornecedores: Number(custosFornecedores.toFixed(2)),
        receitaAgencia: Number(receitaAgencia.toFixed(2)),
        margemBrutaPct: Number(margemBrutaPct.toFixed(2)),
        custosVariaveis: {
          comissoesConsultores: Number(comissoesConsultores.toFixed(2)),
          taxasProcessamento: Number(taxasProcessamento.toFixed(2)),
          outrosCustosVariaveis: Number(outrosCustosVariaveis.toFixed(2)),
          total: Number(totalCustosVariaveis.toFixed(2)),
        },
        margemContribuicao: Number(margemContribuicao.toFixed(2)),
        margemContribuicaoPct: Number(margemContribuicaoPct.toFixed(2)),
        despesasOperacionais: Number(totalDespesasOperacionais.toFixed(2)),
        resultadoOperacional: Number(resultadoOperacional.toFixed(2)),
        resultadoCambial: Number(resultadoCambial.toFixed(2)),
        resultadoLiquidoFinal: Number(resultadoLiquidoFinal.toFixed(2)),
        totalVendasCount: sales.length,
      },
    });
  } catch (err: any) {
    console.error("Erro ao gerar DRE gerencial:", err);
    return NextResponse.json(
      { error: "Erro interno ao apurar DRE gerencial." },
      { status: 500 }
    );
  }
}
