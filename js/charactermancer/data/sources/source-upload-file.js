import {getEmptyUnifiedDataset} from "../util/dataset-util.js";

export async function pLoadUploadFileContents () {
	return {
		contents: getEmptyUnifiedDataset(),
		cacheKeys: ["upload-file"],
		meta: {isStub: true},
	};
}
