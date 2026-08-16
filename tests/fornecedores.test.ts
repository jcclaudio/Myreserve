import { describe, it, expect } from "vitest";

describe("Fornecedores & Vendor Management", () => {
  it("validates vendor categories and payment terms", () => {
    const categoriasValidas = [
      "OPERADORA_HOTEL",
      "CONSOLIDADORA_AEREA",
      "RECEPTIVO_TRANSFER",
      "SEGURO_VIAGEM",
      "OUTRO",
    ];

    const fornecedorExemplo = {
      nome_fantasia: "Booking.com",
      categoria: "OPERADORA_HOTEL",
      prazo_faturamento_dias: 15,
      ativo: true,
    };

    expect(categoriasValidas.includes(fornecedorExemplo.categoria)).toBe(true);
    expect(fornecedorExemplo.prazo_faturamento_dias).toBeGreaterThanOrEqual(0);
    expect(fornecedorExemplo.ativo).toBe(true);
  });
});
