-- Bounded draft seed document only; these rows do not approve naming or publication.
CREATE TABLE clan_seed_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL,
  id TEXT NOT NULL,
  status TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  note TEXT NOT NULL,
  position TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE clan_seed_clan (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  document_id INTEGER NOT NULL REFERENCES clan_seed_document(document_id),
  surname TEXT NOT NULL,
  bongwan TEXT NOT NULL,
  keep_rate_decimal TEXT NOT NULL CHECK(keep_rate_decimal IN ('0.45','0.4','0.35','0.3','0.25')),
  UNIQUE(surname,bongwan)
) STRICT;
CREATE TABLE clan_seed_syllable (
  clan_ordinal INTEGER NOT NULL REFERENCES clan_seed_clan(ordinal),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  syllable TEXT NOT NULL CHECK(length(syllable)=1),
  PRIMARY KEY(clan_ordinal,ordinal)
) STRICT;
