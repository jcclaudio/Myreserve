import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CotacaoSchema } from "@/lib/validations";
import { aplicarDestaquesNoGrupo, Moeda } from "@/lib/calculations";

export const dynamic = "force-dynamic";

export async function GET(
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
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        hoteis: {
          orderBy: { ordem_exibicao: "asc" },
          include: {
            canais: {
              orderBy: { criado_em: "asc" },
            },
          },
        },
        sections: {
          orderBy: { sort_order: "asc" },
          include: {
            options: {
              orderBy: { sort_order: "asc" },
            },
          },
        },
        versoes: {
          orderBy: { criado_em: "desc" },
        },
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ cotacao });
  } catch (err: any) {
    console.error("Erro ao obter cotação:", err);
    return NextResponse.json(
      { error: "Erro ao buscar cotação." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cotacaoExistente = await prisma.cotacao.findUnique({
      where: { id: params.id },
    });

    if (!cotacaoExistente) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = CotacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!data.hoteis || data.hoteis.length === 0) {
      return NextResponse.json(
        { error: "A cotação deve conter pelo menos um hotel cotado." },
        { status: 400 }
      );
    }

    const cambioRef = {
      cotacao_usd: data.cotacao_usd,
      cotacao_eur: data.cotacao_eur,
    };

    // Recalcular canais com RN-01 a RN-10
    const hoteisProcessados = data.hoteis.map((hotel, index) => {
      const canaisFormatados = hotel.canais.map((c) => ({
        ...c,
        moeda: c.moeda as Moeda,
      }));

      const canaisCalculados = aplicarDestaquesNoGrupo(
        canaisFormatados,
        cambioRef
      );

      return {
        hotel_nome: hotel.hotel_nome.trim(),
        link_hotel: hotel.link_hotel?.trim() || null,
        foto_url: hotel.foto_url?.trim() || null,
        descricao: hotel.descricao?.trim() || null,
        ordem_exibicao: index,
        canais: canaisCalculados,
      };
    });

    // Atualizar usando transação
    await prisma.$transaction(async (tx) => {
      // Deletar hotéis antigos (canais deletam em cascata)
      await tx.hotelCotado.deleteMany({
        where: { cotacao_id: params.id },
      });

      // Atualizar cotação principal e recriar hotéis com canais calculados
      await tx.cotacao.update({
        where: { id: params.id },
        data: {
          cliente_nome: data.cliente_nome.trim(),
          destino: data.destino.trim(),
          data_ida: new Date(data.data_ida),
          data_volta: new Date(data.data_volta),
          adultos: data.adultos,
          criancas: data.criancas,
          idades_criancas: JSON.stringify(data.idades_criancas || []),
          quartos: data.quartos,
          cotacao_usd: data.cotacao_usd,
          cotacao_eur: data.cotacao_eur,
          comissao_padrao_agencia_pct: data.comissao_padrao_agencia_pct,
          hoteis: {
            create: hoteisProcessados.map((h) => ({
              hotel_nome: h.hotel_nome,
              link_hotel: h.link_hotel,
              foto_url: h.foto_url,
              descricao: h.descricao,
              ordem_exibicao: h.ordem_exibicao,
              canais: {
                create: h.canais.map((c) => ({
                  canal_nome: c.canal_nome.trim(),
                  valor_mostrado: c.valor_mostrado,
                  taxas: c.taxas ?? 0,
                  moeda: c.moeda,
                  comissao_fornecedor_pct: c.comissao_fornecedor_pct,
                  comissao_venda_pct: c.comissao_venda_pct,
                  categoria_quarto: c.categoria_quarto.trim(),
                  cafe_da_manha: c.cafe_da_manha,
                  reembolsavel_ate: c.reembolsavel_ate
                    ? new Date(c.reembolsavel_ate)
                    : null,
                  observacoes: c.observacoes || "",
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
            })),
          },
        },
      });
    });

    const cotacaoAtualizada = await prisma.cotacao.findUnique({
      where: { id: params.id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        hoteis: {
          orderBy: { ordem_exibicao: "asc" },
          include: { canais: true },
        },
      },
    });

    return NextResponse.json({ success: true, cotacao: cotacaoAtualizada });
  } catch (err: any) {
    console.error("Erro ao atualizar cotação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar cotação." },
      { status: 500 }
    );
  }
}

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
    const {
      cliente_nome,
      destino,
      data_ida,
      data_volta,
      adultos,
      criancas,
      idades_criancas,
      quartos,
      cotacao_usd,
      cotacao_eur,
      comissao_padrao_agencia_pct,
    } = body;

    const data: any = {};
    if (cliente_nome !== undefined) data.cliente_nome = cliente_nome.trim();
    if (destino !== undefined) data.destino = destino.trim();
    if (data_ida !== undefined) data.data_ida = new Date(data_ida);
    if (data_volta !== undefined) data.data_volta = new Date(data_volta);
    if (adultos !== undefined) data.adultos = Number(adultos);
    if (criancas !== undefined) data.criancas = Number(criancas);
    if (idades_criancas !== undefined) {
      data.idades_criancas = typeof idades_criancas === "string" ? idades_criancas : JSON.stringify(idades_criancas);
    }
    if (quartos !== undefined) data.quartos = Number(quartos);
    if (cotacao_usd !== undefined) data.cotacao_usd = Number(cotacao_usd);
    if (cotacao_eur !== undefined) data.cotacao_eur = Number(cotacao_eur);
    if (comissao_padrao_agencia_pct !== undefined) data.comissao_padrao_agencia_pct = Number(comissao_padrao_agencia_pct);

    const cotacaoAtualizada = await prisma.cotacao.update({
      where: { id: params.id },
      data,
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        hoteis: {
          orderBy: { ordem_exibicao: "asc" },
          include: { canais: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: "Cotação atualizada com sucesso!",
      cotacao: cotacaoAtualizada,
    });
  } catch (err: any) {
    console.error("Erro no PATCH de cotação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar dados da cotação." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.cotacao.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao deletar cotação:", err);
    return NextResponse.json(
      { error: "Erro ao excluir cotação." },
      { status: 500 }
    );
  }
}
