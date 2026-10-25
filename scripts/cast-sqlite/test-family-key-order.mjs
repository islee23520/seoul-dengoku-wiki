import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { initializeFamilyKeyOrder, orderFamilyNodes } from './family-key-order.mjs';
import { readSourceArchive } from './source-archive.mjs';

test('all authored family node layouts restore exact order without storing values', () => {
  const bytes = readSourceArchive('lore/name-pools/cast-family-trees.json');
  const nodes = JSON.parse(bytes).nodes;
  const db = new DatabaseSync(':memory:');
  try {
    assert.throws(() => initializeFamilyKeyOrder(db, Buffer.from('{}')), /E_FAMILY_KEY_ORDER/u);
    assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name='family_input_key_order'").get().n, 0);
    initializeFamilyKeyOrder(db, bytes);
    const unordered = nodes.map(node => Object.fromEntries(Object.entries(node).reverse()));
    const parse = JSON.parse;
    try {
      JSON.parse = () => { throw new Error('runtime parse forbidden'); };
      assert.equal(JSON.stringify(orderFamilyNodes(db, unordered)), JSON.stringify(nodes));
    } finally { JSON.parse = parse; }
    db.exec('BEGIN');
    db.exec("UPDATE family_input_key_order SET key='unknown' WHERE rowid=1");
    assert.throws(() => orderFamilyNodes(db, unordered), /E_FAMILY_KEY_ORDER/u);
    db.exec('ROLLBACK');
    db.exec('BEGIN');
    db.exec("INSERT INTO family_input_key_order VALUES('unknown-node','',0,'id')");
    assert.throws(() => orderFamilyNodes(db, unordered), /E_FAMILY_KEY_ORDER/u);
    db.exec('ROLLBACK');
    db.exec('DELETE FROM family_input_key_order WHERE rowid=(SELECT max(rowid) FROM family_input_key_order)');
    assert.throws(() => orderFamilyNodes(db, unordered), /E_FAMILY_KEY_ORDER/u);
  } finally { db.close(); }
});
