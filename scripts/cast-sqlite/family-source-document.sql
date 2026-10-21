-- Authored family source supplement. No domain values are duplicated.
CREATE TABLE family_source_document_import (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  source_sha256 TEXT NOT NULL,
  document_sha256 TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE family_source_document_dependency (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  source_path TEXT NOT NULL
) STRICT;
-- Key names/order only, never scalar values. Nodes already have family_input_key_order.
CREATE TABLE family_source_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  PRIMARY KEY(object_path,ordinal),
  UNIQUE(object_path,key)
) STRICT;
