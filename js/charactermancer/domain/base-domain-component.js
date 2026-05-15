/** @abstract */
export class BaseDomainComponent {
	constructor ({dataset, buildState} = {}) {
		this._dataset = dataset;
		this._buildState = buildState;
	}

	async pLoad () {}

	/** @abstract @param {HTMLElement} parent */
	render (parent) {
		parent.append(ee`<p class="ve-muted">Domain component not implemented.</p>`);
	}

	validate () {
		return {isValid: true, messages: []};
	}

	getFormData () {
		return {};
	}
}
