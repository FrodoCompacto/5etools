import {mergeSubclassesIntoClasses, pickDomainProps} from "../util/dataset-util.js";

export async function pLoadPrereleaseContents () {
	const brew = await PrereleaseUtil.pGetBrewProcessed();
	const partial = pickDomainProps(brew);
	mergeSubclassesIntoClasses(partial.class, brew.subclass || []);
	return {
		contents: partial,
		cacheKeys: ["prerelease"],
	};
}
