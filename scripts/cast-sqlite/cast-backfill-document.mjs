import { createHash } from 'node:crypto';


const PERSON_COUNT = 422;
const FULL_PEOPLE = 412;
const SPARSE_PEOPLE = PERSON_COUNT - FULL_PEOPLE;
const KEY_ROW_COUNT = 3 + PERSON_COUNT * 10 + FULL_PEOPLE * 15 + SPARSE_PEOPLE * 8 + PERSON_COUNT * 3 * 2 + FULL_PEOPLE * 7 * 2 + PERSON_COUNT * 5 * 3;
const COUNTS = {
  cast_backfill_document_import: 1,
  cast_backfill_document_root: 1,
  cast_backfill_document_person: PERSON_COUNT,
  cast_backfill_document_key: KEY_ROW_COUNT,
};

const rootFields = ['generated', 'count', 'people'];
const personFields = ['성명', '소속', '직위', '출신 공동체', '언어', '생업', '징집 이력', '무장 접근', 'source_file', 'fields'];
const identityFields = ['성명', '소속', '직위'];
const proseFields = ['성격', '개인 야망', '공포', '통치 방식', '핵심 관계', '촉발 사건', '플레이어 개입'];
const narrativeFields = [...identityFields, ...proseFields];
const derivedFields = ['출신 공동체', '언어', '생업', '징집 이력', '무장 접근'];
const fieldNames = [...narrativeFields, ...derivedFields];
const fullFieldOrder = fieldNames;
const sparseFieldOrder = [...identityFields, ...derivedFields];
const entryFields = ['value', 'derived', 'rule'];
const personColumns = [
  'ordinal', 'document_id',
  ...personFields.slice(0, -1),
  ...fieldNames.flatMap(name => [`${name}_value`, `${name}_derived`, `${name}_rule_present`, `${name}_rule`]),
];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CAST_BACKFILL_DOCUMENT: ${detail}`), { code: 'E_CAST_BACKFILL_DOCUMENT' }); };
const text = value => typeof value === 'string' && value.length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const quote = name => `"${name}"`;
const receiptOf = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

function keys(value, allowed, label) {
  if (!object(value)) fail(`${label} shape`);
  const actual = Object.keys(value);
  if (actual.length === 0 || actual.some(key => !allowed.includes(key))) fail(`${label} fields`);
  let cursor = -1;
  for (const key of actual) {
    const index = allowed.indexOf(key);
    if (index <= cursor) fail(`${label} order`);
    cursor = index;
  }
  return actual;
}

function shapeEntry(entry, name, narrative) {
  keys(entry, entryFields, `${name} entry`);
  if (!text(entry.value) || typeof entry.derived !== 'boolean') fail(`${name} entry`);
  if (narrative) {
    if (entry.derived !== false || Object.hasOwn(entry, 'rule') || Object.keys(entry).length !== 2) fail(`${name} derived`);
    return;
  }
  if (entry.derived !== true || !text(entry.rule) || Object.keys(entry).length !== 3) fail(`${name} derived`);
}

function shapePerson(person, index) {
  const actual = keys(person, personFields, `person ${index}`);
  if (!same(actual, personFields)) fail(`person ${index} fields`);
  for (const field of personFields.slice(0, -1)) if (!text(person[field])) fail(`person ${index} ${field}`);
  const fieldKeys = keys(person.fields, fullFieldOrder, `person ${index} fields object`);
  const narrative = fieldKeys.length === fullFieldOrder.length;
  if (!same(fieldKeys, narrative ? fullFieldOrder : sparseFieldOrder)) fail(`person ${index} field order`);
  for (const name of identityFields) {
    shapeEntry(person.fields[name], name, true);
    if (person.fields[name].value !== person[name]) fail(`person ${index} ${name} value`);
  }
  for (const name of proseFields) {
    if (narrative) shapeEntry(person.fields[name], name, true);
    else if (Object.hasOwn(person.fields, name)) fail(`person ${index} sparse`);
  }
  for (const name of derivedFields) {
    shapeEntry(person.fields[name], name, false);
    if (person.fields[name].value !== person[name]) fail(`person ${index} ${name} value`);
  }
}

function shape(document) {
  const actual = keys(document, rootFields, 'document');
  if (!same(actual, rootFields) || !text(document.generated) || !Number.isInteger(document.count) || document.count !== PERSON_COUNT) fail('document');
  if (!Array.isArray(document.people) || document.people.length !== PERSON_COUNT) fail('people');
  document.people.forEach(shapePerson);
}

function insertKeys(db, objectPath, value) {
  Object.keys(value).forEach((key, ordinal) => {
    db.prepare('INSERT INTO cast_backfill_document_key (object_path, ordinal, key) VALUES (?, ?, ?)').run(objectPath, ordinal, key);
  });
}

function personValues(person, ordinal) {
  const values = [ordinal, person['성명'], person['소속'], person['직위'], person['출신 공동체'], person['언어'], person['생업'], person['징집 이력'], person['무장 접근'], person.source_file];
  for (const name of fieldNames) {
    const entry = person.fields[name];
    if (!entry) values.push(null, null, null, null);
    else values.push(entry.value, Number(entry.derived), Number(Object.hasOwn(entry, 'rule')), entry.rule ?? null);
  }
  return values;
}

/** Import only the exact original draft. Preservation grants no biography, mechanics, or approval. */
export function initializeCastBackfillDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO cast_backfill_document_import (document_id, source_sha256, document_sha256, row_sha256, actor, reason, receipt_sha256) VALUES (1, ?, ?, ?, ?, ?, ?)')
      .run(sourceHash, documentHash, hash(JSON.stringify(document.people)), actor, reason, receiptOf(sourceHash, documentHash, actor, reason));
    db.prepare('INSERT INTO cast_backfill_document_root (document_id, generated, count) VALUES (1, ?, ?)').run(document.generated, document.count);
    insertKeys(db, '$', document);
    const insertPerson = db.prepare(`INSERT INTO cast_backfill_document_person (${personColumns.map(quote).join(', ')}) VALUES (?, 1, ${Array.from({ length: personColumns.length - 2 }, () => '?').join(', ')})`);
    document.people.forEach((person, ordinal) => {
      insertPerson.run(...personValues(person, ordinal));
      insertKeys(db, `$.people[${ordinal}]`, person);
      insertKeys(db, `$.people[${ordinal}].fields`, person.fields);
      for (const [name, entry] of Object.entries(person.fields)) insertKeys(db, `$.people[${ordinal}].fields.${name}`, entry);
    });
    const read = readCastBackfillDocument(db);
    if (!same(read, document)) fail('transaction parity');
    db.exec('COMMIT');
    const fieldEntries = document.people.reduce((sum, person) => sum + Object.keys(person.fields).length, 0);
    return { documents: 1, people: document.people.length, fields: fieldEntries, keys: KEY_ROW_COUNT, totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0) };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function ordered(result, label) {
  if (result.some((row, index) => row.ordinal !== index)) fail(`${label} order`);
  return result;
}

function keysFor(rowsForObject, expected, label) {
  if (!rowsForObject || rowsForObject.length !== expected.length || rowsForObject.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${label} key order`);
}

function entryFrom(row, name) {
  const value = row[`${name}_value`];
  const derived = row[`${name}_derived`];
  const rulePresent = row[`${name}_rule_present`];
  const rule = row[`${name}_rule`];
  const absent = value === null && derived === null && rulePresent === null && rule === null;
  if (proseFields.includes(name) && absent) return null;
  if (absent || !text(value) || ![0, 1].includes(derived) || ![0, 1].includes(rulePresent)) fail(`${name} field`);
  if ((rulePresent === 0 && rule !== null) || (rulePresent === 1 && !text(rule))) fail(`${name} rule`);
  const narrative = narrativeFields.includes(name);
  if (narrative && (derived !== 0 || rulePresent !== 0)) fail(`${name} derived`);
  if (!narrative && (derived !== 1 || rulePresent !== 1)) fail(`${name} derived`);
  const entry = { value, derived: derived === 1 };
  if (rulePresent === 1) entry.rule = rule;
  return entry;
}

/** SELECT-only reconstruction. No source I/O, archive access, or JSON parsing. */
export function readCastBackfillDocument(db) {
  try {
    const imports = db.prepare('SELECT document_id, source_sha256, document_sha256, row_sha256, actor, reason, receipt_sha256 FROM cast_backfill_document_import').all();
    if (imports.length !== 1) fail('import count');
    const receipt = imports[0];
    if (receipt.document_id !== 1
      || !text(receipt.actor) || !receipt.actor.trim() || !text(receipt.reason) || !receipt.reason.trim() || receipt.row_sha256.length !== 64) fail('provenance');
    const roots = db.prepare('SELECT document_id, generated, count FROM cast_backfill_document_root').all();
    if (roots.length !== 1) fail('root count');
    const root = roots[0];
    if (root.document_id !== 1 || !text(root.generated) || root.count !== PERSON_COUNT) fail('root');
    const people = ordered(db.prepare(`SELECT ${personColumns.map(quote).join(', ')} FROM cast_backfill_document_person ORDER BY ordinal`).all(), 'person');
    if (people.some(row => row.document_id !== 1)) fail('person parent');
    const keyRows = db.prepare('SELECT object_path, ordinal, key FROM cast_backfill_document_key ORDER BY object_path, ordinal').all();
    const keysByPath = new Map();
    for (const row of keyRows) {
      if (!keysByPath.has(row.object_path)) keysByPath.set(row.object_path, []);
      keysByPath.get(row.object_path).push(row);
    }
    const document = { generated: root.generated, count: root.count, people: people.map(person => {
      const fieldObject = {};
      for (const name of fieldNames) {
        const entry = entryFrom(person, name);
        if (!entry) continue;
        if (personFields.includes(name) && entry.value !== person[name]) fail(`person ${person.ordinal} ${name} value`);
        fieldObject[name] = entry;
        keysFor(keysByPath.get(`$.people[${person.ordinal}].fields.${name}`), Object.keys(entry), `${name} entry`);
      }
      const value = {
        '성명': person['성명'], '소속': person['소속'], '직위': person['직위'], '출신 공동체': person['출신 공동체'],
        '언어': person['언어'], '생업': person['생업'], '징집 이력': person['징집 이력'], '무장 접근': person['무장 접근'],
        source_file: person.source_file, fields: fieldObject,
      };
      keysFor(keysByPath.get(`$.people[${person.ordinal}]`), Object.keys(value), `person ${person.ordinal}`);
      keysFor(keysByPath.get(`$.people[${person.ordinal}].fields`), Object.keys(fieldObject), `person ${person.ordinal} fields`);
      return value;
    }) };
    keysFor(keysByPath.get('$'), Object.keys(document), 'document');
    const allowed = new Set(['$', ...document.people.flatMap((person, ordinal) => [
      `$.people[${ordinal}]`,
      `$.people[${ordinal}].fields`,
      ...Object.keys(person.fields).map(name => `$.people[${ordinal}].fields.${name}`),
    ])]);
    if (keysByPath.size !== allowed.size || [...keysByPath.keys()].some(path => !allowed.has(path))) fail('key paths');
    const consumed = {
      cast_backfill_document_import: imports.length,
      cast_backfill_document_root: roots.length,
      cast_backfill_document_person: people.length,
      cast_backfill_document_key: keyRows.length,
    };
    shape(document);
    return document;
  } catch (error) {
    if (error.code === 'E_CAST_BACKFILL_DOCUMENT') throw error;
    fail(error.message);
  }
}
