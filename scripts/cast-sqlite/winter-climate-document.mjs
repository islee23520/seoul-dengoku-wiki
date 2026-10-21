import { createHash } from 'node:crypto';

export const WINTER_CLIMATE_SOURCE_HASH = '0dee07ed28dd11d01251db1f1d3f31867d201ba7f0f7b82afeed884015bbaa14';
export const WINTER_CLIMATE_LOGICAL_PATH = 'lore/places/sources/Winter-Climate-20210108.json';
const DOCUMENT_HASH = '0e65a77c8ee9920183d309a5be6b90f9477f17dd4fe50f17f2d63d3bdcdd1e74';
const ROW_DIGEST = '3d322bfed1291ecf2cec0a300245d9502c7a8313c965a2bb774ff712c7c9fd1b';
const SOURCE_HASHES = Object.freeze({ [WINTER_CLIMATE_LOGICAL_PATH]: WINTER_CLIMATE_SOURCE_HASH });
const DOCUMENT_HASHES = Object.freeze({ [WINTER_CLIMATE_LOGICAL_PATH]: DOCUMENT_HASH });
const ROOT_KEYS = ['version', 'kind', 'date', 'timezone', 'administrative_basis', 'selection', 'metric', 'application', 'records'];
const APPLICATION_KEYS = ['surface', 'intermediate_underground_c', 'deep_underground_c', 'underground_source', 'resolution'];
const RECORD_KEYS = ['region_code_2021', 'region_ko', 'region_en', 'station_id', 'station_ko', 'date', 'timezone', 'minimum_c', 'maximum_c', 'mean_c', 'source_url', 'source_sha256', 'retrieved_at'];
const ROOT_COLUMNS = ['version', 'kind', 'date', 'timezone', 'administrative_basis', 'selection', 'metric'];
const APPLICATION_COLUMNS = { surface: 'surface', underground_source: 'underground_source', resolution: 'resolution' };
const RECORD_COLUMNS = {
  region_code_2021: 'region_code_2021', region_ko: 'region_ko', region_en: 'region_en', station_id: 'station_id',
  station_ko: 'station_ko', date: 'date', timezone: 'timezone', minimum_c: 'minimum_c', maximum_c: 'maximum_c',
  mean_c: 'mean_c', source_url: 'source_url', source_sha256: 'source_sha256', retrieved_at: 'retrieved_at',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_WINTER_CLIMATE_DOCUMENT: ${detail}`), { code: 'E_WINTER_CLIMATE_DOCUMENT' }); };
const receiptOf = (logicalPath, actor, reason) => hash(JSON.stringify([SOURCE_HASHES[logicalPath], DOCUMENT_HASHES[logicalPath], actor, reason]));
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string';
const finite = value => typeof value === 'number' && Number.isFinite(value);
const integer = value => Number.isSafeInteger(value);

function keys(value, expected, label) {
  if (!plain(value) || JSON.stringify(Object.keys(value)) !== JSON.stringify(expected)) fail(`${label}: unknown, missing, or unordered fields`);
}
function bound(value, label) {
  if (!Array.isArray(value) || value.length !== 2 || value.some(item => !integer(item))) fail(label);
}
function shape(document) {
  keys(document, ROOT_KEYS, 'document');
  if (!integer(document.version) || [document.kind, document.date, document.timezone, document.administrative_basis, document.selection, document.metric].some(value => !text(value))) fail('document scalars');
  keys(document.application, APPLICATION_KEYS, 'application');
  if ([document.application.surface, document.application.underground_source, document.application.resolution].some(value => !text(value))) fail('application scalars');
  bound(document.application.intermediate_underground_c, 'intermediate bound');
  bound(document.application.deep_underground_c, 'deep bound');
  if (!Array.isArray(document.records) || document.records.length !== 17) fail('records');
  for (const record of document.records) {
    keys(record, RECORD_KEYS, 'record');
    if ([record.region_code_2021, record.region_ko, record.region_en, record.station_ko, record.date, record.timezone, record.source_url, record.source_sha256, record.retrieved_at].some(value => !text(value))) fail('record text');
    if (!integer(record.station_id) || [record.minimum_c, record.maximum_c, record.mean_c].some(value => !finite(value))) fail('record numbers');
  }
}

function sourceMap(sources) {
  const paths = Object.keys(SOURCE_HASHES);
  if (!plain(sources) || JSON.stringify(Object.keys(sources)) !== JSON.stringify(paths)) fail('exact source paths');
  const documents = new Map();
  for (const logicalPath of paths) {
    const source = sources[logicalPath];
    if (!plain(source) || JSON.stringify(Object.keys(source)) !== JSON.stringify(['bytes', 'expectedSourceHash'])
      || !(source.bytes instanceof Uint8Array) || source.expectedSourceHash !== SOURCE_HASHES[logicalPath]) fail(`${logicalPath}: source contract`);
    let document;
    try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(source.bytes)); }
    catch (error) { fail(`${logicalPath}: source encoding: ${error.message}`); }
    shape(document);
    if (hash(source.bytes) !== SOURCE_HASHES[logicalPath] || hash(JSON.stringify(document)) !== DOCUMENT_HASHES[logicalPath]) fail(`${logicalPath}: fixed bytes/document hash`);
    documents.set(logicalPath, document);
  }
  return documents;
}

function insertDocument(db, logicalPath, document, actor, reason) {
  db.prepare('INSERT INTO winter_climate_document_import VALUES (?,?,?,?,?,?)')
    .run(logicalPath, SOURCE_HASHES[logicalPath], DOCUMENT_HASHES[logicalPath], actor, reason, receiptOf(logicalPath, actor, reason));
  db.prepare(`INSERT INTO winter_climate_document_root VALUES (${Array(8).fill('?').join(',')})`)
    .run(logicalPath, ...ROOT_COLUMNS.map(key => document[key]));
  db.prepare('INSERT INTO winter_climate_document_application VALUES (?,?,?,?)')
    .run(logicalPath, document.application.surface, document.application.underground_source, document.application.resolution);
  const insertBound = db.prepare('INSERT INTO winter_climate_document_bound VALUES (?,?,?,?)');
  for (const name of ['intermediate_underground_c', 'deep_underground_c']) {
    document.application[name].forEach((celsius, ordinal) => insertBound.run(logicalPath, name, ordinal, celsius));
  }
  const recordColumns = ['logical_path', 'ordinal', ...RECORD_KEYS];
  const insertRecord = db.prepare(`INSERT INTO winter_climate_document_record (${recordColumns.join(',')}) VALUES (${recordColumns.map(() => '?').join(',')})`);
  const insertKey = db.prepare('INSERT INTO winter_climate_document_key VALUES (?,?,?,?)');
  document.records.forEach((record, ordinal) => {
    insertRecord.run(logicalPath, ordinal, ...RECORD_KEYS.map(key => record[key]));
    RECORD_KEYS.forEach((key, keyOrdinal) => insertKey.run(logicalPath, `record/${ordinal}`, keyOrdinal, key));
  });
  ROOT_KEYS.forEach((key, ordinal) => insertKey.run(logicalPath, 'document', ordinal, key));
  APPLICATION_KEYS.forEach((key, ordinal) => insertKey.run(logicalPath, 'application', ordinal, key));
}

function load(db, { schemaSql, sources, actor, reason }) {
  if (!db || db.isTransaction || typeof db.prepare !== 'function' || typeof db.exec !== 'function') fail('input');
  if (![schemaSql, actor, reason].every(value => text(value) && value.trim())) fail('schema/actor/reason');
  const documents = sourceMap(sources);
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='table' AND name LIKE 'winter_climate_document_%'").get().n) fail('already loaded');
    db.exec(schemaSql);
    for (const [logicalPath, document] of documents) {
      insertDocument(db, logicalPath, document, actor, reason);
      const actual = readOne(db, logicalPath, SOURCE_HASHES[logicalPath]);
      if (JSON.stringify(actual) !== JSON.stringify(document)) fail(`${logicalPath}: transaction parity`);
    }
    db.exec('COMMIT');
    return { documents: documents.size, applications: documents.size, bounds: documents.size * 4, records: documents.size * 17, keys: documents.size * 235 };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/** Import one pinned source. Normalization stores the historical reference and does not approve publication. */
export function initializeWinterClimateDocument(db, input = {}) {
  if (Object.hasOwn(input, 'sources')) return load(db, input);
  const { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = input;
  return load(db, { schemaSql, sources: { [WINTER_CLIMATE_LOGICAL_PATH]: { bytes: sourceBytes, expectedSourceHash } }, actor, reason });
}

function ordered(rows, label) {
  rows.forEach((row, index) => {
    if (!integer(row.ordinal) || row.ordinal !== index) fail(`${label} order`);
  });
  return rows;
}
function keyMap(rows) {
  if (rows.length !== 235) fail(`key count ${rows.length}`);
  const map = new Map();
  for (const row of rows) {
    if (!text(row.object_path) || !text(row.key) || !integer(row.ordinal)) fail('key type');
    const list = map.get(row.object_path) ?? [];
    if (row.ordinal !== list.length || list.includes(row.key)) fail('key order');
    list.push(row.key);
    map.set(row.object_path, list);
  }
  return map;
}

function readOne(db, logicalPath, expectedSourceHash) {
  if (!Object.hasOwn(SOURCE_HASHES, logicalPath) || expectedSourceHash !== SOURCE_HASHES[logicalPath]) fail('expected hash');
  const imports = db.prepare('SELECT * FROM winter_climate_document_import').all();
  if (imports.length !== 1 || imports[0].logical_path !== logicalPath) fail('import count');
  const receipt = imports[0];
  if (receipt.source_sha256 !== expectedSourceHash || receipt.document_sha256 !== DOCUMENT_HASHES[logicalPath]
    || !text(receipt.actor) || !receipt.actor.trim() || !text(receipt.reason) || !receipt.reason.trim()
    || receipt.receipt_sha256 !== receiptOf(logicalPath, receipt.actor, receipt.reason)) fail('provenance');
  const roots = db.prepare('SELECT * FROM winter_climate_document_root').all();
  const applications = db.prepare('SELECT * FROM winter_climate_document_application').all();
  if (roots.length !== 1 || applications.length !== 1 || roots[0].logical_path !== logicalPath || applications[0].logical_path !== logicalPath) fail('singleton coverage');
  const root = roots[0];
  const application = applications[0];
  const bounds = db.prepare('SELECT * FROM winter_climate_document_bound ORDER BY logical_path, bound_name, ordinal').all();
  const records = ordered(db.prepare('SELECT * FROM winter_climate_document_record ORDER BY logical_path, ordinal').all(), 'record');
  const keyRows = db.prepare('SELECT * FROM winter_climate_document_key ORDER BY logical_path, object_path, ordinal').all();
  if ([...bounds, ...records, ...keyRows].some(row => row.logical_path !== logicalPath)) fail('child path');
  const keysByPath = keyMap(keyRows);
  if (JSON.stringify(keysByPath.get('document')) !== JSON.stringify(ROOT_KEYS)) fail('document keys');
  if (JSON.stringify(keysByPath.get('application')) !== JSON.stringify(APPLICATION_KEYS)) fail('application keys');
  if (records.length !== 17) fail('record count');
  const boundLists = new Map();
  for (const row of bounds) {
    if (!['intermediate_underground_c', 'deep_underground_c'].includes(row.bound_name) || !integer(row.celsius)) fail('bound row');
    const list = boundLists.get(row.bound_name) ?? [];
    if (!integer(row.ordinal) || row.ordinal !== list.length) fail('bound order');
    list.push(row.celsius);
    boundLists.set(row.bound_name, list);
  }
  if (boundLists.size !== 2 || [...boundLists.values()].some(list => list.length !== 2)) fail('bound coverage');
  const builtRecords = records.map(row => {
    const recordKeys = keysByPath.get(`record/${row.ordinal}`);
    if (JSON.stringify(recordKeys) !== JSON.stringify(RECORD_KEYS)) fail('record keys');
    return Object.fromEntries(recordKeys.map(key => [key, row[RECORD_COLUMNS[key]]]));
  });
  const document = {};
  for (const key of keysByPath.get('document')) {
    if (ROOT_COLUMNS.includes(key)) document[key] = root[key];
    else if (key === 'application') {
      document.application = {};
      for (const applicationKey of keysByPath.get('application')) {
        if (Object.hasOwn(APPLICATION_COLUMNS, applicationKey)) document.application[applicationKey] = application[APPLICATION_COLUMNS[applicationKey]];
        else if (boundLists.has(applicationKey)) document.application[applicationKey] = boundLists.get(applicationKey);
        else fail(`unknown application key ${applicationKey}`);
      }
    } else if (key === 'records') document.records = builtRecords;
    else fail(`unknown document key ${key}`);
  }
  const allowed = new Set(['document', 'application', ...records.map(row => `record/${row.ordinal}`)]);
  if (keysByPath.size !== allowed.size || [...keysByPath.keys()].some(path => !allowed.has(path))) fail('key paths');
  shape(document);
  if (hash(JSON.stringify(document)) !== DOCUMENT_HASHES[logicalPath]) fail('document hash');
  const sourceRows = {
    root: (({ logical_path, ...row }) => row)(root),
    application: (({ logical_path, ...row }) => row)(application),
    bounds: bounds.map(({ logical_path, ...row }) => row),
    records: records.map(({ logical_path, ...row }) => row),
    keys: keyRows.map(({ logical_path, ...row }) => row),
  };
  if (hash(JSON.stringify(sourceRows)) !== ROW_DIGEST) fail('row digest');
  return document;
}

/** SELECT-only reconstruction. No source I/O, archive access, or JSON parsing. */
export function readWinterClimateDocument(db, input = {}) {
  try {
    if (Object.hasOwn(input, 'logicalPath')) return readOne(db, input.logicalPath, input.expectedSourceHash);
    return readOne(db, WINTER_CLIMATE_LOGICAL_PATH, input.expectedSourceHash);
  } catch (error) {
    if (error.code === 'E_WINTER_CLIMATE_DOCUMENT') throw error;
    fail(error.message);
  }
}
