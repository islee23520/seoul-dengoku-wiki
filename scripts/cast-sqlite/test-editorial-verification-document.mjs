import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs';
import { EDITORIAL_VERIFICATION_SOURCE_HASH, EDITORIAL_VERIFICATION_DOCUMENT_HASH,
  initializeEditorialVerificationDocument, readEditorialVerificationDocument } from './editorial-verification-document.mjs';

const sourceBytes = readFileSync(new URL('../../docs/editorial/2026-09-29/verification-evidence.json', import.meta.url));
const original = JSON.parse(sourceBytes);
const pins = { expectedSourceHash: EDITORIAL_VERIFICATION_SOURCE_HASH, expectedDocumentHash: EDITORIAL_VERIFICATION_DOCUMENT_HASH };
test('actual integrated scope preserves the complete historical verification', {
  skip: !process.env.EDITORIAL_VERIFICATION_DB,
}, () => {
  const db = new DatabaseSync(process.env.EDITORIAL_VERIFICATION_DB, { readOnly: true });
  const parse = JSON.parse;
  try {
    JSON.parse = () => { throw Error('runtime parser forbidden'); };
    const logicalPath = 'docs/editorial/2026-09-29/verification-evidence.json';
    assert.equal(JSON.stringify(readScopeCurrentSource({ db, logicalPath, expectedSha256: EDITORIAL_VERIFICATION_SOURCE_HASH })), JSON.stringify(original));
    assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }), /E_EDITORIAL_VERIFICATION_DOCUMENT/u);
  } finally { JSON.parse = parse; db.close(); }
});
test('complete historical verification preserves exact protected source order without granting publication', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeEditorialVerificationDocument(db, { ...pins, sourceBytes, actor: 'test', reason: 'historical preservation' }),
      { documents: 1, protectedSources: 6 });
    const parse = JSON.parse;
    try {
      JSON.parse = () => { throw Error('runtime parser forbidden'); };
      assert.equal(JSON.stringify(readEditorialVerificationDocument(db, pins)), JSON.stringify(original));
    } finally { JSON.parse = parse; }
    for (const sql of ["DELETE FROM editorial_verification_protected_source WHERE ordinal=0",
      "UPDATE editorial_verification_protected_source SET sha256='" + '0'.repeat(64) + "' WHERE ordinal=0",
      "UPDATE editorial_verification_document SET scope='forged',document_sha256='" + '0'.repeat(64) + "'"]) {
      db.exec('BEGIN'); db.exec(sql);
      assert.throws(() => readEditorialVerificationDocument(db, pins), /E_EDITORIAL_VERIFICATION_DOCUMENT/u);
      db.exec('ROLLBACK');
    }
    assert.throws(() => readEditorialVerificationDocument(db, { ...pins, expectedSourceHash: '0'.repeat(64) }), /E_EDITORIAL_VERIFICATION_DOCUMENT/u);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE '%admission%'").get().n, 0);
  } finally { db.close(); }
});
