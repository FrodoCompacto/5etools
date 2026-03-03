/**
 * Character state for the Charactermancer wizard.
 * Holds all choices made during character creation.
 */
export class CharacterState {
	constructor () {
		this.name = "";
		this.abilityScores = {str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10};
		this.race = null;
		this.background = null;
		this.class = null;
		this.subclass = null;
		this.equipment = [];
		this.equipmentChoices = {}; // row index -> "a"|"b"|"c" for startingEquipment.defaultData
		this.backgroundEquipment = [];
		this.backgroundEquipmentChoices = {}; // row index -> "a"|"b" for background startingEquipment
		this.hp = 0;
		this.senses = {};
		this.spells = [];
		this.proficiencies = {
			skillProficiencies: [],
			armorProficiencies: [],
			weaponProficiencies: [],
			toolProficiencies: [],
			languageProficiencies: [],
			savingThrowProficiencies: [],
			languageChoicesResolved: {},
			toolChoicesResolved: {},
			backgroundSkillChoiceResolved: [],
		};
	}

	getTotalLevel () {
		return this.class ? 1 : 0;
	}

	toExportable () {
		return {
			version: 1,
			fileType: "charactermancer",
			name: this.name || "",
			abilityScores: {...this.abilityScores},
			race: this.race ? {name: this.race.name, source: this.race.source} : null,
			background: this.background ? {name: this.background.name, source: this.background.source} : null,
			class: this.class ? {name: this.class.name, source: this.class.source} : null,
			subclass: this.subclass ? {name: this.subclass.name, shortName: this.subclass.shortName, source: this.subclass.source} : null,
			equipment: [...this.equipment],
			equipmentChoices: {...this.equipmentChoices},
			backgroundEquipment: [...(this.backgroundEquipment || [])],
			backgroundEquipmentChoices: {...(this.backgroundEquipmentChoices || {})},
			hp: this.hp || 0,
			senses: {...(this.senses || {})},
			spells: [...this.spells],
			proficiencies: JSON.parse(JSON.stringify(this.proficiencies || {})),
		};
	}

	static fromExportable (data) {
		const state = new CharacterState();
		if (!data) return state;
		state.name = data.name || "";
		if (data.abilityScores) Object.assign(state.abilityScores, data.abilityScores);
		state.race = data.race;
		state.background = data.background;
		state.class = data.class;
		state.subclass = data.subclass;
		state.equipment = data.equipment || [];
		state.equipmentChoices = data.equipmentChoices || {};
		state.backgroundEquipment = data.backgroundEquipment || [];
		state.backgroundEquipmentChoices = data.backgroundEquipmentChoices || {};
		state.hp = data.hp || 0;
		state.senses = data.senses || {};
		state.spells = data.spells || [];
		if (data.proficiencies) Object.assign(state.proficiencies, data.proficiencies);
		return state;
	}
}
