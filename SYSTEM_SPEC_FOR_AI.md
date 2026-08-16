# 🏨 MyReserve & FixTur — Sistema Operacional Financeiro, Vendas, Comissões e Operações
> **Documento de Contexto Técnico & Engenharia de Software para IA**  
> **Projeto:** FixTur / MyReserve (Sistema Integrado de Viagens, Finanças e Suporte Operacional)  
> **Versão:** 3.5.0 (Travel Quote Builder Master & Multiproduct Proposal Edition)  
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma ORM + SQLite/PostgreSQL + Jose (JWT) + Vitest  

---

## 🎯 1. Visão Geral do Produto & Propósito

O **FixTur / MyReserve** é uma plataforma corporativa de ponta a ponta desenvolvida para a agência de viagens **FIX Turismo**. O sistema orquestra:
```text
TRAVEL QUOTE BUILDER MULTIPRODUTO (Hospedagem, Aéreo, Transfer, Seguro, Parques, Tours, Carros)
        ↓
REABERTURA DE COTAÇÕES COM VERSIONAMENTO (CotacaoVersao & Audit Snapshot)
        ↓
PROPOSTA COMERCIAL FIXTUR 2.0 MULTIPRODUTO (ProposalViewModel, Marca-d'água & Print A4)
        ↓
VENDAS CANÔNICAS (Sales & Subledger)
        ↓
CONTAS A RECEBER (Receivables & Aging)
        ↓
CONTAS A PAGAR A FORNECEDORES (Payables)
        ↓
CONCILIAÇÃO BANCÁRIA AUTOMÁTICA (Extratos OFX)
        ↓
MOTOR DE COMISSÕES DE CONSULTORES (Accrued → Approved → Paid)
        ↓
CENTRAL DE OPERAÇÕES & SUPORTE A VIAGENS (ITSM & SLA Engine)
        ↓
GESTÃO DE FORNECEDORES & PLANTÃO 24H (Vendor Management)
        ↓
DRE GERENCIAL (P&L) & AUDITORIA DE INTEGRIDADE EM TEMPO REAL
```

---

## 📐 2. Modelo de Dados Relacional Canônico (Prisma)

### 2.1 Entidades Principais
1. **`Usuario`**: Colaboradores autenticados com papéis (`ADMIN`, `AGENTE`, `FINANCEIRO`).
2. **`Cotacao`**, **`HotelCotado`**, **`CanalCotado`**: Motor de cotação hoteleira com precificação RN-01 a RN-10 (`DEFAULT_AGENCY_COMMISSION_PCT = 14%`, Menor Custo, Maior Lucro).
3. **`QuoteProductSection` & `QuoteProductOption`**: Módulo multiproduto extensível para cotação de Aéreo, Transfer, Seguro Viagem, Ingressos, Parques Temáticos, Tours, Locação de Carro e Serviços Personalizados com contratos Zod.
4. **`CotacaoVersao`**: Armazena histórico imutável de snapshots de versões anteriores de cotações reabertas com justificativa obrigatória.
5. **`Sale`**: Âncora financeira imutável de vendas confirmadas com métricas de GMV, custos de fornecedores, receita bruta da agência e margem de contribuição.
6. **`SaleItem`**: Itens hoteleiros e serviços vinculados à venda.
7. **`Receivable`**: Contas a receber parceladas de clientes com controle de Aging.
8. **`Payable`**: Contas a pagar devidas a fornecedores e parceiros hoteleiros.
9. **`Fornecedor`**: Cadastro central de operadoras e fornecedores com telefones de plantão 24h, prazos de faturamento e dados bancários/PIX.
10. **`CommissionPlan` & `ConsultantCommission`**: Motor de comissões de consultores com cálculo transparente sobre a margem/receita da agência e ciclo de vida (`ACCRUED → APPROVED → PAID`).
11. **`ChamadoSuporte`**: Central de chamados de suporte pós-venda a viagens (No-Show, alterações, upgrades, emergências) com radar de SLA em tempo real.
12. **`FinancialAuditLog`**: Registro de auditoria imutável de todas as ações financeiras sensíveis.
13. **`TransacaoFinanceira`**: Extrato financeiro histórico e lançamentos diretos.

---

## 🌐 3. Mapa de Endpoints da API REST

### Cotações & Propostas Comerciais 2.0
- `GET & POST /api/cotacoes`: Gestão de cotações com isolamento de agentes.
- `GET, PUT, PATCH, DELETE /api/cotacoes/[id]`: Visualização, atualização completa, edição rápida de parâmetros (`PATCH`) e exclusão de cotações.
- `POST /api/cotacoes/[id]/hoteis`: Inclusão incremental de novos hotéis e canais a uma cotação existente.
- `PATCH /api/cotacoes/[id]/escolha`: Seleção manual de opções para proposta comercial (`RN-08`).
- `POST /api/sales/from-cotacao/[id]`: Conversão atômica de cotação em Venda Canônica (`Sale`), parcelas de `Receivable`, `Payable` a fornecedores e comissão de consultor.

### Comissões & Painel do Consultor
- `GET /api/comissoes`: Extrato de comissões com RBAC (Agentes veem apenas as suas).
- `GET & POST /api/comissoes/planos`: Gestão de planos de comissão da agência.
- `POST /api/comissoes/lote`: Fechamento e liquidação de lotes de comissões.

### Contas a Receber, Pagar, DRE & Conciliação
- `GET /api/financeiro/recebiveis`: Listagem de recebíveis com Aging (A vencer, 1-7d, 8-15d, 16-30d, >30d).
- `PATCH /api/financeiro/recebiveis/[id]/liquidar`: Baixa de recebimento e liberação automática de comissão.
- `GET /api/financeiro/pagaveis`: Listagem de pagamentos a fornecedores.
- `PATCH /api/financeiro/pagaveis/[id]/liquidar`: Baixa de pagamento a fornecedor com comprovante.
- `GET /api/financeiro/dre`: Demonstrativo de Resultado do Exercício (P&L Gerencial).
- `GET /api/financeiro/dre/export`: Exportação do DRE Gerencial consolidado em CSV.
- `POST /api/financeiro/conciliacao/ofx`: Importação de extrato bancário OFX com liquidação e correspondência automática.

### Operações, Chamados & Fornecedores
- `GET & POST /api/chamados`: Abertura e listagem de chamados com cálculo determinístico de prazos de SLA.
- `PATCH /api/chamados/[id]`: Resolução de chamados com registro de solução e encerramento de SLA.
- `GET & POST /api/fornecedores`: Gestão e cadastro de operadoras hoteleiras e parceiros.

### Performance, Integridade & Câmbio
- `GET /api/financeiro/performance-consultores`: Ranking multidimensional de consultores (GMV, Lucro, Margem %, Ticket Médio, Comissões).
- `GET /api/financeiro/integridade`: Auditoria em tempo real de consistência entre cotações, vendas, recebíveis e comissões.
- `GET /api/exchange`: Cotação de câmbio em tempo real (USD e EUR).

---

## 🖥️ 4. Telas e Interfaces

1. **`/` (Histórico & Cotações)**: Gestão de cotações com busca e filtros.
2. **`/cotacoes/nova`**: Wizard de cotação com cálculo em tempo real e destaques de menor custo e maior venda.
3. **`/cotacoes/[id]`**: Detalhes da cotação com ações "Lançar no Financeiro" e "Visualizar Proposta".
4. **`/cotacoes/[id]/proposta`**: Proposta comercial formatada para visualização, impressão/PDF e WhatsApp.
5. **`/meu-financeiro`**: Extrato individual do consultor com KPIs próprios, comissões provisionadas/pagas e exportação CSV.
6. **`/financeiro`**: Sistema Operacional Financeiro com 7 abas:
   - Fluxo de Caixa
   - Contas a Receber (Aging)
   - Contas a Pagar (Fornecedores)
   - DRE Gerencial (P&L) com exportação CSV
   - Conciliação Bancária OFX
   - Performance de Consultores
   - Auditoria & Integridade
7. **`/chamados`**: Central de Chamados de Operações & Suporte a Viagens com radar de SLA em tempo real.
8. **`/fornecedores`**: Catálogo de operadoras e contatos de plantão 24h para emergências.
9. **`/admin/usuarios`**: Gestão de colaboradores e permissões RBAC.

---

## 🧪 5. Testes Automatizados (Vitest)

Suíte com **29 testes automatizados** passando com 100% de sucesso:
- `tests/calculations.test.ts`: Fórmulas canônicas RN-01 a RN-10.
- `tests/sales_and_commissions.test.ts`: Invariantes de GMV, Lucro da Agência, Comissões e Margem de Contribuição.
- `tests/chamados_itsm.test.ts`: Regras de cálculo de SLA e detecção de violação/risco.
- `tests/ofx_and_notifications.test.ts`: Parser de extratos bancários OFX e formatadores de mensagens WhatsApp.
- `tests/fornecedores.test.ts`: Categorias e termos de faturamento de operadoras.
- `tests/validations.test.ts`: Contratos e esquemas Zod.
- `tests/financial.test.ts`: Cálculos de fluxo de caixa e conversão de moedas.
- `tests/admin_users.test.ts`: Hash bcrypt e integridade de tokens JWT.

Execução: `npm test`
