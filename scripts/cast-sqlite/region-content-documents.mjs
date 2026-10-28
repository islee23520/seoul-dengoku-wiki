import { createHash } from 'node:crypto';
import { currentRegionContent } from './cia-current-rights.mjs';

export const REGION_CONTENT_PATHS = Object.freeze([
  "lore/regions/content/11110.json",
  "lore/regions/content/11140.json",
  "lore/regions/content/11170.json",
  "lore/regions/content/11200.json",
  "lore/regions/content/11215.json",
  "lore/regions/content/11230.json",
  "lore/regions/content/11260.json",
  "lore/regions/content/11290.json",
  "lore/regions/content/11305.json",
  "lore/regions/content/11320.json",
  "lore/regions/content/11350.json",
  "lore/regions/content/11380.json",
  "lore/regions/content/11410.json",
  "lore/regions/content/11440.json",
  "lore/regions/content/11470.json",
  "lore/regions/content/11500.json",
  "lore/regions/content/11530.json",
  "lore/regions/content/11545.json",
  "lore/regions/content/11560.json",
  "lore/regions/content/11590.json",
  "lore/regions/content/11620.json",
  "lore/regions/content/11650.json",
  "lore/regions/content/11680.json",
  "lore/regions/content/11710.json",
  "lore/regions/content/11740.json",
]);

// Every domain has its own named typed columns and ordered relational table.
const domains = {
  document: {"table":"region_content_document","fields":{"schema":"text","district_id":"text","district_name":"text","as_of":"text"},"children":{"regions":["region"]}},
  region: {"table":"region_content_region","fields":{"region_id":"text","name":"text"},"children":{"content":"content"}},
  content: {"table":"region_content_content","fields":{"source_kind":"text","fictional_epoch":"text","title":"text","summary":"text","livelihood":"text","opening_state":"text","connections":"text","uncertainty":"text","core_station":"boolean"},"children":{"anchor_refs":["anchor_ref"],"canon_refs":["canon_ref"],"polity_contexts":["polity_context"],"inhabitants":["inhabitant"],"production":"production","shortages":["shortage"],"hazard":"hazard","action":"action","buildings":["building"],"territory":"territory"}},
  production: {"table":"region_content_production","fields":{},"children":{"outputs":["output"],"requires":["requirement"]}},
  hazard: {"table":"region_content_hazard","fields":{"kind":"text","description":"text"},"children":{}},
  action: {"table":"region_content_action","fields":{"id":"text","label":"text","target_ref":"text","tradeoff":"text"},"children":{"costs":["cost"],"outcomes":["outcome"]}},
  cost: {"table":"region_content_cost","fields":{"resource":"text","amount":"number","unit":"text"},"children":{}},
  outcome: {"table":"region_content_outcome","fields":{"kind":"text","effect":"text"},"children":{}},
  building: {"table":"region_content_building","fields":{"anchor_ref":"text","name":"text","observed_use":"text","river":"text","opening_use":"text","how":"text","role":"text","observed_levels_source":"text","observed_levels":"number"},"optional":["observed_levels","observed_levels_source"],"children":{"floors":["floor"]}},
  floor: {"table":"region_content_floor","fields":{"level":"level","label":"text","state":"text","contents":"text","condition":"text"},"children":{}},
  territory: {"table":"region_content_territory","fields":{"status":"text"},"optional":["authority"],"children":{"holders":["holder"],"authority":"authority"}},
  holder: {"table":"region_content_holder","fields":{"polity":"text","control":"number"},"children":{}},
  authority: {"table":"region_content_authority","fields":{"kind":"text","name":"text"},"children":{}},
  anchor_ref: {"table":"region_content_anchor_ref","list":true},
  canon_ref: {"table":"region_content_canon_ref","list":true},
  polity_context: {"table":"region_content_polity_context","list":true},
  inhabitant: {"table":"region_content_inhabitant","list":true},
  shortage: {"table":"region_content_shortage","list":true},
  output: {"table":"region_content_output","list":true},
  requirement: {"table":"region_content_requirement","list":true},
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_REGION_CONTENT_DOCUMENT: ' + detail), { code: 'E_REGION_CONTENT_DOCUMENT' }); };
const object = v => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const pathFor = (path, key) => path + '/' + key;
function validate(value, domain) {
  const s = domains[domain];
  if (s.list) { if (typeof value !== 'string') fail(domain + ': text required'); return; }
  const allowed = [...Object.keys(s.fields), ...Object.keys(s.children)];
  if (!object(value) || Object.keys(value).some(k => !allowed.includes(k))
    || allowed.some(k => !(s.optional ?? []).includes(k) && !Object.hasOwn(value,k))) fail(domain + ': unknown/missing field');
  for (const [k,v] of Object.entries(value)) {
    if (v === null) continue;
    if (Object.hasOwn(s.fields,k)) {
      const t = s.fields[k];
      if (!(t === 'text' ? typeof v === 'string' : t === 'boolean' ? typeof v === 'boolean'
        : t === 'level' ? typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))
          : typeof v === 'number' && Number.isFinite(v))) fail(domain + '.' + k + ': type');
    } else {
      const child = s.children[k];
      if (Array.isArray(child)) {
        if (!Array.isArray(v)) fail(domain + '.' + k + ': list');
        v.forEach(item => validate(item,child[0]));
      } else validate(v,child);
    }
  }
}
function insert(db,table,row) {
  const keys = Object.keys(row);
  db.prepare('INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')').run(...Object.values(row));
}

/** One-shot import of exactly the fixed 25 full logical paths; no filesystem access. */
export function initializeRegionContentDocuments(db, { schemaSql, sources, actor, reason } = {}) {
  if (![actor,reason,schemaSql].every(v => typeof v === 'string' && v.trim())) fail('explicit schema/actor/reason required');
  if (db.isTransaction) fail('active transaction');
  const paths = REGION_CONTENT_PATHS;
  if (!object(sources) || Object.keys(sources).length !== paths.length || Object.keys(sources).some(p => !paths.includes(p))) fail('exact source paths required');
  const documents = {};
  for (const logicalPath of paths) {
    const source = sources[logicalPath];
    if (!object(source) || Object.keys(source).length !== 1 || !Object.hasOwn(source,'bytes')
      || !(source.bytes instanceof Uint8Array)) fail(logicalPath + ': source bytes');
    const document = JSON.parse(new TextDecoder('utf-8',{ fatal: true }).decode(source.bytes));
    validate(document,'document');
    documents[logicalPath] = document;
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const logicalPath of paths) {
      insert(db,'region_content_import',{logical_path:logicalPath,source_sha256:hash(sources[logicalPath].bytes),
        document_sha256:hash(JSON.stringify(documents[logicalPath])),actor,reason});
      const put = (value,domain,path,parent,ordinal) => {
        const s = domains[domain];
        const row = {logical_path:logicalPath,object_path:path,parent_path:parent,ordinal};
        if (s.list) row.value = value;
        else for (const [k,t] of Object.entries(s.fields)) {
          const v = value[k] ?? null;
          if (t === 'level') { row.level_number = typeof v === 'number' ? v : null; row.level_text = typeof v === 'string' ? v : null; }
          else row[k] = t === 'boolean' && v !== null ? Number(v) : v;
        }
        insert(db,s.table,row);
        if (s.list) return;
        Object.entries(value).forEach(([key,v],i) => insert(db,'region_content_key',{
          logical_path:logicalPath,object_path:path,ordinal:i,key,is_null:Number(v === null)}));
        for (const [k,child] of Object.entries(s.children)) {
          if (!Object.hasOwn(value,k) || value[k] === null) continue;
          if (Array.isArray(child)) value[k].forEach((v,i) => put(v,child[0],pathFor(path,k) + '/' + i,path,i));
          else put(value[k],child,pathFor(path,k),path,0);
        }
      };
      put(documents[logicalPath],'document','','',0);
      const actual = readRegionContentDocument(db,{logicalPath});
      if (JSON.stringify(actual) !== JSON.stringify(documents[logicalPath])) fail(logicalPath + ': transaction parity');
    }
    db.exec('COMMIT');
    return documents;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/** SELECT-only reconstruction from typed tables; no archive, filesystem or JSON.parse. */
export function readRegionContentDocument(db, { logicalPath, predecessor = false } = {}) {
  try {
    if (!REGION_CONTENT_PATHS.includes(logicalPath)) fail('known logical path required');
    const rows = table => db.prepare('SELECT * FROM ' + table + ' WHERE logical_path=?').all(logicalPath);
    const receipts = rows('region_content_import'), receipt = receipts[0];
    if (receipts.length !== 1
      || !receipt.actor.trim() || !receipt.reason.trim()) fail('receipt');
    const remaining = Object.fromEntries(Object.entries(domains).map(([n,s]) => [n,new Map(rows(s.table).map(r => [r.object_path,r]))]));
    const keys = new Map();
    for (const r of rows('region_content_key')) {
      if (!keys.has(r.object_path)) keys.set(r.object_path,[]);
      keys.get(r.object_path).push(r);
    }
    const get = (domain,path,parent,ordinal) => {
      const s = domains[domain], row = remaining[domain].get(path);
      if (!row || row.parent_path !== parent || row.ordinal !== ordinal) fail(domain + ': missing row/order/parent');
      remaining[domain].delete(path);
      if (s.list) return row.value;
      const group = keys.get(path);
      if (!group) fail(domain + ': missing keys');
      keys.delete(path);
      group.sort((a,b) => a.ordinal-b.ordinal);
      const value = {};
      for (const [i,r] of group.entries()) {
        const k = r.key;
        if (r.ordinal !== i || ![0,1].includes(r.is_null) || (!Object.hasOwn(s.fields,k) && !Object.hasOwn(s.children,k))) fail(domain + ': key/order');
        if (Object.hasOwn(s.fields,k)) {
          const t = s.fields[k];
          const v = t === 'level' ? row.level_number ?? row.level_text : row[k];
          if (r.is_null !== Number(v === null)) fail(domain + ': null');
          value[k] = t === 'boolean' && v !== null ? Boolean(v) : v;
        } else if (r.is_null) value[k] = null;
        else {
          const child = s.children[k], childPath = pathFor(path,k);
          if (Array.isArray(child)) {
            const list = [...remaining[child[0]].values()].filter(v => v.parent_path === path).sort((a,b) => a.ordinal-b.ordinal);
            value[k] = list.map((_,j) => get(child[0],childPath + '/' + j,path,j));
          } else value[k] = get(child,childPath,path,0);
        }
      }
      for (const [k,t] of Object.entries(s.fields)) if (!Object.hasOwn(value,k)
        && (t === 'level' ? row.level_number !== null || row.level_text !== null : row[k] !== null)) fail(domain + ': absent field has value');
      return value;
    };
    const document = get('document','','',0);
    if (keys.size || Object.values(remaining).some(m => m.size)) fail('unconsumed rows');
    validate(document,'document');
    return predecessor ? document : currentRegionContent(db, document);
  } catch (error) {
    if (error.code === 'E_REGION_CONTENT_DOCUMENT') throw error;
    fail(error.message);
  }
}
