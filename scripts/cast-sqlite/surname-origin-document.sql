-- Bounded original surname-origin document. Rows preserve source text; they do not approve names or publication.
CREATE TABLE surname_origin_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL,
  id TEXT NOT NULL,
  schema INTEGER NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL
) STRICT;

CREATE TABLE surname_origin_source (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES surname_origin_document(document_id),
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

CREATE TABLE surname_origin_source_key (
  source_ordinal INTEGER NOT NULL REFERENCES surname_origin_source(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (source_ordinal, ordinal),
  UNIQUE (source_ordinal, key)
) STRICT;

CREATE TABLE surname_origin_surname (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES surname_origin_document(document_id),
  id TEXT NOT NULL UNIQUE,
  hangul TEXT NOT NULL,
  hanja_present INTEGER NOT NULL CHECK (hanja_present IN (0, 1)),
  hanja TEXT,
  population_2015_present INTEGER NOT NULL CHECK (population_2015_present IN (0, 1)),
  population_2015 INTEGER,
  population_2000_present INTEGER NOT NULL CHECK (population_2000_present IN (0, 1)),
  population_2000 INTEGER,
  population_1985_present INTEGER NOT NULL CHECK (population_1985_present IN (0, 1)),
  population_1985 INTEGER,
  bongwan_unlisted_reason_present INTEGER NOT NULL CHECK (bongwan_unlisted_reason_present IN (0, 1)),
  bongwan_unlisted_reason TEXT,
  CHECK (hanja_present = 1),
  CHECK (population_2015_present = 1 OR population_2015 IS NULL),
  CHECK (population_2000_present = 1 OR population_2000 IS NULL),
  CHECK (population_1985_present = 1 OR population_1985 IS NULL),
  CHECK ((bongwan_unlisted_reason_present = 0 AND bongwan_unlisted_reason IS NULL) OR (bongwan_unlisted_reason_present = 1 AND bongwan_unlisted_reason IS NOT NULL))
) STRICT;

CREATE TABLE surname_origin_surname_key (
  surname_ordinal INTEGER NOT NULL REFERENCES surname_origin_surname(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (surname_ordinal, ordinal),
  UNIQUE (surname_ordinal, key)
) STRICT;

CREATE TABLE surname_origin_surname_source (
  surname_ordinal INTEGER NOT NULL REFERENCES surname_origin_surname(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  source_id TEXT NOT NULL,
  PRIMARY KEY (surname_ordinal, ordinal)
) STRICT;

CREATE TABLE surname_origin_bongwan (
  surname_ordinal INTEGER NOT NULL REFERENCES surname_origin_surname(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hanja_present INTEGER NOT NULL CHECK (hanja_present = 1),
  hanja TEXT,
  majority INTEGER NOT NULL CHECK (majority IN (0, 1)),
  PRIMARY KEY (surname_ordinal, ordinal)
) STRICT;

CREATE TABLE surname_origin_bongwan_key (
  surname_ordinal INTEGER NOT NULL,
  bongwan_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (surname_ordinal, bongwan_ordinal, ordinal),
  UNIQUE (surname_ordinal, bongwan_ordinal, key),
  FOREIGN KEY (surname_ordinal, bongwan_ordinal) REFERENCES surname_origin_bongwan(surname_ordinal, ordinal)
) STRICT;

CREATE TABLE surname_origin_bongwan_source (
  surname_ordinal INTEGER NOT NULL,
  bongwan_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  source_id TEXT NOT NULL,
  PRIMARY KEY (surname_ordinal, bongwan_ordinal, ordinal),
  FOREIGN KEY (surname_ordinal, bongwan_ordinal) REFERENCES surname_origin_bongwan(surname_ordinal, ordinal)
) STRICT;
