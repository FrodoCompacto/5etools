import {BUILD_MODES} from "./constants.js";

/** @type {readonly import("./contracts.js").WizardTabDefinition[]} */
export const WIZARD_TABS = [
	{
		id: "class",
		label: "Class",
		stateKey: "classState",
		datasetProps: ["class"],
		visibility: "always",
		domainComponentId: "class",
		layout: "twoColumn",
		selectTitle: "Select a Class",
		headerMetaLabel: "Primary Class",
	},
	{
		id: "origin-background",
		label: "Origin (Background)",
		stateKey: "backgroundState",
		datasetProps: ["background"],
		visibility: "newCharacter",
		domainComponentId: "origin-background",
		layout: "twoColumn",
		selectTitle: "Select a Background",
	},
	{
		id: "origin-species",
		label: "Origin (Species)",
		stateKey: "speciesState",
		datasetProps: ["race"],
		visibility: "newCharacter",
		domainComponentId: "origin-species",
		layout: "twoColumn",
		selectTitle: "Select a Species",
	},
	{
		id: "origin-other",
		label: "Origin (Other)",
		stateKey: "originOtherState",
		visibility: "newCharacter",
		domainComponentId: "origin-other",
		layout: "twoColumn",
		selectTitle: "Select Other Origin Options",
	},
	{
		id: "abilities",
		label: "Abilities",
		stateKey: "abilityState",
		visibility: "always",
		domainComponentId: "abilities",
		layout: "singleColumn",
		selectTitle: "Abilities",
	},
	{
		id: "starting-equipment",
		label: "Starting Equipment",
		stateKey: "startingEquipmentState",
		datasetProps: ["item"],
		visibility: "newCharacter",
		domainComponentId: "starting-equipment",
		layout: "twoColumn",
		selectTitle: "Select Starting Equipment",
	},
	{
		id: "equipment-shop",
		label: "Equipment Shop",
		stateKey: "equipmentShopState",
		datasetProps: ["item"],
		visibility: "newCharacter",
		domainComponentId: "equipment-shop",
		layout: "twoColumn",
		selectTitle: "Equipment Shop",
	},
	{
		id: "spells",
		label: "Spells",
		stateKey: "spellState",
		datasetProps: ["spell"],
		visibility: "always",
		domainComponentId: "spells",
		layout: "twoColumn",
		selectTitle: "Select Spells",
	},
	{
		id: "feats",
		label: "Feats",
		stateKey: "featState",
		datasetProps: ["feat"],
		visibility: "always",
		domainComponentId: "feats",
		layout: "twoColumn",
		selectTitle: "Select Feats",
	},
	{
		id: "review",
		label: "Review",
		stateKey: null,
		visibility: "always",
		domainComponentId: "review",
		layout: "singleColumn",
		selectTitle: "Review",
	},
];

/**
 * @param {{ buildMode?: string }} [opts]
 * @returns {import("./contracts.js").WizardTabDefinition[]}
 */
export function getVisibleWizardTabs ({buildMode = BUILD_MODES.NEW_CHARACTER} = {}) {
	if (buildMode === BUILD_MODES.LEVEL_UP) {
		return WIZARD_TABS.filter(tab => tab.visibility === "always");
	}
	return [...WIZARD_TABS];
}

/**
 * @param {string} id
 * @returns {import("./contracts.js").WizardTabDefinition|null}
 */
export function getWizardTabById (id) {
	return WIZARD_TABS.find(tab => tab.id === id) || null;
}
