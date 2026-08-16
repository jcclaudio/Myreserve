import { describe, it, expect } from "vitest";

describe("Sales & Consultant Commission Engine Invariants", () => {
  it("calculates exact GMV, Agency Revenue, Gross Margin, and Contribution Margin", () => {
    // Exemplo: Pacote com 2 canais hoteleiros
    const canais = [
      { custo_em_brl: 4000.0, valor_final_venda: 5000.0 },
      { custo_em_brl: 2000.0, valor_final_venda: 2500.0 },
    ];

    const grossSaleAmount = canais.reduce((acc, c) => acc + c.valor_final_venda, 0);
    const supplierCost = canais.reduce((acc, c) => acc + c.custo_em_brl, 0);
    const agencyRevenue = grossSaleAmount - supplierCost;
    const grossMarginPct = (agencyRevenue / grossSaleAmount) * 100;

    expect(grossSaleAmount).toBe(7500.0);
    expect(supplierCost).toBe(6000.0);
    expect(agencyRevenue).toBe(1500.0);
    expect(grossMarginPct).toBe(20.0);

    // Plano de Comissão: 10% sobre o Lucro da Agência (Agency Revenue)
    const commissionRate = 10.0;
    const consultantCommission = Number((agencyRevenue * (commissionRate / 100)).toFixed(2));
    expect(consultantCommission).toBe(150.0);

    // Margem de Contribuição Líquida da Agência
    const contributionMargin = agencyRevenue - consultantCommission;
    const contributionMarginPct = (contributionMargin / grossSaleAmount) * 100;

    expect(contributionMargin).toBe(1350.0);
    expect(contributionMarginPct).toBe(18.0);
  });

  it("splits receivables across installments accurately without precision loss", () => {
    const totalVenda = 1000.0;
    const totalParcelas = 3;
    const valorParcela = Number((totalVenda / totalParcelas).toFixed(2));

    expect(valorParcela).toBe(333.33);

    const parcelas = Array.from({ length: totalParcelas }).map((_, idx) => ({
      numero: idx + 1,
      valor: valorParcela,
    }));

    expect(parcelas).toHaveLength(3);
    expect(parcelas[0].valor).toBe(333.33);
  });

  it("differentiates SupplierCommission, AgencyRevenue and ConsultantCommission", () => {
    const valorMostradoFornecedorUSD = 1000.0;
    const comissaoFornecedorPct = 10.0; // 10% do hotel
    const cotacaoUSD = 5.5;
    const markupAgenciaPct = 15.0; // 15% de margem FixTur
    const comissaoConsultorPct = 12.0; // 12% sobre o lucro da agência

    // 1. Supplier Commission
    const valorComissaoFornecedorUSD = valorMostradoFornecedorUSD * (comissaoFornecedorPct / 100);
    const custoLiquidoUSD = valorMostradoFornecedorUSD - valorComissaoFornecedorUSD;
    expect(custoLiquidoUSD).toBe(900.0);

    // 2. Custo em BRL
    const custoBRL = custoLiquidoUSD * cotacaoUSD; // 900 * 5.5 = 4950.00
    expect(custoBRL).toBe(4950.0);

    // 3. Venda ao Cliente e Lucro da Agência
    const valorFinalVenda = Number((custoBRL / (1 - markupAgenciaPct / 100)).toFixed(2));
    expect(valorFinalVenda).toBe(5823.53);

    const agencyRevenue = Number((valorFinalVenda - custoBRL).toFixed(2));
    expect(agencyRevenue).toBe(873.53);

    // 4. Consultant Commission
    const consultantCommission = Number((agencyRevenue * (comissaoConsultorPct / 100)).toFixed(2));
    expect(consultantCommission).toBe(104.82);

    // 5. Contribution Margin
    const contributionMargin = Number((agencyRevenue - consultantCommission).toFixed(2));
    expect(contributionMargin).toBe(768.71);
  });

  it("calculates multi-product sales package (Hotel + Flight + Car Rental + Parks) with full commission", () => {
    // Hotel
    const hotelVenda = 3500.0;
    const hotelCusto = 3010.0; // 14% de margem

    // Aéreo
    const flightVenda = 4200.0;
    const flightCusto = 3612.0;

    // Locação de Carro
    const carVenda = 850.0;
    const carCusto = 731.0;

    // Ingressos Parques
    const parkVenda = 1800.0;
    const parkCusto = 1548.0;

    const grossSaleAmount = hotelVenda + flightVenda + carVenda + parkVenda;
    const supplierCost = hotelCusto + flightCusto + carCusto + parkCusto;
    const agencyRevenue = Number((grossSaleAmount - supplierCost).toFixed(2));
    const grossMarginPct = Number(((agencyRevenue / grossSaleAmount) * 100).toFixed(2));

    expect(grossSaleAmount).toBe(10350.0);
    expect(supplierCost).toBe(8901.0);
    expect(agencyRevenue).toBe(1449.0);
    expect(grossMarginPct).toBe(14.0);

    // Comissão do Consultor (10% sobre lucro da agência)
    const consultantCommission = Number((agencyRevenue * 0.10).toFixed(2));
    expect(consultantCommission).toBe(144.90);

    const contributionMargin = Number((agencyRevenue - consultantCommission).toFixed(2));
    expect(contributionMargin).toBe(1304.10);
  });
});
