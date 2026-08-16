import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/financeiro/performance-consultores -> Ranking multidimensional de performance dos consultores
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "FINANCEIRO")) {
      return NextResponse.json(
        { error: "Acesso restrito a administradores e gestores." },
        { status: 403 }
      );
    }

    const consultores = await prisma.usuario.findMany({
      where: { ativo: true },
      include: {
        sales: {
          include: { comissoes: true },
        },
        comissoes: true,
      },
    });

    const performance = consultores.map((u) => {
      const totalVendasCount = u.sales.length;
      const gmvTotal = u.sales.reduce((acc, s) => acc + s.gross_sale_amount, 0);
      const supplierCostTotal = u.sales.reduce((acc, s) => acc + s.supplier_cost, 0);
      const agencyRevenueTotal = u.sales.reduce((acc, s) => acc + s.agency_revenue, 0);
      const contributionMarginTotal = u.sales.reduce((acc, s) => acc + s.contribution_margin, 0);
      const comissaoTotal = u.comissoes.reduce((acc, c) => acc + c.valor_comissao, 0);
      const comissaoPaga = u.comissoes
        .filter((c) => c.status === "PAID")
        .reduce((acc, c) => acc + c.valor_comissao, 0);
      const comissaoPendente = comissaoTotal - comissaoPaga;

      const ticketMedio = totalVendasCount > 0 ? gmvTotal / totalVendasCount : 0;
      const margemMediaPct = gmvTotal > 0 ? (agencyRevenueTotal / gmvTotal) * 100 : 0;

      return {
        consultorId: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        totalVendasCount,
        gmvTotal: Number(gmvTotal.toFixed(2)),
        supplierCostTotal: Number(supplierCostTotal.toFixed(2)),
        agencyRevenueTotal: Number(agencyRevenueTotal.toFixed(2)),
        contributionMarginTotal: Number(contributionMarginTotal.toFixed(2)),
        margemMediaPct: Number(margemMediaPct.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
        comissaoTotal: Number(comissaoTotal.toFixed(2)),
        comissaoPaga: Number(comissaoPaga.toFixed(2)),
        comissaoPendente: Number(comissaoPendente.toFixed(2)),
      };
    });

    // Ordenar por maior Lucro Gerado para a Agência (Agency Revenue)
    performance.sort((a, b) => b.agencyRevenueTotal - a.agencyRevenueTotal);

    return NextResponse.json({ success: true, performance });
  } catch (err: any) {
    console.error("Erro ao gerar ranking de performance de consultores:", err);
    return NextResponse.json(
      { error: "Erro interno ao calcular performance dos consultores." },
      { status: 500 }
    );
  }
}
