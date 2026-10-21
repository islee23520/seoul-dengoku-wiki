-- Bounded preservation of scripts/data/admin-city-hierarchy.json.
-- Named typed columns and ordered child rows only. Key rows store object key order, never values.
-- No source archive, generic EAV rows, or JSON value/document blobs.
-- Import stores the authored hierarchy, including rows outside Seoul. It infers nothing and approves nothing.

CREATE TABLE admin_city_document_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  "schema" TEXT NOT NULL,
  approved_boundary_sha256 TEXT NOT NULL CHECK (length(approved_boundary_sha256) = 64),
  effective_date TEXT NOT NULL,
  proof_method TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE admin_city_document_vintage_note (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  note TEXT NOT NULL
) STRICT;

CREATE TABLE admin_city_document_district (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  district_id TEXT NOT NULL UNIQUE,
  parent_city_id TEXT NOT NULL,
  district_name TEXT NOT NULL,
  parent_city_name TEXT NOT NULL,
  status TEXT NOT NULL,
  district_code_effective_from TEXT NOT NULL,
  has_establishment_source INTEGER NOT NULL CHECK (has_establishment_source IN (0, 1))
) STRICT;

CREATE TABLE admin_city_document_municipal_source (
  district_ordinal INTEGER PRIMARY KEY REFERENCES admin_city_document_district(ordinal),
  url TEXT NOT NULL,
  source_as_of_or_modified TEXT,
  retrieved_on TEXT NOT NULL,
  retrieved_text_sha256 TEXT NOT NULL CHECK (length(retrieved_text_sha256) = 64),
  assertion_form TEXT NOT NULL
) STRICT;

CREATE TABLE admin_city_document_municipal_text (
  district_ordinal INTEGER NOT NULL REFERENCES admin_city_document_district(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  exact_text TEXT NOT NULL,
  PRIMARY KEY (district_ordinal, ordinal)
) STRICT;

CREATE TABLE admin_city_document_establishment_source (
  district_ordinal INTEGER PRIMARY KEY REFERENCES admin_city_document_district(ordinal),
  url TEXT NOT NULL,
  effective_date TEXT NOT NULL
) STRICT;

CREATE TABLE admin_city_document_establishment_text (
  district_ordinal INTEGER NOT NULL REFERENCES admin_city_document_establishment_source(district_ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  exact_text TEXT NOT NULL,
  PRIMARY KEY (district_ordinal, ordinal)
) STRICT;

CREATE TABLE admin_city_document_mois_identity (
  district_ordinal INTEGER PRIMARY KEY REFERENCES admin_city_document_district(ordinal),
  release_url TEXT NOT NULL,
  attachment_url TEXT NOT NULL,
  zip_sha256 TEXT NOT NULL CHECK (length(zip_sha256) = 64),
  table_name TEXT NOT NULL,
  table_sha256 TEXT NOT NULL CHECK (length(table_sha256) = 64),
  effective_date TEXT NOT NULL,
  district_code10 TEXT NOT NULL,
  city_code10 TEXT NOT NULL
) STRICT;

CREATE TABLE admin_city_document_source_row (
  district_ordinal INTEGER NOT NULL REFERENCES admin_city_document_district(ordinal),
  side TEXT NOT NULL CHECK (side IN ('district', 'city')),
  source_row INTEGER NOT NULL,
  code TEXT NOT NULL,
  province TEXT NOT NULL,
  name TEXT NOT NULL,
  dong TEXT NOT NULL,
  created TEXT NOT NULL,
  abolished TEXT NOT NULL,
  PRIMARY KEY (district_ordinal, side)
) STRICT;

CREATE TABLE admin_city_document_leaf (
  district_ordinal INTEGER NOT NULL REFERENCES admin_city_document_district(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  leaf_id TEXT NOT NULL,
  PRIMARY KEY (district_ordinal, ordinal),
  UNIQUE (leaf_id)
) STRICT;

-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE admin_city_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;
