CREATE TABLE boundary_geometry_source (
  source_path TEXT PRIMARY KEY, sha256 TEXT NOT NULL, collection_type TEXT NOT NULL
) STRICT;
CREATE TABLE boundary_geometry_feature (
  id TEXT PRIMARY KEY, ordinal INTEGER NOT NULL UNIQUE, feature_type TEXT NOT NULL,
  geometry_type TEXT NOT NULL CHECK(geometry_type IN ('Polygon','MultiPolygon')),
  kind TEXT NOT NULL, source_edition TEXT NOT NULL, official_code TEXT, official_name TEXT,
  dong_id TEXT, electoral_dong_id TEXT, county_title_id TEXT, gu_id TEXT, name TEXT
) STRICT;
CREATE TABLE boundary_geometry_property (
  feature_id TEXT NOT NULL REFERENCES boundary_geometry_feature(id), ordinal INTEGER NOT NULL,
  name TEXT NOT NULL, PRIMARY KEY(feature_id,ordinal), UNIQUE(feature_id,name)
) STRICT;
CREATE TABLE boundary_geometry_dong (
  feature_id TEXT NOT NULL REFERENCES boundary_geometry_feature(id), ordinal INTEGER NOT NULL,
  code TEXT NOT NULL, PRIMARY KEY(feature_id,ordinal)
) STRICT;
CREATE TABLE boundary_geometry_gu (
  feature_id TEXT NOT NULL REFERENCES boundary_geometry_feature(id), ordinal INTEGER NOT NULL,
  gu_ref TEXT NOT NULL, PRIMARY KEY(feature_id,ordinal)
) STRICT;
CREATE TABLE boundary_geometry_polygon (
  feature_id TEXT NOT NULL REFERENCES boundary_geometry_feature(id), ordinal INTEGER NOT NULL,
  PRIMARY KEY(feature_id,ordinal)
) STRICT;
CREATE TABLE boundary_geometry_ring (
  feature_id TEXT NOT NULL, polygon_ordinal INTEGER NOT NULL, ordinal INTEGER NOT NULL,
  PRIMARY KEY(feature_id,polygon_ordinal,ordinal),
  FOREIGN KEY(feature_id,polygon_ordinal) REFERENCES boundary_geometry_polygon(feature_id,ordinal)
) STRICT;
CREATE TABLE boundary_geometry_point (
  feature_id TEXT NOT NULL, polygon_ordinal INTEGER NOT NULL, ring_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL, longitude REAL NOT NULL, latitude REAL NOT NULL,
  PRIMARY KEY(feature_id,polygon_ordinal,ring_ordinal,ordinal),
  FOREIGN KEY(feature_id,polygon_ordinal,ring_ordinal) REFERENCES boundary_geometry_ring(feature_id,polygon_ordinal,ordinal)
) STRICT;
