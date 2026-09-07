import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/chamados/[id] -> Atualizar status, atribuir responsável ou resolver chamado
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const chamadoExistente = await prisma.chamadoSuporte.findUnique({
      where: { id: params.id },
      select: { id: true, criado_por_id: true, responsavel_id: true },
    });

    if (!chamadoExistente) {
      return NextResponse.json(
        { error: "Chamado não encontrado." },
        { status: 404 }
      );
    }

    // Regra de segurança (RBAC): Agente só pode atualizar chamados de sua autoria ou sob sua responsabilidade
    if (
      user.role === "AGENTE" &&
      chamadoExistente.criado_por_id !== user.id &&
      chamadoExistente.responsavel_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode interagir com chamados criados por você ou sob sua responsabilidade." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, responsavel_id, solucao } = body;

    const data: any = {};
    if (status) data.status = status;
    if (responsavel_id) data.responsavel_id = responsavel_id;
    if (solucao) {
      data.solucao = solucao;
      if (status === "RESOLVIDO") {
        data.resolvido_em = new Date();
      }
    }

    const chamadoAtualizado = await prisma.chamadoSuporte.update({
      where: { id: params.id },
      data,
      include: {
        criado_por: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: "Chamado atualizado com sucesso!",
      chamado: chamadoAtualizado,
    });
  } catch (err: any) {
    console.error("Erro ao atualizar chamado:", err);
    return NextResponse.json(
      { error: "Erro interno ao atualizar chamado." },
      { status: 500 }
    );
  }
}
