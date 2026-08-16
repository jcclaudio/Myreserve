import { describe, it, expect } from "vitest";
import {
  CotacaoSchema,
  CanalCotadoSchema,
  HotelCotadoSchema,
} from "../src/lib/validations";

describe("Contratos de Dados e Validações Invariantes", () => {
  it("Rejeita se data_ida >= data_volta", () => {
    const dataInvalida = {
      cliente_nome: "Maria Silva",
      destino: "Paris",
      data_ida: "2026-09-20",
      data_volta: "2026-09-15", // data anterior
      adultos: 2,
      criancas: 0,
      idades_criancas: [],
      quartos: 1,
      cotacao_usd: 5.4,
      cotacao_eur: 5.9,
      comissao_padrao_agencia_pct: 10,
    };

    const resultado = CotacaoSchema.safeParse(dataInvalida);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.errors[0].message).toContain(
        "Data de volta deve ser posterior à data de ida"
      );
    }
  });

  it("Rejeita se idades_criancas não corresponder à quantidade de crianças (RN-03 / Contrato 5.2)", () => {
    const criancasSemIdade = {
      cliente_nome: "Carlos Eduardo",
      destino: "Orlando",
      data_ida: "2026-10-01",
      data_volta: "2026-10-10",
      adultos: 2,
      criancas: 2,
      idades_criancas: [5], // Apenas 1 idade informada para 2 crianças!
      quartos: 1,
      cotacao_usd: 5.4,
      cotacao_eur: 5.9,
      comissao_padrao_agencia_pct: 10,
    };

    const resultado = CotacaoSchema.safeParse(criancasSemIdade);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.errors[0].message).toContain(
        "A quantidade de idades informadas deve corresponder exatamente ao número de crianças"
      );
    }
  });

  it("Aceita quando idades_criancas coincide perfeitamente com a quantidade de crianças", () => {
    const criancasValidas = {
      cliente_nome: "Carlos Eduardo",
      destino: "Orlando",
      data_ida: "2026-10-01",
      data_volta: "2026-10-10",
      adultos: 2,
      criancas: 2,
      idades_criancas: [5, 8],
      quartos: 1,
      cotacao_usd: 5.4,
      cotacao_eur: 5.9,
      comissao_padrao_agencia_pct: 10,
    };

    const resultado = CotacaoSchema.safeParse(criancasValidas);
    expect(resultado.success).toBe(true);
  });

  it("Rejeita canal com comissão de venda >= 100% (RN-05)", () => {
    const canalInvalido = {
      canal_nome: "Booking",
      valor_mostrado: 1500,
      moeda: "BRL",
      comissao_fornecedor_pct: 10,
      comissao_venda_pct: 100, // Invalido!
      categoria_quarto: "Standard",
      cafe_da_manha: true,
    };

    const resultado = CanalCotadoSchema.safeParse(canalInvalido);
    expect(resultado.success).toBe(false);
  });

  it("Rejeita hotel cotado sem nenhum canal associado (Invariante 8)", () => {
    const hotelVazio = {
      hotel_nome: "Hotel Paris Centre",
      ordem_exibicao: 0,
      canais: [], // Inválido: pelo menos 1 canal é obrigatório
    };

    const resultado = HotelCotadoSchema.safeParse(hotelVazio);
    expect(resultado.success).toBe(false);
  });
});
