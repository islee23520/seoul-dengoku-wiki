import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openReadOnly } from './db.mjs';

export function readCanonicalAuthoringSchemas() {
  const db = openReadOnly(fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url)));
  try {
    return readAuthoringSchemaDocuments(db);
  } finally { db.close(); }
}

export const AUTHORING_SCHEMA_SOURCE_HASHES = Object.freeze({
  "lore/ailments/authoring.schema.json": "a49890e3c3dab208d73d753bf0df12169ae258d82d1d0cf752cc991799447cea",
  "lore/authoring.atlas.schema.json": "7da09ef973524ba8487b80be362e883663e9dab430e1bf99032c7d4c3b217720",
  "lore/authoring.schema.json": "3afd20484d1bf4bc7315babf92b805b9d882b45fd9ae2a6db2d0d4d5b266d89a",
  "lore/authoring.shared.schema.json": "56b63116071988c0754ba98d6499ca2373e0287cff7d81165a81d4598558199a",
  "lore/bestiary/authoring.schema.json": "ab10567f2287ae34b1c8e73f4d29052dc8357ad1570f580232f6dc8c4bfbf3fa",
  "lore/characters/authoring.schema.json": "13c4a1ad3180c95d3c50751ddfc2cf51ca278fe5129975c3a1c672f868698383",
  "lore/chronology/authoring.schema.json": "a6caea542ad01c77eb55aed54bf02ef346aeaba6a40087eb187446948e67a357",
  "lore/culture/authoring.schema.json": "6d821b66772543122f7b42ffe7f1eed6e425a7621f88f3885d6d05c341ef87a3",
  "lore/economy/authoring.schema.json": "b1339e8123e8b626d8637103fd8300c1eaa074d416cf600b4efd4ab26ce5b8b3",
  "lore/editorial/Naming-Ledger.schema.json": "fb04480df587942e0e06e0a437d76db31495351cf9e14fb1f9e8b0cb18e24acb",
  "lore/editorial/authoring.schema.json": "ba241db145626907aa75c69d8766e3c225f799393fd6ad682a1938f972c30d51",
  "lore/factions/authoring.schema.json": "d12bfc4aa4c56eb7f6b1595d81333ddb3dbcca6f728d6a90d06f7caf9e147e71",
  "lore/goods/authoring.schema.json": "623f41ac3d03478d4cbc60c43ff4de698617a813e0e00ad915addc14ddbb4600",
  "lore/name-pools/authoring.schema.json": "665d862b819370fae8158f8dc8ab3012aa5c00b416733eedc701c82db6b66a07",
  "lore/offices/authoring.schema.json": "80a09058480a73b47c1bc8ed5834f1c77ed90ab3624697d3a2b9643a910fd5c4",
  "lore/overview/authoring.schema.json": "302690d5d4829f597f33567b484894136e5290f62fead00046e0f909c249ab58",
  "lore/people-and-machines/authoring.schema.json": "5f9a66a26d7222372c619db284f96f47fe7e693af26674d5c80054b72d2771d4",
  "lore/places/authoring.schema.json": "027e9c65e9e282ace8c05e72ef97bb9dc491c981cc672a13fe4ef2d9adda6b80",
  "lore/regions/authoring.schema.json": "7dea1af51cdb863bfa60ac77fc3a0929bd7b4dc06583ad5fa0e4219ae733038b",
  "lore/structures/authoring.schema.json": "16a67e81d51ec0b64668c1458a244d7c39476d50ae02654a3058b14e2dc0bd93",
  "lore/technology/authoring.schema.json": "caecd989e4c660d3c479d5ddf3f2c33fdc4dce43379035225cdf287fff281a6a"
});
const DOCUMENT_HASHES = Object.freeze({
  "lore/ailments/authoring.schema.json": "f2f7a09e5c93a3469521e432c0406bcf7a80d6987ad070d000b6220b45a72ccd",
  "lore/authoring.atlas.schema.json": "fe5c2b28c1de7bd615cab5eadeac254d60481b4416d9022f247f0afb5b6bc9aa",
  "lore/authoring.schema.json": "0589d326859ba39810db57c77d53878fe3fa0edbda973c8db3bfb7abcf3c6e0a",
  "lore/authoring.shared.schema.json": "b3a5aac755e49560c88d278dd984d7c03bbe4da08684be9aa4a327c378838b33",
  "lore/bestiary/authoring.schema.json": "feb8777ce999632fde5a53a94e214b1b53d69aedc3ab4444a1817e3b8fc587ef",
  "lore/characters/authoring.schema.json": "55e099e4ecbe5fe85d350081d0d4ee089e667ac95733f7efee5f703f0f86ea95",
  "lore/chronology/authoring.schema.json": "c2298fb189227c20f7c92fdc321251973f4c6791de7c59039648aed120d64b8e",
  "lore/culture/authoring.schema.json": "5c80d7c30bf48103aa0abcb2765d97a77e050c7624b21e78feabbba06eb90f12",
  "lore/economy/authoring.schema.json": "e2e78a00bd5780f8933fdcaabbe4995ef783897dc387c32f255fb4ecfacdd443",
  "lore/editorial/Naming-Ledger.schema.json": "a217a48bc7f217a40f27ab7f46d40bb86d6aa8e24b6d2937cb73ebb3adb6482a",
  "lore/editorial/authoring.schema.json": "8390de81e9cc6c738678685a5d2f48b195c47adde5ad3b6fe48720a90e2d0ae9",
  "lore/factions/authoring.schema.json": "1089c21ad4058d8d7bf24f10b313062d994fd995aa1df40b0c8790de99af87b3",
  "lore/goods/authoring.schema.json": "c42ff4f7b3e3cc5c9d82ff44d150e6e8e4acae95eb3e09daa0f5b8815b8b8d0e",
  "lore/name-pools/authoring.schema.json": "5da355cbb778174f9beb8a9629cf62eae66bd3f1da35c1479d5e6da922f62542",
  "lore/offices/authoring.schema.json": "7e437d4bc43356aa3df1d020c7e70c341a5e7849a0383bce98a29422668c3508",
  "lore/overview/authoring.schema.json": "5ffc28bff618f85b7d3e9b57dd4ded6d577d0a6e50bb9e611f14dc12d5b7b242",
  "lore/people-and-machines/authoring.schema.json": "c048a88038c8684c25f1656d60426c7ee3ed351ed750d117302d247c6ec06b05",
  "lore/places/authoring.schema.json": "311fd02660711f30b5a98e2c7c0f0d70ae1049df03c4b22992f836bbab5fb5f4",
  "lore/regions/authoring.schema.json": "2fb6971d114ba5f1b2105b10255836a68e53b08628aaa6e86fa47d42205aef1f",
  "lore/structures/authoring.schema.json": "3f3b4552cd8d06c4c28e6983cea816bb48348f226e1b60977669b9392dc9723b",
  "lore/technology/authoring.schema.json": "763087e91d37c0a897772098a1c9ec25d9fd394c1f9643b6c0caf8c180a05b8f"
});
const SCALARS = Object.freeze({"$schema":"schema_uri","$id":"schema_identifier","$ref":"reference","title":"title","description":"description","pattern":"pattern","format":"format","minLength":"min_length","minItems":"min_items","maxItems":"max_items","minProperties":"min_properties","minimum":"minimum","maximum":"maximum","uniqueItems":"unique_items","deprecated":"deprecated"});
const SINGLE = Object.freeze({"items":"items_schema","additionalProperties":"additional_properties_schema","if":"if_schema","then":"then_schema","else":"else_schema","not":"not_schema"});
const MAPS = Object.freeze({"properties":"property","$defs":"definition","patternProperties":"pattern_property"});
const LISTS = Object.freeze({"allOf":"all_of","anyOf":"any_of","oneOf":"one_of","prefixItems":"prefix_item"});
const PATHS = Object.keys(AUTHORING_SCHEMA_SOURCE_HASHES);
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
  if (hash(JSON.stringify(result)) !== DOCUMENT_HASHES[logicalPath]) fail('independent document digest');
  const remapped = mapDocument(logicalPath,result);
  for (const t of TABLES) if (JSON.stringify(normalized(rows[t])) !== JSON.stringify(normalized(remapped[t]))) fail('noncanonical rows ' + t);
  return result;
}

/** Runtime is SELECT-only; no source access or JSON parser is used. All 21 documents
 * are checked so unrelated extra rows cannot hide outside the requested document. */
export function readAuthoringSchemaDocument(db, options) {
  if (!exact(options,['logicalPath','expectedSourceHash']) || !Object.hasOwn(AUTHORING_SCHEMA_SOURCE_HASHES,options.logicalPath) || options.expectedSourceHash !== AUTHORING_SCHEMA_SOURCE_HASHES[options.logicalPath]) fail('read pin');
  return readAuthoringSchemaDocuments(db)[options.logicalPath];
}

export function readAuthoringSchemaDocuments(db) {
  try {
    const receipts = db.prepare('SELECT * FROM authoring_schema_receipt ORDER BY logical_path').all();
    if (receipts.length !== PATHS.length || receipts.some((r,i) => r.logical_path !== PATHS[i] || r.source_sha256 !== AUTHORING_SCHEMA_SOURCE_HASHES[r.logical_path] || r.document_sha256 !== DOCUMENT_HASHES[r.logical_path] || typeof r.actor !== 'string' || !r.actor.trim() || typeof r.reason !== 'string' || !r.reason.trim())) fail('receipt');
    const all = Object.fromEntries(TABLES.map(t => [t,db.prepare('SELECT * FROM authoring_schema_' + t).all()]));
    for (const t of TABLES) if (all[t].some(r => !Object.hasOwn(AUTHORING_SCHEMA_SOURCE_HASHES,r.logical_path))) fail('extra source row');
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
      if (!exact(source,['bytes','expectedSourceHash']) || !(source.bytes instanceof Uint8Array) || source.expectedSourceHash !== AUTHORING_SCHEMA_SOURCE_HASHES[p] || hash(source.bytes) !== AUTHORING_SCHEMA_SOURCE_HASHES[p]) fail('source pin ' + p);
      const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(source.bytes));
      mapDocument(p,document);
      if (hash(JSON.stringify(document)) !== DOCUMENT_HASHES[p]) fail('document pin');
      documents[p] = document;
    }
    db.exec('SAVEPOINT authoring_schema_initialize'); started = true;
    db.exec(options.schemaSql);
    for (const p of PATHS) {
      db.prepare('INSERT INTO authoring_schema_receipt VALUES (?,?,?,?,?)').run(p,AUTHORING_SCHEMA_SOURCE_HASHES[p],DOCUMENT_HASHES[p],options.actor,options.reason);
      const rows = mapDocument(p,documents[p]);
      for (const t of TABLES) for (const row of rows[t]) {
        const columns = Object.keys(row);
        db.prepare('INSERT INTO authoring_schema_' + t + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...Object.values(row));
      }
    }
    readAuthoringSchemaDocument(db,{logicalPath:PATHS[0],expectedSourceHash:AUTHORING_SCHEMA_SOURCE_HASHES[PATHS[0]]});
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
