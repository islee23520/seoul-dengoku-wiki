import assert from 'node:assert/strict';
import test from 'node:test';
import { evidenceReader } from './evidence-reader.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

test('evidence reader requires exact logical path and caller-pinned identity/hash without filesystem fallback', async () => {
  const calls = [];
  const store = { getEvidence(identity, hash) { calls.push([identity, hash]); return Buffer.from('sealed'); } };
  const read = evidenceReader(store, { root: '/authority', bindings: new Map([
    ['.omo/private/review.json', { identity: 'review-identity', sha256: 'a'.repeat(64) }],
  ]) });
  assert.equal((await read('/authority/.omo/private/review.json')).toString(), 'sealed');
  assert.deepEqual(calls, [['review-identity', 'a'.repeat(64)]]);
  await assert.rejects(read('/authority/unknown.json'), /E_EVIDENCE_READER_MISSING/u);
  await assert.rejects(read('/elsewhere/review.json'), /E_EVIDENCE_READER_PATH/u);
  assert.equal(calls.length, 1);
});

test('historical evidence requires the exact revision and path binding', async () => {
  const calls = [];
  const store = { getEvidence(identity, hash) { calls.push([identity, hash]); return Buffer.from('historical'); } };
  const reader = evidenceReader(store, { root: '/authority', bindings: new Map(), historicalBindings: new Map([
    ['fixed-revision:validator.mjs', { identity: 'validator-before', sha256: 'b'.repeat(64) }],
  ]) });
  assert.equal((await reader.readHistorical('fixed-revision', 'validator.mjs')).toString(), 'historical');
  assert.deepEqual(calls, [['validator-before', 'b'.repeat(64)]]);
  await assert.rejects(reader.readHistorical('HEAD', 'validator.mjs'), /E_EVIDENCE_READER_MISSING/u);
  await assert.rejects(reader.readHistorical('fixed-revision', 'other.mjs'), /E_EVIDENCE_READER_MISSING/u);
  await assert.rejects(reader.readHistorical('fixed-revision', 'validator.mjs', '/other-repository'), /E_EVIDENCE_READER_REPOSITORY/u);
  assert.equal(calls.length, 1);
});

test('explicit external evidence and captured absence do not permit filesystem fallback', async () => {
  const calls = [];
  const store = { getEvidence(identity, hash) { calls.push([identity, hash]); return Buffer.from('external'); } };
  const reader = evidenceReader(store, { root: '/authority', bindings: new Map(),
    externalBindings: new Map([['/pinned-external/source.json', { identity: 'external-source', sha256: 'c'.repeat(64) }]]),
    missingPaths: new Set(['optional.json']) });
  assert.equal((await reader('/pinned-external/source.json')).toString(), 'external');
  await assert.rejects(reader('/authority/optional.json'), { code: 'ENOENT' });
  await assert.rejects(reader('/authority/unknown.json'), /E_EVIDENCE_READER_MISSING/u);
  await assert.rejects(reader('/pinned-external/other.json'), /E_EVIDENCE_READER_PATH/u);
  assert.deepEqual(calls, [['external-source', 'c'.repeat(64)]]);
});

test('historical external repositories require an explicit repository-revision-path tuple', async () => {
  const calls = [];
  const reader = evidenceReader({ getEvidence(identity, sha256) { calls.push([identity, sha256]); return Buffer.from('history'); } }, {
    root: '/authority', bindings: new Map(), historicalBindings: new Map([
      [JSON.stringify(['/external-repo', 'fixed', 'source.json']), { identity: 'external-history', sha256: 'd'.repeat(64) }],
    ]),
  });
  assert.equal((await reader.readHistorical('fixed', 'source.json', '/external-repo')).toString(), 'history');
  await assert.rejects(reader.readHistorical('other', 'source.json', '/external-repo'), /E_EVIDENCE_READER_REPOSITORY/u);
  await assert.rejects(reader.readHistorical('fixed', 'other.json', '/external-repo'), /E_EVIDENCE_READER_REPOSITORY/u);
  await assert.rejects(reader.readHistorical('fixed', 'source.json', '/other-repo'), /E_EVIDENCE_READER_REPOSITORY/u);
  assert.deepEqual(calls, [['external-history', 'd'.repeat(64)]]);
});

test('real sealed evidence database returns exact bytes and rejects a changed independent pin', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'evidence-reader-'));
  let store;
  try {
    const path = join(directory, 'private.sqlite');
    const bytes = Buffer.from('{\r\n "approval": "historical-only"\r\n}\n');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    store = openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
    store.importBatch([{ identity: 'sealed-review', logicalPath: '.omo/private/review.json',
      revision: 'captured-1', kind: 'review', bytes, sha256, references: [] }]);
    store.close();
    store = openEvidenceStore(path, { capability: INTERNAL_EVIDENCE_CAPABILITY });
    const read = evidenceReader(store, { root: '/not-on-filesystem', bindings: new Map([
      ['.omo/private/review.json', { identity: 'sealed-review', sha256 }],
    ]) });
    assert.deepEqual(await read('/not-on-filesystem/.omo/private/review.json'), bytes);
    const wrong = evidenceReader(store, { root: '/not-on-filesystem', bindings: new Map([
      ['.omo/private/review.json', { identity: 'sealed-review', sha256: '0'.repeat(64) }],
    ]) });
    await assert.rejects(wrong('/not-on-filesystem/.omo/private/review.json'), { code: 'E_SHA_MISMATCH' });
  } finally { store?.close(); rmSync(directory, { recursive: true, force: true }); }
});
