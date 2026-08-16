# 🏨 FixTur / MyReserve — Sistema Operacional de Viagens, Finanças e Propostas 2.0

> **Plataforma corporativa integrada de Travel Tech:** Travel Quote Builder multiproduto, emissor de propostas comerciais de alto padrão (PDF A4), gestão financeira canônica (Subledger, Contas a Receber/Pagar, DRE), conciliação bancária OFX, comissões de consultores e central de suporte operacional (ITSM/SLA).

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ instalado.

### 2. Instalação e Inicialização
No diretório do projeto, execute:

```bash
# 1. Instalar as dependências
npm install

# 2. Sincronizar o banco de dados e popular dados de demonstração
npm run setup

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 3. Credenciais de Acesso de Demonstração
- **Administrador / Diretor:** `admin@myreserve.com.br` / `admin123`
- **Consultor / Agente:** `agente@myreserve.com.br` / `senha123`
- **Financeiro:** `financeiro@myreserve.com.br` / `fin123`

---

## 🌟 Principais Módulos & Funcionalidades

### 1. Travel Quote Builder Multiproduto
- **Hospedagem & Canais:** Comparação lado a lado de tarifas por fornecedor (Booking.com, BestBuy Travel, Interep, etc.) com **Design Tokens** e precificação automatizada pelas regras **RN-01 a RN-10**.
- **Produtos Adicionais de Viagem:** Cotação modular para **Aéreo**, **Transfer**, **Seguro Viagem**, **Ingressos**, **Parques Temáticos**, **Passeios / Tours**, **Locação de Veículos** e **Serviços Personalizados**.
- **Comissão Canônica:** Padrão oficial de **14,0%** configurado como fonte única da verdade (`DEFAULT_AGENCY_COMMISSION_PCT`).
- **Inputs Numéricos Limpos:** Campos visuais limpos sem disputar com zeros automáticos (`""`) e suporte a vírgula/ponto decimal.
- **Destaque "MAIOR LUCRO":** Indicador baseado na margem real da agência (`MAX(gross_profit)`), eliminando o critério incorreto de faturamento bruto ("Maior Venda").
- **Edição Dinâmica & Inclusão Incremental:** Edição rápida de parâmetros e adição de múltiplos hotéis e produtos em cotações já salvas.
- **Reabertura com Versionamento:** Reabertura para correções com justificativa obrigatória e snapshot JSON imutável em `CotacaoVersao`.

### 2. Proposal Engine 2.0 (Proposta Comercial & PDF)
- **Design Editorial Premium:** Layout responsivo, tipografia institucional FixTur e marca-d'água oficial de baixa opacidade.
- **Ocultação Inteligente:** Seções e produtos não selecionados são automaticamente omitidos da proposta do cliente.
- **Cálculo Determinístico de Diárias:** Normalização UTC para contagem exata de noites de hospedagem.
- **Segurança de Links:** Sanitização rigorosa contra esquemas inseguros (`javascript:`, `data:` e `file:`).
- **Pronto para Impressão A4:** Regras `@page { size: A4 portrait; margin: 12mm 15mm; }` com prevenção de quebra de cards (`break-inside: avoid`).
- **Frase Regulatória Obrigatória:** *"Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio"*.

### 3. Sistema Financeiro Canônico & Subledger
- **Vendas Canônicas (`Sale`):** Registro financeiro imutável pós-fechamento com métricas de GMV, custo de fornecedor e receita bruta da agência.
- **Contas a Receber (`Receivable`):** Controle parcelado de clientes com esteira de Aging (a vencer, vencido 1-30, 31-60, 61-90, 90+ dias).
- **Contas a Pagar (`Payable`):** Gestão de compromissos com operadoras e hotéis parceiros.
- **Conciliação Bancária OFX:** Parser automático de extratos bancários com matching inteligente de transações.
- **DRE Gerencial (P&L):** Demonstração de Resultados do Exercício com cálculo em tempo real de receita, custos e margem.

### 4. Motor de Comissões de Consultores
- Ciclo de vida transparente: **`ACCRUED`** (Provisionada) ➔ **`APPROVED`** (Aprovada) ➔ **`PAID`** (Paga).
- Dashboard dedicado para consultores acompanharem seus ganhos e painel de aprovação para administradores.

### 5. Central de Operações, Fornecedores & Suporte (ITSM)
- **Gestão de Fornecedores:** Cadastro com plantão de emergência 24h, prazos de faturamento e chaves PIX.
- **Central de Chamados:** Gestão de suporte a viagens (No-Show, cancelamentos, remarcações, emergências) com radar de SLA em tempo real.

---

## 🧪 Suíte de Testes Automatizados

O sistema conta com **10 suítes de teste** e **46 testes unitários** com 100% de aprovação:

```bash
# Executar todos os testes automatizados
npm test
```

### Cobertura de Testes:
- `tests/calculations.test.ts`: Fórmulas financeiras RN-01 a RN-10, precisão total, 14% padrão e cálculo de Maior Lucro.
- `tests/quote_builder.test.ts`: Tokens visuais de fornecedores, sanitização de links e schemas Zod multiproduto.
- `tests/proposal_engine.test.ts`: Normalização UTC de diárias, montagem do ProposalViewModel multiproduto e frase obrigatória.
- `tests/financial.test.ts`: Subledger, contas a receber, contas a pagar e integridade financeira.
- `tests/sales_and_commissions.test.ts`: Ciclo de vida de vendas e motor de comissões.
- `tests/fornecedores.test.ts`: Gestão de operadoras e dados de plantão 24h.
- `tests/chamados_itsm.test.ts`: Abertura de chamados, transições de status e SLA.
- `tests/validations.test.ts`: Limites de entrada e validações de integridade.
- `tests/ofx_and_notifications.test.ts`: Importação e parsing de extratos OFX.
- `tests/admin_users.test.ts`: Autenticação e controle de acesso RBAC.

---

## 📐 Regras de Negócio Implementadas (RN-01 a RN-10)

- **RN-01:** `valor_comissao = valor_mostrado × (comissao_fornecedor_pct / 100)`
- **RN-02:** `custo_liquido = valor_mostrado − valor_comissao` (precisão total)
- **RN-03:** `cotacao_utilizada = 1` (BRL), `cotacao_usd` (USD) ou `cotacao_eur` (EUR)
- **RN-04:** `custo_em_brl = custo_liquido × cotacao_utilizada` (precisão total)
- **RN-05:** `valor_final_venda = custo_em_brl / (1 − comissao_venda_pct / 100)`
- **RN-06:** Destaque automático independente do Menor Custo e **Maior Lucro** (`MAX(gross_profit)`).
- **RN-07:** Pré-preenchimento da comissão de venda default a partir da comissão padrão da agência (**14%**) com override livre por canal.
- **RN-08:** Proposta ao cliente limpa e auditada (nunca exibe dados de custo ou comissões internas), exportável em PDF e WhatsApp.
- **RN-09:** Câmbio automático online (AwesomeAPI) com fallback manual seguro.
- **RN-10:** Arredondamento `ROUND_HALF_UP` aplicado exclusivamente na persistência e exibição, preservando a precisão matemática na cadeia de cálculo.

---

## 🛠️ Stack Tecnológica

- **Frontend & Backend:** Next.js 14+ (App Router) + TypeScript + React
- **Estilização & PDF:** Tailwind CSS + Lucide React + CSS `@media print` A4
- **Banco de Dados & ORM:** Prisma ORM com SQLite (local) / PostgreSQL (produção)
- **Autenticação:** JWT seguro em cookies HTTP-only via `jose` e hashing com `bcryptjs`
- **Validação de Contratos:** Zod
- **Testes:** Vitest
