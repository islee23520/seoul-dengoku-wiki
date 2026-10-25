import { createHash } from 'node:crypto';

/** SHA-256 of the original lore/regions/sources/boundary-comparison.json bytes. */
export const BOUNDARY_COMPARISON_SOURCE_HASH = 'e1da70f294f1e610bc3e0c864d6f356de385a527551977a798c0297f2e6445af';
/** SHA-256 of JSON.stringify of the parsed document, original key order preserved. */
export const BOUNDARY_COMPARISON_DOCUMENT_HASH = 'fc33b1ccaa59968eae02e0c82bc2d20388972a72a3d5c5bba035520cbb46dbab';

const LOGICAL_PATH = 'lore/regions/sources/boundary-comparison.json';
const CODE = 'E_BOUNDARY_COMPARISON_DOCUMENT';

const ROOT_KEYS = [
  'path', 'sha256', 'source_version', 'publication_commit', 'authority',
  'crs_source', 'crs_measurement', 'total_country_features', 'seoul_features',
  'unique_adm_cd2', 'districts', 'invalid_ids', 'empty_ids', 'city_area_m2',
  'sum_area_m2', 'overlap_excess_m2', 'bounds_wgs84', 'kostat_only_m2',
  'candidate_only_m2', 'symmetric_difference_m2', 'district_rows',
  'graph_outside_candidate', 'graph_district_mismatch', 'seoul_names',
];
const CRS_KEYS = ['type', 'properties'];
const CRS_PROPERTY_KEYS = ['name'];
const DISTRICT_KEYS = ['name', 'dong_count', 'area_m2'];
const MISMATCH_KEYS = ['id', 'old', 'candidate'];
const STRING_LISTS = ['invalid_ids', 'empty_ids', 'graph_outside_candidate', 'seoul_names'];
const STRING_LIST_COUNTS = { invalid_ids: 0, empty_ids: 0, graph_outside_candidate: 2, seoul_names: 427 };
const ROOT_NUMBERS = [
  'city_area_m2', 'sum_area_m2', 'overlap_excess_m2',
  'kostat_only_m2', 'candidate_only_m2', 'symmetric_difference_m2',
];
const ROOT_INTEGERS = ['total_country_features', 'seoul_features', 'unique_adm_cd2', 'districts'];
const COUNTS = {
  document: 1,
  crs_source: 1,
  key: 198,
  string_item: 429,
  bound: 4,
  district: 25,
  mismatch: 32,
  mismatch_candidate: 32,
};

const KEY_SHAPES = [
  ['', ROOT_KEYS],
  ['/crs_source', CRS_KEYS],
  ['/crs_source/properties', CRS_PROPERTY_KEYS],
  ...Array.from({ length: 25 }, (_, ordinal) => [`/district_rows/${ordinal}`, DISTRICT_KEYS]),
  ...Array.from({ length: 32 }, (_, ordinal) => [`/graph_district_mismatch/${ordinal}`, MISMATCH_KEYS]),
];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => {
  throw Object.assign(new Error(`${CODE}: ${detail}`), { code: CODE });
};
const text = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const plain = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const sameKeys = (value, expected) => plain(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);
const numberText = value => JSON.stringify(value);
const receipt = (actor, reason) => hash(JSON.stringify([
  BOUNDARY_COMPARISON_SOURCE_HASH, BOUNDARY_COMPARISON_DOCUMENT_HASH, actor, reason,
]));

function shape(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('unknown, missing, or unordered root fields');
  if (![document.path, document.sha256, document.source_version, document.publication_commit, document.authority, document.crs_measurement].every(text)) fail('root text');
  if (!/^[0-9a-f]{64}$/.test(document.sha256) || !/^[0-9a-f]{40}$/.test(document.publication_commit)) fail('root identifiers');
  if (!sameKeys(document.crs_source, CRS_KEYS) || !text(document.crs_source.type)) fail('crs_source fields');
  if (!sameKeys(document.crs_source.properties, CRS_PROPERTY_KEYS) || !text(document.crs_source.properties.name)) fail('crs properties');
  for (const key of ROOT_INTEGERS) if (!integer(document[key]) || document[key] < 0) fail(`${key} integer`);
  for (const key of ROOT_NUMBERS) if (!finite(document[key])) fail(`${key} number`);
  if (!Array.isArray(document.bounds_wgs84) || document.bounds_wgs84.length !== 4 || document.bounds_wgs84.some(value => !finite(value))) fail('bounds');
  for (const key of STRING_LISTS) {
    if (!Array.isArray(document[key]) || document[key].length !== STRING_LIST_COUNTS[key] || document[key].some(value => !text(value))) fail(`${key} list`);
  }
  if (!Array.isArray(document.district_rows) || document.district_rows.length !== 25) fail('district rows');
  for (const row of document.district_rows) {
    if (!sameKeys(row, DISTRICT_KEYS) || !text(row.name) || !integer(row.dong_count) || row.dong_count < 0 || !finite(row.area_m2)) fail('district fields');
  }
  if (!Array.isArray(document.graph_district_mismatch) || document.graph_district_mismatch.length !== 32) fail('mismatch rows');
  for (const row of document.graph_district_mismatch) {
    if (!sameKeys(row, MISMATCH_KEYS) || !text(row.id) || !text(row.old)) fail('mismatch fields');
    if (!Array.isArray(row.candidate) || row.candidate.length !== 1 || row.candidate.some(value => !text(value))) fail('mismatch candidate');
  }
  const unique = (rows, key) => new Set(rows.map(row => row[key])).size === rows.length;
  if (!unique(document.district_rows, 'name') || !unique(document.graph_district_mismatch, 'id') || new Set(document.seoul_names).size !== document.seoul_names.length) fail('duplicate identity');
}

function insertKeys(db) {
  const statement = db.prepare('INSERT INTO boundary_comparison_document_key (object_path, ordinal, key) VALUES (?, ?, ?)');
  for (const [objectPath, keys] of KEY_SHAPES) keys.forEach((key, ordinal) => statement.run(objectPath, ordinal, key));
}

function optionKeys(value) {
  if (!plain(value)) fail('input');
  const keys = Object.keys(value);
  const allowed = ['schemaSql', 'sourceBytes', 'expectedSourceHash', 'sources', 'actor', 'reason'];
  if (keys.some(key => !allowed.includes(key))) fail('unknown input');
  return keys;
}

function resolveInput(options) {
  const keys = optionKeys(options);
  const { schemaSql, actor, reason } = options;
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || ![actor, reason].every(value => typeof value === 'string' && value.trim())) fail('schema/actor/reason');
  const single = keys.includes('sourceBytes') || keys.includes('expectedSourceHash');
  const multiple = keys.includes('sources');
  if (single === multiple) fail('source form');
  if (multiple) {
    if (!plain(options.sources) || JSON.stringify(Object.keys(options.sources)) !== JSON.stringify([LOGICAL_PATH])) fail('logical path');
    const entry = options.sources[LOGICAL_PATH];
    if (!plain(entry) || JSON.stringify(Object.keys(entry)) !== JSON.stringify(['bytes', 'expectedSourceHash'])) fail('source entry');
    return { schemaSql, sourceBytes: entry.bytes, expectedSourceHash: entry.expectedSourceHash, actor, reason };
  }
  if (JSON.stringify(keys.filter(key => key !== 'schemaSql' && key !== 'actor' && key !== 'reason')) !== JSON.stringify(['sourceBytes', 'expectedSourceHash'])) fail('source form');
  return { schemaSql, sourceBytes: options.sourceBytes, expectedSourceHash: options.expectedSourceHash, actor, reason };
}

/** Import only the exact authored comparison. Normalization grants no publication approval. */
export function initializeBoundaryComparisonDocument(db, options = {}) {
  const { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = resolveInput(options);
  if (db.isTransaction) fail('active transaction');
  if (!(sourceBytes instanceof Uint8Array) || expectedSourceHash !== BOUNDARY_COMPARISON_SOURCE_HASH) fail('explicit fixed source hash/bytes required');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  if (hash(sourceBytes) !== BOUNDARY_COMPARISON_SOURCE_HASH || hash(JSON.stringify(document)) !== BOUNDARY_COMPARISON_DOCUMENT_HASH) fail('fixed bytes/document hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare(`INSERT INTO boundary_comparison_document_document (
      document_id, source_sha256, document_sha256, path, sha256, source_version, publication_commit, authority,
      crs_measurement, total_country_features, seoul_features, unique_adm_cd2, districts,
      city_area_m2, sum_area_m2, overlap_excess_m2, kostat_only_m2, candidate_only_m2, symmetric_difference_m2,
      actor, reason, receipt_sha256
    ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      expectedSourceHash, BOUNDARY_COMPARISON_DOCUMENT_HASH, document.path, document.sha256,
      document.source_version, document.publication_commit, document.authority, document.crs_measurement,
      ...ROOT_INTEGERS.map(key => document[key]),
      ...ROOT_NUMBERS.map(key => numberText(document[key])),
      actor, reason, receipt(actor, reason),
    );
    db.prepare('INSERT INTO boundary_comparison_document_crs_source (document_id, type, crs_name) VALUES (1, ?, ?)').run(
      document.crs_source.type, document.crs_source.properties.name,
    );
    insertKeys(db);
    const insertString = db.prepare('INSERT INTO boundary_comparison_document_string_item (list_name, ordinal, value) VALUES (?, ?, ?)');
    for (const listName of STRING_LISTS) document[listName].forEach((value, ordinal) => insertString.run(listName, ordinal, value));
    const insertBound = db.prepare('INSERT INTO boundary_comparison_document_bound (ordinal, value_text) VALUES (?, ?)');
    document.bounds_wgs84.forEach((value, ordinal) => insertBound.run(ordinal, numberText(value)));
    const insertDistrict = db.prepare('INSERT INTO boundary_comparison_document_district (ordinal, name, dong_count, area_m2) VALUES (?, ?, ?, ?)');
    document.district_rows.forEach((row, ordinal) => insertDistrict.run(ordinal, row.name, row.dong_count, numberText(row.area_m2)));
    const insertMismatch = db.prepare('INSERT INTO boundary_comparison_document_mismatch (ordinal, id, old_district) VALUES (?, ?, ?)');
    const insertCandidate = db.prepare('INSERT INTO boundary_comparison_document_mismatch_candidate (mismatch_ordinal, ordinal, district) VALUES (?, ?, ?)');
    document.graph_district_mismatch.forEach((row, ordinal) => {
      insertMismatch.run(ordinal, row.id, row.old);
      row.candidate.forEach((district, index) => insertCandidate.run(ordinal, index, district));
    });
    readBoundaryComparisonDocument(db, { expectedSourceHash });
    db.exec('COMMIT');
    return {
      documents: COUNTS.document, crsSources: COUNTS.crs_source, keys: COUNTS.key, stringItems: COUNTS.string_item, bounds: COUNTS.bound,
      districts: COUNTS.district, mismatches: COUNTS.mismatch, candidates: COUNTS.mismatch_candidate,
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

const ordered = (db, sql, count, label) => {
  const rows = db.prepare(sql).all();
  if (rows.length !== count || rows.some((row, index) => row.ordinal !== index)) fail(`${label} coverage`);
  return rows;
};

function parseNumber(value, label) {
  if (typeof value !== 'string' || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) fail(`${label} decimal`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || JSON.stringify(parsed) !== value) fail(`${label} decimal`);
  return parsed;
}

function consumeKeys(rows, objectPath, expected) {
  const owned = rows.filter(row => row.object_path === objectPath);
  if (owned.length !== expected.length || owned.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${objectPath || 'root'} key order`);
  return owned.length;
}

function readOptions(options) {
  if (!plain(options)) fail('expected hash');
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'expectedSourceHash' && key !== 'logicalPath')) fail('unknown reader field');
  if (!keys.includes('expectedSourceHash')) fail('expected hash');
  if (keys.includes('logicalPath') && options.logicalPath !== LOGICAL_PATH) fail('logical path');
  return options.expectedSourceHash;
}

/** SELECT-only reconstruction. No filesystem, archive, or JSON.parse. */
export function readBoundaryComparisonDocument(db, options = {}) {
  const expectedSourceHash = readOptions(options);
  try {
    if (expectedSourceHash !== BOUNDARY_COMPARISON_SOURCE_HASH) fail('explicit fixed source hash required');
    const documents = db.prepare('SELECT document_id, source_sha256, document_sha256, path, sha256, source_version, publication_commit, authority, crs_measurement, total_country_features, seoul_features, unique_adm_cd2, districts, city_area_m2, sum_area_m2, overlap_excess_m2, kostat_only_m2, candidate_only_m2, symmetric_difference_m2, actor, reason, receipt_sha256 FROM boundary_comparison_document_document').all();
    if (documents.length !== 1) fail('document count');
    const row = documents[0];
    if (row.document_id !== 1 || row.source_sha256 !== expectedSourceHash || row.document_sha256 !== BOUNDARY_COMPARISON_DOCUMENT_HASH) fail('provenance');
    if (!text(row.actor) || !row.actor.trim() || !text(row.reason) || !row.reason.trim() || row.receipt_sha256 !== receipt(row.actor, row.reason)) fail('provenance');
    const crsRows = db.prepare('SELECT document_id, type, crs_name FROM boundary_comparison_document_crs_source').all();
    if (crsRows.length !== 1 || crsRows[0].document_id !== 1 || !text(crsRows[0].type) || !text(crsRows[0].crs_name)) fail('crs row');
    const keyRows = db.prepare('SELECT object_path, ordinal, key FROM boundary_comparison_document_key ORDER BY object_path, ordinal').all();
    if (keyRows.length !== COUNTS.key) fail('key coverage');
    let consumed = 0;
    for (const [objectPath, keys] of KEY_SHAPES) consumed += consumeKeys(keyRows, objectPath, keys);
    if (consumed !== keyRows.length) fail('unconsumed key rows');
    const strings = db.prepare('SELECT list_name, ordinal, value FROM boundary_comparison_document_string_item ORDER BY list_name, ordinal').all();
    if (strings.length !== COUNTS.string_item) fail('string coverage');
    const lists = Object.fromEntries(STRING_LISTS.map(name => [name, []]));
    for (const item of strings) {
      if (!Object.hasOwn(lists, item.list_name) || item.ordinal !== lists[item.list_name].length || !text(item.value)) fail('string order');
      lists[item.list_name].push(item.value);
    }
    for (const name of STRING_LISTS) if (lists[name].length !== STRING_LIST_COUNTS[name]) fail(`${name} coverage`);
    const bounds = ordered(db, 'SELECT ordinal, value_text FROM boundary_comparison_document_bound ORDER BY ordinal', 4, 'bound').map(item => parseNumber(item.value_text, 'bound'));
    const districts = ordered(db, 'SELECT ordinal, name, dong_count, area_m2 FROM boundary_comparison_document_district ORDER BY ordinal', 25, 'district').map(item => {
      if (!text(item.name) || !integer(item.dong_count) || item.dong_count < 0) fail('district row');
      return { name: item.name, dong_count: item.dong_count, area_m2: parseNumber(item.area_m2, 'district area') };
    });
    const mismatches = ordered(db, 'SELECT ordinal, id, old_district FROM boundary_comparison_document_mismatch ORDER BY ordinal', 32, 'mismatch');
    const candidates = db.prepare('SELECT mismatch_ordinal, ordinal, district FROM boundary_comparison_document_mismatch_candidate ORDER BY mismatch_ordinal, ordinal').all();
    if (candidates.length !== COUNTS.mismatch_candidate) fail('candidate coverage');
    const mismatchRows = mismatches.map(item => {
      if (!text(item.id) || !text(item.old_district)) fail('mismatch row');
      const owned = candidates.filter(candidate => candidate.mismatch_ordinal === item.ordinal);
      if (owned.length !== 1 || owned[0].ordinal !== 0 || !text(owned[0].district)) fail('candidate order');
      return { id: item.id, old: item.old_district, candidate: owned.map(candidate => candidate.district) };
    });
    const document = {
      path: row.path,
      sha256: row.sha256,
      source_version: row.source_version,
      publication_commit: row.publication_commit,
      authority: row.authority,
      crs_source: { type: crsRows[0].type, properties: { name: crsRows[0].crs_name } },
      crs_measurement: row.crs_measurement,
      total_country_features: row.total_country_features,
      seoul_features: row.seoul_features,
      unique_adm_cd2: row.unique_adm_cd2,
      districts: row.districts,
      invalid_ids: lists.invalid_ids,
      empty_ids: lists.empty_ids,
      city_area_m2: parseNumber(row.city_area_m2, 'city_area_m2'),
      sum_area_m2: parseNumber(row.sum_area_m2, 'sum_area_m2'),
      overlap_excess_m2: parseNumber(row.overlap_excess_m2, 'overlap_excess_m2'),
      bounds_wgs84: bounds,
      kostat_only_m2: parseNumber(row.kostat_only_m2, 'kostat_only_m2'),
      candidate_only_m2: parseNumber(row.candidate_only_m2, 'candidate_only_m2'),
      symmetric_difference_m2: parseNumber(row.symmetric_difference_m2, 'symmetric_difference_m2'),
      district_rows: districts,
      graph_outside_candidate: lists.graph_outside_candidate,
      graph_district_mismatch: mismatchRows,
      seoul_names: lists.seoul_names,
    };
    shape(document);
    if (hash(JSON.stringify(document)) !== BOUNDARY_COMPARISON_DOCUMENT_HASH) fail('ordered complete document hash');
    return document;
  } catch (error) {
    if (error.code === CODE) throw error;
    fail(error.message);
  }
}
