import {mergeSubclassesIntoClasses, pickDomainProps} from "../util/dataset-util.js";

export async function pLoadBrewContents () {
	const brew = await BrewUtil2.pGetBrewProcessed();
	const partial = pickDomainProps(brew);
	mergeSubclassesIntoClasses(partial.class, brew.subclass || []);
	return {
		contents: partial,
		cacheKeys: ["brew"],
	};
}
