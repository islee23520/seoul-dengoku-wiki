import { withTransaction } from './db.mjs';
import { isDeepStrictEqual } from 'node:util';

// Transitional dual-read boundary: values must already match. Only object and
// Map insertion order comes from the authenticated predecessor shape.
export function preserveReceiptOrder(typed, source) {
  if (!isDeepStrictEqual(typed, source)) throw new Error('E_RECEIPT_VALUE_MISMATCH');
  const visit = (value, shape) => value instanceof Map
    ? new Map([...shape].map(([id, entry]) => [id, visit(value.get(id), entry)]))
    : Array.isArray(value) ? value.map((entry, index) => visit(entry, shape[index]))
      : value !== null && typeof value === 'object'
        ? Object.fromEntries(Object.keys(shape).map(key => [key, visit(value[key], shape[key])]))
        : value;
  return visit(typed, source);
}

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

export function orderDocumentKeys(db, sourceId, document, { approvedStructure } = {}) {
  // Successor structure is explicit authority, never a fallback source of values.
  // This leaves the immutable imported key-order archive untouched.
  if (approvedStructure !== undefined) return preserveReceiptOrder(document, approvedStructure);
  const groups = new Map();
  for (const row of db.prepare('SELECT * FROM document_key_order WHERE source_id=? ORDER BY object_pointer,ordinal').all(sourceId)) {
    if (!groups.has(row.object_pointer)) groups.set(row.object_pointer, []);
    groups.get(row.object_pointer).push(row);
  }
  const visit = (value, path) => {
    if (Array.isArray(value)) return value.map((entry, index) => visit(entry, pointer(path, index)));
    if (value === null || typeof value !== 'object') return value;
    const keys = groups.get(path) ?? [];
    if (keys.length !== Object.keys(value).length || keys.some((row, index) => row.ordinal !== index || !Object.hasOwn(value, row.key))) {
      throw new Error(`E_DOCUMENT_KEY_ORDER:${sourceId}:${path}`);
    }
    return Object.fromEntries(keys.map(({ key }) => [key, visit(value[key], pointer(path, key))]));
  };
  return visit(document, '');
}
