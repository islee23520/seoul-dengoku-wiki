-- Bounded preservation of population-2026-08.json, not geography admission.
CREATE TABLE population_import (
 id INTEGER PRIMARY KEY CHECK(id=1), source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL,
 actor TEXT NOT NULL CHECK(length(trim(actor))>0), reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE population_document (
 id INTEGER PRIMARY KEY REFERENCES population_import(id) CHECK(id=1),
 "schema" TEXT NOT NULL, baseline TEXT NOT NULL, projectionYear INTEGER NOT NULL, ratio REAL NOT NULL
) STRICT;
CREATE TABLE population_source (
 id INTEGER PRIMARY KEY REFERENCES population_document(id) CHECK(id=1),
 publisher TEXT NOT NULL, url TEXT NOT NULL, downloadUrl TEXT NOT NULL, downloadSha256 TEXT NOT NULL,
 downloadBytes INTEGER NOT NULL, statistic TEXT NOT NULL, definition TEXT NOT NULL,
 asOf TEXT NOT NULL, statisticsApproval TEXT NOT NULL, rights TEXT NOT NULL
) STRICT;
CREATE TABLE population_boundary (
 id INTEGER PRIMARY KEY REFERENCES population_document(id) CHECK(id=1),
 source TEXT NOT NULL, sha256 TEXT NOT NULL, effectiveDate TEXT NOT NULL, areaUnit TEXT NOT NULL, measurementCrs TEXT NOT NULL
) STRICT;
-- Only order metadata; domain values never live in this table.
CREATE TABLE population_key (
 document_id INTEGER NOT NULL REFERENCES population_document(id),
 object_name TEXT NOT NULL CHECK(object_name IN ('document','source','boundary')),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL,
 PRIMARY KEY(document_id,object_name,ordinal), UNIQUE(document_id,object_name,key)
) STRICT;
CREATE TABLE population_dong_density (
 document_id INTEGER NOT NULL REFERENCES population_document(id),
 dong_id TEXT NOT NULL CHECK(length(dong_id)=10 AND dong_id NOT GLOB '*[^0-9]*'),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0), density2126 REAL NOT NULL,
 PRIMARY KEY(document_id,dong_id), UNIQUE(document_id,ordinal)
) STRICT;
