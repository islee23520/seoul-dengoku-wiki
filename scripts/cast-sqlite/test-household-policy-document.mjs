import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { HOUSEHOLD_POLICY_SOURCE_HASH, HOUSEHOLD_POLICY_DOCUMENT_HASH, initializeHouseholdPolicyDocument, readHouseholdPolicyDocument } from './household-policy-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/household-humanoid-policy.json', HOUSEHOLD_POLICY_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./household-policy-document.sql',import.meta.url),'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = HOUSEHOLD_POLICY_SOURCE_HASH;
const options = { schemaSql,sourceBytes,expectedSourceHash,actor:'unit-test',reason:'Exact existing source normalization' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = { household_policy_document:1,household_policy_source_ref:3,household_policy_faith_state:3,household_policy_priority:4,household_policy_known_orientation:5,household_policy_position_context:1,household_policy_position:5 };
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeHouseholdPolicyDocument(db,options);
  return db;
}
const read = db => readHouseholdPolicyDocument(db,{expectedSourceHash});
const rejected = fn => assert.throws(fn,{code:'E_HOUSEHOLD_POLICY_DOCUMENT'});

test('actual entire source has fixed byte/document hashes, exact order, all 22 typed rows and rights', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length,2357);
    assert.equal(hash(sourceBytes),expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)),HOUSEHOLD_POLICY_DOCUMENT_HASH);
    assert.deepEqual(initializeHouseholdPolicyDocument(db,options),{
      documents:1,sourceRefs:3,faithStates:3,priorities:4,knownOrientations:5,politicalPositionContexts:1,politicalPositions:5,totalRows:22,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document),JSON.stringify(source));
    assert.deepEqual(document,source);
    assert.equal(Object.keys(document).length,17);
    assert.equal(document.tierQuotas,null);
    assert.deepEqual(document.politicalPositionContext['polity:daejeon'].rightsBasis,source.politicalPositionContext['polity:daejeon'].rightsBasis);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table,db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])),counts);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    const before = db.prepare('SELECT * FROM household_policy_document').all();
    rejected(() => initializeHouseholdPolicyDocument(db,{...options,expectedSourceHash:'0'.repeat(64)}));
    assert.throws(() => initializeHouseholdPolicyDocument(db,options));
    assert.deepEqual(db.prepare('SELECT * FROM household_policy_document').all(),before);
    assert.equal(JSON.stringify(read(db)),JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) {
  for (const mode of ['missing','changed','extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(c => !['document_id','ordinal'].includes(c));
          db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(c => ['document_id','ordinal'].includes(c) ? `${c}+100` : c === 'entity_key' ? `${c} || '-extra'` : c);
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('every consumed typed column detects corruption, including null tierQuotas and provenance', () => {
  let checked = 0;
  const db = fresh();
  try {
    db.exec('PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) {
      for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
        db.exec('SAVEPOINT corruption');
        const value = column.type === 'INTEGER' ? '1000' : "'changed'";
        db.exec(`UPDATE ${table} SET ${column.name}=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        rejected(() => read(db));
        checked++;
        db.exec('ROLLBACK TO corruption; RELEASE corruption');
      }
    }
    assert.equal(checked,36);
  } finally { db.close(); }
});

test('unknown and missing fields at all six object shapes, absent/null distinctions and wrong hashes fail closed', () => {
  const paths = [[],['sourceRefs',0],['politicalPositionContext'],['politicalPositionContext','polity:daejeon'],['politicalPositionContext','polity:daejeon','rightsBasis'],['politicalPositions']];
  for (const path of paths) {
    for (const mode of ['unknown','missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((v,k) => v[k],changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeHouseholdPolicyDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(changed))}));
        assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [d => { delete d.tierQuotas; },d => { d.tierQuotas = {}; },d => { delete d.sourceRefs[0].anchor; },d => { d.sourceRefs[0].anchor = null; },d => { d.faithStates = []; },d => { d.counts += 'changed'; }]) {
    const changed = structuredClone(source); mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeHouseholdPolicyDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(changed))})); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readHouseholdPolicyDocument(db));
    rejected(() => readHouseholdPolicyDocument(db,{expectedSourceHash:'0'.repeat(64)}));
    rejected(() => initializeHouseholdPolicyDocument(db,{...options,sourceBytes:Buffer.concat([sourceBytes,Buffer.from(' ')] )}));
    for (const overrides of [{actor:''},{reason:' '},{sourceBytes:'not bytes'},{schemaSql:''}]) rejected(() => initializeHouseholdPolicyDocument(db,{...options,...overrides}));
    db.exec('BEGIN');
    rejected(() => initializeHouseholdPolicyDocument(db,options));
    db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_policy BEFORE INSERT ON household_policy_position BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_policy AFTER INSERT ON household_policy_position BEGIN UPDATE household_policy_document SET counts='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES (\'retained\')');
      assert.throws(() => initializeHouseholdPolicyDocument(db,{...options,schemaSql:schemaSql+suffix}));
      assert.equal(db.isTransaction,false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(r => r.name),['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value,'retained');
    } finally { db.close(); }
  }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', () => {
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
