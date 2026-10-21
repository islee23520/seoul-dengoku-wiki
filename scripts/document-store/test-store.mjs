import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { openDocumentStore } from './store.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'wiki-document-store-'));
  const path = join(directory, 'documents.sqlite');
  const connections = [];
  const open = (options = {}) => {
    const store = openDocumentStore(path, { scope: 'internal', readOnly: false, ...options });
    connections.push(store);
    return store;
  };
  const store = open({ create: true });
  t.after(() => {
    for (const connection of connections) {
      try { connection.close(); } catch (error) { if (error.code !== 'ERR_INVALID_STATE') throw error; }
    }
    rmSync(directory, { recursive: true, force: true });
  });
  return { directory, path, store, open };
}

const input = (id, value, extra = {}) => ({ id, value, corpus: 'envelope', privacy: 'public', approvalState: 'draft', ...extra });
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('create, edit and reopen without source files; archived exact approved bytes remain unchanged', (t) => {
  const f = fixture(t);
  const bytes = Buffer.from('{\n "paragraph": "old", "optional": null\n}\n');
  const original = { paragraph: 'old', optional: null };
  assert.deepEqual(f.store.create(input('stable-K1', original, { rawBytes: bytes, approvalState: 'approved',
    provenance: { logicalPath: '/nonexistent/old.json', gitRevision: 'old-commit', gitBlob: 'old-blob' } })), { id: 'stable-K1', revision: 1 });
  assert.deepEqual(f.store.read('stable-K1').value, original);
  const next = { paragraph: 'new', nested: [false, null, { empty: [], text: '' }] };
  assert.deepEqual(f.store.update(input('stable-K1', next, { expectedRevision: 1,
    provenance: { logicalPath: '/nonexistent/renamed.json' } })), { id: 'stable-K1', revision: 2 });
  f.store.close();
  const reopened = f.open();
  assert.deepEqual(reopened.read('stable-K1').value, next);
  assert.equal(reopened.read('stable-K1').revision, 2);
  const archive = reopened.readRevision('stable-K1', 1);
  assert.deepEqual(archive.rawBytes, bytes);
  assert.equal(archive.sha256, sha256(bytes));
  assert.equal(archive.approvalState, 'approved');
  assert.equal(reopened.readRevision('stable-K1', 2).approvalState, 'draft');
  assert.equal(archive.provenance.logicalPath, '/nonexistent/old.json');
  assert.deepEqual(readdirSync(f.directory), ['documents.sqlite']);
});

test('typed current scalars, nested ordering, missing/null, empty values and malicious member names round-trip', (t) => {
  const f = fixture(t);
  const value = JSON.parse('{"z":[null,{},[],false,true,0,1.5,""],"a":{"present":null},"__proto__":{"polluted":true},"constructor":7}');
  value.negativeZero = -0;
  f.store.create(input('ordered', value));
  const read = f.store.read('ordered').value;
  assert.deepEqual(read, value);
  assert.deepEqual(Object.keys(read), Object.keys(value));
  assert.equal(Object.hasOwn(read.a, 'missing'), false);
  assert.equal(Object.hasOwn(read.a, 'present'), true);
  assert.equal(Object.is(read.negativeZero, -0), true);
  assert.equal({}.polluted, undefined);
  const db = new DatabaseSync(f.path);
  t.after(() => db.close());
  const kinds = db.prepare('SELECT DISTINCT kind FROM document_node ORDER BY kind').all().map((row) => row.kind);
  assert.deepEqual(kinds, ['array', 'boolean', 'null', 'number', 'object', 'string']);
  assert.equal(db.prepare("SELECT number_value FROM document_node WHERE member_key = 'constructor'").get().number_value, 7);
});

test('two writers reject a stale expected revision without adding history or altering current rows', (t) => {
  const f = fixture(t);
  f.store.create(input('writer', { value: 1 }));
  const second = f.open();
  const expectedRevision = second.read('writer').revision;
  f.store.update(input('writer', { value: 2 }, { expectedRevision }));
  assert.throws(() => second.update(input('writer', { value: 3 }, { expectedRevision })), { code: 'E_STALE_REVISION' });
  assert.deepEqual(second.read('writer').value, { value: 2 });
  assert.equal(second.readRevision('writer', 3), null);
});

test('failure after revision insertion and current deletion rolls back every write', (t) => {
  const f = fixture(t);
  f.store.create(input('atomic', { original: ['kept'] }));
  const db = new DatabaseSync(f.path, { enableForeignKeyConstraints: true });
  t.after(() => db.close());
  db.exec("CREATE TRIGGER fail_node BEFORE INSERT ON document_node WHEN NEW.member_key = 'fail' BEGIN SELECT RAISE(ABORT, 'injected node failure'); END");
  assert.throws(() => f.store.update(input('atomic', { first: 1, fail: 2 }, { expectedRevision: 1 })), /injected node failure/);
  assert.equal(f.store.read('atomic').revision, 1);
  assert.deepEqual(f.store.read('atomic').value, { original: ['kept'] });
  assert.equal(f.store.readRevision('atomic', 2), null);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
});

test('retirement hides current reads/lists but retains historical proof and rejects later edits', (t) => {
  const f = fixture(t);
  f.store.create(input('retired', { retain: true }));
  const before = f.store.readRevision('retired', 1);
  assert.throws(() => f.store.retire({ id: 'retired', expectedRevision: 0, approvalState: 'retired' }), { code: 'E_STALE_REVISION' });
  f.store.retire({ id: 'retired', expectedRevision: 1, approvalState: 'retired' });
  assert.equal(f.store.read('retired'), null);
  assert.deepEqual(f.store.list(), []);
  assert.equal(f.store.read('retired', { includeRetired: true }).retired, true);
  assert.deepEqual(f.store.readRevision('retired', 1), before);
  assert.equal(f.store.readRevision('retired', 2).operation, 'retire');
  assert.throws(() => f.store.update(input('retired', {}, { expectedRevision: 2 })), { code: 'E_NOT_FOUND' });
  assert.throws(() => f.store.create(input('retired', {})), { code: 'E_DUPLICATE_ID' });
});

test('public access cannot list/read private or editorial records, archive bytes or provenance', (t) => {
  const f = fixture(t);
  f.store.create(input('public', { visible: true }, { provenance: { logicalPath: 'secret-origin.json' } }));
  f.store.create(input('private', { secret: 'private-sentinel' }, { privacy: 'private' }));
  f.store.create(input('editorial', { secret: 'editorial-sentinel' }, { privacy: 'editorial' }));
  f.store.create(input('editorial-corpus', { secret: true }, { corpus: 'editorial' }));
  const publicStore = f.open({ scope: 'public', readOnly: true });
  assert.deepEqual(publicStore.list(), [{ id: 'public', corpus: 'envelope', revision: 1 }]);
  assert.deepEqual(publicStore.read('public'), { id: 'public', corpus: 'envelope', revision: 1, value: { visible: true } });
  for (const id of ['private', 'editorial', 'editorial-corpus']) assert.equal(publicStore.read(id), null);
  assert.throws(() => publicStore.readRevision('public', 1), { code: 'E_SCOPE' });
  assert.throws(() => publicStore.read('public', { includeRetired: true }), { code: 'E_SCOPE' });
  assert.throws(() => publicStore.list({ includeRetired: true }), { code: 'E_SCOPE' });
  assert.throws(() => publicStore.create(input('forbidden', {})), { code: 'E_SCOPE' });
  assert.equal(Object.hasOwn(publicStore, 'db'), false);
  assert.equal(Object.hasOwn(publicStore, 'exec'), false);
  assert.deepEqual(f.store.read('private').value, { secret: 'private-sentinel' });
});

test('IDs are bound SQL values, duplicate identities reject and unknown rows never fall back to paths', (t) => {
  const f = fixture(t);
  const id = "../../nonexistent.json'; DROP TABLE document; --";
  f.store.create(input(id, { safe: true }));
  assert.deepEqual(f.store.read(id).value, { safe: true });
  assert.throws(() => f.store.create(input(id, { changed: true })), { code: 'E_DUPLICATE_ID' });
  assert.equal(f.store.read('/etc/passwd'), null);
  assert.equal(f.store.readRevision('unknown', 1), null);
  assert.throws(() => f.store.update(input('unknown', {}, { expectedRevision: 1 })), { code: 'E_NOT_FOUND' });
  assert.throws(() => f.store.read('bad\0id'), { code: 'E_METADATA' });
  assert.equal(f.store.list().length, 1);
});

test('archive triggers reject update/delete and foreign keys/typed constraints reject unknown rows', (t) => {
  const f = fixture(t);
  f.store.create(input('immutable', { value: 1 }));
  const db = new DatabaseSync(f.path, { enableForeignKeyConstraints: true });
  t.after(() => db.close());
  assert.throws(() => db.exec("UPDATE document_revision SET approval_state = 'approved'"), /immutable revision/);
  assert.throws(() => db.exec('DELETE FROM document_revision'), /immutable revision/);
  assert.throws(() => db.exec("INSERT INTO document_node VALUES ('unknown', 0, NULL, 0, NULL, 'null', NULL, NULL, NULL, 0)"), /FOREIGN KEY/);
  assert.throws(() => db.exec("UPDATE document_node SET kind = 'unknown'"), /CHECK/);
  db.exec('PRAGMA ignore_check_constraints=ON');
  db.exec("UPDATE document_node SET kind = 'unknown' WHERE node_id = 1");
  assert.throws(() => f.store.read('immutable'), { code: 'E_TREE_INTEGRITY' });
});

test('invalid candidate values and byte/value mismatch leave no partial identity or revision', (t) => {
  const f = fixture(t);
  const circular = {}; circular.self = circular;
  for (const value of [undefined, { value: undefined }, [1, , 3], NaN, Infinity, circular, new Date(), { get value() { throw new Error('getter evaluated'); } }]) {
    assert.throws(() => f.store.create(input('invalid', value)), { code: 'E_JSON_VALUE' });
    assert.equal(f.store.read('invalid'), null);
    assert.equal(f.store.readRevision('invalid', 1), null);
  }
  assert.throws(() => f.store.create(input('invalid', { a: 1 }, { rawBytes: Buffer.from('{"a":2}') })), { code: 'E_BYTES_VALUE' });
  assert.deepEqual(f.store.list(), []);
});

test('opening refuses absent/unrelated databases and public write scope; held writer fails without retries', (t) => {
  const f = fixture(t);
  assert.throws(() => openDocumentStore(join(f.directory, 'absent.sqlite'), { scope: 'internal', readOnly: false }));
  const unrelated = join(f.directory, 'other.sqlite');
  const other = new DatabaseSync(unrelated);
  other.exec('CREATE TABLE unrelated(value TEXT) STRICT');
  other.close();
  assert.throws(() => openDocumentStore(unrelated, { scope: 'internal', readOnly: false }), { code: 'E_SCHEMA' });
  assert.throws(() => openDocumentStore(f.path, { scope: 'public', readOnly: false }), { code: 'E_SCOPE' });
  f.store.create(input('busy', {}));
  const lock = new DatabaseSync(f.path);
  t.after(() => lock.close());
  lock.exec('BEGIN IMMEDIATE');
  try { assert.throws(() => f.store.update(input('busy', { changed: true }, { expectedRevision: 1 })), /locked/); }
  finally { lock.exec('ROLLBACK'); }
  assert.equal(f.store.read('busy').revision, 1);
});
