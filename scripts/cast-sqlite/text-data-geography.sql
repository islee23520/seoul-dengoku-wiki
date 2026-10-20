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
  center_region TEXT NOT NULL,
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
  scope TEXT NOT NULL,
  geographic_empire_id TEXT NOT NULL,
  scale_implies_personal_ownership INTEGER NOT NULL CHECK(scale_implies_personal_ownership IN (0,1)),
  scale_implies_title_rank INTEGER NOT NULL CHECK(scale_implies_title_rank IN (0,1)),
  scale_implies_facility_access INTEGER NOT NULL CHECK(scale_implies_facility_access IN (0,1)),
  slot_existence_implies_grant INTEGER NOT NULL CHECK(slot_existence_implies_grant IN (0,1)),
  CHECK(schema='territorial-scale.v2'), CHECK(scope='seoul-only'),
  CHECK(json_pointer='/data/territorialScale'),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_source (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  schema TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_rank (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  rank TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_level (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  level TEXT NOT NULL,
  source_pointer TEXT,
  rank TEXT,
  count INTEGER CHECK(count>=0),
  partition_sha256 TEXT,
  representation TEXT,
  id_field TEXT,
  parent_field TEXT,
  UNIQUE(source_id,level), CHECK(level IN ('empire','kingdom','duchy','county','barony')), CHECK((level='barony' AND source_pointer IS NULL AND rank IS NULL AND count IS NULL AND partition_sha256 IS NULL AND representation IS NOT NULL AND id_field IS NOT NULL AND parent_field IS NOT NULL) OR (level!='barony' AND source_pointer IS NOT NULL AND rank=level AND count IS NOT NULL AND representation IS NULL AND id_field IS NULL AND parent_field IS NULL AND ((level='kingdom' AND partition_sha256 IS NOT NULL) OR (level!='kingdom' AND partition_sha256 IS NULL)))),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_map (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  minimum_polygon_rank TEXT NOT NULL,
  barony_polygon INTEGER NOT NULL CHECK(barony_polygon IN (0,1)),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_selectable_rank (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  rank TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_slot_edition (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  edition_kind TEXT NOT NULL,
  source_pointer TEXT NOT NULL,
  edition TEXT NOT NULL,
  base_date TEXT,
  administrative_candidate_date TEXT,
  checked_at TEXT,
  count INTEGER NOT NULL CHECK(count>=0),
  geometry_verified INTEGER NOT NULL CHECK(geometry_verified IN (0,1)),
  current_boundary_certification INTEGER CHECK(current_boundary_certification IN (0,1)),
  UNIQUE(source_id,edition_kind), CHECK((edition_kind='dated' AND base_date IS NOT NULL AND administrative_candidate_date IS NULL AND checked_at IS NULL AND current_boundary_certification IS NOT NULL) OR (edition_kind='currentCorrespondence' AND base_date IS NULL AND administrative_candidate_date IS NOT NULL AND checked_at IS NOT NULL AND current_boundary_certification IS NULL)),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_parent (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  source_field TEXT NOT NULL,
  meaning TEXT NOT NULL,
  political_liege_inference INTEGER NOT NULL CHECK(political_liege_inference IN (0,1)),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_parent_exception (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  title_id TEXT NOT NULL,
  parent_title_id TEXT NOT NULL,
  map_kingdom_title_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_territorial_political_axis (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  current_centers INTEGER NOT NULL CHECK(current_centers>=0),
  geographic_kingdom_equivalence INTEGER NOT NULL CHECK(geographic_kingdom_equivalence IN (0,1)),
  preserve_stable_political_identities INTEGER NOT NULL CHECK(preserve_stable_political_identities IN (0,1)),
  preserve_nonterritorial_kingship INTEGER NOT NULL CHECK(preserve_nonterritorial_kingship IN (0,1)),
  FOREIGN KEY(source_id) REFERENCES text_territorial(source_id),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id),
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
