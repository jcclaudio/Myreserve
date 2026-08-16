import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTransacaoSchema = z.object({
  descricao: z.string().min(2).optional(),
  tipo: z.enum(["RECEITA", "DESPESA"]).optional(),
  categoria: z
    .enum([
      "VENDA_CLIENTE",
      "PAGAMENTO_FORNECEDOR",
      "COMISSAO_AGENCIA",
      "TAXA_CAMBIO_IOF",
      "REEMBOLSO",
      "DESPESA_OPERACIONAL",
      "OUTRO",
    ])
    .optional(),
  valor_original: z.number().gt(0).optional(),
  moeda_original: z.enum(["BRL", "USD", "EUR"]).optional(),
  cotacao_cambio: z.number().gt(0).optional(),
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO"]).optional(),
  data_vencimento: z.string().optional(),
  data_pagamento: z.string().nullable().optional(),
  metodo_pagamento: z
    .enum([
      "PIX",
      "CARTAO_CREDITO",
      "BOLETO",
      "TRANSFERENCIA",
      "FATURADO",
      "DINHEIRO",
    ])
    .optional(),
  comprovante_ref: z.string().optional(),
  observacoes: z.string().optional(),
});

// PATCH /api/financeiro/transacoes/[id] -> Atualizar transação
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const transacaoId = params.id;
    const transacaoExistente = await prisma.transacaoFinanceira.findUnique({
      where: { id: transacaoId },
    });

    if (!transacaoExistente) {
      return NextResponse.json(
        { error: "Transação não encontrada." },
        { status: 404 }
      );
    }

    // Se for AGENTE, só pode editar suas próprias transações
    if (user.role === "AGENTE" && transacaoExistente.usuario_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para alterar esta transação." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateTransacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos para atualização",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: any = {};

    if (data.descricao) updateData.descricao = data.descricao.trim();
    if (data.tipo) updateData.tipo = data.tipo;
    if (data.categoria) updateData.categoria = data.categoria;
    if (data.metodo_pagamento) updateData.metodo_pagamento = data.metodo_pagamento;
    if (data.comprovante_ref !== undefined) updateData.comprovante_ref = data.comprovante_ref;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;

    // Recalcular valor em BRL se houver alteração de valor ou câmbio
    const valorOriginal =
      data.valor_original !== undefined
        ? data.valor_original
        : transacaoExistente.valor_original;
    const moedaOriginal = data.moeda_original || transacaoExistente.moeda_original;
    const cotacaoCambio =
      moedaOriginal === "BRL"
        ? 1.0
        : data.cotacao_cambio !== undefined
        ? data.cotacao_cambio
        : transacaoExistente.cotacao_cambio;

    if (
      data.valor_original !== undefined ||
      data.moeda_original !== undefined ||
      data.cotacao_cambio !== undefined
    ) {
      updateData.valor_original = valorOriginal;
      updateData.moeda_original = moedaOriginal;
      updateData.cotacao_cambio = cotacaoCambio;
      updateData.valor_brl = Number((valorOriginal * cotacaoCambio).toFixed(2));
    }

    if (data.data_vencimento) {
      updateData.data_vencimento = new Date(data.data_vencimento);
    }

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "PAGO") {
        updateData.data_pagamento = data.data_pagamento
          ? new Date(data.data_pagamento)
          : transacaoExistente.data_pagamento || new Date();
      } else {
        updateData.data_pagamento = null;
      }
    }

    const transacaoAtualizada = await prisma.transacaoFinanceira.update({
      where: { id: transacaoId },
      data: updateData,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        cotacao: {
          select: { id: true, cliente_nome: true, destino: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transacao: transacaoAtualizada,
    });
  } catch (err: any) {
    console.error("Erro ao atualizar transação:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar transação." },
      { status: 500 }
    );
  }
}

// DELETE /api/financeiro/transacoes/[id] -> Excluir transação
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const transacaoId = params.id;
    const transacaoExistente = await prisma.transacaoFinanceira.findUnique({
      where: { id: transacaoId },
    });

    if (!transacaoExistente) {
      return NextResponse.json(
        { error: "Transação não encontrada." },
        { status: 404 }
      );
    }

    if (user.role === "AGENTE" && transacaoExistente.usuario_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para excluir esta transação." },
        { status: 403 }
      );
    }

    await prisma.transacaoFinanceira.delete({
      where: { id: transacaoId },
    });

    return NextResponse.json({
      success: true,
      message: "Transação excluída com sucesso.",
    });
  } catch (err: any) {
    console.error("Erro ao excluir transação:", err);
    return NextResponse.json(
      { error: "Erro interno ao excluir transação." },
      { status: 500 }
    );
  }
}
