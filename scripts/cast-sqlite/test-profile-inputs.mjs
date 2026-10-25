import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { loadCharacterProfiles } from '../validate-character-profiles.mjs';
import { publicCharacterProfile } from '../character-profile.mjs';
import { ENGINE_TABLE_COLUMNS } from './current-engine.mjs';
import { PROFILE_INPUT_SOURCE_HASHES, readPublicCharacterProfileInputs } from './profile-inputs.mjs';

const databasePath = process.env.PROFILE_INPUT_DB ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url));
const repo = new URL('../../', import.meta.url);
// One actual legacy loader invocation is the filesystem oracle. All reader
// invocations below consume only typed domains from the pinned actual database.
const editorial = await loadCharacterProfiles(fileURLToPath(repo));
const expected = new Map([...editorial].map(([id, profile]) => [id, publicCharacterProfile(profile)]));
const expectedSourceHashes = {};
for (const path of Object.keys(PROFILE_INPUT_SOURCE_HASHES)) {
  expectedSourceHashes[path] = createHash('sha256').update(await readFile(new URL(path, repo))).digest('hex');
}
assert.deepEqual(expectedSourceHashes, PROFILE_INPUT_SOURCE_HASHES);
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  assert.match(sql, /^SELECT /u);
  return db.prepare(sql);
} });
const digest = profiles => createHash('sha256').update(JSON.stringify([...profiles])).digest('hex');

test('actual DB exactly returns all 1022 public projections in loader order after read-only reopen', () => {
  for (let reopen = 0; reopen < 2; reopen++) {
    const db = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const actual = readPublicCharacterProfileInputs(typedOnly(db), { expectedSourceHashes });
      assert.equal(actual.size, 1022);
      assert.deepEqual([...actual], [...expected]);
      assert.equal(JSON.stringify([...actual]), JSON.stringify([...expected]), 'receipt serialization order must remain unchanged');
      assert.deepEqual([...actual.keys()], [...editorial.keys()]);
      assert.throws(() => db.exec('DELETE FROM current_profile'), /readonly|read-only/iu);
    } finally { db.close(); }
  }
});

test('the raw loader is intentionally not the bounded public input contract', () => {
  const raw = editorial.values().next().value;
  const projected = expected.values().next().value;
  assert.ok(Object.hasOwn(raw, 'personId'));
  assert.ok(Object.hasOwn(raw, 'name'));
  assert.ok(Object.hasOwn(raw, 'souls'));
  assert.ok(!Object.hasOwn(projected, 'souls'));
  assert.notDeepEqual(raw, projected);
});

test('fresh reader import, repeated reads and reopened DB need neither source filesystem nor JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { createHash } from 'node:crypto';
    import { DatabaseSync } from 'node:sqlite';
    const denied = () => { throw new Error('source filesystem/JSON.parse forbidden'); };
    const scriptRead = fs.readFileSync;
    fs.readFileSync = (p, ...args) => {
      if (!/\\.(?:mjs|js|cjs)$/.test(String(p))) denied();
      return scriptRead(p, ...args);
    };
    fs.readFile = denied; fs.readdir = denied; fs.readdirSync = denied;
    fsp.readFile = denied; fsp.readdir = denied;
    syncBuiltinESMExports(); JSON.parse = denied;
    const { readPublicCharacterProfileInputs } = await import(${JSON.stringify(new URL('./profile-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(process.env.PROFILE_INPUT_DB, { readOnly: true });
      const typed = { prepare(sql) {
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/iu);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) {
        const actual = readPublicCharacterProfileInputs(typed);
        assert.equal(actual.size, 1022);
        assert.equal(createHash('sha256').update(JSON.stringify([...actual])).digest('hex'), ${JSON.stringify(digest(expected))});
      }
      db.close();
    }
    console.log('PROFILE_DB_ONLY_1022_EXACT');
  `], { encoding: 'utf8', timeout: 60000, env: { ...process.env, PROFILE_INPUT_DB: databasePath } });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /PROFILE_DB_ONLY_1022_EXACT/u);
});

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.prepare('ATTACH DATABASE ? AS authority').run(databasePath);
  for (const table of ['person', ...Object.keys(ENGINE_TABLE_COLUMNS)]) db.exec(`CREATE TABLE ${table} AS SELECT * FROM authority.${table}`);
  db.exec('DETACH DATABASE authority');
  assert.deepEqual([...readPublicCharacterProfileInputs(typedOnly(db))], [...expected]);
  return db;
}

test('caller hashes cannot broaden the pinned source identity', t => {
  const db = fixture(t);
  assert.throws(() => readPublicCharacterProfileInputs(db, { expectedSourceHashes: {} }), { code: 'E_PROFILE_INPUT_STALE' });
  const path = Object.keys(expectedSourceHashes)[0];
  const hash = 'f'.repeat(64);
  db.prepare('UPDATE current_engine_source SET source_sha256=? WHERE logical_path=?').run(hash, path);
  assert.throws(() => readPublicCharacterProfileInputs(db, { expectedSourceHashes: { ...expectedSourceHashes, [path]: hash } }), { code: 'E_PROFILE_INPUT_STALE' });
});

for (const [field, value] of [
  ['engine_source_id', 'renamed'], ['logical_path', 'missing.json'], ['source_sha256', 'f'.repeat(64)],
  ['source_byte_length', 0], ['profile_count', 0], ['projection_schema', 'other'], ['projection_sha256', 'f'.repeat(64)],
]) {
  test(`changed pinned source metadata ${field} rejects`, t => {
    const db = fixture(t);
    db.prepare(`UPDATE current_engine_source SET ${field}=? WHERE rowid=1`).run(value);
    assert.throws(() => readPublicCharacterProfileInputs(db), error => /^E_PROFILE_INPUT_(STALE|MISSING)$/u.test(error.code));
  });
}

for (const table of ['current_engine_source', 'current_profile', 'ability', 'skill', 'trait', 'effect', 'health', 'body', 'narrative', 'person']) {
  test(`deleted terminal ${table} row fails closed`, t => {
    const db = fixture(t);
    db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
    assert.throws(() => readPublicCharacterProfileInputs(db), error => /^E_PROFILE_INPUT_(COVERAGE|MISSING)$/u.test(error.code));
  });
}

for (const [name, sql] of [
  ['ability ordinal', 'UPDATE ability SET ability_ordinal=99 WHERE rowid=1'],
  ['skill pointer', "UPDATE skill SET json_pointer='/profiles/999/skills/0' WHERE rowid=1"],
  ['trait presence', "UPDATE trait SET trait_id_presence='missing' WHERE rowid=1"],
  ['health presence', "UPDATE health SET status_presence='other' WHERE rowid=1"],
  ['body presence', "UPDATE body SET severity_presence='missing' WHERE rowid=1"],
  ['narrative value', "UPDATE narrative SET narrative_en='changed' WHERE rowid=1"],
  ['orphan effect', 'UPDATE effect SET trait_ordinal=999 WHERE rowid=1'],
  ['unknown identity', "UPDATE current_profile SET person_id='missing' WHERE rowid=1"],
  ['unknown source', "UPDATE current_profile SET engine_source_id='missing' WHERE rowid=1"],
  ['unexpected disease', "INSERT INTO disease VALUES ('K001',0,'missing',NULL,'missing',NULL,'/profiles/0/health/diseases/0')"],
]) {
  test(`same-count mutation or unexpected row ${name} rejects`, t => {
    const db = fixture(t);
    db.exec(sql);
    assert.throws(() => readPublicCharacterProfileInputs(db), { code: 'E_PROFILE_INPUT_COVERAGE' });
  });
}

test('missing typed table and column reject as schema gaps', t => {
  const db = fixture(t);
  db.exec('ALTER TABLE health RENAME COLUMN status_presence TO missing');
  assert.throws(() => readPublicCharacterProfileInputs(db), { code: 'E_PROFILE_INPUT_SCHEMA_GAP' });
  db.exec('DROP TABLE health');
  assert.throws(() => readPublicCharacterProfileInputs(db), { code: 'E_PROFILE_INPUT_SCHEMA_GAP' });
});
