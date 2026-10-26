import { isDeepStrictEqual } from 'node:util';
import { editDocumentOnConnection } from './document-edit.mjs';
import { readDocument } from './document-read.mjs';

const fail = (message) => { throw Object.assign(new Error(`E_RELATION_EDITOR: ${message}`), { code: 'E_RELATION_EDITOR' }); };

/** Append scalar bilingual relation rows without renumbering existing identities or pointers.
 * Domain projection and the sealed body revision share the document editor's transaction.
 */
export function editRelationDocumentOnConnection(db, options) {
  return editDocumentOnConnection(db, relationDocumentEditOptions(options));
}

export function relationDocumentEditOptions(options) {
  const { changes } = options;
  if (!Array.isArray(changes) || !changes.length || changes.some((c) => c?.type !== 'appendTableRow')) fail('appendTableRow commands required');
  const selection = { documentId: 'DOC:Cast-Relations', corpusKind: 'current', domain: 'characters', visibility: 'internal' };
  return { ...options, ...selection,
    dependentEditors: { handledTables: ['relation', 'evidence'], sync(connection, sourceId) {
      const evidence = connection.prepare('SELECT * FROM evidence WHERE source_id=? ORDER BY evidence_id').all(sourceId);
      const before = connection.prepare('SELECT * FROM relation WHERE source_id=? ORDER BY row_ordinal').all(sourceId);
      const document = readDocument(connection, selection);
      const nodes = connection.prepare('SELECT * FROM text_document_node WHERE source_id=? ORDER BY ordinal').all(sourceId);
      const people = new Map(connection.prepare('SELECT person_id,name FROM person').all().map((p) => [p.name, p.person_id]));
      const known = new Map(before.map((r) => [r.json_pointer, r]));
      const seen = new Set();
      let next = connection.prepare('SELECT coalesce(max(row_ordinal),-1)+1 n FROM relation').get().n;
      let nextId = connection.prepare("SELECT coalesce(max(CAST(substr(relation_id,10) AS INTEGER)),0)+1 n FROM relation WHERE relation_id GLOB 'relation-[0-9]*'").get().n;
      let section = null;
      let appended = 0;
      document.content.forEach((node, nodeIndex) => {
        if (node.kind === 'heading') section = node.anchor;
        if (node.kind !== 'table') return;
        if (node.columns.length !== 4) fail('four-column relation table required');
        node.rows.forEach((cells, rowIndex) => {
          if (cells.length !== 4 || cells.some((c) => typeof c.ko !== 'string' || typeof c.en !== 'string')) fail('four scalar bilingual cells required');
          const pointer = `${nodes[nodeIndex].json_pointer}/rows/${rowIndex}`;
          const fields = { source_id: sourceId, section_anchor: section,
            from_person_id: people.get(cells[0].ko), to_person_id: people.get(cells[2].ko),
            type_ko: cells[1].ko, type_en: cells[1].en, grounds_ko: cells[3].ko, grounds_en: cells[3].en, json_pointer: pointer };
          if (!fields.from_person_id || !fields.to_person_id) fail('unknown person');
          const existing = known.get(pointer);
          if (existing) {
            if (!isDeepStrictEqual({ ...existing }, { relation_id: existing.relation_id, row_ordinal: existing.row_ordinal, ...fields })) fail(`existing projection differs at ${pointer}`);
            seen.add(pointer);
          } else {
            if (!connection.prepare('SELECT 1 FROM relation_type WHERE type_ko=? AND type_en=?').get(fields.type_ko, fields.type_en)) fail('unknown relation type or translation');
            const row = { relation_id: `relation-${String(nextId++).padStart(4, '0')}`, row_ordinal: next++, ...fields };
            const names = Object.keys(row);
            connection.prepare(`INSERT INTO relation(${names}) VALUES(${names.map(() => '?')})`).run(...Object.values(row));
            appended++;
          }
        });
      });
      if (seen.size !== before.length || appended !== changes.length) fail('projection count differs');
      if (!isDeepStrictEqual(connection.prepare('SELECT * FROM evidence WHERE source_id=? ORDER BY evidence_id').all(sourceId), evidence)) fail('evidence changed');
    } },
  };
}
