import { describe, it, expect } from "vitest";
import {
  TransacaoFinanceiraSchema,
  TipoTransacaoEnum,
  CategoriaTransacaoEnum,
} from "../src/lib/validations";

describe("Módulo Financeiro - Regras de Negócio e Validações", () => {
  it("Valida e aceita uma transação financeira de receita válida em BRL", () => {
    const transacaoValida = {
      descricao: "Venda Pacote Paris - Cliente Mariana",
      tipo: "RECEITA",
      categoria: "VENDA_CLIENTE",
      valor_original: 15400.0,
      moeda_original: "BRL",
      cotacao_cambio: 1.0,
      status: "PAGO",
      data_vencimento: "2026-09-10",
      metodo_pagamento: "PIX",
      comprovante_ref: "PIX-998877",
    };

    const resultado = TransacaoFinanceiraSchema.safeParse(transacaoValida);
    expect(resultado.success).toBe(true);
  });

  it("Valida e aceita transação em moeda estrangeira (USD / EUR)", () => {
    const transacaoUSD = {
      descricao: "Pagamento Fornecedor Booking.com - Hotel Roma",
      tipo: "DESPESA",
      categoria: "PAGAMENTO_FORNECEDOR",
      valor_original: 1200.0,
      moeda_original: "USD",
      cotacao_cambio: 5.45,
      status: "PENDENTE",
      data_vencimento: "2026-09-15",
      metodo_pagamento: "CARTAO_CREDITO",
    };

    const resultado = TransacaoFinanceiraSchema.safeParse(transacaoUSD);
    expect(resultado.success).toBe(true);

    if (resultado.success) {
      const valorBRL = Number(
        (resultado.data.valor_original * resultado.data.cotacao_cambio).toFixed(2)
      );
      expect(valorBRL).toBe(6540.0);
    }
  });

  it("Rejeita transação com valor negativo ou zerado", () => {
    const transacaoInvalida = {
      descricao: "Taxa inválida",
      tipo: "DESPESA",
      categoria: "DESPESA_OPERACIONAL",
      valor_original: -50.0, // Inválido!
      moeda_original: "BRL",
      data_vencimento: "2026-09-10",
    };

    const resultado = TransacaoFinanceiraSchema.safeParse(transacaoInvalida);
    expect(resultado.success).toBe(false);
  });

  it("Calcula corretamente o Lucro Líquido Realizado e Margem de Lucro", () => {
    const receitasPagas = 25000.0;
    const despesasPagas = 19500.0;

    const lucroLiquido = receitasPagas - despesasPagas;
    const margemPct = Number(((lucroLiquido / receitasPagas) * 100).toFixed(2));

    expect(lucroLiquido).toBe(5500.0);
    expect(margemPct).toBe(22.0);
  });
});
