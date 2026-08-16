import { describe, it, expect } from "vitest";
import { parseOfx } from "../src/lib/ofx-parser";
import { NotificationService } from "../src/lib/notification-service";

describe("OFX Parser & Bank Reconciliation", () => {
  it("parses valid OFX content with credits and debits accurately", () => {
    const sampleOfx = `
OFXHEADER:100
DATA:OFXSGML
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20260815120000
            <TRNAMT>1500.00
            <FITID>TRN20260815001
            <MEMO>PIX RECEBIDO CLIENTE JOAO
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260815140000
            <TRNAMT>-850.50
            <FITID>TRN20260815002
            <MEMO>PAGTO BOOKING FORNECEDOR
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`;

    const res = parseOfx(sampleOfx);
    expect(res.transacoes.length).toBe(2);

    expect(res.transacoes[0].tipo).toBe("CREDITO");
    expect(res.transacoes[0].valor).toBe(1500.0);
    expect(res.transacoes[0].idTransacao).toBe("TRN20260815001");
    expect(res.transacoes[0].memo).toBe("PIX RECEBIDO CLIENTE JOAO");

    expect(res.transacoes[1].tipo).toBe("DEBITO");
    expect(res.transacoes[1].valor).toBe(850.5);
    expect(res.transacoes[1].idTransacao).toBe("TRN20260815002");

    expect(res.totalCreditos).toBe(1500.0);
    expect(res.totalDebitos).toBe(850.5);
  });
});

describe("Notification & WhatsApp Service", () => {
  it("formats SLA alert message correctly", () => {
    const alertMsg = NotificationService.formatSlaAlertWhatsApp({
      ticketNumber: "TCK-2026-0001",
      titulo: "No-Show no Hotel Paris",
      categoria: "NO_SHOW_EMERGENCIA",
      prioridade: "CRITICA_EMERGENCIA",
      clienteNome: "Maria Santos",
      slaMinutos: 30,
      slaLimite: new Date("2026-08-15T18:30:00Z"),
    });

    expect(alertMsg).toContain("TCK-2026-0001");
    expect(alertMsg).toContain("CRITICA_EMERGENCIA");
    expect(alertMsg).toContain("30 minutos");
    expect(alertMsg).toContain("Maria Santos");
  });

  it("formats Sale confirmation message correctly", () => {
    const saleMsg = NotificationService.formatSaleConfirmationWhatsApp({
      saleNumber: "VEN-2026-0001",
      clienteNome: "Carlos Pereira",
      destino: "Cancún, México",
      dataInicio: new Date("2026-10-10"),
      dataFim: new Date("2026-10-17"),
      gmv: 8500.0,
      consultorNome: "Ana Silva",
    });

    expect(saleMsg).toContain("Carlos Pereira");
    expect(saleMsg).toContain("Cancún, México");
    expect(saleMsg).toContain("VEN-2026-0001");
    expect(saleMsg).toContain("Ana Silva");
  });
});
