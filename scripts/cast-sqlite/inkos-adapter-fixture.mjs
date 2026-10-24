import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { applySchema } from './db.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { initializeDocumentAuthority } from './document-edit.mjs';
import { digestJson } from '../inkos-adapter/contracts.mjs';

export const syntheticDocument = (id = 'SYN-target') => ({ version: 1, domain: 'technology', id, slug: id, status: 'approved',
  tense: { ko: 'present', en: 'present' }, source: { kind: 'observed', refs: ['synthetic-only'] },
  provenance: { original_anchor: 'synthetic', original_hash: null, history: [] },
  locales: { ko: { title: 'Synthetic KO', summary: 'Synthetic summary', tense: 'present' }, en: { title: 'Synthetic EN', summary: 'Synthetic summary', tense: 'present' } },
  content: [{ kind: 'paragraph', anchor: 'paragraph', text: { ko: '합성 시험 문단이다.', en: 'Synthetic test paragraph.' } }],
  data: { constraint: 'synthetic fixture only' } });

/** Storage-only synthetic admission, never a production approval issuer. Caller
 * owns cleanup; every database is created beneath a fresh owned directory. */
export function createInkosAdapterFixture({ parent = tmpdir(), authorityVersion = 2 } = {}) {
  if (![1, 2].includes(authorityVersion)) throw new TypeError('authorityVersion must be 1 or 2');
  const directory = mkdtempSync(join(parent, 'inkos-adapter-'));
  const dbPath = join(directory, 'synthetic.sqlite');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  const cleanup = () => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true, force: true }); };
  try {
    applySchema(db);
    const insert = (table, rows) => {
      if (!rows.length) return;
      const names = Object.keys(rows[0]);
      const statement = db.prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map(() => '?')})`);
      for (const row of rows) statement.run(...names.map(name => row[name]));
    };
    const documents = [syntheticDocument(), syntheticDocument('SYN-context')];
    const files = documents.map((document, i) => {
      const source_id = i + 1;
      const logical_path = `/synthetic-unopened/${document.id}.json`;
      const bytes = Buffer.from('synthetic non-JSON archive');
      db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(source_id, logical_path, 'application/json', sha256(bytes), bytes.length, bytes);
      insert('source_record', flattenJson(document).map(row => ({ source_id, ...row })));
      return { source_id, logical_path, document, corpus_kind: 'current', content_policy: 'local-corpus' };
    });
    for (const [table, rows] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, rows);
    const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] };
    for (const [table, rows] of Object.entries(mapTextData({ files, bundle }))) insert(table, rows);
    // Same legacy-storage emulation as test-document-edit; no migration is run.
    const bootstrap = authorityVersion === 1 ? new Proxy(db, { get(target, property) {
      if (property === 'exec') return sql => {
        if (sql.includes('CREATE TABLE document_authority (')) sql = sql.replace('CHECK(version=2)', 'CHECK(version=1)')
          .replace('VALUES(1,2,0)', 'VALUES(1,1,0)')
          .replace('FOREIGN KEY(source_id,node_pointer) REFERENCES source_record', 'FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node');
        if (sql.startsWith('CREATE TABLE document_revision_text_')) sql = sql.replace(
          /FOREIGN KEY\(revision_id,([^)]+)\) REFERENCES document_revision_(text_\w+|link_target)\(revision_id,([^)]+)\)/gu,
          (_, local, table, remote) => `FOREIGN KEY(${local}) REFERENCES ${table === 'link_target' ? 'text_document_anchor' : table}(${remote})`);
        return target.exec(sql);
      };
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } }) : db;
    initializeDocumentAuthority(bootstrap, { actor: 'synthetic-test', reason: 'synthetic validated import', validatedSourceIds: [1, 2] });
    if (authorityVersion === 1) db.exec('DROP TABLE document_revision_link_target');
    db.exec(readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8'));
    const sources = files.map((file, i) => {
      const head = db.prepare('SELECT r.revision_id,r.semantic_sha256 FROM document_head h JOIN document_revision r USING(source_id,revision_id) WHERE h.source_id=?').get(file.source_id);
      const admission = { source_id: file.source_id, revision_id: head.revision_id, source_path: file.logical_path,
        source_sha256: sha256(Buffer.from('synthetic non-JSON archive')), semantic_sha256: head.semantic_sha256,
        classification: 'current-reviewed', reason: 'approved-exact-review', receipt_path: 'synthetic-private-receipt-canary',
        receipt_sha256: 'b'.repeat(64), approval_ref: 'synthetic-test-only-not-owner-approval', recorded_at: '2026-10-24T00:00:00Z' };
      insert('document_publication_admission', [admission]);
      return { sourceKey: `source-${i + 1}`, authorityId: 'SYN-authority', corpusKind: 'current', domain: 'technology',
        documentId: file.document.id, revision: head.revision_id, semanticSha256: head.semantic_sha256,
        admissionDigest: digestJson(admission), anchors: ['paragraph'] };
    });
    const selection = { version: 1, authorityId: 'SYN-authority',
      target: { corpusKind: 'current', domain: 'technology', documentId: 'SYN-target', anchor: 'paragraph', locale: 'ko' },
      references: [{ corpusKind: 'current', domain: 'technology', documentId: 'SYN-context' }] };
    return { directory, dbPath, db, documents, selection, sources, authorityVersion, cleanup };
  } catch (error) { cleanup(); throw error; }
}
