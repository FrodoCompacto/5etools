import {PIPELINE_IDS} from "../../core/constants.js";
import {CharactermancerPipeline} from "./pipeline.js";
import {pLoadBrewContents} from "../sources/source-brew.js";
import {pLoadCustomUrlContents} from "../sources/source-custom-url.js";
import {pLoadOfficialAllContents} from "../sources/source-official-all.js";
import {pLoadPrereleaseContents} from "../sources/source-prerelease.js";
import {pLoadUploadFileContents} from "../sources/source-upload-file.js";

export class PipelinesListCharactermancer {
	static pGetAll () {
		return [
			new CharactermancerPipeline({
				id: PIPELINE_IDS.OFFICIAL_ALL,
				label: "Official (all charactermancer data)",
				sourceTypes: ["official"],
				pLoad: () => pLoadOfficialAllContents(),
			}),
			new CharactermancerPipeline({
				id: PIPELINE_IDS.PRERELEASE,
				label: "Prerelease",
				sourceTypes: ["prerelease"],
				pLoad: () => pLoadPrereleaseContents(),
			}),
			new CharactermancerPipeline({
				id: PIPELINE_IDS.BREW,
				label: "Homebrew",
				sourceTypes: ["brew"],
				pLoad: () => pLoadBrewContents(),
			}),
			new CharactermancerPipeline({
				id: PIPELINE_IDS.CUSTOM_URL,
				label: "Custom URL (stub)",
				sourceTypes: ["custom"],
				isStub: true,
				pLoad: () => pLoadCustomUrlContents(),
			}),
			new CharactermancerPipeline({
				id: PIPELINE_IDS.UPLOAD_FILE,
				label: "Upload file (stub)",
				sourceTypes: ["custom"],
				isStub: true,
				pLoad: () => pLoadUploadFileContents(),
			}),
		];
	}

	static getById (id) {
		return this.pGetAll().find(p => p.id === id) || null;
	}

	static getByIds (ids) {
		const all = this.pGetAll();
		return ids.map(id => all.find(p => p.id === id)).filter(Boolean);
	}

	/** Official + globally loaded prerelease/homebrew (same merge model as ListPage). */
	static getGlobalSitePipelines () {
		return this.getByIds([
			PIPELINE_IDS.OFFICIAL_ALL,
			PIPELINE_IDS.PRERELEASE,
			PIPELINE_IDS.BREW,
		]);
	}
}
