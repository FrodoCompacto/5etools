import {DOMAIN_PROPS} from "../../core/constants.js";

export function getEmptyUnifiedDataset () {
	/** @type {import("../../core/contracts.js").UnifiedDataset} */
	const out = {};
	DOMAIN_PROPS.forEach(prop => { out[prop] = []; });
	return out;
}

/**
 * @param {object|null|undefined} obj
 * @returns {import("../../core/contracts.js").UnifiedDatasetPartial}
 */
export function pickDomainProps (obj) {
	const out = getEmptyUnifiedDataset();
	if (!obj) return out;

	DOMAIN_PROPS.forEach(prop => {
		if (Array.isArray(obj[prop])) out[prop] = obj[prop];
	});

	return out;
}

/**
 * Attach brew/subclass rows onto matching class entries.
 * @param {object[]} classes
 * @param {object[]} subclasses
 */
export function mergeSubclassesIntoClasses (classes, subclasses) {
	if (!subclasses?.length || !classes?.length) return;

	const lookup = new Map();
	classes.forEach(cls => {
		lookup.set(`${cls.name}__${cls.source}`.toLowerCase(), cls);
	});

	subclasses.forEach(sc => {
		if (sc.className === VeCt.STR_GENERIC || sc.classSource === VeCt.STR_GENERIC) return;
		const cls = lookup.get(`${sc.className}__${(sc.classSource || Parser.SRC_PHB)}`.toLowerCase());
		if (!cls) return;
		cls.subclasses = cls.subclasses || [];
		if (cls.subclasses.some(it => it.shortName === sc.shortName && it.source === sc.source)) return;
		cls.subclasses.push(sc);
	});
}
