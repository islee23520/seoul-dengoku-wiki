import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { PERSONAL_HOLDING_SOURCE_HASH, initializePersonalHoldingInputs, readPersonalHoldingInputs } from './personal-holding-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';
import { validateOpeningDispositions } from '../personal-holdings.mjs';
import { readSourceArchive } from './source-archive.mjs';

if (process.env.HOLDINGS_CURRENT_DB) {
  test('approved holdings current chain rejects typed and approval drift on owned copies', async t => {
    const directory = await mkdtemp(join(tmpdir(), 'holdings-current-'));
    const path = join(directory, 'owned.sqlite');
    await copyFile(process.env.HOLDINGS_CURRENT_DB, path);
    const db = new DatabaseSync(path);
    t.after(async () => { db.close(); await rm(directory, { recursive: true }); });
    const actual = readPersonalHoldingInputs(db);
    assert.ok(!actual.holdings.some(row => row.id.startsWith('holding:daejeon-')));
    assert.ok(!actual.polities.some(row => row.id === 'polity:daejeon'));
    for (const sql of [
      "UPDATE context_holding SET name_ko=name_ko||' drift' WHERE rowid=(SELECT min(rowid) FROM context_holding)",
      "UPDATE context_holding SET kind='invented' WHERE rowid=(SELECT min(rowid) FROM context_holding)",
      "UPDATE data_source_revision SET approval_ref='unapproved' WHERE source_path='lore/relations/personal-holdings.json' AND parent_revision IS NOT NULL",
      "UPDATE data_source_revision SET reason='tampered' WHERE source_path='lore/relations/personal-holdings.json' AND parent_revision IS NULL",
      "UPDATE data_source_current SET document_json='{}' WHERE source_path='lore/relations/personal-holdings.json'",
    ]) {
      db.exec('BEGIN');
      try { db.exec(sql); assert.throws(() => readPersonalHoldingInputs(db), { code: 'E_PERSONAL_HOLDING_INPUT' }); }
      finally { db.exec('ROLLBACK'); }
    }
    assert.deepEqual(readPersonalHoldingInputs(db), actual);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  });
} else {

const authority = process.env.PERSONAL_HOLDING_TEST_DB ?? '/tmp/seoul-document-authority-20261020/bootstrap-court-complete-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(), 'personal-holding-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const sourceBytes = readSourceArchive('lore/relations/personal-holdings.json', PERSONAL_HOLDING_SOURCE_HASH);
const expected = JSON.parse(sourceBytes);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const options = { sourceBytes, expectedSourceHash: PERSONAL_HOLDING_SOURCE_HASH, actor: 'personal-holding-input-test', reason: 'Exact reconstruction on disposable authority copy' };
const copyPath = join(dir, 'initialized.sqlite');
await copyFile(authority, copyPath);
const db = new DatabaseSync(copyPath);
after(() => db.close());
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });
await initializePersonalHoldingInputs(db, options);

test('complete actual source deepEqual and stringify parity, including S08 unchanged', async () => {
  assert.equal(hash(sourceBytes), PERSONAL_HOLDING_SOURCE_HASH);
  const actual = readPersonalHoldingInputs(typedOnly(db));
  assert.deepEqual(actual, expected);
  const people = db.prepare('SELECT person_id AS id FROM person').all();
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'holdings' }), {
    originalHoldings: expected, openingDispositions: validateOpeningDispositions(expected, people) });
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.holdings.length, 25);
  assert.deepEqual(actual.holdings.find(h => h.id === 'holding:capital-s08'), expected.holdings.find(h => h.id === 'holding:capital-s08'));
  assert.equal(db.prepare('SELECT count(*) n FROM personal_holding_input_facility').get().n, 2);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('fresh runtime import and readonly reopen deny filesystem source reads and JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('source read/JSON.parse denied'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (path, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? originalRead(path, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readPersonalHoldingInputs } = await import(${JSON.stringify(new URL('./personal-holding-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(copyPath)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/i);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readPersonalHoldingInputs(typed))).digest('hex'), ${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('PERSONAL_HOLDINGS_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /PERSONAL_HOLDINGS_DB_ONLY_EXACT/u);
});

test('terminal rows, all populated domains, structure and receipt mutations reject', () => {
  assert.throws(() => readPersonalHoldingInputs(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_PERSONAL_HOLDING_INPUT' });
  const tables = ['context_holding', 'context_holding_admin_ref', 'context_holding_reference',
    'context_holding_geographic_scope', 'context_holding_scope_county', 'context_holding_power', 'context_polity',
    'context_retinue_group', 'context_retinue_duty', 'context_retinue_technical_limit', 'context_opening_disposition',
    'context_rights_approval', 'context_rights_original_source', 'context_rights_transition', 'context_feudal_binding',
    'personal_holding_input_key', 'personal_holding_input_facility'];
  const statements = tables.map(table => `DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
  statements.push("UPDATE context_holding SET name_ko=name_ko||' changed' WHERE rowid=1",
    "UPDATE context_holding_reference SET station_lat=station_lat+0.1 WHERE reference_kind='facility'",
    "UPDATE context_polity SET formal_title=formal_title||' changed'",
    'UPDATE context_retinue_group SET person_count=person_count+1',
    "UPDATE context_opening_disposition SET approval_ref=approval_ref||' changed'",
    "UPDATE personal_holding_input_facility SET layer_name=layer_name||' changed'",
    "UPDATE personal_holding_input_key SET key='unknown' WHERE rowid=1",
    `UPDATE personal_holding_input_import SET source_sha256='${'0'.repeat(64)}'`);
  for (const sql of statements) {
    db.exec('BEGIN');
    db.exec('PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readPersonalHoldingInputs(typedOnly(db)), { code: 'E_PERSONAL_HOLDING_INPUT' }, sql); }
    finally { db.exec('ROLLBACK'); }
  }
  assert.equal(JSON.stringify(readPersonalHoldingInputs(db)), JSON.stringify(expected));
});

test('initializer authenticates pinned bytes, actor, reason and one-time transaction', async () => {
  for (const change of [{ sourceBytes: Buffer.from('{}') }, { expectedSourceHash: '0'.repeat(64) }, { actor: '' }, { reason: ' ' }]) {
    await assert.rejects(initializePersonalHoldingInputs(db, { ...options, ...change }), { code: 'E_PERSONAL_HOLDING_INPUT' });
  }
  await assert.rejects(initializePersonalHoldingInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  db.exec('BEGIN');
  try { await assert.rejects(initializePersonalHoldingInputs(db, options), { code: 'E_PERSONAL_HOLDING_INPUT' }); }
  finally { db.exec('ROLLBACK'); }
  const brokenPath = join(dir, 'broken.sqlite');
  await copyFile(authority, brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    broken.exec("UPDATE context_holding SET name_ko=name_ko||' divergence' WHERE rowid=1");
    await assert.rejects(initializePersonalHoldingInputs(broken, options), { code: 'E_PERSONAL_HOLDING_INPUT' });
    assert.equal(broken.isTransaction, false);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'personal_holding_input_%'").get().n, 0);
    assert.equal(broken.prepare('SELECT name_ko FROM context_holding WHERE rowid=1').get().name_ko.endsWith(' divergence'), true);
  } finally { broken.close(); }
});
}
