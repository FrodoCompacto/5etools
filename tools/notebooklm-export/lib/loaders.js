import fs from "fs";
import path from "path";

const BOOK_DIR = "data/book";
const CLASS_INDEX = "data/class/index.json";

export async function loadAllData () {
	const [
		spells,
		monsters,
		classData,
		races,
		items,
		booksMeta,
		basicFiles,
	] = await Promise.all([
		DataUtil.spell.pLoadAll(),
		DataUtil.monster.pLoadAll(),
		DataUtil.class.loadRawJSON(),
		DataUtil.race.loadJSON({isAddBaseRaces: true}),
		DataUtil.item.loadJSON(),
		DataUtil.loadJSON("data/books.json"),
		Promise.all([
			"backgrounds.json",
			"feats.json",
			"optionalfeatures.json",
			"charcreationoptions.json",
			"variantrules.json",
		].map(f => DataUtil.loadJSON(`data/${f}`))),
	]);

	const [backgrounds, feats, optionalfeatures, charcreationoptions, variantrules] = basicFiles;

	const books = await loadBooks(booksMeta);

	const classFiles = await loadClassFiles();

	return {
		spells,
		monsters,
		classData,
		classFiles,
		races: races.race || [],
		items: items.item || [],
		books,
		booksMeta: booksMeta.book || [],
		backgrounds: backgrounds.background || [],
		feats: feats.feat || [],
		optionalfeatures: optionalfeatures.optionalfeature || [],
		charcreationoptions: charcreationoptions.charoption || [],
		variantrules: variantrules.variantrule || [],
	};
}

async function loadBooks (booksMeta) {
	const metaById = new Map((booksMeta.book || []).map(b => [b.id.toLowerCase(), b]));
	const files = fs.readdirSync(BOOK_DIR).filter(f => f.startsWith("book-") && f.endsWith(".json"));

	const books = [];
	for (const file of files) {
		const id = file.replace(/^book-/, "").replace(/\.json$/, "").toUpperCase();
		const json = await DataUtil.loadJSON(`${BOOK_DIR}/${file}`);
		books.push({
			id,
			file,
			meta: metaById.get(id.toLowerCase()) || {id, name: id, source: id},
			data: json.data || [],
		});
	}
	return books;
}

async function loadClassFiles () {
	const index = await DataUtil.loadJSON(CLASS_INDEX);
	const out = [];

	for (const [key, filename] of Object.entries(index)) {
		const fileData = await DataUtil.loadJSON(`data/class/${filename}`);
		out.push({
			key,
			filename,
			class: fileData.class || [],
			subclass: fileData.subclass || [],
			classFeature: fileData.classFeature || [],
			subclassFeature: fileData.subclassFeature || [],
		});
	}

	return out;
}

export function slugify (str) {
	return String(str)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function bookOutputName (book) {
	const id = (book.meta?.id || book.id || "").toLowerCase();
	const name = book.meta?.name || book.id;
	return `${id}-${slugify(name)}.md`;
}
