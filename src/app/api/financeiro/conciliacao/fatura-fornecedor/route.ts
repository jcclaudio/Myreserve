import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceReconciler } from "@/lib/invoice-reconciler";

export const dynamic = "force-dynamic";

// POST /api/financeiro/conciliacao/fatura-fornecedor -> Conciliação inteligente de faturas de operadoras
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à gestão financeira." },
        { status: 403 }
      );
    }

    const { csvText, autoLiquidarMatches } = await request.json();
    if (!csvText || typeof csvText !== "string" || !csvText.trim()) {
      return NextResponse.json(
        { error: "Conteúdo CSV da fatura do fornecedor é obrigatório." },
        { status: 400 }
      );
    }

    const invoiceRows = InvoiceReconciler.parseCSV(csvText);
    if (invoiceRows.length === 0) {
      return NextResponse.json(
        { error: "Nenhum lançamento válido identificado no CSV informado." },
        { status: 400 }
      );
    }

    const payables = await prisma.payable.findMany({
      include: {
        sale: {
          select: { sale_number: true, cliente_nome: true },
        },
      },
    });

    const resultado = InvoiceReconciler.reconcile(invoiceRows, payables);

    let liquidadosEmLote = 0;

    // Se o usuário solicitou auto-liquidar os matches perfeitos
    if (autoLiquidarMatches) {
      const perfectMatchPayableIds = resultado.itens
        .filter((item) => item.status === "MATCH_PERFEITO" && item.pagavelId)
        .map((item) => item.pagavelId as string);

      if (perfectMatchPayableIds.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const pid of perfectMatchPayableIds) {
            const p = payables.find((item) => item.id === pid);
            if (p) {
              await tx.payable.update({
                where: { id: pid },
                data: {
                  status: "PAID",
                  valor_pago: p.valor_brl,
                  saldo: 0,
                  data_pagamento: new Date(),
                  comprovante_ref: `CONCIL-FATURA-${Date.now()}`,
                },
              });
              liquidadosEmLote++;
            }
          }

          await tx.financialAuditLog.create({
            data: {
              usuario_id: user.id,
              entidade: "SUPPLIER_INVOICE_RECONCILIATION",
              entidade_id: `RECONCIL-${Date.now()}`,
              acao: "AUTO_MATCH_SETTLEMENT",
              detalhes_json: JSON.stringify({
                total_conciliados: liquidadosEmLote,
                ids: perfectMatchPayableIds,
              }),
            },
          });
        });

        // Marca como conciliado no resultado retornado
        resultado.itens.forEach((item) => {
          if (item.status === "MATCH_PERFEITO") item.conciliado = true;
        });
      }
    }

    return NextResponse.json({
      success: true,
      liquidadosEmLote,
      ...resultado,
    });
  } catch (err: any) {
    console.error("Erro ao conciliar fatura de fornecedor:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar conciliação de fatura." },
      { status: 500 }
    );
  }
}
