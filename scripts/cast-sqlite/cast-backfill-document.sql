-- Bounded original cast-backfill draft.
-- Named typed columns and ordered child rows only. The key table stores object key order, never values.
-- Each of the fifteen field entries is a named column group on the person row. Absent prose fields stay NULL.
-- Loading this draft does not infer biography, activate mechanics, or grant approval.
CREATE TABLE cast_backfill_document_import (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  row_sha256 TEXT NOT NULL CHECK (length(row_sha256) = 64),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE cast_backfill_document_root (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  generated TEXT NOT NULL CHECK (length(generated) > 0),
  count INTEGER NOT NULL CHECK (count = 422),
  FOREIGN KEY (document_id) REFERENCES cast_backfill_document_import(document_id)
) STRICT;

CREATE TABLE cast_backfill_document_person (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES cast_backfill_document_root(document_id),
  "성명" TEXT NOT NULL CHECK (length("성명") > 0),
  "소속" TEXT NOT NULL CHECK (length("소속") > 0),
  "직위" TEXT NOT NULL CHECK (length("직위") > 0),
  "출신 공동체" TEXT NOT NULL CHECK (length("출신 공동체") > 0),
  "언어" TEXT NOT NULL CHECK (length("언어") > 0),
  "생업" TEXT NOT NULL CHECK (length("생업") > 0),
  "징집 이력" TEXT NOT NULL CHECK (length("징집 이력") > 0),
  "무장 접근" TEXT NOT NULL CHECK (length("무장 접근") > 0),
  source_file TEXT NOT NULL CHECK (length(source_file) > 0),
  "성명_value" TEXT NOT NULL CHECK (length("성명_value") > 0),
  "성명_derived" INTEGER NOT NULL CHECK ("성명_derived" = 0),
  "성명_rule_present" INTEGER NOT NULL CHECK ("성명_rule_present" = 0),
  "성명_rule" TEXT CHECK ("성명_rule" IS NULL),
  "소속_value" TEXT NOT NULL CHECK (length("소속_value") > 0),
  "소속_derived" INTEGER NOT NULL CHECK ("소속_derived" = 0),
  "소속_rule_present" INTEGER NOT NULL CHECK ("소속_rule_present" = 0),
  "소속_rule" TEXT CHECK ("소속_rule" IS NULL),
  "직위_value" TEXT NOT NULL CHECK (length("직위_value") > 0),
  "직위_derived" INTEGER NOT NULL CHECK ("직위_derived" = 0),
  "직위_rule_present" INTEGER NOT NULL CHECK ("직위_rule_present" = 0),
  "직위_rule" TEXT CHECK ("직위_rule" IS NULL),
  "성격_value" TEXT,
  "성격_derived" INTEGER,
  "성격_rule_present" INTEGER,
  "성격_rule" TEXT,
  "개인 야망_value" TEXT,
  "개인 야망_derived" INTEGER,
  "개인 야망_rule_present" INTEGER,
  "개인 야망_rule" TEXT,
  "공포_value" TEXT,
  "공포_derived" INTEGER,
  "공포_rule_present" INTEGER,
  "공포_rule" TEXT,
  "통치 방식_value" TEXT,
  "통치 방식_derived" INTEGER,
  "통치 방식_rule_present" INTEGER,
  "통치 방식_rule" TEXT,
  "핵심 관계_value" TEXT,
  "핵심 관계_derived" INTEGER,
  "핵심 관계_rule_present" INTEGER,
  "핵심 관계_rule" TEXT,
  "촉발 사건_value" TEXT,
  "촉발 사건_derived" INTEGER,
  "촉발 사건_rule_present" INTEGER,
  "촉발 사건_rule" TEXT,
  "플레이어 개입_value" TEXT,
  "플레이어 개입_derived" INTEGER,
  "플레이어 개입_rule_present" INTEGER,
  "플레이어 개입_rule" TEXT,
  "출신 공동체_value" TEXT NOT NULL CHECK (length("출신 공동체_value") > 0),
  "출신 공동체_derived" INTEGER NOT NULL CHECK ("출신 공동체_derived" = 1),
  "출신 공동체_rule_present" INTEGER NOT NULL CHECK ("출신 공동체_rule_present" = 1),
  "출신 공동체_rule" TEXT NOT NULL CHECK (length("출신 공동체_rule") > 0),
  "언어_value" TEXT NOT NULL CHECK (length("언어_value") > 0),
  "언어_derived" INTEGER NOT NULL CHECK ("언어_derived" = 1),
  "언어_rule_present" INTEGER NOT NULL CHECK ("언어_rule_present" = 1),
  "언어_rule" TEXT NOT NULL CHECK (length("언어_rule") > 0),
  "생업_value" TEXT NOT NULL CHECK (length("생업_value") > 0),
  "생업_derived" INTEGER NOT NULL CHECK ("생업_derived" = 1),
  "생업_rule_present" INTEGER NOT NULL CHECK ("생업_rule_present" = 1),
  "생업_rule" TEXT NOT NULL CHECK (length("생업_rule") > 0),
  "징집 이력_value" TEXT NOT NULL CHECK (length("징집 이력_value") > 0),
  "징집 이력_derived" INTEGER NOT NULL CHECK ("징집 이력_derived" = 1),
  "징집 이력_rule_present" INTEGER NOT NULL CHECK ("징집 이력_rule_present" = 1),
  "징집 이력_rule" TEXT NOT NULL CHECK (length("징집 이력_rule") > 0),
  "무장 접근_value" TEXT NOT NULL CHECK (length("무장 접근_value") > 0),
  "무장 접근_derived" INTEGER NOT NULL CHECK ("무장 접근_derived" = 1),
  "무장 접근_rule_present" INTEGER NOT NULL CHECK ("무장 접근_rule_present" = 1),
  "무장 접근_rule" TEXT NOT NULL CHECK (length("무장 접근_rule") > 0),
  CHECK (("성격_value" IS NULL AND "성격_derived" IS NULL AND "성격_rule_present" IS NULL AND "성격_rule" IS NULL) OR (length("성격_value") > 0 AND "성격_derived" = 0 AND "성격_rule_present" = 0 AND "성격_rule" IS NULL)),
  CHECK (("개인 야망_value" IS NULL AND "개인 야망_derived" IS NULL AND "개인 야망_rule_present" IS NULL AND "개인 야망_rule" IS NULL) OR (length("개인 야망_value") > 0 AND "개인 야망_derived" = 0 AND "개인 야망_rule_present" = 0 AND "개인 야망_rule" IS NULL)),
  CHECK (("공포_value" IS NULL AND "공포_derived" IS NULL AND "공포_rule_present" IS NULL AND "공포_rule" IS NULL) OR (length("공포_value") > 0 AND "공포_derived" = 0 AND "공포_rule_present" = 0 AND "공포_rule" IS NULL)),
  CHECK (("통치 방식_value" IS NULL AND "통치 방식_derived" IS NULL AND "통치 방식_rule_present" IS NULL AND "통치 방식_rule" IS NULL) OR (length("통치 방식_value") > 0 AND "통치 방식_derived" = 0 AND "통치 방식_rule_present" = 0 AND "통치 방식_rule" IS NULL)),
  CHECK (("핵심 관계_value" IS NULL AND "핵심 관계_derived" IS NULL AND "핵심 관계_rule_present" IS NULL AND "핵심 관계_rule" IS NULL) OR (length("핵심 관계_value") > 0 AND "핵심 관계_derived" = 0 AND "핵심 관계_rule_present" = 0 AND "핵심 관계_rule" IS NULL)),
  CHECK (("촉발 사건_value" IS NULL AND "촉발 사건_derived" IS NULL AND "촉발 사건_rule_present" IS NULL AND "촉발 사건_rule" IS NULL) OR (length("촉발 사건_value") > 0 AND "촉발 사건_derived" = 0 AND "촉발 사건_rule_present" = 0 AND "촉발 사건_rule" IS NULL)),
  CHECK (("플레이어 개입_value" IS NULL AND "플레이어 개입_derived" IS NULL AND "플레이어 개입_rule_present" IS NULL AND "플레이어 개입_rule" IS NULL) OR (length("플레이어 개입_value") > 0 AND "플레이어 개입_derived" = 0 AND "플레이어 개입_rule_present" = 0 AND "플레이어 개입_rule" IS NULL)),
  CHECK ((
    "성격_value" IS NULL AND "개인 야망_value" IS NULL AND "공포_value" IS NULL AND "통치 방식_value" IS NULL AND "핵심 관계_value" IS NULL AND "촉발 사건_value" IS NULL AND "플레이어 개입_value" IS NULL
  ) OR (
    "성격_value" IS NOT NULL AND "개인 야망_value" IS NOT NULL AND "공포_value" IS NOT NULL AND "통치 방식_value" IS NOT NULL AND "핵심 관계_value" IS NOT NULL AND "촉발 사건_value" IS NOT NULL AND "플레이어 개입_value" IS NOT NULL
  )),
  CHECK ("성명" = "성명_value" AND "소속" = "소속_value" AND "직위" = "직위_value" AND "출신 공동체" = "출신 공동체_value" AND "언어" = "언어_value" AND "생업" = "생업_value" AND "징집 이력" = "징집 이력_value" AND "무장 접근" = "무장 접근_value")
) STRICT;

CREATE TABLE cast_backfill_document_key (
  object_path TEXT NOT NULL CHECK (length(object_path) > 0),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL CHECK (length(key) > 0),
  PRIMARY KEY (object_path, ordinal)
) STRICT;
