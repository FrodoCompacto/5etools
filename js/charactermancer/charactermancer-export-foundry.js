/**
 * Export Charactermancer state to Foundry VTT dnd5e actor format.
 */

const FOUNDRY_SKILL_FROM_5ETOOLS = {
	"acrobatics": "acr",
	"animal handling": "ani",
	"arcana": "arc",
	"athletics": "ath",
	"deception": "dec",
	"history": "his",
	"insight": "ins",
	"intimidation": "itm",
	"investigation": "inv",
	"medicine": "med",
	"nature": "nat",
	"perception": "prc",
	"performance": "prf",
	"persuasion": "per",
	"religion": "rel",
	"sleight of hand": "slt",
	"stealth": "ste",
	"survival": "sur",
};

const FOUNDRY_ARMOR_FROM_5ETOOLS = {
	"light": "lgt",
	"medium": "med",
	"heavy": "hvy",
	"shield": "shl",
};

const FOUNDRY_WEAPON_FROM_5ETOOLS = {
	"simple": "sim",
	"martial": "mar",
};

function buildAbilities (state) {
	const abils = {};
	["str", "dex", "con", "int", "wis", "cha"].forEach(ab => {
		const val = state.abilityScores?.[ab] ?? 10;
		const mod = Math.floor((val - 10) / 2);
		const isSaveProf = (state.proficiencies?.savingThrowProficiencies || []).includes(ab);
		abils[ab] = {
			value: val,
			mod,
			proficient: isSaveProf ? 1 : 0,
			prof: isSaveProf ? 1 : 0,
			save: mod + (isSaveProf ? 2 : 0),
		};
	});
	return abils;
}

function buildSkills (state) {
	const skills = {};
	const profSkills = (state.proficiencies?.skillProficiencies || []).map(s => (s || "").toLowerCase());
	Object.entries(FOUNDRY_SKILL_FROM_5ETOOLS).forEach(([name5e, keyFoundry]) => {
		const isProf = profSkills.some(s => s === name5e || s.toLowerCase() === name5e);
		skills[keyFoundry] = {
			value: isProf ? 1 : 0,
			ability: (typeof Parser !== "undefined" && Parser.SKILL_TO_ATB_ABV?.[name5e]) || "dex",
		};
	});
	return skills;
}

function buildTraits (state) {
	const prof = state.proficiencies || {};
	const armorProf = (prof.armorProficiencies || []).map(a => FOUNDRY_ARMOR_FROM_5ETOOLS[(a || "").toLowerCase()] || a).filter(Boolean);
	const weaponProf = (prof.weaponProficiencies || []).map(w => {
		const low = (w || "").toLowerCase();
		return FOUNDRY_WEAPON_FROM_5ETOOLS[low] || w;
	}).filter(Boolean);
	return {
		languages: { value: (prof.languageProficiencies || []).join(", "), custom: "" },
		armorProf: { value: armorProf.join(", "), custom: "" },
		weaponProf: { value: weaponProf.join(", "), custom: "" },
	};
}

function buildSpellSlots (state) {
	const cls = state.class;
	const hasSpellcasting = !!cls?.spellcastingAbility;
	const slots = {};
	if (hasSpellcasting) {
		for (let i = 1; i <= 9; i++) {
			slots[`spell${i}`] = { value: 0, max: i === 1 ? 2 : 0 };
		}
	}
	return slots;
}

function buildEquipmentItems (state) {
	const equipment = state.equipment || [];
	return equipment.map(e => ({
		name: e.name || e.equipmentType || "Item",
		type: "equipment",
		system: {},
		flags: {},
	}));
}

function buildSpellItems (state) {
	const spells = state.spells || [];
	return spells.map(s => ({
		name: s.name || "Spell",
		type: "spell",
		system: { level: s.level ?? 1 },
		flags: {},
	}));
}

export function exportToFoundry (state) {
	const cls = state.class;
	const con = state.abilityScores?.con ?? 10;
	const conMod = Math.floor((con - 10) / 2);
	const hpMax = cls?.hd?.faces ? Math.max(1, cls.hd.faces + conMod) : 1;

	return {
		name: state.name || "New Character",
		type: "character",
		system: {
			abilities: buildAbilities(state),
			skills: buildSkills(state),
			traits: buildTraits(state),
			details: {
				race: state.race?.name ?? "",
				background: state.background?.name ?? "",
			},
			attributes: {
				hp: { value: hpMax, min: 0, max: hpMax },
				spellcasting: cls?.spellcastingAbility ?? "",
				prof: 2,
				senses: { darkvision: state.senses?.darkvision ?? 0 },
			},
			spells: buildSpellSlots(state),
		},
		items: [
			...buildEquipmentItems(state),
			...buildSpellItems(state),
		],
		flags: {
			"5etools-charactermancer": {
				version: state.version ?? 1,
				source: state.toExportable ? state.toExportable() : state,
			},
		},
	};
}
