-- Cloudflare D1 Schema for TechHat Studio Document Vault
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'scan',
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  thumb TEXT DEFAULT '',
  r2_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_account_created
  ON documents (account, created_at DESC);
