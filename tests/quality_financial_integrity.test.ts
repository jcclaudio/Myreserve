import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, buildCsvRow } from "../src/lib/csv-sanitizer";

describe("Integridade Financeira — Conservação de Centavos e Sanitização", () => {
  it("Garante conservação estrita de centavos na divisão de parcelas com dízima (R$ 100,00 em 3x)", () => {
    const totalVenda = 100.0;
    const totalParcelas = 3;

    const parcelas: number[] = [];
    let somaParcial = 0;
    for (let p = 1; p <= totalParcelas; p++) {
      if (p === totalParcelas) {
        parcelas.push(Number((totalVenda - somaParcial).toFixed(2)));
      } else {
        const valorBase = Number((totalVenda / totalParcelas).toFixed(2));
        parcelas.push(valorBase);
        somaParcial += valorBase;
      }
    }

    expect(parcelas).toEqual([33.33, 33.33, 33.34]);
    const somaTotal = parcelas.reduce((acc, v) => acc + v, 0);
    expect(Number(somaTotal.toFixed(2))).toBe(totalVenda);
  });

  it("Garante conservação estrita de centavos em parcelamento de 6x (R$ 100,00 em 6x)", () => {
    const totalVenda = 100.0;
    const totalParcelas = 6;

    const parcelas: number[] = [];
    let somaParcial = 0;
    for (let p = 1; p <= totalParcelas; p++) {
      if (p === totalParcelas) {
        parcelas.push(Number((totalVenda - somaParcial).toFixed(2)));
      } else {
        const valorBase = Number((totalVenda / totalParcelas).toFixed(2));
        parcelas.push(valorBase);
        somaParcial += valorBase;
      }
    }

    const somaTotal = parcelas.reduce((acc, v) => acc + v, 0);
    expect(Number(somaTotal.toFixed(2))).toBe(totalVenda);
  });

  it("Garante conservação de centavos com valores complexos (ex: R$ 5.560,90 em 7 parcelas)", () => {
    const totalVenda = 5560.9;
    const totalParcelas = 7;

    const parcelas: number[] = [];
    let somaParcial = 0;
    for (let p = 1; p <= totalParcelas; p++) {
      if (p === totalParcelas) {
        parcelas.push(Number((totalVenda - somaParcial).toFixed(2)));
      } else {
        const valorBase = Number((totalVenda / totalParcelas).toFixed(2));
        parcelas.push(valorBase);
        somaParcial += valorBase;
      }
    }

    const somaTotal = parcelas.reduce((acc, v) => acc + v, 0);
    expect(Number(somaTotal.toFixed(2))).toBe(totalVenda);
  });

  it("Sanitiza células contra CSV Formula Injection (CWE-1236)", () => {
    // Fórmulas perigosas comuns
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(sanitizeCsvCell("@SUM(A1:A5)")).toBe("'@SUM(A1:A5)");
    expect(sanitizeCsvCell("@SUM(1,2)")).toBe('"\'@SUM(1,2)"');
    expect(sanitizeCsvCell("\tTAB_INJECTION")).toBe("'\tTAB_INJECTION");

    // Strings legítimas sem caracteres perigosos no início
    expect(sanitizeCsvCell("Cliente Normal")).toBe("Cliente Normal");
    expect(sanitizeCsvCell("Paris, França")).toBe('"Paris, França"');
    expect(sanitizeCsvCell('Quarto "Deluxe"')).toBe('"Quarto ""Deluxe"""');
  });

  it("Constrói linha CSV devidamente escapada e sanitizada", () => {
    const row = buildCsvRow([
      "VEN-2026-0001",
      "=Cliente Perigoso",
      "Paris, França",
      1500.5,
    ]);

    expect(row).toBe('VEN-2026-0001;\'=Cliente Perigoso;"Paris, França";1500.5');
  });
});
