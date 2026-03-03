/**
 * Shared auth helpers for Google OAuth + JWT (Pages Functions).
 * Uses Web Crypto (available in Cloudflare Workers).
 */

export interface Env {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	SESSION_SECRET: string;
	DB: D1Database;
}

const COOKIE_NAME = "session";
const JWT_ISSUER = "5etools-auth";
const JWT_AUDIENCE = "5etools";
const JWT_EXPIRY_SEC = 7 * 24 * 60 * 60; // 7 days

function base64UrlEncode(bytes: ArrayBuffer): string {
	const b = new Uint8Array(bytes);
	let binary = "";
	for (let i = 0; i < b.length; i++) binary += String.fromCharCode(b[i]);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	while (str.length % 4) str += "=";
	const binary = atob(str);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function hmacSha256(secret: string, data: string): Promise<ArrayBuffer> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
}

export function getCookie(req: Request, name: string): string | null {
	const header = req.headers.get("Cookie");
	if (!header) return null;
	const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1].trim()) : null;
}

export function setSessionCookie(jwt: string, maxAgeSec: number = JWT_EXPIRY_SEC): string {
	return `${COOKIE_NAME}=${encodeURIComponent(jwt)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
	return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Generate state param for OAuth: base64url(nonce).base64url(hmac). */
export async function createSignedState(secret: string): Promise<string> {
	const nonce = crypto.getRandomValues(new Uint8Array(16));
	const nonceB64 = base64UrlEncode(nonce.buffer);
	const sig = await hmacSha256(secret, nonceB64);
	const sigB64 = base64UrlEncode(sig);
	return `${nonceB64}.${sigB64}`;
}

/** Verify state param from callback. */
export async function verifyState(secret: string, stateParam: string): Promise<boolean> {
	const parts = stateParam.split(".");
	if (parts.length !== 2) return false;
	const [nonceB64, sigB64] = parts;
	const expectedSig = await hmacSha256(secret, nonceB64);
	const expectedB64 = base64UrlEncode(expectedSig);
	return expectedB64 === sigB64;
}

/** Encode JWT (HS256) with payload { sub: userId, iat, exp }. */
export async function encodeJwt(secret: string, userId: number): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: "HS256", typ: "JWT" };
	const payload = { sub: String(userId), iss: JWT_ISSUER, aud: JWT_AUDIENCE, iat: now, exp: now + JWT_EXPIRY_SEC };
	const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)).buffer);
	const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)).buffer);
	const signingInput = `${headerB64}.${payloadB64}`;
	const sig = await hmacSha256(secret, signingInput);
	const sigB64 = base64UrlEncode(sig);
	return `${signingInput}.${sigB64}`;
}

/** Decode and verify JWT; return payload or null. */
export async function decodeJwt(secret: string, token: string): Promise<{ sub: string } | null> {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	const [headerB64, payloadB64, sigB64] = parts;
	const signingInput = `${headerB64}.${payloadB64}`;
	const expectedSig = await hmacSha256(secret, signingInput);
	if (base64UrlEncode(expectedSig) !== sigB64) return null;
	try {
		let base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
		base64 += "=".repeat((4 - (base64.length % 4)) % 4);
		const payloadJson = atob(base64);
		const payload = JSON.parse(payloadJson) as { sub?: string; exp?: number };
		if (!payload.sub || (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000))) return null;
		return { sub: payload.sub };
	} catch {
		return null;
	}
}

export { COOKIE_NAME };
