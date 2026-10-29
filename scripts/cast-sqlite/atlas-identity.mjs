import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { withTransaction } from './db.mjs';

const paths = Object.freeze(Object.fromEntries(Object.entries({ registry: 'person-id-registry', candidates: 'person-id-candidates', values: 'values-cast', gurps: 'gurps-cast' }).map(([kind, name]) => [kind, `lore/name-pools/${name}.json`])));
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function shape(value, fields, optional = '') {
  const required = fields.split(' ').filter(Boolean), allowed = [...required, ...optional.split(' ').filter(Boolean)];
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || required.some(k => !Object.hasOwn(value, k)) || Object.keys(value).some(k => !allowed.includes(k))) fail('E_ATLAS_IDENTITY_FIELDS', fields);
}
function array(value, fn) {
  if (!Array.isArray(value)) fail('E_ATLAS_IDENTITY_TYPE', 'array');
  value.forEach(fn);
}
function strings(value, fields) {
  for (const key of fields.split(' ')) if (typeof value[key] !== 'string') fail('E_ATLAS_IDENTITY_TYPE', key);
}
function counts(value, fields) {
  for (const key of fields.split(' ')) if (!Number.isSafeInteger(value[key]) || value[key] < 0) fail('E_ATLAS_IDENTITY_TYPE', key);
}
function validate(registry, candidates, values, gurps) {
  shape(registry, 'schema approvalRef totalPeople existingKCount issuedCount persons');
  strings(registry, 'schema'); counts(registry, 'totalPeople existingKCount issuedCount');
  shape(registry.approvalRef, 'approvedBy approvedAt ownerRef inputSha256 candidatesSha256');
  strings(registry.approvalRef, 'approvedBy approvedAt ownerRef inputSha256 candidatesSha256');
  array(registry.persons, p => {
    shape(p, 'id name', 'aliases'); strings(p, 'id name');
    if (Object.hasOwn(p, 'aliases')) array(p.aliases, a => { if (typeof a !== 'string') fail('E_ATLAS_IDENTITY_TYPE', 'alias'); });
  });
  shape(candidates, 'schema inputSha256 baseCommit totalPeople existingKCount candidateCount existingK candidates NOTES');
  strings(candidates, 'schema inputSha256 baseCommit'); counts(candidates, 'totalPeople existingKCount candidateCount');
  array(candidates.existingK, p => { shape(p, 'id name'); strings(p, 'id name'); });
  array(candidates.candidates, p => {
    shape(p, 'ordinal name stage state title locked'); strings(p, 'name stage state title'); counts(p, 'ordinal');
    if (typeof p.locked !== 'boolean') fail('E_ATLAS_IDENTITY_TYPE', 'locked');
  });
  array(candidates.NOTES, p => { shape(p, 'type name detail'); strings(p, 'type name detail'); });
  shape(values, 'schema note axes desire_axes count people'); strings(values, 'schema note'); counts(values, 'count');
  for (const axes of [values.axes, values.desire_axes]) array(axes, a => { if (typeof a !== 'string') fail('E_ATLAS_IDENTITY_TYPE', 'axis'); });
  array(values.people, p => {
    shape(p, 'name title stage state state_name generation source minors values desire', 'locked');
    strings(p, 'name title stage state state_name generation source');
    if (typeof p.minors !== 'boolean' || (Object.hasOwn(p, 'locked') && typeof p.locked !== 'boolean')) fail('E_ATLAS_IDENTITY_TYPE', 'person boolean');
    shape(p.values, values.axes.join(' ')); shape(p.desire, [...values.desire_axes, '지향', '결합'].join(' '));
  });
  // Only the sheet identity/route projection is admitted, not a second sheet authority.
  shape(gurps, 'schema status provenance note invariants rules count people');
  strings(gurps, 'schema status note'); counts(gurps, 'count');
  array(gurps.people, p => {
    shape(p, 'id name url state method role attributes traits skills languages secondary cp band baseline', 'unit wandering_force territory advantages disadvantages');
    strings(p, 'id name url');
  });
  if (registry.schema !== 'wiki-person-id-registry.v1' || candidates.schema !== 'wiki-person-id-candidates.v1'
    || values.schema !== 'janseon.values.cast.v2' || gurps.schema !== 'wiki-gurps-cast.v1'
    || registry.totalPeople !== registry.persons.length || registry.existingKCount + registry.issuedCount !== registry.totalPeople
    || candidates.totalPeople !== registry.totalPeople || candidates.existingKCount !== candidates.existingK.length
    || candidates.candidateCount !== candidates.candidates.length || candidates.existingKCount + candidates.candidateCount !== candidates.totalPeople
    || values.count !== values.people.length || gurps.count !== gurps.people.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'document metadata');
}
function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(row));
}
function rows(db, sql, ...args) {
  try { return db.prepare(sql).all(...args); }
  catch (cause) {
    if (/no such (table|column)/u.test(cause.message)) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', cause.message);
    throw cause;
  }
}
function ordered(records, field = 'ordinal') {
  if (records.some((r, i) => r[field] !== i)) fail('E_ATLAS_IDENTITY_COVERAGE', 'non-contiguous order');
  return records;
}
function typedPeople(db) {
  const axes = ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM value_axis ORDER BY axis_ordinal'));
  const desires = ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal,value_kind FROM desire_axis ORDER BY axis_ordinal'));
  if (axes.length !== 10 || desires.length !== 7) fail('E_ATLAS_IDENTITY_COVERAGE', 'axis dictionaries');
  const values = rows(db, 'SELECT person_id,axis_name,value FROM person_value');
  const wants = rows(db, 'SELECT person_id,axis_name,value_kind,integer_value,text_value FROM person_desire');
  const persons = ordered(rows(db, 'SELECT *,values_source_ordinal AS ordinal FROM person ORDER BY values_source_ordinal'));
  if (values.length !== persons.length * axes.length || wants.length !== persons.length * desires.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'values/desires');
  const byPerson = records => {
    const result = new Map();
    for (const row of records) { if (!result.has(row.person_id)) result.set(row.person_id, new Map()); result.get(row.person_id).set(row.axis_name, row); }
    return result;
  };
  const valueMap = byPerson(values), desireMap = byPerson(wants);
  const people = persons.map(p => {
    const axisRecord = (dictionary, record, desire = false) => Object.fromEntries(dictionary.map(a => {
      const v = record?.get(a.axis_name);
      if (!v || (desire && v.value_kind !== a.value_kind)) fail('E_ATLAS_IDENTITY_COVERAGE', p.person_id);
      return [a.axis_name, desire ? v.value_kind === 'integer' ? v.integer_value : v.text_value : v.value];
    }));
    return {
      name: p.name, title: p.title, stage: p.stage, state: p.state_id, state_name: p.state_name,
      generation: p.generation, source: p.source_kind, minors: Boolean(p.minors),
      values: axisRecord(axes, valueMap.get(p.person_id)), desire: axisRecord(desires, desireMap.get(p.person_id), true),
      ...(p.locked === null ? {} : { locked: Boolean(p.locked) })
    };
  });
  return { persons, people };
}
function typedRegistry(db, sourceId, roster) {
  const metadata = rows(db, 'SELECT * FROM identity_registry_provenance WHERE source_id=?', sourceId)[0];
  if (!metadata) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'registry provenance');
  const aliases = rows(db, 'SELECT person_id,alias,alias_ordinal AS ordinal FROM person_alias ORDER BY person_id,alias_ordinal');
  const people = new Map(rows(db, 'SELECT person_id,name FROM person').map(p => [p.person_id, p.name]));
  const persons = ordered(roster).map(p => {
    if (!people.has(p.person_id)) fail('E_ATLAS_IDENTITY_COVERAGE', p.person_id);
    const names = ordered(aliases.filter(a => a.person_id === p.person_id)).map(a => a.alias);
    if (!p.has_aliases && names.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'alias presence');
    return { id: p.person_id, name: people.get(p.person_id), ...(p.has_aliases ? { aliases: names } : {}) };
  });
  if (persons.length !== people.size || persons.length !== metadata.total_people) fail('E_ATLAS_IDENTITY_COVERAGE', 'registry roster');
  return {
    schema: metadata.schema_name, approvalRef: {
      approvedBy: metadata.approved_by, approvedAt: metadata.approved_at,
      ownerRef: metadata.owner_ref, inputSha256: metadata.input_sha256, candidatesSha256: metadata.candidates_sha256
    },
    totalPeople: metadata.total_people, existingKCount: metadata.existing_k_count, issuedCount: metadata.issued_count, persons
  };
}
function source(db, kind) {
  const record = rows(db, 'SELECT source_id,sha256 FROM source_file WHERE logical_path=?', paths[kind])[0];
  if (!record) fail('E_ATLAS_IDENTITY_MISSING', paths[kind]);
  return record;
}

export function readAtlasValuesDocument(db) {
  const context = readAtlasIdentity(db);
  const metadata = rows(db, 'SELECT * FROM atlas_identity_values_metadata');
  if (metadata.length !== 1 || metadata[0].person_count !== context.people.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'values metadata');
  return { schema: metadata[0].schema_name, note: metadata[0].note,
    axes: ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM value_axis ORDER BY axis_ordinal')).map(row => row.axis_name),
    desire_axes: ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM desire_axis ORDER BY axis_ordinal')).map(row => row.axis_name).filter(name => !['지향', '결합'].includes(name)),
    count: metadata[0].person_count, people: context.people };
}

export function readAtlasIdentity(db) {
  if (rows(db, 'SELECT singleton FROM atlas_identity_seal').length !== 1) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'unsealed migration');
  const bindings = rows(db, 'SELECT kind,source_id,sha256 FROM atlas_identity_binding');
  if (bindings.length !== 4) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'source bindings');
  for (const [kind, path] of Object.entries(paths)) {
    const binding = bindings.find(b => b.kind === kind);
    if (!binding) fail('E_ATLAS_IDENTITY_MISSING', path);
    if (kind !== 'candidates') {
      const current = source(db, kind);
      if (current.source_id !== binding.source_id || current.sha256 !== binding.sha256) fail('E_ATLAS_IDENTITY_STALE', path);
    }
  }
  const registry = typedRegistry(db, bindings.find(b => b.kind === 'registry').source_id, rows(db, 'SELECT * FROM atlas_identity_registry_person ORDER BY ordinal'));
  const c = rows(db, 'SELECT * FROM atlas_identity_candidate_metadata WHERE singleton=1')[0];
  if (!c) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'candidate metadata');
  const candidates = { schema: c.schema_name, inputSha256: c.input_sha256, baseCommit: c.base_commit, totalPeople: c.total_people,
    existingKCount: c.existing_k_count, candidateCount: c.candidate_count,
    existingK: ordered(rows(db, 'SELECT * FROM atlas_identity_existing_k ORDER BY ordinal')).map(p => ({ id: p.id, name: p.name })),
    candidates: ordered(rows(db, 'SELECT * FROM atlas_identity_candidate ORDER BY position'), 'position').map(p => ({ ordinal: p.ordinal, name: p.name, stage: p.stage, state: p.state, title: p.title, locked: Boolean(p.locked) })),
    NOTES: ordered(rows(db, 'SELECT * FROM atlas_identity_note ORDER BY ordinal')).map(p => ({ type: p.type, name: p.name, detail: p.detail })) };
  const { people, persons } = typedPeople(db);
  const byId = new Map(persons.map(p => [p.person_id, p]));
  const routeRows = ordered(rows(db, 'SELECT * FROM atlas_identity_route ORDER BY ordinal'));
  const routes = new Map(), urls = new Set();
  for (const p of routeRows) {
    const person = byId.get(p.person_id);
    if (!person || routes.has(p.person_id) || urls.has(person.public_route) || !/^\/people\/person-\d{4}$/u.test(person.public_route)) fail('E_ATLAS_PERSON_ROUTE', p.person_id);
    routes.set(p.person_id, { name: person.name, detailRoute: person.public_route }); urls.add(person.public_route);
  }
  if (routes.size !== registry.totalPeople || people.length !== registry.totalPeople || candidates.totalPeople !== registry.totalPeople
    || candidates.existingK.length !== c.existing_k_count || candidates.candidates.length !== c.candidate_count || candidates.NOTES.length !== c.note_count) fail('E_ATLAS_IDENTITY_COVERAGE', 'context');
  return { registry, candidates, people, routes };
}

async function pgRows(db, sql, ...args) {
  try { return await db.all(sql, args); }
  catch (cause) {
    if (['42P01', '42703'].includes(cause.code)) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', cause.message);
    throw cause;
  }
}
async function typedPeopleAsync(db) {
  const axes = ordered(await pgRows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM wiki.value_axis ORDER BY axis_ordinal'));
  const desires = ordered(await pgRows(db, 'SELECT axis_name,axis_ordinal AS ordinal,value_kind FROM wiki.desire_axis ORDER BY axis_ordinal'));
  if (axes.length !== 10 || desires.length !== 7) fail('E_ATLAS_IDENTITY_COVERAGE', 'axis dictionaries');
  const values = await pgRows(db, 'SELECT person_id,axis_name,value FROM wiki.person_value');
  const wants = await pgRows(db, 'SELECT person_id,axis_name,value_kind,integer_value,text_value FROM wiki.person_desire');
  const persons = ordered(await pgRows(db, 'SELECT *,values_source_ordinal AS ordinal FROM wiki.person ORDER BY values_source_ordinal'));
  if (values.length !== persons.length * axes.length || wants.length !== persons.length * desires.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'values/desires');
  const byPerson = records => {
    const result = new Map();
    for (const row of records) { if (!result.has(row.person_id)) result.set(row.person_id, new Map()); result.get(row.person_id).set(row.axis_name, row); }
    return result;
  };
  const valueMap = byPerson(values), desireMap = byPerson(wants);
  const people = persons.map(p => {
    const axisRecord = (dictionary, record, desire = false) => Object.fromEntries(dictionary.map(a => {
      const v = record?.get(a.axis_name);
      if (!v || (desire && v.value_kind !== a.value_kind)) fail('E_ATLAS_IDENTITY_COVERAGE', p.person_id);
      return [a.axis_name, desire ? v.value_kind === 'integer' ? v.integer_value : v.text_value : v.value];
    }));
    return {
      name: p.name, title: p.title, stage: p.stage, state: p.state_id, state_name: p.state_name,
      generation: p.generation, source: p.source_kind, minors: Boolean(p.minors),
      values: axisRecord(axes, valueMap.get(p.person_id)), desire: axisRecord(desires, desireMap.get(p.person_id), true),
      ...(p.locked === null ? {} : { locked: Boolean(p.locked) })
    };
  });
  return { persons, people };
}
async function typedRegistryAsync(db, sourceId, roster) {
  const metadata = await db.get('SELECT * FROM wiki.identity_registry_provenance WHERE source_id=?', [sourceId]);
  if (!metadata) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'registry provenance');
  const aliases = await pgRows(db, 'SELECT person_id,alias,alias_ordinal AS ordinal FROM wiki.person_alias ORDER BY person_id,alias_ordinal');
  const people = new Map((await pgRows(db, 'SELECT person_id,name FROM wiki.person')).map(p => [p.person_id, p.name]));
  const persons = ordered(roster).map(p => {
    if (!people.has(p.person_id)) fail('E_ATLAS_IDENTITY_COVERAGE', p.person_id);
    const names = ordered(aliases.filter(a => a.person_id === p.person_id)).map(a => a.alias);
    if (!p.has_aliases && names.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'alias presence');
    return { id: p.person_id, name: people.get(p.person_id), ...(p.has_aliases ? { aliases: names } : {}) };
  });
  if (persons.length !== people.size || persons.length !== metadata.total_people) fail('E_ATLAS_IDENTITY_COVERAGE', 'registry roster');
  return {
    schema: metadata.schema_name, approvalRef: {
      approvedBy: metadata.approved_by, approvedAt: metadata.approved_at,
      ownerRef: metadata.owner_ref, inputSha256: metadata.input_sha256, candidatesSha256: metadata.candidates_sha256
    },
    totalPeople: metadata.total_people, existingKCount: metadata.existing_k_count, issuedCount: metadata.issued_count, persons
  };
}
async function sourceAsync(db, kind) {
  const record = await db.get('SELECT source_id,sha256 FROM wiki.source_file WHERE logical_path=?', [paths[kind]]);
  if (!record) fail('E_ATLAS_IDENTITY_MISSING', paths[kind]);
  return record;
}
export async function readAtlasValuesDocumentAsync(db) {
  const context = await readAtlasIdentityAsync(db);
  const metadata = await pgRows(db, 'SELECT * FROM wiki.atlas_identity_values_metadata');
  if (metadata.length !== 1 || metadata[0].person_count !== context.people.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'values metadata');
  return {
    schema: metadata[0].schema_name, note: metadata[0].note,
    axes: ordered(await pgRows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM wiki.value_axis ORDER BY axis_ordinal')).map(row => row.axis_name),
    desire_axes: ordered(await pgRows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM wiki.desire_axis ORDER BY axis_ordinal')).map(row => row.axis_name).filter(name => !['지향', '결합'].includes(name)),
    count: metadata[0].person_count, people: context.people
  };
}

/** Async PostgreSQL twin of readAtlasIdentity: preloads the same typed rows
 * from wiki.* inside the caller's read-only transaction, then runs the
 * unchanged synchronous reconstruction against a query-sheet view of them so
 * validation and shape stay identical. */
export async function readAtlasIdentityAsync(tx) {
  // Fully explicit PostgreSQL execution of the same SQL the synchronous
  // reader issues, materialized up-front so the unchanged synchronous
  // reconstruction (with every ordered()/coverage/stale validation) runs
  // against real PostgreSQL rows. No SQL is reimplemented: WHERE params,
  // ORDER BY and SELECT aliases all come from PostgreSQL itself.
  const rewrite = (sql) => sql.replace(/\b(FROM|JOIN)\s+((?!wiki\.)[a-z_][a-z_0-9]*)/gi, '$1 wiki.$2');
  const preloaded = new Map();
  const load = async (sql, params = []) => {
    const key = sql + JSON.stringify(params);
    if (!preloaded.has(key)) {
      const rows = await tx.all(rewrite(sql), params);
      preloaded.set(key, rows.map(row => ({ ...row })));
    }
    return preloaded.get(key);
  };
  // Bootstrap: bindings first so source ids resolve dynamically.
  await load('SELECT singleton FROM atlas_identity_seal');
  const bindings = await load('SELECT kind,source_id,sha256 FROM atlas_identity_binding');
  const sources = new Map();
  for (const path of Object.values(paths)) {
    sources.set(path, (await load('SELECT source_id,sha256 FROM source_file WHERE logical_path=?', [path]))[0]);
  }
  const registryId = bindings.find(b => b.kind === 'registry')?.source_id;
  // Statement set issued by the sync reconstruction, in call order.
  await load('SELECT * FROM identity_registry_provenance WHERE source_id=?', [registryId]);
  await load('SELECT person_id,alias,alias_ordinal AS ordinal FROM person_alias ORDER BY person_id,alias_ordinal');
  await load('SELECT person_id,name FROM person');
  await load('SELECT * FROM atlas_identity_registry_person ORDER BY ordinal');
  await load('SELECT * FROM atlas_identity_candidate_metadata WHERE singleton=1');
  await load('SELECT * FROM atlas_identity_existing_k ORDER BY ordinal');
  await load('SELECT * FROM atlas_identity_candidate ORDER BY position');
  await load('SELECT * FROM atlas_identity_note ORDER BY ordinal');
  await load('SELECT axis_name,axis_ordinal AS ordinal FROM value_axis ORDER BY axis_ordinal');
  await load('SELECT axis_name,axis_ordinal AS ordinal,value_kind FROM desire_axis ORDER BY axis_ordinal');
  await load('SELECT person_id,axis_name,value FROM person_value');
  await load('SELECT person_id,axis_name,value_kind,integer_value,text_value FROM person_desire');
  await load('SELECT *,values_source_ordinal AS ordinal FROM person ORDER BY values_source_ordinal');
  await load('SELECT * FROM atlas_identity_route ORDER BY ordinal');
  await load('SELECT * FROM atlas_identity_values_metadata');
  const served = (sql, params = []) => {
    const key = sql + JSON.stringify(params);
    if (!preloaded.has(key)) throw new Error('E_ATLAS_ASYNC_STATEMENT_UNMATERIALIZED:' + sql);
    return preloaded.get(key);
  };
  const sheet = { prepare(sql) {
    return { all: (...params) => served(sql, params), get: (...params) => served(sql, params)[0] };
  } };
  return readAtlasIdentity(sheet);
}
