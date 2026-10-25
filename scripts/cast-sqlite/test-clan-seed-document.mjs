import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { CLAN_SEED_SOURCE_HASH, CLAN_SEED_DOCUMENT_HASH, initializeClanSeedDocument, readClanSeedDocument } from './clan-seed-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/clans-hangnyeol.json', CLAN_SEED_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./clan-seed-document.sql',import.meta.url),'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = CLAN_SEED_SOURCE_HASH;
const options = { schemaSql,sourceBytes,expectedSourceHash,actor:'unit-test',reason:'Exact draft normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = { clan_seed_document:1,clan_seed_clan:10,clan_seed_syllable:40 };
const rejected = fn => assert.throws(fn,{code:'E_CLAN_SEED_DOCUMENT'});
const read = db => readClanSeedDocument(db,{expectedSourceHash});
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeClanSeedDocument(db,options);
  return db;
}

test('actual entire draft preserves ordered serialization, all 51 typed rows and exact decimal seeds', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length,1523);
    assert.equal(hash(sourceBytes),expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)),CLAN_SEED_DOCUMENT_HASH);
    assert.deepEqual(initializeClanSeedDocument(db,options),{documents:1,clans:10,syllables:40,totalRows:51});
    assert.deepEqual(read(db),source);
    assert.equal(JSON.stringify(read(db)),JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(t => [t,db.prepare(`SELECT count(*) AS n FROM ${t}`).get().n])),counts);
    assert.deepEqual(db.prepare('SELECT keep_rate_decimal FROM clan_seed_clan ORDER BY ordinal').all().map(r => r.keep_rate_decimal),source.clans.map(c => String(c.keepRate)));
    assert.equal(read(db).status,'draft-pending-owner');
    assert.equal(read(db).approvalStatus,'not-approved-for-publication');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    const before = db.prepare('SELECT * FROM clan_seed_document').all();
    assert.throws(() => initializeClanSeedDocument(db,options));
    assert.deepEqual(db.prepare('SELECT * FROM clan_seed_document').all(),before);
    assert.equal(JSON.stringify(read(db)),JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) for (const mode of ['missing','changed','extra']) {
  test(`${table}: ${mode} row is rejected`, () => {
    const db = fresh();
    try {
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
      if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      if (mode === 'changed') {
        const column = columns.find(c => !['document_id','ordinal','clan_ordinal'].includes(c));
        db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(c => ['document_id','ordinal'].includes(c) ? `${c}+100` : c === 'surname' ? `${c} || '-extra'` : c);
        db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('every typed column, order key, decimal spelling and provenance is verified', () => {
  const db = fresh();
  let checked = 0;
  try {
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
      db.exec('SAVEPOINT corruption');
      db.exec(`UPDATE ${table} SET ${column.name}=${column.type === 'INTEGER' ? '1000' : "'changed'"} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => read(db));
      checked++;
      db.exec('ROLLBACK TO corruption; RELEASE corruption');
    }
    assert.equal(checked,18);
    db.exec("UPDATE clan_seed_clan SET keep_rate_decimal='0.450' WHERE ordinal=0");
    rejected(() => read(db));
  } finally { db.close(); }
});

test('strict top-level and clan fields, wrong source bytes and expected hashes fail before writes', () => {
  for (const path of [[],['clans',0]]) for (const mode of ['unknown','missing','order']) {
    const changed = structuredClone(source);
    const target = path.reduce((v,k) => v[k],changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') { const key = Object.keys(target)[0]; const value = target[key]; delete target[key]; target[key] = value; }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeClanSeedDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(changed))}));
      assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    } finally { db.close(); }
  }
  for (const mutate of [d => { d.clans.pop(); },d => { d.clans[0].hangnyeol.pop(); },d => { d.clans[0].keepRate = '0.45'; },d => { d.clans[0].keepRate = 0.44; },d => { d.clans[0].hangnyeol.reverse(); },d => { d.note += 'changed'; }]) {
    const changed = structuredClone(source); mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeClanSeedDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(changed))})); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readClanSeedDocument(db));
    rejected(() => readClanSeedDocument(db,{expectedSourceHash:'0'.repeat(64)}));
    for (const overrides of [{expectedSourceHash:'0'.repeat(64)},{sourceBytes:Buffer.concat([sourceBytes,Buffer.from(' ')])},{actor:''},{reason:' '},{schemaSql:''},{sourceBytes:'not bytes'}]) {
      rejected(() => initializeClanSeedDocument(db,{...options,...overrides}));
    }
    db.exec('BEGIN');
    rejected(() => initializeClanSeedDocument(db,options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)),JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_seed BEFORE INSERT ON clan_seed_syllable BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_seed AFTER INSERT ON clan_seed_syllable BEGIN UPDATE clan_seed_document SET status='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeClanSeedDocument(db,{...options,schemaSql:schemaSql+suffix}));
      assert.equal(db.isTransaction,false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(r => r.name),['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value,'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch and JSON.parse access blocked', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object,key) => { const original = object[key]; object[key] = blocked; restores.push(() => { object[key] = original; }); };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open']) replace(fs,key);
    for (const key of ['readFile','open']) replace(fsp,key);
    replace(JSON,'parse');
    replace(globalThis,'fetch');
    const guarded = { prepare(sql) { assert.match(sql,/^SELECT /); assert.doesNotMatch(sql,/archive|source_file|json_/i); return db.prepare(sql); },exec:blocked };
    assert.equal(JSON.stringify(read(guarded)),JSON.stringify(source));
  } finally { restores.reverse().forEach(restore => restore()); db.close(); }
});
