import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync, backup } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createIdentityExporter, exportMapIdentities, validateIdentityRequest } from './export-map-identities.mjs';
import { APPLICATION_ID, SCHEMA_VERSION, openReadOnly } from './cast-sqlite/db.mjs';
import { revisionTableDefinition, sealHistoryTable } from './cast-sqlite/document-structure-authority.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const ddl = name => readFileSync(new URL(`./cast-sqlite/${name}`, import.meta.url), 'utf8');
const definition = (sql, table) => {
  const match = sql.match(new RegExp(`CREATE TABLE ${table} \\([\\s\\S]*?\\) STRICT;`, 'u'));
  assert.ok(match, table);
  return match[0];
};

// Real SQLite and actual constrained affiliation/history DDL. No production DB,
// archive, map/private tables or person-field authentication is used or claimed.
async function fixture(t, union = false, internal = false, personState = 'S01') {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wiki-identity-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const db = new DatabaseSync(':memory:');
  try {
    const tables = ['text_document', 'text_affiliation', 'text_affiliation_hegemon', 'text_affiliation_member', 'text_affiliation_state', 'text_affiliation_neutral'];
    const sql = table => ddl(table === 'text_document' ? 'text-corpus-documents.sql' : 'text-data-geography.sql');
    for (const table of ['source_file', 'source_record', 'state']) db.exec(definition(ddl('schema.sql'), table));
    for (const table of tables) db.exec(definition(sql(table), table));
    db.exec(ddl('excluded-sources.sql'));
    const insert = (table, row) => {
      const names = Object.keys(row);
      db.prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map(() => '?')})`).run(...Object.values(row));
    };
    const p = '/data/currentAffiliation';
    const sourceSha = '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c';
    const semanticSha = '9524c36db6daed1e36e4eecf2b4812eca5f60ce9261a5479d851af349d19a068';
    const sourcePath = 'lore/factions/Sixteen-States.json';
    const revision = internal ? 'c'.repeat(64) : 'a'.repeat(64);
    insert('source_file', { source_id: 84, logical_path: sourcePath, media_type: 'application/json', sha256: sourceSha, byte_length: 0, raw_bytes: Buffer.alloc(0) });
    const coordinate = json_pointer => insert('source_record', { source_id: 84, json_pointer, ordinal: 0, json_type: 'object' });
    coordinate(''); coordinate('/data'); coordinate(p);
    insert('text_document', { source_id: 84, json_pointer: '', corpus_kind: 'current', version: 1, domain: 'factions', document_id: 'DOC:Sixteen-States', slug: 'Sixteen-States', status: 'approved', tense_ko: 'present', tense_en: 'past', source_kind: 'observed', original_anchor: 'synthetic', data_pointer: '/data' });
    insert('text_affiliation', { source_id: 84, json_pointer: p });
    for (let i = 0; i < 16; i++) insert('state', { state_id: `S${String(i + 1).padStart(2, '0')}`, name_ko: `Synthetic ${i + 1}` });
    coordinate(`${p}/hegemons/0`);
    insert('text_affiliation_hegemon', { source_id: 84, json_pointer: `${p}/hegemons/0`, ordinal: 0, kind: union ? 'union' : 'state', state_id: union ? null : 'S01', name: 'Synthetic group', center_region: 'PRIVATE_SENTINEL', ai_position: 'PRIVATE_SENTINEL', color: 'PRIVATE_SENTINEL' });
    for (let i = 0; i < 16; i++) {
      const state_id = `S${String(i + 1).padStart(2, '0')}`;
      coordinate(`${p}/states/${i}`); coordinate(`${p}/hegemons/0/memberStateIds/${i}`);
      insert('text_affiliation_state', { source_id: 84, json_pointer: `${p}/states/${i}`, ordinal: i, state_id, current_name: `Synthetic ${i + 1}`, base_kind: 'facility', landmark_id: 'PRIVATE_SENTINEL', base_name: 'PRIVATE_SENTINEL', exclusive_districts: 'PRIVATE_SENTINEL' });
      insert('text_affiliation_member', { source_id: 84, json_pointer: `${p}/hegemons/0/memberStateIds/${i}`, hegemon_ordinal: 0, ordinal: i, state_id });
    }
    db.exec(ddl('document-authority.sql'));
    if (internal) insert('document_revision', { revision_id: 'a'.repeat(64), source_id: 84, actor: 'synthetic', reason: 'synthetic', recorded_at: 'synthetic', semantic_sha256: semanticSha, algorithm: 'typed-envelope-v1', sequence: 0 });
    insert('document_revision', { revision_id: revision, source_id: 84, ...(internal ? { parent_revision: 'a'.repeat(64) } : {}), actor: 'synthetic', reason: 'synthetic', recorded_at: 'synthetic', semantic_sha256: semanticSha, algorithm: 'typed-envelope-v1', sequence: internal ? 1 : 0 });
    insert('document_head', { source_id: 84, revision_id: revision, public_admission: 'unrecorded' });
    for (const table of tables) {
      db.exec(revisionTableDefinition(definition(sql(table), table), table, tables));
      db.prepare(`INSERT INTO document_revision_${table} SELECT ?,* FROM ${table}`).run(revision);
      sealHistoryTable(db, table);
    }
    insert('document_revision_seal', { revision_id: revision });
    db.exec(ddl('document-admission.sql'));
    if (!internal) insert('document_publication_admission', { source_id: 84, revision_id: revision, source_path: sourcePath, source_sha256: sourceSha, semantic_sha256: semanticSha, classification: 'current-reviewed', reason: 'approved-exact-review', receipt_path: 'PRIVATE_SENTINEL', receipt_sha256: 'b'.repeat(64), approval_ref: 'PRIVATE_SENTINEL', recorded_at: 'synthetic' });
    if (internal) {
      for (const table of ['state_label', 'person', 'person_alias']) db.exec(definition(ddl('schema.sql'), table));
      db.exec(`CREATE TABLE atlas_identity_registry_person(ordinal INTEGER PRIMARY KEY,person_id TEXT UNIQUE,has_aliases INTEGER);
        CREATE TABLE person_disposition(person_id TEXT PRIMARY KEY,status TEXT,decision_ref TEXT);`);
      insert('state_label', { state_id: 'S01', name_ko: 'Synthetic 1' });
      if (personState !== 'S01') {
        insert('state', { state_id: personState, name_ko: '무소속' });
        insert('state_label', { state_id: personState, name_ko: '무소속' });
      }
      for (let i = 0; i < 2; i++) {
        insert('person', { person_id: `K${i + 1}`, name: `Person ${i + 1}`, publication_ordinal: i + 1, public_key: `person-${String(i + 1).padStart(4, '0')}`,
          public_route: `/people/person-${String(i + 1).padStart(4, '0')}`, state_id: i ? null : personState, state_name: i ? null : personState === 'S01' ? 'Synthetic 1' : '무소속', minors: 0, values_source_ordinal: i });
        insert('atlas_identity_registry_person', { ordinal: i, person_id: `K${i + 1}`, has_aliases: i ? 0 : 1 });
        insert('person_disposition', { person_id: `K${i + 1}`, status: i ? 'retired-current' : 'active', decision_ref: 'synthetic:internal-decision' });
      }
      insert('person_alias', { person_id: 'K1', alias: 'z alias', alias_ordinal: 0 });
      insert('person_alias', { person_id: 'K1', alias: 'a alias', alias_ordinal: 1 });
    }
    db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${SCHEMA_VERSION}`);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    await backup(db, join(root, 'input.sqlite'));
  } finally { db.close(); }
  writeFileSync(join(root, 'bootstrap.json'), encode({ schema: 'synthetic-bootstrap', notAuthority: true }));
  const request = { schema: 'wiki-map-identity-request.v1', databasePath: join(root, 'input.sqlite'), bootstrapReceiptPath: join(root, 'bootstrap.json'), outputDirectory: join(root, 'output') };
  const pins = { databaseSha256: hash(readFileSync(request.databasePath)), bootstrapReceiptSha256: hash(readFileSync(request.bootstrapReceiptPath)) };
  return { root, request, pins };
}

function syntheticProvider(reader, affiliation) {
  assert.equal(reader.exec, undefined);
  assert.throws(() => reader.prepare('DELETE FROM state'), { code: 'E_IDENTITY_PROVIDER' });
  assert.equal(reader.prepare('SELECT count(*) AS n FROM state').get().n, 16);
  const label = 'Synthetic person';
  return { complete: true, requiresAffiliation: true,
    persons: [{ id: 'synthetic-person', labels: { ko: label }, route: '/synthetic-person', polityRef: 'S01' }],
    polities: affiliation.states.map(row => ({ id: row.stateId, labels: { ko: row.currentName } })), blocs: [],
    fieldProvenance: [{ entityKind: 'person', sourceId: 'synthetic-person', outputPointer: '/persons/0/labels/ko', presence: 'present', sourceFingerprint: hash('synthetic-source'), approvalFingerprint: hash('synthetic-field-mapping'), allowedTargets: ['synthetic-test'], distribution: 'protected', valueSha256: hash(JSON.stringify(label)) }] };
}

test('request rejects wrong schema, unknown or missing keys, and every relative path', () => {
  const valid = { schema: 'wiki-map-identity-request.v1', databasePath: '/input.sqlite', bootstrapReceiptPath: '/bootstrap.json', outputDirectory: '/output' };
  assert.equal(validateIdentityRequest(valid), valid);
  for (const bad of [null, [], { ...valid, schema: 'future' }, { ...valid, privateStores: {} }, { ...valid, databasePath: undefined },
    ...['databasePath', 'bootstrapReceiptPath', 'outputDirectory'].map(key => ({ ...valid, [key]: 'relative' }))])
    assert.throws(() => validateIdentityRequest(bad), { code: 'E_IDENTITY_REQUEST' });
  const missing = { ...valid }; delete missing.outputDirectory;
  assert.throws(() => validateIdentityRequest(missing), { code: 'E_IDENTITY_REQUEST' });
});

test('production registry fails closed with diagnostic counts and creates no files', async t => {
  const { root, request, pins } = await fixture(t, true);
  const before = readdirSync(root);
  await assert.rejects(createIdentityExporter({ pins, providers: new Map() })(request), error => {
    assert.equal(error.code, 'E_IDENTITY_DOMAIN_MISSING');
    assert.match(error.message, /person-polity/u);
    assert.deepEqual(error.diagnostics, { states: 16, hegemons: 1, unresolvedUnions: 1 });
    assert.doesNotMatch(JSON.stringify(error), /PRIVATE_SENTINEL|Synthetic group/u);
    return true;
  });
  assert.deepEqual(readdirSync(root), before);
  assert.equal(hash(readFileSync(request.databasePath)), pins.databaseSha256);
});

test('production entry rejects fixture hashes rather than trusting supplied receipts', async t => {
  const { root, request } = await fixture(t);
  const before = readdirSync(root);
  await assert.rejects(exportMapIdentities(request), { code: 'E_IDENTITY_SNAPSHOT' });
  assert.deepEqual(readdirSync(root), before);
  const run = spawnSync(process.execPath, ['scripts/export-map-identities.mjs', '--request', 'relative.json'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /E_IDENTITY_REQUEST/u);
});

test('full synthetic domain writes a protected snapshot and byte/provenance receipt together', async t => {
  const { root, request, pins } = await fixture(t);
  const exporter = createIdentityExporter({ pins, providers: new Map([['person-polity', syntheticProvider]]) });
  const receipt = await exporter(request);
  assert.deepEqual(readdirSync(request.outputDirectory).sort(), ['identity.json', 'receipt.json']);
  const bytes = readFileSync(join(request.outputDirectory, 'identity.json'));
  const identity = JSON.parse(bytes);
  assert.equal(identity.schema, 'wiki-map-identities.v1');
  assert.equal(identity.persons[0].labels.ko, 'Synthetic person');
  assert.equal(identity.polities.length, 16);
  assert.equal(receipt.identitySha256, hash(bytes));
  assert.equal(receipt.fieldProvenanceSha256, hash(encode(identity.fieldProvenance)));
  assert.equal(receipt.databaseSha256, pins.databaseSha256);
  assert.equal(receipt.bootstrapReceiptSha256, pins.bootstrapReceiptSha256);
  assert.deepEqual(JSON.parse(readFileSync(join(request.outputDirectory, 'receipt.json'))), receipt);
  assert.doesNotMatch(bytes.toString() + JSON.stringify(receipt), /PRIVATE_SENTINEL|input\.sqlite|bootstrap\.json/u);
  await assert.rejects(exporter(request), { code: 'E_IDENTITY_OUTPUT_EXISTS' });
  assert.equal(hash(readFileSync(request.databasePath)), pins.databaseSha256);
  assert.equal(readdirSync(root).some(name => name.endsWith('.stage')), false);
});

test('required unresolved union cannot become a completed snapshot', async t => {
  const { root, request, pins } = await fixture(t, true);
  const before = readdirSync(root);
  await assert.rejects(createIdentityExporter({ pins, providers: new Map([['person-polity', syntheticProvider]]) })(request), { code: 'E_IDENTITY_UNRESOLVED_UNION' });
  assert.deepEqual(readdirSync(root), before);
});

test('readonly connection blocks disk writes even after query_only is disabled', async t => {
  const { request } = await fixture(t);
  const db = openReadOnly(request.databasePath);
  try {
    assert.equal(db.prepare('PRAGMA query_only').get().query_only, 1);
    db.exec('BEGIN');
    assert.throws(() => db.exec('CREATE TEMP TABLE forbidden(x)'), /readonly/u);
    db.exec('ROLLBACK; PRAGMA query_only=OFF');
    assert.throws(() => db.exec("UPDATE state SET name_ko='mutated'"), /readonly/u);
  } finally { db.close(); }
});

test('changed bytes, uncheckpointed WAL, and incomplete domain write nothing', async t => {
  const { root, request, pins } = await fixture(t);
  const exporter = createIdentityExporter({ pins, providers: new Map([['person-polity', () => ({ complete: false })]]) });
  const before = readdirSync(root);
  await assert.rejects(exporter(request), { code: 'E_IDENTITY_DOMAIN_MISSING' });
  assert.deepEqual(readdirSync(root), before);
  writeFileSync(request.databasePath + '-wal', 'synthetic');
  await assert.rejects(exporter(request), { code: 'E_IDENTITY_SNAPSHOT' });
  rmSync(request.databasePath + '-wal');
  writeFileSync(request.bootstrapReceiptPath, '{}');
  await assert.rejects(exporter(request), { code: 'E_IDENTITY_SNAPSHOT' });
  assert.equal(readdirSync(root).includes('output'), false);
});

async function internalFixture(t, mutate = () => {}, personState = 'S01') {
  const f = await fixture(t, true, true, personState);
  const affiliation = { sourceId: 84,
    sourceSha256: '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c',
    revisionId: 'c'.repeat(64), parentRevision: 'a'.repeat(64),
    semanticSha256: '9524c36db6daed1e36e4eecf2b4812eca5f60ce9261a5479d851af349d19a068' };
  const persons = [
    { characterId: 'K1', name: 'Person 1', detailRoute: '/people/person-0001', state: personState, stateName: personState === 'S01' ? 'Synthetic 1' : '무소속', aliases: ['z alias', 'a alias'], status: 'active' },
    { characterId: 'K2', name: 'Person 2', detailRoute: '/people/person-0002', state: null, stateName: null, status: 'retired-current' },
  ];
  const sourceHashes = { 'lore/name-pools/fixture.json': hash('synthetic authenticated source') };
  const crosswalks = [{ id: 'union:religious', revisionId: affiliation.revisionId,
    sourcePointer: '/data/currentAffiliation/hegemons/0',
    memberStateIds: Array.from({ length: 16 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`),
    sourceSha256: hash('synthetic union binding'), approvalRef: 'synthetic:crosswalk' }];
  const evidence = { schema: 'wiki-internal-identity-evidence.v1', scope: 'internal-approved-successor',
    mappingAuthoritySha256: '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96',
    approvalRef: 'synthetic:internal-approval', affiliation, persons, crosswalks,
    mappings: persons.flatMap(person => ['characterId', 'name', 'detailRoute', 'state', 'stateName'].map(field => ({
      characterId: person.characterId, jsonPointer: '/' + field, disposition: 'retain',
      valueSha256: hash(JSON.stringify(person[field])), approvedSuccessor: null,
      source: { sourcePath: 'lore/name-pools/fixture.json', sourceSha256: sourceHashes['lore/name-pools/fixture.json'],
        jsonPointer: '/' + person.characterId + '/' + field, anchor: null, valueSha256: hash(JSON.stringify(person[field])) },
    }))) };
  const selected = { ...f.pins, affiliation: structuredClone(affiliation), approvalRef: evidence.approvalRef,
    personCount: 2, dispositionRef: 'synthetic:internal-decision', sourceHashes, crosswalks: structuredClone(crosswalks) };
  const request = { ...f.request, schema: 'wiki-internal-map-identity-request.v1', selectionId: 'fixture', evidencePath: join(f.root, 'evidence.json') };
  // Code registration is independent of request data. These are disposable,
  // explicitly synthetic accepted-source fixtures, never production enrollment.
  mutate({ selected, evidence, request });
  const bytes = encode(evidence); writeFileSync(request.evidencePath, bytes);
  selected.evidenceSha256 = hash(bytes);
  return { ...f, request, selected, evidence,
    exporter: createIdentityExporter({ pins: f.pins, providers: new Map(), selections: { fixture: selected } }) };
}

test('internal selected successor exports minimal identities without public admission, preserving alias/null/retired semantics', async t => {
  const f = await internalFixture(t), receipt = await f.exporter(f.request);
  const result = JSON.parse(readFileSync(join(f.request.outputDirectory, 'identity.json')));
  assert.equal(result.verification, 'trusted-snapshot/internal-approved-successor-projection');
  assert.equal(result.publicAdmission, false); assert.equal(receipt.publicAdmission, false);
  assert.deepEqual(result.persons[0].aliases, ['z alias', 'a alias']);
  assert.equal(Object.hasOwn(result.persons[1], 'aliases'), false);
  assert.equal(result.persons[1].polityRef, null); assert.equal(result.persons[1].status, 'retired-current');
  assert.equal(result.persons[0].state, 'S01'); assert.equal(result.persons[0].stateName, 'Synthetic 1');
  assert.equal(result.persons[0].polityRef, 'S01');
  assert.equal(result.persons[1].state, null); assert.equal(result.persons[1].stateName, null);
  assert.equal(result.blocs[0].id, 'union:religious');
  assert.equal(result.polities[0].affiliationRef, 'union:religious');
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SENTINEL|center_region|ai_position|color|sourcePath.*\/Users/u);
  assert.equal(hash(readFileSync(f.request.databasePath)), f.pins.databaseSha256);
});

// Existing authored identity semantics: test-identity-values.mjs binds S00 to
// 무소속. It is a person-state value, not one of the sixteen political members.
test('authored S00 and its exact mapped name survive without a polity or fabricated membership', async t => {
  const f = await internalFixture(t, () => {}, 'S00');
  await f.exporter(f.request);
  const result = JSON.parse(readFileSync(join(f.request.outputDirectory, 'identity.json')));
  assert.equal(result.persons[0].state, 'S00');
  assert.equal(result.persons[0].stateName, '무소속');
  assert.equal(Object.hasOwn(result.persons[0], 'polityRef'), false);
  assert.equal(result.polities.some(row => row.id === 'S00'), false);
  assert.equal(result.blocs.some(row => row.memberPolityRefs.includes('S00')), false);
  for (const field of ['state', 'stateName']) {
    assert.equal(result.fieldProvenance.find(row => row.characterId === 'K1' && row.jsonPointer === '/' + field).valueSha256,
      hash(JSON.stringify(f.evidence.persons[0][field])));
  }
});

for (const fault of ['evidence', 'name', 'mapping', 'membership', 'unknown-state']) {
  test(`authored S00 correction still rejects ${fault} drift`, async t => {
    const f = await internalFixture(t, ({ evidence }) => {
      if (fault === 'evidence') evidence.persons[0].state = null;
      if (fault === 'name') evidence.persons[0].stateName = 'wrong name';
      if (fault === 'mapping') evidence.mappings.find(row => row.characterId === 'K1' && row.jsonPointer === '/state').valueSha256 = hash(JSON.stringify('S01'));
      if (fault === 'membership') evidence.crosswalks[0].memberStateIds.push('S00');
    }, fault === 'unknown-state' ? 'S99' : 'S00');
    await assert.rejects(f.exporter(f.request), { code: {
      evidence: 'E_IDENTITY_PERSON_EVIDENCE', name: 'E_IDENTITY_PERSON_EVIDENCE',
      mapping: 'E_IDENTITY_MAPPING_VALUE', membership: 'E_IDENTITY_CROSSWALK_DRIFT',
      'unknown-state': 'E_IDENTITY_PERSON_STATE',
    }[fault] });
    assert.equal(readdirSync(f.root).includes('output'), false);
  });
}

for (const fault of ['source', 'revision', 'semantic', 'parent', 'approval', 'scope', 'mapping', 'mapping-source', 'crosswalk-members', 'crosswalk-id', 'route', 'aliases', 'retired', 'null']) {
  test(`internal successor rejects exact ${fault} evidence mismatch without output`, async t => {
    const f = await internalFixture(t, ({ selected, evidence }) => {
      if (fault === 'source') selected.affiliation.sourceSha256 = '0'.repeat(64);
      if (fault === 'revision') selected.affiliation.revisionId = 'd'.repeat(64);
      if (fault === 'semantic') selected.affiliation.semanticSha256 = '0'.repeat(64);
      if (fault === 'parent') selected.affiliation.parentRevision = 'd'.repeat(64);
      if (fault === 'approval') evidence.approvalRef = 'self-approved';
      if (fault === 'scope') evidence.scope = 'public-admission';
      if (fault === 'mapping') evidence.mappings[0].valueSha256 = '0'.repeat(64);
      if (fault === 'mapping-source') evidence.mappings[0].source.sourceSha256 = '0'.repeat(64);
      if (fault === 'crosswalk-members') evidence.crosswalks[0].memberStateIds.reverse();
      if (fault === 'crosswalk-id') evidence.crosswalks[0].id = 'invented-union';
      if (fault === 'route') evidence.persons[0].detailRoute = '/people/person-9999';
      if (fault === 'aliases') evidence.persons[0].aliases.reverse();
      if (fault === 'retired') evidence.persons[1].status = 'active';
      if (fault === 'null') evidence.persons[1].state = 'S01';
    });
    await assert.rejects(f.exporter(f.request), /E_(?:IDENTITY|AFFILIATION_IDENTITY)/u);
    assert.equal(readdirSync(f.root).includes('output'), false);
  });
}

test('internal evidence bytes and accepted snapshot pins cannot be caller overridden', async t => {
  const f = await internalFixture(t);
  writeFileSync(f.request.evidencePath, '{}');
  await assert.rejects(f.exporter(f.request), { code: 'E_IDENTITY_EVIDENCE_HASH' });
  await assert.rejects(exportMapIdentities(f.request), { code: 'E_IDENTITY_SELECTION_UNAVAILABLE' });
  await assert.rejects(f.exporter({ ...f.request, approved: true }), { code: 'E_IDENTITY_REQUEST' });
  f.selected.databaseSha256 = '0'.repeat(64);
  await assert.rejects(f.exporter(f.request), { code: 'E_IDENTITY_SNAPSHOT' });
});

test('public request cannot select internal successor or fall back to the old admitted head', async t => {
  const f = await internalFixture(t);
  const request = { schema: 'wiki-map-identity-request.v1', databasePath: f.request.databasePath,
    bootstrapReceiptPath: f.request.bootstrapReceiptPath, outputDirectory: f.request.outputDirectory };
  await assert.rejects(f.exporter(request), { code: 'E_AFFILIATION_IDENTITY' });
  await assert.rejects(f.exporter({ ...request, selectionId: 'fixture' }), { code: 'E_IDENTITY_REQUEST' });
});
