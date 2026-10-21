import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLD_INPUT_SOURCE_HASHES, readCastHouseholdInputs } from './household-inputs.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';

const databasePath = process.env.HOUSEHOLD_INPUT_DB ?? fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url));
const logicalPath = 'lore/name-pools/cast-household-relations.json';
const bytes = await readFile(new URL(`../../${logicalPath}`, import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'), HOUSEHOLD_INPUT_SOURCE_HASHES[logicalPath]);
const expected = JSON.parse(bytes.toString('utf8'));
const tables = ['family_source_metadata', 'household_manifest', 'household_person', 'household_person_source', 'household_link', 'household_link_source', 'household_court', 'household_court_retainer', 'household_court_retainer_source', 'household_humanoid_context', 'household_humanoid_context_source'];
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return db.prepare(sql);
} });

test('actual pinned ledger has exact full parity, all 1022 identities, and read-only reopen', async () => {
  for (let reopen = 0; reopen < 2; reopen++) {
    const db = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const actual = readCastHouseholdInputs(typedOnly(db), { expectedSourceHashes: HOUSEHOLD_INPUT_SOURCE_HASHES });
      assert.deepEqual(actual, expected);
      assert.deepEqual(await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'household' }), { householdLedger: expected });
      const core = await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'core' });
      assert.equal(core.birthdayRoster.length, 1022);
      assert.equal(core.birthdaysById.size, 1022);
      assert.equal(core.familyGraph.nodes.length, 6033);
      assert.deepEqual(core.householdsById, new Map(expected.people.map(person => [person.personId, {
        personFaith: person.household.personFaith.status,
        houseFaith: person.household.houseFaith.status,
        humanoidAdmission: person.household.humanoidAdmission,
      }])));
      assert.equal(new Set(actual.people.map(person => person.personId)).size, 1022);
      assert.throws(() => db.exec('DELETE FROM household_person'), /readonly|read-only/iu);
    } finally { db.close(); }
  }
});

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.prepare('ATTACH DATABASE ? AS authority').run(databasePath);
  db.exec('CREATE TABLE source_file AS SELECT source_id,logical_path,sha256,media_type FROM authority.source_file');
  for (const table of tables) db.exec(`CREATE TABLE ${table} AS SELECT * FROM authority.${table}`);
  db.exec('DETACH DATABASE authority');
  assert.deepEqual(readCastHouseholdInputs(typedOnly(db)), expected);
  return db;
}

test('unsupported explicit pins, mismatched source hash and missing source reject', t => {
  const db = fixture(t);
  assert.throws(() => readCastHouseholdInputs(db, { expectedSourceHashes: {} }), { code: 'E_HOUSEHOLD_INPUT_STALE' });
  const other = 'f'.repeat(64);
  db.prepare('UPDATE source_file SET sha256=? WHERE logical_path=?').run(other, logicalPath);
  assert.throws(() => readCastHouseholdInputs(db, { expectedSourceHashes: { [logicalPath]: other } }), { code: 'E_HOUSEHOLD_INPUT_STALE' });
  db.prepare('DELETE FROM source_file WHERE logical_path=?').run(logicalPath);
  assert.throws(() => readCastHouseholdInputs(db), { code: 'E_HOUSEHOLD_INPUT_MISSING' });
});

for (const table of tables) {
  test(`missing terminal typed row rejects: ${table}`, t => {
    const db = fixture(t);
    db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table} WHERE source_id=(SELECT source_id FROM source_file WHERE logical_path='${logicalPath}'))`);
    assert.throws(() => readCastHouseholdInputs(db), { code: 'E_HOUSEHOLD_INPUT_COVERAGE' });
  });
}

test('missing schema, wrong metadata, orphan refs, order gaps and value edits reject', t => {
  const db = fixture(t);
  for (const sql of [
    "UPDATE family_source_metadata SET text_value='wrong' WHERE field_name='schema'",
    "UPDATE household_person_source SET person_id='missing' WHERE rowid=1",
    "UPDATE household_person SET json_pointer='/people/1022' WHERE json_pointer='/people/1021'",
    "UPDATE household_link SET role='changed' WHERE rowid=1",
  ]) {
    db.exec('BEGIN');
    db.exec(sql);
    assert.throws(() => readCastHouseholdInputs(db), /E_HOUSEHOLD_INPUT_(?:SCHEMA_GAP|COVERAGE)/u);
    db.exec('ROLLBACK');
  }
  db.exec('DROP TABLE family_source_metadata');
  assert.throws(() => readCastHouseholdInputs(db), { code: 'E_HOUSEHOLD_INPUT_SCHEMA_GAP' });
});

test('fresh import and reopened reads require no source filesystem or JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    const denied = () => { throw new Error('source filesystem and JSON.parse forbidden'); };
    const scriptRead = fs.readFileSync;
    fs.readFileSync = (p, ...args) => {
      if (!/\\.(?:mjs|js|cjs)$/.test(String(p))) denied();
      return scriptRead(p, ...args);
    };
    fs.readFile = denied; fs.readdir = denied; fs.readdirSync = denied;
    fsp.readFile = denied; fsp.readdir = denied;
    syncBuiltinESMExports(); JSON.parse = denied;
    const { readCastHouseholdInputs } = await import(${JSON.stringify(new URL('./household-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(process.env.HOUSEHOLD_INPUT_DB, { readOnly: true });
      try {
        for (let repeat = 0; repeat < 2; repeat++) {
          const actual = readCastHouseholdInputs({ prepare(sql) {
            assert.doesNotMatch(sql, /\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/iu);
            return db.prepare(sql);
          } });
          assert.equal(actual.people.length, 1022);
        }
      } finally { db.close(); }
    }
    console.log('HOUSEHOLD_DB_ONLY_1022_EXACT');
  `], { encoding: 'utf8', timeout: 60000, env: { ...process.env, HOUSEHOLD_INPUT_DB: databasePath } });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /HOUSEHOLD_DB_ONLY_1022_EXACT/u);
});
