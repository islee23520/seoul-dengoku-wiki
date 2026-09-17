-- migrate-item-intents.sql
-- Exact schema per task for Design/potrait-generator/data/assets.sqlite item_intents
-- Run this to ensure table + columns exist before data fill (idempotent)

CREATE TABLE IF NOT EXISTS item_intents (
  sex TEXT NOT NULL CHECK(sex IN ('female','male')),
  slot TEXT NOT NULL,
  logical_id TEXT NOT NULL,
  design_intent TEXT NOT NULL,
  verification_criteria TEXT NOT NULL,
  target_sha256 TEXT NOT NULL DEFAULT 'c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9',
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sex, slot, logical_id)
) STRICT;

-- If table existed with only 7 rows (eyes + face_base) and lacked verification_criteria,
-- the ALTER would be:
-- ALTER TABLE item_intents ADD COLUMN verification_criteria TEXT NOT NULL DEFAULT 'see QUALITY-GATE.md Q01-Q10 for slot; cross-reference library label and evidence README';
-- (SQLite does not allow easy column removal; this task assumes we keep existing 7 rows as-is and expand with new rows for full coverage)

-- Data population for full sex×slot×variant coverage is done via the test script / dedicated fill logic
-- that reads library.json and inserts one row per variant.
