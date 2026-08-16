# 📘 GUIA OPERACIONAL DO FINANCEIRO (RUNBOOK FIXTUR)
> **Documento:** `docs/finance/FINANCE-OPERATIONS-RUNBOOK.md`  
> **Versão:** 1.0.0  

---

## 1. Rotina Diária da Agência

1. **Agente/Consultor**:
   - Elabora a cotação no Wizard (`/cotacoes/nova`) inserindo opções de canais hoteleiros.
   - Envia a proposta gerada (`/cotacoes/[id]/proposta`) para o cliente.
   - Ao receber o aceite do cliente, clica em **"Lançar no Financeiro"** na tela da cotação.
   - Acompanha suas comissões em **"Meu Financeiro"** (`/meu-financeiro`).

2. **Equipe Financeira / Controladoria**:
   - Acessa o **Financeiro Geral** (`/financeiro`).
   - Confere os **Recebíveis (Aging)** do dia e dá baixa nas parcelas pagas por PIX, Cartão ou Boleto.
   - Confere os **Pagáveis a Fornecedores** com vencimento no dia e registra o pagamento com comprovante.
   - Acompanha o **DRE Gerencial** (`/api/financeiro/dre`) e a margem de contribuição.

3. **Fechamento Mensal de Comissões**:
   - O gestor acessa `/api/comissoes/lote` para fechar o lote de comissões aprovadas dos consultores e emitir o extrato consolidado.

---
*Fim do Runbook Operacional.*
