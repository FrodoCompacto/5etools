import {filterBySource} from "../filters.js";
import {sortByNameThenSource, stripLeadingHeading, wrapEntity, renderEntityCompact} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

export function exportItems (data, indexEntries) {
	const items = sortByNameThenSource(filterBySource(data.items));
	const header = `# Equipamento e Itens\n\n${items.length} entradas.\n\n---\n\n`;
	const body = items.map(ent => wrapEntity(ent, stripLeadingHeading(renderEntityCompact("item", ent)))).join("\n");

	writeMarkdownFile("09-equipamento.md", header + body, indexEntries);
	return {count: items.length, path: "09-equipamento.md"};
}
