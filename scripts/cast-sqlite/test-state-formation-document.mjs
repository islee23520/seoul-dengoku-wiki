import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  STATE_FORMATION_DOCUMENT_HASH,
  STATE_FORMATION_SOURCE_HASH,
  initializeStateFormationDocument,
  readStateFormationDocument,
} from './state-formation-document.mjs';
import { readSourceArchive } from './source-archive.mjs';

const sourceBytes = readSourceArchive('lore/relations/state-formation-contract.json', STATE_FORMATION_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./state-formation-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const logicalPath = 'lore/relations/state-formation-contract.json';
const expectedSourceHash = STATE_FORMATION_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact existing source normalization' };
const many = {
  schemaSql,
  sources: { [logicalPath]: { bytes: sourceBytes, expectedSourceHash } },
  actor: 'unit-test',
  reason: 'Exact existing source normalization',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  state_formation_document_document: 1,
  state_formation_document_key: 59,
  state_formation_document_prerequisite: 3,
  state_formation_document_faction: 3,
  state_formation_document_identity: 1,
};
const rejected = fn => assert.throws(fn, { code: 'E_STATE_FORMATION_DOCUMENT' });
function fresh(initializer = options) {
  const db = new DatabaseSync(':memory:');
  initializeStateFormationDocument(db, initializer);
  return db;
}
const read = db => readStateFormationDocument(db, { expectedSourceHash });

test('actual entire source has fixed byte and document hashes, exact order, and all 67 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 2931);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), STATE_FORMATION_DOCUMENT_HASH);
    assert.deepEqual(initializeStateFormationDocument(db, options), {
      documents: 1, keys: 59, prerequisites: 3, factions: 3, identities: 1, totalRows: 67,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.equal(document.formationPrerequisites[2].status, 'unresolved');
    assert.equal(Object.hasOwn(document.formationPrerequisites[2], 'source'), false);
    assert.equal(document.formationPrerequisites[2].reason, source.formationPrerequisites[2].reason);
    assert.equal(document.formationPrerequisites[0].status, 'confirmed');
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    const keyOrder = db.prepare("SELECT key FROM state_formation_document_key WHERE object_path='' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(keyOrder, Object.keys(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM state_formation_document_document').all();
    rejected(() => initializeStateFormationDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeStateFormationDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM state_formation_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API uses the exact path and the same frozen bytes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeStateFormationDocument(db, many).totalRows, 67);
    const document = readStateFormationDocument(db, { logicalPath, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    rejected(() => readStateFormationDocument(db, { logicalPath: `./${logicalPath}`, expectedSourceHash }));
    rejected(() => readStateFormationDocument(db, { logicalPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readStateFormationDocument(db, { expectedSourceHash, logicalPath: 'other.json' }));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(name => !['document_id', 'ordinal'].includes(name));
          const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
          const value = info.type === 'INTEGER' ? `${column}+1` : `${column} || '-changed'`;
          db.exec(`UPDATE ${table} SET ${column}=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(name => {
            if (['document_id', 'ordinal'].includes(name)) return `${name}+100`;
            if (['object_path', 'key', 'id'].includes(name)) return `${name} || '-extra'`;
            return name;
          });
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('every consumed typed column detects corruption, including unresolved status and provenance', () => {
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
        checked += 1;
        db.exec('ROLLBACK TO corruption; RELEASE corruption');
      }
    }
    assert.equal(checked, 48);
  } finally { db.close(); }
});

test('unknown and missing fields, absent optional source, and wrong hashes fail closed', () => {
  const paths = [
    [],
    ['formationPrerequisites', 0],
    ['formationPrerequisites', 0, 'source'],
    ['formationPrerequisites', 2],
    ['independentLedgers'],
    ['independentLedgers', 'wiki'],
    ['independentLedgers', 'gdd'],
    ['sourceScope'],
    ['sourceScope', 'historicalPoliticalIdentities'],
    ['sourceScope', 'currentPoliticalFactions', 0],
    ['sourceScope', 'currentIndependentPoliticalIdentities', 0],
    ['sourceScope', 'geographicKingdoms'],
  ];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeStateFormationDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.formationPrerequisites[2].source = null; },
    document => { document.formationPrerequisites[2].approvalRef = 'invented'; },
    document => { delete document.formationPrerequisites[0].source; document.formationPrerequisites[0].reason = 'retired'; },
    document => { document.formationPrerequisites[0].status = 'retired'; },
    document => { document.sourceScope.currentPoliticalFactions = []; },
    document => { document.independentAcquisitionCreatesState = null; },
    document => { document.sourceScope.historicalPoliticalIdentities.count = 16.5; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeStateFormationDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readStateFormationDocument(db));
    rejected(() => readStateFormationDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeStateFormationDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeStateFormationDocument(db, { ...options, ...overrides }));
    }
    const swapped = { bytes: sourceBytes, expectedSourceHash, extra: true };
    rejected(() => initializeStateFormationDocument(db, { ...many, sources: { [logicalPath]: swapped } }));
    rejected(() => initializeStateFormationDocument(db, { ...many, sources: { 'lore/other.json': many.sources[logicalPath] } }));
    rejected(() => initializeStateFormationDocument(db, { ...many, sources: {} }));
    db.exec('BEGIN');
    rejected(() => initializeStateFormationDocument(db, options));
    db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('retired and unapproved status text is preserved when it is the authored value, and not inferred', () => {
  const db = fresh();
  try {
    const document = read(db);
    assert.equal(document.formationPrerequisites[2].status, 'unresolved');
    assert.equal(document.formationPrerequisites.map(item => item.status).includes('retired'), false);
    const retired = structuredClone(source);
    retired.formationPrerequisites[2].status = 'retired';
    const other = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeStateFormationDocument(other, { ...options, sourceBytes: Buffer.from(JSON.stringify(retired)) }));
    } finally { other.close(); }
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_formation BEFORE INSERT ON state_formation_document_identity BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_formation AFTER INSERT ON state_formation_document_identity BEGIN UPDATE state_formation_document_document SET scope='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeStateFormationDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => {
    const original = object[key];
    object[key] = blocked;
    restores.push(() => { object[key] = original; });
  };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return db.prepare(sql);
      },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
    assert.equal(JSON.stringify(readStateFormationDocument(guarded, { logicalPath, expectedSourceHash })), JSON.stringify(source));
  } finally {
    restores.reverse().forEach(restore => restore());
    db.close();
  }
});

test('typed tables coexist with the existing canonical schema and do not rewrite it', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(canonicalSql);
    const before = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.equal(before.length, 44);
    assert.equal(before.includes('state'), true);
    assert.equal(before.some(name => name.startsWith('state_formation_document_')), false);
    initializeStateFormationDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('state_formation_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('state_formation_document_')).sort(), Object.keys(counts).sort());
    assert.equal(after.includes('state_formation_document_wiki_ledger'), false);
    assert.equal(after.includes('state_formation_document_gdd_ledger'), false);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
