import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { CadastroSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CadastroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nome, email, senha } = parsed.data;
    const emailFormatado = email.toLowerCase().trim();

    const existe = await prisma.usuario.findUnique({
      where: { email: emailFormatado },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Já existe um agente cadastrado com este e-mail." },
        { status: 409 }
      );
    }

    const senhaHash = await hashPassword(senha);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailFormatado,
        senha_hash: senhaHash,
      },
    });

    await setSessionCookie({
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role || "AGENTE",
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar o usuário." },
      { status: 500 }
    );
  }
}
