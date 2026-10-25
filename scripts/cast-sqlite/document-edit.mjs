import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { APPLICATION_ID, SCHEMA_VERSION, withTransaction } from './db.mjs';
import { readDocument } from './document-read.mjs';
import { TEXT_DATA_TABLE_COLUMNS } from './text-data.mjs';
import { headingId } from '../lore-json-render.mjs';
import { applyStructuralCommand, resolveStructuralLinks } from './document-structure.mjs';
import { revisionTableDefinition, sealHistoryTable, upgradeStructuralAuthority } from './document-structure-authority.mjs';

// No mapper import: the legacy mapper loads an authored JSON schema at module load.
const envelopeTables = ['text_document', 'text_document_locale', 'text_document_category',
  'text_document_source_ref', 'text_document_history', 'text_document_node', 'text_document_list_item',
  'text_document_table_row', 'text_document_table_cell', 'text_document_slot', 'text_document_run',
  'text_document_anchor', 'text_document_link'];
const tables = [...envelopeTables, ...Object.keys(TEXT_DATA_TABLE_COLUMNS)];
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (document) => hash(canonical(document));
const selector = (d) => ({ documentId: d.document_id, corpusKind: d.corpus_kind, domain: d.domain, visibility: 'internal' });
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
const schemaIdentity = (db) => {
  if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID
    || db.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION) fail('E_DOCUMENT_DATABASE', 'incompatible database');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_DOCUMENT_DATABASE', 'foreign keys must be enabled');
};

/** Explicit migration-only bootstrap from caller-validated typed rows. No files/archives parsed.
 * The caller supplies the independent completeness attestation; reader schema gaps are not proof.
 * History retains the exact STRICT column/CHECK/UNIQUE constraints of each typed family.
 * Local typed FKs include the revision; cross-document anchor proofs are immutable snapshots.
 */
export function initializeDocumentAuthority(db, { actor, reason, validatedSourceIds } = {}) {
  schemaIdentity(db);
  requireText(actor); requireText(reason);
  const ids = db.prepare('SELECT source_id FROM text_document ORDER BY source_id').all().map((r) => r.source_id);
  if (!Array.isArray(validatedSourceIds) || canonical([...validatedSourceIds].sort((a, b) => a - b)) !== canonical(ids)) {
    fail('E_DOCUMENT_ATTESTATION', 'explicit complete validated typed source IDs required');
  }
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_authority'").get()) fail('E_DOCUMENT_INITIALIZED', 'authority already exists');
    if (db.prepare('PRAGMA foreign_key_check').all().length) fail('E_DOCUMENT_INTEGRITY', 'invalid typed input foreign keys');
    db.exec(readFileSync(new URL('./document-authority.sql', import.meta.url), 'utf8'));
    for (const table of tables) {
      const definition = db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name=?").get(table)?.sql;
      if (!definition) fail('E_DOCUMENT_SCHEMA_GAP', table);
      db.exec(revisionTableDefinition(definition, table, tables));
      sealHistoryTable(db, table);
    }
    db.exec('INSERT INTO document_node_identity SELECT source_id,anchor,json_pointer FROM text_document_node');
    for (const sourceId of ids) {
      const identity = db.prepare('SELECT * FROM text_document WHERE source_id=?').get(sourceId);
      const semanticSha256 = digest(readDocument(db, selector(identity)));
      const revision = hash(canonical(['typed-envelope-v1', sourceId, null, semanticSha256, actor, reason]));
      recordRevision(db, { sourceId, revision, parent: null, semanticSha256, actor, reason, sequence: 0 });
      db.prepare("INSERT INTO document_head VALUES (?,?,'unrecorded')").run(sourceId, revision);
    }
    return ids.map((sourceId) => ({ sourceId, revision: db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(sourceId).revision_id }));
  });
}

function recordRevision(db, { sourceId, revision, parent, semanticSha256, actor, reason, sequence }) {
  db.prepare('INSERT INTO document_revision VALUES (?,?,?,?,?,?,?,?,?)').run(revision, sourceId, parent, actor, reason,
    new Date().toISOString(), semanticSha256, 'typed-envelope-v1', sequence);
  if (db.prepare('SELECT version FROM document_authority').get().version === 2) {
    db.prepare(`INSERT INTO document_revision_link_target
      SELECT DISTINCT ?,a.source_id,a.locale,a.ordinal,n.anchor,a.anchor FROM text_document_link l
      JOIN text_document_anchor a ON a.source_id=l.target_source_id AND a.locale=l.locale AND a.ordinal=l.target_anchor_ordinal
      JOIN text_document_node n ON n.source_id=a.source_id AND n.json_pointer=a.node_pointer
      WHERE l.source_id=?`).run(revision, sourceId);
  }
  for (const table of tables) {
    const names = columns(db, table).join(',');
    db.prepare(`INSERT INTO document_revision_${table}(revision_id,${names}) SELECT ?,${names} FROM ${table} WHERE source_id=?`).run(revision, sourceId);
  }
  db.prepare('INSERT INTO document_revision_seal VALUES (?)').run(revision);
}

/** A typed revision projection, not an archived document/tree/patch parser. */
export function readDocumentRevision(db, { revision, ...selection }) {
  const row = db.prepare('SELECT * FROM document_revision WHERE revision_id=?').get(revision);
  if (!row) fail('E_DOCUMENT_REVISION', 'unknown revision');
  const view = { prepare(sql) {
    let projected = sql;
    for (const table of tables) projected = projected.replace(new RegExp(`\\b${table}\\b`, 'gu'),
      `(SELECT ${columns(db, table).join(',')} FROM document_revision_${table} WHERE revision_id='${row.revision_id}')`);
    return db.prepare(projected);
  } };
  const document = readDocument(view, { ...selection, visibility: 'internal' });
  if (!document || document.readMetadata.source_id !== row.source_id) fail('E_DOCUMENT_REVISION', 'revision does not match selected identity');
  return document;
}

function requireText(value) { if (typeof value !== 'string' || !value.trim()) fail('E_DOCUMENT_COMMAND', 'nonempty text required'); }
function exactKeys(command, keys) {
  if (!command || Object.getPrototypeOf(command) !== Object.prototype || Object.keys(command).some((k) => !keys.includes(k))
    || keys.some((k) => !Object.hasOwn(command, k))) fail('E_DOCUMENT_COMMAND', 'unsupported or missing command fields');
}

/** Existing-file only; never creates an empty authority, imports sources or rebuilds domains. */
export function editDocument({ dbPath, documentId, corpusKind, domain, expectedRevision, actor, reason, changes }) {
  if (!statSync(dbPath).isFile()) fail('E_DOCUMENT_DATABASE', 'existing database file required');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  try { return editDocumentOnConnection(db, { documentId, corpusKind, domain, expectedRevision, actor, reason, changes }); }
  finally { db.close(); }
}

export function editDocumentOnConnection(db, { documentId, corpusKind, domain, expectedRevision, actor, reason, changes }) {
  schemaIdentity(db); requireText(actor); requireText(reason);
  if (!Array.isArray(changes) || !changes.length) fail('E_DOCUMENT_COMMAND', 'nonempty typed commands required');
  try { return withTransaction(db, () => {
    const document = readDocument(db, { documentId, corpusKind, domain, visibility: 'internal' });
    if (!document) fail('E_DOCUMENT_NOT_FOUND', 'document absent');
    const sourceId = document.readMetadata.source_id;
    const head = db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(sourceId);
    if (!head || head.revision_id !== expectedRevision) fail('E_REVISION_CONFLICT', 'document head differs');
    if (digest(document) !== db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(head.revision_id).semantic_sha256) {
      fail('E_DOCUMENT_INTEGRITY', 'current typed rows have drifted from their committed head');
    }
    // Routes retain stable identity and the old admission provenance, not body
    // projections. The new head has no admission, so keeping a route cannot
    // publish an edit. Other projections require their domain editor.
    const dependencies = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
      .map((r) => r.name).filter((table) => !tables.includes(table) && !table.startsWith('document_')
        && !['source_file', 'source_record', 'article_route'].includes(table) && columns(db, table).includes('source_id'));
    for (const table of dependencies) {
      if (db.prepare(`SELECT 1 FROM ${table} WHERE source_id=? LIMIT 1`).get(sourceId)) fail('E_DOCUMENT_DOMAIN_EDITOR_REQUIRED', `dependent ${table} requires its typed editor`);
    }
    const structural = changes.some((c) => ['insertNode', 'deleteNode', 'reorderNodes'].includes(c?.type));
    if (structural && db.prepare('SELECT version FROM document_authority').get().version !== 2) {
      upgradeStructuralAuthority(db, tables, readFileSync(new URL('./document-authority.sql', import.meta.url), 'utf8'));
    }
    for (const command of changes) applyCommand(db, sourceId, command);
    if (structural) resolveStructuralLinks(db, sourceId);
    const candidate = readDocument(db, { documentId, corpusKind, domain, visibility: 'internal' });
    if (digest(candidate) === digest(document)) fail('E_DOCUMENT_NO_CHANGE', 'commands do not change content');
    // Approval is never inherited from an old body, including metadata-only edits.
    db.prepare("UPDATE text_document SET status='draft' WHERE source_id=?").run(sourceId);
    const semanticSha256 = digest(readDocument(db, { documentId, corpusKind, domain, visibility: 'internal' }));
    const sequence = db.prepare('SELECT sequence FROM document_authority WHERE singleton=1').get().sequence + 1;
    const revision = hash(canonical(['typed-envelope-v1', sourceId, head.revision_id, semanticSha256, actor, reason]));
    recordRevision(db, { sourceId, revision, parent: head.revision_id, semanticSha256, actor, reason, sequence });
    const updated = db.prepare("UPDATE document_head SET revision_id=?,public_admission='unrecorded' WHERE source_id=? AND revision_id=?")
      .run(revision, sourceId, expectedRevision);
    if (updated.changes !== 1) fail('E_REVISION_CONFLICT', 'head compare-and-swap failed');
    db.prepare('UPDATE document_authority SET sequence=? WHERE singleton=1').run(sequence);
    if (db.prepare('PRAGMA foreign_key_check').all().length) fail('E_DOCUMENT_INTEGRITY', 'foreign key check failed');
    return { documentId, previousRevision: head.revision_id, revision, semanticSha256 };
  }); } catch (error) {
    if (error.errcode === 5) fail('E_DOCUMENT_BUSY', 'another writer holds the database');
    throw error;
  }
}

function applyCommand(db, sourceId, command) {
  switch (command?.type) {
    case 'setDomainText': {
      exactKeys(command, ['type', 'field', 'value']);
      const { domain } = db.prepare('SELECT domain FROM text_document WHERE source_id=?').get(sourceId);
      const fields = { ailments: 'symptom', culture: 'transmission', economy: 'exchange', goods: 'supply',
        offices: 'tier', overview: 'consequence', 'people-and-machines': 'dependency', places: 'layer',
        regions: 'opening_state', structures: 'function', technology: 'constraint' };
      if (typeof command.field !== 'string' || command.field !== fields[domain] || typeof command.value !== 'string') {
        fail('E_DOCUMENT_COMMAND', 'existing typed domain text field required');
      }
      const table = `text_${domain.replaceAll('-', '_')}_example`;
      const column = command.field === 'constraint' ? 'constraint_text' : command.field;
      const result = db.prepare(`UPDATE ${table} SET ${column}=? WHERE source_id=? AND json_pointer=?`)
        .run(command.value, sourceId, `/data/${command.field}`);
      if (result.changes !== 1) fail('E_DOCUMENT_COMMAND', 'existing typed domain text field required');
      break;
    }
    case 'insertNode': case 'deleteNode': case 'reorderNodes':
      applyStructuralCommand(db, sourceId, command); break;
    case 'setLocale': {
      exactKeys(command, ['type', 'locale', 'field', 'value']);
      if (!['ko', 'en'].includes(command.locale) || !['title', 'summary', 'tense'].includes(command.field)) fail('E_DOCUMENT_COMMAND', 'unsupported locale field');
      if (typeof command.value !== 'string' || !command.value.length || (command.field === 'tense' && !['past', 'present'].includes(command.value))) fail('E_DOCUMENT_COMMAND', 'invalid locale value');
      db.prepare(`UPDATE text_document_locale SET ${command.field}=? WHERE source_id=? AND locale=?`).run(command.value, sourceId, command.locale);
      break;
    }
    case 'setText': {
      exactKeys(command, ['type', 'nodeId', 'slot', 'value']);
      if (typeof command.value !== 'string' || typeof command.slot !== 'string') fail('E_DOCUMENT_COMMAND', 'text and typed slot required');
      const node = db.prepare('SELECT n.* FROM text_document_node n JOIN document_node_identity i ON i.source_id=n.source_id AND i.node_pointer=n.json_pointer WHERE i.source_id=? AND i.node_id=?').get(sourceId, command.nodeId);
      if (!node) fail('E_DOCUMENT_COMMAND', 'unknown stable node ID');
      const slot = db.prepare('SELECT * FROM text_document_slot WHERE source_id=? AND json_pointer=? AND node_pointer=?')
        .get(sourceId, `${node.json_pointer}/${command.slot}`, node.json_pointer);
      if (!slot || slot.representation !== 'string') fail('E_DOCUMENT_COMMAND', 'setText requires an existing scalar slot');
      if (!command.value.length && node.kind !== 'table') fail('E_DOCUMENT_COMMAND', 'nonempty text required outside table cells');
      preserveAnchors(node, slot.text, command.value);
      db.prepare('UPDATE text_document_slot SET text=? WHERE source_id=? AND json_pointer=?').run(command.value, sourceId, slot.json_pointer);
      break;
    }
    case 'setRunText': {
      exactKeys(command, ['type', 'nodeId', 'slot', 'ordinal', 'value']);
      if (typeof command.value !== 'string' || !command.value.length || !Number.isSafeInteger(command.ordinal) || command.ordinal < 0 || typeof command.slot !== 'string') fail('E_DOCUMENT_COMMAND', 'invalid run command');
      const node = db.prepare('SELECT n.* FROM text_document_node n JOIN document_node_identity i ON i.source_id=n.source_id AND i.node_pointer=n.json_pointer WHERE i.source_id=? AND i.node_id=?').get(sourceId, command.nodeId);
      if (!node) fail('E_DOCUMENT_COMMAND', 'unknown stable node ID');
      const pointer = `${node.json_pointer}/${command.slot}`;
      const slot = db.prepare('SELECT * FROM text_document_slot WHERE source_id=? AND json_pointer=? AND node_pointer=?').get(sourceId, pointer, node.json_pointer);
      if (!slot || slot.representation !== 'runs') fail('E_DOCUMENT_COMMAND', 'existing runs slot required');
      const result = db.prepare('UPDATE text_document_run SET text=? WHERE source_id=? AND slot_pointer=? AND ordinal=?').run(command.value, sourceId, pointer, command.ordinal);
      if (result.changes !== 1) fail('E_DOCUMENT_COMMAND', 'unknown stable run ordinal');
      const text = db.prepare('SELECT text FROM text_document_run WHERE source_id=? AND slot_pointer=? ORDER BY ordinal').all(sourceId, pointer).map((r) => r.text).join('');
      preserveAnchors(node, slot.text, text);
      db.prepare('UPDATE text_document_slot SET text=? WHERE source_id=? AND json_pointer=?').run(text, sourceId, pointer);
      break;
    }
    case 'setStatus': fail('E_DOCUMENT_APPROVAL_REQUIRED', 'editor cannot grant or reuse publication approval'); break;
    case 'setData': case 'setDomain': fail('E_DOCUMENT_DOMAIN_EDITOR_REQUIRED', 'domain changes require a typed domain editor'); break;
    default: fail('E_DOCUMENT_COMMAND', 'unsupported typed command');
  }
}

function preserveAnchors(node, before, after) {
  const inline = (text) => [...text.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)].map((m) => m[1]);
  // Reject an anchor-changing edit rather than committing stale inbound links or rewriting proofs.
  if ((node.kind === 'heading' && headingId(before) !== headingId(after))
    || (node.kind === 'paragraph' && canonical(inline(before)) !== canonical(inline(after)))) {
    fail('E_DOCUMENT_ANCHOR_EDITOR_REQUIRED', 'changing derived anchors requires the structural/link editor');
  }
}
