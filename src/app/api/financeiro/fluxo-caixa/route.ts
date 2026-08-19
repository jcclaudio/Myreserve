import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CashFlowEngine } from "@/lib/cash-flow";

export const dynamic = "force-dynamic";

// GET /api/financeiro/fluxo-caixa -> Previsão de Fluxo de Caixa e Matriz de Vencimentos
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira e administração." },
        { status: 403 }
      );
    }

    const [receivables, payables, transacoesPagas] = await Promise.all([
      prisma.receivable.findMany({
        include: {
          sale: {
            select: { cliente_nome: true, sale_number: true },
          },
        },
        orderBy: { data_vencimento: "asc" },
      }),
      prisma.payable.findMany({
        include: {
          sale: {
            select: { cliente_nome: true, sale_number: true },
          },
        },
        orderBy: { data_vencimento: "asc" },
      }),
      prisma.transacaoFinanceira.findMany({
        where: { status: "PAGO" },
      }),
    ]);

    // Calcula saldo em caixa atual com base nas transações realizadas
    const totalReceitas = transacoesPagas
      .filter((t) => t.tipo === "RECEITA")
      .reduce((acc, t) => acc + t.valor_brl, 0);

    const totalDespesas = transacoesPagas
      .filter((t) => t.tipo === "DESPESA")
      .reduce((acc, t) => acc + t.valor_brl, 0);

    const initialCashBalance = totalReceitas - totalDespesas;

    const forecast = CashFlowEngine.calculateForecast(
      receivables,
      payables,
      initialCashBalance
    );

    return NextResponse.json({
      success: true,
      forecast,
    });
  } catch (err: any) {
    console.error("Erro ao gerar previsão de fluxo de caixa:", err);
    return NextResponse.json(
      { error: "Erro interno ao calcular fluxo de caixa." },
      { status: 500 }
    );
  }
}
