import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';
import { orderFamilyNodes } from './family-key-order.mjs';

const logicalPath = 'lore/name-pools/cast-family-trees.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_FAMILY_SOURCE_DOCUMENT: ' + detail), { code: 'E_FAMILY_SOURCE_DOCUMENT' }); };

/** SELECT-only reconstruction of the authored source, not the resolved graph.
 * No file IO, JSON decoding, registry names/birthdays, or diaspora expansion.
 */
export function readFamilySourceDocument(db) {
  try {
    const receipts = db.prepare('SELECT * FROM family_source_document_import').all();
    const receipt = receipts[0];
    if (receipts.length !== 1 || receipt.singleton !== 1) fail('import receipt');
    const source = receipt.source_id;
    const rows = table => db.prepare('SELECT * FROM ' + table + ' WHERE source_id=?').all(source);
    const ordinal = values => {
      values.sort((a,b) => a.ordinal-b.ordinal);
      if (values.some((r,i) => r.ordinal !== i)) fail('ordinal coverage');
      return values;
    };
    const indexed = (values, path) => {
      values.sort((a,b) => Number(a.json_pointer.split('/').at(-1))-Number(b.json_pointer.split('/').at(-1)));
      if (values.some((r,i) => r.json_pointer !== '/' + path + '/' + i)) fail(path + ': source order');
      return values;
    };
    const group = (values, key) => {
      const result = new Map();
      for (const row of values) {
        const k = key(row);
        if (!result.has(k)) result.set(k,[]);
        result.get(k).push(row);
      }
      return result;
    };
    const tree = rows('family_tree')[0];
    if (tree.tree_id !== 'cast-family-trees' || tree.json_pointer !== '') fail('tree identity');
    const metadata = rows('family_source_metadata');
    const meta = (field,type) => {
      const row = metadata.find(r => r.field_name === field);
      if (!row || row.value_kind !== type || row.json_pointer !== '/' + field) fail('metadata: ' + field);
      return type === 'number' ? row.integer_value : row.text_value;
    };
    const nodeRefs = group(rows('family_node_source'),r => r.node_id + ':' + r.source_kind);
    const timelines = group(rows('family_node_timeline'),r => r.node_id);
    const edgeRefs = group(rows('family_edge_source'),r => r.edge_id);
    const take = (groups,key) => { const result = groups.get(key) ?? []; groups.delete(key); return ordinal(result); };
    const refs = values => values.map(r => ({ path:r.source_path,...(r.source_anchor === null ? {} : {anchor:r.source_anchor}) }));
    const nodes = orderFamilyNodes(db,indexed(rows('family_node'),'nodes').map(r => ({
      id:r.node_id,personId:r.person_id,kind:r.node_kind,name:r.name,
      ...(r.name_en === null ? {} : {nameEn:r.name_en}),
      birthDate:r.birth_date,deathDate:r.death_date,status:r.status,
      sourceRefs:refs(take(nodeRefs,r.node_id + ':node')),
      timeline:take(timelines,r.node_id).map(t => ({year:t.year,summary:t.summary,
        ...(t.summary_en === null ? {} : {summaryEn:t.summary_en}),
        sourceRefs:refs(take(nodeRefs,r.node_id + ':timeline:' + t.ordinal))})),
      ...(r.lineage_surname === null ? {} : {lineage:{surname:r.lineage_surname,bongwan:r.lineage_bongwan,clan:r.lineage_clan}}),
      ...(r.generation_exception_reason === null ? {} : {generationException:{reason:r.generation_exception_reason,
        sourceRefs:refs(take(nodeRefs,r.node_id + ':generation-exception'))}}),
    })));
    const edges = indexed(rows('family_edge'),'edges').map(r => ({id:r.edge_id,from:r.from_node_id,to:r.to_node_id,type:r.edge_type,
      ...(r.parent_role === null ? {} : {parentRole:r.parent_role}),status:r.status,sourceRefs:refs(take(edgeRefs,r.edge_id))}));
    if (nodeRefs.size || timelines.size || edgeRefs.size) fail('orphan domain rows');
    const dependencies = ordinal(db.prepare('SELECT * FROM family_source_document_dependency').all());
    if (dependencies.length !== 1) fail('dependency coverage');
    const candidate = {schemaVersion:meta('schemaVersion','number'),collapseYear:meta('collapseYear','number'),
      referenceDate:meta('referenceDate','string'),status:meta('status','string'),
      sourceRefs:indexed(rows('family_tree_source'),'sourceRefs').map(r => ({path:r.source_path})),nodes,edges,
      imports:dependencies.map(r => ({path:r.source_path}))};
    if (tree.collapse_year !== candidate.collapseYear || tree.reference_date !== candidate.referenceDate || tree.status !== candidate.status) fail('tree metadata divergence');
    const keys = group(db.prepare('SELECT * FROM family_source_document_key').all(),r => r.object_path);
    const order = (value,path) => {
      if (path === '/nodes' || value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((v,i) => order(v,path+'/'+i));
      const entries = take(keys,path);
      if (entries.length !== Object.keys(value).length) fail('key coverage: '+path);
      return Object.fromEntries(entries.map(r => {
        if (!Object.hasOwn(value,r.key)) fail('unknown key: '+path);
        return [r.key,order(value[r.key],path+'/'+r.key)];
      }));
    };
    const result = order(candidate,'');
    if (keys.size) fail('unconsumed key metadata');
    return result;
  } catch (error) {
    if (error.code === 'E_FAMILY_SOURCE_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** Explicit one-shot supplement: caller supplies source bytes and SQL.
 * Only the new tables are written. Complete parity is checked before commit.
 */
export function initializeFamilySourceDocument(db,{schemaSql,sourceBytes,actor,reason} = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  if (![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || db.isTransaction) fail('explicit SQL/transaction');
  const archived = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').all(logicalPath);
  if (archived.length !== 1) fail('archive identity');
  const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const dependency = db.prepare('INSERT INTO family_source_document_dependency VALUES (?,?)');
    document.imports.forEach((r,i) => dependency.run(i,r.path));
    const key = db.prepare('INSERT INTO family_source_document_key VALUES (?,?,?)');
    const walk = (value,path) => {
      if (path === '/nodes' || value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v,i) => walk(v,path+'/'+i)); return; }
      Object.entries(value).forEach(([k,v],i) => {key.run(path,i,k);walk(v,path+'/'+k);});
    };
    walk(document,'');
    db.prepare('INSERT INTO family_source_document_import VALUES (1,?,?,?,?,?)').run(archived[0].source_id,hash(sourceBytes),hash(JSON.stringify(document)),actor,reason);
    const actual = readFamilySourceDocument(db);
    deepStrictEqual(actual,document);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('transaction serialized parity');
    db.exec('COMMIT');
    return actual;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
