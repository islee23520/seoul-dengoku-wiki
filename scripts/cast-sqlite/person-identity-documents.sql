CREATE TABLE person_identity_document_import (
  domain TEXT PRIMARY KEY CHECK(domain IN ('lineage','gender')),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;

-- Only object key presence, order and explicit nulls; no source values.
CREATE TABLE person_identity_document_key (
  domain TEXT NOT NULL REFERENCES person_identity_document_import(domain),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(domain,object_path,ordinal),
  UNIQUE(domain,object_path,key)
) STRICT;
