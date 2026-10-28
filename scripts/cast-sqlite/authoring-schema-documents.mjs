import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openReadOnly } from './db.mjs';

export function readCanonicalAuthoringSchemas() {
  const db = openReadOnly(fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url)));
  try {
    return readAuthoringSchemaDocuments(db);
  } finally { db.close(); }
}

export const AUTHORING_SCHEMA_PATHS = Object.freeze([
  "lore/ailments/authoring.schema.json",
  "lore/authoring.atlas.schema.json",
  "lore/authoring.schema.json",
  "lore/authoring.shared.schema.json",
  "lore/bestiary/authoring.schema.json",
  "lore/characters/authoring.schema.json",
  "lore/chronology/authoring.schema.json",
  "lore/culture/authoring.schema.json",
  "lore/economy/authoring.schema.json",
  "lore/editorial/Naming-Ledger.schema.json",
  "lore/editorial/authoring.schema.json",
  "lore/factions/authoring.schema.json",
  "lore/goods/authoring.schema.json",
  "lore/name-pools/authoring.schema.json",
  "lore/offices/authoring.schema.json",
  "lore/overview/authoring.schema.json",
  "lore/people-and-machines/authoring.schema.json",
  "lore/places/authoring.schema.json",
  "lore/regions/authoring.schema.json",
  "lore/structures/authoring.schema.json",
  "lore/technology/authoring.schema.json",
]);
const SCALARS = Object.freeze({"$schema":"schema_uri","$id":"schema_identifier","$ref":"reference","title":"title","description":"description","pattern":"pattern","format":"format","minLength":"min_length","minItems":"min_items","maxItems":"max_items","minProperties":"min_properties","minimum":"minimum","maximum":"maximum","uniqueItems":"unique_items","deprecated":"deprecated"});
const SINGLE = Object.freeze({"items":"items_schema","additionalProperties":"additional_properties_schema","if":"if_schema","then":"then_schema","else":"else_schema","not":"not_schema"});
const MAPS = Object.freeze({"properties":"property","$defs":"definition","patternProperties":"pattern_property"});
const LISTS = Object.freeze({"allOf":"all_of","anyOf":"any_of","oneOf":"one_of","prefixItems":"prefix_item"});
const PATHS = AUTHORING_SCHEMA_PATHS;
const RELATIONS = [...Object.values(MAPS), ...Object.values(LISTS), 'required', 'type', 'enum', 'const'];
const TABLES = ['node', 'keyword_order', ...RELATIONS];
const KEYS = [...Object.keys(SCALARS), ...Object.keys(SINGLE), ...Object.keys(MAPS), ...Object.keys(LISTS), 'type', 'required', 'enum', 'const'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_AUTHORING_SCHEMA_DOCUMENT: ' + detail), { code: 'E_AUTHORING_SCHEMA_DOCUMENT' }); };
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const exact = (v, keys) => plain(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));

// Every row describes a JSON Schema concept. Only keyword order is structural metadata.
function mapDocument(logical_path, document) {
  const rows = Object.fromEntries(TABLES.map(t => [t, []]));
  let next = 0;
  const scalar = (value, node_id, ordinal) => {
    const kind = value === null ? 'null' : typeof value;
    if (!['null', 'string', 'number', 'boolean'].includes(kind) || (kind === 'number' && !Number.isFinite(value))) fail('scalar literal');
    return { logical_path, node_id, ordinal, value_kind: kind, text_value: kind === 'string' ? value : null, number_value: kind === 'number' ? value : null, boolean_value: kind === 'boolean' ? Number(value) : null };
  };
  const visit = schema => {
    if (typeof schema !== 'boolean' && !plain(schema)) fail('schema shape');
    const node_id = next++;
    const row = { logical_path, node_id, boolean_schema: typeof schema === 'boolean' ? Number(schema) : null, ...Object.fromEntries(Object.values(SCALARS).map(c => [c, null])), type_is_array: null, ...Object.fromEntries(Object.values(SINGLE).map(c => [c, null])) };
    rows.node.push(row);
    if (typeof schema === 'boolean') return node_id;
    for (const [ordinal, keyword] of Object.keys(schema).entries()) {
      if (!KEYS.includes(keyword)) fail('unsupported keyword ' + keyword);
      const value = schema[keyword];
      rows.keyword_order.push({ logical_path, node_id, ordinal, keyword });
      if (Object.hasOwn(SCALARS, keyword)) {
        const numeric = ['minLength','minItems','maxItems','minProperties','minimum','maximum'].includes(keyword);
        const flag = ['uniqueItems','deprecated'].includes(keyword);
        if (flag ? typeof value !== 'boolean' : numeric ? !Number.isFinite(value) || (!['minimum','maximum'].includes(keyword) && (!Number.isSafeInteger(value) || value < 0)) : typeof value !== 'string') fail('keyword shape ' + keyword);
        row[SCALARS[keyword]] = flag ? Number(value) : value;
      } else if (Object.hasOwn(SINGLE, keyword)) row[SINGLE[keyword]] = visit(value);
      else if (Object.hasOwn(MAPS, keyword)) {
        if (!plain(value)) fail('schema map ' + keyword);
        Object.entries(value).forEach(([name, child], ordinal) => rows[MAPS[keyword]].push({ logical_path, node_id, ordinal, name, child_id: visit(child) }));
      } else if (Object.hasOwn(LISTS, keyword)) {
        if (!Array.isArray(value) || value.length === 0) fail('schema list ' + keyword);
        value.forEach((child, ordinal) => rows[LISTS[keyword]].push({ logical_path, node_id, ordinal, child_id: visit(child) }));
      } else if (keyword === 'const') rows.const.push(scalar(value, node_id, 0));
      else {
        const values = keyword === 'type' && typeof value === 'string' ? [value] : value;
        if (!Array.isArray(values) || (keyword !== 'required' && values.length === 0)) fail('keyword list ' + keyword);
        if (keyword === 'type') row.type_is_array = Number(Array.isArray(value));
        values.forEach((entry, ordinal) => {
          if (keyword === 'enum') rows.enum.push(scalar(entry, node_id, ordinal));
          else {
            if (typeof entry !== 'string' || (keyword === 'type' && !['object','array','string','number','integer','boolean','null'].includes(entry))) fail('keyword entry ' + keyword);
            rows[keyword].push({ logical_path, node_id, ordinal, name: entry });
          }
        });
      }
    }
    return node_id;
  };
  visit(document);
  return rows;
}

function ordered(rows) {
  rows.sort((a,b) => a.ordinal-b.ordinal);
  if (rows.some((r,i) => r.ordinal !== i)) fail('ordinal gap');
  return rows;
}
const normalized = rows => rows.map(r => JSON.stringify(r)).sort();
function restore(logicalPath, all) {
  const rows = Object.fromEntries(TABLES.map(t => [t, all[t].filter(r => r.logical_path === logicalPath)]));
  const nodes = new Map(rows.node.map(r => [r.node_id, r]));
  const visited = new Set();
  const children = (t,id) => ordered(rows[t].filter(r => r.node_id === id));
  const literal = r => {
    if (!r || !['string','number','boolean','null'].includes(r.value_kind)) fail('literal shape');
    return r.value_kind === 'null' ? null : r.value_kind === 'string' ? r.text_value : r.value_kind === 'number' ? r.number_value : Boolean(r.boolean_value);
  };
  const visit = id => {
    if (!nodes.has(id) || visited.has(id)) fail('missing, repeated, or cyclic schema');
    visited.add(id);
    const row = nodes.get(id);
    if (row.boolean_schema !== null) return Boolean(row.boolean_schema);
    const result = {};
    for (const {keyword} of children('keyword_order', id)) {
      let value;
      if (Object.hasOwn(SCALARS,keyword)) value = ['uniqueItems','deprecated'].includes(keyword) ? Boolean(row[SCALARS[keyword]]) : row[SCALARS[keyword]];
      else if (Object.hasOwn(SINGLE,keyword)) value = visit(row[SINGLE[keyword]]);
      else if (Object.hasOwn(MAPS,keyword)) value = Object.fromEntries(children(MAPS[keyword],id).map(r => [r.name,visit(r.child_id)]));
      else if (Object.hasOwn(LISTS,keyword)) value = children(LISTS[keyword],id).map(r => visit(r.child_id));
      else if (keyword === 'const') value = literal(children('const',id)[0]);
      else if (keyword === 'enum') value = children('enum',id).map(literal);
      else if (keyword === 'required' || keyword === 'type') {
        value = children(keyword,id).map(r => r.name);
        if (keyword === 'type' && row.type_is_array === 0) value = value[0];
      } else fail('unknown keyword');
      Object.defineProperty(result,keyword,{value,enumerable:true,writable:true,configurable:true});
    }
    return result;
  };
  const result = visit(0);
  const remapped = mapDocument(logicalPath,result);
  for (const t of TABLES) if (JSON.stringify(normalized(rows[t])) !== JSON.stringify(normalized(remapped[t]))) fail('noncanonical rows ' + t);
  return result;
}

/** Runtime is SELECT-only; no source access or JSON parser is used. All 21 documents
 * are checked so unrelated extra rows cannot hide outside the requested document. */
export function readAuthoringSchemaDocument(db, options) {
  if (!exact(options,['logicalPath']) || !AUTHORING_SCHEMA_PATHS.includes(options.logicalPath)) fail('read path');
  return readAuthoringSchemaDocuments(db)[options.logicalPath];
}

export function readAuthoringSchemaDocuments(db) {
  try {
    const receipts = db.prepare('SELECT * FROM authoring_schema_receipt ORDER BY logical_path').all();
    if (receipts.length !== PATHS.length || receipts.some((r,i) => r.logical_path !== PATHS[i] || typeof r.actor !== 'string' || !r.actor.trim() || typeof r.reason !== 'string' || !r.reason.trim())) fail('receipt');
    const all = Object.fromEntries(TABLES.map(t => [t,db.prepare('SELECT * FROM authoring_schema_' + t).all()]));
    for (const t of TABLES) if (all[t].some(r => !AUTHORING_SCHEMA_PATHS.includes(r.logical_path))) fail('extra source row');
    return Object.fromEntries(PATHS.map(p => [p, restore(p, all)]));
  } catch (error) { if (error.code === 'E_AUTHORING_SCHEMA_DOCUMENT') throw error; fail(error.message); }
}

export function initializeAuthoringSchemaDocuments(db, options) {
  let started = false;
  try {
    if (!exact(options,['schemaSql','sources','actor','reason']) || typeof options.schemaSql !== 'string' || !options.schemaSql.trim() || !exact(options.sources,PATHS) || ![options.actor,options.reason].every(v => typeof v === 'string' && v.trim())) fail('initialization options');
    const documents = {};
    for (const p of PATHS) {
      const source = options.sources[p];
      if (!exact(source,['bytes']) || !(source.bytes instanceof Uint8Array)) fail('source bytes ' + p);
      const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(source.bytes));
      mapDocument(p,document);
      documents[p] = document;
    }
    db.exec('SAVEPOINT authoring_schema_initialize'); started = true;
    db.exec(options.schemaSql);
    for (const p of PATHS) {
      db.prepare('INSERT INTO authoring_schema_receipt VALUES (?,?,?,?,?)').run(p,hash(options.sources[p].bytes),hash(JSON.stringify(documents[p])),options.actor,options.reason);
      const rows = mapDocument(p,documents[p]);
      for (const t of TABLES) for (const row of rows[t]) {
        const columns = Object.keys(row);
        db.prepare('INSERT INTO authoring_schema_' + t + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...Object.values(row));
      }
    }
    readAuthoringSchemaDocument(db,{logicalPath:PATHS[0]});
    const counts = Object.fromEntries(['receipt',...TABLES].map(t => ['authoring_schema_' + t,db.prepare('SELECT count(*) AS n FROM authoring_schema_' + t).get().n]));
    db.exec('RELEASE authoring_schema_initialize'); started = false;
    return { documents: PATHS.length, counts, totalRows: Object.values(counts).reduce((a,b) => a+b,0) };
  } catch (error) {
    if (started) { db.exec('ROLLBACK TO authoring_schema_initialize'); db.exec('RELEASE authoring_schema_initialize'); }
    if (error.code === 'E_AUTHORING_SCHEMA_DOCUMENT') throw error; fail(error.message);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(readCanonicalAuthoringSchemas()));
}
