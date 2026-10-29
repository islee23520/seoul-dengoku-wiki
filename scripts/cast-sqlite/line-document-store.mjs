import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';
import { mapTextCorpusLines } from './text-corpus-lines.mjs';
import { TEXT_LINE_SOURCE_PATHS } from './text-corpus-manifest.mjs';
import { ADDITIONAL_LINE_SOURCE_PATHS } from './additional-line-sources.mjs';

const paths = new Set([...TEXT_LINE_SOURCE_PATHS, ...ADDITIONAL_LINE_SOURCE_PATHS, 'scripts/gurps-cast.mjs', 'scripts/lore-json-render.mjs']);
const media = { markdown: 'text/markdown', csv: 'text/csv', 'javascript-data': 'text/javascript' };
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const hash = text => createHash('sha256').update(text).digest('hex');
function required(value, name) {
  if (typeof value !== 'string' || !value.trim()) fail('E_LINE_FIELD', name);
}
function keys(command, allowed, requiredFields = allowed) {
  if (!command || Object.getPrototypeOf(command) !== Object.prototype
    || Object.keys(command).some(key => !allowed.includes(key))
    || requiredFields.some(key => !Object.hasOwn(command, key))) fail('E_LINE_FIELDS', 'unknown or missing field');
}
function connection(db) {
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_LINE_DATABASE', 'foreign keys required');
}
function source(db, sourceId) {
  if (!Number.isSafeInteger(sourceId) || sourceId<1) fail('E_LINE_SOURCE', 'positive source ID required');
  const row = db.prepare(`SELECT d.*,s.logical_path,s.media_type,s.sha256,s.byte_length
    FROM text_line_document d JOIN source_file s USING(source_id) WHERE d.source_id=?`).get(sourceId);
  if (!row || !paths.has(row.logical_path) || !(row.media_kind in media)
    || !([media[row.media_kind], ...(row.media_kind==='javascript-data' ? ['application/javascript'] : [])].includes(row.media_type))) {
    fail('E_LINE_SOURCE', 'not an existing bounded typed line source');
  }
  return row;
}
function mapped(sourceId, kind, text) {
  if (typeof text !== 'string' || !text.isWellFormed()) fail('E_LINE_TEXT', 'well-formed Unicode text required');
  return mapTextCorpusLines({ bundle: { files: [{ source_id: sourceId, media_type: media[kind], raw_bytes: Buffer.from(text) }] } });
}
function reconstruct(document, lines) {
  if (lines.length!==document.line_count || lines.some((line,index) => line.line_ordinal!==index)) {
    fail('E_LINE_INTEGRITY', 'line count or ordinal mismatch');
  }
  return lines.map(line => line.text).join('\n') + (document.ends_with_newline ? '\n' : '');
}
function validateRows(document, lines, text) {
  const expected = mapped(document.source_id, document.media_kind, text);
  const metadata = expected.text_line_document[0];
  if (Object.keys(metadata).some(key => document[key]!==metadata[key])
    || expected.text_line.some((line,index) => Object.keys(line).some(key => line[key]!==lines[index]?.[key]))) {
    fail('E_LINE_INTEGRITY', 'typed line metadata mismatch');
  }
}
function snapshot(db, document, lines, { parent, sequence, actor, reason }) {
  const text = reconstruct(document, lines);
  const digest = hash(text);
  const revision = hash([document.source_id,parent ?? '',sequence,digest,actor,reason].join('\0'));
  db.prepare('INSERT INTO line_document_revision VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(document.source_id,
    revision,parent,sequence,document.media_kind,document.line_count,document.ends_with_newline,document.line_ending,
    digest,actor,reason,new Date().toISOString());
  const insert = db.prepare('INSERT INTO line_document_revision_line VALUES (?,?,?,?,?,?)');
  for (const line of lines) insert.run(document.source_id,revision,line.line_ordinal,line.text,line.line_kind,line.heading_depth);
  db.prepare('INSERT INTO line_document_revision_seal VALUES (?,?)').run(document.source_id,revision);
  return revision;
}

/** One-time adoption of validated existing typed rows, not a file importer.
 * Bootstrap hashes reconstructed rows against archive metadata without reading raw_bytes.
 * All 14 source identities are internal-only: policy is not public lore; CSV is
 * private reference data; scripts are private tooling. No status grants admission.
 */
export function initializeLineDocumentStore(db, command) {
  keys(command, ['sourceIds','actor','reason']);
  const { sourceIds, actor, reason } = command;
  connection(db); required(actor,'actor'); required(reason,'reason');
  if (!Array.isArray(sourceIds) || !sourceIds.length || new Set(sourceIds).size!==sourceIds.length) fail('E_LINE_SOURCE', 'nonempty unique sourceIds required');
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='line_document_head'").get()) fail('E_LINE_INITIALIZED', 'one-time adoption already performed');
    const originals = sourceIds.map(sourceId => {
      const document = source(db,sourceId);
      const lines = db.prepare('SELECT * FROM text_line WHERE source_id=? ORDER BY line_ordinal').all(sourceId);
      const text = reconstruct(document,lines);
      validateRows(document,lines,text);
      if (hash(text)!==document.sha256 || Buffer.byteLength(text)!==document.byte_length) fail('E_LINE_ARCHIVE', 'typed bootstrap differs from archive hash');
      return { document, lines };
    });
    db.exec(readFileSync(new URL('./line-document-store.sql', import.meta.url),'utf8'));
    for (const table of ['line_document_policy','line_document_revision','line_document_revision_line','line_document_revision_seal']) {
      for (const operation of ['UPDATE','DELETE']) db.exec(`CREATE TRIGGER ${table}_no_${operation} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'immutable line history'); END`);
    }
    db.exec(`CREATE TRIGGER line_document_revision_line_sealed BEFORE INSERT ON line_document_revision_line
      WHEN EXISTS(SELECT 1 FROM line_document_revision_seal WHERE revision_id=NEW.revision_id)
      BEGIN SELECT RAISE(ABORT,'sealed line revision'); END`);
    // Original coordinates and bytes are evidence, including after adoption.
    for (const table of ['source_file','source_record']) for (const operation of ['UPDATE','DELETE']) {
      db.exec(`CREATE TRIGGER line_document_${table}_no_${operation} BEFORE ${operation} ON ${table}
        WHEN EXISTS(SELECT 1 FROM line_document_policy WHERE source_id=OLD.source_id)
        BEGIN SELECT RAISE(ABORT,'immutable line source evidence'); END`);
    }
    db.exec(`CREATE TRIGGER line_document_source_record_no_insert BEFORE INSERT ON source_record
      WHEN EXISTS(SELECT 1 FROM line_document_policy WHERE source_id=NEW.source_id)
      BEGIN SELECT RAISE(ABORT,'immutable line source evidence'); END`);
    return originals.map(({document,lines}) => {
      const usage = document.media_kind==='csv' ? 'private-reference' : document.media_kind==='javascript-data' ? 'private-script'
        : ['WORLD_BUILDING_GUIDE.md','lore/AUTHORING-JSON.md','lore/characters/Cast-Profile-Contract.md'].includes(document.logical_path) ? 'policy-guide' : 'private-authoring';
      db.prepare('INSERT INTO line_document_policy VALUES (?,?,?)').run(document.source_id,usage,'internal-only');
      const revision = snapshot(db,document,lines,{parent:null,sequence:0,actor,reason});
      db.prepare("INSERT INTO line_document_head VALUES (?,?,'draft','invalidated',NULL,NULL)").run(document.source_id,revision);
      return { sourceId:document.source_id,revision };
    });
  });
}

/** Reconstruct current text or an immutable revision exclusively from typed rows.
 * This bounded store deliberately has no publication-admission command. Missing
 * schema/privacy review and exact current approval fail closed, including guides.
 */
export function readLineDocument(db, sourceId, { revision, visibility='internal' } = {}) {
  if (!['internal','public'].includes(visibility)) fail('E_LINE_VISIBILITY',visibility);
  const document = source(db,sourceId);
  const head = db.prepare('SELECT * FROM line_document_head WHERE source_id=?').get(sourceId);
  if (!head) fail('E_LINE_SOURCE','source not adopted');
  const policy = db.prepare('SELECT * FROM line_document_policy WHERE source_id=?').get(sourceId);
  if (visibility==='public') fail('E_LINE_ADMISSION','internal-only source; schema/privacy attestation and exact approval absent');
  const selected = revision ?? head.revision_id;
  const record = db.prepare(`SELECT r.* FROM line_document_revision r JOIN line_document_revision_seal z USING(source_id,revision_id)
    WHERE r.source_id=? AND r.revision_id=?`).get(sourceId,selected);
  if (!record) fail('E_LINE_REVISION','unknown sealed revision');
  const current = selected===head.revision_id;
  const lines = current ? db.prepare('SELECT * FROM text_line WHERE source_id=? ORDER BY line_ordinal').all(sourceId)
    : db.prepare('SELECT source_id,line_ordinal,text,line_kind,heading_depth FROM line_document_revision_line WHERE source_id=? AND revision_id=? ORDER BY line_ordinal').all(sourceId,selected);
  const metadata = current ? document : record;
  const text = reconstruct(metadata,lines);
  validateRows(metadata,lines,text);
  if (hash(text)!==record.content_sha256) fail('E_LINE_INTEGRITY','revision hash mismatch');
  return { sourceId, revision:selected, parentRevision:record.parent_revision, sequence:record.sequence,
    text, lines, mediaKind:metadata.media_kind, endsWithNewline:Boolean(metadata.ends_with_newline), lineEnding:metadata.line_ending,
    contentSha256:record.content_sha256, actor:record.actor, reason:record.reason,
    usageKind:policy.usage_kind, privacy:policy.privacy, status:head.status, publicAdmission:head.public_admission,
    schemaAttestation:head.schema_attestation, currentApprovalRef:head.current_approval_ref };
}

/** Full text OR ordered physical line strings plus explicit final-LF bit.
 * CR remains literal; ordinal is revision-scoped, not a persistent row identity.
 */
export function replaceLines(db, command) {
  keys(command,['sourceId','expectedRevision','text','lines','endsWithNewline','actor','reason'],['sourceId','expectedRevision','actor','reason']);
  connection(db);
  const { sourceId,expectedRevision,actor,reason } = command;
  required(expectedRevision,'expectedRevision'); required(actor,'actor'); required(reason,'reason');
  let text;
  if (Object.hasOwn(command,'text')) {
    if (Object.hasOwn(command,'lines') || Object.hasOwn(command,'endsWithNewline')) fail('E_LINE_FIELDS','text and line modes are exclusive');
    text = command.text;
  } else {
    if (!Array.isArray(command.lines) || typeof command.endsWithNewline!=='boolean'
      || command.lines.some(line => typeof line!=='string' || line.includes('\n'))
      || (!command.lines.length && command.endsWithNewline)
      || (command.lines.length && !command.endsWithNewline && command.lines.at(-1)==='')) fail('E_LINE_TEXT','noncanonical physical lines');
    text = command.lines.join('\n') + (command.endsWithNewline ? '\n' : '');
  }
  return withTransaction(db, () => {
    const previous = readLineDocument(db,sourceId);
    if (previous.revision!==expectedRevision) fail('E_LINE_CONFLICT','stale expectedRevision');
    const rows = mapped(sourceId,previous.mediaKind,text);
    const document = rows.text_line_document[0];
    const lines = rows.text_line;
    const revision = snapshot(db,document,lines,{parent:expectedRevision,sequence:previous.sequence+1,actor,reason});
    db.prepare('DELETE FROM text_line WHERE source_id=?').run(sourceId);
    db.prepare('UPDATE text_line_document SET line_count=?,ends_with_newline=?,line_ending=? WHERE source_id=?')
      .run(document.line_count,document.ends_with_newline,document.line_ending,sourceId);
    for (const line of lines) db.prepare('INSERT INTO text_line VALUES (?,?,?,?,?)').run(sourceId,line.line_ordinal,line.text,line.line_kind,line.heading_depth);
    const changed = db.prepare("UPDATE line_document_head SET revision_id=?,status='draft',public_admission='invalidated',schema_attestation=NULL,current_approval_ref=NULL WHERE source_id=? AND revision_id=?")
      .run(revision,sourceId,expectedRevision);
    if (changed.changes!==1) fail('E_LINE_CONFLICT','head changed');
    return {sourceId,revision,previousRevision:expectedRevision};
  });
}


/** Async PostgreSQL twin of readLineDocument: identical adoption, policy,
 * sealed-revision, row validation and content-hash checks over wiki.* tables
 * inside the caller-owned read-only transaction. Internal-only visibility
 * contract preserved (public still fails closed). */
export async function readLineDocumentAsync(tx, sourceId, { revision, visibility = 'internal' } = {}) {
  if (!['internal','public'].includes(visibility)) fail('E_LINE_VISIBILITY',visibility);
  if (!Number.isSafeInteger(sourceId) || sourceId < 1) fail('E_LINE_SOURCE','positive source ID required');
  const document = (await tx.all(`SELECT d.*, s.logical_path, s.media_type, s.sha256, s.byte_length
    FROM wiki.text_line_document d JOIN wiki.source_file s ON s.source_id = d.source_id WHERE d.source_id = ?`, [sourceId]))[0];
  if (!document || !paths.has(document.logical_path) || !(document.media_kind in media)
    || !([media[document.media_kind], ...(document.media_kind === 'javascript-data' ? ['application/javascript'] : [])].includes(document.media_type))) {
    fail('E_LINE_SOURCE','not an existing bounded typed line source');
  }
  const head = await tx.get('SELECT * FROM wiki.line_document_head WHERE source_id = ?', [sourceId]);
  if (!head) fail('E_LINE_SOURCE','source not adopted');
  const policy = await tx.get('SELECT * FROM wiki.line_document_policy WHERE source_id = ?', [sourceId]);
  if (visibility === 'public') fail('E_LINE_ADMISSION','internal-only source; schema/privacy attestation and exact approval absent');
  const selected = revision ?? head.revision_id;
  const record = await tx.get(`SELECT r.* FROM wiki.line_document_revision r JOIN wiki.line_document_revision_seal z ON z.source_id = r.source_id AND z.revision_id = r.revision_id
    WHERE r.source_id = ? AND r.revision_id = ?`, [sourceId, selected]);
  if (!record) fail('E_LINE_REVISION','unknown sealed revision');
  const current = selected === head.revision_id;
  const lines = current ? await tx.all('SELECT * FROM wiki.text_line WHERE source_id = ? ORDER BY line_ordinal', [sourceId])
    : await tx.all('SELECT source_id,line_ordinal,text,line_kind,heading_depth FROM wiki.line_document_revision_line WHERE source_id = ? AND revision_id = ? ORDER BY line_ordinal', [sourceId, selected]);
  const metadata = current ? document : record;
  const text = reconstruct(metadata, lines);
  validateRows(metadata, lines, text);
  if (hash(text) !== record.content_sha256) fail('E_LINE_INTEGRITY','revision hash mismatch');
  return { sourceId, revision: selected, parentRevision: record.parent_revision, sequence: record.sequence,
    text, lines, mediaKind: metadata.media_kind, endsWithNewline: Boolean(metadata.ends_with_newline), lineEnding: metadata.line_ending,
    contentSha256: record.content_sha256, actor: record.actor, reason: record.reason,
    usageKind: policy.usage_kind, privacy: policy.privacy, status: head.status, publicAdmission: head.public_admission,
    schemaAttestation: head.schema_attestation, currentApprovalRef: head.current_approval_ref };
}
