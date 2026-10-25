import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { openReadOnly } from './db.mjs';
import { loadCastFamilyTrees } from '../cast-family-trees.mjs';
import { FAMILY_INPUT_SOURCE_HASHES, readCastFamilyTreeInputs } from './family-inputs.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';
import { preserveReceiptOrder } from './document-key-order.mjs';
import { readSourceArchive } from './source-archive.mjs';

const databasePath = process.env.FAMILY_INPUT_DB ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url));
const repo = new URL('../../', import.meta.url);
const expectedSourceHashes = {};
// Original import evidence remains in SQLite after physical source removal.
for (const logicalPath of Object.keys(FAMILY_INPUT_SOURCE_HASHES)) {
  const bytes = readSourceArchive(logicalPath, FAMILY_INPUT_SOURCE_HASHES[logicalPath]);
  expectedSourceHashes[logicalPath] = createHash('sha256').update(bytes).digest('hex');
}
assert.deepEqual(expectedSourceHashes, FAMILY_INPUT_SOURCE_HASHES);
const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json', FAMILY_INPUT_SOURCE_HASHES['lore/name-pools/person-id-registry.json']));
const expected = await loadCastFamilyTrees(fileURLToPath(new URL('lore/', repo)), registry.persons);
const stable = value => Array.isArray(value) ? value.map(stable) : value !== null && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const digest = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return db.prepare(sql);
} });

test('actual pinned DB exactly reconstructs the actual loader graph and all 1022 identities, then reopens read-only', async () => {
  for (let i = 0; i < 2; i++) {
    const db = openReadOnly(databasePath);
    try {
      const actual = readCastFamilyTreeInputs(typedOnly(db), { expectedSourceHashes });
      assert.deepEqual(actual, expected);
      assert.equal(JSON.stringify(preserveReceiptOrder(actual, expected)), JSON.stringify(expected),
        'every family node and relation must retain the historical receipt serialization');
      assert.equal(actual.nodes.length, 6033);
      assert.equal(actual.edges.length, 5016);
      assert.deepEqual(actual.nodes.filter(node => node.personId !== null).map(node => node.personId).sort(), registry.persons.map(person => person.id).sort());
      assert.deepEqual(readCastFamilyTreeInputs(typedOnly(db)), expected);
      assert.deepEqual(await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'family', expectedSourceHashes }), { familyGraph: expected });
      assert.throws(() => db.exec("DELETE FROM family_node WHERE node_id='K001'"), /readonly|read-only/iu);
    } finally { db.close(); }
  }
});

test('fresh reader import and repeated reopened reads work with filesystem sources and JSON.parse disabled', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { createHash } from 'node:crypto';
    import { openReadOnly } from ${JSON.stringify(new URL('./db.mjs', import.meta.url).href)};
    const denied = () => { throw new Error('source filesystem and JSON.parse forbidden'); };
    const scriptRead = fs.readFileSync;
    fs.readFileSync = (p, ...args) => {
      if (!/\\.(?:mjs|js|cjs)$/.test(String(p))) denied();
      return scriptRead(p, ...args);
    };
    fs.readFile = denied; fs.readdir = denied; fs.readdirSync = denied;
    fsp.readFile = denied; fsp.readdir = denied;
    syncBuiltinESMExports(); JSON.parse = denied;
    const stable = value => Array.isArray(value) ? value.map(stable) : value !== null && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
    const { readCastFamilyTreeInputs } = await import(${JSON.stringify(new URL('./family-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = openReadOnly(process.env.FAMILY_INPUT_DB);
      const typed = { prepare(sql) {
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/iu);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) {
        const graph = readCastFamilyTreeInputs(typed);
        assert.equal(createHash('sha256').update(JSON.stringify(stable(graph))).digest('hex'), ${JSON.stringify(digest(expected))});
      }
      db.close();
    }
    console.log('FAMILY_DB_ONLY_1022_EXACT');
  `], { encoding: 'utf8', timeout: 60000, env: { ...process.env, FAMILY_INPUT_DB: databasePath } });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /FAMILY_DB_ONLY_1022_EXACT/u);
});

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.prepare('ATTACH DATABASE ? AS authority').run(databasePath);
  // Copy typed tables only. The fixture deliberately has no raw bytes or JSON tree.
  db.exec('CREATE TABLE source_file AS SELECT source_id,logical_path,sha256,media_type FROM authority.source_file');
  for (const table of ['person', 'person_alias', 'identity_registry_provenance', 'family_source_metadata', 'family_birthday', 'family_birthday_source', 'family_birth_cohort', 'family_birth_cohort_assignment', 'family_tree', 'family_tree_source', 'family_node', 'family_node_source', 'family_node_timeline', 'family_edge', 'family_edge_source', 'diaspora_lineage', 'diaspora_member', 'diaspora_member_parent', 'diaspora_member_event']) {
    db.exec(`CREATE TABLE ${table} AS SELECT * FROM authority.${table}`);
  }
  db.exec('DETACH DATABASE authority');
  assert.deepEqual(readCastFamilyTreeInputs(typedOnly(db)), expected);
  return db;
}

test('explicit pins cannot bypass the supported identity and missing, renamed, stale sources reject', t => {
  const db = fixture(t);
  assert.throws(() => readCastFamilyTreeInputs(db, { expectedSourceHashes: {} }), { code: 'E_FAMILY_INPUT_STALE' });
  const logicalPath = 'lore/name-pools/cast-family-trees.json';
  const other = 'f'.repeat(64);
  db.prepare('UPDATE source_file SET sha256=? WHERE logical_path=?').run(other, logicalPath);
  assert.throws(() => readCastFamilyTreeInputs(db, { expectedSourceHashes: { ...expectedSourceHashes, [logicalPath]: other } }), { code: 'E_FAMILY_INPUT_STALE' });
  db.prepare('UPDATE source_file SET sha256=?,logical_path=? WHERE logical_path=?').run(expectedSourceHashes[logicalPath], `${logicalPath}.renamed`, logicalPath);
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_MISSING' });
});

test('missing typed metadata and schema reject', t => {
  const db = fixture(t);
  db.exec("DELETE FROM family_source_metadata WHERE field_name='schemaVersion' AND source_id=(SELECT source_id FROM source_file WHERE logical_path='lore/name-pools/cast-family-trees.json')");
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_SCHEMA_GAP' });
  db.exec('DROP TABLE family_source_metadata');
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_SCHEMA_GAP' });
});

for (const table of ['family_node', 'family_edge', 'family_node_timeline', 'family_node_source', 'family_edge_source', 'family_tree_source', 'diaspora_member', 'diaspora_lineage', 'diaspora_member_parent', 'diaspora_member_event']) {
  test(`partial ${table} coverage rejects even a deleted terminal row`, t => {
    const db = fixture(t);
    db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
    assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_COVERAGE' });
  });
}

test('same-count provenance orphan, order gap and identity omission reject', t => {
  const db = fixture(t);
  db.exec('BEGIN');
  db.exec("UPDATE family_node_source SET node_id='missing' WHERE rowid=1");
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_COVERAGE' });
  db.exec('ROLLBACK; BEGIN');
  db.exec("UPDATE family_node SET json_pointer='/nodes/999999' WHERE json_pointer='/nodes/6024'");
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_FAMILY_INPUT_COVERAGE' });
  db.exec('ROLLBACK');
  db.exec("DELETE FROM person WHERE person_id='K001'");
  assert.throws(() => readCastFamilyTreeInputs(db), { code: 'E_PERSON_INPUT_COVERAGE' });
});
