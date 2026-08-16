import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/comissoes -> Lista comissões de consultores com segurança por papel (RBAC)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const consultorIdParam = searchParams.get("consultor_id");
    const mine = searchParams.get("mine");

    const where: any = {};

    // Se for AGENTE ou se pedir explicitamente mine=true, filtra pelo usuário logado
    if (user.role === "AGENTE" || mine === "true") {
      where.consultor_id = user.id;
    } else if (consultorIdParam) {
      where.consultor_id = consultorIdParam;
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    const comissoes = await prisma.consultantCommission.findMany({
      where,
      orderBy: { criado_em: "desc" },
      include: {
        consultor: {
          select: { id: true, nome: true, email: true },
        },
        sale: {
          select: {
            id: true,
            sale_number: true,
            cliente_nome: true,
            destino: true,
            gross_sale_amount: true,
            agency_revenue: true,
            status: true,
          },
        },
        plan: {
          select: { id: true, nome: true, base_calculo: true },
        },
      },
    });

    // Métricas consolidadas do escopo
    let totalProvisionado = 0;
    let totalAprovado = 0;
    let totalPago = 0;
    let totalVendasValor = 0;

    for (const c of comissoes) {
      totalVendasValor += c.sale.gross_sale_amount;
      if (c.status === "ACCRUED" || c.status === "CALCULATED" || c.status === "ELIGIBLE") {
        totalProvisionado += c.valor_comissao;
      } else if (c.status === "APPROVED" || c.status === "PAYABLE" || c.status === "BATCHED") {
        totalAprovado += c.valor_comissao;
      } else if (c.status === "PAID") {
        totalPago += c.valor_comissao;
      }
    }

    return NextResponse.json({
      success: true,
      comissoes,
      metricas: {
        totalComissoes: comissoes.length,
        totalProvisionado: Number(totalProvisionado.toFixed(2)),
        totalAprovado: Number(totalAprovado.toFixed(2)),
        totalPago: Number(totalPago.toFixed(2)),
        totalVendasValor: Number(totalVendasValor.toFixed(2)),
      },
    });
  } catch (err: any) {
    console.error("Erro ao listar comissões:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar comissões." },
      { status: 500 }
    );
  }
}
