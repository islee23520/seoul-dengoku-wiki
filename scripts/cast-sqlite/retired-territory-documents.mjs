import { createHash } from 'node:crypto';

/** The two retired current shells, in the only accepted order. */
export const RETIRED_TERRITORY_PATHS = Object.freeze([
  'lore/regions/outside-control-2126.json',
  'lore/regions/outside-island-occupation.json',
]);

const PATHS = Object.freeze(RETIRED_TERRITORY_PATHS);
const CONTROL = PATHS[0];
const ISLAND = PATHS[1];
const KIND = Object.freeze({ [CONTROL]: 'control', [ISLAND]: 'island' });
const CONTROL_KEYS = Object.freeze(['schema', 'assignments']);
const ISLAND_KEYS = Object.freeze(['schema', 'geometrySource', 'geometrySourceSha256', 'units']);
const CONTROL_SCHEMA = 'outside-control-2126.v3';
const ISLAND_SCHEMA = 'outside-island-occupation.v1';
const GEOMETRY_SOURCE = 'public/outside-admin-units.json';
const sha256Text = value => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_RETIRED_TERRITORY_DOCUMENTS: ${detail}`), { code: 'E_RETIRED_TERRITORY_DOCUMENTS' }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === 'string' && value.length > 0;
const keysFor = logicalPath => logicalPath === CONTROL ? CONTROL_KEYS : ISLAND_KEYS;
const receiptOf = (logicalPath, sourceHash, documentHash, actor, reason) => hash(JSON.stringify([
  logicalPath, sourceHash, documentHash, actor, reason,
]));
const sourceHashOf = new WeakMap();

function shape(document, logicalPath) {
  if (logicalPath === CONTROL) {
    if (!object(document) || JSON.stringify(Object.keys(document)) !== JSON.stringify(CONTROL_KEYS)) fail(`${logicalPath}: fields`);
    if (document.schema !== CONTROL_SCHEMA || !Array.isArray(document.assignments) || document.assignments.length !== 0) fail(`${logicalPath}: shell`);
    return;
  }
  if (logicalPath === ISLAND) {
    if (!object(document) || JSON.stringify(Object.keys(document)) !== JSON.stringify(ISLAND_KEYS)) fail(`${logicalPath}: fields`);
    if (document.schema !== ISLAND_SCHEMA || document.geometrySource !== GEOMETRY_SOURCE || !sha256Text(document.geometrySourceSha256)
      || !Array.isArray(document.units) || document.units.length !== 0) fail(`${logicalPath}: shell`);
    return;
  }
  fail(`unknown path ${logicalPath}`);
}

function insert(db, table, row) {
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${keys.map(key => `"${key}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(row));
}

function parseOne(logicalPath, sourceBytes) {
  if (!PATHS.includes(logicalPath) || !(sourceBytes instanceof Uint8Array)) fail(`input ${logicalPath}`);
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  } catch (error) {
    fail(`source encoding ${logicalPath}: ${error.message}`);
  }
  shape(document, logicalPath);
  sourceHashOf.set(document, hash(sourceBytes));
  return document;
}

function writeOne(db, logicalPath, document, actor, reason) {
  insert(db, 'retired_territory_documents_import', {
    logical_path: logicalPath,
    source_kind: KIND[logicalPath],
    source_role: 'retired-current',
    source_sha256: sourceHashOf.get(document),
    document_sha256: hash(JSON.stringify(document)),
    actor,
    reason,
    receipt_sha256: receiptOf(logicalPath, sourceHashOf.get(document), hash(JSON.stringify(document)), actor, reason),
  });
  keysFor(logicalPath).forEach((key, ordinal) => insert(db, 'retired_territory_documents_key', {
    logical_path: logicalPath, object_path: '', ordinal, key, is_null: 0,
  }));
  if (logicalPath === CONTROL) {
    insert(db, 'retired_territory_documents_control', { logical_path: logicalPath, schema: document.schema });
  } else {
    insert(db, 'retired_territory_documents_island', {
      logical_path: logicalPath,
      schema: document.schema,
      geometry_source: document.geometrySource,
      geometry_source_sha256: document.geometrySourceSha256,
    });
  }
}

function countsFor(entries) {
  const counts = { imports: entries.length, controls: 0, islands: 0, keys: 0 };
  for (const [logicalPath] of entries) {
    counts[logicalPath === CONTROL ? 'controls' : 'islands'] += 1;
    counts.keys += keysFor(logicalPath).length;
  }
  counts.totalRows = counts.imports + counts.controls + counts.islands + counts.keys;
  return counts;
}

/**
 * Import one fixed retired shell, or both fixed shells.
 * Single: initializer(db, { schemaSql, logicalPath, sourceBytes, actor, reason })
 * Multiple: initializer(db, {schemaSql, sources, actor, reason}) where sources is the exact two paths -> {bytes}
 * Normalization preserves the retired shells. It does not approve publication.
 */
export function initializeRetiredTerritoryDocuments(db, options = {}) {
  if (!db || db.isTransaction || typeof db.prepare !== 'function' || typeof db.exec !== 'function') fail('input');
  const { schemaSql, actor, reason } = options;
  if (![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())) fail('schema/actor/reason');
  const single = Object.hasOwn(options, 'sourceBytes');
  const multiple = Object.hasOwn(options, 'sources');
  if (single === multiple) fail('choose one source API');
  const entries = [];
  if (single) {
    if (!PATHS.includes(options.logicalPath)) fail('unknown logical path');
    entries.push([options.logicalPath, parseOne(options.logicalPath, options.sourceBytes)]);
  } else {
    if (!object(options.sources) || JSON.stringify(Object.keys(options.sources)) !== JSON.stringify(PATHS)) fail('exact source paths required');
    for (const logicalPath of PATHS) {
      const entry = options.sources[logicalPath];
      if (!object(entry) || JSON.stringify(Object.keys(entry)) !== JSON.stringify(['bytes'])) fail(`source entry ${logicalPath}`);
      entries.push([logicalPath, parseOne(logicalPath, entry.bytes)]);
    }
  }
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const [logicalPath, document] of entries) writeOne(db, logicalPath, document, actor, reason);
    for (const [logicalPath, document] of entries) {
      const read = readRetiredTerritoryDocuments(db, { logicalPath });
      if (JSON.stringify(read) !== JSON.stringify(document)) fail(`parity ${logicalPath}`);
    }
    db.exec('COMMIT');
    return countsFor(entries);
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    if (error.code === 'E_RETIRED_TERRITORY_DOCUMENTS') throw error;
    fail(error.message);
  }
}

function rows(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}

function coverage(db, imports) {
  const paths = imports.map(row => row.logical_path);
  if (rows(db, 'SELECT count(*) AS n FROM retired_territory_documents_import')[0].n !== paths.length
    || paths.some(logicalPath => !PATHS.includes(logicalPath)) || new Set(paths).size !== paths.length) fail('import coverage');
  const controlPaths = paths.filter(logicalPath => KIND[logicalPath] === 'control');
  const islandPaths = paths.filter(logicalPath => KIND[logicalPath] === 'island');
  const controls = rows(db, 'SELECT logical_path FROM retired_territory_documents_control');
  const islands = rows(db, 'SELECT logical_path FROM retired_territory_documents_island');
  if (controls.length !== controlPaths.length || controls.some(row => !controlPaths.includes(row.logical_path))) fail('control coverage');
  if (islands.length !== islandPaths.length || islands.some(row => !islandPaths.includes(row.logical_path))) fail('island coverage');
  const keyCount = controlPaths.length * CONTROL_KEYS.length + islandPaths.length * ISLAND_KEYS.length;
  if (rows(db, 'SELECT count(*) AS n FROM retired_territory_documents_key')[0].n !== keyCount) fail('key coverage');
}

function readOne(db, logicalPath) {
  const stored = rows(db, 'SELECT object_path, ordinal, key, is_null FROM retired_territory_documents_key WHERE logical_path=? ORDER BY ordinal', [logicalPath]);
  const expected = keysFor(logicalPath);
  if (stored.length !== expected.length || stored.some((row, index) => row.ordinal !== index || row.object_path !== '' || row.key !== expected[index] || row.is_null !== 0)) fail(`keys ${logicalPath}`);
  if (logicalPath === CONTROL) {
    const found = rows(db, 'SELECT schema FROM retired_territory_documents_control WHERE logical_path=?', [logicalPath]);
    if (found.length !== 1 || found[0].schema !== CONTROL_SCHEMA) fail('control value');
    return { schema: found[0].schema, assignments: [] };
  }
  const found = rows(db, 'SELECT schema, geometry_source, geometry_source_sha256 FROM retired_territory_documents_island WHERE logical_path=?', [logicalPath]);
  const row = found[0];
  if (found.length !== 1 || row.schema !== ISLAND_SCHEMA || row.geometry_source !== GEOMETRY_SOURCE || !sha256Text(row.geometry_source_sha256)) fail('island value');
  return { schema: row.schema, geometrySource: row.geometry_source, geometrySourceSha256: row.geometry_source_sha256, units: [] };
}

/**
 * SELECT-only reconstruction. No filesystem, archive, or JSON.parse.
 * Single: reader(db) when exactly one shell is stored.
 * Multiple: reader(db, {logicalPath}).
 */
export function readRetiredTerritoryDocuments(db, options = {}) {
  try {
    if (!db || typeof db.prepare !== 'function') fail('input');
    const { logicalPath } = options;
    const imports = rows(db, 'SELECT * FROM retired_territory_documents_import ORDER BY logical_path');
    let path = logicalPath;
    if (path === undefined) {
      if (Object.hasOwn(options, 'logicalPath') || imports.length !== 1) fail('single document required');
      path = imports[0].logical_path;
    }
    if (!PATHS.includes(path)) fail('unknown source');
    coverage(db, imports);
    const receipt = imports.filter(row => row.logical_path === path);
    if (receipt.length !== 1) fail('receipt count');
    const row = receipt[0];
    if (row.source_kind !== KIND[path] || row.source_role !== 'retired-current'
      || !text(row.actor) || !row.actor.trim()
      || !text(row.reason) || !row.reason.trim()) fail('provenance');
    const document = readOne(db, path);
    shape(document, path);
    return document;
  } catch (error) {
    if (error.code === 'E_RETIRED_TERRITORY_DOCUMENTS') throw error;
    fail(error.message);
  }
}
