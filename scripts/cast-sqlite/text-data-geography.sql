-- Apply after text_document. Territorial rows preserve source contracts, not current rights.
CREATE TABLE text_affiliation (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  CHECK(json_pointer='/data/currentAffiliation'),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_affiliation_hegemon (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT NOT NULL CHECK(kind IN ('state','union')),
  state_id TEXT REFERENCES state(state_id),
  name TEXT NOT NULL,
  ai_position TEXT NOT NULL,
  color TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  CHECK((kind='state' AND state_id IS NOT NULL) OR (kind='union' AND state_id IS NULL)),
  FOREIGN KEY(source_id) REFERENCES text_affiliation(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_affiliation_member (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  hegemon_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  state_id TEXT NOT NULL REFERENCES state(state_id),
  UNIQUE(source_id,hegemon_ordinal,ordinal),
  FOREIGN KEY(source_id,hegemon_ordinal) REFERENCES text_affiliation_hegemon(source_id,ordinal),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_affiliation_state (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  state_id TEXT NOT NULL REFERENCES state(state_id),
  current_name TEXT NOT NULL,
  base_kind TEXT NOT NULL CHECK(base_kind IN ('station','facility')),
  station_id TEXT,
  landmark_id TEXT,
  base_name TEXT NOT NULL,
  exclusive_districts TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,state_id),
  CHECK((base_kind='station' AND station_id IS NOT NULL AND landmark_id IS NULL) OR (base_kind='facility' AND landmark_id IS NOT NULL AND station_id IS NULL)),
  FOREIGN KEY(source_id) REFERENCES text_affiliation(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_affiliation_neutral (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  state_id TEXT NOT NULL REFERENCES state(state_id),
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_affiliation(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_governance (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  text TEXT NOT NULL,
  CHECK(json_pointer='/data/governance'),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  schema TEXT NOT NULL,
  scale_implies_personal_ownership INTEGER NOT NULL CHECK(scale_implies_personal_ownership IN (0,1)),
  scale_implies_title_rank INTEGER NOT NULL CHECK(scale_implies_title_rank IN (0,1)),
  major_polities INTEGER NOT NULL CHECK(major_polities>=0),
  whole_kingdom_controlled_by_one_polity INTEGER NOT NULL CHECK(whole_kingdom_controlled_by_one_polity IN (0,1)),
  CHECK(json_pointer='/data/territorialScale'),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_regular (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  district TEXT NOT NULL,
  direct_municipal_eup_myeon_dong TEXT NOT NULL,
  eup_myeon_dong_within_gu TEXT NOT NULL,
  component_implies_lower_title INTEGER NOT NULL CHECK(component_implies_lower_title IN (0,1)),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_province (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  province_code TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial_regular(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_special_city (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  dong TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_kingdom_container (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_sejong (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  geographic_container_id TEXT NOT NULL,
  city TEXT NOT NULL,
  direct_eup_myeon_dong TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_sejong_alias (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  alias TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial_sejong(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_station_catalog (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  CHECK(json_pointer='/data/station_aliases'),
  PRIMARY KEY(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_station (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  station_id TEXT NOT NULL,
  source TEXT NOT NULL,
  has_service_lines INTEGER NOT NULL CHECK(has_service_lines IN (0,1)),
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,station_id),
  FOREIGN KEY(source_id) REFERENCES text_station_catalog(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_station_alias (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  station_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  alias TEXT NOT NULL,
  UNIQUE(source_id,station_ordinal,ordinal),
  FOREIGN KEY(source_id,station_ordinal) REFERENCES text_station(source_id,ordinal),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_station_line_name (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  station_ordinal INTEGER NOT NULL,
  line_kind TEXT NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  name TEXT NOT NULL,
  UNIQUE(source_id,station_ordinal,line_kind,ordinal),
  UNIQUE(source_id,station_ordinal,line_kind,name),
  FOREIGN KEY(source_id,station_ordinal) REFERENCES text_station(source_id,ordinal),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_station_line (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  station_ordinal INTEGER NOT NULL,
  line_kind TEXT NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  name_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  line TEXT NOT NULL,
  UNIQUE(source_id,station_ordinal,line_kind,name_ordinal,ordinal),
  FOREIGN KEY(source_id,station_ordinal,line_kind,name_ordinal) REFERENCES text_station_line_name(source_id,station_ordinal,line_kind,ordinal),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
