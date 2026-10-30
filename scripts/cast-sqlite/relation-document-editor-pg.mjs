import { isDeepStrictEqual } from 'node:util';
import { readDocumentAsync } from './document-read.mjs';
import { editDocumentPgInTransaction, editDocumentPgOnConnection } from './document-edit-pg.mjs';

const fail = (message) => { throw Object.assign(new Error(`E_RELATION_EDITOR: ${message}`), { code: 'E_RELATION_EDITOR' }); };

export function relationDocumentEditOptionsAsync(options) {
  const { changes } = options;
  if (!Array.isArray(changes) || !changes.length || changes.some((c) => c?.type !== 'appendTableRow')) fail('appendTableRow commands required');
  const selection = { documentId: 'DOC:Cast-Relations', corpusKind: 'current', domain: 'characters', visibility: 'internal' };
  return {
    ...options, ...selection, dependentEditors: {
      handledTables: ['relation', 'evidence'], async sync(tx, sourceId) {
        const evidence = await tx.all('SELECT * FROM wiki.evidence WHERE source_id=$1 ORDER BY evidence_id', [sourceId]);
        const before = await tx.all('SELECT * FROM wiki.relation WHERE source_id=$1 ORDER BY row_ordinal', [sourceId]);
        const document = await readDocumentAsync(tx, selection);
        const nodes = await tx.all('SELECT * FROM wiki.text_document_node WHERE source_id=$1 ORDER BY ordinal', [sourceId]);
        const people = new Map((await tx.all('SELECT person_id,name FROM wiki.person')).map((p) => [p.name, p.person_id]));
        const known = new Map(before.map((r) => [r.json_pointer, r])), seen = new Set();
        let next = (await tx.get('SELECT coalesce(max(row_ordinal),-1)+1 n FROM wiki.relation')).n;
        let nextId = (await tx.get("SELECT coalesce(max(CAST(substr(relation_id,10) AS bigint)),0)+1 n FROM wiki.relation WHERE relation_id ~ '^relation-[0-9]+$'")).n;
        let section = null, appended = 0;
        for (const [nodeIndex, node] of document.content.entries()) {
          if (node.kind === 'heading') section = node.anchor;
          if (node.kind !== 'table') continue;
          if (node.columns.length !== 4) fail('four-column relation table required');
          for (const [rowIndex, cells] of node.rows.entries()) {
            if (cells.length !== 4 || cells.some((c) => typeof c.ko !== 'string' || typeof c.en !== 'string')) fail('four scalar bilingual cells required');
            const pointer = `${nodes[nodeIndex].json_pointer}/rows/${rowIndex}`;
            const fields = { source_id: sourceId, section_anchor: section, from_person_id: people.get(cells[0].ko), to_person_id: people.get(cells[2].ko), type_ko: cells[1].ko, type_en: cells[1].en, grounds_ko: cells[3].ko, grounds_en: cells[3].en, json_pointer: pointer };
            if (!fields.from_person_id || !fields.to_person_id) fail('unknown person');
            const existing = known.get(pointer);
            if (existing) {
              if (!isDeepStrictEqual({ ...existing }, { relation_id: existing.relation_id, row_ordinal: existing.row_ordinal, ...fields })) fail(`existing projection differs at ${pointer}`);
              seen.add(pointer);
            } else {
              if (!await tx.get('SELECT 1 FROM wiki.relation_type WHERE type_ko=$1 AND type_en=$2', [fields.type_ko, fields.type_en])) fail('unknown relation type or translation');
              const row = { relation_id: `relation-${String(nextId++).padStart(4, '0')}`, row_ordinal: next++, ...fields };
              const names = Object.keys(row);
              await tx.query(`INSERT INTO wiki.relation(${names.join(',')}) VALUES(${names.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(row));
              appended++;
            }
          }
        }
        if (seen.size !== before.length || appended !== changes.length) fail('projection count differs');
        if (!isDeepStrictEqual(await tx.all('SELECT * FROM wiki.evidence WHERE source_id=$1 ORDER BY evidence_id', [sourceId]), evidence)) fail('evidence changed');
      }
    }
  };
}
export const editRelationDocumentPgOnConnection = (reader, options) => editDocumentPgOnConnection(reader, relationDocumentEditOptionsAsync(options));
export const editRelationDocumentPgInTransaction = (tx, options) => editDocumentPgInTransaction(tx, relationDocumentEditOptionsAsync(options));
