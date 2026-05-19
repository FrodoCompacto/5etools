/**
 * Parses class/subclass starting skill proficiency blocks into a pick-list plan.
 */

/** @param {unknown} skillsArr */
export function parseStartingSkillBlocks (skillsArr) {
	/** @type {Set<string>} */
	const granted = new Set();
	/** @type {{from: string[], count: number}[]} */
	const pools = [];

	if (!Array.isArray(skillsArr)) return {granted, pools};

	for (const block of skillsArr) {
		if (!block || typeof block !== "object") continue;
		const b = /** @type {Record<string, unknown>} */ (block);

		if (b.choose && typeof b.choose === "object") {
			const ch = /** @type {{from?: unknown[], count?: unknown}} */ (b.choose);
			const from = Array.isArray(ch.from)
				? ch.from.map(s => String(s).toLowerCase()).filter(Boolean)
				: [];
			const count = typeof ch.count === "number" && ch.count > 0 ? ch.count : 1;
			pools.push({from, count});
			continue;
		}

		if (typeof b.any === "number" && b.any > 0) {
			pools.push({
				from: Object.keys(Parser.SKILL_TO_ATB_ABV),
				count: b.any,
			});
			continue;
		}

		for (const k of Object.keys(b)) {
			if (Parser.SKILL_TO_ATB_ABV[k] != null && b[k]) granted.add(k);
		}
	}

	return {granted, pools};
}

/**
 * @param {{ granted: Set<string>, pools: {from: string[], count: number}[]} } parsed
 */
export function mergeSkillPools (parsed) {
	if (!parsed.pools.length) return null;
	const count = parsed.pools.reduce((a, p) => a + p.count, 0);
	const from = [...new Set(parsed.pools.flatMap(p => p.from))].sort(SortUtil.ascSortLower);
	return {from, count};
}

/**
 * @param {object|null} cls
 * @param {object|null} sc
 */
export function getClassSkillProficiencyPlan (cls, sc) {
	const granted = new Set();
	const pools = [];

	const mergeParsed = p => {
		p.granted.forEach(s => granted.add(s));
		pools.push(...p.pools);
	};

	if (cls?.startingProficiencies?.skills) mergeParsed(parseStartingSkillBlocks(cls.startingProficiencies.skills));
	if (sc?.startingProficiencies?.skills) mergeParsed(parseStartingSkillBlocks(sc.startingProficiencies.skills));

	const mergedPool = mergeSkillPools({granted, pools});
	if (!mergedPool && !granted.size) return null;

	return {
		/** @type {string[]} */
		granted: [...granted],
		/** @type {string[]} */
		pool: mergedPool?.from ?? [],
		chooseCount: mergedPool?.count ?? 0,
	};
}
