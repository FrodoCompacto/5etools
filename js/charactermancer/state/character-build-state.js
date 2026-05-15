import {BUILD_MODES, CHARACTERMANCER_STATE_VERSION} from "../core/constants.js";
import {migrateCharacterBuildState} from "./character-build-state-migrate.js";

export class CharacterBuildState {
	constructor () {
		this.stateVersion = CHARACTERMANCER_STATE_VERSION;
		this.classState = {};
		this.backgroundState = {};
		this.speciesState = {};
		this.originOtherState = {};
		this.abilityState = {};
		this.startingEquipmentState = {};
		this.equipmentShopState = {};
		this.spellState = {};
		this.featState = {};
		this.derivedState = {};
		this.meta = {buildMode: BUILD_MODES.NEW_CHARACTER};
	}

	serialize () {
		return {
			stateVersion: this.stateVersion,
			classState: MiscUtil.copyFast(this.classState),
			backgroundState: MiscUtil.copyFast(this.backgroundState),
			speciesState: MiscUtil.copyFast(this.speciesState),
			originOtherState: MiscUtil.copyFast(this.originOtherState),
			abilityState: MiscUtil.copyFast(this.abilityState),
			startingEquipmentState: MiscUtil.copyFast(this.startingEquipmentState),
			equipmentShopState: MiscUtil.copyFast(this.equipmentShopState),
			spellState: MiscUtil.copyFast(this.spellState),
			featState: MiscUtil.copyFast(this.featState),
			derivedState: MiscUtil.copyFast(this.derivedState),
			meta: MiscUtil.copyFast(this.meta),
		};
	}

	static fromSerialized (data) {
		const migrated = migrateCharacterBuildState(data);
		const state = new CharacterBuildState();
		if (!migrated) return state;

		if (migrated.stateVersion != null) state.stateVersion = migrated.stateVersion;
		state.classState = migrated.classState || {};
		state.backgroundState = migrated.backgroundState || {};
		state.speciesState = migrated.speciesState || {};
		state.originOtherState = migrated.originOtherState || {};
		state.abilityState = migrated.abilityState || {};
		state.startingEquipmentState = migrated.startingEquipmentState || {};
		state.equipmentShopState = migrated.equipmentShopState || {};
		state.spellState = migrated.spellState || {};
		state.featState = migrated.featState || {};
		state.derivedState = migrated.derivedState || {};
		state.meta = {
			buildMode: BUILD_MODES.NEW_CHARACTER,
			...migrated.meta,
		};
		if (state.meta.buildMode == null) state.meta.buildMode = BUILD_MODES.NEW_CHARACTER;
		return state;
	}
}
