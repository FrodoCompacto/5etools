/* Minimal types for Cloudflare Pages Functions and D1 (no @cloudflare/workers-types required). */
interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = unknown>(): Promise<T | null>;
	run(): Promise<{ meta: { changes: number; last_row_id: number }; results?: unknown[] }>;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

interface PagesFunctionContext<Env = unknown> {
	request: Request;
	env: Env;
	params: Record<string, string | undefined>;
	next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
	waitUntil: (promise: Promise<unknown>) => void;
	passThroughOnException: () => void;
	functionPath: string;
	data: Record<string, unknown>;
}

type PagesFunction<Env = unknown> = (context: PagesFunctionContext<Env>) => Response | Promise<Response>;
