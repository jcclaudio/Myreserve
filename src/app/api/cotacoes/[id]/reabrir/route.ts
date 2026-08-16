import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/cotacoes/[id]/reabrir -> Reabrir cotação para correção com snapshot de versão e motivo obrigatório
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { motivo_reabertura } = body;

    if (!motivo_reabertura || !motivo_reabertura.trim()) {
      return NextResponse.json(
        { error: "O motivo da reabertura para correção é obrigatório." },
        { status: 400 }
      );
    }

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: params.id },
      include: {
        hoteis: { include: { canais: true } },
        sections: { include: { options: true } },
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada." },
        { status: 404 }
      );
    }

    // Gerar snapshot da versão atual antes de reabrir
    const snapshot = JSON.stringify(cotacao);
    const versaoNumero = cotacao.versao_atual;

    await prisma.cotacaoVersao.create({
      data: {
        cotacao_id: cotacao.id,
        versao_numero: versaoNumero,
        motivo_reabertura: motivo_reabertura.trim(),
        reaberto_por_usuario_id: user.id,
        snapshot_dados: snapshot,
      },
    });

    // Atualizar status e incrementar número de versão
    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: cotacao.id },
      data: {
        status: "REABERTA",
        versao_atual: versaoNumero + 1,
      },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        versoes: { orderBy: { criado_em: "desc" } },
        hoteis: { include: { canais: true } },
        sections: { include: { options: true } },
      },
    });

    // Registrar log financeiro/auditoria
    await prisma.financialAuditLog.create({
      data: {
        entidade: "Cotacao",
        entidade_id: cotacao.id,
        acao: "REABRIR_COTACAO",
        usuario_id: user.id,
        detalhes_json: JSON.stringify({
          versao_anterior: versaoNumero,
          nova_versao: versaoNumero + 1,
          motivo: motivo_reabertura.trim(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Cotação reaberta com sucesso para versão ${versaoNumero + 1}!`,
      cotacao: cotacaoAtualizada,
    });
  } catch (err: any) {
    console.error("Erro ao reabrir cotação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao reabrir cotação." },
      { status: 500 }
    );
  }
}
