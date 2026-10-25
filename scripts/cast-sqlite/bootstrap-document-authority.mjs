#!/usr/bin/env node
// Offline, explicit one-time bootstrap. Never imported by a runtime reader.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DatabaseSync, backup } from 'node:sqlite';
import { openReadOnly, runIntegrityChecks } from './db.mjs';
import { readSourceArchive } from './source-archive.mjs';
import { TEXT_DOCUMENT_MANIFEST } from './text-corpus-manifest.mjs';
import { importDocuments } from './document-import.mjs';
import { listDocuments, readDocument } from './document-read.mjs';
import { initializeDocumentAuthority } from './document-edit.mjs';
import { recordPublicationReview } from './document-admission.mjs';
import { initializeGlossaryStore, listGlossaryEntries } from './glossary-store.mjs';
import { initializeLineDocumentStore } from './line-document-store.mjs';
import { ADDITIONAL_LINE_SOURCE_HASHES } from './additional-line-sources.mjs';
import { importAdditionalLineSources } from './additional-line-import.mjs';
import { initializeScopeDirectoryInventory, SCOPE_SOURCE_DIRECTORIES } from '../document-store/scope-directory-inventory.mjs';
import { initializeGeographyStore, readGeographyStore } from './geography-store.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';
import { initializeDocumentKeyOrder } from './document-key-order.mjs';
import { initializeAtlasIdentity } from './atlas-identity.mjs';
import { initializePermissionStore, readPermissionStore } from './permission-store.mjs';
import { initializeRelationInputs } from './relation-inputs.mjs';
import { initializePortraitStore, readPortraitDocuments } from './portrait-store.mjs';
import { initializeIssuedSheetInputs, ISSUED_SHEET_SOURCE_HASH } from './issued-sheet-inputs.mjs';
import { initializeIssuedSheetDocument } from './issued-sheet-document.mjs';
import { initializePersonIdentityInputs, PERSON_IDENTITY_SOURCE_HASHES } from './person-identity-inputs.mjs';
import { initializePersonIdentityDocuments } from './person-identity-documents.mjs';
import { initializePersonContextDocuments, PERSON_CONTEXT_SOURCE_HASHES } from './person-context-documents.mjs';
import { initializeCensusEventInputs } from './census-event-inputs.mjs';
import { initializePersonalHoldingInputs, PERSONAL_HOLDING_SOURCE_HASH } from './personal-holding-inputs.mjs';
import { initializeOfficeAppointmentInputs, OFFICE_APPOINTMENT_SOURCE_HASH } from './office-appointment-inputs.mjs';
import { initializeFeudalAllocationInputs, FEUDAL_ALLOCATION_SOURCE_HASH } from './feudal-allocation-inputs.mjs';
import { initializeStationInteriorInputs, STATION_INTERIOR_SOURCE_HASH } from './station-interior-inputs.mjs';
import { initializePreservedSheetInputs } from './preserved-sheet-inputs.mjs';
import { initializeFamilyKeyOrder } from './family-key-order.mjs';
import { initializeFamilySourceDocument, FAMILY_SOURCE_HASH } from './family-source-document.mjs';
import { initializeScopeContractStore, SCOPE_CONTRACT_SOURCE_SHA256 } from './scope-contract-store.mjs';
import { initializeCensusDocuments, CENSUS_DOCUMENT_PINS } from './census-document-store.mjs';
import { initializeRegionContentDocuments, REGION_CONTENT_SOURCE_HASHES } from './region-content-documents.mjs';
import { initializeNamePoolDocuments, NAME_POOL_SOURCE_HASHES } from './name-pool-documents.mjs';
import { initializeExistingNamesDocument, EXISTING_NAMES_SOURCE_HASH } from './existing-names-document.mjs';
import { initializeOrganizationValuesDocument, ORGANIZATION_VALUES_SOURCE_HASH } from './organization-values-document.mjs';
import { initializeFamilyRoleDocument, FAMILY_ROLE_SOURCE_HASH } from './family-role-document.mjs';
import { initializeRailSourceDocuments, RAIL_SOURCE_HASHES } from './rail-source-documents.mjs';
import { initializePopulationDocument, POPULATION_SOURCE_HASH } from './population-document.mjs';
import { initializeHouseholdPolicyDocument, HOUSEHOLD_POLICY_SOURCE_HASH } from './household-policy-document.mjs';
import { initializeClanSeedDocument, CLAN_SEED_SOURCE_HASH } from './clan-seed-document.mjs';
import { initializeHangnyeolSystemsDocument, HANGNYEOL_SYSTEMS_SOURCE_HASH } from './hangnyeol-systems-document.mjs';
import { initializeSurnameOriginDocument, SURNAME_ORIGIN_SOURCE_HASH } from './surname-origin-document.mjs';
import { initializeDiasporaLineageDocument, DIASPORA_LINEAGE_SOURCE_HASH } from './diaspora-lineage-document.mjs';
import { initializeClanCatalogDocument, CLAN_CATALOG_SOURCE_HASH } from './clan-catalog-document.mjs';
import { initializeStationAliasDocument, STATION_ALIAS_SOURCE_HASH } from './station-alias-document.mjs';
import { initializeLandmarkRoleDocument, LANDMARK_ROLE_SOURCE_HASH } from './landmark-role-document.mjs';
import { initializeWinterClimateDocument, WINTER_CLIMATE_SOURCE_HASH } from './winter-climate-document.mjs';
import { initializeStateFormationDocument, STATE_FORMATION_SOURCE_HASH } from './state-formation-document.mjs';
import { initializeRetiredTerritoryDocuments, RETIRED_TERRITORY_SOURCE_HASHES } from './retired-territory-documents.mjs';
import { initializeBoundaryComparisonDocument, BOUNDARY_COMPARISON_SOURCE_HASH } from './boundary-comparison-document.mjs';
import { initializeGeographySelectionDocument, GEOGRAPHY_SELECTION_SOURCE_HASH } from './geography-selection-document.mjs';
import { initializeCreativeNameDocument, CREATIVE_NAME_SOURCE_HASH } from './creative-name-document.mjs';
import { initializeAdminCityDocument, ADMIN_CITY_SOURCE_HASH } from './admin-city-document.mjs';
import { initializeAdminTerritorialDocument, ADMIN_TERRITORIAL_SOURCE_HASH } from './admin-territorial-document.mjs';
import { initializeBuildSourceManifest, BUILD_SOURCE_MANIFEST_HASH } from './build-source-manifest.mjs';
import { initializeCandidateRosterDocument, CANDIDATE_ROSTER_SOURCE_HASH } from './candidate-roster-document.mjs';
import { initializeUnitProposalDocument, UNIT_PROPOSAL_SOURCE_HASH } from './unit-proposal-document.mjs';
import { initializeNpcProposalDocument, NPC_PROPOSAL_SOURCE_HASH } from './npc-proposal-document.mjs';
import { initializeCastBackfillDocument, CAST_BACKFILL_SOURCE_HASH } from './cast-backfill-document.mjs';
import { initializeCharacterContractDocument, CHARACTER_CONTRACT_SOURCE_HASH } from './character-contract-document.mjs';
import { initializeNamingLedgerDocument, NAMING_LEDGER_SOURCE_HASH } from './naming-ledger-document.mjs';
import { initializeEditorialExampleDocument, EDITORIAL_EXAMPLE_SOURCE_HASH } from './editorial-example-document.mjs';
import { initializeAuthoringSchemaDocuments, AUTHORING_SCHEMA_SOURCE_HASHES } from './authoring-schema-documents.mjs';
import { initializeWorldGraphDocument, WORLD_GRAPH_SOURCE_HASH } from './world-graph-document.mjs';
import { initializeRegionAtlasDocument, REGION_ATLAS_SOURCE_HASH } from './region-atlas-document.mjs';
import { initializeCatalogMetadata, CATALOG_METADATA_PATHS } from './catalog-metadata.mjs';
import { initializeEditorialDecisionDocuments, EDITORIAL_DECISION_SOURCE_HASHES } from './editorial-decision-documents.mjs';
import { initializeRelationProposalDocument, RELATION_PROPOSAL_SOURCE_HASH } from './relation-proposal-document.mjs';
import { initializeEditorialVerificationDocument, EDITORIAL_VERIFICATION_SOURCE_HASH,
  EDITORIAL_VERIFICATION_DOCUMENT_HASH } from './editorial-verification-document.mjs';
import { loadScopeInput } from '../check-seoul-scope.mjs';
import { isAuthenticatedPublicationReview } from '../seoul-census.mjs';
import { approvedDocuments, publishedDocuments } from '../catalog-admission.mjs';
import { loadCategoryRegistry, registrationErrors } from '../category-registration.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (value) => hash(canonical(value));
const fail = (message) => { throw new Error(`E_BOOTSTRAP: ${message}`); };
const select = (d) => ({ documentId: d.document_id, domain: d.domain, corpusKind: d.corpus_kind, visibility: 'internal' });
const git = (root, args, maxBuffer = 64 * 1024 * 1024) => execFileSync('git', ['--no-replace-objects', '-C', root, ...args], { maxBuffer, env: { ...process.env, GIT_MASTER: '1' } });

// Archive fingerprints include all exact bytes and generic coordinates, not just stored hashes.
function archive(db, ids) {
  const h = createHash('sha256');
  const sources = db.prepare('SELECT * FROM source_file ORDER BY source_id').all();
  for (const s of sources.filter((s) => !ids || ids.has(s.source_id))) {
    assert.equal(hash(s.raw_bytes), s.sha256);
    assert.equal(s.raw_bytes.length, s.byte_length);
    h.update(canonical({ ...s, raw_bytes: hash(s.raw_bytes) }));
    for (const row of db.prepare('SELECT * FROM source_record WHERE source_id=? ORDER BY json_pointer').iterate(s.source_id)) h.update(canonical({ ...row }));
  }
  return { sha256: h.digest('hex'), sourceCount: sources.filter((s) => !ids || ids.has(s.source_id)).length };
}

export async function bootstrapDocumentAuthority({ sourceRoot, input, output, baseline, receipt, actor, reason }) {
  for (const [key, value] of Object.entries({ sourceRoot, input, output, baseline, receipt })) {
    if (typeof value !== 'string' || !isAbsolute(value)) fail(`${key} must be an explicit absolute path`);
  }
  if (!actor?.trim() || !reason?.trim()) fail('explicit actor and reason required');
  const tempRoot = '/tmp/seoul-document-authority-20261020';
  for (const path of [output, receipt]) {
    if (relative(tempRoot, path).startsWith('..') || resolve(path) === tempRoot || existsSync(path)) fail('new output and receipt must be inside the restricted bootstrap temp directory');
  }
  if (!output.endsWith('.sqlite') || output === receipt || resolve(input) === resolve(output)) fail('distinct new SQLite output required');
  // Do not traverse existing symlink directories when placing private artifacts.
  for (const path of [dirname(output), dirname(receipt)]) {
    let cursor = path;
    while (cursor !== '/tmp' && cursor !== '/') {
      if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail('symlink output directory');
      cursor = dirname(cursor);
    }
    mkdirSync(path, { recursive: true, mode: 0o700 });
    chmodSync(path, 0o700);
  }
  const inputFileSha256 = hash(readFileSync(input));
  // Historical import replay reads sealed SQLite evidence, never removed authoring files.
  const importBytes = logicalPath => {
    if (!logicalPath.startsWith('lore/editorial/')) return readSourceArchive(logicalPath, undefined, input);
    const evidence = new DatabaseSync(resolve(sourceRoot, '.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite'), { readOnly: true });
    try {
      const row = evidence.prepare('SELECT raw_bytes,sha256 FROM evidence WHERE identity=? AND logical_path=?').get('scope-read:' + logicalPath, logicalPath);
      if (!row || hash(row.raw_bytes) !== row.sha256) fail('missing private import evidence: ' + logicalPath);
      return Buffer.from(row.raw_bytes);
    } finally { evidence.close(); }
  };
  const sourceGitCommit = git(sourceRoot, ['rev-parse', 'HEAD']).toString().trim();
  const snapshot = new Map();
  for (const entry of TEXT_DOCUMENT_MANIFEST) {
    const bytes = readSourceArchive(entry.logical_path, undefined, input);
    snapshot.set(entry.logical_path, { entry, bytes, document: JSON.parse(bytes) });
  }
  console.log('BOOTSTRAP sources verified; loading authenticated review');
  const scope = await loadScopeInput({ root: sourceRoot, baselinePath: baseline, mode: 'inspection' });
  if (scope.error) fail(JSON.stringify(scope.error));
  const review = scope.current.publicationReview;
  assert.equal(isAuthenticatedPublicationReview(review), true);
  assert.equal(review.complete, true);
  assert.equal(review.semanticReview, 'reviewed');
  const articles = publishedDocuments(await approvedDocuments(resolve(sourceRoot, 'lore')), review);
  const registry = await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url));
  const original = openReadOnly(input);
  let before, archivedIds;
  try {
    archivedIds = new Set(original.prepare('SELECT source_id FROM source_file').all().map((r) => r.source_id));
    before = archive(original);
    assert.equal(original.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_authority'").get(), undefined);
    await backup(original, output);
  } finally { original.close(); }
  chmodSync(output, 0o600);
  const db = new DatabaseSync(output, { enableForeignKeyConstraints: true });
  let result;
  try {
    const initial = db.prepare('SELECT d.*,s.logical_path FROM text_document d JOIN source_file s USING(source_id)').all();
    for (const d of initial) if (!snapshot.has(d.logical_path)) fail(`unmanifested typed document ${d.logical_path}`);
    const missing = [...snapshot.values()].filter(({ entry }) => !initial.some((d) => d.logical_path === entry.logical_path));
    if (missing.length !== 1 || missing[0].entry.logical_path !== 'lore/Research-Sources.json') fail('only the explicit Research-Sources manifest addition is supported');
    const { entry, bytes, document } = missing[0];
    const archived = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(entry.logical_path);
    const imported = importDocuments({ db, store: 'public', entries: [{ ...entry, ...(archived ? { source_id: archived.source_id } : {}),
      privacy: 'public', raw_bytes: bytes, identity: { domain: document.domain, document_id: document.id, slug: document.slug } }] });
    const typed = db.prepare('SELECT d.*,s.logical_path,s.sha256 FROM text_document d JOIN source_file s USING(source_id) ORDER BY source_id').all();
    assert.equal(typed.length, TEXT_DOCUMENT_MANIFEST.length);
    const attestations = typed.map((identity) => {
      const expected = snapshot.get(identity.logical_path);
      assert.equal(identity.sha256, hash(expected.bytes), `stale archive ${identity.logical_path}`);
      assert.equal(identity.corpus_kind, expected.entry.corpus_kind);
      const actual = readDocument(db, select(identity));
      assert.deepEqual(actual, expected.document, `incomplete typed document ${identity.logical_path}`);
      return { sourceId: identity.source_id, sourcePath: identity.logical_path, sourceSha256: identity.sha256, semanticSha256: digest(actual) };
    });
    const initialized = initializeDocumentAuthority(db, { actor, reason, validatedSourceIds: typed.map((d) => d.source_id) });
    const scopeContractPath = 'lore/editorial/Seoul-Scope-Contract.json';
    const scopeContractBytes = importBytes(scopeContractPath);

    const scopeContract = initializeScopeContractStore(db, { sourceBytes: scopeContractBytes,
      expectedSha256: SCOPE_CONTRACT_SOURCE_SHA256, actor, reason });
    const censusSources = {};
    for (const [name, pin] of Object.entries(CENSUS_DOCUMENT_PINS)) {
      const bytes = readFileSync(resolve(sourceRoot, pin.path));

      censusSources[name] = { bytes, expectedSourceHash: pin.sourceSha256 };
    }
    const censusDocuments = initializeCensusDocuments(db, {
      schemaSql: readFileSync(new URL('./census-document-store.sql', import.meta.url), 'utf8'),
      sources: censusSources, actor, reason });
    const regionSources = {};
    for (const [logicalPath, expectedSourceHash] of Object.entries(REGION_CONTENT_SOURCE_HASHES)) {
      const bytes = importBytes(logicalPath);

      regionSources[logicalPath] = { bytes, expectedSourceHash };
    }
    const regionDocuments = initializeRegionContentDocuments(db, {
      schemaSql: readFileSync(new URL('./region-content-documents.sql', import.meta.url), 'utf8'),
      sources: regionSources, actor, reason });
    const namePoolSources = {};
    for (const [logicalPath, expectedSourceHash] of Object.entries(NAME_POOL_SOURCE_HASHES)) {
      const source = db.prepare('SELECT raw_bytes,sha256 FROM source_file WHERE logical_path=?').get(logicalPath);
      if (source?.sha256 !== expectedSourceHash) fail(`missing migrated name pool: ${logicalPath}`);
      const bytes = Buffer.from(source.raw_bytes);
      namePoolSources[logicalPath] = { bytes, expectedSourceHash };
    }
    const namePoolDocuments = initializeNamePoolDocuments(db, {
      schemaSql: readFileSync(new URL('./name-pool-documents.sql', import.meta.url), 'utf8'),
      sources: namePoolSources, actor, reason });
    const existingNamesPath = 'lore/name-pools/existing-names.json';
    const existingNamesBytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(existingNamesPath).raw_bytes);
    const existingNamesDocument = initializeExistingNamesDocument(db, {
      sourceBytes: existingNamesBytes, expectedSourceHash: EXISTING_NAMES_SOURCE_HASH, actor, reason });
    const organizationValuesPath = 'lore/name-pools/values-orgs.json';
    const organizationValuesBytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(organizationValuesPath).raw_bytes);
    const organizationValuesDocument = initializeOrganizationValuesDocument(db, {
      schemaSql: readFileSync(new URL('./organization-values-document.sql', import.meta.url), 'utf8'),
      sourceBytes: organizationValuesBytes, expectedSourceHash: ORGANIZATION_VALUES_SOURCE_HASH, actor, reason });
    const familyRolePath = 'lore/name-pools/cast-family-role-decisions.json';
    const familyRoleBytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(familyRolePath).raw_bytes);
    const familyRoleDocument = initializeFamilyRoleDocument(db, {
      schemaSql: readFileSync(new URL('./family-role-document.sql', import.meta.url), 'utf8'),
      sourceBytes: familyRoleBytes, expectedSourceHash: FAMILY_ROLE_SOURCE_HASH, actor, reason });
    const railSources = {};
    for (const [logicalPath, expectedSourceHash] of Object.entries(RAIL_SOURCE_HASHES)) {
      const bytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes);
      railSources[logicalPath] = { bytes, expectedSourceHash };
    }
    const railSourceDocuments = initializeRailSourceDocuments(db, {
      schemaSql: readFileSync(new URL('./rail-source-documents.sql', import.meta.url), 'utf8'),
      sources: railSources, actor, reason });
    const populationPath = 'lore/regions/sources/population-2026-08.json';
    const populationBytes = importBytes(populationPath);

    const populationDocument = initializePopulationDocument(db, {
      schemaSql: readFileSync(new URL('./population-document.sql', import.meta.url), 'utf8'),
      sourceBytes: populationBytes, expectedSourceHash: POPULATION_SOURCE_HASH, actor, reason });
    const householdPolicyPath = 'lore/name-pools/household-humanoid-policy.json';
    const householdPolicyBytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(householdPolicyPath).raw_bytes);
    const householdPolicyDocument = initializeHouseholdPolicyDocument(db, {
      schemaSql: readFileSync(new URL('./household-policy-document.sql', import.meta.url), 'utf8'),
      sourceBytes: householdPolicyBytes, expectedSourceHash: HOUSEHOLD_POLICY_SOURCE_HASH, actor, reason });
    const clanSeedPath = 'lore/name-pools/clans-hangnyeol.json';
    const clanSeedBytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(clanSeedPath).raw_bytes);
    const clanSeedDocument = initializeClanSeedDocument(db, {
      schemaSql: readFileSync(new URL('./clan-seed-document.sql', import.meta.url), 'utf8'),
      sourceBytes: clanSeedBytes, expectedSourceHash: CLAN_SEED_SOURCE_HASH, actor, reason });
    const lineageDocuments = {};
    for (const [name, expectedSourceHash, initialize] of [
      ['hangnyeol-systems', HANGNYEOL_SYSTEMS_SOURCE_HASH, initializeHangnyeolSystemsDocument],
      ['surnames-bongwan', SURNAME_ORIGIN_SOURCE_HASH, initializeSurnameOriginDocument],
      ['diaspora-family-lineages', DIASPORA_LINEAGE_SOURCE_HASH, initializeDiasporaLineageDocument],
    ]) {
      const logicalPath = `lore/name-pools/${name}.json`;
      const bytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes);
      const schemaName = name === 'hangnyeol-systems' ? 'hangnyeol-systems-document'
        : name === 'surnames-bongwan' ? 'surname-origin-document' : 'diaspora-lineage-document';
      lineageDocuments[name] = initialize(db, {
        schemaSql: readFileSync(new URL(`./${schemaName}.sql`, import.meta.url), 'utf8'),
        sourceBytes: bytes, expectedSourceHash, actor, reason });
    }
    const catalogMetadataSources = CATALOG_METADATA_PATHS.map(logicalPath => {
      const bytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes);
      return { logicalPath, document: JSON.parse(bytes), sourceSha256: hash(bytes) };
    });
    const catalogMetadata = initializeCatalogMetadata(db, {
      schemaSql: readFileSync(new URL('./catalog-metadata.sql', import.meta.url), 'utf8'),
      documents: catalogMetadataSources, actor, reason });
    const catalogSourceDocuments = {};
    for (const [logicalPath, schemaName, expectedSourceHash, initialize] of [
      ['lore/name-pools/clan-hangnyeol-tables.json', 'clan-catalog-document', CLAN_CATALOG_SOURCE_HASH, initializeClanCatalogDocument],
      ['lore/places/Station-Alias-Candidates.json', 'station-alias-document', STATION_ALIAS_SOURCE_HASH, initializeStationAliasDocument],
      ['lore/places/landmark-roles.json', 'landmark-role-document', LANDMARK_ROLE_SOURCE_HASH, initializeLandmarkRoleDocument],
      ['lore/places/sources/Winter-Climate-20210108.json', 'winter-climate-document', WINTER_CLIMATE_SOURCE_HASH, initializeWinterClimateDocument],
      ['lore/relations/state-formation-contract.json', 'state-formation-document', STATE_FORMATION_SOURCE_HASH, initializeStateFormationDocument],
      ['lore/regions/sources/boundary-comparison.json', 'boundary-comparison-document', BOUNDARY_COMPARISON_SOURCE_HASH, initializeBoundaryComparisonDocument],
      ['lore/regions/sources/selection.json', 'geography-selection-document', GEOGRAPHY_SELECTION_SOURCE_HASH, initializeGeographySelectionDocument],
      ['snapshots/build-inputs/creative-name-normalization.json', 'creative-name-document', CREATIVE_NAME_SOURCE_HASH, initializeCreativeNameDocument],
      ['scripts/data/admin-city-hierarchy.json', 'admin-city-document', ADMIN_CITY_SOURCE_HASH, initializeAdminCityDocument],
      ['scripts/data/admin-territorial-catalog.json', 'admin-territorial-document', ADMIN_TERRITORIAL_SOURCE_HASH, initializeAdminTerritorialDocument],
      ['lore/name-pools/roster-100.json', 'candidate-roster-document', CANDIDATE_ROSTER_SOURCE_HASH, initializeCandidateRosterDocument],
      ['lore/name-pools/unit-roster.json', 'unit-proposal-document', UNIT_PROPOSAL_SOURCE_HASH, initializeUnitProposalDocument],
      ['lore/name-pools/settlement-npc-generator.json', 'npc-proposal-document', NPC_PROPOSAL_SOURCE_HASH, initializeNpcProposalDocument],
      ['lore/name-pools/cast-backfill-draft.json', 'cast-backfill-document', CAST_BACKFILL_SOURCE_HASH, initializeCastBackfillDocument],
      ['lore/editorial/Character-System-Contract.json', 'character-contract-document', CHARACTER_CONTRACT_SOURCE_HASH, initializeCharacterContractDocument],
      ['lore/editorial/Naming-Ledger.json', 'naming-ledger-document', NAMING_LEDGER_SOURCE_HASH, initializeNamingLedgerDocument],
    ]) {
      const migratedProposal = ['candidate-roster-document', 'unit-proposal-document', 'npc-proposal-document', 'cast-backfill-document',
        'clan-catalog-document', 'station-alias-document', 'landmark-role-document', 'winter-climate-document'].includes(schemaName);
      const bytes = migratedProposal
        ? Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes)
        : importBytes(logicalPath);
      if (!migratedProposal) assert.deepEqual(bytes, git(sourceRoot, ['show', `${sourceGitCommit}:${logicalPath}`]));
      const result = initialize(db, {
        schemaSql: readFileSync(new URL(`./${schemaName}.sql`, import.meta.url), 'utf8'),
        sourceBytes: bytes, expectedSourceHash, actor, reason });
      catalogSourceDocuments[logicalPath] = schemaName === 'landmark-role-document' ? { sites: result.sites.length }
        : schemaName === 'unit-proposal-document' ? { units: result.unit_types.length } : result;
    }
    const retiredTerritorySources = {};
    const atlasPath = 'snapshots/build-inputs/atlas-data.js';
    const atlasBytes = importBytes(atlasPath);

    const regionAtlas = initializeRegionAtlasDocument(db, {
      schemaSql: readFileSync(new URL('./region-atlas-document.sql', import.meta.url), 'utf8'),
      sourceBytes: atlasBytes, expectedSourceHash: REGION_ATLAS_SOURCE_HASH, actor, reason });
    const schemaSources = {};
    const schemaArchive = new DatabaseSync(resolve(sourceRoot, '.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite'), { readOnly: true });
    try {
      for (const [logicalPath, expectedSourceHash] of Object.entries(AUTHORING_SCHEMA_SOURCE_HASHES)) {
        const bytes = Buffer.from(schemaArchive.prepare(
          'SELECT raw_bytes FROM evidence WHERE identity=? AND logical_path=? AND sha256=?'
        ).get('scope-read:' + logicalPath, logicalPath, expectedSourceHash).raw_bytes);
        schemaSources[logicalPath] = { bytes, expectedSourceHash };
      }
    } finally { schemaArchive.close(); }
    const authoringSchemas = initializeAuthoringSchemaDocuments(db, {
      schemaSql: readFileSync(new URL('./authoring-schema-documents.sql', import.meta.url), 'utf8'),
      sources: schemaSources, actor, reason });
    const editorialExamplePath = 'lore/editorial/authoring.example.json';
    const editorialExampleBytes = importBytes(editorialExamplePath);
    const editorialExample = initializeEditorialExampleDocument(db, { sourceBytes: editorialExampleBytes,
      expectedSourceHash: EDITORIAL_EXAMPLE_SOURCE_HASH, actor, reason });
    const graphPath = 'snapshots/build-inputs/SeoulWorldGraph.json';
    const graphBytes = importBytes(graphPath);

    const sourceGraph = initializeWorldGraphDocument(db, {
      schemaSql: readFileSync(new URL('./world-graph-document.sql', import.meta.url), 'utf8'),
      sourceBytes: graphBytes, expectedSourceHash: WORLD_GRAPH_SOURCE_HASH, actor, reason });
    const decisionSources = {};
    for (const [logicalPath, expectedSourceHash] of Object.entries(EDITORIAL_DECISION_SOURCE_HASHES)) {
      const bytes = importBytes(logicalPath);

      decisionSources[logicalPath] = { bytes, expectedSourceHash };
    }
    const editorialDecisions = initializeEditorialDecisionDocuments(db, {
      schemaSql: readFileSync(new URL('./editorial-decision-documents.sql', import.meta.url), 'utf8'),
      sources: decisionSources, actor, reason });
    const relationProposalPath = 'docs/editorial/2026-09-29/cast-relations-unpublished-proposal.json';
    const relationProposalBytes = importBytes(relationProposalPath);

    const relationProposal = initializeRelationProposalDocument(db, { sourceBytes: relationProposalBytes,
      expectedSourceHash: RELATION_PROPOSAL_SOURCE_HASH, actor, reason });
    const editorialVerificationPath = 'docs/editorial/2026-09-29/verification-evidence.json';
    const editorialVerificationBytes = importBytes(editorialVerificationPath);

    const editorialVerification = initializeEditorialVerificationDocument(db, { sourceBytes: editorialVerificationBytes,
      expectedSourceHash: EDITORIAL_VERIFICATION_SOURCE_HASH, expectedDocumentHash: EDITORIAL_VERIFICATION_DOCUMENT_HASH, actor, reason });
    for (const [logicalPath, expectedSourceHash] of Object.entries(RETIRED_TERRITORY_SOURCE_HASHES)) {
      const bytes = importBytes(logicalPath);

      retiredTerritorySources[logicalPath] = { bytes, expectedSourceHash };
    }
    const retiredTerritoryDocuments = initializeRetiredTerritoryDocuments(db, {
      schemaSql: readFileSync(new URL('./retired-territory-documents.sql', import.meta.url), 'utf8'),
      sources: retiredTerritorySources, actor, reason });
    const buildManifestPath = 'snapshots/build-inputs/source-manifest.json';
    const buildManifestBytes = importBytes(buildManifestPath);

    const buildSourceManifest = initializeBuildSourceManifest(db, {
      sourceBytes: buildManifestBytes, expectedSourceHash: BUILD_SOURCE_MANIFEST_HASH, actor, reason });
    initializeDocumentKeyOrder(db, typed.map(identity => ({ sourceId: identity.source_id,
      document: snapshot.get(identity.logical_path).document })));
    for (const attestation of attestations) {
      const reference = readEvidenceDocumentReference(db, {
        logicalPath: attestation.sourcePath, expectedSha256: attestation.sourceSha256,
      });
      assert.equal(reference.semanticSha256, attestation.semanticSha256);
    }
    console.log(`BOOTSTRAP initialized ${initialized.length} verified documents; recording authentic review`);
    const admissions = await recordPublicationReview(db, review);
    const current = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    const decisions = current.map((d) => {
      const rows = review.documents.filter((row) => row.sourcePath === d.logical_path);
      assert.equal(rows.length, 1, `review coverage ${d.logical_path}`);
      assert.equal(rows[0].currentSha256, d.sha256);
      return { sourceId: d.source_id, sourcePath: d.logical_path, classification: rows[0].classification,
        reason: rows[0].reason, eligible: rows[0].eligible, admitted: admissions.some((a) => a.sourceId === d.source_id) };
    });
    const safeDb = { prepare(sql) { assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu); return db.prepare(sql); } };
    const publicList = listDocuments(safeDb, { corpusKind: 'current' });
    for (const d of publicList) assert.deepEqual(readDocument(safeDb, { ...select(d), visibility: 'public' }), snapshot.get(d.logical_path).document);
    const authoredArticles = articles.filter((a) => !['wiki:Glossary', 'wiki:index'].includes(a.id));
    const coverage = authoredArticles.map((a) => {
      const d = publicList.find((d) => d.logical_path === a.source);
      const typedRoute = d ? `/world/${d.slug === 'index' ? '' : d.slug}` : null;
      return { articleRoute: a.route, sourcePath: a.source, typedDocumentId: d?.document_id ?? null,
        typedRoute, exactRoute: typedRoute === a.route };
    });
    // Migration snapshot of exact reviewed publisher identities, not runtime path inference.
    // A null source_id is deliberate for computed pages and an unadmitted source.
    db.exec(`CREATE TABLE article_route (
      route TEXT PRIMARY KEY, article_id TEXT NOT NULL, source_path TEXT NOT NULL,
      source_id INTEGER REFERENCES text_document(source_id),
      derivation TEXT NOT NULL CHECK(derivation IN ('typed-envelope','computed-glossary','computed-index','unadmitted-source')),
      derivation_json TEXT NOT NULL
    ) STRICT`);
    const routes = articles.map((article) => {
      const identity = publicList.find((d) => d.logical_path === article.source);
      const derivation = article.id === 'wiki:Glossary' ? 'computed-glossary'
        : article.id === 'wiki:index' ? 'computed-index' : identity ? 'typed-envelope' : 'unadmitted-source';
      const sourcePaths = derivation === 'computed-index'
        ? ['lore/characters/Core-Characters.json', 'lore/factions/Sixteen-States.json', 'lore/chronology/Scenario-Timeline.json']
        : [article.source];
      const metadata = { version: 1, sourceGitCommit, review: 'authenticated-current-reviewed',
        sourceBindings: sourcePaths.map((sourcePath) => {
          const decision = review.documents.find((d) => d.sourcePath === sourcePath);
          assert.equal(decision?.eligible, true, `route dependency not reviewed: ${sourcePath}`);
          return { sourcePath, sha256: decision.currentSha256 };
        }), materialized: derivation === 'typed-envelope',
        ...(identity ? { documentId: identity.document_id, domain: identity.domain, envelopeSlug: identity.slug } : {}) };
      db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?,?)').run(article.route, article.id, article.source,
        identity?.source_id ?? null, derivation, JSON.stringify(metadata));
      return { route: article.route, sourceId: identity?.source_id ?? null, derivation, ...metadata };
    });
    const glossaryRoute = routes.find(row => row.derivation === 'computed-glossary');
    const glossaryBytes = importBytes('lore/glossary.json');
    assert.deepEqual(glossaryBytes, git(sourceRoot, ['show', `${sourceGitCommit}:lore/glossary.json`]));
    const glossaryHead = initializeGlossaryStore(db, { approvedBytes: glossaryBytes,
      expectedSha256: glossaryRoute.sourceBindings[0].sha256, provenanceLabel: 'DOC:Glossary:reviewed-bootstrap', actor, reason });
    const additionalLines = new Map();
    for (const logicalPath of Object.keys(ADDITIONAL_LINE_SOURCE_HASHES)) {
      const bytes = importBytes(logicalPath);

      additionalLines.set(logicalPath, bytes);
    }
    importAdditionalLineSources(db, additionalLines);
    const lineSources = db.prepare('SELECT source_id FROM text_line_document ORDER BY source_id').all().map(row => row.source_id);
    const lineHeads = initializeLineDocumentStore(db, { sourceIds: lineSources, actor, reason });
    const familyPath = 'lore/name-pools/cast-family-trees.json';
    const familyBytes = importBytes(familyPath);

    initializeFamilyKeyOrder(db, familyBytes);
    const familySourceDocument = initializeFamilySourceDocument(db, {
      schemaSql: readFileSync(new URL('./family-source-document.sql', import.meta.url), 'utf8'),
      sourceBytes: familyBytes, expectedSourceHash: FAMILY_SOURCE_HASH, actor, reason });
    const geographyPath = 'lore/regions/seoul-electoral-titles.json';
    const geographyBytes = importBytes(geographyPath);

    const geographySource = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').get(geographyPath);
    assert.ok(geographySource, 'existing geography source archive required');
    const geography = initializeGeographyStore(db, { approvedBytes: geographyBytes,
      expectedSha256: geographySource.sha256, actor, reason });
    assert.deepEqual(readGeographyStore(db), JSON.parse(geographyBytes));
    const atlasInputs = {};
    for (const [kind, name] of Object.entries({ registry: 'person-id-registry', candidates: 'person-id-candidates', values: 'values-cast', gurps: 'gurps-cast' })) {
      const logicalPath = `lore/name-pools/${name}.json`;
      const approvedBytes = importBytes(logicalPath);

      atlasInputs[kind] = { approvedBytes, expectedSha256: hash(approvedBytes) };
    }
    const atlasIdentity = initializeAtlasIdentity(db, { ...atlasInputs, actor, reason });
    const identityBytes = {};
    for (const [kind, name] of Object.entries({ lineage: 'cast-hangnyeol', gender: 'gender-cast' })) {
      const path = `lore/name-pools/${name}.json`;
      const bytes = importBytes(path);

      identityBytes[`${kind}Bytes`] = bytes;
    }
    const personIdentity = await initializePersonIdentityInputs(db, { ...identityBytes,
      expectedSourceHashes: PERSON_IDENTITY_SOURCE_HASHES, actor, reason });
    const identityDocuments = initializePersonIdentityDocuments(db, {
      schemaSql: readFileSync(new URL('./person-identity-documents.sql', import.meta.url), 'utf8'),
      ...identityBytes, expectedSourceHashes: PERSON_IDENTITY_SOURCE_HASHES, actor, reason });
    const contextBytes = {};
    for (const [kind, name] of Object.entries({ birthdays: 'cast-birthdays', contacts: 'cast-prose-contacts' })) {
      const path = `lore/name-pools/${name}.json`;
      const bytes = importBytes(path);

      contextBytes[`${kind}Bytes`] = bytes;
    }
    const contextDocuments = initializePersonContextDocuments(db, {
      schemaSql: readFileSync(new URL('./person-context-documents.sql', import.meta.url), 'utf8'),
      ...contextBytes, expectedSourceHashes: PERSON_CONTEXT_SOURCE_HASHES, actor, reason });
    const censusEventPath = 'lore/editorial/seoul-narrative-census-events.json';
    const censusEventBytes = importBytes(censusEventPath);

    const censusEvents = initializeCensusEventInputs(db, { bytes: censusEventBytes, actor, reason });
    const holdingPath = 'lore/relations/personal-holdings.json';
    const holdingBytes = importBytes(holdingPath);

    const personalHoldings = await initializePersonalHoldingInputs(db, { sourceBytes: holdingBytes,
      expectedSourceHash: PERSONAL_HOLDING_SOURCE_HASH, actor, reason });
    const officePath = 'lore/relations/opening-office-appointments.json';
    const officeBytes = importBytes(officePath);

    const officeAppointments = await initializeOfficeAppointmentInputs(db, { sourceBytes: officeBytes,
      expectedSourceHash: OFFICE_APPOINTMENT_SOURCE_HASH, actor, reason });
    const allocationPath = 'lore/relations/opening-feudal-allocation.json';
    const allocationBytes = importBytes(allocationPath);

    const feudalAllocation = await initializeFeudalAllocationInputs(db, { sourceBytes: allocationBytes,
      expectedSourceHash: FEUDAL_ALLOCATION_SOURCE_HASH, actor, reason });
    const interiorPath = 'lore/regions/station-interiors.json';
    const interiorBytes = importBytes(interiorPath);

    const stationInteriors = await initializeStationInteriorInputs(db, { sourceBytes: interiorBytes,
      expectedSourceHash: STATION_INTERIOR_SOURCE_HASH, actor, reason });
    const preservationBaselineBytes = importBytes('scripts/issued-preservation-baseline.json');
    const preservationBaseline = JSON.parse(preservationBaselineBytes);
    const preservedSheets = initializePreservedSheetInputs(db, {
      schemaSql: readFileSync(new URL('./preserved-sheet-inputs.sql', import.meta.url), 'utf8'),
      baselineBytes: preservationBaselineBytes,
      documents: Object.keys(preservationBaseline.revisions).map(revision => ({ revision,
        bytes: readFileSync(resolve(sourceRoot, `vendor/issued-history/${revision}.json`)) })),
      sourceBytes: new Map(Object.keys(preservationBaseline.sourceHashes).map(path => [path,
        readFileSync(resolve(sourceRoot, 'vendor/issued-history/corpus', path))])), actor, reason,
    });
    await initializeIssuedSheetInputs(db, { sourceBytes: atlasInputs.gurps.approvedBytes,
      expectedSourceHash: ISSUED_SHEET_SOURCE_HASH, actor, reason });
    const issuedSheetDocument = initializeIssuedSheetDocument(db, {
      schemaSql: readFileSync(new URL('./issued-sheet-document.sql', import.meta.url), 'utf8'),
      sourceBytes: atlasInputs.gurps.approvedBytes, expectedSourceHash: ISSUED_SHEET_SOURCE_HASH, actor, reason });
    const permissionPath = 'person-rights-permissions.json';
    const permissionBytes = importBytes(permissionPath);

    const permissions = initializePermissionStore(db, { approvedBytes: permissionBytes,
      expectedSha256: 'ddde4314cd942e187ee91c954418b8fba672e4aa2284412eba97b551f1c3da7c', actor, reason });
    assert.deepEqual(readPermissionStore(db), JSON.parse(permissionBytes));
    const relationPath = 'lore/relations/relations.json';
    const relationBytes = importBytes(relationPath);

    const relationSource = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').get(relationPath);
    assert.ok(relationSource, 'existing relation archive required');
    const relationConfig = initializeRelationInputs(db, { approvedBytes: relationBytes, expectedSha256: relationSource.sha256 });
    const portraitInputs = {};
    for (const kind of ['catalog', 'properties', 'selection']) {
      const logicalPath = `portrait-${kind === 'selection' ? 'approved-selection' : kind}.json`;
      const bytes = importBytes(logicalPath);

      portraitInputs[kind] = { bytes, expectedSha256: hash(bytes), actor, reason };
    }
    initializePortraitStore(db, portraitInputs);
    const portraits = readPortraitDocuments(db);
    for (const kind of Object.keys(portraitInputs)) assert.deepEqual(portraits[kind], JSON.parse(portraitInputs[kind].bytes));
    const directoryEntries = [];
    function captureDirectory(path) {
      directoryEntries.push({ path, kind: 'directory' });
      for (const entry of readdirSync(resolve(sourceRoot, path), { withFileTypes: true })) {
        const child = `${path}/${entry.name}`;
        if (entry.isDirectory()) captureDirectory(child);
        else if (entry.isFile()) directoryEntries.push({ path: child, kind: 'file' });
        else fail(`unsupported inventory entry: ${child}`);
      }
    }
    for (const path of SCOPE_SOURCE_DIRECTORIES) captureDirectory(path);
    const directoryInventory = initializeScopeDirectoryInventory(db, directoryEntries);
    const after = archive(db, archivedIds);
    assert.deepEqual(after, before, 'bootstrap changed preexisting archives');
    assert.equal(hash(readFileSync(input)), inputFileSha256, 'canonical bytes changed');
    for (const a of attestations) {
      const d = typed.find((d) => d.source_id === a.sourceId);
      assert.equal(digest(readDocument(safeDb, select(d))), a.semanticSha256);
      assert.equal(db.prepare('SELECT semantic_sha256 FROM document_revision WHERE source_id=?').get(a.sourceId).semantic_sha256, a.semanticSha256);
    }
    result = { schema: 'document-authority-bootstrap.v1', bootstrapId: randomUUID(), input, output, sourceGitCommit,
      inputFileSha256, canonicalUnchanged: true, archiveBefore: before, archiveAfter: after,
      completeness: { algorithm: 'full-source-typed-envelope-canonical-sha256', count: attestations.length, attestations },
      imported: imported.imported, initialized: initialized.length, admissions: admissions.length,
      scopeContract,
      directoryInventory,
      censusDocuments: { people: censusDocuments.ledger.people.length,
        reviewDocuments: censusDocuments.review.documents.length, mappings: censusDocuments.review.mapping.exceptions.length },
      regionDocuments: { documents: Object.keys(regionDocuments).length,
        regions: Object.values(regionDocuments).reduce((sum, document) => sum + document.regions.length, 0) },
      namePoolDocuments,
      existingNamesDocument,
      organizationValuesDocument,
      familyRoleDocument: { decisions: Object.values(familyRoleDocument)
        .filter(Array.isArray).reduce((sum, group) => sum + group.length, 0) },
      railSourceDocuments: { documents: Object.keys(railSourceDocuments).length },
      populationDocument: { dongs: Object.keys(populationDocument.density2126ByDong).length },
      householdPolicyDocument,
      clanSeedDocument,
      lineageDocuments,
      catalogSourceDocuments,
      catalogMetadata: { ...catalogMetadata,
        sources: catalogMetadataSources.map(({ logicalPath, sourceSha256 }) => ({ logicalPath, sourceSha256 })) },
      relationProposal,
      sourceGraph: { stations: sourceGraph.stations.length, edges: sourceGraph.edges.length },
      editorialDecisions,
      authoringSchemas,
      regionAtlas,
      editorialExample,
      editorialVerification,
      retiredTerritoryDocuments,
      buildSourceManifest,
      glossary: { ...glossaryHead, terms: listGlossaryEntries(db, { visibility: 'internal' }).length,
        publicTerms: listGlossaryEntries(db).length }, lineDocuments: lineHeads,
      geography: { ...geography, sourceId: geographySource.source_id, visibility: 'internal' },
      atlasIdentity: { people: atlasIdentity.people.length, routes: atlasIdentity.routes.size },
      personIdentity: { lineage: personIdentity.lineageByName.size,
        gender: personIdentity.genderByName.size, sourceHashes: PERSON_IDENTITY_SOURCE_HASHES },
      identityDocuments: { lineagePeople: identityDocuments.lineage.people.length,
        genderPeople: identityDocuments.gender.people.length, policies: identityDocuments.gender.policies.length },
      contextDocuments: { birthdays: contextDocuments.birthdays.people.length, contacts: contextDocuments.contacts.records.length },
      familySourceDocument: { nodes: familySourceDocument.nodes.length, edges: familySourceDocument.edges.length },
      censusEvents: { count: censusEvents.length },
      personalHoldings: { count: personalHoldings.holdings.length, sourceSha256: PERSONAL_HOLDING_SOURCE_HASH },
      officeAppointments: { count: officeAppointments.appointments.length, sourceSha256: OFFICE_APPOINTMENT_SOURCE_HASH },
      feudalAllocation: { titles: feudalAllocation.titles.length, grants: feudalAllocation.grants.length,
        sourceSha256: FEUDAL_ALLOCATION_SOURCE_HASH },
      stationInteriors: { count: stationInteriors.stations.length, sourceSha256: STATION_INTERIOR_SOURCE_HASH },
      preservedSheets: preservedSheets.map(version => ({ revision: version.revision,
        count: version.people.size, ledgerSha256: version.ledgerSha256 })),
      issuedSheets: { count: 1022, sourceSha256: ISSUED_SHEET_SOURCE_HASH },
      issuedSheetDocument,
      permissions,
      relations: { courts: relationConfig.courts.length, retainers: relationConfig.directRetainers.length },
      portraits: { catalog: portraits.catalog.entries.length, properties: Object.keys(portraits.properties.entries).length,
        selection: portraits.selection.records.length },
      currentDocuments: current.length, publicDocuments: publicList.length, decisions,
      categoryRegistry: { sha256: db.prepare('SELECT source_sha256 FROM catalog_metadata_document WHERE logical_path=?').get('scripts/category-registry.json').source_sha256,
        note: 'Category validation uses authored metadata; source filenames determine publisher routes, envelope slugs determine typed routes.',
        errors: publicList.flatMap((d) => registrationErrors(snapshot.get(d.logical_path).document, registry, basename(d.logical_path))) },
      articleRoutes: routes,
      articleCoverage: { published: articles.length, authored: authoredArticles.length,
        admittedByExactSource: coverage.filter((r) => r.typedDocumentId !== null).length,
        exactRoutes: coverage.filter((r) => r.exactRoute).length, rows: coverage,
        computed: articles.filter((a) => ['wiki:Glossary', 'wiki:index'].includes(a.id)),
        publicTypedWithoutArticle: publicList.filter((d) => !authoredArticles.some((a) => a.source === d.logical_path)).map((d) => ({ sourcePath: d.logical_path, documentId: d.document_id, slug: d.slug })) },
      ...runIntegrityChecks(db), httpVerified: false, scope: 'isolated-bootstrap-only-not-runtime-cutover' };
  } finally { db.close(); }
  writeFileSync(receipt, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ output, receipt, initialized: result.initialized, admissions: result.admissions,
    publicDocuments: result.publicDocuments, coverage: { ...result.articleCoverage, rows: undefined, publicTypedWithoutArticle: undefined } }));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const keys = { '--source-root': 'sourceRoot', '--input': 'input', '--output': 'output', '--baseline': 'baseline', '--receipt': 'receipt', '--actor': 'actor', '--reason': 'reason' };
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = keys[process.argv[i]], value = process.argv[i + 1];
    if (!key || !value || options[key] !== undefined) fail('explicit unique named arguments required');
    options[key] = value;
  }
  await bootstrapDocumentAuthority(options);
}
