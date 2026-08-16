import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/fornecedores -> Listar todos os parceiros hoteleiros e operadoras
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: { nome_fantasia: "asc" },
    });

    return NextResponse.json({ success: true, fornecedores });
  } catch (err: any) {
    console.error("Erro ao listar fornecedores:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar fornecedores." },
      { status: 500 }
    );
  }
}

// POST /api/fornecedores -> Cadastrar novo parceiro ou operadora
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "AGENTE") {
      return NextResponse.json(
        { error: "Apenas administradores e financeiro podem cadastrar fornecedores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nome_fantasia,
      razao_social,
      cnpj,
      categoria,
      telefone_plantao,
      email_plantao,
      prazo_faturamento_dias,
      chave_pix,
      dados_bancarios,
      observacoes,
    } = body;

    if (!nome_fantasia || !nome_fantasia.trim()) {
      return NextResponse.json(
        { error: "Nome fantasia é obrigatório." },
        { status: 400 }
      );
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome_fantasia: nome_fantasia.trim(),
        razao_social: razao_social?.trim() || "",
        cnpj: cnpj?.trim() || "",
        categoria: categoria || "OPERADORA_HOTEL",
        telefone_plantao: telefone_plantao?.trim() || "",
        email_plantao: email_plantao?.trim() || "",
        prazo_faturamento_dias: Number(prazo_faturamento_dias) || 15,
        chave_pix: chave_pix?.trim() || "",
        dados_bancarios: dados_bancarios?.trim() || "",
        observacoes: observacoes?.trim() || "",
        ativo: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        mensagem: "Fornecedor cadastrado com sucesso!",
        fornecedor,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao cadastrar fornecedor:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um fornecedor cadastrado com esse nome." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno ao cadastrar fornecedor." },
      { status: 500 }
    );
  }
}
