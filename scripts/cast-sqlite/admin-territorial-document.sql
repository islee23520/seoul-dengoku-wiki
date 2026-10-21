-- Bounded full-source admin territorial catalog. Named typed columns only.
-- No source archive, generic EAV rows, or JSON value/document blobs.
-- Storage keeps every authored unit, including rows outside Seoul. It is not publication.
CREATE TABLE admin_territorial_document_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  schema_name TEXT NOT NULL CHECK (schema_name = 'admin-territorial-catalog.v1'),
  source_ref TEXT NOT NULL CHECK (source_ref = 'lore/regions/sources/selection.json#selected_boundary'),
  source_sha256_field TEXT NOT NULL CHECK (
    source_sha256_field = 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f'
  ),
  unit_count INTEGER NOT NULL CHECK (unit_count = 1842),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  import_reason TEXT NOT NULL CHECK (length(trim(import_reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE admin_territorial_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal)
) STRICT;

CREATE TABLE admin_territorial_document_unit (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0 AND ordinal < 1842),
  admin_id TEXT NOT NULL CHECK (length(admin_id) = 10 AND admin_id GLOB '[0-9]*'),
  province_id TEXT NOT NULL CHECK (length(province_id) = 2 AND province_id GLOB '[0-9]*'),
  parent_id TEXT NOT NULL CHECK (length(parent_id) = 5 AND parent_id GLOB '[0-9]*'),
  province_name TEXT NOT NULL CHECK (length(province_name) > 0),
  parent_name TEXT NOT NULL CHECK (length(parent_name) > 0),
  name TEXT NOT NULL CHECK (length(name) > 0),
  UNIQUE (admin_id)
) STRICT;
