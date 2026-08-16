import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calcularCanal, aplicarDestaquesNoGrupo, Moeda } from "@/lib/calculations";

export const dynamic = "force-dynamic";

// POST /api/cotacoes/[id]/hoteis -> Acrescentar novo hotel e seus canais a uma cotação existente
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
      include: { hoteis: true },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { hotel_nome, link_hotel, foto_url, descricao, canais } = body;

    if (!hotel_nome || !hotel_nome.trim()) {
      return NextResponse.json(
        { error: "Nome do hotel é obrigatório." },
        { status: 400 }
      );
    }

    if (!canais || !Array.isArray(canais) || canais.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um canal/tarifa para o hotel." },
        { status: 400 }
      );
    }

    const cambioRef = {
      cotacao_usd: cotacao.cotacao_usd,
      cotacao_eur: cotacao.cotacao_eur,
    };

    // Calcular valores dos canais com RN-01 a RN-10
    const canaisFormatados = canais.map((c: any) => ({
      canal_nome: c.canal_nome.trim(),
      valor_mostrado: Number(c.valor_mostrado),
      taxas: Number(c.taxas) || 0,
      moeda: c.moeda as Moeda,
      comissao_fornecedor_pct: Number(c.comissao_fornecedor_pct) || 0,
      comissao_venda_pct: Number(c.comissao_venda_pct) || 0,
      categoria_quarto: c.categoria_quarto?.trim() || "Quarto Standard",
      cafe_da_manha: !!c.cafe_da_manha,
      reembolsavel_ate: c.reembolsavel_ate ? new Date(c.reembolsavel_ate) : null,
      observacoes: c.observacoes?.trim() || "",
      escolhido_manual: !!c.escolhido_manual,
    }));

    const canaisCalculados = canaisFormatados.map((canal) =>
      calcularCanal(canal, cambioRef)
    );

    const canaisComDestaques = aplicarDestaquesNoGrupo(canaisCalculados, cambioRef);

    const novoHotel = await prisma.hotelCotado.create({
      data: {
        cotacao_id: cotacao.id,
        hotel_nome: hotel_nome.trim(),
        link_hotel: link_hotel?.trim() || null,
        foto_url: foto_url?.trim() || null,
        descricao: descricao?.trim() || null,
        ordem_exibicao: cotacao.hoteis.length,
        canais: {
          create: canaisComDestaques.map((c) => ({
            canal_nome: c.canal_nome,
            valor_mostrado: c.valor_mostrado,
            taxas: c.taxas,
            moeda: c.moeda,
            comissao_fornecedor_pct: c.comissao_fornecedor_pct,
            comissao_venda_pct: c.comissao_venda_pct,
            categoria_quarto: c.categoria_quarto,
            cafe_da_manha: c.cafe_da_manha,
            reembolsavel_ate: c.reembolsavel_ate ? new Date(c.reembolsavel_ate) : null,
            observacoes: c.observacoes,
            escolhido_manual: c.escolhido_manual || false,
            valor_comissao: c.valor_comissao,
            custo_liquido: c.custo_liquido,
            cotacao_utilizada: c.cotacao_utilizada,
            custo_em_brl: c.custo_em_brl,
            valor_final_venda: c.valor_final_venda,
            menor_custo_do_grupo: c.menor_custo_do_grupo,
            maior_venda_do_grupo: c.maior_venda_do_grupo,
          })),
        },
      },
      include: { canais: true },
    });

    return NextResponse.json(
      {
        success: true,
        mensagem: "Hotel adicionado com sucesso à cotação!",
        hotel: novoHotel,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao adicionar hotel na cotação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao adicionar hotel." },
      { status: 500 }
    );
  }
}
