import {BUILD_MODES, CHARACTERMANCER_STATE_VERSION} from "../core/constants.js";

/**
 * @param {object|null|undefined} data
 * @returns {object}
 */
export function migrateCharacterBuildState (data) {
	if (!data) {
		return {
			stateVersion: CHARACTERMANCER_STATE_VERSION,
			meta: {buildMode: BUILD_MODES.NEW_CHARACTER},
		};
	}

	const version = data.stateVersion ?? 1;
	if (version >= CHARACTERMANCER_STATE_VERSION) return {...data};

	const migrated = {...data};
	const origin = migrated.originState || {};

	if (origin.background != null) migrated.backgroundState = origin.background;
	if (origin.species != null) migrated.speciesState = origin.species;
	else if (origin.race != null) migrated.speciesState = origin.race;
	if (origin.other != null) migrated.originOtherState = origin.other;

	if (migrated.equipmentState != null && Object.keys(migrated.equipmentState).length) {
		migrated.startingEquipmentState = MiscUtil.copyFast(migrated.equipmentState);
	}

	delete migrated.originState;
	delete migrated.equipmentState;

	migrated.stateVersion = CHARACTERMANCER_STATE_VERSION;

	if (!migrated.meta) migrated.meta = {};
	if (migrated.meta.buildMode == null) migrated.meta.buildMode = BUILD_MODES.NEW_CHARACTER;

	return migrated;
}
