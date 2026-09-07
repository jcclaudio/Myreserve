import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createSaleFromCotacao } from "@/lib/sales-service";

export const dynamic = "force-dynamic";

// POST /api/sales/from-cotacao/[id] -> Converte cotação em Venda Canônica (Sale) com recebíveis e comissão
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const cotacao = await prisma.cotacao.findUnique({
      where: { id: params.id },
      select: { id: true, criado_por_usuario_id: true },
    });

    if (!cotacao) {
      return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
    }

    if (user.role === "AGENTE" && cotacao.criado_por_usuario_id !== user.id) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode converter cotações de sua própria autoria em vendas." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Atribui a comissão ao consultor que gerou a cotação
    const consultorId = user.role === "AGENTE" ? user.id : (body.consultorId || cotacao.criado_por_usuario_id);

    const sale = await createSaleFromCotacao({
      cotacaoId: params.id,
      consultorId,
      clienteDocumento: body.clienteDocumento,
      clienteEmail: body.clienteEmail,
      clienteTelefone: body.clienteTelefone,
      totalParcelas: body.totalParcelas || 1,
      metodoPagamento: body.metodoPagamento || "PIX",
      observacoes: body.observacoes || "",
    });

    return NextResponse.json({
      success: true,
      mensagem: `Venda ${sale.sale_number} confirmada com sucesso! Recebíveis e comissões provisionados.`,
      sale,
    });
  } catch (err: any) {
    console.error("Erro ao converter cotação em venda:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao gerar venda confirmada." },
      { status: 500 }
    );
  }
}
