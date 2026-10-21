import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { EXISTING_NAMES_SOURCE_HASH, initializeExistingNamesDocument, readExistingNamesDocument } from './existing-names-document.mjs';
import { openReadOnly } from './db.mjs';

const sourceBytes = (() => {
  const db = openReadOnly(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try { return Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get('lore/name-pools/existing-names.json').raw_bytes); }
  finally { db.close(); }
})();
const expected=JSON.parse(sourceBytes);
const options={sourceBytes,expectedSourceHash:EXISTING_NAMES_SOURCE_HASH,actor:'test',reason:'preserve complete original list'};

test('existing names retain all 1023 ordered strings without JSON parsing at read time', () => {
  const db=new DatabaseSync(':memory:');
  const parse=JSON.parse;
  try {
    assert.deepEqual(initializeExistingNamesDocument(db,options),{names:1023});
    JSON.parse=()=>{throw Error('runtime parsing forbidden');};
    assert.deepEqual(readExistingNamesDocument(db,{expectedSourceHash:EXISTING_NAMES_SOURCE_HASH}),expected);
    assert.throws(()=>readExistingNamesDocument(db,{expectedSourceHash:'0'.repeat(64)}),/E_EXISTING_NAMES_DOCUMENT/);
  } finally {JSON.parse=parse;db.close();}
});

test('missing, reordered and changed names reject the old source pin', () => {
  const db=new DatabaseSync(':memory:');
  try {
    initializeExistingNamesDocument(db,options);
    for (const sql of ["UPDATE existing_name SET name='changed' WHERE ordinal=0",
      'DELETE FROM existing_name WHERE ordinal=1022',
      'UPDATE existing_name SET ordinal=2000 WHERE ordinal=0',
      "UPDATE existing_names_import SET source_sha256='"+'0'.repeat(64)+"'"]) {
      db.exec('BEGIN');
      try {db.exec(sql);assert.throws(()=>readExistingNamesDocument(db,{expectedSourceHash:EXISTING_NAMES_SOURCE_HASH}),/E_EXISTING_NAMES_DOCUMENT/);}
      finally {db.exec('ROLLBACK');}
    }
    assert.throws(()=>initializeExistingNamesDocument(db,{...options,sourceBytes:Buffer.from('[]')}),/E_EXISTING_NAMES_DOCUMENT/);
  } finally {db.close();}
});
