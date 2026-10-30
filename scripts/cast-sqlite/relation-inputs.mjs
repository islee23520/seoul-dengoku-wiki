import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { withTransaction } from './db.mjs';
import { resolveRelations, resolveVassals } from '../../lore/relations/validate.mjs';

const logicalPath = 'lore/relations/relations.json';
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value !== null && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => hash(JSON.stringify(canonical(value)));

// Separate opt-in consumer while the approved legacy validator remains pinned.
// Callers supply complete typed envelopes and the archived-event ID list; this
// entry point never falls through to legacy files or environment auto-selection.
export function loadRelationDataset({ db, inputs, expectedSha256 } = {}) {
  if (!db) fail('E_RELATION_DATASET_INPUT', 'db');
  for (const key of ['stateSource', 'relationSource', 'castIndex', 'registry', 'values', 'chronicle', 'archivedEvents']) {
    if (!inputs || !Object.hasOwn(inputs, key)) fail('E_RELATION_DATASET_INPUT', key);
  }
  if (!Array.isArray(inputs.archivedEvents)) fail('E_RELATION_DATASET_INPUT', 'archivedEvents');
  const config = readRelationConfig(db, { expectedSha256 });
  return relationDataset(config, inputs);
}

export async function loadRelationDatasetAsync({ tx, inputs, expectedSha256 } = {}) {
  if (!tx) fail('E_RELATION_DATASET_INPUT', 'db');
  for (const key of ['stateSource', 'relationSource', 'castIndex', 'registry', 'values', 'chronicle', 'archivedEvents']) {
    if (!inputs || !Object.hasOwn(inputs, key)) fail('E_RELATION_DATASET_INPUT', key);
  }
  if (!Array.isArray(inputs.archivedEvents)) fail('E_RELATION_DATASET_INPUT', 'archivedEvents');
  return relationDataset(await readRelationConfigAsync(tx, { expectedSha256 }), inputs);
}

function relationDataset(config, inputs) {
  const { stateSource, relationSource, castIndex, registry, values, chronicle, archivedEvents } = inputs;
  const states = stateSource.content.find(block => block.kind === 'table' && block.anchor === 'table').rows.map(row => ({
    id: row[0].ko, name: row[1].ko.split('(')[0], tier: row[3].ko.split(',')[0], sourceAnchor: 'table',
  }));
  const { vassals, errors: vassalErrors } = resolveVassals(stateSource, states);
  const people = [...registry.persons, ...config.provisionalPeople];
  const { relations, errors: relationErrors } = resolveRelations(relationSource, people);
  const events = chronicle.content.filter(block => block.kind === 'paragraph').flatMap(block => {
    const match = /^(\d{4})년(?: (\d{1,2})월(?: (\d{1,2})일)?)?/.exec(block.text.ko);
    if (!match) return archivedEvents.includes(`E:${block.anchor}`) ? [{ id: `E:${block.anchor}`, date: null, sourceAnchor: block.anchor }] : [];
    const date = [match[1], match[2], match[3]].filter(Boolean).map((part, index) => index ? part.padStart(2, '0') : part).join('-');
    return [{ id: `E:${block.anchor}`, date, sourceAnchor: block.anchor }];
  });
  return {
    config, states, vassals, people, organizations: config.organizations,
    relations, relationErrors, vassalErrors, events, eventLinks: config.eventLinks,
    sources: { stateSource, relationSource, castIndex, registry, values, chronicle }
  };
}
function shape(value, fields, optional = '') {
  const required = fields.split(' ').filter(Boolean), allowed = [...required, ...optional.split(' ').filter(Boolean)];
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !allowed.includes(key))) fail('E_RELATION_INPUT_FIELDS', fields);
}
function scalars(value, fields, kind = 'string') {
  for (const key of fields.split(' ')) if (kind === 'number' ? !Number.isSafeInteger(value[key]) : typeof value[key] !== kind) fail('E_RELATION_INPUT_TYPE', key);
}
function collection(value, fields, optional = '', integers = '') {
  if (!Array.isArray(value)) fail('E_RELATION_INPUT_TYPE', 'array');
  value.forEach(row => {
    shape(row, fields, optional);
    for (const key of Object.keys(row)) scalars(row, key, integers.split(' ').includes(key) ? 'number' : 'string');
  });
}
function validateShape(config) {
  shape(config, 'schema note provisionalPeople courtContract ownerLieges courtMemberships courts directRetainers organizations eventLinks');
  scalars(config, 'schema note');
  collection(config.provisionalPeople, 'id name sourceAnchor');
  shape(config.courtContract, 'schema effectiveYear approvalRef courtIdContract sourcePath sourceAnchor');
  scalars(config.courtContract, 'schema approvalRef courtIdContract sourcePath sourceAnchor'); scalars(config.courtContract, 'effectiveYear', 'number');
  shape(config.ownerLieges, 'schema effectiveYear approvalRef note sourceBasis edges');
  scalars(config.ownerLieges, 'schema approvalRef note'); scalars(config.ownerLieges, 'effectiveYear', 'number');
  collection(config.ownerLieges.sourceBasis, 'path anchor quote');
  collection(config.ownerLieges.edges, 'personId liegePersonId relationKind ownerTerm');
  shape(config.courtMemberships, 'schema effectiveYear note courtApprovals memberships');
  scalars(config.courtMemberships, 'schema note'); scalars(config.courtMemberships, 'effectiveYear', 'number');
  collection(config.courtMemberships.courtApprovals, 'courtId approvalRef');
  collection(config.courtMemberships.memberships, 'personId courtId approvalRef');
  collection(config.courts, 'id ownerPersonId stateId');
  collection(config.directRetainers, 'personId liegePersonId courtId sourceRow', '', 'sourceRow');
  collection(config.organizations, 'id name sourceAnchor', 'stateId');
  collection(config.eventLinks, 'eventId personId', 'organizationId');
}
function rows(db, sql, ...args) {
  try { return db.prepare(sql).all(...args); }
  catch (cause) { if (/no such (table|column)/u.test(cause.message)) fail('E_RELATION_INPUT_SCHEMA_GAP', cause.message); throw cause; }
}
function source(db) {
  const found = rows(db, 'SELECT source_id,sha256,media_type FROM source_file WHERE logical_path=?', logicalPath);
  if (found.length !== 1) fail('E_RELATION_INPUT_MISSING', logicalPath);
  if (found[0].media_type !== 'application/json') fail('E_RELATION_INPUT_STALE', logicalPath);
  return found[0];
}

// Explicit migration of config fields absent from current-context.sql. Existing
// context rows remain the authority for courts, edges, sources and event links.
export function initializeRelationInputs(db, { approvedBytes, expectedSha256 }) {
  if (!(approvedBytes instanceof Uint8Array) || !/^[a-f0-9]{64}$/u.test(expectedSha256 ?? '') || hash(approvedBytes) !== expectedSha256) fail('E_RELATION_INPUT_HASH', logicalPath);
  const config = JSON.parse(Buffer.from(approvedBytes).toString('utf8'));
  validateShape(config);
  return withTransaction(db, () => {
    if (rows(db, "SELECT name FROM sqlite_schema WHERE name='relation_input_metadata'").length) fail('E_RELATION_INPUT_INITIALIZED', logicalPath);
    const identity = source(db);
    if (identity.sha256 !== expectedSha256) fail('E_RELATION_INPUT_STALE', logicalPath);
    db.exec(readFileSync(new URL('./relation-inputs.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO relation_input_metadata VALUES(1,?,?,?,?,?,?,?,?,?)').run(identity.source_id, expectedSha256, digest(config), config.schema, config.note,
      config.ownerLieges.note, config.courtMemberships.schema, config.courtMemberships.effectiveYear, config.courtMemberships.note);
    config.provisionalPeople.forEach((person, ordinal) => db.prepare('INSERT INTO relation_input_provisional_person VALUES(?,?,?,?)').run(ordinal, person.id, person.name, person.sourceAnchor));
    const actual = readRelationConfig(db);
    if (!isDeepStrictEqual(actual, config)) fail('E_RELATION_INPUT_AUTHORITY', logicalPath);
    for (const table of ['relation_input_metadata', 'relation_input_provisional_person']) for (const operation of ['INSERT', 'UPDATE', 'DELETE']) {
      db.exec(`CREATE TRIGGER ${table}_immutable_${operation} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'E_RELATION_INPUT_IMMUTABLE'); END`);
    }
    return actual;
  });
}

// Complete relations.json shape, using only named typed columns. The bounded
// config unit deliberately does not read document envelopes or atlas identity.
export function readRelationConfig(db, { expectedSha256 } = {}) {
  const metadata = rows(db, 'SELECT * FROM relation_input_metadata');
  if (metadata.length !== 1) fail('E_RELATION_INPUT_MISSING', 'metadata');
  const m = metadata[0], identity = source(db);
  if (identity.source_id !== m.source_id || identity.sha256 !== m.sha256 || (expectedSha256 !== undefined && expectedSha256 !== m.sha256)) fail('E_RELATION_INPUT_STALE', logicalPath);
  const ordered = (table, pointer) => {
    const records = rows(db, `SELECT * FROM ${table} WHERE source_id=?`, m.source_id).sort((a, b) => Number(a.json_pointer.split('/').at(-1)) - Number(b.json_pointer.split('/').at(-1)));
    if (records.some((row, index) => row.json_pointer !== `/${pointer}/${index}`)) fail('E_RELATION_INPUT_COVERAGE', table);
    return records;
  };
  const contracts = rows(db, 'SELECT * FROM context_relation_contract WHERE source_id=?', m.source_id);
  if (contracts.length !== 1 || contracts[0].contract_id !== 'court') fail('E_RELATION_INPUT_COVERAGE', 'court contract');
  const c = contracts[0], lieges = ordered('context_owner_liege', 'ownerLieges/edges');
  // This bounded source requires an owner edge so its common contract metadata
  // is represented in the existing authority rather than inferred from defaults.
  if (!lieges.length || lieges.some(row => row.source_schema !== lieges[0].source_schema || row.effective_year !== lieges[0].effective_year || row.approval_ref !== lieges[0].approval_ref)) fail('E_RELATION_INPUT_COVERAGE', 'owner contract');
  const provisional = rows(db, 'SELECT * FROM relation_input_provisional_person ORDER BY ordinal');
  if (provisional.some((row, i) => row.ordinal !== i)) fail('E_RELATION_INPUT_COVERAGE', 'provisional people');
  const config = {
    schema: m.schema_name, note: m.note,
    provisionalPeople: provisional.map(row => ({ id: row.person_id, name: row.name, sourceAnchor: row.source_anchor })),
    courtContract: { schema: c.source_schema, effectiveYear: c.effective_year, approvalRef: c.approval_ref, courtIdContract: c.court_id_contract, sourcePath: c.source_ref_path, sourceAnchor: c.source_ref_anchor },
    ownerLieges: {
      schema: lieges[0].source_schema, effectiveYear: lieges[0].effective_year, approvalRef: lieges[0].approval_ref, note: m.owner_note,
      sourceBasis: ordered('context_owner_liege_source_basis', 'ownerLieges/sourceBasis').map(row => ({ path: row.source_ref_path, anchor: row.source_ref_anchor, quote: row.source_quote })),
      edges: lieges.map(row => ({ personId: row.person_id, liegePersonId: row.liege_person_id, relationKind: row.relation_kind, ownerTerm: row.owner_term }))
    },
    courtMemberships: {
      schema: m.membership_schema, effectiveYear: m.membership_year, note: m.membership_note,
      courtApprovals: ordered('context_court_approval', 'courtMemberships/courtApprovals').map(row => ({ courtId: row.court_id, approvalRef: row.approval_ref })),
      memberships: ordered('context_court_membership', 'courtMemberships/memberships').map(row => ({ personId: row.person_id, courtId: row.court_id, approvalRef: row.approval_ref }))
    },
    courts: ordered('context_court', 'courts').map(row => ({ id: row.court_id, ownerPersonId: row.owner_person_id, stateId: row.polity_id })),
    directRetainers: ordered('context_direct_retainer', 'directRetainers').map(row => ({ personId: row.person_id, liegePersonId: row.liege_person_id, courtId: row.court_id, sourceRow: row.source_row })),
    organizations: ordered('context_organization', 'organizations').map(row => ({ id: row.organization_id, name: row.name, ...(row.polity_id === null ? {} : { stateId: row.polity_id }), sourceAnchor: row.source_anchor })),
    eventLinks: ordered('context_event_link', 'eventLinks').map(row => ({ eventId: row.event_id, personId: row.person_id, ...(row.organization_id === null ? {} : { organizationId: row.organization_id }) })),
  };
  validateShape(config);
  // A current editable head for relations.json supersedes the archived import digest.
  const edited = db.prepare("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'").get()
    && db.prepare("SELECT 1 FROM data_source_head WHERE source_path='lore/relations/relations.json'").get();
  if (edited) return config;
  if (digest(config) !== m.config_digest) fail('E_RELATION_INPUT_COVERAGE', 'config digest');
  return config;
}

// Materialize the same bounded queries against PostgreSQL, then share all
// reconstruction, coverage and digest validation with the synchronous reader.
export async function readRelationConfigAsync(tx, options = {}) {
  const loaded = new Map();
  const load = async (sql, pgSql, params = []) => {
    try {
      const result = await tx.all(pgSql, params);
      loaded.set(sql + JSON.stringify(params), result.map(row => ({ ...row })));
      return result;
    } catch (cause) {
      if (cause.code === '42P01' || cause.code === '42703') fail('E_RELATION_INPUT_SCHEMA_GAP', cause.message);
      throw cause;
    }
  };
  const metadata = await load('SELECT * FROM relation_input_metadata', 'SELECT * FROM wiki.relation_input_metadata');
  if (metadata.length !== 1) fail('E_RELATION_INPUT_MISSING', 'metadata');
  await load('SELECT source_id,sha256,media_type FROM source_file WHERE logical_path=?',
    'SELECT source_id,sha256,media_type FROM wiki.source_file WHERE logical_path=?', [logicalPath]);
  for (const table of ['context_relation_contract', 'context_owner_liege', 'context_owner_liege_source_basis',
    'context_court_approval', 'context_court_membership', 'context_court', 'context_direct_retainer',
    'context_organization', 'context_event_link']) {
    await load(`SELECT * FROM ${table} WHERE source_id=?`, `SELECT * FROM wiki.${table} WHERE source_id=?`, [metadata[0].source_id]);
  }
  await load('SELECT * FROM relation_input_provisional_person ORDER BY ordinal',
    'SELECT * FROM wiki.relation_input_provisional_person ORDER BY ordinal');
  const exists = await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='data_source_head'");
  loaded.set("SELECT 1 FROM sqlite_schema WHERE name='data_source_head'" + '[]', exists ? [exists] : []);
  if (exists) await load("SELECT 1 FROM data_source_head WHERE source_path='lore/relations/relations.json'",
    'SELECT 1 FROM wiki.data_source_head WHERE source_path=?', [logicalPath]);
  // The synchronous existence query embeds the path instead of binding it.
  if (exists) loaded.set("SELECT 1 FROM data_source_head WHERE source_path='lore/relations/relations.json'" + '[]',
    loaded.get("SELECT 1 FROM data_source_head WHERE source_path='lore/relations/relations.json'" + JSON.stringify([logicalPath])));
  const sheet = {
    prepare(sql) {
      return {
        all: (...params) => {
          const key = sql + JSON.stringify(params);
          if (!loaded.has(key)) throw new Error(`E_RELATION_ASYNC_STATEMENT_UNMATERIALIZED: ${sql}`);
          return loaded.get(key);
        },
        get: (...params) => {
          const key = sql + JSON.stringify(params);
          if (!loaded.has(key)) throw new Error(`E_RELATION_ASYNC_STATEMENT_UNMATERIALIZED: ${sql}`);
          return loaded.get(key)[0];
        },
      };
    }
  };
  return readRelationConfig(sheet, options);
}
