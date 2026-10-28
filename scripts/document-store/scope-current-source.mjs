import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { readPersonMappingCurrentSource } from './person-mapping-current-source.mjs';
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs';
import { readCensusDocuments, CENSUS_DOCUMENT_PATHS } from '../cast-sqlite/census-document-store.mjs';
import { readGeographyStore } from '../cast-sqlite/geography-store.mjs';
import { readStationInteriorInputs } from '../cast-sqlite/station-interior-inputs.mjs';
import { readFeudalAllocationInputs } from '../cast-sqlite/feudal-allocation-inputs.mjs';
import { readLineDocument } from '../cast-sqlite/line-document-store.mjs';
import { listGlossaryEntries, readGlossaryHead } from '../cast-sqlite/glossary-store.mjs';
import { createHash } from 'node:crypto';
import { SOUL_CANDIDATE_PATHS } from './soul-candidate-documents.mjs';
import { SOUL_REVIEW_PATHS } from './soul-review-documents.mjs';
import { SOUL_BATCH_PATHS } from './soul-batch-documents.mjs';
import { readRegionContentDocument, REGION_CONTENT_PATHS } from '../cast-sqlite/region-content-documents.mjs';
import { readNamePoolDocument, NAME_POOL_PATHS } from '../cast-sqlite/name-pool-documents.mjs';
import { readExistingNamesDocument } from '../cast-sqlite/existing-names-document.mjs';
import { readOrganizationValuesDocument } from '../cast-sqlite/organization-values-document.mjs';
import { readParentStatusDocument } from '../cast-sqlite/parent-status-document.mjs';
import { readAtlasIdentity } from '../cast-sqlite/atlas-identity.mjs';
import { readFamilyRoleDocument } from '../cast-sqlite/family-role-document.mjs';
import { readRailSourceDocument, RAIL_SOURCE_PATHS } from '../cast-sqlite/rail-source-documents.mjs';
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
import { readRetiredTerritoryDocuments, RETIRED_TERRITORY_PATHS } from '../cast-sqlite/retired-territory-documents.mjs';
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
import { OPENING_SAMPLE_PATHS } from './opening-sample-documents.mjs';
import { readCensusEventDocument } from '../cast-sqlite/census-event-inputs.mjs';
import { readNamingLedgerDocument } from '../cast-sqlite/naming-ledger-document.mjs';
import { readEditorialExampleDocument } from '../cast-sqlite/editorial-example-document.mjs';
import { readAuthoringSchemaDocument, readAuthoringSchemaDocuments, AUTHORING_SCHEMA_PATHS } from '../cast-sqlite/authoring-schema-documents.mjs';
import { readWorldGraphDocument } from '../cast-sqlite/world-graph-document.mjs';
import { readRegionAtlasDocument } from '../cast-sqlite/region-atlas-document.mjs';
import { readEditorialDecisionDocuments, EDITORIAL_DECISION_PATHS } from '../cast-sqlite/editorial-decision-documents.mjs';
import { readRelationProposalDocument } from '../cast-sqlite/relation-proposal-document.mjs';
import { readEditorialVerificationDocument } from '../cast-sqlite/editorial-verification-document.mjs';
import { EDITORIAL_ENVELOPE_PATHS } from './editorial-envelope-documents.mjs';
// Identity is selected independently from SQLite's document inventory, never
// from the approval contract. A recognized typed source cannot fall back.
export function readScopeCurrentSource({ db, logicalPath, editorialProfiles, soulAssignments,
  soulCandidates, soulReview, soulBatches, openingSample, editorialEnvelopes, snapshotDocuments, predecessor = false }) {
  for (const [pins, store] of [[SOUL_CANDIDATE_PATHS, soulCandidates],
    [SOUL_REVIEW_PATHS, soulReview], [SOUL_BATCH_PATHS, soulBatches],
    [OPENING_SAMPLE_PATHS, openingSample], [EDITORIAL_ENVELOPE_PATHS, editorialEnvelopes]]) {
    if (!pins.includes(logicalPath)) continue;

    if (!store) throw new Error('E_SCOPE_PRIVATE_SOUL_SOURCE_REQUIRED');
    const documents = store.readDocuments();
    if (!documents.has(logicalPath)) throw new Error('E_SCOPE_PRIVATE_SOUL_SOURCE_COVERAGE');
    return documents.get(logicalPath);
  }
  if (logicalPath === 'lore/name-pools/cast-backfill-draft.json')
    return readCastBackfillDocument(db);
  if (logicalPath === 'lore/editorial/Character-System-Contract.json')
    return readCharacterContractDocument(db);
  if (logicalPath === 'lore/editorial/Naming-Ledger.json')
    return readNamingLedgerDocument(db);
  if (logicalPath === 'lore/editorial/authoring.example.json')
    return readEditorialExampleDocument(db);
  if (AUTHORING_SCHEMA_PATHS.includes(logicalPath)) {
    if (!snapshotDocuments) return readAuthoringSchemaDocument(db, { logicalPath });
    if (!snapshotDocuments.has('schemas')) snapshotDocuments.set('schemas', readAuthoringSchemaDocuments(db));
    return snapshotDocuments.get('schemas')[logicalPath];
  }
  if (logicalPath === 'snapshots/build-inputs/SeoulWorldGraph.json')
    return readWorldGraphDocument(db);
  if (logicalPath === 'snapshots/build-inputs/atlas-data.js')
    return readRegionAtlasDocument(db);
  if (EDITORIAL_DECISION_PATHS.includes(logicalPath))
    return readEditorialDecisionDocuments(db, { logicalPath });
  if (logicalPath === 'docs/editorial/2026-09-29/cast-relations-unpublished-proposal.json')
    return readRelationProposalDocument(db);
  if (logicalPath === 'docs/editorial/2026-09-29/verification-evidence.json')
    return readEditorialVerificationDocument(db);
  if (logicalPath === 'lore/editorial/seoul-narrative-census-events.json')
    return readCensusEventDocument(db);
  if (logicalPath === 'scripts/data/admin-city-hierarchy.json')
    return readAdminCityDocument(db);
  if (logicalPath === 'lore/name-pools/roster-100.json')
    return readCandidateRosterDocument(db);
  if (logicalPath === 'lore/name-pools/unit-roster.json')
    return readUnitProposalDocument(db);
  if (logicalPath === 'lore/name-pools/settlement-npc-generator.json')
    return readNpcProposalDocument(db);
  if (logicalPath === 'snapshots/build-inputs/source-manifest.json')
    return readBuildSourceManifest(db);
  if (logicalPath === 'scripts/data/admin-territorial-catalog.json')
    return readAdminTerritorialDocument(db);
  if (logicalPath === 'lore/regions/sources/boundary-comparison.json')
    return readBoundaryComparisonDocument(db);
  if (logicalPath === 'lore/regions/sources/selection.json')
    return readGeographySelectionDocument(db);
  if (logicalPath === 'snapshots/build-inputs/creative-name-normalization.json')
    return readCreativeNameDocument(db);
  if (logicalPath === 'lore/places/sources/Winter-Climate-20210108.json')
    return readWinterClimateDocument(db);
  if (logicalPath === 'lore/relations/state-formation-contract.json')
    return readStateFormationDocument(db);
  if (RETIRED_TERRITORY_PATHS.includes(logicalPath))
    return readRetiredTerritoryDocuments(db, { logicalPath });
  if (logicalPath === 'lore/name-pools/clan-hangnyeol-tables.json')
    return readClanCatalogDocument(db);
  if (logicalPath === 'lore/places/Station-Alias-Candidates.json')
    return readStationAliasDocument(db);
  if (logicalPath === 'lore/places/landmark-roles.json')
    return readLandmarkRoleDocument(db);
  if (logicalPath === 'lore/name-pools/hangnyeol-systems.json')
    return readHangnyeolSystemsDocument(db);
  if (logicalPath === 'lore/name-pools/surnames-bongwan.json')
    return readSurnameOriginDocument(db);
  if (logicalPath === 'lore/name-pools/diaspora-family-lineages.json')
    return readDiasporaLineageDocument(db);
  if (logicalPath === 'lore/name-pools/clans-hangnyeol.json')
    return readClanSeedDocument(db);
  if (logicalPath === 'lore/name-pools/household-humanoid-policy.json')
    return readHouseholdPolicyDocument(db);
  if (logicalPath === 'lore/regions/sources/population-2026-08.json')
    return readPopulationDocument(db);
  if (logicalPath === 'lore/name-pools/cast-birth-cohorts.json')
    return readBirthCohortDocument(db);
  if (RAIL_SOURCE_PATHS.includes(logicalPath))
    return readRailSourceDocument(db, { logicalPath });
  if (logicalPath === 'lore/name-pools/person-id-candidates.json') {

    const document = readAtlasIdentity(db).candidates;

    return document;
  }
  if (logicalPath === 'lore/name-pools/cast-family-role-decisions.json') {

    return readFamilyRoleDocument(db);
  }
  if (logicalPath === 'lore/name-pools/person-id-registry.json') {

    const document = readAtlasIdentity(db).registry;

    return document;
  }
  if (logicalPath === 'lore/name-pools/cast-family-parent-status.json')
    return readParentStatusDocument(db);
  if (logicalPath === 'lore/name-pools/values-orgs.json')
    return readOrganizationValuesDocument(db);
  if (logicalPath === 'lore/name-pools/existing-names.json')
    return readExistingNamesDocument(db);
  if (NAME_POOL_PATHS.includes(logicalPath))
    return readNamePoolDocument(db, { logicalPath });
  if (REGION_CONTENT_PATHS.includes(logicalPath))
    return readRegionContentDocument(db, { logicalPath, predecessor });
  if (logicalPath === 'lore/editorial/Soul-Assignments.json') {

    if (!soulAssignments) throw new Error('E_SCOPE_PRIVATE_SOUL_REQUIRED');
    return soulAssignments.readDocument();
  }
  if (logicalPath === 'lore/glossary.json') {
    const head = readGlossaryHead(db);
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
    return readLineDocument(db, lines[0].source_id).text;
  }
  if (logicalPath === 'lore/regions/seoul-electoral-titles.json') {
    return readGeographyStore(db);
  }
  if (logicalPath === 'lore/regions/station-interiors.json') return readStationInteriorInputs(db);
  if (logicalPath === 'lore/relations/opening-feudal-allocation.json') return readFeudalAllocationInputs(db, { predecessor });
  const census = Object.entries(CENSUS_DOCUMENT_PATHS).find(([, path]) => path === logicalPath);
  if (census) {

    if (snapshotDocuments) {
      if (!snapshotDocuments.has('census')) snapshotDocuments.set('census', readCensusDocuments(db));
      return snapshotDocuments.get('census')[census[0]];
    }
    return readCensusDocuments(db)[census[0]];
  }
  if (logicalPath === 'lore/editorial/Seoul-Scope-Contract.json') {

    return readScopeContract(db);
  }
  const documents = db.prepare(`SELECT d.source_id,s.sha256 FROM text_document d
    JOIN source_file s USING(source_id) WHERE s.logical_path=? AND d.corpus_kind IN ('current','example')`).all(logicalPath);
  if (documents.length > 1) throw new Error('E_SCOPE_DB_SOURCE_DUPLICATE');
  if (documents.length === 1) {
    const reference = readEvidenceDocumentReference(db, { logicalPath });
    return orderDocumentKeys(db, reference.sourceId, reference.document);
  }
  return readPersonMappingCurrentSource(db, logicalPath, { editorialProfiles });
}
