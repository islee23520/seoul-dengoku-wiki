-- Generator metadata values live only in these named domain tables.
CREATE TABLE catalog_metadata_document (
  logical_path TEXT PRIMARY KEY CHECK(logical_path IN ('scripts/category-registry.json','scripts/official-seoul-lines.json','data/update-history.json')),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 NOT GLOB '*[^0-9a-f]*'),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64 AND document_sha256 NOT GLOB '*[^0-9a-f]*'),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64)
) STRICT;
CREATE TABLE catalog_category (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  id TEXT NOT NULL UNIQUE CHECK(length(id)>0),
  label TEXT NOT NULL CHECK(length(label)>0),
  summary TEXT NOT NULL
) STRICT;
CREATE TABLE catalog_category_required_kind (
  category_ordinal INTEGER NOT NULL REFERENCES catalog_category(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT NOT NULL CHECK(kind IN ('heading','paragraph','list','table')),
  PRIMARY KEY(category_ordinal,ordinal)
) STRICT;
CREATE TABLE catalog_official_line_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema TEXT NOT NULL CHECK(schema='seoul-official-line-style.v1'),
  source TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  note TEXT NOT NULL
) STRICT;
CREATE TABLE catalog_official_line (
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  id TEXT PRIMARY KEY CHECK(length(id)>0),
  name TEXT NOT NULL,
  color TEXT NOT NULL CHECK(length(color)=7 AND substr(color,1,1)='#' AND substr(color,2) NOT GLOB '*[^0-9a-fA-F]*')
) STRICT;
CREATE TABLE catalog_official_station (
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  name TEXT PRIMARY KEY CHECK(length(name)>0)
) STRICT;
CREATE TABLE catalog_official_station_line (
  station_name TEXT NOT NULL REFERENCES catalog_official_station(name),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  line_id TEXT NOT NULL REFERENCES catalog_official_line(id),
  PRIMARY KEY(station_name,ordinal)
) STRICT;
CREATE TABLE catalog_update_history (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema TEXT NOT NULL CHECK(schema='seoul-wiki-update-history.v1')
) STRICT;
CREATE TABLE catalog_update (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  date TEXT NOT NULL CHECK(length(date)=10 AND date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sequence INTEGER NOT NULL CHECK(sequence>0),
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  route TEXT NOT NULL
) STRICT;
-- Structural metadata only: no scalar values, blobs, or JSON tree nodes.
CREATE TABLE catalog_metadata_key (
  logical_path TEXT NOT NULL REFERENCES catalog_metadata_document(logical_path),
  object_kind TEXT NOT NULL CHECK(object_kind IN ('root','category','line','update')),
  owner_ordinal INTEGER NOT NULL CHECK(owner_ordinal>=0),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  PRIMARY KEY(logical_path,object_kind,owner_ordinal,ordinal),
  UNIQUE(logical_path,object_kind,owner_ordinal,key)
) STRICT;
