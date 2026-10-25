import { isDeepStrictEqual } from 'node:util';
import { isAuthenticatedCiaFacilityCorrection } from './cia-facility-only-correction.mjs';

const regions = ['region:1117051000', 'region:1117052000', 'region:1117066000'];
const titleId = 'title:duchy-s08';
const grantId = 'holding:opening-duchy-s08-demesne';
const towerId = 'holding:capital-s08';
const fail = () => { throw Object.assign(new Error('E_CIA_FACILITY_PUBLICATION'), { code: 'E_CIA_FACILITY_PUBLICATION' }); };
const authorize = proof => { if (!isAuthenticatedCiaFacilityCorrection(proof)) fail(); };
const one = (rows, id) => {
  const matches = rows.filter(row => row.id === id);
  if (matches.length !== 1) fail();
  return matches[0];
};

// Project the producer's actual public shape, not the source allocation shape.
// Retain the original object for the 1022-detail field-mapping admission; pass
// this result only to public holdings output, never to the old detail producer.
export function projectCiaFacilityHoldings(personalHoldings, proof) {
  authorize(proof);
  const title = one(personalHoldings.titles, titleId);
  const grant = one(personalHoldings.holdings, grantId);
  const tower = one(personalHoldings.holdings, towerId);
  if (title.holderPersonId !== 'K194' || title.stateId !== 'S08' || title.rank !== 'duchy'
    || !isDeepStrictEqual(title.jurisdictionRefs, regions)
    || grant.holderPersonId !== 'K194' || grant.stateId !== 'S08' || grant.titleId !== titleId
    || !isDeepStrictEqual(grant.adminRefs.map(row => row.id), regions)
    || tower.holderPersonId !== 'K194' || tower.stateId !== 'S08'
    || tower.landmarkRef?.landmarkId !== 'n-seoul-tower' || tower.adminRefs.length !== 0
    || personalHoldings.titles.some(row => row.parentTitleId === titleId)
    || personalHoldings.holdings.some(row => row.id !== grantId && row.titleId === titleId)
    || personalHoldings.titles.filter(row => row.stateId === 'S08').length !== 1
    || personalHoldings.holdings.filter(row => row.stateId === 'S08').length !== 2) fail();
  return { ...personalHoldings, titles: personalHoldings.titles.filter(row => row.id !== titleId),
    holdings: personalHoldings.holdings.filter(row => row.id !== grantId),
    summary: { ...personalHoldings.summary,
      newGrants: personalHoldings.summary.newGrants - 1,
      holdings: personalHoldings.holdings.length - 1,
      titles: personalHoldings.titles.length - 1,
      heldSeoulRegions: personalHoldings.summary.heldSeoulRegions - regions.length,
      coveredEntitlements: personalHoldings.summary.coveredEntitlements - regions.length,
    } };
}

// Use the same returned content in region documents and regionContentById before
// deriving map regions, surface station controls, landmarks and state labels.
export function projectCiaFacilityRegions(regionContentById, proof) {
  authorize(proof);
  if (!(regionContentById instanceof Map)) fail();
  const result = new Map(regionContentById);
  for (const id of regions) {
    const content = regionContentById.get(id);
    const territory = content?.territory;
    if (territory?.status !== 'held' || territory.holders?.length !== 1
      || territory.holders[0].polity !== 'S08') fail();
    const next = { ...territory, status: 'unassigned', holders: [] };
    // A derived authority can outlive the old holder unless explicitly removed.
    delete next.authority;
    result.set(id, { ...content, territory: next });
  }
  return result;
}

export function projectCiaFacilityRegionDocuments(documents, proof) {
  const contents = new Map(documents.flatMap(document => document.regions.map(row => [row.region_id, row.content])));
  if (contents.size !== documents.reduce((sum, document) => sum + document.regions.length, 0)) fail();
  const projected = projectCiaFacilityRegions(contents, proof);
  return documents.map(document => document.regions.some(row => regions.includes(row.region_id))
    ? { ...document, regions: document.regions.map(row => regions.includes(row.region_id)
      ? { ...row, content: projected.get(row.region_id) } : row) } : document);
}

// Call only AFTER admitPublicPersonDetails(original1022, predecessorScope,
// mappingAuthority). This is a pure post-admission projection, like the roster
// retirement projection; it must not be sent back through the old field mapping.
export function projectCiaFacilityPersonDetails(personDetails, personalHoldings, proof) {
  projectCiaFacilityHoldings(personalHoldings, proof);
  const leader = personDetails.filter(row => row.characterId === 'K194');
  if (leader.length !== 1 || new Set(personDetails.map(row => row.characterId)).size !== personDetails.length) fail();
  const target = leader[0];
  if (!isDeepStrictEqual(one(target.confirmedHoldings, grantId), one(personalHoldings.holdings, grantId))
    || !isDeepStrictEqual(one(target.confirmedHoldings, towerId), one(personalHoldings.holdings, towerId))
    || !isDeepStrictEqual(one(target.openingTitles, titleId), { ...one(personalHoldings.titles, titleId), parentTitle: null })
    || target.openingTitles.length !== 1 || target.subordinateHoldings?.length !== 0) fail();
  for (const detail of personDetails) {
    for (const field of ['confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles']) {
      if ((detail[field] ?? []).some(row => (row.id === titleId || row.id === grantId)
        && (detail !== target || field !== (row.id === titleId ? 'openingTitles' : 'confirmedHoldings'))
        || row.parentTitleId === titleId || row.parentTitle?.id === titleId)) fail();
    }
  }
  return personDetails.map(detail => {
    if (detail !== target) return detail;
    const projected = { ...detail, confirmedHoldings: detail.confirmedHoldings.filter(row => row.id !== grantId) };
    delete projected.openingTitles;
    delete projected.subordinateHoldings;
    return projected;
  });
}
