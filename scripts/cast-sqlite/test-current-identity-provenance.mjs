import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { IDENTITY_PROVENANCE_TABLE_COLUMNS, mapIdentityProvenance } from './current-identity-provenance.mjs';
import { parseDocument } from './sources.mjs';

const NAMES = ['person-id-registry', 'gender-cast', 'clan-hangnyeol-tables', 'cast-hangnyeol'];

async function corpus() {
  const root = resolve(import.meta.dirname, '..', '..');
  const files = await Promise.all(NAMES.map(async (name, index) => {
    const logical_path = `lore/name-pools/${name}.json`;
    const { document, records } = parseDocument(await readFile(resolve(root, logical_path), 'utf8'));
    return { source_id: index + 1, logical_path, document, records };
  }));
  return { files };
}

async function database(bundle) {
  const db = new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT;
    CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,
      PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;
    CREATE TABLE state(state_id TEXT PRIMARY KEY) STRICT;`);
  const addFile = db.prepare('INSERT INTO source_file VALUES (?,?)');
  const addRecord = db.prepare('INSERT INTO source_record VALUES (?,?)');
  const addState = db.prepare('INSERT INTO state VALUES (?)');
  for (const file of bundle.files) {
    addFile.run(file.source_id, file.logical_path);
    for (const record of file.records) addRecord.run(file.source_id, record.json_pointer);
  }
  for (const state of bundle.files.find((file) => file.logical_path.endsWith('/gender-cast.json')).document.policies) addState.run(state.state);
  db.exec(await readFile(resolve(import.meta.dirname, 'current-identity-provenance.sql'), 'utf8'));
  return db;
}

function insert(db, tables) {
  for (const [table, columns] of Object.entries(IDENTITY_PROVENANCE_TABLE_COLUMNS)) {
    const statement = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
    for (const row of tables[table]) statement.run(...columns.map((column) => row[column]));
  }
}

test('actual public identity metadata becomes source-linked typed rows with bounded approval scope', async (t) => {
  const bundle = await corpus();
  const before = structuredClone(bundle.files.map(({ document }) => document));
  const tables = mapIdentityProvenance(bundle);
  assert.deepEqual(Object.keys(tables), Object.keys(IDENTITY_PROVENANCE_TABLE_COLUMNS));
  const db = await database(bundle);
  insert(db, tables);
  assert.equal(tables.identity_registry_provenance.length, 1);
  assert.equal(db.prepare('SELECT total_people FROM identity_registry_provenance').get().total_people, 1022);
  assert.equal(db.prepare('SELECT approval_scope FROM identity_registry_provenance').get().approval_scope, 'registry-source-event-only');
  assert.equal(db.prepare('SELECT decision_scope FROM identity_gender_provenance').get().decision_scope, 'category-and-assignment-policy-only');
  assert.equal(db.prepare('SELECT count(*) AS n FROM identity_gender_policy').get().n, 17);
  assert.equal(db.prepare("SELECT count(*) AS n FROM identity_gender_policy WHERE alignment_status='differs-current'").get().n, 5);
  assert.deepEqual({ ...db.prepare("SELECT population,observed_population FROM identity_gender_policy WHERE state_id='S00'").get() },
    { population: 11, observed_population: 17 });
  assert.equal(db.prepare('SELECT count(*) AS n FROM identity_clan_research_source').get().n, 106);
  assert.equal(db.prepare('SELECT count(*) AS n FROM identity_gender_category').get().n, 2);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(bundle.files.map(({ document }) => document), before);
  db.close();
  t.diagnostic(JSON.stringify(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length]))));
});

test('the mapper rejects a clan citation without a declared research source', async () => {
  const bundle = await corpus();
  bundle.files.find((file) => file.logical_path.endsWith('/clan-hangnyeol-tables.json')).document.clans[0].sources.push('missing-source');
  assert.throws(() => mapIdentityProvenance(bundle), { code: 'E_IDENTITY_PROVENANCE_RESEARCH_ORPHAN' });
});

test('the mapper rejects internally contradictory declared policy totals', async () => {
  const bundle = await corpus();
  bundle.files.find((file) => file.logical_path.endsWith('/gender-cast.json')).document.policies[0].people += 1;
  assert.throws(() => mapIdentityProvenance(bundle), { code: 'E_IDENTITY_PROVENANCE_POLICY_COUNT' });
});

test('SQLite rejects a provenance pointer absent from raw source records', async () => {
  const bundle = await corpus();
  const db = await database(bundle);
  const row = mapIdentityProvenance(bundle).identity_registry_provenance[0];
  assert.throws(() => db.prepare(`INSERT INTO identity_registry_provenance(${IDENTITY_PROVENANCE_TABLE_COLUMNS.identity_registry_provenance.join(',')})
    VALUES (${IDENTITY_PROVENANCE_TABLE_COLUMNS.identity_registry_provenance.map(() => '?').join(',')})`).run(
    ...IDENTITY_PROVENANCE_TABLE_COLUMNS.identity_registry_provenance.map((column) => column === 'approval_json_pointer' ? '/missing' : row[column]),
  ), /FOREIGN KEY/);
  db.close();
});
