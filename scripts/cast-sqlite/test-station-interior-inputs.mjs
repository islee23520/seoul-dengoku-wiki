import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { STATION_INTERIOR_SOURCE_HASH, initializeStationInteriorInputs, readStationInteriorInputs } from './station-interior-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';
import { readSourceArchive } from './source-archive.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-office-inputs-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(), 'station-interior-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const bytes = readSourceArchive('lore/regions/station-interiors.json', STATION_INTERIOR_SOURCE_HASH);
const expected = JSON.parse(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const authorityHash = hash(await readFile(authority));
const options = { sourceBytes: bytes, expectedSourceHash: STATION_INTERIOR_SOURCE_HASH, actor: 'station-interior-test', reason: 'Full actual-source parity on caller-owned disposable authority copy' };
const path = join(dir, 'initialized.sqlite');
await copyFile(authority, path);
const db = new DatabaseSync(path);
after(() => db.close());
const code = { code: 'E_STATION_INTERIOR_INPUT' };
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|archive|raw_bytes|json_(?:extract|tree|each)/iu);
  return connection.prepare(sql);
} });
await initializeStationInteriorInputs(db, options);

test('all actual source objects, scalar types, key order, missing fields and nulls round trip', async () => {
  assert.equal(hash(bytes), STATION_INTERIOR_SOURCE_HASH);
  const actual = readStationInteriorInputs(typedOnly(db));
  assert.deepEqual(actual, expected);
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'interiors' }), { stationInteriors: expected });
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.stations.length, 334);
  for (const [i, station] of actual.stations.entries()) assert.deepEqual(station, expected.stations[i]);
  const counts = Object.fromEntries(['station', 'observation', 'line', 'layer', 'slot', 'candidate'].map(table => [table, db.prepare(`SELECT count(*) n FROM station_interior_input_${table}`).get().n]));
  assert.deepEqual(counts, { station: 334, observation: 264, line: 288, layer: 1336, slot: 668, candidate: 1 });
  assert.equal(actual.stations[250].observationCandidates[0].bindingStatus, 'unconfirmed-for-station');
  assert.equal(actual.stations.filter(s => Object.hasOwn(s, 'facilityKind')).length, 1);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  console.log('STATION_INTERIOR_COUNTS', counts);
});

test('fresh import and repeated readonly reopens deny filesystem and JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('filesystem/JSON.parse denied'); };
    const originalRead = fs.readFileSync;
    fs.readFileSync = (p, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? originalRead(p, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readStationInteriorInputs } = await import(${JSON.stringify(new URL('./station-interior-inputs.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(path)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|archive|raw_bytes|json_(?:extract|tree|each)/i);
        return db.prepare(sql);
      } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readStationInteriorInputs(typed))).digest('hex'), ${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('STATION_INTERIOR_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /STATION_INTERIOR_DB_ONLY_EXACT/u);
});

test('missing terminal station, line, layer and every other table reject, as do mutations', () => {
  const tables = ['document', 'station', 'observation', 'line', 'layer', 'slot', 'candidate', 'key', 'import'];
  const statements = tables.map(t => `DELETE FROM station_interior_input_${t} WHERE rowid=(SELECT max(rowid) FROM station_interior_input_${t})`);
  statements.push(
    "UPDATE station_interior_input_station SET name=name||' changed' WHERE ordinal=333",
    "UPDATE station_interior_input_observation SET above=99 WHERE station_ordinal=0",
    "UPDATE station_interior_input_line SET area='changed' WHERE rowid=1",
    "UPDATE station_interior_input_layer SET condition='changed' WHERE rowid=1",
    "UPDATE station_interior_input_slot SET note='changed' WHERE rowid=1",
    "UPDATE station_interior_input_candidate SET bindingStatus='changed'",
    "UPDATE station_interior_input_station SET facilityKind='hidden value' WHERE ordinal=0",
    "UPDATE station_interior_input_key SET is_null=1 WHERE object_path='/stations/0' AND key='name'",
    "UPDATE station_interior_input_key SET key='unknown' WHERE object_path='' AND ordinal=0",
    "UPDATE station_interior_input_import SET source_sha256='wrong'",
    "UPDATE station_interior_input_import SET document_sha256='wrong'",
    "UPDATE station_interior_input_import SET logical_path='wrong'",
  );
  for (const sql of statements) {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readStationInteriorInputs(typedOnly(db)), code, sql); }
    finally { db.exec('ROLLBACK'); }
  }
  assert.throws(() => readStationInteriorInputs(db, { expectedSourceHash: '0'.repeat(64) }), code);
  assert.equal(JSON.stringify(readStationInteriorInputs(db)), JSON.stringify(expected));
});

test('initializer rejects wrong bytes, unknown source fields, pins and missing actor/reason', async () => {
  const unknown = Buffer.from(JSON.stringify({ ...expected, unknown: true }));
  for (const change of [{ sourceBytes: Buffer.from('{}') }, { expectedSourceHash: '0'.repeat(64) },
    { sourceBytes: unknown }, { sourceBytes: unknown, expectedSourceHash: hash(unknown) }, { actor: '' }, { reason: ' ' }]) {
    await assert.rejects(initializeStationInteriorInputs(db, { ...options, ...change }), code);
  }
  await assert.rejects(initializeStationInteriorInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  db.exec('BEGIN');
  try { await assert.rejects(initializeStationInteriorInputs(db, options), code); }
  finally { db.exec('ROLLBACK'); }
});

test('precommit parity rejects typed divergence and unknown fields and rolls back schema', async () => {
  for (const scenario of ['typed-divergence', 'unknown-field', 'source-receipt']) {
    const brokenPath = join(dir, `${scenario}.sqlite`);
    await copyFile(authority, brokenPath);
    const broken = new DatabaseSync(brokenPath);
    const connection = {
      get isTransaction() { return broken.isTransaction; },
      exec(sql) { return broken.exec(sql); },
      prepare(sql) {
        const statement = broken.prepare(sql);
        if (sql.startsWith('INSERT INTO station_interior_input_import')) return { run(...args) {
          const result = statement.run(...args);
          if (scenario === 'typed-divergence') broken.exec("UPDATE station_interior_input_station SET name='divergence' WHERE ordinal=0");
          if (scenario === 'unknown-field') broken.exec("INSERT INTO station_interior_input_key VALUES('',4,'unknown',0)");
          if (scenario === 'source-receipt') broken.exec("UPDATE station_interior_input_import SET source_sha256='wrong'");
          return result;
        } };
        return statement;
      },
    };
    try {
      await assert.rejects(initializeStationInteriorInputs(connection, options), code);
      assert.equal(broken.isTransaction, false);
      assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'station_interior_input_%'").get().n, 0);
      assert.equal(broken.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    } finally { broken.close(); }
  }
});

test('original authority remains byte-for-byte unchanged', async () => {
  assert.equal(hash(await readFile(authority)), authorityHash);
  console.log('STATION_INTERIOR_AUTHORITY_SHA256', authorityHash);
});
