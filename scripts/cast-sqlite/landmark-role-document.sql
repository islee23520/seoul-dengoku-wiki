-- Bounded preservation of lore/places/landmark-roles.json.
-- Every new table is prefixed landmark_role_document_ so it cannot collide
-- with the canonical cast schema (family_role_decision*, household_*, …).
-- Values live only in named typed columns. landmark_role_document_key stores
-- authored object presence and key order, never a scalar value.
CREATE TABLE landmark_role_document_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0)
) STRICT;

CREATE TABLE landmark_role_document (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  schema TEXT NOT NULL,
  epoch TEXT NOT NULL,
  decision_source TEXT NOT NULL,
  geometry_attribution TEXT NOT NULL
) STRICT;

CREATE TABLE landmark_role_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;

CREATE TABLE landmark_role_document_site (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  region_id TEXT NOT NULL,
  holder_id TEXT NOT NULL,
  role TEXT NOT NULL,
  detail TEXT NOT NULL,
  fortification TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  coordinate_source TEXT NOT NULL,
  connection_station_id TEXT
) STRICT;
