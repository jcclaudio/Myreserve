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
        // Procurar recebíveis em aberto com valor correspondente (tolerância de R$ 0.05)
        const candidatos = await prisma.receivable.findMany({
          where: {
            status: "OPEN",
            valor_parcela: {
              gte: trn.valor - 0.05,
              lte: trn.valor + 0.05,
            },
          },
          include: { sale: { select: { id: true, sale_number: true, cliente_nome: true } } },
        });

        if (candidatos.length === 1) {
          const recebivel = candidatos[0];
          let conciliado = false;

          if (autoLiquidar) {
            await prisma.$transaction(async (tx) => {
              await tx.receivable.update({
                where: { id: recebivel.id },
                data: {
                  status: "PAID",
                  valor_pago: trn.valor,
                  saldo: 0,
                  data_pagamento: trn.data,
                  documento_ref: `OFX-${trn.idTransacao}`,
                },
              });

              // Se todas as parcelas foram pagas, liberar venda e comissões
              const todasParcelas = await tx.receivable.findMany({
                where: { sale_id: recebivel.sale_id },
              });
              const todasPagas = todasParcelas.every((p) => p.id === recebivel.id || p.status === "PAID");
              if (todasPagas) {
                await tx.sale.update({
                  where: { id: recebivel.sale_id },
                  data: { status: "PAID" },
                });
                await tx.consultantCommission.updateMany({
                  where: { sale_id: recebivel.sale_id, status: "ACCRUED" },
                  data: { status: "APPROVED", data_elegibilidade: new Date() },
                });
              }

              await tx.financialAuditLog.create({
                data: {
                  usuario_id: user.id,
                  entidade: "Receivable",
                  entidade_id: recebivel.id,
                  acao: "OFX_AUTO_LIQUIDATE",
                  detalhes_json: JSON.stringify({
                    trnId: trn.idTransacao,
                    valor: trn.valor,
                    sale_number: recebivel.sale.sale_number,
                  }),
                },
              });
            });
            conciliadosCount++;
            conciliado = true;
          }

          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "RECEIVABLE",
            matchId: recebivel.id,
            matchDescricao: `Venda ${recebivel.sale.sale_number} (${recebivel.sale.cliente_nome})`,
            ambiguo: false,
            conciliado,
          });
        } else if (candidatos.length > 1) {
          // Ambiguidade detectada: não auto-liquidar para evitar baixa indevida
          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "RECEIVABLE",
            candidatosIds: candidatos.map((c) => c.id),
            matchDescricao: `Ambiguidade detectada: ${candidatos.length} recebíveis em aberto com valor similar de R$ ${trn.valor.toFixed(2)}. Requer conferência manual.`,
            ambiguo: true,
            conciliado: false,
          });
        }
      } else if (trn.tipo === "DEBITO") {
        // Procurar contas a pagar em aberto com valor correspondente
        const candidatosPayables = await prisma.payable.findMany({
          where: {
            status: "OPEN",
            valor_brl: {
              gte: trn.valor - 0.05,
              lte: trn.valor + 0.05,
            },
          },
        });

        if (candidatosPayables.length === 1) {
          const pagavel = candidatosPayables[0];
          let conciliado = false;

          if (autoLiquidar) {
            await prisma.$transaction(async (tx) => {
              await tx.payable.update({
                where: { id: pagavel.id },
                data: {
                  status: "PAID",
                  valor_pago: trn.valor,
                  saldo: 0,
                  data_pagamento: trn.data,
                  comprovante_ref: `OFX-${trn.idTransacao}`,
                },
              });

              await tx.financialAuditLog.create({
                data: {
                  usuario_id: user.id,
                  entidade: "Payable",
                  entidade_id: pagavel.id,
                  acao: "OFX_AUTO_LIQUIDATE",
                  detalhes_json: JSON.stringify({
                    trnId: trn.idTransacao,
                    valor: trn.valor,
                    fornecedor: pagavel.fornecedor_nome,
                  }),
                },
              });
            });
            conciliadosCount++;
            conciliado = true;
          }

          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "PAYABLE",
            matchId: pagavel.id,
            matchDescricao: `${pagavel.fornecedor_nome} - ${pagavel.descricao}`,
            ambiguo: false,
            conciliado,
          });
        } else if (candidatosPayables.length > 1) {
          // Ambiguidade detectada: não auto-liquidar para evitar pagamento indevido
          sugestoes.push({
            transacaoExtrato: trn,
            tipoMatch: "PAYABLE",
            candidatosIds: candidatosPayables.map((c) => c.id),
            matchDescricao: `Ambiguidade detectada: ${candidatosPayables.length} contas a pagar com valor similar de R$ ${trn.valor.toFixed(2)}. Requer conferência manual.`,
            ambiguo: true,
            conciliado: false,
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
