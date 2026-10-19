-- Load after text-corpus-documents.sql. The source_id/pointer pairs are stable
-- source-derived keys; source_file supplies the original file path and hash.
CREATE TABLE text_ecology_data (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data'),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_ecology (
  source_id INTEGER PRIMARY KEY REFERENCES text_ecology_data(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/ecology'),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_ecology_description (
  source_id INTEGER NOT NULL REFERENCES text_ecology(source_id),
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('en','ko')),
  representation TEXT NOT NULL CHECK(representation IN ('string','runs')),
  text TEXT NOT NULL CHECK(length(text)>0),
  PRIMARY KEY(source_id,locale),
  CHECK(json_pointer='/data/ecology/description/' || locale),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_ecology_description_run (
  source_id INTEGER NOT NULL,
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  text TEXT NOT NULL CHECK(length(text)>0),
  strong INTEGER CHECK(strong=1),
  link_domain TEXT,
  link_slug TEXT,
  link_anchor TEXT,
  href TEXT,
  PRIMARY KEY(source_id,locale,ordinal),
  CHECK(json_pointer='/data/ecology/description/' || locale || '/' || ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL)),
  FOREIGN KEY(source_id,locale) REFERENCES text_ecology_description(source_id,locale),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_ecology_variant (
  source_id INTEGER NOT NULL REFERENCES text_ecology(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  variant_id TEXT NOT NULL,
  source_batch TEXT NOT NULL,
  target_source_id INTEGER REFERENCES text_document(source_id),
  PRIMARY KEY(source_id,ordinal),
  CHECK(json_pointer='/data/ecology/variants/' || ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_integration (
  source_id INTEGER PRIMARY KEY REFERENCES text_ecology_data(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer='/data/integration'),
  manifest TEXT NOT NULL CHECK(manifest='TOOL/tools/wiki/confirmed-integration-manifest.json'),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_integration_excluded (
  source_id INTEGER NOT NULL REFERENCES text_integration(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  excluded_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('social','monsters','groups')),
  target_source_id INTEGER REFERENCES text_document(source_id),
  PRIMARY KEY(source_id,ordinal),
  CHECK(json_pointer='/data/integration/excluded/' || ordinal),
  CHECK(kind='groups' OR target_source_id IS NULL),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
