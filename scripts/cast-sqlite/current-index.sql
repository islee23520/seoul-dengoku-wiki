CREATE TABLE index_document (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  document_id TEXT NOT NULL UNIQUE,
  logical_path TEXT NOT NULL UNIQUE,
  source_status TEXT NOT NULL CHECK (source_status = 'draft'),
  source_kind TEXT NOT NULL CHECK (source_kind = 'original-fiction'),
  tense_ko TEXT NOT NULL,
  tense_en TEXT NOT NULL,
  temporal_scope TEXT NOT NULL CHECK (temporal_scope IN ('past_draft_index','draft_corridor_index','draft_state_label'))
) STRICT;

CREATE TABLE index_state_label (
  source_id INTEGER NOT NULL REFERENCES index_document(source_id),
  state_id TEXT PRIMARY KEY REFERENCES state(state_id),
  state_name_ko TEXT NOT NULL,
  state_name_en TEXT NOT NULL,
  row_ordinal INTEGER NOT NULL CHECK (row_ordinal >= 0),
  json_pointer TEXT NOT NULL,
  FOREIGN KEY (source_id,json_pointer) REFERENCES source_record(source_id,json_pointer),
  UNIQUE (source_id,row_ordinal)
) STRICT;

CREATE TABLE index_section (
  source_id INTEGER NOT NULL REFERENCES index_document(source_id),
  table_anchor TEXT NOT NULL,
  section_ordinal INTEGER NOT NULL CHECK (section_ordinal >= 0),
  section_anchor TEXT NOT NULL,
  section_name_ko TEXT NOT NULL,
  section_name_en TEXT NOT NULL,
  state_id TEXT REFERENCES state(state_id),
  row_count INTEGER NOT NULL CHECK (row_count >= 0),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY (source_id,table_anchor),
  FOREIGN KEY (source_id,json_pointer) REFERENCES source_record(source_id,json_pointer),
  UNIQUE (source_id,section_ordinal)
) STRICT;

CREATE TABLE index_person (
  source_id INTEGER NOT NULL,
  table_anchor TEXT NOT NULL,
  row_ordinal INTEGER NOT NULL CHECK (row_ordinal >= 0),
  person_id TEXT REFERENCES person(person_id),
  match_status TEXT NOT NULL CHECK (match_status IN ('exact_registry_name','documented_display_alias','unmatched')),
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  office_ko TEXT NOT NULL,
  office_en TEXT NOT NULL,
  tier_ko TEXT NOT NULL,
  tier_en TEXT NOT NULL,
  relation_count INTEGER NOT NULL CHECK (relation_count >= 0),
  json_pointer TEXT NOT NULL,
  PRIMARY KEY (source_id,table_anchor,row_ordinal),
  FOREIGN KEY (source_id,table_anchor) REFERENCES index_section(source_id,table_anchor),
  FOREIGN KEY (source_id,json_pointer) REFERENCES source_record(source_id,json_pointer),
  CHECK ((match_status='unmatched')=(person_id IS NULL))
) STRICT;

CREATE TABLE index_corridor_person (
  source_id INTEGER NOT NULL REFERENCES index_document(source_id),
  table_anchor TEXT NOT NULL,
  row_ordinal INTEGER NOT NULL CHECK (row_ordinal >= 0),
  person_id TEXT REFERENCES person(person_id),
  match_status TEXT NOT NULL CHECK (match_status IN ('exact_registry_name','documented_display_alias','unmatched')),
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  corridor_ko TEXT NOT NULL,
  corridor_en TEXT NOT NULL,
  office_ko TEXT NOT NULL,
  office_en TEXT NOT NULL,
  conscription_ko TEXT NOT NULL,
  conscription_en TEXT NOT NULL,
  arms_access_ko TEXT NOT NULL,
  arms_access_en TEXT NOT NULL,
  json_pointer TEXT NOT NULL,
  PRIMARY KEY (source_id,table_anchor,row_ordinal),
  FOREIGN KEY (source_id,json_pointer) REFERENCES source_record(source_id,json_pointer),
  CHECK ((match_status='unmatched')=(person_id IS NULL))
) STRICT;

CREATE TABLE index_issue (
  source_id INTEGER NOT NULL REFERENCES index_document(source_id),
  issue_code TEXT NOT NULL,
  issue_ordinal INTEGER NOT NULL CHECK (issue_ordinal >= 0),
  severity TEXT NOT NULL CHECK (severity IN ('warning','error')),
  table_anchor TEXT,
  row_ordinal INTEGER CHECK (row_ordinal >= 0),
  name_ko TEXT,
  observed_count INTEGER CHECK (observed_count >= 0),
  stated_count INTEGER CHECK (stated_count >= 0),
  json_pointer TEXT NOT NULL,
  message TEXT NOT NULL,
  PRIMARY KEY (source_id,issue_ordinal),
  FOREIGN KEY (source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE INDEX index_person_id_idx ON index_person(person_id);
CREATE INDEX index_corridor_person_id_idx ON index_corridor_person(person_id);
