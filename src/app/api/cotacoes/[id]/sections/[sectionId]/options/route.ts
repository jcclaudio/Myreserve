import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/cotacoes/[id]/sections/[sectionId]/options -> Adicionar nova opção na seção
export async function POST(
  request: Request,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const section = await prisma.quoteProductSection.findFirst({
      where: { id: params.sectionId, cotacao_id: params.id },
      include: { options: true },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Seção não encontrada nesta cotação." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      photo_url,
      external_link,
      price,
      currency,
      selected,
      metadata,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Título da opção é obrigatório." },
        { status: 400 }
      );
    }

    const novaOpcao = await prisma.quoteProductOption.create({
      data: {
        section_id: section.id,
        title: title.trim(),
        description: description?.trim() || null,
        photo_url: photo_url?.trim() || null,
        external_link: external_link?.trim() || null,
        price: Number(price) || 0,
        currency: currency || "BRL",
        selected: !!selected,
        sort_order: section.options.length,
        metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata || {}),
      },
    });

    return NextResponse.json(
      {
        success: true,
        mensagem: "Opção adicionada com sucesso!",
        option: novaOpcao,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao adicionar opção na seção:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao criar opção de produto." },
      { status: 500 }
    );
  }
}

// PATCH /api/cotacoes/[id]/sections/[sectionId]/options -> Alternar seleção de opção
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { optionId, selected } = body;

    if (!optionId || typeof selected !== "boolean") {
      return NextResponse.json(
        { error: "optionId e selected são obrigatórios." },
        { status: 400 }
      );
    }

    const opcaoAtualizada = await prisma.quoteProductOption.update({
      where: { id: optionId },
      data: { selected },
    });

    return NextResponse.json({
      success: true,
      option: opcaoAtualizada,
    });
  } catch (err: any) {
    console.error("Erro ao atualizar seleção de opção:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar seleção." },
      { status: 500 }
    );
  }
}
