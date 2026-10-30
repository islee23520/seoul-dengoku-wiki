import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { currentFeudalAllocation, currentFeudalAllocationAsync } from './cia-current-rights.mjs';
import { readCurrentDataSource, readCurrentDataSourceAsync } from './data-source-editor.mjs';
import { readLegacyRowOrder } from './legacy-row-order.mjs';

const logicalPath = 'lore/relations/opening-feudal-allocation.json';
const fail = detail => { throw Object.assign(new Error(`E_FEUDAL_ALLOCATION_INPUT: ${detail}`), { code: 'E_FEUDAL_ALLOCATION_INPUT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(value));
const tables = ['context_feudal_title', 'context_feudal_jurisdiction', 'context_feudal_grant',
 'context_feudal_grant_admin', 'context_feudal_grant_component', 'context_feudal_binding',
 'context_political_identity', 'context_political_identity_liege'];
const rightsTables = ['context_rights_approval', 'context_rights_original_source', 'context_rights_transition'];
const boolean = value => value === null ? null : Boolean(value);

function domains(db) {
 // Include complete tables, including the currently empty component domain.
 // Approvals and transitions authenticate rights; none are duplicated as facts.
 return Object.fromEntries([...tables, ...rightsTables].map(table =>
  [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
}

function candidate(db, data, sourceId, approved) {
 return candidateFromRows(data, sourceId, approved, db.prepare('SELECT * FROM feudal_allocation_input_root').all());
}

function candidateFromRows(data, sourceId, approved, roots) {
 const used = new Set();
 const rows = (table, filter = () => true) => data[table].filter(filter).sort((a, b) =>
  (a.ordinal ?? Number(a.json_pointer.split('/').at(-1))) - (b.ordinal ?? Number(b.json_pointer.split('/').at(-1))))
  .map(row => { if (row.source_id !== sourceId) fail(`${table}:source`); used.add(row); return row; });
 const ordered = (table, path) => rows(table).map((r, i) => {
  if (!approved && r.json_pointer !== `/${path}/${i}`) fail(`${table}:order`);
  return r;
 }).sort((a, b) => {
  if (!approved) return 0;
  const key = path === 'titles' ? 'title_id' : path === 'grants' ? 'grant_id' : path === 'politicalIdentities' ? 'identity_id' : 'holding_id';
  const identity = path === 'existingTitleBindings' ? 'holdingId' : 'id';
  const index = row => approved[path].findIndex(value => value[identity] === row[key]);
  if (index(a) < 0 || index(b) < 0) fail(`${table}:approved identity`);
  return index(a) - index(b);
 });
 const child = (table, id, key, path) => rows(table, r => r[key] === id).map((r, i) => {
  if (r.ordinal !== i || r.json_pointer !== `${path}/${i}`) fail(`${table}:child order`);
  return r;
 });
 if (roots.length !== 1) fail('root metadata');
 const result = {
  schema: roots[0].source_schema, openingYear: roots[0].opening_year,
  titles: ordered('context_feudal_title', 'titles').map(r => ({
   id: r.title_id, name: r.name, rank: r.rank, holderPersonId: r.holder_person_id, stateId: r.polity_id,
   parentTitleId: r.parent_title_id, geographicTitleId: r.geographic_title_id,
   geographicParentTitleId: r.geographic_parent_title_id, politicalParentTitleId: r.political_parent_title_id,
   personalLiegePersonId: r.personal_liege_person_id, kind: r.kind, directOwnership: boolean(r.direct_ownership),
   jurisdictionRefs: child('context_feudal_jurisdiction', r.title_id, 'title_id', `${r.json_pointer}/jurisdictionRefs`).map(c => c.admin_unit_id),
   basis: r.basis,
  })),
  grants: ordered('context_feudal_grant', 'grants').map(r => ({
   id: r.grant_id, name: { ko: r.name_ko, en: r.name_en }, holderPersonId: r.holder_person_id,
   directLiegePersonId: r.liege_person_id, stateId: r.polity_id,
   adminRefs: child('context_feudal_grant_admin', r.grant_id, 'grant_id', `${r.json_pointer}/adminRefs`).map(c => ({ id: c.admin_unit_id, name: c.admin_unit_name })),
   componentRefs: child('context_feudal_grant_component', r.grant_id, 'grant_id', `${r.json_pointer}/componentRefs`).map(c => ({ unitId: c.admin_unit_id, componentIndex: c.component_index })),
   titleId: r.title_id, geometrySource: r.geometry_source, territorialScale: r.territorial_scale, formalTitleRank: r.formal_title_rank,
  })),
  existingTitleBindings: ordered('context_feudal_binding', 'existingTitleBindings').map(r => ({
   holdingId: r.holding_id, titleId: r.title_id, liegeRelationshipKind: r.liege_relationship_kind, basis: r.basis,
  })),
  politicalIdentities: ordered('context_political_identity', 'politicalIdentities').map(r => ({
   id: r.identity_id, kind: r.kind, rank: r.rank, holderPersonId: r.holder_person_id, stateId: r.polity_id,
   politicalParentTitleId: r.political_parent_title_id,
   personalLieges: child('context_political_identity_liege', r.identity_id, 'identity_id', `${r.json_pointer}/personalLieges`).map(c => ({ holdingId: c.historical_holding_id, directLiegePersonId: c.liege_person_id })),
   directOwnership: boolean(r.direct_ownership),
  })),
 };
 if (tables.some(t => data[t].some(r => !used.has(r)))) fail('unconsumed typed rows');
 return result;
}

function orderedDocument(db, value) {
 return orderedDocumentFromRows(value, db.prepare('SELECT * FROM feudal_allocation_input_key ORDER BY object_path,ordinal').all());
}

function orderedDocumentFromRows(value, keyRows) {
 const groups = new Map();
 for (const r of keyRows) {
  if (!groups.has(r.object_path)) groups.set(r.object_path, []);
  groups.get(r.object_path).push(r);
 }
 const visit = (v, path) => {
  if (Array.isArray(v)) return v.map((child, i) => visit(child, `${path}/${i}`));
  if (v === null || typeof v !== 'object') return v;
  const keys = groups.get(path);
  if (!keys) fail(`${path}:missing keys`);
  groups.delete(path);
  return Object.fromEntries(keys.map((r, i) => {
   if (r.ordinal !== i || !Object.hasOwn(v, r.key) || v[r.key] === undefined || ![0, 1].includes(r.is_null)
    || Boolean(r.is_null) !== (v[r.key] === null)) fail(`${path}:${r.key}:presence`);
   return [r.key, visit(v[r.key], `${path}/${r.key}`)];
  }));
 };
 const result = visit(value, '');
 if (groups.size) fail('unconsumed keys');
 return result;
}

function present(value, shape) {
 if (Array.isArray(shape)) {
  if (!Array.isArray(value) || value.length !== shape.length) fail('approved array coverage');
  return value.map((row, i) => present(row, shape[i]));
 }
 if (shape === null || typeof shape !== 'object') return value;
 if (!value || typeof value !== 'object') fail('approved object');
 for (const key of Object.keys(value)) if (!Object.hasOwn(shape, key)
  && value[key] !== null && !(Array.isArray(value[key]) && value[key].length === 0)) fail('unapproved typed field');
 return Object.fromEntries(Object.keys(shape).map(key => [key, present(value[key], shape[key])]));
}

// SELECT-only runtime. No source file, archive record, JSON parsing or migration.
export function readFeudalAllocationInputs(db, { predecessor = false } = {}) {
 try {
  const receipts = db.prepare('SELECT * FROM feudal_allocation_input_import').all();
  if (receipts.length !== 1
  ) fail('source receipt');
  const m = receipts[0], data = domains(db);
  if (db.prepare("SELECT name FROM sqlite_schema WHERE name='data_source_head'").get()
   && db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(logicalPath)) {
   const approved = readCurrentDataSource(db, logicalPath);
   const typed = candidate(db, data, m.source_id, approved);
   const result = present(typed, approved);
   if (!isDeepStrictEqual(result, approved)) fail('approved revision projection');
   return predecessor ? result : currentFeudalAllocation(db, result);
  }
  if (digest(data) !== m.domain_sha256) fail('typed domain digest');
  const result = orderedDocument(db, candidate(db, data, m.source_id));
  if (digest(result) !== m.document_sha256) fail('document digest');
  return predecessor ? result : currentFeudalAllocation(db, result);
 } catch (error) { if (error.code === 'E_FEUDAL_ALLOCATION_INPUT') throw error; fail(error.message); }
}

export async function readFeudalAllocationInputsAsync(tx, { predecessor = false } = {}) {
 try {
  const receipts = await tx.all('SELECT * FROM wiki.feudal_allocation_input_import');
  if (receipts.length !== 1) fail('source receipt');
  const m = receipts[0];
  const exists = await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='data_source_head'");
  const edited = exists && await tx.get('SELECT revision_id FROM wiki.data_source_head WHERE source_path=?', [logicalPath]);
  if (edited) {
   const data = Object.fromEntries(await Promise.all(tables.map(async table =>
    [table, await tx.all(`SELECT * FROM wiki.${table}`)])));
   const approved = await readCurrentDataSourceAsync(tx, logicalPath);
   const roots = await tx.all('SELECT * FROM wiki.feudal_allocation_input_root');
   const result = present(candidateFromRows(data, m.source_id, approved, roots), approved);
   if (!isDeepStrictEqual(result, approved)) fail('approved revision projection');
   return predecessor ? result : await currentFeudalAllocationAsync(tx, result);
  }
  const data = Object.fromEntries(await Promise.all([...tables, ...rightsTables].map(async table =>
   [table, await readLegacyRowOrder(tx, table)])));
  if (digest(data) !== m.domain_sha256) fail('typed domain digest');
  const roots = await tx.all('SELECT * FROM wiki.feudal_allocation_input_root');
  const keys = await tx.all('SELECT * FROM wiki.feudal_allocation_input_key ORDER BY object_path,ordinal');
  const result = orderedDocumentFromRows(candidateFromRows(data, m.source_id, undefined, roots), keys);
  if (digest(result) !== m.document_sha256) fail('document digest');
  return predecessor ? result : await currentFeudalAllocationAsync(tx, result);
 } catch (error) { if (error.code === 'E_FEUDAL_ALLOCATION_INPUT') throw error; fail(error.message); }
}

// One-time admission on a disposable writable copy. Existing rows are untouched.
export async function initializeFeudalAllocationInputs(db, { sourceBytes, actor, reason } = {}) {
 if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
 const expectedSourceHash = hash(sourceBytes);
 if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
 if (db.isTransaction) fail('active transaction');
 const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
 const identity = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').all(logicalPath);
 if (identity.length !== 1 || identity[0].sha256 !== expectedSourceHash) fail('source identity');
 const { readFile } = await import('node:fs/promises');
 const schema = await readFile(new URL('./feudal-allocation-inputs.sql', import.meta.url), 'utf8');
 db.exec('BEGIN IMMEDIATE');
 try {
  db.exec(schema);
  const addKey = db.prepare('INSERT INTO feudal_allocation_input_key VALUES(?,?,?,?)');
  const walk = (v, path) => {
   if (Array.isArray(v)) { v.forEach((child, i) => walk(child, `${path}/${i}`)); return; }
   if (v === null || typeof v !== 'object') return;
   Object.entries(v).forEach(([key, child], ordinal) => {
    addKey.run(path, ordinal, key, Number(child === null)); walk(child, `${path}/${key}`);
   });
  };
  walk(document, '');
  db.prepare('INSERT INTO feudal_allocation_input_root VALUES(1,?,?)').run(document.schema, document.openingYear);
  db.prepare('INSERT INTO feudal_allocation_input_import VALUES(1,?,?,?,?,?,?)').run(
   identity[0].source_id, expectedSourceHash, digest(document), digest(domains(db)), actor, reason);
  const actual = readFeudalAllocationInputs(db);
  if (!isDeepStrictEqual(actual, document) || JSON.stringify(actual) !== JSON.stringify(document)) fail('source parity');
  db.exec('COMMIT');
  return actual;
 } catch (error) { db.exec('ROLLBACK'); throw error; }
}
