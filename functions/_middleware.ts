import { checkRateLimit, rateLimitExceededResponse } from "./api/_rate-limit";

export const onRequest: PagesFunction = async (context) => {
	const { request, next } = context;
	const url = new URL(request.url);

	if (url.pathname.startsWith("/api/")) {
		const { allowed, retryAfterSec } = checkRateLimit(request);
		if (!allowed) return rateLimitExceededResponse(retryAfterSec);
	}

	return next();
};
