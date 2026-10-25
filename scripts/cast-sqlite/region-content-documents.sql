-- Bounded source normalization; storage is not publication or owner approval.
CREATE TABLE region_content_import (
  logical_path TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;

CREATE TABLE region_content_key (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(logical_path,object_path,ordinal),
  UNIQUE(logical_path,object_path,key)
) STRICT;

CREATE TABLE region_content_document (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  schema TEXT,
  district_id TEXT,
  district_name TEXT,
  as_of TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE region_content_region (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  region_id TEXT,
  name TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_document(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_content (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source_kind TEXT,
  fictional_epoch TEXT,
  title TEXT,
  summary TEXT,
  livelihood TEXT,
  opening_state TEXT,
  connections TEXT,
  uncertainty TEXT,
  core_station INTEGER CHECK(core_station IN (0,1)),
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_region(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_production (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_hazard (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT,
  description TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_action (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  id TEXT,
  label TEXT,
  target_ref TEXT,
  tradeoff TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_cost (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  resource TEXT,
  amount REAL,
  unit TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_action(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_outcome (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT,
  effect TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_action(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_building (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  anchor_ref TEXT,
  name TEXT,
  observed_use TEXT,
  river TEXT,
  opening_use TEXT,
  how TEXT,
  role TEXT,
  observed_levels_source TEXT,
  observed_levels REAL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_floor (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  level_number REAL,
  level_text TEXT,
  label TEXT,
  state TEXT,
  contents TEXT,
  condition TEXT,
  CHECK(level_number IS NULL OR level_text IS NULL),
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_building(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_territory (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  status TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_holder (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  polity TEXT,
  control REAL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_territory(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_authority (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT,
  name TEXT,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_territory(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_anchor_ref (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_canon_ref (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_polity_context (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_inhabitant (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_shortage (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_content(logical_path,object_path)
) STRICT;

CREATE TABLE region_content_output (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_production(logical_path,object_path)
) STRICT;
CREATE TABLE region_content_requirement (
  logical_path TEXT NOT NULL REFERENCES region_content_import(logical_path),
  object_path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  value TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_path),
  UNIQUE(logical_path,parent_path,ordinal),
  FOREIGN KEY(logical_path,parent_path) REFERENCES region_content_production(logical_path,object_path)
) STRICT;
