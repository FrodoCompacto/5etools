"use strict";

(function () {
	const SYNC_DEBOUNCE_MS = 3000;

	let isSyncScheduled = false;
	let timeoutId = null;

	async function pSyncUserState () {
		isSyncScheduled = false;
		if (!globalThis.StorageUtil || !globalThis.styleSwitcher) return;

		try {
			// Only proceed if the user is authenticated
			const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
			if (!meRes.ok) return;

			const sync = StorageUtil.syncGetDump();
			const async = await StorageUtil.pGetDump();
			const syncStyle = globalThis.styleSwitcher.constructor.syncGetStorageDump();

			const payload = {sync, async, syncStyle};

			await fetch("/api/user/state", {
				method: "PUT",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
		} catch (e) {
			// Ignore sync errors and keep local-only state
		}
	}

	function scheduleUserStateSync () {
		if (isSyncScheduled) return;
		isSyncScheduled = true;

		if (timeoutId != null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		timeoutId = setTimeout(() => {
			pSyncUserState().then(null);
		}, SYNC_DEBOUNCE_MS);
	}

	if (globalThis.StorageUtil) {
		globalThis.StorageUtil._onStorageChanged = scheduleUserStateSync;
	} else {
		// Fallback if this script runs before utils.js
		globalThis.addEventListener &&
		globalThis.addEventListener("load", () => {
			if (globalThis.StorageUtil) {
				globalThis.StorageUtil._onStorageChanged = scheduleUserStateSync;
			}
		});
	}

	globalThis.UserStateSync = {
		schedule: scheduleUserStateSync,
	};
})();

