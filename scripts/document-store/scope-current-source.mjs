import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
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
import { readDocumentRevision } from '../cast-sqlite/document-edit.mjs';
import { authenticateExactBodyApproval } from './publication-database-inputs.mjs';
import { fileURLToPath } from 'node:url';

export const PUBLICATION_EXACT_BODY_APPROVAL = Object.freeze({
  receiptPath: '.omo/evidence/fcd/approved-body-apply/receipt.json',
  receiptSha256: '857d84a1e693f120faf9b83612db06ce87e577ca11f28547fbd6d43f240f1df4',
  approvalPath: 'scripts/approved-document-bodies-20261023.json',
  approvalSha256: 'a774009ea295fe7de381590ca1cb00a99393bbe8265cb82eecad831ae80b1b78',
  manifestPath: '.omo/evidence/fcd/domain-proposal/manifest.json',
  manifestSha256: 'c11753202e39313d70d410e9621682171b2c94e808527100d5f2fe5bf80920c0',
});
export const PUBLICATION_EXACT_BODIES = Object.freeze({
  'lore/characters/Cast-Relations.json': Object.freeze({
    documentId: 'DOC:Cast-Relations', domain: 'characters', file: 'Cast-Relations.after.json',
    revision: '0befd45d2ddc810e39ef431dbe2a8d4632a349ddfec17626d6959889428a7842',
    predecessor: 'd0aee1c4ab12eb202c65d2b98e8cbae04b669d73dd2ce4ca83162fd983565acb',
    predecessorSemantic: 'd2c13b591fb376424fb4914b32822c1a96ab16fe5b5ebe7aecad318f6a7b214e',
    semanticSha256: '30c628a8f920d5ed98e0196f90f71100fb61b13e3ab2aaea0fba7f1aa351c388',
    byteSha256: 'a42b5fc1a265f1c61339f3ba81130f74cfe704394e479d676fca55e4f013b2b7',
    sourceSha256: '80cb4c4f38ba089621904adc347091f53891a76658f964507eb677414d052a07',
  }),
  'lore/offices/Offices-and-Ranks.json': Object.freeze({
    documentId: 'DOC:Offices-and-Ranks', domain: 'offices', file: 'Offices-and-Ranks.after.json',
    revision: '22acb2f7a5959a94e3c734d8abaf3b386c5ce42f726b8dd82c393e8c0d126e80',
    predecessor: '57dee91f3739def14183a2d378f5fadcd3b2812acc357004a7c158673c690442',
    predecessorSemantic: 'ccec975b94492c8bb8e7ce232a6a21d2da0cd3d15078401be3a22fd15ae83e37',
    semanticSha256: '85fd4951e1b8c20048c3f8523d85f70c6ef5a92c64e37dbdf98efd5168d05fcd',
    byteSha256: '5c0e6d9cb726946efd9db00ece503cef5985e532abd7a575aa0756b86d16aea8',
    sourceSha256: '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e',
  }),
});
const canonicalBody = value => Array.isArray(value) ? `[${value.map(canonicalBody).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalBody(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const bodyDigest = value => createHash('sha256').update(canonicalBody(value)).digest('hex');

function readExactApprovedBody(db, logicalPath, expectedSha256, approvedBodies) {
  const pin = PUBLICATION_EXACT_BODIES[logicalPath];
  approvedBodies ??= authenticateExactBodyApproval(process.env.PUBLICATION_NEW_BODY_ROOT
    ?? fileURLToPath(new URL('../../', import.meta.url)));
  const approved = approvedBodies.get(logicalPath);
  if (!approved || bodyDigest(approved) !== pin.semanticSha256) throw Error('E_PUBLICATION_EXACT_BODY_REQUIRED');
  const reference = readEvidenceDocumentReference(db, { logicalPath, expectedSha256, expectedSemanticSha256: pin.semanticSha256 });
  const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(reference.sourceId);
  const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
    WHERE r.revision_id=?`).get(pin.predecessor);
  if (expectedSha256 !== pin.sourceSha256 || reference.revision !== pin.revision
    || head?.parent_revision !== pin.predecessor || parent?.source_id !== reference.sourceId
    || parent.semantic_sha256 !== pin.predecessorSemantic || parent.algorithm !== 'typed-envelope-v1'
    || parent.sequence >= head.sequence
    || bodyDigest(['typed-envelope-v1', reference.sourceId, head.parent_revision, head.semantic_sha256, head.actor, head.reason]) !== pin.revision)
    throw Error('E_PUBLICATION_EXACT_BODY_CHAIN');
  const predecessor = readDocumentRevision(db, { revision: pin.predecessor, documentId: pin.documentId,
    domain: pin.domain, corpusKind: 'current' });
  if (bodyDigest(predecessor) !== pin.predecessorSemantic) throw Error('E_PUBLICATION_EXACT_BODY_CHAIN');
  // approvedStructure contributes order only after complete typed equality.
  return orderDocumentKeys(db, reference.sourceId, reference.document, { approvedStructure: approved });
}

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

// Owner-approved current heads, independent of the immutable archive byte pins.
// These pairs authorize only this exact delta for private publication evidence;
// they do not grant public document admission or change historical review bytes.
export const PUBLICATION_SUCCESSOR_APPROVAL = Object.freeze({
  receiptPath: '.omo/private/seoul-migration/faction-consolidation-20261022/receipt.json',
  receiptSha256: '97b1d7dbd2631682b2214eb03a1478ef2085af2618d08739001ebe33cd2f8df3',
  decisionPath: 'scripts/approved-seoul-faction-consolidation-20261022.json',
  decisionSha256: 'd0378abb6ef9578a847c133247faabb06d758b968d35f1193b4e4feb83701c54',
  approvalRef: 'owner:seoul-faction-consolidation-20261022',
});
export const PUBLICATION_SUCCESSOR_HEADS = Object.freeze({
  'lore/characters/Cast-State-02.json': Object.freeze({
    revision: '69390d278551ed403ffda3bc5e1b785194f418a2c79c28a778c3e164521a9a3d',
    semanticSha256: '267c93362591269f26477dd6fbadd1a6d15922238b2439a7ab094f7fa9c0a7a8',
    sourceSha256: '2dd50da979a8b3f9d1f3a2123adc765a9e9d35eac2240f0e149aac187e3c33ea',
  }),
  'lore/characters/Cast-Unaffiliated.json': Object.freeze({
    revision: '0846f24df1c95b5ddbb2656e1bbb7617b0bb1ffd3c1980c11c4a34d80c7f77e0',
    semanticSha256: '0ebb4c3d9a774bb712a470da32fdf2b21d190913912b78922564a4e670cd04d1',
    sourceSha256: '5b1a3af2d7621c9ece2ae01bd9ec1878f2232c1e0b31db0df80798ad8f66829a',
  }),
  'lore/characters/Core-Characters.json': Object.freeze({
    revision: '3edea828b052e69596d35ba410929425b1870925f1ee5b4ad5c9fe72eb133a22',
    semanticSha256: 'a05f4bd6d9d0a246f1092d2b60ee7f0d0e5faf1ac151411e6bbfd6d7ecbcd905',
    sourceSha256: '911c7f9ca1a24d1c803a4c952ff972cc0482be74d6f277419b14734512e56dc4',
  }),
  'lore/factions/Sixteen-States.json': Object.freeze({
    revision: '1e7bcf057b554cf6b52ea50dd5645da515b0513f04a30adcb5f461e3af462474',
    semanticSha256: '8d43c418de8b4318240ea066ba0fdf9e75430e2723fbfa272d48653fb352f415',
    sourceSha256: '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c',
  }),
  'lore/offices/Offices-and-Ranks.json': Object.freeze({
    revision: '57dee91f3739def14183a2d378f5fadcd3b2812acc357004a7c158673c690442',
    semanticSha256: 'ccec975b94492c8bb8e7ce232a6a21d2da0cd3d15078401be3a22fd15ae83e37',
    sourceSha256: '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e',
  }),
});

// Identity is selected independently from SQLite's document inventory, never
// from the approval contract. A recognized typed source cannot fall back.
export function readScopeCurrentSource({ db, logicalPath, expectedSha256, editorialProfiles, soulAssignments,
  soulCandidates, soulReview, soulBatches, openingSample, editorialEnvelopes, approvedBodies, snapshotDocuments, predecessor = false }) {
  const exact = PUBLICATION_EXACT_BODIES[logicalPath];
  if (exact && db.prepare(`SELECT h.revision_id FROM document_head h JOIN source_file s USING(source_id)
    WHERE s.logical_path=?`).get(logicalPath)?.revision_id === exact.revision)
    return readExactApprovedBody(db, logicalPath, expectedSha256, approvedBodies);
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
    return readBirthCohortDocument(db, { expectedSourceHash: expectedSha256 });
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
    const approved = PUBLICATION_SUCCESSOR_HEADS[logicalPath];
    const head = approved && db.prepare(`SELECT r.parent_revision FROM document_head h
      JOIN document_revision r USING(source_id,revision_id) WHERE h.source_id=?`).get(documents[0].source_id);
    const successor = head && head.parent_revision !== null ? approved : undefined;
    const reference = readEvidenceDocumentReference(db, { logicalPath, expectedSha256,
      ...(successor ? { expectedSemanticSha256: successor.semanticSha256 } : {}) });
    if (successor && (expectedSha256 !== successor.sourceSha256 || reference.revision !== successor.revision))
      throw new Error('E_SCOPE_DB_SOURCE_STALE');
    return orderDocumentKeys(db, reference.sourceId, reference.document);
  }
  return readPersonMappingCurrentSource(db, logicalPath, expectedSha256, { editorialProfiles });
}
