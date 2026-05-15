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

		return {wrpRoot, wrpLeft: null, wrpRight: wrpBody};
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
			<div class="cmchr__domain-header ve-flex-v-baseline mb-2 px-2 pt-2">
				<h5 class="mb-0">${tab.selectTitle}</h5>
			</div>
			<div class="cmchr__col-wrapper ve-flex w-100 flex-1 min-h-0 px-2 pb-2">
				<div class="cmchr__left-col ve-flex-col min-h-0 min-w-0">
					<div class="cmchr__filter-bar"></div>
					<div class="cmchr__left-body ve-flex-col flex-1 min-h-0 overflow-y-auto"></div>
				</div>
				<div class="vr-2 h-100"></div>
				<div class="cmchr__right-col ve-flex-col min-h-0 min-w-0 flex-1">
					<div class="initial-message initial-message--med ve-flex-vh-center h-100">Select an entry from the list to view it here</div>
				</div>
			</div>
		</div>`;

		if (tab.headerMetaLabel) {
			wrpRoot.find(".cmchr__domain-header").append(
				ee`<span class="cmchr__domain-header-meta ve-muted ve-small ml-auto">${tab.headerMetaLabel} [—]</span>`,
			);
		}

		const wrpFilter = wrpRoot.find(".cmchr__filter-bar");
		wrpFilter.append(
			ee`<div class="input-group input-group--bottom ve-flex-v-center mb-2">
				<span class="input-group-addon ve-flex-vh-center"><span class="glyphicon glyphicon-filter"></span> Filter</span>
				<input type="search" class="form-control" placeholder="Filter..." disabled>
				<span class="input-group-btn">
					<button type="button" class="ve-btn ve-btn-default" disabled><span class="glyphicon glyphicon-chevron-down"></span></button>
				</span>
			</div>`,
		);

		const wrpLeft = wrpRoot.find(".cmchr__left-body");
		const wrpRight = wrpRoot.find(".cmchr__right-col");

		wrpLeft.append(DomainTabFrame._getStubDevBlock({tab, buildState, isCompact: true}));

		parent.append(wrpRoot);

		return {wrpRoot, wrpLeft, wrpRight};
	}

	/**
	 * @param {{
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   isCompact?: boolean,
	 * }} opts
	 */
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
