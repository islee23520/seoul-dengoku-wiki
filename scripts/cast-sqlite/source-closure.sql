CREATE TABLE reference_source (
  logical_path TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  byte_length INTEGER NOT NULL CHECK(byte_length>=0),
  source_class TEXT NOT NULL CHECK(source_class='reference-hash-only')
) STRICT;

CREATE TABLE source_reference (
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  reference_logical_path TEXT NOT NULL REFERENCES reference_source(logical_path),
  reference_anchor TEXT,
  anchor_verification TEXT NOT NULL CHECK(anchor_verification IN ('json-pointer-verified','json-pointer-unresolved','verified-path-only')),
  PRIMARY KEY(source_id,json_pointer,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
