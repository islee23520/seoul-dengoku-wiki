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
    return { name: p.name, title: p.title, stage: p.stage, state: p.state_id, state_name: p.state_name,
      generation: p.generation, source: p.source_kind, minors: Boolean(p.minors),
      values: axisRecord(axes, valueMap.get(p.person_id)), desire: axisRecord(desires, desireMap.get(p.person_id), true),
      ...(p.locked === null ? {} : { locked: Boolean(p.locked) }) };
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
  return { schema: metadata.schema_name, approvalRef: { approvedBy: metadata.approved_by, approvedAt: metadata.approved_at,
    ownerRef: metadata.owner_ref, inputSha256: metadata.input_sha256, candidatesSha256: metadata.candidates_sha256 },
  totalPeople: metadata.total_people, existingKCount: metadata.existing_k_count, issuedCount: metadata.issued_count, persons };
}
function source(db, kind) {
  const record = rows(db, 'SELECT source_id,sha256 FROM source_file WHERE logical_path=?', paths[kind])[0];
  if (!record) fail('E_ATLAS_IDENTITY_MISSING', paths[kind]);
  return record;
}

/** Migration-only, explicit in-memory approved bytes; no filesystem source discovery. */
export function initializeAtlasIdentity(db, command) {
  shape(command, 'actor reason registry candidates values gurps'); strings(command, 'actor reason');
  if (!command.actor.trim() || !command.reason.trim()) fail('E_ATLAS_IDENTITY_PROVENANCE', 'actor/reason');
  const documents = {}, archives = {};
  for (const kind of Object.keys(paths)) {
    const input = command[kind]; shape(input, 'approvedBytes expectedSha256');
    if (!(input.approvedBytes instanceof Uint8Array) || !/^[a-f0-9]{64}$/u.test(input.expectedSha256) || hash(input.approvedBytes) !== input.expectedSha256) fail('E_ATLAS_IDENTITY_HASH', kind);
    archives[kind] = Buffer.from(input.approvedBytes);
    documents[kind] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(archives[kind]));
  }
  validate(documents.registry, documents.candidates, documents.values, documents.gurps);
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_ATLAS_IDENTITY_DATABASE', 'foreign keys required');
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='atlas_identity_archive'").get()) fail('E_ATLAS_IDENTITY_INITIALIZED', 'one-time migration');
    const sources = Object.fromEntries(['registry', 'values', 'gurps'].map(kind => {
      const row = source(db, kind);
      if (row.sha256 !== command[kind].expectedSha256) fail('E_ATLAS_IDENTITY_STALE', paths[kind]);
      return [kind, row];
    }));
    const registryRoster = documents.registry.persons.map((p, ordinal) => ({ ordinal, person_id: p.id, has_aliases: Number(Object.hasOwn(p, 'aliases')) }));
    const same = (a, b, detail) => { if (!isDeepStrictEqual(a, b)) fail('E_ATLAS_IDENTITY_AUTHORITY', detail); };
    same(typedRegistry(db, sources.registry.source_id, registryRoster), documents.registry, 'registry');
    const { persons, people } = typedPeople(db);
    same(people, documents.values.people, 'values');
    const byId = new Map(persons.map(p => [p.person_id, p]));
    if (documents.gurps.people.length !== persons.length || new Set(documents.gurps.people.map(p => p.id)).size !== persons.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'routes');
    for (const p of documents.gurps.people) {
      const typed = byId.get(p.id);
      if (!typed || typed.name !== p.name || typed.public_route !== p.url || !/^\/people\/person-\d{4}$/u.test(p.url)) fail('E_ATLAS_PERSON_ROUTE', p.id);
    }
    db.exec(readFileSync(new URL('./atlas-identity.sql', import.meta.url), 'utf8'));
    insert(db, 'atlas_identity_values_metadata', { singleton: 1, schema_name: documents.values.schema,
      note: documents.values.note, person_count: documents.values.count });
    for (const kind of Object.keys(paths)) {
      insert(db, 'atlas_identity_archive', { kind, logical_path: paths[kind], sha256: command[kind].expectedSha256, bytes: archives[kind], actor: command.actor, reason: command.reason });
      insert(db, 'atlas_identity_binding', { kind, source_id: sources[kind]?.source_id ?? null, sha256: command[kind].expectedSha256 });
    }
    registryRoster.forEach(p => insert(db, 'atlas_identity_registry_person', p));
    documents.gurps.people.forEach((p, ordinal) => insert(db, 'atlas_identity_route', { ordinal, person_id: p.id }));
    const c = documents.candidates;
    insert(db, 'atlas_identity_candidate_metadata', { singleton: 1, schema_name: c.schema, input_sha256: c.inputSha256, base_commit: c.baseCommit,
      total_people: c.totalPeople, existing_k_count: c.existingKCount, candidate_count: c.candidateCount, note_count: c.NOTES.length });
    c.existingK.forEach((p, ordinal) => insert(db, 'atlas_identity_existing_k', { ordinal, ...p }));
    c.candidates.forEach((p, position) => insert(db, 'atlas_identity_candidate', { position, ...p, locked: Number(p.locked) }));
    c.NOTES.forEach((p, ordinal) => insert(db, 'atlas_identity_note', { ordinal, ...p }));
    insert(db, 'atlas_identity_seal', { singleton: 1 });
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'atlas_identity_*'").all()) {
      for (const operation of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER ${name}_immutable_${operation} BEFORE ${operation} ON ${name} BEGIN SELECT RAISE(ABORT,'E_ATLAS_IDENTITY_IMMUTABLE'); END`);
    }
    return readAtlasIdentity(db);
  });
}

/** Complete atlas context, reconstructed exclusively from typed domain columns. */
export function readAtlasValuesDocument(db) {
  const context = readAtlasIdentity(db);
  const metadata = rows(db, 'SELECT * FROM atlas_identity_values_metadata');
  if (metadata.length !== 1 || metadata[0].person_count !== context.people.length) fail('E_ATLAS_IDENTITY_COVERAGE', 'values metadata');
  return { schema: metadata[0].schema_name, note: metadata[0].note,
    axes: ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM value_axis ORDER BY axis_ordinal')).map(row => row.axis_name),
    desire_axes: ordered(rows(db, 'SELECT axis_name,axis_ordinal AS ordinal FROM desire_axis ORDER BY axis_ordinal')).map(row => row.axis_name).filter(name => !['지향', '결합'].includes(name)),
    count: metadata[0].person_count, people: context.people };
}

export function readAtlasIdentity(db, { expectedSourceHashes } = {}) {
  if (rows(db, 'SELECT singleton FROM atlas_identity_seal').length !== 1) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'unsealed migration');
  const bindings = rows(db, 'SELECT kind,source_id,sha256 FROM atlas_identity_binding');
  if (bindings.length !== 4) fail('E_ATLAS_IDENTITY_SCHEMA_GAP', 'source bindings');
  for (const [kind, path] of Object.entries(paths)) {
    const binding = bindings.find(b => b.kind === kind);
    if (!binding) fail('E_ATLAS_IDENTITY_MISSING', path);
    if (expectedSourceHashes !== undefined && expectedSourceHashes[path] !== binding.sha256) fail('E_ATLAS_IDENTITY_STALE', path);
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
