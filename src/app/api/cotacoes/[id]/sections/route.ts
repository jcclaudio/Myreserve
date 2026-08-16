import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cotacoes/[id]/sections -> Listar seções multiproduto da cotação
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const sections = await prisma.quoteProductSection.findMany({
      where: { cotacao_id: params.id },
      orderBy: { sort_order: "asc" },
      include: {
        options: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    return NextResponse.json({ sections });
  } catch (err: any) {
    console.error("Erro ao listar seções multiproduto:", err);
    return NextResponse.json(
      { error: "Erro ao buscar seções multiproduto." },
      { status: 500 }
    );
  }
}

// POST /api/cotacoes/[id]/sections -> Criar nova seção multiproduto
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: params.id },
      include: { sections: true },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { product_type, title, description, initial_option } = body;

    if (!product_type || !title) {
      return NextResponse.json(
        { error: "Tipo de produto e título são obrigatórios." },
        { status: 400 }
      );
    }

    const sortOrder = cotacao.sections.length;

    const novaSecao = await prisma.quoteProductSection.create({
      data: {
        cotacao_id: params.id,
        product_type,
        title: title.trim(),
        description: description?.trim() || null,
        sort_order: sortOrder,
        options: initial_option
          ? {
              create: {
                title: initial_option.title || "Opção 1",
                description: initial_option.description || null,
                photo_url: initial_option.photo_url || null,
                price: Number(initial_option.price) || 0,
                currency: initial_option.currency || "BRL",
                selected: initial_option.selected !== undefined ? !!initial_option.selected : true,
                metadata: typeof initial_option.metadata === "string" ? initial_option.metadata : JSON.stringify(initial_option.metadata || {}),
              },
            }
          : undefined,
      },
      include: { options: true },
    });

    return NextResponse.json(
      {
        success: true,
        mensagem: "Seção de produto criada com sucesso!",
        section: novaSecao,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao criar seção multiproduto:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao adicionar seção multiproduto." },
      { status: 500 }
    );
  }
}

// PUT /api/cotacoes/[id]/sections -> Atualizar todas as seções e opções multiproduto
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: params.id },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Lista de seções inválida." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Deletar opções e seções existentes
      await tx.quoteProductOption.deleteMany({
        where: { section: { cotacao_id: params.id } },
      });
      await tx.quoteProductSection.deleteMany({
        where: { cotacao_id: params.id },
      });

      // Recriar seções com opções atualizadas
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        if (!sec.title || !sec.title.trim()) continue;

        await tx.quoteProductSection.create({
          data: {
            cotacao_id: params.id,
            product_type: sec.product_type || "CUSTOM_SERVICE",
            title: sec.title.trim(),
            description: sec.description?.trim() || null,
            sort_order: sIdx,
            options: {
              create: (sec.options || []).map((opt: any, oIdx: number) => ({
                title: opt.title?.trim() || `Opção ${oIdx + 1}`,
                description: opt.description?.trim() || null,
                photo_url: opt.photo_url?.trim() || null,
                external_link: opt.external_link?.trim() || null,
                price: Number(opt.price) || 0,
                currency: opt.currency || "BRL",
                selected: !!opt.selected,
                sort_order: oIdx,
                metadata: typeof opt.metadata === "string" ? opt.metadata : JSON.stringify(opt.metadata || {}),
              })),
            },
          },
        });
      }
    });

    const secoesAtualizadas = await prisma.quoteProductSection.findMany({
      where: { cotacao_id: params.id },
      orderBy: { sort_order: "asc" },
      include: { options: { orderBy: { sort_order: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      mensagem: "Seções de viagem atualizadas com sucesso!",
      sections: secoesAtualizadas,
    });
  } catch (err: any) {
    console.error("Erro ao atualizar seções multiproduto:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar seções." },
      { status: 500 }
    );
  }
}

// DELETE /api/cotacoes/[id]/sections -> Deletar uma seção multiproduto
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.quoteProductSection.deleteMany({
      where: { id: sectionId, cotacao_id: params.id },
    });

    return NextResponse.json({
      success: true,
      mensagem: "Seção removida com sucesso.",
    });
  } catch (err: any) {
    console.error("Erro ao deletar seção:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao excluir seção." },
      { status: 500 }
    );
  }
}
