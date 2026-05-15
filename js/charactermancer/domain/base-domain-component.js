/** @abstract */
export class BaseDomainComponent {
	/**
	 * @param {{
	 *   dataset: import("../core/contracts.js").UnifiedDataset,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   frameMount: import("../core/contracts.js").DomainTabFrameMount,
	 * }} ctx
	 */
	constructor ({dataset, buildState, tab, frameMount}) {
		this._dataset = dataset;
		this._buildState = buildState;
		this._tab = tab;
		this._frameMount = frameMount;
	}

	async pLoad () {}

	/**
	 * @abstract
	 * @param {import("../core/contracts.js").DomainTabFrameMount} [mount]
	 */
	render (mount = this._frameMount) {
		const parent = mount?.wrpLeft || mount?.wrpRight;
		if (parent) parent.append(ee`<p class="ve-muted">Domain component not implemented.</p>`);
	}

	destroy () {}

	/**
	 * @returns {import("../core/contracts.js").DomainComponentValidateResult}
	 */
	validate () {
		return {isValid: true, messages: []};
	}

	getFormData () {
		return {};
	}
}
