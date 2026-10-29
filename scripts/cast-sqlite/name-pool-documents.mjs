import { createHash } from 'node:crypto';

export const NAME_POOL_PATHS = Object.freeze([
  'lore/name-pools/given-male.json',
  'lore/name-pools/given-female.json',
  'lore/name-pools/surnames.json',
]);
const givenFields = ['id','status','source','contract','authorization','transformation','note','names'];
const surnameFields = ['id','schema','sourceLink','note','surnames'];
const columns = ['id','schema','sourceLink','status','source','contract','authorization','transformation','note'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw new Error('E_NAME_POOL_DOCUMENT'); };
const fieldsFor = path => path.endsWith('/surnames.json') ? surnameFields : givenFields;

/** Explicit bounded migration of candidate pools, never approval of their names. */
export function initializeNamePoolDocuments(db, { schemaSql, sources, actor, reason } = {}) {
  const paths = NAME_POOL_PATHS;
  if (db.isTransaction || ![schemaSql,actor,reason].every(v => typeof v === 'string' && v.trim())
    || !sources || Object.keys(sources).length !== paths.length || paths.some(p => !Object.hasOwn(sources,p))) fail();
  const documents = new Map();
  for (const path of paths) {
    const input = sources[path];
    if (!(input?.bytes instanceof Uint8Array)) fail();
    const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(input.bytes));
    const fields = fieldsFor(path), collection = fields.at(-1);
    if (JSON.stringify(Object.keys(document)) !== JSON.stringify(fields)
      || fields.slice(0,-1).some(k => typeof document[k] !== 'string')
      || !Array.isArray(document[collection]) || document[collection].some(v => typeof v !== 'string')) fail();
    documents.set(path,{ document, sourceHash: hash(input.bytes) });
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const [path,{ document, sourceHash }] of documents) {
      db.prepare('INSERT INTO name_pool_document VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(path,
        sourceHash, ...columns.map(k => document[k] ?? null), actor, reason);
      document[fieldsFor(path).at(-1)].forEach((name,i) =>
        db.prepare('INSERT INTO name_pool_candidate VALUES (?,?,?)').run(path,i,name));
      readNamePoolDocument(db, { logicalPath: path });
    }
    db.exec('COMMIT');
    return { documents: documents.size, candidates: [...documents].reduce((n, [path, { document }]) => n + document[fieldsFor(path).at(-1)].length, 0) };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only candidate pool reconstruction. */
export function readNamePoolDocument(db, { logicalPath } = {}) {
  if (!NAME_POOL_PATHS.includes(logicalPath)) fail();
  const row = db.prepare('SELECT * FROM name_pool_document WHERE logical_path=?').get(logicalPath);
  if (!row || !row.actor.trim() || !row.reason.trim()) fail();
  const fields = fieldsFor(logicalPath), collection = fields.at(-1);
  if (columns.some(k => !fields.includes(k) && row[k] !== null)) fail();
  const document = Object.fromEntries(fields.slice(0,-1).map(k => [k,row[k]]));
  const names = db.prepare('SELECT * FROM name_pool_candidate WHERE logical_path=? ORDER BY ordinal').all(logicalPath);
  if (names.some((r,i) => r.ordinal !== i)) fail();
  document[collection] = names.map(r => r.name);
  return document;
}
