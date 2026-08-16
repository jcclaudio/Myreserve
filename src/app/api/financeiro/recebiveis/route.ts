import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/recebiveis -> Listagem de contas a receber com Aging e status
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const consultorId = searchParams.get("consultor_id");

    const where: any = {};

    if (user.role === "AGENTE") {
      where.sale = { consultor_id: user.id };
    } else if (consultorId) {
      where.sale = { consultor_id: consultorId };
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    const recebiveis = await prisma.receivable.findMany({
      where,
      orderBy: { data_vencimento: "asc" },
      include: {
        sale: {
          select: {
            id: true,
            sale_number: true,
            cliente_nome: true,
            destino: true,
            consultor: {
              select: { id: true, nome: true },
            },
          },
        },
      },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let totalAberto = 0;
    let totalPago = 0;
    let totalVencido = 0;

    // Faixas de Aging
    let agingAVencer = 0;
    let aging1a7 = 0;
    let aging8a15 = 0;
    let aging16a30 = 0;
    let agingAcima30 = 0;

    for (const r of recebiveis) {
      if (r.status === "PAID") {
        totalPago += r.valor_pago;
      } else if (r.status === "OPEN" || r.status === "PARTIALLY_PAID" || r.status === "OVERDUE") {
        totalAberto += r.saldo;
        const dataVenc = new Date(r.data_vencimento);
        dataVenc.setHours(0, 0, 0, 0);

        if (dataVenc < hoje) {
          totalVencido += r.saldo;
          const diffDias = Math.floor(
            (hoje.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDias <= 7) aging1a7 += r.saldo;
          else if (diffDias <= 15) aging8a15 += r.saldo;
          else if (diffDias <= 30) aging16a30 += r.saldo;
          else agingAcima30 += r.saldo;
        } else {
          agingAVencer += r.saldo;
        }
      }
    }

    return NextResponse.json({
      success: true,
      recebiveis,
      metricas: {
        totalAberto: Number(totalAberto.toFixed(2)),
        totalPago: Number(totalPago.toFixed(2)),
        totalVencido: Number(totalVencido.toFixed(2)),
        aging: {
          aVencer: Number(agingAVencer.toFixed(2)),
          de1a7Dias: Number(aging1a7.toFixed(2)),
          de8a15Dias: Number(aging8a15.toFixed(2)),
          de16a30Dias: Number(aging16a30.toFixed(2)),
          acima30Dias: Number(agingAcima30.toFixed(2)),
        },
      },
    });
  } catch (err: any) {
    console.error("Erro ao buscar contas a receber:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar recebíveis." },
      { status: 500 }
    );
  }
}
