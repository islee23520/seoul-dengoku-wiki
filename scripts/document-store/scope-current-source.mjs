import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { readReferenceSuccessor } from './reference-successor-reader.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { readPersonMappingCurrentSource } from './person-mapping-current-source.mjs';
import { readScopeContract, SCOPE_CONTRACT_SOURCE_SHA256 } from '../cast-sqlite/scope-contract-store.mjs';
import { readCensusDocuments, CENSUS_DOCUMENT_PINS } from '../cast-sqlite/census-document-store.mjs';
import { readGeographyStore } from '../cast-sqlite/geography-store.mjs';
import { readStationInteriorInputs } from '../cast-sqlite/station-interior-inputs.mjs';
import { readFeudalAllocationInputs } from '../cast-sqlite/feudal-allocation-inputs.mjs';
import { readLineDocument } from '../cast-sqlite/line-document-store.mjs';
import { listGlossaryEntries, readGlossaryHead } from '../cast-sqlite/glossary-store.mjs';
import { createHash } from 'node:crypto';
import { SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs';
import { SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs';
import { SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs';
import { readRegionContentDocument, REGION_CONTENT_SOURCE_HASHES } from '../cast-sqlite/region-content-documents.mjs';
import { readNamePoolDocument, NAME_POOL_SOURCE_HASHES } from '../cast-sqlite/name-pool-documents.mjs';
import { readExistingNamesDocument } from '../cast-sqlite/existing-names-document.mjs';
import { readOrganizationValuesDocument } from '../cast-sqlite/organization-values-document.mjs';
import { readParentStatusDocument } from '../cast-sqlite/parent-status-document.mjs';
import { readAtlasIdentity } from '../cast-sqlite/atlas-identity.mjs';
import { readFamilyRoleDocument, FAMILY_ROLE_SOURCE_HASH } from '../cast-sqlite/family-role-document.mjs';
import { readRailSourceDocument, RAIL_SOURCE_HASHES } from '../cast-sqlite/rail-source-documents.mjs';
import { readBirthCohortDocument } from '../cast-sqlite/birth-cohort-document.mjs';
import { readPopulationDocument } from '../cast-sqlite/population-document.mjs';
import { readHouseholdPolicyDocument } from '../cast-sqlite/household-policy-document.mjs';
import { readClanSeedDocument } from '../cast-sqlite/clan-seed-document.mjs';
import { readHangnyeolSystemsDocument } from '../cast-sqlite/hangnyeol-systems-document.mjs';
import { readSurnameOriginDocument } from '../cast-sqlite/surname-origin-document.mjs';
import { readDiasporaLineageDocument } from '../cast-sqlite/diaspora-lineage-document.mjs';
import { readClanCatalogDocument } from '../cast-sqlite/clan-catalog-document.mjs';
import { readStationAliasDocument } from '../cast-sqlite/station-alias-document.mjs';
import { readLandmarkRoleDocument } from '../cast-sqlite/landmark-role-document.mjs';
import { readWinterClimateDocument } from '../cast-sqlite/winter-climate-document.mjs';
import { readStateFormationDocument } from '../cast-sqlite/state-formation-document.mjs';
import { readRetiredTerritoryDocuments, RETIRED_TERRITORY_SOURCE_HASHES } from '../cast-sqlite/retired-territory-documents.mjs';
import { readBoundaryComparisonDocument } from '../cast-sqlite/boundary-comparison-document.mjs';
import { readGeographySelectionDocument } from '../cast-sqlite/geography-selection-document.mjs';
import { readCreativeNameDocument } from '../cast-sqlite/creative-name-document.mjs';
import { readAdminCityDocument } from '../cast-sqlite/admin-city-document.mjs';
import { readAdminTerritorialDocument } from '../cast-sqlite/admin-territorial-document.mjs';
import { readBuildSourceManifest } from '../cast-sqlite/build-source-manifest.mjs';
import { readCandidateRosterDocument } from '../cast-sqlite/candidate-roster-document.mjs';
import { readUnitProposalDocument } from '../cast-sqlite/unit-proposal-document.mjs';
import { readNpcProposalDocument } from '../cast-sqlite/npc-proposal-document.mjs';
import { readCastBackfillDocument } from '../cast-sqlite/cast-backfill-document.mjs';
import { readCharacterContractDocument } from '../cast-sqlite/character-contract-document.mjs';
import { OPENING_SAMPLE_SOURCE_HASHES } from './opening-sample-documents.mjs';
import { readCensusEventDocument } from '../cast-sqlite/census-event-inputs.mjs';
import { readNamingLedgerDocument } from '../cast-sqlite/naming-ledger-document.mjs';
import { readEditorialExampleDocument } from '../cast-sqlite/editorial-example-document.mjs';
import { readAuthoringSchemaDocument, readAuthoringSchemaDocuments, AUTHORING_SCHEMA_SOURCE_HASHES } from '../cast-sqlite/authoring-schema-documents.mjs';
import { readWorldGraphDocument } from '../cast-sqlite/world-graph-document.mjs';
import { readRegionAtlasDocument } from '../cast-sqlite/region-atlas-document.mjs';
import { readEditorialDecisionDocuments, EDITORIAL_DECISION_SOURCE_HASHES } from '../cast-sqlite/editorial-decision-documents.mjs';
import { readRelationProposalDocument } from '../cast-sqlite/relation-proposal-document.mjs';
import { readEditorialVerificationDocument, EDITORIAL_VERIFICATION_DOCUMENT_HASH } from '../cast-sqlite/editorial-verification-document.mjs';
import { EDITORIAL_ENVELOPE_SOURCE_HASHES } from './editorial-envelope-documents.mjs';
import { readApprovedDataSource } from '../cast-sqlite/data-source-editor.mjs';
import { isDeepStrictEqual } from 'node:util';
export { PUBLICATION_SUCCESSOR_APPROVAL, PUBLICATION_SUCCESSOR_HEADS, PUBLICATION_EXACT_BODY_APPROVAL,
  PUBLICATION_EXACT_BODIES, ATLAS_DRAFT_APPROVAL } from './reference-successor-approval.mjs';
export { S08_WORDING_REVISION } from './reference-successor-reader.mjs';

// Independently reviewed source revisions (Task10/12/13), separate from the
// renderer-envelope heads below. Each semantic pin bounds the complete delta.
export const PUBLICATION_DATA_SUCCESSORS = Object.freeze({
  'lore/name-pools/values-cast.json': ['19a30e156065f6c2f59b3d2ea7b0226e887ea60d610b70d10e588937407620e2', '5750d72c1c7533e0cf9b59c11448c8d777c54f0f5758ef0fbe8cbe25c092265c'],
  'lore/relations/opening-office-appointments.json': ['de70382bed6464c5b2651f71ab7e13cc710512dbd1e0422a1c6b78980041a794', '3b93a14de55b66f2ba38c6461df57608c42011a992628f57bf73a546e2aff3a8'],
  'lore/relations/opening-feudal-allocation.json': ['21d7663507b896a43d70fc459f662376780b477b5c2078af100b2d42bbe7079d', 'aa32254621831b189587024f2748dc1f78f93a1a448e4e5be15beb6ace8b12e9'],
  'lore/relations/personal-holdings.json': ['1801d7bb8d27af743f74ea447d4f7be782b9d8ba7ba5b37af4d0c6f2b6329a12', '77a0cc273441857a892822319f610d5630eb0801f70b7e633c303db7868f32e3'],
  'lore/relations/relations.json': ['6a0a48a6540c16a848de8e14caa1d8df628eeceab5465c454afdbfdb5fa8a3c2', '438c00ccd559a398980b6619e08d9a0d2f49f1f6bcd0df2b8b970a44c68caeb2'],
});

export function authenticatePublicationDataSuccessor(db, logicalPath, expectedSha256, actual, original) {
  if (!Object.hasOwn(PUBLICATION_DATA_SUCCESSORS, logicalPath)) return false;
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'").get()
    || !db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(logicalPath)) return false;
  const [archive, semantic] = PUBLICATION_DATA_SUCCESSORS[logicalPath];
  if (expectedSha256 !== archive) throw Error('E_PUBLICATION_DATA_SOURCE_PIN');
  const approved = readApprovedDataSource(db, logicalPath, semantic, archive);
  if (!isDeepStrictEqual(actual, approved)) throw Error('E_PUBLICATION_DATA_TYPED_MISMATCH');
  if (logicalPath === 'lore/relations/relations.json') {
    const predecessor = structuredClone(approved);
    if (predecessor.courts[13]?.id !== 'court:K1008' || predecessor.courts[13].stateId !== 'S02')
      throw Error('E_PUBLICATION_DATA_DELTA');
    predecessor.courts[13].stateId = 'polity:daejeon';
    if (!isDeepStrictEqual(predecessor, original)) throw Error('E_PUBLICATION_DATA_DELTA');
  }
  return true;
}

// Identity is selected independently from SQLite's document inventory, never
// from the approval contract. A recognized typed source cannot fall back.
export function readScopeCurrentSource({ db, logicalPath, expectedSha256, editorialProfiles, soulAssignments,
  soulCandidates, soulReview, soulBatches, openingSample, editorialEnvelopes, snapshotDocuments, predecessor = false }) {
  for (const [pins, store] of [[SOUL_CANDIDATE_SOURCE_HASHES, soulCandidates],
    [SOUL_REVIEW_SOURCE_HASHES, soulReview], [SOUL_BATCH_SOURCE_HASHES, soulBatches],
    [OPENING_SAMPLE_SOURCE_HASHES, openingSample], [EDITORIAL_ENVELOPE_SOURCE_HASHES, editorialEnvelopes]]) {
    if (!Object.hasOwn(pins, logicalPath)) continue;
    if (expectedSha256 !== pins[logicalPath]) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    if (!store) throw new Error('E_SCOPE_PRIVATE_SOUL_SOURCE_REQUIRED');
    const documents = store.readDocuments();
    if (!documents.has(logicalPath)) throw new Error('E_SCOPE_PRIVATE_SOUL_SOURCE_COVERAGE');
    return documents.get(logicalPath);
  }
  if (logicalPath === 'lore/name-pools/cast-backfill-draft.json')
    return readCastBackfillDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/editorial/Character-System-Contract.json')
    return readCharacterContractDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/editorial/Naming-Ledger.json')
    return readNamingLedgerDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/editorial/authoring.example.json')
    return readEditorialExampleDocument(db, { expectedSourceHash: expectedSha256 });
  if (Object.hasOwn(AUTHORING_SCHEMA_SOURCE_HASHES, logicalPath)) {
    if (!snapshotDocuments) return readAuthoringSchemaDocument(db, { logicalPath, expectedSourceHash: expectedSha256 });
    if (AUTHORING_SCHEMA_SOURCE_HASHES[logicalPath] !== expectedSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    if (!snapshotDocuments.has('schemas')) snapshotDocuments.set('schemas', readAuthoringSchemaDocuments(db));
    return snapshotDocuments.get('schemas')[logicalPath];
  }
  if (logicalPath === 'snapshots/build-inputs/SeoulWorldGraph.json')
    return readWorldGraphDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'snapshots/build-inputs/atlas-data.js')
    return readRegionAtlasDocument(db, { expectedSourceHash: expectedSha256 });
  if (Object.hasOwn(EDITORIAL_DECISION_SOURCE_HASHES, logicalPath))
    return readEditorialDecisionDocuments(db, { logicalPath, expectedSourceHash: expectedSha256 });
  if (logicalPath === 'docs/editorial/2026-09-29/cast-relations-unpublished-proposal.json')
    return readRelationProposalDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'docs/editorial/2026-09-29/verification-evidence.json')
    return readEditorialVerificationDocument(db, { expectedSourceHash: expectedSha256,
      expectedDocumentHash: EDITORIAL_VERIFICATION_DOCUMENT_HASH });
  if (logicalPath === 'lore/editorial/seoul-narrative-census-events.json')
    return readCensusEventDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'scripts/data/admin-city-hierarchy.json')
    return readAdminCityDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/roster-100.json')
    return readCandidateRosterDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/unit-roster.json')
    return readUnitProposalDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/settlement-npc-generator.json')
    return readNpcProposalDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'snapshots/build-inputs/source-manifest.json')
    return readBuildSourceManifest(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'scripts/data/admin-territorial-catalog.json')
    return readAdminTerritorialDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/regions/sources/boundary-comparison.json')
    return readBoundaryComparisonDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/regions/sources/selection.json')
    return readGeographySelectionDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'snapshots/build-inputs/creative-name-normalization.json')
    return readCreativeNameDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/places/sources/Winter-Climate-20210108.json')
    return readWinterClimateDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/relations/state-formation-contract.json')
    return readStateFormationDocument(db, { expectedSourceHash: expectedSha256 });
  if (Object.hasOwn(RETIRED_TERRITORY_SOURCE_HASHES, logicalPath))
    return readRetiredTerritoryDocuments(db, { logicalPath, expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/clan-hangnyeol-tables.json')
    return readClanCatalogDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/places/Station-Alias-Candidates.json')
    return readStationAliasDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/places/landmark-roles.json')
    return readLandmarkRoleDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/hangnyeol-systems.json')
    return readHangnyeolSystemsDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/surnames-bongwan.json')
    return readSurnameOriginDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/diaspora-family-lineages.json')
    return readDiasporaLineageDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/clans-hangnyeol.json')
    return readClanSeedDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/household-humanoid-policy.json')
    return readHouseholdPolicyDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/regions/sources/population-2026-08.json')
    return readPopulationDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/cast-birth-cohorts.json')
    return readBirthCohortDocument(db);
  if (Object.hasOwn(RAIL_SOURCE_HASHES, logicalPath))
    return readRailSourceDocument(db, { logicalPath, expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/person-id-candidates.json') {
    if (expectedSha256 !== 'e208daf90927feeb9a04ac096190987a16903ab809e2265545fef9b968e30034')
      throw new Error('E_SCOPE_DB_SOURCE_HASH');
    const document = readAtlasIdentity(db).candidates;
    if (createHash('sha256').update(JSON.stringify(document)).digest('hex') !== 'a72e67b81e43f16e4cb371f2609b11ecb92f6c8ecc4413134d5e7c00cf84b875')
      throw new Error('E_SCOPE_DB_SOURCE_INTEGRITY');
    return document;
  }
  if (logicalPath === 'lore/name-pools/cast-family-role-decisions.json') {
    if (expectedSha256 !== FAMILY_ROLE_SOURCE_HASH) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    return readFamilyRoleDocument(db, { expectedSourceHash: expectedSha256 });
  }
  if (logicalPath === 'lore/name-pools/person-id-registry.json') {
    if (expectedSha256 !== 'c02b435da25b09a2c388b694a656242e150de9d169da9fb59c21f6880ac4a63a')
      throw new Error('E_SCOPE_DB_SOURCE_HASH');
    const document = readAtlasIdentity(db).registry;
    if (createHash('sha256').update(JSON.stringify(document)).digest('hex') !== '920d45b7725102c38f0af98a4b6bcdf22291f5290952dd0842b1ba0d6ff25f4b')
      throw new Error('E_SCOPE_DB_SOURCE_INTEGRITY');
    return document;
  }
  if (logicalPath === 'lore/name-pools/cast-family-parent-status.json')
    return readParentStatusDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/values-orgs.json')
    return readOrganizationValuesDocument(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/name-pools/existing-names.json')
    return readExistingNamesDocument(db, { expectedSourceHash: expectedSha256 });
  if (Object.hasOwn(NAME_POOL_SOURCE_HASHES, logicalPath))
    return readNamePoolDocument(db, { logicalPath, expectedSourceHash: expectedSha256 });
  if (Object.hasOwn(REGION_CONTENT_SOURCE_HASHES, logicalPath))
    return readRegionContentDocument(db, { logicalPath, expectedSourceHash: expectedSha256, predecessor });
  if (logicalPath === 'lore/editorial/Soul-Assignments.json') {
    if (expectedSha256 !== SOUL_ASSIGNMENT_SOURCE_SHA256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    if (!soulAssignments) throw new Error('E_SCOPE_PRIVATE_SOUL_REQUIRED');
    return soulAssignments.readDocument();
  }
  if (logicalPath === 'lore/glossary.json') {
    const source = db.prepare('SELECT sha256 FROM glossary_archive WHERE singleton=1').get();
    if (source?.sha256 !== expectedSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    const head = readGlossaryHead(db);
    if (head.parentRevision !== null) throw new Error('E_SCOPE_DB_SOURCE_STALE');
    const entries = listGlossaryEntries(db, { visibility: 'internal' });
    const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
      : value !== null && typeof value === 'object'
        ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
        : JSON.stringify(value);
    if (createHash('sha256').update(canonical(entries)).digest('hex') !== head.contentSha256)
      throw new Error('E_SCOPE_DB_SOURCE_INTEGRITY');
    return entries;
  }
  const lines = db.prepare(`SELECT d.source_id FROM text_line_document d
    JOIN source_file s USING(source_id) WHERE s.logical_path=?`).all(logicalPath);
  if (lines.length > 1) throw new Error('E_SCOPE_DB_SOURCE_DUPLICATE');
  if (lines.length === 1) {
    let document = readLineDocument(db, lines[0].source_id);
    // Only the owner's exact policy amendment has a separate current head.
    // Other changed documents must not inherit an old source approval.
    if (logicalPath === 'WORLD_BUILDING_GUIDE.md'
      && document.contentSha256 === 'cd90ee0a77e566e24f8ea1e8a57d4cddd36f8e28941d0449c0ec790438929c66'
      && expectedSha256 === 'b8abd053dfb4cba2d865c601b26a9ab9e6a3ce1859f621251fc08929153b6914') {
      document = readLineDocument(db, lines[0].source_id, { revision: document.parentRevision });
    }
    if (document.contentSha256 !== expectedSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    return document.text;
  }
  if (logicalPath === 'lore/regions/seoul-electoral-titles.json') {
    const source = db.prepare('SELECT sha256 FROM geography_archive WHERE singleton=1').get();
    if (source?.sha256 !== expectedSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    return readGeographyStore(db);
  }
  if (logicalPath === 'lore/regions/station-interiors.json') return readStationInteriorInputs(db, { expectedSourceHash: expectedSha256 });
  if (logicalPath === 'lore/relations/opening-feudal-allocation.json') return readFeudalAllocationInputs(db, { expectedSourceHash: expectedSha256, predecessor });
  const census = Object.entries(CENSUS_DOCUMENT_PINS).find(([, pin]) => pin.path === logicalPath);
  if (census) {
    if (expectedSha256 !== census[1].sourceSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    if (snapshotDocuments) {
      if (!snapshotDocuments.has('census')) snapshotDocuments.set('census', readCensusDocuments(db));
      return snapshotDocuments.get('census')[census[0]];
    }
    return readCensusDocuments(db)[census[0]];
  }
  if (logicalPath === 'lore/editorial/Seoul-Scope-Contract.json') {
    if (expectedSha256 !== SCOPE_CONTRACT_SOURCE_SHA256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    return readScopeContract(db);
  }
  const documents = db.prepare(`SELECT d.source_id,s.sha256 FROM text_document d
    JOIN source_file s USING(source_id) WHERE s.logical_path=? AND d.corpus_kind IN ('current','example')`).all(logicalPath);
  if (documents.length > 1) throw new Error('E_SCOPE_DB_SOURCE_DUPLICATE');
  if (documents.length === 1) {
    if (documents[0].sha256 !== expectedSha256) throw new Error('E_SCOPE_DB_SOURCE_HASH');
    const successor = readReferenceSuccessor(db, { logicalPath, expectedSha256 });
    if (successor !== null) return successor;
    const reference = readEvidenceDocumentReference(db, { logicalPath, expectedSha256 });
    return orderDocumentKeys(db, reference.sourceId, reference.document);
  }
  return readPersonMappingCurrentSource(db, logicalPath, expectedSha256, { editorialProfiles });
}
