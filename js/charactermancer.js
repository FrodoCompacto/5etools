import {StatGenUi} from "./statgen/statgen-ui.js";
import {CharacterState} from "./charactermancer/charactermancer-state.js";
import {exportToFoundry} from "./charactermancer/charactermancer-export-foundry.js";

const STEPS = [
	{id: "basics", name: "Basics", desc: "Ability Scores, Race, Background"},
	{id: "class", name: "Class", desc: "Choose your class"},
	{id: "subclass", name: "Subclass", desc: "Choose your subclass"},
	{id: "equipment", name: "Equipment", desc: "Starting equipment"},
	{id: "spells", name: "Spells", desc: "Spell selection"},
	{id: "proficiencies", name: "Proficiencies", desc: "Skills, tools, languages"},
	{id: "review", name: "Review", desc: "Summary and export"},
];

class CharactermancerPage {
	constructor () {
		this._statGenUi = null;
		this._state = new CharacterState();
		this._ixStep = 0;
		this._races = [];
		this._backgrounds = [];
		this._feats = [];
		this._classes = [];
		this._$stepper = null;
		this._$content = null;
		this._$statGenWrp = null;
		this._$pageContent = null;
		this._modalFilterSpells = null;
	}

	async pInit () {
		await Promise.all([
			PrereleaseUtil.pInit(),
			BrewUtil2.pInit(),
		]);
		await ExcludeUtil.pInitialise();

		const [races, backgrounds, feats, classes] = await Promise.all([
			this._pLoadRaces(),
			this._pLoadBackgrounds(),
			this._pLoadFeats(),
			this._pLoadClasses(),
		]);

		this._races = races;
		this._backgrounds = backgrounds;
		this._feats = feats;
		this._classes = classes;

		this._statGenUi = new StatGenUi({
			races,
			backgrounds,
			feats,
			tabMetasAdditional: [],
			isCharacterMode: true,
		});
		await this._statGenUi.pInit();

		const savedState = await StorageUtil.pGetForPage("charactermancer_statgen");
		if (savedState != null) this._statGenUi.setStateFrom(savedState);

		this._statGenUi.addHookAll("state", () => this._pSaveStatGenState());

		this._render(es(`#charactermancer-main`));
		this._handleHashLoad();
		window.addEventListener("hashchange", () => this._handleHashLoad());
		window.dispatchEvent(new Event("toolsLoaded"));
	}

	_handleHashLoad () {
		const hash = (window.location.hash || "").slice(1).trim();
		if (!hash) return;
		try {
			const data = JSON.parse(decodeURIComponent(hash));
			if (data.version && data.abilityScores) {
				this._state.name = data.name || "";
				Object.assign(this._state.abilityScores, data.abilityScores);
				this._state.race = data.race ? this._races.find(r => r.name === data.race.name && r.source === data.race.source) || data.race : null;
				this._state.background = data.background ? this._backgrounds.find(b => b.name === data.background.name && b.source === data.background.source) || data.background : null;
				this._state.class = data.class ? this._classes.find(c => c.name === data.class.name && c.source === data.class.source) || data.class : null;
				this._state.subclass = data.subclass && this._state.class
					? (this._state.class.subclasses || []).find(s => s.shortName === data.subclass.shortName && s.source === data.subclass.source) || data.subclass
					: null;
				this._state.equipment = data.equipment || [];
				this._state.equipmentChoices = data.equipmentChoices || {};
				this._state.backgroundEquipment = data.backgroundEquipment || [];
				this._state.backgroundEquipmentChoices = data.backgroundEquipmentChoices || {};
				this._state.spells = data.spells || [];
				this._state.hp = data.hp || 0;
				this._state.senses = data.senses || {};
				if (data.proficiencies) Object.assign(this._state.proficiencies, data.proficiencies);
				this._setStep(6);
				JqueryUtil.doToast({content: "Loaded character from link!"});
			}
		} catch (e) {
			// Ignore invalid hash
		}
	}

	async _pSaveStatGenState () {
		const statGenState = this._statGenUi.getSaveableState();
		await StorageUtil.pSetForPage("charactermancer_statgen", statGenState);
		this._syncStateFromStatGen();
		if (this._$pageContent) this._updateSidebar();
	}

	_syncStateFromStatGen () {
		if (!this._statGenUi) return;

		// Read the final exported ability scores (includes base + race + background + ASI + user bonuses)
		Parser.ABIL_ABVS.forEach(ab => {
			const val = this._statGenUi.state[`common_export_${ab}`];
			if (val != null) this._state.abilityScores[ab] = val;
		});

		// Read race and background directly from the live StatGen instance
		const race = this._statGenUi.race;
		if (race) this._state.race = race;

		const background = this._statGenUi.background;
		if (background) this._state.background = background;

		if (race?.darkvision) this._state.senses = { ...this._state.senses, darkvision: race.darkvision };
	}

	async _pLoadRaces () {
		return [
			...(await DataUtil.race.loadJSON()).race,
			...((await DataUtil.race.loadPrerelease({isAddBaseRaces: false})).race || []),
			...((await BrewUtil2.pGetBrewProcessed()).race || []),
		].filter(it => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](it), "race", it.source));
	}

	async _pLoadBackgrounds () {
		return [
			...(await DataUtil.loadJSON("data/backgrounds.json")).background,
			...((await PrereleaseUtil.pGetBrewProcessed()).background || []),
			...((await BrewUtil2.pGetBrewProcessed()).background || []),
		].filter(it => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](it), "background", it.source));
	}

	async _pLoadFeats () {
		return [
			...(await DataUtil.loadJSON("data/feats.json")).feat,
			...((await PrereleaseUtil.pGetBrewProcessed()).feat || []),
			...((await BrewUtil2.pGetBrewProcessed()).feat || []),
		].filter(it => !ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](it), "feat", it.source));
	}

	async _pLoadClasses () {
		const data = await DataUtil.class.loadJSON();
		return (data.class || []).filter(cls => {
			if (cls.isSidekick) return false;
			const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls);
			return !ExcludeUtil.isExcluded(hash, "class", cls.source);
		});
	}

	_render (parent) {
		parent.empty();
		["charactermancer", "ve-flex-col", "w-100", "h-100"].forEach(c => parent.addClass(c));

		this._$stepper = ee`<div class="charactermancer__stepper ve-flex-v-center"></div>`;
		this._$content = ee`<div class="charactermancer__content ve-flex-col flex-1 min-h-0 overflow-y-auto"></div>`;
		this._$pageContent = ee`<table class="w-100 stats"></table>`;

		STEPS.forEach((step, ix) => {
			const btn = ee`<button class="ve-btn ve-btn-default ve-btn-sm charactermancer__step-btn" data-ix="${ix}">${step.name}</button>`
				.onn("click", () => this._setStep(ix));
			this._$stepper.append(btn);
		});

		// Pre-render StatGen once — its DOM is re-attached on each visit to Basics
		this._$statGenWrp = ee`<div class="w-100 h-100"></div>`;
		this._statGenUi.render(this._$statGenWrp);

		const $leftCol = ee`<div class="view-col ve-flex-7 charactermancer__left-col"></div>`;
		$leftCol.appends(this._$stepper).appends(this._$content);

		const $rightCol = ee`<div class="view-col ve-flex-3 charactermancer__right-col"></div>`;
		const $wrpTable = ee`<div class="relative wrp-stats-table"></div>`;
		$wrpTable.append(this._$pageContent);
		$rightCol.append($wrpTable);

		const $colWrapper = ee`<div class="view-col-wrapper charactermancer__col-wrapper"></div>`;
		$colWrapper.appends($leftCol).appends($rightCol);
		parent.append($colWrapper);
		this._setStep(0);
	}

	_updateSidebar () {
		this._syncStateFromStatGen();
		this._computeHp();
		const s = this._state;

		const border = Renderer.utils.getBorderTr();
		const divider = `<tr><td colspan="6"><div class="ve-tbl-border ve-tbl-border--small"></div></td></tr>`;

		const charName = s.name || "New Character";

		const subtitle = [
			s.race?.name,
			s.background?.name ? `(${s.background.name})` : null,
		].filter(Boolean).join(" ");
		const classLine = [
			s.class?.name,
			s.subclass?.name ? `(${s.subclass.name})` : null,
		].filter(Boolean).join(" ");

		const nameRow = `<tr>
			<th class="stats__th-name ve-text-left pb-0" colspan="6">
				<h1 class="stats__h-name m-0">${charName.escapeQuotes()}</h1>
			</th>
		</tr>`;

		const subtitleRows = [subtitle, classLine].filter(Boolean).map(line =>
			`<tr><td colspan="6" class="pt-0 pb-1"><i>${line.escapeQuotes()}</i></td></tr>`,
		).join("");

		const compactRows = [];
		if (s.hp) compactRows.push(`<p class="my-1p"><b>Hit Points</b> ${s.hp}</p>`);
		const prof = s.proficiencies || {};
		if (prof.savingThrowProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Saving Throws</b> ${prof.savingThrowProficiencies.map(a => a.toUpperCase()).join(", ")}</p>`);
		if (prof.skillProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Skills</b> ${prof.skillProficiencies.join(", ")}</p>`);
		const rd = Renderer.get();
		if (prof.armorProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Armor</b> ${prof.armorProficiencies.map(a => a.toTitleCase()).join(", ")}</p>`);
		if (prof.weaponProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Weapons</b> ${prof.weaponProficiencies.map(w => rd.render(w)).join(", ")}</p>`);
		if (prof.toolProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Tools</b> ${prof.toolProficiencies.map(t => rd.render(t)).join(", ")}</p>`);
		if (prof.languageProficiencies?.length) compactRows.push(`<p class="my-1p"><b>Languages</b> ${prof.languageProficiencies.map(l => rd.render(l)).join(", ")}</p>`);
		if (s.equipment?.length) compactRows.push(`<p class="my-1p"><b>Equipment</b> ${s.equipment.length} item(s)</p>`);
		if (s.spells?.length) compactRows.push(`<p class="my-1p"><b>Spells</b> ${s.spells.map(sp => sp.name).join(", ")}</p>`);

		const compactSection = compactRows.length
			? `${divider}<tr><td colspan="6"><div class="rd__compact-stat">${compactRows.join("")}</div></td></tr>`
			: "";

		let abilitySection = "";
		if (s.abilityScores) {
			const heads = Parser.ABIL_ABVS.map(ab => `<th class="ve-col-2 ve-text-center bold">${ab.toUpperCase()}</th>`).join("");
			const vals = Parser.ABIL_ABVS.map(ab => {
				const val = s.abilityScores[ab] ?? 10;
				const mod = Math.floor((val - 10) / 2);
				const modStr = mod >= 0 ? `+${mod}` : String(mod);
				return `<td class="ve-text-center">${val}<div class="ve-muted ve-small">(${modStr})</div></td>`;
			}).join("");
			abilitySection = `${divider}<tr>${heads}</tr><tr>${vals}</tr>`;
		}

		this._$pageContent.html(`
			${border}
			${nameRow}
			${subtitleRows}
			${abilitySection}
			${compactSection}
			${border}
		`);
	}

	_setStep (ix) {
		this._ixStep = ix;
		this._$stepper.findAll(".charactermancer__step-btn").forEach((el, i) => {
			el.toggleClass("charactermancer__step-btn--active", i === ix);
			el.toggleClass("charactermancer__step-btn--complete", i < ix);
		});

		this._$content.empty();
		this._renderStepContent(ix);
		this._updateSidebar();
	}

	_renderStepContent (ix) {
		const step = STEPS[ix];
		switch (step.id) {
			case "basics":
				this._renderStepBasics();
				break;
			case "class":
				this._renderStepClass();
				break;
			case "subclass":
				this._renderStepSubclass();
				break;
			case "equipment":
				this._renderStepEquipment();
				break;
			case "spells":
				this._renderStepSpells();
				break;
			case "proficiencies":
				this._renderStepProficiencies();
				break;
			case "review":
				this._renderStepReview();
				break;
			default:
				this._$content.html(`<p class="ve-muted">Step: ${step.name}</p>`);
		}
	}

	_renderStepBasics () {
		const wrp = ee`<div class="ve-flex-col w-100 h-100">`;
		const iptName = ee`<input class="form-control mb-2" placeholder="Character name..." value="${(this._state.name || "").escapeQuotes()}">`;
		iptName.onn("input", () => {
			this._state.name = (iptName.val() || "").trim();
			this._updateSidebar();
		});
		wrp.append(ee`<div class="mb-2"><label class="form-label">Character Name</label></div>`);
		wrp.append(iptName);
		wrp.append(this._$statGenWrp);
		this._$content.append(wrp);
	}

	_renderStepClass () {
		this._syncStateFromStatGen();

		const wrp = ee`<div class="ve-flex-col charactermancer__step-class">
			<h4 class="mb-2">Choose your class</h4>
			<p class="ve-muted mb-3">Select a class for your character.</p>
			<button class="ve-btn ve-btn-default ve-btn-sm mb-2 charactermancer__back-btn">← Back to Basics</button>
			<input type="text" class="form-control form-control--minimal mb-2 charactermancer__class-search" placeholder="Filter by name...">
			<div class="charactermancer__class-list" id="charactermancer-class-list"></div>
		</div>`;

		wrp.find(".charactermancer__back-btn").onn("click", () => this._setStep(0));

		const list = wrp.find("#charactermancer-class-list");
		const searchIpt = wrp.find(".charactermancer__class-search");
		const selectedClassName = this._state.class?.name || null;
		this._classes.forEach(cls => {
			const isSelected = cls.name === selectedClassName;
			const btn = ee`<button class="ve-btn ${isSelected ? "ve-btn-primary charactermancer__class-btn--selected" : "ve-btn-default"} charactermancer__class-btn" data-class-name="${(cls.name || "").toLowerCase()}">${cls.name}</button>`
				.onn("click", () => {
					list.findAll(".charactermancer__class-btn").forEach(b => {
						b.removeClass("ve-btn-primary").removeClass("charactermancer__class-btn--selected").addClass("ve-btn-default");
					});
					btn.removeClass("ve-btn-default").addClass("ve-btn-primary").addClass("charactermancer__class-btn--selected");
					this._state.class = cls;
					this._state.subclass = null;
					this._setStep(2);
				});
			list.append(btn);
		});
		searchIpt.onn("input", () => {
			const q = (searchIpt.val() || "").toLowerCase().trim();
			wrp.findAll(".charactermancer__class-btn").forEach(btn => {
				const name = btn.attr("data-class-name") || "";
				btn.toggleClass("hidden", q && !name.includes(q));
			});
		});

		this._$content.append(wrp);
	}

	_renderStepSubclass () {
		if (!this._state.class) {
			this._$content.html(`<p class="ve-muted">Please select a class first.</p><button class="ve-btn ve-btn-default" data-ix="1">Back to Class</button>`)
				.find("button").onn("click", () => this._setStep(1));
			return;
		}

		const subclasses = (this._state.class.subclasses || []).filter(sc => !sc._fMisc?.includes("Legacy"));

		const wrp = ee`<div class="ve-flex-col">
			<h4 class="mb-2">Choose your subclass</h4>
			<p class="ve-muted mb-3">${this._state.class.name} — Select a subclass (or skip for now).</p>
			<button class="ve-btn ve-btn-default ve-btn-sm mb-2 charactermancer__back-btn">← Back to Class</button>
			<div class="ve-flex flex-wrap gap-2" id="charactermancer-subclass-list"></div>
			<button class="ve-btn ve-btn-default mt-3">Skip (no subclass yet)</button>
		</div>`;

		wrp.find(".charactermancer__back-btn").onn("click", () => this._setStep(1));

		const list = wrp.find("#charactermancer-subclass-list");
		const selectedScName = this._state.subclass?.shortName || null;
		subclasses.forEach(sc => {
			const isSelected = sc.shortName === selectedScName;
			const btn = ee`<button class="ve-btn ${isSelected ? "ve-btn-primary" : "ve-btn-default"}">${sc.name}</button>`
				.onn("click", () => {
					list.findAll("button").forEach(b => b.removeClass("ve-btn-primary").addClass("ve-btn-default"));
					btn.removeClass("ve-btn-default").addClass("ve-btn-primary");
					this._state.subclass = sc;
					this._setStep(3);
				});
			list.append(btn);
		});

		wrp.find("button.ve-btn-default.mt-3").onn("click", () => this._setStep(3));

		this._$content.append(wrp);
	}

	_resolveEquipmentEntry (entry) {
		if (typeof entry === "string") {
			const [namePart, sourcePart] = entry.split("|");
			return {name: (namePart || "").trim(), source: (sourcePart || "").trim()};
		}
		if (entry && typeof entry === "object") {
			if (entry.equipmentType) return {equipmentType: entry.equipmentType};
			if (entry.item) {
				const [namePart, sourcePart] = String(entry.item).split("|");
				return {name: (entry.displayName || (namePart || "").trim()), source: (sourcePart || "").trim()};
			}
			if (entry.special) return {name: entry.special, source: ""};
		}
		return null;
	}

	_buildEquipmentFromChoices (cls) {
		const defaultData = cls?.startingEquipment?.defaultData;
		let out = [];
		if (Array.isArray(defaultData)) {
			defaultData.forEach((row, rowIx) => {
				const key = row._ ? "_" : (this._state.equipmentChoices && this._state.equipmentChoices[rowIx]) || Object.keys(row).find(k => k !== "_");
				const entries = row[key];
				if (!Array.isArray(entries)) return;
				entries.forEach(ent => {
					const resolved = this._resolveEquipmentEntry(ent);
					if (resolved) out.push(resolved);
				});
			});
		}
		const bgOut = this._buildBackgroundEquipmentFromChoices(this._state.background);
		this._state.equipment = [...out, ...bgOut];
	}

	_buildBackgroundEquipmentFromChoices (bg) {
		const arr = bg?.startingEquipment;
		if (!Array.isArray(arr)) return [];
		const out = [];
		const choices = this._state.backgroundEquipmentChoices || {};
		arr.forEach((row, rowIx) => {
			const key = row._ ? "_" : (choices[rowIx] || Object.keys(row).find(k => k !== "_"));
			const entries = row[key];
			if (!Array.isArray(entries)) return;
			entries.forEach(ent => {
				const resolved = this._resolveEquipmentEntry(ent);
				if (resolved) out.push(resolved);
			});
		});
		this._state.backgroundEquipment = out;
		return out;
	}

	_renderStepEquipment () {
		const cls = this._state.class;
		const wrp = ee`<div class="ve-flex-col">
			<h4 class="mb-2">Starting Equipment</h4>
			<p class="ve-muted mb-3">${cls ? `Equipment options for ${cls.name}. Choose one option per row.` : "Select a class first."}</p>
		</div>`;

		if (cls?.startingEquipment) {
			const defaultData = cls.startingEquipment.defaultData;
			const defaultTexts = cls.startingEquipment.default;
			if (Array.isArray(defaultData) && Array.isArray(defaultTexts)) {
				this._state.equipmentChoices = this._state.equipmentChoices || {};
				defaultData.forEach((row, rowIx) => {
					const keys = Object.keys(row).filter(k => k !== "_");
					if (keys.length === 0 && row._) {
						// fixed row, no choice (included in _buildEquipmentFromChoices)
						wrp.append(ee`<div class="mb-2">${Renderer.get().render(defaultTexts[rowIx])}</div>`);
						return;
					}
					if (keys.length > 0) {
						if (this._state.equipmentChoices[rowIx] == null) this._state.equipmentChoices[rowIx] = keys[0];
						const rowWrp = ee`<div class="mb-2"><span class="ve-muted">${defaultTexts[rowIx] ? Renderer.get().render(defaultTexts[rowIx]) : ""}</span><div class="ve-flex flex-wrap gap-2 mt-1"></div></div>`;
						const btnWrp = rowWrp.find("div.ve-flex");
						const current = this._state.equipmentChoices[rowIx];
						keys.forEach(k => {
							const btn = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Option (${k})</button>`
								.onn("click", () => {
									this._state.equipmentChoices[rowIx] = k;
									this._buildEquipmentFromChoices(cls);
									btnWrp.findAll("button").forEach((b, i) => b.toggleClass("ve-btn-primary", keys[i] === k));
									this._updateSidebar();
								});
							if (k === current) btn.addClass("ve-btn-primary");
							btnWrp.append(btn);
						});
						wrp.append(rowWrp);
					}
				});
				this._buildEquipmentFromChoices(cls);
			}
			if (cls.startingEquipment.goldAlternative) {
				wrp.append(ee`<div class="mb-2 ve-muted">Alternatively: ${Renderer.get().render(cls.startingEquipment.goldAlternative)} gp.</div>`);
			}
		}

		const bg = this._state.background;
		if (bg?.startingEquipment?.length) {
			wrp.append(ee`<h5 class="mt-3 mb-2">Background Equipment</h5>`);
			this._state.backgroundEquipmentChoices = this._state.backgroundEquipmentChoices || {};
			const bgData = bg.startingEquipment;
			bgData.forEach((row, rowIx) => {
				const keys = Object.keys(row).filter(k => k !== "_");
				if (keys.length === 0 && row._) {
					row._.forEach(ent => {
						const r = this._resolveEquipmentEntry(ent);
						if (r) wrp.append(ee`<div class="mb-1 ve-muted">• ${r.name}</div>`);
					});
					return;
				}
				if (keys.length > 0) {
					if (this._state.backgroundEquipmentChoices[rowIx] == null) this._state.backgroundEquipmentChoices[rowIx] = keys[0];
					const labels = keys.map(k => {
						const entries = row[k];
						if (!Array.isArray(entries)) return `Option (${k})`;
						const names = entries.map(e => this._resolveEquipmentEntry(e)).filter(Boolean).map(r => r.name);
						return `(${k}) ${names.join(", ")}`;
					});
					const rowWrp = ee`<div class="mb-2"><span class="ve-muted">${labels.join(" or ")}</span><div class="ve-flex flex-wrap gap-2 mt-1"></div></div>`;
					const btnWrp = rowWrp.find("div.ve-flex");
					const current = this._state.backgroundEquipmentChoices[rowIx];
					keys.forEach(k => {
						const btn = ee`<button class="ve-btn ve-btn-default ve-btn-sm">Option (${k})</button>`
							.onn("click", () => {
								this._state.backgroundEquipmentChoices[rowIx] = k;
								this._buildBackgroundEquipmentFromChoices(bg);
								this._buildEquipmentFromChoices(cls);
								btnWrp.findAll("button").forEach((b, i) => b.toggleClass("ve-btn-primary", keys[i] === k));
								this._updateSidebar();
							});
						if (k === current) btn.addClass("ve-btn-primary");
						btnWrp.append(btn);
					});
					wrp.append(rowWrp);
				}
			});
			this._buildBackgroundEquipmentFromChoices(bg);
			if (cls) this._buildEquipmentFromChoices(cls);
		}

		const btnNext = ee`<button class="ve-btn ve-btn-primary mt-3">Continue</button>`
			.onn("click", () => {
				if (!this._state.class) {
					JqueryUtil.doToast({content: "Please select a class first.", type: "warning"});
					return;
				}
				this._setStep(4);
			});
		wrp.append(btnNext);
		this._$content.append(wrp);
	}

	async _pEnsureSpellsModalReady () {
		if (this._modalFilterSpells) return this._modalFilterSpells;
		this._modalFilterSpells = new ModalFilterSpells({namespace: "charactermancer.spells"});
		await this._modalFilterSpells.pPopulateHiddenWrapper();
		return this._modalFilterSpells;
	}

	_getLevel1CantripCount (cls) {
		const arr = cls.cantripProgression;
		return (arr && arr[0]) != null ? arr[0] : 0;
	}

	_getLevel1SpellCount (cls) {
		if (cls.spellsKnownProgressionFixed?.length) return cls.spellsKnownProgressionFixed[0] ?? 0;
		if (cls.spellsKnownProgression?.length) return cls.spellsKnownProgression[0] ?? 0;
		if (cls.preparedSpells) {
			const ab = cls.spellcastingAbility;
			const score = (this._state.abilityScores && ab) ? (this._state.abilityScores[ab] ?? 10) : 10;
			const mod = Math.floor((score - 10) / 2);
			return Math.max(1, 1 + mod);
		}
		return 0;
	}

	_renderStepSpells () {
		const cls = this._state.class;
		const hasSpellcasting = !!cls?.spellcastingAbility;
		const cantripCount = hasSpellcasting ? this._getLevel1CantripCount(cls) : 0;
		const level1Count = hasSpellcasting ? this._getLevel1SpellCount(cls) : 0;
		const needsSpellSelection = cantripCount > 0 || level1Count > 0;

		const wrp = ee`<div class="ve-flex-col">
			<h4 class="mb-2">Spells</h4>
			<p class="ve-muted mb-3">${hasSpellcasting ? `Select spells for ${cls.name}.` : "This class does not have spellcasting at 1st level."}</p>
		</div>`;

		if (needsSpellSelection) {
			const dispChosen = ee`<div class="mb-2 ve-muted"></div>`;
			wrp.append(dispChosen);

			const updateChosen = () => {
				const parts = [];
				if (this._state.spells.length) parts.push(`Selected: ${this._state.spells.map(s => s.name).join(", ")}`);
				dispChosen.txt(parts.length ? parts.join(" ") : "");
			};
			updateChosen();

			if (cantripCount > 0) {
				const btnCantrips = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${cantripCount} cantrip${cantripCount === 1 ? "" : "s"}...</button>`;
				btnCantrips.onn("click", async () => {
					const modal = await this._pEnsureSpellsModalReady();
					const filterExpression = `level=0|class=${cls.name}`;
					const checked = await modal.pGetUserSelection({filterExpression});
					const chosen = (modal.allData && checked?.length) ? checked.map(li => ({name: modal.allData[li.ix].name, source: modal.allData[li.ix].source, level: 0})) : [];
					const existingLevel1 = (this._state.spells || []).filter(s => s.level === 1 || s.level == null);
					this._state.spells = [...chosen, ...existingLevel1];
					updateChosen();
					this._updateSidebar();
				});
				wrp.append(btnCantrips);
			}

			if (level1Count > 0) {
				const btnSpells = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${level1Count} 1st-level spell${level1Count === 1 ? "" : "s"}...</button>`;
				btnSpells.onn("click", async () => {
					const modal = await this._pEnsureSpellsModalReady();
					const filterExpression = `level=1|class=${cls.name}`;
					const checked = await modal.pGetUserSelection({filterExpression});
					const chosen = (modal.allData && checked?.length) ? checked.map(li => ({name: modal.allData[li.ix].name, source: modal.allData[li.ix].source, level: 1})) : [];
					const existingCantrips = (this._state.spells || []).filter(s => s.level === 0);
					this._state.spells = [...existingCantrips, ...chosen];
					updateChosen();
					this._updateSidebar();
				});
				wrp.append(btnSpells);
			}
		}

		const btnNext = ee`<button class="ve-btn ve-btn-primary mt-3">Continue</button>`
			.onn("click", () => {
				if (!this._state.class) {
					JqueryUtil.doToast({content: "Please select a class first.", type: "warning"});
					return;
				}
				this._setStep(5);
			});
		wrp.append(btnNext);
		this._$content.append(wrp);
	}

	_populateProficienciesFromClass () {
		const cls = this._state.class;
		if (!cls) return;

		if (Array.isArray(cls.proficiency)) {
			this._state.proficiencies.savingThrowProficiencies = [...cls.proficiency];
		}
		const sp = cls.startingProficiencies || {};
		if (Array.isArray(sp.armor)) {
			this._state.proficiencies.armorProficiencies = sp.armor.filter(a => typeof a === "string" && ["light", "medium", "heavy", "shield"].includes(a.toLowerCase()));
		}
		if (Array.isArray(sp.weapons)) {
			this._state.proficiencies.weaponProficiencies = sp.weapons.map(w => typeof w === "string" ? w : null).filter(Boolean);
		}
	}

	_populateProficienciesFromRaceAndBackground () {
		const race = this._state.race;
		const bg = this._state.background;
		const prof = this._state.proficiencies;

		prof.languageProficiencies = [];
		prof.toolProficiencies = [];

		const addWeaponProfsFromRace = (arr) => {
			if (!Array.isArray(arr)) return;
			arr.forEach(obj => {
				if (!obj) return;
				Object.keys(obj).filter(k => obj[k] === true && k !== "choose").forEach(k => {
					const name = k.includes("|") ? k.split("|")[0].trim() : k;
					if (!prof.weaponProficiencies.includes(name)) prof.weaponProficiencies.push(name);
				});
			});
		};

		const processLanguages = (arr, prefix) => {
			if (!Array.isArray(arr)) return [];
			const pending = [];
			arr.forEach((obj, ix) => {
				if (!obj) return;
				const key = `${prefix}_${ix}`;
				let hasChoice = false;
				Object.entries(obj).forEach(([k, v]) => {
					if (k === "anyStandard" && typeof v === "number") {
						hasChoice = true;
						const resolved = prof.languageChoicesResolved?.[key];
						if (resolved?.length) {
							resolved.forEach(l => prof.languageProficiencies.push(l));
						} else {
							pending.push({key, type: "anyStandard", count: v});
						}
					} else if (k === "choose" && obj.choose?.from) {
						hasChoice = true;
						const resolved = prof.languageChoicesResolved?.[key];
						if (resolved?.length) {
							resolved.forEach(l => prof.languageProficiencies.push(l));
						} else {
							pending.push({key, type: "choose", from: obj.choose.from, count: obj.choose.count ?? 1});
						}
					} else if (v === true && k !== "choose") {
						prof.languageProficiencies.push(k.toTitleCase());
					}
				});
			});
			return pending;
		};

		const processTools = (arr, prefix) => {
			if (!Array.isArray(arr)) return [];
			const pending = [];
			arr.forEach((obj, ix) => {
				if (!obj) return;
				const key = `${prefix}_${ix}`;
				Object.entries(obj).forEach(([k, v]) => {
					if (k === "choose" && obj.choose?.from) {
						const resolved = prof.toolChoicesResolved?.[key];
						if (resolved?.length) {
							resolved.forEach(t => prof.toolProficiencies.push(t));
						} else {
							pending.push({key, type: "choose", from: obj.choose.from, count: obj.choose.count ?? 1});
						}
					} else if (k === "anyGamingSet" && typeof v === "number") {
						const resolved = prof.toolChoicesResolved?.[key];
						if (resolved?.length) {
							resolved.forEach(t => prof.toolProficiencies.push(t));
						} else {
							pending.push({key, type: "anyGamingSet", count: v});
						}
					} else if (v === true && k !== "choose") {
						prof.toolProficiencies.push(k.toTitleCase());
					}
				});
			});
			return pending;
		};

		let langPending = [];
		let toolPending = [];
		if (race) {
			langPending = langPending.concat(processLanguages(race.languageProficiencies, "race"));
			toolPending = toolPending.concat(processTools(race.toolProficiencies, "race"));
			addWeaponProfsFromRace(race.weaponProficiencies);
		}
		if (bg) {
			langPending = langPending.concat(processLanguages(bg.languageProficiencies, "bg"));
			toolPending = toolPending.concat(processTools(bg.toolProficiencies, "bg"));
		}

		return {langPending, toolPending};
	}

	_resolveBackgroundSkills (bg) {
		const out = [];
		const arr = bg?.skillProficiencies;
		if (!Array.isArray(arr)) return out;
		arr.forEach(obj => {
			if (!obj) return;
			Object.entries(obj).filter(([k, v]) => v === true && k !== "choose").forEach(([k]) => out.push(k.toTitleCase()));
		});
		return out;
	}

	_getBackgroundSkillChoice (bg) {
		const arr = bg?.skillProficiencies;
		if (!Array.isArray(arr)) return null;
		return arr.find(obj => obj?.choose?.from) || null;
	}

	_mergeBackgroundSkills () {
		const bg = this._state.background;
		const prof = this._state.proficiencies;
		const fixed = this._resolveBackgroundSkills(bg);
		const choiceResolved = prof.backgroundSkillChoiceResolved || [];
		const existing = new Set(prof.skillProficiencies || []);
		fixed.forEach(s => existing.add(s));
		choiceResolved.forEach(s => existing.add(s));
		prof.skillProficiencies = [...existing];
	}

	_renderStepProficiencies () {
		this._syncStateFromStatGen();
		this._populateProficienciesFromClass();
		const {langPending, toolPending} = this._populateProficienciesFromRaceAndBackground();
		this._mergeBackgroundSkills();

		const cls = this._state.class;
		const prof = this._state.proficiencies;
		const wrp = ee`<div class="ve-flex-col">
			<h4 class="mb-2">Proficiencies</h4>
			<p class="ve-muted mb-3">Skills, tools, and languages from your class and background.</p>
		</div>`;

		const dispSavingThrows = ee`<div class="mb-2"><strong>Saving Throws:</strong> <span class="ve-muted">${(prof.savingThrowProficiencies || []).length ? prof.savingThrowProficiencies.map(a => a.toUpperCase()).join(", ") : "—"}</span></div>`;
		wrp.append(dispSavingThrows);

		const dispArmor = ee`<div class="mb-2"><strong>Armor:</strong> <span class="ve-muted">${(prof.armorProficiencies || []).length ? prof.armorProficiencies.map(a => a.toTitleCase()).join(", ") : "—"}</span></div>`;
		wrp.append(dispArmor);

		const dispWeapons = ee`<div class="mb-2"><strong>Weapons:</strong> <span class="ve-muted">${(prof.weaponProficiencies || []).length ? prof.weaponProficiencies.map(w => typeof w === "string" ? w.toTitleCase() : w).join(", ") : "—"}</span></div>`;
		wrp.append(dispWeapons);

		const dispSkills = ee`<div class="mb-2"><strong>Skills:</strong> <span class="charactermancer__prof-skills-disp ve-muted">${(prof.skillProficiencies || []).length ? prof.skillProficiencies.join(", ") : "None chosen"}</span></div>`;
		wrp.append(dispSkills);

		const skillChoice = cls?.startingProficiencies?.skills?.find(s => s.choose);
		if (skillChoice?.choose?.from && skillChoice.choose.count != null) {
			const btnSkills = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${skillChoice.choose.count} skill(s) from class...</button>`;
			btnSkills.onn("click", async () => {
				const from = skillChoice.choose.from.map(s => (typeof s === "string" ? s : s.name || "").toTitleCase());
				const count = skillChoice.choose.count;
				const current = prof.skillProficiencies || [];
				const {eleModalInner, doClose} = await UiUtil.pGetShowModal({
					title: `Choose ${count} skill(s)`,
					cbClose: () => {},
				});
				const cbs = [];
				from.forEach(skill => {
					const label = ee`<label class="ve-flex-v-center mb-1 ve-block"><input type="checkbox" class="charactermancer__skill-cb"> ${skill}</label>`;
					if (current.includes(skill)) label.find("input").prop("checked", true);
					cbs.push({label, skill, input: label.find("input")});
					eleModalInner.append(label);
				});
				const btnOk = ee`<button class="ve-btn ve-btn-primary mt-2">Confirm</button>`;
				btnOk.onn("click", () => {
					const selected = cbs.filter(({input, skill}) => input.checked).map(({skill}) => skill);
					if (selected.length !== count) {
						JqueryUtil.doToast({content: `Please choose exactly ${count} skill(s).`, type: "warning"});
						return;
					}
					const fixed = this._resolveBackgroundSkills(this._state.background);
					const choiceResolved = prof.backgroundSkillChoiceResolved || [];
					prof.skillProficiencies = [...new Set([...fixed, ...choiceResolved, ...selected])];
					const span = wrp.find(".charactermancer__prof-skills-disp");
					if (span.length) span.txt(prof.skillProficiencies.join(", "));
					doClose(true);
					this._updateSidebar();
				});
				eleModalInner.append(ee`<div class="mt-2">${btnOk}</div>`);
			});
			wrp.append(btnSkills);
		}

		const bgSkillChoice = this._getBackgroundSkillChoice(this._state.background);
		if (bgSkillChoice?.choose?.from) {
			const count = bgSkillChoice.choose.count ?? 1;
			const btnBgSkills = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${count} skill(s) from background...</button>`;
			btnBgSkills.onn("click", async () => {
				const from = bgSkillChoice.choose.from.map(s => (typeof s === "string" ? s : s.name || "").toTitleCase());
				const current = prof.backgroundSkillChoiceResolved || [];
				const {eleModalInner, doClose} = await UiUtil.pGetShowModal({
					title: `Choose ${count} skill(s) from background`,
					cbClose: () => {},
				});
				const cbs = [];
				from.forEach(skill => {
					const label = ee`<label class="ve-flex-v-center mb-1 ve-block"><input type="checkbox" class="charactermancer__skill-cb"> ${skill}</label>`;
					if (current.includes(skill)) label.find("input").prop("checked", true);
					cbs.push({label, skill, input: label.find("input")});
					eleModalInner.append(label);
				});
				const btnOk = ee`<button class="ve-btn ve-btn-primary mt-2">Confirm</button>`;
				btnOk.onn("click", () => {
					const selected = cbs.filter(({input, skill}) => input.checked).map(({skill}) => skill);
					if (selected.length !== count) {
						JqueryUtil.doToast({content: `Please choose exactly ${count} skill(s).`, type: "warning"});
						return;
					}
					prof.backgroundSkillChoiceResolved = selected;
					this._mergeBackgroundSkills();
					const span = wrp.find(".charactermancer__prof-skills-disp");
					if (span.length) span.txt(prof.skillProficiencies.join(", "));
					doClose(true);
					this._updateSidebar();
				});
				eleModalInner.append(ee`<div class="mt-2">${btnOk}</div>`);
			});
			wrp.append(btnBgSkills);
		}

		const dispTools = ee`<div class="mb-2"><strong>Tools:</strong> <span class="charactermancer__prof-tools-disp ve-muted">${(prof.toolProficiencies || []).length ? prof.toolProficiencies.join(", ") : "—"}</span></div>`;
		wrp.append(dispTools);

		toolPending.forEach((p) => {
			const btn = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${p.count} tool(s)${p.type === "anyGamingSet" ? " (gaming set)" : ""}...</button>`;
			btn.onn("click", async () => {
				let from = p.from || [];
				if (p.type === "anyGamingSet" && typeof Renderer !== "undefined" && Renderer.FEATURE__TOOLS_GAMING_SETS) {
					from = Renderer.FEATURE__TOOLS_GAMING_SETS;
				}
				const fromTitled = from.map(t => {
					const s = typeof t === "string" ? t : "";
					if (s === "anyArtisansTool" && typeof Renderer !== "undefined" && Renderer.FEATURE__TOOLS_ARTISANS) return Renderer.FEATURE__TOOLS_ARTISANS;
					if (s === "anyGamingSet" && typeof Renderer !== "undefined" && Renderer.FEATURE__TOOLS_GAMING_SETS) return Renderer.FEATURE__TOOLS_GAMING_SETS;
					if (s === "gaming set" && typeof Renderer !== "undefined" && Renderer.FEATURE__TOOLS_GAMING_SETS) return Renderer.FEATURE__TOOLS_GAMING_SETS;
					if (s === "musical instrument" && typeof Renderer !== "undefined" && Renderer.FEATURE__TOOLS_MUSICAL_INSTRUMENTS) return Renderer.FEATURE__TOOLS_MUSICAL_INSTRUMENTS;
					return [s.toTitleCase()];
				}).flat();
				const {eleModalInner, doClose} = await UiUtil.pGetShowModal({title: `Choose ${p.count} tool(s)`, cbClose: () => {}});
				const cbs = [];
				fromTitled.forEach(tool => {
					const label = ee`<label class="ve-flex-v-center mb-1 ve-block"><input type="checkbox" class="charactermancer__tool-cb"> ${tool}</label>`;
					const resolved = prof.toolChoicesResolved?.[p.key] || [];
					if (resolved.includes(tool)) label.find("input").prop("checked", true);
					cbs.push({label, tool, input: label.find("input")});
					eleModalInner.append(label);
				});
				const btnOk = ee`<button class="ve-btn ve-btn-primary mt-2">Confirm</button>`;
				btnOk.onn("click", () => {
					const selected = cbs.filter(({input, tool}) => input.checked).map(({tool}) => tool);
					if (selected.length !== p.count) {
						JqueryUtil.doToast({content: `Please choose exactly ${p.count} tool(s).`, type: "warning"});
						return;
					}
					prof.toolChoicesResolved = prof.toolChoicesResolved || {};
					prof.toolChoicesResolved[p.key] = selected;
					this._populateProficienciesFromRaceAndBackground();
					this._mergeBackgroundSkills();
					const span = wrp.find(".charactermancer__prof-tools-disp");
					if (span.length) span.txt(prof.toolProficiencies.join(", "));
					doClose(true);
					this._updateSidebar();
				});
				eleModalInner.append(ee`<div class="mt-2">${btnOk}</div>`);
			});
			wrp.append(btn);
		});

		const dispLangs = ee`<div class="mb-2"><strong>Languages:</strong> <span class="charactermancer__prof-langs-disp ve-muted">${(prof.languageProficiencies || []).length ? prof.languageProficiencies.join(", ") : "—"}</span></div>`;
		wrp.append(dispLangs);

		langPending.forEach((p) => {
			const btn = ee`<button class="ve-btn ve-btn-default mb-2">Choose ${p.count} language(s)${p.type === "anyStandard" ? " (standard)" : ""}...</button>`;
			btn.onn("click", async () => {
				let from = p.from || [];
				if (p.type === "anyStandard") from = (Parser.LANGUAGES_STANDARD || []).map(l => l.toLowerCase());
				else from = (p.from || []).map(l => typeof l === "string" ? l : l.name || "");
				const fromTitled = from.map(l => (typeof l === "string" ? l : "").toTitleCase());
				const {eleModalInner, doClose} = await UiUtil.pGetShowModal({title: `Choose ${p.count} language(s)`, cbClose: () => {}});
				const cbs = [];
				fromTitled.forEach(lang => {
					const label = ee`<label class="ve-flex-v-center mb-1 ve-block"><input type="checkbox" class="charactermancer__lang-cb"> ${lang}</label>`;
					const resolved = prof.languageChoicesResolved?.[p.key] || [];
					if (resolved.includes(lang)) label.find("input").prop("checked", true);
					cbs.push({label, lang, input: label.find("input")});
					eleModalInner.append(label);
				});
				const btnOk = ee`<button class="ve-btn ve-btn-primary mt-2">Confirm</button>`;
				btnOk.onn("click", () => {
					const selected = cbs.filter(({input, lang}) => input.checked).map(({lang}) => lang);
					if (selected.length !== p.count) {
						JqueryUtil.doToast({content: `Please choose exactly ${p.count} language(s).`, type: "warning"});
						return;
					}
					prof.languageChoicesResolved = prof.languageChoicesResolved || {};
					prof.languageChoicesResolved[p.key] = selected;
					this._populateProficienciesFromRaceAndBackground();
					this._mergeBackgroundSkills();
					const span = wrp.find(".charactermancer__prof-langs-disp");
					if (span.length) span.txt(prof.languageProficiencies.join(", "));
					doClose(true);
					this._updateSidebar();
				});
				eleModalInner.append(ee`<div class="mt-2">${btnOk}</div>`);
			});
			wrp.append(btn);
		});

		const btnNext = ee`<button class="ve-btn ve-btn-primary mt-3">Continue to Review</button>`
			.onn("click", () => {
				if (!this._state.class) {
					JqueryUtil.doToast({content: "Please select a class first.", type: "warning"});
					return;
				}
				this._setStep(6);
			});
		wrp.append(btnNext);
		this._$content.append(wrp);
	}

	_computeHp () {
		const cls = this._state.class;
		if (!cls?.hd?.faces) return;
		const con = this._state.abilityScores?.con ?? 10;
		const conMod = Math.floor((con - 10) / 2);
		this._state.hp = Math.max(1, cls.hd.faces + conMod);
	}

	_renderStepReview () {
		this._syncStateFromStatGen();
		this._populateProficienciesFromClass();
		this._populateProficienciesFromRaceAndBackground();
		this._mergeBackgroundSkills();
		this._computeHp();

		const s = this._state;
		const p = s.proficiencies || {};
		const lines = [
			s.name && `Name: ${s.name}`,
			s.race && `Race: ${s.race.name}`,
			s.background && `Background: ${s.background.name}`,
			s.class && `Class: ${s.class.name}`,
			s.subclass && `Subclass: ${s.subclass.name}`,
			s.hp ? `HP (level 1): ${s.hp}` : null,
			`Ability Scores: ${Parser.ABIL_ABVS.map(ab => `${ab.toUpperCase()} ${s.abilityScores[ab]}`).join(", ")}`,
			(p.savingThrowProficiencies?.length || p.armorProficiencies?.length || p.weaponProficiencies?.length || p.skillProficiencies?.length || p.toolProficiencies?.length || p.languageProficiencies?.length)
				? `Proficiencies: Saving Throws (${(p.savingThrowProficiencies || []).join(", ")}); Armor (${(p.armorProficiencies || []).join(", ")}); Weapons (${(p.weaponProficiencies || []).join(", ")}); Skills (${(p.skillProficiencies || []).join(", ")}); Tools (${(p.toolProficiencies || []).join(", ")}); Languages (${(p.languageProficiencies || []).join(", ")})`
				: null,
			s.equipment?.length ? `Equipment: ${s.equipment.map(e => e.name || e.equipmentType).join(", ")}` : null,
			s.spells?.length ? `Spells: ${s.spells.map(sp => sp.name).join(", ")}` : null,
		].filter(Boolean);

		const wrp = ee`<div class="ve-flex-col">
			<h4 class="mb-2">Character Summary</h4>
			<pre class="ve-muted mb-3 p-2" style="background: rgba(0,0,0,0.05); border-radius: 4px;">${lines.join("\n")}</pre>
			<div class="charactermancer__export-btns">
				<button class="ve-btn ve-btn-primary">Export JSON</button>
				<button class="ve-btn ve-btn-default">Export for Foundry VTT</button>
				<button class="ve-btn ve-btn-default">Copy Link</button>
				<button class="ve-btn ve-btn-default">Load from File</button>
			</div>
		</div>`;

		wrp.find("button.ve-btn-primary").onn("click", () => {
			DataUtil.userDownload("charactermancer", s.toExportable(), {fileType: "charactermancer"});
			JqueryUtil.doToast({content: "Exported!"});
		});

		const btnDefaults = wrp.findAll("button.ve-btn-default");
		btnDefaults[0].onn("click", () => {
			const foundryData = exportToFoundry(s);
			DataUtil.userDownload("charactermancer-foundry", foundryData, {fileType: "json"});
			JqueryUtil.doToast({content: "Exported for Foundry VTT!"});
		});

		btnDefaults[1].onn("click", async () => {
			const encoded = encodeURIComponent(JSON.stringify(s.toExportable()));
			const url = `${window.location.href.split("#")[0]}#${encoded}`;
			await MiscUtil.pCopyTextToClipboard(url);
			JqueryUtil.doToast({content: "Link copied to clipboard!"});
		});

		btnDefaults[2].onn("click", async () => {
			const {jsons, errors} = await InputUiUtil.pGetUserUploadJson({expectedFileTypes: ["charactermancer"]});
			DataUtil.doHandleFileLoadErrorsGeneric(errors);
			if (!jsons?.length) return;
			const data = jsons[0];
			this._state.name = data.name || "";
			if (data.abilityScores) Object.assign(this._state.abilityScores, data.abilityScores);
			this._state.race = data.race ? this._races.find(r => r.name === data.race.name && r.source === data.race.source) || data.race : null;
			this._state.background = data.background ? this._backgrounds.find(b => b.name === data.background.name && b.source === data.background.source) || data.background : null;
			this._state.class = data.class ? this._classes.find(c => c.name === data.class.name && c.source === data.class.source) || data.class : null;
			this._state.subclass = data.subclass && this._state.class
				? (this._state.class.subclasses || []).find(sc => sc.shortName === data.subclass.shortName && sc.source === data.subclass.source) || data.subclass
				: null;
			this._state.equipment = data.equipment || [];
			this._state.equipmentChoices = data.equipmentChoices || {};
			this._state.backgroundEquipment = data.backgroundEquipment || [];
			this._state.backgroundEquipmentChoices = data.backgroundEquipmentChoices || {};
			this._state.spells = data.spells || [];
			this._state.hp = data.hp || 0;
			this._state.senses = data.senses || {};
			if (data.proficiencies) Object.assign(this._state.proficiencies, data.proficiencies);
			this._renderStepReview();
			JqueryUtil.doToast({content: "Loaded from file!"});
		});

		this._$content.append(wrp);
	}
}

const charactermancerPage = new CharactermancerPage();
window.addEventListener("load", () => charactermancerPage.pInit());
globalThis.dbg_charactermancerPage = charactermancerPage;
