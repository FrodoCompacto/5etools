import {ModalFilterClasses} from "../../../filter-classes-raw.js";
import {
	getClassIndexInDataset,
	HP_INCREASE_MODES,
	prepareClassesForCharactermancerFilter,
	resolveClassFromDataset,
	resolveSubclassFromClass,
} from "../../core/class-build-state.js";
import {ClassPreviewRenderer} from "./class-preview-renderer.js";

export class ClassBuildUi extends BaseComponent {
	/**
	 * @param {{
	 *   dataset: import("../../core/contracts.js").UnifiedDataset,
	 *   buildState: import("../../state/character-build-state.js").CharacterBuildState,
	 *   frameMount: import("../../core/contracts.js").DomainTabFrameMount,
	 *   headerMetaLabel?: string,
	 *   onStateChange?: () => void,
	 * }} opts
	 */
	constructor ({dataset, buildState, frameMount, headerMetaLabel, onStateChange}) {
		super();
		this._dataset = dataset;
		this._buildState = buildState;
		this._frameMount = frameMount;
		this._headerMetaLabel = headerMetaLabel || "Primary Class";
		this._onStateChange = onStateChange;

		this._classes = dataset.class || [];
		prepareClassesForCharactermancerFilter(this._classes);

		this._modalFilter = new ModalFilterClasses({
			namespace: "charactermancer.class",
			allData: this._classes,
		});

		const entry = this._getEntry();
		const ixClass = getClassIndexInDataset(dataset, entry.classRef);
		this._state.ixClass = ixClass >= 0 ? ixClass : null;
		this._state.ixSubclass = this._getSubclassIndex(entry);
		this._state.hpIncreaseMode = entry.hpIncreaseMode;
		this._state.isCollapsed = !!entry.isCollapsed;
		this._searchQuery = "";
		this._isFilterReady = false;
		/** @type {HTMLElementExtended|null} */
		this._wrpEntryBody = null;
	}

	/**
	 * Init page filter with mini-pills mounted in the charactermancer filter bar.
	 * Do not use pPopulateHiddenWrapper + reset — reset re-renders minis without a parent.
	 */
	async pInitFilters () {
		prepareClassesForCharactermancerFilter(this._classes);

		const wrpMini = this._frameMount.wrpFilterBar?.find(".fltr__mini-view");
		if (wrpMini?.length) wrpMini.empty();

		await this._modalFilter._pInit();

		const pageFilter = this._modalFilter.pageFilter;
		await pageFilter.pInitFilterBox({
			namespace: "charactermancer.class",
			wrpMiniPills: wrpMini,
		});

		this._modalFilter.setHiddenWrapperAllData(this._classes);
		pageFilter.filterBox.render();

		this._isFilterReady = true;
	}

	_bindFilterBoxHooks () {
		const filterBox = this._modalFilter.pageFilter?.filterBox;
		if (!filterBox) return;
		filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => this._applySelFilters());
	}

	_getEntry () {
		return this._buildState.classState.entries[0];
	}

	_getSubclassIndex (entry) {
		const cls = resolveClassFromDataset(this._dataset, entry.classRef);
		if (!cls || !entry.subclassRef) return null;
		const ix = (cls.subclasses || []).findIndex(it => it.name === entry.subclassRef.name && it.source === entry.subclassRef.source);
		return ~ix ? ix : null;
	}

	/** @returns {object|null} */
	_getActiveClass () {
		if (this._state.ixClass != null && this._state.ixClass >= 0) {
			const fromIx = this._classes[this._state.ixClass];
			if (fromIx) return fromIx;
		}
		return resolveClassFromDataset(this._dataset, this._getEntry().classRef);
	}

	/** @returns {object|null} */
	_getActiveSubclass () {
		const cls = this._getActiveClass();
		if (!cls) return null;

		if (this._state.ixSubclass != null && this._state.ixSubclass >= 0) {
			const fromIx = cls.subclasses?.[this._state.ixSubclass];
			if (fromIx) return fromIx;
		}
		return resolveSubclassFromClass(cls, this._getEntry().subclassRef);
	}

	_restoreSelectionFromEntry () {
		const entry = this._getEntry();

		if (entry.classRef) {
			const ixClass = getClassIndexInDataset(this._dataset, entry.classRef);
			if (ixClass >= 0) this._state.ixClass = ixClass;
		}

		if (entry.subclassRef && this._state.ixClass != null) {
			const ixSubclass = this._getSubclassIndex(entry);
			if (ixSubclass != null) this._state.ixSubclass = ixSubclass;
		}
	}

	_notifyChange () {
		this._onStateChange?.();
	}

	_syncEntryFromState () {
		const entry = this._getEntry();
		const cls = this._getActiveClass();
		const sc = this._getActiveSubclass();

		entry.classRef = cls ? {name: cls.name, source: cls.source} : null;
		entry.subclassRef = sc ? {name: sc.name, source: sc.source, shortName: sc.shortName} : null;

		entry.hpIncreaseMode = this._state.hpIncreaseMode;
		entry.isCollapsed = this._state.isCollapsed;
		entry.targetLevel = entry.targetLevel || 1;
		entry.isPrimary = true;

		this._buildState.classState.totalLevels = entry.targetLevel;

		this._notifyChange();
		this._renderPreview();
		this._renderDetailSections({wrpEntryBody: this._wrpEntryBody});
	}

	render () {
		const mount = this._frameMount;
		if (!mount.wrpLeft || !mount.wrpRight) return;

		mount.wrpLeft.empty();

		const metaLabel = this._headerMetaLabel;
		const btnPrimaryMeta = ee`<button type="button" class="ve-btn ve-btn-default ve-btn-xs ve-mr-2" title="This is your primary class, i.e. the one you chose at level 1 for the purposes of proficiencies/etc." disabled>${metaLabel}</button>`;
		const btnCollapse = ee`<button type="button" class="ve-btn ve-btn-xs ve-btn-default cmchr__btn-entry-collapse ve-clickable ve-muted" title="Collapse">[\u2212]</button>`;
		const wrpEntryBody = ee`<div class="cmchr__entry-body ve-flex-col ve-mt-2"></div>`;
		this._wrpEntryBody = wrpEntryBody;

		const wrpEntry = ee`<div class="cmchr__entry">
			<div class="cmchr__entry-head split-v-center">
				<div class="ve-bold mb-0">Select a Class</div>
				<div class="ve-flex-v-center">
					${btnPrimaryMeta}
					${btnCollapse}
				</div>
			</div>
			${wrpEntryBody}
		</div>`;

		mount.wrpLeft.append(wrpEntry);

		const hkCollapse = () => {
			wrpEntryBody.toggleVe(!this._state.isCollapsed);
			btnCollapse.txt(this._state.isCollapsed ? "[+]" : "[\u2212]");
		};
		this._addHookBase("isCollapsed", hkCollapse);
		hkCollapse();

		btnCollapse.onn("click", () => {
			this._state.isCollapsed = !this._state.isCollapsed;
		});

		this._renderSelectionControls({wrpEntryBody});
		this._restoreSelectionFromEntry();
		this._syncEntryFromState();

		if (mount.useGlobalListFilter !== false) {
			mount.enableFilterChrome?.({
				onFilterClick: () => {
					if (this._isFilterReady) this._modalFilter.handleHiddenOpenButtonClick();
					else this._pOpenFilterModal();
				},
				onResetClick: () => {
					if (this._isFilterReady) this._modalFilter.handleHiddenResetButtonClick();
					this._resetSearchFilter();
				},
				onSearchInput: q => this._applySearchFilter(q),
			});
		}

		this._renderPreview();
	}

	_resetSearchFilter () {
		this._searchQuery = "";
		this._applySelFilters();
	}

	_applySearchFilter (query) {
		this._searchQuery = query;
		this._applySelFilters();
	}

	_applySelFilters () {
		const filterBox = this._modalFilter.pageFilter?.filterBox;

		if (this._setFnFilterClass) {
			this._setFnFilterClass(ix => {
				const cls = this._classes[ix];
				if (!cls) return false;
				if (this._searchQuery && !cls.name.toLowerCase().includes(this._searchQuery)) return false;
				if (!filterBox) return true;
				const f = filterBox.getValues();
				return this._modalFilter.pageFilter.toDisplay(f, cls);
			});
		}
		if (this._setFnFilterSubclass) {
			this._setFnFilterSubclass(ix => {
				const cls = this._state.ixClass != null ? this._classes[this._state.ixClass] : null;
				const sc = cls?.subclasses?.[ix];
				if (!sc) return false;
				if (this._searchQuery && !`${sc.name} ${sc.shortName || ""}`.toLowerCase().includes(this._searchQuery)) return false;
				return true;
			});
		}
	}

	_renderSelectionControls ({wrpEntryBody}) {
		const wrpSel = ee`<div class="cmchr__class-sel ve-flex-col ve-w-100"></div>`;
		wrpEntryBody.append(wrpSel);

		const {wrp: wrpClassSel, setFnFilter: setFnFilterClass} = ComponentUiUtil.getSelSearchable(
			this,
			"ixClass",
			{
				values: this._classes.map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => ClassBuildUi._getClassDisplayName(this._classes[ix]),
				asMeta: true,
			},
		);
		this._setFnFilterClass = setFnFilterClass;

		const {wrp: wrpSubclassSel, setFnFilter: setFnFilterSubclass, setValues: setValuesSubclass} = ComponentUiUtil.getSelSearchable(
			this,
			"ixSubclass",
			{
				values: [],
				isAllowNull: true,
				fnDisplay: ix => {
					const cls = this._state.ixClass != null ? this._classes[this._state.ixClass] : null;
					return ClassBuildUi._getSubclassDisplayName(cls?.subclasses?.[ix]);
				},
				asMeta: true,
			},
		);
		this._setFnFilterSubclass = setFnFilterSubclass;
		this._setValuesSubclass = setValuesSubclass;

		const btnFilterInline = ee`<button type="button" class="ve-btn ve-btn-xs ve-btn-default ve-h-100 ve-btr-0 ve-bbr-0 ve-pr-2" title="Filter for Class and Subclass"><span class="glyphicon glyphicon-filter"></span> Filter</button>`;

		const wrpSubclassRow = ee`<div class="ve-flex-col ve-w-100 ve-mt-1"></div>`;

		const hkSubclassValues = () => {
			const cls = this._state.ixClass != null ? this._classes[this._state.ixClass] : null;
			const values = cls?.subclasses?.length ? cls.subclasses.map((_, i) => i) : [];
			this._setValuesSubclass(values);
			wrpSubclassRow.toggleVe(!!values.length);
			if (this._state.ixSubclass != null && !values.includes(this._state.ixSubclass)) {
				this._state.ixSubclass = null;
			}
		};

		this._addHookBase("ixClass", () => {
			hkSubclassValues();
			this._syncEntryFromState();
		});
		this._addHookBase("ixSubclass", () => this._syncEntryFromState());
		this._addHookBase("hpIncreaseMode", () => {
			this._getEntry().hpIncreaseMode = this._state.hpIncreaseMode;
			this._notifyChange();
		});

		hkSubclassValues();

		this._bindFilterBoxHooks();
		this._applySelFilters();

		btnFilterInline.onn("click", () => {
			if (this._isFilterReady) this._modalFilter.handleHiddenOpenButtonClick();
			else this._pOpenFilterModal();
		});

		wrpSel.append(
			ee`<div class="ve-flex ve-btn-group ve-w-100">
				<div class="ve-flex ve-no-shrink">${btnFilterInline}</div>
				<div class="ve-flex-col ve-w-100">${wrpClassSel}</div>
			</div>
			${wrpSubclassRow}`,
		);
		wrpSubclassRow.append(wrpSubclassSel);
	}

	async _pOpenFilterModal () {
		const entry = this._getEntry();
		const cls = resolveClassFromDataset(this._dataset, entry.classRef);
		const sc = resolveSubclassFromClass(cls, entry.subclassRef);

		const out = await this._modalFilter.pGetUserSelection({
			selectedClass: cls,
			selectedSubclass: sc,
		});
		if (!out?.class) return;

		const ixClass = this._classes.findIndex(it => it.name === out.class.name && it.source === out.class.source);
		if (!~ixClass) return;

		this._state.ixClass = ixClass;

		if (out.subclass) {
			const ixSc = out.class.subclasses.findIndex(it => it.name === out.subclass.name && it.source === out.subclass.source);
			this._state.ixSubclass = ~ixSc ? ixSc : null;
		} else {
			this._state.ixSubclass = null;
		}

		this._syncEntryFromState();
		this._setValuesSubclass?.(this._getActiveClass()?.subclasses?.map((_, i) => i) ?? []);
	}

	_renderDetailSections ({wrpEntryBody} = {}) {
		if (!wrpEntryBody) {
			wrpEntryBody = this._frameMount.wrpLeft?.find(".cmchr__entry-body");
		}
		if (!wrpEntryBody) return;

		let stgDetails = wrpEntryBody.find(".cmchr__class-details");
		if (!stgDetails) {
			stgDetails = ee`<div class="cmchr__class-details ve-flex-col"></div>`;
			wrpEntryBody.append(stgDetails);
		} else {
			stgDetails.empty();
		}

		const cls = this._getActiveClass();
		if (!cls) {
			stgDetails.empty();
			stgDetails.toggleVe(false);
			return;
		}
		stgDetails.toggleVe(true);

		const selHpMode = ee`<select class="ve-form-control ve-input-xs cmchr__sel-hp-mode"></select>`;
		[
			[HP_INCREASE_MODES.AVERAGE, "Take Average"],
			[HP_INCREASE_MODES.MIN, "Minimum Value"],
			[HP_INCREASE_MODES.MAX, "Maximum Value"],
			[HP_INCREASE_MODES.ROLL, "Roll"],
			[HP_INCREASE_MODES.ROLL_CUSTOM, "Roll (Custom Formula)"],
			[HP_INCREASE_MODES.NONE, "Do Not Increase HP"],
		].forEach(([val, label]) => selHpMode.append(ee`<option value="${val}">${label}</option>`));
		selHpMode.val(this._state.hpIncreaseMode);
		selHpMode.onn("change", () => {
			this._state.hpIncreaseMode = selHpMode.val();
		});

		const wrpHpSummary = ee`<div class="cmchr__hp-summary ve-flex-col ve-small"></div>`;
		const wrpSaveProfs = ee`<div class="cmchr__save-profs ve-flex-col"></div>`;
		const wrpSkillProfs = ee`<div class="cmchr__skill-profs ve-flex-col"></div>`;

		stgDetails.append(
			ee`<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Hit Points Increase Mode</div>
			${selHpMode}
			<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Hit Points</div>
			${wrpHpSummary}
			<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Saving Throw Proficiencies</div>
			${wrpSaveProfs}
			<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Skill Proficiencies</div>
			${wrpSkillProfs}`,
		);

		ClassBuildUi._renderHpSummary({wrpHpSummary, cls});
		ClassBuildUi._renderSavingThrows({wrpSaveProfs, cls});
		ClassBuildUi._renderSkillProficiencies({wrpSkillProfs, cls});
	}

	static _renderHpSummary ({wrpHpSummary, cls}) {
		wrpHpSummary.empty();
		try {
			const html = Renderer?.class?.getHtmlPtHitPoints(cls);
			if (!html) {
				wrpHpSummary.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
				return;
			}
			wrpHpSummary.html(html);
		} catch (err) {
			console.error(err);
			wrpHpSummary.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
		}
	}

	static _renderSavingThrows ({wrpSaveProfs, cls}) {
		wrpSaveProfs.empty();
		try {
			const html = Renderer?.class?.getHtmlPtSavingThrows(cls);
			if (html) wrpSaveProfs.html(html);
			else wrpSaveProfs.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
		} catch (err) {
			console.error(err);
			wrpSaveProfs.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
		}
	}

	static _renderSkillProficiencies ({wrpSkillProfs, cls}) {
		wrpSkillProfs.empty();
		try {
			const html = Renderer?.class?.getHtmlPtSkills(cls);
			if (html) wrpSkillProfs.html(html);
			else wrpSkillProfs.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
		} catch (err) {
			console.error(err);
			wrpSkillProfs.append(ee`<p class="ve-muted mb-0">\u2014</p>`);
		}
	}

	_renderPreview () {
		const cls = this._getActiveClass();
		const sc = this._getActiveSubclass();
		ClassPreviewRenderer.render({
			wrpPreview: this._frameMount.wrpRight,
			cls,
			sc,
		});
	}

	static _getClassDisplayName (cls) {
		if (!cls) return "(Unknown)";
		return `${cls.name}${cls.source !== Parser.SRC_PHB ? ` [${Parser.sourceJsonToAbv(cls.source)}]` : ""}`;
	}

	static _getSubclassDisplayName (sc) {
		if (!sc) return "Select a Subclass";
		return `${sc.name || sc.shortName}${sc.source !== Parser.SRC_PHB ? ` [${Parser.sourceJsonToAbv(sc.source)}]` : ""}`;
	}

	/**
	 * @returns {import("../../core/contracts.js").DomainComponentValidateResult}
	 */
	validate () {
		const messages = [];
		const entry = this._getEntry();

		if (!entry.classRef) messages.push("Select a class.");

		const cls = resolveClassFromDataset(this._dataset, entry.classRef);
		if (cls?.subclasses?.length && !entry.subclassRef) {
			messages.push("Select a subclass for this class.");
		}

		if ((entry.targetLevel || 0) < 1) messages.push("Class level must be at least 1.");

		return {isValid: !messages.length, messages};
	}
}
