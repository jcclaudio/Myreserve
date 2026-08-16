# 📖 DICIONÁRIO FINANCEIRO CANÔNICO (FIXTUR / MYRESERVE)
> **Documento:** `docs/finance/FINANCIAL-DICTIONARY.md`  
> **Versão:** 1.0.0  
> **Protocolo:** FIXTUR-FINANCE-EVOLUTION-MASTER  
> **Status:** ATIVO & FONTE DE VERDADE  

Este documento estabelece as definições matemáticas, contábeis e de domínio para todo o sistema (backend, frontend, relatórios, APIs e agentes de IA). **Nenhum termo abaixo deve ser tratado como sinônimo de outro.**

---

## 1. Termos Canônicos de Venda e Faturamento

### 1.1 GMV (Gross Merchandise Value / Volume Bruto Movimentado)
* **Definição:** Soma do valor total cobrado do cliente final em todas as vendas e reservas confirmadas, incluindo diárias, taxas de fornecedores, impostos e serviços.
* **Fórmula:** $\text{GMV} = \sum \text{Sale.gross\_sale\_amount}$
* **Importante:** $\text{GMV} \neq \text{Receita da Agência}$. O GMV inclui custos pass-through devidos aos fornecedores hoteleiros.

### 1.2 Venda (`Sale`)
* **Definição:** O contrato comercial e financeiro celebrado e confirmado entre o cliente e a FixTur para prestação de serviços de viagem/hospedagem.
* **Origem:** Nasce da confirmação formal de uma cotação/proposta (`Cotacao`), reserva validada ou voucher emitido.
* **Invariante:** Propostas apenas enviadas **NÃO** geram `Sale`.

### 1.3 Venda Líquida (`Net Sales`)
* **Definição:** Valor bruto da venda deduzido de cancelamentos e reembolsos concedidos.
* **Fórmula:** $\text{Net Sales} = \text{Gross Sale} - \text{Refunded Amount} - \text{Cancelled Amount}$

---

## 2. Termos Canônicos de Custos, Receitas e Rentabilidade

### 2.1 Custo do Fornecedor (`SupplierCost`)
* **Definição:** Custo líquido devido ao operador/distribuidor/hotel (ex: Booking, BestBuy, Interep, CVC) para garantir a reserva do cliente.
* **Fórmula:** $\text{SupplierCost} = (\text{Valor Mostrado} - \text{Comissão Fornecedor}) + \text{Taxas Fornecedor}$ (convertido para BRL na taxa da venda).

### 2.2 Receita Bruta da Agência (`AgencyRevenue` / `GrossProfit`)
* **Definição:** O resultado econômico da FixTur na operação. É a diferença entre o valor de venda cobrado do cliente e o custo líquido do fornecedor.
* **Fórmula:** $\text{AgencyRevenue} = \text{GrossSaleAmount} - \text{SupplierCost}$

### 2.3 Margem Bruta (`GrossMargin` / `ActualMargin`)
* **Definição:** Percentual de lucro bruto gerado sobre o preço de venda cobrado do cliente.
* **Fórmula:** $\text{GrossMargin (\%)} = \left(\frac{\text{AgencyRevenue}}{\text{GrossSaleAmount}}\right) \times 100$

### 2.4 Margem de Contribuição (`ContributionMargin`)
* **Definição:** O lucro remanescente da venda após a dedução de **todos os custos variáveis diretos** (comissão do consultor, taxas de cartão/gateway e IOF).
* **Fórmula:** 
  $$\text{ContributionMargin} = \text{AgencyRevenue} - \text{ConsultantCommission} - \text{PaymentProcessingFee} - \text{OtherVariableCosts}$$
* **Taxa de Contribuição (\%):** $\left(\frac{\text{ContributionMargin}}{\text{GrossSaleAmount}}\right) \times 100$

### 2.5 Resultado Operacional Gerencial (`OperatingResult`)
* **Definição:** Lucro operacional final da agência no período após abater as despesas fixas e operacionais da margem de contribuição.
* **Fórmula:** $\text{OperatingResult} = \sum \text{ContributionMargin} - \sum \text{OperatingExpenses}$

---

## 3. Desambiguação Crítica de Comissões

| Termo Canônico | Conceito | Quem Paga? | Quem Recebe? | Base de Cálculo |
| :--- | :--- | :---: | :---: | :--- |
| **`SupplierCommission`** | Desconto comercial ou comissão de distribuição hoteleira. | Fornecedor (Booking, Interep, etc.) | FixTur (Abatido no custo líquido) | `valor_mostrado` do fornecedor |
| **`AgencyRevenue`** | Margem/Markup bruto auferido pela FixTur na venda. | Cliente | FixTur | `custo_em_brl / (1 - markup)` |
| **`ConsultantCommission`** | Remuneração devida ao consultor/agente que realizou a venda. | FixTur | Consultor / Agente | Definido pelo `CommissionPlan` da FixTur |

---

## 4. Termos de Tesouraria, Liquidez e Conciliação

### 4.1 Conta a Receber (`Receivable`)
* **Definição:** Direito de crédito da FixTur contra o cliente referente a uma venda. Pode ser dividido em múltiplas parcelas (ex: 1x a 12x).
* **Status:** `OPEN` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID` / `OVERDUE` / `CANCELLED` / `REFUNDED` / `CHARGEBACK`.

### 4.2 Conta a Pagar (`Payable`)
* **Definição:** Obrigação financeira da FixTur perante um fornecedor hoteleiro, parceiro comercial ou despesa administrativa.
* **Status:** `OPEN` $\rightarrow$ `APPROVED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `PAID` / `CANCELLED`.

### 4.3 Recebimento / Pagamento (`Payment`)
* **Definição:** A liquidação financeira efetiva de recursos que transitaram por uma conta bancária ou gateway da agência.
* **Associação:** Um `Payment` é vinculado a um ou mais `Receivable` ou `Payable` através de `PaymentAllocation`.

### 4.4 Reembolso (`Refund`)
* **Definição:** Devolução de valores ao cliente em razão de cancelamento ou alteração contratual autorizada.
* **Regra:** Gera redução de `NetSales` e aciona estorno de comissão (`CommissionReversal`).

### 4.5 Estorno de Cartão / Contestação (`Chargeback`)
* **Definição:** Cancelamento forçado de transação de cartão pelo banco emissor por contestação ou fraude.
* **Regra:** Tratado como evento de risco com abertura de processo de disputa e bloqueio de comissões associadas.

### 4.6 Conciliação Financeira (`Reconciliation`)
* **Definição:** Processo determinístico de conferência entre os extratos bancários/gateways e os registros de `Payment` internos.
* **Status:** `UNMATCHED`, `SUGGESTED`, `PARTIAL`, `MATCHED`, `CONFLICT`.

---
*Este dicionário é imutável sem aprovação formal e revisão de arquitetura.*
