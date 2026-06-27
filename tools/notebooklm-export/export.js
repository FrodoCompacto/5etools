import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import {setupRenderer, teardownRenderer} from "./lib/setup-renderer.js";
import {loadAllData} from "./lib/loaders.js";
import {ensureOutputDir, writeIndex, copyGuidelines} from "./lib/writers.js";
import {exportBooks} from "./lib/exporters/books.js";
import {
	exportVariantrules,
	exportCharcreationoptions,
	exportFeats,
	exportOptionalfeatures,
} from "./lib/exporters/simple-lists.js";
import {exportRaces} from "./lib/exporters/races.js";
import {exportBackgrounds} from "./lib/exporters/backgrounds.js";
import {exportClasses} from "./lib/exporters/classes.js";
import {exportItems} from "./lib/exporters/items.js";
import {exportSpells, exportMonsters} from "./lib/exporters/spells-monsters.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

async function main () {
	const t0 = Date.now();
	process.chdir(ROOT);

	console.log("NotebookLM export — iniciando...");
	setupRenderer();

	const indexEntries = [];
	const stats = [];

	try {
		ensureOutputDir();
		console.log("Carregando dados...");
		const data = await loadAllData();

		console.log("Exportando livros...");
		exportBooks(data, indexEntries);

		console.log("Exportando regras variantes...");
		stats.push(exportVariantrules(data, indexEntries));

		console.log("Exportando opções de criação...");
		stats.push(exportCharcreationoptions(data, indexEntries));

		console.log("Exportando raças...");
		stats.push(await exportRaces(data, indexEntries));

		console.log("Exportando classes...");
		stats.push(exportClasses(data, indexEntries));

		console.log("Exportando backgrounds...");
		stats.push(await exportBackgrounds(data, indexEntries));

		console.log("Exportando feats...");
		stats.push(exportFeats(data, indexEntries));

		console.log("Exportando opções opcionais...");
		stats.push(exportOptionalfeatures(data, indexEntries));

		console.log("Exportando equipamento...");
		stats.push(exportItems(data, indexEntries));

		console.log("Exportando magias...");
		stats.push(exportSpells(data, indexEntries));

		console.log("Exportando monstros...");
		stats.push(await exportMonsters(data, indexEntries));

		const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
		const elapsedMs = Date.now() - t0;
		writeIndex({files: indexEntries, version: pkg.version, elapsedMs});
		copyGuidelines(__dirname);

		console.log("\n--- Resumo ---");
		stats.forEach(s => console.log(`  ${s.path}: ${s.count} entidades`));
		console.log(`  Total arquivos: ${indexEntries.length + 2} (inclui 00-DIRETRIZES-PROMPT.md e 00-INDICE.md)`);
		console.log(`  Tempo: ${(elapsedMs / 1000).toFixed(1)}s`);
		console.log(`\nSaída em: tools/notebooklm-export/output/`);
	} finally {
		teardownRenderer();
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
