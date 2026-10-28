import { resolve } from 'node:path';
import { correctCiaFacilityFootprint, authenticateCiaFacilityCorrection, CIA_FACILITY_DECISION } from './cia-facility-only-correction.mjs';

export const CIA_FACILITY_SOURCE_PATHS = Object.freeze({
  allocation: 'lore/relations/opening-feudal-allocation.json',
  holdings: 'lore/relations/personal-holdings.json',
  district: 'lore/regions/content/11170.json',
});

export async function loadCiaFacilityProjection(root, reader) {
  const predecessorBytes = {};
  for (const [key, path] of Object.entries(CIA_FACILITY_SOURCE_PATHS))
    predecessorBytes[key] = Buffer.from(await reader(resolve(root, path)));
  const current = correctCiaFacilityFootprint({
    ...Object.fromEntries(Object.entries(predecessorBytes).map(([key, bytes]) => [key, JSON.parse(bytes)])),
    decisionRef: CIA_FACILITY_DECISION,
  });
  const currentBytes = Object.fromEntries(Object.keys(CIA_FACILITY_SOURCE_PATHS)
    .map(key => [key, Buffer.from(JSON.stringify(current[key]))]));
  const correction = authenticateCiaFacilityCorrection({ predecessorBytes,
    current: Object.fromEntries(Object.keys(currentBytes).map(key => [key, current[key]])),
  });
  return { correction, predecessorBytes, currentBytes };
}
