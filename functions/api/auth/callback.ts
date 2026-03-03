import type { Env } from "./_lib";
import { verifyState, encodeJwt, setSessionCookie } from "./_lib";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env, request } = context;
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, DB } = env;
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SESSION_SECRET) {
		return new Response("Auth not configured", { status: 503 });
	}
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (!code || !state || !(await verifyState(SESSION_SECRET, state))) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	const redirectUri = `${url.origin}/api/auth/callback`;
	const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			code,
			grant_type: "authorization_code",
			redirect_uri: redirectUri,
		}),
	});
	if (!tokenRes.ok) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	const tokens = (await tokenRes.json()) as { access_token?: string };
	const accessToken = tokens.access_token;
	if (!accessToken) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	const userRes = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!userRes.ok) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	const profile = (await userRes.json()) as { id?: string; email?: string; name?: string; picture?: string };
	const googleId = profile.id;
	const email = profile.email ?? "";
	const name = profile.name ?? null;
	const pictureUrl = profile.picture ?? null;
	if (!googleId || !email) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	// Upsert user
	await DB.prepare(
		"INSERT INTO users (google_id, email, name, picture_url) VALUES (?, ?, ?, ?) ON CONFLICT(google_id) DO UPDATE SET email=excluded.email, name=excluded.name, picture_url=excluded.picture_url",
	)
		.bind(googleId, email, name, pictureUrl)
		.run();
	const row = await DB.prepare("SELECT id FROM users WHERE google_id = ?").bind(googleId).first<{ id: number }>();
	const userId = row?.id;
	if (userId == null) {
		return Response.redirect(new URL("/", url.origin).toString(), 302);
	}
	const jwt = await encodeJwt(SESSION_SECRET, userId);
	const cookie = setSessionCookie(jwt);
	const home = new URL("/", url.origin).toString();
	return new Response(null, {
		status: 302,
		headers: {
			Location: home,
			"Set-Cookie": cookie,
		},
	});
};
