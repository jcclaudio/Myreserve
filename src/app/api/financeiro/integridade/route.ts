import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/integridade -> Relatório de Integridade e Conciliação Financeira
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito à auditoria e administração." },
        { status: 403 }
      );
    }

    const [totalCotacoes, totalSales, totalReceivables, totalPayables, totalCommissions] =
      await Promise.all([
        prisma.cotacao.count(),
        prisma.sale.count(),
        prisma.receivable.count(),
        prisma.payable.count(),
        prisma.consultantCommission.count(),
      ]);

    // Verificar Vendas sem Recebíveis
    const salesSemRecebiveis = await prisma.sale.findMany({
      where: { receivables: { none: {} } },
      select: { id: true, sale_number: true, cliente_nome: true },
    });

    // Verificar Vendas sem Payables (se houver fornecedor)
    const salesSemPayables = await prisma.sale.findMany({
      where: { payables: { none: {} }, supplier_cost: { gt: 0 } },
      select: { id: true, sale_number: true, cliente_nome: true, supplier_cost: true },
    });

    // Verificar Vendas sem Comissão de Consultor
    const salesSemComissao = await prisma.sale.findMany({
      where: { comissoes: { none: {} } },
      select: { id: true, sale_number: true, cliente_nome: true },
    });

    const isHealthy =
      salesSemRecebiveis.length === 0 &&
      salesSemPayables.length === 0 &&
      salesSemComissao.length === 0;

    return NextResponse.json({
      success: true,
      integridade: {
        status: isHealthy ? "HEALTHY" : "ATTENTION_REQUIRED",
        contagens: {
          totalCotacoes,
          totalSales,
          totalReceivables,
          totalPayables,
          totalCommissions,
        },
        inconsistencias: {
          vendasSemRecebiveis: salesSemRecebiveis,
          vendasSemPayables: salesSemPayables,
          vendasSemComissao: salesSemComissao,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Erro ao gerar relatório de integridade:", err);
    return NextResponse.json(
      { error: "Erro interno ao auditar integridade financeira." },
      { status: 500 }
    );
  }
}
