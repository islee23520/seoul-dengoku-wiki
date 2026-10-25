-- Bounded preservation of lore/regions/sources/boundary-comparison.json.
-- Named typed columns only. Key rows store order, never values.
-- No source archive, generic EAV rows, or JSON value/document blobs.
-- Import stores the authored comparison. It infers nothing and approves nothing.

CREATE TABLE boundary_comparison_document_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  source_version TEXT NOT NULL,
  publication_commit TEXT NOT NULL CHECK (length(publication_commit) = 40),
  authority TEXT NOT NULL,
  crs_measurement TEXT NOT NULL,
  total_country_features INTEGER NOT NULL,
  seoul_features INTEGER NOT NULL,
  unique_adm_cd2 INTEGER NOT NULL,
  districts INTEGER NOT NULL,
  city_area_m2 TEXT NOT NULL,
  sum_area_m2 TEXT NOT NULL,
  overlap_excess_m2 TEXT NOT NULL,
  kostat_only_m2 TEXT NOT NULL,
  candidate_only_m2 TEXT NOT NULL,
  symmetric_difference_m2 TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE boundary_comparison_document_crs_source (
  document_id INTEGER PRIMARY KEY REFERENCES boundary_comparison_document_document(document_id) CHECK (document_id = 1),
  type TEXT NOT NULL,
  crs_name TEXT NOT NULL
) STRICT;

CREATE TABLE boundary_comparison_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;

CREATE TABLE boundary_comparison_document_string_item (
  list_name TEXT NOT NULL CHECK (list_name IN ('invalid_ids', 'empty_ids', 'graph_outside_candidate', 'seoul_names')),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (list_name, ordinal)
) STRICT;

CREATE TABLE boundary_comparison_document_bound (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0 AND ordinal < 4),
  value_text TEXT NOT NULL
) STRICT;

CREATE TABLE boundary_comparison_document_district (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  name TEXT NOT NULL UNIQUE,
  dong_count INTEGER NOT NULL,
  area_m2 TEXT NOT NULL
) STRICT;

CREATE TABLE boundary_comparison_document_mismatch (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  id TEXT NOT NULL UNIQUE,
  old_district TEXT NOT NULL
) STRICT;

CREATE TABLE boundary_comparison_document_mismatch_candidate (
  mismatch_ordinal INTEGER NOT NULL REFERENCES boundary_comparison_document_mismatch(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  district TEXT NOT NULL,
  PRIMARY KEY (mismatch_ordinal, ordinal)
) STRICT;
