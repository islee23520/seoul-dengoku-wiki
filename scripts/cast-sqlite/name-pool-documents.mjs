import { createHash } from 'node:crypto';

export const NAME_POOL_SOURCE_HASHES = Object.freeze({
  'lore/name-pools/given-male.json': 'b86cfac1a50950bf0dd130d51ca0aa1df561e1b1e1caeeb607efa88fb61da542',
  'lore/name-pools/given-female.json': '89af4775c33ec3625c43e2f83de897e58f43785c5c2181bd72091b851240eb7d',
  'lore/name-pools/surnames.json': 'f84a939c29df0a72c6ea07561e3ef32c92723f1d79eebf58c1d6b2cd5885a2f5',
});
const documentHashes = {
  'given-male': '468afe38ad9b8f358c1edabf41749fc1a56ed4e5b5fdbe9729eaa35eca20ec59',
  'given-female': '4fe383cccbdd97e3e5b3f04cbb1f22a725e77a65f54698cf6b304ba5eb8fdfe9',
  surnames: '7f33870a96132beccf65fb3f430c0f7efa8c2704ac49d6bc7a2a6684ba359b91',
};
const givenFields = ['id','status','source','contract','authorization','transformation','note','names'];
const surnameFields = ['id','schema','sourceLink','note','surnames'];
const columns = ['id','schema','sourceLink','status','source','contract','authorization','transformation','note'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = () => { throw new Error('E_NAME_POOL_DOCUMENT'); };
const fieldsFor = path => path.endsWith('/surnames.json') ? surnameFields : givenFields;

/** Explicit bounded migration of candidate pools, never approval of their names. */
export function initializeNamePoolDocuments(db, { schemaSql, sources, actor, reason } = {}) {
  const paths = Object.keys(NAME_POOL_SOURCE_HASHES);
  if (db.isTransaction || ![schemaSql,actor,reason].every(v => typeof v === 'string' && v.trim())
    || !sources || Object.keys(sources).length !== paths.length || paths.some(p => !Object.hasOwn(sources,p))) fail();
  const documents = new Map();
  for (const path of paths) {
    const input = sources[path];
    if (!(input?.bytes instanceof Uint8Array) || input.expectedSourceHash !== NAME_POOL_SOURCE_HASHES[path]
      || hash(input.bytes) !== input.expectedSourceHash) fail();
    const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(input.bytes));
    const fields = fieldsFor(path), collection = fields.at(-1);
    if (JSON.stringify(Object.keys(document)) !== JSON.stringify(fields)
      || fields.slice(0,-1).some(k => typeof document[k] !== 'string')
      || !Array.isArray(document[collection]) || document[collection].some(v => typeof v !== 'string')
      || hash(JSON.stringify(document)) !== documentHashes[document.id]) fail();
    documents.set(path,document);
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const [path,document] of documents) {
      db.prepare('INSERT INTO name_pool_document VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(path,
        NAME_POOL_SOURCE_HASHES[path], ...columns.map(k => document[k] ?? null), actor, reason);
      document[fieldsFor(path).at(-1)].forEach((name,i) =>
        db.prepare('INSERT INTO name_pool_candidate VALUES (?,?,?)').run(path,i,name));
      readNamePoolDocument(db, { logicalPath: path, expectedSourceHash: NAME_POOL_SOURCE_HASHES[path] });
    }
    db.exec('COMMIT');
    return { documents: documents.size, candidates: 120 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only original reviewed candidate snapshot; edits require new review. */
export function readNamePoolDocument(db, { logicalPath, expectedSourceHash } = {}) {
  if (!Object.hasOwn(NAME_POOL_SOURCE_HASHES,logicalPath) || expectedSourceHash !== NAME_POOL_SOURCE_HASHES[logicalPath]) fail();
  const row = db.prepare('SELECT * FROM name_pool_document WHERE logical_path=?').get(logicalPath);
  if (!row || row.source_sha256 !== expectedSourceHash || !row.actor.trim() || !row.reason.trim()) fail();
  const fields = fieldsFor(logicalPath), collection = fields.at(-1);
  if (columns.some(k => !fields.includes(k) && row[k] !== null)) fail();
  const document = Object.fromEntries(fields.slice(0,-1).map(k => [k,row[k]]));
  const names = db.prepare('SELECT * FROM name_pool_candidate WHERE logical_path=? ORDER BY ordinal').all(logicalPath);
  if (names.some((r,i) => r.ordinal !== i)) fail();
  document[collection] = names.map(r => r.name);
  if (hash(JSON.stringify(document)) !== documentHashes[document.id]) fail();
  return document;
}
