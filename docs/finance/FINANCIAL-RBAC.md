# 🛡️ MATRIZ DE PERMISSÕES E RBAC FINANCEIRO (FIXTUR)
> **Documento:** `docs/finance/FINANCIAL-RBAC.md`  
> **Versão:** 1.0.0  
> **Status:** ATIVO  

---

## 1. Perfis de Acesso

1. **`ADMIN` (Super Administrador / Diretoria)**:
   - Acesso irrestrito a todas as vendas, cotações, DRE gerencial, custos de fornecedores, comissões globais, planos de comissionamento e gestão de usuários.
2. **`FINANCEIRO` (Controladoria / Gestão Financeira)**:
   - Acesso total ao módulo `/financeiro`, contas a receber (`Receivables`), contas a pagar (`Payables`), conciliação, ranking de consultores, relatórios e DRE gerencial.
   - Não altera permissões de outros administradores.
3. **`AGENTE` (Consultor de Viagens)**:
   - Acesso exclusivo às suas próprias cotações (`Cotacao`) e ao painel individual **"Meu Financeiro"** (`/meu-financeiro`).
   - Visualiza apenas o seu GMV, comissões provisionadas/pagas e extrato individual.
   - **Bloqueio Estrito:** Não tem acesso a custos globais da agência, despesas operacionais ou comissões de outros consultores.

---

## 2. Matriz de Operações por Rota

| Funcionalidade / API | `ADMIN` | `FINANCEIRO` | `AGENTE` |
| :--- | :---: | :---: | :---: |
| **Criar Cotação** (`/cotacoes/nova`) | ✅ Sim | ✅ Sim | ✅ Sim |
| **Ver Cotações de Outros** (`/`) | ✅ Sim | ✅ Sim | ❌ **Apenas as Próprias** |
| **Meu Financeiro** (`/meu-financeiro`) | ✅ Sim | ✅ Sim | ✅ **Apenas as Próprias** |
| **Financeiro Geral** (`/financeiro`) | ✅ Sim | ✅ Sim | ❌ **Acesso Negado (403)** |
| **DRE Gerencial** (`/api/financeiro/dre`) | ✅ Sim | ✅ Sim | ❌ **Acesso Negado (403)** |
| **Baixa em Recebíveis/Pagáveis** | ✅ Sim | ✅ Sim | ❌ **Acesso Negado (403)** |
| **Criar/Editar Planos de Comissão** | ✅ Sim | ❌ Somente Leitura | ❌ **Acesso Negado (403)** |
| **Gestão de Usuários** (`/admin/usuarios`) | ✅ Sim | ❌ Somente Leitura | ❌ **Acesso Negado (403)** |
