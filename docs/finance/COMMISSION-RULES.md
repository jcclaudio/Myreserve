# 📋 REGRAS E MOTOR DE COMISSÕES DE CONSULTORES (FIXTUR)
> **Documento:** `docs/finance/COMMISSION-RULES.md`  
> **Versão:** 1.0.0  

---

## 1. Princípios do Motor de Comissões

1. **Base de Cálculo:** Por padrão, a comissão do consultor é calculada sobre o **Lucro da Agência (`AgencyRevenue`)**, que corresponde ao valor cobrado do cliente menos o custo líquido do fornecedor hoteleiro em reais.
2. **Plano de Comissão Vigente:** Definido em `CommissionPlan` (padrão de 10% sobre o Lucro da Agência).
3. **Ciclo de Vida da Comissão:**
   - `CALCULATED`: Calculada preliminarmente na cotação.
   - `ACCRUED`: Provisionada no momento da confirmação da venda (`Sale`).
   - `APPROVED`: Aprovada após a quitação das parcelas do cliente (`Receivables` pagos).
   - `PAID`: Efetivamente liquidada via lote de pagamento (`POST /api/comissoes/lote`).
   - `REVERSED`: Estornada em caso de cancelamento/reembolso da viagem.

---

## 2. Exemplo de Cálculo Canônico

- **Custo do Fornecedor:** R$ 4.000,00
- **Preço de Venda ao Cliente:** R$ 5.000,00
- **Lucro da Agência (`AgencyRevenue`):** R$ 1.000,00
- **Comissão do Consultor (10%):** R$ 100,00
- **Margem de Contribuição Líquida da Agência:** R$ 900,00
