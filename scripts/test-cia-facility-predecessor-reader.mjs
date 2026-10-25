import { readSourceArchive } from './cast-sqlite/source-archive.mjs';
import { readPrivateSourceArchive } from './document-store/private-source-archive.mjs';
const archivePins = { allocation: '21d7663507b896a43d70fc459f662376780b477b5c2078af100b2d42bbe7079d', holdings: '1801d7bb8d27af743f74ea447d4f7be782b9d8ba7ba5b37af4d0c6f2b6329a12', district: '4d4372a151ea3b5b3750f4209009850786878a9a1b0f03d6263b82f713be39e3', contract: '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8' };
const archived = path => {
  const key = Object.entries({ allocation: 'lore/relations/opening-feudal-allocation.json', holdings: 'lore/relations/personal-holdings.json', district: 'lore/regions/content/11170.json', contract: 'lore/editorial/Seoul-Scope-Contract.json' }).find(([, logicalPath]) => logicalPath === path)?.[0];
  return key === 'contract' ? readPrivateSourceArchive(new URL('../', import.meta.url).pathname, path, archivePins[key]) : readSourceArchive(path, archivePins[key]);
};
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'vitest';
import { CIA_FACILITY_DECISION, correctCiaFacilityFootprint,
  authenticateCiaFacilityCorrection, materializeCiaFacilityContract } from './cia-facility-only-correction.mjs';
import { CIA_FACILITY_SOURCES, CIA_FACILITY_OWNER_PATH, ciaFacilityPredecessorReader } from './cia-facility-predecessor-reader.mjs';
import { CIA_FACILITY_OWNER_BYTES } from './cia-facility-projection-input.mjs';

const root = resolve(import.meta.dirname, '..');
const before = Object.fromEntries(Object.entries(CIA_FACILITY_SOURCES)
  .map(([key, path]) => [key, archived(path)]));
const decisionBytes = CIA_FACILITY_OWNER_BYTES;
const candidate = correctCiaFacilityFootprint({ decisionRef: CIA_FACILITY_DECISION,
  ...Object.fromEntries(['allocation', 'holdings', 'district'].map(key => [key, JSON.parse(before[key])])) });
const current = Object.fromEntries(['allocation', 'holdings', 'district'].map(key => [key, candidate[key]]));
const proof = authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes: before, current });
const after = { ...Object.fromEntries(Object.entries(current).map(([key, value]) => [key, Buffer.from(JSON.stringify(value))])),
  contract: Buffer.from(JSON.stringify(materializeCiaFacilityContract(JSON.parse(before.contract), proof))) };
function readers(bytes) {
  const sealedCalls = [];
  const lookup = (values, path) => {
    const key = Object.keys(CIA_FACILITY_SOURCES).find(key => resolve(root, CIA_FACILITY_SOURCES[key]) === resolve(path));
    if (!key) throw Error('unexpected path: ' + path);
    return values[key];
  };
  const readCurrent = async path => resolve(path) === resolve(root, CIA_FACILITY_OWNER_PATH) ? decisionBytes : lookup(bytes, path);
  readCurrent.readHistorical = async () => Buffer.from('history');
  readCurrent.appliedDiskOverrides = new Map([['existing', 'unchanged']]);
  return { readCurrent, readPredecessor: async path => { sealedCalls.push(path); return lookup(before, path); }, sealedCalls };
}

test('unchanged predecessor does not access sealed evidence or mint a successor', async () => {
  const inputs = readers(before);
  const result = await ciaFacilityPredecessorReader({ root, ...inputs });
  assert.equal(result.reader, inputs.readCurrent);
  assert.equal(result.successor, null);
  assert.equal(inputs.sealedCalls.length, 0);
});

test('complete facility successor replays exact prior bytes and preserves historical reader bindings', async () => {
  const inputs = readers(after);
  const result = await ciaFacilityPredecessorReader({ root, ...inputs });
  assert.equal(result.successor.files.size, 4);
  for (const [key, path] of Object.entries(CIA_FACILITY_SOURCES)) {
    assert.deepEqual(await result.reader(new URL('../' + path, import.meta.url)), before[key]);
    assert.equal(await result.reader(resolve(root, path), 'utf8'), before[key].toString());
  }
  assert.equal(result.reader.readHistorical, inputs.readCurrent.readHistorical);
  assert.deepEqual(result.reader.appliedDiskOverrides, inputs.readCurrent.appliedDiskOverrides);
  assert.notEqual(result.reader.appliedDiskOverrides, inputs.readCurrent.appliedDiskOverrides);
});

test('partial application, unrelated scope edits, changed archives and current read failures reject', async () => {
  for (const key of ['allocation', 'district', 'contract'])
    await assert.rejects(ciaFacilityPredecessorReader({ root, ...readers({ ...after, [key]: before[key] }) }));
  const contract = JSON.parse(after.contract);
  contract.entities[0].basis = 'unapproved change';
  await assert.rejects(ciaFacilityPredecessorReader({ root,
    ...readers({ ...after, contract: Buffer.from(JSON.stringify(contract)) }) }), /E_CIA_FACILITY_SUCCESSOR/u);
  const inputs = readers(after);
  await assert.rejects(ciaFacilityPredecessorReader({ root, ...inputs,
    readPredecessor: async () => Buffer.from('{}') }), /E_CIA_FACILITY_SUCCESSOR/u);
  await assert.rejects(ciaFacilityPredecessorReader({ root, ...inputs,
    readCurrent: async () => { throw Error('current source unavailable'); } }), /current source unavailable/u);
  assert.equal(inputs.sealedCalls.length, 0);
});
