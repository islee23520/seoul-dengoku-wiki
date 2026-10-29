import { createHash } from 'node:crypto';

export const CATEGORY_REGISTRY_PATH = 'scripts/category-registry.json';
export const OFFICIAL_SEOUL_LINES_PATH = 'scripts/official-seoul-lines.json';
export const UPDATE_HISTORY_PATH = 'data/update-history.json';
export const CATALOG_METADATA_PATHS = Object.freeze([CATEGORY_REGISTRY_PATH, OFFICIAL_SEOUL_LINES_PATH, UPDATE_HISTORY_PATH]);
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));
const fail = detail => { throw Object.assign(new Error(`E_CATALOG_METADATA: ${detail}`), { code: 'E_CATALOG_METADATA' }); };
const hashShape = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const categoryKeys = ['id', 'label', 'summary', 'requiredKinds'];
const updateKeys = ['date', 'sequence', 'category', 'status', 'title', 'source', 'route'];
const lineRootKeys = ['schema', 'source', 'capturedAt', 'note', 'lines', 'stations'];
function object(value) {
 if (!value || typeof value !== 'object' || Array.isArray(value)
  || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('object shape');
}
function keys(value, expected) {
 object(value);
 if (Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) fail('unknown or missing keys');
}
function text(value, nonempty = false) {
 if (typeof value !== 'string' || (nonempty && !value.trim())) fail('string shape');
}
function array(value) {
 if (!Array.isArray(value) || Object.keys(value).length !== value.length) fail('array shape');
}
function shape(path, document) {
 if (path === CATEGORY_REGISTRY_PATH) {
  keys(document, ['categories']);
  array(document.categories);
  const ids = new Set();
  for (const category of document.categories) {
   keys(category, categoryKeys);
   text(category.id, true); text(category.label, true); text(category.summary);
   if (ids.has(category.id)) fail('duplicate category');
   ids.add(category.id);
   array(category.requiredKinds);
   if (!category.requiredKinds.length || category.requiredKinds.some(kind => !['heading', 'paragraph', 'list', 'table'].includes(kind))) fail('required kinds');
  }
 } else if (path === OFFICIAL_SEOUL_LINES_PATH) {
  keys(document, lineRootKeys);
  if (document.schema !== 'seoul-official-line-style.v1') fail('line schema');
  for (const key of ['source', 'capturedAt', 'note']) text(document[key]);
  object(document.lines); object(document.stations);
  for (const [id, line] of Object.entries(document.lines)) {
   text(id, true); keys(line, ['name', 'color']); text(line.name);
   if (typeof line.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(line.color)) fail('line color');
  }
  for (const [name, lines] of Object.entries(document.stations)) {
   text(name, true); array(lines);
   if (lines.some(id => typeof id !== 'string' || !Object.hasOwn(document.lines, id))) fail('station line reference');
  }
 } else if (path === UPDATE_HISTORY_PATH) {
  keys(document, ['schema', 'updates']);
  if (document.schema !== 'seoul-wiki-update-history.v1') fail('update schema');
  array(document.updates);
  for (const update of document.updates) {
   keys(update, updateKeys);
   for (const key of updateKeys.filter(key => key !== 'sequence')) text(update[key]);
   if (!/^\d{4}-\d{2}-\d{2}$/.test(update.date) || !Number.isSafeInteger(update.sequence) || update.sequence <= 0) fail('update date or sequence');
  }
 } else fail('logical path');
}
const receipt = row => digest([row.logical_path, row.source_sha256, row.document_sha256, row.actor, row.reason]);
function transaction(db, operation) {
 if (!db || db.isTransaction || typeof db.exec !== 'function' || typeof db.prepare !== 'function') fail('connection or active transaction');
 db.exec('PRAGMA foreign_keys=ON');
 db.exec('BEGIN IMMEDIATE');
 try {
  const result = operation();
  db.exec('COMMIT');
  return result;
 } catch (error) {
  if (db.isTransaction) db.exec('ROLLBACK');
  throw error;
 }
}

/** Caller supplies parsed, validated documents and independent source-byte SHA-256 provenance.
 * No source parsing, file I/O, or source-byte retention occurs in this module.
 * All three documents are required; schema creation and inserts are one transaction.
 */
export function initializeCatalogMetadata(db, { schemaSql, documents, actor, reason } = {}) {
 text(schemaSql, true); text(actor, true); text(reason, true);
 array(documents);
 if (documents.length !== 3 || new Set(documents.map(row => row.logicalPath)).size !== 3) fail('document coverage');
 for (const row of documents) {
  keys(row, ['logicalPath', 'document', 'sourceSha256']);
  if (!hashShape(row.sourceSha256)) fail('source hash');
  shape(row.logicalPath, row.document);
 }
 return transaction(db, () => {
  db.exec(schemaSql);
  const insertKey = db.prepare('INSERT INTO catalog_metadata_key VALUES (?,?,?,?,?)');
  const order = (path, kind, owner, value) => Object.keys(value).forEach((key, ordinal) => insertKey.run(path, kind, owner, ordinal, key));
  for (const { logicalPath: path, document, sourceSha256 } of documents) {
   const row = { logical_path: path, source_sha256: sourceSha256, document_sha256: digest(document), actor, reason };
   db.prepare('INSERT INTO catalog_metadata_document VALUES (?,?,?,?,?,?)').run(path, sourceSha256, row.document_sha256, actor, reason, receipt(row));
   order(path, 'root', 0, document);
   if (path === CATEGORY_REGISTRY_PATH) {
    const category = db.prepare('INSERT INTO catalog_category VALUES (?,?,?,?)');
    const kind = db.prepare('INSERT INTO catalog_category_required_kind VALUES (?,?,?)');
    document.categories.forEach((value, ordinal) => {
     category.run(ordinal, value.id, value.label, value.summary);
     order(path, 'category', ordinal, value);
     value.requiredKinds.forEach((value, child) => kind.run(ordinal, child, value));
    });
   } else if (path === OFFICIAL_SEOUL_LINES_PATH) {
    db.prepare('INSERT INTO catalog_official_line_metadata VALUES (1,?,?,?,?)').run(document.schema, document.source, document.capturedAt, document.note);
    const line = db.prepare('INSERT INTO catalog_official_line VALUES (?,?,?,?)');
    Object.entries(document.lines).forEach(([id, value], ordinal) => {
     line.run(ordinal, id, value.name, value.color);
     order(path, 'line', ordinal, value);
    });
    const station = db.prepare('INSERT INTO catalog_official_station VALUES (?,?)');
    const membership = db.prepare('INSERT INTO catalog_official_station_line VALUES (?,?,?)');
    Object.entries(document.stations).forEach(([name, lines], ordinal) => {
     station.run(ordinal, name);
     lines.forEach((id, child) => membership.run(name, child, id));
    });
   } else {
    db.prepare('INSERT INTO catalog_update_history VALUES (1,?)').run(document.schema);
    const update = db.prepare('INSERT INTO catalog_update VALUES (?,?,?,?,?,?,?,?)');
    document.updates.forEach((value, ordinal) => {
     update.run(ordinal, ...updateKeys.map(key => value[key]));
     order(path, 'update', ordinal, value);
    });
   }
  }
  for (const row of documents) {
   if (JSON.stringify(readCatalogMetadataDocument(db, row.logicalPath, { expectedSourceHash: row.sourceSha256 })) !== JSON.stringify(row.document)) fail('transaction parity');
  }
  return { documents: 3 };
 });
}

/** Reconstruct exclusively from SELECTs over typed relational data. */
export function readCatalogMetadataDocument(db, logicalPath, { expectedSourceHash } = {}) {
 try {
  if (!CATALOG_METADATA_PATHS.includes(logicalPath)) fail('logical path');
  if (expectedSourceHash !== undefined && !hashShape(expectedSourceHash)) fail('expected source hash');
  const roots = db.prepare('SELECT * FROM catalog_metadata_document WHERE logical_path=?').all(logicalPath);
  if (roots.length !== 1) fail('document missing');
  const root = roots[0];
  if (!hashShape(root.source_sha256) || !hashShape(root.document_sha256)
   || (expectedSourceHash !== undefined && root.source_sha256 !== expectedSourceHash)
   || root.receipt_sha256 !== receipt(root)) fail('provenance');
  text(root.actor, true); text(root.reason, true);
  const keyRows = db.prepare('SELECT * FROM catalog_metadata_key WHERE logical_path=? ORDER BY object_kind,owner_ordinal,ordinal').all(logicalPath);
  let consumed = 0;
  const ordered = (kind, owner, value) => {
   const rows = keyRows.filter(row => row.object_kind === kind && row.owner_ordinal === owner);
   if (rows.length !== Object.keys(value).length || rows.some((row, index) => row.ordinal !== index || !Object.hasOwn(value, row.key))) fail('key order');
   consumed += rows.length;
   return Object.fromEntries(rows.map(row => [row.key, value[row.key]]));
  };
  const rows = table => db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all();
  const sequence = values => {
   if (values.some((row, index) => row.ordinal !== index)) fail('relational order');
   return values;
  };
  const singleton = table => {
   const values = db.prepare(`SELECT * FROM ${table}`).all();
   if (values.length !== 1 || values[0].singleton !== 1) fail('singleton');
   return values[0];
  };
  let document;
  if (logicalPath === CATEGORY_REGISTRY_PATH) {
   const children = db.prepare('SELECT * FROM catalog_category_required_kind ORDER BY category_ordinal,ordinal').all();
   let used = 0;
   const categories = sequence(rows('catalog_category')).map(row => {
    const kinds = sequence(children.filter(child => child.category_ordinal === row.ordinal));
    used += kinds.length;
    return ordered('category', row.ordinal, { id: row.id, label: row.label, summary: row.summary, requiredKinds: kinds.map(child => child.kind) });
   });
   if (used !== children.length) fail('orphan required kind');
   document = { categories };
  } else if (logicalPath === OFFICIAL_SEOUL_LINES_PATH) {
   const meta = singleton('catalog_official_line_metadata');
   const lines = Object.fromEntries(sequence(rows('catalog_official_line')).map(row => [row.id, ordered('line', row.ordinal, { name: row.name, color: row.color })]));
   const children = db.prepare('SELECT * FROM catalog_official_station_line ORDER BY station_name,ordinal').all();
   let used = 0;
   const stations = Object.fromEntries(sequence(rows('catalog_official_station')).map(row => {
    const memberships = sequence(children.filter(child => child.station_name === row.name));
    used += memberships.length;
    return [row.name, memberships.map(child => child.line_id)];
   }));
   if (used !== children.length) fail('orphan station line');
   document = { schema: meta.schema, source: meta.source, capturedAt: meta.captured_at, note: meta.note, lines, stations };
  } else {
   const meta = singleton('catalog_update_history');
   const updates = sequence(rows('catalog_update')).map(row => ordered('update', row.ordinal, Object.fromEntries(updateKeys.map(key => [key, row[key]]))));
   document = { schema: meta.schema, updates };
  }
  document = ordered('root', 0, document);
  if (consumed !== keyRows.length) fail('extra key rows');
  shape(logicalPath, document);
  if (digest(document) !== root.document_sha256) fail('document hash');
  return document;
 } catch (error) {
  if (error.code === 'E_CATALOG_METADATA') throw error;
  fail(`relational read: ${error.message}`);
 }
}

export function readCatalogMetadata(db) {
 return Object.fromEntries(CATALOG_METADATA_PATHS.map(path => [path, readCatalogMetadataDocument(db, path)]));
}

/** PostgreSQL twin: the synchronous SQLite reader above remains unchanged. */
export async function readCatalogMetadataDocumentAsync(db, logicalPath, { expectedSourceHash } = {}) {
 try {
  if (!CATALOG_METADATA_PATHS.includes(logicalPath)) fail('logical path');
  if (expectedSourceHash !== undefined && !hashShape(expectedSourceHash)) fail('expected source hash');
  const all = async (sql, ...bindings) => db.all(sql.replace(/\b(FROM|JOIN) (catalog_[a-z_]+)/gu, '$1 wiki.$2'), bindings);
  const roots = await all('SELECT * FROM catalog_metadata_document WHERE logical_path=?', logicalPath);
  if (roots.length !== 1) fail('document missing');
  const root = roots[0];
  if (!hashShape(root.source_sha256) || !hashShape(root.document_sha256)
   || (expectedSourceHash !== undefined && root.source_sha256 !== expectedSourceHash)
   || root.receipt_sha256 !== receipt(root)) fail('provenance');
  text(root.actor, true); text(root.reason, true);
  const keyRows = await all('SELECT * FROM catalog_metadata_key WHERE logical_path=? ORDER BY object_kind,owner_ordinal,ordinal', logicalPath);
  let consumed = 0;
  const ordered = (kind, owner, value) => {
   const rows = keyRows.filter(row => row.object_kind === kind && row.owner_ordinal === owner);
   if (rows.length !== Object.keys(value).length || rows.some((row, index) => row.ordinal !== index || !Object.hasOwn(value, row.key))) fail('key order');
   consumed += rows.length;
   return Object.fromEntries(rows.map(row => [row.key, value[row.key]]));
  };
  const rows = async table => db.all(`SELECT * FROM wiki.${table} ORDER BY ordinal`);
  const sequence = values => {
   if (values.some((row, index) => row.ordinal !== index)) fail('relational order');
   return values;
  };
  const singleton = async table => {
   const values = await db.all(`SELECT * FROM wiki.${table}`);
   if (values.length !== 1 || values[0].singleton !== 1) fail('singleton');
   return values[0];
  };
  let document;
  if (logicalPath === CATEGORY_REGISTRY_PATH) {
   const children = await db.all('SELECT * FROM wiki.catalog_category_required_kind ORDER BY category_ordinal,ordinal');
   let used = 0;
   const categories = sequence(await rows('catalog_category')).map(row => {
    const kinds = sequence(children.filter(child => child.category_ordinal === row.ordinal));
    used += kinds.length;
    return ordered('category', row.ordinal, { id: row.id, label: row.label, summary: row.summary, requiredKinds: kinds.map(child => child.kind) });
   });
   if (used !== children.length) fail('orphan required kind');
   document = { categories };
  } else if (logicalPath === OFFICIAL_SEOUL_LINES_PATH) {
   const meta = await singleton('catalog_official_line_metadata');
   const lines = Object.fromEntries(sequence(await rows('catalog_official_line')).map(row => [row.id, ordered('line', row.ordinal, { name: row.name, color: row.color })]));
   const children = await db.all('SELECT * FROM wiki.catalog_official_station_line ORDER BY station_name,ordinal');
   let used = 0;
   const stations = Object.fromEntries(sequence(await rows('catalog_official_station')).map(row => {
    const memberships = sequence(children.filter(child => child.station_name === row.name));
    used += memberships.length;
    return [row.name, memberships.map(child => child.line_id)];
   }));
   if (used !== children.length) fail('orphan station line');
   document = { schema: meta.schema, source: meta.source, capturedAt: meta.captured_at, note: meta.note, lines, stations };
  } else {
   const meta = await singleton('catalog_update_history');
   const updates = sequence(await rows('catalog_update')).map(row => ordered('update', row.ordinal, Object.fromEntries(updateKeys.map(key => [key, row[key]]))));
   document = { schema: meta.schema, updates };
  }
  document = ordered('root', 0, document);
  if (consumed !== keyRows.length) fail('extra key rows');
  shape(logicalPath, document);
  if (digest(document) !== root.document_sha256) fail('document hash');
  return document;
 } catch (error) {
  if (error.code === 'E_CATALOG_METADATA') throw error;
  fail(`relational read: ${error.message}`);
 }
}

export async function readCatalogMetadataAsync(db) {
 const documents = await Promise.all(CATALOG_METADATA_PATHS.map(async path => [path, await readCatalogMetadataDocumentAsync(db, path)]));
 return Object.fromEntries(documents);
}
