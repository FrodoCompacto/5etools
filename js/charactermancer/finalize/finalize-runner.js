/** Origins task (future): reads backgroundState, speciesState, originOtherState. */
const FINALIZE_TASKS = [
	{id: "abilities", label: "Setting ability scores"},
	{id: "origins", label: "Applying origins (background, species, other)"},
	{id: "class", label: "Applying class and subclass"},
	{id: "feats", label: "Applying feats"},
	{id: "spells", label: "Applying spells"},
	{id: "equipment", label: "Applying equipment"},
	{id: "post", label: "Post-build finalize"},
];

export class FinalizeRunner {
	/**
	 * @param {import("../state/character-build-state.js").CharacterBuildState} buildState
	 * @param {import("../core/contracts.js").UnifiedDataset} dataset
	 */
	constructor ({buildState, dataset}) {
		this._buildState = buildState;
		this._dataset = dataset;
	}

	/** @returns {Promise<import("../core/contracts.js").FinalizeTaskResult[]>} */
	async runBuildPipeline () {
		const results = [];
		for (const task of FINALIZE_TASKS) {
			const t0 = Date.now();
			results.push({
				status: "ok",
				domain: task.id,
				messages: [`${task.label} (stub — not yet implemented).`],
				patchSummary: {},
				timingMs: Date.now() - t0,
			});
		}
		return results;
	}

	static formatResultsForDisplay (results) {
		return results
			.map(r => `[${r.status}] ${r.domain}: ${r.messages.join(" ")}`)
			.join("\n");
	}
}
