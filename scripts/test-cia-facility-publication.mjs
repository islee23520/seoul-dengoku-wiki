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
import { correctCiaFacilityFootprint, authenticateCiaFacilityCorrection, CIA_FACILITY_DECISION } from './cia-facility-only-correction.mjs';
import { projectCiaFacilityHoldings, projectCiaFacilityRegions, projectCiaFacilityRegionDocuments,
  projectCiaFacilityPersonDetails } from './cia-facility-publication.mjs';
import { projectPersonHoldings } from './person-detail-production.mjs';
import { CIA_FACILITY_OWNER_BYTES } from './cia-facility-projection-input.mjs';

const read = path => archived(path);
const predecessorBytes = Object.fromEntries(Object.entries({ allocation: 'lore/relations/opening-feudal-allocation.json',
  holdings: 'lore/relations/personal-holdings.json', district: 'lore/regions/content/11170.json' })
  .map(([key, path]) => [key, read(path)]));
const original = Object.fromEntries(Object.entries(predecessorBytes).map(([key, bytes]) => [key, JSON.parse(bytes)]));
const candidate = correctCiaFacilityFootprint({ ...original, decisionRef: CIA_FACILITY_DECISION });
const proof = authenticateCiaFacilityCorrection({ predecessorBytes,
  decisionBytes: CIA_FACILITY_OWNER_BYTES,
  current: Object.fromEntries(Object.keys(original).map(key => [key, candidate[key]])) });
// Keep the authenticated predecessor fixture independent of regenerated output.
const holdings = { ...original.holdings,
  holdings: [...original.holdings.holdings, ...original.allocation.grants],
  titles: original.allocation.titles,
  summary: { existingHoldings: 25, newGrants: 31, holdings: 56, titles: 42,
    existingTitleBindings: 7, heldSeoulRegions: 427, heldOutsideUnits: 0,
    heldComponents: 0, unassignedComponents: 0, coveredEntitlements: 427 },
};
const affected = ['region:1117051000', 'region:1117052000', 'region:1117066000'];

test('authenticated predecessor holdings and producer details lose only the approved title and grant', () => {
  const before = structuredClone(holdings);
  const details = [{ characterId: 'K194', ...projectPersonHoldings(holdings, 'K194', new Map(), []) },
    { characterId: 'K001', confirmedHoldings: holdings.holdings.filter(row => row.holderPersonId === 'K001') }];
  const detailBefore = structuredClone(details);
  const next = projectCiaFacilityHoldings(holdings, proof);
  assert.deepEqual(next, { ...holdings, holdings: holdings.holdings.filter(row => row.id !== 'holding:opening-duchy-s08-demesne'),
    titles: holdings.titles.filter(row => row.id !== 'title:duchy-s08'),
    summary: { ...holdings.summary, newGrants: 30, holdings: 55, titles: 41, heldSeoulRegions: 424, coveredEntitlements: 424 } });
  const projected = projectCiaFacilityPersonDetails(details, holdings, proof);
  assert.deepEqual(projected[0], { characterId: 'K194', ...projectPersonHoldings(next, 'K194', new Map(), []) });
  assert.equal(projected[1], details[1]);
  assert.deepEqual(projected.map(row => row.characterId), details.map(row => row.characterId));
  assert.deepEqual(holdings, before);
  assert.deepEqual(details, detailBefore);
  assert.throws(() => projectCiaFacilityHoldings(holdings, structuredClone(proof)), /E_CIA_FACILITY_PUBLICATION/u);
  for (const mutate of [
    value => { value.holdings.find(row => row.id === 'holding:capital-s08').holderPersonId = 'K001'; },
    value => { value.titles[0].parentTitleId = 'title:duchy-s08'; },
    value => { value.holdings.push({ id: 'extra', stateId: 'S08' }); },
  ]) {
    const changed = structuredClone(holdings); mutate(changed);
    assert.throws(() => projectCiaFacilityHoldings(changed, proof), /E_CIA_FACILITY_PUBLICATION/u);
  }
  const wrong = structuredClone(details);
  wrong[1].confirmedHoldings.push(holdings.holdings.find(row => row.id === 'holding:opening-duchy-s08-demesne'));
  assert.throws(() => projectCiaFacilityPersonDetails(wrong, holdings, proof), /E_CIA_FACILITY_PUBLICATION/u);
});

test('three region documents clear holders and stale authority as unassigned, preserving all other content', () => {
  const district = structuredClone(original.district);
  for (const row of district.regions.filter(row => affected.includes(row.region_id))) row.content.territory.authority = 'S08';
  const before = structuredClone(district);
  const contents = new Map(district.regions.map(row => [row.region_id, row.content]));
  const projected = projectCiaFacilityRegions(contents, proof);
  const [document] = projectCiaFacilityRegionDocuments([district], proof);
  for (const row of district.regions) {
    const next = projected.get(row.region_id);
    assert.deepEqual(document.regions.find(value => value.region_id === row.region_id).content, next);
    if (!affected.includes(row.region_id)) assert.equal(next, row.content);
    else {
      const { authority, ...territory } = row.content.territory;
      assert.deepEqual(next, { ...row.content, territory: { ...territory, holders: [], status: 'unassigned' } });
      assert.equal(Object.hasOwn(next.territory, 'authority'), false);
      assert.notEqual(next.territory.status, 'vacant');
    }
  }
  assert.deepEqual(district, before);
  contents.get(affected[0]).territory.holders.push({ polity: 'S01' });
  assert.throws(() => projectCiaFacilityRegions(contents, proof), /E_CIA_FACILITY_PUBLICATION/u);
});
