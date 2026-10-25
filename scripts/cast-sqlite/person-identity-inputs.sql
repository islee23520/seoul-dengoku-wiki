CREATE TABLE person_identity_import (
  domain TEXT PRIMARY KEY CHECK(domain IN ('lineage','gender')),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  people_sha256 TEXT NOT NULL CHECK(length(people_sha256)=64),
  person_count INTEGER NOT NULL CHECK(person_count=1022),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;

CREATE TABLE person_identity_order (
  domain TEXT NOT NULL REFERENCES person_identity_import(domain),
  person_id TEXT NOT NULL REFERENCES person(person_id),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(domain,person_id),
  UNIQUE(domain,ordinal)
) STRICT;

-- Keys, order and explicit null presence only; never serialized values.
CREATE TABLE person_identity_key (
  domain TEXT NOT NULL,
  person_id TEXT NOT NULL,
  object_path TEXT NOT NULL CHECK(object_path IN ('','/namingConventionSource')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(domain,person_id,object_path,ordinal),
  UNIQUE(domain,person_id,object_path,key),
  FOREIGN KEY(domain,person_id) REFERENCES person_identity_order(domain,person_id)
) STRICT;

-- Original non-Korean ledger labels are not Korean clan foreign keys.
CREATE TABLE person_identity_legacy_clan (
  person_id TEXT PRIMARY KEY REFERENCES person_lineage(person_id),
  legacy_clan_label TEXT NOT NULL
) STRICT;
