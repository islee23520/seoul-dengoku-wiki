import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { authenticateRightsTransition } from './seoul-scope.mjs';
import { authenticateCiaFacilityCorrection, materializeCiaFacilityContract, CIA_FACILITY_DECISION } from './cia-facility-only-correction.mjs';

const paths = {
  allocation: 'lore/relations/opening-feudal-allocation.json',
  holdings: 'lore/relations/personal-holdings.json',
  district: 'lore/regions/content/11170.json',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw Object.assign(new Error('E_CIA_FACILITY_RIGHTS'), { code: 'E_CIA_FACILITY_RIGHTS' }); };
export const CIA_FACILITY_BATCH = 'cia-facility-only-20261021';
const authenticated = new WeakMap();
const contractPin = '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8';

// Compose, never reinterpret, the original 306 retirements with the owner's
// later facility-only decision. Historical transition bodies remain unchanged.
export function authenticateCiaFacilityRights({ baseline, rightsTransition, decisionBytes,
  predecessorBytes, currentBytes, sourceHashes }) {
  const current = {};
  for (const [key, path] of Object.entries(paths)) {
    if (!(currentBytes?.[key] instanceof Uint8Array)
      || hash(currentBytes[key]) !== sourceHashes?.[path]) fail();
    current[key] = JSON.parse(Buffer.from(currentBytes[key]));
  }
  const correction = authenticateCiaFacilityCorrection({ decisionBytes, predecessorBytes, current });
  if (!(predecessorBytes.contract instanceof Uint8Array) || hash(predecessorBytes.contract) !== contractPin) fail();
  const predecessorContract = JSON.parse(Buffer.from(predecessorBytes.contract));
  const correctedContract = materializeCiaFacilityContract(predecessorContract, correction);
  const predecessorHashes = { ...sourceHashes };
  for (const [key, path] of Object.entries(paths)) predecessorHashes[path] = hash(predecessorBytes[key]);
  const transition = authenticateRightsTransition(baseline, rightsTransition, predecessorHashes);
  const entitySets = Object.fromEntries(Object.entries(transition.entitySets).map(([set, ids]) => [set, [...ids]]));
  const dispositions = new Map(transition.dispositions);
  const retired = new Map(transition.retired);
  for (const [set, id] of [['titles', correction.retiredTitleId], ['grants', correction.retiredGrantId]]) {
    const key = JSON.stringify([set, id]);
    if (entitySets[set].filter(value => value === id).length !== 1
      || retired.has(key) || dispositions.get(key)?.targetId !== id) fail();
    entitySets[set] = entitySets[set].filter(value => value !== id);
    dispositions.delete(key);
    retired.set(key, Object.freeze({ disposition: 'retired-current', currentId: null,
      decisionRef: CIA_FACILITY_DECISION, batchId: CIA_FACILITY_BATCH }));
  }
  const result = Object.freeze({ entitySets, dispositions, retired, correction });
  authenticated.set(result, {
    snapshot: structuredClone(result), identity: hash(JSON.stringify(baseline.currentEntitySets)),
    rights: hash(JSON.stringify(rightsTransition)),
    beforeHashes: Object.fromEntries(Object.entries(paths).map(([key, path]) => [path, hash(predecessorBytes[key])])),
    afterHashes: Object.fromEntries(Object.entries(paths).map(([key, path]) => [path, hash(currentBytes[key])])),
    predecessorContract, correctedContract,
  });
  return result;
}

function authenticatedState(successor, baseline, rightsTransition) {
  const state = authenticated.get(successor);
  if (!state || !isDeepStrictEqual(successor, state.snapshot)
    || state.identity !== hash(JSON.stringify(baseline.currentEntitySets))
    || state.rights !== hash(JSON.stringify(rightsTransition))) fail();
  return state;
}

// Called after the unchanged historical loader and census admission finish.
// Documents and batches retain their old exact reviews; only the two current
// rights and their dispositions change. No new article/card approval is minted.
export function applyCiaFacilityScopeSuccessor(input, successor) {
  const state = authenticatedState(successor, input.baseline, input.current.rightsTransition);
  if (input.current.ciaFacilitySuccessor !== undefined
    || Object.entries(state.beforeHashes).some(([path, digest]) => input.sourceHashes[path] !== digest)) fail();
  const prior = authenticateRightsTransition(input.baseline, input.current.rightsTransition, input.sourceHashes);
  if (!isDeepStrictEqual(Object.keys(input.current.entitySets).sort(), Object.keys(prior.entitySets).sort())
    || Object.entries(prior.entitySets).some(([set, ids]) => {
      const actual = input.current.entitySets[set];
      return !Array.isArray(actual) || new Set(actual).size !== actual.length
        || !isDeepStrictEqual([...actual].sort(), [...ids].sort());
    })) fail();
  const contract = materializeCiaFacilityContract(input.contract, successor.correction);
  const result = { ...input, contract, sourceHashes: { ...input.sourceHashes, ...state.afterHashes },
    current: { ...input.current, entitySets: structuredClone(successor.entitySets),
      rights: input.current.rights.filter(row => row.id !== successor.correction.retiredGrantId),
      ciaFacilitySuccessor: successor } };
  ciaFacilityScopeContext(result);
  return result;
}

// The validator gets a closed predecessor view only for old review/batch checks.
// Current entity sets, rights, entity/disposition rows and geography are still
// validated against the composed successor. A clone or edited capability fails.
export function ciaFacilityScopeContext(input) {
  const successor = input.current.ciaFacilitySuccessor;
  const state = authenticatedState(successor, input.baseline, input.current.rightsTransition);
  if (Object.entries(state.afterHashes).some(([path, digest]) => input.sourceHashes[path] !== digest)) fail();
  const batchContract = { ...input.contract };
  for (const collection of ['entities', 'dispositions']) {
    const expected = state.correctedContract[collection].filter(row => row.batchId === CIA_FACILITY_BATCH);
    for (const row of expected) {
      const same = candidate => candidate.id === row.id && (collection === 'entities' ? candidate.kind === row.kind : candidate.set === row.set);
      const actual = input.contract[collection].filter(same);
      if (actual.length !== 1 || !isDeepStrictEqual(actual[0], row)) fail();
    }
    if (input.contract[collection].filter(row => row.batchId === CIA_FACILITY_BATCH).length !== expected.length) fail();
    batchContract[collection] = input.contract[collection].map(row => row.batchId === CIA_FACILITY_BATCH
      ? state.predecessorContract[collection].find(before => before.id === row.id
        && (collection === 'entities' ? before.kind === row.kind : before.set === row.set)) : row);
  }
  if (input.contract.documents.some(row => row.batchId === CIA_FACILITY_BATCH)) fail();
  return { transition: structuredClone(state.snapshot), batchContract,
    reviewSourceHashes: { ...input.sourceHashes, ...state.beforeHashes } };
}
