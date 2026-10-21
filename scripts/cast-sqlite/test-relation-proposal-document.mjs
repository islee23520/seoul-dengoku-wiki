import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { RELATION_PROPOSAL_SOURCE_HASH, initializeRelationProposalDocument, readRelationProposalDocument } from './relation-proposal-document.mjs';
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs';

const sourceBytes = readFileSync(new URL('../../docs/editorial/2026-09-29/cast-relations-unpublished-proposal.json', import.meta.url));
const original = JSON.parse(sourceBytes);
const options = { expectedSourceHash: RELATION_PROPOSAL_SOURCE_HASH };
test('actual integrated scope restores the unpublished proposal and rejects a wrong pin', {
  skip: !process.env.RELATION_PROPOSAL_DB,
}, () => {
  const db = new DatabaseSync(process.env.RELATION_PROPOSAL_DB, { readOnly: true });
  const parse = JSON.parse;
  try {
    JSON.parse = () => { throw Error('parser fallback forbidden'); };
    const logicalPath = 'docs/editorial/2026-09-29/cast-relations-unpublished-proposal.json';
    assert.equal(JSON.stringify(readScopeCurrentSource({ db, logicalPath, expectedSha256: RELATION_PROPOSAL_SOURCE_HASH })), JSON.stringify(original));
    assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }), /E_RELATION_PROPOSAL_DOCUMENT/u);
  } finally { JSON.parse = parse; db.close(); }
});
test('whole unpublished proposal preserves ordered bilingual cells without changing current relations', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE current_relation (id TEXT); INSERT INTO current_relation VALUES ('retained')");
    assert.deepEqual(initializeRelationProposalDocument(db, { ...options, sourceBytes, actor: 'test', reason: 'preservation only' }),
      { documents: 1, columns: 4, rows: 7 });
    const parse = JSON.parse;
    try {
      JSON.parse = () => { throw Error('parser forbidden'); };
      const guarded = { prepare(sql) { assert.match(sql, /^SELECT /u); assert.doesNotMatch(sql, /archive|source_record/u); return db.prepare(sql); } };
      assert.equal(JSON.stringify(readRelationProposalDocument(guarded, options)), JSON.stringify(original));
    } finally { JSON.parse = parse; }
    assert.deepEqual(db.prepare('SELECT id FROM current_relation').all().map(row => row.id), ['retained']);
    assert.throws(() => readRelationProposalDocument(db, { expectedSourceHash: '0'.repeat(64) }), /E_RELATION_PROPOSAL_DOCUMENT/u);
    for (const sql of ["DELETE FROM relation_proposal_document_row WHERE ordinal=0",
      "UPDATE relation_proposal_document_row SET grounds_ko='changed' WHERE ordinal=0",
      "UPDATE relation_proposal_document SET source_sha256='" + '0'.repeat(64) + "'"]) {
      db.exec('BEGIN'); db.exec(sql);
      assert.throws(() => readRelationProposalDocument(db, options), /E_RELATION_PROPOSAL_DOCUMENT/u);
      db.exec('ROLLBACK');
    }
  } finally { db.close(); }
});
