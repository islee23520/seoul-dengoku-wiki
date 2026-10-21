-- Bounded typed preservation of lore/editorial/Character-System-Contract.json.
-- Statuses and approval references are stored data, not a new approval.
CREATE TABLE character_contract_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 NOT GLOB '*[^0-9a-f]*'),
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  approval_ref TEXT NOT NULL,
  ratings_base_minimum INTEGER NOT NULL,
  ratings_base_maximum INTEGER NOT NULL,
  ratings_base_integer INTEGER NOT NULL CHECK(ratings_base_integer IN (0,1)),
  ratings_effective_minimum INTEGER NOT NULL,
  ratings_effective_maximum INTEGER NOT NULL,
  ratings_effective_integer INTEGER NOT NULL CHECK(ratings_effective_integer IN (0,1)),
  ratings_effective_cap_after_all_effects INTEGER NOT NULL CHECK(ratings_effective_cap_after_all_effects IN (0,1)),
  ratings_base_separate_from_effects INTEGER NOT NULL CHECK(ratings_base_separate_from_effects IN (0,1)),
  ratings_base_reference_value INTEGER NOT NULL,
  ratings_base_reference_meaning TEXT NOT NULL,
  ratings_opening_effective_above_twenty TEXT NOT NULL,
  ratings_bands TEXT CHECK(ratings_bands IS NULL),
  ratings_resolution_formula TEXT CHECK(ratings_resolution_formula IS NULL),
  ratings_effect_composition_formula TEXT CHECK(ratings_effect_composition_formula IS NULL),
  ratings_legacy_conversion TEXT NOT NULL,
  skills_separate_from_abilities INTEGER NOT NULL CHECK(skills_separate_from_abilities IN (0,1)),
  skills_require_narrative_evidence INTEGER NOT NULL CHECK(skills_require_narrative_evidence IN (0,1)),
  skills_grant_from_title_or_affiliation INTEGER NOT NULL CHECK(skills_grant_from_title_or_affiliation IN (0,1)),
  skills_rating_scale_minimum REAL NOT NULL,
  skills_rating_scale_maximum REAL NOT NULL,
  skills_rating_scale_decimal_places INTEGER NOT NULL,
  skills_unknown_distinct_from_zero INTEGER NOT NULL CHECK(skills_unknown_distinct_from_zero IN (0,1)),
  skills_avoid_double_counting_prowess INTEGER NOT NULL CHECK(skills_avoid_double_counting_prowess IN (0,1)),
  traits_core_disposition_changes_slowly INTEGER NOT NULL CHECK(traits_core_disposition_changes_slowly IN (0,1)),
  traits_experience_changes_traits_and_state INTEGER NOT NULL CHECK(traits_experience_changes_traits_and_state IN (0,1)),
  traits_special_opportunity_effects TEXT NOT NULL,
  traits_catalog TEXT CHECK(traits_catalog IS NULL),
  health_separate_injury_severity_and_function INTEGER NOT NULL CHECK(health_separate_injury_severity_and_function IN (0,1)),
  health_separate_disease_progression_and_part_injury INTEGER NOT NULL CHECK(health_separate_disease_progression_and_part_injury IN (0,1)),
  health_shared_state_for_combat_and_disease INTEGER NOT NULL CHECK(health_shared_state_for_combat_and_disease IN (0,1)),
  health_severity_vocabulary TEXT CHECK(health_severity_vocabulary IS NULL),
  health_function_vocabulary TEXT CHECK(health_function_vocabulary IS NULL),
  soul_minimum_per_person INTEGER NOT NULL,
  soul_maximum_per_person INTEGER NOT NULL,
  soul_visibility TEXT NOT NULL,
  soul_assignment_ledger TEXT NOT NULL,
  soul_narrative_fit_before_duplicate_minimization INTEGER NOT NULL CHECK(soul_narrative_fit_before_duplicate_minimization IN (0,1)),
  soul_composite_does_not_automatically_sum_ratings INTEGER NOT NULL CHECK(soul_composite_does_not_automatically_sum_ratings IN (0,1)),
  soul_historical_and_romance_sources_distinct INTEGER NOT NULL CHECK(soul_historical_and_romance_sources_distinct IN (0,1)),
  soul_existing_narrative_identity_preserved INTEGER NOT NULL CHECK(soul_existing_narrative_identity_preserved IN (0,1)),
  publication_show_ratings_skills_traits_and_narrative INTEGER NOT NULL CHECK(publication_show_ratings_skills_traits_and_narrative IN (0,1)),
  publication_exclude_soul_and_historical_motifs INTEGER NOT NULL CHECK(publication_exclude_soul_and_historical_motifs IN (0,1)),
  publication_projection_policy TEXT NOT NULL,
  opening_allocation_method TEXT NOT NULL,
  opening_allocation_copy_same_ratings_for_same_soul INTEGER NOT NULL CHECK(opening_allocation_copy_same_ratings_for_same_soul IN (0,1)),
  opening_allocation_record_evidence_and_approval_status INTEGER NOT NULL CHECK(opening_allocation_record_evidence_and_approval_status IN (0,1)),
  scope_remove_martial_arts_and_wuxia INTEGER NOT NULL CHECK(scope_remove_martial_arts_and_wuxia IN (0,1)),
  scope_redesign_wuxia_dependent_organizations INTEGER NOT NULL CHECK(scope_redesign_wuxia_dependent_organizations IN (0,1)),
  scope_allow_heroic_combatants INTEGER NOT NULL CHECK(scope_allow_heroic_combatants IN (0,1)),
  scope_preserve_sealed_historical_records INTEGER NOT NULL CHECK(scope_preserve_sealed_historical_records IN (0,1)),
  pending TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64 AND receipt_sha256 NOT GLOB '*[^0-9a-f]*')
) STRICT;
CREATE TABLE character_contract_document_ability (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  id TEXT NOT NULL UNIQUE,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  scope TEXT NOT NULL
) STRICT;
CREATE TABLE character_contract_document_effect_source (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  source TEXT NOT NULL
) STRICT;
CREATE TABLE character_contract_document_trait_affect (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  affect TEXT NOT NULL
) STRICT;
CREATE TABLE character_contract_document_trait_acquisition (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  acquisition TEXT NOT NULL
) STRICT;
CREATE TABLE character_contract_document_body_part (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  body_part TEXT NOT NULL
) STRICT;
CREATE TABLE character_contract_document_candidate_period (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  period TEXT NOT NULL
) STRICT;
