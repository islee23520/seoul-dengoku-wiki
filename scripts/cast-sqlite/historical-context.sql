CREATE TABLE historical_source_scope (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  logical_path TEXT NOT NULL UNIQUE,
  source_schema TEXT NOT NULL,
  classification TEXT NOT NULL CHECK(classification IN ('superseded_pre_seoul_rebase','superseded_outside_seoul','inspection_only_no_person_right')),
  record_count INTEGER NOT NULL CHECK(record_count>=0),
  person_link_count INTEGER NOT NULL CHECK(person_link_count>=0 AND person_link_count<=record_count),
  json_pointer TEXT NOT NULL CHECK(json_pointer=''),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_title (
  title_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  holder_person_id TEXT NOT NULL REFERENCES person(person_id),
  polity_id TEXT NOT NULL,
  parent_title_id TEXT,
  current_validity TEXT NOT NULL CHECK(current_validity='superseded_pre_seoul_rebase'),
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_jurisdiction (
  title_id TEXT NOT NULL REFERENCES historical_feudal_title(title_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  admin_unit_id TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(title_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_grant (
  grant_id TEXT PRIMARY KEY,
  name_ko TEXT NOT NULL,
  name_en TEXT,
  holder_person_id TEXT NOT NULL REFERENCES person(person_id),
  liege_person_id TEXT REFERENCES person(person_id),
  polity_id TEXT NOT NULL,
  title_id TEXT NOT NULL REFERENCES historical_feudal_title(title_id),
  geometry_source TEXT,
  territorial_scale TEXT,
  formal_title_rank TEXT,
  current_validity TEXT NOT NULL CHECK(current_validity='superseded_pre_seoul_rebase'),
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_grant_admin (
  grant_id TEXT NOT NULL REFERENCES historical_feudal_grant(grant_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  admin_unit_id TEXT NOT NULL,
  admin_unit_name TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(grant_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_grant_component (
  grant_id TEXT NOT NULL REFERENCES historical_feudal_grant(grant_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  admin_unit_id TEXT NOT NULL,
  component_index INTEGER NOT NULL CHECK(component_index>=0),
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(grant_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_feudal_binding (
  holding_id TEXT PRIMARY KEY,
  title_id TEXT NOT NULL REFERENCES historical_feudal_title(title_id),
  liege_relationship_kind TEXT,
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE historical_outside_person_control (
  admin_unit_id TEXT PRIMARY KEY,
  holder_person_id TEXT NOT NULL REFERENCES person(person_id),
  liege_person_id TEXT REFERENCES person(person_id),
  authority_kind TEXT,
  authority_state_id TEXT,
  authority_name TEXT,
  current_validity TEXT NOT NULL CHECK(current_validity='superseded_outside_seoul'),
  source_id INTEGER NOT NULL REFERENCES historical_source_scope(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE INDEX historical_feudal_title_holder_idx ON historical_feudal_title(holder_person_id);
CREATE INDEX historical_feudal_grant_holder_idx ON historical_feudal_grant(holder_person_id);
CREATE INDEX historical_feudal_grant_liege_idx ON historical_feudal_grant(liege_person_id);
CREATE INDEX historical_outside_holder_idx ON historical_outside_person_control(holder_person_id);
