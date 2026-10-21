import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { editDocumentOnConnection, readDocumentRevision } from './document-edit.mjs';
import { readDocument } from './document-read.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';

test('actual migrated current document supports structural edits and immutable history on a private copy', {
  skip: !process.env.DOCUMENT_STRUCTURE_DATABASE,
}, t => {
  const directory = mkdtempSync(join(tmpdir(), 'document-structure-actual-'));
  const path = join(directory, 'copy.sqlite');
  copyFileSync(process.env.DOCUMENT_STRUCTURE_DATABASE, path);
  const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true, force: true }); });
  const selection = { documentId: 'DOC:National-Dress-and-Grooming', domain: 'culture', corpusKind: 'current', visibility: 'internal' };
  const original = readDocument(db, selection);
  const sourceId = original.readMetadata.source_id;
  const revision = db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(sourceId).revision_id;
  const oldCount = db.prepare('SELECT count(*) n FROM document_revision').get().n;
  const archive = db.prepare('SELECT sha256,byte_length FROM source_file WHERE source_id=?').get(sourceId);
  const routes = db.prepare('SELECT * FROM article_route ORDER BY route').all();
  const edit = (expectedRevision, changes) => editDocumentOnConnection(db, {
    ...selection, expectedRevision, changes, actor: 'structural-integration-test', reason: 'isolated copy verification',
  });
  const inserted = edit(revision, [{ type: 'insertNode', index: 0, node: { kind: 'rule', anchor: 'structural-test-rule' } }]);
  const withRule = readDocument(db, selection);
  assert.equal(withRule.content[0].anchor, 'structural-test-rule');
  assert.equal(withRule.status, 'draft');
  const reordered = edit(inserted.revision, [{ type: 'reorderNodes', nodeIds: [...original.content.map(node => node.anchor), 'structural-test-rule'] }]);
  assert.equal(readDocument(db, selection).content.at(-1).anchor, 'structural-test-rule');
  const removed = edit(reordered.revision, [{ type: 'deleteNode', nodeId: 'structural-test-rule' }]);
  assert.deepEqual(readDocument(db, selection).content, original.content);
  assert.equal(db.prepare('SELECT count(*) n FROM document_revision').get().n, oldCount + 3);
  assert.equal(db.prepare('SELECT version FROM document_authority').get().version, 2);
  assert.deepEqual(db.prepare('SELECT sha256,byte_length FROM source_file WHERE source_id=?').get(sourceId), archive);
  // A real routed article must be editable without deleting its route first.
  const routed = { documentId: 'DOC:Ailments', domain: 'ailments', corpusKind: 'current', visibility: 'internal' };
  const routedBefore = readDocument(db, routed);
  const routedId = routedBefore.readMetadata.source_id;
  assert.ok(routes.some(row => row.source_id === routedId));
  const routedRevision = db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(routedId).revision_id;
  editDocumentOnConnection(db, { ...routed, expectedRevision: routedRevision,
    actor: 'structural-integration-test', reason: 'route retention verification',
    changes: [{ type: 'insertNode', index: 0, node: { kind: 'rule', anchor: 'route-edit-rule' } }] });
  assert.equal(readDocument(db, { ...routed, visibility: 'public' }), null);
  assert.deepEqual(db.prepare('SELECT * FROM article_route ORDER BY route').all(), routes);
  assert.deepEqual(readDocumentRevision(db, { ...routed, revision: routedRevision }), routedBefore);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
  const reopened = new DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    const typedOnly = { prepare(sql) {
      assert.doesNotMatch(sql, /\b(?:FROM|JOIN)\s+source_record\b|\braw_bytes\b/iu);
      return reopened.prepare(sql);
    } };
    const historical = readDocumentRevision(typedOnly, { ...selection, revision });
    assert.deepEqual(historical, original);
    assert.deepEqual(readDocumentRevision(typedOnly, { ...selection, revision: inserted.revision }), withRule);
    assert.deepEqual(readDocumentRevision(typedOnly, { ...selection, revision: removed.revision }).content, original.content);
    for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(historical, locale), renderLoreMarkdown(original, locale));
  } finally { reopened.close(); }
});
