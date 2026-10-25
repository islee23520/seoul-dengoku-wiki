import { createHash } from 'node:crypto';

export const HANGNYEOL_SYSTEMS_SOURCE_HASH = 'e19275a94978cd1d29e4abc8951bcd1091b663bd9c05610a00a9d04b3880cf8b';
export const HANGNYEOL_SYSTEMS_DOCUMENT_HASH = '533b0a0fa4afb09f58b2e36406f3587796243342e72590b2a2ca2d9a49b4e5b0';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_HANGNYEOL_SYSTEMS_DOCUMENT: ${detail}`), { code: 'E_HANGNYEOL_SYSTEMS_DOCUMENT' }); };
const rootFields = ['id','schema','note','sources','systems'];
const sourceRequired = ['id','url','accessed','quote','evidence','live_check'];
const sourceOptional = ['record_id','live_check_ref','unchecked_reason'];
const systemRequired = ['id','name','summary','sources'];
const systemOptional = ['sequence','carrier','positions'];
const text = value => typeof value === 'string' && value.length > 0;
function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('unknown, missing, or unordered fields');
  const actual = Object.keys(value);
  if (actual.some(key => !allowed.includes(key)) || allowed.filter(key => actual.includes(key)).some((key, index) => key !== actual[index])) fail('unknown, missing, or unordered fields');
}
function sourceShape(source) {
  keys(source, ['id','record_id','url','accessed','quote','evidence','live_check','live_check_ref','unchecked_reason']);
  if (!sourceRequired.every(key => text(source[key]))) fail('source shape');
  for (const key of sourceOptional) if (Object.hasOwn(source, key) && !text(source[key])) fail('source optional');
  if (Object.hasOwn(source, 'unchecked_reason') === Object.hasOwn(source, 'live_check_ref')
    || Object.hasOwn(source, 'unchecked_reason') === Object.hasOwn(source, 'record_id')) fail('source optional pairing');
}
function systemShape(system) {
  keys(system, ['id','name','summary','sequence','carrier','positions','sources']);
  if (!['id','name','summary'].every(key => text(system[key])) || !Array.isArray(system.sources) || !system.sources.length
    || system.sources.some(id => !text(id))) fail('system shape');
  const sequence = Object.hasOwn(system, 'sequence');
  const carrier = Object.hasOwn(system, 'carrier');
  const positions = Object.hasOwn(system, 'positions');
  if (sequence !== carrier || (sequence && positions)) fail('system variant');
  if (sequence && (!Array.isArray(system.sequence) || !system.sequence.length || system.sequence.some(token => !text(token)) || !text(system.carrier))) fail('sequence shape');
  if (positions && (!Array.isArray(system.positions) || !system.positions.length || system.positions.some(position => !text(position)))) fail('position shape');
  if (systemOptional.some(key => Object.hasOwn(system, key) && key !== 'sequence' && key !== 'carrier' && key !== 'positions')) fail('system optional');
}
function shape(document) {
  keys(document, rootFields);
  if (!text(document.id) || !Number.isSafeInteger(document.schema) || typeof document.note !== 'string'
    || !Array.isArray(document.sources) || document.sources.length !== 17
    || !Array.isArray(document.systems) || document.systems.length !== 9) fail('document shape');
  document.sources.forEach(sourceShape);
  document.systems.forEach(systemShape);
  const ids = new Set(document.sources.map(source => source.id));
  if (ids.size !== document.sources.length || document.systems.some(system => new Set(system.sources).size !== system.sources.length
    || system.sources.some(id => !ids.has(id)))) fail('source identity');
}
const receipt = (actor, reason) => hash(JSON.stringify([HANGNYEOL_SYSTEMS_SOURCE_HASH, HANGNYEOL_SYSTEMS_DOCUMENT_HASH, actor, reason]));
const flag = (value, key) => Number(Object.hasOwn(value, key));

/** Import only the exact authored systems document; normalization grants no approval. */
export function initializeHangnyeolSystemsDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array) || expectedSourceHash !== HANGNYEOL_SYSTEMS_SOURCE_HASH) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  if (hash(sourceBytes) !== HANGNYEOL_SYSTEMS_SOURCE_HASH || hash(JSON.stringify(document)) !== HANGNYEOL_SYSTEMS_DOCUMENT_HASH) fail('source hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO hangnyeol_systems_document VALUES (1,?,?,?,?,?,?,?)')
      .run(expectedSourceHash, document.id, document.schema, document.note, actor, reason, receipt(actor, reason));
    const insertSource = db.prepare(`INSERT INTO hangnyeol_systems_source VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    document.sources.forEach((source, ordinal) => insertSource.run(
      ordinal, 1, source.id, flag(source, 'record_id'), source.record_id ?? null, source.url, source.accessed,
      source.quote, source.evidence, source.live_check, flag(source, 'live_check_ref'), source.live_check_ref ?? null,
      flag(source, 'unchecked_reason'), source.unchecked_reason ?? null,
    ));
    const insertSystem = db.prepare('INSERT INTO hangnyeol_systems_system VALUES (?,?,?,?,?,?,?,?,?)');
    const insertToken = db.prepare('INSERT INTO hangnyeol_systems_sequence VALUES (?,?,?)');
    const insertPosition = db.prepare('INSERT INTO hangnyeol_systems_position VALUES (?,?,?)');
    const insertLink = db.prepare('INSERT INTO hangnyeol_systems_system_source VALUES (?,?,?)');
    document.systems.forEach((system, ordinal) => {
      insertSystem.run(ordinal, 1, system.id, system.name, system.summary, flag(system, 'sequence'), flag(system, 'carrier'), system.carrier ?? null, flag(system, 'positions'));
      (system.sequence ?? []).forEach((token, index) => insertToken.run(ordinal, index, token));
      (system.positions ?? []).forEach((position, index) => insertPosition.run(ordinal, index, position));
      system.sources.forEach((sourceId, index) => insertLink.run(ordinal, index, sourceId));
    });
    readHangnyeolSystemsDocument(db, { expectedSourceHash });
    db.exec('COMMIT');
    return { documents: 1, sources: 17, systems: 9, sequenceTokens: 40, positions: 2, systemSources: 17, totalRows: 86 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

const ordered = (db, sql, count, label) => {
  const rows = db.prepare(sql).all();
  if (rows.length !== count || rows.some((row, index) => row.ordinal !== index)) fail(`${label} coverage`);
  return rows;
};
function optional(row, present, column) {
  if (![0, 1].includes(row[present]) || (row[present] === 0) !== (row[column] === null) || (row[present] === 1 && !text(row[column]))) fail(`${column} presence`);
  return row[present] ? row[column] : undefined;
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readHangnyeolSystemsDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== HANGNYEOL_SYSTEMS_SOURCE_HASH) fail('expected hash');
  const documents = db.prepare('SELECT * FROM hangnyeol_systems_document').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1 || row.source_sha256 !== expectedSourceHash || !text(row.actor) || !row.actor.trim()
    || !text(row.reason) || !row.reason.trim() || row.receipt_sha256 !== receipt(row.actor, row.reason)) fail('provenance');
  const sources = ordered(db, 'SELECT * FROM hangnyeol_systems_source ORDER BY ordinal', 17, 'source');
  const systems = ordered(db, 'SELECT * FROM hangnyeol_systems_system ORDER BY ordinal', 9, 'system');
  const tokens = db.prepare('SELECT * FROM hangnyeol_systems_sequence ORDER BY system_ordinal, ordinal').all();
  const positions = db.prepare('SELECT * FROM hangnyeol_systems_position ORDER BY system_ordinal, ordinal').all();
  const links = db.prepare('SELECT * FROM hangnyeol_systems_system_source ORDER BY system_ordinal, ordinal').all();
  if (sources.some(source => source.document_id !== 1) || systems.some(system => system.document_id !== 1)) fail('document reference');
  if (tokens.length !== 40 || positions.length !== 2 || links.length !== 17) fail('child coverage');
  const child = (rows, systemOrdinal) => {
    const owned = rows.filter(item => item.system_ordinal === systemOrdinal);
    if (owned.some((item, index) => item.ordinal !== index)) fail('child order');
    return owned;
  };
  const document = {
    id: row.id,
    schema: row.schema,
    note: row.note,
    sources: sources.map(source => {
      const result = { id: source.id };
      const recordId = optional(source, 'record_id_present', 'record_id');
      if (recordId !== undefined) result.record_id = recordId;
      Object.assign(result, { url: source.url, accessed: source.accessed, quote: source.quote, evidence: source.evidence, live_check: source.live_check });
      const liveCheckRef = optional(source, 'live_check_ref_present', 'live_check_ref');
      if (liveCheckRef !== undefined) result.live_check_ref = liveCheckRef;
      const uncheckedReason = optional(source, 'unchecked_reason_present', 'unchecked_reason');
      if (uncheckedReason !== undefined) result.unchecked_reason = uncheckedReason;
      return result;
    }),
    systems: systems.map(system => {
      const result = { id: system.id, name: system.name, summary: system.summary };
      const sequence = child(tokens, system.ordinal);
      const ownedPositions = child(positions, system.ordinal);
      if (![0, 1].includes(system.sequence_present) || ![0, 1].includes(system.carrier_present) || ![0, 1].includes(system.positions_present)
        || Boolean(system.sequence_present) !== Boolean(sequence.length) || Boolean(system.carrier_present) !== Boolean(sequence.length)
        || (system.carrier_present === 0) !== (system.carrier === null) || (system.carrier_present === 1 && !text(system.carrier))
        || Boolean(system.positions_present) !== Boolean(ownedPositions.length)
        || (sequence.length > 0 && ownedPositions.length > 0)) fail('system variant rows');
      if (sequence.length) {
        result.sequence = sequence.map(item => item.token);
        result.carrier = system.carrier;
      }
      if (ownedPositions.length) result.positions = ownedPositions.map(item => item.position);
      const ownedLinks = child(links, system.ordinal);
      if (!ownedLinks.length) fail('system source coverage');
      result.sources = ownedLinks.map(item => item.source_id);
      return result;
    }),
  };
  shape(document);
  if (hash(JSON.stringify(document)) !== HANGNYEOL_SYSTEMS_DOCUMENT_HASH) fail('document hash');
  return document;
}
