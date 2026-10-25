import { readSourceArchive } from './cast-sqlite/source-archive.mjs';
import { readPrivateSourceArchive } from './document-store/private-source-archive.mjs';
const archivePins = { allocation: '21d7663507b896a43d70fc459f662376780b477b5c2078af100b2d42bbe7079d', holdings: '1801d7bb8d27af743f74ea447d4f7be782b9d8ba7ba5b37af4d0c6f2b6329a12', district: '4d4372a151ea3b5b3750f4209009850786878a9a1b0f03d6263b82f713be39e3', contract: '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8' };
const archived = path => {
  const key = Object.entries({ allocation: 'lore/relations/opening-feudal-allocation.json', holdings: 'lore/relations/personal-holdings.json', district: 'lore/regions/content/11170.json', contract: 'lore/editorial/Seoul-Scope-Contract.json' }).find(([, logicalPath]) => logicalPath === path)?.[0];
  return key === 'contract' ? readPrivateSourceArchive(new URL('../', import.meta.url).pathname, path, archivePins[key]) : readSourceArchive(path, archivePins[key]);
};
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { CIA_FACILITY_DECISION, correctCiaFacilityFootprint, authenticateCiaFacilityCorrection,
  isAuthenticatedCiaFacilityCorrection, materializeCiaFacilityContract } from './cia-facility-only-correction.mjs';
import { CIA_FACILITY_OWNER_BYTES } from './cia-facility-projection-input.mjs';
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs';
import { queryPerson } from './cast-sqlite/query.mjs';

const json = path => JSON.parse(archived(path));
const original = {
  allocation: json('lore/relations/opening-feudal-allocation.json'),
  holdings: json('lore/relations/personal-holdings.json'),
  district: json('lore/regions/content/11170.json'),
  decisionRef: CIA_FACILITY_DECISION,
};

test('persisted current rights exclude the retired duchy while predecessor domains remain available', () => {
  const allocation = readCanonicalDocument('lore/relations/opening-feudal-allocation.json');
  assert.deepEqual(allocation.titles.filter(row => row.stateId === 'S08'), []);
  assert.deepEqual(allocation.grants.filter(row => row.stateId === 'S08'), []);
  const district = readCanonicalDocument('lore/regions/content/11170.json');
  for (const id of ['region:1117051000', 'region:1117052000', 'region:1117066000']) {
    const territory = district.regions.find(row => row.region_id === id).content.territory;
    assert.equal(territory.status, 'unassigned');
    assert.deepEqual(territory.holders, []);
  }
  const person = queryPerson({ dbPath: new URL('../data/canonical/wiki-cast.sqlite', import.meta.url).pathname, id: 'K194' });
  assert.deepEqual(person.current.context.titles, []);
  assert.deepEqual(person.current.context.grants, []);
  assert.equal(person.current.holdings.find(row => row.holding_id === 'holding:capital-s08').holder_person_id, 'K194');
  assert.equal(original.allocation.titles.filter(row => row.id === 'title:duchy-s08').length, 1);
});

test('owner decision authenticates only exact predecessor bytes and the complete facility-only successor', () => {
  const decisionBytes = CIA_FACILITY_OWNER_BYTES;
  const predecessorBytes = Object.fromEntries([
    ['allocation', 'lore/relations/opening-feudal-allocation.json'],
    ['holdings', 'lore/relations/personal-holdings.json'], ['district', 'lore/regions/content/11170.json'],
  ].map(([key, path]) => [key, archived(path)]));
  const candidate = correctCiaFacilityFootprint(original);
  const current = Object.fromEntries(Object.keys(predecessorBytes).map(key => [key, candidate[key]]));
  const proof = authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes, current });
  assert.equal(isAuthenticatedCiaFacilityCorrection(proof), true);
  assert.equal(isAuthenticatedCiaFacilityCorrection(structuredClone(proof)), false);
  const contract = json('lore/editorial/Seoul-Scope-Contract.json');
  const beforeContract = structuredClone(contract);
  const corrected = materializeCiaFacilityContract(contract, proof);
  assert.deepEqual(contract, beforeContract);
  const retiredIds = new Set(['title:duchy-s08', 'holding:opening-duchy-s08-demesne']);
  for (const key of ['entities', 'dispositions']) {
    assert.equal(corrected[key].length, contract[key].length);
    assert.deepEqual(corrected[key].map(row => row.id), contract[key].map(row => row.id));
    for (const [index, row] of corrected[key].entries()) {
      if (!retiredIds.has(row.id)) assert.deepEqual(row, contract[key][index]);
      else {
        assert.equal(row.status, 'retired');
        assert.equal(row.batchId, 'cia-facility-only-20261021');
        assert.equal(row.basis, CIA_FACILITY_DECISION);
        assert.deepEqual(key === 'entities' ? row.jurisdictionRefs : row.targetIds, []);
      }
    }
  }
  for (const key of Object.keys(contract).filter(key => !['entities', 'dispositions'].includes(key)))
    assert.deepEqual(corrected[key], contract[key]);
  assert.throws(() => materializeCiaFacilityContract(contract, structuredClone(proof)), /E_CIA_FACILITY_CORRECTION/u);
  const changedContract = structuredClone(contract);
  changedContract.dispositions.find(row => row.id === 'title:duchy-s08').targetIds.push('unrelated-right');
  assert.throws(() => materializeCiaFacilityContract(changedContract, proof), /E_CIA_FACILITY_CORRECTION/u);
  assert.throws(() => materializeCiaFacilityContract(corrected, proof), /E_CIA_FACILITY_CORRECTION/u);
  assert.throws(() => authenticateCiaFacilityCorrection({ decisionBytes: Buffer.concat([decisionBytes, Buffer.from(' ')]), predecessorBytes, current }), /E_CIA_FACILITY_CORRECTION/u);
  assert.throws(() => authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes: { ...predecessorBytes, allocation: Buffer.from('{}') }, current }), /E_CIA_FACILITY_CORRECTION/u);
  const expanded = structuredClone(current);
  expanded.district.regions[0].content.territory = { status: 'held', holders: [{ polity: 'S07', control: 100 }] };
  assert.throws(() => authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes, current: expanded }), /E_CIA_FACILITY_CORRECTION/u);
});

test('facility-only correction retires exactly two area rights and preserves the tower and other owners', () => {
  const before = structuredClone(original);
  const result = correctCiaFacilityFootprint(original);
  assert.deepEqual(original, before);
  assert.deepEqual(result.holdings, original.holdings);
  assert.deepEqual(result.allocation, { ...original.allocation,
    titles: original.allocation.titles.filter(row => row.id !== 'title:duchy-s08'),
    grants: original.allocation.grants.filter(row => row.id !== 'holding:opening-duchy-s08-demesne') });
  const targets = new Set(['region:1117051000', 'region:1117052000', 'region:1117066000']);
  for (const row of result.district.regions) {
    const previous = original.district.regions.find(item => item.region_id === row.region_id);
    if (!targets.has(row.region_id)) assert.deepEqual(row, previous);
    else assert.deepEqual(row, { ...previous, content: { ...previous.content,
      territory: { ...previous.content.territory, status: 'unassigned', holders: [] } } });
  }
  assert.deepEqual(result.retired, { titles: ['title:duchy-s08'], grants: ['holding:opening-duchy-s08-demesne'] });
});

test('changed rights, different approval and dependent titles reject instead of expanding owner scope', () => {
  const mutations = [
    input => { input.decisionRef = 'unapproved'; },
    input => { input.allocation.titles.find(row => row.id === 'title:duchy-s08').holderPersonId = 'K001'; },
    input => { input.holdings.holdings.find(row => row.id === 'holding:capital-s08').adminRefs.push({ id: 'whole-dong' }); },
    input => { input.district.regions[0].content.territory.holders.push({ polity: 'S07', control: 1 }); },
    input => { input.allocation.titles[0].parentTitleId = 'title:duchy-s08'; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(original); mutate(changed);
    const before = structuredClone(changed);
    assert.throws(() => correctCiaFacilityFootprint(changed), { code: 'E_CIA_FACILITY_CORRECTION' });
    assert.deepEqual(changed, before);
  }
});
