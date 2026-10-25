-- Current authority is typed domain rows. Archive bytes are evidence only.
CREATE TABLE portrait_archive (
  kind TEXT PRIMARY KEY CHECK(kind IN ('catalog','properties','selection')),
  bytes BLOB NOT NULL, sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE portrait_document (
  kind TEXT PRIMARY KEY REFERENCES portrait_archive(kind),
  schemaVersion INTEGER NOT NULL CHECK(schemaVersion=1), status TEXT NOT NULL,
  styleSource TEXT,
  canonPromotion INTEGER CHECK(canonPromotion=0),
  final3dPortraitContractSatisfied INTEGER CHECK(final3dPortraitContractSatisfied=0),
  previousVerdictsPreserved INTEGER CHECK(previousVerdictsPreserved IN (0,1)),
  entryCount INTEGER NOT NULL CHECK(entryCount>=0), currentSha256 TEXT NOT NULL
) STRICT;
CREATE TABLE portrait_person (
  personId TEXT PRIMARY KEY, characterId TEXT NOT NULL UNIQUE, name TEXT NOT NULL
) STRICT;
CREATE TABLE portrait_catalog (
  personId TEXT PRIMARY KEY REFERENCES portrait_person(personId),
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0), stateId TEXT,
  approval TEXT NOT NULL, imageSha256 TEXT NOT NULL CHECK(length(imageSha256)=64)
) STRICT;
CREATE TABLE portrait_properties (
  personId TEXT PRIMARY KEY REFERENCES portrait_person(personId),
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  face TEXT NOT NULL, hair TEXT NOT NULL, upper TEXT NOT NULL,
  hasIdentity INTEGER NOT NULL CHECK(hasIdentity IN (0,1)),
  hasSlots INTEGER NOT NULL CHECK(hasSlots IN (0,1))
) STRICT;
CREATE TABLE portrait_identity (
  personId TEXT PRIMARY KEY REFERENCES portrait_properties(personId),
  characterId TEXT NOT NULL, name TEXT NOT NULL, gender TEXT NOT NULL, ageCategory TEXT NOT NULL
) STRICT;
CREATE TABLE portrait_identity_evidence (
  personId TEXT NOT NULL REFERENCES portrait_identity(personId),
  field TEXT NOT NULL CHECK(field IN ('ethnicity','origin')),
  value TEXT, status TEXT NOT NULL, source TEXT,
  PRIMARY KEY(personId,field)
) STRICT;
CREATE TABLE portrait_slot_group (
  personId TEXT NOT NULL REFERENCES portrait_properties(personId),
  slot TEXT NOT NULL CHECK(slot IN ('face','hair','body','outfit','accessories')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(personId,slot), UNIQUE(personId,ordinal)
) STRICT;
CREATE TABLE portrait_slot_evidence (
  personId TEXT NOT NULL, slot TEXT NOT NULL, field TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0), value TEXT, status TEXT NOT NULL,
  source TEXT, hasUnit INTEGER NOT NULL CHECK(hasUnit IN (0,1)), unit TEXT,
  PRIMARY KEY(personId,slot,field), UNIQUE(personId,slot,ordinal),
  FOREIGN KEY(personId,slot) REFERENCES portrait_slot_group(personId,slot)
) STRICT;
CREATE TABLE portrait_selection (
  personId TEXT PRIMARY KEY REFERENCES portrait_person(personId),
  ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  imageSha256 TEXT NOT NULL CHECK(length(imageSha256)=64),
  hasPrevious INTEGER NOT NULL CHECK(hasPrevious IN (0,1)),
  previousImageSha256 TEXT CHECK(previousImageSha256 IS NULL OR length(previousImageSha256)=64),
  verdict TEXT NOT NULL CHECK(verdict='pass'), operation TEXT NOT NULL
) STRICT;
-- Only object key order lives here, never object values or serialized JSON.
CREATE TABLE portrait_key_order (
  kind TEXT NOT NULL REFERENCES portrait_document(kind), owner TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0), field TEXT NOT NULL,
  PRIMARY KEY(kind,owner,ordinal), UNIQUE(kind,owner,field)
) STRICT;
CREATE TABLE portrait_seal (singleton INTEGER PRIMARY KEY CHECK(singleton=1), revision INTEGER NOT NULL CHECK(revision>=1)) STRICT;
CREATE TABLE portrait_revision (
  revision INTEGER PRIMARY KEY CHECK(revision>=1),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE portrait_revision_evidence (
  revision INTEGER NOT NULL REFERENCES portrait_revision(revision), kind TEXT NOT NULL,
  bytes BLOB NOT NULL, sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  PRIMARY KEY(revision,kind)
) STRICT;
