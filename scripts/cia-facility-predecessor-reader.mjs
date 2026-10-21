import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { authenticateCiaFacilityCorrection, materializeCiaFacilityContract } from './cia-facility-only-correction.mjs';

export const CIA_FACILITY_OWNER_PATH = '.omo/evidence/seoul-lock/cia-facility-only-owner-decision-20261021.json';
export const CIA_FACILITY_SOURCES = Object.freeze({
  allocation: 'lore/relations/opening-feudal-allocation.json',
  holdings: 'lore/relations/personal-holdings.json',
  district: 'lore/regions/content/11170.json',
  contract: 'lore/editorial/Seoul-Scope-Contract.json',
});
const pins = {
  allocation: '21d7663507b896a43d70fc459f662376780b477b5c2078af100b2d42bbe7079d',
  holdings: '1801d7bb8d27af743f74ea447d4f7be782b9d8ba7ba5b37af4d0c6f2b6329a12',
  district: '4d4372a151ea3b5b3750f4209009850786878a9a1b0f03d6263b82f713be39e3',
  contract: '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const absolute = path => resolve(path instanceof URL ? fileURLToPath(path) : path);
const fail = () => { throw Object.assign(new Error('E_CIA_FACILITY_SUCCESSOR'), { code: 'E_CIA_FACILITY_SUCCESSOR' }); };

// readPredecessor addresses sealed evidence, never a fallback for a failed
// current read. All four live documents are checked before historical replay.
export async function ciaFacilityPredecessorReader({ root, readCurrent, readPredecessor }) {
  const currentBytes = {};
  for (const [key, path] of Object.entries(CIA_FACILITY_SOURCES))
    currentBytes[key] = Buffer.from(await readCurrent(resolve(root, path)));
  if (Object.keys(pins).every(key => hash(currentBytes[key]) === pins[key]))
    return { reader: readCurrent, successor: null };
  const predecessorBytes = {};
  for (const [key, path] of Object.entries(CIA_FACILITY_SOURCES)) {
    predecessorBytes[key] = Buffer.from(await readPredecessor(resolve(root, path)));
    if (hash(predecessorBytes[key]) !== pins[key]) fail();
  }
  const decisionBytes = Buffer.from(await readCurrent(resolve(root, CIA_FACILITY_OWNER_PATH)));
  const correction = authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes,
    current: Object.fromEntries(['allocation', 'holdings', 'district'].map(key => [key, JSON.parse(currentBytes[key])])) });
  const expectedContract = materializeCiaFacilityContract(JSON.parse(predecessorBytes.contract), correction);
  if (!isDeepStrictEqual(JSON.parse(currentBytes.contract), expectedContract)) fail();
  const files = new Map(Object.entries(CIA_FACILITY_SOURCES).map(([key, sourcePath]) => [resolve(root, sourcePath), {
    sourcePath, before: predecessorBytes[key], current: currentBytes[key],
    beforeSha256: pins[key], afterSha256: hash(currentBytes[key]),
  }]));
  const reader = async (path, options) => {
    const file = files.get(absolute(path));
    if (!file) return readCurrent(path, options);
    return options === 'utf8' ? file.before.toString() : Buffer.from(file.before);
  };
  reader.readHistorical = readCurrent.readHistorical;
  reader.appliedDiskOverrides = new Map(readCurrent.appliedDiskOverrides ?? []);
  return { reader, successor: { correction, files, decisionBytes, predecessorBytes, currentBytes } };
}
