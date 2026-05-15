import {DOMAIN_PROPS} from "../../core/constants.js";

/** @type {Record<string, {page: string, dataProp: string, isSidekickFilter?: boolean}>} */
export const PROP_META = {
	class: {page: UrlUtil.PG_CLASSES, dataProp: "class", isSidekickFilter: true},
	race: {page: UrlUtil.PG_RACES, dataProp: "race"},
	background: {page: UrlUtil.PG_BACKGROUNDS, dataProp: "background"},
	spell: {page: UrlUtil.PG_SPELLS, dataProp: "spell"},
	feat: {page: UrlUtil.PG_FEATS, dataProp: "feat"},
	item: {page: UrlUtil.PG_ITEMS, dataProp: "item"},
	optionalfeature: {page: UrlUtil.PG_OPT_FEATURES, dataProp: "optionalfeature"},
	language: {page: UrlUtil.PG_LANGUAGES, dataProp: "language"},
};

export function getEntityHash (prop, ent) {
	const page = PROP_META[prop]?.page;
	if (!page || !ent) return null;
	const fn = UrlUtil.URL_TO_HASH_BUILDER[page];
	if (!fn) return null;
	return fn(ent);
}

export function isEntityExcluded (prop, ent) {
	const meta = PROP_META[prop];
	if (!meta || !ent) return true;
	const hash = getEntityHash(prop, ent);
	if (!hash) return false;
	return ExcludeUtil.isExcluded(hash, meta.dataProp, ent.source);
}

export function filterDomainEntries (prop, arr) {
	if (!Array.isArray(arr)) return [];
	let out = arr.filter(ent => ent && !isEntityExcluded(prop, ent));
	if (PROP_META[prop]?.isSidekickFilter) {
		out = out.filter(cls => !cls.isSidekick);
	}
	return out;
}

export function getDatasetCounts (dataset) {
	return Object.fromEntries(
		DOMAIN_PROPS.map(prop => [prop, dataset?.[prop]?.length ?? 0]),
	);
}
