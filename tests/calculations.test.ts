import { describe, it, expect } from "vitest";
import {
  calcularCanal,
  aplicarDestaquesNoGrupo,
  round2,
  CanalInput,
  CotacaoCambioRef,
  DEFAULT_AGENCY_COMMISSION_PCT,
} from "../src/lib/calculations";

describe("Motor de Cálculo Financeiro — Regras de Negócio RN-01 a RN-10", () => {
  const cambioPadrao: CotacaoCambioRef = {
    cotacao_usd: 5.45,
    cotacao_eur: 5.91,
  };

  it("Caso de Teste 1 — Caminho feliz (números reais confirmados da cotação modelo)", () => {
    const canal: CanalInput = {
      canal_nome: "Booking",
      valor_mostrado: 10294.19,
      moeda: "EUR",
      comissao_fornecedor_pct: 14,
      comissao_venda_pct: 6,
      categoria_quarto: "Standard Double",
      cafe_da_manha: true,
    };

    const resultado = calcularCanal(canal, cambioPadrao);

    // Validação exata dos 5 campos monetários
    expect(resultado.valor_comissao).toBe(1441.19);
    expect(resultado.custo_liquido).toBe(8853.0);
    expect(resultado.cotacao_utilizada).toBe(5.91);
    expect(resultado.custo_em_brl).toBe(52321.25);
    expect(resultado.valor_final_venda).toBe(55660.9);

    // Teste de regressão específico: garantir que o cálculo intermediário NÃO foi truncado antes do tempo
    // Se usasse 8853.00 * 5.91 = 52321.23 (errado). O correto é 8853.0034 * 5.91 = 52321.250094 -> 52321.25.
    expect(resultado.custo_em_brl).not.toBe(52321.23);
    expect(resultado.custo_em_brl).toBe(52321.25);
  });

  it("Caso de Teste 2 — Moeda em BRL (sem conversão, cotacao_utilizada = 1)", () => {
    const canal: CanalInput = {
      canal_nome: "Interep",
      valor_mostrado: 5000.0,
      moeda: "BRL",
      comissao_fornecedor_pct: 10,
      comissao_venda_pct: 15,
      categoria_quarto: "Deluxe Suite",
      cafe_da_manha: false,
    };

    const resultado = calcularCanal(canal, cambioPadrao);

    expect(resultado.valor_comissao).toBe(500.0);
    expect(resultado.custo_liquido).toBe(4500.0);
    expect(resultado.cotacao_utilizada).toBe(1);
    expect(resultado.custo_em_brl).toBe(4500.0);
    expect(resultado.valor_final_venda).toBe(5294.12);
  });

  it("Caso de Teste 3 — Erros de entrada barram antes de calcular", () => {
    // 1. Comissão de venda = 100% (evita divisão por zero)
    expect(() =>
      calcularCanal(
        {
          canal_nome: "Teste",
          valor_mostrado: 1000,
          moeda: "BRL",
          comissao_fornecedor_pct: 10,
          comissao_venda_pct: 100,
          categoria_quarto: "Standard",
          cafe_da_manha: true,
        },
        cambioPadrao
      )
    ).toThrow("Comissão de venda deve ser menor que 100%");

    // 2. Valor mostrado <= 0
    expect(() =>
      calcularCanal(
        {
          canal_nome: "Teste",
          valor_mostrado: 0,
          moeda: "BRL",
          comissao_fornecedor_pct: 10,
          comissao_venda_pct: 10,
          categoria_quarto: "Standard",
          cafe_da_manha: true,
        },
        cambioPadrao
      )
    ).toThrow("Valor mostrado deve ser maior que zero");

    // 3. Comissão do fornecedor fora de 0-100%
    expect(() =>
      calcularCanal(
        {
          canal_nome: "Teste",
          valor_mostrado: 1000,
          moeda: "BRL",
          comissao_fornecedor_pct: 105,
          comissao_venda_pct: 10,
          categoria_quarto: "Standard",
          cafe_da_manha: true,
        },
        cambioPadrao
      )
    ).toThrow("Comissão do fornecedor deve estar entre 0% e 100%");
  });

  it("Caso de Teste 4 — Destaque automático independente dentro de um grupo de hotel (RN-06)", () => {
    // Canal A: menor custo, menor venda
    // Canal B: maior custo, maior venda
    const canais: CanalInput[] = [
      {
        canal_nome: "Canal A (Menor Custo)",
        valor_mostrado: 1000,
        moeda: "BRL",
        comissao_fornecedor_pct: 10, // custo líq = 900, custo BRL = 900
        comissao_venda_pct: 5, // venda = 900 / 0.95 = 947.37
        categoria_quarto: "Standard",
        cafe_da_manha: true,
      },
      {
        canal_nome: "Canal B (Maior Venda)",
        valor_mostrado: 1200,
        moeda: "BRL",
        comissao_fornecedor_pct: 10, // custo líq = 1080, custo BRL = 1080
        comissao_venda_pct: 20, // venda = 1080 / 0.8 = 1350.00
        categoria_quarto: "Standard",
        cafe_da_manha: true,
      },
    ];

    const grupoCalculado = aplicarDestaquesNoGrupo(canais, cambioPadrao);

    expect(grupoCalculado[0].menor_custo_do_grupo).toBe(true);
    expect(grupoCalculado[0].maior_venda_do_grupo).toBe(false);

    expect(grupoCalculado[1].menor_custo_do_grupo).toBe(false);
    expect(grupoCalculado[1].maior_venda_do_grupo).toBe(true);
  });

  it("RN-06 — Em caso de empate no grupo, todos os empatados recebem true", () => {
    const canaisIguais: CanalInput[] = [
      {
        canal_nome: "Canal 1",
        valor_mostrado: 1000,
        moeda: "BRL",
        comissao_fornecedor_pct: 10,
        comissao_venda_pct: 10,
        categoria_quarto: "Standard",
        cafe_da_manha: true,
      },
      {
        canal_nome: "Canal 2",
        valor_mostrado: 1000,
        moeda: "BRL",
        comissao_fornecedor_pct: 10,
        comissao_venda_pct: 10,
        categoria_quarto: "Standard",
        cafe_da_manha: true,
      },
    ];

    const grupo = aplicarDestaquesNoGrupo(canaisIguais, cambioPadrao);

    expect(grupo[0].menor_custo_do_grupo).toBe(true);
    expect(grupo[0].maior_venda_do_grupo).toBe(true);
    expect(grupo[1].menor_custo_do_grupo).toBe(true);
    expect(grupo[1].maior_venda_do_grupo).toBe(true);
  });

  it("RN-10 — Arredondamento HALF_UP com precisão de 2 casas", () => {
    expect(round2(1441.1866)).toBe(1441.19);
    expect(round2(8853.0034)).toBe(8853.0);
    expect(round2(52321.250094)).toBe(52321.25);
    expect(round2(55660.9044)).toBe(55660.9);
  });

  it("Frontend Resilience — aplicarDestaquesNoGrupo não lança exceção com valores zerados durante digitação", () => {
    const canaisDigitando: CanalInput[] = [
      {
        canal_nome: "Booking",
        valor_mostrado: 0, // Usuário apagou o campo para digitar
        moeda: "BRL",
        comissao_fornecedor_pct: 10,
        comissao_venda_pct: 10,
        categoria_quarto: "Standard",
        cafe_da_manha: true,
      },
    ];

    expect(() => aplicarDestaquesNoGrupo(canaisDigitando, cambioPadrao)).not.toThrow();
    const resultado = aplicarDestaquesNoGrupo(canaisDigitando, cambioPadrao);
    expect(resultado[0].valor_final_venda).toBe(0);
    expect(resultado[0].menor_custo_do_grupo).toBe(false);
  });

  it("Cálculo com Taxas — Soma taxas ao custo do fornecedor", () => {
    const canalComTaxas: CanalInput = {
      canal_nome: "Booking com Taxas",
      valor_mostrado: 1000,
      taxas: 100, // 100 de taxas locais
      moeda: "BRL",
      comissao_fornecedor_pct: 10, // comissão = 100
      comissao_venda_pct: 10, // custo líq = 1000 - 100 + 100 = 1000 -> venda = 1000 / 0.9 = 1111.11
      categoria_quarto: "Standard",
      cafe_da_manha: true,
    };

    const resultado = calcularCanal(canalComTaxas, cambioPadrao);
    expect(resultado.valor_comissao).toBe(100);
    expect(resultado.taxas).toBe(100);
    expect(resultado.custo_liquido).toBe(1000);
    expect(resultado.custo_em_brl).toBe(1000);
    expect(resultado.valor_final_venda).toBe(1111.11);
  });

  it("Comissão Padrão Canônica — DEFAULT_AGENCY_COMMISSION_PCT é exatamente 14%", () => {
    expect(DEFAULT_AGENCY_COMMISSION_PCT).toBe(14);
  });

  it("Fase 4 — Indicador MAIOR LUCRO utiliza Max(Gross Profit) e não Max(Sale Price)", () => {
    // Venda A: Preço Venda R$ 10.000, Custo R$ 9.500 -> Lucro R$ 500
    // Custo 9500 / (1 - 0.05) = 10000 -> comissao_venda = 5%
    const canalA: CanalInput = {
      canal_nome: "Canal A (Alto volume, baixa margem)",
      valor_mostrado: 9500,
      moeda: "BRL",
      comissao_fornecedor_pct: 0,
      comissao_venda_pct: 5,
      categoria_quarto: "Standard",
      cafe_da_manha: false,
    };

    // Venda B: Preço Venda R$ 8.000, Custo R$ 6.800 -> Lucro R$ 1.200 (Maior Lucro!)
    // Custo 6800 / (1 - 0.15) = 8000 -> comissao_venda = 15%
    const canalB: CanalInput = {
      canal_nome: "Canal B (Menor venda, alta margem e maior lucro)",
      valor_mostrado: 6800,
      moeda: "BRL",
      comissao_fornecedor_pct: 0,
      comissao_venda_pct: 15,
      categoria_quarto: "Deluxe",
      cafe_da_manha: true,
    };

    const grupo = aplicarDestaquesNoGrupo([canalA, canalB], cambioPadrao);

    // Canal A tem maior venda nominal
    expect(grupo[0].valor_final_venda).toBe(10000);
    expect(grupo[0].lucro_bruto_agencia).toBe(500);
    expect(grupo[0].maior_venda_do_grupo).toBe(true);
    expect(grupo[0].maior_lucro_do_grupo).toBe(false);

    // Canal B tem maior lucro bruto para a agência
    expect(grupo[1].valor_final_venda).toBe(8000);
    expect(grupo[1].lucro_bruto_agencia).toBe(1200);
    expect(grupo[1].maior_lucro_do_grupo).toBe(true);
    expect(grupo[1].maior_venda_do_grupo).toBe(false);
  });
});
