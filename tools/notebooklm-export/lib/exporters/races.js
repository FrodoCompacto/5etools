import {filterBySource} from "../filters.js";
import {sortByNameThenSource, renderRaceWithFluff} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

export async function exportRaces (data, indexEntries) {
	const races = sortByNameThenSource(filterBySource(data.races));
	const header = `# Raças\n\n${races.length} entradas (inclui variantes de fontes diferentes).\n\n---\n\n`;

	const parts = await races.pSerialAwaitMap(race => renderRaceWithFluff(race));
	const content = header + parts.join("\n");

	writeMarkdownFile("04-racas.md", content, indexEntries);
	return {count: races.length, path: "04-racas.md"};
}
