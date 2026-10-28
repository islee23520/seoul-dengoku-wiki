import { createHash } from 'node:crypto';
import { abilityIds, profileFailures } from '../character-profile.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS, ENGINE_TABLE_COLUMNS } from './current-engine.mjs';

// This is the complete publicCharacterProfile input, not loadCharacterProfiles'
// private editorial record. The engine mapper intentionally discards souls,
// historical comparisons, approvals and other non-public editorial fields.
export const PROFILE_INPUT_PATHS = ENGINE_PRIVATE_SOURCE_PATHS;
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const coverage = detail => fail('E_PROFILE_INPUT_COVERAGE', detail);

// Caller owns the connection. Only typed engine domains are queried.
export function readPublicCharacterProfileInputs(db) {
  const read = sql => {
    try { return db.prepare(sql).all(); }
    catch (cause) {
      if (/no such (table|column)/u.test(cause.message)) fail('E_PROFILE_INPUT_SCHEMA_GAP', cause.message);
      throw cause;
    }
  };
  const tables = Object.fromEntries(Object.entries(ENGINE_TABLE_COLUMNS).map(([table, columns]) => [table, read(`SELECT ${columns.join(',')} FROM ${table}`)]));
  const sources = tables.current_engine_source.slice().sort((a, b) => a.engine_source_id < b.engine_source_id ? -1 : a.engine_source_id > b.engine_source_id ? 1 : 0);
  if (new Set(sources.map(row => row.logical_path)).size !== sources.length
    || sources.some(row => row.projection_schema !== 'public-character-profile.v1')) fail('E_PROFILE_INPUT_MISSING', 'engine sources');
  const people = read('SELECT person_id FROM person');
  const ids = new Set(people.map(row => row.person_id));
  if (ids.size !== people.length || tables.current_profile.length !== people.length) coverage('issued identities');
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
  for (const pin of sources) {
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
