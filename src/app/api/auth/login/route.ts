import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, senha } = parsed.data;

    let usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Auto-bootstrap do usuário demo caso o banco em produção não tenha rodado o seed
    if (!usuario && email.toLowerCase().trim() === "agente@myreserve.com.br" && senha === "senha123") {
      const { hashPassword } = await import("@/lib/auth");
      const senha_hash = await hashPassword("senha123");
      usuario = await prisma.usuario.create({
        data: {
          nome: "Agente Demo FixTur",
          email: "agente@myreserve.com.br",
          senha_hash,
          role: "ADMIN",
          ativo: true,
        },
      });
    }

    if (!usuario) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: "Usuário desativado pelo administrador. Contate o suporte." },
        { status: 403 }
      );
    }

    const senhaCorreta = await verifyPassword(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      ativo: usuario.ativo,
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o login." },
      { status: 500 }
    );
  }
}
