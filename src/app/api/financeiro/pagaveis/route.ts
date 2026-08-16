import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/pagaveis -> Listagem de contas a pagar a fornecedores hoteleiros
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const fornecedor = searchParams.get("fornecedor");

    const where: any = {};

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (fornecedor) {
      where.fornecedor_nome = { contains: fornecedor };
    }

    const pagaveis = await prisma.payable.findMany({
      where,
      orderBy: { data_vencimento: "asc" },
      include: {
        sale: {
          select: {
            id: true,
            sale_number: true,
            cliente_nome: true,
            destino: true,
          },
        },
      },
    });

    let totalAberto = 0;
    let totalPago = 0;

    for (const p of pagaveis) {
      if (p.status === "PAID") {
        totalPago += p.valor_pago;
      } else if (p.status === "OPEN" || p.status === "APPROVED" || p.status === "SCHEDULED") {
        totalAberto += p.saldo;
      }
    }

    return NextResponse.json({
      success: true,
      pagaveis,
      metricas: {
        totalAberto: Number(totalAberto.toFixed(2)),
        totalPago: Number(totalPago.toFixed(2)),
        totalRegistros: pagaveis.length,
      },
    });
  } catch (err: any) {
    console.error("Erro ao buscar contas a pagar:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar contas a pagar." },
      { status: 500 }
    );
  }
}
