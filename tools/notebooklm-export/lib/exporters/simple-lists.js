import {filterBySource} from "../filters.js";
import {sortByNameThenSource, stripLeadingHeading, wrapEntity, renderEntityCompact} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

function exportSimpleList ({entities, prop, relPath, title, indexEntries}) {
	const filtered = sortByNameThenSource(filterBySource(entities));
	const header = `# ${title}\n\n${filtered.length} entradas. Cada bloco abaixo inclui fonte e ID.\n\n---\n\n`;
	const body = filtered.map(ent => wrapEntity(ent, stripLeadingHeading(renderEntityCompact(prop, ent)))).join("\n");
	writeMarkdownFile(relPath, header + body, indexEntries);
	return {count: filtered.length, path: relPath};
}

export function exportVariantrules (data, indexEntries) {
	return exportSimpleList({
		entities: data.variantrules,
		prop: "variantrule",
		relPath: "02-regras-variantes.md",
		title: "Regras Variantes",
		indexEntries,
	});
}

export function exportCharcreationoptions (data, indexEntries) {
	return exportSimpleList({
		entities: data.charcreationoptions,
		prop: "charoption",
		relPath: "03-opcoes-criacao-personagem.md",
		title: "Opções de Criação de Personagem",
		indexEntries,
	});
}

export function exportFeats (data, indexEntries) {
	return exportSimpleList({
		entities: data.feats,
		prop: "feat",
		relPath: "07-feats.md",
		title: "Feats",
		indexEntries,
	});
}

export function exportOptionalfeatures (data, indexEntries) {
	return exportSimpleList({
		entities: data.optionalfeatures,
		prop: "optionalfeature",
		relPath: "08-opcoes-opcionais.md",
		title: "Opções Opcionais (Fighting Styles, Invocations, etc.)",
		indexEntries,
	});
}
