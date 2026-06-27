import fs from "fs";
import path from "path";
import {OUTPUT_DIR, MAX_FILE_CHARS} from "../config.js";

export function ensureOutputDir () {
	fs.rmSync(OUTPUT_DIR, {recursive: true, force: true});
	fs.mkdirSync(OUTPUT_DIR, {recursive: true});
}

export function writeMarkdownFile (relativePath, content, indexEntries) {
	const fileName = path.basename(relativePath);
	const parts = splitContent(content, fileName);
	const written = [];

	parts.forEach((part, i) => {
		const outPath = parts.length === 1
			? fileName
			: fileName.replace(/\.md$/, `-parte-${i + 1}.md`);

		const fullPath = path.join(OUTPUT_DIR, outPath);
		fs.writeFileSync(fullPath, part, "utf8");
		written.push(outPath);
	});

	indexEntries.push(...written.map((p, i) => ({
		path: p,
		description: parts.length > 1
			? `${describePath(p)} (parte ${i + 1} de ${parts.length})`
			: describePath(p),
	})));

	return written;
}

function splitContent (content, relativePath) {
	if (content.length <= MAX_FILE_CHARS) return [content];

	const parts = [];
	const sections = content.split(/(?=^## )/m);
	let buffer = "";

	for (const section of sections) {
		if (!section) continue;
		if (buffer.length + section.length > MAX_FILE_CHARS && buffer.length) {
			parts.push(buffer.trim() + "\n");
			buffer = "";
		}
		if (section.length > MAX_FILE_CHARS) {
			if (buffer.length) {
				parts.push(buffer.trim() + "\n");
				buffer = "";
			}
			for (let i = 0; i < section.length; i += MAX_FILE_CHARS) {
				parts.push(section.slice(i, i + MAX_FILE_CHARS));
			}
			continue;
		}
		buffer += section;
	}
	if (buffer.length) parts.push(buffer.trim() + "\n");

	return parts.length ? parts : [content];
}

function describePath (p) {
	const base = path.basename(p, ".md");
	return base.replace(/-/g, " ");
}

export function writeIndex ({files, version, elapsedMs}) {
	const date = new Date().toISOString();
	const lines = [
		"# Índice — D&D 5e (5etools export)",
		"",
		"Pacote de referência para NotebookLM ou outras IAs, gerado a partir dos dados estruturados do 5etools.",
		"",
		"## Sobre este pacote",
		"",
		"- Conteúdo em **inglês** (texto original dos livros e stat blocks).",
		"- Cada entrada indica **fonte** (livro de origem). Duplicatas entre fontes são intencionais.",
		"- Todos os arquivos ficam em **uma única pasta** (`output/`), sem subpastas — pronto para upload em lote no NotebookLM.",
		"- Leia `00-DIRETRIZES-PROMPT.md` primeiro — substitui o system prompt no NotebookLM.",
		"- Use `ALLOWED_SOURCES` em `tools/notebooklm-export/config.js` para filtrar fontes na próxima exportação.",
		"",
		`**Gerado em:** ${date}`,
		`**Versão 5etools:** ${version}`,
		`**Tempo de exportação:** ${(elapsedMs / 1000).toFixed(1)}s`,
		`**Total de arquivos:** ${files.length}`,
		"",
		"## Arquivos",
		"",
		"| Arquivo | Descrição |",
		"|---------|-----------|",
	];

	files
		.sort((a, b) => a.path.localeCompare(b.path))
		.forEach(({path: filePath, description}) => {
			lines.push(`| \`${filePath}\` | ${description} |`);
		});

	lines.push(
		"",
		"## Convenções",
		"",
		"- `**Fonte:**` indica o livro ou suplemento de origem.",
		"- `**ID:**` é o código curto da fonte (ex.: PHB, XGE, TCE).",
		"- Entradas com o mesmo nome de fontes diferentes são versões distintas — consulte a fonte ao criar personagens.",
		"",
		"## Prompts sugeridos (NotebookLM)",
		"",
		"1. \"Ajude-me a criar um personagem de 1º nível. Pergunte raça, classe e background antes de sugerir opções.\"",
		"2. \"Quais regras de criação de personagem existem no PHB? Resuma o passo a passo.\"",
		"3. \"Compare as versões desta raça entre fontes diferentes e indique as diferenças mecânicas.\"",
		"4. \"Liste magias de 3º nível disponíveis para um Wizard, com descrição resumida.\"",
		"",
	);

	const indexPath = path.join(OUTPUT_DIR, "00-INDICE.md");
	fs.writeFileSync(indexPath, lines.join("\n"), "utf8");
}

/** Copia DIRETRIZES-PROMPT.md da raiz da ferramenta para output/ no export. */
export function copyGuidelines (toolRoot) {
	const src = path.join(toolRoot, "DIRETRIZES-PROMPT.md");
	const dest = path.join(OUTPUT_DIR, "00-DIRETRIZES-PROMPT.md");
	fs.copyFileSync(src, dest);
}
