# ADR-001: Modelo Financeiro Canônico, Entidade Sale e Subledger

## Status
**PROPOSTO & VALIDADO** (Fase 1 do Protocolo FIXTUR-FINANCE-EVOLUTION-MASTER)

## Contexto
O sistema MyReserve foi concebido inicialmente como um comparador de canais e motor de cotações hoteleiras. Com o crescimento da FixTur, surgiu a necessidade de transformar a ferramenta em um Sistema Operacional Financeiro robusto que conecte cotações, vendas confirmadas, comissões de consultores, contas a receber parceladas, contas a pagar a fornecedores, conciliação e demonstrativos gerenciais.

## Decisões de Arquitetura

### 1. Criação da Entidade Canônica `Sale` e `SaleItem`
- A entidade `Sale` é a âncora financeira do sistema.
- A cotação (`Cotacao`) permanece como instrumento de prospecção e precificação preliminar.
- Quando o cliente aprova uma proposta ou a reserva é confirmada, é gerada uma `Sale` imutável com snapshot financeiro dos valores, câmbio, margem e custos.

### 2. Separação Estrita de Conceitos de Comissão
1. `SupplierCommission`: Desconto comercial fornecido pelo hotel/distribuidor.
2. `AgencyRevenue` / `GrossProfit`: Resultado da FixTur (`GrossSale - SupplierCost`).
3. `ConsultantCommission`: Remuneração do consultor gerada por regras determinísticas em `CommissionPlan`.

### 3. Lifecycle e Máquina de Estados da Venda (`SaleStatus`)
```text
DRAFT → PENDING_CONFIRMATION → CONFIRMED → PARTIALLY_PAID → PAID → COMPLETED
                                    │
                                    ├──→ CANCELLED (ou PARTIALLY_CANCELLED)
                                    ├──→ REFUNDED (ou PARTIALLY_REFUNDED)
                                    └──→ CHARGEBACK
```

### 4. Modelo de Recebíveis (`Receivable`) e Pagáveis (`Payable`)
- Cada `Sale` gera um plano de recebimento (1 a N parcelas de `Receivable`).
- Cada item de fornecedor gera um `Payable` com vencimento e dados de pagamento.
- Pagamentos reais são registrados em `Payment` e associados via `PaymentAllocation`.

### 5. Motor de Comissões de Consultores (`Consultant Commission Engine`)
- O cálculo da comissão do consultor é baseado em `CommissionPlan` e `CommissionRule`.
- A comissão possui ciclo de vida: `CALCULATED → ACCRUED → ELIGIBLE → APPROVED → PAYABLE → BATCHED → PAID`.
- Suporte a estorno auditado (`CommissionReversal`) e contestação (`CommissionDispute`).

### 6. Estratégia de Migração e Compatibilidade
- Aplicação do padrão **Expand / Backfill / Contract**:
  1. *Expand:* Adicionar novos modelos no Prisma sem remover ou quebrar `Cotacao` e `TransacaoFinanceira`.
  2. *Backfill:* Criar script para migrar cotações com transações existentes para `Sale` e `SaleItem`.
  3. *Switch:* Apontar os novos fluxos para `Sale` e sincronizar com o dashboard.

## Consequências
- **Positivas:** Rastreabilidade centesimal de cada real movimentado; suporte a múltiplos consultores e parcelamento; extrato individual do consultor sem vazamento de segredos da agência.
- **Mitigação de Complexidade:** Preservação integral do motor de cálculos `src/lib/calculations.ts` com testes garantindo que nenhuma regra de negócio existente seja afetada.
