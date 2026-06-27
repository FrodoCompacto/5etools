# Exportação NotebookLM

Ferramenta local para gerar arquivos Markdown a partir dos dados do 5etools, prontos para importar no [NotebookLM](https://notebooklm.google.com/) ou outras IAs.

## Uso

Na raiz do repositório:

```bash
npm run export:notebooklm
```

A saída fica em `tools/notebooklm-export/output/` — **todos os `.md` em uma pasta só**, sem subpastas.

**No NotebookLM:** faça upload de `00-DIRETRIZES-PROMPT.md` junto com os demais arquivos (é o “system prompt” do notebook). Depois use `00-INDICE.md` como mapa do acervo.

O arquivo fonte das diretrizes fica em `tools/notebooklm-export/DIRETRIZES-PROMPT.md` e é copiado para `output/` a cada exportação.

## Filtrar fontes

Edite `config.js`:

```javascript
// Vazio = todas as fontes
export const ALLOWED_SOURCES = [];

// Exemplo: só PHB, XGE e TCE
export const ALLOWED_SOURCES = ["PHB", "XGE", "TCE"];
```

## Prefixos dos arquivos

Os nomes usam prefixos numéricos para ordenação lógica:

| Prefixo | Conteúdo |
|---------|----------|
| `00-DIRETRIZES-PROMPT.md` | Instruções para a IA (ler primeiro no NotebookLM) |
| `00-INDICE.md` | Mapa de arquivos e instruções para a IA |
| `01-livro-*.md` | Texto integral de cada livro |
| `02-regras-variantes.md` | Regras opcionais |
| `03-opcoes-criacao-personagem.md` | Opções de criação de suplementos |
| `04-racas.md` | Raças (mecânica + lore) |
| `05-classe-*.md` | Uma classe por arquivo |
| `06-backgrounds.md` | Backgrounds |
| `07-feats.md` | Feats |
| `08-opcoes-opcionais.md` | Fighting styles, invocations, etc. |
| `09-equipamento.md` | Itens |
| `10-magias-*.md` | Magias por nível (0–9) |
| `11-monstro-*.md` | Bestiário por fonte |

## Notas

- Esta pasta **não** entra no deploy do site (fora do `.dockerignore` whitelist).
- A pasta `output/` está no `.gitignore`.
- O conteúdo exportado está em inglês (texto original dos livros).
