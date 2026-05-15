import {DOMAIN_PROPS} from "../../core/constants.js";
import {getEntityHash} from "../util/prop-meta.js";

export function dedupeUnifiedDataset (dataset) {
	/** @type {import("../../core/contracts.js").UnifiedDataset} */
	const out = {};
	DOMAIN_PROPS.forEach(prop => { out[prop] = dedupePropArray(prop, dataset[prop] || []); });
	return out;
}

function dedupePropArray (prop, arr) {
	const seen = new Set();
	const out = [];
	arr.forEach(ent => {
		const hash = getEntityHash(prop, ent);
		const key = hash || `${prop}__${ent?.name}__${ent?.source}`;
		if (seen.has(key)) return;
		seen.add(key);
		out.push(ent);
	});
	return out;
}
