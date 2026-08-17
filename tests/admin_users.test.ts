import { describe, it, expect, beforeAll } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth";

describe("Segurança, Autenticação e RBAC (Roles & Permissões)", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "ci-test-jwt-secret-key-1234567890-min-32-chars";
  });

  it("Gera hash seguro e verifica senha corretamente com bcrypt", async () => {
    const senhaPlana = "SenhaForte@2026";
    const hash = await hashPassword(senhaPlana);

    expect(hash).not.toBe(senhaPlana);
    expect(hash.startsWith("$2")).toBe(true);

    const valida = await verifyPassword(senhaPlana, hash);
    expect(valida).toBe(true);

    const invalida = await verifyPassword("SenhaErrada", hash);
    expect(invalida).toBe(false);
  });

  it("Gera e verifica token JWT de sessão preservando o papel (Role) e status ativo", async () => {
    const payloadAdmin = {
      userId: "user-uuid-admin",
      email: "admin@fixturismo.com.br",
      nome: "Diretoria FIX",
      role: "ADMIN",
      ativo: true,
    };

    const token = await createSessionToken(payloadAdmin);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payloadAdmin.userId);
    expect(decoded?.email).toBe(payloadAdmin.email);
    expect(decoded?.role).toBe("ADMIN");
    expect(decoded?.ativo).toBe(true);
  });

  it("Preserva papéis AGENTE e FINANCEIRO no token JWT", async () => {
    const payloadAgente = {
      userId: "user-uuid-agente",
      email: "consultor@fixturismo.com.br",
      nome: "Agente de Viagens",
      role: "AGENTE",
      ativo: true,
    };

    const token = await createSessionToken(payloadAgente);
    const decoded = await verifySessionToken(token);

    expect(decoded?.role).toBe("AGENTE");

    const payloadFinanceiro = {
      userId: "user-uuid-fin",
      email: "financeiro@fixturismo.com.br",
      nome: "Gestor Financeiro",
      role: "FINANCEIRO",
      ativo: true,
    };

    const tokenFin = await createSessionToken(payloadFinanceiro);
    const decodedFin = await verifySessionToken(tokenFin);

    expect(decodedFin?.role).toBe("FINANCEIRO");
  });
});
