import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { initializeEditorialExampleDocument, readEditorialExampleDocument, EDITORIAL_EXAMPLE_SOURCE_HASH } from './editorial-example-document.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';

const sourceBytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, 'lore/editorial/authoring.example.json', EDITORIAL_EXAMPLE_SOURCE_HASH);
const original = JSON.parse(sourceBytes);
const options = { expectedSourceHash: EDITORIAL_EXAMPLE_SOURCE_HASH };
test('internal editorial example preserves complete source order and rejects typed drift', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeEditorialExampleDocument(db, { ...options, sourceBytes, actor: 'test', reason: 'example preservation' }),
      { documents: 1, locales: 2, nodes: 2 });
    const parse = JSON.parse;
    try {
      JSON.parse = () => { throw Error('parser fallback forbidden'); };
      assert.equal(JSON.stringify(readEditorialExampleDocument(db, options)), JSON.stringify(original));
    } finally { JSON.parse = parse; }
    assert.throws(() => readEditorialExampleDocument(db, { expectedSourceHash: '0'.repeat(64) }), /E_EDITORIAL_EXAMPLE_DOCUMENT/u);
    for (const sql of ["UPDATE editorial_example_document SET application='changed'",
      'DELETE FROM editorial_example_node WHERE ordinal=1',
      "UPDATE editorial_example_locale SET title='changed' WHERE ordinal=0"]) {
      db.exec('BEGIN'); db.exec(sql);
      assert.throws(() => readEditorialExampleDocument(db, options), /E_EDITORIAL_EXAMPLE_DOCUMENT/u);
      db.exec('ROLLBACK');
    }
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE '%admission%'").get().n, 0);
  } finally { db.close(); }
});
