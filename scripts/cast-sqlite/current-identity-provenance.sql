CREATE TABLE identity_registry_provenance (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  schema_name TEXT NOT NULL,
  total_people INTEGER NOT NULL CHECK(total_people>=0),
  existing_k_count INTEGER NOT NULL CHECK(existing_k_count>=0),
  issued_count INTEGER NOT NULL CHECK(issued_count>=0),
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  owner_ref TEXT NOT NULL,
  input_sha256 TEXT NOT NULL CHECK(length(input_sha256)=64),
  candidates_sha256 TEXT NOT NULL CHECK(length(candidates_sha256)=64),
  approval_scope TEXT NOT NULL CHECK(approval_scope='registry-source-event-only'),
  json_pointer TEXT NOT NULL,
  approval_json_pointer TEXT NOT NULL,
  CHECK(existing_k_count+issued_count=total_people),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer),
  FOREIGN KEY(source_id,approval_json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_gender_provenance (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  schema_name TEXT NOT NULL,
  person_count INTEGER NOT NULL CHECK(person_count>=0),
  owner_decision TEXT NOT NULL,
  assignment_method TEXT NOT NULL,
  decision_scope TEXT NOT NULL CHECK(decision_scope='category-and-assignment-policy-only'),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_gender_category (
  source_id INTEGER NOT NULL REFERENCES identity_gender_provenance(source_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  category TEXT NOT NULL,
  json_pointer TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  UNIQUE(source_id,category),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_gender_policy (
  source_id INTEGER NOT NULL REFERENCES identity_gender_provenance(source_id),
  state_id TEXT PRIMARY KEY REFERENCES state(state_id),
  population INTEGER NOT NULL CHECK(population>=0),
  female_ratio REAL NOT NULL CHECK(female_ratio BETWEEN 0 AND 1),
  female_count INTEGER NOT NULL CHECK(female_count>=0),
  male_count INTEGER NOT NULL CHECK(male_count>=0),
  observed_population INTEGER NOT NULL CHECK(observed_population>=0),
  observed_female_count INTEGER NOT NULL CHECK(observed_female_count>=0),
  observed_male_count INTEGER NOT NULL CHECK(observed_male_count>=0),
  alignment_status TEXT NOT NULL CHECK(alignment_status IN ('matches-current','differs-current')),
  reason TEXT NOT NULL,
  json_pointer TEXT NOT NULL,
  CHECK(female_count+male_count=population),
  CHECK(observed_female_count+observed_male_count=observed_population),
  CHECK((alignment_status='matches-current')=(population=observed_population AND female_count=observed_female_count AND male_count=observed_male_count)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_clan_catalog_provenance (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  catalog_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK(schema_version>=0),
  note TEXT NOT NULL,
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_clan_research_source (
  research_source_id TEXT PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES identity_clan_catalog_provenance(source_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  record_id TEXT,
  source_url TEXT NOT NULL,
  accessed_on TEXT NOT NULL,
  source_quote TEXT NOT NULL,
  evidence_path TEXT NOT NULL,
  live_check TEXT NOT NULL,
  live_check_ref TEXT,
  json_pointer TEXT NOT NULL,
  UNIQUE(source_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE identity_lineage_provenance (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  catalog_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK(schema_version>=0),
  note TEXT NOT NULL,
  assignment_method TEXT NOT NULL,
  lineage_notes TEXT NOT NULL,
  json_pointer TEXT NOT NULL,
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
