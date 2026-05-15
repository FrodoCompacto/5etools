/**
 * Simple in-memory rate limiter for Pages Functions (per isolate, best-effort).
 * Not shared across Cloudflare PoPs or isolates; sufficient for casual abuse.
 */

interface RateLimitRule {
	windowMs: number;
	max: number;
}

interface Bucket {
	count: number;
	resetAt: number;
}

const DEFAULT_RULE: RateLimitRule = { windowMs: 60_000, max: 120 };

const ROUTE_RULES: Record<string, RateLimitRule> = {
	"PUT:/api/user/state": { windowMs: 60_000, max: 10 },
	"GET:/api/auth/google": { windowMs: 60_000, max: 20 },
	"GET:/api/auth/callback": { windowMs: 60_000, max: 20 },
	"GET:/api/auth/me": { windowMs: 60_000, max: 60 },
};

const buckets = new Map<string, Bucket>();

function getRule (method: string, pathname: string): RateLimitRule {
	const key = `${method}:${pathname}`;
	return ROUTE_RULES[key] ?? DEFAULT_RULE;
}

function getClientIp (request: Request): string {
	return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSec: number;
}

export function checkRateLimit (request: Request): RateLimitResult {
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/api/")) {
		return { allowed: true, retryAfterSec: 0 };
	}

	if (request.method === "OPTIONS") {
		return { allowed: true, retryAfterSec: 0 };
	}

	const rule = getRule(request.method, url.pathname);
	const bucketKey = `${getClientIp(request)}:${request.method}:${url.pathname}`;
	const now = Date.now();

	let bucket = buckets.get(bucketKey);
	if (!bucket || now >= bucket.resetAt) {
		bucket = { count: 0, resetAt: now + rule.windowMs };
		buckets.set(bucketKey, bucket);
	}

	bucket.count += 1;

	if (bucket.count > rule.max) {
		const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
		return { allowed: false, retryAfterSec };
	}

	return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitExceededResponse (retryAfterSec: number): Response {
	return new Response(JSON.stringify({ error: "Too many requests" }), {
		status: 429,
		headers: {
			"Content-Type": "application/json",
			"Retry-After": String(retryAfterSec),
		},
	});
}
