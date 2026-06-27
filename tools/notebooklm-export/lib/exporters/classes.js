import {filterBySource} from "../filters.js";
import {renderClassDocument} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

export function exportClasses (data, indexEntries) {
	let total = 0;

	for (const file of data.classFiles) {
		const classes = filterBySource(file.class);
		if (!classes.length) continue;

		for (const cls of classes) {
			const classFeatures = filterBySource(
				file.classFeature.filter(f => f.className === cls.name && f.classSource === cls.source),
			);
			const subclasses = filterBySource(
				file.subclass.filter(sc => sc.className === cls.name && sc.classSource === cls.source),
			);
			const subclassFeatures = filterBySource(file.subclassFeature);

			const title = `# ${cls.name}\n\nClasse D&D 5e com subclasses e features.\n\n---\n\n`;
			const body = renderClassDocument({
				cls,
				classFeatures,
				subclasses,
				subclassFeatures,
			});

			const relPath = `05-classe-${file.key}.md`;
			writeMarkdownFile(relPath, title + body, indexEntries);
			total++;
		}
	}

	return {count: total, path: "05-classe-*.md"};
}
