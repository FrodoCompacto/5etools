import type { Env } from "./_lib";
import { createSignedState } from "./_lib";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = "openid email profile";

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { env, request } = context;
	const clientId = env.GOOGLE_CLIENT_ID;
	const secret = env.SESSION_SECRET;
	if (!clientId || !secret) {
		return new Response("Auth not configured", { status: 503 });
	}
	const url = new URL(request.url);
	const origin = url.origin;
	const redirectUri = `${origin}/api/auth/callback`;
	const state = await createSignedState(secret);
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: SCOPES,
		state,
		access_type: "offline",
		prompt: "consent",
	});
	const redirectTo = `${GOOGLE_AUTH_URL}?${params.toString()}`;
	return Response.redirect(redirectTo, 302);
};
