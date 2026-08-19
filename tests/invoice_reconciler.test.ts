import { describe, it, expect } from "vitest";
import { InvoiceReconciler } from "@/lib/invoice-reconciler";

describe("InvoiceReconciler — Conciliação de Faturas de Operadoras", () => {
  it("deve fazer o parse correto de CSV de fatura de operadora com formatação BRL", () => {
    const csv = `Localizador;Fornecedor;Cliente;Valor;Data
VEN-2026-001;CVC Operadora;Marcos Souza;1.450,80;2026-08-20
VEN-2026-002;RexturAdvance;Beatriz Lima;3200.50;2026-08-22`;

    const rows = InvoiceReconciler.parseCSV(csv);
    expect(rows.length).toBe(2);
    expect(rows[0].localizador).toBe("VEN-2026-001");
    expect(rows[0].fornecedor).toBe("CVC Operadora");
    expect(rows[0].cliente).toBe("Marcos Souza");
    expect(rows[0].valor).toBe(1450.8);
    expect(rows[1].valor).toBe(3200.5);
  });

  it("deve cruzar perfeitamente itens que coincidem em localizador e valor", () => {
    const rows = [
      {
        localizador: "VEN-2026-001",
        fornecedor: "CVC",
        valor: 1450.8,
        linhaOriginal: "",
      },
    ];

    const payables = [
      {
        id: "pay-1",
        fornecedor_nome: "CVC Operadora",
        descricao: "Diárias Hotel",
        valor_brl: 1450.8,
        saldo: 1450.8,
        status: "OPEN",
        sale: { sale_number: "VEN-2026-001", cliente_nome: "Marcos Souza" },
      },
    ];

    const res = InvoiceReconciler.reconcile(rows, payables);
    expect(res.matchesPerfeitos).toBe(1);
    expect(res.divergenciasValor).toBe(0);
    expect(res.itens[0].status).toBe("MATCH_PERFEITO");
    expect(res.itens[0].pagavelId).toBe("pay-1");
  });

  it("deve apontar divergência quando a operadora cobrar valor diferente do sistema", () => {
    const rows = [
      {
        localizador: "VEN-2026-005",
        fornecedor: "EZLink",
        valor: 1600.0,
        linhaOriginal: "",
      },
    ];

    const payables = [
      {
        id: "pay-2",
        fornecedor_nome: "EZLink",
        descricao: "Passeios Orlando",
        valor_brl: 1500.0,
        saldo: 1500.0,
        status: "OPEN",
        sale: { sale_number: "VEN-2026-005", cliente_nome: "Familia Silva" },
      },
    ];

    const res = InvoiceReconciler.reconcile(rows, payables);
    expect(res.divergenciasValor).toBe(1);
    expect(res.itens[0].status).toBe("DIVERGENCIA_VALOR");
    expect(res.itens[0].diferencaValor).toBe(100.0);
  });

  it("deve sinalizar itens não encontrados", () => {
    const rows = [
      {
        localizador: "LOC-DESCONHECIDO",
        fornecedor: "Operadora Desconhecida",
        valor: 999.0,
        linhaOriginal: "",
      },
    ];

    const res = InvoiceReconciler.reconcile(rows, []);
    expect(res.naoEncontrados).toBe(1);
    expect(res.itens[0].status).toBe("NAO_ENCONTRADO");
  });
});
