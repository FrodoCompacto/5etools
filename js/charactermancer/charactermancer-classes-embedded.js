"use strict";

/**
 * Embedded Classes viewer for the Charactermancer step "Class".
 * Reuses PageFilterClasses, FilterBox, Renderer.class, RenderClassesSidebar from the main Classes page
 * but runs with local state (no Hist/hash). Notifies parent via onSelectionChange.
 */
const FILTER_BOX_EVNT_VALCHANGE = typeof globalThis.FILTER_BOX_EVNT_VALCHANGE !== "undefined" ? globalThis.FILTER_BOX_EVNT_VALCHANGE : "valchange";

// Minimal duplicate of UtilClassesPage from classes.js for fluff/color helpers (no dependency on full Classes page).
const UtilClassesPage = {
	getColorStyleClasses (entry, { isForceStandardSource, prefix, isSubclass } = {}) {
		if (isSubclass) {
			if (entry.isClassFeatureVariant) {
				if (entry.source && !isForceStandardSource && BrewUtil2.hasSourceJson(entry.source)) return [`${prefix}feature-variant-brew-subclass`];
				if (entry.source && !isForceStandardSource && (SourceUtil.isNonstandardSource(entry.source) || PrereleaseUtil.hasSourceJson(entry.source))) return [`${prefix}feature-variant-ua-subclass`];
				return [`${prefix}feature-variant-subclass`];
			}
			if (entry.isReprinted) {
				if (entry.source && !isForceStandardSource && BrewUtil2.hasSourceJson(entry.source)) return [`${prefix}feature-brew-subclass-reprint`];
				if (entry.source && !isForceStandardSource && (SourceUtil.isNonstandardSource(entry.source) || PrereleaseUtil.hasSourceJson(entry.source))) return [`${prefix}feature-ua-subclass-reprint`];
				return [`${prefix}feature-subclass-reprint`];
			}
			if (entry.source && !isForceStandardSource && BrewUtil2.hasSourceJson(entry.source)) return [`${prefix}feature-brew-subclass`];
			if (entry.source && !isForceStandardSource && (SourceUtil.isNonstandardSource(entry.source) || PrereleaseUtil.hasSourceJson(entry.source))) return [`${prefix}feature-ua-subclass`];
			return [`${prefix}feature-subclass`];
		}
		if (entry.isClassFeatureVariant) {
			if (entry.source && !isForceStandardSource && BrewUtil2.hasSourceJson(entry.source)) return [`${prefix}feature-variant-brew`];
			if (entry.source && !isForceStandardSource && (SourceUtil.isNonstandardSource(entry.source) || PrereleaseUtil.hasSourceJson(entry.source))) return [`${prefix}feature-variant-ua`];
			return [`${prefix}feature-variant`];
		}
		if (entry.source && !isForceStandardSource && BrewUtil2.hasSourceJson(entry.source)) return [`${prefix}feature-brew`];
		if (entry.source && !isForceStandardSource && (SourceUtil.isNonstandardSource(entry.source) || PrereleaseUtil.hasSourceJson(entry.source))) return [`${prefix}feature-ua`];
		return [];
	},
	setRenderFnGetStyleClasses (cls) {
		Renderer.get().setFnGetStyleClasses(UrlUtil.PG_CLASSES, (entry) => {
			if (typeof entry === "string") return null;
			const sc = entry.subclassShortName ? (cls.subclasses || []).find(it => it.shortName === entry.subclassShortName && it.source === entry.subclassSource) : null;
			const isForceStandardSource = sc ? sc._isStandardSource : (entry.source === cls.source);
			return UtilClassesPage.getColorStyleClasses(entry, { isSubclass: !!entry.subclassShortName, isForceStandardSource, prefix: "cls__" });
		});
	},
	unsetRenderFnGetStyleClasses () {
		Renderer.get().setFnGetStyleClasses(UrlUtil.PG_CLASSES, null);
	},
	getSubclassCssMod (cls, sc) {
		if (sc.source !== cls.source) {
			return BrewUtil2.hasSourceJson(sc.source) ? (sc.isReprinted ? "rebrewed" : "brew") : (SourceUtil.isNonstandardSource(sc.source) || PrereleaseUtil.hasSourceJson(sc.source)) ? (sc.isReprinted ? "stale" : "spicy") : (sc.isReprinted ? "reprinted" : "fresh");
		}
		return "fresh";
	},
	_getFluffLayoutImages_header (images) {
		const [img1] = images;
		return [{ maxWidth: "98", maxWidthUnits: "%", ...img1 }];
	},
	_getFluffLayoutImages_footer (images) {
		const [, ...rest] = images;
		return [{ type: "gallery", images: [...rest] }];
	},
	_getRenderedClassSubclassFluff ({ ent, entFluff, depthArr = null, isRemoveRootName = false, isAddLeadingHr = false, isAddTrailingHr = false, isAddSourceNote = false, isIncludeFooterImages = false }) {
		entFluff = MiscUtil.copyFast(entFluff);
		const hasEntries = !!entFluff?.entries?.length;
		const hasImages = !!entFluff?.images?.length;
		let stack = "";
		Renderer.get().setFirstSection(true);
		if (hasEntries) {
			Renderer.get().withDepthTracker(depthArr || [], ({ renderer }) => {
				entFluff.entries.filter(f => f.source === ent.source).forEach(f => { f._isStandardSource = true; });
				entFluff.entries.forEach((f, i) => {
					const cpy = MiscUtil.copyFast(f);
					if (isRemoveRootName && i === 0 && cpy.name && (cpy.name.toLowerCase() === ent.name.toLowerCase() || cpy.name.toLowerCase() === `the ${ent.name.toLowerCase()}`)) delete cpy.name;
					if (isAddSourceNote && typeof cpy !== "string" && cpy.source && cpy.source !== ent.source && cpy.entries) cpy.entries.unshift(`{@note The following information is from ${Parser.sourceJsonToFull(cpy.source)}${Renderer.utils.isDisplayPage(cpy.page) ? `, page ${cpy.page}` : ""}.}`);
					stack += renderer.render(cpy);
				});
			}, { additionalPropsInherited: ["_isStandardSource"] });
		}
		if (hasImages) {
			if (hasEntries) stack += `<div class="py-2"></div>`;
			[...UtilClassesPage._getFluffLayoutImages_header(entFluff.images), ...(isIncludeFooterImages ? UtilClassesPage._getFluffLayoutImages_footer(entFluff.images) : [])].forEach(entImg => { stack += Renderer.get().render(entImg); });
		}
		if (hasImages || hasEntries) {
			if (isAddLeadingHr) stack = Renderer.get().render({ type: "hr" }) + stack;
			if (isAddTrailingHr) stack += Renderer.get().render({ type: "hr" });
		}
		return { hasEntries, hasImages, rendered: stack || null };
	},
	_getRenderedClassSubclassFluffFooter ({ ent, entFluff, isAddLeadingHr = false, isAddTrailingHr = false }) {
		entFluff = MiscUtil.copyFast(entFluff);
		const hasFooterImages = (entFluff?.images?.length || 0) > 1;
		let stack = "";
		Renderer.get().setFirstSection(true);
		if (hasFooterImages) UtilClassesPage._getFluffLayoutImages_footer(entFluff.images).forEach(entImg => { stack += Renderer.get().render(entImg); });
		if (hasFooterImages) {
			if (isAddLeadingHr) stack = Renderer.get().render({ type: "hr" }) + stack;
			if (isAddTrailingHr) stack += Renderer.get().render({ type: "hr" });
		}
		return { hasImages: hasFooterImages, rendered: stack || null };
	},
	getRenderedClassFluffHeader ({ cls, clsFluff, depthArr = null, isRemoveRootName = false, isAddTrailingHr = false }) {
		return UtilClassesPage._getRenderedClassSubclassFluff({ ent: cls, entFluff: clsFluff, depthArr, isRemoveRootName, isAddTrailingHr, isAddSourceNote: true });
	},
	getRenderedClassFluffFooter ({ cls, clsFluff, isAddLeadingHr = false, isAddTrailingHr = false }) {
		return UtilClassesPage._getRenderedClassSubclassFluffFooter({ ent: cls, entFluff: clsFluff, isAddLeadingHr, isAddTrailingHr });
	},
	getRenderedSubclassFluff ({ sc, scFluff, depthArr = null }) {
		return UtilClassesPage._getRenderedClassSubclassFluff({ ent: sc, entFluff: scFluff, depthArr, isAddLeadingHr: true, isAddTrailingHr: true, isIncludeFooterImages: true });
	},
};

function _ascSortSubclasses (scA, scB) {
	return SortUtil.ascSortLower(scA.name, scB.name);
}

function getBtnTitleSubclass (sc) {
	const titlePartReprint = sc.isReprinted ? " (this subclass has been reprinted in a more recent source)" : "";
	const sourcePart = Renderer.utils.getSourceAndPageText(sc);
	return `${sc.name}; Source: ${sourcePart}${titlePartReprint}`;
}

function getBaseShortName (sc) {
	const re = new RegExp(`\\((UA|${sc.source})\\)$`);
	return sc.shortName.trim().replace(re, "").trim();
}

function isSubclassExcluded (cls, sc) {
	return ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER["subclass"]({name: sc.name, shortName: sc.shortName, source: sc.source, className: cls.name, classSource: cls.source}), "subclass", sc.source);
}

export class CharactermancerClassesEmbedded {
	constructor ({wrpRoot, onSelectionChange} = {}) {
		this._wrpRoot = wrpRoot;
		this._onSelectionChange = onSelectionChange || (() => {});

		this._dataList = [];
		this._ixData = 0;
		this._activeIx = -1;
		this._pageFilter = new PageFilterClasses();
		this._filterBox = null;
		this._list = null;
		this._listSubclass = null;

		this._state = {
			feature: null,
			isHideSidebar: false,
			isHideFeatures: false,
			isShowFluff: false,
			isShowScSources: false,
			isHideOutline: false,
		};
		this._hooks = {};
		this._outlineData = {};
		this._activeClassDataFiltered = null;
		this._fnTableHandleFilterChange = null;
		this._fnOutlineHandleFilterChange = null;
		this._$wrpOutline = null;
		this._$trNoContent = null;
		this._RenderClassesSidebar = null;
	}

	get activeClass () {
		if (this._activeClassDataFiltered) return this._activeClassDataFiltered;
		return this._dataList[this._activeIx] || null;
	}

	get activeClassRaw () {
		return this._dataList[this._activeIx] || null;
	}

	_addHook (hookProp, prop, fn) {
		const key = `${hookProp}__${prop}`;
		if (!this._hooks[key]) this._hooks[key] = [];
		this._hooks[key].push(fn);
		return fn;
	}

	_removeHook (hookProp, prop, fn) {
		const key = `${hookProp}__${prop}`;
		if (!this._hooks[key]) return;
		const ix = this._hooks[key].indexOf(fn);
		if (~ix) this._hooks[key].splice(ix, 1);
	}

	_addHookBase (prop, fn) {
		this._addHook("state", prop, fn);
		fn();
		return fn;
	}

	_removeHookBase (prop, fn) {
		this._removeHook("state", prop, fn);
	}

	_fireHook (prop) {
		const key = `state__${prop}`;
		(this._hooks[key] || []).forEach(fn => fn());
	}

	async pInit () {
		const {RenderClassesSidebar: RCS} = await import("../render-class.js");
		this._RenderClassesSidebar = RCS;

		await this._buildDom();
		await Promise.all([PrereleaseUtil.pInit(), BrewUtil2.pInit()]);
		await ExcludeUtil.pInitialise();

		const siteData = await DataUtil.class.loadJSON();
		this._addData(siteData);
		const prereleaseData = await DataUtil.class.loadPrerelease();
		if (prereleaseData) this._addData(prereleaseData);
		const brewData = await DataUtil.class.loadBrew();
		if (brewData) this._addData(brewData);

		this._pageFilter.trimState();

		this._filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => this._handleFilterChange(true));
		this._handleFilterChange(false);

		if (this._list.visibleItems.length && this._activeIx < 0) {
			this._activeIx = this._list.visibleItems[0].ix;
			this._list.update();
		}
		await this._pDoRender();
		this._emitSelection();
	}

	async _buildDom () {
		let root = document.getElementById("cmcls__root") || this._wrpRoot;
		if (!root) {
			root = document.createElement("div");
			root.className = "cmcls__root ve-flex-col min-h-0";
		}
		root.innerHTML = "";
		root.id = "cmcls__root";
		root.className = "cmcls__root ve-flex-col min-h-0";

		const nightShadow = document.createElement("div");
		nightShadow.className = "night__shadow-big";
		root.appendChild(nightShadow);

		const row1 = document.createElement("div");
		row1.className = "cmcls__row row";
		nightShadow.appendChild(row1);

		const colLeft1 = document.createElement("div");
		colLeft1.className = "cmcls__col-left col-md-3";
		row1.appendChild(colLeft1);

		const formTop = document.createElement("div");
		formTop.className = "lst__form-top";
		formTop.id = "cmcls__filter-search-group";
		formTop.innerHTML = `
			<div class="w-100 relative">
				<input type="search" id="cmcls__search" autocomplete="off" autocapitalize="off" spellcheck="false" class="search form-control lst__search lst__search--no-border-h">
				<div id="cmcls__search-glass" class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
			</div>
			<button class="ve-btn ve-btn-default px-2" id="cmcls__reset"><span class="glyphicon glyphicon-refresh"></span></button>
		`;
		colLeft1.appendChild(formTop);

		const filtertools = document.createElement("div");
		filtertools.id = "cmcls__filtertools";
		filtertools.className = "input-group input-group--bottom ve-flex no-shrink";
		filtertools.innerHTML = `
			<button class="ve-col-8 sort ve-btn ve-btn-default ve-btn-xs" data-sort="name">Name</button>
			<button class="sort ve-btn ve-btn-default ve-btn-xs ve-grow" data-sort="source">Source</button>
		`;
		colLeft1.appendChild(filtertools);

		const listDiv = document.createElement("div");
		listDiv.className = "list list--stats classes cls__list";
		listDiv.id = "cmcls__list";
		colLeft1.appendChild(listDiv);

		const colRight1 = document.createElement("div");
		colRight1.className = "cmcls__col-right col-md-9 mobile-sm__ve-overflow-x-auto";
		colRight1.id = "cmcls__classtable";
		row1.appendChild(colRight1);

		const hr = document.createElement("hr");
		hr.className = "mt-0";
		nightShadow.appendChild(hr);

		const row2 = document.createElement("div");
		row2.className = "cmcls__row row ve-flex mobile-md__ve-flex-col";
		nightShadow.appendChild(row2);

		const colLeft2 = document.createElement("div");
		colLeft2.className = "col-md-3";
		row2.appendChild(colLeft2);

		const statsprof = document.createElement("div");
		statsprof.id = "cmcls__statsprof";
		colLeft2.appendChild(statsprof);

		const stickyNav = document.createElement("div");
		stickyNav.id = "cmcls__sticky-nav";
		stickyNav.className = "cls-nav";
		colLeft2.appendChild(stickyNav);

		const colRight2 = document.createElement("div");
		colRight2.className = "col-md-9";
		row2.appendChild(colRight2);

		const subclasstabs = document.createElement("div");
		subclasstabs.id = "cmcls__subclasstabs";
		colRight2.appendChild(subclasstabs);

		const pagecontent = document.createElement("table");
		pagecontent.id = "cmcls__pagecontent";
		pagecontent.className = "w-100 stats shadow-big cls__stats";
		colRight2.appendChild(pagecontent);

		const iptSearch = e_(document.getElementById("cmcls__search"));
		const btnReset = e_(document.getElementById("cmcls__reset"));
		const btnClear = e_(document.getElementById("cmcls__search-glass"));
		const wrpList = e_(document.getElementById("cmcls__list"));

		this._list = new List({
			iptSearch,
			wrpList,
			syntax: null,
			helpText: [],
		});

		btnReset.onn("click", () => {
			iptSearch.val("");
			this._list.reset();
		});
		if (btnClear && btnClear.length) {
			btnClear.onn("click", () => iptSearch.val("").trigger("change").trigger("keydown").trigger("keyup").focuse());
		}
		SortUtil.initBtnSortHandlers(es("#cmcls__filtertools"), this._list);

		this._filterBox = await this._pageFilter.pInitFilterBox({
			iptSearch,
			wrpFormTop: e_(document.getElementById("cmcls__filter-search-group")),
			btnReset,
		});

		this._list.init();
		this._bindListClick();
	}

	_bindListClick () {
		if (!this._wrpRoot.querySelector("#cmcls__list")) return;
		this._wrpRoot.querySelector("#cmcls__list").addEventListener("click", (evt) => {
			const a = evt.target.closest("a[data-class-ix]");
			if (!a) return;
			evt.preventDefault();
			const ix = parseInt(a.getAttribute("data-class-ix"), 10);
			if (this._activeIx === ix) return;
			this._activeIx = ix;
			this._list.update();
			this._pDoRender();
			this._emitSelection();
		});
	}

	getListItem (cls, clsI, isExcluded) {
		const source = Parser.sourceJsonToAbv(cls.source);
		const lnk = ee`<a href="#" class="lst__row-border lst__row-inner" data-class-ix="${clsI}">
			<span class="bold ve-col-8 pl-0 pr-1">${cls.name}</span>
			<span class="ve-col-4 pl-0 pr-1 ve-text-center ${Parser.sourceJsonToSourceClassname(cls.source)} pr-0" title="${Parser.sourceJsonToFull(cls.source)}">${source}</span>
		</a>`;
		const $ele = ee`<li class="lst__row ve-flex-col ${isExcluded ? "row--blocklisted" : ""}">${lnk}</li>`;
		return new ListItem(clsI, $ele, cls.name, { source, page: cls.page }, { lnk, entity: cls, isExcluded });
	}

	_addData (data) {
		let isAddedAnyClass = false;
		let isAddedAnySubclass = false;
		if (data.class && data.class.length) {
			isAddedAnyClass = true;
			this._addData_addClassData(data);
		}
		if (data.subclass && data.subclass.length) {
			isAddedAnySubclass = true;
			this._addData_addSubclassData(data);
		}

		const walker = MiscUtil.getWalker({
			keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
			isNoModification: true,
		});

		this._dataList.forEach(cls => {
			PageFilterClasses.mutateForFilters(cls);
			if (SourceUtil.isNonstandardSource(cls.source) || PrereleaseUtil.hasSourceJson(cls.source) || BrewUtil2.hasSourceJson(cls.source)) {
				(cls.subclasses || []).filter(sc => sc.source === cls.source).forEach(sc => { sc._isStandardSource = true; });
			}
			if (cls.subclasses?.length) {
				cls.subclasses
					.filter(sc => sc.isReprinted && sc.subclassFeatures?.length)
					.forEach(sc => {
						walker.walk(sc.subclassFeatures, {
							object: (obj) => { if (obj.level != null) obj.isReprinted = true; },
						});
					});
			}
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);
			const subclassExclusions = {};
			(cls.subclasses || []).forEach(sc => {
				if (isExcluded) return;
				(subclassExclusions[sc.source] = subclassExclusions[sc.source] || {})[sc.name] = (subclassExclusions[sc.source][sc.name] || isSubclassExcluded(cls, sc));
			});
			this._pageFilter.addToFilters(cls, isExcluded, { subclassExclusions });
		});

		if (isAddedAnyClass || isAddedAnySubclass) {
			this._list.update();
			this._filterBox.render();
			this._handleFilterChange(false);
		}
	}

	_addData_addClassData (data) {
		data.class.filter(cls => cls.subclasses).forEach(cls => cls.subclasses.sort(_ascSortSubclasses));
		this._dataList.push(...data.class);
		const len = this._dataList.length;
		for (; this._ixData < len; this._ixData++) {
			const it = this._dataList[this._ixData];
			const isExcluded = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](it), "class", it.source);
			this._list.addItem(this.getListItem(it, this._ixData, isExcluded));
		}
	}

	_addData_addSubclassData (data) {
		const clsesUpdated = new Set();
		data.subclass.forEach(sc => {
			if (sc.className === VeCt.STR_GENERIC || sc.classSource === VeCt.STR_GENERIC) return;
			const cls = this._dataList.find(c => c.name.toLowerCase() === sc.className.toLowerCase() && c.source.toLowerCase() === (sc.classSource || Parser.SRC_PHB).toLowerCase());
			if (!cls) return;
			clsesUpdated.add(cls);
			(cls.subclasses = cls.subclasses || []).push(sc);
		});
		[...clsesUpdated].forEach(cls => {
			cls.subclasses.sort(_ascSortSubclasses);
			const isExcludedClass = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls), "class", cls.source);
			this._pageFilter.mutateAndAddToFilters(cls, isExcludedClass);
		});
		this._list.update();
		this._filterBox.render();
		this._handleFilterChange(false);
	}

	_doGenerateFilteredActiveClassData () {
		const f = this._filterBox.getValues();
		const cpyCls = MiscUtil.copyFast(this.activeClassRaw);
		if (!cpyCls) return;
		const walker = Renderer.class.getWalkerFilterDereferencedFeatures();
		const isUseSubclassSources = !this._pageFilter.isClassNaturallyDisplayed(f, cpyCls) && this._pageFilter.isAnySubclassDisplayed(f, cpyCls);
		Renderer.class.mutFilterDereferencedClassFeatures({
			walker, cpyCls, pageFilter: this._pageFilter, filterValues: f, isUseSubclassSources,
		});
		(cpyCls.subclasses || []).forEach(sc => {
			Renderer.class.mutFilterDereferencedSubclassFeatures({
				walker, cpySc: sc, pageFilter: this._pageFilter, filterValues: f,
			});
		});
		PageFilterClasses.mutateForFilters(cpyCls);
		this._activeClassDataFiltered = cpyCls;
	}

	_handleFilterChange (isFilterValueChange) {
		if (isFilterValueChange && this.activeClassRaw) {
			this._doGenerateFilteredActiveClassData();
			this._pDoRender();
			return;
		}
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, item.data.entity));
		this._list.update();
		if (this.activeClassRaw) {
			this._doGenerateFilteredActiveClassData();
			this._pDoRender();
		}
	}

	_emitSelection () {
		const cls = this.activeClassRaw;
		const subclassesActive = cls ? this._getActiveSubclasses(false) : [];
		this._onSelectionChange({ cls: cls || null, subclassesActive });
	}

	_getActiveSubclasses (asStateKeys) {
		const cls = this.activeClass;
		if (!cls || !cls.subclasses) return [];
		return cls.subclasses
			.filter(sc => this._state[UrlUtil.getStateKeySubclass(sc)])
			.map(sc => asStateKeys ? UrlUtil.getStateKeySubclass(sc) : sc);
	}

	async _pDoRender () {
		const cls = this.activeClassRaw;
		if (!cls) {
			const ct = document.getElementById("cmcls__classtable");
			if (ct) ct.innerHTML = "";
			const sp = document.getElementById("cmcls__statsprof");
			if (sp) sp.innerHTML = "";
			const st = document.getElementById("cmcls__subclasstabs");
			if (st) st.innerHTML = "";
			const pc = document.getElementById("cmcls__pagecontent");
			if (pc) pc.innerHTML = "";
			const ol = document.getElementById("cmcls__sticky-nav");
			if (ol) ol.innerHTML = "";
			return;
		}
		this._renderClassTable();
		this._renderSidebar();
		await this._renderSubclassTabs();
		await this._renderClassContent();
		this._renderOutline();
	}

	_renderClassTable () {
		const wrpTblClass = document.getElementById("cmcls__classtable");
		if (!wrpTblClass) return;
		const cls = this.activeClass;
		if (!cls) return;

		Renderer.get().resetHeaderIndex();
		const $tblGroupHeaders = [];
		const $tblHeaders = [];

		if (cls.classTableGroups) {
			cls.classTableGroups.forEach(tableGroup => this._renderClassTable_renderTableGroupHeader({ $tblGroupHeaders, $tblHeaders, tableGroup }));
		}
		cls.subclasses.forEach(sc => {
			if (!sc.subclassTableGroups) return;
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			sc.subclassTableGroups.forEach(tableGroup => this._renderClassTable_renderTableGroupHeader({ $tblGroupHeaders, $tblHeaders, tableGroup, stateKey }));
		});

		const metasTblRows = this._renderClassTable_getMetasTblRows({ cls });

		this._fnTableHandleFilterChange = (f) => {
			const cpyCls = MiscUtil.copyFast(this.activeClassRaw);
			if (!cpyCls) return;
			const isUseSubclassSources = !this._pageFilter.isClassNaturallyDisplayed(f, cpyCls) && this._pageFilter.isAnySubclassDisplayed(f, cpyCls);
			metasTblRows.forEach(metaTblRow => {
				metaTblRow.metasFeatureLinks.forEach(metaFeatureLink => {
					if (metaFeatureLink.source) {
						const isHidden = ![metaFeatureLink.source, ...(metaFeatureLink.otherSources || []).map(it => it.source)]
							.some(src => this._filterBox.toDisplayByFilters(
								f,
								{ filter: this._pageFilter.sourceFilter, value: isUseSubclassSources && src === cpyCls.source ? this._pageFilter.getActiveSource(f) : src },
								{ filter: this._pageFilter.levelFilter, value: metaTblRow.level },
							));
						metaFeatureLink.isHidden = isHidden;
						metaFeatureLink.$wrpLink.toggleVe(!isHidden);
					}
				});
				metaTblRow.metasFeatureLinks.forEach(m => m.$dispComma.toggleVe(true));
				const lastVisible = metaTblRow.metasFeatureLinks.filter(m => !m.isHidden).pop();
				if (lastVisible) lastVisible.$dispComma.hideVe();
			});
		};

		const $wrp = $(wrpTblClass).empty();
		$$`<table class="cls-tbl shadow-big w-100 mb-2">
			<tbody>
			<tr><th class="ve-tbl-border" colspan="999"></th></tr>
			<tr><th class="ve-text-left cls-tbl__disp-name" colspan="999">${cls.name}</th></tr>
			<tr>
				<th colspan="3"></th>
				${$tblGroupHeaders}
			</tr>
			<tr>
				<th class="cls-tbl__col-level">Level</th>
				<th class="cls-tbl__col-prof-bonus">Proficiency Bonus</th>
				<th class="ve-text-left">Features</th>
				${$tblHeaders}
			</tr>
			${metasTblRows.map(it => it.$row)}
			<tr><th class="ve-tbl-border" colspan="999"></th></tr>
			</tbody>
		</table>`.appendTo($wrp);
		$wrp.showVe();
		this._filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => this._fnTableHandleFilterChange && this._fnTableHandleFilterChange(this._filterBox.getValues()));
		this._fnTableHandleFilterChange(this._filterBox.getValues());
	}

	_renderClassTable_renderTableGroupHeader ({ $tblGroupHeaders, $tblHeaders, tableGroup, stateKey }) {
		const colLabels = tableGroup.colLabels;
		const $thGroupHeader = tableGroup.title
			? $(`<th class="cls-tbl__col-group" colspan="${colLabels.length}">${tableGroup.title}</th>`)
			: $(`<th colspan="${colLabels.length}"></th>`);
		$tblGroupHeaders.push($thGroupHeader);
		const $tblHeadersGroup = [];
		colLabels.forEach(lbl => {
			const $tblHeader = $(`<th class="cls-tbl__col-generic-center"><div class="cls__squash_header"></div></th>`).fastSetHtml(Renderer.get().render(lbl));
			$tblHeaders.push($tblHeader);
			$tblHeadersGroup.push($tblHeader);
		});
		if (stateKey) {
			const $elesSubclass = [$thGroupHeader, ...$tblHeadersGroup];
			const hkShowHideSubclass = () => {
				const visible = !!this._state[stateKey];
				$elesSubclass.forEach($ele => $ele.toggleVe(visible));
			};
			this._addHookBase(stateKey, hkShowHideSubclass);
		}
	}

	_renderClassTable_getMetasTblRows ({ cls }) {
		return cls.classFeatures.map((lvlFeatures, ixLvl) => {
			const pb = Math.ceil((ixLvl + 1) / 4) + 1;
			const lvlFeaturesFilt = lvlFeatures.filter(it => it.name && it.type !== "inset");
			const metasFeatureLinks = lvlFeaturesFilt.map((it, ixFeature) => {
				const $lnk = $(`<a>${it._displayNameTable || it._displayName || it.name}</a>`);
				const $dispComma = ixFeature === lvlFeaturesFilt.length - 1 ? $(`<span></span>`) : $(`<span class="mr-1">,</span>`);
				return {
					$wrpLink: $$`<div class="ve-inline-block">${$lnk}${$dispComma}</div>`,
					$dispComma,
					source: it.source,
					otherSources: it.otherSources,
					isHidden: false,
				};
			});

			const $ptTableGroups = [];
			if (cls.classTableGroups) {
				cls.classTableGroups.forEach(tableGroup => {
					const { $cells } = tableGroup.rowsSpellProgression?.[ixLvl]
						? this._renderClassTable_$getSpellProgressionCells({ ixLvl, tableGroup })
						: this._renderClassTable_$getGenericRowCells({ ixLvl, tableGroup });
					$ptTableGroups.push(...$cells);
				});
			}
			cls.subclasses.forEach(sc => {
				if (!sc.subclassTableGroups) return;
				const stateKey = UrlUtil.getStateKeySubclass(sc);
				sc.subclassTableGroups.forEach(tableGroup => {
					const { $cells } = tableGroup.rowsSpellProgression?.[ixLvl]
						? this._renderClassTable_$getSpellProgressionCells({ ixLvl, tableGroup, sc })
						: this._renderClassTable_$getGenericRowCells({ ixLvl, tableGroup });
					$cells.forEach($c => {
						const hk = () => $c.toggleVe(!!this._state[stateKey]);
						this._addHookBase(stateKey, hk);
					});
					$ptTableGroups.push(...$cells);
				});
			});

			const $cellsTd = metasFeatureLinks.length ? metasFeatureLinks.map(m => m.$wrpLink) : [];
			const $row = $$`<tr class="cls-tbl__stripe-odd">
				<td class="cls-tbl__col-level">${Parser.getOrdinalForm(ixLvl + 1)}</td>
				<td class="cls-tbl__col-prof-bonus">+${pb}</td>
				<td>${$cellsTd.length ? $cellsTd : "\u2014"}</td>
				${$ptTableGroups}
			</tr>`;

			return {
				$row,
				metasFeatureLinks,
				level: ixLvl + 1,
			};
		});
	}

	_renderClassTable_$getGenericRowCells ({ ixLvl, tableGroup, propRows = "rows" }) {
		const row = tableGroup[propRows][ixLvl] || [];
		return {
			$cells: row.map(cell => $(e_({ tag: "td", clazz: "cls-tbl__col-generic-center", html: cell === 0 ? "\u2014" : Renderer.get().render(cell) }))),
		};
	}

	_renderClassTable_$getSpellProgressionCells ({ ixLvl, tableGroup, sc }) {
		const $cellsDefault = this._renderClassTable_$getGenericRowCells({ ixLvl, tableGroup, propRows: "rowsSpellProgression" });
		const row = tableGroup.rowsSpellProgression[ixLvl] || [];
		const spellPoints = row.map((countSlots, ix) => Parser.spLevelToSpellPoints(ix + 1) * countSlots).sum();
		const $cellSpellPoints = $(e_({ tag: "td", clazz: "cls-tbl__col-generic-center cls-tbl__cell-spell-points", html: spellPoints === 0 ? "\u2014" : spellPoints }));
		const ixLastSpellNum = row.findIndex(num => num === 0);
		const maxSpellLevel = !~ixLastSpellNum ? row.length : ixLastSpellNum === 0 ? 0 : ixLastSpellNum;
		const $cellSpellPointsMaxSpellLevel = $(e_({
			tag: "td",
			clazz: "cls-tbl__col-generic-center cls-tbl__cell-spell-points",
			html: maxSpellLevel === 0 ? "\u2014" : Renderer.get().render(`{@filter ${maxSpellLevel}|spells|level=${maxSpellLevel}|${sc ? `subclass=${this.activeClass?.name}: ${sc.shortName}` : `class=${this.activeClass?.name}`}}`),
		}));
		return {
			$cells: [...$cellsDefault.$cells, $cellSpellPoints, $cellSpellPointsMaxSpellLevel],
		};
	}

	_renderSidebar () {
		const wrpSidebar = document.getElementById("cmcls__statsprof");
		if (!wrpSidebar || !this.activeClass) return;
		const comp = {
			_state: this._state,
			_addHookBase: this._addHookBase.bind(this),
		};
		wrpSidebar.innerHTML = "";
		const sidebarHtml = this._RenderClassesSidebar.getRenderedClassSidebar(comp, this.activeClass);
		wrpSidebar.appendChild(sidebarHtml);
		wrpSidebar.style.display = "";
	}

	async _renderSubclassTabs () {
		const wrp = document.getElementById("cmcls__subclasstabs");
		if (!wrp || !this.activeClass) return;
		wrp.innerHTML = "";
		const cls = this.activeClass;

		const $wrp = $(wrp);
		const $btnToggleFeatures = ComponentUiUtil.$getBtnBool(this, "isHideFeatures", { text: "Features", activeClass: "cls__btn-cf--active", isInverted: true }).title("Toggle Class Features");
		const $btnToggleFluff = ComponentUiUtil.$getBtnBool(this, "isShowFluff", { text: "Info" }).title("Toggle Class Info");
		$$`<div class="ve-flex-v-center m-1 ve-btn-group mr-3 no-shrink">${$btnToggleFeatures}${$btnToggleFluff}</div>`.appendTo($wrp);

		const $wrpScTabs = $(`<div class="ve-flex-v-center ve-flex-wrap mr-2 w-100"></div>`).appendTo($wrp);
		const fnSort = (a, b) => {
			if (a.values.isAlwaysVisible) return 1;
			if (b.values.isAlwaysVisible) return -1;
			return SortUtil.listSort(a, b, { sortBy: "shortName" });
		};
		this._listSubclass = new List({ $wrpList: $wrpScTabs, isUseJquery: true, fnSort });

		cls.subclasses.forEach((sc, i) => {
			const listItem = this._render_getSubclassTab(cls, sc, i);
			if (!listItem) return;
			this._listSubclass.addItem(listItem);
		});

		const $dispCount = $(`<div class="ve-muted m-1 cls-tabs__sc-not-shown ve-flex-vh-center"></div>`);
		this._listSubclass.addItem(new ListItem(-1, $dispCount, null, { isAlwaysVisible: true }));

		this._listSubclass.on("updated", () => {
			const cntNotShown = this._listSubclass.items.length - this._listSubclass.visibleItems.length;
			$dispCount.html(cntNotShown ? `<i>(${cntNotShown} more not shown)</i>` : "");
		});
		this._listSubclass.init();

		this._filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => this._handleSubclassFilterChange());
		this._handleSubclassFilterChange();

		const $btnSelAll = $(`<button class="ve-btn ve-btn-xs ve-btn-default" title="Select All"><span class="glyphicon glyphicon-check"></span></button>`)
			.on("click", () => {
				cls.subclasses.forEach(sc => { this._state[UrlUtil.getStateKeySubclass(sc)] = true; });
				this._fireHook("subclass");
				this._pDoRender();
				this._emitSelection();
			});
		const $btnReset = $(`<button class="ve-btn ve-btn-xs ve-btn-default" title="Reset Selection"><span class="glyphicon glyphicon-refresh"></span></button>`)
			.on("click", () => {
				cls.subclasses.forEach(sc => { this._state[UrlUtil.getStateKeySubclass(sc)] = false; });
				this._fireHook("subclass");
				this._pDoRender();
				this._emitSelection();
			});
		const $btnShuffle = $(`<button title="Feeling Lucky?" class="ve-btn ve-btn-xs ve-btn-default"><span class="glyphicon glyphicon-random"></span></button>`)
			.on("click", () => {
				if (!this._listSubclass.visibleItems.length) return;
				cls.subclasses.forEach(sc => { this._state[UrlUtil.getStateKeySubclass(sc)] = false; });
				const visible = this._listSubclass.visibleItems.filter(it => it.values.stateKey);
				if (!visible.length) return;
				const sc = RollerUtil.rollOnArray(visible.map(it => it.data.entity));
				this._state[UrlUtil.getStateKeySubclass(sc)] = true;
				this._fireHook("subclass");
				this._pDoRender();
				this._emitSelection();
			});
		$$`<div class="ve-flex-v-center m-1 ve-btn-group no-shrink">${$btnSelAll}${$btnShuffle}${$btnReset}</div>`.appendTo($wrp);
	}

	_handleSubclassFilterChange () {
		if (!this._listSubclass || !this.activeClass) return;
		const f = this._filterBox.getValues();
		this._listSubclass.filter(li => {
			if (li.values.isAlwaysVisible) return true;
			return this._pageFilter.isSubclassVisible(f, this.activeClass, li.data.entity);
		});
	}

	_render_getSubclassTab (cls, sc, ix) {
		if (isSubclassExcluded(cls, sc)) return null;
		const stateKey = UrlUtil.getStateKeySubclass(sc);
		const mod = UtilClassesPage.getSubclassCssMod(cls, sc);
		const clsActive = `cls__btn-sc--active-${mod}`;
		if (this._state[stateKey] == null) this._state[stateKey] = false;

		const $dispName = $(`<div>${sc.shortName}</div>`).attr("title", getBtnTitleSubclass(sc));
		const $btn = $$`<button class="ve-btn ve-btn-default ve-btn-xs ve-flex-v-center m-1 ${sc.isReprinted ? "cls__btn-sc--reprinted" : ""}">
			${$dispName}
		</button>`
			.on("click", (evt) => {
				if (evt.shiftKey) {
					cls.subclasses.forEach(s => { this._state[UrlUtil.getStateKeySubclass(s)] = s === sc; });
				} else {
					this._state[stateKey] = !this._state[stateKey];
				}
				this._fireHook(stateKey);
				this._pDoRender();
				this._emitSelection();
			})
			.on("contextmenu", (evt) => {
				evt.preventDefault();
				this._state[stateKey] = !this._state[stateKey];
				this._fireHook(stateKey);
				this._pDoRender();
				this._emitSelection();
			});
		const hkVisible = () => $btn.toggleClass(clsActive, !!this._state[stateKey]);
		this._addHookBase(stateKey, hkVisible);

		return new ListItem(ix, $btn, sc.name, { source: sc.source, shortName: sc.shortName, stateKey, mod }, { entity: sc });
	}

	async _renderClassContent () {
		const contentEl = document.getElementById("cmcls__pagecontent");
		if (!contentEl || !this.activeClass) return;
		const $content = $(contentEl).empty();
		const cls = this.activeClass;
		this._outlineData = {};

		UtilClassesPage.setRenderFnGetStyleClasses(cls);
		$content.append(Renderer.utils.getBorderTr());

		const clsFluff = await Renderer.class.pGetFluff(cls);
		if (clsFluff) {
			const depthArr = [];
			const { hasEntries, rendered } = UtilClassesPage.getRenderedClassFluffHeader({ cls, clsFluff, depthArr, isAddTrailingHr: true });
			if (rendered) {
				$(`<tr class="cls-main__cls-fluff"><td colspan="6"></td></tr>`).fastSetHtml(rendered).appendTo($content);
			}
			if (hasEntries) this._outlineData.fluff = depthArr;
		}

		const ptrIsFirstSubclassLevel = { _: true };
		const ptrsHasRenderedSubclass = {};
		await cls.classFeatures.pSerialAwaitMap(async (lvlFeatures, ixLvl) => {
			const ptrHasHandledSubclassFeatures = { _: false };
			await lvlFeatures.pSerialAwaitMap(async (feature, ixFeature) => {
				if (feature.source === cls.source) {
					feature = MiscUtil.copyFast(feature);
					feature._isStandardSource = true;
				}
				await this._renderClassContent_pRenderFeature({
					ixLvl, feature, ixFeature, ptrHasHandledSubclassFeatures, ptrsHasRenderedSubclass, ptrIsFirstSubclassLevel, $content, cls,
				});
			});
			if (!ptrHasHandledSubclassFeatures._ && CharactermancerClassesEmbedded._hasSubclassFeaturesAtLevel(cls, ixLvl + 1)) {
				await this._renderClassContent_pRenderFeature({
					ixLvl,
					feature: CharactermancerClassesEmbedded._getFauxGainSubclassFeatureFeature(cls, ixLvl + 1),
					ixFeature: -1,
					ptrsHasRenderedSubclass: ptrsHasRenderedSubclass,
					ptrIsFirstSubclassLevel,
					$content,
					cls,
				});
			}
		});

		if (cls.otherSources) {
			const text = Renderer.utils.getSourceAndPageHtml(cls);
			$(`<tr data-feature-type="class"><td colspan="6"></td></tr>`).fastSetHtml(`<hr class="hr-1"><b>Class source:</b> ${text}`).appendTo($content);
		}
		if (clsFluff) {
			const { rendered } = UtilClassesPage.getRenderedClassFluffFooter({ cls, clsFluff, isAddLeadingHr: true });
			if (rendered) $(`<tr class="cls-main__cls-fluff"><td colspan="6"></td></tr>`).fastSetHtml(rendered).appendTo($content);
		}
		this._$trNoContent = $(`<tr class="cls-main__msg-no-content"><td colspan="6">Toggle a button to view class and subclass information</td></tr>`).appendTo($content);
		$content.append(Renderer.utils.getBorderTr());
		UtilClassesPage.unsetRenderFnGetStyleClasses();
		Renderer.get().removePlugins("entries_namePrefix");
	}

	static _hasSubclassFeaturesAtLevel (cls, level) {
		return (cls.subclasses || []).some(it => (it.subclassFeatures || []).some(lvlFeatures => lvlFeatures.some(scf => scf.level === level)));
	}

	static _getFauxGainSubclassFeatureFeature (cls, level) {
		return {
			name: "Subclass Feature",
			source: cls.source,
			className: cls.name,
			classSource: cls.source,
			level,
			entries: ["Depending on your choice of subclass, you may gain certain subclass features—or meet prerequisites for acquiring them—at this level."],
			gainSubclassFeature: true,
			_isStandardSource: true,
		};
	}

	async _renderClassContent_pRenderFeature ({
		ixLvl, feature, ixFeature, ptrHasHandledSubclassFeatures, ptrsHasRenderedSubclass, ptrIsFirstSubclassLevel, $content, cls,
	}) {
		const depthArr = [];
		const styleHint = VetoolsConfig.get("styleSwitcher", "style");
		const toRenderSource = Renderer.findSource(feature);
		const $trClassFeature = Renderer.get().withPlugin({
			pluginTypes: ["entries_styleClass_fromSource", "section_styleClass_fromSource"],
			fnPlugin: (commonArgs, { input: { entry } }) => (entry?.source || toRenderSource) === cls.source ? { isSkip: true } : undefined,
			fn: () => Renderer.get().withDepthTracker(
				depthArr,
				({ renderer }) => $(`<tr data-scroll-id="${ixLvl}-${ixFeature}" data-feature-type="class" class="cls-main__linked-titles"><td colspan="6"></td></tr>`)
					.fastSetHtml(renderer.render(Renderer.class.getDisplayNamedClassFeatureEntry(feature, styleHint)))
					.appendTo($content),
				{ additionalProps: ["isReprinted"], additionalPropsInherited: ["_isStandardSource", "isClassFeatureVariant"] },
			),
		});
		this._outlineData.classFeatures = this._outlineData.classFeatures || [];
		(this._outlineData.classFeatures[ixLvl] = this._outlineData.classFeatures[ixLvl] || [])[ixFeature] = depthArr;

		if (!feature.gainSubclassFeature) return;
		if (ptrHasHandledSubclassFeatures) ptrHasHandledSubclassFeatures._ = true;
		$trClassFeature.attr("data-feature-type", "gain-subclass");

		$(`<tr class="cls-main__sc-feature" data-subclass-none-message="true"><td colspan="6"></td></tr>`)
			.fastSetHtml(Renderer.get().withDepthTracker([], ({ renderer }) => renderer.render({
				type: "entries",
				entries: [
					{ name: "{@note No Subclass Selected}", type: "entries", entries: ["{@note Select a subclass to view its feature(s) here.}"] },
				],
			})))
			.appendTo($content);

		await cls.subclasses.pSerialAwaitMap(async sc => {
			const stateKey = UrlUtil.getStateKeySubclass(sc);
			const scLvlFeatures = sc.subclassFeatures.find(it => it[0]?.level === ixLvl + 1);
			if (!scLvlFeatures) return;
			const scFluff = ptrsHasRenderedSubclass[stateKey] ? null : await Renderer.subclass.pGetFluff(sc);
			ptrsHasRenderedSubclass[stateKey] = true;

			scLvlFeatures.forEach((scFeature, ixScFeature) => {
				const depthArrSc = [];
				const toRender = MiscUtil.copyFast(scFeature);
				const toRenderSource = Renderer.findSource(toRender);
				Renderer.get().withPlugin({
					pluginTypes: ["entries_styleClass_fromSource", "section_styleClass_fromSource"],
					fnPlugin: (commonArgs, { input: { entry } }) => (entry?.source || toRenderSource) === sc.source ? { isSkip: true } : undefined,
					fn: () => {
						const $trSubclassFeature = $(`<tr class="cls-main__sc-feature" data-subclass-id="${stateKey}"><td colspan="6"></td></tr>`)
							.fastSetHtml(Renderer.get().withDepthTracker(depthArrSc, ({ renderer }) => renderer.render(Renderer.class.getDisplayNamedSubclassFeatureEntry(toRender, styleHint)), { additionalProps: ["isReprinted"], additionalPropsInherited: ["_isStandardSource", "isClassFeatureVariant"] }))
							.appendTo($content);
						const hk = () => $trSubclassFeature.toggleVe(!!this._state[stateKey]);
						this._addHookBase(stateKey, hk);
					},
				});
				this._outlineData.subclassFeatures = this._outlineData.subclassFeatures || {};
				(this._outlineData.subclassFeatures[stateKey] = this._outlineData.subclassFeatures[stateKey] || [])[ixLvl + 1] = (this._outlineData.subclassFeatures[stateKey][ixLvl + 1] || []);
				this._outlineData.subclassFeatures[stateKey][ixLvl + 1][ixScFeature] = depthArrSc;
			});

			if (scFluff) {
				const depthArrSubclassFluff = [];
				const { rendered: rdScFluff } = UtilClassesPage.getRenderedSubclassFluff({ sc, scFluff, depthArr: depthArrSubclassFluff });
				if (rdScFluff) {
					$(`<tr class="cls-main__sc-fluff" data-subclass-id-fluff="${stateKey}"><td colspan="6"></td></tr>`).fastSetHtml(rdScFluff).appendTo($content);
					const hk = () => $content.find(`tr[data-subclass-id-fluff="${stateKey}"]`).toggleVe(!!this._state[stateKey]);
					this._addHookBase(stateKey, hk);
				}
			}
		});
		ptrIsFirstSubclassLevel._ = false;
	}

	_renderOutline () {
		const outlineEl = document.getElementById("cmcls__sticky-nav");
		if (!outlineEl || !this.activeClass) return;
		this._$wrpOutline = $(outlineEl);
		this._$wrpOutline.empty();
		if (Renderer.hover.isSmallScreen()) this._state.isHideOutline = true;

		const $dispShowHide = $(`<div class="cls-nav__disp-toggle"></div>`);
		const $wrpHeadInner = $$`<div class="cls-nav__head-inner split"><div>Outline</div>${$dispShowHide}</div>`.on("click", () => {
			this._state.isHideOutline = !this._state.isHideOutline;
			this._fireHook("isHideOutline");
		});
		const $wrpHead = $$`<div class="cls-nav__head">${$wrpHeadInner}<hr class="cls-nav__hr"></div>`.appendTo(this._$wrpOutline);
		const $wrpBody = $(`<div class="nav-body"></div>`).appendTo(this._$wrpOutline);

		const hkShowHide = () => {
			$wrpHead.toggleClass("cls-nav__head--active", !this._state.isHideOutline);
			$wrpBody.toggleVe(!this._state.isHideOutline);
			$dispShowHide.toggleClass("cls-nav__disp-toggle--active", !this._state.isHideOutline);
		};
		this._addHookBase("isHideOutline", hkShowHide);

		const renderOutline = () => {
			$wrpBody.empty();
			const filterValues = this._filterBox.getValues();
			const isUseSubclassSources = !this._pageFilter.isClassNaturallyDisplayed(filterValues, this.activeClassRaw) && this._pageFilter.isAnySubclassDisplayed(filterValues, this.activeClassRaw);
			const doMakeItem = (depthData, additionalCssClasses = "") => {
				if (depthData.depth >= 2) return;
				if (depthData.source && !this._filterBox.toDisplayByFilters(filterValues, { filter: this._pageFilter.sourceFilter, value: isUseSubclassSources && depthData.source === this.activeClassRaw.source ? this._pageFilter.getActiveSource(filterValues) : depthData.source })) return;
				const displayDepth = Math.min(depthData.depth + 1, 2);
				$(`<div class="cls-nav__item cls-nav__item--depth-${displayDepth} ${additionalCssClasses}">${depthData.name}</div>`).appendTo($wrpBody);
			};

			if (this._state.isShowFluff && this._outlineData.fluff) {
				this._outlineData.fluff.filter(it => it.name).forEach(it => doMakeItem(it));
			}
			if (this._state.isHideFeatures && !this._getActiveSubclasses(false).length) return;

			this.activeClass.classFeatures.forEach((lvlFeatures, ixLvl) => {
				lvlFeatures.forEach((feature, ixFeature) => {
					const depthData = this._outlineData.classFeatures?.[ixLvl]?.[ixFeature];
					if (!this._state.isHideFeatures && depthData) {
						depthData.filter(d => d.name && !d.data?.isNoOutline).forEach(it => {
							const extra = UtilClassesPage.getColorStyleClasses(it, { isForceStandardSource: it.source === this.activeClass.source, prefix: "cls-nav__item--" });
							doMakeItem(it, extra.join(" "));
						});
					}
					if (!feature.gainSubclassFeature) return;
					this._getActiveSubclasses(true).forEach(stateKey => {
						const scLvlFeatures = this.activeClass.subclasses.find(sc => UrlUtil.getStateKeySubclass(sc) === stateKey)?.subclassFeatures?.find(it => it[0]?.level === ixLvl + 1);
						if (!scLvlFeatures) return;
						scLvlFeatures.forEach((scFeature, ixScFeature) => {
							const depthDataSc = this._outlineData.subclassFeatures?.[stateKey]?.[ixLvl + 1]?.[ixScFeature];
							(depthDataSc || []).filter(d => d.name && !d.data?.isNoOutline).forEach(it => {
								const sc = this.activeClass.subclasses.find(s => UrlUtil.getStateKeySubclass(s) === stateKey);
								const extra = UtilClassesPage.getColorStyleClasses(it, { isSubclass: true, isForceStandardSource: sc?._isStandardSource, prefix: "cls-nav__item--" });
								doMakeItem(it, extra.join(" "));
							});
						});
					});
				});
			});
		};
		this._fnOutlineHandleFilterChange = renderOutline;
		this._addHookBase("isHideFeatures", renderOutline);
		this._addHookBase("isShowFluff", renderOutline);
		this.activeClass.subclasses.forEach(sc => this._addHookBase(UrlUtil.getStateKeySubclass(sc), renderOutline));
		renderOutline();
	}
}
