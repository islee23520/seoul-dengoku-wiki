import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { headingId } from '../lore-json-render.mjs';

const definitions = JSON.parse(readFileSync(new URL('../../lore/authoring.shared.schema.json', import.meta.url), 'utf8')).$defs;

export const TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  text_document: 'source_id json_pointer corpus_kind version domain document_id slug status tense_ko tense_en source_kind source_hash original_anchor original_hash data_pointer',
  text_document_locale: 'source_id json_pointer locale title summary tense',
  text_document_category: 'source_id json_pointer ordinal category',
  text_document_source_ref: 'source_id json_pointer ordinal reference',
  text_document_history: 'source_id json_pointer ordinal entry',
  text_document_node: 'source_id json_pointer ordinal kind anchor depth ordered list_start language info',
  text_document_list_item: 'source_id json_pointer node_pointer ordinal',
  text_document_table_row: 'source_id json_pointer node_pointer ordinal',
  text_document_table_cell: 'source_id json_pointer node_pointer row_pointer cell_kind ordinal',
  text_document_slot: 'source_id json_pointer node_pointer locale representation text',
  text_document_run: 'source_id json_pointer slot_pointer ordinal text strong link_domain link_slug link_anchor href',
  text_document_anchor: 'source_id json_pointer locale ordinal node_pointer anchor anchor_kind published',
  text_document_link: 'source_id json_pointer corpus_kind locale resolution target_source_id target_anchor_ordinal',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

function fail(code, detail) { throw Object.assign(new Error(`${code}: ${detail}`), { code }); }
const own = (value, key) => Object.hasOwn(value, key);
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

// Interpret the vocabulary used by the shared authoring schema, rather than maintaining
// a second, subtly stricter document contract. Domain-specific data stays in source_record.
function valid(value, schema) {
  if (schema.$ref) return valid(value, definitions[schema.$ref.split('/').at(-1)]);
  if (own(schema, 'const') && !isDeepStrictEqual(value, schema.const)) return false;
  if (schema.enum && !schema.enum.some((item) => isDeepStrictEqual(value, item))) return false;
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => type === 'object' ? plain(value) : type === 'array' ? Array.isArray(value)
      : type === 'null' ? value === null : type === 'integer' ? Number.isSafeInteger(value) : typeof value === type)) return false;
  }
  if (typeof value === 'string' && ((schema.minLength !== undefined && [...value].length < schema.minLength)
    || (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)))) return false;
  if (typeof value === 'number' && ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) return false;
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false;
    if (schema.uniqueItems && value.some((item, index) => value.slice(0, index).some((other) => isDeepStrictEqual(item, other)))) return false;
    if (schema.items && !value.every((item) => valid(item, schema.items))) return false;
  }
  if (plain(value)) {
    if (schema.required?.some((key) => !own(value, key))) return false;
    if (schema.additionalProperties === false && Object.keys(value).some((key) => !own(schema.properties ?? {}, key))) return false;
    if (Object.entries(schema.properties ?? {}).some(([key, child]) => own(value, key) && !valid(value[key], child))) return false;
  }
  if (schema.oneOf && schema.oneOf.filter((child) => valid(value, child)).length !== 1) return false;
  if (schema.anyOf && !schema.anyOf.some((child) => valid(value, child))) return false;
  if (schema.allOf && !schema.allOf.every((child) => valid(value, child))) return false;
  if (schema.not && valid(value, schema.not)) return false;
  if (schema.if && !valid(value, valid(value, schema.if) ? schema.then ?? {} : schema.else ?? {})) return false;
  return true;
}

/** Local, caller-selected corpus only. No publication or approval inference.
 * files: [{source_id, document, corpus_kind: 'current'|'historical'|'example', content_policy: 'local-corpus'}].
 * Returned table-keyed frozen rows are inserted in TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS order.
 * Link resolution is a second pass and never crosses corpus_kind, including historical revisions.
 */
export function mapTextCorpusDocuments({ files }) {
  if (!Array.isArray(files)) fail('E_TEXT_DOCUMENT_INPUT', 'files must be an array');
  const tables = Object.fromEntries(Object.keys(TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS).map((table) => [table, []]));
  const sources = new Set();
  const targets = new Map();
  const key = (corpus, domain, slug) => JSON.stringify([corpus, domain, slug]);
  for (const file of files) {
    if (!plain(file) || !Number.isSafeInteger(file.source_id) || !['current', 'historical', 'example'].includes(file.corpus_kind)) fail('E_TEXT_DOCUMENT_INPUT', 'source_id and corpus_kind required');
    if (file.content_policy !== 'local-corpus') fail('E_TEXT_DOCUMENT_POLICY', `source ${file.source_id} is not admitted for local corpus storage`);
    if (!valid(file.document, definitions.envelope)) fail('E_TEXT_DOCUMENT_SHAPE', `source ${file.source_id}: invalid version 1 authoring envelope`);
    if (sources.has(file.source_id)) fail('E_TEXT_DOCUMENT_DUPLICATE_SOURCE', String(file.source_id));
    sources.add(file.source_id);
    const d = file.document;
    const targetKey = key(file.corpus_kind, d.domain, d.slug);
    if (targets.has(targetKey)) fail('E_TEXT_DOCUMENT_DUPLICATE_SLUG', targetKey);
    targets.set(targetKey, file);
  }
  for (const file of [...files].sort((a, b) => a.source_id - b.source_id)) {
    const { source_id, corpus_kind, document: d } = file;
    const emit = (table, json_pointer, values) => tables[table].push({ source_id, json_pointer, ...values });
    emit('text_document', '', { corpus_kind, version: d.version, domain: d.domain, document_id: d.id, slug: d.slug, status: d.status,
      tense_ko: d.tense.ko, tense_en: d.tense.en, source_kind: d.source.kind, source_hash: d.source.hash ?? null,
      original_anchor: d.provenance.original_anchor, original_hash: d.provenance.original_hash, data_pointer: '/data' });
    for (const locale of ['ko', 'en']) emit('text_document_locale', `/locales/${locale}`, { locale, ...d.locales[locale] });
    for (const [values, table, pointer, field] of [[d.categories ?? [], 'text_document_category', '/categories', 'category'],
      [d.source.refs, 'text_document_source_ref', '/source/refs', 'reference'], [d.provenance.history, 'text_document_history', '/provenance/history', 'entry']]) {
      values.forEach((value, ordinal) => emit(table, `${pointer}/${ordinal}`, { ordinal, [field]: value }));
    }
    const authored = new Map();
    d.content.forEach((node, index) => {
      for (const anchor of new Set([node.anchor, ...(node.publicAnchors ?? [])])) {
        if (authored.has(anchor)) fail('E_TEXT_DOCUMENT_DUPLICATE_ANCHOR', `${source_id}:${anchor}`);
        authored.set(anchor, index);
      }
    });
    const leafText = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('');
    const slots = (value, pointer, node_pointer) => {
      for (const locale of ['ko', 'en']) {
        const leaf = value[locale];
        const slot_pointer = `${pointer}/${locale}`;
        emit('text_document_slot', slot_pointer, { node_pointer, locale, representation: typeof leaf === 'string' ? 'string' : 'runs', text: leafText(leaf) });
        if (Array.isArray(leaf)) leaf.forEach((run, ordinal) => {
          const runPointer = `${slot_pointer}/${ordinal}`;
          emit('text_document_run', runPointer, { slot_pointer, ordinal, text: run.text, strong: run.strong ? 1 : null,
            link_domain: run.link?.domain ?? null, link_slug: run.link?.slug ?? null, link_anchor: run.link?.anchor ?? null, href: run.href ?? null });
          if (run.link || run.href) emit('text_document_link', runPointer, { corpus_kind, locale,
            resolution: run.href ? 'external' : run.link.domain === 'gdd' ? 'gdd' : 'pending', target_source_id: null, target_anchor_ordinal: null });
        });
      }
    };
    d.content.forEach((node, ordinal) => {
      const pointer = `/content/${ordinal}`;
      emit('text_document_node', pointer, { ordinal, kind: node.kind, anchor: node.anchor, depth: node.depth ?? null,
        ordered: node.ordered ? 1 : null, list_start: node.start ?? null, language: node.language ?? null, info: node.info ?? null });
      if (node.text) slots(node.text, `${pointer}/text`, pointer);
      node.items?.forEach((item, ordinal) => {
        const itemPointer = `${pointer}/items/${ordinal}`;
        emit('text_document_list_item', itemPointer, { node_pointer: pointer, ordinal });
        slots(item, itemPointer, pointer);
      });
      node.columns?.forEach((cell, ordinal) => {
        const cellPointer = `${pointer}/columns/${ordinal}`;
        emit('text_document_table_cell', cellPointer, { node_pointer: pointer, row_pointer: null, cell_kind: 'column', ordinal });
        slots(cell, cellPointer, pointer);
      });
      node.rows?.forEach((row, ordinal) => {
        const row_pointer = `${pointer}/rows/${ordinal}`;
        emit('text_document_table_row', row_pointer, { node_pointer: pointer, ordinal });
        row.forEach((cell, ordinal) => {
          const cellPointer = `${row_pointer}/${ordinal}`;
          emit('text_document_table_cell', cellPointer, { node_pointer: pointer, row_pointer, cell_kind: 'body', ordinal });
          slots(cell, cellPointer, pointer);
        });
      });
    });
    for (const locale of ['ko', 'en']) {
      let ordinal = 0;
      const ids = new Set();
      const anchor = (value, pointer, node_pointer, anchor_kind, published) => {
        emit('text_document_anchor', pointer, { locale, ordinal: ordinal++, node_pointer, anchor: value, anchor_kind, published: Number(published) });
        if (published) ids.add(value);
      };
      d.content.forEach((node, index) => {
        const pointer = `/content/${index}`;
        if (node.kind === 'heading') anchor(headingId(leafText(node.text[locale])), `${pointer}/text/${locale}`, pointer, 'natural', true);
        if (node.kind === 'paragraph') for (const match of leafText(node.text[locale]).matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) {
          anchor(match[1], `${pointer}/text/${locale}`, pointer, 'inline', true);
        }
      });
      d.content.forEach((node, index) => {
        const pointer = `/content/${index}`;
        const eligible = node.kind === 'heading' || node.publicAnchors?.length || (node.kind === 'paragraph' && d.domain === 'technology' && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(node.anchor));
        anchor(node.anchor, `${pointer}/anchor`, pointer, 'authored', Boolean(eligible && !ids.has(node.anchor)));
        node.publicAnchors?.forEach((value, index) => anchor(value, `${pointer}/publicAnchors/${index}`, pointer, 'public', Boolean(eligible && !ids.has(value))));
      });
    }
  }
  const runs = new Map(tables.text_document_run.map((run) => [JSON.stringify([run.source_id, run.json_pointer]), run]));
  const publishedAnchors = new Map();
  for (const anchor of tables.text_document_anchor) {
    if (!anchor.published) continue;
    const anchorKey = JSON.stringify([anchor.source_id, anchor.locale, anchor.anchor]);
    const candidates = publishedAnchors.get(anchorKey) ?? [];
    candidates.push(anchor);
    publishedAnchors.set(anchorKey, candidates);
  }
  for (const link of tables.text_document_link) {
    if (link.resolution !== 'pending') continue;
    const run = runs.get(JSON.stringify([link.source_id, link.json_pointer]));
    const target = targets.get(key(link.corpus_kind, run.link_domain, run.link_slug));
    if (!target) { link.resolution = 'missing-target'; continue; }
    link.target_source_id = target.source_id;
    if (!run.link_anchor) { link.resolution = 'document'; continue; }
    const anchors = publishedAnchors.get(JSON.stringify([target.source_id, link.locale, run.link_anchor])) ?? [];
    link.resolution = anchors.length === 1 ? 'anchor' : anchors.length ? 'ambiguous-anchor' : 'missing-anchor';
    if (anchors.length === 1) link.target_anchor_ordinal = anchors[0].ordinal;
  }
  return Object.freeze(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, Object.freeze(rows.map(Object.freeze))])));
}
