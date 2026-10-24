import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { initializeDocumentKeyOrder, orderDocumentKeys, preserveReceiptOrder } from './document-key-order.mjs';

test('dual-read receipt order preserves family Map values and rejects source substitutions', () => {
  const source = new Map([['K001', { id: 'K001', lineage: { surname: 'Han', clan: 'a' },
    timeline: [{ year: 2126, summary: 'record', sourceRefs: [], summaryEn: 'record' }], nameEn: 'Han' }]]);
  const typed = new Map([['K001', { nameEn: 'Han', timeline: [{ summaryEn: 'record', sourceRefs: [], summary: 'record', year: 2126 }],
    lineage: { clan: 'a', surname: 'Han' }, id: 'K001' }]]);
  const ordered = preserveReceiptOrder(typed, source);
  assert.equal(JSON.stringify([...ordered]), JSON.stringify([...source]));
  assert.notEqual(ordered.get('K001'), source.get('K001'));
  typed.get('K001').id = 'K002';
  assert.throws(() => preserveReceiptOrder(typed, source), /E_RECEIPT_VALUE_MISMATCH/);
});

test('object order preserves receipt hashes without storing or replacing document values', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE text_document(source_id INTEGER PRIMARY KEY); INSERT INTO text_document VALUES(1)');
    const original = { z: [{ text: { ko: 'original', en: 'English' }, anchor: 'a' }], a: null };
    initializeDocumentKeyOrder(db, [{ sourceId: 1, document: original }]);
    const typed = { a: null, z: [{ anchor: 'a', text: { en: 'English', ko: 'original' } }] };
    assert.equal(JSON.stringify(orderDocumentKeys(db, 1, typed)), JSON.stringify(original));
    typed.z[0].text.ko = 'typed edit';
    assert.equal(orderDocumentKeys(db, 1, typed).z[0].text.ko, 'typed edit');
    assert.throws(() => orderDocumentKeys(db, 1, { ...typed, extra: true }), /E_DOCUMENT_KEY_ORDER/);
    assert.throws(() => orderDocumentKeys(db, 99, typed), /E_DOCUMENT_KEY_ORDER/);
    for (const sql of ['DELETE FROM document_key_order', "UPDATE document_key_order SET key='other'",
      'INSERT INTO document_key_order SELECT * FROM document_key_order']) {
      assert.throws(() => db.exec(sql), /immutable document key order/);
    }
  } finally { db.close(); }
});

test('failed key-order adoption rolls back schema and permits a clean retry', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON; CREATE TABLE text_document(source_id INTEGER PRIMARY KEY); INSERT INTO text_document VALUES(1)');
    assert.throws(() => initializeDocumentKeyOrder(db, [{ sourceId: 1, document: { a: 1 } },
      { sourceId: 2, document: { b: 2 } }]), /FOREIGN KEY/);
    assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE name='document_key_order'").get(), undefined);
    initializeDocumentKeyOrder(db, [{ sourceId: 1, document: { a: 1 } }]);
    assert.deepEqual(orderDocumentKeys(db, 1, { a: 2 }), { a: 2 });
  } finally { db.close(); }
});

test('explicit approved successor order requires exact typed equality and retains import order', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE text_document(source_id INTEGER PRIMARY KEY); INSERT INTO text_document VALUES(1)');
    initializeDocumentKeyOrder(db, [{ sourceId: 1, document: { content: [{ z: 1, a: 2 }] } }]);
    const archive = db.prepare('SELECT * FROM document_key_order').all();
    const typed = { content: [{ a: 2, z: 1 }, { a: 3, z: 4 }] };
    const approvedStructure = { content: [{ z: 1, a: 2 }, { z: 4, a: 3 }] };
    assert.throws(() => orderDocumentKeys(db, 1, typed), /E_DOCUMENT_KEY_ORDER/);
    assert.equal(JSON.stringify(orderDocumentKeys(db, 1, typed, { approvedStructure })), JSON.stringify(approvedStructure));
    assert.throws(() => orderDocumentKeys(db, 1, typed, { approvedStructure: { content: [] } }), /E_RECEIPT_VALUE_MISMATCH/);
    assert.deepEqual(db.prepare('SELECT * FROM document_key_order').all(), archive);
  } finally { db.close(); }
});
