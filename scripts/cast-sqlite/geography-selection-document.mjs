import { createHash } from 'node:crypto';


const LOGICAL_PATH = 'lore/regions/sources/selection.json';
const CODE = 'E_GEOGRAPHY_SELECTION_DOCUMENT';

const ROOT_KEYS = [
  'as_of', 'selected_boundary', 'comparison_boundary', 'osm', 'terrain',
  'fictional_epoch', 'extended_coverage', 'decision_kind', 'reason',
];
const SELECTED_KEYS = [
  'source_id', 'path', 'sha256', 'source_url', 'source_effective_date',
  'publication_commit_date', 'retrieved_on', 'source_crs', 'measurement_crs',
  'authority', 'license', 'attribution', 'filter', 'source_regions', 'source_districts',
  'selected_union_area_m2', 'overlap_excess_m2', 'cleanup_policy', 'coverage_tolerance_m2',
  'precision_policy',
];
const COMPARISON_KEYS = [
  'source_id', 'source_root', 'path', 'sha256', 'effective_year', 'current_boundary', 'policy',
];
const OSM_KEYS = [
  'path', 'sha256', 'snapshot_at', 'snapshot_basis', 'modified_at', 'acquired_at',
  'complete_official_roster', 'policy',
];
const TERRAIN_KEYS = [
  'source_object_modified_precision', 'source_object_modified_month', 'observation_date',
  'observation_date_reason', 'policy',
];
const EPOCH_KEYS = ['id', 'source', 'label', 'absolute_date'];
const EXTENDED_KEYS = ['source_id', 'sha256', 'retrieved_on', 'filter', 'regions', 'dong_total', 'policy'];
const REGION_KEYS = ['sidonm', 'sido', 'districts', 'dong'];

const KEY_SHAPES = [
  ['', ROOT_KEYS],
  ['/selected_boundary', SELECTED_KEYS],
  ['/comparison_boundary', COMPARISON_KEYS],
  ['/osm', OSM_KEYS],
  ['/terrain', TERRAIN_KEYS],
  ['/fictional_epoch', EPOCH_KEYS],
  ['/extended_coverage', EXTENDED_KEYS],
  ...Array.from({ length: 7 }, (_, ordinal) => [`/extended_coverage/regions/${ordinal}`, REGION_KEYS]),
];

const DECIMALS = {
  selected_union_area_m2: '606223725.0069752',
  overlap_excess_m2: '707.0937968492508',
  coverage_tolerance_m2: '0.01',
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => {
  throw Object.assign(new Error(`${CODE}: ${detail}`), { code: CODE });
};
const sameKeys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);
const text = value => typeof value === 'string' && value.length > 0;
const bool = value => typeof value === 'boolean';
const integer = value => Number.isInteger(value);
const decimal = (value, spelling) => typeof value === 'number' && !Number.isInteger(value)
  && Object.is(value, Number(spelling)) && JSON.stringify(value) === spelling;

function shape(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('unknown, missing, or unordered root fields');
  if (!text(document.as_of) || !text(document.decision_kind) || !text(document.reason)) fail('root scalars');
  const selected = document.selected_boundary;
  if (!sameKeys(selected, SELECTED_KEYS)) fail('selected boundary fields');
  if (![
    selected.source_id, selected.path, selected.sha256, selected.source_url,
    selected.source_effective_date, selected.publication_commit_date, selected.retrieved_on,
    selected.source_crs, selected.measurement_crs, selected.authority, selected.license,
    selected.attribution, selected.filter, selected.cleanup_policy, selected.precision_policy,
  ].every(text)) fail('selected boundary text');
  if (!integer(selected.source_regions) || !integer(selected.source_districts)) fail('selected boundary counts');
  if (!decimal(selected.selected_union_area_m2, DECIMALS.selected_union_area_m2)
    || !decimal(selected.overlap_excess_m2, DECIMALS.overlap_excess_m2)
    || !decimal(selected.coverage_tolerance_m2, DECIMALS.coverage_tolerance_m2)) fail('selected boundary decimals');
  const comparison = document.comparison_boundary;
  if (!sameKeys(comparison, COMPARISON_KEYS)) fail('comparison boundary fields');
  if (![comparison.source_id, comparison.source_root, comparison.path, comparison.sha256, comparison.policy].every(text)) fail('comparison boundary text');
  if (!integer(comparison.effective_year) || !bool(comparison.current_boundary)) fail('comparison boundary values');
  const osm = document.osm;
  if (!sameKeys(osm, OSM_KEYS)) fail('osm fields');
  if (![osm.path, osm.sha256, osm.snapshot_at, osm.snapshot_basis, osm.modified_at, osm.acquired_at, osm.policy].every(text)) fail('osm text');
  if (!bool(osm.complete_official_roster)) fail('osm roster');
  const terrain = document.terrain;
  if (!sameKeys(terrain, TERRAIN_KEYS)) fail('terrain fields');
  if (![terrain.source_object_modified_precision, terrain.source_object_modified_month, terrain.observation_date_reason, terrain.policy].every(text)) fail('terrain text');
  if (terrain.observation_date !== null) fail('terrain observation');
  const epoch = document.fictional_epoch;
  if (!sameKeys(epoch, EPOCH_KEYS)) fail('epoch fields');
  if (![epoch.id, epoch.source, epoch.label].every(text) || epoch.absolute_date !== null) fail('epoch values');
  const extended = document.extended_coverage;
  if (!sameKeys(extended, EXTENDED_KEYS)) fail('extended coverage fields');
  if (![extended.source_id, extended.sha256, extended.retrieved_on, extended.filter, extended.policy].every(text)) fail('extended coverage text');
  if (!integer(extended.dong_total)) fail('extended dong total');
  if (!Array.isArray(extended.regions) || extended.regions.length !== 7) fail('extended regions');
  for (const region of extended.regions) {
    if (!sameKeys(region, REGION_KEYS)) fail('region fields');
    if (!text(region.sidonm) || !text(region.sido) || !integer(region.districts) || !integer(region.dong)) fail('region values');
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
const receiptOf = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

const bit = value => value ? 1 : 0;

function insertDocument(db, document, actor, reason) {
  const selected = document.selected_boundary;
  const comparison = document.comparison_boundary;
  const osm = document.osm;
  const terrain = document.terrain;
  const epoch = document.fictional_epoch;
  const extended = document.extended_coverage;
  db.prepare(`INSERT INTO geography_selection_document_document (
    document_id, source_sha256, document_sha256, as_of,
    selected_source_id, selected_path, selected_sha256, selected_source_url,
    selected_source_effective_date, selected_publication_commit_date, selected_retrieved_on,
    selected_source_crs, selected_measurement_crs, selected_authority, selected_license,
    selected_attribution, selected_filter, selected_source_regions, selected_source_districts,
    selected_union_area_m2, selected_overlap_excess_m2, selected_cleanup_policy,
    selected_coverage_tolerance_m2, selected_precision_policy,
    comparison_source_id, comparison_source_root, comparison_path, comparison_sha256,
    comparison_effective_year, comparison_current_boundary, comparison_policy,
    osm_path, osm_sha256, osm_snapshot_at, osm_snapshot_basis, osm_modified_at, osm_acquired_at,
    osm_complete_official_roster, osm_policy,
    terrain_source_object_modified_precision, terrain_source_object_modified_month,
    terrain_observation_date, terrain_observation_date_reason, terrain_policy,
    fictional_epoch_id, fictional_epoch_source, fictional_epoch_label, fictional_epoch_absolute_date,
    extended_source_id, extended_sha256, extended_retrieved_on, extended_filter,
    extended_dong_total, extended_policy, decision_kind, reason,
    actor, import_reason, receipt_sha256
  ) VALUES (
    1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )`).run(
    sourceHashOf.get(document),
    hash(JSON.stringify(document)),
    document.as_of,
    selected.source_id,
    selected.path,
    selected.sha256,
    selected.source_url,
    selected.source_effective_date,
    selected.publication_commit_date,
    selected.retrieved_on,
    selected.source_crs,
    selected.measurement_crs,
    selected.authority,
    selected.license,
    selected.attribution,
    selected.filter,
    selected.source_regions,
    selected.source_districts,
    DECIMALS.selected_union_area_m2,
    DECIMALS.overlap_excess_m2,
    selected.cleanup_policy,
    DECIMALS.coverage_tolerance_m2,
    selected.precision_policy,
    comparison.source_id,
    comparison.source_root,
    comparison.path,
    comparison.sha256,
    comparison.effective_year,
    bit(comparison.current_boundary),
    comparison.policy,
    osm.path,
    osm.sha256,
    osm.snapshot_at,
    osm.snapshot_basis,
    osm.modified_at,
    osm.acquired_at,
    bit(osm.complete_official_roster),
    osm.policy,
    terrain.source_object_modified_precision,
    terrain.source_object_modified_month,
    null,
    terrain.observation_date_reason,
    terrain.policy,
    epoch.id,
    epoch.source,
    epoch.label,
    null,
    extended.source_id,
    extended.sha256,
    extended.retrieved_on,
    extended.filter,
    extended.dong_total,
    extended.policy,
    document.decision_kind,
    document.reason,
    actor,
    reason,
    receiptOf(sourceHashOf.get(document), hash(JSON.stringify(document)), actor, reason),
  );
  const keyInsert = db.prepare('INSERT INTO geography_selection_document_key (object_path, ordinal, key) VALUES (?,?,?)');
  for (const [objectPath, keys] of KEY_SHAPES) keys.forEach((key, ordinal) => keyInsert.run(objectPath, ordinal, key));
  const regionInsert = db.prepare('INSERT INTO geography_selection_document_region (ordinal, sidonm, sido, districts, dong) VALUES (?,?,?,?,?)');
  extended.regions.forEach((region, ordinal) => regionInsert.run(ordinal, region.sidonm, region.sido, region.districts, region.dong));
}

const COUNTS = {
  documents: 1,
  keys: KEY_SHAPES.reduce((sum, [, keys]) => sum + keys.length, 0),
  regions: 7,
};
COUNTS.totalRows = Object.values(COUNTS).reduce((sum, value) => sum + value, 0);

function ordered(db, table, count) {
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all();
  if (rows.length !== count || rows.some((row, ordinal) => row.ordinal !== ordinal)) fail(`${table} coverage`);
  return rows;
}

function assemble(db) {
  const rows = db.prepare('SELECT * FROM geography_selection_document_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1) fail('document id');
  if (typeof row.actor !== 'string' || !row.actor.trim()
    || typeof row.import_reason !== 'string' || !row.import_reason.trim()) fail('provenance');
  const keys = db.prepare('SELECT object_path, ordinal, key FROM geography_selection_document_key ORDER BY object_path, ordinal').all();
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
  if (![0, 1].includes(row.comparison_current_boundary) || ![0, 1].includes(row.osm_complete_official_roster)) fail('boolean storage');
  if (row.terrain_observation_date !== null || row.fictional_epoch_absolute_date !== null) fail('null storage');
  if (row.selected_union_area_m2 !== DECIMALS.selected_union_area_m2
    || row.selected_overlap_excess_m2 !== DECIMALS.overlap_excess_m2
    || row.selected_coverage_tolerance_m2 !== DECIMALS.coverage_tolerance_m2) fail('decimal spelling');
  const regions = ordered(db, 'geography_selection_document_region', 7).map(item => ({
    sidonm: item.sidonm,
    sido: item.sido,
    districts: item.districts,
    dong: item.dong,
  }));
  const document = {
    as_of: row.as_of,
    selected_boundary: {
      source_id: row.selected_source_id,
      path: row.selected_path,
      sha256: row.selected_sha256,
      source_url: row.selected_source_url,
      source_effective_date: row.selected_source_effective_date,
      publication_commit_date: row.selected_publication_commit_date,
      retrieved_on: row.selected_retrieved_on,
      source_crs: row.selected_source_crs,
      measurement_crs: row.selected_measurement_crs,
      authority: row.selected_authority,
      license: row.selected_license,
      attribution: row.selected_attribution,
      filter: row.selected_filter,
      source_regions: row.selected_source_regions,
      source_districts: row.selected_source_districts,
      selected_union_area_m2: Number(row.selected_union_area_m2),
      overlap_excess_m2: Number(row.selected_overlap_excess_m2),
      cleanup_policy: row.selected_cleanup_policy,
      coverage_tolerance_m2: Number(row.selected_coverage_tolerance_m2),
      precision_policy: row.selected_precision_policy,
    },
    comparison_boundary: {
      source_id: row.comparison_source_id,
      source_root: row.comparison_source_root,
      path: row.comparison_path,
      sha256: row.comparison_sha256,
      effective_year: row.comparison_effective_year,
      current_boundary: row.comparison_current_boundary === 1,
      policy: row.comparison_policy,
    },
    osm: {
      path: row.osm_path,
      sha256: row.osm_sha256,
      snapshot_at: row.osm_snapshot_at,
      snapshot_basis: row.osm_snapshot_basis,
      modified_at: row.osm_modified_at,
      acquired_at: row.osm_acquired_at,
      complete_official_roster: row.osm_complete_official_roster === 1,
      policy: row.osm_policy,
    },
    terrain: {
      source_object_modified_precision: row.terrain_source_object_modified_precision,
      source_object_modified_month: row.terrain_source_object_modified_month,
      observation_date: null,
      observation_date_reason: row.terrain_observation_date_reason,
      policy: row.terrain_policy,
    },
    fictional_epoch: {
      id: row.fictional_epoch_id,
      source: row.fictional_epoch_source,
      label: row.fictional_epoch_label,
      absolute_date: null,
    },
    extended_coverage: {
      source_id: row.extended_source_id,
      sha256: row.extended_sha256,
      retrieved_on: row.extended_retrieved_on,
      filter: row.extended_filter,
      regions,
      dong_total: row.extended_dong_total,
      policy: row.extended_policy,
    },
    decision_kind: row.decision_kind,
    reason: row.reason,
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
 * Import exactly one bounded source. Does not infer missing fields or approve publication.
 * Single-source: { schemaSql, sourceBytes, actor, reason }.
 * Multiple-source: { schemaSql, sources, actor, reason } with sources[path] = { bytes }.
 */
export function initializeGeographySelectionDocument(db, options = {}) {
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
export function readGeographySelectionDocument(db, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'logicalPath')) fail('reader fields');
  if (Object.hasOwn(options, 'logicalPath') && options.logicalPath !== LOGICAL_PATH) fail('logical path');
  return assemble(db);
}
