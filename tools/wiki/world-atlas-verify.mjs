import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { verifyDiagramRecords } from './world-atlas-isometric.mjs';
import { extractAtlasJson, parseCastIndex } from './world-atlas-parse.mjs';
import {
  verifyMonsterManifest,
  verifySeeds,
  verifyStoryManifest,
  verifySynthetics,
  verifyTheaters,
  verifyStoryContentBatch,
  verifyMonsterContentBatch,
  verifyGroupDossiers,
} from './world-atlas-verify-rest.mjs';
import {
  ATLAS_OWNER,
  ATLAS_SCHEMA,
  CORPORATE_HOUSES,
  CIVIC_HOUSES,
  HOUSE_REQUIRED_FIELDS,
  LOCKED_HOUSES,
  PROJECTION_FILES,
  SOURCE_KINDS,
  STATES,
} from './world-atlas-schema.mjs';

function requireFields(record, fields, fail, where) {
  for (const field of fields) {
    const value = record?.[field];
    if (value === undefined || value === null || value === '') {
      fail('E_HOUSE_FIELD', `${where} missing ${field}`);
    }
  }
}

export function verifyHouses(atlas, projections, fail) {
  const houses = atlas.houses ?? [];
  if (houses.length !== 32) fail('E_HOUSE_COUNT', `actual=${houses.length}`);
  const locked = new Map(LOCKED_HOUSES.map((h) => [h.id, h.name]));
  const seen = new Set();
  const covered = new Set();
  for (const house of houses) {
    requireFields(house, HOUSE_REQUIRED_FIELDS, fail, house.id ?? '?');
    if (house.owner !== ATLAS_OWNER) fail('E_OWNER', house.id);
    if (!SOURCE_KINDS.includes(house.source_kind)) fail('E_SOURCE_KIND', house.id);
    if (seen.has(house.id)) fail('E_HOUSE_ID', `duplicate ${house.id}`);
    seen.add(house.id);
    const expectedName = locked.get(house.id);
    if (!expectedName) fail('E_HOUSE_ID', house.id);
    else if (house.display_name !== expectedName) fail('E_HOUSE_NAME', `${house.id} ${house.display_name}`);
    if (!Array.isArray(house.exclusive_state_ids) || house.exclusive_state_ids.length !== 0) {
      fail('E_FULL_STATE_OWNERSHIP', house.id);
    }
    for (const stateId of house.states ?? []) covered.add(stateId);
    if (!Array.isArray(house.arcs) || house.arcs.length < 3) fail('E_HOUSE_FIELD', `${house.id} arcs`);
  }
  for (const lockedHouse of [...CORPORATE_HOUSES, ...CIVIC_HOUSES]) {
    if (!seen.has(lockedHouse.id)) fail('E_HOUSE_ID', `missing ${lockedHouse.id}`);
  }
  for (const state of STATES) {
    if (!covered.has(state.id)) fail('E_STATE_UNCOVERED', state.id);
  }
  if (!projections[PROJECTION_FILES.houses]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.houses);
}

const STAGE_RUNNERS = Object.freeze({
  houses: verifyHouses,
  theaters: verifyTheaters,
  synthetics: verifySynthetics,
  'story-manifest': verifyStoryManifest,
  'monster-manifest': verifyMonsterManifest,
  seeds: verifySeeds,
});

export async function verifyAtlasStage({ atlasPath, docs, stage, fail, batch = null, groups = null }) {
  let markdown;
  try {
    markdown = await readFile(atlasPath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      fail('E_MISSING_ATLAS', atlasPath);
      return null;
    }
    throw err;
  }
  const parsed = extractAtlasJson(markdown);
  if (!parsed.ok) {
    fail('E_ATLAS_SCHEMA', parsed.error);
    return null;
  }
  if (parsed.value.schema !== ATLAS_SCHEMA) fail('E_ATLAS_SCHEMA', parsed.value.schema);
  if (parsed.value.document?.owner !== ATLAS_OWNER) fail('E_OWNER', 'document');
  const humans = parsed.value.humans ?? [];
  if (humans.length !== 422) fail('E_K_MAP', `actual=${humans.length}`);
  try {
    const index = parseCastIndex(await readFile(join(docs, 'Cast-Index.md'), 'utf8'));
    for (let i = 0; i < 422; i += 1) {
      if (humans[i]?.id !== index[i]?.id || humans[i]?.name !== index[i]?.name) {
        fail('E_K_MAP', `${humans[i]?.id ?? i} ${humans[i]?.name}`);
        break;
      }
    }
  } catch (err) {
    if (!err || err.code !== 'ENOENT') throw err;
  }
  const projections = {};
  for (const name of Object.values(PROJECTION_FILES)) {
    try {
      projections[name] = await readFile(join(docs, name), 'utf8');
    } catch (err) {
      if (!err || err.code !== 'ENOENT') throw err;
    }
  }
  try {
    const { readdir } = await import('node:fs/promises');
    for (const name of await readdir(docs)) {
      if (/^(Story-Batch-B\d{3}|Monster-Batch-M\d{3}|Hostile-Group-G\d{2})\.md$/.test(name)) {
        try {
          projections[name] = await readFile(join(docs, name), 'utf8');
        } catch (err) {
          if (!err || err.code !== 'ENOENT') throw err;
        }
      }
    }
  } catch (err) {
    if (!err || err.code !== 'ENOENT') throw err;
  }
  if (stage === 'story-batch') {
    verifyStoryContentBatch(parsed.value, projections, fail, batch);
  } else if (stage === 'monster-batch') {
    verifyMonsterContentBatch(parsed.value, projections, fail, batch);
  } else if (stage === 'group-dossiers') {
    verifyGroupDossiers(parsed.value, projections, fail, groups ?? []);
  } else {
    const run = STAGE_RUNNERS[stage];
    if (run) run(parsed.value, projections, fail);
  }
  if ((parsed.value.diagrams ?? []).length > 0) {
    verifyDiagramRecords(parsed.value, fail);
  }
  return parsed.value;
}
