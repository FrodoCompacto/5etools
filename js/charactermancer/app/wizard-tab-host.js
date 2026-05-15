import {DomainTabFrame} from "./domain-tab-frame.js";

export class WizardTabHost extends BaseComponent {
	/**
	 * @param {{
	 *   visibleTabs: import("../core/contracts.js").WizardTabDefinition[],
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   getActiveTabId: () => string,
	 *   setActiveTabId: (id: string) => void,
	 * }} opts
	 */
	constructor ({visibleTabs, buildState, getActiveTabId, setActiveTabId}) {
		super();
		TabUiUtil.decorate(this, {isInitMeta: true});

		this._visibleTabs = visibleTabs;
		this._buildState = buildState;
		this._getActiveTabId = getActiveTabId;
		this._setActiveTabId = setActiveTabId;
		/** @type {Map<string, import("../core/contracts.js").DomainTabFrameMount>} */
		this._frameByTabId = new Map();
		/** @type {Array<{ tab: import("../core/contracts.js").WizardTabDefinition, btnTab: HTMLElementExtended, wrpTab: HTMLElementExtended }>} */
		this._tabMetasOut = [];
	}

	/**
	 * @param {HTMLElementExtended} eleParent
	 * @param {{ onTabsReady?: () => void }} [opts]
	 */
	renderTabs ({eleParent, onTabsReady} = {}) {
		eleParent.empty();
		this._frameByTabId.clear();
		this._tabMetasOut = [];

		const {propActive, _propProxy} = this._getTabProps({propProxy: "meta"});

		const activeId = this._getActiveTabId();
		let ixInitial = this._visibleTabs.findIndex(t => t.id === activeId);
		if (ixInitial < 0) ixInitial = 0;
		this._meta[propActive] = ixInitial;

		this._visibleTabs.forEach((tab, ix) => {
			const tabMeta = new TabUiUtil.TabMeta({
				name: tab.label,
				hasBorder: true,
				hasBackground: true,
			});

			const btnTab = this.__getBtnTab({tabMeta, _propProxy, propActive, ixTab: ix});
			btnTab.addClass("ve-btn-sm");

			const wrpTab = this.__getWrpTab({tabMeta});
			wrpTab
				.addClass("cmchr__tab-panel")
				.addClass("ve-flex-col")
				.addClass("w-100")
				.addClass("h-100")
				.addClass("min-h-0");

			this._tabMetasOut.push({tab, btnTab, wrpTab});
		});

		const wrpHeads = ee`<div class="ve-flex w-100 no-shrink ui-tab__wrp-tab-heads--border"></div>`;
		this._tabMetasOut.forEach(it => wrpHeads.append(it.btnTab));

		const wrpBodies = ee`<div class="cmchr__tab-bodies ve-flex-col flex-1 min-h-0 w-100"></div>`;
		this._tabMetasOut.forEach(it => {
			const mount = DomainTabFrame.render({
				parent: it.wrpTab,
				tab: it.tab,
				buildState: this._buildState,
			});
			this._frameByTabId.set(it.tab.id, mount);
			wrpBodies.append(it.wrpTab);
		});

		ee`<div class="cmchr__tabs-inner ve-flex-col w-100 h-100 min-h-0">
			${wrpHeads}
			${wrpBodies}
		</div>`.appendTo(eleParent);

		const hkActiveTab = () => {
			const ixActive = this._meta[propActive];
			this._tabMetasOut.forEach((it, ix) => {
				const isActive = ix === ixActive;
				it.btnTab.toggleClass("active", isActive);
				it.wrpTab.toggleVe(isActive);
				if (isActive) this._setActiveTabId(it.tab.id);
			});
			if (onTabsReady) onTabsReady();
		};

		this._addHook("meta", propActive, hkActiveTab);
		hkActiveTab();
	}

	setActiveTabById (tabId) {
		const ix = this._visibleTabs.findIndex(t => t.id === tabId);
		if (ix < 0) return;
		this._meta.ixActiveTab__default = ix;
	}

	getFrameMount (tabId) {
		return this._frameByTabId.get(tabId) || null;
	}

	_hasPrevTab () {
		return this._meta.ixActiveTab__default > 0;
	}

	_hasNextTab () {
		return this._meta.ixActiveTab__default < this._visibleTabs.length - 1;
	}

	_doSwitchToPrevTab () {
		if (!this._hasPrevTab()) return;
		this._meta.ixActiveTab__default -= 1;
	}

	_doSwitchToNextTab () {
		if (!this._hasNextTab()) return;
		this._meta.ixActiveTab__default += 1;
	}
}
