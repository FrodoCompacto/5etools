import {filterBySource} from "../filters.js";
import {sortByNameThenSource, wrapEntity, stripLeadingHeading} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";
import {slugify} from "../loaders.js";

const LEVEL_NAMES = {
	0: "magias-truques-nivel-0",
	1: "magias-nivel-1",
	2: "magias-nivel-2",
	3: "magias-nivel-3",
	4: "magias-nivel-4",
	5: "magias-nivel-5",
	6: "magias-nivel-6",
	7: "magias-nivel-7",
	8: "magias-nivel-8",
	9: "magias-nivel-9",
};

export function exportSpells (data, indexEntries) {
	const spells = sortByNameThenSource(filterBySource(data.spells));
	const byLevel = new Map();

	for (const sp of spells) {
		const lvl = sp.level ?? 0;
		if (!byLevel.has(lvl)) byLevel.set(lvl, []);
		byLevel.get(lvl).push(sp);
	}

	let total = 0;

	for (let level = 0; level <= 9; level++) {
		const levelSpells = byLevel.get(level) || [];
		if (!levelSpells.length) continue;

		const levelLabel = level === 0 ? "Truques (nível 0)" : `Nível ${level}`;
		const header = `# Magias — ${levelLabel}\n\n${levelSpells.length} magias.\n\n---\n\n`;
		const body = levelSpells.map(sp => {
			const rendered = stripLeadingHeading(RendererMarkdown.spell.getCompactRenderedString(sp));
			return wrapEntity(sp, rendered);
		}).join("\n");

		const relPath = `10-${LEVEL_NAMES[level]}.md`;
		writeMarkdownFile(relPath, header + body, indexEntries);
		total += levelSpells.length;
	}

	return {count: total, path: "10-magias-*.md"};
}

function slugifyForMonster (source) {
	const full = Parser.sourceJsonToFull(source);
	return `${Parser.sourceJsonToAbv(source).toLowerCase()}-${slugify(full)}`;
}

export async function exportMonsters (data, indexEntries) {
	const monsters = sortByNameThenSource(filterBySource(data.monsters));
	const bySource = new Map();

	for (const mon of monsters) {
		const src = SourceUtil.getEntitySource(mon);
		if (!bySource.has(src)) bySource.set(src, []);
		bySource.get(src).push(mon);
	}

	let total = 0;

	for (const [source, mons] of [...bySource.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
		const header = `# Monstros — ${Parser.sourceJsonToFull(source)} (${Parser.sourceJsonToAbv(source)})\n\n${mons.length} criaturas.\n\n---\n\n`;
		const body = await RendererMarkdown.monster.pGetMarkdownDoc(mons);
		const relPath = `11-monstro-${slugifyForMonster(source)}.md`;
		writeMarkdownFile(relPath, header + body, indexEntries);
		total += mons.length;
	}

	return {count: total, path: "11-monstro-*.md"};
}
