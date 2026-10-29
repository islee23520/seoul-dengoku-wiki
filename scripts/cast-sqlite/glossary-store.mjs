import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';

export const GLOSSARY_CATEGORIES = Object.freeze(['state', 'organization', 'person_category', 'technology', 'equipment', 'geography', 'event', 'ailment']);
export const GLOSSARY_STATUSES = Object.freeze(['fact-public', 'fiction-original', 'generic-unregistered']);
const fields = ['term_id', 'display_name_ko', 'reader_definition_ko', 'display_name_en', 'reader_definition_en', 'category', 'owner_path', 'allowed_context', 'aliases', 'aliases_en', 'status'];
const revisionTables = ['glossary_owner_reference', 'glossary_term', 'glossary_locale', 'glossary_alias', 'glossary_context'];
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const digest = (entries) => hash(canonical(entries));
function text(value, label) { if (typeof value !== 'string' || !value.trim()) fail('E_GLOSSARY_FIELD', label); }
function keys(value, allowed) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).some(key => !allowed.includes(key))
    || allowed.some(key => !Object.hasOwn(value, key))) fail('E_GLOSSARY_FIELDS', 'unknown or missing fields');
}
function validate(entries) {
  if (!Array.isArray(entries) || !entries.length) fail('E_GLOSSARY_SHAPE', 'nonempty term array required');
  const ids = new Set();
  for (const entry of entries) {
    keys(entry, fields);
    for (const field of fields.filter(field => !['aliases', 'aliases_en', 'allowed_context'].includes(field))) text(entry[field], field);
    if (ids.has(entry.term_id)) fail('E_GLOSSARY_DUPLICATE', entry.term_id);
    ids.add(entry.term_id);
    if (!GLOSSARY_CATEGORIES.includes(entry.category)) fail('E_GLOSSARY_CATEGORY', entry.category);
    if (!GLOSSARY_STATUSES.includes(entry.status)) fail('E_GLOSSARY_STATUS', entry.status);
    for (const field of ['aliases', 'aliases_en', 'allowed_context']) {
      if (!Array.isArray(entry[field])) fail('E_GLOSSARY_FIELD', field);
      entry[field].forEach(value => text(value, field));
    }
    if (!entry.allowed_context.length || entry.allowed_context.some(context => !['all', 'dialogue', 'informal'].includes(context))) fail('E_GLOSSARY_CONTEXT', entry.term_id);
  }
}
function connection(db) {
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_GLOSSARY_DATABASE', 'foreign keys must be enabled');
}

/** One-time migration only. Caller provides independently approved bytes and their expected hash. */
export function initializeGlossaryStore(db, command) {
  keys(command, ['approvedBytes', 'expectedSha256', 'provenanceLabel', 'actor', 'reason']);
  const { approvedBytes, expectedSha256, provenanceLabel, actor, reason } = command;
  connection(db); text(actor, 'actor'); text(reason, 'reason'); text(provenanceLabel, 'provenanceLabel');
  if (!(approvedBytes instanceof Uint8Array) || hash(approvedBytes) !== expectedSha256) fail('E_GLOSSARY_ARCHIVE', 'approved byte hash mismatch');
  const bytes = Buffer.from(approvedBytes);
  const entries = JSON.parse(bytes.toString('utf8'));
  validate(entries);
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='glossary_head'").get()) fail('E_GLOSSARY_INITIALIZED', 'store already exists');
    db.exec(readFileSync(new URL('./glossary-store.sql', import.meta.url), 'utf8'));
    for (const table of [...revisionTables, 'glossary_revision', 'glossary_revision_seal']) {
      for (const operation of ['UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER ${table}_no_${operation} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'immutable glossary revision'); END`);
      if (revisionTables.includes(table)) db.exec(`CREATE TRIGGER ${table}_sealed BEFORE INSERT ON ${table}
        WHEN EXISTS(SELECT 1 FROM glossary_revision_seal WHERE revision_id=NEW.revision_id)
        BEGIN SELECT RAISE(ABORT,'sealed glossary revision'); END`);
    }
    db.prepare('INSERT INTO glossary_archive VALUES (1,?,?,?)').run(bytes, expectedSha256, provenanceLabel);
    const revision = recordRevision(db, entries, { parent: null, sequence: 0, actor, reason, provenanceLabel });
    db.prepare('INSERT INTO glossary_head VALUES (1,?)').run(revision);
    return { revision, contentSha256: digest(entries) };
  });
}

function recordRevision(db, entries, { parent, sequence, actor, reason, provenanceLabel }) {
  const contentSha256 = digest(entries);
  const revision = hash(canonical([parent, sequence, contentSha256, actor, reason]));
  db.prepare('INSERT INTO glossary_revision VALUES (?,?,?,?,?,?,?)').run(revision, parent, sequence, actor, reason, new Date().toISOString(), contentSha256);
  for (const identity of new Set(entries.map(entry => entry.owner_path))) db.prepare('INSERT INTO glossary_owner_reference VALUES (?,?,?)').run(revision, identity, provenanceLabel);
  for (const [ordinal, entry] of entries.entries()) {
    db.prepare('INSERT INTO glossary_term VALUES (?,?,?,?,?,?)').run(revision, entry.term_id, ordinal, entry.category, entry.status, entry.owner_path);
    for (const locale of ['ko', 'en']) {
      db.prepare('INSERT INTO glossary_locale VALUES (?,?,?,?,?)').run(revision, entry.term_id, locale, entry[`display_name_${locale}`], entry[`reader_definition_${locale}`]);
      entry[locale === 'ko' ? 'aliases' : 'aliases_en'].forEach((alias, index) => db.prepare('INSERT INTO glossary_alias VALUES (?,?,?,?,?)').run(revision, entry.term_id, locale, index, alias));
    }
    entry.allowed_context.forEach((context, index) => db.prepare('INSERT INTO glossary_context VALUES (?,?,?,?)').run(revision, entry.term_id, index, context));
  }
  db.prepare('INSERT INTO glossary_revision_seal VALUES (?)').run(revision);
  return revision;
}

export function readGlossaryHead(db) {
  const row = db.prepare('SELECT r.* FROM glossary_head h JOIN glossary_revision r ON r.revision_id=h.revision_id WHERE h.singleton=1').get();
  if (!row) fail('E_GLOSSARY_NOT_FOUND', 'glossary head absent');
  return { revision: row.revision_id, parentRevision: row.parent_revision, sequence: row.sequence, contentSha256: row.content_sha256, actor: row.actor, reason: row.reason };
}

/** No path resolution, source import or archive parsing: every field comes from typed SQL rows. */
export function listGlossaryEntries(db, { visibility = 'public', revision } = {}) {
  if (!['public', 'internal'].includes(visibility)) fail('E_GLOSSARY_VISIBILITY', visibility);
  const selected = revision ?? readGlossaryHead(db).revision;
  if (!db.prepare('SELECT 1 FROM glossary_revision_seal WHERE revision_id=?').get(selected)) fail('E_GLOSSARY_REVISION', 'unknown sealed revision');
  return db.prepare(`SELECT * FROM glossary_term WHERE revision_id=? ${visibility === 'public' ? "AND status='fact-public'" : ''} ORDER BY ordinal`).all(selected).map(term => {
    const localized = Object.fromEntries(db.prepare('SELECT * FROM glossary_locale WHERE revision_id=? AND term_id=?').all(selected, term.term_id).map(row => [row.locale, row]));
    const aliases = locale => db.prepare('SELECT alias FROM glossary_alias WHERE revision_id=? AND term_id=? AND locale=? ORDER BY ordinal').all(selected, term.term_id, locale).map(row => row.alias);
    return {
      term_id: term.term_id, display_name_ko: localized.ko.display_name, reader_definition_ko: localized.ko.reader_definition,
      display_name_en: localized.en.display_name, reader_definition_en: localized.en.reader_definition, category: term.category,
      owner_path: term.owner_document_identity, allowed_context: db.prepare('SELECT context FROM glossary_context WHERE revision_id=? AND term_id=? ORDER BY ordinal').all(selected, term.term_id).map(row => row.context),
      aliases: aliases('ko'), aliases_en: aliases('en'), status: term.status
    };
  });
}

export function readGlossaryEntry(db, termId, selection) {
  text(termId, 'termId');
  return listGlossaryEntries(db, selection).find(entry => entry.term_id === termId) ?? null;
}

/** PostgreSQL readers use the caller's reader or transaction; no SQLite fallback. */
export async function readGlossaryHeadAsync(db) {
  const row = (await db.query('SELECT r.* FROM wiki.glossary_head h JOIN wiki.glossary_revision r ON r.revision_id=h.revision_id WHERE h.singleton=1')).rows[0];
  if (!row) fail('E_GLOSSARY_NOT_FOUND', 'glossary head absent');
  return { revision: row.revision_id, parentRevision: row.parent_revision, sequence: row.sequence, contentSha256: row.content_sha256, actor: row.actor, reason: row.reason };
}

/** No path resolution, source import or archive parsing: every field comes from typed SQL rows. */
export async function listGlossaryEntriesAsync(db, { visibility = 'public', revision } = {}) {
  if (!['public', 'internal'].includes(visibility)) fail('E_GLOSSARY_VISIBILITY', visibility);
  const selected = revision ?? (await readGlossaryHeadAsync(db)).revision;
  if (!(await db.query('SELECT 1 FROM wiki.glossary_revision_seal WHERE revision_id=?', [selected])).rows.length) fail('E_GLOSSARY_REVISION', 'unknown sealed revision');
  const terms = (await db.query(`SELECT * FROM wiki.glossary_term WHERE revision_id=? ${visibility === 'public' ? "AND status='fact-public'" : ''} ORDER BY ordinal`, [selected])).rows;
  const entries = [];
  for (const term of terms) {
    const localized = Object.fromEntries((await db.query('SELECT * FROM wiki.glossary_locale WHERE revision_id=? AND term_id=?', [selected, term.term_id])).rows.map(row => [row.locale, row]));
    const aliases = async locale => (await db.query('SELECT alias FROM wiki.glossary_alias WHERE revision_id=? AND term_id=? AND locale=? ORDER BY ordinal', [selected, term.term_id, locale])).rows.map(row => row.alias);
    entries.push({
      term_id: term.term_id, display_name_ko: localized.ko.display_name, reader_definition_ko: localized.ko.reader_definition,
      display_name_en: localized.en.display_name, reader_definition_en: localized.en.reader_definition, category: term.category,
      owner_path: term.owner_document_identity, allowed_context: (await db.query('SELECT context FROM wiki.glossary_context WHERE revision_id=? AND term_id=? ORDER BY ordinal', [selected, term.term_id])).rows.map(row => row.context),
      aliases: await aliases('ko'), aliases_en: await aliases('en'), status: term.status
    });
  }
  return entries;
}

export async function readGlossaryEntryAsync(db, termId, selection) {
  text(termId, 'termId');
  return (await listGlossaryEntriesAsync(db, selection)).find(entry => entry.term_id === termId) ?? null;
}

/** Full typed replacements for existing stable IDs only. Publication approval is not an edit command. */
export function updateGlossaryEntries(db, command) {
  keys(command, ['expectedHead', 'updates', 'actor', 'reason']);
  const { expectedHead, updates, actor, reason } = command;
  connection(db); text(actor, 'actor'); text(reason, 'reason'); text(expectedHead, 'expectedHead'); validate(updates);
  return withTransaction(db, () => {
    const head = readGlossaryHead(db);
    if (head.revision !== expectedHead) fail('E_GLOSSARY_CONFLICT', 'stale expected head');
    const entries = listGlossaryEntries(db, { visibility: 'internal' });
    if (digest(entries) !== head.contentSha256) fail('E_GLOSSARY_INTEGRITY', 'head content mismatch');
    for (const update of updates) {
      const index = entries.findIndex(entry => entry.term_id === update.term_id);
      if (index < 0) fail('E_GLOSSARY_ID', 'unknown stable term ID');
      if (canonical(entries[index]) === canonical(update)) fail('E_GLOSSARY_NO_CHANGE', update.term_id);
      if (update.status === 'fact-public') fail('E_GLOSSARY_APPROVAL_REQUIRED', 'edited content cannot inherit or grant fact-public');
      entries[index] = update;
    }
    const provenanceLabel = db.prepare('SELECT provenance_label FROM glossary_archive WHERE singleton=1').get().provenance_label;
    const revision = recordRevision(db, entries, { parent: head.revision, sequence: head.sequence + 1, actor, reason, provenanceLabel });
    if (db.prepare('UPDATE glossary_head SET revision_id=? WHERE singleton=1 AND revision_id=?').run(revision, expectedHead).changes !== 1) fail('E_GLOSSARY_CONFLICT', 'head compare-and-swap failed');
    return { revision, previousRevision: expectedHead, contentSha256: digest(entries) };
  });
}
