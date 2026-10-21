import { unlinkSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { APPLICATION_ID, SCHEMA_VERSION, applySchema, openWritableNew, runIntegrityChecks, withTransaction } from './db.mjs';
import { parseDocument, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { auditTextData, mapTextData, TEXT_DATA_TABLE_COLUMNS } from './text-data.mjs';
import { readDocument } from './document-read.mjs';

const fail = (code, detail, extra = {}) => { throw Object.assign(new Error(`${code}: ${detail}`), { code, ...extra }); };
const sourceColumns = 'source_id logical_path media_type sha256 byte_length raw_bytes'.split(' ');
const recordColumns = 'source_id json_pointer parent_pointer ordinal field_name json_type text_value integer_value real_value boolean_value'.split(' ');
const insert = (db, table, columns, rows) => {
  if (!rows.length) return;
  const statement = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
  for (const row of rows) statement.run(...columns.map((column) => row[column]));
};

/** One-time bootstrap, not a runtime JSON fallback or publication decision.
 * entries: [{source_id?, logical_path, privacy:'public', corpus_kind, raw_bytes,
 *   identity:{domain,document_id,slug}}]. Bytes must be the caller's approved snapshot;
 * status, dates and paths never infer approval. Paths are opaque provenance, never opened.
 * Explicit IDs are preserved; omitted IDs append above every archived/explicit ID.
 * Existing archives may be reused only byte-for-byte with identical source coordinates.
 * registryFacts supplies typed {persons:[{id,name}],states:[{state_id}]} already present
 * in the target DB. This adapter satisfies legacy mapper inputs without opening registries.
 * Generic source records and exact bytes are evidence only; typed readback is mandatory.
 * This does not import people, rights, private editorial contracts, arbitrary glossary data,
 * or initialize revision/publication authority. Call authority bootstrap separately.
 */
export function importDocuments({ db, outputPath, entries, store, registryFacts, definitions } = {}) {
  if ((db === undefined) === (outputPath === undefined)) fail('E_DOCUMENT_IMPORT_OPTIONS', 'provide one existing connection or new outputPath');
  if (store !== 'public') fail('E_DOCUMENT_IMPORT_PRIVACY', 'explicit public store required; private storage is unsupported');
  if (!Array.isArray(entries) || !entries.length) fail('E_DOCUMENT_IMPORT_OPTIONS', 'nonempty entries required');
  for (const entry of entries) {
    if (entry?.privacy !== 'public') fail('E_DOCUMENT_IMPORT_PRIVACY', 'every entry must explicitly admit public storage');
    if (typeof entry.logical_path !== 'string' || !entry.logical_path || !(entry.raw_bytes instanceof Uint8Array)
      || !['current', 'historical', 'example'].includes(entry.corpus_kind)
      || !entry.identity || ['domain', 'document_id', 'slug'].some((key) => typeof entry.identity[key] !== 'string' || !entry.identity[key])
      || (entry.source_id !== undefined && (!Number.isSafeInteger(entry.source_id) || entry.source_id < 1))) {
      fail('E_DOCUMENT_IMPORT_ENTRY', 'identity, corpus, provenance path and exact bytes required');
    }
  }
  const owns = db === undefined;
  if (owns) db = openWritableNew(outputPath);
  try {
    return withTransaction(db, () => {
      if (owns) applySchema(db);
      if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID
        || db.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION
        || db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_DOCUMENT_IMPORT_DATABASE', 'compatible foreign-key-enabled database required');
      // Cross-document domain references may precede their target rows in mapper order.
      // Defer enforcement, not validation: runIntegrityChecks below must pass before commit.
      db.exec('PRAGMA defer_foreign_keys=ON');
      if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_authority'").get()) {
        fail('E_DOCUMENT_IMPORT_INITIALIZED', 'bootstrap must precede revision authority initialization');
      }
      const persons = registryFacts?.persons ?? db.prepare('SELECT person_id AS id,name FROM person').all();
      const states = registryFacts?.states ?? db.prepare('SELECT state_id FROM state').all();
      if (!Array.isArray(persons) || !Array.isArray(states)) fail('E_DOCUMENT_IMPORT_REGISTRY', 'typed registry arrays required');
      for (const p of persons) if (!db.prepare('SELECT 1 FROM person WHERE person_id=? AND name=?').get(p.id, p.name)) fail('E_DOCUMENT_IMPORT_REGISTRY', 'person fact absent from target database');
      for (const s of states) if (!db.prepare('SELECT 1 FROM state WHERE state_id=?').get(s.state_id)) fail('E_DOCUMENT_IMPORT_REGISTRY', 'state fact absent from target database');
      const bundle = { files: [
        { logical_path: 'lore/name-pools/person-id-registry.json', document: { persons } },
        { logical_path: 'lore/name-pools/values-cast.json', document: { people: states.map((s) => ({ state: s.state_id })) } },
      ] };
      let next = Math.max(db.prepare('SELECT coalesce(max(source_id),0) AS id FROM source_file').get().id,
        ...entries.map((e) => e.source_id ?? 0));
      const ids = new Set(), paths = new Set(), identities = new Set(), slugs = new Set();
      const files = entries.map((entry) => {
        const source_id = entry.source_id ?? ++next;
        const raw_bytes = Buffer.from(entry.raw_bytes);
        const { document, records } = parseDocument(new TextDecoder('utf-8', { fatal: true }).decode(raw_bytes));
        const identity = JSON.stringify([entry.corpus_kind, document.domain, document.id]);
        const slug = JSON.stringify([entry.corpus_kind, document.domain, document.slug]);
        if (!isDeepStrictEqual(entry.identity, { domain: document.domain, document_id: document.id, slug: document.slug })) fail('E_DOCUMENT_IMPORT_IDENTITY', 'archive and explicit identity differ');
        if (ids.has(source_id) || paths.has(entry.logical_path) || identities.has(identity) || slugs.has(slug)
          || db.prepare('SELECT 1 FROM text_document WHERE source_id=? OR (corpus_kind=? AND domain=? AND (document_id=? OR slug=?))')
            .get(source_id, entry.corpus_kind, document.domain, document.id, document.slug)) fail('E_DOCUMENT_IMPORT_DUPLICATE', identity);
        if (db.prepare('SELECT 1 FROM excluded_source WHERE logical_path=?').get(entry.logical_path)) fail('E_DOCUMENT_IMPORT_PRIVACY', 'excluded source cannot enter public store');
        ids.add(source_id); paths.add(entry.logical_path); identities.add(identity); slugs.add(slug);
        return { source_id, logical_path: entry.logical_path, media_type: 'application/json', raw_bytes,
          byte_length: raw_bytes.length, sha256: sha256(raw_bytes), document, records,
          corpus_kind: entry.corpus_kind, content_policy: 'local-corpus' };
      });
      // Resolve new links against existing typed documents, never their old JSON archives.
      const existing = db.prepare('SELECT source_id,document_id,domain,corpus_kind FROM text_document').all().map((d) => ({
        source_id: d.source_id, corpus_kind: d.corpus_kind, content_policy: 'local-corpus',
        document: readDocument(db, { documentId: d.document_id, domain: d.domain, corpusKind: d.corpus_kind, visibility: 'internal' }),
      }));
      const envelope = mapTextCorpusDocuments({ files: [...existing, ...files], definitions });
      const data = mapTextData({ files, bundle });
      const audit = auditTextData({ files, tables: data });
      if (audit.domain_sidecar_normalization !== 'complete') fail('E_DOCUMENT_IMPORT_UNMAPPED_DATA', 'unsupported /data; no partial import', { unsupported: audit.domain_sidecar_gap_paths });
      for (const file of files) {
        const archived = db.prepare('SELECT * FROM source_file WHERE source_id=? OR logical_path=?').all(file.source_id, file.logical_path);
        const records = file.records.map((row) => ({ source_id: file.source_id, ...row }));
        if (archived.length) {
          if (archived.length !== 1 || sourceColumns.some((key) => key === 'raw_bytes'
            ? !Buffer.from(archived[0][key]).equals(file[key]) : archived[0][key] !== file[key])) fail('E_DOCUMENT_IMPORT_ARCHIVE', 'existing archive differs');
          const prior = db.prepare('SELECT * FROM source_record WHERE source_id=? ORDER BY json_pointer').all(file.source_id).map((row) => ({ ...row }));
          if (!isDeepStrictEqual(prior, [...records].sort((a, b) => a.json_pointer < b.json_pointer ? -1 : a.json_pointer > b.json_pointer ? 1 : 0))) fail('E_DOCUMENT_IMPORT_ARCHIVE', 'existing source coordinates differ');
        } else {
          insert(db, 'source_file', sourceColumns, [file]);
          insert(db, 'source_record', recordColumns, records);
        }
      }
      for (const [table, columns] of Object.entries({ ...TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS, ...TEXT_DATA_TABLE_COLUMNS })) {
        insert(db, table, columns, (envelope[table] ?? data[table]).filter((row) => ids.has(row.source_id)));
      }
      for (const file of files) {
        if (!isDeepStrictEqual(readDocument(db, { documentId: file.document.id, domain: file.document.domain,
          corpusKind: file.corpus_kind, visibility: 'internal' }), file.document)) fail('E_DOCUMENT_IMPORT_READBACK', 'typed envelope differs from snapshot');
      }
      return { imported: files.map((f) => ({ source_id: f.source_id, logical_path: f.logical_path, sha256: f.sha256,
        corpus_kind: f.corpus_kind, document_id: f.document.id })), ...audit, ...runIntegrityChecks(db),
      publication_admission: 'unrecorded', scope: 'supported-typed-envelope-only' };
    });
  } catch (cause) {
    if (owns) { db.close(); unlinkSync(outputPath); }
    throw cause;
  } finally { if (owns && db.isOpen) db.close(); }
}
