-- Bounded original candidate roster. Named typed columns and ordered child rows only.
-- Key rows store object key order, never values. Counts stay exact integer spellings.
-- Loading this document does not issue people, activate mechanics, infer facts, or approve content.
CREATE TABLE candidate_roster_document_root (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  seed INTEGER NOT NULL,
  n INTEGER NOT NULL,
  parquet TEXT NOT NULL,
  hangnyeol_on INTEGER NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE candidate_roster_document_provenance (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES candidate_roster_document_root(document_id),
  dataset TEXT NOT NULL,
  dataset_url TEXT NOT NULL,
  local_path_note TEXT NOT NULL,
  license TEXT NOT NULL,
  revision TEXT NOT NULL,
  row_identity TEXT NOT NULL,
  transformation TEXT NOT NULL,
  status TEXT NOT NULL
) STRICT;

CREATE TABLE candidate_roster_document_state_count (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES candidate_roster_document_root(document_id),
  state_key TEXT NOT NULL UNIQUE,
  count_integer INTEGER NOT NULL
) STRICT;

CREATE TABLE candidate_roster_document_livelihood_count (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES candidate_roster_document_root(document_id),
  livelihood_key TEXT NOT NULL UNIQUE,
  count_integer INTEGER NOT NULL
) STRICT;

CREATE TABLE candidate_roster_document_person (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES candidate_roster_document_root(document_id),
  id TEXT NOT NULL UNIQUE,
  source_uuid TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  given_name TEXT NOT NULL,
  bongwan_present INTEGER NOT NULL CHECK (bongwan_present = 1),
  bongwan TEXT,
  hangnyeol_present INTEGER NOT NULL CHECK (hangnyeol_present = 1),
  hangnyeol TEXT,
  sex TEXT NOT NULL,
  age INTEGER NOT NULL,
  origin_community TEXT NOT NULL,
  language TEXT NOT NULL,
  livelihood TEXT NOT NULL,
  affiliation TEXT NOT NULL,
  post TEXT NOT NULL,
  conscription_history TEXT NOT NULL,
  armament_access TEXT NOT NULL,
  culture_key TEXT NOT NULL,
  corridor_present INTEGER NOT NULL CHECK (corridor_present = 1),
  corridor TEXT,
  personality TEXT NOT NULL,
  personal_ambition TEXT NOT NULL,
  fear TEXT NOT NULL,
  negotiation_method TEXT NOT NULL,
  core_relation TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  occupation_src TEXT NOT NULL,
  military_src TEXT NOT NULL,
  CHECK (bongwan IS NULL OR length(bongwan) > 0),
  CHECK (hangnyeol IS NULL OR length(hangnyeol) > 0),
  CHECK (corridor IS NULL)
) STRICT;

-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE candidate_roster_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;
