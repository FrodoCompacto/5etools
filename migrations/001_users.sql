-- Run once on D1 database "5e-tools" (e.g. via Cloudflare dashboard D1 Console or: wrangler d1 execute 5e-tools --remote --file=./migrations/001_users.sql)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  picture_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
