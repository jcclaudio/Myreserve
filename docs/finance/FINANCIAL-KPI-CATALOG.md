# 📊 CATÁLOGO DE KPIS FINANCEIROS CANÔNICOS (FIXTUR)
> **Documento:** `docs/finance/FINANCIAL-KPI-CATALOG.md`  
> **Versão:** 1.0.0  

---

## Catálogo de Métricas

### 1. GMV (Gross Merchandise Value)
- **ID:** `FIN-KPI-01`
- **Nome:** Volume Bruto Movimentado
- **Fórmula:** $\sum \text{Sale.gross\_sale\_amount}$
- **Entidades:** `Sale`
- **Status Considerados:** `CONFIRMED`, `PARTIALLY_PAID`, `PAID`, `COMPLETED`
- **Excluídos:** `CANCELLED`

### 2. Agency Revenue (Receita da Agência / Lucro Bruto)
- **ID:** `FIN-KPI-02`
- **Nome:** Receita Bruta da Agência
- **Fórmula:** $\sum (\text{Sale.gross\_sale\_amount} - \text{Sale.supplier\_cost})$
- **Entidades:** `Sale`, `SaleItem`

### 3. Contribution Margin (Margem de Contribuição)
- **ID:** `FIN-KPI-03`
- **Nome:** Margem de Contribuição Líquida
- **Fórmula:** $\text{AgencyRevenue} - \text{ConsultantCommission} - \text{PaymentFees}$

### 4. Receivables Aging (Aging de Contas a Receber)
- **ID:** `FIN-KPI-04`
- **Nome:** Envelhecimento de Saldos a Receber
- **Faixas:** A Vencer, 1–7 dias, 8–15 dias, 16–30 dias, >30 dias de atraso.
- **Entidades:** `Receivable`
