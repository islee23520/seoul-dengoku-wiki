CREATE TABLE organization_values_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  schema TEXT NOT NULL,
  note TEXT NOT NULL,
  count INTEGER NOT NULL CHECK(count>=0),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE organization_values_axis (
  document_id INTEGER NOT NULL REFERENCES organization_values_document(document_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  name TEXT NOT NULL UNIQUE,
  PRIMARY KEY(document_id,ordinal)
) STRICT;
CREATE TABLE organization_values_policy_axis (
  document_id INTEGER NOT NULL REFERENCES organization_values_document(document_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  name TEXT NOT NULL UNIQUE,
  PRIMARY KEY(document_id,ordinal)
) STRICT;
CREATE TABLE organization_values_org (
  document_id INTEGER NOT NULL REFERENCES organization_values_document(document_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  class_present INTEGER NOT NULL CHECK(class_present IN (0,1)),
  class TEXT,
  source TEXT NOT NULL,
  UNIQUE(document_id,ordinal),
  CHECK(class_present=1 OR class IS NULL)
) STRICT;
CREATE TABLE organization_values_state (
  org_id TEXT NOT NULL REFERENCES organization_values_org(id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  state TEXT NOT NULL,
  PRIMARY KEY(org_id,ordinal)
) STRICT;
CREATE TABLE organization_values_score (
  org_id TEXT PRIMARY KEY REFERENCES organization_values_org(id),
  authority INTEGER NOT NULL,
  openness INTEGER NOT NULL,
  force INTEGER NOT NULL,
  material INTEGER NOT NULL,
  communal INTEGER NOT NULL,
  principle INTEGER NOT NULL,
  disclosure INTEGER NOT NULL,
  qualification INTEGER NOT NULL,
  decentralization INTEGER NOT NULL,
  transformation INTEGER NOT NULL
) STRICT;
CREATE TABLE organization_values_policy (
  org_id TEXT PRIMARY KEY REFERENCES organization_values_org(id),
  war TEXT NOT NULL,
  migrants TEXT NOT NULL,
  water TEXT NOT NULL,
  labor TEXT NOT NULL,
  records TEXT NOT NULL,
  technology TEXT NOT NULL,
  trade TEXT NOT NULL,
  succession TEXT NOT NULL,
  union_policy TEXT NOT NULL
) STRICT;
