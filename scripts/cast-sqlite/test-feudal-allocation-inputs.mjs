import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { FEUDAL_ALLOCATION_SOURCE_HASH, initializeFeudalAllocationInputs, readFeudalAllocationInputs } from './feudal-allocation-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';
import { readSourceArchive } from './source-archive.mjs';

if (process.env.ALLOCATION_CURRENT_DB) {
  test('approved allocation current source reconstructs six kingdoms and rejects drift', async t => {
    const directory = await mkdtemp(join(tmpdir(), 'allocation-current-'));
    const path = join(directory, 'owned.sqlite');
    await copyFile(process.env.ALLOCATION_CURRENT_DB, path);
    const db = new DatabaseSync(path);
    t.after(async () => { db.close(); await rm(directory, { recursive: true }); });
    const actual = readFeudalAllocationInputs(db, { predecessor: true });
    assert.equal(actual.titles.filter(row => row.id.startsWith('title:kingdom-geography:seoul:')).length, 6);
    assert.ok(!actual.titles.some(row => row.id === 'title:kingdom-daejeon'));
    assert.ok(!actual.existingTitleBindings.some(row => row.holdingId.startsWith('holding:daejeon-')));
    const current = readFeudalAllocationInputs(db);
    assert.ok(!current.titles.some(row => row.id === 'title:duchy-s08'));
    for (const sql of [
      "UPDATE context_feudal_title SET holder_person_id='K998' WHERE title_id='title:kingdom-geography:seoul:01'",
      "UPDATE context_feudal_title SET kind='invented' WHERE title_id='title:kingdom-geography:seoul:01'",
      "DELETE FROM context_feudal_title WHERE title_id='title:kingdom-geography:seoul:06'",
      "UPDATE data_source_revision SET approval_ref='unapproved' WHERE source_path='lore/relations/opening-feudal-allocation.json' AND parent_revision IS NOT NULL",
      "UPDATE data_source_revision SET reason='tampered' WHERE source_path='lore/relations/opening-feudal-allocation.json' AND parent_revision IS NULL",
      "UPDATE data_source_current SET document_json='{}' WHERE source_path='lore/relations/opening-feudal-allocation.json'",
    ]) {
      db.exec('BEGIN');
      try { db.exec(sql); assert.throws(() => readFeudalAllocationInputs(db), { code: 'E_FEUDAL_ALLOCATION_INPUT' }); }
      finally { db.exec('ROLLBACK'); }
    }
    assert.throws(() => readFeudalAllocationInputs(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_FEUDAL_ALLOCATION_INPUT' });
    assert.deepEqual(readFeudalAllocationInputs(db, { predecessor: true }), actual);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  });
} else {

const authority = process.env.FEUDAL_ALLOCATION_TEST_DB ?? '/tmp/seoul-document-authority-20261020/bootstrap-personal-holdings-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(), 'feudal-allocation-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const authorityBefore = hash(await readFile(authority));
const sourceBytes = readSourceArchive('lore/relations/opening-feudal-allocation.json', FEUDAL_ALLOCATION_SOURCE_HASH);
const expected = JSON.parse(sourceBytes);
const options = { sourceBytes, expectedSourceHash: FEUDAL_ALLOCATION_SOURCE_HASH, actor: 'feudal-allocation-input-test', reason: 'Exact complete source reconstruction on disposable authority copy' };
const copyPath = join(dir, 'initialized.sqlite');
await copyFile(authority, copyPath);
const db = new DatabaseSync(copyPath);
after(() => db.close());
const domainTables = ['context_feudal_title', 'context_feudal_jurisdiction', 'context_feudal_grant',
  'context_feudal_grant_admin', 'context_feudal_grant_component', 'context_feudal_binding',
  'context_political_identity', 'context_political_identity_liege', 'context_rights_approval',
  'context_rights_original_source', 'context_rights_transition'];
const snapshot = connection => Object.fromEntries(domainTables.map(t => [t, connection.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all()]));
const before = snapshot(db);
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });
await initializeFeudalAllocationInputs(db, options);

test('whole actual source, serialized key order, rights and S08 are exactly preserved', async () => {
  assert.equal(hash(sourceBytes), FEUDAL_ALLOCATION_SOURCE_HASH);
  const actual = readFeudalAllocationInputs(typedOnly(db));
  assert.deepEqual(actual, expected);
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'allocation' }), { openingAllocation: expected });
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.deepEqual([actual.titles.length, actual.grants.length, actual.existingTitleBindings.length, actual.politicalIdentities.length], [42, 31, 7, 158]);
  for (const key of ['titles', 'grants', 'politicalIdentities']) {
    assert.deepEqual(actual[key].filter(r => r.stateId === 'S08'), expected[key].filter(r => r.stateId === 'S08'));
  }
  assert.deepEqual(snapshot(db), before);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('fresh readonly runtime works with filesystem reads and JSON.parse denied', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('filesystem/JSON.parse denied'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (path, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? originalRead(path, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readFeudalAllocationInputs } = await import(${JSON.stringify(new URL('./feudal-allocation-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(copyPath)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/i);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readFeudalAllocationInputs(typed))).digest('hex'), ${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('FEUDAL_ALLOCATION_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /FEUDAL_ALLOCATION_DB_ONLY_EXACT/u);
});

test('every populated terminal domain and every existing cell mutation is rejected', () => {
  const tables = [...domainTables, 'feudal_allocation_input_root', 'feudal_allocation_input_key'];
  let mutations = 0;
  const reject = (sql, args = []) => {
    db.exec('BEGIN');
    db.exec('PRAGMA defer_foreign_keys=ON');
    try {
      try { db.prepare(sql).run(...args); }
      catch (error) { assert.equal(error.code, 'ERR_SQLITE_ERROR', sql); assert.equal(error.errcode & 255, 19, sql); mutations++; return; }
      assert.throws(() => readFeudalAllocationInputs(typedOnly(db)), { code: 'E_FEUDAL_ALLOCATION_INPUT' }, sql);
      mutations++;
    } finally { db.exec('ROLLBACK'); }
  };
  for (const table of tables) {
    const terminal = db.prepare(`SELECT rowid AS mutation_rowid,* FROM ${table} ORDER BY rowid DESC LIMIT 1`).get();
    if (!terminal) { assert.equal(table, 'context_feudal_grant_component'); continue; }
    reject(`DELETE FROM ${table} WHERE rowid=?`, [terminal.mutation_rowid]);
    for (const [key, value] of Object.entries(terminal)) {
      if (key === 'mutation_rowid') continue;
      const changed = typeof value === 'number' ? value + 1 : value === null ? 'mutation' : value + ' mutation';
      reject(`UPDATE ${table} SET "${key}"=? WHERE rowid=?`, [changed, terminal.mutation_rowid]);
    }
  }
  reject(`INSERT INTO context_feudal_grant_component SELECT grant_id,0,'region:1111051500',0,source_id,json_pointer||'/componentRefs/0' FROM context_feudal_grant LIMIT 1`);
  reject("UPDATE feudal_allocation_input_key SET key='unknown' WHERE rowid=1");
  reject("INSERT INTO feudal_allocation_input_key VALUES('/unknown',0,'unknown',0)");
  reject("UPDATE feudal_allocation_input_key SET is_null=1-is_null WHERE rowid=1");
  reject(`UPDATE feudal_allocation_input_import SET source_sha256='${'0'.repeat(64)}'`);
  reject(`UPDATE feudal_allocation_input_import SET document_sha256='${'0'.repeat(64)}'`);
  reject(`UPDATE feudal_allocation_input_import SET domain_sha256='${'0'.repeat(64)}'`);
  assert.throws(() => readFeudalAllocationInputs(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_FEUDAL_ALLOCATION_INPUT' });
  assert.equal(JSON.stringify(readFeudalAllocationInputs(db)), JSON.stringify(expected));
  console.log(`FEUDAL_ALLOCATION_MUTATIONS_REJECTED ${mutations}`);
});

test('initializer pins bytes, identity, actor and reason and rolls back all new tables', async () => {
  for (const change of [{ sourceBytes: Buffer.from('{}') }, { expectedSourceHash: '0'.repeat(64) }, { actor: '' }, { reason: ' ' }]) {
    await assert.rejects(initializeFeudalAllocationInputs(db, { ...options, ...change }), { code: 'E_FEUDAL_ALLOCATION_INPUT' });
  }
  await assert.rejects(initializeFeudalAllocationInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  db.exec('BEGIN');
  try { await assert.rejects(initializeFeudalAllocationInputs(db, options), { code: 'E_FEUDAL_ALLOCATION_INPUT' }); }
  finally { db.exec('ROLLBACK'); }
  const brokenPath = join(dir, 'broken.sqlite');
  await copyFile(authority, brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    broken.exec("UPDATE context_feudal_title SET name=name||' divergence' WHERE rowid=1");
    await assert.rejects(initializeFeudalAllocationInputs(broken, options), { code: 'E_FEUDAL_ALLOCATION_INPUT' });
    assert.equal(broken.isTransaction, false);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'feudal_allocation_input_%'").get().n, 0);
    assert.equal(broken.prepare('SELECT name FROM context_feudal_title WHERE rowid=1').get().name.endsWith(' divergence'), true);
    assert.throws(() => broken.prepare('UPDATE source_file SET sha256=? WHERE logical_path=?').run(
      '0'.repeat(64), 'lore/relations/opening-feudal-allocation.json'), /immutable source archive/u);
    const mismatchedIdentity = { prepare(sql) {
      if (sql === 'SELECT source_id,sha256 FROM source_file WHERE logical_path=?') return {
        all: (...args) => broken.prepare(sql).all(...args).map(row => ({ ...row, sha256: '0'.repeat(64) })),
      };
      return broken.prepare(sql);
    } };
    await assert.rejects(initializeFeudalAllocationInputs(mismatchedIdentity, options), { code: 'E_FEUDAL_ALLOCATION_INPUT' });
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'feudal_allocation_input_%'").get().n, 0);
  } finally { broken.close(); }
});

test('authority database bytes remain unchanged', async () => {
  assert.equal(hash(await readFile(authority)), authorityBefore);
  console.log(`FEUDAL_ALLOCATION_AUTHORITY_UNCHANGED ${authorityBefore}`);
});
}
