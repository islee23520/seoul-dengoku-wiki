CREATE TABLE name_pool_document (
  logical_path TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  id TEXT NOT NULL UNIQUE,
  schema TEXT,
  sourceLink TEXT,
  status TEXT,
  source TEXT,
  contract TEXT,
  authorization TEXT,
  transformation TEXT,
  note TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE name_pool_candidate (
  logical_path TEXT NOT NULL REFERENCES name_pool_document(logical_path),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  name TEXT NOT NULL,
  PRIMARY KEY(logical_path,ordinal)
) STRICT;
