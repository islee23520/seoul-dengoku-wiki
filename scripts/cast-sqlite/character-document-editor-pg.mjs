import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { loadTrustedRenderer } from './sources.mjs';
import { readDocumentAsync } from './document-read.mjs';
import { mapSingleFileProfiles } from './profiles-relations.mjs';
import { editDocumentPgInTransaction } from './document-edit-pg.mjs';

const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const KIND_BY_PATH = new Map([
  ['lore/characters/Cast-Unaffiliated.json', 'unaffiliated'],
  ['lore/characters/Core-Characters.json', 'core'],
  ...Array.from({ length: 16 }, (_, i) => [`lore/characters/Cast-State-${String(i + 1).padStart(2, '0')}.json`, 'state']),
]);
const structuralKey = (row) => JSON.stringify([row.person_id, row.source_ordinal, row.anchor, row.heading_ko, row.heading_en, row.heading_pointer, row.heading_depth, row.node_start, row.node_end]);
const retirementRows = (tx, sourceId) => tx.all('SELECT * FROM wiki.retirement_prose WHERE source_id=$1 ORDER BY source_pointer COLLATE "C"', [sourceId]);
function assertRetirementProjection(document, rows) {
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  for (const row of rows) {
    if (hash(row.predecessor_text) !== row.predecessor_sha256 || hash(row.current_text) !== row.current_sha256) fail('E_RETIREMENT_PROSE', 'retirement ledger hash mismatch');
    const value = row.source_pointer.split('/').slice(1).reduce((object, key) => object?.[key], document);
    if (value !== row.predecessor_text) fail('E_RETIREMENT_PROSE_PREDECESSOR', 'retirement prose predecessor changed');
  }
}

export async function editCharacterDocumentPgInTransaction(tx, { documentId, expectedRevision, expectedCurrentSemanticSha256, expectedSemanticSha256, actor, reason, changes, sourceRoot }) {
  if (!Array.isArray(changes) || changes.some((command) => !['setText', 'setRunText', 'setLocale'].includes(command?.type))) fail('E_CHARACTER_EDITOR_COMMAND', 'setText, setRunText and setLocale are the only supported commands');
  try {
    if (!await tx.get('SELECT singleton FROM wiki.document_authority WHERE singleton=1 FOR UPDATE')) fail('E_DOCUMENT_DATABASE', 'document authority missing');
  } catch (error) {
    if (error.code === '40001' || error.code === '40P01') fail('E_REVISION_CONFLICT', 'concurrent authoring transaction; refresh the head before editing');
    throw error;
  }
  const selection = { documentId, corpusKind: 'current', domain: 'characters', visibility: 'internal' };
  const document = await readDocumentAsync(tx, selection);
  if (!document) fail('E_DOCUMENT_NOT_FOUND', documentId);
  const sourceId = document.readMetadata.source_id;
  const logicalPath = document.readMetadata.logical_path ?? (await tx.get('SELECT logical_path FROM wiki.source_file WHERE source_id=$1', [sourceId])).logical_path;
  const kind = KIND_BY_PATH.get(logicalPath);
  if (!kind) fail('E_CHARACTER_EDITOR_SOURCE', logicalPath);
  const byName = new Map((await tx.all('SELECT person_id,name FROM wiki.person')).map((row) => [row.name, row]));
  const storedProfiles = await tx.all('SELECT * FROM wiki.profile WHERE source_id=$1 ORDER BY source_ordinal', [sourceId]);
  const storedEvidence = await tx.all('SELECT * FROM wiki.evidence WHERE source_id=$1 ORDER BY evidence_id', [sourceId]);
  const retirement = await retirementRows(tx, sourceId);
  assertRetirementProjection(document, retirement);
  const rendererSha = (await tx.get("SELECT sha256 FROM wiki.source_file WHERE logical_path='scripts/lore-json-render.mjs'"))?.sha256;
  if (!rendererSha) fail('E_CHARACTER_EDITOR_SOURCE', 'renderer source row missing');
  const root = resolve(sourceRoot ?? new URL('../..', import.meta.url).pathname);
  const { renderLoreMarkdown } = await loadTrustedRenderer({ sourceRoot: root, bundle: { files: [{ logical_path: 'scripts/lore-json-render.mjs', sha256: rendererSha }] } });
  const sync = async (connection, editedSourceId) => {
    if (editedSourceId !== sourceId) fail('E_CHARACTER_EDITOR_SOURCE', 'unexpected source');
    const after = await readDocumentAsync(connection, selection);
    if (!isDeepStrictEqual(await retirementRows(connection, sourceId), retirement)) fail('E_RETIREMENT_PROSE', 'retirement ledger changed');
    assertRetirementProjection(after, retirement);
    const { profiles, profileNodes, profileFields } = mapSingleFileProfiles({ file: { source_id: sourceId, logical_path: logicalPath, document: after }, kind, byName, renderLoreMarkdown });
    const storedByPerson = new Map(storedProfiles.map((row) => [row.person_id, row]));
    if (profiles.length !== storedProfiles.length) fail('E_CHARACTER_EDITOR_PROFILE_STRUCTURE', 'card count changed');
    const idByPerson = new Map();
    for (const profile of profiles) {
      const stored = storedByPerson.get(profile.person_id);
      if (!stored || structuralKey(profile) !== structuralKey(stored)) fail('E_CHARACTER_EDITOR_PROFILE_STRUCTURE', profile.person_id);
      idByPerson.set(profile.person_id, stored.profile_id);
    }
    await connection.query('DELETE FROM wiki.profile_node WHERE source_id=$1', [sourceId]);
    await connection.query('DELETE FROM wiki.profile_field WHERE source_id=$1', [sourceId]);
    for (const row of profileNodes) {
      const pointerIndex = Number(row.json_pointer.split('/')[2]);
      const owner = profiles.find((p) => p.node_start <= pointerIndex && p.node_end > pointerIndex);
      await connection.query('INSERT INTO wiki.profile_node (profile_id,node_ordinal,source_id,json_pointer) VALUES ($1,$2,$3,$4)', [idByPerson.get(owner.person_id), row.node_ordinal, sourceId, row.json_pointer]);
    }
    for (const field of profileFields) {
      const pointerIndex = Number(field.json_pointer.split('/')[2]);
      const owner = profiles.find((p) => p.node_start <= pointerIndex && p.node_end > pointerIndex);
      await connection.query('INSERT INTO wiki.profile_field (profile_id,field_ordinal,field_kind,key_ko,key_en,value_ko,value_en,source_id,json_pointer) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [idByPerson.get(owner.person_id), field.field_ordinal, field.field_kind, field.key_ko, field.key_en, field.value_ko, field.value_en, sourceId, field.json_pointer]);
    }
    if (JSON.stringify(await connection.all('SELECT * FROM wiki.evidence WHERE source_id=$1 ORDER BY evidence_id', [sourceId])) !== JSON.stringify(storedEvidence)) fail('E_CHARACTER_EDITOR_EVIDENCE', 'evidence rows changed unexpectedly');
  };
  return editDocumentPgInTransaction(tx, { documentId, corpusKind: 'current', domain: 'characters', expectedRevision, expectedCurrentSemanticSha256, expectedSemanticSha256, actor, reason, changes, dependentEditors: { handledTables: ['profile', 'profile_node', 'profile_field', 'evidence', 'retirement_prose'], sync } });
}
export const editCharacterDocumentPgOnConnection = (reader, options) => reader.transaction((tx) => editCharacterDocumentPgInTransaction(tx, options));
