import { resolve } from 'node:path';
import { correctCiaFacilityFootprint, authenticateCiaFacilityCorrection, CIA_FACILITY_DECISION } from './cia-facility-only-correction.mjs';

// Exact owner receipt is preserved independently of workstation-local evidence paths.
export const CIA_FACILITY_OWNER_BYTES = Buffer.from("{\n  \"schema\": \"seoul-owner-territory-decision.v1\",\n  \"decisionRef\": \"question:call_lz2AvYKA2N5Phnhe8HovtFwY\",\n  \"date\": \"2026-10-21\",\n  \"subject\": \"S08\",\n  \"answer\": \"중앙정보부 영지: 서울타워 시설만 (Recommended)\",\n  \"approvedScope\": {\n    \"holding\": \"서울타워 시설 구역만\",\n    \"retireExistingThreeDongDuchy\": true,\n    \"wholeYongsan2gaDongGranted\": false,\n    \"reassignSurroundingLand\": false\n  },\n  \"applicationStatus\": \"not-applied\",\n  \"reasonPending\": \"The currently running formal generation must finish before its authenticated source inputs change.\"\n}\n");
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
    decisionBytes: CIA_FACILITY_OWNER_BYTES,
    current: Object.fromEntries(Object.keys(currentBytes).map(key => [key, current[key]])),
  });
  return { correction, predecessorBytes, currentBytes };
}
