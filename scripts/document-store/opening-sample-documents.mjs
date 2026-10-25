import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Private typed snapshot of the editorial Opening-Profile-Sample.json.
// Initialization records supplied bytes; it does not approve, publish, or reinterpret them.
// Preserves six people, ordered base values/skills/traits, optional effectProposal, all metadata and pending text exactly.
// Uses fixed independent byte and ordered document hashes, named typed columns, ordered relations and presence flags.
export const INTERNAL_OPENING_SAMPLE_CAPABILITY = Symbol('internal Opening-Sample-Documents');
export const OPENING_SAMPLE_SOURCE_HASHES = Object.freeze({
  'lore/editorial/Opening-Profile-Sample.json': '8eccb22f7fd7ef1956d4a5e3947c8b6b387ab2eaa77a5a5cc0cdf202a03e0dad',
});
const DOCUMENT_HASHES = Object.freeze({
  'lore/editorial/Opening-Profile-Sample.json': '07cc6eed0cbae2937361ce4ab046e6da8674262be80fbefde858c97a844f5112',
});
const APPLICATION_ID = 0x4f504e53; // OPSN for Opening Profile Sample
const PATHS = Object.freeze(Object.keys(OPENING_SAMPLE_SOURCE_HASHES));
const schema = readFileSync(new URL('./opening-sample-documents.sql', import.meta.url), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const quote = name => '"' + name + '"';

const DOCUMENT_KEYS = ['schema', 'status', 'approvalRef', 'visibility', 'abilityOrder', 'people', 'reviewQuestions', 'pending'];
const ABILITY_KEYS = ['leadership', 'strategy', 'negotiation', 'management', 'insight', 'learning', 'prowess', 'endurance'];
const PERSON_KEYS = ['personId', 'name', 'base', 'skills', 'traits', 'evidenceNote'];
const SKILL_KEYS = ['name', 'rating'];
const TRAIT_KEYS = ['name', 'ability', 'delta', 'effectProposal'];

const sameKeys = (value, keys) => {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
};
const text = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value);
const number = value => typeof value === 'number' && isFinite(value);

function authorize(options = {}) {
  if (!Object.hasOwn(options, 'scope') || options.scope !== 'internal' || options.capability !== INTERNAL_OPENING_SAMPLE_CAPABILITY) fail('E_PRIVATE');
}

function absolutePath(value) {
  if (typeof value !== 'string' || !isAbsolute(value)) fail('E_OPENING_SAMPLE_PATH');
}

function exactPins(expectedSourceHashes) {
  if (!expectedSourceHashes || typeof expectedSourceHashes !== 'object' || Array.isArray(expectedSourceHashes)) fail('E_OPENING_SAMPLE_PINS');
  const keys = Object.keys(expectedSourceHashes);
  if (keys.length !== PATHS.length || PATHS.some(path => !Object.hasOwn(expectedSourceHashes, path) || expectedSourceHashes[path] !== OPENING_SAMPLE_SOURCE_HASHES[path])) fail('E_OPENING_SAMPLE_PINS');
}

function sourceSet(sources) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_OPENING_SAMPLE_PINS');
  const keys = Object.keys(sources);
  if (keys.length !== PATHS.length || PATHS.some(path => !Object.hasOwn(sources, path))) fail('E_OPENING_SAMPLE_PINS');
}

function inspectDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document) || !sameKeys(document, DOCUMENT_KEYS)) fail('E_OPENING_SAMPLE_SHAPE');
  if (![document.schema, document.status, document.approvalRef, document.visibility, document.pending].every(text)) fail('E_OPENING_SAMPLE_SHAPE');
  if (document.schema !== 'seoul-opening-profile-sample.v1' || document.visibility !== 'editorial-only') fail('E_OPENING_SAMPLE_SHAPE');
  if (!Array.isArray(document.abilityOrder) || document.abilityOrder.length !== 8 || !document.abilityOrder.every(text) || JSON.stringify(document.abilityOrder) !== JSON.stringify(ABILITY_KEYS)) fail('E_OPENING_SAMPLE_SHAPE');
  if (!Array.isArray(document.people) || document.people.length !== 6) fail('E_OPENING_SAMPLE_SHAPE');
  if (!Array.isArray(document.reviewQuestions) || document.reviewQuestions.some(v => !text(v))) fail('E_OPENING_SAMPLE_SHAPE');
  const seen = new Set();
  for (const person of document.people) {
    if (!person || typeof person !== 'object' || Array.isArray(person) || !sameKeys(person, PERSON_KEYS)) fail('E_OPENING_SAMPLE_SHAPE');
    if (![person.personId, person.name, person.evidenceNote].every(text)) fail('E_OPENING_SAMPLE_SHAPE');
    if (seen.has(person.personId)) fail('E_OPENING_SAMPLE_SHAPE');
    seen.add(person.personId);
    if (!Array.isArray(person.base) || person.base.length !== 8 || !person.base.every(integer)) fail('E_OPENING_SAMPLE_SHAPE');
    if (!Array.isArray(person.skills) || !person.skills.every(s => sameKeys(s, SKILL_KEYS) && text(s.name) && number(s.rating))) fail('E_OPENING_SAMPLE_SHAPE');
    if (!Array.isArray(person.traits)) fail('E_OPENING_SAMPLE_SHAPE');
    for (const trait of person.traits) {
      if (!trait || typeof trait !== 'object' || Array.isArray(trait)) fail('E_OPENING_SAMPLE_SHAPE');
      if (!text(trait.name)) fail('E_OPENING_SAMPLE_SHAPE');
      if (trait.ability !== undefined && !text(trait.ability)) fail('E_OPENING_SAMPLE_SHAPE');
      if (trait.delta !== undefined && !integer(trait.delta)) fail('E_OPENING_SAMPLE_SHAPE');
      if (trait.effectProposal !== undefined && !text(trait.effectProposal)) fail('E_OPENING_SAMPLE_SHAPE');
    }
  }
}

function writeDocument(db, logicalPath, document) {
  inspectDocument(document);
  db.prepare('INSERT INTO opening_sample_documents_document (' + ['logical_path', 'schema', 'status', 'approval_ref', 'visibility', 'people_count', 'review_question_count', 'pending'].map(quote).join(',') + ') VALUES (?,?,?,?,?,?,?,?)')
    .run(logicalPath, document.schema, document.status, document.approvalRef, document.visibility, document.people.length, document.reviewQuestions.length, document.pending);
  const abilityInsert = db.prepare('INSERT INTO opening_sample_documents_ability (logical_path, ordinal, value) VALUES (?,?,?)');
  document.abilityOrder.forEach((value, ordinal) => abilityInsert.run(logicalPath, ordinal, value));
  const reviewInsert = db.prepare('INSERT INTO opening_sample_documents_review_question (logical_path, ordinal, value) VALUES (?,?,?)');
  document.reviewQuestions.forEach((value, ordinal) => reviewInsert.run(logicalPath, ordinal, value));
  const personInsert = db.prepare('INSERT INTO opening_sample_documents_person (logical_path, ordinal, person_id, name, base_leadership, base_strategy, base_negotiation, base_management, base_insight, base_learning, base_prowess, base_endurance, skill_count, trait_count, ability_present, delta_present, effect_proposal_present, evidence_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const skillInsert = db.prepare('INSERT INTO opening_sample_documents_skill (logical_path, person_ordinal, ordinal, name, rating) VALUES (?,?,?,?,?)');
  const traitInsert = db.prepare('INSERT INTO opening_sample_documents_trait (logical_path, person_ordinal, ordinal, name, ability, delta, effect_proposal) VALUES (?,?,?,?,?,?,?)');
  document.people.forEach((person, ordinal) => {
    const abilityPresent = person.traits.some(trait => trait.ability !== undefined) ? 1 : 0;
    const deltaPresent = person.traits.some(trait => trait.delta !== undefined) ? 1 : 0;
    const effectPresent = person.traits.some(trait => trait.effectProposal !== undefined) ? 1 : 0;
    personInsert.run(logicalPath, ordinal, person.personId, person.name, ...person.base, person.skills.length, person.traits.length, abilityPresent, deltaPresent, effectPresent, person.evidenceNote);
    person.skills.forEach((skill, sidx) => skillInsert.run(logicalPath, ordinal, sidx, skill.name, skill.rating));
    person.traits.forEach((trait, tidx) => {
      traitInsert.run(logicalPath, ordinal, tidx, trait.name, trait.ability ?? null, trait.delta ?? null, trait.effectProposal ?? null);
    });
  });
}

function ordered(db, sql, params, expectedCount) {
  const rows = db.prepare(sql).all(...params);
  if (rows.length !== expectedCount || rows.some((row, index) => row.ordinal !== index)) fail('E_OPENING_SAMPLE_INTEGRITY');
  return rows;
}

function owned(rows, personOrdinal, expectedCount) {
  const matches = rows.filter(row => row.person_ordinal === personOrdinal);
  if (matches.length !== expectedCount || matches.some((row, index) => row.ordinal !== index)) fail('E_OPENING_SAMPLE_INTEGRITY');
  return matches;
}

function readOne(db, logicalPath, receipt) {
  const documentRow = db.prepare('SELECT * FROM opening_sample_documents_document WHERE logical_path=?').get(logicalPath);
  if (!documentRow || documentRow.people_count !== 6) fail('E_OPENING_SAMPLE_INTEGRITY');
  const abilities = ordered(db, 'SELECT ordinal, value FROM opening_sample_documents_ability WHERE logical_path=? ORDER BY ordinal', [logicalPath], 8);
  const reviewQuestions = ordered(db, 'SELECT ordinal, value FROM opening_sample_documents_review_question WHERE logical_path=? ORDER BY ordinal', [logicalPath], documentRow.review_question_count);
  const peopleRows = ordered(db, 'SELECT * FROM opening_sample_documents_person WHERE logical_path=? ORDER BY ordinal', [logicalPath], 6);
  const skills = db.prepare('SELECT * FROM opening_sample_documents_skill WHERE logical_path=? ORDER BY person_ordinal, ordinal').all(logicalPath);
  const traits = db.prepare('SELECT * FROM opening_sample_documents_trait WHERE logical_path=? ORDER BY person_ordinal, ordinal').all(logicalPath);
  const result = {
    schema: documentRow.schema,
    status: documentRow.status,
    approvalRef: documentRow.approval_ref,
    visibility: documentRow.visibility,
    abilityOrder: abilities.map(r => r.value),
    people: peopleRows.map(p => {
      const personSkills = owned(skills, p.ordinal, p.skill_count).map(s => ({ name: s.name, rating: s.rating }));
      const personTraits = owned(traits, p.ordinal, p.trait_count);
      const abilityPresent = personTraits.some(t => t.ability !== null);
      const deltaPresent = personTraits.some(t => t.delta !== null);
      const effectPresent = personTraits.some(t => t.effect_proposal !== null);
      if (p.ability_present !== (abilityPresent ? 1 : 0) || p.delta_present !== (deltaPresent ? 1 : 0) || p.effect_proposal_present !== (effectPresent ? 1 : 0)) fail('E_OPENING_SAMPLE_INTEGRITY');
      return {
        personId: p.person_id,
        name: p.name,
        base: [p.base_leadership, p.base_strategy, p.base_negotiation, p.base_management, p.base_insight, p.base_learning, p.base_prowess, p.base_endurance],
        skills: personSkills,
        traits: personTraits.map(t => {
          const trait = { name: t.name };
          if (t.ability !== null) trait.ability = t.ability;
          if (t.delta !== null) trait.delta = t.delta;
          if (t.effect_proposal !== null) trait.effectProposal = t.effect_proposal;
          return trait;
        }),
        evidenceNote: p.evidence_note,
      };
    }),
    reviewQuestions: reviewQuestions.map(r => r.value),
    pending: documentRow.pending,
  };
  if (result.abilityOrder.length !== ABILITY_KEYS.length || result.abilityOrder.some((value, index) => value !== ABILITY_KEYS[index])) fail('E_OPENING_SAMPLE_INTEGRITY');
  if (documentRow.review_question_count !== result.reviewQuestions.length) fail('E_OPENING_SAMPLE_INTEGRITY');
  const consumedSkills = peopleRows.reduce((sum, p) => sum + p.skill_count, 0);
  const consumedTraits = peopleRows.reduce((sum, p) => sum + p.trait_count, 0);
  if (consumedSkills !== skills.length || consumedTraits !== traits.length || consumedSkills !== 17 || consumedTraits !== 13) fail('E_OPENING_SAMPLE_INTEGRITY');
  if (sha(JSON.stringify(result)) !== receipt.document_sha256 || sha(JSON.stringify(result)) !== DOCUMENT_HASHES[logicalPath]) fail('E_OPENING_SAMPLE_INTEGRITY');
  return result;
}

function readDocumentsFrom(db, expectedSourceHashes) {
  exactPins(expectedSourceHashes);
  const receipts = db.prepare('SELECT * FROM opening_sample_documents_source ORDER BY logical_path').all();
  if (receipts.length !== PATHS.length || receipts.some(row => !PATHS.includes(row.logical_path) || row.source_sha256 !== OPENING_SAMPLE_SOURCE_HASHES[row.logical_path] || row.document_sha256 !== DOCUMENT_HASHES[row.logical_path] || row.byte_length !== 3819)) fail('E_OPENING_SAMPLE_INTEGRITY');
  for (const table of ['opening_sample_documents_document', 'opening_sample_documents_ability', 'opening_sample_documents_review_question', 'opening_sample_documents_person', 'opening_sample_documents_skill', 'opening_sample_documents_trait']) {
    const foreign = db.prepare('SELECT count(*) AS n FROM ' + table + ' WHERE logical_path != ?').get(PATHS[0]).n;
    if (foreign) fail('E_OPENING_SAMPLE_INTEGRITY');
  }
  const documents = new Map();
  for (const path of PATHS) documents.set(path, readOne(db, path, receipts.find(row => row.logical_path === path)));
  const counts = {
    opening_sample_documents_document: PATHS.length,
    opening_sample_documents_ability: 8,
    opening_sample_documents_review_question: 2,
    opening_sample_documents_person: 6,
    opening_sample_documents_skill: 17,
    opening_sample_documents_trait: 13,
  };
  for (const [table, expected] of Object.entries(counts)) {
    if (db.prepare('SELECT count(*) AS n FROM ' + table).get().n !== expected) fail('E_OPENING_SAMPLE_INTEGRITY');
  }
  return documents;
}

/** Caller supplies the exact logical path, bytes, and expected digest in memory.
 * The logical path is never opened. Archived bytes are immutable evidence only.
 */
export function initializeOpeningSampleDocuments(absoluteNewPath, options = {}) {
  authorize(options);
  absolutePath(absoluteNewPath);
  const { sources, actor, reason } = options;
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_OPENING_SAMPLE_AUDIT');
  if (options.expectedSourceHashes !== undefined) exactPins(options.expectedSourceHashes);
  sourceSet(sources);
  if (options.expectedSourceHashes !== undefined && PATHS.some(path => options.expectedSourceHashes[path] !== sources[path]?.expectedSourceHash)) fail('E_OPENING_SAMPLE_PINS');
  const parsed = new Map();
  for (const logicalPath of PATHS) {
    const input = sources[logicalPath];
    if (!input || input.bytes == null) fail('E_OPENING_SAMPLE_BYTES');
    if (!(input.bytes instanceof Uint8Array)) fail('E_OPENING_SAMPLE_BYTES');
    const bytes = Buffer.from(input.bytes);
    let document;
    try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { fail('E_OPENING_SAMPLE_SHAPE'); }
    if (typeof input.expectedSourceHash !== 'string' || !/^[a-f0-9]{64}$/.test(input.expectedSourceHash) || sha(bytes) !== input.expectedSourceHash) fail('E_OPENING_SAMPLE_PINS');
    parsed.set(logicalPath, { bytes, document });
  }
  closeSync(openSync(absoluteNewPath, 'wx', 0o600));
  let db;
  try {
    db = new DatabaseSync(absoluteNewPath, { enableForeignKeyConstraints: true });
    db.exec('BEGIN IMMEDIATE');
    db.exec(schema);
    db.exec('PRAGMA application_id=' + APPLICATION_ID + '; PRAGMA user_version=1');
    db.prepare('INSERT INTO opening_sample_documents_import (singleton, actor, reason, initialized_at) VALUES (1,?,?,?)').run(actor, reason, new Date().toISOString());
    for (const logicalPath of PATHS) {
      const { bytes, document } = parsed.get(logicalPath);
      db.prepare('INSERT INTO opening_sample_documents_source (logical_path, source_sha256, document_sha256, byte_length) VALUES (?,?,?,?)')
        .run(logicalPath, OPENING_SAMPLE_SOURCE_HASHES[logicalPath], DOCUMENT_HASHES[logicalPath], bytes.length);
      db.prepare('INSERT INTO opening_sample_documents_archive (logical_path, source_sha256, raw_bytes) VALUES (?,?,?)')
        .run(logicalPath, OPENING_SAMPLE_SOURCE_HASHES[logicalPath], bytes);
      writeDocument(db, logicalPath, document);
      if (sha(bytes) !== OPENING_SAMPLE_SOURCE_HASHES[logicalPath] || sha(JSON.stringify(document)) !== DOCUMENT_HASHES[logicalPath]) fail('E_OPENING_SAMPLE_SHAPE');
    }
    const documents = readDocumentsFrom(db, OPENING_SAMPLE_SOURCE_HASHES);
    for (const logicalPath of PATHS) {
      if (JSON.stringify(documents.get(logicalPath)) !== JSON.stringify(parsed.get(logicalPath).document)) fail('E_OPENING_SAMPLE_INTEGRITY');
    }
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) {
      if (db.isTransaction) db.exec('ROLLBACK');
      db.close();
    }
    unlinkSync(absoluteNewPath);
    throw error;
  }
}

/** Read-only reopen. SELECT reconstruction never opens the logical source or the archive. */
export function openOpeningSampleDocuments(databasePath, options = {}) {
  authorize(options);
  exactPins(options.expectedSourceHashes);
  absolutePath(databasePath);
  if (!existsSync(databasePath)) fail('E_OPENING_SAMPLE_PATH');
  if ((statSync(databasePath).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(databasePath, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    const receipts = db.prepare('SELECT logical_path, source_sha256, document_sha256 FROM opening_sample_documents_source').all();
    if (receipts.some(row => PATHS.includes(row.logical_path) && row.source_sha256 !== options.expectedSourceHashes[row.logical_path])) fail('E_OPENING_SAMPLE_PINS');
    db.exec('PRAGMA query_only=ON');
  } catch (error) {
    db.close();
    throw error;
  }
  return Object.freeze({
    close: () => db.close(),
    readDocuments() {
      db.exec('BEGIN');
      try {
        const documents = readDocumentsFrom(db, options.expectedSourceHashes);
        db.exec('COMMIT');
        return documents;
      } catch (error) {
        if (db.isTransaction) db.exec('ROLLBACK');
        throw error;
      }
    },
  });
}
