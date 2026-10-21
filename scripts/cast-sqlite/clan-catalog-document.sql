-- Bounded original clan hangnyeol catalog. Rows preserve source text; they do not approve names, hangnyeol, or publication.
CREATE TABLE clan_catalog_document_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL,
  id TEXT NOT NULL,
  schema INTEGER NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL
) STRICT;

CREATE TABLE clan_catalog_document_source (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES clan_catalog_document_document(document_id),
  id TEXT NOT NULL UNIQUE,
  record_id_present INTEGER NOT NULL CHECK (record_id_present IN (0, 1)),
  record_id TEXT,
  url TEXT NOT NULL,
  accessed TEXT NOT NULL,
  quote TEXT NOT NULL,
  evidence TEXT NOT NULL,
  live_check TEXT NOT NULL,
  live_check_ref_present INTEGER NOT NULL CHECK (live_check_ref_present IN (0, 1)),
  live_check_ref TEXT,
  CHECK ((record_id_present = 0 AND record_id IS NULL) OR (record_id_present = 1 AND record_id IS NOT NULL)),
  CHECK ((live_check_ref_present = 0 AND live_check_ref IS NULL) OR (live_check_ref_present = 1 AND live_check_ref IS NOT NULL))
) STRICT;

CREATE TABLE clan_catalog_document_source_key (
  source_ordinal INTEGER NOT NULL REFERENCES clan_catalog_document_source(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (source_ordinal, ordinal),
  UNIQUE (source_ordinal, key)
) STRICT;

CREATE TABLE clan_catalog_document_clan (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES clan_catalog_document_document(document_id),
  id TEXT NOT NULL UNIQUE,
  surname TEXT NOT NULL,
  bongwan TEXT NOT NULL,
  bongwan_hanja_present INTEGER NOT NULL CHECK (bongwan_hanja_present IN (0, 1)),
  bongwan_hanja TEXT,
  surname_hanja_present INTEGER NOT NULL CHECK (surname_hanja_present IN (0, 1)),
  surname_hanja TEXT,
  branch_present INTEGER NOT NULL CHECK (branch_present IN (0, 1)),
  branch TEXT,
  provenance_present INTEGER NOT NULL CHECK (provenance_present IN (0, 1)),
  provenance TEXT,
  sources_present INTEGER NOT NULL CHECK (sources_present IN (0, 1)),
  rows_present INTEGER NOT NULL CHECK (rows_present IN (0, 1)),
  show_branches_present INTEGER NOT NULL CHECK (show_branches_present IN (0, 1)),
  show_branches INTEGER CHECK (show_branches IN (0, 1)),
  hangnyeol_unconfirmed_reason_present INTEGER NOT NULL CHECK (hangnyeol_unconfirmed_reason_present IN (0, 1)),
  hangnyeol_unconfirmed_reason TEXT,
  creative_rationale_present INTEGER NOT NULL CHECK (creative_rationale_present IN (0, 1)),
  creative_rationale TEXT,
  method_ref_present INTEGER NOT NULL CHECK (method_ref_present IN (0, 1)),
  method_ref TEXT,
  hangnyeol_present INTEGER NOT NULL CHECK (hangnyeol_present IN (0, 1)),
  hangnyeol TEXT,
  source_present INTEGER NOT NULL CHECK (source_present IN (0, 1)),
  source TEXT,
  branches_present INTEGER NOT NULL CHECK (branches_present IN (0, 1)),
  CHECK (bongwan_hanja_present = 1 OR bongwan_hanja IS NULL),
  CHECK ((surname_hanja_present = 0 AND surname_hanja IS NULL) OR (surname_hanja_present = 1 AND surname_hanja IS NOT NULL)),
  CHECK ((branch_present = 0 AND branch IS NULL) OR (branch_present = 1 AND branch IS NOT NULL)),
  CHECK ((provenance_present = 0 AND provenance IS NULL) OR (provenance_present = 1 AND provenance IS NOT NULL)),
  CHECK (sources_present IN (0, 1)),
  CHECK (rows_present IN (0, 1)),
  CHECK ((show_branches_present = 0 AND show_branches IS NULL) OR (show_branches_present = 1 AND show_branches IS NOT NULL)),
  CHECK ((hangnyeol_unconfirmed_reason_present = 0 AND hangnyeol_unconfirmed_reason IS NULL) OR (hangnyeol_unconfirmed_reason_present = 1 AND hangnyeol_unconfirmed_reason IS NOT NULL)),
  CHECK ((creative_rationale_present = 0 AND creative_rationale IS NULL) OR (creative_rationale_present = 1 AND creative_rationale IS NOT NULL)),
  CHECK ((method_ref_present = 0 AND method_ref IS NULL) OR (method_ref_present = 1 AND method_ref IS NOT NULL)),
  CHECK (hangnyeol_present = 1 OR hangnyeol IS NULL),
  CHECK ((source_present = 0 AND source IS NULL) OR (source_present = 1 AND source IS NOT NULL)),
  CHECK (branches_present IN (0, 1))
) STRICT;

CREATE TABLE clan_catalog_document_clan_key (
  clan_ordinal INTEGER NOT NULL REFERENCES clan_catalog_document_clan(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (clan_ordinal, ordinal),
  UNIQUE (clan_ordinal, key)
) STRICT;

CREATE TABLE clan_catalog_document_clan_source (
  clan_ordinal INTEGER NOT NULL REFERENCES clan_catalog_document_clan(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  source_id TEXT NOT NULL,
  PRIMARY KEY (clan_ordinal, ordinal)
) STRICT;

CREATE TABLE clan_catalog_document_row (
  clan_ordinal INTEGER NOT NULL REFERENCES clan_catalog_document_clan(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  sesu INTEGER NOT NULL,
  hangnyeol TEXT NOT NULL,
  hanja_present INTEGER NOT NULL CHECK (hanja_present = 1),
  hanja TEXT,
  position TEXT NOT NULL,
  PRIMARY KEY (clan_ordinal, ordinal)
) STRICT;

CREATE TABLE clan_catalog_document_row_key (
  clan_ordinal INTEGER NOT NULL,
  row_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (clan_ordinal, row_ordinal, ordinal),
  UNIQUE (clan_ordinal, row_ordinal, key),
  FOREIGN KEY (clan_ordinal, row_ordinal) REFERENCES clan_catalog_document_row(clan_ordinal, ordinal)
) STRICT;

CREATE TABLE clan_catalog_document_branch (
  clan_ordinal INTEGER NOT NULL REFERENCES clan_catalog_document_clan(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value_shape TEXT NOT NULL CHECK (value_shape = 'object'),
  PRIMARY KEY (clan_ordinal, ordinal)
) STRICT;

CREATE TABLE clan_catalog_document_branch_key (
  clan_ordinal INTEGER NOT NULL,
  branch_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (clan_ordinal, branch_ordinal, ordinal),
  UNIQUE (clan_ordinal, branch_ordinal, key),
  FOREIGN KEY (clan_ordinal, branch_ordinal) REFERENCES clan_catalog_document_branch(clan_ordinal, ordinal)
) STRICT;
