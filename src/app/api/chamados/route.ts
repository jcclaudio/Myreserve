import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/chamados -> Listar chamados de suporte/operações com status de SLA
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const prioridade = searchParams.get("prioridade");
    const categoria = searchParams.get("categoria");

    const where: any = {};

    if (user.role === "AGENTE") {
      where.criado_por_id = user.id;
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (prioridade && prioridade !== "TODOS") {
      where.prioridade = prioridade;
    }

    if (categoria && categoria !== "TODOS") {
      where.categoria = categoria;
    }

    const chamados = await prisma.chamadoSuporte.findMany({
      where,
      orderBy: [{ prioridade: "desc" }, { sla_limite: "asc" }],
      include: {
        criado_por: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        sale: { select: { id: true, sale_number: true, cliente_nome: true, destino: true } },
        cotacao: { select: { id: true, cliente_nome: true, destino: true } },
      },
    });

    const agora = new Date();
    let totalAbertos = 0;
    let totalEmAtendimento = 0;
    let totalResolvidos = 0;
    let totalSlaViolado = 0;
    let totalSlaEmRisco = 0; // Menos de 60 minutos restantes

    for (const c of chamados) {
      if (c.status === "RESOLVIDO") {
        totalResolvidos++;
      } else if (c.status === "EM_ATENDIMENTO" || c.status === "AGUARDANDO_FORNECEDOR") {
        totalEmAtendimento++;
      } else if (c.status === "ABERTO") {
        totalAbertos++;
      }

      if (c.status !== "RESOLVIDO" && c.status !== "CANCELADO") {
        const slaLimite = new Date(c.sla_limite);
        if (slaLimite < agora) {
          totalSlaViolado++;
        } else {
          const diffMinutos = Math.floor(
            (slaLimite.getTime() - agora.getTime()) / (1000 * 60)
          );
          if (diffMinutos <= 60) {
            totalSlaEmRisco++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      chamados,
      metricas: {
        total: chamados.length,
        totalAbertos,
        totalEmAtendimento,
        totalResolvidos,
        totalSlaViolado,
        totalSlaEmRisco,
      },
    });
  } catch (err: any) {
    console.error("Erro ao listar chamados de suporte:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar chamados de suporte." },
      { status: 500 }
    );
  }
}

// POST /api/chamados -> Criar chamado com cálculo determinístico de SLA
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descricao,
      categoria,
      prioridade,
      cliente_nome,
      cliente_contato,
      sale_id,
      cotacao_id,
    } = body;

    if (!titulo || !descricao || !cliente_nome) {
      return NextResponse.json(
        { error: "Título, descrição e nome do cliente são obrigatórios." },
        { status: 400 }
      );
    }

    // Determinar SLA em minutos conforme criticidade
    let slaMinutos = 240; // Default 4h
    if (prioridade === "CRITICA_EMERGENCIA") slaMinutos = 30;
    else if (prioridade === "ALTA") slaMinutos = 120;
    else if (prioridade === "BAIXA") slaMinutos = 1440;

    const slaLimite = new Date();
    slaLimite.setMinutes(slaLimite.getMinutes() + slaMinutos);

    const countTickets = await prisma.chamadoSuporte.count();
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(
      countTickets + 1
    ).padStart(4, "0")}`;

    const novoChamado = await prisma.chamadoSuporte.create({
      data: {
        ticket_number: ticketNumber,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria: categoria || "SUPORTE_GERAL",
        prioridade: prioridade || "MEDIA",
        sla_minutos: slaMinutos,
        sla_limite: slaLimite,
        status: "ABERTO",
        cliente_nome: cliente_nome.trim(),
        cliente_contato: cliente_contato?.trim() || "",
        sale_id: sale_id || null,
        cotacao_id: cotacao_id || null,
        criado_por_id: user.id,
      },
      include: {
        criado_por: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        mensagem: `Chamado ${ticketNumber} aberto com sucesso! SLA: ${slaMinutos} minutos.`,
        chamado: novoChamado,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro ao criar chamado de suporte:", err);
    return NextResponse.json(
      { error: "Erro interno ao registrar chamado." },
      { status: 500 }
    );
  }
}
