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
async function fixture(t, union = false) {
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
    const revision = 'a'.repeat(64);
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
    insert('document_revision', { revision_id: revision, source_id: 84, actor: 'synthetic', reason: 'synthetic', recorded_at: 'synthetic', semantic_sha256: semanticSha, algorithm: 'typed-envelope-v1', sequence: 0 });
    insert('document_head', { source_id: 84, revision_id: revision, public_admission: 'unrecorded' });
    for (const table of tables) {
      db.exec(revisionTableDefinition(definition(sql(table), table), table, tables));
      db.prepare(`INSERT INTO document_revision_${table} SELECT ?,* FROM ${table}`).run(revision);
      sealHistoryTable(db, table);
    }
    insert('document_revision_seal', { revision_id: revision });
    db.exec(ddl('document-admission.sql'));
    insert('document_publication_admission', { source_id: 84, revision_id: revision, source_path: sourcePath, source_sha256: sourceSha, semantic_sha256: semanticSha, classification: 'current-reviewed', reason: 'approved-exact-review', receipt_path: 'PRIVATE_SENTINEL', receipt_sha256: 'b'.repeat(64), approval_ref: 'PRIVATE_SENTINEL', recorded_at: 'synthetic' });
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
