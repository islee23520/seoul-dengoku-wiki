import { headingId } from '../lore-json-render.mjs';
import { validateStructuralShape as shape, validateStructuralLeaf as leaf, validateStructuralNode as validateNode } from './document-structure.mjs';

const fail = (message, code = 'E_DOCUMENT_COMMAND') => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const array = (v) => Array.isArray(v) && v.length > 0 && Array.from(v.keys()).every((i) => Object.hasOwn(v, i));
const insert = async (tx, table, row) => {
  const names = Object.keys(row);
  await tx.query(`INSERT INTO wiki.${table} (${names.join(',')}) VALUES (${names.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(row));
};
const nodes = (tx, sourceId) => tx.all('SELECT * FROM wiki.text_document_node WHERE source_id=$1 ORDER BY ordinal', [sourceId]);
async function order(tx, sourceId, pointers) {
  const rows = await nodes(tx, sourceId);
  const offset = Math.max(0, ...rows.map((r) => r.ordinal)) + pointers.length + 1;
  await tx.query('UPDATE wiki.text_document_node SET ordinal=ordinal+$1 WHERE source_id=$2', [offset, sourceId]);
  for (const [ordinal, pointer] of pointers.entries()) {
    const result = await tx.query('UPDATE wiki.text_document_node SET ordinal=$1 WHERE source_id=$2 AND json_pointer=$3', [ordinal, sourceId, pointer]);
    if (result.rowCount !== 1) fail('node order changed', 'E_DOCUMENT_INTEGRITY');
  }
}

// The target-link FK is immediate in schema-pg. Deleting this document's own
// link projections before removing an anchor permits them to be reconstructed;
// other documents' immutable proofs must never be removed or silently rewritten.
export async function assertStructuralAuthorityAsync(tx) {
  const authority = await tx.get('SELECT version FROM wiki.document_authority WHERE singleton=1');
  if (!authority || authority.version !== 2) fail('structural authority version 2 required', 'E_DOCUMENT_DATABASE');
  const guard = await tx.get(`SELECT c.convalidated, pg_catalog.pg_get_constraintdef(c.oid) AS definition
    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
    WHERE n.nspname='wiki' AND r.relname='text_document_link' AND c.conname='fk_text_document_link_4' AND c.contype='f'`);
  if (!guard || !guard.convalidated || !/^FOREIGN KEY \(target_source_id, locale, target_anchor_ordinal\) REFERENCES (?:wiki\.)?text_document_anchor\(source_id, locale, ordinal\)/u.test(guard.definition)) fail('validated target anchor foreign key required', 'E_DOCUMENT_DATABASE');
  const triggers = await tx.all(`SELECT t.tgname FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class r ON r.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
    WHERE n.nspname='wiki' AND r.relname='document_node_identity' AND NOT t.tgisinternal AND t.tgenabled IN ('O','A')`);
  if (!['document_node_identity_no_update', 'document_node_identity_no_delete'].every((name) => triggers.some((t) => t.tgname === name))) fail('immutable node identity guards required', 'E_DOCUMENT_DATABASE');
}

async function insertNode(tx, sourceId, node, ordinal) {
  validateNode(node);
  if (await tx.get('SELECT 1 FROM wiki.document_node_identity WHERE source_id=$1 AND node_id=$2', [sourceId, node.anchor])) fail('node ID is permanently reserved');
  const pointer = `/document-nodes/${node.anchor}`;
  const allocated = new Set();
  const emit = async (table, p, fields) => {
    if (!allocated.has(p)) {
      await tx.query("INSERT INTO wiki.source_record (source_id,json_pointer,parent_pointer,ordinal,field_name,json_type) VALUES ($1,$2,NULL,0,NULL,'null')", [sourceId, p]);
      allocated.add(p);
    }
    await insert(tx, table, { source_id: sourceId, json_pointer: p, ...fields });
  };
  const document = await tx.get('SELECT * FROM wiki.text_document WHERE source_id=$1', [sourceId]);
  const requested = new Set([node.anchor, ...(node.publicAnchors ?? [])]);
  for (const a of await tx.all("SELECT anchor FROM wiki.text_document_anchor WHERE source_id=$1 AND anchor_kind IN ('authored','public')", [sourceId])) if (requested.has(a.anchor)) fail('duplicate authored/public anchor');
  await emit('text_document_node', pointer, { ordinal, kind: node.kind, anchor: node.anchor, depth: node.depth ?? null, ordered: node.ordered ? 1 : null, list_start: node.start ?? null, language: node.language ?? null, info: node.info ?? null });
  await insert(tx, 'document_node_identity', { source_id: sourceId, node_id: node.anchor, node_pointer: pointer });
  const slots = async (value, p) => {
    for (const locale of ['ko', 'en']) {
      const v = value[locale], sp = `${p}/${locale}`;
      await emit('text_document_slot', sp, { node_pointer: pointer, locale, representation: typeof v === 'string' ? 'string' : 'runs', text: typeof v === 'string' ? v : v.map((r) => r.text).join('') });
      if (Array.isArray(v)) for (const [i, r] of v.entries()) await emit('text_document_run', `${sp}/${i}`, { slot_pointer: sp, ordinal: i, text: r.text, strong: r.strong ? 1 : null, link_domain: r.link?.domain ?? null, link_slug: r.link?.slug ?? null, link_anchor: r.link?.anchor ?? null, href: r.href ?? null });
    }
  };
  if (node.text) await slots(node.text, `${pointer}/text`);
  for (const [i, v] of (node.items ?? []).entries()) { const p = `${pointer}/items/${i}`; await emit('text_document_list_item', p, { node_pointer: pointer, ordinal: i }); await slots(v, p); }
  for (const [i, v] of (node.columns ?? []).entries()) { const p = `${pointer}/columns/${i}`; await emit('text_document_table_cell', p, { node_pointer: pointer, row_pointer: null, cell_kind: 'column', ordinal: i }); await slots(v, p); }
  for (const [i, row] of (node.rows ?? []).entries()) {
    const rp = `${pointer}/rows/${i}`; await emit('text_document_table_row', rp, { node_pointer: pointer, ordinal: i });
    for (const [j, v] of row.entries()) { const p = `${rp}/${j}`; await emit('text_document_table_cell', p, { node_pointer: pointer, row_pointer: rp, cell_kind: 'body', ordinal: j }); await slots(v, p); }
  }
  for (const locale of ['ko', 'en']) {
    let next = (await tx.get('SELECT coalesce(max(ordinal),-1)+1 n FROM wiki.text_document_anchor WHERE source_id=$1 AND locale=$2', [sourceId, locale])).n;
    const occupied = new Set((await tx.all('SELECT anchor FROM wiki.text_document_anchor WHERE source_id=$1 AND locale=$2 AND published=1', [sourceId, locale])).map((r) => r.anchor));
    const emitAnchor = async (a, p, kind, published) => {
      if (published && occupied.has(a)) fail('published anchor collision', 'E_DOCUMENT_ANCHOR_EDITOR_REQUIRED');
      await emit('text_document_anchor', p, { locale, ordinal: next++, node_pointer: pointer, anchor: a, anchor_kind: kind, published: Number(published) });
      if (published) occupied.add(a);
    };
    const value = node.text?.[locale], flat = typeof value === 'string' ? value : value?.map((r) => r.text).join('');
    if (node.kind === 'heading') await emitAnchor(headingId(flat), `${pointer}/text/${locale}`, 'natural', true);
    if (node.kind === 'paragraph') for (const m of flat.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) await emitAnchor(m[1], `${pointer}/text/${locale}`, 'inline', true);
    const eligible = node.kind === 'heading' || node.publicAnchors?.length || (node.kind === 'paragraph' && document.domain === 'technology' && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(node.anchor));
    await emitAnchor(node.anchor, `${pointer}/anchor`, 'authored', Boolean(eligible && !occupied.has(node.anchor)));
    for (const [i, a] of (node.publicAnchors ?? []).entries()) await emitAnchor(a, `${pointer}/publicAnchors/${i}`, 'public', Boolean(eligible && !occupied.has(a)));
  }
  return pointer;
}

export async function resolveStructuralLinksAsync(tx, sourceId) {
  const rows = await tx.all(`SELECT r.*,s.locale,d.corpus_kind,l.resolution,l.target_source_id,l.target_anchor_ordinal
    FROM wiki.text_document_run r JOIN wiki.text_document_slot s ON s.source_id=r.source_id AND s.json_pointer=r.slot_pointer
    JOIN wiki.text_document d ON d.source_id=r.source_id LEFT JOIN wiki.text_document_link l ON l.source_id=r.source_id AND l.json_pointer=r.json_pointer
    WHERE r.link_domain IS NOT NULL OR r.href IS NOT NULL`);
  for (const r of rows) {
    let resolution = r.href !== null ? 'external' : r.link_domain === 'gdd' ? 'gdd' : 'missing-target';
    let target = null, ordinal = null;
    if (!r.href && r.link_domain !== 'gdd') {
      target = (await tx.get('SELECT source_id FROM wiki.text_document WHERE corpus_kind=$1 AND domain=$2 AND slug=$3', [r.corpus_kind, r.link_domain, r.link_slug]))?.source_id ?? null;
      if (target !== null) {
        resolution = 'document';
        if (r.link_anchor !== null) {
          const anchors = await tx.all('SELECT ordinal FROM wiki.text_document_anchor WHERE source_id=$1 AND locale=$2 AND anchor=$3 AND published=1', [target, r.locale, r.link_anchor]);
          resolution = anchors.length === 1 ? 'anchor' : anchors.length ? 'ambiguous-anchor' : 'missing-anchor';
          if (anchors.length === 1) ordinal = anchors[0].ordinal;
        }
      }
    }
    if (r.source_id !== sourceId) {
      if (resolution !== r.resolution || target !== r.target_source_id || ordinal !== r.target_anchor_ordinal) fail('another document link proof would change', 'E_DOCUMENT_LINK_EDITOR_REQUIRED');
      continue;
    }
    await tx.query(`INSERT INTO wiki.text_document_link VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(source_id,json_pointer)
      DO UPDATE SET resolution=excluded.resolution,target_source_id=excluded.target_source_id,target_anchor_ordinal=excluded.target_anchor_ordinal`, [sourceId, r.json_pointer, r.corpus_kind, r.locale, resolution, target, ordinal]);
  }
}

export async function applyStructuralCommandAsync(tx, sourceId, command) {
  const before = await nodes(tx, sourceId);
  if (command.type === 'appendTableRow') {
    shape(command, ['type', 'nodeId', 'expectedRows', 'row']);
    const node = before.find((r) => r.anchor === command.nodeId);
    if (!node || node.kind !== 'table') fail('existing table node required');
    const rows = await tx.all('SELECT ordinal FROM wiki.text_document_table_row WHERE source_id=$1 AND node_pointer=$2 ORDER BY ordinal', [sourceId, node.json_pointer]);
    if (!Number.isSafeInteger(command.expectedRows) || command.expectedRows < 0 || rows.length !== command.expectedRows || rows.some((r, i) => r.ordinal !== i)) fail('table row count differs');
    const width = (await tx.get("SELECT count(*) n FROM wiki.text_document_table_cell WHERE source_id=$1 AND node_pointer=$2 AND cell_kind='column'", [sourceId, node.json_pointer])).n;
    if (!array(command.row) || command.row.length !== width) fail('row must match table width');
    command.row.forEach((value) => leaf(value, { empty: true, scalar: true }));
    const pointer = `${node.json_pointer}/rows/${rows.length}`;
    const emit = async (table, p, fields) => {
      await tx.query("INSERT INTO wiki.source_record (source_id,json_pointer,parent_pointer,ordinal,field_name,json_type) VALUES ($1,$2,NULL,0,NULL,'null')", [sourceId, p]);
      await insert(tx, table, { source_id: sourceId, json_pointer: p, ...fields });
    };
    await emit('text_document_table_row', pointer, { node_pointer: node.json_pointer, ordinal: rows.length });
    for (const [ordinal, value] of command.row.entries()) {
      const p = `${pointer}/${ordinal}`;
      await emit('text_document_table_cell', p, { node_pointer: node.json_pointer, row_pointer: pointer, cell_kind: 'body', ordinal });
      for (const locale of ['ko', 'en']) await emit('text_document_slot', `${p}/${locale}`, { node_pointer: node.json_pointer, locale, representation: 'string', text: value[locale] });
    }
  } else if (command.type === 'insertNode') {
    shape(command, ['type', 'index', 'node']);
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > before.length) fail('invalid insertion index');
    const pointer = await insertNode(tx, sourceId, command.node, Math.max(-1, ...before.map((r) => r.ordinal)) + 1);
    const pointers = before.map((r) => r.json_pointer); pointers.splice(command.index, 0, pointer);
    await order(tx, sourceId, pointers);
  } else if (command.type === 'deleteNode') {
    shape(command, ['type', 'nodeId']);
    const node = before.find((r) => r.anchor === command.nodeId);
    if (!node) fail('unknown stable node ID');
    if (before.length === 1) fail('document content must remain nonempty');
    const external = await tx.get(`SELECT 1 FROM wiki.text_document_link l JOIN wiki.text_document_anchor a
      ON a.source_id=l.target_source_id AND a.locale=l.locale AND a.ordinal=l.target_anchor_ordinal
      WHERE a.source_id=$1 AND a.node_pointer=$2 AND l.source_id<>$1 LIMIT 1`, [sourceId, node.json_pointer]);
    if (external) fail('another document link proof would change', 'E_DOCUMENT_LINK_EDITOR_REQUIRED');
    await tx.query(`DELETE FROM wiki.text_document_link WHERE source_id=$1 AND (json_pointer IN
      (SELECT r.json_pointer FROM wiki.text_document_run r JOIN wiki.text_document_slot s ON s.source_id=r.source_id AND s.json_pointer=r.slot_pointer WHERE s.source_id=$1 AND s.node_pointer=$2)
      OR (target_source_id=$1 AND EXISTS (SELECT 1 FROM wiki.text_document_anchor a WHERE a.source_id=$1 AND a.node_pointer=$2 AND a.locale=text_document_link.locale AND a.ordinal=text_document_link.target_anchor_ordinal)))`, [sourceId, node.json_pointer]);
    await tx.query('DELETE FROM wiki.text_document_run WHERE source_id=$1 AND slot_pointer IN (SELECT json_pointer FROM wiki.text_document_slot WHERE source_id=$1 AND node_pointer=$2)', [sourceId, node.json_pointer]);
    for (const table of ['text_document_anchor', 'text_document_slot', 'text_document_table_cell', 'text_document_table_row', 'text_document_list_item']) await tx.query(`DELETE FROM wiki.${table} WHERE source_id=$1 AND node_pointer=$2`, [sourceId, node.json_pointer]);
    const deleted = await tx.query('DELETE FROM wiki.text_document_node WHERE source_id=$1 AND json_pointer=$2', [sourceId, node.json_pointer]);
    if (deleted.rowCount !== 1) fail('node disappeared', 'E_DOCUMENT_INTEGRITY');
    await order(tx, sourceId, before.filter((r) => r !== node).map((r) => r.json_pointer));
  } else {
    shape(command, ['type', 'nodeIds']);
    if (!Array.isArray(command.nodeIds) || command.nodeIds.length !== before.length || new Set(command.nodeIds).size !== before.length || command.nodeIds.some((id) => !before.some((r) => r.anchor === id))) fail('nodeIds must be an exact permutation of live IDs');
    await order(tx, sourceId, command.nodeIds.map((id) => before.find((r) => r.anchor === id).json_pointer));
  }
}
