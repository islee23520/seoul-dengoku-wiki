import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadTrustedRenderer } from './sources.mjs';
import { editDocument } from './document-edit.mjs';
import { readDocument } from './document-read.mjs';
import { mapSingleFileProfiles } from './profiles-relations.mjs';

const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const KIND_BY_PATH = new Map([
  ['lore/characters/Cast-Unaffiliated.json', 'unaffiliated'],
  ['lore/characters/Core-Characters.json', 'core'],
  ...Array.from({ length: 16 }, (_, index) => [`lore/characters/Cast-State-${String(index + 1).padStart(2, '0')}.json`, 'state']),
]);

const structuralKey = (row) => JSON.stringify([row.person_id, row.source_ordinal, row.anchor, row.heading_ko, row.heading_en,
  row.heading_pointer, row.heading_depth, row.node_start, row.node_end]);

/**
 * Sealed envelope edit for character documents. setText/setLocale only: those
 * commands change card text but never headings or node order, so profile
 * structure rows stay valid. Fields are recomputed from the edited document
 * with the trusted renderer and rewritten in the same transaction; profile
 * structure must match exactly or the edit fails. Evidence rows must be
 * untouched by the commands and are asserted unchanged.
 */
export async function editCharacterDocument({ dbPath, documentId, expectedRevision, actor, reason, changes, sourceRoot }) {
  const root = resolve(sourceRoot ?? new URL('../..', import.meta.url).pathname);
  if (changes.some((command) => !['setText', 'setRunText', 'setLocale'].includes(command?.type))) {
    fail('E_CHARACTER_EDITOR_COMMAND', 'setText, setRunText and setLocale are the only supported commands');
  }
  const read = new DatabaseSync(dbPath, { readOnly: true });
  let selection, sourceId, logicalPath, byName, storedProfiles, storedEvidence, rendererSha;
  try {
    selection = { documentId, corpusKind: 'current', domain: 'characters', visibility: 'internal' };
    const document = readDocument(read, selection);
    if (!document) fail('E_DOCUMENT_NOT_FOUND', documentId);
    sourceId = document.readMetadata.source_id;
    logicalPath = document.readMetadata.logical_path ?? read.prepare('SELECT logical_path FROM source_file WHERE source_id=?').get(sourceId).logical_path;
    const kind = KIND_BY_PATH.get(logicalPath);
    if (!kind) fail('E_CHARACTER_EDITOR_SOURCE', logicalPath);
    byName = new Map(read.prepare('SELECT person_id, name FROM person').all().map((row) => [row.name, row]));
    storedProfiles = read.prepare('SELECT * FROM profile WHERE source_id=? ORDER BY source_ordinal').all(sourceId);
    storedEvidence = read.prepare('SELECT * FROM evidence WHERE source_id=? ORDER BY evidence_id').all(sourceId);
    rendererSha = read.prepare("SELECT sha256 FROM source_file WHERE logical_path='scripts/lore-json-render.mjs'").get()?.sha256;
  } finally { read.close(); }
  if (!rendererSha) fail('E_CHARACTER_EDITOR_SOURCE', 'renderer source row missing');
  const { renderLoreMarkdown } = await loadTrustedRenderer({ sourceRoot: root, bundle: { files: [{ logical_path: 'scripts/lore-json-render.mjs', sha256: rendererSha }] } });
  const sync = (db, editedSourceId) => {
    if (editedSourceId !== sourceId) fail('E_CHARACTER_EDITOR_SOURCE', 'unexpected source');
    const after = readDocument(db, selection);
    const file = { source_id: sourceId, logical_path: logicalPath, document: after };
    const { profiles, profileNodes, profileFields } = mapSingleFileProfiles({ file, kind: KIND_BY_PATH.get(logicalPath), byName, renderLoreMarkdown });
    const storedByPerson = new Map(storedProfiles.map((row) => [row.person_id, row]));
    if (profiles.length !== storedProfiles.length) fail('E_CHARACTER_EDITOR_PROFILE_STRUCTURE', 'card count changed');
    const idByPerson = new Map();
    for (const profile of profiles) {
      const stored = storedByPerson.get(profile.person_id);
      if (!stored || structuralKey(profile) !== structuralKey(stored)) fail('E_CHARACTER_EDITOR_PROFILE_STRUCTURE', profile.person_id);
      idByPerson.set(profile.person_id, stored.profile_id);
    }
    db.prepare('DELETE FROM profile_node WHERE source_id=?').run(sourceId);
    db.prepare('DELETE FROM profile_field WHERE source_id=?').run(sourceId);
    const insertNode = db.prepare('INSERT INTO profile_node (profile_id, node_ordinal, source_id, json_pointer) VALUES (?,?,?,?)');
    const insertField = db.prepare('INSERT INTO profile_field (profile_id, field_ordinal, field_kind, key_ko, key_en, value_ko, value_en, source_id, json_pointer) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const row of profileNodes) {
      const pointerIndex = Number(row.json_pointer.split('/')[2]);
      const owner = profiles.find((p) => p.node_start <= pointerIndex && p.node_end > pointerIndex);
      insertNode.run(idByPerson.get(owner.person_id), row.node_ordinal, sourceId, row.json_pointer);
    }
    for (const field of profileFields) {
      const pointerIndex = Number(field.json_pointer.split('/')[2]);
      const owner = profiles.find((p) => p.node_start <= pointerIndex && p.node_end > pointerIndex);
      insertField.run(idByPerson.get(owner.person_id), field.field_ordinal, field.field_kind, field.key_ko, field.key_en, field.value_ko, field.value_en, sourceId, field.json_pointer);
    }
    const afterEvidence = db.prepare('SELECT * FROM evidence WHERE source_id=? ORDER BY evidence_id').all(sourceId);
    if (JSON.stringify(afterEvidence) !== JSON.stringify(storedEvidence)) fail('E_CHARACTER_EDITOR_EVIDENCE', 'evidence rows changed unexpectedly');
  };
  return editDocument({ dbPath, documentId, corpusKind: 'current', domain: 'characters', expectedRevision, actor, reason, changes,
    dependentEditors: { handledTables: ['profile', 'profile_node', 'profile_field', 'evidence'], sync } });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    const flags = { '--db': 'dbPath', '--id': 'documentId', '--revision': 'expectedRevision', '--actor': 'actor', '--reason': 'reason', '--root': 'sourceRoot' };
    const options = {};
    for (let index = 0; index + 1 < args.length; index += 2) {
      if (!flags[args[index]]) fail('E_ARGUMENTS', args[index]);
      options[flags[args[index]]] = args[index + 1];
    }
    let body = '';
    for await (const chunk of process.stdin) body += chunk;
    process.stdout.write(JSON.stringify(await editCharacterDocument({ ...options, changes: JSON.parse(body) })) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: { code: error.code ?? 'E_CHARACTER_EDITOR', message: error.message } }) + '\n');
    process.exitCode = 1;
  }
}
