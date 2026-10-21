-- Typed preservation of two historical editorial decision documents.
-- Prefix editorial_decision_documents_ keeps these tables beside the canonical schema.
-- Fixed fields are named columns. Ordered children are child rows.
-- Null columns are present absences. Past approval text is stored data, not a grant.
-- No JSON tree, fixed-property EAV, or source blob.

CREATE TABLE editorial_decision_documents_receipt (
  logical_path TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64 AND source_sha256 NOT GLOB '*[^0-9a-f]*'),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64 AND document_sha256 NOT GLOB '*[^0-9a-f]*'),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0)
) STRICT;

CREATE TABLE editorial_decision_documents_decision (
  logical_path TEXT PRIMARY KEY REFERENCES editorial_decision_documents_receipt(logical_path),
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  observed_date TEXT NOT NULL,
  wiki_base TEXT NOT NULL,
  game_base TEXT NOT NULL,
  graph_path TEXT NOT NULL,
  graph_sha256 TEXT NOT NULL,
  proposal_source TEXT NOT NULL,
  runtime_target TEXT,
  stage2_locked INTEGER NOT NULL CHECK (stage2_locked IN (0, 1)),
  location_recommended_station_id TEXT NOT NULL,
  location_recommended_region_id TEXT NOT NULL,
  location_facility_kind TEXT NOT NULL,
  location_approved_station_id TEXT,
  location_access_geometry TEXT,
  location_entrance_layer TEXT,
  location_total_layer_transitions TEXT,
  location_occupancy_or_access_authority TEXT,
  location_carrying_capacity TEXT,
  location_approver TEXT,
  location_approved_at TEXT,
  location_approval_url TEXT,
  route_start_station_id TEXT NOT NULL,
  route_proposed_layer_for_every_station_leg TEXT NOT NULL,
  route_proposed_station_leg_layer_transitions INTEGER NOT NULL,
  route_layer_status TEXT NOT NULL,
  route_local_access_approved INTEGER NOT NULL CHECK (route_local_access_approved IN (0, 1)),
  route_layer_path_approved INTEGER NOT NULL CHECK (route_layer_path_approved IN (0, 1)),
  route_travel_duration TEXT,
  route_transition_cost TEXT,
  squad_hero_count INTEGER NOT NULL,
  squad_proposed_soldier_count INTEGER NOT NULL,
  squad_soldier_limit INTEGER NOT NULL,
  squad_proposed_travel_stance TEXT NOT NULL,
  squad_approved_travel_stance_id TEXT,
  squad_proposed_acting_leader_slot TEXT NOT NULL,
  squad_approved_acting_leader_id TEXT
) STRICT;

CREATE TABLE editorial_decision_documents_station (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_decision(logical_path),
  leg TEXT NOT NULL CHECK (leg IN ('outbound', 'onward', 'return')),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  station_id TEXT NOT NULL,
  PRIMARY KEY (logical_path, leg, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_edge (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_decision(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  id TEXT NOT NULL,
  a TEXT NOT NULL,
  b TEXT NOT NULL,
  passage2126 TEXT NOT NULL,
  controller TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_line (
  logical_path TEXT NOT NULL,
  edge_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  line_id TEXT NOT NULL,
  PRIMARY KEY (logical_path, edge_ordinal, ordinal),
  FOREIGN KEY (logical_path, edge_ordinal) REFERENCES editorial_decision_documents_edge(logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_alternative (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_decision(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  station_id TEXT NOT NULL,
  outbound_edges INTEGER NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_alternative_station (
  logical_path TEXT NOT NULL,
  alternative_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  station_id TEXT NOT NULL,
  PRIMARY KEY (logical_path, alternative_ordinal, ordinal),
  FOREIGN KEY (logical_path, alternative_ordinal) REFERENCES editorial_decision_documents_alternative(logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_member (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_decision(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  slot TEXT NOT NULL,
  person_id TEXT,
  person_id_present INTEGER NOT NULL CHECK (person_id_present IN (0, 1)),
  name TEXT,
  name_present INTEGER NOT NULL CHECK (name_present IN (0, 1)),
  kind TEXT NOT NULL,
  role_basis TEXT NOT NULL,
  role TEXT NOT NULL,
  source_affiliation TEXT,
  source_affiliation_present INTEGER NOT NULL CHECK (source_affiliation_present IN (0, 1)),
  known_martial_art TEXT,
  known_martial_art_present INTEGER NOT NULL CHECK (known_martial_art_present IN (0, 1)),
  weapon_id TEXT,
  armor_id TEXT,
  combat_skills TEXT,
  body_condition TEXT,
  mood TEXT,
  leadership TEXT,
  command_assignment TEXT,
  approver TEXT,
  approved_at TEXT,
  url TEXT,
  PRIMARY KEY (logical_path, ordinal),
  CHECK ((person_id_present = 0) = (person_id IS NULL)),
  CHECK ((name_present = 0) = (name IS NULL)),
  CHECK ((source_affiliation_present = 0) = (source_affiliation IS NULL)),
  CHECK ((known_martial_art_present = 0) = (known_martial_art IS NULL))
) STRICT;

CREATE TABLE editorial_decision_documents_equipment (
  logical_path TEXT NOT NULL,
  member_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  item TEXT NOT NULL,
  PRIMARY KEY (logical_path, member_ordinal, ordinal),
  FOREIGN KEY (logical_path, member_ordinal) REFERENCES editorial_decision_documents_member(logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_approval_item (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_decision(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  id TEXT NOT NULL,
  scope TEXT NOT NULL,
  approved INTEGER NOT NULL CHECK (approved IN (0, 1)),
  approver TEXT,
  approved_at TEXT,
  url TEXT,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_review (
  logical_path TEXT PRIMARY KEY REFERENCES editorial_decision_documents_receipt(logical_path),
  checked_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  wiki_head_before_correction TEXT NOT NULL,
  review_workspace_path TEXT NOT NULL,
  review_sha256 TEXT NOT NULL,
  review_fetched_at TEXT NOT NULL,
  review_id INTEGER NOT NULL,
  review_html_url TEXT NOT NULL,
  review_submitted_at TEXT NOT NULL,
  review_commit_id TEXT NOT NULL,
  review_state TEXT NOT NULL,
  review_body TEXT NOT NULL,
  correction_url TEXT NOT NULL,
  correction_head TEXT NOT NULL,
  correction_inspection TEXT NOT NULL,
  editorial_path TEXT NOT NULL,
  editorial_sha256 TEXT NOT NULL,
  editorial_status TEXT NOT NULL,
  editorial_domain TEXT NOT NULL,
  editorial_blocks INTEGER NOT NULL,
  editorial_unchanged_from_head INTEGER NOT NULL CHECK (editorial_unchanged_from_head IN (0, 1)),
  editorial_location_proposal_preserved INTEGER NOT NULL CHECK (editorial_location_proposal_preserved IN (0, 1)),
  manifest_documents INTEGER NOT NULL,
  markdown_result TEXT NOT NULL
) STRICT;

CREATE TABLE editorial_decision_documents_owner_comment (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_review(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  id INTEGER NOT NULL,
  html_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_output_check (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_review(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  path TEXT NOT NULL,
  sha256 TEXT,
  sha256_present INTEGER NOT NULL CHECK (sha256_present IN (0, 1)),
  proposal_slug_absent INTEGER CHECK (proposal_slug_absent IN (0, 1)),
  proposal_slug_absent_present INTEGER NOT NULL CHECK (proposal_slug_absent_present IN (0, 1)),
  location_proposal_anchor_absent INTEGER CHECK (location_proposal_anchor_absent IN (0, 1)),
  location_proposal_anchor_absent_present INTEGER NOT NULL CHECK (location_proposal_anchor_absent_present IN (0, 1)),
  exists_value INTEGER CHECK (exists_value IN (0, 1)),
  exists_present INTEGER NOT NULL CHECK (exists_present IN (0, 1)),
  PRIMARY KEY (logical_path, ordinal),
  CHECK ((sha256_present = 0) = (sha256 IS NULL)),
  CHECK ((proposal_slug_absent_present = 0) = (proposal_slug_absent IS NULL)),
  CHECK ((location_proposal_anchor_absent_present = 0) = (location_proposal_anchor_absent IS NULL)),
  CHECK ((exists_present = 0) = (exists_value IS NULL))
) STRICT;

CREATE TABLE editorial_decision_documents_limitation (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_review(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  text TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE editorial_decision_documents_markdown_path (
  logical_path TEXT NOT NULL REFERENCES editorial_decision_documents_review(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  path TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;
