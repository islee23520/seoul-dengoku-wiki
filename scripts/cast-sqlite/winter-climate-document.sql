-- Bounded preservation of lore/places/sources/Winter-Climate-20210108.json.
-- Named typed columns and ordered child rows only. Key tables store object key order, never values.
-- Loading this historical reference does not infer current weather or grant publication approval.
CREATE TABLE winter_climate_document_import (
  logical_path TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64)
) STRICT;
CREATE TABLE winter_climate_document_root (
  logical_path TEXT PRIMARY KEY REFERENCES winter_climate_document_import(logical_path),
  version INTEGER NOT NULL,
  kind TEXT NOT NULL,
  date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  administrative_basis TEXT NOT NULL,
  selection TEXT NOT NULL,
  metric TEXT NOT NULL
) STRICT;
CREATE TABLE winter_climate_document_application (
  logical_path TEXT PRIMARY KEY REFERENCES winter_climate_document_root(logical_path),
  surface TEXT NOT NULL,
  underground_source TEXT NOT NULL,
  resolution TEXT NOT NULL
) STRICT;
CREATE TABLE winter_climate_document_bound (
  logical_path TEXT NOT NULL REFERENCES winter_climate_document_application(logical_path),
  bound_name TEXT NOT NULL CHECK(bound_name IN ('intermediate_underground_c','deep_underground_c')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  celsius REAL NOT NULL,
  PRIMARY KEY(logical_path,bound_name,ordinal)
) STRICT;
CREATE TABLE winter_climate_document_record (
  logical_path TEXT NOT NULL REFERENCES winter_climate_document_root(logical_path),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  region_code_2021 TEXT NOT NULL,
  region_ko TEXT NOT NULL,
  region_en TEXT NOT NULL,
  station_id INTEGER NOT NULL,
  station_ko TEXT NOT NULL,
  date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  minimum_c REAL NOT NULL,
  maximum_c REAL NOT NULL,
  mean_c REAL NOT NULL,
  source_url TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  PRIMARY KEY(logical_path,ordinal)
) STRICT;
-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE winter_climate_document_key (
  logical_path TEXT NOT NULL REFERENCES winter_climate_document_root(logical_path),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path,ordinal),
  UNIQUE(logical_path,object_path,key)
) STRICT;
