import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { discoverScopeDocuments, loadScopeInput, requireSeoulPublication } from '../check-seoul-scope.mjs';
import { requireGenerationPublication } from '../generate-release.mjs';
import { sha256 } from '../seoul-scope.mjs';

const root = '/sealed-scope-input-reader';

test('production publication boundaries require complete database inputs and never retry failed readers', async () => {
  const failure = new Error('production sealed source missing');
  let calls = 0;
  const inputs = { db: {}, baselinePath: root + '/baseline.json',
    readBytes: async () => { calls++; throw failure; }, readDirectory: async () => [] };
  for (const requirePublication of [requireSeoulPublication, requireGenerationPublication]) {
    for (const key of Object.keys(inputs)) {
      const incomplete = { ...inputs }; delete incomplete[key];
      await assert.rejects(requirePublication(root, incomplete), { code: 'E_SCOPE_DATABASE_INPUT' });
    }
    await assert.rejects(requirePublication(root, inputs), error => error === failure);
  }
  assert.equal(calls, 2);
});

test('storage discovery includes unadmitted documents independently of known source paths', async () => {
  const entry = (name, directory = false) => ({ name, isDirectory: () => directory, isFile: () => !directory });
  const inventory = new Map([
    ['lore', [entry('known.json'), entry('new.json'), entry('editorial', true)]],
    ['lore/editorial', [entry('Seoul-Scope-Contract.json'), entry('unexpected.json')]],
    ['docs', [entry('private.md')]], ['scripts/data', []], ['snapshots/build-inputs', []],
    ['vendor/issued-history', [entry('sealed.json')]],
  ].map(([path, entries]) => [resolve(root, path), entries]));
  const calls = [];
  const documents = ['lore/known.json'];
  await discoverScopeDocuments(root, documents, async (path, options) => {
    calls.push(path);
    assert.deepEqual(options, { withFileTypes: true });
    assert.ok(inventory.has(path));
    return inventory.get(path);
  });
  assert.deepEqual(documents, ['lore/known.json', 'lore/new.json', 'lore/editorial/unexpected.json',
    'docs/private.md', 'vendor/issued-history/sealed.json']);
  assert.deepEqual(new Set(calls), new Set(inventory.keys()));
});

test('storage discovery failure cannot fall back to a contract list or filesystem', async () => {
  const failure = new Error('independent inventory missing');
  let calls = 0;
  await assert.rejects(discoverScopeDocuments(root, [], async () => { calls++; throw failure; }), error => error === failure);
  assert.equal(calls, 1);
});

test('scope fixture reads baseline, contract, sources and archive hashes through its supplied reader', async () => {
  const source = Buffer.from('{"id":"source"}\n');
  const archive = Buffer.from('immutable historical archive');
  const baseline = { files: [{ path: 'lore/source.json', kind: 'authored-lore' }],
    archives: { sealed: { path: 'archive.bin' } } };
  const baselineBytes = Buffer.from(JSON.stringify(baseline));
  const contract = { schema: 'test-contract' };
  const files = new Map([
    ['baseline.json', baselineBytes],
    ['lore/editorial/Seoul-Scope-Contract.json', Buffer.from(JSON.stringify(contract))],
    ['scope-input.json', Buffer.from('{"refs":[]}')],
    ['lore/source.json', source],
    ['archive.bin', archive],
  ].map(([path, bytes]) => [resolve(root, path), bytes]));
  const calls = [];
  const readBytes = async path => {
    calls.push(path);
    assert.ok(files.has(path), path);
    return files.get(path);
  };
  const result = await loadScopeInput({ root, baselinePath: resolve(root, 'baseline.json'), fixture: true, readBytes });
  assert.deepEqual(result, { refs: [], baseline, baselineSha256: sha256(baselineBytes), contract,
    archiveHashes: { sealed: sha256(archive) }, sourceHashes: { 'lore/source.json': sha256(source) } });
  assert.deepEqual(new Set(calls), new Set(files.keys()));
});

test('scope reader failure is propagated without a filesystem retry', async () => {
  const failure = new Error('sealed reader missing binding');
  let calls = 0;
  await assert.rejects(loadScopeInput({ root, baselinePath: resolve(root, 'baseline.json'), fixture: true,
    readBytes: async () => { calls++; throw failure; } }), error => error === failure);
  assert.equal(calls, 1);
});

test('real scope station validation uses the supplied reader before any other source', async () => {
  const failure = new Error('station binding missing');
  const calls = [];
  await assert.rejects(loadScopeInput({ root, baselinePath: resolve(root, 'baseline.json'),
    readBytes: async path => { calls.push(path); throw failure; } }), error => error === failure);
  assert.deepEqual(calls, [resolve(root, 'lore/places/Seoul-Station-Catalog.json')]);
});
