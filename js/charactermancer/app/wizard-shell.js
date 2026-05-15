import {BUILD_MODES} from "../core/constants.js";
import {getVisibleWizardTabs} from "../core/wizard-tabs.js";
import {getDatasetCounts} from "../data/util/prop-meta.js";
import {FinalizeRunner} from "../finalize/finalize-runner.js";
import {WizardTabHost} from "./wizard-tab-host.js";

export class WizardShell {
	/**
	 * @param {{
	 *   dataset: import("../core/contracts.js").UnifiedDataset,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 * }} opts
	 */
	constructor ({dataset, buildState}) {
		this._dataset = dataset;
		this._buildState = buildState;
		this._activeTabId = buildState.meta?.lastTabId || "class";
		this._$root = null;
		this._tabHost = null;
		this._$btnPrev = null;
		this._$btnNext = null;
	}

	/** @param {import("../core/contracts.js").UnifiedDataset} dataset */
	updateDataset (dataset) {
		this._dataset = dataset;
	}

	_getBuildMode () {
		return this._buildState.meta?.buildMode ?? BUILD_MODES.NEW_CHARACTER;
	}

	_getVisibleTabs () {
		return getVisibleWizardTabs({buildMode: this._getBuildMode()});
	}

	_ensureActiveTabVisible () {
		const visible = this._getVisibleTabs();
		if (!visible.length) return;
		if (!visible.some(tab => tab.id === this._activeTabId)) {
			this._activeTabId = visible[0].id;
		}
	}

	_syncActiveTabToMeta () {
		this._buildState.meta = this._buildState.meta || {};
		this._buildState.meta.lastTabId = this._activeTabId;
	}

	_updateFooterNav () {
		if (!this._tabHost || !this._$btnPrev || !this._$btnNext) return;
		this._$btnPrev.prop("disabled", !this._tabHost._hasPrevTab());
		this._$btnNext.prop("disabled", !this._tabHost._hasNextTab());
	}

	render (parent) {
		parent.empty();
		parent.addClass("cmchr");
		this._ensureActiveTabVisible();

		const visibleTabs = this._getVisibleTabs();

		this._tabHost = new WizardTabHost({
			visibleTabs,
			buildState: this._buildState,
			getActiveTabId: () => this._activeTabId,
			setActiveTabId: id => {
				this._activeTabId = id;
				this._syncActiveTabToMeta();
			},
		});

		this._$root = ee`<div class="cmchr__shell ve-flex-col w-100 h-100 min-h-0">
			<div class="cmchr__tabs-mount ve-flex-col flex-1 min-h-0 w-100"></div>
			<hr class="ve-hr-1 ve-w-100 my-2">
			<div class="cmchr__footer ve-flex-v-center w-100 ve-px-3 pb-2">
				<div class="ve-flex-v-center ve-btn-group cmchr__footer-manage" id="charactermancer-btngroup-manager">
					<button type="button" class="ve-btn ve-btn-xs ve-btn-primary" name="manage-content">Manage Content</button>
					<button type="button" class="ve-btn ve-btn-xs ve-btn-primary" name="manage-prerelease" title="Manage Prerelease Content"><span class="glyphicon glyphicon-wrench"></span></button>
					<button type="button" class="ve-btn ve-btn-xs ve-btn-info" name="manage-brew" title="Manage Homebrew"><span class="glyphicon glyphicon-glass"></span></button>
				</div>
				<div class="cmchr__footer-nav ve-flex-v-center ml-auto">
					<div class="ve-flex-v-center ve-btn-group">
						<button type="button" class="ve-btn ve-btn-5et ve-btn-default ve-w-100p cmchr__btn-prev">Previous</button>
						<button type="button" class="ve-btn ve-btn-5et ve-btn-default ve-w-100p cmchr__btn-next">Next</button>
					</div>
					<div class="ve-vr-2 mx-2"></div>
					<button type="button" class="ve-btn ve-btn-5et ve-btn-primary cmchr__btn-finalize">Finalize</button>
				</div>
			</div>
			<details class="cmchr__dev-details ve-small ve-muted mt-1 mx-2">
				<summary class="mb-1">Build state (dev)</summary>
				<pre class="cmchr__dev-pre mb-2" style="white-space: pre-wrap; max-height: 120px; overflow: auto;"></pre>
				<p class="cmchr__dev-counts mb-0 ve-small"></p>
			</details>
		</div>`;

		const wrpTabsMount = this._$root.find(".cmchr__tabs-mount");
		this._$btnPrev = this._$root.find(".cmchr__btn-prev");
		this._$btnNext = this._$root.find(".cmchr__btn-next");

		this._$btnPrev.onn("click", () => {
			this._tabHost._doSwitchToPrevTab();
		});
		this._$btnNext.onn("click", () => {
			this._tabHost._doSwitchToNextTab();
		});
		this._$root.find(".cmchr__btn-finalize").onn("click", () => this._onFinalize());

		this._tabHost.renderTabs({
			eleParent: wrpTabsMount,
			onTabsReady: () => this._updateFooterNav(),
		});
		this._tabHost._addHook("meta", "ixActiveTab__default", () => this._updateFooterNav());

		const pre = this._$root.find(".cmchr__dev-pre");
		pre.txt(JSON.stringify(this._buildState.serialize(), null, 2));

		const counts = getDatasetCounts(this._dataset);
		const countLines = Object.entries(counts)
			.map(([prop, n]) => `${prop}: ${n}`)
			.join(" · ");
		this._$root.find(".cmchr__dev-counts").txt(countLines);

		parent.append(this._$root);
		this._updateFooterNav();
	}

	async _onFinalize () {
		const runner = new FinalizeRunner({
			buildState: this._buildState,
			dataset: this._dataset,
		});
		const results = await runner.runBuildPipeline();
		const text = FinalizeRunner.formatResultsForDisplay(results);
		const {eleModalInner} = await UiUtil.pGetShowModal({
			title: "Finalize (stub)",
			cbClose: () => {},
			isUncappedHeight: true,
		});
		const pre = ee`<pre class="ve-small" style="white-space: pre-wrap;"></pre>`;
		pre.txt(text);
		eleModalInner.append(pre);
	}
}
