import { createHash } from 'node:crypto';


const LOGICAL_PATH = 'scripts/data/admin-territorial-catalog.json';
const CODE = 'E_ADMIN_TERRITORIAL_DOCUMENT';
const UNIT_COUNT = 1842;

const ROOT_KEYS = ['schema', 'sourceRef', 'sourceSha256', 'units'];
const UNIT_KEYS = ['adminId', 'provinceId', 'parentId', 'provinceName', 'parentName', 'name'];

const KEY_SHAPES = [
  ['', ROOT_KEYS],
  ...Array.from({ length: UNIT_COUNT }, (_, ordinal) => [`/units/${ordinal}`, UNIT_KEYS]),
];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => {
  throw Object.assign(new Error(`${CODE}: ${detail}`), { code: CODE });
};
const sameKeys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);
const text = value => typeof value === 'string' && value.length > 0;
const digits = (value, length) => typeof value === 'string' && value.length === length && /^[0-9]+$/.test(value);

function shape(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('unknown, missing, or unordered root fields');
  if (document.schema !== 'admin-territorial-catalog.v1') fail('schema name');
  if (document.sourceRef !== 'lore/regions/sources/selection.json#selected_boundary') fail('source ref');
  if (!/^[0-9a-f]{64}$/u.test(document.sourceSha256)) fail('source sha256 field');
  if (!Array.isArray(document.units) || document.units.length !== UNIT_COUNT) fail('unit count');
  const seen = new Set();
  for (const unit of document.units) {
    if (!sameKeys(unit, UNIT_KEYS)) fail('unit fields');
    if (!digits(unit.adminId, 10) || !digits(unit.provinceId, 2) || !digits(unit.parentId, 5)) fail('unit ids');
    if (!text(unit.provinceName) || !text(unit.parentName) || !text(unit.name)) fail('unit names');
    if (!unit.adminId.startsWith(unit.parentId) || !unit.parentId.startsWith(unit.provinceId)) fail('unit id nesting');
    if (!unit.name.startsWith(`${unit.provinceName} ${unit.parentName} `)) fail('unit name nesting');
    if (seen.has(unit.adminId)) fail('duplicate admin id');
    seen.add(unit.adminId);
  }
}

function decode(sourceBytes) {
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  } catch {
    fail('source bytes');
  }
  shape(document);
  return document;
}

const sourceHashOf = new WeakMap();
const receiptOf = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([
  sourceHash, documentHash, actor, reason,
]));

function insertDocument(db, document, actor, reason) {
  db.prepare(`INSERT INTO admin_territorial_document_document (
    document_id, source_sha256, document_sha256, schema_name, source_ref, source_sha256_field,
    unit_count, actor, import_reason, receipt_sha256
  ) VALUES (1,?,?,?,?,?,?,?,?,?)`).run(
    sourceHashOf.get(document),
    hash(JSON.stringify(document)),
    document.schema,
    document.sourceRef,
    document.sourceSha256,
    document.units.length,
    actor,
    reason,
    receiptOf(sourceHashOf.get(document), hash(JSON.stringify(document)), actor, reason),
  );
  const keyInsert = db.prepare('INSERT INTO admin_territorial_document_key (object_path, ordinal, key) VALUES (?,?,?)');
  for (const [objectPath, keys] of KEY_SHAPES) keys.forEach((key, ordinal) => keyInsert.run(objectPath, ordinal, key));
  const unitInsert = db.prepare(`INSERT INTO admin_territorial_document_unit (
    ordinal, admin_id, province_id, parent_id, province_name, parent_name, name
  ) VALUES (?,?,?,?,?,?,?)`);
  document.units.forEach((unit, ordinal) => unitInsert.run(
    ordinal, unit.adminId, unit.provinceId, unit.parentId, unit.provinceName, unit.parentName, unit.name,
  ));
}

const COUNTS = {
  documents: 1,
  keys: KEY_SHAPES.reduce((sum, [, keys]) => sum + keys.length, 0),
  units: UNIT_COUNT,
};
COUNTS.totalRows = Object.values(COUNTS).reduce((sum, value) => sum + value, 0);

function ordered(db, table, count) {
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all();
  if (rows.length !== count || rows.some((row, ordinal) => row.ordinal !== ordinal)) fail(`${table} coverage`);
  return rows;
}

function assemble(db) {
  const rows = db.prepare('SELECT * FROM admin_territorial_document_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1) fail('document id');
  if (typeof row.actor !== 'string' || !row.actor.trim()
    || typeof row.import_reason !== 'string' || !row.import_reason.trim()) fail('provenance');
  if (row.schema_name !== 'admin-territorial-catalog.v1'
    || row.source_ref !== 'lore/regions/sources/selection.json#selected_boundary'
    || row.unit_count !== UNIT_COUNT) fail('document scalars');
  const keys = db.prepare('SELECT object_path, ordinal, key FROM admin_territorial_document_key ORDER BY object_path, ordinal').all();
  if (keys.length !== COUNTS.keys) fail('key coverage');
  const grouped = new Map();
  for (const key of keys) {
    const list = grouped.get(key.object_path) ?? [];
    if (key.ordinal !== list.length) fail('key order');
    list.push(key.key);
    grouped.set(key.object_path, list);
  }
  if (grouped.size !== KEY_SHAPES.length) fail('key shapes');
  for (const [objectPath, expected] of KEY_SHAPES) {
    if (JSON.stringify(grouped.get(objectPath)) !== JSON.stringify(expected)) fail(`key order ${objectPath || '/'}`);
  }
  const units = ordered(db, 'admin_territorial_document_unit', UNIT_COUNT).map(item => ({
    adminId: item.admin_id,
    provinceId: item.province_id,
    parentId: item.parent_id,
    provinceName: item.province_name,
    parentName: item.parent_name,
    name: item.name,
  }));
  const document = {
    schema: row.schema_name,
    sourceRef: row.source_ref,
    sourceSha256: row.source_sha256_field,
    units,
  };
  shape(document);
  return document;
}

function acceptSingle(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const { schemaSql, sourceBytes, actor, reason } = options;
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sourceBytes', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  const document = decode(sourceBytes);
  sourceHashOf.set(document, hash(sourceBytes));
  return document;
}

function acceptMany(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const { schemaSql, sources, actor, reason } = options;
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sources', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources) || Object.keys(sources).length !== 1
    || !Object.hasOwn(sources, LOGICAL_PATH)) fail('source paths');
  const source = sources[LOGICAL_PATH];
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || JSON.stringify(Object.keys(source)) !== JSON.stringify(['bytes'])) fail('source entry');
  return acceptSingle({
    schemaSql, sourceBytes: source.bytes, actor, reason,
  });
}

function write(db, schemaSql, document, actor, reason) {
  if (db.isTransaction) fail('transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    insertDocument(db, document, actor, reason);
    const actual = assemble(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('transaction parity');
    db.exec('COMMIT');
    return { ...COUNTS };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Import exactly one bounded source. Does not infer missing fields, drop units outside Seoul, or approve publication.
 * Single-source: { schemaSql, sourceBytes, actor, reason }.
 * Multiple-source: { schemaSql, sources, actor, reason } with sources[path] = { bytes }.
 */
export function initializeAdminTerritorialDocument(db, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  if (Object.hasOwn(options, 'sources')) {
    const document = acceptMany(options);
    return write(db, options.schemaSql, document, options.actor, options.reason);
  }
  const document = acceptSingle(options);
  return write(db, options.schemaSql, document, options.actor, options.reason);
}

/**
 * SELECT-only reconstruction. No filesystem, archive, JSON.parse, or writes.
 * Options: optional { logicalPath }.
 */
export function readAdminTerritorialDocument(db, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'logicalPath')) fail('reader fields');
  if (Object.hasOwn(options, 'logicalPath') && options.logicalPath !== LOGICAL_PATH) fail('logical path');
  return assemble(db);
}
