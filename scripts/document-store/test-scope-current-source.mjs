import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { readSourceArchive } from '../cast-sqlite/source-archive.mjs';
import { readScopeCurrentSource, PUBLICATION_SUCCESSOR_HEADS, PUBLICATION_DATA_SUCCESSORS, authenticatePublicationDataSuccessor } from './scope-current-source.mjs';
import { SCOPE_CONTRACT_SOURCE_SHA256 } from '../cast-sqlite/scope-contract-store.mjs';
import { CENSUS_DOCUMENT_PINS } from '../cast-sqlite/census-document-store.mjs';
import { STATION_INTERIOR_SOURCE_HASH } from '../cast-sqlite/station-interior-inputs.mjs';
import { FEUDAL_ALLOCATION_SOURCE_HASH } from '../cast-sqlite/feudal-allocation-inputs.mjs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { initializeGlossaryStore, readGlossaryHead, updateGlossaryEntries } from '../cast-sqlite/glossary-store.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { REGION_CONTENT_SOURCE_HASHES } from '../cast-sqlite/region-content-documents.mjs';
import { NAME_POOL_SOURCE_HASHES } from '../cast-sqlite/name-pool-documents.mjs';
import { EXISTING_NAMES_SOURCE_HASH } from '../cast-sqlite/existing-names-document.mjs';
import { ORGANIZATION_VALUES_SOURCE_HASH } from '../cast-sqlite/organization-values-document.mjs';
import { PARENT_STATUS_SOURCE_HASH } from '../cast-sqlite/parent-status-document.mjs';
import { FAMILY_ROLE_SOURCE_HASH } from '../cast-sqlite/family-role-document.mjs';
import { RAIL_SOURCE_HASHES } from '../cast-sqlite/rail-source-documents.mjs';
import { BIRTH_COHORT_SOURCE_HASH } from '../cast-sqlite/birth-cohort-document.mjs';
import { POPULATION_SOURCE_HASH } from '../cast-sqlite/population-document.mjs';
import { HOUSEHOLD_POLICY_SOURCE_HASH } from '../cast-sqlite/household-policy-document.mjs';
import { CLAN_SEED_SOURCE_HASH } from '../cast-sqlite/clan-seed-document.mjs';
import { HANGNYEOL_SYSTEMS_SOURCE_HASH } from '../cast-sqlite/hangnyeol-systems-document.mjs';
import { SURNAME_ORIGIN_SOURCE_HASH } from '../cast-sqlite/surname-origin-document.mjs';
import { DIASPORA_LINEAGE_SOURCE_HASH } from '../cast-sqlite/diaspora-lineage-document.mjs';
import { CLAN_CATALOG_SOURCE_HASH } from '../cast-sqlite/clan-catalog-document.mjs';
import { STATION_ALIAS_SOURCE_HASH } from '../cast-sqlite/station-alias-document.mjs';
import { LANDMARK_ROLE_SOURCE_HASH } from '../cast-sqlite/landmark-role-document.mjs';
import { WINTER_CLIMATE_SOURCE_HASH } from '../cast-sqlite/winter-climate-document.mjs';
import { STATE_FORMATION_SOURCE_HASH } from '../cast-sqlite/state-formation-document.mjs';
import { RETIRED_TERRITORY_SOURCE_HASHES } from '../cast-sqlite/retired-territory-documents.mjs';
import { BOUNDARY_COMPARISON_SOURCE_HASH } from '../cast-sqlite/boundary-comparison-document.mjs';
import { GEOGRAPHY_SELECTION_SOURCE_HASH } from '../cast-sqlite/geography-selection-document.mjs';
import { CREATIVE_NAME_SOURCE_HASH } from '../cast-sqlite/creative-name-document.mjs';
import { ADMIN_CITY_SOURCE_HASH } from '../cast-sqlite/admin-city-document.mjs';
import { ADMIN_TERRITORIAL_SOURCE_HASH } from '../cast-sqlite/admin-territorial-document.mjs';
import { CANDIDATE_ROSTER_SOURCE_HASH } from '../cast-sqlite/candidate-roster-document.mjs';
import { UNIT_PROPOSAL_SOURCE_HASH } from '../cast-sqlite/unit-proposal-document.mjs';
import { NPC_PROPOSAL_SOURCE_HASH } from '../cast-sqlite/npc-proposal-document.mjs';
import { scopeAuthenticationReader } from './scope-authentication-reader.mjs';

test('publication data successors authenticate each exact delta, parent chain and approval without replacing historical bytes', {
  skip: !process.env.PUBLICATION_SUCCESSOR_DB,
}, async () => {
  const db = openReadOnly(process.env.PUBLICATION_SUCCESSOR_DB);
  try {
    for (const [logicalPath, [archive]] of Object.entries(PUBLICATION_DATA_SUCCESSORS)) {
      const bytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes);
      const original = JSON.parse(bytes);
      const actual = readScopeCurrentSource({ db, logicalPath, expectedSha256: archive, predecessor: true });
      assert.equal(authenticatePublicationDataSuccessor(db, logicalPath, archive, actual, original), true);
      const options = { db, root: '/data-publication', evidenceStore: { getEvidence() { return bytes; } },
        bindings: new Map([[logicalPath, { identity: logicalPath, sha256: archive }]]),
        currentSourceHashes: new Map([[logicalPath, archive]]) };
      assert.deepEqual(await scopeAuthenticationReader(options)(`/data-publication/${logicalPath}`), bytes);
      const changed = structuredClone(actual); changed.unapproved = true;
      assert.throws(() => authenticatePublicationDataSuccessor(db, logicalPath, archive, changed, original), /E_PUBLICATION_DATA_TYPED_MISMATCH/u);
      for (const field of ['reason', 'approval_ref', 'parent_revision']) {
        const tampered = { prepare(sql) {
          const statement = db.prepare(sql);
          if (sql === 'SELECT * FROM data_source_revision WHERE revision_id=?') return { get: (...args) => {
            const row = statement.get(...args);
            return row ? { ...row, [field]: 'unauthorized' } : row;
          } };
          return statement;
        } };
        assert.throws(() => authenticatePublicationDataSuccessor(tampered, logicalPath, archive, actual, original), /E_DATA_SOURCE_INTEGRITY/u);
      }
      if (logicalPath === 'lore/relations/relations.json') {
        const wrong = structuredClone(original); wrong.note += ' unapproved';
        assert.throws(() => authenticatePublicationDataSuccessor(db, logicalPath, archive, actual, wrong), /E_PUBLICATION_DATA_DELTA/u);
      }
    }
  } finally { db.close(); }
});

test('approved publication successor heads require the exact archive, revision and semantic tuple', {
  skip: !process.env.PUBLICATION_SUCCESSOR_DB,
}, () => {
  const db = openReadOnly(process.env.PUBLICATION_SUCCESSOR_DB);
  try {
    for (const [logicalPath, pin] of Object.entries(PUBLICATION_SUCCESSOR_HEADS)) {
      const selection = { logicalPath, expectedSha256: pin.sourceSha256 };
      assert.ok(readScopeCurrentSource({ db, ...selection }).id);
      assert.throws(() => readScopeCurrentSource({ db, ...selection, expectedSha256: '0'.repeat(64) }),
        /E_SCOPE_DB_SOURCE_HASH/u);
      for (const field of ['revision_id', 'semantic_sha256']) {
        const changed = { prepare(sql) {
          const statement = db.prepare(sql);
          if (sql.includes('JOIN document_revision_seal')) return { all: (...args) =>
            statement.all(...args).map(row => ({ ...row, [field]: '0'.repeat(64) })) };
          return statement;
        } };
        assert.throws(() => readScopeCurrentSource({ db: changed, ...selection }),
          /E_REFERENCE_STALE|E_SCOPE_DB_SOURCE_STALE/u);
      }
      const changedBody = { prepare(sql) {
        const statement = db.prepare(sql);
        if (sql.includes('SELECT * FROM text_document_slot WHERE')) return { all: (...args) =>
          statement.all(...args).map((row, index) => index ? row : { ...row, text: 'unauthorized body' }) };
        return statement;
      } };
      assert.throws(() => readScopeCurrentSource({ db: changedBody, ...selection }),
        /E_REFERENCE_INTEGRITY|E_DOCUMENT_SCHEMA_GAP/u);
    }
  } finally { db.close(); }
});

test('successor evidence validates current typed bodies while preserving exact legacy review bytes', {
  skip: !process.env.PUBLICATION_SUCCESSOR_DB,
}, async () => {
  const db = openReadOnly(process.env.PUBLICATION_SUCCESSOR_DB);
  try {
    for (const [logicalPath, pin] of Object.entries(PUBLICATION_SUCCESSOR_HEADS)) {
      const bytes = Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(logicalPath).raw_bytes);
      const options = { db, root: '/publication-evidence',
        evidenceStore: { getEvidence() { return bytes; } },
        bindings: new Map([[logicalPath, { identity: logicalPath, sha256: pin.sourceSha256 }]]),
        currentSourceHashes: new Map([[logicalPath, pin.sourceSha256]]) };
      assert.deepEqual(await scopeAuthenticationReader(options)(`/publication-evidence/${logicalPath}`), bytes);
      const changed = { prepare(sql) {
        const statement = db.prepare(sql);
        if (sql.includes('JOIN document_revision_seal')) return { all: (...args) =>
          statement.all(...args).map(row => ({ ...row, semantic_sha256: '0'.repeat(64) })) };
        return statement;
      } };
      await assert.rejects(scopeAuthenticationReader({ ...options, db: changed })(`/publication-evidence/${logicalPath}`),
        /E_REFERENCE_STALE/u);
    }
  } finally { db.close(); }
});

test('scope family-role source requires an explicit hash before opening the database', () => {
  const db = { prepare() { throw Error('database should not be consulted'); } };
  for (const expectedSha256 of [undefined, null, '0'.repeat(64)]) {
    assert.throws(() => readScopeCurrentSource({db,
      logicalPath:'lore/name-pools/cast-family-role-decisions.json',expectedSha256}), /E_SCOPE_DB_SOURCE_HASH/u);
  }
});

test('scope registry rejects changed approval metadata and missing roster rows', {
  skip: !process.env.SCOPE_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const selection = { logicalPath:'lore/name-pools/person-id-registry.json',
    expectedSha256:'c02b435da25b09a2c388b694a656242e150de9d169da9fb59c21f6880ac4a63a' };
  try {
    for (const table of ['identity_registry_provenance','atlas_identity_registry_person']) {
      const changed = { prepare(sql) {
        const statement = db.prepare(sql);
        if (sql.includes('FROM '+table)) return { all: (...args) => {
          const rows=statement.all(...args);
          return table === 'identity_registry_provenance' ? rows.map(r => ({...r,owner_ref:'changed'})) : rows.slice(0,-1);
        } };
        return statement;
      } };
      assert.throws(() => readScopeCurrentSource({db:changed,...selection}),
        /E_SCOPE_DB_SOURCE_INTEGRITY|E_ATLAS_IDENTITY_COVERAGE/u);
    }
  } finally { db.close(); }
});

test('scope ID candidates reject changed metadata and missing candidate rows', {
  skip: !process.env.SCOPE_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const selection = { logicalPath:'lore/name-pools/person-id-candidates.json',
    expectedSha256:'e208daf90927feeb9a04ac096190987a16903ab809e2265545fef9b968e30034' };
  try {
    for (const table of ['atlas_identity_candidate_metadata','atlas_identity_candidate']) {
      const changed = { prepare(sql) {
        const statement = db.prepare(sql);
        if (sql.includes('FROM '+table+' ')) return { all: (...args) => {
          const rows = statement.all(...args);
          return table === 'atlas_identity_candidate_metadata'
            ? rows.map(r => ({...r,base_commit:'changed'})) : rows.slice(0,-1);
        } };
        return statement;
      } };
      assert.throws(() => readScopeCurrentSource({db:changed,...selection}),
        /E_SCOPE_DB_SOURCE_INTEGRITY|E_ATLAS_IDENTITY_COVERAGE/u);
    }
  } finally { db.close(); }
});

test('scope birth cohorts reject changed approval metadata and missing assignments', {
  skip: !process.env.SCOPE_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const selection = { logicalPath:'lore/name-pools/cast-birth-cohorts.json', expectedSha256:BIRTH_COHORT_SOURCE_HASH };
  try {
    for (const table of ['family_source_metadata','family_birth_cohort_assignment']) {
      const changed = { prepare(sql) {
        const statement = db.prepare(sql);
        if (sql.includes('FROM '+table+' ')) return { all: (...args) => {
          const rows = statement.all(...args);
          return table === 'family_source_metadata'
            ? rows.map(r => r.field_name === 'approvalRef' ? {...r,text_value:'changed'} : r) : rows.slice(0,-1);
        } };
        return statement;
      } };
      assert.throws(() => readScopeCurrentSource({db:changed,...selection}), /E_BIRTH_COHORT_DOCUMENT/u);
    }
  } finally { db.close(); }
});

test('scope parent status rejects missing and altered existing typed records', {
  skip: !process.env.SCOPE_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const selection = { logicalPath: 'lore/name-pools/cast-family-parent-status.json',
    expectedSha256: PARENT_STATUS_SOURCE_HASH };
  try {
    for (const mutate of [rows => rows.slice(0,-1), rows => rows.map((r,i) => i ? r : { ...r, status:'changed' })]) {
      const changed = { prepare(sql) {
        const statement = db.prepare(sql);
        return /FROM family_parent_status WHERE/u.test(sql)
          ? { all: (...args) => mutate(statement.all(...args)) } : statement;
      } };
      assert.throws(() => readScopeCurrentSource({ db:changed,...selection }), /E_PARENT_STATUS_DOCUMENT/u);
    }
  } finally { db.close(); }
});

test('scope private sources retain full documents with filesystem and JSON parsing blocked', {
  skip: !process.env.SCOPE_CURRENT_DB || !process.env.SCOPE_PROFILE_DB || !process.env.SCOPE_SOUL_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const editorialProfiles = openEditorialProfiles(process.env.SCOPE_PROFILE_DB, {
    capability: INTERNAL_PROFILE_CAPABILITY, expectedSourceHashes: EDITORIAL_PROFILE_SOURCE_HASHES });
  const soulAssignments = openSoulAssignments(process.env.SCOPE_SOUL_DB, {
    capability: INTERNAL_SOUL_CAPABILITY, expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 });
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse];
  try {
    const sources = { ...EDITORIAL_PROFILE_SOURCE_HASHES,
      'lore/editorial/Soul-Assignments.json': SOUL_ASSIGNMENT_SOURCE_SHA256 };
    const expected = new Map(Object.keys(sources).map(path => [path,
      JSON.parse(readFileSync(new URL('../../' + path, import.meta.url)))]));
    const deny = () => { throw new Error('scope private source IO forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    for (const [logicalPath, expectedSha256] of Object.entries(sources)) {
      assert.deepEqual(readScopeCurrentSource({ db, logicalPath, expectedSha256,
        editorialProfiles, soulAssignments }), expected.get(logicalPath));
    }
    assert.throws(() => readScopeCurrentSource({ db, logicalPath: 'lore/editorial/Soul-Assignments.json',
      expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 }), /E_SCOPE_PRIVATE_SOUL_REQUIRED/u);
    assert.throws(() => readScopeCurrentSource({ db, logicalPath: 'lore/editorial/Soul-Assignments.json',
      expectedSha256: '0'.repeat(64), soulAssignments }), /E_SCOPE_DB_SOURCE_HASH/u);
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports(); editorialProfiles.close(); soulAssignments.close(); db.close();
  }
});

test('scope glossary refuses an edited head under the original source approval', () => {
  const approvedBytes = readFileSync(new URL('../../lore/glossary.json', import.meta.url));
  const entries = JSON.parse(approvedBytes);
  const expectedSha256 = createHash('sha256').update(approvedBytes).digest('hex');
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  try {
    initializeGlossaryStore(db, { approvedBytes, expectedSha256, provenanceLabel: 'scope fixture', actor: 'test', reason: 'original adoption' });
    assert.deepEqual(readScopeCurrentSource({ db, logicalPath: 'lore/glossary.json', expectedSha256 }), entries);
    updateGlossaryEntries(db, { expectedHead: readGlossaryHead(db).revision,
      updates: [{ ...entries[0], reader_definition_en: 'Changed fixture definition.', status: 'fiction-original' }],
      actor: 'test', reason: 'invalidate original review' });
    assert.throws(() => readScopeCurrentSource({ db, logicalPath: 'lore/glossary.json', expectedSha256 }), /E_SCOPE_DB_SOURCE_STALE/u);
  } finally { db.close(); }
});

test('scope glossary rejects changed typed rows even when the original receipt remains', () => {
  const approvedBytes = readFileSync(new URL('../../lore/glossary.json', import.meta.url));
  const expectedSha256 = createHash('sha256').update(approvedBytes).digest('hex');
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  try {
    initializeGlossaryStore(db, { approvedBytes, expectedSha256, provenanceLabel: 'scope fixture', actor: 'test', reason: 'original adoption' });
    db.exec('DROP TRIGGER glossary_locale_no_UPDATE');
    db.prepare("UPDATE glossary_locale SET reader_definition='Changed fixture definition.' WHERE locale='en'").run();
    assert.throws(() => readScopeCurrentSource({ db, logicalPath: 'lore/glossary.json', expectedSha256 }), /E_SCOPE_DB_SOURCE_INTEGRITY/u);
  } finally { db.close(); }
});

test('scope resolver covers every current typed envelope by independent DB inventory', {
  skip: !process.env.SCOPE_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.SCOPE_CURRENT_DB);
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse];
  try {
    const sources = db.prepare(`SELECT s.logical_path,s.sha256 FROM text_document d
      JOIN source_file s USING(source_id) WHERE d.corpus_kind IN ('current','example') ORDER BY s.logical_path`).all();
    if (process.env.SCOPE_CONTRACT_INCLUDED === '1') sources.push({
      logical_path: 'lore/editorial/Seoul-Scope-Contract.json', sha256: SCOPE_CONTRACT_SOURCE_SHA256 });
    if (process.env.SCOPE_CENSUS_INCLUDED === '1') sources.push(...Object.values(CENSUS_DOCUMENT_PINS)
      .map(pin => ({ logical_path: pin.path, sha256: pin.sourceSha256 })));
    if (process.env.SCOPE_GEOGRAPHY_INCLUDED === '1') {
      sources.push({ logical_path: 'lore/regions/seoul-electoral-titles.json',
        sha256: db.prepare('SELECT sha256 FROM geography_archive WHERE singleton=1').get().sha256 },
      { logical_path: 'lore/regions/station-interiors.json', sha256: STATION_INTERIOR_SOURCE_HASH },
      { logical_path: 'lore/relations/opening-feudal-allocation.json', sha256: FEUDAL_ALLOCATION_SOURCE_HASH });
    }
    if (process.env.SCOPE_LINES_INCLUDED === '1') sources.push(...db.prepare(`SELECT s.logical_path,s.sha256
      FROM text_line_document d JOIN source_file s USING(source_id)`).all());
    if (process.env.SCOPE_GLOSSARY_INCLUDED === '1') sources.push({ logical_path: 'lore/glossary.json',
      sha256: db.prepare('SELECT sha256 FROM glossary_archive WHERE singleton=1').get().sha256 });
    if (process.env.SCOPE_REGIONS_INCLUDED === '1') sources.push(...Object.entries(REGION_CONTENT_SOURCE_HASHES)
      .map(([logical_path, sha256]) => ({ logical_path, sha256 })));
    if (process.env.SCOPE_NAME_POOLS_INCLUDED === '1') sources.push(...Object.entries(NAME_POOL_SOURCE_HASHES)
      .map(([logical_path, sha256]) => ({ logical_path, sha256 })));
    if (process.env.SCOPE_EXISTING_NAMES_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/existing-names.json', sha256: EXISTING_NAMES_SOURCE_HASH });
    if (process.env.SCOPE_ORGANIZATION_VALUES_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/values-orgs.json', sha256: ORGANIZATION_VALUES_SOURCE_HASH });
    if (process.env.SCOPE_PARENT_STATUS_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/cast-family-parent-status.json', sha256: PARENT_STATUS_SOURCE_HASH });
    if (process.env.SCOPE_REGISTRY_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/person-id-registry.json',
      sha256: 'c02b435da25b09a2c388b694a656242e150de9d169da9fb59c21f6880ac4a63a' });
    if (process.env.SCOPE_CANDIDATES_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/person-id-candidates.json',
      sha256: 'e208daf90927feeb9a04ac096190987a16903ab809e2265545fef9b968e30034' });
    if (process.env.SCOPE_FAMILY_ROLE_INCLUDED === '1') sources.push({
      logical_path: 'lore/name-pools/cast-family-role-decisions.json', sha256: FAMILY_ROLE_SOURCE_HASH });
    if (process.env.SCOPE_RAIL_INCLUDED === '1') sources.push(...Object.entries(RAIL_SOURCE_HASHES)
      .map(([logical_path,sha256]) => ({logical_path,sha256})));
    if (process.env.SCOPE_BIRTH_COHORT_INCLUDED === '1') sources.push({
      logical_path:'lore/name-pools/cast-birth-cohorts.json',sha256:BIRTH_COHORT_SOURCE_HASH });
    if (process.env.SCOPE_POPULATION_INCLUDED === '1') sources.push({
      logical_path:'lore/regions/sources/population-2026-08.json',sha256:POPULATION_SOURCE_HASH });
    if (process.env.SCOPE_HOUSEHOLD_POLICY_INCLUDED === '1') sources.push({
      logical_path:'lore/name-pools/household-humanoid-policy.json',sha256:HOUSEHOLD_POLICY_SOURCE_HASH });
    if (process.env.SCOPE_CLAN_SEED_INCLUDED === '1') sources.push({
      logical_path:'lore/name-pools/clans-hangnyeol.json',sha256:CLAN_SEED_SOURCE_HASH });
    if (process.env.SCOPE_LINEAGE_INCLUDED === '1') sources.push(
      {logical_path:'lore/name-pools/hangnyeol-systems.json',sha256:HANGNYEOL_SYSTEMS_SOURCE_HASH},
      {logical_path:'lore/name-pools/surnames-bongwan.json',sha256:SURNAME_ORIGIN_SOURCE_HASH},
      {logical_path:'lore/name-pools/diaspora-family-lineages.json',sha256:DIASPORA_LINEAGE_SOURCE_HASH});
    if (process.env.SCOPE_CATALOG_INCLUDED === '1') sources.push(
      {logical_path:'lore/name-pools/clan-hangnyeol-tables.json',sha256:CLAN_CATALOG_SOURCE_HASH},
      {logical_path:'lore/places/Station-Alias-Candidates.json',sha256:STATION_ALIAS_SOURCE_HASH},
      {logical_path:'lore/places/landmark-roles.json',sha256:LANDMARK_ROLE_SOURCE_HASH});
    if (process.env.SCOPE_REFERENCE_INCLUDED === '1') sources.push(
      {logical_path:'lore/places/sources/Winter-Climate-20210108.json',sha256:WINTER_CLIMATE_SOURCE_HASH},
      {logical_path:'lore/relations/state-formation-contract.json',sha256:STATE_FORMATION_SOURCE_HASH},
      ...Object.entries(RETIRED_TERRITORY_SOURCE_HASHES).map(([logical_path,sha256])=>({logical_path,sha256})));
    if (process.env.SCOPE_GEOGRAPHY_METADATA_INCLUDED === '1') sources.push(
      {logical_path:'lore/regions/sources/boundary-comparison.json',sha256:BOUNDARY_COMPARISON_SOURCE_HASH},
      {logical_path:'lore/regions/sources/selection.json',sha256:GEOGRAPHY_SELECTION_SOURCE_HASH},
      {logical_path:'snapshots/build-inputs/creative-name-normalization.json',sha256:CREATIVE_NAME_SOURCE_HASH});
    if (process.env.SCOPE_ADMIN_INCLUDED === '1') sources.push(
      {logical_path:'scripts/data/admin-city-hierarchy.json',sha256:ADMIN_CITY_SOURCE_HASH},
      {logical_path:'scripts/data/admin-territorial-catalog.json',sha256:ADMIN_TERRITORIAL_SOURCE_HASH});
    if (process.env.SCOPE_PROPOSALS_INCLUDED === '1') sources.push(
      {logical_path:'lore/name-pools/roster-100.json',sha256:CANDIDATE_ROSTER_SOURCE_HASH},
      {logical_path:'lore/name-pools/unit-roster.json',sha256:UNIT_PROPOSAL_SOURCE_HASH},
      {logical_path:'lore/name-pools/settlement-npc-generator.json',sha256:NPC_PROPOSAL_SOURCE_HASH});
    assert.ok(sources.length >= 80);
    const migratedPaths = new Set([...Object.keys(NAME_POOL_SOURCE_HASHES), 'lore/name-pools/existing-names.json',
      'lore/name-pools/values-orgs.json', 'lore/name-pools/roster-100.json', 'lore/name-pools/unit-roster.json',
      'lore/name-pools/settlement-npc-generator.json', 'lore/name-pools/cast-backfill-draft.json']);
    const expectedDocuments = new Map(sources.map(row => [row.logical_path,
      row.logical_path.endsWith('.json') ? JSON.parse(migratedPaths.has(row.logical_path)
        ? readSourceArchive(row.logical_path, row.sha256) : readFileSync(new URL('../../' + row.logical_path, import.meta.url)))
        : readFileSync(new URL('../../' + row.logical_path, import.meta.url), 'utf8')]));
    const deny = () => { throw new Error('scope source IO forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    for (const row of sources) {
      const expected = expectedDocuments.get(row.logical_path);
      assert.deepEqual(readScopeCurrentSource({ db, logicalPath: row.logical_path, expectedSha256: row.sha256 }), expected, row.logical_path);
      assert.throws(() => readScopeCurrentSource({ db, logicalPath: row.logical_path, expectedSha256: '0'.repeat(64) }),
        /E_SCOPE_DB_SOURCE_HASH|E_STATION_INTERIOR_INPUT|E_FEUDAL_ALLOCATION_INPUT|E_REGION_CONTENT_DOCUMENT|E_NAME_POOL_DOCUMENT|E_EXISTING_NAMES_DOCUMENT|E_ORGANIZATION_VALUES_DOCUMENT|E_PARENT_STATUS_DOCUMENT|E_FAMILY_ROLE_DOCUMENT|E_RAIL_SOURCE_DOCUMENT|E_BIRTH_COHORT_DOCUMENT|E_POPULATION_DOCUMENT|E_HOUSEHOLD_POLICY_DOCUMENT|E_CLAN_SEED_DOCUMENT|E_HANGNYEOL_SYSTEMS_DOCUMENT|E_SURNAME_ORIGIN_DOCUMENT|E_DIASPORA_LINEAGE_DOCUMENT|E_CLAN_CATALOG_DOCUMENT|E_STATION_ALIAS_DOCUMENT|E_LANDMARK_ROLE_DOCUMENT|E_WINTER_CLIMATE_DOCUMENT|E_STATE_FORMATION_DOCUMENT|E_RETIRED_TERRITORY_DOCUMENTS|E_BOUNDARY_COMPARISON_DOCUMENT|E_GEOGRAPHY_SELECTION_DOCUMENT|E_CREATIVE_NAME_DOCUMENT|E_ADMIN_CITY_DOCUMENT|E_ADMIN_TERRITORIAL_DOCUMENT|E_CANDIDATE_ROSTER_DOCUMENT|E_UNIT_PROPOSAL_DOCUMENT|E_NPC_PROPOSAL_DOCUMENT/u);
    }
    const changedTyped = { prepare(sql) {
      const statement = db.prepare(sql);
      if (/FROM text_document_slot WHERE/u.test(sql)) return { all: (...args) => statement.all(...args).map(row =>
        row.representation === 'string' ? { ...row, text: row.text + ' changed' } : row) };
      return statement;
    } };
    assert.throws(() => readScopeCurrentSource({ db: changedTyped, logicalPath: sources[0].logical_path,
      expectedSha256: sources[0].sha256 }), /E_REFERENCE_INTEGRITY/u);
    const missingTyped = { prepare(sql) {
      const statement = db.prepare(sql);
      if (/FROM text_document_node WHERE/u.test(sql)) return { all: (...args) => statement.all(...args).slice(0, -1) };
      return statement;
    } };
    assert.throws(() => readScopeCurrentSource({ db: missingTyped, logicalPath: sources[0].logical_path,
      expectedSha256: sources[0].sha256 }), /E_REFERENCE_INTEGRITY/u);
    assert.throws(() => readScopeCurrentSource({ db, logicalPath: 'unknown.json', expectedSha256: '0'.repeat(64) }), /E_MAPPING_TYPED_SOURCE_UNSUPPORTED/u);
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports(); db.close();
  }
});
