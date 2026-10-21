CREATE TABLE office_appointment_input_import (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  domain_sha256 TEXT NOT NULL CHECK(length(domain_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE office_appointment_input_contract (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  history TEXT NOT NULL,
  current TEXT NOT NULL,
  common_tier TEXT NOT NULL,
  rights TEXT NOT NULL
) STRICT;
CREATE TABLE office_appointment_input_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(object_path,ordinal), UNIQUE(object_path,key)
) STRICT;
