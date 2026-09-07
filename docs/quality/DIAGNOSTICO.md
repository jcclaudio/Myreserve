# Diagnóstico Técnico de Qualidade, Segurança e Integridade — FixTur / MyReserve

Este documento consolida a auditoria estática e dinâmica realizada no ecossistema do FixTur / MyReserve, conforme estipulado pelas diretrizes de governança técnica.

---

## 1. Sumário de Apontamentos por Severidade

| Severidade | Total | Corrigidos | Mitigados | Riscos Residuais Aceitos |
| :--- | :---: | :---: | :---: | :---: |
| 🔴 **Crítico** | 4 | 4 | 0 | 0 |
| 🟠 **Alto** | 4 | 4 | 0 | 0 |
| 🟡 **Médio** | 3 | 3 | 0 | 0 |
| 🟢 **Baixo / Documentação** | 2 | 2 | 0 | 0 |
| **Total** | **13** | **13** | **0** | **0** |

---

## 2. Detalhamento dos Apontamentos

### [SEC-01] 🔴 Falha de Autorização Horizontal (IDOR) no Ciclo de Vida de Cotações
- **Severidade:** Crítico (CVSS ~8.5)
- **Componentes:**
  - `src/app/api/cotacoes/[id]/route.ts` (GET, PUT, PATCH, DELETE)
  - `src/app/api/cotacoes/[id]/reabrir/route.ts` (POST)
  - `src/app/api/cotacoes/[id]/escolha/route.ts` (PATCH)
  - `src/app/api/cotacoes/[id]/hoteis/route.ts` (POST)
  - `src/app/api/cotacoes/[id]/sections/route.ts` (GET, POST, PUT, DELETE)
  - `src/app/api/cotacoes/[id]/sections/[sectionId]/options/route.ts` (POST, PATCH)
- **Descrição:** Consultores logados com perfil `AGENTE` podiam inspecionar, alterar diárias/margens, adicionar seções ou deletar cotações pertencentes a outros consultores da agência simplesmente enviando o UUID da cotação de terceiros no endpoint.
- **Reprodução:** Autenticar com credenciais de Agente A; disparar `DELETE /api/cotacoes/{uuid-de-agente-b}` ou `PATCH /api/cotacoes/{uuid-de-agente-b}`. A operação retornava 200 OK sem validar se `cotacao.criado_por_usuario_id === user.id`.
- **Impacto:** Violação de privacidade comercial, vazamento de clientes de outros agentes, adulteração maliciosa ou acidental de margens e propostas concorrentes.
- **Correção Aplicada:** Implementada verificação de propriedade server-side:
  ```typescript
  if (user.role !== "ADMIN" && cotacao.criado_por_usuario_id && cotacao.criado_por_usuario_id !== user.id) {
    return NextResponse.json({ error: "Acesso não autorizado a esta cotação." }, { status: 403 });
  }
  ```
- **Status:** **Corrigido** (coberto por testes automatizados em `tests/quality_security_rbac.test.ts`).

---

### [SEC-02] 🔴 Conversão Desautorizada de Cotação em Venda e Importação de Prisma Quebrada
- **Severidade:** Crítico
- **Componente:** `src/app/api/sales/from-cotacao/[id]/route.ts`
- **Descrição:** O endpoint permitia que qualquer agente gerasse uma venda oficial e vinculasse pagáveis em nome de outro consultor. Além disso, o arquivo possuía uma falha de compilação/execução (`ReferenceError: prisma is not defined`).
- **Impacto:** Criação indevida de vendas e erro fatal 500 no runtime.
- **Correção Aplicada:** Importação de `@/lib/prisma` corrigida e validação de `ADMIN` ou autor da cotação implementada antes da invocação de `createSaleFromCotacao`.
- **Status:** **Corrigido**.

---

### [SEC-03] 🔴 Quebra de Segregação de Funções: Liquidação Arbitrária de Recebíveis por Agente
- **Severidade:** Crítico
- **Componente:** `src/app/api/financeiro/recebiveis/[id]/liquidar/route.ts`
- **Descrição:** O endpoint que marca uma parcela ou recebível como `PAID` e aciona o subledger não validava o perfil do usuário, permitindo que consultores operacionais liquidassem títulos a receber sem conferência financeira real de extrato bancário.
- **Impacto:** Fraude potencial ou baixa indevida de títulos sem confirmação de entrada no caixa da empresa.
- **Correção Aplicada:** Bloqueio estrito de papéis não autorizados:
  ```typescript
  if (user.role !== "ADMIN" && user.role !== "FINANCEIRO") {
    return NextResponse.json({ error: "Apenas administradores e equipe financeira podem liquidar títulos." }, { status: 403 });
  }
  ```
- **Status:** **Corrigido**.

---

### [FIN-01] 🔴 Conciliação OFX com Baixa Automática Cega (`findFirst` sem Validação de Ambiguidade)
- **Severidade:** Crítico
- **Componente:** `src/app/api/financeiro/conciliacao/ofx/route.ts`
- **Descrição:** O parser de extratos bancários localizava o primeiro recebível com tolerância de R$ 0,05 (`findFirst`) e liquidava automaticamente. Se houvesse dois clientes com parcelas de mesmo valor (ex: R$ 500,00) no mesmo vencimento, o sistema liquidava a parcela errada aleatoriamente.
- **Impacto:** Baixa errônea em contas de clientes, cobrança indevida de cliente adimplente e inadimplência oculta.
- **Correção Aplicada:** Substituído `findFirst` por `findMany`. Se mais de 1 recebível for localizado dentro do range de tolerância sem identificador inequívoco, a operação é sinalizada como `ambiguo: true`, evitando baixa automática destrutiva e exigindo conferência humana do analista financeiro. Adicionalmente, completou-se o ciclo de auditoria com liberação de comissões e marcação da venda como `PAID`.
- **Status:** **Corrigido**.

---

### [FIN-02] 🟠 Perda Centesimal em Parcelamento de Vendas (Dízima em Float)
- **Severidade:** Alto
- **Componente:** `src/lib/sales-service.ts`
- **Descrição:** O cálculo de parcelas dividia o valor bruto pelo número de parcelas aplicando `round2(valor / total)`. Para valores como R$ 100,00 em 3 parcelas, gerava 3 x R$ 33,33 = R$ 99,99, perdendo R$ 0,01 a cada venda. Em volumes altos, provocava desbalanceamento contábil entre a venda (`gross_sale_amount`) e a soma dos recebíveis.
- **Impacto:** Descompasso no balanço, DRE impreciso e problemas em conciliações contábeis.
- **Correção Aplicada:** Implementado algoritmo canônico de conservação de centavos onde a última parcela absorve o saldo residual:
  ```typescript
  if (p === installmentCount) {
    installmentAmount = round2(grossAmount - allocatedInstallmentSum);
  } else {
    installmentAmount = round2(grossAmount / installmentCount);
    allocatedInstallmentSum = round2(allocatedInstallmentSum + installmentAmount);
  }
  ```
- **Status:** **Corrigido** (testado para 3x, 6x, 7x e valores complexos em `tests/quality_financial_integrity.test.ts`).

---

### [FIN-03] 🟠 Risco de Vendas Duplicadas a Partir da Mesma Cotação
- **Severidade:** Alto
- **Componente:** `src/lib/sales-service.ts`
- **Descrição:** Não havia bloqueio idempotente ao chamar `createSaleFromCotacao`. Cliques múltiplos ou requisições concorrentes podiam instanciar múltiplas vendas `Sale` ativas com seus respectivos lotes de recebíveis e pagáveis para uma única cotação confirmada.
- **Impacto:** Faturamento duplicado, contas a pagar dobradas a fornecedores e métricas de vendas infladas.
- **Correção Aplicada:** Inserida checagem prévia se já existe `Sale` ativa (`status !== "CANCELLED"`) referenciando a `cotacao_id`.
- **Status:** **Corrigido**.

---

### [SEC-04] 🟠 Vazamento de Dados Financeiros em Contas a Pagar (`/api/financeiro/pagaveis`)
- **Severidade:** Alto
- **Componente:** `src/app/api/financeiro/pagaveis/route.ts`
- **Descrição:** Ao listar contas a pagar da agência, qualquer usuário com perfil `AGENTE` recebia todos os títulos a pagar da empresa (inclusive fornecedores corporativos e custos gerais), sem filtragem pelo seu próprio escopo de atendimento.
- **Impacto:** Exposição de custos internos, faturas corporativas globais e margens de outros consultores.
- **Correção Aplicada:** Adicionado filtro automático onde, se `user.role === "AGENTE"`, a consulta restringe-se estritamente aos pagáveis vinculados às vendas do próprio consultor (`where.sale = { consultor_id: user.id }`).
- **Status:** **Corrigido**.

---

### [SEC-05] 🟠 Geração Indevida de PIX e Modificação Desautorizada de Chamados
- **Severidade:** Alto
- **Componentes:**
  - `src/app/api/financeiro/recebiveis/[id]/pix/route.ts`
  - `src/app/api/chamados/[id]/route.ts`
- **Descrição:**
  - Em `/pix`, um agente podia emitir cobrança PIX para vendas de terceiros.
  - Em `/chamados/[id]`, qualquer agente autenticado podia alterar status, prioridade e atribuídos de chamados operacionais abertos por outros agentes ou atribuídos à diretoria.
- **Impacto:** Desvio de cobrança ou desorganização crítica do atendimento ao viajante (ITSM).
- **Correção Aplicada:**
  - Geração de PIX agora valida se a venda pertence ao agente ou se o usuário é `ADMIN`/`FINANCEIRO`.
  - Edição de chamado valida se o usuário é `ADMIN`, o criador do ticket ou o consultor designado no atendimento.
- **Status:** **Corrigido**.

---

### [SEC-06] 🟡 CSV Formula Injection / CSV Injection (CWE-1236)
- **Severidade:** Médio
- **Componentes:**
  - `src/app/meu-financeiro/page.tsx`
  - `src/app/api/financeiro/dre/export/route.ts`
- **Descrição:** Exportações CSV de extrato de comissões e DRE concatenavam strings diretamente sem sanitização de caracteres executáveis (`=`, `+`, `-`, `@`, `\t`, `\r`). Nomes de fornecedores, clientes ou observações cadastradas com valores como `=cmd|' /C calc'!A0` podiam ser executados pelo Microsoft Excel ao abrir a planilha.
- **Impacto:** Execução arbitrária de fórmulas ou comandos via phishing indireto em máquinas corporativas do financeiro.
- **Correção Aplicada:** Criado módulo sanitizador canônico RFC 4180 (`src/lib/csv-sanitizer.ts`) com prefixação de apóstrofo `'` em fórmulas perigosas e escape estrito de aspas e delimitadores.
- **Status:** **Corrigido** (coberto por testes em `tests/quality_financial_integrity.test.ts`).

---

### [ARCH-01] 🟡 Divergência de Arquitetura de Banco de Dados (MySQL 8.0 vs Menções a SQLite)
- **Severidade:** Médio
- **Componentes:**
  - `scripts/runtime-config.js`
  - `README.md`
  - `docs/DEPLOYMENT.md`
  - `docs/finance/00-current-state.md`
  - `SYSTEM_SPEC_FOR_AI.md`
- **Descrição:** `prisma/schema.prisma` e os arquivos de Docker Compose definem claramente **MySQL 8.0**, porém o script `runtime-config.js` exigia um arquivo de banco SQLite (`dev.db`), bloqueando o startup do backend caso a string `DATABASE_URL` não fosse um caminho de arquivo `.db`. Documentos auxiliares também continham referências obsoletas a SQLite.
- **Impacto:** Quebra de scripts de validação de ambiente, confusão operacional no deploy e falha no suporte a conexões remotas MySQL.
- **Correção Aplicada:** Refatorado `scripts/runtime-config.js` para validar strings MySQL (`mysql://...`) mantendo compatibilidade legada; corrigidas todas as documentações e manuais para refletir unicamente MySQL 8.0.
- **Status:** **Corrigido**.

---

### [LINT-01] 🟡 Ausência de Linter Configurado e Entidades JSX Não Escapadas
- **Severidade:** Médio
- **Componentes:**
  - `.eslintrc.json`
  - `package.json`
  - `src/app/fornecedores/page.tsx`
- **Descrição:** O comando `npm run lint` falhava pois as dependências `eslint` e `eslint-config-next` não estavam no projeto e o arquivo `.eslintrc.json` inexistia. Além disso, `src/app/fornecedores/page.tsx` continha aspas duplas brutas no JSX (`react/no-unescaped-entities`).
- **Impacto:** Impossibilidade de validação de esteira CI/CD e potenciais problemas de parser no Next.js.
- **Correção Aplicada:** Instaladas dependências de linter oficiais, criado `.eslintrc.json` com `@next/next/recommended` e corrigidas aspas no JSX.
- **Status:** **Corrigido** (`npm run lint` passa com código 0).

---

### [DOC-01] 🟢 Especificação Desatualizada da Stack e Comissões
- **Severidade:** Baixo
- **Componentes:** `SYSTEM_SPEC_FOR_AI.md`, `README.md`
- **Descrição:** Especificação antiga citava SQLite/PostgreSQL e modelo de comissionamento dinâmico em vez de MySQL 8.0 e comissão fixa de 10%.
- **Correção Aplicada:** Alinhada a documentação com as diretrizes do projeto e decisões homologadas.
- **Status:** **Corrigido**.

---

## 3. Matriz de Rastreabilidade das Ações

| Identificador | Categoria | Ação Realizada | Verificação Automatizada |
| :--- | :--- | :--- | :--- |
| SEC-01 | Segurança / RBAC | Ownership check em rotas `/api/cotacoes/[id]/*` | `tests/quality_security_rbac.test.ts` |
| SEC-02 | Segurança & Runtime | Correção de importação do Prisma e auth check | `tests/quality_security_rbac.test.ts` + `tsc` |
| SEC-03 | Governança Financeira | Restrição de baixa de títulos a ADMIN/FINANCEIRO | `tests/quality_security_rbac.test.ts` |
| SEC-04 | Proteção de Dados | Escopo de pagáveis limitado ao consultor da venda | `tests/quality_security_rbac.test.ts` |
| SEC-05 | Segurança Operacional | Validação de dono em PIX e tickets de atendimento | `tests/quality_security_rbac.test.ts` |
| SEC-06 | Integridade de Dados | Sanitização contra CSV Injection (CWE-1236) | `tests/quality_financial_integrity.test.ts` |
| FIN-01 | Integridade Contábil | Desambiguação e ciclo completo de conciliação OFX | `tests/ofx_and_notifications.test.ts` |
| FIN-02 | Precisão Centesimal | Algoritmo de conservação de centavos na última parcela | `tests/quality_financial_integrity.test.ts` |
| FIN-03 | Concorrência | Bloqueio de vendas duplicadas a partir de cotação | `tests/sales_and_commissions.test.ts` |
| ARCH-01 | Infraestrutura | Alinhamento com MySQL 8.0 e descarte de SQLite | `scripts/runtime-config.js` + Typecheck |
| LINT-01 | Qualidade de Código | Instalação de ESLint, config Next e escape JSX | `npm run lint` |
| DOC-01 | Documentação | Atualização do README e Especificações de Sistema | Inspeção textual |
