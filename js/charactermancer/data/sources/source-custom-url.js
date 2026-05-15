import {getEmptyUnifiedDataset} from "../util/dataset-util.js";

export async function pLoadCustomUrlContents () {
	return {
		contents: getEmptyUnifiedDataset(),
		cacheKeys: ["custom-url"],
		meta: {isStub: true},
	};
}
