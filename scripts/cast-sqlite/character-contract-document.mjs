import { createHash } from 'node:crypto';

const fields = ['schema','status','approvalRef','abilities','ratings','skills','traits','health','soul','publication','openingAllocation','scope','pending'];
const abilityFields = ['id','name','scope'];
const nameFields = ['ko','en'];
const ratingsFields = ['base','effective','baseSeparateFromEffects','baseReference','openingEffectiveAboveTwenty','sourcesOfEffects','bands','resolutionFormula','effectCompositionFormula','legacyConversion'];
const baseFields = ['minimum','maximum','integer'];
const effectiveFields = ['minimum','maximum','integer','capAfterAllEffects'];
const referenceFields = ['value','meaning'];
const skillsFields = ['separateFromAbilities','requireNarrativeEvidence','grantFromTitleOrAffiliation','ratingScale','unknownDistinctFromZero','avoidDoubleCountingProwess'];
const scaleFields = ['minimum','maximum','decimalPlaces'];
const traitsFields = ['affect','coreDispositionChangesSlowly','experienceChangesTraitsAndState','acquisition','specialOpportunityEffects','catalog'];
const healthFields = ['bodyParts','separateInjurySeverityAndFunction','separateDiseaseProgressionAndPartInjury','sharedStateForCombatAndDisease','severityVocabulary','functionVocabulary'];
const soulFields = ['minimumPerPerson','maximumPerPerson','visibility','assignmentLedger','additionalCandidatePeriods','narrativeFitBeforeDuplicateMinimization','compositeDoesNotAutomaticallySumRatings','historicalAndRomanceSourcesDistinct','existingNarrativeIdentityPreserved'];
const publicationFields = ['showRatingsSkillsTraitsAndNarrative','excludeSoulAndHistoricalMotifs','projectionPolicy'];
const openingFields = ['method','copySameRatingsForSameSoul','recordEvidenceAndApprovalStatus'];
const scopeFields = ['removeMartialArtsAndWuxia','redesignWuxiaDependentOrganizations','allowHeroicCombatants','preserveSealedHistoricalRecords'];
const lists = [
  ['ratings.sourcesOfEffects','character_contract_document_effect_source','source',3],
  ['traits.affect','character_contract_document_trait_affect','affect',4],
  ['traits.acquisition','character_contract_document_trait_acquisition','acquisition',2],
  ['health.bodyParts','character_contract_document_body_part','body_part',6],
  ['soul.additionalCandidatePeriods','character_contract_document_candidate_period','period',2],
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CHARACTER_CONTRACT_DOCUMENT: ${detail}`), { code: 'E_CHARACTER_CONTRACT_DOCUMENT' }); };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const bit = value => value ? 1 : 0;
const flag = value => value === 1;
function keys(value, expected) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || !same(Object.keys(value), expected)) fail('unknown, missing, or unordered fields');
}
function strings(value, count) {
  if (!Array.isArray(value) || value.length !== count || value.some(entry => typeof entry !== 'string')) fail('list shape');
}
function integer(value) {
  if (!Number.isSafeInteger(value)) fail('integer shape');
}
function shape(document) {
  keys(document, fields);
  if (![document.schema, document.status, document.approvalRef, document.pending].every(value => typeof value === 'string')) fail('root strings');
  if (!Array.isArray(document.abilities) || document.abilities.length !== 8) fail('abilities');
  for (const ability of document.abilities) {
    keys(ability, abilityFields);
    keys(ability.name, nameFields);
    if (typeof ability.id !== 'string' || typeof ability.name.ko !== 'string' || typeof ability.name.en !== 'string' || typeof ability.scope !== 'string') fail('ability shape');
  }
  keys(document.ratings, ratingsFields);
  keys(document.ratings.base, baseFields);
  keys(document.ratings.effective, effectiveFields);
  keys(document.ratings.baseReference, referenceFields);
  integer(document.ratings.base.minimum); integer(document.ratings.base.maximum); integer(document.ratings.effective.minimum); integer(document.ratings.effective.maximum); integer(document.ratings.baseReference.value);
  if (![document.ratings.base.integer, document.ratings.effective.integer, document.ratings.effective.capAfterAllEffects, document.ratings.baseSeparateFromEffects].every(value => typeof value === 'boolean')) fail('rating flags');
  if (typeof document.ratings.openingEffectiveAboveTwenty !== 'string' || typeof document.ratings.legacyConversion !== 'string' || typeof document.ratings.baseReference.meaning !== 'string') fail('rating strings');
  strings(document.ratings.sourcesOfEffects, 3);
  if (![document.ratings.bands, document.ratings.resolutionFormula, document.ratings.effectCompositionFormula].every(value => value === null)) fail('rating nulls');
  keys(document.skills, skillsFields);
  keys(document.skills.ratingScale, scaleFields);
  if (![document.skills.separateFromAbilities, document.skills.requireNarrativeEvidence, document.skills.grantFromTitleOrAffiliation, document.skills.unknownDistinctFromZero, document.skills.avoidDoubleCountingProwess].every(value => typeof value === 'boolean')) fail('skill flags');
  integer(document.skills.ratingScale.minimum); integer(document.skills.ratingScale.decimalPlaces);
  if (typeof document.skills.ratingScale.maximum !== 'number' || !Number.isFinite(document.skills.ratingScale.maximum)) fail('skill scale');
  keys(document.traits, traitsFields);
  strings(document.traits.affect, 4); strings(document.traits.acquisition, 2);
  if (typeof document.traits.coreDispositionChangesSlowly !== 'boolean' || typeof document.traits.experienceChangesTraitsAndState !== 'boolean' || typeof document.traits.specialOpportunityEffects !== 'string' || document.traits.catalog !== null) fail('traits');
  keys(document.health, healthFields);
  strings(document.health.bodyParts, 6);
  if (![document.health.separateInjurySeverityAndFunction, document.health.separateDiseaseProgressionAndPartInjury, document.health.sharedStateForCombatAndDisease].every(value => typeof value === 'boolean') || document.health.severityVocabulary !== null || document.health.functionVocabulary !== null) fail('health');
  keys(document.soul, soulFields);
  integer(document.soul.minimumPerPerson); integer(document.soul.maximumPerPerson);
  strings(document.soul.additionalCandidatePeriods, 2);
  if (typeof document.soul.visibility !== 'string' || typeof document.soul.assignmentLedger !== 'string' || ![document.soul.narrativeFitBeforeDuplicateMinimization, document.soul.compositeDoesNotAutomaticallySumRatings, document.soul.historicalAndRomanceSourcesDistinct, document.soul.existingNarrativeIdentityPreserved].every(value => typeof value === 'boolean')) fail('soul');
  keys(document.publication, publicationFields);
  if (typeof document.publication.showRatingsSkillsTraitsAndNarrative !== 'boolean' || typeof document.publication.excludeSoulAndHistoricalMotifs !== 'boolean' || typeof document.publication.projectionPolicy !== 'string') fail('publication');
  keys(document.openingAllocation, openingFields);
  if (typeof document.openingAllocation.method !== 'string' || typeof document.openingAllocation.copySameRatingsForSameSoul !== 'boolean' || typeof document.openingAllocation.recordEvidenceAndApprovalStatus !== 'boolean') fail('opening allocation');
  keys(document.scope, scopeFields);
  if (![document.scope.removeMartialArtsAndWuxia, document.scope.redesignWuxiaDependentOrganizations, document.scope.allowHeroicCombatants, document.scope.preserveSealedHistoricalRecords].every(value => typeof value === 'boolean')) fail('scope');
}
const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));
const ordered = (rows, count, table) => {
  if (rows.length !== count || rows.some((row, index) => row.ordinal !== index)) fail(`${table} coverage`);
  return rows;
};

/** Import exactly the bounded source. Status and approval references stay data; this grants no approval. */
export function initializeCharacterContractDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)
    || Object.keys(arguments[1] ?? {}).some(key => !['schemaSql','sourceBytes','actor','reason'].includes(key))) fail('input');
  if (db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'character_contract_document%'").get().n) fail('already initialized');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  const ratings = document.ratings, skills = document.skills, traits = document.traits, health = document.health, soul = document.soul;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare(`INSERT INTO character_contract_document VALUES (${Array(59).fill('?').join(',')})`).run(
      1, sourceHash, document.schema, document.status, document.approvalRef,
      ratings.base.minimum, ratings.base.maximum, bit(ratings.base.integer),
      ratings.effective.minimum, ratings.effective.maximum, bit(ratings.effective.integer), bit(ratings.effective.capAfterAllEffects),
      bit(ratings.baseSeparateFromEffects), ratings.baseReference.value, ratings.baseReference.meaning,
      ratings.openingEffectiveAboveTwenty, null, null, null, ratings.legacyConversion,
      bit(skills.separateFromAbilities), bit(skills.requireNarrativeEvidence), bit(skills.grantFromTitleOrAffiliation),
      skills.ratingScale.minimum, skills.ratingScale.maximum, skills.ratingScale.decimalPlaces,
      bit(skills.unknownDistinctFromZero), bit(skills.avoidDoubleCountingProwess),
      bit(traits.coreDispositionChangesSlowly), bit(traits.experienceChangesTraitsAndState), traits.specialOpportunityEffects, null,
      bit(health.separateInjurySeverityAndFunction), bit(health.separateDiseaseProgressionAndPartInjury), bit(health.sharedStateForCombatAndDisease), null, null,
      soul.minimumPerPerson, soul.maximumPerPerson, soul.visibility, soul.assignmentLedger,
      bit(soul.narrativeFitBeforeDuplicateMinimization), bit(soul.compositeDoesNotAutomaticallySumRatings), bit(soul.historicalAndRomanceSourcesDistinct), bit(soul.existingNarrativeIdentityPreserved),
      bit(document.publication.showRatingsSkillsTraitsAndNarrative), bit(document.publication.excludeSoulAndHistoricalMotifs), document.publication.projectionPolicy,
      document.openingAllocation.method, bit(document.openingAllocation.copySameRatingsForSameSoul), bit(document.openingAllocation.recordEvidenceAndApprovalStatus),
      bit(document.scope.removeMartialArtsAndWuxia), bit(document.scope.redesignWuxiaDependentOrganizations), bit(document.scope.allowHeroicCombatants), bit(document.scope.preserveSealedHistoricalRecords),
      document.pending, actor, reason, receipt(sourceHash, documentHash, actor, reason),
    );
    document.abilities.forEach((ability, ordinal) => db.prepare('INSERT INTO character_contract_document_ability VALUES (?,?,?,?,?)').run(ordinal, ability.id, ability.name.ko, ability.name.en, ability.scope));
    document.ratings.sourcesOfEffects.forEach((source, ordinal) => db.prepare('INSERT INTO character_contract_document_effect_source VALUES (?,?)').run(ordinal, source));
    document.traits.affect.forEach((affect, ordinal) => db.prepare('INSERT INTO character_contract_document_trait_affect VALUES (?,?)').run(ordinal, affect));
    document.traits.acquisition.forEach((acquisition, ordinal) => db.prepare('INSERT INTO character_contract_document_trait_acquisition VALUES (?,?)').run(ordinal, acquisition));
    document.health.bodyParts.forEach((part, ordinal) => db.prepare('INSERT INTO character_contract_document_body_part VALUES (?,?)').run(ordinal, part));
    document.soul.additionalCandidatePeriods.forEach((period, ordinal) => db.prepare('INSERT INTO character_contract_document_candidate_period VALUES (?,?)').run(ordinal, period));
    const stored = readCharacterContractDocument(db);
    if (!same(stored, document) || hash(JSON.stringify(stored)) !== documentHash) fail('precommit mismatch');
    db.exec('COMMIT');
    return { documents: 1, abilities: 8, effectSources: 3, traitAffects: 4, traitAcquisitions: 2, bodyParts: 6, candidatePeriods: 2, totalRows: 26 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only reconstruction. No source I/O, archive decoding, JSON parsing, or writes. */
export function readCharacterContractDocument(db) {
  const rows = db.prepare('SELECT * FROM character_contract_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1 || typeof row.actor !== 'string' || !row.actor.trim()
    || typeof row.reason !== 'string' || !row.reason.trim()) fail('provenance');
  const list = (table, column, count) => ordered(db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all(), count, table).map(entry => entry[column]);
  const abilities = ordered(db.prepare('SELECT * FROM character_contract_document_ability ORDER BY ordinal').all(), 8, 'character_contract_document_ability')
    .map(ability => ({ id: ability.id, name: { ko: ability.name_ko, en: ability.name_en }, scope: ability.scope }));
  const document = {
    schema: row.schema, status: row.status, approvalRef: row.approval_ref, abilities,
    ratings: {
      base: { minimum: row.ratings_base_minimum, maximum: row.ratings_base_maximum, integer: flag(row.ratings_base_integer) },
      effective: { minimum: row.ratings_effective_minimum, maximum: row.ratings_effective_maximum, integer: flag(row.ratings_effective_integer), capAfterAllEffects: flag(row.ratings_effective_cap_after_all_effects) },
      baseSeparateFromEffects: flag(row.ratings_base_separate_from_effects),
      baseReference: { value: row.ratings_base_reference_value, meaning: row.ratings_base_reference_meaning },
      openingEffectiveAboveTwenty: row.ratings_opening_effective_above_twenty,
      sourcesOfEffects: list('character_contract_document_effect_source', 'source', 3),
      bands: row.ratings_bands, resolutionFormula: row.ratings_resolution_formula, effectCompositionFormula: row.ratings_effect_composition_formula,
      legacyConversion: row.ratings_legacy_conversion,
    },
    skills: {
      separateFromAbilities: flag(row.skills_separate_from_abilities), requireNarrativeEvidence: flag(row.skills_require_narrative_evidence),
      grantFromTitleOrAffiliation: flag(row.skills_grant_from_title_or_affiliation),
      ratingScale: { minimum: row.skills_rating_scale_minimum, maximum: row.skills_rating_scale_maximum, decimalPlaces: row.skills_rating_scale_decimal_places },
      unknownDistinctFromZero: flag(row.skills_unknown_distinct_from_zero), avoidDoubleCountingProwess: flag(row.skills_avoid_double_counting_prowess),
    },
    traits: {
      affect: list('character_contract_document_trait_affect', 'affect', 4),
      coreDispositionChangesSlowly: flag(row.traits_core_disposition_changes_slowly),
      experienceChangesTraitsAndState: flag(row.traits_experience_changes_traits_and_state),
      acquisition: list('character_contract_document_trait_acquisition', 'acquisition', 2),
      specialOpportunityEffects: row.traits_special_opportunity_effects, catalog: row.traits_catalog,
    },
    health: {
      bodyParts: list('character_contract_document_body_part', 'body_part', 6),
      separateInjurySeverityAndFunction: flag(row.health_separate_injury_severity_and_function),
      separateDiseaseProgressionAndPartInjury: flag(row.health_separate_disease_progression_and_part_injury),
      sharedStateForCombatAndDisease: flag(row.health_shared_state_for_combat_and_disease),
      severityVocabulary: row.health_severity_vocabulary, functionVocabulary: row.health_function_vocabulary,
    },
    soul: {
      minimumPerPerson: row.soul_minimum_per_person, maximumPerPerson: row.soul_maximum_per_person,
      visibility: row.soul_visibility, assignmentLedger: row.soul_assignment_ledger,
      additionalCandidatePeriods: list('character_contract_document_candidate_period', 'period', 2),
      narrativeFitBeforeDuplicateMinimization: flag(row.soul_narrative_fit_before_duplicate_minimization),
      compositeDoesNotAutomaticallySumRatings: flag(row.soul_composite_does_not_automatically_sum_ratings),
      historicalAndRomanceSourcesDistinct: flag(row.soul_historical_and_romance_sources_distinct),
      existingNarrativeIdentityPreserved: flag(row.soul_existing_narrative_identity_preserved),
    },
    publication: {
      showRatingsSkillsTraitsAndNarrative: flag(row.publication_show_ratings_skills_traits_and_narrative),
      excludeSoulAndHistoricalMotifs: flag(row.publication_exclude_soul_and_historical_motifs),
      projectionPolicy: row.publication_projection_policy,
    },
    openingAllocation: {
      method: row.opening_allocation_method,
      copySameRatingsForSameSoul: flag(row.opening_allocation_copy_same_ratings_for_same_soul),
      recordEvidenceAndApprovalStatus: flag(row.opening_allocation_record_evidence_and_approval_status),
    },
    scope: {
      removeMartialArtsAndWuxia: flag(row.scope_remove_martial_arts_and_wuxia),
      redesignWuxiaDependentOrganizations: flag(row.scope_redesign_wuxia_dependent_organizations),
      allowHeroicCombatants: flag(row.scope_allow_heroic_combatants),
      preserveSealedHistoricalRecords: flag(row.scope_preserve_sealed_historical_records),
    },
    pending: row.pending,
  };
  shape(document);
  return document;
}
