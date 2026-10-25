-- Migration evidence is immutable and is never a runtime read authority.
CREATE TABLE atlas_identity_archive (
  kind TEXT PRIMARY KEY CHECK(kind IN ('registry','candidates','values','gurps')),
  logical_path TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  bytes BLOB NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL
) STRICT;
CREATE TABLE atlas_identity_binding (
  kind TEXT PRIMARY KEY REFERENCES atlas_identity_archive(kind),
  source_id INTEGER UNIQUE REFERENCES source_file(source_id), sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE atlas_identity_registry_person (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), person_id TEXT NOT NULL UNIQUE REFERENCES person(person_id),
  has_aliases INTEGER NOT NULL CHECK(has_aliases IN (0,1))
) STRICT;
CREATE TABLE atlas_identity_route (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), person_id TEXT NOT NULL UNIQUE REFERENCES person(person_id)
) STRICT;
CREATE TABLE atlas_identity_values_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema_name TEXT NOT NULL,
  note TEXT NOT NULL, person_count INTEGER NOT NULL CHECK(person_count=1022)
) STRICT;
CREATE TABLE atlas_identity_candidate_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema_name TEXT NOT NULL,
  input_sha256 TEXT NOT NULL, base_commit TEXT NOT NULL,
  total_people INTEGER NOT NULL, existing_k_count INTEGER NOT NULL, candidate_count INTEGER NOT NULL,
  note_count INTEGER NOT NULL
) STRICT;
CREATE TABLE atlas_identity_existing_k (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), id TEXT NOT NULL UNIQUE, name TEXT NOT NULL
) STRICT;
CREATE TABLE atlas_identity_candidate (
  position INTEGER PRIMARY KEY CHECK(position>=0), ordinal INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE, stage TEXT NOT NULL, state TEXT NOT NULL,
  title TEXT NOT NULL, locked INTEGER NOT NULL CHECK(locked IN (0,1))
) STRICT;
CREATE TABLE atlas_identity_note (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0), type TEXT NOT NULL, name TEXT NOT NULL, detail TEXT NOT NULL
) STRICT;
CREATE TABLE atlas_identity_seal (singleton INTEGER PRIMARY KEY CHECK(singleton=1)) STRICT;
