export class CharactermancerPipeline {
	/**
	 * @param {object} opts
	 * @param {string} opts.id
	 * @param {string} opts.label
	 * @param {string[]} [opts.sourceTypes]
	 * @param {boolean} [opts.isStub]
	 * @param {(opts?: {uploadedFileMetas?: any[], customUrls?: string[]}) => Promise<import("../../core/contracts.js").PipelineLoadResult>} opts.pLoad
	 */
	constructor ({id, label, sourceTypes = [], isStub = false, pLoad}) {
		this.id = id;
		this.label = label;
		this.sourceTypes = sourceTypes;
		this.isStub = isStub;
		this.pLoad = pLoad;
	}
}
