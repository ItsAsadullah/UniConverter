-- Cloudflare D1 schema — TechHat Studio secure sync (v2)
-- Every row is scoped by the Firebase uid verified in the Worker.
CREATE TABLE IF NOT EXISTS items (
  uid          TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  kind         TEXT    NOT NULL,              -- file | project | kv
  tool         TEXT    NOT NULL DEFAULT '',
  title        TEXT    NOT NULL DEFAULT '',
  category     TEXT    NOT NULL DEFAULT '',
  mime         TEXT    NOT NULL DEFAULT '',
  size         INTEGER NOT NULL DEFAULT 0,
  thumb        TEXT    NOT NULL DEFAULT '',
  state        TEXT,                          -- project state JSON
  kv_key       TEXT    NOT NULL DEFAULT '',
  kv_value     TEXT,
  has_blob     INTEGER NOT NULL DEFAULT 0,    -- binary stored in R2 at u/<uid>/<id>
  blob_version INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL DEFAULT 0,    -- client LWW clock
  deleted      INTEGER NOT NULL DEFAULT 0,    -- tombstone
  srv_ts       INTEGER NOT NULL DEFAULT 0,    -- server change cursor
  PRIMARY KEY (uid, id)
);

CREATE INDEX IF NOT EXISTS idx_items_uid_srv ON items (uid, srv_ts);
