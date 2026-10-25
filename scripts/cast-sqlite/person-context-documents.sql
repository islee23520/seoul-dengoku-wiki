CREATE TABLE person_context_document_import (
  domain TEXT PRIMARY KEY CHECK(domain IN ('birthdays','contacts')),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;

-- Proven missing source metadata only. Contact facts remain in context_prose_contact.
CREATE TABLE person_context_contact_metadata (
  domain TEXT PRIMARY KEY REFERENCES person_context_document_import(domain) CHECK(domain='contacts'),
  schema_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  source_note TEXT NOT NULL
) STRICT;

-- Object key presence/order/null only; never source values or array payloads.
CREATE TABLE person_context_document_key (
  domain TEXT NOT NULL REFERENCES person_context_document_import(domain),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(domain,object_path,ordinal),
  UNIQUE(domain,object_path,key)
) STRICT;
