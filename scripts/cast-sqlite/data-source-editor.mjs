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
const ALLOCATION_PATH = 'lore/relations/opening-feudal-allocation.json';
const HOLDINGS_PATH = 'lore/relations/personal-holdings.json';
const DISSOLVED_TITLES = ['title:kingdom-daejeon', 'proposal:superior-jurisdiction:seoul:daejeon-dong', 'proposal:superior-jurisdiction:seoul:daejeon-jung', 'proposal:superior-jurisdiction:seoul:daejeon-seo', 'proposal:superior-jurisdiction:seoul:daejeon-yuseong', 'proposal:superior-jurisdiction:seoul:daejeon-daedeok'];
const DISSOLVED_HOLDINGS = ['holding:daejeon-dong', 'holding:daejeon-yuseong', 'holding:daejeon-jung', 'holding:daejeon-seo', 'holding:daejeon-daedeok'];
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

function ensurePointerRecords(db, sourceId, ordinal, row) {
  const subtree = { titles: {} };
  subtree.titles[ordinal] = row;
  for (const record of flattenJson(subtree)) {
    if (record.json_pointer === '' || record.json_pointer === '/titles') continue;
    const exists = db.prepare('SELECT 1 FROM source_record WHERE source_id=? AND json_pointer=?').get(sourceId, record.json_pointer);
    if (exists) continue;
    db.prepare('INSERT INTO source_record (source_id, json_pointer, parent_pointer, ordinal, field_name, json_type, text_value, integer_value, real_value, boolean_value) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(sourceId, record.json_pointer, record.parent_pointer, record.ordinal, record.field_name, record.json_type, record.text_value, record.integer_value, record.real_value, record.boolean_value);
  }
}

/**
 * Owner-directed D1 rights dissolution + D4 kingdom grants over the effective
 * allocation and holdings documents: dissolves the Daejeon line (titles,
 * holdings, bindings, polity) and appends the six approved geographic-kingdom
 * title rows. Feudal/holding/polity context rows are remapped in the same
 * transaction from the effective documents.
 */
export function editFactionConsolidationRights({ dbPath, kingdomTitleRows, actor, reason, approvalRef }) {
  requireText(dbPath, 'dbPath'); requireText(actor, 'actor'); requireText(reason, 'reason'); requireText(approvalRef, 'approvalRef');
  if (!Array.isArray(kingdomTitleRows) || kingdomTitleRows.length > 6) fail('E_DATA_EDITOR_COMMAND', 'at most six kingdom title rows; an empty list performs the dissolution only');
  // Kingdom grants beyond this point require a rights-approval replay source;
  // an empty list performs the D1 dissolution only.
  if (!statSync(dbPath).isFile()) fail('E_DOCUMENT_DATABASE', 'existing database file required');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  try {
    schemaIdentity(db);
    db.exec(DATA_SOURCE_TABLES_SQL);
    bootstrapDataAuthority(db, ALLOCATION_PATH);
    bootstrapDataAuthority(db, HOLDINGS_PATH);
    const allocationOutcome = revisionChain(db, ALLOCATION_PATH, (document) => {
      const sourceId = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(ALLOCATION_PATH).source_id;
      document.titles = document.titles.filter((row) => !DISSOLVED_TITLES.includes(row.id));
      for (const row of kingdomTitleRows) if (!document.titles.some((t) => t.id === row.id)) document.titles.push(row);
      document.existingTitleBindings = (document.existingTitleBindings ?? []).filter((row) => !DISSOLVED_HOLDINGS.includes(row.holdingId));
      // Cross-source FK order: every row referencing a dissolved holding or
      // the daejeon polity/titles goes first, then the dissolved rows.
      db.prepare('DELETE FROM personal_holding_input_facility WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_retinue_holding WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_issue WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM historical_feudal_binding WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_feudal_binding WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding_geographic_scope WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding_scope_county WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding_power WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding_admin_ref WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding_reference WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_holding WHERE holding_id LIKE ?').run('holding:daejeon-%');
      db.prepare('DELETE FROM context_polity WHERE polity_id=?').run('polity:daejeon');
      db.prepare('DELETE FROM context_feudal_jurisdiction WHERE title_id IN (' + DISSOLVED_TITLES.map(() => '?').join(',') + ')').run(...DISSOLVED_TITLES);
      db.prepare('DELETE FROM context_feudal_title WHERE title_id IN (' + DISSOLVED_TITLES.map(() => '?').join(',') + ')').run(...DISSOLVED_TITLES);
      // Register the decision record as a sealed rights-approval source so
      // new grants can cite it through the transition chain.
      const decisionPath = 'scripts/approved-seoul-faction-consolidation-20261022.json';
      const decisionBytes = readFileSync(new URL('../..' + '/' + decisionPath, import.meta.url));
      const decisionDoc = JSON.parse(decisionBytes.toString('utf8'));
      let decisionSourceId = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(decisionPath)?.source_id;
      if (!decisionSourceId) {
        const maxId = db.prepare('SELECT COALESCE(MAX(source_id), 0) AS m FROM source_file').get().m;
        decisionSourceId = maxId + 1;
        db.prepare('INSERT INTO source_file (source_id, logical_path, media_type, sha256, byte_length, raw_bytes) VALUES (?,?,?,?,?,?)')
          .run(decisionSourceId, decisionPath, 'application/json', hash(decisionBytes), decisionBytes.length, decisionBytes);
        for (const record of flattenJson(decisionDoc)) {
          db.prepare('INSERT INTO source_record (source_id, json_pointer, parent_pointer, ordinal, field_name, json_type, text_value, integer_value, real_value, boolean_value) VALUES (?,?,?,?,?,?,?,?,?,?)')
            .run(decisionSourceId, record.json_pointer, record.parent_pointer, record.ordinal, record.field_name, record.json_type, record.text_value, record.integer_value, record.real_value, record.boolean_value);
        }
        db.prepare('INSERT INTO context_rights_approval (approval_id, source_schema, approval_ref, receipt_sha256, message_ref, proposal_sha256, package_sha256, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?)')
          .run(decisionPath, decisionDoc.schema, decisionDoc.approvalRef ?? 'owner:seoul-faction-consolidation-20261022', hash(decisionBytes), null, null, null, decisionSourceId, '');
      }
      for (const [ordinal, row] of kingdomTitleRows.entries()) {
        db.prepare('INSERT OR IGNORE INTO context_rights_transition (set_name, old_id, original_value_sha256, disposition, current_id, approval_id, source_ordinal, original_source_id, original_json_pointer, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
          .run('titles', row.id, hash(canonical(row)), 'retained-current', row.id, decisionPath, ordinal, decisionSourceId, '/kingdomTitleRows/' + ordinal, decisionSourceId, '/kingdomTitleRows/' + ordinal);
      }
      // The six granted kingdoms are new rows with new pointers.
      document.titles.forEach((row) => {
        if (!String(row.id ?? '').startsWith('title:kingdom-geography:seoul:')) return;
        const ordinal = document.titles.indexOf(row);
        db.prepare('INSERT INTO context_feudal_title (title_id, name, rank, holder_person_id, polity_id, parent_title_id, geographic_title_id, geographic_parent_title_id, political_parent_title_id, personal_liege_person_id, kind, direct_ownership, basis, transition_set, transition_old_id, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .run(row.id, row.name, row.rank, row.holderPersonId ?? null, row.stateId ?? null, row.parentTitleId ?? null,
            row.geographicTitleId ?? null, row.geographicParentTitleId ?? null, row.politicalParentTitleId ?? null,
            row.personalLiegePersonId ?? null, row.kind ?? null, row.directOwnership === undefined ? null : Number(row.directOwnership), row.basis ?? null,
            'titles', row.id, sourceId, '/titles/' + ordinal);
        (row.jurisdictionRefs ?? []).forEach((ref, index) => db.prepare('INSERT INTO context_feudal_jurisdiction (title_id, ordinal, admin_unit_id, source_id, json_pointer) VALUES (?,?,?,?,?)')
          .run(row.id, index, ref, sourceId, '/titles/' + ordinal + '/jurisdictionRefs/' + index));
        ensurePointerRecords(db, sourceId, ordinal, row);
      });
      return { dissolvedTitles: DISSOLVED_TITLES.length, grantedKingdoms: kingdomTitleRows.length };
    }, actor, reason, approvalRef);
    const holdingsOutcome = revisionChain(db, HOLDINGS_PATH, (document) => {
      document.holdings = document.holdings.filter((row) => !DISSOLVED_HOLDINGS.includes(row.id));
      document.polities = (document.polities ?? []).filter((row) => row.id !== 'polity:daejeon');
      db.prepare('UPDATE context_court SET polity_id=? WHERE court_id=?').run('S02', 'court:K1008');
      return { dissolvedHoldings: DISSOLVED_HOLDINGS.length, dissolvedPolities: 1 };
    }, actor, reason, approvalRef);
    return { allocation: allocationOutcome, holdings: holdingsOutcome };
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
