-- Bounded preservation of lore/places/Station-Alias-Candidates.json.
-- Named typed columns and ordered child rows only. Key tables store object key order, never values.
-- Loading this document does not infer facts or grant publication approval.
CREATE TABLE station_alias_document_root (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  "schema" TEXT NOT NULL,
  status TEXT NOT NULL,
  issue TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64)
) STRICT;
CREATE TABLE station_alias_document_basis (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  basis TEXT NOT NULL
) STRICT;
CREATE TABLE station_alias_document_group (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  disposition TEXT NOT NULL,
  related_station TEXT,
  display_name TEXT,
  decision TEXT,
  reason TEXT
) STRICT;
CREATE TABLE station_alias_document_member (
  group_ordinal INTEGER NOT NULL REFERENCES station_alias_document_group(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  member TEXT NOT NULL,
  PRIMARY KEY(group_ordinal,ordinal)
) STRICT;
CREATE TABLE station_alias_document_alias (
  group_ordinal INTEGER NOT NULL REFERENCES station_alias_document_group(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  alias TEXT NOT NULL,
  PRIMARY KEY(group_ordinal,ordinal)
) STRICT;
CREATE TABLE station_alias_document_observation (
  group_ordinal INTEGER NOT NULL REFERENCES station_alias_document_group(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source_name TEXT NOT NULL,
  line TEXT NOT NULL,
  code TEXT NOT NULL,
  PRIMARY KEY(group_ordinal,ordinal)
) STRICT;
CREATE TABLE station_alias_document_neighbor_key (
  group_ordinal INTEGER NOT NULL REFERENCES station_alias_document_group(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  station_key TEXT NOT NULL,
  PRIMARY KEY(group_ordinal,ordinal),
  UNIQUE(group_ordinal,station_key)
) STRICT;
CREATE TABLE station_alias_document_neighbor (
  group_ordinal INTEGER NOT NULL,
  station_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  neighbor TEXT NOT NULL,
  PRIMARY KEY(group_ordinal,station_ordinal,ordinal),
  FOREIGN KEY(group_ordinal,station_ordinal) REFERENCES station_alias_document_neighbor_key(group_ordinal,ordinal)
) STRICT;
-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE station_alias_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  PRIMARY KEY(object_path,ordinal),
  UNIQUE(object_path,key)
) STRICT;
