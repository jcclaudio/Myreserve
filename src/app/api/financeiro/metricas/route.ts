import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/metricas -> Métricas consolidadas do fluxo de caixa
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");

    const where: any = {};

    if (user.role === "AGENTE") {
      where.usuario_id = user.id;
    }

    if (dataInicio || dataFim) {
      where.data_vencimento = {};
      if (dataInicio) {
        where.data_vencimento.gte = new Date(dataInicio);
      }
      if (dataFim) {
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        where.data_vencimento.lte = end;
      }
    }

    const transacoes = await prisma.transacaoFinanceira.findMany({
      where,
    });

    let totalReceitasPagas = 0;
    let totalDespesasPagas = 0;
    let totalReceitasPendentes = 0;
    let totalDespesasPendentes = 0;
    let totalCanceladas = 0;

    const porCategoria: Record<string, { receitas: number; despesas: number }> = {};
    const porMetodo: Record<string, number> = {};

    for (const t of transacoes) {
      if (t.status === "CANCELADO") {
        totalCanceladas++;
        continue;
      }

      if (!porCategoria[t.categoria]) {
        porCategoria[t.categoria] = { receitas: 0, despesas: 0 };
      }
      if (!porMetodo[t.metodo_pagamento]) {
        porMetodo[t.metodo_pagamento] = 0;
      }

      if (t.tipo === "RECEITA") {
        if (t.status === "PAGO") {
          totalReceitasPagas += t.valor_brl;
          porCategoria[t.categoria].receitas += t.valor_brl;
          porMetodo[t.metodo_pagamento] += t.valor_brl;
        } else if (t.status === "PENDENTE") {
          totalReceitasPendentes += t.valor_brl;
        }
      } else if (t.tipo === "DESPESA") {
        if (t.status === "PAGO") {
          totalDespesasPagas += t.valor_brl;
          porCategoria[t.categoria].despesas += t.valor_brl;
        } else if (t.status === "PENDENTE") {
          totalDespesasPendentes += t.valor_brl;
        }
      }
    }

    const lucroLiquidoRealizado = totalReceitasPagas - totalDespesasPagas;
    const margemLucroPct =
      totalReceitasPagas > 0
        ? Number(((lucroLiquidoRealizado / totalReceitasPagas) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      success: true,
      metricas: {
        totalReceitasPagas: Number(totalReceitasPagas.toFixed(2)),
        totalDespesasPagas: Number(totalDespesasPagas.toFixed(2)),
        lucroLiquidoRealizado: Number(lucroLiquidoRealizado.toFixed(2)),
        margemLucroPct,
        totalReceitasPendentes: Number(totalReceitasPendentes.toFixed(2)),
        totalDespesasPendentes: Number(totalDespesasPendentes.toFixed(2)),
        totalTransacoes: transacoes.length,
        totalCanceladas,
        porCategoria,
        porMetodo,
      },
    });
  } catch (err: any) {
    console.error("Erro ao calcular métricas financeiras:", err);
    return NextResponse.json(
      { error: "Erro ao gerar indicadores financeiros." },
      { status: 500 }
    );
  }
}
