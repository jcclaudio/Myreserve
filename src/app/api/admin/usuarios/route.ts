import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "AGENTE", "FINANCEIRO"]).default("AGENTE"),
  ativo: z.boolean().default(true),
});

// GET /api/admin/usuarios -> Listar todos os usuários com contagem de cotações
export async function GET() {
  try {
    await requireAdmin();

    const usuarios = await prisma.usuario.findMany({
      orderBy: { criado_em: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
        atualizado_em: true,
        _count: {
          select: {
            cotacoes: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, usuarios });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }
    console.error("Erro ao listar usuários:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar lista de usuários." },
      { status: 500 }
    );
  }
}

// POST /api/admin/usuarios -> Criar novo usuário
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados de usuário inválidos",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { nome, email, senha, role, ativo } = parsed.data;
    const emailNormalizado = email.toLowerCase().trim();

    const emailExistente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (emailExistente) {
      return NextResponse.json(
        { error: "Já existe um usuário cadastrado com este e-mail." },
        { status: 409 }
      );
    }

    const senha_hash = await hashPassword(senha);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senha_hash,
        role,
        ativo,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
      },
    });

    return NextResponse.json(
      { success: true, usuario: novoUsuario },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar usuários." },
        { status: 403 }
      );
    }
    console.error("Erro ao criar usuário:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar usuário." },
      { status: 500 }
    );
  }
}
