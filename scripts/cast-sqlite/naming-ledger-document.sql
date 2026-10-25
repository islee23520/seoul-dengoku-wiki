-- Bounded typed preservation of lore/editorial/Naming-Ledger.json.
-- Historical, rights, status, and approval metadata stay stored data. This grants no approval and activates nothing.
CREATE TABLE naming_ledger_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 NOT GLOB '*[^0-9a-f]*'),
  version INTEGER NOT NULL CHECK(version=1),
  branch_name TEXT NOT NULL,
  branch_formal_name TEXT CHECK(branch_formal_name IS NULL),
  branch_source TEXT NOT NULL,
  branch_rights_status TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64 AND receipt_sha256 NOT GLOB '*[^0-9a-f]*')
) STRICT;
CREATE TABLE naming_ledger_document_state (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE
) STRICT;
CREATE TABLE naming_ledger_document_state_source (
  state_ordinal INTEGER NOT NULL REFERENCES naming_ledger_document_state(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source TEXT NOT NULL,
  PRIMARY KEY(state_ordinal, ordinal)
) STRICT;
CREATE TABLE naming_ledger_document_school (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  formal_name TEXT NOT NULL UNIQUE,
  hanja TEXT NOT NULL,
  alias TEXT CHECK(alias IS NULL),
  source TEXT NOT NULL
) STRICT;
CREATE TABLE naming_ledger_document_office (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  state TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL
) STRICT;
CREATE TABLE naming_ledger_document_office_tier (
  office_ordinal INTEGER NOT NULL REFERENCES naming_ledger_document_office(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  tier TEXT NOT NULL,
  PRIMARY KEY(office_ordinal, ordinal)
) STRICT;
CREATE TABLE naming_ledger_document_series (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  form TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL
) STRICT;
CREATE TABLE naming_ledger_document_retired_form (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  form TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  rights_status TEXT NOT NULL
) STRICT;
CREATE TABLE naming_ledger_document_retired_except (
  form_ordinal INTEGER NOT NULL REFERENCES naming_ledger_document_retired_form(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source TEXT NOT NULL,
  PRIMARY KEY(form_ordinal, ordinal)
) STRICT;
