import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { INTERNAL_EVIDENCE_CAPABILITY, openEvidenceStore } from './evidence.mjs';
import { openDocumentStore } from './store.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const entry = (identity, bytes = Buffer.from(identity), extra = {}) => ({ identity, bytes,
  sha256: sha(bytes), kind: 'archive', logicalPath: '/nonexistent/private/' + identity,
  revision: 'captured-revision-1', gitRevision: 'commit-binding', gitBlob: 'blob-binding', references: [], ...extra });
const ref = (target, extra = {}) => ({ type: 'schema-dependency', pointer: '/dependency',
  targetIdentity: target.identity, expectedSha256: target.sha256, ...extra });
const pin = (e) => ({ identity: e.identity, expectedSha256: e.sha256 });

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'wiki-private-evidence-'));
  const path = join(directory, 'private.sqlite');
  const connections = [];
  const open = (options = {}) => {
    const store = openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY, ...options });
    connections.push(store);
    return store;
  };
  const db = () => {
    const connection = new DatabaseSync(path, { enableForeignKeyConstraints: true });
    connections.push(connection);
    return connection;
  };
  const store = open({ create: true, readOnly: false });
  t.after(() => {
    for (const connection of connections) {
      try { connection.close(); } catch (error) { if (error.code !== 'ERR_INVALID_STATE') throw error; }
    }
    rmSync(directory, { recursive: true, force: true });
  });
  return { path, directory, open, db, store };
}

test('exact binary, gzip and JSON bytes survive reopen with no source files or JSON approval interpretation', (t) => {
  const f = fixture(t);
  const json = Buffer.from('{\r\n "approved": true, "proof": "not interpreted", "x": 1 \r\n}\n');
  const entries = [entry('binary', Buffer.from([0, 255, 128, 13, 10])), entry('gzip', gzipSync(json)),
    entry('json', json, { kind: 'ownerapproval' })];
  f.store.importBatch(entries);
  f.store.close();
  const reopened = f.open();
  for (const e of entries) {
    assert.deepEqual(reopened.getEvidence(e.identity, e.sha256), e.bytes);
    assert.deepEqual(reopened.describeEvidence(e.identity, e.sha256), { identity: e.identity, kind: e.kind,
      logicalPath: e.logicalPath, revision: e.revision, gitRevision: e.gitRevision, gitBlob: e.gitBlob,
      sha256: e.sha256, byteLength: e.bytes.length });
  }
  const returned = reopened.getEvidence('binary', entries[0].sha256);
  returned.fill(0);
  assert.deepEqual(reopened.getEvidence('binary', entries[0].sha256), entries[0].bytes);
  assert.deepEqual(readdirSync(f.directory), ['private.sqlite']);
  assert.equal(statSync(f.path).mode & 0o777, 0o600);
  assert.throws(() => reopened.importBatch([]), { code: 'E_READ_ONLY' });
});

test('normalized typed directed references preserve cycles, shared targets and self references', (t) => {
  const f = fixture(t);
  const a = entry('a', undefined, { kind: 'packet' });
  const b = entry('b', undefined, { kind: 'review' });
  const c = entry('c', undefined, { kind: 'baseline' });
  const d = entry('d', undefined, { kind: 'registry' });
  a.references = [ref(c, { pointer: '/c' }), ref(b)];
  b.references = [ref(a)];
  c.references = [ref(c), ref(b, { pointer: '/shared' })];
  d.references = [ref(a)];
  assert.equal(f.store.importBatch([a, b, c, d]).length, 4);
  assert.deepEqual(f.store.verifyClosure([pin(a)]).map((e) => e.identity), ['a', 'b', 'c']);
  assert.deepEqual(f.store.listReferences(a.identity, a.sha256), [ref(c, { pointer: '/c' }), ref(b)]);
  assert.equal(f.store.verifyClosure([pin(d)]).length, 4);
  assert.throws(() => f.store.verifyClosure([pin(a), { identity: 'a', expectedSha256: '0'.repeat(64) }]), { code: 'E_SHA_MISMATCH' });
  assert.throws(() => f.store.verifyClosure([{ identity: 'missing', expectedSha256: a.sha256 }]), { code: 'E_NOT_FOUND' });
});

test('duplicate exact imports are idempotent; every metadata, byte or reference difference conflicts atomically', (t) => {
  const f = fixture(t);
  const target = entry('target');
  const a = entry('a', undefined, { references: [ref(target)] });
  f.store.importBatch([a, target]);
  assert.deepEqual(f.store.importBatch([target, a, a]), f.store.verifyClosure([pin(a)]));
  for (const patch of [{ kind: 'review' }, { logicalPath: 'other' }, { revision: 'other' },
    { gitRevision: null }, { gitBlob: null }, { references: [] },
    { bytes: Buffer.from('different'), sha256: sha('different') }]) {
    assert.throws(() => f.store.importBatch([entry('new'), { ...a, ...patch }]), { code: 'E_IDENTITY_CONFLICT' });
    assert.throws(() => f.store.getEvidence('new', sha('new')), { code: 'E_NOT_FOUND' });
  }
  assert.equal(f.db().prepare('SELECT count(*) AS n FROM evidence').get().n, 2);
});

test('unknown or hash-mismatched dependencies and invalid inputs roll the entire batch back', (t) => {
  const f = fixture(t);
  const absent = entry('absent');
  const a = entry('a', undefined, { references: [ref(absent)] });
  assert.throws(() => f.store.importBatch([entry('first'), a]), { code: 'E_NOT_FOUND' });
  assert.equal(f.db().prepare('SELECT count(*) AS n FROM evidence').get().n, 0);
  assert.equal(f.db().prepare('SELECT count(*) AS n FROM evidence_reference').get().n, 0);
  f.store.importBatch([absent]);
  a.references = [ref(absent, { expectedSha256: '0'.repeat(64) })];
  assert.throws(() => f.store.importBatch([a]), { code: 'E_SHA_MISMATCH' });
  for (const patch of [{ bytes: '{}' }, { sha256: 'invalid' }, { sha256: '0'.repeat(64) },
    { kind: 'approval-granted' }, { references: [ref(absent, { pointer: '/bad~2' })] },
    { references: [ref(absent), ref(absent)] }, { references: undefined }]) {
    assert.throws(() => f.store.importBatch([entry('first'), { ...entry('invalid'), ...patch }]));
    assert.throws(() => f.store.getEvidence('first', sha('first')), { code: 'E_NOT_FOUND' });
  }
  assert.deepEqual(f.db().prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(f.db().prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
});

test('all immutable tables reject edits and sealed reference insertion', (t) => {
  const f = fixture(t);
  const a = entry('a');
  a.references = [ref(a)];
  f.store.importBatch([a]);
  const db = f.db();
  for (const table of ['evidence', 'evidence_reference', 'evidence_policy']) {
    assert.throws(() => db.exec(`DELETE FROM ${table}`), /immutable evidence/);
  }
  assert.throws(() => db.exec("UPDATE evidence SET revision = 'new'"), /immutable evidence/);
  assert.throws(() => db.exec("UPDATE evidence_reference SET type = 'new'"), /immutable evidence/);
  assert.throws(() => db.exec("UPDATE evidence_policy SET privacy = 'public'"), /immutable evidence/);
  assert.throws(() => db.prepare('INSERT INTO evidence_reference VALUES (?, ?, ?, ?, ?)').run('a', 'new', '', 'a', a.sha256), /immutable evidence/);
});

test('out-of-band byte, length, metadata and graph corruption fail closed on reads and closure', (t) => {
  for (const mutation of ["UPDATE evidence SET raw_bytes = X'00'", 'UPDATE evidence SET byte_length = 999',
    "UPDATE evidence SET revision = 'forged'", "UPDATE evidence_reference SET pointer = '/forged'"]) {
    const f = fixture(t);
    const a = entry('a');
    a.references = [ref(a)];
    f.store.importBatch([a]);
    const db = f.db();
    db.exec('DROP TRIGGER evidence_no_update; DROP TRIGGER reference_no_update; PRAGMA ignore_check_constraints=ON');
    db.exec(mutation);
    assert.throws(() => f.store.getEvidence(a.identity, a.sha256), { code: 'E_INTEGRITY' });
    assert.throws(() => f.store.listReferences(a.identity, a.sha256), { code: 'E_INTEGRITY' });
    assert.throws(() => f.store.verifyClosure([pin(a)]), { code: 'E_INTEGRITY' });
  }
});

test('explicit internal capability and closed policy reject public stores regardless of paths', (t) => {
  const f = fixture(t);
  for (const options of [{}, { capability: Symbol('internal evidence archive') },
    { capability: INTERNAL_EVIDENCE_CAPABILITY, scope: 'public' }]) {
    assert.throws(() => openEvidenceStore(f.path, options), { code: 'E_PRIVATE' });
  }
  assert.throws(() => openDocumentStore(f.path), { code: 'E_SCHEMA' });
  const publicPath = join(f.directory, 'public.sqlite');
  const publicStore = openDocumentStore(publicPath, { scope: 'internal', create: true, readOnly: false });
  publicStore.close();
  assert.throws(() => openEvidenceStore(publicPath, { capability: INTERNAL_EVIDENCE_CAPABILITY, readOnly: false }), { code: 'E_SCHEMA' });
  const db = f.db();
  db.exec("DROP TRIGGER policy_no_update; PRAGMA ignore_check_constraints=ON; UPDATE evidence_policy SET privacy = 'public'");
  assert.throws(() => f.open(), { code: 'E_PRIVATE' });
  assert.throws(() => f.store.verifyClosure([]), { code: 'E_PRIVATE' });
  assert.equal(Object.hasOwn(f.store, 'db'), false);
  assert.equal(Object.hasOwn(f.store, 'exec'), false);
});
