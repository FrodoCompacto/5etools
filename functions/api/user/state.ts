import type { Env } from "../../auth/_lib";
import { getCookie, decodeJwt } from "../../auth/_lib";

const MAX_STATE_JSON_LENGTH = 2 * 1024 * 1024; // ~2MB

async function getUserIdFromRequest (env: Env, request: Request): Promise<number | null> {
	const token = getCookie(request, "session");
	if (!token) return null;

	const payload = await decodeJwt(env.SESSION_SECRET, token);
	if (!payload) return null;

	const userId = Number(payload.sub);
	if (!Number.isInteger(userId) || userId <= 0) return null;

	// Optional: verify user exists
	const row = await env.DB
		.prepare("SELECT id FROM users WHERE id = ?")
		.bind(userId)
		.first<{ id: number }>();

	if (!row) return null;
	return row.id;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	if (!env.SESSION_SECRET) {
		return new Response(JSON.stringify({ error: "Auth not configured" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	const userId = await getUserIdFromRequest(env, request);
	if (userId == null) {
		return new Response(JSON.stringify({ error: "Not authenticated" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const row = await env.DB
		.prepare("SELECT state_json FROM user_state WHERE user_id = ?")
		.bind(userId)
		.first<{ state_json: string | null }>();

	let body: unknown = { sync: {}, async: {}, syncStyle: {} };

	if (row?.state_json) {
		try {
			const parsed = JSON.parse(row.state_json);
			if (parsed && typeof parsed === "object") body = parsed;
		} catch {
			// fall back to empty state
		}
	}

	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	if (!env.SESSION_SECRET) {
		return new Response(JSON.stringify({ error: "Auth not configured" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (request.method !== "PUT") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	const userId = await getUserIdFromRequest(env, request);
	if (userId == null) {
		return new Response(JSON.stringify({ error: "Not authenticated" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!payload || typeof payload !== "object") {
		return new Response(JSON.stringify({ error: "Invalid payload" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const json = JSON.stringify(payload);
	if (json.length > MAX_STATE_JSON_LENGTH) {
		return new Response(JSON.stringify({ error: "State too large" }), {
			status: 413,
			headers: { "Content-Type": "application/json" },
		});
	}

	await env.DB
		.prepare(
			"INSERT INTO user_state (user_id, state_json, updated_at) VALUES (?, ?, datetime('now')) " +
			"ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = datetime('now')",
		)
		.bind(userId, json)
		.run();

	return new Response(null, { status: 204 });
};

