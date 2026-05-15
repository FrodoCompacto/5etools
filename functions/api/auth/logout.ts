import type { Env } from "./_lib";
import { clearSessionCookie, clearSessionHintCookie } from "./_lib";

function logoutHeaders (location?: string): Headers {
	const headers = new Headers();
	if (location) headers.set("Location", location);
	headers.append("Set-Cookie", clearSessionCookie());
	headers.append("Set-Cookie", clearSessionHintCookie());
	return headers;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
	return new Response(null, {
		status: 204,
		headers: logoutHeaders(),
	});
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);
	return new Response(null, {
		status: 302,
		headers: logoutHeaders(new URL("/", url.origin).toString()),
	});
};
