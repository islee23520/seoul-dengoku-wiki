-- Bounded full authored family-role source. Values live only in named domain columns.
CREATE TABLE family_role_document_import (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL,
 schema_version INTEGER NOT NULL, authorization TEXT NOT NULL,
 actor TEXT NOT NULL CHECK(length(trim(actor))>0),
 reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
-- Object presence and authored key order only; never a scalar value store.
CREATE TABLE family_role_document_key (
 object_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL,
 PRIMARY KEY(object_path,ordinal), UNIQUE(object_path,key)
) STRICT;
CREATE TABLE family_role_final_owner_role (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 edge_id TEXT NOT NULL,
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL,
 parent_role TEXT NOT NULL,
 decision_kind TEXT NOT NULL,
 selection_ref TEXT NOT NULL,
 basis TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_external_maternal_ancestor (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 node_id TEXT NOT NULL,
 child_id TEXT NOT NULL,
 edge_id TEXT NOT NULL,
 before_name TEXT NOT NULL,
 before_lineage TEXT CHECK(before_lineage IS NULL),
 proposed_after_name TEXT NOT NULL,
 proposed_after_surname TEXT NOT NULL,
 proposed_after_bongwan TEXT NOT NULL,
 proposed_after_clan TEXT NOT NULL,
 given_name TEXT NOT NULL,
 birth_date TEXT NOT NULL,
 death_date TEXT CHECK(death_date IS NULL),
 existing_role TEXT,
 proposed_role TEXT NOT NULL,
 source_status TEXT NOT NULL,
 name_collision INTEGER NOT NULL CHECK(name_collision IN (0,1)),
 name_collision_meaning TEXT NOT NULL,
 mother_id TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_confirmed_father_role (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_owner_role_only (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 edge_id TEXT NOT NULL,
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL,
 parent_role TEXT NOT NULL,
 basis TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_recursive_ancestor_correction (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 edge_id TEXT NOT NULL,
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL,
 before TEXT CHECK(before IS NULL),
 after TEXT NOT NULL,
 category TEXT NOT NULL,
 lineage_surname TEXT NOT NULL,
 lineage_bongwan TEXT NOT NULL,
 lineage_clan TEXT NOT NULL,
 basis TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_source_bound_correction (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 edge_id TEXT NOT NULL,
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL,
 before TEXT CHECK(before IS NULL),
 after TEXT NOT NULL,
 category TEXT NOT NULL,
 basis TEXT
) STRICT;
CREATE TABLE family_role_maternal_correction (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 child_id TEXT NOT NULL,
 father_id TEXT NOT NULL,
 mother_id TEXT NOT NULL,
 before_mother_name TEXT NOT NULL,
 before_mother_surname TEXT NOT NULL,
 before_mother_bongwan TEXT CHECK(before_mother_bongwan IS NULL),
 after_mother_name TEXT NOT NULL,
 after_mother_surname TEXT NOT NULL,
 after_mother_bongwan TEXT NOT NULL,
 after_mother_clan TEXT NOT NULL,
 father_line_surname TEXT NOT NULL,
 father_line_bongwan TEXT NOT NULL,
 father_line_clan TEXT NOT NULL,
 basis TEXT NOT NULL
) STRICT;
CREATE TABLE family_role_derived_parent_role (
 ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
 edge_id TEXT NOT NULL,
 "from" TEXT NOT NULL,
 "to" TEXT NOT NULL,
 parent_role TEXT NOT NULL,
 lineage_surname TEXT,
 lineage_bongwan TEXT,
 lineage_clan TEXT
) STRICT;
CREATE TABLE family_role_external_ancestor_source (
 parent_ordinal INTEGER NOT NULL REFERENCES family_role_external_maternal_ancestor(ordinal),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 path TEXT NOT NULL,
 anchor TEXT,
 PRIMARY KEY(parent_ordinal,ordinal)
) STRICT;
CREATE TABLE family_role_external_ancestor_node_reference (
 parent_ordinal INTEGER NOT NULL REFERENCES family_role_external_maternal_ancestor(ordinal),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 reference TEXT NOT NULL,
 PRIMARY KEY(parent_ordinal,ordinal)
) STRICT;
CREATE TABLE family_role_external_ancestor_timeline (
 parent_ordinal INTEGER NOT NULL REFERENCES family_role_external_maternal_ancestor(ordinal),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 pointer TEXT NOT NULL,
 before TEXT NOT NULL,
 proposed_after TEXT NOT NULL,
 PRIMARY KEY(parent_ordinal,ordinal)
) STRICT;
CREATE TABLE family_role_recursive_ancestor_source (
 parent_ordinal INTEGER NOT NULL REFERENCES family_role_recursive_ancestor_correction(ordinal),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 path TEXT NOT NULL,
 anchor TEXT,
 PRIMARY KEY(parent_ordinal,ordinal)
) STRICT;
CREATE TABLE family_role_source_bound_source (
 parent_ordinal INTEGER NOT NULL REFERENCES family_role_source_bound_correction(ordinal),
 ordinal INTEGER NOT NULL CHECK(ordinal>=0),
 path TEXT NOT NULL,
 anchor TEXT,
 PRIMARY KEY(parent_ordinal,ordinal)
) STRICT;
