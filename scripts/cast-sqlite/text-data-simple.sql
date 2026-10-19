CREATE TABLE text_ailments_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/symptom'),
  symptom TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_culture_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/transmission'),
  transmission TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_economy_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/exchange'),
  exchange TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_goods_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/supply'),
  supply TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_offices_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/tier'),
  tier TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_overview_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/consequence'),
  consequence TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_people_and_machines_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/dependency'),
  dependency TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_places_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/layer'),
  layer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_regions_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/opening_state'),
  opening_state TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_structures_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/function'),
  function TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_technology_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/constraint'),
  constraint_text TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_simple_collection (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  collection TEXT NOT NULL CHECK(collection IN ('primary_detail_names','sequence','entries')),
  PRIMARY KEY(source_id,collection),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_primary_detail (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  person_id TEXT NOT NULL REFERENCES person(person_id),
  name TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_chronology_event (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  event_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  anchor TEXT NOT NULL,
  authored_order INTEGER NOT NULL,
  date_status TEXT NOT NULL,
  date_value TEXT,
  date_reason TEXT,
  PRIMARY KEY(source_id,event_id),
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_name_pool_example_entry (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  entry TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
