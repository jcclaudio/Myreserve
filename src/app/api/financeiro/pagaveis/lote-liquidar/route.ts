import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/financeiro/pagaveis/lote-liquidar -> Liquidação em lote de faturas de fornecedores
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira e administração." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { payable_ids, data_pagamento, metodo_pagamento, comprovante_ref } = body;

    if (!Array.isArray(payable_ids) || payable_ids.length === 0) {
      return NextResponse.json(
        { error: "Lista de faturas (payable_ids) inválida ou vazia." },
        { status: 400 }
      );
    }

    const payables = await prisma.payable.findMany({
      where: { id: { in: payable_ids } },
    });

    if (payables.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma fatura encontrada para os IDs fornecidos." },
        { status: 404 }
      );
    }

    const paymentDate = data_pagamento ? new Date(data_pagamento) : new Date();
    const paymentMethod = metodo_pagamento || "FATURADO";
    const receiptRef = comprovante_ref || `LOTE-${Date.now()}`;

    let totalLiquidado = 0;

    await prisma.$transaction(async (tx) => {
      for (const payable of payables) {
        totalLiquidado += payable.saldo || payable.valor_brl;

        await tx.payable.update({
          where: { id: payable.id },
          data: {
            status: "PAID",
            valor_pago: payable.valor_brl,
            saldo: 0,
            data_pagamento: paymentDate,
            metodo_pagamento: paymentMethod,
            comprovante_ref: receiptRef,
          },
        });
      }

      await tx.financialAuditLog.create({
        data: {
          usuario_id: user.id,
          entidade: "PAYABLE_BATCH",
          entidade_id: receiptRef,
          acao: "BATCH_SETTLEMENT",
          detalhes_json: JSON.stringify({
            total_faturas: payables.length,
            total_liquidado_brl: totalLiquidado,
            ids: payable_ids,
            metodo_pagamento: paymentMethod,
            comprovante_ref: receiptRef,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: `${payables.length} fatura(s) de fornecedores liquidadas com sucesso!`,
      total_faturas: payables.length,
      total_liquidado_brl: Number(totalLiquidado.toFixed(2)),
      comprovante_ref: receiptRef,
    });
  } catch (err: any) {
    console.error("Erro ao liquidar faturas em lote:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar liquidação em lote de faturas." },
      { status: 500 }
    );
  }
}
