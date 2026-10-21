-- Internal, immutable geography snapshot. Archives are evidence, never read authority.
CREATE TABLE geography_archive (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), bytes BLOB NOT NULL,
  sha256 TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL
) STRICT;
CREATE TABLE geography_seal (singleton INTEGER PRIMARY KEY CHECK(singleton=1)) STRICT;
CREATE TABLE geography_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema TEXT NOT NULL, status TEXT NOT NULL,
  officialExtentStatus TEXT NOT NULL, kingdomStatus TEXT NOT NULL, mapMinimumRank TEXT NOT NULL
) STRICT;
CREATE TABLE geography_evidence (kind TEXT PRIMARY KEY, path TEXT NOT NULL, sha256 TEXT NOT NULL) STRICT;
CREATE TABLE geography_edition (
  kind TEXT PRIMARY KEY, id TEXT NOT NULL UNIQUE, electionDate TEXT,
  seoulCompositionMatchesCurrentAppendix INTEGER CHECK(seoulCompositionMatchesCurrentAppendix IN (0,1)),
  lawNumber INTEGER, promulgatedDate TEXT, effectiveDate TEXT, appendixAmendedDate TEXT, appendixFileSeq INTEGER,
  administrativeCandidateDate TEXT, officialMembershipCheckedAt TEXT, codeAndNameSourceRef TEXT,
  geometryVerified INTEGER CHECK(geometryVerified IN (0,1))
) STRICT;
CREATE TABLE geography_edition_source (
  kind TEXT NOT NULL REFERENCES geography_edition(kind), ordinal INTEGER NOT NULL, ref TEXT NOT NULL,
  PRIMARY KEY(kind,ordinal)
) STRICT;
CREATE TABLE geography_source_record (ordinal INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL, role TEXT NOT NULL) STRICT;
CREATE TABLE geography_title (
  titleId TEXT PRIMARY KEY, ordinal INTEGER NOT NULL UNIQUE, rank TEXT NOT NULL CHECK(rank IN ('empire','kingdom','duchy','county')),
  name TEXT NOT NULL, sourcePointer TEXT NOT NULL,
  feudalParentTitleId TEXT REFERENCES geography_title(titleId) DEFERRABLE INITIALLY DEFERRED,
  feudalParentStatus TEXT NOT NULL, geographicParentException TEXT,
  hasCountyTitleIds INTEGER NOT NULL CHECK(hasCountyTitleIds IN (0,1)),
  hasHolderPersonId INTEGER NOT NULL CHECK(hasHolderPersonId IN (0,1)), holderPersonId TEXT
) STRICT;
CREATE TABLE geography_title_jurisdiction (titleId TEXT NOT NULL REFERENCES geography_title, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(titleId,ordinal)) STRICT;
CREATE TABLE geography_title_source (titleId TEXT NOT NULL REFERENCES geography_title, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(titleId,ordinal)) STRICT;
CREATE TABLE geography_title_county (titleId TEXT NOT NULL REFERENCES geography_title, ordinal INTEGER NOT NULL, ref TEXT NOT NULL REFERENCES geography_title, PRIMARY KEY(titleId,ordinal)) STRICT;
CREATE TABLE geography_map_title (ordinal INTEGER PRIMARY KEY, ref TEXT NOT NULL REFERENCES geography_title) STRICT;
CREATE TABLE geography_county (
  edition TEXT NOT NULL CHECK(edition IN ('dated','current')), countyTitleId TEXT NOT NULL REFERENCES geography_title,
  ordinal INTEGER NOT NULL, PRIMARY KEY(edition,countyTitleId), UNIQUE(edition,ordinal)
) STRICT;
CREATE TABLE geography_slot (
  edition TEXT NOT NULL, countyTitleId TEXT NOT NULL, ordinal INTEGER NOT NULL,
  slotId TEXT NOT NULL, dongId TEXT NOT NULL, name TEXT NOT NULL, jurisdictionGuRef TEXT NOT NULL,
  electoralDongId TEXT NOT NULL, fragmentId TEXT, sourceEdition TEXT NOT NULL, sourcePointer TEXT NOT NULL,
  geometryVerified INTEGER NOT NULL CHECK(geometryVerified IN (0,1)), status TEXT NOT NULL, holderPersonId TEXT,
  PRIMARY KEY(edition,slotId), UNIQUE(edition,countyTitleId,ordinal),
  FOREIGN KEY(edition,countyTitleId) REFERENCES geography_county(edition,countyTitleId)
) STRICT;
CREATE TABLE geography_slot_source (edition TEXT NOT NULL, slotId TEXT NOT NULL, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot) STRICT;
CREATE TABLE geography_slot_geometry (edition TEXT NOT NULL, slotId TEXT NOT NULL, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot) STRICT;
CREATE TABLE geography_slot_candidate_geometry (edition TEXT NOT NULL CHECK(edition='current'), slotId TEXT NOT NULL, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot) STRICT;
CREATE TABLE geography_slot_correspondence (
  edition TEXT NOT NULL CHECK(edition='dated'), slotId TEXT NOT NULL, ordinal INTEGER NOT NULL,
  targetEdition TEXT NOT NULL CHECK(targetEdition='current'), ref TEXT NOT NULL,
  PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot,
  FOREIGN KEY(targetEdition,ref) REFERENCES geography_slot(edition,slotId) DEFERRABLE INITIALLY DEFERRED
) STRICT;
CREATE TABLE geography_slot_historical_holding (
  edition TEXT NOT NULL, slotId TEXT NOT NULL, ordinal INTEGER NOT NULL, id TEXT NOT NULL,
  sourcePath TEXT NOT NULL, jsonPointer TEXT NOT NULL, sourceSha256 TEXT NOT NULL,
  recordSha256 TEXT NOT NULL, scopeKind TEXT NOT NULL, status TEXT NOT NULL,
  PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot
) STRICT;
-- The admitted source has no current holding references. Nonempty input fails closed.
CREATE TABLE geography_slot_holding (edition TEXT NOT NULL, slotId TEXT NOT NULL, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(edition,slotId,ordinal), FOREIGN KEY(edition,slotId) REFERENCES geography_slot) STRICT;
CREATE TABLE geography_spatial (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), edition TEXT NOT NULL, baseDate TEXT NOT NULL,
  authority TEXT NOT NULL, legalSurveyCertification INTEGER NOT NULL CHECK(legalSurveyCertification IN (0,1)),
  current2026Geometry INTEGER NOT NULL CHECK(current2026Geometry IN (0,1)), archiveSha256 TEXT NOT NULL
) STRICT;
CREATE TABLE geography_spatial_geometry (singleton INTEGER PRIMARY KEY REFERENCES geography_spatial, path TEXT NOT NULL, sha256 TEXT NOT NULL, crs TEXT NOT NULL, features INTEGER NOT NULL) STRICT;
CREATE TABLE geography_successor (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema TEXT NOT NULL, batchId TEXT NOT NULL,
  previousSha256 TEXT NOT NULL, beforeArchivePath TEXT NOT NULL, partitionSha256 TEXT NOT NULL,
  crossDistrictParentPolicy TEXT NOT NULL
) STRICT;
CREATE TABLE geography_successor_pointer (kind TEXT PRIMARY KEY CHECK(kind IN ('proposal','approval')), path TEXT NOT NULL, sha256 TEXT NOT NULL) STRICT;
CREATE TABLE geography_partition (titleId TEXT PRIMARY KEY REFERENCES geography_title, ordinal INTEGER NOT NULL UNIQUE, proposalId TEXT NOT NULL, name TEXT NOT NULL) STRICT;
CREATE TABLE geography_partition_jurisdiction (titleId TEXT NOT NULL REFERENCES geography_partition, ordinal INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY(titleId,ordinal)) STRICT;
CREATE TABLE geography_partition_county (titleId TEXT NOT NULL REFERENCES geography_partition, ordinal INTEGER NOT NULL, ref TEXT NOT NULL REFERENCES geography_title, PRIMARY KEY(titleId,ordinal)) STRICT;
