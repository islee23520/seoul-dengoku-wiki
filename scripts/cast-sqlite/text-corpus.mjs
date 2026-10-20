import { TEXT_DOCUMENT_MANIFEST, TEXT_LINE_SOURCE_PATHS } from './text-corpus-manifest.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { mapTextCorpusLines, TEXT_CORPUS_LINES_TABLE_COLUMNS } from './text-corpus-lines.mjs';
import { TEXT_DATA_TABLE_COLUMNS, mapTextData, auditTextData } from './text-data.mjs';

export const TEXT_CORPUS_TABLE_COLUMNS = Object.freeze({ ...TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS, ...TEXT_CORPUS_LINES_TABLE_COLUMNS, ...TEXT_DATA_TABLE_COLUMNS });
const fail = (message) => { throw Object.assign(new Error('E_TEXT_CORPUS_MANIFEST: ' + message), { code: 'E_TEXT_CORPUS_MANIFEST' }); };

export function mapTextCorpus({ bundle }) {
  const byPath = new Map(bundle.files.map((file) => [file.logical_path, file]));
  const files = TEXT_DOCUMENT_MANIFEST.map((entry) => {
    const file = byPath.get(entry.logical_path);
    if (!file) fail(entry.logical_path);
    return { ...file, corpus_kind: entry.corpus_kind, content_policy: 'local-corpus' };
  });
  return Object.freeze({ ...mapTextCorpusDocuments({ files }), ...mapTextCorpusLines({ bundle }), ...mapTextData({ files, bundle }) });
}

export function auditTextCorpus({ bundle, tables }) {
  const expected = mapTextCorpus({ bundle });
  for (const [table, rows] of Object.entries(expected)) {
    const columns = TEXT_CORPUS_TABLE_COLUMNS[table];
    const signature = (row) => JSON.stringify(columns.map((column) => row[column]));
    const actual = tables[table];
    if (!Array.isArray(actual) || JSON.stringify(actual.map(signature).sort()) !== JSON.stringify(rows.map(signature).sort())) fail(table);
  }
  const represented = new Set([...expected.text_document, ...expected.text_line_document].map((row) => row.source_id));
  const missing = [...TEXT_DOCUMENT_MANIFEST.map((entry) => entry.logical_path), ...TEXT_LINE_SOURCE_PATHS]
    .filter((path) => !bundle.files.some((file) => file.logical_path === path && represented.has(file.source_id)));
  if (missing.length) fail(missing.join(', '));
  const dataAudit = auditTextData({ files: TEXT_DOCUMENT_MANIFEST.map((entry) => bundle.files.find((file) => file.logical_path === entry.logical_path)), tables });
  if (dataAudit.domain_sidecar_gap_paths.length) fail(dataAudit.domain_sidecar_gap_paths.join(', '));
  return Object.freeze({ document_count: expected.text_document.length, line_document_count: expected.text_line_document.length,
    physical_line_count: expected.text_line.length, missing_text_source_count: missing.length,
    publication_admission: 'not-evaluated',
    ...dataAudit,
    corpus_counts: Object.fromEntries(['current', 'historical', 'example'].map((kind) => [kind, expected.text_document.filter((row) => row.corpus_kind === kind).length])),
    status_counts: Object.fromEntries(['approved', 'draft', 'excluded'].map((status) => [status, expected.text_document.filter((row) => row.status === status).length])) });
}
