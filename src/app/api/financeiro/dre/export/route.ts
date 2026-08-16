import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/dre/export -> Exportar DRE Gerencial em CSV formatado
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "AGENTE") {
      return NextResponse.json(
        { error: "Acesso não autorizado ao DRE Gerencial." },
        { status: 403 }
      );
    }

    const sales = await prisma.sale.findMany({
      where: { status: "CONFIRMED" },
      include: { items: true, comissoes: true },
    });

    let gmv = 0;
    let custosFornecedores = 0;
    let receitaAgencia = 0;
    let reembolsos = 0;
    let comissoesConsultores = 0;
    let taxasProcessamento = 0;

    for (const sale of sales) {
      gmv += sale.gross_sale_amount;
      custosFornecedores += sale.supplier_cost;
      receitaAgencia += sale.agency_revenue;
      reembolsos += sale.refunded_amount + sale.cancelled_amount;
      comissoesConsultores += sale.consultant_commission_total;
      taxasProcessamento += sale.payment_processing_fee;
    }

    const vendaLiquida = gmv - reembolsos;
    const margemContribuicao =
      receitaAgencia - comissoesConsultores - taxasProcessamento;

    const despesasTransacoes = await prisma.transacaoFinanceira.findMany({
      where: {
        tipo: "DESPESA",
        status: "PAGO",
        categoria: { not: "PAGAMENTO_FORNECEDOR" },
      },
    });

    const despesasOperacionais = despesasTransacoes.reduce(
      (acc, t) => acc + t.valor_brl,
      0
    );

    const resultadoOperacional = margemContribuicao - despesasOperacionais;

    // Gerar CSV com cabeçalho e linhas
    let csv = `DEMONSTRATIVO DE RESULTADO DO EXERCICIO (DRE GERENCIAL) - FIXTUR\n`;
    csv += `Data de Emissao:;${new Date().toLocaleDateString("pt-BR")}\n\n`;
    csv += `Conta Gerencial;Valor (R$);Percentual (%)\n`;
    csv += `(+) GMV / Faturamento Bruto;${gmv.toFixed(2)};100.00%\n`;
    csv += `(-) Cancelamentos e Reembolsos;-${reembolsos.toFixed(2)};${(
      (reembolsos / (gmv || 1)) *
      100
    ).toFixed(2)}%\n`;
    csv += `(=) Venda Liquida;${vendaLiquida.toFixed(2)};${(
      (vendaLiquida / (gmv || 1)) *
      100
    ).toFixed(2)}%\n`;
    csv += `(-) Custos de Fornecedores Hoteleiros;-${custosFornecedores.toFixed(
      2
    )};${((custosFornecedores / (gmv || 1)) * 100).toFixed(2)}%\n`;
    csv += `(=) Receita Bruta da Agencia (Lucro Bruto);${receitaAgencia.toFixed(
      2
    )};${((receitaAgencia / (gmv || 1)) * 100).toFixed(2)}%\n`;
    csv += `(-) Comissoes dos Consultores;-${comissoesConsultores.toFixed(
      2
    )};${((comissoesConsultores / (receitaAgencia || 1)) * 100).toFixed(2)}%\n`;
    csv += `(-) Taxas de Meios de Pagamento;-${taxasProcessamento.toFixed(
      2
    )};${((taxasProcessamento / (receitaAgencia || 1)) * 100).toFixed(2)}%\n`;
    csv += `(=) Margem de Contribuicao Liquida;${margemContribuicao.toFixed(
      2
    )};${((margemContribuicao / (receitaAgencia || 1)) * 100).toFixed(2)}%\n`;
    csv += `(-) Despesas Operacionais Fixas / Administrativas;-${despesasOperacionais.toFixed(
      2
    )};-\n`;
    csv += `(=) RESULTADO OPERACIONAL GERENCIAL;${resultadoOperacional.toFixed(
      2
    )};-\n`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="DRE-Gerencial-FixTur-${new Date()
          .toISOString()
          .split("T")[0]}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Erro ao exportar DRE em CSV:", err);
    return NextResponse.json(
      { error: "Erro interno ao exportar DRE." },
      { status: 500 }
    );
  }
}
