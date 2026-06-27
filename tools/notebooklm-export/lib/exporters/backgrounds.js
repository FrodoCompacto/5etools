import {filterBySource} from "../filters.js";
import {sortByNameThenSource, renderBackgroundWithFluff} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

export async function exportBackgrounds (data, indexEntries) {
	const backgrounds = sortByNameThenSource(filterBySource(data.backgrounds));
	const header = `# Backgrounds\n\n${backgrounds.length} entradas.\n\n---\n\n`;

	const parts = await backgrounds.pSerialAwaitMap(bg => renderBackgroundWithFluff(bg));
	const content = header + parts.join("\n");

	writeMarkdownFile("06-backgrounds.md", content, indexEntries);
	return {count: backgrounds.length, path: "06-backgrounds.md"};
}
