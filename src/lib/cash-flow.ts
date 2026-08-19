export interface CashFlowPeriod {
  label: string;
  days: number;
  startDate: string;
  endDate: string;
  totalReceivables: number;
  totalPayables: number;
  netProjected: number;
  deficitRisk: boolean;
}

export interface CashFlowItem {
  id: string;
  type: "RECEIVABLE" | "PAYABLE";
  description: string;
  entityName: string; // Cliente ou Fornecedor
  dueDate: string;
  amount: number;
  currency: string;
  originalAmount?: number;
  exchangeRate?: number;
  status: string;
}

export interface CashFlowForecast {
  currentCashBalance: number;
  windows: {
    d7: CashFlowPeriod;
    d15: CashFlowPeriod;
    d30: CashFlowPeriod;
    d60: CashFlowPeriod;
  };
  dailyTimeline: Array<{
    date: string;
    inflow: number;
    outflow: number;
    net: number;
    cumulativeBalance: number;
  }>;
  upcomingItems: CashFlowItem[];
  exchangeFluctuation: {
    totalExposureUsd: number;
    totalExposureEur: number;
    realizedFxGainLossBrl: number;
    unrealizedFxGainLossBrl: number;
  };
}

export interface ConsultantTierProgress {
  currentTier: "BRONZE" | "PRATA" | "OURO" | "BLACK_VIP";
  tierName: string;
  currentSalesVolume: number;
  currentAgencyRevenue: number;
  commissionRatePct: number;
  totalEarnedCommission: number;
  nextTier: {
    tierName: string;
    targetRevenue: number;
    remainingToTarget: number;
    nextRatePct: number;
    progressPct: number;
  } | null;
  tierBenefits: string[];
}

export class CashFlowEngine {
  /**
   * Calcula as faixas e projeção de fluxo de caixa com base em contas a receber e contas a pagar.
   */
  static calculateForecast(
    receivables: Array<{
      id: string;
      valor_parcela: number;
      valor_pago: number;
      saldo: number;
      data_vencimento: Date | string;
      status: string;
      sale?: { cliente_nome: string } | null;
    }>,
    payables: Array<{
      id: string;
      descricao: string;
      fornecedor_nome: string;
      valor_brl: number;
      valor_pago: number;
      saldo: number;
      data_vencimento: Date | string;
      status: string;
      moeda_original?: string;
      valor_original?: number;
      cotacao_cambio?: number;
    }>,
    initialBalance: number = 0
  ): CashFlowForecast {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const parseDate = (d: Date | string) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    // Filtra apenas itens abertos/pendentes
    const openReceivables = receivables.filter(
      (r) => r.status === "OPEN" || r.status === "PENDENTE"
    );
    const openPayables = payables.filter(
      (p) => p.status === "OPEN" || p.status === "PENDENTE"
    );

    function calculateWindow(days: number, label: string): CashFlowPeriod {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      targetDate.setHours(23, 59, 59, 999);

      const inWindowReceivables = openReceivables.filter((r) => {
        const d = parseDate(r.data_vencimento);
        return d <= targetDate;
      });

      const inWindowPayables = openPayables.filter((p) => {
        const d = parseDate(p.data_vencimento);
        return d <= targetDate;
      });

      const totalIn = inWindowReceivables.reduce((acc, r) => acc + (r.saldo || r.valor_parcela), 0);
      const totalOut = inWindowPayables.reduce((acc, p) => acc + (p.saldo || p.valor_brl), 0);
      const net = totalIn - totalOut;

      return {
        label,
        days,
        startDate: now.toISOString().split("T")[0],
        endDate: targetDate.toISOString().split("T")[0],
        totalReceivables: Number(totalIn.toFixed(2)),
        totalPayables: Number(totalOut.toFixed(2)),
        netProjected: Number(net.toFixed(2)),
        deficitRisk: initialBalance + net < 0,
      };
    }

    // Timeline diária dos próximos 30 dias
    const dailyMap = new Map<string, { inflow: number; outflow: number }>();
    for (let i = 0; i <= 30; i++) {
      const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const key = day.toISOString().split("T")[0];
      dailyMap.set(key, { inflow: 0, outflow: 0 });
    }

    openReceivables.forEach((r) => {
      const key = parseDate(r.data_vencimento).toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        const cur = dailyMap.get(key)!;
        cur.inflow += r.saldo || r.valor_parcela;
      }
    });

    openPayables.forEach((p) => {
      const key = parseDate(p.data_vencimento).toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        const cur = dailyMap.get(key)!;
        cur.outflow += p.saldo || p.valor_brl;
      }
    });

    let runningBalance = initialBalance;
    const dailyTimeline: CashFlowForecast["dailyTimeline"] = [];

    Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, vals]) => {
        const net = vals.inflow - vals.outflow;
        runningBalance += net;
        dailyTimeline.push({
          date,
          inflow: Number(vals.inflow.toFixed(2)),
          outflow: Number(vals.outflow.toFixed(2)),
          net: Number(net.toFixed(2)),
          cumulativeBalance: Number(runningBalance.toFixed(2)),
        });
      });

    // Itens futuros unificados
    const upcomingItems: CashFlowItem[] = [
      ...openReceivables.map((r) => ({
        id: r.id,
        type: "RECEIVABLE" as const,
        description: `Recebível Parcela - ${r.sale?.cliente_nome || "Cliente"}`,
        entityName: r.sale?.cliente_nome || "Cliente",
        dueDate: parseDate(r.data_vencimento).toISOString().split("T")[0],
        amount: r.saldo || r.valor_parcela,
        currency: "BRL",
        status: r.status,
      })),
      ...openPayables.map((p) => ({
        id: p.id,
        type: "PAYABLE" as const,
        description: p.descricao,
        entityName: p.fornecedor_nome,
        dueDate: parseDate(p.data_vencimento).toISOString().split("T")[0],
        amount: p.saldo || p.valor_brl,
        currency: p.moeda_original || "BRL",
        originalAmount: p.valor_original,
        exchangeRate: p.cotacao_cambio,
        status: p.status,
      })),
    ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Exposição Cambial
    let exposureUsd = 0;
    let exposureEur = 0;
    openPayables.forEach((p) => {
      if (p.moeda_original === "USD") exposureUsd += p.valor_original || 0;
      if (p.moeda_original === "EUR") exposureEur += p.valor_original || 0;
    });

    return {
      currentCashBalance: initialBalance,
      windows: {
        d7: calculateWindow(7, "Próximos 7 dias"),
        d15: calculateWindow(15, "Próximos 15 dias"),
        d30: calculateWindow(30, "Próximos 30 dias"),
        d60: calculateWindow(60, "Próximos 60 dias"),
      },
      dailyTimeline,
      upcomingItems: upcomingItems.slice(0, 50),
      exchangeFluctuation: {
        totalExposureUsd: Number(exposureUsd.toFixed(2)),
        totalExposureEur: Number(exposureEur.toFixed(2)),
        realizedFxGainLossBrl: 0,
        unrealizedFxGainLossBrl: 0,
      },
    };
  }

  /**
   * Calcula o nível e a progressão de metas de um consultor de vendas.
   */
  static calculateConsultantTier(
    agencyRevenueAccumulatedMonth: number,
    salesVolumeAccumulatedMonth: number
  ): ConsultantTierProgress {
    // Tiers definidos por Receita da Agência (Lucro Bruto gerado) no mês corrente:
    // BRONZE: Até R$ 10.000 (Comissão base: 10%)
    // PRATA: R$ 10.001 a R$ 25.000 (Comissão: 12%)
    // OURO: R$ 25.001 a R$ 50.000 (Comissão: 14%)
    // BLACK_VIP: Acima de R$ 50.000 (Comissão: 16% + Bônus Especial)

    const rev = Math.max(0, agencyRevenueAccumulatedMonth);

    if (rev < 10000) {
      const target = 10000;
      const prog = Math.min(100, Math.round((rev / target) * 100));
      return {
        currentTier: "BRONZE",
        tierName: "Nível Bronze",
        currentSalesVolume: salesVolumeAccumulatedMonth,
        currentAgencyRevenue: rev,
        commissionRatePct: 10.0,
        totalEarnedCommission: Number((rev * 0.1).toFixed(2)),
        nextTier: {
          tierName: "Nível Prata (12%)",
          targetRevenue: target,
          remainingToTarget: Number((target - rev).toFixed(2)),
          nextRatePct: 12.0,
          progressPct: prog,
        },
        tierBenefits: ["Comissão padrão 10%", "Acesso ao suporte regular"],
      };
    } else if (rev < 25000) {
      const target = 25000;
      const prog = Math.min(100, Math.round(((rev - 10000) / (target - 10000)) * 100));
      return {
        currentTier: "PRATA",
        tierName: "Nível Prata",
        currentSalesVolume: salesVolumeAccumulatedMonth,
        currentAgencyRevenue: rev,
        commissionRatePct: 12.0,
        totalEarnedCommission: Number((rev * 0.12).toFixed(2)),
        nextTier: {
          tierName: "Nível Ouro (14%)",
          targetRevenue: target,
          remainingToTarget: Number((target - rev).toFixed(2)),
          nextRatePct: 14.0,
          progressPct: prog,
        },
        tierBenefits: [
          "Comissão acelerada 12%",
          "Prioridade na emissão de bilhetes",
          "Badge Prata no Perfil",
        ],
      };
    } else if (rev < 50000) {
      const target = 50000;
      const prog = Math.min(100, Math.round(((rev - 25000) / (target - 25000)) * 100));
      return {
        currentTier: "OURO",
        tierName: "Nível Ouro",
        currentSalesVolume: salesVolumeAccumulatedMonth,
        currentAgencyRevenue: rev,
        commissionRatePct: 14.0,
        totalEarnedCommission: Number((rev * 0.14).toFixed(2)),
        nextTier: {
          tierName: "Nível Black VIP (16%)",
          targetRevenue: target,
          remainingToTarget: Number((target - rev).toFixed(2)),
          nextRatePct: 16.0,
          progressPct: prog,
        },
        tierBenefits: [
          "Comissão premium 14%",
          "Canal direto de Concierge",
          "Badge Ouro FixTur",
        ],
      };
    } else {
      return {
        currentTier: "BLACK_VIP",
        tierName: "Black VIP",
        currentSalesVolume: salesVolumeAccumulatedMonth,
        currentAgencyRevenue: rev,
        commissionRatePct: 16.0,
        totalEarnedCommission: Number((rev * 0.16).toFixed(2)),
        nextTier: null,
        tierBenefits: [
          "Comissão máxima 16%",
          "Concierge VIP dedicado 24/7",
          "Bônus executivo de superação",
          "Selo Master Consultant",
        ],
      };
    }
  }
}
