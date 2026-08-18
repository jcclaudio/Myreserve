import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CotacaoSchema } from "@/lib/validations";
import { aplicarDestaquesNoGrupo, Moeda } from "@/lib/calculations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cliente = searchParams.get("cliente");
    const destino = searchParams.get("destino");
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");

    const where: any = {};

    // Agentes visualizam apenas suas próprias cotações
    // Administradores e Financeiro/Gestor visualizam todas as cotações da agência
    if (user.role === "AGENTE") {
      where.criado_por_usuario_id = user.id;
    }

    if (cliente) {
      where.cliente_nome = { contains: cliente };
    }

    if (destino) {
      where.destino = { contains: destino };
    }

    if (dataInicio || dataFim) {
      where.criado_em = {};
      if (dataInicio) {
        where.criado_em.gte = new Date(dataInicio);
      }
      if (dataFim) {
        // Final do dia
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        where.criado_em.lte = end;
      }
    }

    const cotacoes = await prisma.cotacao.findMany({
      where,
      orderBy: { criado_em: "desc" },
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
      },
    });

    return NextResponse.json({ cotacoes });
  } catch (err: any) {
    console.error("Erro ao listar cotações:", err);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de cotações." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CotacaoSchema.safeParse(body);

    if (!parsed.success) {
      const primeiraMensagem = parsed.error.issues[0]?.message || "Dados de cotação inválidos";
      return NextResponse.json(
        {
          error: primeiraMensagem,
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Invariante: Pelo menos um hotel com pelo menos um canal
    if (!data.hoteis || data.hoteis.length === 0) {
      return NextResponse.json(
        { error: "A cotação deve conter pelo menos um hotel cotado." },
        { status: 400 }
      );
    }

    for (const hotel of data.hoteis) {
      if (!hotel.canais || hotel.canais.length === 0) {
        return NextResponse.json(
          { error: `O hotel "${hotel.hotel_nome}" deve ter pelo menos um canal cotado.` },
          { status: 400 }
        );
      }
    }

    const cambioRef = {
      cotacao_usd: data.cotacao_usd,
      cotacao_eur: data.cotacao_eur,
    };

    // Processar e calcular todos os hotéis e canais aplicando RN-01 a RN-10
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
        ordem_exibicao: index,
        canais: canaisCalculados,
      };
    });

    // Salvar cotação no banco de dados
    const novaCotacao = await prisma.cotacao.create({
      data: {
        criado_por_usuario_id: user.id,
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
        sections:
          data.sections && data.sections.length > 0
            ? {
                create: data.sections.map((s: any, sIdx: number) => ({
                  product_type: s.product_type,
                  title: s.title,
                  description: s.description || "",
                  sort_order: sIdx,
                  enabled: true,
                  options: {
                    create: (s.options || []).map((o: any, oIdx: number) => ({
                      title: o.title,
                      description: o.description || "",
                      photo_url: o.photo_url || null,
                      external_link: o.external_link || null,
                      price: Number(o.price) || 0,
                      currency: o.currency || "BRL",
                      selected: Boolean(o.selected),
                      sort_order: oIdx,
                      metadata:
                        typeof o.metadata === "string"
                          ? o.metadata
                          : JSON.stringify(o.metadata || {}),
                    })),
                  },
                })),
              }
            : undefined,
        hoteis: {
          create: hoteisProcessados.map((h) => ({
            hotel_nome: h.hotel_nome,
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
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        hoteis: {
          include: {
            canais: true,
          },
        },
        sections: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, cotacao: novaCotacao }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar cotação:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao salvar a cotação no servidor." },
      { status: 500 }
    );
  }
}
