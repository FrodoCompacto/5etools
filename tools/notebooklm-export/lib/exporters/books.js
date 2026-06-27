import {isSourceAllowed} from "../filters.js";
import {bookOutputName} from "../loaders.js";
import {renderBook} from "../render-utils.js";
import {writeMarkdownFile} from "../writers.js";

export function exportBooks (data, indexEntries) {
	const outputs = [];

	for (const book of data.books) {
		const source = book.meta?.source || book.id;
		if (!isSourceAllowed(source)) continue;

		const content = renderBook(book);
		const relPath = `01-livro-${bookOutputName(book)}`;
		writeMarkdownFile(relPath, content, indexEntries);
		outputs.push({type: "book", count: 1, path: relPath});
	}

	return outputs;
}
