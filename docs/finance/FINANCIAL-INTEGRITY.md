# 🔍 PROTOCOLO DE INTEGRIDADE FINANCEIRA E CONCILIAÇÃO
> **Documento:** `docs/finance/FINANCIAL-INTEGRITY.md`  
> **Versão:** 1.0.0  

---

## 1. Regras de Integridade do Sistema

1. **Equação de Consistência de Vendas:**
   $$\text{GMV} = \text{Custo Fornecedores} + \text{Receita da Agência}$$
2. **Equação de Margem de Contribuição:**
   $$\text{Margem de Contribuição} = \text{Receita da Agência} - \text{Comissão Consultores} - \text{Taxas Meios Pgto}$$
3. **Consistência de Recebíveis:**
   $$\text{Venda Líquida} = \sum \text{Receivable.valor\_parcela}$$
4. **Consistência de Pagáveis:**
   $$\text{Custo Fornecedores} = \sum \text{Payable.valor\_brl}$$

---

## 2. Diagnóstico em Tempo Real

A API `/api/financeiro/integridade` executa verificações automáticas de:
* Vendas órfãs sem recebíveis;
* Vendas com custos de fornecedor sem contas a pagar vinculadas;
* Vendas sem provisionamento de comissão de consultor;
* Discrepâncias de arredondamento.
