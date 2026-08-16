import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/financeiro/pagaveis/[id]/liquidar -> Baixa de pagamento de fornecedor
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const valorPago = Number(body.valorPago);

    const payable = await prisma.payable.findUnique({
      where: { id: params.id },
    });

    if (!payable) {
      return NextResponse.json(
        { error: "Conta a pagar não encontrada." },
        { status: 404 }
      );
    }

    const novoValorPago = isNaN(valorPago) || valorPago <= 0
      ? payable.valor_brl
      : valorPago;

    const novoSaldo = Math.max(0, payable.valor_brl - novoValorPago);
    const novoStatus = novoSaldo === 0 ? "PAID" : "OPEN";

    const atualizado = await prisma.$transaction(async (tx) => {
      const p = await tx.payable.update({
        where: { id: params.id },
        data: {
          valor_pago: novoValorPago,
          saldo: novoSaldo,
          status: novoStatus,
          data_pagamento: new Date(),
          metodo_pagamento: body.metodoPagamento || payable.metodo_pagamento,
          comprovante_ref: body.comprovanteRef || payable.comprovante_ref,
        },
      });

      // Registrar auditoria
      await tx.financialAuditLog.create({
        data: {
          usuario_id: user.id,
          entidade: "Payable",
          entidade_id: payable.id,
          acao: "PAY",
          detalhes_json: JSON.stringify({
            fornecedor: payable.fornecedor_nome,
            valor_pago: novoValorPago,
            saldo: novoSaldo,
            status: novoStatus,
          }),
        },
      });

      return p;
    });

    return NextResponse.json({
      success: true,
      mensagem: "Pagamento de fornecedor registrado com sucesso!",
      payable: atualizado,
    });
  } catch (err: any) {
    console.error("Erro ao liquidar conta a pagar:", err);
    return NextResponse.json(
      { error: "Erro interno ao liquidar conta a pagar." },
      { status: 500 }
    );
  }
}
