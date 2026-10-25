CREATE TABLE relation_input_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  sha256 TEXT NOT NULL,
  config_digest TEXT NOT NULL,
  schema_name TEXT NOT NULL,
  note TEXT NOT NULL,
  owner_note TEXT NOT NULL,
  membership_schema TEXT NOT NULL,
  membership_year INTEGER NOT NULL,
  membership_note TEXT NOT NULL
) STRICT;
CREATE TABLE relation_input_provisional_person (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  person_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_anchor TEXT NOT NULL
) STRICT;
