import { withTransaction } from './db.mjs';

// Historical receipts hash JSON.stringify, including object insertion order.
// Preserve that structural metadata separately from typed document values.
const pointer = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
export function initializeDocumentKeyOrder(db, documents) {
  return withTransaction(db, () => {
  db.exec(`CREATE TABLE document_key_order (
    source_id INTEGER NOT NULL REFERENCES text_document(source_id),
    object_pointer TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL,
    PRIMARY KEY(source_id,object_pointer,ordinal), UNIQUE(source_id,object_pointer,key)
  ) STRICT`);
  const insert = db.prepare('INSERT INTO document_key_order VALUES(?,?,?,?)');
  const visit = (sourceId, value, path) => {
    if (Array.isArray(value)) value.forEach((entry, index) => visit(sourceId, entry, pointer(path, index)));
    else if (value !== null && typeof value === 'object') {
      Object.keys(value).forEach((key, ordinal) => {
        insert.run(sourceId, path, ordinal, key);
        visit(sourceId, value[key], pointer(path, key));
      });
    }
  };
  for (const { sourceId, document } of documents) visit(sourceId, document, '');
  for (const operation of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER document_key_order_no_${operation}
    BEFORE ${operation} ON document_key_order BEGIN SELECT RAISE(ABORT,'immutable document key order'); END`);
  });
}

// Archived keys keep their imported order; keys added by later edits follow
// in the edited document's own order. Removed keys are simply absent.
export function orderDocumentKeys(db, sourceId, document) {
  const groups = new Map();
  for (const row of db.prepare('SELECT * FROM document_key_order WHERE source_id=? ORDER BY object_pointer,ordinal').all(sourceId)) {
    if (!groups.has(row.object_pointer)) groups.set(row.object_pointer, []);
    groups.get(row.object_pointer).push(row.key);
  }
  const visit = (value, path) => {
    if (Array.isArray(value)) return value.map((entry, index) => visit(entry, pointer(path, index)));
    if (value === null || typeof value !== 'object') return value;
    const archived = (groups.get(path) ?? []).filter(key => Object.hasOwn(value, key));
    const keys = [...archived, ...Object.keys(value).filter(key => !archived.includes(key))];
    return Object.fromEntries(keys.map(key => [key, visit(value[key], pointer(path, key))]));
  };
  return visit(document, '');
}


/** Async PostgreSQL twin: identical ordering reconstruction over wiki.document_key_order. */
export async function orderDocumentKeysAsync(tx, sourceId) {
  const rows = await tx.all('SELECT json_pointer, ordinal, key FROM wiki.document_key_order WHERE source_id = ? ORDER BY json_pointer, ordinal', [sourceId]);
  const byPointer = new Map();
  for (const row of rows) {
    if (!byPointer.has(row.json_pointer)) byPointer.set(row.json_pointer, []);
    byPointer.get(row.json_pointer).push(row.key);
  }
  return byPointer;
}
