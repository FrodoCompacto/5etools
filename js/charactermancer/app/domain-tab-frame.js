export class DomainTabFrame {
	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static render ({parent, tab, buildState}) {
		parent.empty();

		if (tab.layout === "singleColumn") {
			return DomainTabFrame._renderSingleColumn({parent, tab, buildState});
		}
		return DomainTabFrame._renderTwoColumn({parent, tab, buildState});
	}

	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static _renderSingleColumn ({parent, tab, buildState}) {
		const wrpRoot = ee`<div class="cmchr__domain cmchr__domain--single ve-flex-col w-100 h-100 min-h-0 p-2">
			<h5 class="mb-2">${tab.selectTitle}</h5>
			<p class="ve-muted mb-2">Domain component not implemented.</p>
			<div class="cmchr__single-body ve-flex-col flex-1 min-h-0 overflow-y-auto"></div>
		</div>`;

		parent.append(wrpRoot);

		const wrpBody = wrpRoot.find(".cmchr__single-body");
		wrpBody.append(DomainTabFrame._getStubDevBlock({tab, buildState}));

		return {wrpRoot, wrpLeft: null, wrpRight: wrpBody, wrpLeftMeta: null};
	}

	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static _renderTwoColumn ({parent, tab, buildState}) {
		const wrpRoot = ee`<div class="cmchr__domain cmchr__domain--two-col ve-flex-col w-100 h-100 min-h-0">
			<div class="cmchr__split-panel ve-flex flex-1 min-h-0 w-100">
				<div class="cmchr__lhs ve-flex-col min-h-0 min-w-0">
					<div class="cmchr__lhs-chrome ve-flex-v-baseline no-shrink px-2 pt-2">
						<h5 class="cmchr__lhs-title mb-0">${tab.selectTitle}</h5>
						<div class="cmchr__lhs-meta ml-auto ve-flex-v-center ve-hidden"></div>
					</div>
					<div class="cmchr__filter-bar px-2"></div>
					<div class="cmchr__lhs-body ve-flex-col flex-1 min-h-0 overflow-y-auto px-2 pb-2"></div>
				</div>
				<div class="cmchr__rhs ve-flex-col flex-1 min-h-0 min-w-0">
					<div class="cmchr__preview-pane ve-flex-col flex-1 min-h-0 overflow-y-auto">
						<div class="initial-message initial-message--med ve-flex-vh-center flex-1 min-h-0">Select an entry from the list to view it here</div>
					</div>
				</div>
			</div>
		</div>`;

		const searchPlaceholder = DomainTabFrame._getSearchPlaceholder(tab);
		const wrpFilter = wrpRoot.find(".cmchr__filter-bar");
		wrpFilter.append(
			ee`<div class="ve-flex-v-stretch input-group input-group--top no-shrink mb-1">
				<button type="button" class="ve-btn ve-btn-5et veapp__btn-filter" disabled>Filter</button>
				<div class="w-100 relative">
					<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" class="h-100 search form-control lst__search lst__search--no-border-h" placeholder="${searchPlaceholder}" disabled>
					<div class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
				</div>
				<button type="button" class="ve-btn ve-btn-5et veapp__btn-list-reset" disabled>Reset</button>
			</div>
			<div class="fltr__mini-view ve-btn-group mb-1"></div>`,
		);

		const wrpLeft = wrpRoot.find(".cmchr__lhs-body");
		const wrpRight = wrpRoot.find(".cmchr__preview-pane");
		const wrpLeftMeta = wrpRoot.find(".cmchr__lhs-meta");

		wrpLeft.append(DomainTabFrame._getStubDevBlock({tab, buildState, isCompact: true}));

		if (tab.id === "class") {
			DomainTabFrame._appendClassEntryWireframe({wrpLeft, headerMetaLabel: tab.headerMetaLabel});
		}

		parent.append(wrpRoot);

		return {wrpRoot, wrpLeft, wrpRight, wrpLeftMeta};
	}

	/**
	 * @param {{
	 *   wrpLeft: HTMLElementExtended,
	 *   headerMetaLabel?: string,
	 * }} opts
	 */
	static _appendClassEntryWireframe ({wrpLeft, headerMetaLabel}) {
		const metaLabel = headerMetaLabel || "Primary Class";
		wrpLeft.append(
			ee`<div class="cmchr__entry cmchr__entry--wireframe ve-hidden" aria-hidden="true">
				<div class="cmchr__entry-head ve-flex-v-center">
					<span class="cmchr__entry-name"></span>
					<div class="cmchr__entry-meta ml-auto ve-flex-v-center">
						<span class="ve-muted ve-small cmchr__entry-meta-label">${metaLabel}</span>
						<button type="button" class="ve-btn ve-btn-xs ve-btn-default cmchr__btn-entry-collapse ml-1" disabled title="Collapse">[−]</button>
					</div>
				</div>
				<div class="cmchr__entry-body"></div>
			</div>`,
		);
	}

	/**
	 * @param {{
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   isCompact?: boolean,
	 * }} opts
	 */
	static _getSearchPlaceholder (tab) {
		const title = tab.selectTitle || tab.label || "entries";
		return `Find ${title.replace(/^Select (a |an )?/i, "")}...`;
	}

	static _getStubDevBlock ({tab, buildState, isCompact = false}) {
		const stateSnapshot = tab.stateKey ? buildState[tab.stateKey] : null;
		const inner = ee`<div class="cmchr__domain-stub ve-small ve-muted ${isCompact ? "p-1" : "p-2"}">
			<p class="mb-1">Domain component not implemented.</p>
			<p class="mb-0"><code>${tab.id}</code></p>
		</div>`;
		if (!isCompact && stateSnapshot) {
			const pre = ee`<pre class="ve-small mt-2 mb-0" style="white-space: pre-wrap; max-height: 80px; overflow: auto;"></pre>`;
			pre.txt(JSON.stringify(stateSnapshot, null, 2));
			inner.append(pre);
		}
		return inner;
	}
}
