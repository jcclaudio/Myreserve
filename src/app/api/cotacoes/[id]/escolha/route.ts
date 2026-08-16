import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { canalId, escolhido } = body;

    if (!canalId || typeof escolhido !== "boolean") {
      return NextResponse.json(
        { error: "canalId e status escolhido são obrigatórios." },
        { status: 400 }
      );
    }

    // Verificar se o canal pertence a esta cotação
    const canal = await prisma.canalCotado.findFirst({
      where: {
        id: canalId,
        hotel_cotado: {
          cotacao_id: params.id,
        },
      },
    });

    if (!canal) {
      return NextResponse.json(
        { error: "Canal cotado não encontrado para esta cotação." },
        { status: 404 }
      );
    }

    const canalAtualizado = await prisma.canalCotado.update({
      where: { id: canalId },
      data: { escolhido_manual: escolhido },
    });

    return NextResponse.json({ success: true, canal: canalAtualizado });
  } catch (err: any) {
    console.error("Erro ao atualizar escolha manual:", err);
    return NextResponse.json(
      { error: "Erro ao salvar escolha manual." },
      { status: 500 }
    );
  }
}
