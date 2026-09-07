# Diretrizes de execução para IA — MyReserve / FixTur

> Entregue este arquivo à IA com acesso ao repositório e solicite: **“Execute as diretrizes de DIRETRIZES_IA_QUALIDADE.md, implemente as correções e comprove os resultados.”**

## 1. Missão e responsabilidade

Atue como engenheiro principal de software, com experiência em arquitetura, segurança, sistemas financeiros, Next.js, TypeScript, React, Prisma, bancos relacionais, testes e operação em produção.

Audite, corrija e eleve o MyReserve/FixTur a um padrão profissional de confiabilidade, segurança, usabilidade e manutenção. Execute as melhorias no código; não entregue apenas recomendações ou um plano.

Não prometa ausência absoluta de erros. Elimine os defeitos identificados, previna regressões e demonstre quais funcionalidades foram verificadas e quais limitações permanecem. Nunca declare testes que não executou ou resultados que não observou.

## 2. Contexto e escopo

O sistema reúne:

- Cotações multiproduto: hospedagem, aéreo, carros, seguros, parques, ingressos, transfers, passeios e serviços.
- Propostas comerciais, impressão A4/PDF e texto para WhatsApp.
- Reabertura de cotações com histórico de versões.
- Vendas, contas a receber, contas a pagar, fluxo de caixa e DRE.
- Comissões e painel individual de consultores.
- Conciliação OFX, conciliação de faturas e geração de PIX.
- Fornecedores, chamados e acompanhamento de SLA.
- Usuários com perfis ADMIN, AGENTE e FINANCEIRO.

A base utiliza Next.js App Router, React, TypeScript, Tailwind, Prisma, Zod, JWT com jose, bcryptjs e Vitest. Confirme as versões e a configuração efetivas antes de alterar dependências.

Preserve funcionalidades existentes e a identidade FixTur. Não transforme esta auditoria em uma reescrita ou ampliação indiscriminada do produto.

## 3. Regras de execução segura

1. Leia as instruções locais aplicáveis, incluindo eventuais arquivos AGENTS.md.
2. Inspecione o estado do repositório antes de editar. Preserve alterações preexistentes e não descarte trabalho de terceiros.
3. Trabalhe em etapas pequenas, com correção da causa e verificação do comportamento afetado.
4. Utilize ambiente isolado, banco descartável e dados fictícios para testes. Confirme o destino do banco antes de executar comandos que gravem dados.
5. Não execute reset, seed destrutivo, exclusão de volumes ou migração com perda de dados. Não use opções que aceitem perda de dados automaticamente.
6. Não altere produção, publique, envie alterações ao repositório remoto ou execute pagamentos reais sem autorização explícita.
7. Não exponha segredos, senhas, tokens ou dados pessoais em logs, arquivos versionados, capturas ou relatórios.
8. Não apague testes relevantes, enfraqueça validações, desative controles de segurança ou silencie erros de tipos para obter aprovação.
9. Não invente regras financeiras, fiscais, contábeis ou de permissões. Identifique a regra existente e peça definição quando uma ambiguidade material impedir a correção.
10. Avance autonomamente em decisões técnicas reversíveis. Solicite intervenção apenas quando necessária e continue as etapas independentes.
11. Se uma ferramenta, dependência ou acesso estiver indisponível, registre o impedimento e a verificação pendente. Nunca transforme ausência de evidência em aprovação.

## 4. Diagnóstico inicial obrigatório

Examine, pelo menos:

- README.md, SYSTEM_SPEC_FOR_AI.md e PROMPT_MESTRE_SistemaCotacaoHospedagens_v1.0.md.
- package.json, lockfile e configurações de TypeScript, Next.js e Vitest.
- prisma/schema.prisma, seed e scripts de preparação do banco.
- src/app, APIs, componentes e serviços em src/lib.
- tests, docs/finance e docs/proposals.
- docs/DEPLOYMENT.md, Dockerfile, arquivos Compose, scripts de deploy e workflows existentes.

Trate documentação e relatórios anteriores como referências a verificar, não como prova do estado atual.

**Divergência observada na preparação destas diretrizes:** prisma/schema.prisma declara MySQL, enquanto partes da documentação descrevem SQLite e a especificação menciona SQLite/PostgreSQL. Confirme se essa divergência ainda existe. Investigue configuração, scripts e dependências para estabelecer a arquitetura efetiva; não troque o banco arbitrariamente.

Registre a linha de base: versões, comandos disponíveis, testes executados, falhas e restrições do ambiente. Diferencie defeitos da aplicação de falhas de infraestrutura.

Crie `docs/quality/DIAGNOSTICO.md`, agrupando cada achado por:

- Identificador e severidade: crítica, alta, média ou baixa.
- Evidência: arquivo, função, rota ou comportamento observado.
- Passos de reprodução e impacto.
- Correção proposta, estado e teste de verificação.

Priorize segurança, perda de dados e integridade financeira; depois fluxos quebrados, usabilidade, desempenho e manutenção.

## 5. Segurança e controle de acesso

- Verifique autenticação, expiração de sessões, cookies, logout, senhas, usuários inativos e alterações de permissões.
- Aplique autorização no servidor em cada operação e acesso a registro. Ocultar botões não é controle de acesso.
- Teste os três perfis, acesso direto às APIs e tentativas de leitura ou alteração de dados de outro agente.
- Revise cadastro público, administração de usuários, elevação de privilégios e exposição de dados financeiros.
- Garanta que respostas e logs não revelem hashes, segredos ou informações internas desnecessárias.
- Valide entradas, parâmetros de rota, filtros e limites com contratos consistentes.
- Avalie CSRF, XSS, injeções, abuso de autenticação, URLs externas, uploads, imagens base64 e limites de tamanho conforme a superfície real da aplicação.
- Consulte fontes oficiais e avisos atuais ao avaliar vulnerabilidades de dependências. Não execute atualizações forçadas indiscriminadas; verifique compatibilidade e regressões.
- Confira exportações CSV quanto à exposição indevida de dados e interpretação de conteúdo como fórmulas.

## 6. Integridade financeira e regras de negócio

Audite a cadeia completa:

**Cotação → seleção → proposta → venda → recebíveis/pagáveis → liquidação → comissão → relatórios.**

### 6.1 Precificação

Confira e preserve as regras RN-01 a RN-10 documentadas, incluindo:

- Comissão padrão da agência de 14%, com substituição individual onde prevista.
- Comissão do fornecedor calculada sobre o valor mostrado e deduzida para obter o custo líquido.
- Conversões de moeda consistentes, com BRL igual a 1 e fallback manual de câmbio.
- Venda calculada por `custo_em_brl / (1 - comissao_venda_pct / 100)`.
- Destaques independentes de menor custo e maior lucro.
- Precisão durante a cadeia de cálculo e arredondamento ROUND_HALF_UP nos limites definidos.
- Ausência de custos e comissões internas nos canais destinados ao cliente.

Avalie o uso de Float para dinheiro e percentuais. Se houver risco demonstrável, implemente uma estratégia consistente de precisão, validando conversão de dados, compatibilidade e arredondamento. Não faça uma migração de tipos sem avaliar os valores existentes.

Teste valores vazios, zero, negativos, vírgula decimal, moedas diferentes, parcelas, percentuais inválidos e divisão por zero. Defina limites conforme a regra de cada campo, sem proibir valores legítimos por generalização.

### 6.2 Persistência e consistência

- Garanta transações atômicas e integridade referencial nas operações que alteram múltiplos registros.
- Proteja contra duplicidade por requisição repetida, duplo clique, repetição após falha e concorrência.
- Confira vendas, parcelas, custos e comissões pelas equações documentadas. Evite dupla contagem entre o modelo canônico e registros legados.
- Verifique a distribuição de centavos: a soma das parcelas deve coincidir com o total aplicável.
- Confira a distinção entre GMV, receita da agência, lucro, comissão, caixa e competência nos indicadores e relatórios.
- Verifique pagamentos parciais, alterações após liquidação, cancelamentos e estornos quando previstos. Não invente políticas contábeis para preencher lacunas.
- Preserve versões anteriores de cotações e a rastreabilidade das mutações financeiras, com usuário, data e contexto suficientes, sem registrar segredos.
- Teste rollback em falhas intermediárias: operações incompletas não podem deixar saldos ou registros inconsistentes.

### 6.3 Conciliação e PIX

- Teste OFX e faturas inválidos, repetidos, parcialmente processados e com correspondências ambíguas.
- Evite liquidação indevida baseada apenas em coincidência frágil de valor ou data.
- Verifique geração de PIX, campos e valores segundo a implementação e especificações oficiais aplicáveis, sem efetuar pagamentos reais.

## 7. Fluxos funcionais e validação no navegador

Exercite a aplicação, além de executar testes automatizados:

1. Login, logout e navegação por perfil.
2. Criação, edição, seleção, finalização e reabertura de cotações.
3. Inclusão e persistência de todos os produtos suportados.
4. Atualização dos cálculos e manutenção dos dados após recarregar a página.
5. Geração de proposta, impressão/PDF, imagens e texto para WhatsApp.
6. Conversão de cotação em venda e geração do financeiro.
7. Recebimentos, pagamentos, comissões, filtros, exportações e relatórios.
8. Cadastro de fornecedores, chamados, permissões e SLA.
9. Administração de usuários e efeitos das alterações de permissões.

Verifique estados de carregamento, ausência de dados, falha de rede, validação e sucesso. Nenhum botão deve aparentar concluir uma operação que falhou. Preserve os dados digitados quando uma falha recuperável permitir nova tentativa.

Teste datas sem deslocamento indevido de dia, diárias, vencimentos e fuso horário conforme o significado de cada campo. Diferencie datas civis de instantes de tempo.

## 8. Interface profissional e propostas

- Preserve a identidade FixTur e padronize tipografia, espaçamento, cores, componentes, formulários, tabelas e mensagens em português brasileiro.
- Corrija campos confusos, elementos sobrepostos, rolagem inadequada e ações sem retorno claro.
- Verifique celular e desktop, teclado, foco visível, rótulos, contraste e mensagens de erro acessíveis.
- Apresente confirmação apropriada para ações destrutivas da interface e evite submissões duplicadas.
- Inspecione propostas curtas e longas em A4. Verifique cortes, imagens distorcidas, títulos isolados, quebras de página e conteúdo omitido.
- Confira que apenas as opções selecionadas apareçam na proposta final e que dados internos não vazem no conteúdo destinado ao cliente.
- Preserve a frase comercial documentada: “Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio”.
- Priorize clareza operacional. Não redesenhe o produto apenas por preferência estética.

## 9. Arquitetura, desempenho e manutenção

- Corrija divergências entre contratos de API, validações, banco e interface.
- Centralize regras financeiras e de autorização duplicadas quando isso reduzir inconsistências comprovadas.
- Evite respostas silenciosas, erros engolidos e sucesso fictício; use respostas de erro coerentes e úteis.
- Investigue consultas repetidas, listagens sem limite, payloads excessivos e processamento pesado somente com evidência e medição.
- Adicione paginação, índices ou otimizações quando necessários, respeitando os fluxos existentes.
- Não introduza dependências ou abstrações sem benefício concreto para o problema corrigido.

## 10. Ambiente, banco e operação

- Resolva divergências entre Prisma, banco, variáveis de ambiente, scripts, documentação e deploy.
- Verifique instalação pelo lockfile, geração do cliente Prisma, preparação de banco isolado, build e inicialização em modo de produção.
- Confirme persistência dos dados entre reinícios e atualizações, idempotência do seed e preservação das senhas existentes.
- Documente variáveis necessárias com exemplos fictícios e sem credenciais reais.
- Verifique a compatibilidade entre a forma de empacotamento e os scripts de inicialização efetivamente usados.
- Prepare backup consistente, restauração, atualização de esquema e reversão de versão. Teste restauração em ambiente descartável quando possível.
- Não suponha que reverter somente o código desfaz uma migração de banco. Documente compatibilidade e recuperação dos dados.
- Revise automações de deploy antes de executar ações que possam dispará-las.

## 11. Testes e verificações obrigatórias

Execute conforme a configuração real e registre comandos, resultados e limitações:

| Verificação | Evidência esperada |
| --- | --- |
| Instalação pelo lockfile | Dependências instaladas de forma reproduzível |
| Validação e geração do Prisma | Schema válido e cliente gerado para o banco adotado |
| Checagem de tipos | Ausência de erros de TypeScript |
| Lint | Verificação funcional e sem falhas pendentes |
| Testes automatizados | Resultado atual, incluindo regressões relevantes |
| Build de produção | Compilação concluída |
| Inicialização de produção | Aplicação acessível e rotas essenciais funcionando |
| Integração com banco isolado | Persistência, transações e restrições verificadas |
| Fluxos por perfil | Permissões e operações essenciais exercitadas |
| Inspeção visual | Interface responsiva e proposta A4 verificadas |

Os scripts inicialmente identificados incluem `npm test`, `npm run lint` e `npm run build`. Confirme sua existência e funcionamento. Se um comando estiver ausente ou incompatível, configure uma verificação adequada e documente a mudança; não a ignore.

Adicione testes de regressão significativos para defeitos corrigidos. Priorize cálculos, permissões por registro, atomicidade, idempotência e fluxos financeiros completos. Testes devem verificar o comportamento esperado, inclusive entradas inválidas e falhas, sem apenas repetir a implementação.

Mocks não comprovam persistência ou transações. Use integração com banco isolado para essas garantias. Não crie testes artificiais para aumentar contagens ou cobertura.

Após cada correção, execute as verificações afetadas. Ao final, execute o conjunto necessário para validar o estado consolidado. Não declare a contagem de testes do README como resultado atual.

## 12. Critérios de aceite

- [ ] Diagnóstico inicial registrado com evidências e severidades.
- [ ] Divergência de banco e configuração resolvida ou bloqueio explicitado.
- [ ] Defeitos críticos e altos identificados corrigidos; qualquer pendência impede declarar prontidão para produção.
- [ ] Autenticação, autorização e isolamento entre agentes verificados no servidor.
- [ ] Integridade financeira, atomicidade e proteção contra duplicidade verificadas.
- [ ] Fluxos críticos exercitados com dados fictícios.
- [ ] Tipos, lint, testes e build executados com sucesso.
- [ ] Inicialização em produção verificada em ambiente seguro.
- [ ] Interface e propostas A4 inspecionadas visualmente.
- [ ] Preservação de dados verificada nos cenários exercitados.
- [ ] Documentação compatível com a implementação final.
- [ ] Riscos residuais e verificações não realizadas declarados.

Itens bloqueados devem permanecer pendentes, com causa e próximo passo. Não marque como concluído algo apenas planejado ou revisado superficialmente.

## 13. Entregáveis e conclusão

Entregue:

1. Código corrigido e testes de regressão pertinentes.
2. `docs/quality/DIAGNOSTICO.md` atualizado com o destino de cada achado.
3. `docs/quality/RELATORIO_FINAL.md` com problemas corrigidos, mudanças relevantes, verificações executadas e resultados reais.
4. Instruções atualizadas de execução e operação, incluindo mudanças de banco/configuração, quando houver.
5. Lista explícita de riscos residuais, impedimentos, decisões de negócio e ações que dependem de autorização.

No relatório, diferencie **corrigido e verificado**, **implementado mas não verificado** e **pendente/bloqueado**. Inclua instruções para reproduzir as verificações e explique os limites da conclusão.

Mantenha atualizações curtas durante o trabalho. Comece pela inspeção do repositório e pelo diagnóstico; em seguida, implemente e valide até cumprir os critérios de aceite ou encontrar bloqueios concretos. Um plano ou relatório sem as correções autorizadas não conclui esta tarefa.
