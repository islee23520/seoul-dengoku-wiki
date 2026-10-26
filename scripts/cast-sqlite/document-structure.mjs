import { headingId } from '../lore-json-render.mjs';

const fail = (message, code = 'E_DOCUMENT_COMMAND') => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const plain = (v) => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const text = (v) => typeof v === 'string' && v.length > 0;
const anchor = (v) => typeof v === 'string' && /^[A-Za-z0-9가-힣][A-Za-z0-9가-힣_-]*$/u.test(v);
const array = (v) => Array.isArray(v) && v.length > 0 && Array.from(v.keys()).every((i) => Object.hasOwn(v, i));
function shape(v, required, optional = []) {
  if (!plain(v) || required.some((k) => !Object.hasOwn(v, k))
    || Object.keys(v).some((k) => ![...required, ...optional].includes(k))) fail('unsupported or missing fields');
}
function leaf(value, { empty = false, scalar = false } = {}) {
  shape(value, ['ko', 'en']);
  for (const v of Object.values(value)) {
    if (typeof v === 'string') { if (!v.length && !empty) fail('nonempty text required'); continue; }
    if (scalar || !array(v)) fail('text or nonempty runs required');
    for (const run of v) {
      shape(run, ['text'], ['strong', 'link', 'href']);
      if (!text(run.text) || (Object.hasOwn(run, 'strong') && run.strong !== true)) fail('invalid text run');
      if (Object.hasOwn(run, 'href') && (typeof run.href !== 'string' || !/^https:\/\/\S+$/u.test(run.href) || Object.hasOwn(run, 'link'))) fail('invalid external link');
      if (Object.hasOwn(run, 'link')) {
        shape(run.link, ['domain', 'slug'], ['anchor']);
        if (!text(run.link.domain) || typeof run.link.slug !== 'string' || !/^[A-Za-z0-9_][A-Za-z0-9_-]*(\/[A-Za-z0-9_][A-Za-z0-9_-]*)?$/u.test(run.link.slug)
          || (Object.hasOwn(run.link, 'anchor') && !anchor(run.link.anchor))) fail('invalid document link');
      }
    }
  }
}
function validateNode(node) {
  const kinds = { rule: [[], []], heading: [['text', 'depth'], []], paragraph: [['text'], []], quote: [['text'], []],
    code: [['language', 'text'], ['info']], list: [['items'], ['ordered', 'start']], table: [['columns', 'rows'], []] };
  if (!plain(node) || !Object.hasOwn(kinds, node.kind)) fail('unsupported node kind');
  const [required, optional] = kinds[node.kind];
  shape(node, ['kind', 'anchor', ...required], ['publicAnchors', ...optional]);
  if (!anchor(node.anchor)) fail('invalid node anchor');
  if (Object.hasOwn(node, 'publicAnchors') && (!array(node.publicAnchors)
    || !node.publicAnchors.every(anchor) || new Set(node.publicAnchors).size !== node.publicAnchors.length)) fail('invalid public anchors');
  if (node.kind === 'heading' && (!Number.isSafeInteger(node.depth) || node.depth < 1 || node.depth > 6)) fail('invalid heading depth');
  if (node.kind === 'code' && (typeof node.language !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/u.test(node.language)
    || (Object.hasOwn(node, 'info') && !text(node.info)))) fail('invalid code metadata');
  if (node.text) leaf(node.text, { scalar: node.kind === 'code' });
  else if (required.includes('text')) fail('text required');
  if (node.kind === 'list') {
    if (!array(node.items) || (Object.hasOwn(node, 'ordered') && node.ordered !== true)
      || (Object.hasOwn(node, 'start') && (!Number.isSafeInteger(node.start) || node.start < 0))) fail('invalid list');
    node.items.forEach((v) => leaf(v));
  }
  if (node.kind === 'table') {
    if (!array(node.columns) || !array(node.rows)) fail('invalid table');
    node.columns.forEach((v) => leaf(v));
    node.rows.forEach((row) => {
      if (!array(row)) fail('nonempty table row required');
      row.forEach((v) => leaf(v, { empty: true }));
    });
  }
}

const insert = (db, table, row) => {
  const names = Object.keys(row);
  db.prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map(() => '?')})`).run(...Object.values(row));
};
const nodes = (db, sourceId) => db.prepare('SELECT * FROM text_document_node WHERE source_id=? ORDER BY ordinal').all(sourceId);
function order(db, sourceId, pointers) {
  const rows = nodes(db, sourceId);
  const offset = Math.max(0, ...rows.map((r) => r.ordinal)) + pointers.length + 1;
  db.prepare('UPDATE text_document_node SET ordinal=ordinal+? WHERE source_id=?').run(offset, sourceId);
  pointers.forEach((pointer, ordinal) => db.prepare('UPDATE text_document_node SET ordinal=? WHERE source_id=? AND json_pointer=?').run(ordinal, sourceId, pointer));
}

/** Only coordinate allocation touches source_record. Null leaves carry no authored values,
 * are never read, and never replace the immutable imported coordinates or archive bytes. */
function insertNode(db, sourceId, node, ordinal) {
  validateNode(node);
  if (db.prepare('SELECT 1 FROM document_node_identity WHERE source_id=? AND node_id=?').get(sourceId, node.anchor)) fail('node ID is permanently reserved');
  const pointer = `/document-nodes/${node.anchor}`;
  const coordinate = (p) => db.prepare(`INSERT INTO source_record
    (source_id,json_pointer,parent_pointer,ordinal,field_name,json_type) VALUES (?,?,NULL,0,NULL,'null')`).run(sourceId, p);
  const allocated = new Set();
  const emit = (table, p, fields) => {
    if (!allocated.has(p)) { coordinate(p); allocated.add(p); }
    insert(db, table, { source_id: sourceId, json_pointer: p, ...fields });
  };
  const document = db.prepare('SELECT * FROM text_document WHERE source_id=?').get(sourceId);
  const requested = new Set([node.anchor, ...(node.publicAnchors ?? [])]);
  for (const a of db.prepare("SELECT anchor FROM text_document_anchor WHERE source_id=? AND anchor_kind IN ('authored','public')").all(sourceId)) {
    if (requested.has(a.anchor)) fail('duplicate authored/public anchor');
  }
  emit('text_document_node', pointer, { ordinal, kind: node.kind, anchor: node.anchor, depth: node.depth ?? null,
    ordered: node.ordered ? 1 : null, list_start: node.start ?? null, language: node.language ?? null, info: node.info ?? null });
  insert(db, 'document_node_identity', { source_id: sourceId, node_id: node.anchor, node_pointer: pointer });
  const slots = (value, p) => {
    for (const locale of ['ko', 'en']) {
      const v = value[locale];
      const sp = `${p}/${locale}`;
      emit('text_document_slot', sp, { node_pointer: pointer, locale, representation: typeof v === 'string' ? 'string' : 'runs',
        text: typeof v === 'string' ? v : v.map((r) => r.text).join('') });
      if (Array.isArray(v)) v.forEach((r, i) => {
        emit('text_document_run', `${sp}/${i}`, { slot_pointer: sp, ordinal: i, text: r.text, strong: r.strong ? 1 : null,
          link_domain: r.link?.domain ?? null, link_slug: r.link?.slug ?? null, link_anchor: r.link?.anchor ?? null, href: r.href ?? null });
      });
    }
  };
  if (node.text) slots(node.text, `${pointer}/text`);
  node.items?.forEach((v, i) => { const p = `${pointer}/items/${i}`; emit('text_document_list_item', p, { node_pointer: pointer, ordinal: i }); slots(v, p); });
  node.columns?.forEach((v, i) => { const p = `${pointer}/columns/${i}`; emit('text_document_table_cell', p, { node_pointer: pointer, row_pointer: null, cell_kind: 'column', ordinal: i }); slots(v, p); });
  node.rows?.forEach((row, i) => {
    const rp = `${pointer}/rows/${i}`;
    emit('text_document_table_row', rp, { node_pointer: pointer, ordinal: i });
    row.forEach((v, j) => { const p = `${rp}/${j}`; emit('text_document_table_cell', p, { node_pointer: pointer, row_pointer: rp, cell_kind: 'body', ordinal: j }); slots(v, p); });
  });
  for (const locale of ['ko', 'en']) {
    let next = db.prepare('SELECT coalesce(max(ordinal),-1)+1 n FROM text_document_anchor WHERE source_id=? AND locale=?').get(sourceId, locale).n;
    const existing = db.prepare('SELECT anchor FROM text_document_anchor WHERE source_id=? AND locale=? AND published=1').all(sourceId, locale);
    const occupied = new Set(existing.map((r) => r.anchor));
    const emitAnchor = (a, p, kind, published) => {
      // Inserting a natural/inline anchor must not steal an existing published identity.
      if (published && occupied.has(a)) fail('published anchor collision', 'E_DOCUMENT_ANCHOR_EDITOR_REQUIRED');
      emit('text_document_anchor', p, { locale, ordinal: next++, node_pointer: pointer, anchor: a, anchor_kind: kind, published: Number(published) });
      if (published) occupied.add(a);
    };
    const value = node.text?.[locale];
    const flat = typeof value === 'string' ? value : value?.map((r) => r.text).join('');
    if (node.kind === 'heading') emitAnchor(headingId(flat), `${pointer}/text/${locale}`, 'natural', true);
    if (node.kind === 'paragraph') for (const m of flat.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) emitAnchor(m[1], `${pointer}/text/${locale}`, 'inline', true);
    const eligible = node.kind === 'heading' || node.publicAnchors?.length || (node.kind === 'paragraph' && document.domain === 'technology' && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(node.anchor));
    emitAnchor(node.anchor, `${pointer}/anchor`, 'authored', Boolean(eligible && !occupied.has(node.anchor)));
    node.publicAnchors?.forEach((a, i) => emitAnchor(a, `${pointer}/publicAnchors/${i}`, 'public', Boolean(eligible && !occupied.has(a))));
  }
  return pointer;
}

/** Resolve this document's outgoing links. Other documents' link proofs cannot be rewritten
 * under this document's CAS; reject edits that would change those proofs instead. */
export function resolveStructuralLinks(db, sourceId) {
  const rows = db.prepare(`SELECT r.*,s.locale,d.corpus_kind,l.resolution,l.target_source_id,l.target_anchor_ordinal
    FROM text_document_run r JOIN text_document_slot s ON s.source_id=r.source_id AND s.json_pointer=r.slot_pointer
    JOIN text_document d ON d.source_id=r.source_id LEFT JOIN text_document_link l ON l.source_id=r.source_id AND l.json_pointer=r.json_pointer
    WHERE r.link_domain IS NOT NULL OR r.href IS NOT NULL`).all();
  for (const r of rows) {
    let resolution = r.href !== null ? 'external' : r.link_domain === 'gdd' ? 'gdd' : 'missing-target';
    let target = null; let ordinal = null;
    if (!r.href && r.link_domain !== 'gdd') {
      target = db.prepare('SELECT source_id FROM text_document WHERE corpus_kind=? AND domain=? AND slug=?').get(r.corpus_kind, r.link_domain, r.link_slug)?.source_id ?? null;
      if (target !== null) {
        resolution = 'document';
        if (r.link_anchor !== null) {
          const anchors = db.prepare('SELECT ordinal FROM text_document_anchor WHERE source_id=? AND locale=? AND anchor=? AND published=1').all(target, r.locale, r.link_anchor);
          resolution = anchors.length === 1 ? 'anchor' : anchors.length ? 'ambiguous-anchor' : 'missing-anchor';
          if (anchors.length === 1) ordinal = anchors[0].ordinal;
        }
      }
    }
    if (r.source_id !== sourceId) {
      if (resolution !== r.resolution || target !== r.target_source_id || ordinal !== r.target_anchor_ordinal) fail('another document link proof would change', 'E_DOCUMENT_LINK_EDITOR_REQUIRED');
      continue;
    }
    db.prepare(`INSERT INTO text_document_link VALUES (?,?,?,?,?,?,?) ON CONFLICT(source_id,json_pointer)
      DO UPDATE SET resolution=excluded.resolution,target_source_id=excluded.target_source_id,target_anchor_ordinal=excluded.target_anchor_ordinal`)
      .run(sourceId, r.json_pointer, r.corpus_kind, r.locale, resolution, target, ordinal);
  }
}

export function applyStructuralCommand(db, sourceId, command) {
  const before = nodes(db, sourceId);
  if (command.type === 'appendTableRow') {
    shape(command, ['type', 'nodeId', 'expectedRows', 'row']);
    const node = before.find((r) => r.anchor === command.nodeId);
    if (!node || node.kind !== 'table') fail('existing table node required');
    const rows = db.prepare('SELECT ordinal FROM text_document_table_row WHERE source_id=? AND node_pointer=? ORDER BY ordinal').all(sourceId, node.json_pointer);
    if (!Number.isSafeInteger(command.expectedRows) || command.expectedRows < 0
      || rows.length !== command.expectedRows || rows.some((r, i) => r.ordinal !== i)) fail('table row count differs');
    const width = db.prepare("SELECT count(*) n FROM text_document_table_cell WHERE source_id=? AND node_pointer=? AND cell_kind='column'").get(sourceId, node.json_pointer).n;
    if (!array(command.row) || command.row.length !== width) fail('row must match table width');
    command.row.forEach((value) => leaf(value, { empty: true, scalar: true }));
    const pointer = `${node.json_pointer}/rows/${rows.length}`;
    const emit = (table, p, fields) => {
      db.prepare(`INSERT INTO source_record
        (source_id,json_pointer,parent_pointer,ordinal,field_name,json_type) VALUES (?,?,NULL,0,NULL,'null')`).run(sourceId, p);
      insert(db, table, { source_id: sourceId, json_pointer: p, ...fields });
    };
    emit('text_document_table_row', pointer, { node_pointer: node.json_pointer, ordinal: rows.length });
    command.row.forEach((value, ordinal) => {
      const p = `${pointer}/${ordinal}`;
      emit('text_document_table_cell', p, { node_pointer: node.json_pointer, row_pointer: pointer, cell_kind: 'body', ordinal });
      for (const locale of ['ko', 'en']) emit('text_document_slot', `${p}/${locale}`, {
        node_pointer: node.json_pointer, locale, representation: 'string', text: value[locale],
      });
    });
  } else if (command.type === 'insertNode') {
    shape(command, ['type', 'index', 'node']);
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > before.length) fail('invalid insertion index');
    const pointer = insertNode(db, sourceId, command.node, Math.max(-1, ...before.map((r) => r.ordinal)) + 1);
    const pointers = before.map((r) => r.json_pointer); pointers.splice(command.index, 0, pointer);
    order(db, sourceId, pointers);
  } else if (command.type === 'deleteNode') {
    shape(command, ['type', 'nodeId']);
    const node = before.find((r) => r.anchor === command.nodeId);
    if (!node) fail('unknown stable node ID');
    if (before.length === 1) fail('document content must remain nonempty');
    // Deferred FKs allow self-links to be resolved after all commands, without ever disabling constraints.
    db.exec('PRAGMA defer_foreign_keys=ON');
    db.prepare(`DELETE FROM text_document_link WHERE source_id=? AND json_pointer IN
      (SELECT r.json_pointer FROM text_document_run r JOIN text_document_slot s ON s.source_id=r.source_id AND s.json_pointer=r.slot_pointer WHERE s.source_id=? AND s.node_pointer=?)`).run(sourceId, sourceId, node.json_pointer);
    db.prepare(`DELETE FROM text_document_run WHERE source_id=? AND slot_pointer IN
      (SELECT json_pointer FROM text_document_slot WHERE source_id=? AND node_pointer=?)`).run(sourceId, sourceId, node.json_pointer);
    for (const table of ['text_document_anchor', 'text_document_slot', 'text_document_table_cell', 'text_document_table_row', 'text_document_list_item']) {
      db.prepare(`DELETE FROM ${table} WHERE source_id=? AND node_pointer=?`).run(sourceId, node.json_pointer);
    }
    db.prepare('DELETE FROM text_document_node WHERE source_id=? AND json_pointer=?').run(sourceId, node.json_pointer);
    order(db, sourceId, before.filter((r) => r !== node).map((r) => r.json_pointer));
  } else {
    shape(command, ['type', 'nodeIds']);
    if (!Array.isArray(command.nodeIds) || command.nodeIds.length !== before.length || new Set(command.nodeIds).size !== before.length
      || command.nodeIds.some((id) => !before.some((r) => r.anchor === id))) fail('nodeIds must be an exact permutation of live IDs');
    order(db, sourceId, command.nodeIds.map((id) => before.find((r) => r.anchor === id).json_pointer));
  }
}
