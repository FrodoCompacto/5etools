import {getEmptyUnifiedDataset, mergeSubclassesIntoClasses, pickDomainProps} from "../util/dataset-util.js";

export async function pLoadOfficialAllContents () {
	const [
		classData,
		raceData,
		backgroundData,
		spellData,
		featData,
		itemData,
		optionalfeatureData,
		languageData,
	] = await Promise.all([
		DataUtil.class.loadJSON(),
		DataUtil.race.loadJSON(),
		DataUtil.background.loadJSON(),
		DataUtil.spell.loadJSON(),
		DataUtil.feat.loadJSON(),
		DataUtil.item.loadJSON(),
		DataUtil.optionalfeature.loadJSON(),
		DataUtil.language.loadJSON(),
	]);

	const partial = pickDomainProps({
		...classData,
		...raceData,
		...backgroundData,
		...spellData,
		...featData,
		...itemData,
		...optionalfeatureData,
		...languageData,
	});

	mergeSubclassesIntoClasses(partial.class, classData.subclass || []);

	return {
		contents: partial,
		cacheKeys: ["official-all"],
	};
}
