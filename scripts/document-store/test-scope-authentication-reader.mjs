import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { CHARACTER_CONTRACT_SOURCE_HASH } from '../cast-sqlite/character-contract-document.mjs';
import { initializeEditorialExampleDocument, EDITORIAL_EXAMPLE_SOURCE_HASH } from '../cast-sqlite/editorial-example-document.mjs';
import { scopeAuthenticationReader } from './scope-authentication-reader.mjs';
import { readPrivateSourceArchive } from './private-source-archive.mjs';

const logicalPath = 'lore/editorial/authoring.example.json';
const bytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, logicalPath, EDITORIAL_EXAMPLE_SOURCE_HASH);
const root = '/sealed-scope-authentication';
test('actual authority and sealed SQLite evidence replay exact current bytes with filesystem access denied', {
  skip: !process.env.SCOPE_AUTHENTICATION_DB,
}, async () => {
  const pins = new Map([[logicalPath, EDITORIAL_EXAMPLE_SOURCE_HASH],
    ['lore/editorial/Character-System-Contract.json', CHARACTER_CONTRACT_SOURCE_HASH]]);
  const originals = new Map([...pins].map(([path, pin]) => [path, readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, path, pin)]));
  const directory = fs.mkdtempSync(join(tmpdir(), 'scope-authentication-evidence-'));
  const evidencePath = join(directory, 'evidence.sqlite');
  const db = new DatabaseSync(process.env.SCOPE_AUTHENTICATION_DB, { readOnly: true });
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir];
  let store;
  try {
    store = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
    store.importBatch([...pins].map(([path, sha256]) => ({ identity: `current:${path}`, logicalPath: path,
      kind: 'archive', revision: 'test-original-source', sha256, bytes: originals.get(path), references: [] })));
    store.close();
    store = openEvidenceStore(evidencePath, { capability: INTERNAL_EVIDENCE_CAPABILITY });
    const bindings = new Map([...pins].map(([path, sha256]) => [path, { identity: `current:${path}`, sha256 }]));
    const reader = scopeAuthenticationReader({ db, evidenceStore: store, root, bindings, currentSourceHashes: pins });
    const deny = () => { throw Error('authentication filesystem fallback forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = deny;
    syncBuiltinESMExports();
    for (const [path] of pins) assert.deepEqual(await reader(root + '/' + path), originals.get(path));
    const changed = { prepare(sql) {
      const statement = db.prepare(sql);
      if (sql === 'SELECT * FROM editorial_example_document') return { all: () => statement.all().map(row => ({ ...row, application: 'changed' })) };
      return statement;
    } };
    const changedReader = scopeAuthenticationReader({ db: changed, evidenceStore: store, root, bindings, currentSourceHashes: pins });
    await assert.rejects(changedReader(root + '/' + logicalPath), /E_EDITORIAL_EXAMPLE_DOCUMENT/u);
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir] = saved;
    syncBuiltinESMExports(); store?.close(); db.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
});
test('exact authenticated bytes require independent complete typed current parity', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    initializeEditorialExampleDocument(db, { sourceBytes: bytes, expectedSourceHash: EDITORIAL_EXAMPLE_SOURCE_HASH,
      actor: 'test', reason: 'current typed boundary' });
    const receipt = Buffer.from('historical receipt only');
    const receiptHash = createHash('sha256').update(receipt).digest('hex');
    const evidenceStore = { getEvidence(identity, pin) {
      if (identity === 'current' && pin === EDITORIAL_EXAMPLE_SOURCE_HASH) return bytes;
      if (identity === 'receipt' && pin === receiptHash) return receipt;
      throw Error('wrong evidence identity');
    } };
    const options = { db, evidenceStore, root, bindings: new Map([
      [logicalPath, { identity: 'current', sha256: EDITORIAL_EXAMPLE_SOURCE_HASH }],
      ['review.txt', { identity: 'receipt', sha256: receiptHash }],
    ]), currentSourceHashes: new Map([[logicalPath, EDITORIAL_EXAMPLE_SOURCE_HASH]]),
      externalBindings: new Map([['/external/pinned-review.txt', { identity: 'receipt', sha256: receiptHash }]]),
      missingPaths: new Set(['optional.json']) };
    const reader = scopeAuthenticationReader(options);
    assert.deepEqual(await reader(root + '/' + logicalPath), bytes);
    assert.deepEqual(await reader(root + '/review.txt'), receipt);
    assert.deepEqual(await reader('/external/pinned-review.txt'), receipt);
    const unsupportedPath = 'lore/unsupported-current.json';
    const unsupportedBytes = Buffer.from('{"status":"approved"}');
    const unsupportedHash = createHash('sha256').update(unsupportedBytes).digest('hex');
    const unsupported = scopeAuthenticationReader({ ...options,
      evidenceStore: { getEvidence() { return unsupportedBytes; } },
      bindings: new Map([[unsupportedPath, { identity: 'unsupported', sha256: unsupportedHash }]]),
      currentSourceHashes: new Map([[unsupportedPath, unsupportedHash]]),
      db: { prepare() { return { all: () => [] }; } },
    });
    await assert.rejects(unsupported(root + '/' + unsupportedPath), /E_MAPPING_TYPED_SOURCE_UNSUPPORTED/u);
    await assert.rejects(reader(root + '/optional.json'), { code: 'ENOENT' });
    await assert.rejects(reader('/external/not-pinned.txt'), /E_EVIDENCE_READER_PATH/u);
    db.exec("UPDATE editorial_example_document SET application='changed'");
    await assert.rejects(reader(root + '/' + logicalPath), /E_EDITORIAL_EXAMPLE_DOCUMENT/u);
    await assert.rejects(reader(root + '/unknown.json'), /E_EVIDENCE_READER_MISSING/u);
    const wrong = scopeAuthenticationReader({ ...options,
      currentSourceHashes: new Map([[logicalPath, '0'.repeat(64)]]) });
    await assert.rejects(wrong(root + '/' + logicalPath), /E_SCOPE_AUTHENTICATION_SOURCE_PIN/u);
    const empty = new DatabaseSync(':memory:');
    const missing = scopeAuthenticationReader({ ...options, db: empty });
    try { await assert.rejects(missing(root + '/' + logicalPath), /no such table/u); }
    finally { empty.close(); }
  } finally { db.close(); }
});
