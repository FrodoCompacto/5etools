export const CHARACTERMANCER_STATE_VERSION = 2;

export const BUILD_MODES = {
	NEW_CHARACTER: "newCharacter",
	LEVEL_UP: "levelUp",
};

/** @type {readonly string[]} */
export const DOMAIN_PROPS = [
	"class",
	"race",
	"background",
	"spell",
	"feat",
	"item",
	"optionalfeature",
	"language",
];

export const PIPELINE_IDS = {
	OFFICIAL_ALL: "official-all",
	PRERELEASE: "prerelease",
	BREW: "brew",
	CUSTOM_URL: "custom-url",
	UPLOAD_FILE: "upload-file",
};
