export function sortByNameThenSource (entities) {
	return [...entities].sort((a, b) => {
		const nameA = (a.name || "").toLowerCase();
		const nameB = (b.name || "").toLowerCase();
		if (nameA !== nameB) return nameA < nameB ? -1 : 1;
		const srcA = (SourceUtil.getEntitySource(a) || "").toLowerCase();
		const srcB = (SourceUtil.getEntitySource(b) || "").toLowerCase();
		return srcA < srcB ? -1 : srcA > srcB ? 1 : 0;
	});
}

export function stripLeadingHeading (md) {
	return String(md || "").replace(/^#{1,6}\s+[^\n]+\n+\n?/, "").trim();
}

export function htmlToMarkdownish (html) {
	return Renderer.stripTags(
		String(html || "")
			.replace(/<\/tr>/gi, "\n")
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<\/div>/gi, "\n")
			.replace(/<\/li>/gi, "\n")
			.replace(/<li[^>]*>/gi, "- ")
			.replace(/<[^>]+>/g, ""),
	)
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export function getSourceBlock (ent) {
	const source = SourceUtil.getEntitySource(ent);
	if (!source) return "**Fonte:** desconhecida";

	const fullName = Parser.sourceJsonToFull(source);
	const abv = Parser.sourceJsonToAbv(source);
	const pagePart = Renderer.utils.isDisplayPage(ent.page) ? `, página ${ent.page}` : "";

	const lines = [
		`**Fonte:** ${fullName} (${abv})${pagePart}`,
		`**Nome completo da fonte:** ${fullName} | **ID:** ${abv}`,
	];

	try {
		const extraPageText = RendererMarkdown.utils.getPageText(ent);
		if (extraPageText) lines.push(extraPageText);
	} catch (e) {
		// Alguns itens têm otherSources com fontes inválidas; ignorar texto extra.
	}

	return lines.join("\n");
}

export function wrapEntity (ent, body, {headingLevel = 2} = {}) {
	const name = ent._displayName || ent.name || "Unknown";
	const hashes = "#".repeat(headingLevel);
	const content = stripLeadingHeading(body);
	return `${hashes} ${name}\n\n${getSourceBlock(ent)}\n\n---\n\n${content}\n`;
}

export function renderEntries (entries) {
	if (!entries?.length) return "";
	return RendererMarkdown.get().render({type: "entries", entries});
}

export function renderEntityCompact (prop, ent) {
	const renderer = RendererMarkdown[prop];
	if (!renderer?.getCompactRenderedString) {
		return renderEntries(ent.entries || []);
	}
	return renderer.getCompactRenderedString(ent);
}

export function renderClassDocument ({cls, classFeatures, subclasses, subclassFeatures}) {
	const parts = [];

	parts.push(wrapEntity(cls, renderClassBody(cls), {headingLevel: 2}));

	const features = sortByNameThenSource(classFeatures).sort((a, b) => (a.level || 0) - (b.level || 0));
	for (const feat of features) {
		parts.push(wrapEntity(feat, renderClassFeature(feat)));
	}

	for (const sc of sortByNameThenSource(subclasses)) {
		const scFeats = subclassFeatures
			.filter(f => f.className === sc.className
				&& f.classSource === sc.classSource
				&& f.subclassShortName === sc.shortName
				&& f.subclassSource === sc.source)
			.sort((a, b) => (a.level || 0) - (b.level || 0));

		parts.push(wrapEntity(sc, renderSubclassBody(sc, scFeats), {headingLevel: 2}));
	}

	return parts.join("\n");
}

function renderClassBody (cls) {
	const styleHint = "classic";
	const sections = [
		Renderer.class.getHtmlPtHitPoints(cls, {styleHint}),
		Renderer.class.getHtmlPtSavingThrows(cls),
		Renderer.class.getHtmlPtPrimaryAbility(cls),
		Renderer.class.getHtmlPtSkills(cls, {styleHint}),
		Renderer.class.getHtmlPtWeaponProficiencies(cls, {styleHint}),
		Renderer.class.getHtmlPtArmorProficiencies(cls, {styleHint}),
		Renderer.class.getHtmlPtToolProficiencies(cls, {styleHint}),
		Renderer.class.getHtmlPtStartingEquipment(cls, {styleHint}),
	].filter(Boolean);

	return sections.map(htmlToMarkdownish).join("\n\n");
}

function renderClassFeature (feat) {
	const entry = {
		type: "entries",
		name: feat.level ? `Level ${feat.level}: ${feat.name}` : feat.name,
		entries: feat.entries || [],
	};
	return RendererMarkdown.get().render(entry);
}

function renderSubclassBody (sc, scFeats) {
	const featParts = scFeats.map(feat => wrapEntity(feat, renderClassFeature(feat), {headingLevel: 3}));
	return featParts.join("\n") || "_Sem features de subclasse._";
}

export async function renderRaceWithFluff (race) {
	let body = stripLeadingHeading(renderEntityCompact("race", race));

	const fluff = await Renderer.race.pGetFluff(race);
	if (fluff?.entries?.length) {
		const fluffMd = fluff.entries.map(ent => RendererMarkdown.get().render(ent)).join("\n\n");
		body += `\n\n### Lore\n\n${fluffMd}`;
	}

	return wrapEntity(race, body);
}

export async function renderBackgroundWithFluff (bg) {
	let body = stripLeadingHeading(renderEntityCompact("background", bg));

	const fluff = await Renderer.background.pGetFluff(bg);
	if (fluff?.entries?.length) {
		const fluffMd = fluff.entries.map(ent => RendererMarkdown.get().render(ent)).join("\n\n");
		body += `\n\n### Lore\n\n${fluffMd}`;
	}

	return wrapEntity(bg, body);
}

export function renderBook (book) {
	const title = book.meta?.name || book.id;
	const source = book.meta?.source || book.id;
	const intro = `# ${title}\n\n**Fonte:** ${Parser.sourceJsonToFull(source)} (${Parser.sourceJsonToAbv(source)})\n\n---\n\n`;

	const renderer = RendererMarkdown.get();
	const body = renderer.render({type: "entries", entries: book.data});

	return `${intro}${body}`;
}
