import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TransacaoFinanceiraSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/financeiro/transacoes -> Listar transações com filtros
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const categoria = searchParams.get("categoria");
    const busca = searchParams.get("busca");
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");

    const where: any = {};

    // Se for AGENTE, vê apenas transações vinculadas a si
    if (user.role === "AGENTE") {
      where.usuario_id = user.id;
    }

    if (tipo && tipo !== "TODOS") {
      where.tipo = tipo;
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (categoria && categoria !== "TODOS") {
      where.categoria = categoria;
    }

    if (busca) {
      where.OR = [
        { descricao: { contains: busca } },
        { comprovante_ref: { contains: busca } },
        { cotacao: { cliente_nome: { contains: busca } } },
      ];
    }

    if (dataInicio || dataFim) {
      where.data_vencimento = {};
      if (dataInicio) {
        where.data_vencimento.gte = new Date(dataInicio);
      }
      if (dataFim) {
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        where.data_vencimento.lte = end;
      }
    }

    const transacoes = await prisma.transacaoFinanceira.findMany({
      where,
      orderBy: { data_vencimento: "desc" },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        cotacao: {
          select: { id: true, cliente_nome: true, destino: true },
        },
      },
    });

    return NextResponse.json({ success: true, transacoes });
  } catch (err: any) {
    console.error("Erro ao listar transações:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar transações financeiras." },
      { status: 500 }
    );
  }
}

// POST /api/financeiro/transacoes -> Criar transação
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TransacaoFinanceiraSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados de transação inválidos",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Calcular valor em BRL
    const cambio = data.moeda_original === "BRL" ? 1.0 : data.cotacao_cambio;
    const valor_brl = Number((data.valor_original * cambio).toFixed(2));

    const data_pagamento =
      data.status === "PAGO"
        ? data.data_pagamento
          ? new Date(data.data_pagamento)
          : new Date()
        : null;

    const novaTransacao = await prisma.transacaoFinanceira.create({
      data: {
        descricao: data.descricao.trim(),
        tipo: data.tipo,
        categoria: data.categoria,
        valor_original: data.valor_original,
        moeda_original: data.moeda_original,
        cotacao_cambio: cambio,
        valor_brl,
        status: data.status,
        data_vencimento: new Date(data.data_vencimento),
        data_pagamento,
        metodo_pagamento: data.metodo_pagamento,
        comprovante_ref: data.comprovante_ref?.trim() || "",
        observacoes: data.observacoes?.trim() || "",
        cotacao_id: data.cotacao_id || null,
        usuario_id: user.id,
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        cotacao: {
          select: { id: true, cliente_nome: true, destino: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, transacao: novaTransacao },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao criar transação:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao salvar transação financeira." },
      { status: 500 }
    );
  }
}
