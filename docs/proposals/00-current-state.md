# 📋 RELATÓRIO DE AUDITORIA DO GERADOR DE PROPOSTAS — FIXTUR PROPOSAL ENGINE
> **Documento:** `docs/proposals/00-current-state.md`  
> **Fase:** FASE 0 — REALITY CHECK & AUDITORIA INICIAL  
> **Status:** AUDITADO / COMPLETO  
> **Data:** 15/08/2026  

---

## 1. PROPOSAL ENGINE FOUND
* **Localização Principal:** `src/app/cotacoes/[id]/proposta/page.tsx`.
* **Natureza:** Componente React Client-side integrado ao App Router do Next.js 14.
* **Modelo de Seleção:** Exibe exclusivamente opções hoteleiras marcadas com `escolhido_manual: true` (Regra Canônica RN-08).

---

## 2. PDF ENGINE
* **Solução Atual:** Mecanismo nativo do browser acionado via `window.print()` com classes CSS `@media print` e Tailwind `print:*`.
* **Prós:** Zero dependências pesadas em runtime, renderização 100% fiel ao DOM e fontes do navegador.
* **Pontos de Melhoria Identificados:** 
  - Falta controle explícito de quebra de página A4 (`page-break-inside: avoid`, `break-inside: avoid`).
  - Falta cabeçalho repetido em páginas subsequentes e numeração formal "Página X de Y".
  - Falta marca-d'água vetorial de segurança institucional no fundo de todas as páginas impressas.

---

## 3. WEB PREVIEW
* **URL:** `/cotacoes/[id]/proposta`.
* **Funcionalidades Existentes:** 
  - Botão de retorno à cotação interna;
  - Botão de cópia de proposta formatada para WhatsApp;
  - Botão de impressão / salvar em PDF.

---

## 4. DATA FLOW
```text
Prisma Database (Cotacao + HotelCotado + CanalCotado + Usuario)
         ↓
API Endpoint (GET /api/cotacoes/[id])
         ↓
React Page State (src/app/cotacoes/[id]/proposta/page.tsx)
    ├── Copiar WhatsApp (Texto Puro)
    └── Renderização DOM → window.print() (PDF/Impressão)
```

---

## 5. TEMPLATE
* **Estrutura Atual:** Monolítica dentro de `proposta/page.tsx`.
* **Arquitetura Alvo (Modular 2.0):**
  ```text
  src/components/proposal/
  ├── ProposalDocument.tsx
  ├── ProposalHeader.tsx
  ├── ProposalTripSummary.tsx
  ├── ProposalHotelCard.tsx
  ├── ProposalImportantInfo.tsx
  ├── ProposalWatermark.tsx
  └── ProposalFooter.tsx
  ```

---

## 6. BRAND ASSETS
* **Logo Oficial:** Vetor SVG presente em `src/components/FixLogo.tsx` (Versões Dark, Light e Gold com Globo em fitas estilizadas).
* **Paleta Oficial:**
  - Azul Institucional Primário: `#1b3252` (`brand-900` / `fixnavy-900`) e `#9CAFCE` (`brand-400`);
  - Dourado / Marfim Institucional: `#d5b67a` (`gold-400`) e `#ede2c6` (`gold-200`);
  - Superfícies: `#fcfaf4` (`gold-50`) e `#ffffff`.

---

## 7. DATA SOURCES
* `Cotacao.cliente_nome` (Cliente);
* `Cotacao.destino` (Destino);
* `Cotacao.data_ida` e `Cotacao.data_volta` (Datas e cálculo de diárias);
* `Cotacao.adultos`, `Cotacao.criancas`, `Cotacao.idades_criancas`, `Cotacao.quartos` (Passageiros e acomodação);
* `HotelCotado.hotel_nome` (Hotel);
* `CanalCotado.categoria_quarto` (Quarto);
* `CanalCotado.cafe_da_manha` (Regime);
* `CanalCotado.reembolsavel_ate` (Cancelamento);
* `CanalCotado.valor_final_venda` (Preço comercial da agência com taxas);
* `Usuario.nome` e `Usuario.email` (Consultor responsável).

---

## 8. BUGS & DATA INCONSISTENCIES IDENTIFICADOS
1. **Cálculo de Diárias com Timezone:** O cálculo de dias entre `data_ida` e `data_volta` precisa garantir normalização UTC para evitar divergência de 1 dia dependendo do fuso do navegador do cliente.
2. **Identificador Amigável:** O cabeçalho exibe "PROPOSTA DE HOSPEDAGEM", mas não exibe o código amigável da proposta (ex: `FT-PROP-2026-000124`), apenas o ID interno no link.
3. **Frase Obrigatória de Disclaimer:** A frase final de encerramento deve ser ajustada para a diretriz exata da FixTur:
   > *"Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio"*

---

## 9. VISUAL GAPS
1. Ausência de **Marca-d'água institucional** de segurança de baixa opacidade no fundo das páginas.
2. Ausência de moldura e grid específico para **Folha A4 Portrait (210mm x 297mm)** com margens adequadas.
3. Necessidade de maior sofisticação nos **Badges de Condição** (Café da manhã, Cancelamento e Taxas).

---

## 10. SECURITY & PRIVACY GAPS
1. **Dados Internos Ocultos com Sucesso:** Custos de fornecedores, markups, comissões de agentes e descontos de canais não aparecem na proposta do cliente (100% protegido).
2. **Dados Pessoais:** Ocultados passaportes e CPFs, mantendo apenas nome do viajante (LGPD compliant).

---

## 11. TEST COVERAGE
* Testes existentes cobrem cálculo de margem e precificação de cotações (`tests/calculations.test.ts`).
* **Necessário adicionar:** Suíte de testes dedicada `tests/proposal_engine.test.ts` validando:
  - Invariante de diárias (ex: 21/12 a 30/12 = 9 diárias exatas);
  - Formatação monetária BRL;
  - Regras de cancelamento e taxas;
  - Integridade do ProposalViewModel.

---

## 12. FILES LIKELY TO CHANGE
* `src/app/cotacoes/[id]/proposta/page.tsx`
* `src/components/proposal/*` (Novos componentes modulares da proposta)
* `src/lib/proposal-service.ts` (ProposalViewModel e montador canônico)
* `tests/proposal_engine.test.ts` (Nova suíte de testes de integridade da proposta)

---

## 13. RECOMMENDED IMPLEMENTATION PLAN (SEQUÊNCIA CONTROLADA)
* **Fase 1:** Correção da integridade de dados e cálculo canônico de diárias (UTC).
* **Fase 2:** Criação do `ProposalViewModel` e `proposal-service.ts`.
* **Fase 3:** Criação dos componentes modulares e marca-d'água institucional FixTur.
* **Fase 4:** Redesign do Cabeçalho com código amigável `FT-PROP-...`.
* **Fase 5:** Redesign do Card de Resumo da Viagem.
* **Fase 6:** Redesign do Hotel Option Card e Card de Preço.
* **Fase 7:** Informações Importantes e Frase Obrigatória Exata.
* **Fase 8:** Rodapé institucional e paginação A4 com CSS print hardening.
* **Fase 9:** Suíte de testes unitários e de integridade `tests/proposal_engine.test.ts`.
