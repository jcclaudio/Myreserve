# ✈️ FixTur / MyReserve — Sistema Operacional de Viagens, Propostas & Finanças 2.0

> **Plataforma corporativa integrada de Travel Tech:** Travel Quote Builder multiproduto, emissor de propostas comerciais de alto padrão (PDF A4 com suporte a prints/fotos e layout *Midnight Luxury*), gestão financeira canônica (Subledger, Contas a Receber com Aging, Contas a Pagar, DRE), conciliação bancária OFX, painel de comissões do consultor (`/meu-financeiro`), suporte operacional (ITSM/SLA) e deploy automatizado para VPS (Integrator / cPanel / Linux).

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ ou 20+ instalado.

### 2. Instalação e Inicialização
No diretório do projeto, execute:

```bash
# 1. Instalar as dependências pelo lockfile
npm ci

# 2. Sincronizar o banco de dados e popular dados de demonstração
npm run setup

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 3. Primeiro acesso
Defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no seu `.env` local antes do primeiro
`npm run setup`. O seed cria o usuário inicial uma única vez e nunca altera uma senha já existente.

---

## 🌐 Deploy em Produção (VPS Integrator / cPanel / Linux)

O modo `output: 'standalone'` usa um banco SQLite persistente externo ao bundle. Consulte
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) antes de publicar uma nova versão.

### Método Automatizado 1: Via Painel Integrator Node.js / cPanel
1. **Gerar Pacote de Deploy (no seu Windows):**
   ```powershell
   .\gerar-pacote-integrator.ps1
   ```
   *(Gera o arquivo limpo `myreserve-deploy.zip` na raiz do projeto)*.
2. **Upload no Painel:** Acesse o painel da sua VPS (`https://vps10102.panel.icontainer.net:2090/`), abra **Integrator Node.js**, vá na aba **Deploy** e envie o `.zip`.
3. **Registrar Aplicação:**
   - **Node.js:** `20.x` ou `18.x`
   - **Index:** `server.js`
   - **Caminho:** `applications/myreserve`
   - **Modo:** `Produção`
4. **Executar Script no Terminal do Painel:**
   ```bash
   cd applications/myreserve
   bash deploy-integrator.sh
   pm2 start app.yaml
   ```

### Método Automatizado 2: Via Terminal SSH
```bash
ssh usuario@vps10102.panel.icontainer.net
cd applications/myreserve
bash deploy-integrator.sh
pm2 start app.yaml
pm2 save
```

---

## 🌟 Principais Módulos & Funcionalidades

### 1. Travel Quote Builder Multiproduto (`/cotacoes/nova` e `/cotacoes/[id]`)
- **Hierarquia Oficial de Cotação:**
  1. **Passagens Aéreas & Voos Cotados:** Cadastro detalhado de opções com classe tarifária, prints/fotos de itinerários com horários (via upload ou colar com `Ctrl+V`), e regras de bagagem com precificação dupla 100% editável (ex: *Apenas Mão (10kg)* e *1 Mala 23kg Inclusa*).
  2. **Hospedagem & Hotéis Cotados:** Comparação lado a lado de múltiplos canais (Booking.com, BestBuy Travel, Interep, etc.) com **Design Tokens**, cálculo de Menor Custo e **Maior Lucro** (`MAX(gross_profit)`).
  3. **Produtos Turísticos Adicionais:** Modal compacto de 8 categorias para adicionar **Locação de Veículos** (com galeria de fotos e valores alinhados), **Ingressos de Parques Temáticos**, **Seguro Viagem & Assistência**, **Ingressos para Atrações**, **Transfers & Traslados**, **Passeios / Tours** e **Serviços Personalizados**.
- **Comissão Canônica Padrão:** **14,0%** como fonte única da verdade (`DEFAULT_AGENCY_COMMISSION_PCT`) com override individual por canal.
- **Inputs Numéricos Limpos:** Campos visuais limpos sem disputar com zeros automáticos (`""`) e suporte a vírgula/ponto decimal.
- **Reabertura com Versionamento:** Reabertura para correções com justificativa obrigatória e snapshot JSON imutável em `CotacaoVersao`.

### 2. Proposal Engine 2.0 (Proposta Comercial & PDF) (`/cotacoes/[id]/proposta`)
- **Design Editorial Premium & Resumo da Viagem em Linhas:** Cabeçalho executivo noturno (*Midnight Luxury*) distribuído horizontalmente em 2 linhas espaçosas, com ícones dourados em pílula, datas completas e tag de diárias.
- **Hierarquia Visual Padronizada:** Exibição ordenada (Aéreo ➔ Hospedagem ➔ Locação de Veículos ➔ Parques ➔ Seguro ➔ Ingressos ➔ Transfers ➔ Passeios).
- **Suporte Total a Imagens Base64 e Uploads:** Exibição nítida de prints de voos, fotos de veículos e vouchers tanto na tela quanto na exportação para PDF (`window.print()`).
- **Paginação A4 Inteligente (Anti-Orphan):** Regras CSS `@media print` e classes `.proposal-section-block` e `break-after-avoid` que impedem títulos de seções de ficarem isolados no rodapé das páginas.
- **Ocultação Inteligente (RN-08):** Apenas itens marcados como **Opção Selecionada** aparecem na proposta final.
- **Exportação Rápida:** Botões para **Imprimir / Salvar PDF (A4)** e **Copiar para WhatsApp** com texto comercial formatado e emojis.
- **Frase Regulatória Obrigatória:** *"Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio"*.

### 3. Painel do Consultor / Agente (`/meu-financeiro`)
- **Painel Individual & RBAC:** O consultor acompanha em tempo real suas próprias métricas de performance:
  - 📈 **Total em Vendas (GMV):** Volume total de vendas concretizadas pelo agente.
  - ⏳ **Comissão Provisionada (`ACCRUED`):** Comissões em apuração sobre as viagens confirmadas.
  - 💼 **Comissão Aprovada (`APPROVED` / `PAYABLE`):** Valores liberados para pagamento no próximo lote.
  - 🏆 **Total Já Recebido (`PAID`):** Histórico de comissões já repassadas pela agência.
- **Extrato Detalhado & Exportação:** Tabela completa com filtros por status e botão de **Exportar Extrato (CSV)**.

### 4. Sistema Financeiro Geral & Subledger (`/financeiro`)
- **Sincronização Atômica Direta da Cotação:** Botão *"Gerar Financeiro"* que lança e atualiza a Venda Canônica (`Sale`), as Contas a Receber (`Receivable`), as Contas a Pagar dos Fornecedores (`Payable`) e a comissão do consultor (`ConsultantCommission`) para todos os produtos do pacote.
- **Contas a Receber com Régua de Aging:** Controle de recebíveis parcelados com faixas (*A Vencer*, *1-7d*, *8-15d*, *16-30d*, *>30d*).
- **Contas a Pagar:** Gestão de vencimentos e liquidação de repasses para consolidadoras, companhias aéreas, operadoras e hotéis.
- **DRE Gerencial (P&L):** Apuração em tempo real de GMV, Custo de Fornecedores, Lucro Bruto (*Agency Revenue*), Comissões e Margem de Contribuição.
- **Performance de Consultores:** Ranking da equipe por Lucro Bruto Gerado, Ticket Médio e Comissões.
- **Conciliação Bancária OFX:** Parser automático de extratos bancários com matching inteligente por data e valor.
- **Trilha de Auditoria Imutável (`FinancialAuditLog`):** Registro de todas as mutações com usuário, data, IP e payload JSON.

### 5. Central de Operações, Fornecedores & Suporte (ITSM) (`/chamados` e `/fornecedores`)
- **Gestão de Fornecedores:** Catálogo unificado com contatos de plantão 24h, prazo de faturamento e dados bancários/PIX.
- **Central de Chamados:** Atendimento a passageiros e emergências em viagem com radar de SLA em tempo real.

---

## 🧪 Suíte de Testes Automatizados

O sistema conta com **10 suítes de teste** e **49 testes unitários** com 100% de aprovação no Vitest:

```bash
# Executar todos os testes automatizados
npm test
```

### Cobertura de Testes:
- `tests/calculations.test.ts`: Fórmulas financeiras RN-01 a RN-10, precisão total, 14% padrão e cálculo de Maior Lucro.
- `tests/quote_builder.test.ts`: Tokens visuais de fornecedores, sanitização de links e schemas Zod multiproduto.
- `tests/proposal_engine.test.ts`: Normalização UTC de diárias, montagem do ProposalViewModel multiproduto, suporte a imagens e frase obrigatória.
- `tests/financial.test.ts`: Subledger, contas a receber, contas a pagar e integridade financeira.
- `tests/sales_and_commissions.test.ts`: Ciclo de vida de vendas multiproduto (Hotel, Aéreo, Carro, Parques), cálculo de GMV e motor de comissões.
- `tests/fornecedores.test.ts`: Gestão de operadoras e dados de plantão 24h.
- `tests/chamados_itsm.test.ts`: Abertura de chamados, transições de status e radar de SLA.
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

- **Frontend & Backend:** Next.js 14+ (App Router, Standalone mode) + TypeScript + React
- **Estilização & PDF:** Tailwind CSS + Lucide React + CSS `@media print` A4
- **Banco de Dados & ORM:** Prisma ORM com SQLite (local e produção, em volume persistente)
- **Autenticação:** JWT seguro em cookies HTTP-only via `jose` e hashing com `bcryptjs`
- **Validação de Contratos:** Zod
- **Gerenciador de Processos:** PM2 (`app.yaml` / `server.js`)
- **Testes:** Vitest
