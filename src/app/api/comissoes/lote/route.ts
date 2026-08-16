import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/comissoes/lote -> Liquidação/Pagamento de lote de comissões aprovadas
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { comissaoIds, consultorId, metodoPagamento, documentoRef } = body;

    const where: any = {
      status: { in: ["ACCRUED", "ELIGIBLE", "APPROVED", "PAYABLE"] },
    };

    if (Array.isArray(comissaoIds) && comissaoIds.length > 0) {
      where.id = { in: comissaoIds };
    } else if (consultorId) {
      where.consultor_id = consultorId;
    }

    const comissoesElegiveis = await prisma.consultantCommission.findMany({
      where,
      include: { consultor: true },
    });

    if (comissoesElegiveis.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma comissão elegível encontrada para liquidação." },
        { status: 400 }
      );
    }

    const totalPago = comissoesElegiveis.reduce(
      (acc, c) => acc + c.valor_comissao,
      0
    );

    await prisma.$transaction(async (tx) => {
      // 1. Atualizar comissões para PAID
      await tx.consultantCommission.updateMany({
        where: { id: { in: comissoesElegiveis.map((c) => c.id) } },
        data: {
          status: "PAID",
          data_pagamento: new Date(),
        },
      });

      // 2. Registrar auditoria do lote
      await tx.financialAuditLog.create({
        data: {
          usuario_id: user.id,
          entidade: "ConsultantCommission",
          entidade_id: "BATCH-PAYOUT",
          acao: "PAY",
          detalhes_json: JSON.stringify({
            quantidade: comissoesElegiveis.length,
            totalPago,
            metodoPagamento: metodoPagamento || "PIX",
            documentoRef: documentoRef || "",
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: `Lote de ${comissoesElegiveis.length} comissão(ões) liquidado com sucesso no valor de R$ ${totalPago.toFixed(2)}!`,
      totalPago: Number(totalPago.toFixed(2)),
      quantidade: comissoesElegiveis.length,
    });
  } catch (err: any) {
    console.error("Erro ao liquidar lote de comissões:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar lote de pagamento de comissões." },
      { status: 500 }
    );
  }
}
