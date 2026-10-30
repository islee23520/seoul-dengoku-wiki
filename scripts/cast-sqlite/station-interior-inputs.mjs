import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const logicalPath = 'lore/regions/station-interiors.json';
const prefix = 'station_interior_input_';
const fail = detail => { throw Object.assign(new Error(`E_STATION_INTERIOR_INPUT: ${detail}`), { code: 'E_STATION_INTERIOR_INPUT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(value));
// These lists are named domain columns, not a generic JSON value store.
const fields = {
  document: ['schema', 'as_of', 'count'],
  station: ['name', 'name_en', 'district', 'lat', 'lon', 'network', 'observed_levels_source', 'epoch', 'collapse_plus_years', 'river', 'uncertainty', 'facilityKind'],
  observation: ['above', 'below', 'source', 'source_url', 'license', 'structure', 'osm_id'],
  line: ['line', 'form', 'code', 'above', 'below', 'area', 'year'],
  layer: ['id', 'wiki_layer', 'state', 'contents', 'condition'],
  slot: ['kind', 'where', 'note'],
  candidate: ['observed_levels_source', 'sourceObjectId', 'subject', 'bindingStatus', 'stationObjectId'],
};
const candidateObservation = ['above', 'below', 'source', 'source_url', 'license'];
const pick = (row, names) => Object.fromEntries(names.map(key => [key, row[key]]));
function domainDigest(db) {
  return digest(['document', 'station', 'observation', 'line', 'layer', 'slot', 'candidate', 'key'].map(table =>
    db.prepare(`SELECT * FROM ${prefix}${table} ORDER BY ${table === 'key' ? 'object_path,ordinal' : table === 'document' ? 'singleton' : table === 'station' ? 'ordinal' : table === 'observation' ? 'station_ordinal' : 'station_ordinal,ordinal'}`).all()));
}

// Runtime performs SELECTs only, without source files, JSON.parse, or archive access.
export function readStationInteriorInputs(db) {
  try {
    const select = (table, order) => db.prepare(`SELECT * FROM ${prefix}${table} ORDER BY ${order}`).all();
    const receipts = select('import', 'singleton');
    if (receipts.length !== 1 || receipts[0].logical_path !== logicalPath || !receipts[0].actor?.trim() || !receipts[0].reason?.trim()) fail('source receipt');
    if (domainDigest(db) !== receipts[0].domain_sha256) fail('typed domain digest');
    const docs = select('document', 'singleton');
    if (docs.length !== 1) fail('document cardinality');
    const rows = Object.fromEntries(['station', 'observation', 'line', 'layer', 'slot', 'candidate'].map(table => [table, select(table, table === 'station' ? 'ordinal' : table === 'observation' ? 'station_ordinal' : 'station_ordinal,ordinal')]));
    const used = new Set();
    const children = (table, station, convert) => rows[table].filter(r => r.station_ordinal === station).map((r, i) => {
      if (r.ordinal !== i) fail(`${table}: ordinal`);
      used.add(r); return convert(r);
    });
    const value = {
      ...pick(docs[0], fields.document), stations: rows.station.map((r, i) => {
        if (r.ordinal !== i) fail('station ordinal');
        const observations = rows.observation.filter(o => o.station_ordinal === i);
        if (observations.length > 1) fail('observation cardinality');
        const observation = observations[0];
        if (observation) used.add(observation);
        const lines = children('line', i, l => pick(l, fields.line));
        if (!observation && lines.length) fail('orphan lines');
        return {
          ...pick(r, fields.station),
          observed_levels: observation ? { ...pick(observation, fields.observation), lines } : null,
          layers: children('layer', i, l => pick(l, fields.layer)),
          slots: children('slot', i, s => pick(s, fields.slot)),
          observationCandidates: children('candidate', i, c => ({ ...pick(c, fields.candidate), observed_levels: pick(c, candidateObservation) })),
        };
      })
    };
    for (const table of ['observation', 'line', 'layer', 'slot', 'candidate']) if (rows[table].some(r => !used.has(r))) fail(`${table}: unconsumed rows`);
    const keys = new Map();
    for (const k of select('key', 'object_path,ordinal')) {
      if (!keys.has(k.object_path)) keys.set(k.object_path, []);
      keys.get(k.object_path).push(k);
    }
    const order = (v, path) => {
      if (Array.isArray(v)) return v.map((child, i) => order(child, `${path}/${i}`));
      if (v === null || typeof v !== 'object') return v;
      const members = keys.get(path);
      if (!members) fail(`${path}: missing keys`);
      keys.delete(path);
      return Object.fromEntries(members.map((k, i) => {
        if (k.ordinal !== i || !Object.hasOwn(v, k.key) || ![0, 1].includes(k.is_null) || (k.is_null && v[k.key] !== null)) fail(`${path}: unknown key/null/order`);
        return [k.key, k.is_null ? null : order(v[k.key], `${path}/${k.key}`)];
      }));
    };
    const result = order(value, '');
    if (keys.size || digest(result) !== receipts[0].document_sha256) fail('whole-source parity');
    return result;
  } catch (error) { if (error.code === 'E_STATION_INTERIOR_INPUT') throw error; fail(error.message); }
}

/** PostgreSQL twin: load the same ordered typed rows and verify both digests. */
export async function readStationInteriorInputsAsync(tx) {
  try {
    const sheet = new Map();
    for (const [table, order] of [
      ['import', 'singleton'], ['document', 'singleton'], ['station', 'ordinal'],
      ['observation', 'station_ordinal'], ['line', 'station_ordinal,ordinal'],
      ['layer', 'station_ordinal,ordinal'], ['slot', 'station_ordinal,ordinal'],
      ['candidate', 'station_ordinal,ordinal'], ['key', 'object_path,ordinal'],
    ]) {
      const sql = `SELECT * FROM ${prefix}${table} ORDER BY ${order}`;
      const pgOrder = table === 'key' ? 'object_path COLLATE "C",ordinal' : order;
      sheet.set(sql, await tx.all(`SELECT * FROM wiki.${prefix}${table} ORDER BY ${pgOrder}`));
    }
    return readStationInteriorInputs({
      prepare(sql) {
        if (!sheet.has(sql)) fail(`unmaterialized statement: ${sql}`);
        return { all: () => sheet.get(sql) };
      }
    });
  } catch (error) {
    if (error.code === 'E_STATION_INTERIOR_INPUT') throw error;
    fail(error.message);
  }
}

// Explicit import of actual pinned bytes, into the caller's writable disposable copy.
export async function initializeStationInteriorInputs(db, { sourceBytes, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (db.isTransaction) fail('active transaction');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('./station-interior-inputs.sql', import.meta.url), 'utf8');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schema);
    const insert = (table, ids, value, names = fields[table]) => {
      const columns = [...Object.keys(ids), ...names];
      db.prepare(`INSERT INTO ${prefix}${table} (${columns.map(c => `"${c}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(ids), ...names.map(k => value[k] ?? null));
    };
    const addKey = db.prepare(`INSERT INTO ${prefix}key VALUES(?,?,?,?)`);
    const walk = (v, path) => {
      if (Array.isArray(v)) { v.forEach((child, i) => walk(child, `${path}/${i}`)); return; }
      if (v === null || typeof v !== 'object') return;
      Object.entries(v).forEach(([key, child], ordinal) => { addKey.run(path, ordinal, key, Number(child === null)); walk(child, `${path}/${key}`); });
    };
    walk(document, '');
    insert('document', { singleton: 1 }, document);
    document.stations.forEach((s, ordinal) => {
      insert('station', { ordinal }, s);
      if (s.observed_levels !== null && s.observed_levels !== undefined) {
        insert('observation', { station_ordinal: ordinal }, s.observed_levels);
        (s.observed_levels.lines ?? []).forEach((line, i) => insert('line', { station_ordinal: ordinal, ordinal: i }, line));
      }
      for (const [key, table] of [['layers', 'layer'], ['slots', 'slot']]) (s[key] ?? []).forEach((v, i) => insert(table, { station_ordinal: ordinal, ordinal: i }, v));
      (s.observationCandidates ?? []).forEach((c, i) => insert('candidate', { station_ordinal: ordinal, ordinal: i }, { ...c, ...c.observed_levels }, [...fields.candidate, ...candidateObservation]));
    });
    db.prepare(`INSERT INTO ${prefix}import VALUES(1,?,?,?,?,?,?)`).run(logicalPath, hash(sourceBytes), digest(document), domainDigest(db), actor, reason);
    const result = readStationInteriorInputs(db);
    if (!isDeepStrictEqual(result, document) || JSON.stringify(result) !== JSON.stringify(document)) fail('source parity before commit');
    db.exec('COMMIT');
    return result;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
