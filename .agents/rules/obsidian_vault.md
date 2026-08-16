---
description: Diretrizes e integração com o cofre Obsidian em D:/.Obsidian/Obsidian
trigger: always_on
---

# Integração com Obsidian Vault

O cofre do Obsidian está conectado em `D:\.Obsidian\Obsidian`.

## Estrutura Principal do Cofre
- `skills/`: Biblioteca extensiva de skills categorizadas (Web, Backend, DevOps, Segurança, etc.).
- `agents/`: Definições de agentes e personas especializadas (ex: `frontend-specialist`, `backend-specialist`, `database-architect`, `security-auditor`, `ui-ux-pro-max-enhanced`).
- `00 - Entrada/`: Notas rápidas e rascunhos.
- `01 - Diário/`: Daily notes e logs periódicos.
- `02 - Modelos/`: Templates de notas.

## Diretrizes de Formatação para o Obsidian
Ao gerar ou salvar notas no cofre do Obsidian:
1. **Frontmatter YAML**: Incluir cabeçalho com metadados:
   ```yaml
   ---
   title: Título da Nota
   date: YYYY-MM-DD
   tags: [tag1, tag2]
   category: categoria
   ---
   ```
2. **Wikilinks**: Utilizar a notação `[[Nome da Nota]]` ou `[[Nome da Nota|Texto de Exibição]]` para criar conexões entre documentos.
3. **Diagramas**: Utilizar blocos de código ````mermaid```` para fluxogramas e arquitetura visual compatível com Obsidian.
