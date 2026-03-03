import type { Env } from "./_lib";
import { clearSessionCookie } from "./_lib";

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);
	const cookie = clearSessionCookie();
	return new Response(null, {
		status: 204,
		headers: {
			"Set-Cookie": cookie,
		},
	});
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);
	const cookie = clearSessionCookie();
	return new Response(null, {
		status: 302,
		headers: {
			Location: new URL("/", url.origin).toString(),
			"Set-Cookie": cookie,
		},
	});
};
