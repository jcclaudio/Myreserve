import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/comissoes/planos -> Lista planos de comissão
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    let planos = await prisma.commissionPlan.findMany({
      orderBy: { criado_em: "desc" },
    });

    // Se nenhum plano existir, inicializa com o plano padrão da FIX Turismo (10% sobre o Lucro da Agência)
    if (planos.length === 0) {
      const planoPadrao = await prisma.commissionPlan.create({
        data: {
          nome: "Plano Padrão FixTur (10% Lucro)",
          descricao: "Comissão de 10% calculada sobre o resultado líquido/receita da agência.",
          base_calculo: "AGENCY_REVENUE",
          percentual_padrao: 10.0,
          ativo: true,
        },
      });
      planos = [planoPadrao];
    }

    return NextResponse.json({ success: true, planos });
  } catch (err: any) {
    console.error("Erro ao listar planos de comissão:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar planos de comissão." },
      { status: 500 }
    );
  }
}

// POST /api/comissoes/planos -> Criar novo plano (Requer ADMIN)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, descricao, base_calculo, percentual_padrao } = body;

    if (!nome || !percentual_padrao || percentual_padrao <= 0) {
      return NextResponse.json(
        { error: "Nome e percentual válido são obrigatórios." },
        { status: 400 }
      );
    }

    const novoPlano = await prisma.commissionPlan.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || "",
        base_calculo: base_calculo || "AGENCY_REVENUE",
        percentual_padrao: Number(percentual_padrao),
        ativo: true,
      },
    });

    return NextResponse.json({ success: true, plano: novoPlano }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar plano de comissão:", err);
    return NextResponse.json(
      { error: "Erro interno ao salvar plano de comissão." },
      { status: 500 }
    );
  }
}
