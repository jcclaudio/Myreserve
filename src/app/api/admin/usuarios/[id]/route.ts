import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional(),
  role: z.enum(["ADMIN", "AGENTE", "FINANCEIRO"]).optional(),
  ativo: z.boolean().optional(),
});

// PATCH /api/admin/usuarios/[id] -> Atualizar usuário ou redefinir senha
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin();
    const userId = params.id;

    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados de atualização inválidos",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const usuarioAtual = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuarioAtual) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Regra de segurança: Não permitir que o próprio admin logado se desative ou retire seu próprio papel de ADMIN
    if (adminUser.id === userId) {
      if (parsed.data.ativo === false) {
        return NextResponse.json(
          { error: "Você não pode desativar seu próprio usuário administrador." },
          { status: 400 }
        );
      }
      if (parsed.data.role && parsed.data.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Você não pode remover seu próprio privilégio de administrador." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (parsed.data.nome) {
      updateData.nome = parsed.data.nome.trim();
    }

    if (parsed.data.email) {
      const novoEmail = parsed.data.email.toLowerCase().trim();
      if (novoEmail !== usuarioAtual.email) {
        const emailEmUso = await prisma.usuario.findUnique({
          where: { email: novoEmail },
        });
        if (emailEmUso) {
          return NextResponse.json(
            { error: "Este e-mail já está sendo utilizado por outro usuário." },
            { status: 409 }
          );
        }
        updateData.email = novoEmail;
      }
    }

    if (parsed.data.role) {
      updateData.role = parsed.data.role;
    }

    if (typeof parsed.data.ativo === "boolean") {
      updateData.ativo = parsed.data.ativo;
    }

    if (parsed.data.senha && parsed.data.senha.trim().length >= 6) {
      updateData.senha_hash = await hashPassword(parsed.data.senha);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
        atualizado_em: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: usuarioAtualizado,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem atualizar usuários." },
        { status: 403 }
      );
    }
    console.error("Erro ao atualizar usuário:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar usuário." },
      { status: 500 }
    );
  }
}
