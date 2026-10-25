import { createHash } from 'node:crypto';

export const SURNAME_ORIGIN_SOURCE_HASH = '0ceaaba8a590f4c8ddb24631f08c26064bdb41fa0ea416527bfd5c5a36762bb8';
export const SURNAME_ORIGIN_DOCUMENT_HASH = 'afc6af8af92fe0e00766c0fa4d03dfb34a6844ccde992ca1d8d3f0c85a1508ff';

const SOURCE_COUNT = 517;
const SURNAME_COUNT = 517;
const BONGWAN_COUNT = 413;
const SURNAME_SOURCE_COUNT = 517;
const BONGWAN_SOURCE_COUNT = 413;
const COUNTS = {
  surname_origin_document: 1,
  surname_origin_source: SOURCE_COUNT,
  surname_origin_source_key: 4126,
  surname_origin_surname: SURNAME_COUNT,
  surname_origin_surname_key: 4389,
  surname_origin_surname_source: SURNAME_SOURCE_COUNT,
  surname_origin_bongwan: BONGWAN_COUNT,
  surname_origin_bongwan_key: 2065,
  surname_origin_bongwan_source: BONGWAN_SOURCE_COUNT,
};

const documentFields = ['id', 'schema', 'note', 'sources', 'surnames'];
const sourceFields = ['id', 'record_id', 'url', 'accessed', 'quote', 'evidence', 'live_check', 'live_check_ref'];
const surnameFields = ['id', 'hangul', 'hanja', 'population_2015', 'population_2000', 'population_1985', 'sources', 'bongwan', 'bongwan_unlisted_reason'];
const bongwanFields = ['id', 'name', 'hanja', 'majority', 'sources'];
const populationFields = ['population_2015', 'population_2000', 'population_1985'];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_SURNAME_ORIGIN_DOCUMENT: ${detail}`), { code: 'E_SURNAME_ORIGIN_DOCUMENT' }); };
const text = value => typeof value === 'string' && value.length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const integerOrNull = value => value === null || Number.isSafeInteger(value);

function keys(value, allowed) {
  if (!object(value)) fail('unknown, missing, or unordered fields');
  const actual = Object.keys(value);
  if (actual.some(key => !allowed.includes(key))) fail('unknown, missing, or unordered fields');
  let cursor = -1;
  for (const key of actual) {
    const index = allowed.indexOf(key);
    if (index <= cursor) fail('unknown, missing, or unordered fields');
    cursor = index;
  }
}

function requiredText(value, field) {
  if (!text(value[field])) fail(`${field} shape`);
}

function shapeSource(source) {
  keys(source, sourceFields);
  for (const field of ['id', 'url', 'accessed', 'quote', 'evidence', 'live_check']) requiredText(source, field);
  if (Object.hasOwn(source, 'record_id') && !text(source.record_id)) fail('record_id shape');
  if (Object.hasOwn(source, 'live_check_ref') && !text(source.live_check_ref)) fail('live_check_ref shape');
}

function shapeBongwan(bongwan) {
  keys(bongwan, bongwanFields);
  for (const field of ['id', 'name']) requiredText(bongwan, field);
  if (!Object.hasOwn(bongwan, 'hanja') || (bongwan.hanja !== null && !text(bongwan.hanja))) fail('bongwan hanja shape');
  if (typeof bongwan.majority !== 'boolean') fail('majority shape');
  if (!Array.isArray(bongwan.sources) || bongwan.sources.length === 0 || bongwan.sources.some(id => !text(id))) fail('bongwan sources shape');
}

function shapeSurname(surname) {
  keys(surname, surnameFields);
  for (const field of ['id', 'hangul']) requiredText(surname, field);
  if (!Object.hasOwn(surname, 'hanja') || (surname.hanja !== null && !text(surname.hanja))) fail('hanja shape');
  for (const field of populationFields) {
    if (Object.hasOwn(surname, field) && !integerOrNull(surname[field])) fail(`${field} shape`);
  }
  if (!Array.isArray(surname.sources) || surname.sources.length === 0 || surname.sources.some(id => !text(id))) fail('surname sources shape');
  if (!Array.isArray(surname.bongwan)) fail('bongwan shape');
  surname.bongwan.forEach(shapeBongwan);
  if (Object.hasOwn(surname, 'bongwan_unlisted_reason') && !text(surname.bongwan_unlisted_reason)) fail('bongwan_unlisted_reason shape');
}

function shape(document) {
  keys(document, documentFields);
  if (!text(document.id) || !Number.isSafeInteger(document.schema) || typeof document.note !== 'string' || !document.note.length) fail('document shape');
  if (!Array.isArray(document.sources) || !Array.isArray(document.surnames)) fail('document collections');
  document.sources.forEach(shapeSource);
  document.surnames.forEach(shapeSurname);
  const sourceIds = new Set(document.sources.map(source => source.id));
  const surnameIds = new Set(document.surnames.map(surname => surname.id));
  const bongwanIds = new Set();
  if (sourceIds.size !== document.sources.length || surnameIds.size !== document.surnames.length) fail('duplicate id');
  for (const surname of document.surnames) {
    for (const sourceId of surname.sources) if (!sourceIds.has(sourceId)) fail('dangling surname source');
    for (const bongwan of surname.bongwan) {
      if (bongwanIds.has(bongwan.id)) fail('duplicate bongwan id');
      bongwanIds.add(bongwan.id);
      for (const sourceId of bongwan.sources) if (!sourceIds.has(sourceId)) fail('dangling bongwan source');
    }
  }
}

const receipt = (actor, reason) => hash(JSON.stringify([SURNAME_ORIGIN_SOURCE_HASH, SURNAME_ORIGIN_DOCUMENT_HASH, actor, reason]));

function insertKeys(db, sql, parent, value) {
  Object.keys(value).forEach((key, ordinal) => db.prepare(sql).run(...parent, ordinal, key));
}

function population(surname, field) {
  return Object.hasOwn(surname, field) ? surname[field] : null;
}

/** Import only the exact original document; normalization grants no approval and adds no facts. */
export function initializeSurnameOriginDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array) || expectedSourceHash !== SURNAME_ORIGIN_SOURCE_HASH) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  if (hash(sourceBytes) !== SURNAME_ORIGIN_SOURCE_HASH || hash(JSON.stringify(document)) !== SURNAME_ORIGIN_DOCUMENT_HASH) fail('source hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO surname_origin_document VALUES (1,?,?,?,?,?,?,?)')
      .run(expectedSourceHash, document.id, document.schema, document.note, actor, reason, receipt(actor, reason));
    document.sources.forEach((source, ordinal) => {
      db.prepare(`INSERT INTO surname_origin_source VALUES (${Array(12).fill('?').join(',')})`).run(
        ordinal, 1, source.id,
        Number(Object.hasOwn(source, 'record_id')), source.record_id ?? null,
        source.url, source.accessed, source.quote, source.evidence, source.live_check,
        Number(Object.hasOwn(source, 'live_check_ref')), source.live_check_ref ?? null,
      );
      insertKeys(db, 'INSERT INTO surname_origin_source_key VALUES (?,?,?)', [ordinal], source);
    });
    document.surnames.forEach((surname, ordinal) => {
      db.prepare(`INSERT INTO surname_origin_surname VALUES (${Array(14).fill('?').join(',')})`).run(
        ordinal, 1, surname.id, surname.hangul,
        1, surname.hanja,
        Number(Object.hasOwn(surname, 'population_2015')), population(surname, 'population_2015'),
        Number(Object.hasOwn(surname, 'population_2000')), population(surname, 'population_2000'),
        Number(Object.hasOwn(surname, 'population_1985')), population(surname, 'population_1985'),
        Number(Object.hasOwn(surname, 'bongwan_unlisted_reason')), surname.bongwan_unlisted_reason ?? null,
      );
      insertKeys(db, 'INSERT INTO surname_origin_surname_key VALUES (?,?,?)', [ordinal], surname);
      surname.sources.forEach((sourceId, index) => db.prepare('INSERT INTO surname_origin_surname_source VALUES (?,?,?)').run(ordinal, index, sourceId));
      surname.bongwan.forEach((bongwan, index) => {
        db.prepare('INSERT INTO surname_origin_bongwan VALUES (?,?,?,?,?,?,?)')
          .run(ordinal, index, bongwan.id, bongwan.name, 1, bongwan.hanja, Number(bongwan.majority));
        insertKeys(db, 'INSERT INTO surname_origin_bongwan_key VALUES (?,?,?,?)', [ordinal, index], bongwan);
        bongwan.sources.forEach((sourceId, sourceOrdinal) => db.prepare('INSERT INTO surname_origin_bongwan_source VALUES (?,?,?,?)').run(ordinal, index, sourceOrdinal, sourceId));
      });
    });
    const read = readSurnameOriginDocument(db, { expectedSourceHash });
    if (!same(read, document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1,
      sources: document.sources.length,
      surnames: document.surnames.length,
      bongwan: document.surnames.reduce((sum, surname) => sum + surname.bongwan.length, 0),
      surnameSources: document.surnames.reduce((sum, surname) => sum + surname.sources.length, 0),
      bongwanSources: document.surnames.reduce((sum, surname) => sum + surname.bongwan.reduce((inner, bongwan) => inner + bongwan.sources.length, 0), 0),
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function rows(db, table, order) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
}

function ordered(result, label) {
  if (result.some((row, index) => row.ordinal !== index)) fail(`${label} order`);
  return result;
}

function keysFor(rowsForParent, expected, label) {
  if (rowsForParent.length !== expected.length || rowsForParent.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${label} key order`);
}

function present(flag, value, label, nullAllowed = false) {
  if (![0, 1].includes(flag) || (flag === 0 && value !== null) || (flag === 1 && value === null && !nullAllowed)) fail(`${label} presence`);
  return flag === 1;
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readSurnameOriginDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== SURNAME_ORIGIN_SOURCE_HASH) fail('expected hash');
  const documents = db.prepare('SELECT * FROM surname_origin_document').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1 || row.source_sha256 !== expectedSourceHash || !text(row.actor) || !row.actor.trim()
    || !text(row.reason) || !row.reason.trim() || row.receipt_sha256 !== receipt(row.actor, row.reason)
    || !text(row.id) || !Number.isSafeInteger(row.schema) || typeof row.note !== 'string') fail('provenance');
  const sources = ordered(rows(db, 'surname_origin_source', 'ordinal'), 'source');
  const sourceKeys = rows(db, 'surname_origin_source_key', 'source_ordinal, ordinal');
  const surnames = ordered(rows(db, 'surname_origin_surname', 'ordinal'), 'surname');
  const surnameKeys = rows(db, 'surname_origin_surname_key', 'surname_ordinal, ordinal');
  const surnameSources = rows(db, 'surname_origin_surname_source', 'surname_ordinal, ordinal');
  const bongwan = rows(db, 'surname_origin_bongwan', 'surname_ordinal, ordinal');
  const bongwanKeys = rows(db, 'surname_origin_bongwan_key', 'surname_ordinal, bongwan_ordinal, ordinal');
  const bongwanSources = rows(db, 'surname_origin_bongwan_source', 'surname_ordinal, bongwan_ordinal, ordinal');
  if (sources.some(source => source.document_id !== 1) || surnames.some(surname => surname.document_id !== 1)) fail('parent');
  const sourceIds = new Set(sources.map(source => source.id));
  if (sourceIds.size !== sources.length) fail('source ids');
  const document = {
    id: row.id,
    schema: row.schema,
    note: row.note,
    sources: sources.map(source => {
      const keysForSource = sourceKeys.filter(key => key.source_ordinal === source.ordinal);
      const value = { id: source.id };
      if (present(source.record_id_present, source.record_id, 'record_id')) value.record_id = source.record_id;
      Object.assign(value, {
        url: source.url,
        accessed: source.accessed,
        quote: source.quote,
        evidence: source.evidence,
        live_check: source.live_check,
      });
      if (present(source.live_check_ref_present, source.live_check_ref, 'live_check_ref')) value.live_check_ref = source.live_check_ref;
      keysFor(keysForSource, Object.keys(value), 'source');
      return value;
    }),
    surnames: surnames.map(surname => {
      const value = { id: surname.id, hangul: surname.hangul };
      if (!present(surname.hanja_present, surname.hanja, 'hanja', true)) fail('hanja required');
      value.hanja = surname.hanja;
      for (const [field, presentName, valueName] of [
        ['population_2015', 'population_2015_present', 'population_2015'],
        ['population_2000', 'population_2000_present', 'population_2000'],
        ['population_1985', 'population_1985_present', 'population_1985'],
      ]) {
        if (present(surname[presentName], surname[valueName], field, true)) value[field] = surname[valueName];
      }
      const refs = surnameSources.filter(item => item.surname_ordinal === surname.ordinal);
      if (refs.length === 0 || refs.some((item, index) => item.ordinal !== index || !text(item.source_id) || !sourceIds.has(item.source_id))) fail('surname source refs');
      value.sources = refs.map(item => item.source_id);
      const clans = bongwan.filter(item => item.surname_ordinal === surname.ordinal);
      if (clans.some((item, index) => item.ordinal !== index)) fail('bongwan order');
      value.bongwan = clans.map(item => {
        const clan = { id: item.id, name: item.name };
        if (item.hanja_present !== 1) fail('bongwan hanja required');
        clan.hanja = item.hanja;
        if (![0, 1].includes(item.majority)) fail('majority');
        clan.majority = item.majority === 1;
        const clanRefs = bongwanSources.filter(ref => ref.surname_ordinal === item.surname_ordinal && ref.bongwan_ordinal === item.ordinal);
        if (clanRefs.length === 0 || clanRefs.some((ref, index) => ref.ordinal !== index || !text(ref.source_id) || !sourceIds.has(ref.source_id))) fail('bongwan source refs');
        clan.sources = clanRefs.map(ref => ref.source_id);
        keysFor(bongwanKeys.filter(key => key.surname_ordinal === item.surname_ordinal && key.bongwan_ordinal === item.ordinal), Object.keys(clan), 'bongwan');
        return clan;
      });
      if (present(surname.bongwan_unlisted_reason_present, surname.bongwan_unlisted_reason, 'bongwan_unlisted_reason')) {
        value.bongwan_unlisted_reason = surname.bongwan_unlisted_reason;
      }
      keysFor(surnameKeys.filter(key => key.surname_ordinal === surname.ordinal), Object.keys(value), 'surname');
      return value;
    }),
  };
  const consumed = {
    surname_origin_document: documents.length,
    surname_origin_source: sources.length,
    surname_origin_source_key: sourceKeys.length,
    surname_origin_surname: surnames.length,
    surname_origin_surname_key: surnameKeys.length,
    surname_origin_surname_source: surnameSources.length,
    surname_origin_bongwan: bongwan.length,
    surname_origin_bongwan_key: bongwanKeys.length,
    surname_origin_bongwan_source: bongwanSources.length,
  };
  if (!same(consumed, COUNTS)) fail('consumed row counts');
  const seenKeys = sourceKeys.length + surnameKeys.length + bongwanKeys.length;
  const expectedKeys = document.sources.reduce((sum, source) => sum + Object.keys(source).length, 0)
    + document.surnames.reduce((sum, surname) => sum + Object.keys(surname).length + surname.bongwan.reduce((inner, clan) => inner + Object.keys(clan).length, 0), 0);
  if (seenKeys !== expectedKeys) fail('unconsumed key rows');
  shape(document);
  if (hash(JSON.stringify(document)) !== SURNAME_ORIGIN_DOCUMENT_HASH) fail('document hash');
  return document;
}
