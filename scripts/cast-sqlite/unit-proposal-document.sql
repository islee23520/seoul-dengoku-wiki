-- Bounded preservation of lore/name-pools/unit-roster.json.
-- Every new table is prefixed unit_proposal_document_ so it cannot collide
-- with the canonical cast schema. Values live only in named typed columns.
-- unit_proposal_document_key stores authored object presence and key order,
-- never a scalar value. Sparse GURPS keys and attribute keys are presence
-- flags plus typed columns, not an EAV value store or a JSON blob.
CREATE TABLE unit_proposal_document_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0)
) STRICT;

CREATE TABLE unit_proposal_document (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;

CREATE TABLE unit_proposal_document_design (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  mechanics TEXT NOT NULL,
  resolution TEXT NOT NULL,
  rules_owner TEXT NOT NULL,
  legacy_fields TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_owner_decision (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  decision TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_squad (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  commander TEXT NOT NULL,
  members TEXT NOT NULL,
  max_squads_per_settlement TEXT NOT NULL,
  npc_matching TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_recruitment_source (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  source TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_unit (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  max_size INTEGER NOT NULL,
  base_size INTEGER NOT NULL,
  commander_skill TEXT NOT NULL,
  battle_role TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_unit_string (
  unit_ordinal INTEGER NOT NULL REFERENCES unit_proposal_document_unit(ordinal),
  list_kind TEXT NOT NULL CHECK (list_kind IN ('martial_any', 'occupation_any', 'equipment')),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (unit_ordinal, list_kind, ordinal)
) STRICT;

CREATE TABLE unit_proposal_document_attribute (
  unit_ordinal INTEGER NOT NULL REFERENCES unit_proposal_document_unit(ordinal),
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('member', 'commander')),
  st_present INTEGER NOT NULL CHECK (st_present IN (0, 1)),
  dx_present INTEGER NOT NULL CHECK (dx_present IN (0, 1)),
  iq_present INTEGER NOT NULL CHECK (iq_present IN (0, 1)),
  ht_present INTEGER NOT NULL CHECK (ht_present IN (0, 1)),
  st INTEGER,
  dx INTEGER,
  iq INTEGER,
  ht INTEGER,
  PRIMARY KEY (unit_ordinal, owner_kind),
  CHECK (st_present = 1 OR st IS NULL),
  CHECK (dx_present = 1 OR dx IS NULL),
  CHECK (iq_present = 1 OR iq IS NULL),
  CHECK (ht_present = 1 OR ht IS NULL)
) STRICT;

CREATE TABLE unit_proposal_document_gurps (
  unit_ordinal INTEGER PRIMARY KEY REFERENCES unit_proposal_document_unit(ordinal),
  attack_present INTEGER NOT NULL CHECK (attack_present IN (0, 1)),
  defense_present INTEGER NOT NULL CHECK (defense_present IN (0, 1)),
  damage_present INTEGER NOT NULL CHECK (damage_present IN (0, 1)),
  dr_target_present INTEGER NOT NULL CHECK (dr_target_present IN (0, 1)),
  special_present INTEGER NOT NULL CHECK (special_present IN (0, 1)),
  range_present INTEGER NOT NULL CHECK (range_present IN (0, 1)),
  ammo_present INTEGER NOT NULL CHECK (ammo_present IN (0, 1)),
  movement_present INTEGER NOT NULL CHECK (movement_present IN (0, 1)),
  stealth_present INTEGER NOT NULL CHECK (stealth_present IN (0, 1)),
  gurps_skill_present INTEGER NOT NULL CHECK (gurps_skill_present IN (0, 1)),
  effect_present INTEGER NOT NULL CHECK (effect_present IN (0, 1)),
  loyalty_present INTEGER NOT NULL CHECK (loyalty_present IN (0, 1)),
  attack TEXT,
  defense TEXT,
  damage TEXT,
  dr_target TEXT,
  special TEXT,
  range TEXT,
  ammo TEXT,
  movement TEXT,
  stealth TEXT,
  gurps_skill TEXT,
  effect TEXT,
  loyalty TEXT,
  CHECK (attack_present = 1 OR attack IS NULL),
  CHECK (defense_present = 1 OR defense IS NULL),
  CHECK (damage_present = 1 OR damage IS NULL),
  CHECK (dr_target_present = 1 OR dr_target IS NULL),
  CHECK (special_present = 1 OR special IS NULL),
  CHECK (range_present = 1 OR range IS NULL),
  CHECK (ammo_present = 1 OR ammo IS NULL),
  CHECK (movement_present = 1 OR movement IS NULL),
  CHECK (stealth_present = 1 OR stealth IS NULL),
  CHECK (gurps_skill_present = 1 OR gurps_skill IS NULL),
  CHECK (effect_present = 1 OR effect IS NULL),
  CHECK (loyalty_present = 1 OR loyalty IS NULL)
) STRICT;

CREATE TABLE unit_proposal_document_settlement (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  principle TEXT NOT NULL,
  auto_description TEXT NOT NULL,
  auto_example TEXT NOT NULL,
  scale_major TEXT NOT NULL,
  scale_medium TEXT NOT NULL,
  scale_minor TEXT NOT NULL,
  scale_outpost TEXT NOT NULL,
  squad_cohesion TEXT NOT NULL,
  morale TEXT NOT NULL,
  fatigue TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_hero (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  note TEXT NOT NULL,
  hero_role TEXT NOT NULL
) STRICT;

CREATE TABLE unit_proposal_document_hero_class (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  class_name TEXT NOT NULL
) STRICT;
