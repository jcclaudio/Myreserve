import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/financeiro/recebiveis/[id]/liquidar -> Baixa de pagamento no recebível
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const valorRecebido = Number(body.valorRecebido);

    const receivable = await prisma.receivable.findUnique({
      where: { id: params.id },
      include: { sale: true },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Conta a receber não encontrada." },
        { status: 404 }
      );
    }

    const novoValorPago = isNaN(valorRecebido) || valorRecebido <= 0
      ? receivable.valor_parcela
      : valorRecebido;

    const novoSaldo = Math.max(0, receivable.valor_parcela - novoValorPago);
    const novoStatus = novoSaldo === 0 ? "PAID" : "PARTIALLY_PAID";

    const atualizado = await prisma.$transaction(async (tx) => {
      const rec = await tx.receivable.update({
        where: { id: params.id },
        data: {
          valor_pago: novoValorPago,
          saldo: novoSaldo,
          status: novoStatus,
          data_pagamento: new Date(),
          metodo_pagamento: body.metodoPagamento || receivable.metodo_pagamento,
          documento_ref: body.documentoRef || receivable.documento_ref,
        },
      });

      // Se todas as parcelas da venda forem quitadas, atualizar Sale para PAID e liberar comissões
      const todasParcelas = await tx.receivable.findMany({
        where: { sale_id: receivable.sale_id },
      });

      const todasPagas = todasParcelas.every((p) => p.status === "PAID");
      if (todasPagas) {
        await tx.sale.update({
          where: { id: receivable.sale_id },
          data: { status: "PAID" },
        });

        // Promover comissões da venda para ELIGIBLE / APPROVED
        await tx.consultantCommission.updateMany({
          where: { sale_id: receivable.sale_id, status: "ACCRUED" },
          data: { status: "APPROVED", data_elegibilidade: new Date() },
        });
      }

      // Registrar auditoria
      await tx.financialAuditLog.create({
        data: {
          usuario_id: user.id,
          entidade: "Receivable",
          entidade_id: receivable.id,
          acao: "PAY",
          detalhes_json: JSON.stringify({
            valor_pago: novoValorPago,
            saldo: novoSaldo,
            status: novoStatus,
          }),
        },
      });

      return rec;
    });

    return NextResponse.json({
      success: true,
      mensagem: "Recebimento registrado com sucesso!",
      receivable: atualizado,
    });
  } catch (err: any) {
    console.error("Erro ao liquidar recebível:", err);
    return NextResponse.json(
      { error: "Erro interno ao liquidar conta a receber." },
      { status: 500 }
    );
  }
}
