import { createHash } from 'node:crypto';


const PRECEDENCE_COUNT = 3;
const PRESERVATION_COUNT = 8;
const REFERENCE_COUNT = 3;
const REPLACEMENT_COUNT = 39;
const PATTERN_COUNT = 29;
const RETAINED_COUNT = 4;
const ROOT_KEY_COUNT = 9;
const REFERENCE_KEY_COUNT = 6;
const REPLACEMENT_KEY_COUNT = 195;
const PATTERN_KEY_COUNT = 154;
const RETAINED_KEY_COUNT = 16;
const COUNTS = {
  creative_name_document_root: 1,
  creative_name_document_precedence: PRECEDENCE_COUNT,
  creative_name_document_preservation: PRESERVATION_COUNT,
  creative_name_document_reference: REFERENCE_COUNT,
  creative_name_document_replacement: REPLACEMENT_COUNT,
  creative_name_document_pattern: PATTERN_COUNT,
  creative_name_document_retained: RETAINED_COUNT,
  creative_name_document_key: ROOT_KEY_COUNT + REFERENCE_KEY_COUNT + REPLACEMENT_KEY_COUNT + PATTERN_KEY_COUNT + RETAINED_KEY_COUNT,
};

const documentFields = ['schema', 'decided_on', 'scope', 'precedence', 'source_preservation', 'references', 'replacements', 'pattern_replacements', 'retained'];
const referenceFields = ['label', 'url', 'path'];
const replacementFields = ['kind', 'id', 'old', 'new', 'anchor'];
const patternFields = ['kind', 'id', 'old', 'pattern', 'new', 'anchor'];
const retainedFields = ['kind', 'id', 'name', 'anchor'];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CREATIVE_NAME_DOCUMENT: ${detail}`), { code: 'E_CREATIVE_NAME_DOCUMENT' }); };
const text = value => typeof value === 'string' && value.length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const strings = value => Array.isArray(value) && value.length > 0 && value.every(item => text(item));

function keys(value, allowed) {
  if (!object(value)) fail('unknown, missing, or unordered fields');
  const actual = Object.keys(value);
  if (actual.length === 0 || actual.some(key => !allowed.includes(key))) fail('unknown, missing, or unordered fields');
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

function optionalText(value, field) {
  if (Object.hasOwn(value, field) && !text(value[field])) fail(`${field} shape`);
}

function shapeReference(reference) {
  keys(reference, referenceFields);
  requiredText(reference, 'label');
  optionalText(reference, 'url');
  optionalText(reference, 'path');
  if (!Object.hasOwn(reference, 'url') && !Object.hasOwn(reference, 'path')) fail('reference locator');
}

function shapeReplacement(replacement) {
  keys(replacement, replacementFields);
  for (const field of replacementFields) requiredText(replacement, field);
}

function shapePattern(pattern) {
  keys(pattern, patternFields);
  for (const field of ['kind', 'pattern', 'new', 'anchor']) requiredText(pattern, field);
  optionalText(pattern, 'id');
  optionalText(pattern, 'old');
}

function shapeRetained(retained) {
  keys(retained, retainedFields);
  for (const field of retainedFields) requiredText(retained, field);
}

function shape(document) {
  keys(document, documentFields);
  for (const field of ['schema', 'decided_on', 'scope']) requiredText(document, field);
  if (!strings(document.precedence) || !strings(document.source_preservation)) fail('string lists');
  if (!Array.isArray(document.references) || !Array.isArray(document.replacements)
    || !Array.isArray(document.pattern_replacements) || !Array.isArray(document.retained)) fail('document collections');
  document.references.forEach(shapeReference);
  document.replacements.forEach(shapeReplacement);
  document.pattern_replacements.forEach(shapePattern);
  document.retained.forEach(shapeRetained);
}

const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

function insertKeys(db, objectPath, value) {
  Object.keys(value).forEach((key, ordinal) => {
    db.prepare('INSERT INTO creative_name_document_key VALUES (?,?,?)').run(objectPath, ordinal, key);
  });
}

function presentFlag(value, field) {
  return Number(Object.hasOwn(value, field));
}

/** Import only the exact original document; normalization grants no approval and adds no facts. */
export function initializeCreativeNameDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO creative_name_document_root VALUES (1,?,?,?,?,?,?,?,?)').run(
      sourceHash, documentHash, document.schema, document.decided_on, document.scope, actor, reason, receipt(sourceHash, documentHash, actor, reason),
    );
    insertKeys(db, '$', document);
    document.precedence.forEach((value, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_precedence VALUES (?,?,?)').run(ordinal, 1, value);
    });
    document.source_preservation.forEach((value, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_preservation VALUES (?,?,?)').run(ordinal, 1, value);
    });
    document.references.forEach((reference, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_reference VALUES (?,?,?,?,?,?,?)').run(
        ordinal, 1, reference.label,
        presentFlag(reference, 'url'), reference.url ?? null,
        presentFlag(reference, 'path'), reference.path ?? null,
      );
      insertKeys(db, `$.references[${ordinal}]`, reference);
    });
    document.replacements.forEach((replacement, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_replacement VALUES (?,?,?,?,?,?,?)').run(
        ordinal, 1, replacement.kind, replacement.id, replacement.old, replacement.new, replacement.anchor,
      );
      insertKeys(db, `$.replacements[${ordinal}]`, replacement);
    });
    document.pattern_replacements.forEach((pattern, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_pattern VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        ordinal, 1, pattern.kind,
        presentFlag(pattern, 'id'), pattern.id ?? null,
        presentFlag(pattern, 'old'), pattern.old ?? null,
        pattern.pattern, pattern.new, pattern.anchor,
      );
      insertKeys(db, `$.pattern_replacements[${ordinal}]`, pattern);
    });
    document.retained.forEach((retained, ordinal) => {
      db.prepare('INSERT INTO creative_name_document_retained VALUES (?,?,?,?,?,?)').run(
        ordinal, 1, retained.kind, retained.id, retained.name, retained.anchor,
      );
      insertKeys(db, `$.retained[${ordinal}]`, retained);
    });
    const read = readCreativeNameDocument(db);
    if (!same(read, document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1,
      precedence: document.precedence.length,
      sourcePreservation: document.source_preservation.length,
      references: document.references.length,
      replacements: document.replacements.length,
      patternReplacements: document.pattern_replacements.length,
      retained: document.retained.length,
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

function keysFor(rowsForObject, expected, label) {
  if (rowsForObject.length !== expected.length || rowsForObject.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${label} key order`);
}

function present(flag, value, label) {
  if (![0, 1].includes(flag) || (flag === 0 && value !== null) || (flag === 1 && !text(value))) fail(`${label} presence`);
  return flag === 1;
}

function parented(result, label) {
  if (result.some(row => row.document_id !== 1)) fail(`${label} parent`);
  return result;
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readCreativeNameDocument(db) {
  const documents = db.prepare('SELECT * FROM creative_name_document_root').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1
    || !text(row.actor) || !row.actor.trim() || !text(row.reason) || !row.reason.trim()
    || !text(row.schema) || !text(row.decided_on) || !text(row.scope)) fail('provenance');
  const precedence = parented(ordered(rows(db, 'creative_name_document_precedence', 'ordinal'), 'precedence'), 'precedence');
  const preservation = parented(ordered(rows(db, 'creative_name_document_preservation', 'ordinal'), 'preservation'), 'preservation');
  const references = parented(ordered(rows(db, 'creative_name_document_reference', 'ordinal'), 'reference'), 'reference');
  const replacements = parented(ordered(rows(db, 'creative_name_document_replacement', 'ordinal'), 'replacement'), 'replacement');
  const patterns = parented(ordered(rows(db, 'creative_name_document_pattern', 'ordinal'), 'pattern'), 'pattern');
  const retained = parented(ordered(rows(db, 'creative_name_document_retained', 'ordinal'), 'retained'), 'retained');
  const keyRows = rows(db, 'creative_name_document_key', 'object_path, ordinal');
  const document = {
    schema: row.schema,
    decided_on: row.decided_on,
    scope: row.scope,
    precedence: precedence.map(item => item.value),
    source_preservation: preservation.map(item => item.value),
    references: references.map(item => {
      const value = { label: item.label };
      if (present(item.url_present, item.url, 'url')) value.url = item.url;
      if (present(item.path_present, item.path, 'path')) value.path = item.path;
      keysFor(keyRows.filter(key => key.object_path === `$.references[${item.ordinal}]`), Object.keys(value), 'reference');
      return value;
    }),
    replacements: replacements.map(item => {
      const value = { kind: item.kind, id: item.id, old: item.old, new: item.new, anchor: item.anchor };
      keysFor(keyRows.filter(key => key.object_path === `$.replacements[${item.ordinal}]`), Object.keys(value), 'replacement');
      return value;
    }),
    pattern_replacements: patterns.map(item => {
      const value = { kind: item.kind };
      if (present(item.id_present, item.id, 'id')) value.id = item.id;
      if (present(item.old_present, item.old, 'old')) value.old = item.old;
      Object.assign(value, { pattern: item.pattern, new: item.new, anchor: item.anchor });
      keysFor(keyRows.filter(key => key.object_path === `$.pattern_replacements[${item.ordinal}]`), Object.keys(value), 'pattern');
      return value;
    }),
    retained: retained.map(item => {
      const value = { kind: item.kind, id: item.id, name: item.name, anchor: item.anchor };
      keysFor(keyRows.filter(key => key.object_path === `$.retained[${item.ordinal}]`), Object.keys(value), 'retained');
      return value;
    }),
  };
  keysFor(keyRows.filter(key => key.object_path === '$'), Object.keys(document), 'document');
  const consumed = {
    creative_name_document_root: documents.length,
    creative_name_document_precedence: precedence.length,
    creative_name_document_preservation: preservation.length,
    creative_name_document_reference: references.length,
    creative_name_document_replacement: replacements.length,
    creative_name_document_pattern: patterns.length,
    creative_name_document_retained: retained.length,
    creative_name_document_key: keyRows.length,
  };
  if (!same(consumed, COUNTS)) fail('consumed row counts');
  const expectedKeys = Object.keys(document).length
    + document.references.reduce((sum, item) => sum + Object.keys(item).length, 0)
    + document.replacements.reduce((sum, item) => sum + Object.keys(item).length, 0)
    + document.pattern_replacements.reduce((sum, item) => sum + Object.keys(item).length, 0)
    + document.retained.reduce((sum, item) => sum + Object.keys(item).length, 0);
  if (keyRows.length !== expectedKeys) fail('unconsumed key rows');
  if (precedence.some(item => !text(item.value)) || preservation.some(item => !text(item.value))) fail('string lists');
  shape(document);
  return document;
}
