-- Bounded hangnyeol systems document. Rows preserve the authored source; they approve nothing.
CREATE TABLE hangnyeol_systems_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  id TEXT NOT NULL,
  schema INTEGER NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64)
) STRICT;
CREATE TABLE hangnyeol_systems_source (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  document_id INTEGER NOT NULL REFERENCES hangnyeol_systems_document(document_id),
  id TEXT NOT NULL UNIQUE,
  record_id_present INTEGER NOT NULL CHECK(record_id_present IN (0,1)),
  record_id TEXT,
  url TEXT NOT NULL,
  accessed TEXT NOT NULL,
  quote TEXT NOT NULL,
  evidence TEXT NOT NULL,
  live_check TEXT NOT NULL,
  live_check_ref_present INTEGER NOT NULL CHECK(live_check_ref_present IN (0,1)),
  live_check_ref TEXT,
  unchecked_reason_present INTEGER NOT NULL CHECK(unchecked_reason_present IN (0,1)),
  unchecked_reason TEXT,
  CHECK(record_id_present=1 OR record_id IS NULL),
  CHECK(live_check_ref_present=1 OR live_check_ref IS NULL),
  CHECK(unchecked_reason_present=1 OR unchecked_reason IS NULL)
) STRICT;
CREATE TABLE hangnyeol_systems_system (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  document_id INTEGER NOT NULL REFERENCES hangnyeol_systems_document(document_id),
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  sequence_present INTEGER NOT NULL CHECK(sequence_present IN (0,1)),
  carrier_present INTEGER NOT NULL CHECK(carrier_present IN (0,1)),
  carrier TEXT,
  positions_present INTEGER NOT NULL CHECK(positions_present IN (0,1)),
  CHECK(sequence_present=1 OR carrier_present=0),
  CHECK(carrier_present=1 OR carrier IS NULL)
) STRICT;
CREATE TABLE hangnyeol_systems_sequence (
  system_ordinal INTEGER NOT NULL REFERENCES hangnyeol_systems_system(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  token TEXT NOT NULL,
  PRIMARY KEY(system_ordinal,ordinal)
) STRICT;
CREATE TABLE hangnyeol_systems_position (
  system_ordinal INTEGER NOT NULL REFERENCES hangnyeol_systems_system(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  position TEXT NOT NULL,
  PRIMARY KEY(system_ordinal,ordinal)
) STRICT;
CREATE TABLE hangnyeol_systems_system_source (
  system_ordinal INTEGER NOT NULL REFERENCES hangnyeol_systems_system(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source_id TEXT NOT NULL REFERENCES hangnyeol_systems_source(id),
  PRIMARY KEY(system_ordinal,ordinal)
) STRICT;
