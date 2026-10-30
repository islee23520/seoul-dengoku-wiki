import { createHash } from 'node:crypto';
import { createReader } from './db-pg.mjs';
import { readDocumentAsync, readDocumentSnapshotAsync } from './document-read.mjs';
import { TEXT_DATA_TABLE_COLUMNS } from './text-data.mjs';
import { headingId } from '../lore-json-render.mjs';
import { applyStructuralCommandAsync, resolveStructuralLinksAsync, assertStructuralAuthorityAsync } from './document-structure-pg.mjs';

const tables = ['text_document', 'text_document_locale', 'text_document_category', 'text_document_source_ref',
  'text_document_history', 'text_document_node', 'text_document_list_item', 'text_document_table_row',
  'text_document_table_cell', 'text_document_slot', 'text_document_run', 'text_document_anchor', 'text_document_link',
  ...Object.keys(TEXT_DATA_TABLE_COLUMNS)];
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = document => hash(canonical(document));
const quoted = name => `"${name.replaceAll('"', '""')}"`;
const requireText = value => { if (typeof value !== 'string' || !value.trim()) fail('E_DOCUMENT_COMMAND', 'nonempty text required'); };
function exactKeys(command, keys) {
  if (!command || Object.getPrototypeOf(command) !== Object.prototype || Object.keys(command).some(k => !keys.includes(k))
    || keys.some(k => !Object.hasOwn(command, k))) fail('E_DOCUMENT_COMMAND', 'unsupported or missing command fields');
}

export async function readDocumentRevisionAsync(tx, { revision, ...selection }) {
  const row = await tx.get(`SELECT r.* FROM wiki.document_revision r JOIN wiki.document_revision_seal z USING(revision_id)
    WHERE r.revision_id=$1`, [revision]);
  if (!row) fail('E_DOCUMENT_REVISION', 'unknown or unsealed revision');
  const document = await readDocumentSnapshotAsync(tx, selection, revision);
  if (document.readMetadata.source_id !== row.source_id || digest(document) !== row.semantic_sha256) {
    fail('E_DOCUMENT_INTEGRITY', 'sealed revision differs from committed semantic hash');
  }
  return document;
}

export async function editDocumentPg({ connectionString = process.env.WIKI_AUTHORING_PG ?? process.env.WIKI_DOCUMENT_PG,
  role = 'wiki_author', ...options }) {
  const reader = createReader({ connectionString, role });
  try { return await editDocumentPgOnConnection(reader, options); }
  finally { await reader.close(); }
}

export async function editDocumentPgOnConnection(reader, options) {
  try { return await reader.transaction(tx => editDocumentPgInTransaction(tx, options)); }
  catch (error) { rethrowConflict(error); }
}

export async function editDocumentsPgOnConnection(reader, edits) {
  if (!Array.isArray(edits) || !edits.length) fail('E_DOCUMENT_COMMAND', 'nonempty edits required');
  try {
    return await reader.transaction(async tx => {
      const results = [];
      for (const options of edits) results.push(await editDocumentPgInTransaction(tx, options));
      return results;
    });
  } catch (error) { rethrowConflict(error); }
}

function rethrowConflict(error) {
  if (error.code === '40001' || error.code === '40P01') fail('E_REVISION_CONFLICT', 'concurrent authoring transaction; refresh the head before editing');
  throw error;
}

/** The caller owns one PG transaction; all dependent projections share its rollback. */
export async function editDocumentPgInTransaction(tx, { documentId, corpusKind, domain, expectedRevision,
  expectedCurrentSemanticSha256, expectedSemanticSha256, actor, reason, changes, dependentEditors }) {
  if (!tx.isTransaction) fail('E_DOCUMENT_DATABASE', 'leased PostgreSQL transaction required');
  requireText(actor); requireText(reason); requireText(expectedRevision);
  for (const value of [expectedCurrentSemanticSha256, expectedSemanticSha256]) {
    if (value !== undefined && (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))) fail('E_DOCUMENT_COMMAND', 'SHA-256 must be lowercase hexadecimal');
  }
  if (!Array.isArray(changes) || !changes.length) fail('E_DOCUMENT_COMMAND', 'nonempty typed commands required');
  try {
    // Serializes the global revision sequence, including multi-document edits.
    const authority = await tx.get('SELECT version,sequence FROM wiki.document_authority WHERE singleton=1 FOR UPDATE');
    if (!authority || authority.version !== 2) fail('E_DOCUMENT_DATABASE', 'structural authority version 2 required');
    const selection = { documentId, corpusKind, domain, visibility: 'internal' };
    const document = await readDocumentAsync(tx, selection);
    if (!document) fail('E_DOCUMENT_NOT_FOUND', 'document absent');
    const sourceId = document.readMetadata.source_id;
    const head = await tx.get(`SELECT h.revision_id,r.semantic_sha256 FROM wiki.document_head h
      JOIN wiki.document_revision r USING(source_id,revision_id)
      JOIN wiki.document_revision_seal z USING(revision_id) WHERE h.source_id=$1 FOR UPDATE OF h`, [sourceId]);
    if (!head || head.revision_id !== expectedRevision) fail('E_REVISION_CONFLICT', 'document head differs');
    const beforeHash = digest(document);
    if (beforeHash !== head.semantic_sha256) fail('E_DOCUMENT_INTEGRITY', 'current typed rows have drifted from their committed head');
    if (expectedCurrentSemanticSha256 !== undefined && beforeHash !== expectedCurrentSemanticSha256) fail('E_REVISION_CONFLICT', 'document semantic hash differs');
    // pg_catalog inventory is not privilege-filtered: an ungranted dependent
    // projection must fail closed, not disappear from editor completeness checks.
    const dependencies = await tx.all(`SELECT DISTINCT c.relname AS table_name FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
      WHERE n.nspname='wiki' AND c.relkind IN ('r','p') AND a.attname='source_id' AND a.attnum>0 AND NOT a.attisdropped`);
    for (const { table_name: table } of dependencies) {
      if (tables.includes(table) || table.startsWith('document_') || ['source_file', 'source_record', 'article_route'].includes(table)) continue;
      if (!dependentEditors?.handledTables?.includes(table) && await tx.get(`SELECT 1 FROM wiki.${quoted(table)} WHERE source_id=$1 LIMIT 1`, [sourceId])) {
        fail('E_DOCUMENT_DOMAIN_EDITOR_REQUIRED', `dependent ${table} requires its typed editor`);
      }
    }
    const structural = changes.some(c => ['insertNode', 'deleteNode', 'reorderNodes', 'appendTableRow'].includes(c?.type));
    if (structural) await assertStructuralAuthorityAsync(tx);
    for (const command of changes) await applyCommand(tx, sourceId, command);
    if (structural) await resolveStructuralLinksAsync(tx, sourceId);
    if (dependentEditors?.sync) await dependentEditors.sync(tx, sourceId);
    const candidate = await readDocumentAsync(tx, selection);
    if (digest(candidate) === beforeHash) fail('E_DOCUMENT_NO_CHANGE', 'commands do not change content');
    await tx.query("UPDATE wiki.text_document SET status='draft' WHERE source_id=$1", [sourceId]);
    const semanticSha256 = digest(await readDocumentAsync(tx, selection));
    if (expectedSemanticSha256 !== undefined && semanticSha256 !== expectedSemanticSha256) fail('E_DOCUMENT_EXPECTED_BODY', 'typed result differs from exact approved semantic hash');
    const sequence = authority.sequence + 1;
    const revision = hash(canonical(['typed-envelope-v1', sourceId, head.revision_id, semanticSha256, actor, reason]));
    await recordRevision(tx, { sourceId, revision, parent: head.revision_id, semanticSha256, actor, reason, sequence });
    const updated = await tx.query(`UPDATE wiki.document_head SET revision_id=$1,public_admission='unrecorded'
      WHERE source_id=$2 AND revision_id=$3`, [revision, sourceId, expectedRevision]);
    if (updated.rowCount !== 1) fail('E_REVISION_CONFLICT', 'head compare-and-swap failed');
    await tx.query('UPDATE wiki.document_authority SET sequence=$1 WHERE singleton=1', [sequence]);
    return { documentId, previousRevision: head.revision_id, revision, semanticSha256 };
  } catch (error) {
    if (error.code === '40001' || error.code === '40P01') fail('E_REVISION_CONFLICT', 'concurrent authoring transaction; refresh the head before editing');
    throw error;
  }
}

async function recordRevision(tx, { sourceId, revision, parent, semanticSha256, actor, reason, sequence }) {
  await tx.query(`INSERT INTO wiki.document_revision
    (revision_id,source_id,parent_revision,actor,reason,recorded_at,semantic_sha256,algorithm,sequence)
    VALUES($1,$2,$3,$4,$5,$6,$7,'typed-envelope-v1',$8)`,
    [revision, sourceId, parent, actor, reason, new Date().toISOString(), semanticSha256, sequence]);
  await tx.query(`INSERT INTO wiki.document_revision_link_target
    (revision_id,source_id,locale,ordinal,node_id,anchor)
    SELECT DISTINCT $1,a.source_id,a.locale,a.ordinal,n.anchor,a.anchor FROM wiki.text_document_link l
    JOIN wiki.text_document_anchor a ON a.source_id=l.target_source_id AND a.locale=l.locale AND a.ordinal=l.target_anchor_ordinal
    JOIN wiki.text_document_node n ON n.source_id=a.source_id AND n.json_pointer=a.node_pointer WHERE l.source_id=$2`, [revision, sourceId]);
  for (const table of tables) {
    const columns = await tx.all(`SELECT column_name FROM information_schema.columns
      WHERE table_schema='wiki' AND table_name=$1 ORDER BY ordinal_position`, [table]);
    if (!columns.length) fail('E_DOCUMENT_SCHEMA_GAP', table);
    const names = columns.map(row => quoted(row.column_name)).join(',');
    await tx.query(`INSERT INTO wiki.document_revision_${table}(revision_id,${names})
      SELECT $1,${names} FROM wiki.${table} WHERE source_id=$2`, [revision, sourceId]);
  }
  await tx.query('INSERT INTO wiki.document_revision_seal(revision_id) VALUES($1)', [revision]);
}

function preserveAnchors(node, before, after) {
  const inline = text => [...text.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)].map(match => match[1]);
  if ((node.kind === 'heading' && headingId(before) !== headingId(after))
    || (node.kind === 'paragraph' && canonical(inline(before)) !== canonical(inline(after)))) {
    fail('E_DOCUMENT_ANCHOR_EDITOR_REQUIRED', 'changing derived anchors requires the structural/link editor');
  }
}

async function applyCommand(tx, sourceId, command) {
  switch (command?.type) {
    case 'setAtlasAdditionalPersonState': {
      exactKeys(command, ['type', 'personId', 'expectedStateId', 'stateId']);
      requireText(command.personId); requireText(command.stateId);
      if (command.expectedStateId !== null) requireText(command.expectedStateId);
      const identity = await tx.get('SELECT document_id,domain,corpus_kind FROM wiki.text_document WHERE source_id=$1', [sourceId]);
      if (identity.document_id !== 'WNA-001' || identity.domain !== 'root' || identity.corpus_kind !== 'current') fail('E_DOCUMENT_COMMAND', 'current root Atlas required');
      const rows = await tx.all('SELECT * FROM wiki.text_atlas_additional_people WHERE source_id=$1 AND member_key=$2', [sourceId, command.personId]);
      const row = rows[0];
      if (rows.length !== 1 || row.person_ref !== command.personId || row.national_state_id !== command.expectedStateId
        || row.national_state_id__type !== (command.expectedStateId === null ? 'null' : 'string') || row.state_ref !== command.expectedStateId) {
        fail('E_DOCUMENT_COMMAND', 'existing Atlas person and consistent expected affiliation required');
      }
      if (!await tx.get('SELECT 1 FROM wiki.state WHERE state_id=$1', [command.stateId])
        || !await tx.get('SELECT 1 FROM wiki.person WHERE person_id=$1 AND state_id=$2', [command.personId, command.stateId])) {
        fail('E_DOCUMENT_COMMAND', 'registered state matching current person affiliation required');
      }
      await tx.query(`UPDATE wiki.text_atlas_additional_people SET national_state_id=$1,national_state_id__type='string',state_ref=$1
        WHERE source_id=$2 AND row_key=$3`, [command.stateId, sourceId, row.row_key]);
      break;
    }
    case 'setDomainText': {
      exactKeys(command, ['type', 'field', 'value']);
      const { domain } = await tx.get('SELECT domain FROM wiki.text_document WHERE source_id=$1', [sourceId]);
      const fields = {
        ailments: 'symptom', culture: 'transmission', economy: 'exchange', goods: 'supply', offices: 'tier',
        overview: 'consequence', 'people-and-machines': 'dependency', places: 'layer', regions: 'opening_state', structures: 'function', technology: 'constraint'
      };
      if (command.field !== fields[domain] || typeof command.field !== 'string' || typeof command.value !== 'string') fail('E_DOCUMENT_COMMAND', 'existing typed domain text field required');
      const table = `text_${domain.replaceAll('-', '_')}_example`;
      const column = command.field === 'constraint' ? 'constraint_text' : command.field;
      const result = await tx.query(`UPDATE wiki.${table} SET ${column}=$1 WHERE source_id=$2 AND json_pointer=$3`, [command.value, sourceId, `/data/${command.field}`]);
      if (result.rowCount !== 1) fail('E_DOCUMENT_COMMAND', 'existing typed domain text field required');
      break;
    }
    case 'insertNode': case 'deleteNode': case 'reorderNodes': case 'appendTableRow':
      await applyStructuralCommandAsync(tx, sourceId, command); break;
    case 'setLocale': {
      exactKeys(command, ['type', 'locale', 'field', 'value']);
      if (!['ko', 'en'].includes(command.locale) || !['title', 'summary', 'tense'].includes(command.field)) fail('E_DOCUMENT_COMMAND', 'unsupported locale field');
      if (typeof command.value !== 'string' || !command.value.length || (command.field === 'tense' && !['past', 'present'].includes(command.value))) fail('E_DOCUMENT_COMMAND', 'invalid locale value');
      const result = await tx.query(`UPDATE wiki.text_document_locale SET ${command.field}=$1 WHERE source_id=$2 AND locale=$3`, [command.value, sourceId, command.locale]);
      if (result.rowCount !== 1) fail('E_DOCUMENT_COMMAND', 'existing locale required');
      break;
    }
    case 'setText': case 'setRunText': {
      const isRun = command.type === 'setRunText';
      exactKeys(command, isRun ? ['type', 'nodeId', 'slot', 'ordinal', 'value'] : ['type', 'nodeId', 'slot', 'value']);
      if (typeof command.value !== 'string' || typeof command.slot !== 'string'
        || (isRun && (!command.value.length || !Number.isSafeInteger(command.ordinal) || command.ordinal < 0))) fail('E_DOCUMENT_COMMAND', 'invalid text command');
      const node = await tx.get(`SELECT n.* FROM wiki.text_document_node n JOIN wiki.document_node_identity i
        ON i.source_id=n.source_id AND i.node_pointer=n.json_pointer WHERE i.source_id=$1 AND i.node_id=$2`, [sourceId, command.nodeId]);
      if (!node) fail('E_DOCUMENT_COMMAND', 'unknown stable node ID');
      const pointer = `${node.json_pointer}/${command.slot}`;
      const slot = await tx.get('SELECT * FROM wiki.text_document_slot WHERE source_id=$1 AND json_pointer=$2 AND node_pointer=$3', [sourceId, pointer, node.json_pointer]);
      if (!slot || slot.representation !== (isRun ? 'runs' : 'string')) fail('E_DOCUMENT_COMMAND', 'existing typed slot required');
      let text = command.value;
      if (isRun) {
        const result = await tx.query('UPDATE wiki.text_document_run SET text=$1 WHERE source_id=$2 AND slot_pointer=$3 AND ordinal=$4', [command.value, sourceId, pointer, command.ordinal]);
        if (result.rowCount !== 1) fail('E_DOCUMENT_COMMAND', 'unknown stable run ordinal');
        text = (await tx.all('SELECT text FROM wiki.text_document_run WHERE source_id=$1 AND slot_pointer=$2 ORDER BY ordinal', [sourceId, pointer])).map(row => row.text).join('');
      } else if (!text.length && node.kind !== 'table') fail('E_DOCUMENT_COMMAND', 'nonempty text required outside table cells');
      preserveAnchors(node, slot.text, text);
      await tx.query('UPDATE wiki.text_document_slot SET text=$1 WHERE source_id=$2 AND json_pointer=$3', [text, sourceId, pointer]);
      break;
    }
    case 'setStatus': fail('E_DOCUMENT_APPROVAL_REQUIRED', 'editor cannot grant or reuse publication approval'); break;
    case 'setData': case 'setDomain': fail('E_DOCUMENT_DOMAIN_EDITOR_REQUIRED', 'domain changes require a typed domain editor'); break;
    default: fail('E_DOCUMENT_COMMAND', 'unsupported typed command');
  }
}
