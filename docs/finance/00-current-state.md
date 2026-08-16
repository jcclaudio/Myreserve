# 📊 AUDITORIA DO FINANCEIRO ATUAL (FASE 0)
> **Documento:** `docs/finance/00-current-state.md`  
> **Sistema:** FixTur / MyReserve (Sistema de Gestão de Viagens e Cotações)  
> **Status:** `FASE 0: COMPLETED`  
> **Data da Auditoria:** 2026-08-15  
> **Protocolo:** FIXTUR-FINANCE-EVOLUTION-MASTER  

---

## 1. Contexto Geral & Fontes de Verdade Inspecionadas

Foram inspecionados exaustivamente:
1. **Especificação de Domínio**: `PROMPT_MESTRE_SistemaCotacaoHospedagens_v1.0.md` e `SYSTEM_SPEC_FOR_AI.md`.
2. **Camada de Dados & Persistência**: `prisma/schema.prisma` e banco SQLite local `prisma/dev.db`.
3. **Motor de Precificação**: `src/lib/calculations.ts` (RN-01 a RN-10).
4. **Validações & Contratos Zod**: `src/lib/validations.ts`.
5. **Módulos de Autenticação & RBAC**: `src/lib/auth.ts`, `src/app/api/auth/*` e `src/app/api/admin/usuarios/*`.
6. **APIs Financeiras & Cotações**:
   - `src/app/api/financeiro/transacoes/route.ts` & `[id]/route.ts`
   - `src/app/api/financeiro/metricas/route.ts`
   - `src/app/api/financeiro/cotacao/[id]/gerar-transacoes/route.ts`
   - `src/app/api/cotacoes/route.ts` & `[id]/route.ts`
7. **Frontend & Telas**:
   - `/` (Histórico & Cotações)
   - `/cotacoes/nova` (Wizard de Cotação)
   - `/cotacoes/[id]` (Detalhes da Cotação com Lançamento Financeiro)
   - `/cotacoes/[id]/proposta` (Proposta Limpa ao Cliente)
   - `/financeiro` (Fluxo de Caixa & Transações)
   - `/admin/usuarios` (Gestão de Acessos & RBAC)
8. **Suíte de Testes**: `tests/calculations.test.ts`, `tests/financial.test.ts`, `tests/validations.test.ts`, `tests/admin_users.test.ts` (20 testes passando).

---

## 2. Diagnóstico da Arquitetura Financeira Atual

### 2.1 Fluxo Existente:
```text
Cotação Criada (Cotacao + Hoteis + Canais)
  ↓
Escolha Manual do Canal / Proposta
  ↓
Ação Manual no Frontend: "Lançar no Financeiro"
  ↓ (POST /api/financeiro/cotacao/[id]/gerar-transacoes)
Criação de TransacaoFinanceira (1x RECEITA Venda + Nx DESPESA Fornecedor)
  ↓
Módulo Financeiro (/financeiro & /api/financeiro/metricas)
  ↓
Status: PENDENTE → PAGO (Liquidação simples)
```

---

## 3. Entidades & Modelagem Atual

### Entidade `TransacaoFinanceira` (Mapeada em `transacoes_financeiras`)
* `id` (UUID, PK)
* `descricao` (String)
* `tipo` (`RECEITA` | `DESPESA`)
* `categoria` (`VENDA_CLIENTE` | `PAGAMENTO_FORNECEDOR` | `COMISSAO_AGENCIA` | `TAXA_CAMBIO_IOF` | `REEMBOLSO` | `DESPESA_OPERACIONAL` | `OUTRO`)
* `valor_brl` (Float / Decimal simulado - total em R$)
* `moeda_original` (`BRL` | `USD` | `EUR`)
* `valor_original` (Float)
* `cotacao_cambio` (Float - taxa utilizada)
* `status` (`PENDENTE` | `PAGO` | `CANCELADO`)
* `data_vencimento` (DateTime)
* `data_pagamento` (DateTime nullable)
* `metodo_pagamento` (`PIX` | `CARTAO_CREDITO` | `BOLETO` | `TRANSFERENCIA` | `FATURADO` | `DINHEIRO`)
* `comprovante_ref` (String opcional)
* `observacoes` (String opcional)
* `cotacao_id` (FK opcional → `Cotacao`)
* `usuario_id` (FK → `Usuario`)
* `criado_em` / `atualizado_em` (Timestamps)

---

## 4. Normalização e Semântica de "Comissão"

No código atual existem **3 conceitos distintos** identificados na auditoria:
1. **`comissao_fornecedor_pct` (`SupplierCommission`)**:
   - Comissão/desconto comercial concedido pelo fornecedor (ex: Booking, BestBuy, Interep).
   - Abate do valor bruto do fornecedor: $C_{liq} = V_{mostrado} - (V_{mostrado} \times \frac{\text{comissao\_fornecedor\_pct}}{100}) + \text{taxas}$.
2. **`comissao_venda_pct` / Markup da Agência (`AgencyRevenue` / `GrossMargin`)**:
   - Margem bruta adicionada pela FIX Turismo sobre o custo em reais: $V_{venda} = \frac{C_{BRL}}{1 - \frac{\text{comissao\_venda\_pct}}{100}}$.
3. **Comissão do Consultor (`ConsultantCommission`)**:
   - **Lacuna Identificada:** Ainda não existe entidade dedicada nem plano de comissão para cálculo automático da remuneração individual do consultor sobre a venda.

---

## 5. Mapeamento de Lacunas, Riscos e Ambigüidades

| Área | Situação Atual | Lacuna / Risco | Necessidade no Protocolo |
| :--- | :--- | :--- | :--- |
| **Entidade `Sale`** | Inexistente. A cotação (`Cotacao`) gera diretamente `TransacaoFinanceira`. | Cotações abertas ou propostas não confirmadas podem gerar transações sem o conceito formal de Venda Confirmada. | Criar entidade canônica `Sale` e `SaleItem`. |
| **Recebíveis vs Pagáveis** | Agrupados em `TransacaoFinanceira` com campo `tipo: RECEITA / DESPESA`. | Não há suporte nativo a parcelamento de recebíveis (ex: 10x no cartão) nem a conciliação individual de parcelas. | Evoluir para `Receivable` e `Payable` com alocações. |
| **Comissão de Consultores** | Inexistente como motor. O consultor é apenas o autor (`criado_por_usuario_id`). | Impossível apurar quanto a agência deve repassar a cada agente por venda, meta ou período. | Criar `CommissionPlan`, `ConsultantCommission` e `CommissionPayoutBatch`. |
| **"Meu Financeiro" (Agente)** | Agente vê suas transações em `/financeiro` se for perfil `AGENTE`. | Visão financeira não separa o caixa da agência do extrato de comissões do agente. | Criar painel dedicado `/meu-financeiro` para o consultor. |
| **Imutabilidade / Snapshot** | A cotação armazena os valores calculados na data da criação. | Alterações de status ou edições não geram trilha imutável de `FinancialAdjustment`. | Implementar Snapshots financeiros e Subledger. |
| **Precisão Decimal** | Tipos `Float` no SQLite com arredondamento `round2` via JavaScript. | Risco de discrepâncias centesimais em volumes massivos. | Migrar formalmente para `Decimal` exato no Postgres/Prisma. |

---

## 6. Cobertura de Testes Atual

Execução do Vitest em 2026-08-15:
- `tests/calculations.test.ts`: **8 testes PASS** (RN-01 a RN-10 de cotação e destaques).
- `tests/financial.test.ts`: **4 testes PASS** (Métricas de fluxo de caixa, margem e conversão).
- `tests/validations.test.ts`: **5 testes PASS** (Invariantes de datas, quartos, crianças e comissões).
- `tests/admin_users.test.ts`: **3 testes PASS** (Criptografia bcrypt, integridade de tokens e RBAC).
- **Total: 20 testes passando (100% de sucesso).**

---

## 7. Próximos Passos (Plano para FASE 1)

1. **Definição Canônica do Dicionário Financeiro** (`docs/finance/FINANCIAL-DICTIONARY.md`).
2. **Definição Formal dos Modelos de Domínio**:
   - `Sale` & `SaleItem`
   - `Receivable` & `Payable`
   - `CommissionPlan` & `ConsultantCommission`
   - `Payment` & `PaymentAllocation`
3. **Elaboração da Architecture Decision Record (ADR-001: Financial Operating System)**.

---
*Relatório de Auditoria Fase 0 concluído sem modificações no código-fonte.*
