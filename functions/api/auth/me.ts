import type { Env } from "./_lib";
import { getCookie, decodeJwt } from "./_lib";

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env, request } = context;
	const { SESSION_SECRET, DB } = env;
	if (!SESSION_SECRET) {
		return new Response(JSON.stringify({ error: "Auth not configured" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}
	const token = getCookie(request, "session");
	if (!token) {
		return new Response(JSON.stringify({ error: "Not authenticated" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	const payload = await decodeJwt(SESSION_SECRET, token);
	if (!payload) {
		return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	const userId = payload.sub;
	const row = await DB.prepare("SELECT id, email, name, picture_url FROM users WHERE id = ?")
		.bind(Number(userId))
		.first<{ id: number; email: string; name: string | null; picture_url: string | null }>();
	if (!row) {
		return new Response(JSON.stringify({ error: "User not found" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(
		JSON.stringify({
			id: row.id,
			email: row.email,
			name: row.name,
			picture_url: row.picture_url,
		}),
		{
			status: 200,
			headers: { "Content-Type": "application/json" },
		},
	);
};
