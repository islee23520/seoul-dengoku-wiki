import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { NAME_POOL_SOURCE_HASHES, initializeNamePoolDocuments, readNamePoolDocument } from './name-pool-documents.mjs';
import { openReadOnly } from './db.mjs';

const sources = (() => {
  const db = openReadOnly(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try { return Object.fromEntries(Object.entries(NAME_POOL_SOURCE_HASHES).map(([path, expectedSourceHash]) =>
    [path, { bytes: Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get(path).raw_bytes), expectedSourceHash }])); }
  finally { db.close(); }
})();
const schemaSql = readFileSync(new URL('./name-pool-documents.sql',import.meta.url),'utf8');
const options = { schemaSql, sources, actor:'test', reason:'candidate migration without approval' };

test('all three candidate pools round-trip exact values and order without runtime JSON parsing', () => {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints:true });
  const parse = JSON.parse;
  try {
    assert.deepEqual(initializeNamePoolDocuments(db,options),{documents:3,candidates:120});
    const expected = Object.fromEntries(Object.entries(sources).map(([p,s]) => [p,parse(s.bytes)]));
    JSON.parse = () => { throw Error('runtime JSON parsing forbidden'); };
    for (const [logicalPath,expectedSourceHash] of Object.entries(NAME_POOL_SOURCE_HASHES)) {
      const actual = readNamePoolDocument(db,{logicalPath,expectedSourceHash});
      assert.equal(JSON.stringify(actual),JSON.stringify(expected[logicalPath]));
      assert.throws(() => readNamePoolDocument(db,{logicalPath,expectedSourceHash:'0'.repeat(64)}),/E_NAME_POOL_DOCUMENT/);
    }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally { JSON.parse=parse; db.close(); }
});

test('missing candidates and changed metadata cannot inherit the source pin', () => {
  const db = new DatabaseSync(':memory:');
  try {
    initializeNamePoolDocuments(db,options);
    const logicalPath=Object.keys(sources)[0], expectedSourceHash=NAME_POOL_SOURCE_HASHES[logicalPath];
    for (const sql of ["UPDATE name_pool_document SET authorization='approved'",'DELETE FROM name_pool_candidate WHERE ordinal=39']) {
      db.exec('BEGIN');
      try { db.exec(sql); assert.throws(() => readNamePoolDocument(db,{logicalPath,expectedSourceHash}),/E_NAME_POOL_DOCUMENT/); }
      finally { db.exec('ROLLBACK'); }
    }
  } finally { db.close(); }
});

test('incomplete or changed input rejects before adoption', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const first=Object.keys(sources)[0];
    const incomplete={...sources}; delete incomplete[first];
    assert.throws(() => initializeNamePoolDocuments(db,{...options,sources:incomplete}),/E_NAME_POOL_DOCUMENT/);
    assert.throws(() => initializeNamePoolDocuments(db,{...options,sources:{...sources,[first]:{
      ...sources[first],bytes:Buffer.from('{}') }}}),/E_NAME_POOL_DOCUMENT/);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name='name_pool_document'").get().n,0);
  } finally { db.close(); }
});
