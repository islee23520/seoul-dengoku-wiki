import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { APPLICATION_ID, SCHEMA_VERSION, withTransaction } from './db.mjs';
import { flattenJson } from './sources.mjs';

/**
 * Sealed revision flow for archived DATA sources (not renderer envelopes).
 *
 * The canonical build replays data sources (values-cast, appointments,
 * allocation) from their archived source_file bytes. Those archives stay
 * immutable; this module records owner-directed data corrections as a chain
 * of sealed revisions over an EFFECTIVE document that starts as the archived
 * bytes. Dependent typed rows (person, state labels) are remapped in the same
 * transaction, so a revision never leaves the projection stale.
 *
 * Editing a data revision records provenance only. It is never publication
 * approval and never invents an owner decision: every command list must cite
 * the approval record authorizing it.
 */

const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const requireText = (value, label) => { if (typeof value !== 'string' || !value.length) fail('E_DATA_EDITOR_ARGUMENT', label); return value; };

const VALUES_PATH = 'lore/name-pools/values-cast.json';
const OFFICE_PATH = 'lore/relations/opening-office-appointments.json';
const DATA_SOURCE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS data_source_revision (
  revision_id TEXT NOT NULL PRIMARY KEY,
  source_path TEXT NOT NULL,
  parent_revision TEXT,
  semantic_sha256 TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  approval_ref TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS data_source_head (
  source_path TEXT NOT NULL PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES data_source_revision(revision_id),
  archived_sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS data_source_current (
  source_path TEXT NOT NULL PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES data_source_revision(revision_id),
  document_json TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS data_source_revision_path ON data_source_revision(source_path, sequence);
`;

function schemaIdentity(db) {
  if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID
    || db.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION) fail('E_DOCUMENT_DATABASE', 'incompatible database');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_DOCUMENT_DATABASE', 'foreign keys must be enabled');
}

function bootstrapDataAuthority(db, sourcePath) {
  const archived = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').get(sourcePath);
  if (!archived) fail('E_DATA_EDITOR_SOURCE', sourcePath);
  const existing = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(sourcePath);
  if (existing) return existing.revision_id;
  const document = loadArchivedDocument(db, sourcePath);
  const semanticSha256 = hash(canonical(document));
  return withTransaction(db, () => {
    const head = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(sourcePath);
    if (head) return head.revision_id;
    const sequence = 0;
    const revision = hash(canonical(['data-source-v1', sourcePath, null, semanticSha256, 'import', 'archived import baseline']));
    db.prepare('INSERT INTO data_source_revision (revision_id, source_path, parent_revision, semantic_sha256, actor, reason, sequence, approval_ref) VALUES (?,?,?,?,?,?,?,?)')
      .run(revision, sourcePath, null, semanticSha256, 'import', 'archived import baseline', sequence, 'archived');
    db.prepare('INSERT INTO data_source_head (source_path, revision_id, archived_sha256) VALUES (?,?,?)').run(sourcePath, revision, archived.sha256);
    db.prepare('INSERT INTO data_source_current (source_path, revision_id, document_json) VALUES (?,?,?)').run(sourcePath, revision, JSON.stringify(document));
    return revision;
  });
}

// The archived bytes live in source_file; the byte column name is read from the
// schema so the module does not hard-code one variant.
function loadArchivedDocument(db, sourcePath) {
  const columns = db.prepare('PRAGMA table_info(source_file)').all().map((r) => r.name);
  const bytesColumn = columns.find((c) => /raw|bytes|content/i.test(c));
  if (!bytesColumn) fail('E_DATA_EDITOR_SOURCE', 'source_file has no byte column');
  const row = db.prepare(`SELECT ${bytesColumn} AS bytes FROM source_file WHERE logical_path=?`).get(sourcePath);
  if (!row?.bytes) fail('E_DATA_EDITOR_SOURCE', sourcePath);
  return JSON.parse(Buffer.from(row.bytes).toString('utf8'));
}

function revisionChain(db, sourcePath, mutator, actor, reason, approvalRef) {
  return withTransaction(db, () => {
    const head = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(sourcePath);
    const current = db.prepare('SELECT document_json FROM data_source_current WHERE source_path=?').get(sourcePath);
    const document = JSON.parse(current.document_json);
    const outcome = mutator(document);
    const semanticSha256 = hash(canonical(document));
    const sequenceRow = db.prepare('SELECT COALESCE(MAX(sequence), 0) AS sequence FROM data_source_revision').get();
    const revision = hash(canonical(['data-source-v1', sourcePath, head.revision_id, semanticSha256, actor, reason]));
    db.prepare('INSERT INTO data_source_revision (revision_id, source_path, parent_revision, semantic_sha256, actor, reason, sequence, approval_ref) VALUES (?,?,?,?,?,?,?,?)')
      .run(revision, sourcePath, head.revision_id, semanticSha256, actor, reason, sequenceRow.sequence + 1, approvalRef);
    const updated = db.prepare('UPDATE data_source_head SET revision_id=? WHERE source_path=? AND revision_id=?')
      .run(revision, sourcePath, head.revision_id);
    if (updated.changes !== 1) fail('E_REVISION_CONFLICT', 'data source head compare-and-swap failed');
    db.prepare('UPDATE data_source_current SET revision_id=?, document_json=? WHERE source_path=?')
      .run(revision, JSON.stringify(document), sourcePath);
    if (db.prepare('PRAGMA foreign_key_check').all().length) fail('E_DOCUMENT_INTEGRITY', 'foreign key check failed');
    return { sourcePath, previousRevision: head.revision_id, revision, semanticSha256, outcome };
  });
}

/**
 * Owner-directed office appointment corrections over the effective
 * appointments document. Each change replaces one person's appointment entry
 * (or appends a new one) and remaps that person's context_office_* rows in the
 * same transaction. Evidence references must resolve to archived sources.
 */
export function editOfficeAppointments({ dbPath, changes, actor, reason, approvalRef }) {
  requireText(dbPath, 'dbPath'); requireText(actor, 'actor'); requireText(reason, 'reason'); requireText(approvalRef, 'approvalRef');
  if (!Array.isArray(changes) || !changes.length) fail('E_DATA_EDITOR_COMMAND', 'nonempty appointment changes required');
  if (!statSync(dbPath).isFile()) fail('E_DOCUMENT_DATABASE', 'existing database file required');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  try {
    schemaIdentity(db);
    db.exec(DATA_SOURCE_TABLES_SQL);
    bootstrapDataAuthority(db, OFFICE_PATH);
    return revisionChain(db, OFFICE_PATH, (document) => {
      const sourceRow = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(OFFICE_PATH);
      const sourceId = sourceRow.source_id;
      const applied = [];
      for (const change of changes) {
        if (!change?.personId || !change?.entry) fail('E_DATA_EDITOR_COMMAND', 'personId and entry required');
        const index = document.appointments.findIndex((row) => row.personId === change.personId);
        if (index >= 0) document.appointments[index] = change.entry;
        else document.appointments.push(change.entry);
        const ordinal = document.appointments.findIndex((row) => row.personId === change.personId);
        const entry = document.appointments[ordinal];
        // A pointer that the archived import never contained (a newly appended
        // entry) needs typed source_record rows so the context rows can cite it.
        const pointerExists = db.prepare('SELECT 1 FROM source_record WHERE source_id=? AND json_pointer=?').get(sourceId, `/appointments/${ordinal}/current`);
        if (!pointerExists) {
          const subtree = { appointments: {} };
          subtree.appointments[ordinal] = entry;
          for (const row of flattenJson(subtree)) {
            const existing = db.prepare('SELECT 1 FROM source_record WHERE source_id=? AND json_pointer=?').get(sourceId, row.json_pointer);
            if (existing || row.json_pointer === '' || row.json_pointer === '/appointments') continue;
            db.prepare('INSERT INTO source_record (source_id, json_pointer, parent_pointer, ordinal, field_name, json_type, text_value, integer_value, real_value, boolean_value) VALUES (?,?,?,?,?,?,?,?,?,?)')
              .run(sourceId, row.json_pointer, row.parent_pointer, row.ordinal, row.field_name, row.json_type, row.text_value, row.integer_value, row.real_value, row.boolean_value);
          }
        }
        const position = entry.current.position === null ? null : entry.current.position;
        const rank = entry.current.rank === null ? null : entry.current.rank;
        db.prepare('DELETE FROM context_office_evidence WHERE person_id=?').run(change.personId);
        db.prepare('DELETE FROM context_office_history WHERE person_id=?').run(change.personId);
        db.prepare('DELETE FROM context_office_appointment WHERE person_id=?').run(change.personId);
        db.prepare('INSERT INTO context_office_appointment (person_id, polity_id, position_ko, position_en, rank_ko, rank_en, common_tier, status, source_schema, opening_year, catalog_status, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .run(change.personId, entry.stateId, position?.ko ?? null, position?.en ?? null, rank?.ko ?? null, rank?.en ?? null,
            entry.current.commonTier, entry.current.status, document.schema, document.openingYear, 'current-catalog-input', sourceId, `/appointments/${ordinal}/current`);
        db.prepare('INSERT INTO context_office_history (person_id, polity_id, position_ko, position_en, rank_ko, rank_en, common_tier, approval_ref, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .run(change.personId, entry.history.stateId, entry.history.position?.ko ?? null, entry.history.position?.en ?? null,
            entry.history.rank?.ko ?? null, entry.history.rank?.en ?? null, entry.history.commonTier, entry.history.approvalRef ?? null,
            sourceId, `/appointments/${ordinal}/history`);
        for (const [index2, ref] of (entry.current.evidence ?? []).entries()) {
          const target = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(ref.path);
          if (!target) fail('E_DATA_EDITOR_EVIDENCE', ref.path);
          db.prepare('INSERT INTO context_office_evidence (person_id, ordinal, reference_path, reference_pointer, evidence_kind, reference_source_id, reference_json_pointer, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?)')
            .run(change.personId, index2, ref.path, ref.jsonPointer, ref.kind, target.source_id, ref.jsonPointer, sourceId, `/appointments/${ordinal}/current/evidence/${index2}`);
        }
        applied.push({ person_id: change.personId, state_id: entry.stateId, common_tier: entry.current.commonTier });
      }
      return applied;
    }, actor, reason, approvalRef);
  } finally { db.close(); }
}
export function editPersonStates({ dbPath, changes, actor, reason, approvalRef }) {
  requireText(dbPath, 'dbPath'); requireText(actor, 'actor'); requireText(reason, 'reason'); requireText(approvalRef, 'approvalRef');
  if (!Array.isArray(changes) || !changes.length) fail('E_DATA_EDITOR_COMMAND', 'nonempty person state changes required');
  for (const change of changes) {
    if (!change || typeof change !== 'object') fail('E_DATA_EDITOR_COMMAND', 'change object required');
    requireText(change.name, 'name'); requireText(change.state, 'state'); requireText(change.stateName ?? change.state_name, 'stateName');
    if (change.title !== undefined && typeof change.title !== 'string') fail('E_DATA_EDITOR_COMMAND', 'title must be a string');
  }
  if (!statSync(dbPath).isFile()) fail('E_DOCUMENT_DATABASE', 'existing database file required');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  try {
    schemaIdentity(db);
    db.exec(DATA_SOURCE_TABLES_SQL);
    bootstrapDataAuthority(db, VALUES_PATH);
    return withTransaction(db, () => {
      const head = db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(VALUES_PATH);
      const current = db.prepare('SELECT document_json FROM data_source_current WHERE source_path=?').get(VALUES_PATH);
      const document = JSON.parse(current.document_json);
      const byName = new Map(db.prepare('SELECT person_id, name FROM person').all().map((row) => [row.name, row.person_id]));
      const applied = [];
      for (const change of changes) {
        const personId = byName.get(change.name);
        if (!personId) fail('E_DATA_EDITOR_PERSON', change.name);
        const entry = document.people.find((row) => row.name === change.name);
        if (!entry) fail('E_DATA_EDITOR_PERSON', change.name);
        entry.state = change.state;
        entry.state_name = change.stateName ?? change.state_name;
        if (change.title !== undefined) entry.title = change.title;
        const result = db.prepare('UPDATE person SET state_id=?, state_name=?, title=COALESCE(?, title) WHERE person_id=?')
          .run(change.state, change.stateName ?? change.state_name, change.title ?? null, personId);
        if (result.changes !== 1) fail('E_DATA_EDITOR_PERSON', change.name);
        applied.push({ person_id: personId, state_id: change.state, title: change.title ?? null });
      }
      const semanticSha256 = hash(canonical(document));
      const sequenceRow = db.prepare('SELECT COALESCE(MAX(sequence), 0) AS sequence FROM data_source_revision').get();
      const revision = hash(canonical(['data-source-v1', VALUES_PATH, head.revision_id, semanticSha256, actor, reason]));
      db.prepare('INSERT INTO data_source_revision (revision_id, source_path, parent_revision, semantic_sha256, actor, reason, sequence, approval_ref) VALUES (?,?,?,?,?,?,?,?)')
        .run(revision, VALUES_PATH, head.revision_id, semanticSha256, actor, reason, sequenceRow.sequence + 1, approvalRef);
      const updated = db.prepare('UPDATE data_source_head SET revision_id=? WHERE source_path=? AND revision_id=?')
        .run(revision, VALUES_PATH, head.revision_id);
      if (updated.changes !== 1) fail('E_REVISION_CONFLICT', 'data source head compare-and-swap failed');
      db.prepare('UPDATE data_source_current SET revision_id=?, document_json=? WHERE source_path=?')
        .run(revision, JSON.stringify(document), VALUES_PATH);
      if (db.prepare('PRAGMA foreign_key_check').all().length) fail('E_DOCUMENT_INTEGRITY', 'foreign key check failed');
      return { sourcePath: VALUES_PATH, previousRevision: head.revision_id, revision, semanticSha256, applied };
    });
  } finally { db.close(); }
}

if (process.argv[1] && process.argv[1].endsWith('data-source-editor.mjs')) {
  try {
    const args = process.argv.slice(2);
    const command = args[0] === 'persons' ? 'persons' : args[0] === 'offices' ? 'offices' : fail('E_ARGUMENTS', 'persons or offices command required');
    const flags = { '--db': 'dbPath', '--actor': 'actor', '--reason': 'reason', '--approval': 'approvalRef' };
    const options = {};
    for (let index = 1; index + 1 < args.length; index += 2) {
      if (!flags[args[index]]) fail('E_ARGUMENTS', args[index]);
      options[flags[args[index]]] = args[index + 1];
    }
    let body = '';
    for await (const chunk of process.stdin) body += chunk;
    const changes = JSON.parse(body);
    const fn = command === 'persons' ? editPersonStates : editOfficeAppointments;
    process.stdout.write(JSON.stringify(fn({ ...options, changes })) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: { code: error.code ?? 'E_DATA_EDITOR', message: error.message } }) + '\n');
    process.exitCode = 1;
  }
}
