/**
 * Renders class/subclass preview into the charactermancer rhs pane.
 */
export class ClassPreviewRenderer {
	/**
	 * @param {HTMLElementExtended} wrpPreview
	 * @param {object|null} cls
	 * @param {object|null} sc
	 */
	static render ({wrpPreview, cls, sc}) {
		wrpPreview.empty();

		if (!cls) {
			wrpPreview.append(
				ee`<div class="initial-message initial-message--med ve-flex-vh-center flex-1 min-h-0 p-3">Select an entry from the list to view it here</div>`,
			);
			return;
		}

		const wrpContent = ee`<div class="cmchr__preview-content ve-flex-col p-2"></div>`;
		wrpPreview.append(wrpContent);

		ClassPreviewRenderer._pRenderFluff({wrpContent, ent: sc || cls}).then(() => {
			Renderer.get().setFirstSection(true);
			const tbl = ee`<table class="w-100 stats stats--book cmchr__preview-stats"></table>`;

			let html = Renderer.class.getCompactRenderedString(cls, {isSkipNameRow: false});
			if (sc) html += Renderer.subclass.getCompactRenderedString(sc);
			tbl.html(html);

			wrpContent.append(tbl);
		});
	}

	static async _pRenderFluff ({wrpContent, ent}) {
		if (!ent) return;

		const isSubclass = !!ent.className;
		const fluff = await DataUtil.generic.pGetFluff({
			entity: ent,
			fluffProp: isSubclass ? "subclassFluff" : "classFluff",
		});

		if (!fluff?.images?.length) return;

		const imgMeta = fluff.images[0];
		const href = Renderer.utils.getEntryMediaUrl(imgMeta, "href", "img");
		if (!href) return;

		wrpContent.prepend(
			ee`<div class="cmchr__preview-fluff ve-text-center mb-2">
				<img class="ve-image" src="${href.qq()}" alt="">
			</div>`,
		);
	}
}
