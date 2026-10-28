import { isDeepStrictEqual } from 'node:util';

export const CIA_FACILITY_DECISION = 'question:call_lz2AvYKA2N5Phnhe8HovtFwY';
const regions = ['region:1117051000', 'region:1117052000', 'region:1117066000'];
const titleId = 'title:duchy-s08';
const grantId = 'holding:opening-duchy-s08-demesne';
const fail = () => { throw Object.assign(new Error('E_CIA_FACILITY_CORRECTION'), { code: 'E_CIA_FACILITY_CORRECTION' }); };
const sourceKeys = ['allocation', 'holdings', 'district'];
const authenticated = new WeakSet();

// Checks that the corrected value is the facility correction of the given predecessors.
export function authenticateCiaFacilityCorrection({ predecessorBytes, current }) {
  const before = {};
  for (const key of sourceKeys) {
    const bytes = predecessorBytes?.[key];
    if (!(bytes instanceof Uint8Array)) fail();
    before[key] = JSON.parse(Buffer.from(bytes));
  }
  const expected = correctCiaFacilityFootprint({ ...before, decisionRef: CIA_FACILITY_DECISION });
  if (!current || Object.keys(current).length !== 3
    || sourceKeys.some(key => !isDeepStrictEqual(current[key], expected[key]))) fail();
  const result = Object.freeze({ decisionRef: CIA_FACILITY_DECISION,
    retiredTitleId: titleId, retiredGrantId: grantId, preservedHoldingId: 'holding:capital-s08' });
  authenticated.add(result);
  return result;
}

export const isAuthenticatedCiaFacilityCorrection = result => authenticated.has(result);

// Candidate contract only. Keep original identities in the census denominator;
// runtime acceptance still requires the separate successor integration.
export function materializeCiaFacilityContract(contract, proof) {
  if (!authenticated.has(proof)) fail();
  const targets = [
    { kind: 'title', set: 'titles', id: titleId },
    { kind: 'holding', set: 'grants', id: grantId },
  ];
  for (const target of targets) {
    const entities = contract.entities.filter(row => row.kind === target.kind && row.id === target.id);
    const dispositions = contract.dispositions.filter(row => row.set === target.set && row.id === target.id);
    if (entities.length !== 1 || dispositions.length !== 1) fail();
    const entity = entities[0], disposition = dispositions[0];
    if (entity.status !== 'active' || entity.sourcePath !== 'lore/relations/opening-feudal-allocation.json'
      || entity.batchId !== 'publication-activation-1194' || entity.locationRefs.length !== 0
      || !isDeepStrictEqual(entity.jurisdictionRefs, regions)
      || disposition.status !== 'active' || disposition.batchId !== 'publication-activation-1194'
      || !isDeepStrictEqual(disposition.targetIds, [target.id])) fail();
  }
  const result = structuredClone(contract);
  for (const target of targets) {
    const entity = result.entities.find(row => row.kind === target.kind && row.id === target.id);
    const disposition = result.dispositions.find(row => row.set === target.set && row.id === target.id);
    const retirement = { status: 'retired', batchId: 'cia-facility-only-20261021', basis: CIA_FACILITY_DECISION };
    Object.assign(entity, retirement, { jurisdictionRefs: [] });
    Object.assign(disposition, retirement, { targetIds: [] });
  }
  return result;
}

// Candidate transformation only. The caller must apply the authenticated source
// successor and regenerate dependent projections; this does not mint review authority.
export function correctCiaFacilityFootprint({ allocation, holdings, district, decisionRef }) {
  if (decisionRef !== CIA_FACILITY_DECISION) fail();
  const titles = allocation.titles.filter(row => row.stateId === 'S08');
  const grants = allocation.grants.filter(row => row.stateId === 'S08');
  const facilities = holdings.holdings.filter(row => row.stateId === 'S08');
  if (titles.length !== 1 || titles[0].id !== titleId || titles[0].rank !== 'duchy'
    || titles[0].holderPersonId !== 'K194' || !isDeepStrictEqual(titles[0].jurisdictionRefs, regions)
    || grants.length !== 1 || grants[0].id !== grantId || grants[0].titleId !== titleId
    || grants[0].holderPersonId !== 'K194' || !isDeepStrictEqual(grants[0].adminRefs.map(row => row.id), regions)
    || facilities.length !== 1 || facilities[0].id !== 'holding:capital-s08'
    || facilities[0].holderPersonId !== 'K194' || facilities[0].landmarkRef?.landmarkId !== 'n-seoul-tower'
    || facilities[0].adminRefs.length !== 0 || district.district_id !== 'gu:11170') fail();
  if (allocation.titles.some(row => row.parentTitleId === titleId)
    || allocation.existingTitleBindings.some(row => row.titleId === titleId)) fail();
  const affected = district.regions.filter(row => regions.includes(row.region_id));
  if (affected.length !== 3 || new Set(affected.map(row => row.region_id)).size !== 3
    || affected.some(row => row.content.territory.status !== 'held'
      || row.content.territory.holders.length !== 1 || row.content.territory.holders[0].polity !== 'S08')) fail();
  const nextAllocation = structuredClone(allocation);
  nextAllocation.titles = nextAllocation.titles.filter(row => row.id !== titleId);
  nextAllocation.grants = nextAllocation.grants.filter(row => row.id !== grantId);
  const nextDistrict = structuredClone(district);
  for (const row of nextDistrict.regions.filter(row => regions.includes(row.region_id))) {
    row.content.territory.status = 'unassigned';
    row.content.territory.holders = [];
  }
  return { allocation: nextAllocation, holdings: structuredClone(holdings), district: nextDistrict,
    retired: { titles: [titleId], grants: [grantId] }, decisionRef };
}
