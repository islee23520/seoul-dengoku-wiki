-- Bounded preservation of the two retired current territory shells.
-- Named typed columns and key-order rows only. The empty assignments and units lists have no child rows.
-- Loading these shells does not infer territory, restore a retired row, or grant publication approval.
CREATE TABLE retired_territory_documents_import (
  logical_path TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('control','island')),
  source_role TEXT NOT NULL CHECK(source_role='retired-current'),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64)
) STRICT;

CREATE TABLE retired_territory_documents_key (
  logical_path TEXT NOT NULL REFERENCES retired_territory_documents_import(logical_path),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(logical_path,object_path,ordinal),
  UNIQUE(logical_path,object_path,key)
) STRICT;

CREATE TABLE retired_territory_documents_control (
  logical_path TEXT PRIMARY KEY REFERENCES retired_territory_documents_import(logical_path),
  schema TEXT NOT NULL CHECK(schema='outside-control-2126.v3')
) STRICT;

CREATE TABLE retired_territory_documents_island (
  logical_path TEXT PRIMARY KEY REFERENCES retired_territory_documents_import(logical_path),
  schema TEXT NOT NULL CHECK(schema='outside-island-occupation.v1'),
  geometry_source TEXT NOT NULL CHECK(geometry_source='public/outside-admin-units.json'),
  geometry_source_sha256 TEXT NOT NULL CHECK(geometry_source_sha256='c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f')
) STRICT;
