-- Current editable domain rows. This receipt records migration, not approval.
CREATE TABLE scope_contract_receipt (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_path TEXT NOT NULL CHECK(source_path='lore/editorial/Seoul-Scope-Contract.json'),
  source_sha256 TEXT NOT NULL CHECK(source_sha256='383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8'),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE scope_contract_root (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema TEXT NOT NULL CHECK(schema='seoul-scope.v1'),
  baselineSha256 TEXT NOT NULL CHECK(length(baselineSha256)=64 AND baselineSha256 NOT GLOB '*[^0-9a-f]*')
) STRICT;
CREATE TABLE scope_contract_boundary (
  singleton INTEGER PRIMARY KEY REFERENCES scope_contract_root(singleton) CHECK(singleton=1),
  path TEXT NOT NULL, sha256 TEXT NOT NULL CHECK(length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'), edition TEXT NOT NULL
) STRICT;
CREATE TABLE scope_contract_entity (
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0), id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('person','title','holding','state','event')),
  sourcePath TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','retired')),
  basis TEXT NOT NULL, batchId TEXT
) STRICT;
CREATE TABLE scope_contract_entity_location (
  entity_id TEXT NOT NULL REFERENCES scope_contract_entity(id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0), ref TEXT NOT NULL,
  PRIMARY KEY(entity_id,ordinal)
) STRICT;
CREATE TABLE scope_contract_entity_jurisdiction (
  entity_id TEXT NOT NULL REFERENCES scope_contract_entity(id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0), ref TEXT NOT NULL,
  PRIMARY KEY(entity_id,ordinal)
) STRICT;
CREATE TABLE scope_contract_document (
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0), sourcePath TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('control','active','excluded','preserved')),
  review_receipt_is_null INTEGER NOT NULL CHECK(review_receipt_is_null IN (0,1)),
  batchId TEXT, basis TEXT NOT NULL
) STRICT;
CREATE TABLE scope_contract_document_review (
  sourcePath TEXT PRIMARY KEY REFERENCES scope_contract_document(sourcePath),
  currentSha256 TEXT NOT NULL CHECK(length(currentSha256)=64 AND currentSha256 NOT GLOB '*[^0-9a-f]*'),
  evidencePath TEXT NOT NULL, reviewedAt TEXT NOT NULL
) STRICT;
CREATE TABLE scope_contract_disposition (
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  disposition_set TEXT NOT NULL CHECK(disposition_set IN ('persons','titles','holdings','grants','bindings','states','polities','events','relations','courts')),
  id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','retired')),
  batchId TEXT NOT NULL, basis TEXT NOT NULL, PRIMARY KEY(disposition_set,id)
) STRICT;
CREATE TABLE scope_contract_disposition_target (
  disposition_set TEXT NOT NULL, disposition_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0), target_id TEXT NOT NULL,
  PRIMARY KEY(disposition_set,disposition_id,ordinal),
  FOREIGN KEY(disposition_set,disposition_id) REFERENCES scope_contract_disposition(disposition_set,id)
) STRICT;
CREATE TABLE scope_contract_rail (
  singleton INTEGER PRIMARY KEY REFERENCES scope_contract_root(singleton) CHECK(singleton=1)
) STRICT;
-- Both arrays are actually empty in the pinned source; only text refs are admitted.
CREATE TABLE scope_contract_rail_station (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  rail_id INTEGER NOT NULL REFERENCES scope_contract_rail(singleton) CHECK(rail_id=1), ref TEXT NOT NULL
) STRICT;
CREATE TABLE scope_contract_rail_edge (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  rail_id INTEGER NOT NULL REFERENCES scope_contract_rail(singleton) CHECK(rail_id=1), ref TEXT NOT NULL
) STRICT;
-- Structural keys only: no scalar, array or object values are stored here.
CREATE TABLE scope_contract_key_order (
  object_pointer TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL,
  PRIMARY KEY(object_pointer,ordinal), UNIQUE(object_pointer,key)
) STRICT;
CREATE TRIGGER scope_contract_receipt_no_update BEFORE UPDATE ON scope_contract_receipt BEGIN SELECT RAISE(ABORT,'immutable scope migration receipt'); END;
CREATE TRIGGER scope_contract_receipt_no_delete BEFORE DELETE ON scope_contract_receipt BEGIN SELECT RAISE(ABORT,'immutable scope migration receipt'); END;
