import {ManageBrewUi} from "../../utils-brew/utils-brew-ui-manage.js";
import {DataBundler} from "../data/bundler/data-bundler.js";
import {PipelinesListCharactermancer} from "../data/pipelines/pipelines-list.js";
import {CharacterBuildState} from "../state/character-build-state.js";
import {WizardShell} from "./wizard-shell.js";

export class CharactermancerApp {
	constructor () {
		this._$main = null;
		this._buildState = new CharacterBuildState();
		/** @type {import("../core/contracts.js").UnifiedDataset|null} */
		this._dataset = null;
		/** @type {import("../core/contracts.js").DataBundle|null} */
		this._dataBundle = null;
		/** @type {WizardShell|null} */
		this._wizardShell = null;
	}

	async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		this._$main = es("#charactermancer-main");
		if (!this._$main) throw new Error("Missing #charactermancer-main");

		await this._pLoadDataset();

		window.dispatchEvent(new Event("toolsLoaded"));
	}

	async _pLoadDataset () {
		this._$main.html(`<div class="ve-flex-vh-center w-100 h-100"><i>Loading...</i></div>`);

		try {
			const pipelines = PipelinesListCharactermancer.getGlobalSitePipelines();
			this._dataBundle = await DataBundler.pLoad({pipelines});
			this._dataset = this._dataBundle.dataset;
			this._buildState.meta = {
				...this._buildState.meta,
				lastBundle: this._dataBundle.meta,
				cacheKeys: this._dataBundle.cacheKeys,
			};

			if (!this._wizardShell) {
				this._wizardShell = new WizardShell({
					dataset: this._dataset,
					buildState: this._buildState,
				});
			} else {
				this._wizardShell.updateDataset(this._dataset);
			}
			this._$main.empty();
			await this._wizardShell.render(this._$main);
			this._bindManageContent();
		} catch (err) {
			console.error(err);
			this._$main.html(`<div class="ve-flex-vh-center w-100 h-100 ve-danger">Failed to load content. See console.</div>`);
			JqueryUtil.doToast({content: "Failed to load content!", type: "danger"});
		}
	}

	_bindManageContent () {
		const btngroup = e_({id: "charactermancer-btngroup-manager"});
		if (!btngroup) return;
		ManageBrewUi.bindBtngroupManager(btngroup);
	}
}
