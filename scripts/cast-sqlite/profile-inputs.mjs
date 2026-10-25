import { createHash } from 'node:crypto';
import { abilityIds, profileFailures } from '../character-profile.mjs';
import { ENGINE_TABLE_COLUMNS } from './current-engine.mjs';

// This is the complete publicCharacterProfile input, not loadCharacterProfiles'
// private editorial record. The engine mapper intentionally discards souls,
// historical comparisons, approvals and other non-public editorial fields.
const pins = [
  ['special', '7f567aaa9c91bc64a1a6f48c4f463c52bbeb891102d635d4c9ab0e249ee202a1', 352526, 39, 'bcb9122334f46c0b7e9729edcb15fdbffbd8736cd6fe0b9d3c03c80c6a65ce90'],
  ['state-01-02', 'd456e58e695f8677d183140f66b19188c8924521889996711ea08391b4d3255d', 1293452, 128, 'a486278ab7af20e5ddb981db2fccb9c80c64baf26c0a3d75129d26c03b044a98'],
  ['state-03-04', '84f1703cef91f00613640b6c9950f3f20d00cdcb51f584e732daa262af3ec9e1', 1537497, 127, '557443772c754a4d7b276e2f85e22fc9fcc71d970b80f56cb9303066339bee61'],
  ['state-05-06', '8cee2e27875c53a260461117ab9a4dcbbc06568e1b1ece84b5ee69265349a59b', 1397469, 124, '90cae24505df4fe8397ddcc7476cd115b749a318d384a7a760b399dbca969344'],
  ['state-07-08', '25a4e8ef3c4807eab972b4750087e40d03bcceaf5e4833f226ec55bc887e3ed2', 1143960, 120, '964bef371abf2042276940f32a640012f831db087d36330e1322f27a08b7c3d7'],
  ['state-09-10', '0c12a17db264fe2a88d77eadf136d722969e52760d439cc7c7f6d852868c2874', 1208002, 122, '4e7d4650ad4cc998fb19c5d0e7760200a7431718713ee752f63c2ae20fe035b5'],
  ['state-11-12', '60578aee0748e7b7ccb12346168c508077ec221e8b36bc66dd171332ab57761e', 1231491, 121, 'e31dd78b93a99e2c281cb21b40d6cd87b973489cf0771d8ffb0ac42e0e471b24'],
  ['state-13-14', 'ed538be39fa0ec703eccec3206d1f8f12746a70c1845290acebff0ba0e7970b2', 1273643, 121, '0e3fe4d6c8f917d3245d5a1b7f6b8784c4e073bd97aff42fc4517eaf5b25727d'],
  ['state-15-16', '6a3ee3a8a834244772c76be46c1e7a54115dc88a459e3e69953003f329b435cd', 1260467, 120, '2b71b2897cc8af5aded15ae964863dbda75c4f043244aa531e066ef313e006d6'],
].map(([name, hash, length, count, projection], index) => Object.freeze({
  engine_source_id: `engine-source-${String(index + 1).padStart(4, '0')}`,
  logical_path: `lore/editorial/profile-batches/${name}.json`, source_sha256: hash,
  source_byte_length: length, profile_count: count, projection_schema: 'public-character-profile.v1', projection_sha256: projection,
}));
export const PROFILE_INPUT_SOURCE_HASHES = Object.freeze(Object.fromEntries(pins.map(pin => [pin.logical_path, pin.source_sha256])));
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const coverage = detail => fail('E_PROFILE_INPUT_COVERAGE', detail);

// Caller owns the connection. Only typed engine domains are queried. Hashes
// bind completeness, including deleted terminal array rows, to this exact import.
export function readPublicCharacterProfileInputs(db, { expectedSourceHashes = PROFILE_INPUT_SOURCE_HASHES } = {}) {
  const read = sql => {
    try { return db.prepare(sql).all(); }
    catch (cause) {
      if (/no such (table|column)/u.test(cause.message)) fail('E_PROFILE_INPUT_SCHEMA_GAP', cause.message);
      throw cause;
    }
  };
  if (!expectedSourceHashes || Object.keys(expectedSourceHashes).length !== pins.length) fail('E_PROFILE_INPUT_STALE', 'source pins');
  const tables = Object.fromEntries(Object.entries(ENGINE_TABLE_COLUMNS).map(([table, columns]) => [table, read(`SELECT ${columns.join(',')} FROM ${table}`)]));
  if (tables.current_engine_source.length !== pins.length) fail('E_PROFILE_INPUT_MISSING', 'engine sources');
  for (const pin of pins) {
    if (expectedSourceHashes[pin.logical_path] !== pin.source_sha256) fail('E_PROFILE_INPUT_STALE', pin.logical_path);
    const sources = tables.current_engine_source.filter(row => row.logical_path === pin.logical_path);
    if (sources.length !== 1) fail('E_PROFILE_INPUT_MISSING', pin.logical_path);
    if (Object.keys(pin).some(key => sources[0][key] !== pin[key])) fail('E_PROFILE_INPUT_STALE', pin.logical_path);
  }
  const people = read('SELECT person_id FROM person');
  const ids = new Set(people.map(row => row.person_id));
  if (people.length !== 1022 || ids.size !== 1022 || tables.current_profile.length !== 1022) coverage('issued identities');
  const indexes = {}, used = new Set();
  for (const [table, rows] of Object.entries(tables)) {
    if (table === 'current_engine_source') continue;
    indexes[table] = new Map();
    for (const row of rows) {
      if (!ids.has(row.person_id)) coverage(`${table}:orphan`);
      const group = indexes[table].get(row.person_id) ?? [];
      group.push(row); indexes[table].set(row.person_id, group);
    }
  }
  const ordered = (table, id, ordinal, pointer, exactCount) => {
    const rows = (indexes[table].get(id) ?? []).slice().sort((a, b) => a[ordinal] - b[ordinal]);
    if (exactCount !== undefined && rows.length !== exactCount) coverage(`${id}:${table}`);
    rows.forEach((row, i) => {
      if (row[ordinal] !== i || row.json_pointer !== pointer(row, i)) coverage(`${id}:${table}:metadata`);
      used.add(row);
    });
    return rows;
  };
  const singleton = (table, id, pointer) => {
    const rows = indexes[table].get(id) ?? [];
    if (rows.length !== 1 || rows[0].json_pointer !== pointer) coverage(`${id}:${table}`);
    used.add(rows[0]); return rows[0];
  };
  const value = (row, state, field) => {
    if (!['missing', 'null', 'value'].includes(row[state]) || (row[state] === 'value' ? typeof row[field] !== 'string' : row[field] !== null)) coverage(`${state}:presence`);
    return row[state] === 'missing' ? undefined : row[field];
  };
  const localized = (row, field) => ({ ko: row[`${field}_ko`], en: row[`${field}_en`] });
  const profiles = new Map();
  for (const pin of pins) {
    const sourceProfiles = tables.current_profile.filter(row => row.engine_source_id === pin.engine_source_id).sort((a, b) => a.source_ordinal - b.source_ordinal);
    if (sourceProfiles.length !== pin.profile_count) coverage(pin.logical_path);
    const projections = sourceProfiles.map((row, ordinal) => {
      const id = row.person_id, pointer = `/profiles/${ordinal}`;
      if (row.source_ordinal !== ordinal || row.json_pointer !== pointer || profiles.has(id) || indexes.current_profile.get(id).length !== 1) coverage(`${id}:profile`);
      used.add(row);
      const abilities = ordered('ability', id, 'ability_ordinal', r => `${pointer}/abilities/${r.ability_id}`, 8);
      if (abilities.some((r, i) => r.ability_id !== abilityIds[i])) coverage(`${id}:abilities`);
      const skills = ordered('skill', id, 'skill_ordinal', (_, i) => `${pointer}/skills/${i}`).map(r => ({ id: value(r, 'skill_id_presence', 'skill_id'), name: localized(r, 'name'), rating: r.rating }));
      const traits = ordered('trait', id, 'trait_ordinal', (_, i) => `${pointer}/traits/${i}`).map(r => {
        const effects = (indexes.effect.get(id) ?? []).filter(e => e.trait_ordinal === r.trait_ordinal).sort((a, b) => a.effect_ordinal - b.effect_ordinal);
        effects.forEach((e, i) => {
          if (e.effect_ordinal !== i || e.json_pointer !== `${r.json_pointer}/effects/${i}`) coverage(`${id}:effect`);
          used.add(e);
        });
        return { id: value(r, 'trait_id_presence', 'trait_id'), ...Object.fromEntries(['name', 'description', 'behavior', 'stress', 'relationship'].map(field => [field, localized(r, field)])), effects: effects.map(e => ({ ability: e.ability_id, delta: e.delta })) };
      });
      const narrative = singleton('narrative', id, `${pointer}/narrative`);
      const health = singleton('health', id, `${pointer}/health`);
      const profile = {
        abilities: Object.fromEntries(abilities.map(r => [r.ability_id, { base: r.base_value, effective: r.effective_value }])), skills, traits,
        narrative: localized(narrative, 'narrative'), health: {
          status: value(health, 'status_presence', 'status'),
          bodyParts: ordered('body', id, 'body_ordinal', (_, i) => `${pointer}/health/bodyParts/${i}`, 6).map(r => ({ id: r.body_part_id, severity: value(r, 'severity_presence', 'severity'), function: value(r, 'function_presence', 'function_state') })),
          diseases: ordered('disease', id, 'disease_ordinal', (_, i) => `${pointer}/health/diseases/${i}`).map(r => ({ id: value(r, 'disease_id_presence', 'disease_id'), progression: value(r, 'progression_presence', 'progression') })),
        },
      };
      if (profileFailures(profile).length) coverage(`${id}:invalid projection`);
      profiles.set(id, profile);
      return { personId: id, profile };
    });
    if (createHash('sha256').update(JSON.stringify(projections)).digest('hex') !== pin.projection_sha256) coverage(`${pin.logical_path}:projection digest`);
  }
  if (profiles.size !== ids.size || Object.entries(tables).some(([table, rows]) => table !== 'current_engine_source' && rows.some(row => !used.has(row)))) coverage('unconsumed rows');
  return profiles;
}
