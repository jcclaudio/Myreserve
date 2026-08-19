import { describe, it, expect } from "vitest";
import { PixEngine } from "@/lib/pix";

describe("PixEngine — Padrão Banco Central do Brasil / EMV", () => {
  it("deve gerar payload PIX Copia-e-Cola válido com tags EMV e CRC16", () => {
    const payload = PixEngine.generatePayload({
      chavePix: "financeiro@fixturismo.com.br",
      beneficiarioNome: "Fix Turismo",
      beneficiarioCidade: "Sao Paulo",
      valor: 1250.0,
      txId: "VEN2026001P1",
      descricao: "Parcela 1/3",
    });

    // 000201 -> Formato
    expect(payload.startsWith("000201")).toBe(true);

    // 26 -> GUI do Banco Central
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("financeiro@fixturismo.com.br");

    // 53 -> Moeda 986 (BRL)
    expect(payload).toContain("5303986");

    // 54 -> Valor formatado com 2 casas
    expect(payload).toContain("54071250.00");

    // 58 -> País BR
    expect(payload).toContain("5802BR");

    // 59 -> Nome do Beneficiário higienizado
    expect(payload).toContain("5911FIX TURISMO");

    // 60 -> Cidade
    expect(payload).toContain("6009SAO PAULO");

    // 62 -> TxID
    expect(payload).toContain("62160512VEN2026001P1");

    // 6304 -> CRC16 no final com 4 caracteres hexadecimais
    expect(payload).toMatch(/6304[A-F0-9]{4}$/);
  });

  it("deve gerar URL de QR Code correta", () => {
    const payload = PixEngine.generatePayload({
      chavePix: "11999999999",
      beneficiarioNome: "Fix Turismo",
      beneficiarioCidade: "Sao Paulo",
      valor: 500.0,
    });

    const qrUrl = PixEngine.getQrCodeUrl(payload, 250);
    expect(qrUrl).toContain("https://api.qrserver.com/v1/create-qr-code/?size=250x250");
    expect(qrUrl).toContain(encodeURIComponent(payload));
  });
});
