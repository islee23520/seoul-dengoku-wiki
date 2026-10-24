import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { editDocumentOnConnection, editDocumentsOnConnection, readDocumentRevision } from './document-edit.mjs';
import { relationDocumentEditOptions } from './relation-document-editor.mjs';
import { orderDocumentKeys } from './document-key-order.mjs';
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

test('exact approved successors and dependent relations commit together on an actual private clone', {
  skip: !process.env.DOCUMENT_STRUCTURE_DATABASE || !process.env.DOCUMENT_APPROVED_PROPOSAL,
}, t => {
  const directory = mkdtempSync(join(tmpdir(), 'document-approved-actual-'));
  const path = join(directory, 'copy.sqlite');
  copyFileSync(process.env.DOCUMENT_STRUCTURE_DATABASE, path);
  const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true, force: true }); });
  const proposal = process.env.DOCUMENT_APPROVED_PROPOSAL;
  const manifest = JSON.parse(readFileSync(join(proposal, 'manifest.json'), 'utf8'));
  const bodies = manifest.documents.map(d => {
    const bytes = readFileSync(join(proposal, d.after.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), d.after.byteSha256);
    return JSON.parse(bytes);
  });
  const selections = bodies.map(d => ({ documentId: d.id, domain: d.domain, corpusKind: 'current', visibility: 'internal' }));
  const before = selections.map(s => readDocument(db, s));
  const rows = db.prepare('SELECT * FROM relation ORDER BY row_ordinal').all();
  const heads = db.prepare('SELECT * FROM document_head ORDER BY source_id').all();
  const revisionCount = db.prepare('SELECT count(*) n FROM document_revision').get().n;
  const archive = db.prepare('SELECT * FROM document_key_order ORDER BY source_id,object_pointer,ordinal').all();
  const options = manifest.documents.map((d, i) => ({ ...selections[i], expectedRevision: d.predecessorRevision,
    expectedSemanticSha256: d.after.expectedStoredSemanticSha256, actor: 'approved-integration-test', reason: 'exact successor clone proof',
    changes: i === 0 ? [{ type: 'appendTableRow', nodeId: before[0].content[1].anchor,
      expectedRows: before[0].content[1].rows.length, row: bodies[0].content[1].rows.at(-1) }]
      : bodies[1].content.slice(13, 17).map((node, n) => ({ type: 'insertNode', index: 13 + n, node })),
  }));
  const batch = [relationDocumentEditOptions(options[0]), options[1]];
  const unchanged = () => {
    assert.deepEqual(selections.map(s => readDocument(db, s)), before);
    assert.deepEqual(db.prepare('SELECT * FROM relation ORDER BY row_ordinal').all(), rows);
    assert.deepEqual(db.prepare('SELECT * FROM document_head ORDER BY source_id').all(), heads);
    assert.equal(db.prepare('SELECT count(*) n FROM document_revision').get().n, revisionCount);
  };
  assert.throws(() => editDocumentsOnConnection(db, [batch[0], { ...batch[1], expectedRevision: 'stale' }]), { code: 'E_REVISION_CONFLICT' });
  unchanged();
  assert.throws(() => editDocumentsOnConnection(db, [batch[0], { ...batch[1], expectedSemanticSha256: 'wrong' }]), { code: 'E_DOCUMENT_EXPECTED_BODY' });
  unchanged();
  db.exec("CREATE TRIGGER fail_relation_insert BEFORE INSERT ON relation BEGIN SELECT RAISE(ABORT,'typed projection failure'); END");
  assert.throws(() => editDocumentsOnConnection(db, batch), /typed projection failure/);
  unchanged();
  db.exec('DROP TRIGGER fail_relation_insert');
  const results = editDocumentsOnConnection(db, batch);
  for (let i = 0; i < 2; i++) {
    const stored = readDocument(db, selections[i]);
    assert.deepEqual(stored, bodies[i]);
    assert.equal(JSON.stringify(orderDocumentKeys(db, manifest.documents[i].sourceId, stored, { approvedStructure: bodies[i] })), JSON.stringify(bodies[i]));
    assert.deepEqual(readDocumentRevision(db, { ...selections[i], revision: manifest.documents[i].predecessorRevision }), before[i]);
    assert.deepEqual(readDocumentRevision(db, { ...selections[i], revision: results[i].revision }), bodies[i]);
    assert.equal(results[i].semanticSha256, manifest.documents[i].after.expectedStoredSemanticSha256);
  }
  const afterRows = db.prepare('SELECT * FROM relation ORDER BY row_ordinal').all();
  assert.deepEqual(afterRows.slice(0, -1), rows);
  assert.equal(afterRows.at(-1).from_person_id, 'K1009');
  assert.equal(afterRows.at(-1).to_person_id, 'K348');
  assert.equal(afterRows.at(-1).json_pointer, '/content/1/rows/748');
  assert.deepEqual(db.prepare('SELECT * FROM document_key_order ORDER BY source_id,object_pointer,ordinal').all(), archive);
  assert.equal(db.prepare('SELECT count(*) n FROM document_revision').get().n, revisionCount + 2);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});
