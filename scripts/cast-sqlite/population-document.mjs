import { createHash } from 'node:crypto';

export const POPULATION_SOURCE_HASH = '28f36b6106d8550b609eea500afb0a369ab03e76a9658567cefd08eddc20a561';
export const POPULATION_DOCUMENT_HASH = '0b2545224584459128eddfe95b5059ef1d516f2488f9c7ce7a9aa8ba25d1a855';
const fields = {
  document: {schema:'text', baseline:'text', projectionYear:'integer', ratio:'number'},
  source: {publisher:'text', url:'text', downloadUrl:'text', downloadSha256:'text', downloadBytes:'integer', statistic:'text', definition:'text', asOf:'text', statisticsApproval:'text', rights:'text'},
  boundary: {source:'text', sha256:'text', effectiveDate:'text', areaUnit:'text', measurementCrs:'text'}
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw Object.assign(new Error('E_POPULATION_DOCUMENT: ' + message), {code:'E_POPULATION_DOCUMENT'}); };
const object = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const allowed = name => [...Object.keys(fields[name]), ...(name === 'document' ? ['source','boundary','density2126ByDong'] : [])];
function validate(value) {
  for (const name of Object.keys(fields)) {
    const part = name === 'document' ? value : value[name], keys = allowed(name);
    if (!object(part) || Object.keys(part).length !== keys.length || Object.keys(part).some(k => !keys.includes(k))) fail(name + ': unknown/missing field');
    for (const [key,type] of Object.entries(fields[name])) {
      const v = part[key];
      if (!(type === 'text' ? typeof v === 'string' : type === 'integer' ? Number.isSafeInteger(v) : typeof v === 'number' && Number.isFinite(v))) fail(name + '.' + key + ': type');
    }
  }
  if (!object(value.density2126ByDong)) fail('density map');
  for (const [id,density] of Object.entries(value.density2126ByDong)) {
    if (!/^\d{10}$/.test(id) || typeof density !== 'number' || !Number.isFinite(density)) fail('dong density type/id');
  }
}
function insert(db, table, row) {
  const keys = Object.keys(row);
  db.prepare('INSERT INTO population_' + table + ' (' + keys.map(k => '"' + k + '"').join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')').run(...Object.values(row));
}

export function initializePopulationDocument(db, {schemaSql, sourceBytes, expectedSourceHash, actor, reason} = {}) {
  if (db.isTransaction) fail('active transaction');
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || ![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('schema/actor/reason');
  if (!(sourceBytes instanceof Uint8Array) || expectedSourceHash !== POPULATION_SOURCE_HASH) fail('explicit fixed source hash/bytes required');
  const value = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  validate(value);
  if (hash(sourceBytes) !== POPULATION_SOURCE_HASH || hash(JSON.stringify(value)) !== POPULATION_DOCUMENT_HASH) fail('fixed bytes/document hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    insert(db,'import',{id:1, source_sha256:POPULATION_SOURCE_HASH, document_sha256:POPULATION_DOCUMENT_HASH, actor, reason});
    for (const name of Object.keys(fields)) {
      const part = name === 'document' ? value : value[name];
      insert(db,name,{id:1,...Object.fromEntries(Object.keys(fields[name]).map(k => [k,part[k]]))});
      Object.keys(part).forEach((key,ordinal) => insert(db,'key',{document_id:1,object_name:name,ordinal,key}));
    }
    Object.entries(value.density2126ByDong).forEach(([dong_id,density2126],ordinal) => insert(db,'dong_density',{document_id:1,dong_id,ordinal,density2126}));
    if (JSON.stringify(readPopulationDocument(db,{expectedSourceHash})) !== JSON.stringify(value)) fail('transaction parity');
    db.exec('COMMIT');
    return value;
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** Runtime reconstructs the complete ordered document from SELECT-only typed rows. */
export function readPopulationDocument(db, {expectedSourceHash} = {}) {
  try {
    if (expectedSourceHash !== POPULATION_SOURCE_HASH) fail('explicit fixed source hash required');
    const rows = name => db.prepare('SELECT * FROM population_' + name).all();
    const receipts = rows('import'), receipt = receipts[0];
    if (receipts.length !== 1 || receipt.id !== 1 || receipt.source_sha256 !== POPULATION_SOURCE_HASH || receipt.document_sha256 !== POPULATION_DOCUMENT_HASH || !receipt.actor.trim() || !receipt.reason.trim()) fail('receipt');
    const keyRows = rows('key'), result = {};
    const densities = rows('dong_density').sort((a,b) => a.ordinal-b.ordinal);
    const map = Object.fromEntries(densities.map((r,i) => {
      if (r.document_id !== 1 || r.ordinal !== i) fail('density parent/order');
      return [r.dong_id,r.density2126];
    }));
    let consumed = 0;
    for (const name of Object.keys(fields)) {
      const records = rows(name), row = records[0];
      if (records.length !== 1 || row.id !== 1) fail(name + ': singleton');
      const keys = keyRows.filter(r => r.object_name === name).sort((a,b) => a.ordinal-b.ordinal);
      if (keys.length !== allowed(name).length) fail(name + ': missing keys');
      const part = name === 'document' ? result : {};
      for (const [i,r] of keys.entries()) {
        if (r.document_id !== 1 || r.ordinal !== i || !allowed(name).includes(r.key) || Object.hasOwn(part,r.key)) fail(name + ': unknown key/parent/order');
        part[r.key] = Object.hasOwn(fields[name],r.key) ? row[r.key] : r.key === 'density2126ByDong' ? map : undefined;
        consumed++;
      }
      if (name !== 'document') result[name] = part;
    }
    if (consumed !== keyRows.length) fail('unconsumed key rows');
    validate(result);
    if (hash(JSON.stringify(result)) !== POPULATION_DOCUMENT_HASH) fail('ordered complete document hash');
    return result;
  } catch (error) { if (error.code === 'E_POPULATION_DOCUMENT') throw error; fail(error.message); }
}
