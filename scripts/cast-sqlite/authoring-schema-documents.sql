-- JSON Schema vocabulary, not a general JSON document store.
CREATE TABLE authoring_schema_receipt (logical_path TEXT PRIMARY KEY, source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL) STRICT;
CREATE TABLE authoring_schema_node (logical_path TEXT NOT NULL REFERENCES authoring_schema_receipt(logical_path), node_id INTEGER NOT NULL CHECK(node_id>=0), boolean_schema INTEGER CHECK(boolean_schema IN (0,1)),
schema_uri TEXT,
schema_identifier TEXT,
reference TEXT,
title TEXT,
description TEXT,
pattern TEXT,
format TEXT,
min_length INTEGER CHECK(min_length>=0),
min_items INTEGER CHECK(min_items>=0),
max_items INTEGER CHECK(max_items>=0),
min_properties INTEGER CHECK(min_properties>=0),
minimum REAL,
maximum REAL,
unique_items INTEGER CHECK(unique_items IN (0,1)),
deprecated INTEGER CHECK(deprecated IN (0,1)),
type_is_array INTEGER CHECK(type_is_array IN (0,1)),
items_schema INTEGER,
additional_properties_schema INTEGER,
if_schema INTEGER,
then_schema INTEGER,
else_schema INTEGER,
not_schema INTEGER,
PRIMARY KEY(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_keyword_order (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), keyword TEXT NOT NULL CHECK(keyword IN ('$schema','$id','allOf','$ref','type','properties','const','pattern','minLength','additionalProperties','if','else','required','$defs','minItems','items','minimum','enum','oneOf','maximum','then','deprecated','description','patternProperties','not','anyOf','uniqueItems','title','maxItems','prefixItems','format','minProperties')), PRIMARY KEY(logical_path,node_id,ordinal), UNIQUE(logical_path,node_id,keyword), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_property (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL, child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_definition (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL, child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_pattern_property (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL, child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_all_of (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_any_of (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_one_of (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_prefix_item (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), child_id INTEGER NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id), FOREIGN KEY(logical_path,child_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_required (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL, PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_type (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), name TEXT NOT NULL CHECK(name IN ('object','array','string','number','integer','boolean','null')), PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_enum (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), value_kind TEXT NOT NULL CHECK(value_kind IN ('string','number','boolean','null')), text_value TEXT, number_value REAL, boolean_value INTEGER CHECK(boolean_value IN (0,1)), CHECK((value_kind='string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL) OR (value_kind='number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL) OR (value_kind='boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL) OR (value_kind='null' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL)), PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
CREATE TABLE authoring_schema_const (logical_path TEXT NOT NULL, node_id INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0) CHECK(ordinal=0), value_kind TEXT NOT NULL CHECK(value_kind IN ('string','number','boolean','null')), text_value TEXT, number_value REAL, boolean_value INTEGER CHECK(boolean_value IN (0,1)), CHECK((value_kind='string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL) OR (value_kind='number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL) OR (value_kind='boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL) OR (value_kind='null' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL)), PRIMARY KEY(logical_path,node_id,ordinal), FOREIGN KEY(logical_path,node_id) REFERENCES authoring_schema_node(logical_path,node_id)) STRICT;
