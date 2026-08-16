# 🏛️ ARQUITETURA DO SISTEMA FINANCEIRO FIXTUR
> **Documento:** `docs/finance/FINANCE-ARCHITECTURE.md`  
> **Versão:** 3.0.0  
> **Protocolo:** FIXTUR-FINANCE-EVOLUTION-MASTER  

---

## 1. Visão Arquitetural

O Sistema Operacional Financeiro da FixTur adota uma arquitetura orientada ao domínio financeiro de Travel Tech, separando o ciclo preliminar de cotação do ciclo canônico de vendas confirmadas e tesouraria:

```text
┌─────────────────────────┐
│       COTAÇÃO           │  (Ambiente de Prospecção)
│ Cotacao + Hotel + Canal │  - Cálculos em tempo real RN-01 a RN-10
└────────────┬────────────┘
             │ Conversão ao Confirmar Venda
             ▼
┌─────────────────────────┐
│     VENDA CANÔNICA      │  (Âncora Financeira Imutável)
│       model Sale        │  - Snapshot de GMV, Custos, Receita Agência,
│     model SaleItem      │    Margem de Contribuição e Câmbio
└────────────┬────────────┘
             │
   ┌─────────┴───────────────────────────────┐
   │                                         │
   ▼                                         ▼
┌───────────────────────┐         ┌───────────────────────┐
│  CONTAS A RECEBER     │         │   CONTAS A PAGAR      │
│   model Receivable    │         │    model Payable      │
│ - Parcelas (1x a 12x) │         │ - Custo Fornecedores  │
│ - Aging em tempo real │         │ - Fornecedores Hotel  │
└──────────┬────────────┘         └──────────┬────────────┘
           │                                 │
           └────────────────┬────────────────┘
                            │ Liquidação dos Recebíveis
                            ▼
               ┌─────────────────────────┐
               │ COMISSÕES DE CONSULTOR  │
               │  ConsultantCommission   │
               │  - Status: ACCRUED      │
               │    → APPROVED → PAID    │
               │  - Painel MeuFinanceiro │
               └────────────┬────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │    DRE GERENCIAL (P&L)  │
               │  - GMV vs Venda Líquida │
               │  - Margem Contribuição  │
               │  - Resultado Operacional│
               └─────────────────────────┘
```

---

## 2. Invariantes de Banco de Dados & Transações Atômicas

1. **Idempotência de Vendas**: Uma cotação confirmada gera uma única `Sale` canônica com número de venda sequencial (`VEN-YYYY-XXXX`).
2. **Atomicidade (`prisma.$transaction`)**: A criação de `Sale` gera simultaneamente seus `SaleItems`, `Receivables`, `Payables`, provisionamento de `ConsultantCommission` e registro em `FinancialAuditLog`.
3. **Imutabilidade**: O snapshot financeiro da venda não é alterado retroativamente; estornos e cancelamentos geram registros de ajuste explícitos (`refunded_amount`, `cancelled_amount`, `CommissionReversal`).
