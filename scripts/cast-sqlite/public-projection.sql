CREATE TABLE public_projection_document (
  kind TEXT PRIMARY KEY CHECK(kind IN ('office','map')), slug TEXT NOT NULL,
  remove_anchor TEXT, source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  actor TEXT NOT NULL, reason TEXT NOT NULL
) STRICT;
CREATE TABLE public_office_replacement (
  ordinal INTEGER PRIMARY KEY, anchor TEXT NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  row_number INTEGER, column_number INTEGER, before_text TEXT NOT NULL, after_text TEXT NOT NULL,
  CHECK((row_number IS NULL)=(column_number IS NULL))
) STRICT;
CREATE TABLE public_map_summary (
  ordinal INTEGER PRIMARY KEY, locale TEXT NOT NULL UNIQUE CHECK(locale IN ('ko','en')),
  before_text TEXT NOT NULL, after_text TEXT NOT NULL
) STRICT;
CREATE TABLE public_map_block (
  ordinal INTEGER PRIMARY KEY, anchor TEXT NOT NULL UNIQUE, removed INTEGER NOT NULL CHECK(removed IN (0,1))
) STRICT;
CREATE TABLE public_map_block_locale (
  block_ordinal INTEGER NOT NULL REFERENCES public_map_block(ordinal),
  ordinal INTEGER NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  before_text TEXT NOT NULL, after_text TEXT,
  PRIMARY KEY(block_ordinal,locale), UNIQUE(block_ordinal,ordinal)
) STRICT;
