-- Source preservation only: no admission, geography filtering, or inferred approval.
CREATE TABLE rail_source_import (
 logical_path TEXT PRIMARY KEY, source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL,
 actor TEXT NOT NULL CHECK(length(trim(actor))>0), reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE rail_source_key (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path), object_path TEXT NOT NULL,
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL, is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
 PRIMARY KEY(logical_path,object_path,ordinal), UNIQUE(logical_path,object_path,key)
) STRICT;

CREATE TABLE rail_source_corrections_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 "officialSource" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_correction (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "name" TEXT,
 "stationCode" TEXT,
 "removedNamesakeCode" TEXT,
 "identitySource" TEXT,
 "east" INTEGER,
 "north" INTEGER,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_correction_line (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "line_id" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_identities_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 "sourceUrl" TEXT,
 "sourceSha256" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_identity_group (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "name" TEXT,
 "uid" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_identity_member (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "east" INTEGER,
 "north" INTEGER,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_identity_line (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "line_id" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_bindings_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 "sourceUrl" TEXT,
 "sourceSha256" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_binding (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "stationCode" TEXT,
 "interchangeUid" TEXT,
 "officialName" TEXT,
 "lineId" TEXT,
 "observedName" TEXT,
 "identitySource" TEXT,
 "identityBasis" TEXT,
 "coordinateSource" TEXT,
 "osmId" TEXT,
 "sharedWikidata" TEXT,
 "coordinateCheckUrl" TEXT,
 "east" INTEGER,
 "north" INTEGER,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_unresolved (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_adjacency_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_adjacency_source (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "url" TEXT,
 "retrievedAt" TEXT,
 "sha256" TEXT,
 "scope" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_station_codes (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_station_code (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "station_code" TEXT,
 "station_id" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_regular_line (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "id" TEXT,
 "name" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_regular_path (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_regular_stop (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "code" TEXT,
 "uid" TEXT,
 "name" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_control_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 "baseline" TEXT,
 "description" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_control_override (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "id" TEXT,
 "stationId" TEXT,
 "status" TEXT,
 "primary" TEXT,
 "decision" TEXT,
 "regionalAuthority" TEXT,
 "stationManager" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_control_polity (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "polity_id" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_passage_decision (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "segmentId" TEXT,
 "passage2126" TEXT,
 "decision" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_retired_passage_decision (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "segmentId" TEXT,
 "passage2126" TEXT,
 "decision" TEXT,
 "retirement" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_connected_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_connected_source (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "url" TEXT,
 "sha256" TEXT,
 "license" TEXT,
 "scope" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_connected_station (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "osmId" TEXT,
 "nameKo" TEXT,
 "nameEn" TEXT,
 "mode" TEXT,
 "lat" REAL,
 "lon" REAL,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_gtx_document (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "schema" TEXT,
 "asOf" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_gtx_project (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "id" TEXT,
 "status" TEXT,
 "sourceUrl" TEXT,
 "routeSourceUrl" TEXT,
 "statusAsOf" TEXT,
 "endpointKind" TEXT,
 "geometryKind" TEXT,
 "diagramUrl" TEXT,
 "statusSourceUrl" TEXT,
 "sourceUpdatedAt" TEXT,
 "sourceYear" INTEGER,
 "stationLocationsFinal" INTEGER CHECK("stationLocationsFinal" IN (0,1)),
 "surveyedTrackGeometry" INTEGER CHECK("surveyedTrackGeometry" IN (0,1)),
 "opening2126Control" TEXT CHECK("opening2126Control" IS NULL),
 "opening2126Passage" TEXT CHECK("opening2126Passage" IS NULL),
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_gtx_path (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;

CREATE TABLE rail_source_gtx_station (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "station_name" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;
CREATE TABLE rail_source_gtx_pending_station (
 logical_path TEXT NOT NULL REFERENCES rail_source_import(logical_path),
 object_path TEXT NOT NULL, parent_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 "station_name" TEXT,
 PRIMARY KEY(logical_path,object_path), UNIQUE(logical_path,parent_path,ordinal)
) STRICT;
