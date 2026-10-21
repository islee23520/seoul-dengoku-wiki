import { createHash } from 'node:crypto';
import { currentRegionContent } from './cia-current-rights.mjs';

export const REGION_CONTENT_SOURCE_HASHES = Object.freeze({
  "lore/regions/content/11110.json": "e61839e5bb3cfa94858a7548b462ba6c6a8367a473446b4307a18c7360346e9c",
  "lore/regions/content/11140.json": "82bfb8b7fce99c960e7a69a3d7bd7038edfbaad1ef9463c9e9708b3255e2b7cb",
  "lore/regions/content/11170.json": "4d4372a151ea3b5b3750f4209009850786878a9a1b0f03d6263b82f713be39e3",
  "lore/regions/content/11200.json": "70c5c1ded8c05e0a62807810474bec8302692c19c2f619fb9bdcfbcc62df5f25",
  "lore/regions/content/11215.json": "0ee9f878da9dbf7205c3455d26a36c48c696d905479672051e2a4f92fb8729f5",
  "lore/regions/content/11230.json": "909ac6348e1c1db709600a15e8324e35b12f8da333a2651c84aa8cd3d17ca2c3",
  "lore/regions/content/11260.json": "35a0f9a00f390ddade023934923945574c35bce4be11870255bf3bc016a168e0",
  "lore/regions/content/11290.json": "d3a7df3c27583ae75849b148f57afd1c6c2306e59f87898938c8a7414c179733",
  "lore/regions/content/11305.json": "a57fbc654ea8460292747c1bc0d1cb9b076a9fa8f93ac188444f863c62189fcf",
  "lore/regions/content/11320.json": "e32bdb315abfb94be91a6aa71dc28889412e2578545098523af48d97add2dd74",
  "lore/regions/content/11350.json": "b88467440d62d9ffdd43e61e6ab76bdcafd1896875a70a021827bed1282f4ad6",
  "lore/regions/content/11380.json": "4629421f6d87b127dcfb4bec926f2b126ffa12b4a42ec1743bc6aa004f3e7c91",
  "lore/regions/content/11410.json": "74bb137245e64bf6a5bfb90c6cb42f7bf5de1c1da1af5daf56cf568ef09083b5",
  "lore/regions/content/11440.json": "4a5cba55494a45dfc08bc0b94d3f84a5fc58ed886507884abf559b9614bcc69e",
  "lore/regions/content/11470.json": "66be337fddc62cff428a9d7e10b43c27c1ad444c8a6cbbd881b431c38c42dc8e",
  "lore/regions/content/11500.json": "d87dfc02a954f4ab857966b34efdf1c6e3d773a62e0af3c2905cb5b582372831",
  "lore/regions/content/11530.json": "dad57448910220436dd5bca24d78d4b4c033e4e3fc9c6ca7c4eb1bc80dd65cf7",
  "lore/regions/content/11545.json": "c796109e21531fe51d86d6668c0e06d4c9b4162d0d42f35d29d2b4b51aff02d2",
  "lore/regions/content/11560.json": "a43a0d4e602faf8ceff0c5137b29a3b7447ec88f7e83ec9a5c5ff9da1b105cbf",
  "lore/regions/content/11590.json": "8ce50ecfa0e725da6976bfedd46c8a98cde94cd95640eae4efa64066b0c4d99a",
  "lore/regions/content/11620.json": "59677a9ec79306e36ddd8bb6adb0a714a63e9cc85be7188f849e07eefa6e5fa3",
  "lore/regions/content/11650.json": "93702444fa1d919e25d8592600dd7a3d00d877317a2a37712685195f36abece7",
  "lore/regions/content/11680.json": "8661504cba929e42c2f17e6277f39b668e11f5d39cab6c078374ba81282a7858",
  "lore/regions/content/11710.json": "4ef43e14acdc70c2eb28528e609d6a74569beecc674a4f948f08df30b36ab881",
  "lore/regions/content/11740.json": "1135ac11ab1a7bea5daf8c4ccefbdc0bd119861809f15b0f388d67e4aede04b4"
});
export const REGION_CONTENT_DOCUMENT_HASHES = Object.freeze({
  "lore/regions/content/11110.json": "67c0d9b478482566003b00a038477c10a165281978b8721af2cfcabb0cdefe41",
  "lore/regions/content/11140.json": "80b11f7cef42f10cc5b5cd2669b4b26da2a344ff4600738fbe74d9eea079ef97",
  "lore/regions/content/11170.json": "36189e24c507d7586cbec45b997203d3af8184e640eccfaa4504b8445f8f7c03",
  "lore/regions/content/11200.json": "44c5957ca9d43ad491c77914904cafc0f5cfd06f9e894fbc800eacad9a7655db",
  "lore/regions/content/11215.json": "4be14d24f1d8bc1a2734987018e345380918aecb9bf4f7fb67e78d13090a1cf8",
  "lore/regions/content/11230.json": "e889c246a165c395232d1a8fde36b7269a9f2b3b3c77c5956f411369299c8f4e",
  "lore/regions/content/11260.json": "b8ca59238f74b3ddd425f6c1e373002bf0949de260224addb6c5e010e7a81d0f",
  "lore/regions/content/11290.json": "471892cf01376f8ea405282653455f301d5ec06cefc6da4ebfad05dcb83a954f",
  "lore/regions/content/11305.json": "cce72317258e33980d9b21611a0b5519474b6244658d0c45ad9f892e902639e0",
  "lore/regions/content/11320.json": "d5eb72b7b126ff0b23093649dab7a74421de3dfdec5f2a60adfbfa4270745ae2",
  "lore/regions/content/11350.json": "3a10508bd796d19235fbb84e1aadbdebc2e8ff35b3a9b1a36ca656bc33e8c4cb",
  "lore/regions/content/11380.json": "c5ec87e9d26449d81ad6cc6f6d5b215931bd11fdda5351b21477ad26eb11996a",
  "lore/regions/content/11410.json": "b9129cfa6f3bc36f49b2d52552f6afe594436e37588844796af6267b1f4c340e",
  "lore/regions/content/11440.json": "d0179b83cb2baf97aad32e3c19bfefe1e1802c6dea3f1b5ea43df8cb8a6daca5",
  "lore/regions/content/11470.json": "f3bb8c4608fc4a1775d3f7cd6380800ba8ccaac5628f7415c104be6e865b661f",
  "lore/regions/content/11500.json": "c903ce222cd9b71fd5833eeecd90c3ace76170fdb80446b59449c87056fe9b0e",
  "lore/regions/content/11530.json": "44c856776e5bdab9793a95aabed50792a9ef79dd9411dc3685bbf98441d9acb2",
  "lore/regions/content/11545.json": "ec7528b6f18e35bd02c71dc6599d28024f21509d9b7d8022cddccd6d9c34d2e0",
  "lore/regions/content/11560.json": "c6376034a95ad48a1f93a541ad11edf4d8b882415e4a2040ba3e83c46cdd20df",
  "lore/regions/content/11590.json": "5a7b6d6f3501154d2d400452a2703b77db3c5b7d4a80e1a5570312047892453a",
  "lore/regions/content/11620.json": "fc4105f61c03a7fd92e997cbb39de4888ad5058588491086f4d3f4587666ffaf",
  "lore/regions/content/11650.json": "0fb94bdfedb12a6dd11dc71c7ea5ca8427095e0b780bda7a7a9f231011a8a21e",
  "lore/regions/content/11680.json": "80cd8e356a1a1dcda350d64b8f5c3d47b26550bd1e8c5761b9a074e64fde34d5",
  "lore/regions/content/11710.json": "97d737caff0e443c8bfd5fadc3ccda74a114b1bdd08a019e4dbfec1f807ca747",
  "lore/regions/content/11740.json": "dbbff052398b62f7fa300c3878f65ca89d77c4380c2fa5b5434ed261d60517f0"
});

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
  const paths = Object.keys(REGION_CONTENT_SOURCE_HASHES);
  if (!object(sources) || Object.keys(sources).length !== paths.length || Object.keys(sources).some(p => !paths.includes(p))) fail('exact 25 source paths required');
  const documents = {};
  for (const logicalPath of paths) {
    const source = sources[logicalPath];
    if (!object(source) || Object.keys(source).length !== 2 || !Object.hasOwn(source,'bytes') || !Object.hasOwn(source,'expectedSourceHash')
      || !(source.bytes instanceof Uint8Array) || source.expectedSourceHash !== REGION_CONTENT_SOURCE_HASHES[logicalPath]
      || hash(source.bytes) !== source.expectedSourceHash) fail(logicalPath + ': actual byte pin');
    const document = JSON.parse(new TextDecoder('utf-8',{ fatal: true }).decode(source.bytes));
    validate(document,'document');
    if (hash(JSON.stringify(document)) !== REGION_CONTENT_DOCUMENT_HASHES[logicalPath]) fail(logicalPath + ': document pin');
    documents[logicalPath] = document;
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const logicalPath of paths) {
      insert(db,'region_content_import',{logical_path:logicalPath,source_sha256:REGION_CONTENT_SOURCE_HASHES[logicalPath],
        document_sha256:REGION_CONTENT_DOCUMENT_HASHES[logicalPath],actor,reason});
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
      const actual = readRegionContentDocument(db,{logicalPath,expectedSourceHash:REGION_CONTENT_SOURCE_HASHES[logicalPath]});
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
export function readRegionContentDocument(db, { logicalPath, expectedSourceHash, predecessor = false } = {}) {
  try {
    if (!Object.hasOwn(REGION_CONTENT_SOURCE_HASHES,logicalPath) || expectedSourceHash !== REGION_CONTENT_SOURCE_HASHES[logicalPath]) fail('explicit fixed path/hash required');
    const rows = table => db.prepare('SELECT * FROM ' + table + ' WHERE logical_path=?').all(logicalPath);
    const receipts = rows('region_content_import'), receipt = receipts[0];
    if (receipts.length !== 1 || receipt.source_sha256 !== expectedSourceHash
      || receipt.document_sha256 !== REGION_CONTENT_DOCUMENT_HASHES[logicalPath]
      || !receipt.actor.trim() || !receipt.reason.trim()) fail('receipt/pin');
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
    if (hash(JSON.stringify(document)) !== REGION_CONTENT_DOCUMENT_HASHES[logicalPath]) fail('complete document digest');
    return predecessor ? document : currentRegionContent(db, document);
  } catch (error) {
    if (error.code === 'E_REGION_CONTENT_DOCUMENT') throw error;
    fail(error.message);
  }
}
