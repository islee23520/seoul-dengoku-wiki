import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { openReadOnly } from './db.mjs';
import { readDocument } from './document-read.mjs';
import { createInkosAdapterFixture } from './inkos-adapter-fixture.mjs';
import { LIMITS, parseStrictJson, parseCandidate, validateCandidate, validateSelection, validateSourcePacket,
  validateHostManifest, canonicalJson, digestJson, sha256Bytes, newPacketId } from '../inkos-adapter/contracts.mjs';

const packetId = '12345678-1234-4234-8234-123456789abc';
const candidate = () => ({ version: 1, packetId, inputDigest: 'a'.repeat(64), targetKey: 'source-1',
  replacementText: '합성 대체 문단이다.', citations: [{ sourceKey: 'source-1', anchor: 'paragraph' }] });
const error = code => ({ code });

test('strict bounded JSON preserves bytes meaning and rejects ambiguous/malformed data', () => {
  assert.deepEqual(parseStrictJson('{"a":[true,null,-1.2e3,"x"]}'), { a: [true, null, -1200, 'x'] });
  for (const input of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"x":{"a":1,"a":2}}']) {
    assert.throws(() => parseStrictJson(input), error('E_ADAPTER_DUPLICATE_KEY'));
  }
  for (const input of ['', '\ufeff{}', 'null x', '[1,]', '{"a":}', '01', '1e999', '"\n"', '{"a":1,}', Buffer.from([0xff])]) {
    assert.throws(() => parseStrictJson(input), error('E_ADAPTER_JSON'));
  }
  assert.equal(Object.hasOwn(parseStrictJson('{"__proto__":1}'), '__proto__'), true);
  assert.throws(() => parseStrictJson(' '.repeat(LIMITS.fileBytes + 1)), error('E_ADAPTER_LIMIT'));
  assert.throws(() => parseStrictJson('['.repeat(40) + '0' + ']'.repeat(40)), error('E_ADAPTER_LIMIT'));
});

test('candidate exact recursive schema rejects authority, paths, forged identity and digest shape', () => {
  assert.deepEqual(parseCandidate(JSON.stringify(candidate())), candidate());
  for (const field of ['approved', 'approval', 'command', 'path', 'documentId', 'revision', '__proto__']) {
    const c = candidate(); Object.defineProperty(c, field, { value: true, enumerable: true });
    assert.throws(() => parseCandidate(JSON.stringify(c)), error('E_ADAPTER_SCHEMA'));
  }
  for (const mutate of [c => { c.citations[0].approved = true; }, c => { delete c.packetId; },
    c => { c.inputDigest = 'stale'; }, c => { c.inputDigest = 'A'.repeat(64); }, c => { c.targetKey = '../path'; },
    c => { c.replacementText = ' '; }, c => { c.replacementText = '\ud800'; }, c => { c.version = 2; }]) {
    const c = candidate(); mutate(c); assert.throws(() => parseCandidate(JSON.stringify(c)), error('E_ADAPTER_SCHEMA'));
  }
  const c = candidate(); c.replacementText = 'x'.repeat(LIMITS.replacementBytes); assert.equal(validateCandidate(c), c);
  c.replacementText += 'x'; assert.throws(() => validateCandidate(c), error('E_ADAPTER_LIMIT'));
  c.replacementText = '한'.repeat(22000); assert.throws(() => validateCandidate(c), error('E_ADAPTER_LIMIT'));
  c.replacementText = 'text'; c.citations = Array.from({ length: 65 }, () => ({ sourceKey: 'source-1', anchor: 'paragraph' }));
  assert.throws(() => validateCandidate(c), error('E_ADAPTER_LIMIT'));
  assert.match(newPacketId(), /^[a-f0-9-]{36}$/u);
});

test('canonical object digest differs from exact UTF-8 bytes digest', () => {
  assert.equal(canonicalJson({ z: 1, a: { b: 2, a: '한' } }), '{"a":{"a":"한","b":2},"z":1}');
  assert.equal(digestJson({ a: 1, b: 2 }), digestJson({ b: 2, a: 1 }));
  assert.notEqual(sha256Bytes('{"a":1}'), sha256Bytes('{ "a": 1 }'));
  assert.notEqual(digestJson(['a', 'b']), digestJson(['b', 'a']));
  assert.throws(() => canonicalJson({ a: undefined }), error('E_ADAPTER_SCHEMA'));
  assert.equal(digestJson(Object.assign(Object.create(null), { a: 1 })), digestJson({ a: 1 }));
  assert.throws(() => digestJson(Object.create({ inherited: true })), error('E_ADAPTER_SCHEMA'));
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    for (const prototype of [null, Object.prototype]) {
      const record = Object.create(prototype);
      Object.defineProperty(record, key, { value: 'forged', enumerable: true });
      assert.throws(() => digestJson({ nested: record }), error('E_ADAPTER_SCHEMA'));
    }
  }
  let invoked = false;
  assert.throws(() => digestJson({ get value() { invoked = true; return 1; } }), error('E_ADAPTER_SCHEMA'));
  assert.equal(invoked, false);
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => digestJson(cycle), error('E_ADAPTER_LIMIT'));
});

test('canonical descriptors reject hidden fields, getters and altered arrays without getter execution', () => {
  let calls = 0;
  const reject = value => {
    assert.throws(() => canonicalJson({ nested: value }), error('E_ADAPTER_SCHEMA'));
    assert.equal(calls, 0);
  };
  for (const prototype of [Object.prototype, null]) {
    for (const enumerable of [false, true]) {
      for (const key of ['__proto__', 'constructor', 'prototype']) {
        const record = Object.create(prototype);
        Object.defineProperty(record, key, { value: 'forged', enumerable });
        reject(record);
      }
      const record = Object.create(prototype);
      Object.defineProperty(record, 'value', { get() { calls++; return 1; }, enumerable });
      reject(record);
      const array = [];
      Object.defineProperty(array, '0', { get() { calls++; return 1; }, enumerable });
      reject(array);
    }
    const hidden = Object.create(prototype);
    Object.defineProperty(hidden, 'hidden', { value: 1 });
    assert.equal(canonicalJson(hidden), '{}');
  }
  for (const prototype of [null, Object.create(Array.prototype), Object.prototype]) {
    const array = [1]; Object.setPrototypeOf(array, prototype); reject(array);
  }
  for (const enumerable of [false, true]) {
    for (const key of ['extra', '__proto__', 'constructor', 'prototype', Symbol('hidden')]) {
      const array = [1]; Object.defineProperty(array, key, { value: 2, enumerable }); reject(array);
      const accessor = [1]; Object.defineProperty(accessor, key, { get() { calls++; return 2; }, enumerable }); reject(accessor);
    }
  }
  const hiddenIndex = [1]; Object.defineProperty(hiddenIndex, '0', { enumerable: false }); reject(hiddenIndex);
  const symbolRecord = {}; symbolRecord[Symbol('extra')] = 1; reject(symbolRecord);
  reject(new Array(2));
  const lateAccessor = { first: [1] };
  Object.defineProperty(lateAccessor, 'later', { get() { calls++; return 1; } }); reject(lateAccessor);
  assert.equal(canonicalJson(Object.freeze([1, { a: 2 }])), '[1,{"a":2}]');
  assert.equal(canonicalJson([]), '[]');
  assert.equal(calls, 0);
});

for (const authorityVersion of [1, 2]) test(`synthetic typed public fixture and full packet binding: authority v${authorityVersion}`, () => {
  const f = createInkosAdapterFixture({ authorityVersion });
  const directory = f.directory;
  try {
    const before = sha256Bytes(readFileSync(f.dbPath));
    assert.equal(validateSelection(f.selection), f.selection);
    const packet = { version: 1, packetId, targetKey: 'source-1', sources: f.sources.map((s, i) => ({ sourceKey: s.sourceKey,
      excerpts: [{ anchor: 'paragraph', text: f.documents[i].content[0].text.ko }] })) };
    assert.equal(validateSourcePacket(packet), packet);
    const workerBytes = JSON.stringify(packet);
    assert.doesNotMatch(workerBytes, /synthetic-private-receipt-canary|synthetic-unopened|semanticSha256|admissionDigest/u);
    const manifest = { version: 1, packetId, inputDigest: sha256Bytes(workerBytes), authorityId: 'SYN-authority', authorityVersion,
      targetKey: 'source-1', targetAnchor: 'paragraph', sources: f.sources };
    assert.equal(validateHostManifest(manifest), manifest);
    const c = { ...candidate(), inputDigest: manifest.inputDigest };
    assert.deepEqual(parseCandidate(JSON.stringify(c), manifest), c);
    for (const patch of [{ inputDigest: 'c'.repeat(64) }, { targetKey: 'forged' }, { packetId: newPacketId() },
      { citations: [{ sourceKey: 'forged', anchor: 'paragraph' }] }, { citations: [{ sourceKey: 'source-1', anchor: 'wrong' }] }]) {
      assert.throws(() => validateCandidate({ ...c, ...patch }, manifest), error('E_ADAPTER_BINDING'));
    }
    const malformed = structuredClone(manifest); malformed.sources[0].approved = true;
    assert.throws(() => validateHostManifest(malformed), error('E_ADAPTER_SCHEMA'));
    const ro = openReadOnly(f.dbPath);
    try {
      assert.equal(ro.prepare('SELECT version FROM document_authority').get().version, authorityVersion);
      const admissions = ro.prepare('SELECT * FROM document_publication_admission ORDER BY source_id').all();
      assert.equal(admissions.length, f.sources.length);
      for (const [i, row] of admissions.entries()) {
        assert.equal(Object.getPrototypeOf(row), null);
        assert.equal(digestJson(row), f.sources[i].admissionDigest);
        assert.equal(digestJson(row), digestJson({ ...row }));
      }
      for (const [i, d] of f.documents.entries()) {
        const document = readDocument(ro, { corpusKind: 'current', domain: d.domain, documentId: d.id, visibility: 'public' });
        assert.deepEqual(document, d);
        assert.equal(digestJson(document), f.sources[i].semanticSha256);
      }
    } finally { ro.close(); }
    assert.equal(sha256Bytes(readFileSync(f.dbPath)), before);
    const invalid = structuredClone(f.selection); invalid.target.locale = 'en';
    assert.throws(() => validateSelection(invalid), error('E_ADAPTER_SCHEMA'));
    const extra = structuredClone(packet); extra.sources[0].excerpts[0].path = '/host';
    assert.throws(() => validateSourcePacket(extra), error('E_ADAPTER_SCHEMA'));
    const tooMany = structuredClone(packet); tooMany.sources = Array(17).fill(packet.sources[0]);
    assert.throws(() => validateSourcePacket(tooMany), error('E_ADAPTER_LIMIT'));
  } finally { f.cleanup(); }
  assert.equal(existsSync(directory), false);
});
