import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function hasTable(db, name) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
}

export function openAssetDatabase(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  const schemaVersion = db.prepare('PRAGMA user_version').get().user_version;
  if (schemaVersion > 4) {
    db.close();
    throw new Error(`database schema version ${schemaVersion} is newer than supported version 4`);
  }
  if (schemaVersion === 4) return db;

  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS content_objects (
      sha256 TEXT PRIMARY KEY,
      byte_size INTEGER NOT NULL,
      extension TEXT NOT NULL,
      media_type TEXT NOT NULL,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
    CREATE TABLE IF NOT EXISTS asset_paths (
      path TEXT PRIMARY KEY,
      sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      byte_size INTEGER NOT NULL,
      mtime_ms INTEGER NOT NULL,
      stage TEXT NOT NULL CHECK(stage IN ('raw','work','review','receipt','runtime')),
      asset_class TEXT NOT NULL,
      lifecycle TEXT NOT NULL CHECK(lifecycle IN ('current','attempt','snapshot','archived','stale','superseded','rejected','failed')),
      failure_related INTEGER NOT NULL CHECK(failure_related IN (0,1)),
      sex TEXT CHECK(sex IN ('female','male') OR sex IS NULL),
      slot TEXT,
      logical_id TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
    CREATE INDEX IF NOT EXISTS asset_paths_sha ON asset_paths(sha256);
    CREATE INDEX IF NOT EXISTS asset_paths_stage ON asset_paths(stage, sex, slot);
    CREATE TABLE IF NOT EXISTS evaluation_observations (
      id INTEGER PRIMARY KEY,
      receipt_path TEXT NOT NULL,
      receipt_sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      target_path TEXT,
      target_sha256 TEXT,
      decision TEXT NOT NULL CHECK(decision IN ('PASS','REJECTED','PENDING','SUPERSEDED','UNREVIEWED')),
      authority TEXT NOT NULL,
      dimension TEXT NOT NULL,
      raw_status TEXT NOT NULL,
      summary TEXT NOT NULL,
      source_kind TEXT NOT NULL DEFAULT 'legacy' CHECK(source_kind IN ('structured','curated','reference','legacy')),
      observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(receipt_path, receipt_sha256, target_path, target_sha256, decision, authority, dimension, raw_status, summary, source_kind)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS evaluation_observations_target_path ON evaluation_observations(target_path);
    CREATE INDEX IF NOT EXISTS evaluation_observations_target_sha ON evaluation_observations(target_sha256);
    CREATE TABLE IF NOT EXISTS properties (
      sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      source_path TEXT NOT NULL,
      PRIMARY KEY(sha256, key, source_path)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS file_cache (
      path TEXT PRIMARY KEY,
      byte_size INTEGER NOT NULL,
      mtime_ms INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      stage TEXT NOT NULL,
      asset_class TEXT NOT NULL,
      lifecycle TEXT NOT NULL,
      failure_related INTEGER NOT NULL,
      sex TEXT,
      slot TEXT,
      logical_id TEXT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS derived_cache (
      cache_key TEXT PRIMARY KEY,
      producer TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      output_sha256 TEXT,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
  `);

  if (hasTable(db, 'evaluations')) db.exec(`
    INSERT OR IGNORE INTO evaluation_observations
      (receipt_path,receipt_sha256,target_path,target_sha256,decision,authority,dimension,raw_status,summary,source_kind)
    SELECT receipt_path,receipt_sha256,target_path,target_sha256,decision,authority,dimension,raw_status,summary,'legacy'
    FROM evaluations;
    ALTER TABLE evaluations RENAME TO evaluations_legacy;
  `);

  db.exec(`
    DROP VIEW IF EXISTS evaluations;
    CREATE VIEW evaluations AS SELECT id, receipt_path, receipt_sha256, target_path, target_sha256,
      decision, authority, dimension, raw_status, summary FROM evaluation_observations;
  `);

  db.exec(`
    DROP VIEW IF EXISTS asset_state;
    CREATE VIEW asset_state AS
    SELECT p.path AS best_path, p.sha256, p.stage, p.asset_class, p.lifecycle, p.failure_related, p.sex, p.slot, p.logical_id,
      COALESCE((
        SELECT CASE
          WHEN SUM(e.decision = 'REJECTED') > 0 THEN 'REJECTED'
          WHEN SUM(e.decision = 'PENDING') > 0 THEN 'PENDING'
          WHEN SUM(e.decision = 'SUPERSEDED') > 0 THEN 'SUPERSEDED'
          WHEN SUM(e.decision = 'PASS') > 0 THEN 'PASS'
          ELSE 'UNREVIEWED'
        END
        FROM evaluation_observations e
        JOIN asset_paths receipt ON receipt.path = e.receipt_path AND receipt.sha256 = e.receipt_sha256
        WHERE e.target_path = p.path AND e.target_sha256 = p.sha256
          AND e.source_kind IN ('structured','curated')
      ), 'UNREVIEWED') AS decision
    FROM asset_paths p;
    DROP VIEW IF EXISTS v_raw_assets;
    CREATE VIEW v_raw_assets AS SELECT * FROM asset_state WHERE stage = 'raw';
    DROP VIEW IF EXISTS v_work_assets;
    CREATE VIEW v_work_assets AS SELECT * FROM asset_state WHERE stage = 'work';
    DROP VIEW IF EXISTS v_review_assets;
    CREATE VIEW v_review_assets AS SELECT * FROM asset_state WHERE stage = 'review';
    DROP VIEW IF EXISTS v_passed_assets;
    CREATE VIEW v_passed_assets AS SELECT * FROM asset_state WHERE decision = 'PASS' AND lifecycle NOT IN ('rejected','failed','stale');
    DROP VIEW IF EXISTS v_failed_assets;
    CREATE VIEW v_failed_assets AS SELECT * FROM asset_state WHERE decision = 'REJECTED' OR failure_related = 1;
    DROP VIEW IF EXISTS v_curated_passed_assets;
    CREATE VIEW v_curated_passed_assets AS
      SELECT DISTINCT s.* FROM asset_state s
      JOIN evaluation_observations curated
        ON curated.target_path = s.best_path AND curated.target_sha256 = s.sha256
       AND curated.decision = 'PASS' AND curated.authority = 'curator' AND curated.source_kind = 'curated'
      JOIN asset_paths curated_receipt
        ON curated_receipt.path = curated.receipt_path AND curated_receipt.sha256 = curated.receipt_sha256
      WHERE NOT EXISTS (
        SELECT 1 FROM evaluation_observations conflict
        JOIN asset_paths conflict_receipt
          ON conflict_receipt.path = conflict.receipt_path AND conflict_receipt.sha256 = conflict.receipt_sha256
        WHERE conflict.target_path = s.best_path AND conflict.target_sha256 = s.sha256
          AND conflict.dimension = curated.dimension
          AND conflict.source_kind IN ('structured','curated')
          AND conflict.decision IN ('REJECTED','PENDING','SUPERSEDED')
      );
    DROP VIEW IF EXISTS v_duplicate_bytes;
    CREATE VIEW v_duplicate_bytes AS
      SELECT sha256, COUNT(*) AS path_count, SUM(byte_size) AS referenced_bytes,
             GROUP_CONCAT(path, char(10)) AS paths
      FROM asset_paths GROUP BY sha256 HAVING COUNT(*) > 1;
    PRAGMA user_version = 4;
  `);
  return db;
}
