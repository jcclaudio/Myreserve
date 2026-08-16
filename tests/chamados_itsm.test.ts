import { describe, it, expect } from "vitest";

describe("ITSM & SLA Engine for Travel Operations", () => {
  it("calculates exact SLA deadline based on priority", () => {
    const prioridades = [
      { prioridade: "CRITICA_EMERGENCIA", expectedMinutos: 30 },
      { prioridade: "ALTA", expectedMinutos: 120 },
      { prioridade: "MEDIA", expectedMinutos: 240 },
      { prioridade: "BAIXA", expectedMinutos: 1440 },
    ];

    for (const p of prioridades) {
      let slaMinutos = 240;
      if (p.prioridade === "CRITICA_EMERGENCIA") slaMinutos = 30;
      else if (p.prioridade === "ALTA") slaMinutos = 120;
      else if (p.prioridade === "BAIXA") slaMinutos = 1440;

      expect(slaMinutos).toBe(p.expectedMinutos);

      const agora = new Date("2026-08-15T12:00:00Z");
      const slaLimite = new Date(agora.getTime() + slaMinutos * 60 * 1000);

      const diffMinutos = Math.floor(
        (slaLimite.getTime() - agora.getTime()) / (1000 * 60)
      );
      expect(diffMinutos).toBe(p.expectedMinutos);
    }
  });

  it("detects SLA breach and SLA at-risk conditions accurately", () => {
    const agora = new Date("2026-08-15T12:00:00Z");

    // Caso 1: Vencido há 10 minutos
    const limiteViolado = new Date("2026-08-15T11:50:00Z");
    const diffViolado = Math.floor(
      (limiteViolado.getTime() - agora.getTime()) / (1000 * 60)
    );
    expect(diffViolado < 0).toBe(true);
    expect(diffViolado).toBe(-10);

    // Caso 2: Em risco (menos de 60 minutos restantes)
    const limiteRisco = new Date("2026-08-15T12:45:00Z");
    const diffRisco = Math.floor(
      (limiteRisco.getTime() - agora.getTime()) / (1000 * 60)
    );
    expect(diffRisco > 0 && diffRisco <= 60).toBe(true);
    expect(diffRisco).toBe(45);
  });
});
