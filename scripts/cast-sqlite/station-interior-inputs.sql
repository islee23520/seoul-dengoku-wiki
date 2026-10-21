CREATE TABLE station_interior_input_import (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  logical_path TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  document_sha256 TEXT NOT NULL,
  domain_sha256 TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE station_interior_input_document (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema TEXT NOT NULL, as_of TEXT NOT NULL, count INTEGER NOT NULL
) STRICT;
CREATE TABLE station_interior_input_station (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  name TEXT, name_en TEXT, district TEXT, lat REAL, lon REAL, network TEXT,
  observed_levels_source TEXT, epoch TEXT, collapse_plus_years INTEGER,
  river TEXT, uncertainty TEXT, facilityKind TEXT
) STRICT;
CREATE TABLE station_interior_input_observation (
  station_ordinal INTEGER PRIMARY KEY REFERENCES station_interior_input_station(ordinal),
  above INTEGER, below INTEGER, source TEXT, source_url TEXT, license TEXT,
  structure TEXT, osm_id TEXT
) STRICT;
CREATE TABLE station_interior_input_line (
  station_ordinal INTEGER NOT NULL REFERENCES station_interior_input_observation(station_ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  line TEXT, form TEXT, code TEXT, above INTEGER, below INTEGER, area TEXT, year TEXT,
  PRIMARY KEY(station_ordinal,ordinal)
) STRICT;
CREATE TABLE station_interior_input_layer (
  station_ordinal INTEGER NOT NULL REFERENCES station_interior_input_station(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  id TEXT, wiki_layer TEXT, state TEXT, contents TEXT, condition TEXT,
  PRIMARY KEY(station_ordinal,ordinal)
) STRICT;
CREATE TABLE station_interior_input_slot (
  station_ordinal INTEGER NOT NULL REFERENCES station_interior_input_station(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT, "where" TEXT, note TEXT,
  PRIMARY KEY(station_ordinal,ordinal)
) STRICT;
CREATE TABLE station_interior_input_candidate (
  station_ordinal INTEGER NOT NULL REFERENCES station_interior_input_station(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  observed_levels_source TEXT, sourceObjectId TEXT, subject TEXT,
  bindingStatus TEXT, stationObjectId TEXT,
  above INTEGER, below INTEGER, source TEXT, source_url TEXT, license TEXT,
  PRIMARY KEY(station_ordinal,ordinal)
) STRICT;
-- Presence and source key order only: no domain values or serialized objects.
CREATE TABLE station_interior_input_key (
  object_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL, is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(object_path,ordinal), UNIQUE(object_path,key)
) STRICT;
