import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseOfx } from "@/lib/ofx-parser";

export const dynamic = "force-dynamic";

// POST /api/financeiro/conciliacao/ofx -> Processar extrato bancário OFX e sugerir/executar conciliação
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "AGENTE") {
      return NextResponse.json(
        { error: "Acesso não autorizado à conciliação bancária." },
        { status: 403 }
      );
    }

    const { ofxText, autoLiquidar } = await request.json();
    if (!ofxText) {
      return NextResponse.json(
        { error: "Conteúdo do arquivo OFX é obrigatório." },
        { status: 400 }
      );
    }

    const resultadoOfx = parseOfx(ofxText);
    const sugestoes: any[] = [];
    let conciliadosCount = 0;

    for (const trn of resultadoOfx.transacoes) {
      if (trn.tipo === "CREDITO") {
        // Procurar recebível em aberto com valor correspondente (tolerância de R$ 0.05)
        const recebivel = await prisma.receivable.findFirst({
          where: {
            status: "OPEN",
            valor_parcela: {
              gte: trn.valor - 0.05,
              lte: trn.valor + 0.05,
            },
          },
          include: { sale: { select: { sale_number: true, cliente_nome: true } } },
        });

        if (recebivel) {
          if (autoLiquidar) {
            await prisma.receivable.update({
              where: { id: recebivel.id },
              data: {
                status: "PAID",
                valor_pago: trn.valor,
                saldo: 0,
                data_pagamento: trn.data,
                documento_ref: `OFX-${trn.idTransacao}`,
              },
            });
            conciliadosCount++;
          }

          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "RECEIVABLE",
            matchId: recebivel.id,
            matchDescricao: `Venda ${recebivel.sale.sale_number} (${recebivel.sale.cliente_nome})`,
            conciliado: !!autoLiquidar,
          });
        }
      } else if (trn.tipo === "DEBITO") {
        // Procurar payable em aberto com valor correspondente
        const pagavel = await prisma.payable.findFirst({
          where: {
            status: "OPEN",
            valor_brl: {
              gte: trn.valor - 0.05,
              lte: trn.valor + 0.05,
            },
          },
        });

        if (pagavel) {
          if (autoLiquidar) {
            await prisma.payable.update({
              where: { id: pagavel.id },
              data: {
                status: "PAID",
                valor_pago: trn.valor,
                saldo: 0,
                data_pagamento: trn.data,
                comprovante_ref: `OFX-${trn.idTransacao}`,
              },
            });
            conciliadosCount++;
          }

          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "PAYABLE",
            matchId: pagavel.id,
            matchDescricao: `${pagavel.fornecedor_nome} - ${pagavel.descricao}`,
            conciliado: !!autoLiquidar,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalTransacoesExtrato: resultadoOfx.transacoes.length,
      totalCreditos: resultadoOfx.totalCreditos,
      totalDebitos: resultadoOfx.totalDebitos,
      matchesEncontrados: sugestoes.length,
      conciliadosCount,
      sugestoes,
    });
  } catch (err: any) {
    console.error("Erro na conciliação OFX:", err);
    return NextResponse.json(
      { error: "Erro ao processar extrato bancário OFX." },
      { status: 500 }
    );
  }
}
