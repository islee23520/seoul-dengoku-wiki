CREATE TABLE build_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE source_file (
  source_id INTEGER PRIMARY KEY,
  logical_path TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  byte_length INTEGER NOT NULL CHECK(byte_length >= 0),
  raw_bytes BLOB NOT NULL CHECK(length(raw_bytes) = byte_length)
) STRICT;

CREATE TABLE source_record (
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  parent_pointer TEXT,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  field_name TEXT,
  json_type TEXT NOT NULL CHECK(json_type IN ('object','array','null','boolean','integer','real','text')),
  text_value TEXT,
  integer_value INTEGER,
  real_value REAL,
  boolean_value INTEGER CHECK(boolean_value IN (0,1)),
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,parent_pointer) REFERENCES source_record(source_id,json_pointer),
  CHECK(
    (json_type IN ('object','array','null') AND text_value IS NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'text' AND text_value IS NOT NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'integer' AND text_value IS NULL AND integer_value IS NOT NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'real' AND text_value IS NULL AND integer_value IS NULL AND real_value IS NOT NULL AND boolean_value IS NULL)
    OR (json_type = 'boolean' AND text_value IS NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NOT NULL)
  )
) STRICT;

CREATE TABLE state (
  state_id TEXT PRIMARY KEY CHECK(length(trim(state_id)) > 0 AND state_id = trim(state_id)),
  name_ko TEXT UNIQUE
) STRICT;

CREATE TABLE state_label (
  state_id TEXT NOT NULL REFERENCES state(state_id),
  name_ko TEXT NOT NULL,
  PRIMARY KEY(state_id,name_ko)
) STRICT;

CREATE TABLE person (
  person_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  publication_ordinal INTEGER NOT NULL UNIQUE CHECK(publication_ordinal > 0),
  public_key TEXT NOT NULL UNIQUE,
  public_route TEXT NOT NULL UNIQUE,
  state_id TEXT REFERENCES state(state_id),
  state_name TEXT,
  title TEXT,
  stage TEXT,
  generation TEXT,
  source_kind TEXT,
  minors INTEGER NOT NULL CHECK(minors IN (0,1)),
  locked INTEGER CHECK(locked IN (0,1)),
  values_source_ordinal INTEGER NOT NULL UNIQUE CHECK(values_source_ordinal >= 0),
  FOREIGN KEY(state_id,state_name) REFERENCES state_label(state_id,name_ko)
) STRICT;

CREATE TABLE person_alias (
  person_id TEXT NOT NULL REFERENCES person(person_id),
  alias TEXT NOT NULL UNIQUE,
  alias_ordinal INTEGER NOT NULL CHECK(alias_ordinal >= 0),
  PRIMARY KEY(person_id,alias),
  UNIQUE(person_id,alias_ordinal)
) STRICT;

CREATE TABLE value_axis (
  axis_name TEXT PRIMARY KEY,
  axis_ordinal INTEGER NOT NULL UNIQUE CHECK(axis_ordinal >= 0)
) STRICT;

CREATE TABLE person_value (
  person_id TEXT NOT NULL REFERENCES person(person_id),
  axis_name TEXT NOT NULL REFERENCES value_axis(axis_name),
  value INTEGER NOT NULL CHECK(value BETWEEN -100 AND 100),
  PRIMARY KEY(person_id,axis_name)
) STRICT;

CREATE TABLE desire_axis (
  axis_name TEXT PRIMARY KEY,
  axis_ordinal INTEGER NOT NULL UNIQUE CHECK(axis_ordinal >= 0),
  value_kind TEXT NOT NULL CHECK(value_kind IN ('integer','text')),
  UNIQUE(axis_name,value_kind)
) STRICT;

CREATE TABLE person_desire (
  person_id TEXT NOT NULL REFERENCES person(person_id),
  axis_name TEXT NOT NULL,
  value_kind TEXT NOT NULL CHECK(value_kind IN ('integer','text')),
  integer_value INTEGER CHECK(integer_value BETWEEN -100 AND 100),
  text_value TEXT,
  PRIMARY KEY(person_id,axis_name),
  FOREIGN KEY(axis_name,value_kind) REFERENCES desire_axis(axis_name,value_kind),
  CHECK((value_kind = 'integer' AND integer_value IS NOT NULL AND text_value IS NULL)
     OR (value_kind = 'text' AND integer_value IS NULL))
) STRICT;

CREATE TABLE person_gender (
  person_id TEXT PRIMARY KEY REFERENCES person(person_id),
  state_id TEXT REFERENCES state(state_id),
  gender TEXT NOT NULL,
  assignment_source TEXT,
  user_locked INTEGER CHECK(user_locked IN (0,1))
) STRICT;

CREATE TABLE clan (
  clan_id TEXT PRIMARY KEY,
  base_clan_id TEXT REFERENCES clan(clan_id) DEFERRABLE INITIALLY DEFERRED,
  surname TEXT,
  bongwan TEXT,
  bongwan_hanja TEXT,
  branch TEXT,
  provenance TEXT,
  hangnyeol_unconfirmed_reason TEXT,
  source_label TEXT,
  surname_hanja TEXT,
  creative_rationale TEXT,
  method_ref TEXT,
  show_branches INTEGER CHECK(show_branches IN (0,1))
) STRICT;

CREATE TABLE clan_source (
  clan_id TEXT NOT NULL REFERENCES clan(clan_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  source_ref TEXT NOT NULL,
  PRIMARY KEY(clan_id,ordinal)
) STRICT;

CREATE TABLE clan_hangnyeol_row (
  clan_id TEXT NOT NULL REFERENCES clan(clan_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  sesu INTEGER NOT NULL,
  hangnyeol TEXT NOT NULL,
  hanja TEXT,
  position TEXT NOT NULL,
  PRIMARY KEY(clan_id,ordinal)
) STRICT;

CREATE TABLE person_lineage (
  person_id TEXT PRIMARY KEY REFERENCES person(person_id),
  surname TEXT,
  status TEXT,
  bongwan TEXT,
  clan_id TEXT REFERENCES clan(clan_id),
  base_clan_id TEXT REFERENCES clan(clan_id),
  branch TEXT,
  reason TEXT,
  source_file_label TEXT,
  surname_hanja TEXT,
  bongwan_hanja TEXT,
  hangnyeol TEXT,
  position TEXT,
  sesu INTEGER,
  naming_convention TEXT CHECK(naming_convention IN ('non-korean-lineage')),
  naming_source_character_id TEXT,
  naming_source_path TEXT,
  naming_source_basis TEXT
) STRICT;

CREATE TABLE person_lineage_source_clan (
  person_id TEXT PRIMARY KEY REFERENCES person_lineage(person_id),
  source_ref TEXT NOT NULL,
  source_ordinal INTEGER NOT NULL CHECK(source_ordinal >= 0)
) STRICT;

CREATE TABLE lineage_node (
  name TEXT PRIMARY KEY,
  person_id TEXT UNIQUE REFERENCES person(person_id)
) STRICT;

CREATE TABLE lineage_parent (
  child_name TEXT NOT NULL REFERENCES lineage_node(name),
  parent_name TEXT NOT NULL REFERENCES lineage_node(name),
  PRIMARY KEY(child_name,parent_name)
) STRICT;

CREATE TABLE lineage_founder_sesu (
  person_name TEXT PRIMARY KEY REFERENCES lineage_node(name),
  sesu INTEGER NOT NULL
) STRICT;

CREATE TABLE lineage_clan_assignment (
  person_id TEXT NOT NULL REFERENCES person(person_id),
  clan_id TEXT NOT NULL REFERENCES clan(clan_id),
  PRIMARY KEY(person_id,clan_id)
) STRICT;

CREATE TABLE profile (
  profile_id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  heading_pointer TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('state','core','unaffiliated','corridor')),
  source_ordinal INTEGER NOT NULL CHECK(source_ordinal >= 0),
  heading_depth INTEGER NOT NULL CHECK(heading_depth > 0),
  anchor TEXT,
  heading_ko TEXT,
  heading_en TEXT,
  node_start INTEGER NOT NULL CHECK(node_start >= 0),
  node_end INTEGER NOT NULL CHECK(node_end > node_start),
  is_primary INTEGER NOT NULL CHECK(is_primary IN (0,1)),
  UNIQUE(source_id,source_ordinal),
  FOREIGN KEY(source_id,heading_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE profile_node (
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  node_ordinal INTEGER NOT NULL CHECK(node_ordinal >= 0),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(profile_id,node_ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE profile_field (
  profile_id TEXT NOT NULL REFERENCES profile(profile_id),
  field_ordinal INTEGER NOT NULL CHECK(field_ordinal >= 0),
  field_kind TEXT NOT NULL CHECK(field_kind IN ('lead','bullet','section')),
  key_ko TEXT,
  key_en TEXT,
  value_ko TEXT,
  value_en TEXT,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(profile_id,field_ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE relation_type (
  type_ko TEXT PRIMARY KEY,
  type_en TEXT,
  type_ordinal INTEGER NOT NULL UNIQUE CHECK(type_ordinal >= 0),
  UNIQUE(type_ko,type_en)
) STRICT;

CREATE TABLE relation (
  relation_id TEXT PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  row_ordinal INTEGER NOT NULL UNIQUE CHECK(row_ordinal >= 0),
  section_anchor TEXT,
  from_person_id TEXT NOT NULL REFERENCES person(person_id),
  to_person_id TEXT NOT NULL REFERENCES person(person_id),
  type_ko TEXT NOT NULL REFERENCES relation_type(type_ko),
  type_en TEXT,
  grounds_ko TEXT NOT NULL,
  grounds_en TEXT NOT NULL,
  json_pointer TEXT NOT NULL UNIQUE,
  UNIQUE(source_id,row_ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_profile (
  person_id TEXT PRIMARY KEY REFERENCES person(person_id),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  state_id TEXT REFERENCES state(state_id),
  url TEXT,
  status TEXT NOT NULL,
  method TEXT,
  role_display TEXT,
  band TEXT,
  baseline INTEGER NOT NULL CHECK(baseline IN (0,1)),
  attributes INTEGER NOT NULL,
  advantages INTEGER NOT NULL,
  disadvantages INTEGER NOT NULL,
  skills INTEGER NOT NULL,
  spent INTEGER NOT NULL,
  unspent INTEGER NOT NULL,
  total INTEGER NOT NULL,
  territory_presence TEXT NOT NULL CHECK(territory_presence IN ('absent','null','present')),
  unit_presence TEXT NOT NULL CHECK(unit_presence IN ('absent','null','present')),
  wandering_force_presence TEXT NOT NULL CHECK(wandering_force_presence IN ('absent','null','present')),
  advantages_presence TEXT NOT NULL CHECK(advantages_presence IN ('absent','null','present')),
  disadvantages_presence TEXT NOT NULL CHECK(disadvantages_presence IN ('absent','null','present')),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_attribute (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  attribute_code TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  value INTEGER NOT NULL,
  cp INTEGER NOT NULL,
  rule TEXT,
  PRIMARY KEY(person_id,attribute_code),
  UNIQUE(person_id,ordinal)
) STRICT;

CREATE TABLE gurps_secondary (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  stat_name TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  value REAL NOT NULL,
  PRIMARY KEY(person_id,stat_name),
  UNIQUE(person_id,ordinal)
) STRICT;

CREATE TABLE gurps_trait (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  name TEXT NOT NULL,
  kind TEXT,
  rule TEXT,
  level REAL,
  people REAL,
  frequency REAL,
  cp INTEGER NOT NULL,
  page TEXT,
  effect TEXT,
  reaction_presence TEXT NOT NULL CHECK(reaction_presence IN ('absent','null','present')),
  reaction_ordinary_observers INTEGER,
  reaction_attracted_observers INTEGER,
  reaction_application TEXT,
  boundaries_presence TEXT NOT NULL CHECK(boundaries_presence IN ('absent','null','present')),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_trait_application_boundary (
  person_id TEXT NOT NULL,
  trait_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  text TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,trait_ordinal,ordinal),
  FOREIGN KEY(person_id,trait_ordinal) REFERENCES gurps_trait(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_skill (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  name TEXT NOT NULL,
  name_ko TEXT,
  attribute_code TEXT,
  difficulty TEXT,
  difficulty_source TEXT NOT NULL CHECK(difficulty_source IN ('diff','difficulty')),
  tier TEXT,
  cp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  effect TEXT,
  evidence_presence TEXT NOT NULL CHECK(evidence_presence IN ('absent','null','present')),
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_language (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  name TEXT NOT NULL,
  level TEXT,
  cp INTEGER NOT NULL,
  PRIMARY KEY(person_id,ordinal)
) STRICT;

CREATE TABLE gurps_advantage (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  name TEXT NOT NULL,
  cp INTEGER NOT NULL,
  effect TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_disadvantage (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  name TEXT NOT NULL,
  cp INTEGER NOT NULL,
  effect TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_territory (
  person_id TEXT PRIMARY KEY REFERENCES gurps_profile(person_id),
  fief_name TEXT NOT NULL,
  type TEXT NOT NULL,
  station TEXT NOT NULL,
  state_id TEXT NOT NULL,
  settlement_name TEXT NOT NULL,
  settlement_type TEXT NOT NULL,
  settlement_description TEXT NOT NULL,
  note TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_unit (
  person_id TEXT PRIMARY KEY REFERENCES gurps_profile(person_id),
  type TEXT,
  type_presence TEXT NOT NULL CHECK(type_presence IN ('absent','null','present')),
  size INTEGER NOT NULL,
  quality TEXT NOT NULL,
  note TEXT NOT NULL,
  scale_state_id TEXT NOT NULL,
  scale_tier TEXT NOT NULL,
  scale_factor REAL NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_unit_composition (
  person_id TEXT NOT NULL REFERENCES gurps_unit(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  text TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_wandering_force (
  person_id TEXT PRIMARY KEY REFERENCES gurps_profile(person_id),
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  current_location TEXT NOT NULL,
  note TEXT NOT NULL,
  camp_name TEXT NOT NULL,
  camp_type TEXT NOT NULL,
  camp_description TEXT NOT NULL,
  camp_pack_up_time TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE gurps_wandering_facility (
  person_id TEXT NOT NULL REFERENCES gurps_wandering_force(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  text TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(person_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE evidence (
  evidence_id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  subject_kind TEXT NOT NULL CHECK(subject_kind IN ('role','attribute','trait','skill','language')),
  subject_key TEXT,
  subject_ordinal INTEGER CHECK(subject_ordinal >= 0),
  evidence_ordinal INTEGER NOT NULL CHECK(evidence_ordinal >= 0),
  source_id INTEGER REFERENCES source_file(source_id),
  source_path TEXT,
  json_pointer TEXT,
  source_line INTEGER CHECK(source_line > 0),
  quote TEXT,
  note_text TEXT,
  match_status TEXT NOT NULL CHECK(match_status IN ('match','mismatch','missing-source','missing-pointer','uncited-note')),
  CHECK((match_status='uncited-note' AND source_path IS NULL AND quote IS NULL AND note_text IS NOT NULL)
     OR (match_status<>'uncited-note' AND source_path IS NOT NULL AND quote IS NOT NULL AND note_text IS NULL))
) STRICT;

CREATE TABLE source_check_run (
  check_name TEXT PRIMARY KEY,
  exit_code INTEGER NOT NULL,
  stdout_sha256 TEXT NOT NULL CHECK(length(stdout_sha256) = 64),
  stderr_sha256 TEXT NOT NULL CHECK(length(stderr_sha256) = 64),
  issue_count INTEGER NOT NULL CHECK(issue_count >= 0)
) STRICT;

CREATE TABLE source_check_issue (
  check_name TEXT NOT NULL REFERENCES source_check_run(check_name),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  category TEXT NOT NULL,
  person_id TEXT REFERENCES person(person_id),
  raw_line TEXT NOT NULL,
  PRIMARY KEY(check_name,ordinal)
) STRICT;

CREATE TABLE quality_issue (
  issue_id TEXT PRIMARY KEY,
  dataset TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  person_id TEXT REFERENCES person(person_id),
  source_id INTEGER REFERENCES source_file(source_id),
  json_pointer TEXT,
  message TEXT NOT NULL,
  observed_value TEXT
) STRICT;

CREATE INDEX person_state_idx ON person(state_id);
CREATE INDEX profile_person_primary_idx ON profile(person_id,is_primary);
CREATE UNIQUE INDEX profile_one_primary_idx ON profile(person_id) WHERE is_primary=1;
CREATE INDEX profile_field_key_idx ON profile_field(key_ko);
CREATE INDEX relation_from_idx ON relation(from_person_id,type_ko,row_ordinal);
CREATE INDEX relation_to_idx ON relation(to_person_id,type_ko,row_ordinal);
CREATE INDEX evidence_person_subject_idx ON evidence(person_id,subject_kind);
CREATE INDEX quality_issue_dataset_idx ON quality_issue(dataset,code,person_id);
