import { createHash } from 'node:crypto';


const ROOT_FIELDS = ['schema', 'epoch', 'decisionSource', 'geometryAttribution', 'sites'];
const SITE_FIELDS = ['id', 'name', 'address', 'regionId', 'holderId', 'role', 'detail', 'fortification', 'lat', 'lon', 'coordinateSource', 'connectionStationId'];
const SITE_COUNT = 19;

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_LANDMARK_ROLE_DOCUMENT: ' + detail), { code: 'E_LANDMARK_ROLE_DOCUMENT' }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const column = field => field.replace(/[A-Z]/gu, letter => '_' + letter.toLowerCase());

function validate(document) {
  if (!object(document)) fail('object: ');
  const rootKeys = Object.keys(document);
  for (const key of rootKeys) if (!ROOT_FIELDS.includes(key)) fail('unknown field: /' + key);
  for (const key of ROOT_FIELDS) if (!Object.hasOwn(document, key)) fail('missing field: /' + key);
  for (const key of ['schema', 'epoch', 'decisionSource', 'geometryAttribution']) {
    if (typeof document[key] !== 'string') fail('type: /' + key);
  }
  if (!Array.isArray(document.sites)) fail('array: /sites');
  document.sites.forEach((site, index) => {
    const path = '/sites/' + index;
    if (!object(site)) fail('object: ' + path);
    const keys = Object.keys(site);
    for (const key of keys) if (!SITE_FIELDS.includes(key)) fail('unknown field: ' + path + '/' + key);
    for (const key of SITE_FIELDS) if (!Object.hasOwn(site, key)) fail('missing field: ' + path + '/' + key);
    for (const key of ['id', 'name', 'address', 'regionId', 'holderId', 'role', 'detail', 'fortification', 'coordinateSource']) {
      if (typeof site[key] !== 'string') fail('type: ' + path + '/' + key);
    }
    for (const key of ['lat', 'lon']) {
      if (typeof site[key] !== 'number' || !Number.isFinite(site[key])) fail('type: ' + path + '/' + key);
    }
    if (!(site.connectionStationId === null || typeof site.connectionStationId === 'string')) fail('type: ' + path + '/connectionStationId');
  });
}

function siteRow(row) {
  const site = {};
  for (const field of SITE_FIELDS) site[field] = row[column(field)];
  return site;
}

/** SELECT-only typed reader. No source, archive, filesystem, or JSON parsing. */
export function readLandmarkRoleDocument(db) {
  try {
    const select = sql => {
      if (!/^SELECT\b/u.test(sql)) fail('runtime statement');
      return db.prepare(sql);
    };
    const receipts = select('SELECT singleton, source_sha256, document_sha256, actor, reason FROM landmark_role_document_import').all();
    const receipt = receipts[0];
    if (receipts.length !== 1 || receipt.singleton !== 1

      || typeof receipt.actor !== 'string' || !receipt.actor.trim()
      || typeof receipt.reason !== 'string' || !receipt.reason.trim()) fail('source pin/receipt');

    const keys = new Map();
    for (const row of select('SELECT object_path, ordinal, key FROM landmark_role_document_key ORDER BY object_path, ordinal').all()) {
      if (!keys.has(row.object_path)) keys.set(row.object_path, []);
      const list = keys.get(row.object_path);
      if (row.ordinal !== list.length || list.includes(row.key)) fail('key order');
      list.push(row.key);
    }

    const documents = select('SELECT singleton, schema, epoch, decision_source, geometry_attribution FROM landmark_role_document').all();
    const header = documents[0];
    if (documents.length !== 1 || header.singleton !== 1) fail('document singleton');
    const sites = select('SELECT ordinal, id, name, address, region_id, holder_id, role, detail, fortification, lat, lon, coordinate_source, connection_station_id FROM landmark_role_document_site ORDER BY ordinal').all();
    if (sites.length !== SITE_COUNT || sites.some((row, index) => row.ordinal !== index)) fail('landmark_role_document_site: coverage');

    const result = {
      schema: header.schema,
      epoch: header.epoch,
      decisionSource: header.decision_source,
      geometryAttribution: header.geometry_attribution,
      sites: sites.map(row => siteRow(row)),
    };
    const order = (value, path) => {
      if (value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((item, index) => order(item, path + '/' + index));
      const list = keys.get(path);
      keys.delete(path);
      if (!list || list.length !== Object.keys(value).length) fail('object coverage: ' + path);
      return Object.fromEntries(list.map(key => {
        if (!Object.hasOwn(value, key)) fail('unknown key: ' + path + '/' + key);
        return [key, order(value[key], path + '/' + key)];
      }));
    };
    const document = order(result, '');
    if (keys.size) fail('unconsumed key rows');
    validate(document);
    return document;
  } catch (error) {
    if (error.code === 'E_LANDMARK_ROLE_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** PostgreSQL twin: materialize typed rows, then reuse every synchronous validation. */
export async function readLandmarkRoleDocumentAsync(tx) {
  try {
    const statements = [
      'SELECT singleton, source_sha256, document_sha256, actor, reason FROM landmark_role_document_import',
      'SELECT object_path, ordinal, key FROM landmark_role_document_key ORDER BY object_path, ordinal',
      'SELECT singleton, schema, epoch, decision_source, geometry_attribution FROM landmark_role_document',
      'SELECT ordinal, id, name, address, region_id, holder_id, role, detail, fortification, lat, lon, coordinate_source, connection_station_id FROM landmark_role_document_site ORDER BY ordinal',
    ];
    const preloaded = new Map();
    for (const sql of statements) {
      const result = await tx.all(sql.replace(/\bFROM (landmark_role_document\w*)/u, 'FROM wiki.$1'), []);
      preloaded.set(sql, result.map(row => ({ ...row })));
    }
    return readLandmarkRoleDocument({
      prepare(sql) {
        if (!preloaded.has(sql)) fail('async statement unmaterialized: ' + sql);
        return { all: () => preloaded.get(sql) };
      }
    });
  } catch (error) {
    if (error.code === 'E_LANDMARK_ROLE_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** One-shot explicit import of the pinned bytes. No existing tables are written. */
export function initializeLandmarkRoleDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  let document;
  try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes)); }
  catch (error) { fail('source syntax: ' + error.message); }
  validate(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  if (![actor, reason].every(value => typeof value === 'string' && value.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || db.isTransaction) fail('explicit SQL/transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const key = db.prepare('INSERT INTO landmark_role_document_key (object_path, ordinal, key) VALUES (?, ?, ?)');
    const walk = (value, path) => {
      if (value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((item, index) => walk(item, path + '/' + index)); return; }
      Object.entries(value).forEach(([name, child], ordinal) => { key.run(path, ordinal, name); walk(child, path + '/' + name); });
    };
    walk(document, '');
    db.prepare('INSERT INTO landmark_role_document (singleton, schema, epoch, decision_source, geometry_attribution) VALUES (1, ?, ?, ?, ?)')
      .run(document.schema, document.epoch, document.decisionSource, document.geometryAttribution);
    const insertSite = db.prepare('INSERT INTO landmark_role_document_site (ordinal, id, name, address, region_id, holder_id, role, detail, fortification, lat, lon, coordinate_source, connection_station_id) VALUES (' + Array(SITE_FIELDS.length + 1).fill('?').join(', ') + ')');
    document.sites.forEach((site, ordinal) => insertSite.run(ordinal, ...SITE_FIELDS.map(field => site[field])));
    db.prepare('INSERT INTO landmark_role_document_import (singleton, source_sha256, document_sha256, actor, reason) VALUES (1, ?, ?, ?, ?)')
      .run(sourceHash, documentHash, actor, reason);
    const actual = readLandmarkRoleDocument(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('import parity');
    db.exec('COMMIT');
    return actual;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
