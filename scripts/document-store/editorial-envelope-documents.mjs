import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Private typed snapshot of two historical editorial authoring envelopes.
// Initialization records supplied bytes. It does not approve, publish, or activate rules.
// Reconstruction uses the text_document content tables only. Empty /data stays an empty object.
// This bounded private reconstructor does not import the public corpus mapper.
// Supplied bytes are validated here, and read-only reopen never parses JSON or opens a source path.
export const INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY = Symbol('internal Editorial-Envelope-Documents');
export const EDITORIAL_ENVELOPE_PATHS = Object.freeze([
  'lore/editorial/Martial-Concept-Design.json',
  'lore/editorial/Tripothon-Return-Relay-Proposal.json',
]);
const SOURCE_IDS = Object.freeze({
  'lore/editorial/Martial-Concept-Design.json': 1,
  'lore/editorial/Tripothon-Return-Relay-Proposal.json': 2,
});
const APPLICATION_ID = 0x45454e56; // EENV
const PATHS = Object.freeze(EDITORIAL_ENVELOPE_PATHS);
const schemaSql = readFileSync(new URL('./editorial-envelope-documents.sql', import.meta.url), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const quote = name => '"' + name + '"';
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === 'string' && value.length > 0;
const sameKeys = (value, keys) => {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
};

const ENVELOPE_KEYS = ['version', 'domain', 'id', 'slug', 'categories', 'status', 'tense', 'provenance', 'source', 'locales', 'content', 'data'];
const TENSE_KEYS = ['en', 'ko'];
const PROVENANCE_KEYS = ['original_anchor', 'original_hash', 'history'];
const SOURCE_KEYS = ['kind', 'refs'];
const LOCALE_HEADER_KEYS = ['title', 'summary', 'tense'];
const NODE_KEYS = {
  heading: ['kind', 'anchor', 'depth', 'text'],
  headingDepthFirst: ['kind', 'depth', 'anchor', 'text'],
  paragraph: ['kind', 'anchor', 'text'],
  table: ['kind', 'anchor', 'columns', 'rows'],
};
const KINDS = new Set(['heading', 'paragraph', 'table']);

function authorize(options = {}) {
  if (!Object.hasOwn(options, 'scope') || options.scope !== 'internal' || options.capability !== INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY) fail('E_PRIVATE');
}

function absolutePath(value) {
  if (typeof value !== 'string' || !isAbsolute(value)) fail('E_EDITORIAL_ENVELOPE_PATH');
}

function sourceSet(sources) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_EDITORIAL_ENVELOPE_SOURCES');
  const keys = Object.keys(sources);
  if (keys.length !== PATHS.length || PATHS.some(path => !Object.hasOwn(sources, path))) fail('E_EDITORIAL_ENVELOPE_SOURCES');
}

function leafOk(value, { allowEmpty }) {
  if (typeof value === 'string') return allowEmpty ? true : value.length > 0;
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(run => {
    if (!plain(run) || !text(run.text)) return false;
    const keys = Object.keys(run);
    if (keys.length === 1 && keys[0] === 'text') return true;
    return keys.length === 2 && keys[0] === 'text' && keys[1] === 'href' && typeof run.href === 'string' && /^https:\/\/\S+$/u.test(run.href);
  });
}

function localizedOk(value, { allowEmpty }) {
  if (!plain(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes('ko') || !keys.includes('en')) return false;
  return ['ko', 'en'].every(locale => leafOk(value[locale], { allowEmpty }));
}

function inspectNode(node) {
  if (!plain(node) || !KINDS.has(node.kind) || !text(node.anchor)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (node.kind === 'heading') {
    if (!sameKeys(node, NODE_KEYS.heading) && !sameKeys(node, NODE_KEYS.headingDepthFirst)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (!Number.isSafeInteger(node.depth) || node.depth < 1 || node.depth > 6) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (!localizedOk(node.text, { allowEmpty: false })) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  } else if (node.kind === 'paragraph') {
    if (!sameKeys(node, NODE_KEYS.paragraph)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (!localizedOk(node.text, { allowEmpty: false })) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  } else if (node.kind === 'table') {
    if (!sameKeys(node, NODE_KEYS.table)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (!Array.isArray(node.columns) || node.columns.length < 1 || !node.columns.every(cell => localizedOk(cell, { allowEmpty: true }))) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (!Array.isArray(node.rows) || node.rows.length < 1) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    for (const row of node.rows) {
      if (!Array.isArray(row) || row.length !== node.columns.length || !row.every(cell => localizedOk(cell, { allowEmpty: true }))) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    }
  } else fail('E_EDITORIAL_ENVELOPE_SHAPE');
}

function inspectDocument(document) {
  if (!plain(document) || !sameKeys(document, ENVELOPE_KEYS)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (document.version !== 1 || document.domain !== 'editorial' || document.status !== 'draft') fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!text(document.id) || !text(document.slug)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!Array.isArray(document.categories) || document.categories.length < 1 || document.categories.some(value => !text(value))) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!plain(document.tense) || !sameKeys(document.tense, TENSE_KEYS)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!['past', 'present'].includes(document.tense.en) || !['past', 'present'].includes(document.tense.ko)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!plain(document.provenance) || !sameKeys(document.provenance, PROVENANCE_KEYS)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!text(document.provenance.original_anchor)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (document.provenance.original_hash !== null) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!Array.isArray(document.provenance.history) || document.provenance.history.some(value => !text(value))) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!plain(document.source) || !sameKeys(document.source, SOURCE_KEYS)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (document.source.kind !== 'original-fiction') fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!Array.isArray(document.source.refs) || document.source.refs.some(value => !text(value))) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  if (!plain(document.locales)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  const localeKeys = Object.keys(document.locales);
  if (localeKeys.length !== 2 || localeKeys.some(key => key !== 'ko' && key !== 'en')) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  for (const locale of localeKeys) {
    const header = document.locales[locale];
    if (!plain(header) || !sameKeys(header, LOCALE_HEADER_KEYS)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (![header.title, header.summary].every(text) || !['past', 'present'].includes(header.tense)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    if (header.tense !== document.tense[locale]) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  }
  if (!Array.isArray(document.content) || document.content.length < 1) fail('E_EDITORIAL_ENVELOPE_SHAPE');
  const anchors = new Set();
  for (const node of document.content) {
    inspectNode(node);
    if (anchors.has(node.anchor)) fail('E_EDITORIAL_ENVELOPE_SHAPE');
    anchors.add(node.anchor);
  }
  if (!plain(document.data) || Object.keys(document.data).length !== 0) fail('E_EDITORIAL_ENVELOPE_SHAPE');
}

function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare('INSERT INTO ' + table + ' (' + columns.map(quote).join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')')
    .run(...columns.map(column => row[column]));
}

function leafText(value) {
  return typeof value === 'string' ? value : value.map(run => run.text).join('');
}

function writeLeaf(db, sourceId, nodePointer, pointer, value) {
  const order = Object.keys(value).join(',');
  for (const locale of Object.keys(value)) {
    const leaf = value[locale];
    const slotPointer = pointer + '/' + locale;
    insert(db, 'text_document_slot', {
      source_id: sourceId,
      json_pointer: slotPointer,
      node_pointer: nodePointer,
      locale,
      representation: typeof leaf === 'string' ? 'string' : 'runs',
      text: leafText(leaf),
      run_count: Array.isArray(leaf) ? leaf.length : 0,
      leaf_key_order: order,
      slot_sha256: sha(JSON.stringify(leaf)),
    });
    if (Array.isArray(leaf)) leaf.forEach((run, ordinal) => {
      const runPointer = slotPointer + '/' + ordinal;
      const keys = Object.keys(run);
      if (keys.length !== 1 && !(keys.length === 2 && keys[1] === 'href')) fail('E_EDITORIAL_ENVELOPE_SHAPE');
      insert(db, 'text_document_run', {
        source_id: sourceId,
        json_pointer: runPointer,
        slot_pointer: slotPointer,
        ordinal,
        text: run.text,
        href: run.href ?? null,
        key_order: keys.join(','),
        run_sha256: sha(JSON.stringify(run)),
      });
      if (run.href) {
        insert(db, 'text_document_link', {
          source_id: sourceId,
          json_pointer: runPointer,
          corpus_kind: 'historical',
          locale,
          resolution: 'external',
          target_source_id: null,
          target_anchor_ordinal: null,
        });
      }
    });
  }
  return order;
}

function writeDocument(db, logicalPath, document) {
  inspectDocument(document);
  const sourceId = SOURCE_IDS[logicalPath];
  insert(db, 'text_document', {
    source_id: sourceId,
    json_pointer: '',
    corpus_kind: 'historical',
    version: document.version,
    domain: document.domain,
    document_id: document.id,
    slug: document.slug,
    status: document.status,
    tense_ko: document.tense.ko,
    tense_en: document.tense.en,
    source_kind: document.source.kind,
    source_hash: null,
    original_anchor: document.provenance.original_anchor,
    original_hash: null,
    data_pointer: '/data',
    data_empty: 1,
    categories_present: 1,
    source_hash_present: 0,
    content_count: document.content.length,
    category_count: document.categories.length,
    ref_count: document.source.refs.length,
    history_count: document.provenance.history.length,
  });
  const localeKeys = Object.keys(document.locales);
  localeKeys.forEach((locale, keyOrdinal) => {
    const header = document.locales[locale];
    insert(db, 'text_document_locale', {
      source_id: sourceId,
      json_pointer: '/locales/' + locale,
      locale,
      title: header.title,
      summary: header.summary,
      tense: header.tense,
      key_ordinal: keyOrdinal,
    });
  });
  document.categories.forEach((category, ordinal) => insert(db, 'text_document_category', {
    source_id: sourceId, json_pointer: '/categories/' + ordinal, ordinal, category,
  }));
  document.source.refs.forEach((reference, ordinal) => insert(db, 'text_document_source_ref', {
    source_id: sourceId, json_pointer: '/source/refs/' + ordinal, ordinal, reference,
  }));
  document.provenance.history.forEach((entry, ordinal) => insert(db, 'text_document_history', {
    source_id: sourceId, json_pointer: '/provenance/history/' + ordinal, ordinal, entry,
  }));
  document.content.forEach((node, ordinal) => {
    const pointer = '/content/' + ordinal;
    const columnCount = node.columns?.length ?? 0;
    const rowCount = node.rows?.length ?? 0;
    insert(db, 'text_document_node', {
      source_id: sourceId,
      json_pointer: pointer,
      ordinal,
      kind: node.kind,
      anchor: node.anchor,
      depth: node.depth ?? null,
      key_order: Object.keys(node).join(','),
      column_count: columnCount,
      row_count: rowCount,
      public_anchor_count: 0,
    });
    if (node.text) writeLeaf(db, sourceId, pointer, pointer + '/text', node.text);
    node.columns?.forEach((cell, cellOrdinal) => {
      const cellPointer = pointer + '/columns/' + cellOrdinal;
      insert(db, 'text_document_table_cell', {
        source_id: sourceId, json_pointer: cellPointer, node_pointer: pointer, row_pointer: null,
        cell_kind: 'column', ordinal: cellOrdinal, key_order: Object.keys(cell).join(','),
        cell_sha256: sha(JSON.stringify(cell)),
      });
      writeLeaf(db, sourceId, pointer, cellPointer, cell);
    });
    node.rows?.forEach((row, rowOrdinal) => {
      const rowPointer = pointer + '/rows/' + rowOrdinal;
      insert(db, 'text_document_table_row', {
        source_id: sourceId, json_pointer: rowPointer, node_pointer: pointer, ordinal: rowOrdinal, cell_count: row.length,
        row_sha256: sha(JSON.stringify(row)),
      });
      row.forEach((cell, cellOrdinal) => {
        const cellPointer = rowPointer + '/' + cellOrdinal;
        insert(db, 'text_document_table_cell', {
          source_id: sourceId, json_pointer: cellPointer, node_pointer: pointer, row_pointer: rowPointer,
          cell_kind: 'body', ordinal: cellOrdinal, key_order: Object.keys(cell).join(','),
          cell_sha256: sha(JSON.stringify(cell)),
        });
        writeLeaf(db, sourceId, pointer, cellPointer, cell);
      });
    });
    insert(db, 'text_document_anchor', {
      source_id: sourceId, json_pointer: pointer + '/anchor', locale: 'ko', ordinal, node_pointer: pointer,
      anchor: node.anchor, anchor_kind: 'authored', published: 0,
    });
    insert(db, 'text_document_anchor', {
      source_id: sourceId, json_pointer: pointer + '/anchor', locale: 'en', ordinal, node_pointer: pointer,
      anchor: node.anchor, anchor_kind: 'authored', published: 0,
    });
  });
}

function ordered(db, sql, params, expectedCount) {
  const rows = db.prepare(sql).all(...params);
  if (rows.length !== expectedCount || rows.some((row, index) => row.ordinal !== index)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  return rows;
}

function owned(rows, nodePointer, expectedCount) {
  const matches = rows.filter(row => row.node_pointer === nodePointer);
  if (matches.length !== expectedCount || matches.some((row, index) => row.ordinal !== index)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  return matches;
}

function restoreLeaf(slots, runs, links, pointer, keyOrder) {
  const locales = keyOrder.split(',');
  if (locales.length !== 2 || locales.some(locale => locale !== 'ko' && locale !== 'en')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const result = {};
  for (const locale of locales) {
    const slot = slots.find(row => row.json_pointer === pointer + '/' + locale);
    if (!slot || slot.locale !== locale) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    if (slot.representation === 'string') {
      if (slot.run_count !== 0) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      if (sha(JSON.stringify(slot.text)) !== slot.slot_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      result[locale] = slot.text;
      continue;
    }
    if (slot.representation !== 'runs') fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    const slotRuns = runs.filter(run => run.slot_pointer === slot.json_pointer);
    if (slotRuns.length !== slot.run_count || slotRuns.some((run, index) => run.ordinal !== index)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    if (slotRuns.map(run => run.text).join('') !== slot.text) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    result[locale] = slotRuns.map(run => {
      const value = { text: run.text };
      if (run.key_order === 'text,href') {
        if (typeof run.href !== 'string' || run.href.length === 0) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
        value.href = run.href;
      } else if (run.key_order !== 'text' || run.href !== null) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      const link = links.find(row => row.json_pointer === run.json_pointer);
      if (value.href) {
        if (!link || link.locale !== locale || link.resolution !== 'external' || link.corpus_kind !== 'historical') fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
        if (link.target_source_id !== null || link.target_anchor_ordinal !== null) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      } else if (link) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      if (sha(JSON.stringify(value)) !== run.run_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
      return value;
    });
    if (sha(JSON.stringify(result[locale])) !== slot.slot_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  }
  return result;
}

function readOne(db, logicalPath, receipt) {
  const sourceId = SOURCE_IDS[logicalPath];
  const documentRow = db.prepare('SELECT * FROM text_document WHERE source_id=?').get(sourceId);
  if (!documentRow || documentRow.corpus_kind !== 'historical' || documentRow.status !== 'draft' || documentRow.data_empty !== 1) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (documentRow.domain !== 'editorial' || documentRow.version !== 1 || documentRow.data_pointer !== '/data') fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (documentRow.categories_present !== 1 || documentRow.source_hash_present !== 0 || documentRow.source_hash !== null || documentRow.original_hash !== null) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const locales = db.prepare('SELECT * FROM text_document_locale WHERE source_id=? ORDER BY key_ordinal').all(sourceId);
  if (locales.length !== 2 || locales.some((row, index) => row.key_ordinal !== index)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const localeTotal = db.prepare('SELECT count(*) AS n FROM text_document_locale').get().n;
  const documentTotal = db.prepare('SELECT count(*) AS n FROM text_document').get().n;
  if (localeTotal !== documentTotal * 2) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (locales.some(row => row.key_ordinal !== undefined && row.tense !== documentRow['tense_' + row.locale])) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const categories = ordered(db, 'SELECT ordinal, category FROM text_document_category WHERE source_id=? ORDER BY ordinal', [sourceId], documentRow.category_count);
  const refs = ordered(db, 'SELECT ordinal, reference FROM text_document_source_ref WHERE source_id=? ORDER BY ordinal', [sourceId], documentRow.ref_count);
  const history = ordered(db, 'SELECT ordinal, entry FROM text_document_history WHERE source_id=? ORDER BY ordinal', [sourceId], documentRow.history_count);
  const nodes = ordered(db, 'SELECT * FROM text_document_node WHERE source_id=? ORDER BY ordinal', [sourceId], documentRow.content_count);
  const total = (table, column) => db.prepare('SELECT coalesce(sum(' + column + '),0) AS n FROM text_document').get().n;
  const count = table => db.prepare('SELECT count(*) AS n FROM ' + table).get().n;
  if (count('text_document_category') !== total('text_document', 'category_count')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (count('text_document_source_ref') !== total('text_document', 'ref_count')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (count('text_document_history') !== total('text_document', 'history_count')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (count('text_document_node') !== total('text_document', 'content_count')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const nodeSum = column => db.prepare('SELECT coalesce(sum(' + column + '),0) AS n FROM text_document_node').get().n;
  if (count('text_document_table_row') !== nodeSum('row_count')) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const rowCells = db.prepare('SELECT coalesce(sum(cell_count),0) AS n FROM text_document_table_row').get().n;
  const columnCells = nodeSum('column_count');
  if (count('text_document_table_cell') !== rowCells + columnCells) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const slotSum = db.prepare('SELECT coalesce(sum(run_count),0) AS n FROM text_document_slot').get().n;
  if (count('text_document_run') !== slotSum) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (count('text_document_anchor') !== count('text_document_node') * 2) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const textNodes = db.prepare("SELECT count(*) AS n FROM text_document_node WHERE kind IN ('heading', 'paragraph')").get().n;
  const slotTotal = textNodes * 2 + columnCells * 2 + rowCells * 2;
  if (count('text_document_slot') !== slotTotal) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const hrefRuns = db.prepare("SELECT count(*) AS n FROM text_document_run WHERE key_order='text,href' AND href IS NOT NULL").get().n;
  if (count('text_document_link') !== hrefRuns) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const slots = db.prepare('SELECT * FROM text_document_slot WHERE source_id=? ORDER BY json_pointer').all(sourceId);
  const runs = db.prepare('SELECT * FROM text_document_run WHERE source_id=? ORDER BY slot_pointer, ordinal').all(sourceId);
  const links = db.prepare('SELECT * FROM text_document_link WHERE source_id=? ORDER BY json_pointer').all(sourceId);
  const tableRows = db.prepare('SELECT * FROM text_document_table_row WHERE source_id=? ORDER BY node_pointer, ordinal').all(sourceId);
  const cells = db.prepare('SELECT * FROM text_document_table_cell WHERE source_id=? ORDER BY node_pointer, ordinal').all(sourceId);
  const anchors = db.prepare('SELECT * FROM text_document_anchor WHERE source_id=? ORDER BY locale, ordinal').all(sourceId);
  const content = nodes.map(node => {
    const authored = anchors.filter(anchor => anchor.node_pointer === node.json_pointer && anchor.anchor_kind === 'authored');
    if (authored.length !== 2 || authored.some(anchor => anchor.anchor !== node.anchor || anchor.published !== 0)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    if (node.public_anchor_count !== 0) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    if (!['heading', 'paragraph', 'table'].includes(node.kind)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    const keys = node.key_order.split(',');
    const result = {};
    for (const key of keys) {
      if (key === 'kind') result.kind = node.kind;
      else if (key === 'anchor') {
        if (authored.some(anchor => anchor.anchor !== node.anchor)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
        result.anchor = authored[0].anchor;
      }
      else if (key === 'depth') {
        if (!Number.isSafeInteger(node.depth)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
        result.depth = node.depth;
      } else if (key === 'text') {
        const slot = slots.find(row => row.node_pointer === node.json_pointer && row.json_pointer.startsWith(node.json_pointer + '/text/'));
        if (!slot?.leaf_key_order) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
        result.text = restoreLeaf(slots, runs, links, node.json_pointer + '/text', slot.leaf_key_order);
      }
      else if (key === 'columns') {
        const columns = owned(cells.filter(cell => cell.cell_kind === 'column'), node.json_pointer, node.column_count);
        result.columns = columns.map(cell => {
          const restored = restoreLeaf(slots, runs, links, cell.json_pointer, cell.key_order);
          if (sha(JSON.stringify(restored)) !== cell.cell_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
          return restored;
        });
      } else if (key === 'rows') {
        const rows = owned(tableRows, node.json_pointer, node.row_count);
        result.rows = rows.map(row => {
          const body = cells.filter(cell => cell.row_pointer === row.json_pointer && cell.cell_kind === 'body');
          if (body.length !== row.cell_count || body.some((cell, index) => cell.ordinal !== index)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
          const restoredRow = body.map(cell => {
            const restored = restoreLeaf(slots, runs, links, cell.json_pointer, cell.key_order);
            if (sha(JSON.stringify(restored)) !== cell.cell_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
            return restored;
          });
          if (sha(JSON.stringify(restoredRow)) !== row.row_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
          return restoredRow;
        });
      } else fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    }
    if (Object.keys(result).join(',') !== node.key_order) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    return result;
  });
  const localeObject = {};
  for (const row of locales) localeObject[row.locale] = { title: row.title, summary: row.summary, tense: row.tense };
  const result = {
    version: documentRow.version,
    domain: documentRow.domain,
    id: documentRow.document_id,
    slug: documentRow.slug,
    categories: categories.map(row => row.category),
    status: documentRow.status,
    tense: { en: documentRow.tense_en, ko: documentRow.tense_ko },
    provenance: {
      original_anchor: documentRow.original_anchor,
      original_hash: null,
      history: history.map(row => row.entry),
    },
    source: { kind: documentRow.source_kind, refs: refs.map(row => row.reference) },
    locales: localeObject,
    content,
    data: {},
  };
  if (sha(JSON.stringify(result)) !== receipt.document_sha256) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const expectedSlots = nodes.reduce((sum, node) => {
    if (node.kind === 'heading' || node.kind === 'paragraph') return sum + 2;
    const bodyCells = cells.filter(cell => cell.node_pointer === node.json_pointer && cell.cell_kind === 'body').length;
    return sum + node.column_count * 2 + bodyCells * 2;
  }, 0);
  if (slots.length !== expectedSlots) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const hrefRunsHere = runs.filter(run => run.href !== null);
  if (links.length !== hrefRunsHere.length) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (links.some(link => !hrefRunsHere.some(run => run.json_pointer === link.json_pointer && run.href))) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  return result;
}

const COUNTS = Object.freeze({
  editorial_envelope_import: 1,
  source_file: 2,
  text_document: 2,
});

function readDocumentsFrom(db) {
  const receipts = db.prepare('SELECT source_id, logical_path, sha256, byte_length, document_sha256 FROM source_file ORDER BY source_id').all();
  if (receipts.length !== PATHS.length) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  for (const path of PATHS) {
    const receipt = receipts.find(row => row.logical_path === path);
    if (!receipt || receipt.source_id !== SOURCE_IDS[path]) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  }
  const documents = new Map();
  for (const path of PATHS) documents.set(path, readOne(db, path, receipts.find(row => row.logical_path === path)));
  for (const [table, expected] of Object.entries(COUNTS)) {
    if (db.prepare('SELECT count(*) AS n FROM ' + table).get().n !== expected) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  }
  const kinds = db.prepare("SELECT DISTINCT kind FROM text_document_node").all();
  if (kinds.some(row => !KINDS.has(row.kind))) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  const links = db.prepare("SELECT l.source_id, l.json_pointer, l.locale, l.resolution, l.target_source_id, l.target_anchor_ordinal, r.text, r.href, n.ordinal AS node_ordinal, r.ordinal AS run_ordinal FROM text_document_link l JOIN text_document_run r USING(source_id, json_pointer) JOIN text_document_slot s ON s.source_id=r.source_id AND s.json_pointer=r.slot_pointer JOIN text_document_node n ON n.source_id=s.source_id AND n.json_pointer=s.node_pointer ORDER BY l.source_id, n.ordinal, l.locale DESC, r.ordinal").all();
  for (const link of links) {
    if (link.resolution !== 'external' || link.target_source_id !== null || link.target_anchor_ordinal !== null) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  }
  if (db.prepare("SELECT count(*) AS n FROM text_document_run WHERE href IS NOT NULL").get().n !== links.length) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  if (db.prepare("SELECT count(*) AS n FROM text_document_run r LEFT JOIN text_document_link l USING(source_id, json_pointer) WHERE (r.href IS NULL) <> (l.json_pointer IS NULL)").get().n !== 0) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
  return documents;
}

/** Caller supplies both logical paths and bytes in memory.
 * Logical paths are never opened. Archived bytes are immutable evidence only.
 * Storage does not change approval and does not activate proposal rules.
 */
export function initializeEditorialEnvelopeDocuments(absoluteNewPath, options = {}) {
  authorize(options);
  absolutePath(absoluteNewPath);
  const { sources, actor, reason } = options;
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_EDITORIAL_ENVELOPE_AUDIT');
  sourceSet(sources);
  const parsed = new Map();
  for (const logicalPath of PATHS) {
    const input = sources[logicalPath];
    if (!input || input.bytes == null || !(input.bytes instanceof Uint8Array)) fail('E_EDITORIAL_ENVELOPE_BYTES');
    const bytes = Buffer.from(input.bytes);
    let document;
    try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { fail('E_EDITORIAL_ENVELOPE_SHAPE'); }
    inspectDocument(document);
    parsed.set(logicalPath, { bytes, document, documentHash: sha(JSON.stringify(document)) });
  }
  closeSync(openSync(absoluteNewPath, 'wx', 0o600));
  let db;
  try {
    db = new DatabaseSync(absoluteNewPath, { enableForeignKeyConstraints: true });
    db.exec('BEGIN IMMEDIATE');
    db.exec(schemaSql);
    db.exec('PRAGMA application_id=' + APPLICATION_ID + '; PRAGMA user_version=1');
    db.prepare('INSERT INTO editorial_envelope_import (singleton, actor, reason, initialized_at) VALUES (1,?,?,?)').run(actor, reason, new Date().toISOString());
    for (const logicalPath of PATHS) {
      const { bytes, document } = parsed.get(logicalPath);
      insert(db, 'source_file', {
        source_id: SOURCE_IDS[logicalPath],
        logical_path: logicalPath,
        media_type: 'application/json',
        sha256: sha(bytes),
        byte_length: bytes.length,
        document_sha256: parsed.get(logicalPath).documentHash,
      });
      insert(db, 'editorial_envelope_archive', {
        source_id: SOURCE_IDS[logicalPath],
        sha256: sha(bytes),
        raw_bytes: bytes,
      });
      writeDocument(db, logicalPath, document);
    }
    if (db.prepare('SELECT count(*) AS n FROM editorial_envelope_archive').get().n !== PATHS.length) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    const documents = readDocumentsFrom(db);
    for (const logicalPath of PATHS) {
      if (JSON.stringify(documents.get(logicalPath)) !== JSON.stringify(parsed.get(logicalPath).document)) fail('E_EDITORIAL_ENVELOPE_INTEGRITY');
    }
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) {
      if (db.isTransaction) db.exec('ROLLBACK');
      db.close();
    }
    unlinkSync(absoluteNewPath);
    throw error;
  }
}

/** Read-only reopen. SELECT reconstruction never opens the logical source, the archive, or JSON.parse. */
export function openEditorialEnvelopeDocuments(databasePath, options = {}) {
  authorize(options);
  absolutePath(databasePath);
  if (!existsSync(databasePath)) fail('E_EDITORIAL_ENVELOPE_PATH');
  if ((statSync(databasePath).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(databasePath, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    db.exec('PRAGMA query_only=ON');
  } catch (error) {
    db.close();
    throw error;
  }
  return Object.freeze({
    close: () => db.close(),
    readDocuments() {
      db.exec('BEGIN');
      try {
        const documents = readDocumentsFrom(db);
        db.exec('COMMIT');
        return documents;
      } catch (error) {
        if (db.isTransaction) db.exec('ROLLBACK');
        throw error;
      }
    },
  });
}
