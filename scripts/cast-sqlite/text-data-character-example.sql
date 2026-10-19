-- Load after schema.sql and text-corpus-documents.sql. Every key retains the
-- original source ID and an authored pointer. Hash provenance joins source_file.
CREATE TABLE text_character_example (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data'),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_identity (
  source_id INTEGER PRIMARY KEY REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/identity'),
  generation TEXT NOT NULL CHECK(generation IN ('opening','predecessor')),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_rank (
  source_id INTEGER PRIMARY KEY REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/rank'),
  common_tier TEXT NOT NULL CHECK(common_tier IN ('T1','T2','T3','T4','T5')),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_fact (
  source_id INTEGER NOT NULL REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL,
  field TEXT NOT NULL CHECK(field IN ('name','polity_title','sex','origin','language','conscription','arms_access','occupation','affiliation','biography')),
  status TEXT NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  text_value TEXT CHECK(length(text_value)>0),
  origin TEXT CHECK(origin IN ('source-fact','original-fiction','computed')),
  reason TEXT CHECK(length(reason)>0),
  PRIMARY KEY(source_id,field),
  CHECK(json_pointer=CASE field WHEN 'name' THEN '/data/identity/name' WHEN 'polity_title' THEN '/data/rank/polity_title' ELSE '/data/' || field END),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  CHECK(field<>'sex' OR (status='known' AND text_value IN ('female','male'))),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_value (
  source_id INTEGER NOT NULL REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL,
  axis TEXT NOT NULL CHECK(axis IN ('authority','openness','force','material','community','principle','transparency','qualification','decentralization','change')),
  axis_name TEXT NOT NULL REFERENCES value_axis(axis_name),
  status TEXT NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  integer_value INTEGER CHECK(integer_value BETWEEN -100 AND 100),
  origin TEXT CHECK(origin IN ('source-fact','original-fiction','computed')),
  reason TEXT CHECK(length(reason)>0),
  PRIMARY KEY(source_id,axis),
  CHECK(json_pointer='/data/values/' || axis),
  CHECK(axis_name=CASE axis WHEN 'authority' THEN '권위' WHEN 'openness' THEN '개방' WHEN 'force' THEN '무력' WHEN 'material' THEN '물질' WHEN 'community' THEN '공동' WHEN 'principle' THEN '원칙' WHEN 'transparency' THEN '공개' WHEN 'qualification' THEN '자격' WHEN 'decentralization' THEN '분산' WHEN 'change' THEN '변혁' END),
  CHECK((status='known' AND integer_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND integer_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_desire (
  source_id INTEGER NOT NULL REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL,
  axis TEXT NOT NULL CHECK(axis IN ('longing','exclusivity','risk','display','continuity','orientation','union')),
  axis_name TEXT NOT NULL,
  value_kind TEXT NOT NULL CHECK(value_kind IN ('integer','text')),
  status TEXT NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  integer_value INTEGER CHECK(integer_value BETWEEN -100 AND 100),
  text_value TEXT CHECK(length(text_value)>0),
  origin TEXT CHECK(origin IN ('source-fact','original-fiction','computed')),
  reason TEXT CHECK(length(reason)>0),
  PRIMARY KEY(source_id,axis),
  CHECK(json_pointer='/data/desires/' || axis),
  CHECK(axis_name=CASE axis WHEN 'longing' THEN '갈망' WHEN 'exclusivity' THEN '독점' WHEN 'risk' THEN '위험' WHEN 'display' THEN '과시' WHEN 'continuity' THEN '지속' WHEN 'orientation' THEN '지향' WHEN 'union' THEN '결합' END),
  CHECK((axis IN ('orientation','union') AND value_kind='text' AND integer_value IS NULL)
    OR (axis NOT IN ('orientation','union') AND value_kind='integer' AND text_value IS NULL)),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL
      AND ((value_kind='integer' AND integer_value IS NOT NULL) OR (value_kind='text' AND text_value IS NOT NULL)))
    OR (status<>'known' AND integer_value IS NULL AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  FOREIGN KEY(axis_name,value_kind) REFERENCES desire_axis(axis_name,value_kind),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_politics (
  source_id INTEGER NOT NULL REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL,
  field TEXT NOT NULL CHECK(field IN ('personality','ambition','fear','governance','trigger','intervention')),
  status TEXT NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  text_value TEXT CHECK(length(text_value)>0),
  origin TEXT CHECK(origin IN ('source-fact','original-fiction','computed')),
  reason TEXT CHECK(length(reason)>0),
  PRIMARY KEY(source_id,field),
  CHECK(json_pointer='/data/politics/' || field),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_relations (
  source_id INTEGER PRIMARY KEY REFERENCES text_character_example(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/relations'),
  status TEXT NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  origin TEXT CHECK(origin IN ('source-fact','original-fiction','computed')),
  reason TEXT CHECK(length(reason)>0),
  UNIQUE(source_id,status),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND origin IS NULL AND reason IS NOT NULL)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_character_example_relation (
  source_id INTEGER NOT NULL REFERENCES text_character_example_relations(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  relation_type TEXT NOT NULL CHECK(relation_type IN ('kinship','adoption','mentorship','command','contract','debt','oath','rivalry','grievance','protected-residence','betrayal')),
  target_id TEXT NOT NULL CHECK(length(target_id)>0),
  PRIMARY KEY(source_id,ordinal),
  CHECK(json_pointer='/data/relations/value/' || ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
