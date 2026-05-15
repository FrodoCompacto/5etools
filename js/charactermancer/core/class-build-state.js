/** @enum {string} */
export const HP_INCREASE_MODES = {
	AVERAGE: "average",
	MIN: "min",
	MAX: "max",
	ROLL: "roll",
	ROLL_CUSTOM: "rollCustom",
	NONE: "none",
};

/** @type {readonly string[]} */
export const HP_INCREASE_MODE_VALUES = Object.values(HP_INCREASE_MODES);

/**
 * @typedef {Object} ClassEntityRef
 * @property {string} name
 * @property {string} source
 */

/**
 * @typedef {Object} SubclassEntityRef
 * @property {string} name
 * @property {string} source
 * @property {string} [shortName]
 */

/**
 * @typedef {Object} ClassEntryState
 * @property {boolean} isPrimary
 * @property {ClassEntityRef|null} classRef
 * @property {SubclassEntityRef|null} subclassRef
 * @property {number} currentLevel
 * @property {number} targetLevel
 * @property {string} hpIncreaseMode
 * @property {string} hpCustomFormula
 * @property {string[]} skillProficiencyChoices
 * @property {boolean} [isCollapsed]
 */

/**
 * @typedef {Object} ClassBuildState
 * @property {number} totalLevels
 * @property {ClassEntryState[]} entries
 */

/**
 * @returns {ClassEntryState}
 */
export function getDefaultClassEntryState () {
	return {
		isPrimary: true,
		classRef: null,
		subclassRef: null,
		currentLevel: 0,
		targetLevel: 1,
		hpIncreaseMode: HP_INCREASE_MODES.AVERAGE,
		hpCustomFormula: "",
		skillProficiencyChoices: [],
		isCollapsed: false,
	};
}

/**
 * @returns {ClassBuildState}
 */
export function getDefaultClassState () {
	return {
		totalLevels: 1,
		entries: [getDefaultClassEntryState()],
	};
}

/**
 * @param {unknown} raw
 * @returns {ClassBuildState}
 */
export function normalizeClassState (raw) {
	const def = getDefaultClassState();

	if (!raw || typeof raw !== "object") return def;

	const o = /** @type {Record<string, unknown>} */ (raw);

	if (Array.isArray(o.entries) && o.entries.length) {
		const entries = o.entries.map(ent => normalizeClassEntry(ent));
		return {
			totalLevels: typeof o.totalLevels === "number" && o.totalLevels > 0 ? o.totalLevels : entries.reduce((sum, e) => sum + (e.targetLevel || 0), 0) || 1,
			entries,
		};
	}

	return def;
}

/**
 * @param {unknown} ent
 * @returns {ClassEntryState}
 */
function normalizeClassEntry (ent) {
	const def = getDefaultClassEntryState();
	if (!ent || typeof ent !== "object") return {...def};

	const e = /** @type {Record<string, unknown>} */ (ent);

	return {
		isPrimary: e.isPrimary !== false,
		classRef: normalizeClassRef(e.classRef),
		subclassRef: normalizeSubclassRef(e.subclassRef),
		currentLevel: typeof e.currentLevel === "number" ? e.currentLevel : def.currentLevel,
		targetLevel: typeof e.targetLevel === "number" && e.targetLevel > 0 ? e.targetLevel : def.targetLevel,
		hpIncreaseMode: HP_INCREASE_MODE_VALUES.includes(/** @type {string} */ (e.hpIncreaseMode)) ? /** @type {string} */ (e.hpIncreaseMode) : def.hpIncreaseMode,
		hpCustomFormula: typeof e.hpCustomFormula === "string" ? e.hpCustomFormula : def.hpCustomFormula,
		skillProficiencyChoices: Array.isArray(e.skillProficiencyChoices) ? e.skillProficiencyChoices.filter(it => typeof it === "string") : [],
		isCollapsed: !!e.isCollapsed,
	};
}

/**
 * @param {unknown} ref
 * @returns {ClassEntityRef|null}
 */
function normalizeClassRef (ref) {
	if (!ref || typeof ref !== "object") return null;
	const r = /** @type {Record<string, unknown>} */ (ref);
	if (typeof r.name !== "string" || typeof r.source !== "string") return null;
	return {name: r.name, source: r.source};
}

/**
 * @param {unknown} ref
 * @returns {SubclassEntityRef|null}
 */
function normalizeSubclassRef (ref) {
	if (!ref || typeof ref !== "object") return null;
	const r = /** @type {Record<string, unknown>} */ (ref);
	if (typeof r.name !== "string" || typeof r.source !== "string") return null;
	return {
		name: r.name,
		source: r.source,
		shortName: typeof r.shortName === "string" ? r.shortName : undefined,
	};
}

/**
 * @param {import("./contracts.js").UnifiedDataset} dataset
 * @param {ClassEntityRef|null} classRef
 * @returns {object|null}
 */
export function resolveClassFromDataset (dataset, classRef) {
	if (!classRef?.name || !classRef?.source) return null;
	return dataset.class.find(it => it.name === classRef.name && it.source === classRef.source) || null;
}

/**
 * @param {object} cls
 * @param {SubclassEntityRef|null} subclassRef
 * @returns {object|null}
 */
export function resolveSubclassFromClass (cls, subclassRef) {
	if (!cls || !subclassRef?.name || !subclassRef?.source) return null;
	const sc = (cls.subclasses || []).find(it => it.name === subclassRef.name && it.source === subclassRef.source);
	if (!sc) return null;
	return sc;
}

/**
 * @param {object} cls
 * @returns {boolean}
 */
export function classRequiresSubclassAtLevel1 (cls) {
	if (!cls) return false;
	if (!cls.subclasses?.length) return false;
	return !!cls.subclassTitle || cls.subclasses.some(sc => sc.level == null || sc.level <= 1);
}

/**
 * @param {import("./contracts.js").UnifiedDataset} dataset
 * @param {ClassBuildState} classState
 * @returns {number}
 */
export function getClassIndexInDataset (dataset, classRef) {
	if (!classRef) return -1;
	return dataset.class.findIndex(it => it.name === classRef.name && it.source === classRef.source);
}

/**
 * Apply filter metadata required by PageFilterClasses* (mutateForFilters).
 * @param {object[]} classes
 */
export function prepareClassesForCharactermancerFilter (classes) {
	if (!classes?.length || typeof PageFilterClassesBase === "undefined") return;

	classes.forEach(cls => {
		cls.source = cls.source || Parser.SRC_PHB;
		cls.subclasses = cls.subclasses || [];
		cls.classFeatures = cls.classFeatures || [];
		PageFilterClassesBase.mutateForFilters(cls);
	});
}
