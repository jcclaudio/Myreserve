# PROMPT MESTRE — Sistema de Cotação de Hospedagens (Agência de Viagens)

> Cole este prompt inteiro em uma sessão nova de um assistente de IA capaz de programar
> (ex: Claude Code, Cursor, etc.) para que ele construa o sistema descrito abaixo do zero,
> sem precisar de perguntas adicionais além das listadas em "Lacunas em aberto" no final.

---

## 1. PAPEL

Você é um engenheiro de software full-stack sênior, especialista em construir ferramentas
internas (SaaS leve) para operações B2B, com domínio sólido em modelagem de dados financeiros
(câmbio, comissões, precificação com arredondamento correto) e em interfaces operacionais
simples, rápidas de usar sob pressão de tempo — o perfil de quem projeta ferramentas internas
para equipes de vendas/operações, não produtos de consumo.

## 2. CONTEXTO

O sistema é para uma **agência de viagens**. O fluxo de trabalho atual é manual: quando um
cliente pede uma cotação de hospedagem, o agente de viagens cota o mesmo hotel em diferentes
canais de venda (ex.: Booking, Best Buy, Interep — a lista de canais varia por cotação, não é
fixa), anota os valores em uma planilha, converte manualmente de EUR/USD para BRL, calcula a
comissão do fornecedor, a comissão de venda da agência e o valor final a cobrar do cliente, e
por fim decide qual opção oferecer.

**Usuários finais:** vários agentes de viagem da agência, cada um autenticado no sistema.
**Ambiente:** aplicação web, acessada via navegador, uso diário e repetido (múltiplas cotações
por dia, por vários agentes ao mesmo tempo).

Uma cotação real de referência (dados de exemplo, já anonimizados o suficiente para servir de
modelo) segue no Caso de Teste 1, seção 7 — use esses números exatos para validar que a lógica
de cálculo está correta antes de considerar o sistema pronto.

## 3. OBJETIVO

Construir um sistema web multiusuário onde um agente de viagens: (a) cadastra os dados de uma
cotação para um cliente (destino, datas, viajantes); (b) adiciona um ou mais hotéis cotados,
cada um com um ou mais canais de venda e seus respectivos valores; (c) recebe automaticamente
os cálculos de comissão, conversão de moeda e valor final de venda; (d) vê destacada
automaticamente a melhor opção de custo e a melhor opção de valor de venda dentro de cada
hotel; (e) confirma manualmente qual opção foi escolhida; (f) consulta o histórico de cotações
já feitas, por cliente ou data; e (g) gera uma proposta final formatada, sem dados de custo ou
comissão, pronta para enviar ao cliente.

## 4. ENTREGÁVEIS

1. Aplicação web completa (frontend + backend), executável localmente com um único comando
   documentado no README (`[A CONFIRMAR]` comando exato — depende da stack, ver seção 9).
2. Migrations/schema do banco de dados versionados no repositório.
3. `README.md` com: passos de instalação, variáveis de ambiente necessárias (arquivo
   `.env.example` incluído), como rodar em modo desenvolvimento, como rodar os testes.
4. Suíte de testes automatizados cobrindo, no mínimo, todas as regras de negócio da seção 6 e
   todos os casos de teste da seção 7.
5. Página/rota de geração da **proposta ao cliente** (ver RN-08), exportável em PDF.

## 5. CONTRATO DE DADOS

### 5.1 Entidade `Usuario` (agente da agência)
| Campo | Tipo | Obrigatório | Default | Se nulo/inválido |
|---|---|---|---|---|
| id | uuid | sim | gerado | — |
| nome | string | sim | — | rejeitar cadastro |
| email | string (formato e-mail válido) | sim | — | rejeitar cadastro |
| senha_hash | string | sim | — | rejeitar cadastro |

### 5.2 Entidade `Cotacao` (uma cotação completa para um cliente)
| Campo | Tipo | Obrigatório | Default | Se nulo/inválido |
|---|---|---|---|---|
| id | uuid | sim | gerado | — |
| criado_por_usuario_id | uuid (FK Usuario) | sim | usuário logado | rejeitar |
| cliente_nome | string | sim | — | rejeitar |
| destino | string | sim | — | rejeitar |
| data_ida | date | sim | — | rejeitar se `data_ida >= data_volta` |
| data_volta | date | sim | — | rejeitar se `data_volta <= data_ida` |
| adultos | integer ≥ 1 | sim | — | rejeitar se < 1 |
| criancas | integer ≥ 0 | não | 0 | tratar nulo como 0 |
| idades_criancas | array de integer (0–17) | condicional | `[]` | obrigatório ter `length == criancas`; se não bater, erro de validação explícito (não truncar nem preencher) |
| quartos | integer ≥ 1 | sim | — | rejeitar se < 1 |
| cotacao_usd | decimal(10,4) | sim | buscado automaticamente (RN-09) | agente pode sobrescrever manualmente |
| cotacao_eur | decimal(10,4) | sim | buscado automaticamente (RN-09) | agente pode sobrescrever manualmente |
| comissao_padrao_agencia_pct | decimal(5,2), 0–100 | sim | último valor usado pelo agente, ou `[A CONFIRMAR]` no primeiro uso | usado só como sugestão default para novos canais (RN-07) |
| criado_em | timestamp | sim | agora | — |

### 5.3 Entidade `HotelCotado` (um hotel dentro de uma cotação — pode haver vários por cotação)
| Campo | Tipo | Obrigatório | Default | Se nulo/inválido |
|---|---|---|---|---|
| id | uuid | sim | gerado | — |
| cotacao_id | uuid (FK Cotacao) | sim | — | — |
| hotel_nome | string | sim | — | rejeitar |
| ordem_exibicao | integer | não | ordem de criação | — |

Cada `HotelCotado` deve ter **pelo menos um** `CanalCotado` associado (invariante, seção 8).

### 5.4 Entidade `CanalCotado` (um canal de venda dentro de um hotel — Booking, Best Buy, Interep, ou qualquer outro nome digitado pelo agente; a lista de canais é livre, não fixa)
| Campo | Tipo | Obrigatório | Default | Se nulo/inválido |
|---|---|---|---|---|
| id | uuid | sim | gerado | — |
| hotel_cotado_id | uuid (FK HotelCotado) | sim | — | — |
| canal_nome | string | sim | — | rejeitar |
| valor_mostrado | decimal(12,2), > 0 | sim | — | rejeitar se ≤ 0 |
| moeda | enum `BRL` \| `USD` \| `EUR` | sim | — | rejeitar outro valor |
| comissao_fornecedor_pct | decimal(5,2), 0–100 | sim | — | rejeitar fora da faixa |
| comissao_venda_pct | decimal(5,2), 0–99.99 | sim | `comissao_padrao_agencia_pct` da cotação | rejeitar se ≥ 100 (ver RN-05, evita divisão por zero/negativo) |
| categoria_quarto | string | sim | — | rejeitar |
| cafe_da_manha | boolean | sim | — | — |
| reembolsavel_ate | date ou `null` | não | `null` (= não reembolsável) | — |
| observacoes | string | não | `""` | — |
| escolhido_manual | boolean | não | `false` | campo que o agente marca manualmente como decisão final; independente do destaque automático (RN-06) |
| — campos calculados abaixo, nunca inseridos pelo usuário — | | | | |
| valor_comissao | decimal(12,2) | calculado | RN-01 | — |
| custo_liquido | decimal(12,2) | calculado | RN-02 | — |
| cotacao_utilizada | decimal(10,4) | calculado | RN-03 | — |
| custo_em_brl | decimal(12,2) | calculado | RN-04 | — |
| valor_final_venda | decimal(12,2) | calculado | RN-05 | — |
| menor_custo_do_grupo | boolean | calculado | RN-06 | — |
| maior_venda_do_grupo | boolean | calculado | RN-06 | — |

## 6. REGRAS DE NEGÓCIO

Todas as regras abaixo foram **verificadas matematicamente** contra a cotação real de
referência (seção 7, Caso de Teste 1) — não são suposições, são fórmulas confirmadas.

- **RN-01 — Valor da comissão do fornecedor:**
  `valor_comissao = valor_mostrado × (comissao_fornecedor_pct / 100)`

- **RN-02 — Custo líquido:**
  `custo_liquido = valor_mostrado − valor_comissao`

- **RN-03 — Cotação utilizada para conversão:**
  Se `moeda == "BRL"` → `cotacao_utilizada = 1`.
  Se `moeda == "USD"` → `cotacao_utilizada = cotacao_usd` da `Cotacao` pai.
  Se `moeda == "EUR"` → `cotacao_utilizada = cotacao_eur` da `Cotacao` pai.

- **RN-04 — Custo em reais:**
  `custo_em_brl = custo_liquido × cotacao_utilizada`

- **RN-05 — Valor final de venda:**
  `valor_final_venda = custo_em_brl / (1 − comissao_venda_pct / 100)`
  Como `comissao_venda_pct` é validado como `< 100` no contrato de dados (seção 5.4), o
  denominador nunca é zero ou negativo — não implementar clamp silencioso, a validação de
  entrada já impede o caso inválido.

- **RN-06 — Destaque automático (menor custo / maior venda):**
  O agrupamento para comparação é **por `HotelCotado`** — ou seja, compara-se entre os
  `CanalCotado` que pertencem ao mesmo hotel (mesma linha de hotel/quarto cotado), nunca entre
  hotéis diferentes. Dentro de cada grupo: o canal com o **menor** `custo_em_brl` recebe
  `menor_custo_do_grupo = true` (os demais `false`); o canal com o **maior** `valor_final_venda`
  recebe `maior_venda_do_grupo = true` (os demais `false`). Essas duas marcações são
  independentes entre si — o mesmo canal pode ganhar as duas, uma, ou nenhuma. Em empate,
  marcar todos os empatados como `true` (não escolher arbitrariamente um).

- **RN-07 — Comissão de venda default:**
  Ao criar um novo `CanalCotado`, o campo `comissao_venda_pct` é pré-preenchido com o valor de
  `comissao_padrao_agencia_pct` da cotação, mas o agente pode sobrescrever livremente por
  canal — o valor salvo é sempre o que está no campo no momento do salvamento, não uma
  referência dinâmica ao valor padrão.

- **RN-08 — Proposta ao cliente:**
  A proposta gerada para o cliente **nunca** exibe: `valor_comissao`, `comissao_fornecedor_pct`,
  `custo_liquido`, `custo_em_brl`, `comissao_venda_pct`, `comissao_padrao_agencia_pct`,
  `menor_custo_do_grupo`. Exibe apenas: dados do cliente/viagem, hotel, categoria do quarto,
  café da manhã, política de reembolso (data limite ou "não reembolsável"), e
  `valor_final_venda` como "Valor total". Por padrão, inclui apenas os canais marcados com
  `escolhido_manual = true`; se nenhum estiver marcado ainda, o sistema deve avisar o agente
  antes de gerar a proposta, não gerar uma proposta vazia ou com todos os canais.

- **RN-09 — Cotação automática de câmbio:**
  Ao criar uma nova `Cotacao`, buscar `cotacao_usd` e `cotacao_eur` automaticamente de uma API
  externa (ver `[A CONFIRMAR]` na seção 9). Se a busca falhar (API fora do ar, timeout), o
  sistema deve **falhar de forma visível** — mostrar um aviso claro e pedir preenchimento
  manual — nunca preencher silenciosamente com um valor antigo ou zero.

- **RN-10 — Arredondamento:**
  Todos os campos monetários calculados (RN-01, RN-02, RN-04, RN-05) devem ser calculados
  encadeando os valores com **precisão total, sem arredondar resultados intermediários**.
  O arredondamento para 2 casas decimais (método `ROUND_HALF_UP`) é aplicado **apenas** no
  momento de armazenar/exibir cada campo — mas o cálculo do próximo campo da cadeia deve usar
  o valor com precisão total do campo anterior, não o valor já arredondado. (Esta regra foi a
  que fez os números do Caso de Teste 1 baterem exatamente com a cotação real — arredondar
  intermediariamente produz um resultado diferente e incorreto, ver nota no caso de teste.)

## 7. CASOS DE TESTE ANCORADOS

### Caso de Teste 1 — Caminho feliz (números reais confirmados)

**Entrada:**
```
valor_mostrado = 10294.19
moeda = "EUR"
comissao_fornecedor_pct = 14
cotacao_eur = 5.91
comissao_venda_pct = 6
```

**Saída esperada exata:**
```
valor_comissao   = 1441.19   (10294.19 × 0.14 = 1441.1866 → arredondado)
custo_liquido    = 8853.00   (10294.19 − 1441.1866, com PRECISÃO TOTAL = 8853.0034 → arredondado)
cotacao_utilizada = 5.91
custo_em_brl     = 52321.25  (8853.0034 × 5.91 = 52321.250094 → arredondado)
valor_final_venda = 55660.90 (52321.250094 / 0.94 = 55660.9044... → arredondado)
```

⚠️ Nota de implementação: se você calcular `custo_em_brl` usando o `custo_liquido` **já
arredondado** (8853.00 × 5.91), o resultado dá 52321.23 — **errado**. O valor correto
(52321.25) só sai calculando com a precisão total de 8853.0034. Use isso como teste de
regressão para garantir que a cadeia de cálculo está certa (RN-10).

### Caso de Teste 2 — Borda: moeda já em BRL (sem conversão) e mais de um hotel

**Entrada:**
```
valor_mostrado = 5000.00
moeda = "BRL"
comissao_fornecedor_pct = 10
comissao_venda_pct = 15
```

**Saída esperada exata:**
```
valor_comissao    = 500.00
custo_liquido     = 4500.00
cotacao_utilizada = 1        (BRL não converte, mesmo que cotacao_usd/cotacao_eur estejam preenchidos na cotação)
custo_em_brl      = 4500.00
valor_final_venda = 5294.12  (4500 / 0.85 = 5294.1176... → arredondado)
```

### Caso de Teste 3 — Erro: validação deve barrar antes de calcular

**Entrada:** `comissao_venda_pct = 100`

**Saída esperada:** o sistema **rejeita o salvamento** com uma mensagem de erro explícita
("Comissão de venda deve ser menor que 100%") — não calcula, não salva, não silencia com um
valor padrão. O mesmo comportamento vale para `valor_mostrado ≤ 0`, `comissao_fornecedor_pct`
fora de 0–100, e `criancas != idades_criancas.length`.

### Caso de Teste 4 — Destaque automático dentro de um grupo (RN-06)

**Entrada:** um `HotelCotado` com dois `CanalCotado`:
```
Canal A: custo_em_brl = 44803.73, valor_final_venda = 52097.36
Canal B: custo_em_brl = 47684.48, valor_final_venda = 55447.07
```

**Saída esperada exata:**
```
Canal A: menor_custo_do_grupo = true,  maior_venda_do_grupo = false
Canal B: menor_custo_do_grupo = false, maior_venda_do_grupo = true
```
(Note que o canal de menor custo **não** é o mesmo de maior venda — isso é esperado e correto,
as duas marcações são independentes, RN-06.)

## 8. INVARIANTES

- `custo_liquido` é sempre igual a `valor_mostrado − valor_comissao` (nunca um valor solto).
- `cotacao_utilizada` é sempre `1` quando `moeda == "BRL"`, nunca outro valor.
- Nenhum campo monetário é persistido ou exibido com mais de 2 casas decimais.
- `comissao_venda_pct` é sempre `< 100` para todo `CanalCotado` salvo no banco.
- Todo `HotelCotado` tem no mínimo um `CanalCotado`.
- Dentro de cada `HotelCotado`, existe exatamente um (ou mais, em caso de empate) canal com
  `menor_custo_do_grupo = true` e exatamente um (ou mais) com `maior_venda_do_grupo = true`.
- Toda `Cotacao` pertence a um `Usuario` existente (`criado_por_usuario_id` nunca órfão).
- Uma proposta ao cliente nunca contém nenhum dos campos listados como proibidos em RN-08.

## 9. RESTRIÇÕES TÉCNICAS

- **Stack `[SUPOSIÇÃO — A CONFIRMAR]`:** Next.js + TypeScript no frontend/backend, Tailwind CSS
  para estilo, PostgreSQL como banco via Prisma ORM, NextAuth (ou equivalente) para
  autenticação por e-mail/senha. Esta é uma proposta razoável para o escopo descrito — se você
  (implementador) tiver uma stack diferente já em uso na agência, substitua livremente; nada
  nas regras de negócio depende dessa escolha específica.
- **Fonte de câmbio `[A CONFIRMAR]`:** proposta default é a AwesomeAPI
  (`https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL`), gratuita e sem necessidade
  de chave de API — confirmar com o usuário antes de considerar isso definitivo em produção,
  já que é uma suposição, não uma decisão confirmada.
- Isolamento entre agentes: por padrão, **todos os agentes autenticados veem todas as
  cotações** da agência (não há isolamento por usuário) — `[A CONFIRMAR]`, pode mudar se a
  agência quiser privacidade entre agentes.
- Não usar nenhuma biblioteca de processamento de pagamento real (não há cobrança de cliente
  dentro do sistema).

## 10. FORA DE ESCOPO

- Integração automática com APIs da Booking.com, Best Buy ou Interep para buscar preços — os
  valores de cada canal são **sempre digitados manualmente** pelo agente.
- Processamento de pagamentos ou emissão de vouchers/reservas reais.
- CRM completo de clientes (histórico de outras interações além das cotações, funil de vendas
  etc.) — o sistema guarda só as cotações em si, associadas a um nome de cliente.
- Qualquer cálculo de preço diferenciado por idade de criança — as idades são salvas apenas
  como informação de contexto da viagem, não entram em nenhuma fórmula de preço
  (`[SUPOSIÇÃO]`, confirmar se a agência realmente não precisa disso).
- Multi-idioma ou multi-moeda de exibição além de BRL (a proposta final é sempre em reais).

## 11. CRITÉRIOS DE ACEITE

- [ ] Rodar o Caso de Teste 1 (seção 7) produz exatamente os 5 valores especificados, sem
      arredondar intermediariamente.
- [ ] Rodar o Caso de Teste 2 produz `cotacao_utilizada = 1` e os valores especificados.
- [ ] Rodar o Caso de Teste 3 rejeita o salvamento com mensagem de erro visível, sem persistir
      nada no banco.
- [ ] Rodar o Caso de Teste 4 marca corretamente `menor_custo_do_grupo` e
      `maior_venda_do_grupo` de forma independente.
- [ ] Um agente consegue criar uma cotação com 3+ hotéis, cada um com 2+ canais, sem limite
      fixo de quantidade.
- [ ] A cotação de câmbio é preenchida automaticamente ao criar uma nova cotação, e pode ser
      sobrescrita manualmente pelo agente.
- [ ] Login funciona para múltiplos usuários distintos.
- [ ] O histórico de cotações pode ser filtrado por nome de cliente e por data.
- [ ] A proposta ao cliente gerada não contém nenhum campo de custo/comissão (auditável
      manualmente contra a lista de RN-08).
- [ ] Todos os testes automatizados da suíte passam.

## 12. PROTOCOLO ANTI-ALUCINAÇÃO

> Não invente bibliotecas, versões, APIs, campos ou regras. Se algo não estiver especificado
> aqui, pare e pergunte antes de implementar, ou marque `[A CONFIRMAR]` no entregável. Não
> silencie erro com valor default. Não simplifique requisito sem avisar.

---

## Lacunas em aberto

As decisões abaixo foram tomadas como **suposição razoável** para que o prompt seja executável
sem travar — mas precisam da sua confirmação antes (ou durante) a implementação:

1. **Fonte de câmbio (RN-09 / seção 9):** proposta AwesomeAPI (gratuita, sem chave). Confirmar
   se é essa mesma ou se a agência já usa outra fonte (ex.: Banco Central, PTAX).
2. **Stack técnica (seção 9):** proposta Next.js + TypeScript + PostgreSQL + Prisma +
   Tailwind + NextAuth. Confirmar se há preferência diferente ou stack já usada na agência.
3. **Isolamento entre agentes:** hoje todos veem todas as cotações. Confirmar se cada agente
   deveria ver só as próprias.
4. **Idades das crianças:** assumido que não afeta nenhum cálculo de preço, é só informativo.
   Confirmar se existe alguma regra de preço por faixa etária que não apareceu na tabela
   original.
5. **Agrupamento do destaque automático (RN-06):** assumido "por hotel cotado" (o bloco que
   você cria ao adicionar um hotel), não por nome de hotel isolado — então se o mesmo hotel for
   cotado duas vezes com quartos diferentes (como no modelo original), cada cotação é seu
   próprio grupo de comparação. Confirmar se é isso mesmo.
6. **Formato da proposta ao cliente:** assumido PDF exportável + visualização em tela.
   Confirmar se precisa de outro formato (ex.: imagem para WhatsApp, e-mail direto).
7. **Hospedagem/deploy do sistema:** não especificado — o prompt entrega o sistema rodando
   localmente; onde ele vai ser hospedado em produção fica em aberto.
