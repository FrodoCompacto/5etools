import {ALLOWED_SOURCES} from "../config.js";

const _allowedSet = () => new Set(ALLOWED_SOURCES.map(s => s.toUpperCase()));

export function isSourceAllowed (source) {
	if (!ALLOWED_SOURCES.length) return true;
	if (!source) return false;
	return _allowedSet().has(String(source).toUpperCase());
}

export function filterBySource (entities) {
	if (!ALLOWED_SOURCES.length) return entities;
	return entities.filter(ent => isSourceAllowed(SourceUtil.getEntitySource(ent)));
}
