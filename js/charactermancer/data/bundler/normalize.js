import {DOMAIN_PROPS} from "../../core/constants.js";
import {filterDomainEntries} from "../util/prop-meta.js";
import {getEmptyUnifiedDataset, mergeSubclassesIntoClasses} from "../util/dataset-util.js";

export function normalizeUnifiedDataset (dataset) {
	const out = getEmptyUnifiedDataset();

	DOMAIN_PROPS.forEach(prop => {
		const filtered = filterDomainEntries(prop, dataset[prop] || []);
		out[prop] = filtered.sort((a, b) => SortUtil.ascSortLower(a?.name, b?.name) || SortUtil.ascSort(a?.source, b?.source));
	});

	// Re-attach orphan subclasses that may have arrived only on duplicate class rows pre-dedupe.
	const orphanSubclasses = [];
	out.class.forEach(cls => {
		if (cls.subclasses?.length) orphanSubclasses.push(...cls.subclasses);
	});
	mergeSubclassesIntoClasses(out.class, orphanSubclasses);

	out.class.forEach(cls => {
		if (cls.subclasses?.length) cls.subclasses.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));
	});

	return out;
}
