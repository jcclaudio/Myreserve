import { NextResponse } from "next/server";
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

    const body = await request.json().catch(() => ({}));

    const sale = await createSaleFromCotacao({
      cotacaoId: params.id,
      consultorId: user.id,
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
