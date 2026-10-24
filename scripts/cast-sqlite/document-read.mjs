import { TEXT_DATA_TABLE_COLUMNS, reconstructTextData } from './text-data.mjs';
import { createHash } from 'node:crypto';

const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);

function publicDocument(db, identity) {
  if (identity.excluded || identity.status === 'excluded' || identity.corpus_kind !== 'current') return null;
  const exists = rows(db, "SELECT 1 FROM sqlite_schema WHERE name='document_publication_admission'").length;
  if (!exists) {
    if (identity.status === 'approved') fail('E_DOCUMENT_SCHEMA_GAP', publicationGap.detail, [publicationGap]);
    return null;
  }
  const [admission] = rows(db, `SELECT a.* FROM document_publication_admission a
    JOIN document_head h USING(source_id,revision_id)
    JOIN document_revision r USING(source_id,revision_id) JOIN document_revision_seal z USING(revision_id)
    WHERE a.source_id=? AND a.source_path=? AND a.source_sha256=?
      AND a.semantic_sha256=r.semantic_sha256 AND r.algorithm='typed-envelope-v1'
      AND r.parent_revision IS NULL AND a.classification='current-reviewed' AND a.reason='approved-exact-review'`,
  identity.source_id, identity.logical_path, identity.sha256);
  if (!admission) return null;
  const document = readDocument(db, { documentId: identity.document_id, corpusKind: identity.corpus_kind, domain: identity.domain, visibility: 'internal' });
  if (createHash('sha256').update(canonical(document)).digest('hex') !== admission.semantic_sha256) return null;
  return document;
}

const fail = (code, detail, gaps) => {
  throw Object.assign(new Error(`${code}: ${detail}`), { code, ...(gaps ? { schemaGaps: gaps } : {}) });
};
const rows = (db, sql, ...bindings) => {
  try { return db.prepare(sql).all(...bindings).map((row) => ({ ...row })); }
  catch (cause) {
    if (/no such (table|column)/u.test(cause.message)) {
      fail('E_DOCUMENT_SCHEMA_GAP', cause.message, [{ code: 'missing-typed-schema', detail: cause.message }]);
    }
    throw cause;
  }
};
const publicationGap = Object.freeze({ code: 'publication-admission-unrecorded', pointer: '',
  detail: 'text_document has status but no privacy or publication admission. Approved does not establish public eligibility.' });

function options(value, requireId) {
  if (!value || !['current', 'historical', 'example'].includes(value.corpusKind)
    || (requireId && (typeof value.documentId !== 'string' || !value.documentId))) {
    fail('E_ARGUMENTS', 'corpusKind and a nonempty documentId (for readDocument) are required');
  }
  const visibility = value.visibility ?? 'public';
  if (!['public', 'internal'].includes(visibility)) fail('E_ARGUMENTS', 'visibility must be public or internal');
  if (value.domain !== undefined && (typeof value.domain !== 'string' || !value.domain)) fail('E_ARGUMENTS', 'domain must be nonempty');
  return visibility;
}

/** Database identities only: logical_path is never opened or interpreted as a policy. */
export function listDocuments(db, selector) {
  const visibility = options(selector, false);
  const result = rows(db, `SELECT d.source_id,d.document_id,d.domain,d.slug,d.status,d.corpus_kind,
    s.logical_path,s.sha256,s.byte_length,
    EXISTS(SELECT 1 FROM excluded_source e WHERE e.logical_path=s.logical_path) AS excluded
    FROM text_document d JOIN source_file s USING(source_id)
    WHERE d.corpus_kind=? AND (? IS NULL OR d.domain=?)
    ORDER BY d.domain,d.slug,d.source_id`, selector.corpusKind, selector.domain ?? null, selector.domain ?? null);
  if (visibility === 'internal') return result;
  return result.filter((identity) => publicDocument(db, identity) !== null);
}

/** Return the renderer envelope. Non-enumerable readMetadata records corpus/identity and
 * irrecoverable schema gaps without adding authoring fields. Internal access is explicit.
 * Never consult source_record, raw_bytes, source files, or materialized JSON. */
export function readDocument(db, selector) {
  options(selector, true);
  const identities = rows(db, `SELECT d.source_id,d.document_id,d.domain,d.slug,d.status,d.corpus_kind,
    s.logical_path,s.sha256,s.byte_length,
    EXISTS(SELECT 1 FROM excluded_source e WHERE e.logical_path=s.logical_path) AS excluded
    FROM text_document d JOIN source_file s USING(source_id)
    WHERE d.corpus_kind=? AND (? IS NULL OR d.domain=?) AND d.document_id=?
    ORDER BY d.domain,d.slug,d.source_id`, selector.corpusKind, selector.domain ?? null, selector.domain ?? null, selector.documentId);
  if (!identities.length) return null;
  if (identities.length !== 1) fail('E_DOCUMENT_AMBIGUOUS', 'documentId is not unique in this corpus; specify domain');
  const identity = identities[0];
  if ((selector.visibility ?? 'public') === 'public') {
    return publicDocument(db, identity);
  }
  const sourceId = identity.source_id;
  const read = (table, order = 'json_pointer') => rows(db,
    `SELECT * FROM ${table} WHERE source_id=? ORDER BY ${order}`, sourceId);
  const [d] = read('text_document');
  const gaps = [publicationGap, { code: 'unmapped-data-undetectable', pointer: '/data',
    detail: 'Typed data is reconstructed; the schema has no per-document completeness attestation for unsupported data keys.' }];
  const locales = Object.fromEntries(read('text_document_locale', 'locale').map(({ locale, title, summary, tense }) => [locale, { title, summary, tense }]));
  for (const locale of ['ko', 'en']) if (!locales[locale]) fail('E_DOCUMENT_SCHEMA_GAP', `missing locale ${locale}`);
  const slots = new Map(read('text_document_slot').map((slot) => [slot.json_pointer, slot]));
  const runs = read('text_document_run', 'ordinal');
  const leaf = (pointer) => Object.fromEntries(['ko', 'en'].map((locale) => {
    const slot = slots.get(`${pointer}/${locale}`);
    if (!slot) fail('E_DOCUMENT_SCHEMA_GAP', `missing typed slot ${pointer}/${locale}`);
    if (slot.representation === 'string') return [locale, slot.text];
    if (slot.representation !== 'runs') fail('E_DOCUMENT_SCHEMA_GAP', `unknown slot representation ${slot.representation}`);
    const value = runs.filter((run) => run.slot_pointer === slot.json_pointer).map((run) => ({
      text: run.text, ...(run.strong === 1 ? { strong: true } : {}),
      ...(run.link_domain === null ? {} : { link: { domain: run.link_domain, slug: run.link_slug,
        ...(run.link_anchor === null ? {} : { anchor: run.link_anchor }) } }),
      ...(run.href === null ? {} : { href: run.href }),
    }));
    if (!value.length || value.map((run) => run.text).join('') !== slot.text) fail('E_DOCUMENT_SCHEMA_GAP', `inconsistent typed runs ${slot.json_pointer}`);
    return [locale, value];
  }));
  const items = read('text_document_list_item', 'ordinal');
  const tableRows = read('text_document_table_row', 'ordinal');
  const cells = read('text_document_table_cell', 'ordinal');
  const anchors = read('text_document_anchor', 'ordinal');
  const content = read('text_document_node', 'ordinal').map((node) => {
    const result = { kind: node.kind, anchor: node.anchor };
    const aliases = (locale) => anchors.filter((a) => a.node_pointer === node.json_pointer && a.locale === locale && a.anchor_kind === 'public').map((a) => a.anchor);
    const ko = aliases('ko');
    if (JSON.stringify(ko) !== JSON.stringify(aliases('en'))) fail('E_DOCUMENT_SCHEMA_GAP', `locale public anchor mismatch ${node.json_pointer}`);
    if (ko.length) result.publicAnchors = ko;
    switch (node.kind) {
      case 'heading': result.depth = node.depth; result.text = leaf(`${node.json_pointer}/text`); break;
      case 'paragraph': case 'quote': result.text = leaf(`${node.json_pointer}/text`); break;
      case 'rule': break;
      case 'code':
        result.language = node.language;
        if (node.info !== null) result.info = node.info;
        result.text = leaf(`${node.json_pointer}/text`); break;
      case 'list':
        if (node.ordered !== null) result.ordered = Boolean(node.ordered);
        if (node.list_start !== null) result.start = node.list_start;
        result.items = items.filter((item) => item.node_pointer === node.json_pointer).map((item) => leaf(item.json_pointer)); break;
      case 'table':
        result.columns = cells.filter((cell) => cell.node_pointer === node.json_pointer && cell.cell_kind === 'column').map((cell) => leaf(cell.json_pointer));
        result.rows = tableRows.filter((row) => row.node_pointer === node.json_pointer).map((row) => cells.filter((cell) => cell.row_pointer === row.json_pointer).map((cell) => leaf(cell.json_pointer))); break;
      default: fail('E_DOCUMENT_SCHEMA_GAP', `unsupported typed node kind ${node.kind}`);
    }
    return result;
  });
  const categories = read('text_document_category', 'ordinal').map((row) => row.category);
  // The shared authoring schema requires nonempty categories/publicAnchors when present.
  // Thus no child rows means omission, not an authored empty array.
  const tables = Object.fromEntries(Object.keys(TEXT_DATA_TABLE_COLUMNS).map((table) => [table, read(table)]));
  const document = { version: d.version, domain: d.domain, id: d.document_id, slug: d.slug, status: d.status,
    ...(categories.length ? { categories } : {}), tense: { ko: d.tense_ko, en: d.tense_en },
    source: { kind: d.source_kind, refs: read('text_document_source_ref', 'ordinal').map((row) => row.reference),
      ...(d.source_hash === null ? {} : { hash: d.source_hash }) },
    provenance: { original_anchor: d.original_anchor, original_hash: d.original_hash,
      history: read('text_document_history', 'ordinal').map((row) => row.entry) },
    locales, content, data: reconstructTextData({ tables, source_id: sourceId }) };
  Object.defineProperty(document, 'readMetadata', { value: Object.freeze({ ...identity, schemaGaps: gaps }), enumerable: false });
  return document;
}
