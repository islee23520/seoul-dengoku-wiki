-- Typed preservation of snapshots/build-inputs/SeoulWorldGraph.json.
-- Named columns and ordered child relations only. No EAV, JSON tree, or byte archive.
-- Prefix world_graph_document_ so these tables can sit beside the canonical cast schema.
-- Stored review, owner, and decision text is evidence, not authorization to change facts.

CREATE TABLE world_graph_document_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64 AND source_sha256 NOT GLOB '*[^0-9a-f]*'),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64 AND document_sha256 NOT GLOB '*[^0-9a-f]*'),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0)
) STRICT;

CREATE TABLE world_graph_document_root (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  schema TEXT NOT NULL,
  district_count INTEGER NOT NULL CHECK (district_count >= 0),
  station_count INTEGER NOT NULL CHECK (station_count >= 0),
  edge_count INTEGER NOT NULL CHECK (edge_count >= 0),
  alias_count INTEGER NOT NULL CHECK (alias_count >= 0),
  source_original TEXT NOT NULL,
  rail_revision TEXT NOT NULL,
  rail_wiki_commit TEXT NOT NULL,
  rail_scope TEXT NOT NULL,
  rail_official_url TEXT NOT NULL,
  rail_official_retrieved_at TEXT NOT NULL,
  rail_official_sha256 TEXT NOT NULL,
  rail_official_scope TEXT NOT NULL,
  replacement_count INTEGER NOT NULL CHECK (replacement_count >= 0),
  excluded_count INTEGER NOT NULL CHECK (excluded_count >= 0),
  hub_count INTEGER NOT NULL CHECK (hub_count >= 0)
) STRICT;

CREATE TABLE world_graph_document_district (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  name TEXT NOT NULL
) STRICT;

CREATE TABLE world_graph_document_station (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  station_id TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  district TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  lat_text TEXT NOT NULL,
  lon_text TEXT NOT NULL
) STRICT;

CREATE TABLE world_graph_document_edge (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  endpoint_a TEXT NOT NULL,
  endpoint_b TEXT NOT NULL
) STRICT;

CREATE TABLE world_graph_document_alias (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  alias_key TEXT NOT NULL,
  alias_value TEXT NOT NULL
) STRICT;

CREATE TABLE world_graph_document_replacement (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  original_index INTEGER NOT NULL,
  original_a TEXT NOT NULL,
  original_b TEXT NOT NULL,
  status TEXT NOT NULL,
  line_id TEXT NOT NULL,
  physical_evidence_boundary TEXT NOT NULL,
  chain_count INTEGER NOT NULL CHECK (chain_count >= 0),
  official_code_count INTEGER NOT NULL CHECK (official_code_count >= 0),
  source_url TEXT NOT NULL,
  source_retrieved_at TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  source_scope TEXT NOT NULL
) STRICT;

CREATE TABLE world_graph_document_replacement_chain (
  replacement_ordinal INTEGER NOT NULL REFERENCES world_graph_document_replacement(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (replacement_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_replacement_code (
  replacement_ordinal INTEGER NOT NULL REFERENCES world_graph_document_replacement(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (replacement_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  original_index INTEGER NOT NULL,
  original_a TEXT NOT NULL,
  original_b TEXT NOT NULL,
  status TEXT NOT NULL,
  reason_presence TEXT NOT NULL CHECK (reason_presence IN ('missing', 'null', 'value')),
  reason TEXT,
  missing_presence TEXT NOT NULL CHECK (missing_presence IN ('missing', 'present')),
  missing_count INTEGER NOT NULL CHECK (missing_count >= 0),
  support_index INTEGER NOT NULL,
  support_a TEXT NOT NULL,
  support_b TEXT NOT NULL,
  support_mapped_a TEXT NOT NULL,
  support_mapped_b TEXT NOT NULL,
  support_classification TEXT NOT NULL,
  support_no_surface_adjacency_inference INTEGER NOT NULL CHECK (support_no_surface_adjacency_inference IN (0, 1)),
  adjacent_count INTEGER NOT NULL CHECK (adjacent_count >= 0),
  skipped_count INTEGER NOT NULL CHECK (skipped_count >= 0),
  opening_count INTEGER NOT NULL CHECK (opening_count >= 0),
  endpoint_count INTEGER NOT NULL CHECK (endpoint_count >= 0),
  evidence_ref_count INTEGER NOT NULL CHECK (evidence_ref_count >= 0),
  CHECK ((reason_presence = 'value' AND reason IS NOT NULL) OR (reason_presence IN ('missing', 'null') AND reason IS NULL)),
  CHECK ((missing_presence = 'present' AND missing_count >= 0) OR (missing_presence = 'missing' AND missing_count = 0))
) STRICT;

CREATE TABLE world_graph_document_excluded_missing (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_adjacent (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_opening (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_endpoint (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_evidence_ref (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  path TEXT NOT NULL,
  selector TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_skipped (
  excluded_ordinal INTEGER NOT NULL REFERENCES world_graph_document_excluded(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  path_index INTEGER NOT NULL,
  skipped_stops INTEGER NOT NULL,
  code_count INTEGER NOT NULL CHECK (code_count >= 0),
  station_id_count INTEGER NOT NULL CHECK (station_id_count >= 0),
  name_count INTEGER NOT NULL CHECK (name_count >= 0),
  PRIMARY KEY (excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_skipped_code (
  excluded_ordinal INTEGER NOT NULL,
  skipped_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, skipped_ordinal, ordinal),
  FOREIGN KEY (excluded_ordinal, skipped_ordinal) REFERENCES world_graph_document_excluded_skipped(excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_skipped_station (
  excluded_ordinal INTEGER NOT NULL,
  skipped_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, skipped_ordinal, ordinal),
  FOREIGN KEY (excluded_ordinal, skipped_ordinal) REFERENCES world_graph_document_excluded_skipped(excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_excluded_skipped_name (
  excluded_ordinal INTEGER NOT NULL,
  skipped_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (excluded_ordinal, skipped_ordinal, ordinal),
  FOREIGN KEY (excluded_ordinal, skipped_ordinal) REFERENCES world_graph_document_excluded_skipped(excluded_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_hub (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  uid TEXT NOT NULL,
  contract TEXT NOT NULL,
  official_code_count INTEGER NOT NULL CHECK (official_code_count >= 0),
  permanent_id_count INTEGER NOT NULL CHECK (permanent_id_count >= 0),
  line_id_count INTEGER NOT NULL CHECK (line_id_count >= 0),
  evidence_count INTEGER NOT NULL CHECK (evidence_count >= 0)
) STRICT;

CREATE TABLE world_graph_document_hub_official_code (
  hub_ordinal INTEGER NOT NULL REFERENCES world_graph_document_hub(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (hub_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_hub_permanent_id (
  hub_ordinal INTEGER NOT NULL REFERENCES world_graph_document_hub(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (hub_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_hub_line_id (
  hub_ordinal INTEGER NOT NULL REFERENCES world_graph_document_hub(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (hub_ordinal, ordinal)
) STRICT;

CREATE TABLE world_graph_document_hub_evidence (
  hub_ordinal INTEGER NOT NULL REFERENCES world_graph_document_hub(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  code TEXT NOT NULL,
  uid TEXT NOT NULL,
  name TEXT NOT NULL,
  path_index INTEGER NOT NULL,
  station_index INTEGER NOT NULL,
  PRIMARY KEY (hub_ordinal, ordinal)
) STRICT;
