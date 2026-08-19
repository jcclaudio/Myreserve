import { describe, it, expect } from "vitest";
import { CashFlowEngine } from "@/lib/cash-flow";

describe("Financial Evolution & Controladoria Engine 3.0", () => {
  describe("CashFlowEngine - Previsão de Fluxo de Caixa", () => {
    it("deve calcular corretamente as janelas temporais de 7, 15, 30 e 60 dias", () => {
      const now = new Date();

      const receivables = [
        {
          id: "rec-1",
          valor_parcela: 5000,
          valor_pago: 0,
          saldo: 5000,
          data_vencimento: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // D+3
          status: "OPEN",
          sale: { cliente_nome: "Ana Silva" },
        },
        {
          id: "rec-2",
          valor_parcela: 12000,
          valor_pago: 0,
          saldo: 12000,
          data_vencimento: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // D+10
          status: "OPEN",
          sale: { cliente_nome: "Carlos Mendes" },
        },
        {
          id: "rec-3",
          valor_parcela: 20000,
          valor_pago: 0,
          saldo: 20000,
          data_vencimento: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // D+25
          status: "OPEN",
          sale: { cliente_nome: "Juliana Costa" },
        },
      ];

      const payables = [
        {
          id: "pay-1",
          descricao: "Reserva Hotel Fasano",
          fornecedor_nome: "Operadora CVC",
          valor_brl: 4000,
          valor_pago: 0,
          saldo: 4000,
          data_vencimento: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // D+2
          status: "OPEN",
          moeda_original: "BRL",
        },
        {
          id: "pay-2",
          descricao: "Reserva Disney World",
          fornecedor_nome: "EZLink",
          valor_brl: 15000,
          valor_pago: 0,
          saldo: 15000,
          data_vencimento: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // D+12
          status: "OPEN",
          moeda_original: "USD",
          valor_original: 2800,
          cotacao_cambio: 5.35,
        },
      ];

      const forecast = CashFlowEngine.calculateForecast(receivables, payables, 1000);

      expect(forecast.windows.d7.totalReceivables).toBe(5000);
      expect(forecast.windows.d7.totalPayables).toBe(4000);
      expect(forecast.windows.d7.netProjected).toBe(1000);
      expect(forecast.windows.d7.deficitRisk).toBe(false);

      expect(forecast.windows.d15.totalReceivables).toBe(17000);
      expect(forecast.windows.d15.totalPayables).toBe(19000);
      expect(forecast.windows.d15.netProjected).toBe(-2000);

      expect(forecast.windows.d30.totalReceivables).toBe(37000);
      expect(forecast.windows.d30.totalPayables).toBe(19000);
      expect(forecast.windows.d30.netProjected).toBe(18000);

      // Exposição cambial
      expect(forecast.exchangeFluctuation.totalExposureUsd).toBe(2800);
    });

    it("deve sinalizar risco de déficit de liquidez quando saldo + projeção for negativo", () => {
      const now = new Date();
      const receivables: any[] = [];
      const payables = [
        {
          id: "pay-critico",
          descricao: "Fatura Aérea IATA",
          fornecedor_nome: "RexturAdvance",
          valor_brl: 50000,
          valor_pago: 0,
          saldo: 50000,
          data_vencimento: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
          status: "OPEN",
        },
      ];

      const forecast = CashFlowEngine.calculateForecast(receivables, payables, 10000);
      expect(forecast.windows.d7.deficitRisk).toBe(true);
      expect(forecast.windows.d7.netProjected).toBe(-50000);
    });
  });

  describe("CashFlowEngine - Tiers de Aceleração de Metas de Consultores", () => {
    it("deve classificar consultor no nível BRONZE (10%) para receita até R$ 10.000", () => {
      const tier = CashFlowEngine.calculateConsultantTier(6000, 40000);
      expect(tier.currentTier).toBe("BRONZE");
      expect(tier.commissionRatePct).toBe(10);
      expect(tier.totalEarnedCommission).toBe(600);
      expect(tier.nextTier?.tierName).toContain("Prata");
      expect(tier.nextTier?.remainingToTarget).toBe(4000);
      expect(tier.nextTier?.progressPct).toBe(60);
    });

    it("deve classificar consultor no nível PRATA (12%) entre R$ 10.001 e R$ 25.000", () => {
      const tier = CashFlowEngine.calculateConsultantTier(18000, 120000);
      expect(tier.currentTier).toBe("PRATA");
      expect(tier.commissionRatePct).toBe(12);
      expect(tier.totalEarnedCommission).toBe(2160);
      expect(tier.nextTier?.tierName).toContain("Ouro");
    });

    it("deve classificar consultor no nível OURO (14%) entre R$ 25.001 e R$ 50.000", () => {
      const tier = CashFlowEngine.calculateConsultantTier(35000, 230000);
      expect(tier.currentTier).toBe("OURO");
      expect(tier.commissionRatePct).toBe(14);
      expect(tier.totalEarnedCommission).toBe(4900);
      expect(tier.nextTier?.tierName).toContain("Black VIP");
    });

    it("deve classificar consultor no nível BLACK_VIP (16%) acima de R$ 50.000", () => {
      const tier = CashFlowEngine.calculateConsultantTier(75000, 500000);
      expect(tier.currentTier).toBe("BLACK_VIP");
      expect(tier.commissionRatePct).toBe(16);
      expect(tier.totalEarnedCommission).toBe(12000);
      expect(tier.nextTier).toBeNull();
      expect(tier.tierBenefits).toContain("Concierge VIP dedicado 24/7");
    });
  });
});
