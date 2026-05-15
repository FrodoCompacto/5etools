import {DOMAIN_PROPS} from "../../core/constants.js";
import {getEmptyUnifiedDataset} from "../util/dataset-util.js";
import {dedupeUnifiedDataset} from "./dedupe.js";
import {normalizeUnifiedDataset} from "./normalize.js";

export class DataBundler {
	/**
	 * @param {import("../pipelines/pipeline.js").CharactermancerPipeline[]} pipelines
	 * @param {{uploadedFileMetas?: any[], customUrls?: string[]}} [opts]
	 * @returns {Promise<import("../../core/contracts.js").DataBundle>}
	 */
	static async pLoad ({pipelines, uploadedFileMetas = [], customUrls = []} = {}) {
		if (!pipelines?.length) {
			return {
				dataset: getEmptyUnifiedDataset(),
				cacheKeys: [],
				meta: {pipelineIds: []},
			};
		}

		const loadOpts = {uploadedFileMetas, customUrls};
		const results = await pipelines.pMap(async pipeline => pipeline.pLoad(loadOpts));

		const merged = getEmptyUnifiedDataset();
		const cacheKeys = [];

		results.forEach(result => {
			if (!result) return;
			if (result.cacheKeys) cacheKeys.push(...result.cacheKeys);
			const contents = result.contents || {};
			DOMAIN_PROPS.forEach(prop => {
				if (Array.isArray(contents[prop])) merged[prop].push(...contents[prop]);
			});
		});

		const deduped = dedupeUnifiedDataset(merged);
		const dataset = normalizeUnifiedDataset(deduped);

		return {
			dataset,
			cacheKeys: [...new Set(cacheKeys)],
			meta: {
				pipelineIds: pipelines.map(p => p.id),
				loadedAt: Date.now(),
			},
		};
	}
}
