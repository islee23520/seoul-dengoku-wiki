import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { applySchema, openReadOnly } from './db.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { readDocument } from './document-read.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';
import { initializeDocumentAuthority, editDocument, editDocumentOnConnection, readDocumentRevision } from './document-edit.mjs';

const selection = { documentId: 'fixture', corpusKind: 'example', visibility: 'internal' };
const original = () => ({ version: 1, domain: 'technology', id: 'fixture', slug: 'Fixture', status: 'approved',
  tense: { ko: 'present', en: 'past' }, source: { kind: 'observed', refs: ['fixture-ref'] },
  provenance: { original_anchor: 'fixture', original_hash: null, history: [] },
  locales: { ko: { title: 'Title', summary: 'Summary', tense: 'present' }, en: { title: 'English', summary: 'Summary', tense: 'past' } },
  content: [{ kind: 'paragraph', anchor: 'stable', text: { ko: 'before', en: 'original' } },
    { kind: 'list', anchor: 'list', ordered: true, start: 0, items: [{ ko: [{ text: 'one', strong: true }, { text: 'two', href: 'https://example.org' }], en: 'item' }] }],
  data: { constraint: 'typed immutable domain' } });

function fixture(t, { document = original(), companions = [], legacy = false } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'document-edit-'));
  const dbPath = join(directory, 'authority.sqlite');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  applySchema(db);
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true, force: true }); });
  const insert = (table, rows) => {
    if (!rows.length) return;
    const names = Object.keys(rows[0]);
    const statement = db.prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map(() => '?')})`);
    for (const row of rows) statement.run(...names.map((name) => row[name]));
  };
  const bytes = Buffer.from('immutable non-JSON archive');
  const files = [document, ...companions].map((d, i) => {
    const source_id = i + 1;
    const logical_path = `/does-not-exist-${source_id}.json`;
    db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(source_id, logical_path, 'application/json', sha256(bytes), bytes.length, bytes);
    insert('source_record', flattenJson(d).map((r) => ({ source_id, ...r })));
    return { source_id, document: d, logical_path, corpus_kind: 'example', content_policy: 'local-corpus' };
  });
  for (const [table, rows] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, rows);
  const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] };
  for (const [table, rows] of Object.entries(mapTextData({ files, bundle }))) insert(table, rows);
  assert.throws(() => initializeDocumentAuthority(db, { actor: 'test', reason: 'import', validatedSourceIds: [] }), { code: 'E_DOCUMENT_ATTESTATION' });
  // Emulate the old authority DDL: revision-local keys, but FKs still target current rows.
  const bootstrap = legacy ? new Proxy(db, { get(target, property) {
    if (property === 'exec') return (sql) => {
      if (sql.includes('CREATE TABLE document_authority (')) sql = sql.replace('CHECK(version=2)', 'CHECK(version=1)')
        .replace('VALUES(1,2,0)', 'VALUES(1,1,0)')
        .replace('FOREIGN KEY(source_id,node_pointer) REFERENCES source_record', 'FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node');
      if (sql.startsWith('CREATE TABLE document_revision_text_')) sql = sql.replace(
        /FOREIGN KEY\(revision_id,([^)]+)\) REFERENCES document_revision_(text_\w+|link_target)\(revision_id,([^)]+)\)/gu,
        (_, local, table, remote) => `FOREIGN KEY(${local}) REFERENCES ${table === 'link_target' ? 'text_document_anchor' : table}(${remote})`);
      return target.exec(sql);
    };
    const value = Reflect.get(target, property, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } }) : db;
  const [{ revision }] = initializeDocumentAuthority(bootstrap, { actor: 'test', reason: 'validated import', validatedSourceIds: files.map((f) => f.source_id) });
  if (legacy) db.exec('DROP TABLE document_revision_link_target');
  return { db, dbPath, revision, bytes };
}
const command = { type: 'setText', nodeId: 'stable', slot: 'text/ko', value: 'after' };
const edit = (f, changes = [command], expectedRevision = f.revision) => editDocumentOnConnection(f.db,
  { ...selection, expectedRevision, actor: 'author', reason: 'typed edit', changes });
const typedOnly = (db) => ({ prepare(sql) { assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b/iu); return db.prepare(sql); } });

test('real typed authoring survives reopen; old normalized revision renders without archive or JSON', (t) => {
  const f = fixture(t);
  const beforeRecords = f.db.prepare('SELECT * FROM source_record ORDER BY json_pointer').all();
  const result = edit(f, [command, { type: 'setRunText', nodeId: 'list', slot: 'items/0/ko', ordinal: 0, value: 'edited' },
    { type: 'setLocale', locale: 'en', field: 'summary', value: 'new summary' }]);
  assert.notEqual(result.revision, f.revision);
  assert.deepEqual(f.db.prepare('SELECT * FROM source_record ORDER BY json_pointer').all(), beforeRecords);
  assert.deepEqual(Buffer.from(f.db.prepare('SELECT raw_bytes FROM source_file').get().raw_bytes), f.bytes);
  f.db.close();
  const reopened = openReadOnly(f.dbPath);
  try {
    const current = readDocument(typedOnly(reopened), selection);
    assert.equal(current.content[0].text.ko, 'after');
    assert.equal(current.status, 'draft');
    assert.equal(current.content[1].items[0].ko[0].text, 'edited');
    assert.equal(current.content[1].items[0].ko[0].strong, true);
    assert.equal(current.content[1].start, 0);
    assert.equal(current.locales.en.summary, 'new summary');
    assert.deepEqual(current.data, original().data);
    assert.equal(Object.hasOwn(current.source, 'hash'), false);
    assert.match(renderLoreMarkdown(current, 'ko'), /after/u);
    const old = readDocumentRevision(typedOnly(reopened), { ...selection, revision: f.revision });
    assert.deepEqual(old, original());
    assert.equal(renderLoreMarkdown(old, 'en'), renderLoreMarkdown(original(), 'en'));
    assert.deepEqual(readDocumentRevision(typedOnly(reopened), { ...selection, revision: result.revision }), current);
  } finally { reopened.close(); }
});

test('stale heads, domain/approval/structure commands and mid-edit errors rollback all typed rows and history', (t) => {
  const f = fixture(t);
  const snapshot = () => f.db.prepare('SELECT * FROM document_revision ORDER BY revision_id').all();
  const before = snapshot();
  for (const [invalid, code] of [
    [{ type: 'setData', value: { constraint: 'changed' } }, 'E_DOCUMENT_DOMAIN_EDITOR_REQUIRED'],
    [{ type: 'setDomain', value: 'culture' }, 'E_DOCUMENT_DOMAIN_EDITOR_REQUIRED'],
    [{ type: 'setStatus', value: 'approved' }, 'E_DOCUMENT_APPROVAL_REQUIRED'],
    [{ type: 'insertNode' }, 'E_DOCUMENT_COMMAND'],
    [{ ...command, value: '<a id="new-anchor"></a>' }, 'E_DOCUMENT_ANCHOR_EDITOR_REQUIRED'],
    [{ ...command, unexpected: true }, 'E_DOCUMENT_COMMAND'],
  ]) {
    assert.throws(() => edit(f, [command, invalid]), { code });
    assert.deepEqual(snapshot(), before);
    assert.deepEqual(readDocument(f.db, selection), original());
    assert.equal(f.db.prepare('SELECT sequence FROM document_authority').get().sequence, 0);
  }
  const first = edit(f);
  assert.throws(() => edit(f), { code: 'E_REVISION_CONFLICT' });
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_revision').get().n, 2);
  assert.equal(f.db.prepare('SELECT revision_id FROM document_head').get().revision_id, first.revision);
  // A synchronous failure after history insertion must roll back current content and the new revision.
  f.db.exec("CREATE TRIGGER fail_head BEFORE UPDATE ON document_head BEGIN SELECT RAISE(ABORT,'injected head failure'); END");
  assert.throws(() => edit(f, [{ ...command, value: 'never visible' }], first.revision), /injected head failure/u);
  assert.equal(readDocument(f.db, selection).content[0].text.ko, 'after');
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_revision').get().n, 2);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('immutable evidence/history and exact typed constraints reject SQL mutations', (t) => {
  const f = fixture(t);
  for (const table of ['source_file', 'source_record', 'document_revision', 'document_revision_text_document', 'document_revision_text_document_slot', 'document_node_identity']) {
    assert.throws(() => f.db.exec(`DELETE FROM ${table}`), /immutable/u);
  }
  assert.throws(() => f.db.exec("UPDATE source_file SET raw_bytes=raw_bytes"), /immutable/u);
  assert.throws(() => f.db.exec("UPDATE document_revision_text_document_slot SET text='bad'"), /immutable/u);
  assert.throws(() => f.db.prepare(`INSERT INTO document_revision_text_document_category
    VALUES (?,?,?, ?,?)`).run(f.revision, 1, '/source/refs/0', 0, 'appended'), /immutable committed typed history/u);
  const definition = f.db.prepare("SELECT sql FROM sqlite_schema WHERE name='document_revision_text_document_slot'").get().sql;
  assert.match(definition, /CHECK\(representation IN \('string','runs'\)\)/u);
  assert.match(definition, /PRIMARY KEY\(revision_id,source_id,json_pointer\)/u);
  assert.throws(() => initializeDocumentAuthority(f.db, { actor: 'a', reason: 'r', validatedSourceIds: [1] }), { code: 'E_DOCUMENT_INITIALIZED' });
});

test('current typed drift cannot be laundered into a new authenticated revision', (t) => {
  const f = fixture(t);
  f.db.exec("UPDATE text_document_locale SET summary='uncommitted drift' WHERE locale='ko'");
  assert.throws(() => edit(f), { code: 'E_DOCUMENT_INTEGRITY' });
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_revision').get().n, 1);
});

test('typed domain text edits preserve old domain history and reject untyped fields atomically', (t) => {
  const f = fixture(t);
  const before = readDocument(typedOnly(f.db), selection);
  const sourceRows = f.db.prepare('SELECT * FROM source_record ORDER BY json_pointer').all();
  const result = edit(f, [{ type: 'setDomainText', field: 'constraint', value: 'new typed constraint' }]);
  assert.equal(readDocument(typedOnly(f.db), selection).data.constraint, 'new typed constraint');
  assert.equal(readDocument(typedOnly(f.db), selection).status, 'draft');
  assert.deepEqual(readDocumentRevision(typedOnly(f.db), { ...selection, revision: f.revision }), before);
  assert.equal(readDocumentRevision(typedOnly(f.db), { ...selection, revision: result.revision }).data.constraint, 'new typed constraint');
  assert.deepEqual(f.db.prepare('SELECT * FROM source_record ORDER BY json_pointer').all(), sourceRows);
  for (const invalid of [
    { type: 'setDomainText', field: undefined, value: 'missing field' },
    { type: 'setDomainText', field: 'soul', value: 'unknown field' },
    { type: 'setDomainText', field: 'constraint', value: { text: 'not a string' } },
    { type: 'setDomainText', field: 'constraint', value: 'changed', table: 'source_file' },
  ]) {
    assert.throws(() => edit(f, [{ ...command, value: 'must roll back' }, invalid], result.revision), { code: 'E_DOCUMENT_COMMAND' });
    assert.equal(readDocument(typedOnly(f.db), selection).content[0].text.ko, 'before');
    assert.equal(f.db.prepare('SELECT count(*) n FROM document_revision').get().n, 2);
  }
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('held writer produces explicit busy failure and filesystem API edits existing authority only', (t) => {
  const f = fixture(t);
  const second = new DatabaseSync(f.dbPath, { enableForeignKeyConstraints: true });
  try {
    f.db.exec('BEGIN IMMEDIATE');
    assert.throws(() => editDocumentOnConnection(second, { ...selection, expectedRevision: f.revision, actor: 'a', reason: 'r', changes: [command] }), { code: 'E_DOCUMENT_BUSY' });
    f.db.exec('ROLLBACK');
    const result = editDocument({ dbPath: f.dbPath, ...selection, expectedRevision: f.revision, actor: 'a', reason: 'r', changes: [command] });
    assert.equal(readDocumentRevision(second, { ...selection, revision: result.revision }).content[0].text.ko, 'after');
  } finally { if (f.db.isTransaction) f.db.exec('ROLLBACK'); second.close(); }
});

test('every reader node kind inserts, reorders and deletes with independent reopened typed history', (t) => {
  const f = fixture(t);
  const schemas = f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name LIKE 'text_%' ORDER BY name").all();
  const imported = f.db.prepare('SELECT * FROM source_record ORDER BY json_pointer').all();
  const identities = f.db.prepare('SELECT * FROM document_node_identity ORDER BY node_id').all();
  const bilingual = (value) => ({ ko: value, en: value });
  const added = [
    { kind: 'heading', anchor: 'heading', depth: 2, publicAnchors: ['heading-alias'], text: bilingual('A heading') },
    { kind: 'paragraph', anchor: 'paragraph-new', text: bilingual([{ text: 'go', strong: true, link: { domain: 'technology', slug: 'Fixture', anchor: 'heading-alias' } }]) },
    { kind: 'quote', anchor: 'quote', text: bilingual('Quoted') },
    { kind: 'rule', anchor: 'rule', publicAnchors: ['rule-alias'] },
    { kind: 'code', anchor: 'code', language: 'js', info: 'example', text: bilingual('const x = 1;') },
    { kind: 'list', anchor: 'new-list', ordered: true, start: 0, items: [bilingual([{ text: 'external', href: 'https://example.org/new' }]), bilingual('second')] },
    { kind: 'table', anchor: 'table', columns: [bilingual('Header')], rows: [[bilingual('')], [bilingual([{ text: 'Cell', strong: true }])]] },
  ];
  const inserted = edit(f, added.map((node, index) => ({ type: 'insertNode', index, node })));
  const afterInsert = readDocument(f.db, selection);
  assert.deepEqual(afterInsert.content, [...added, ...original().content]);
  assert.equal(afterInsert.status, 'draft');
  assert.equal(f.db.prepare("SELECT count(*) n FROM text_document_link WHERE resolution='anchor'").get().n, 2);
  const reorderedIds = afterInsert.content.map((n) => n.anchor).reverse();
  const reordered = edit(f, [{ type: 'reorderNodes', nodeIds: reorderedIds },
    { type: 'setText', nodeId: 'stable', slot: 'text/en', value: 'still the same identity' }], inserted.revision);
  const afterReorder = readDocument(f.db, selection);
  assert.deepEqual(afterReorder.content.map((n) => n.anchor), reorderedIds);
  for (const identity of identities) assert.deepEqual(f.db.prepare('SELECT * FROM document_node_identity WHERE source_id=? AND node_id=?').get(identity.source_id, identity.node_id), identity);
  const deleted = edit(f, added.map((n) => ({ type: 'deleteNode', nodeId: n.anchor })), reordered.revision);
  const afterDelete = readDocument(f.db, selection);
  assert.deepEqual(afterDelete.content.map((n) => n.anchor), ['list', 'stable']);
  assert.throws(() => edit(f, [{ type: 'insertNode', index: 0, node: added[0] }], deleted.revision), { code: 'E_DOCUMENT_COMMAND' });
  for (const row of imported) assert.deepEqual(f.db.prepare('SELECT * FROM source_record WHERE source_id=? AND json_pointer=?').get(row.source_id, row.json_pointer), row);
  const allocations = f.db.prepare("SELECT * FROM source_record WHERE json_pointer LIKE '/document-nodes/%'").all();
  assert.ok(allocations.length > 0);
  assert.ok(allocations.every((r) => r.json_type === 'null' && r.text_value === null && r.integer_value === null && r.real_value === null && r.boolean_value === null));
  assert.deepEqual(f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name LIKE 'text_%' ORDER BY name").all(), schemas);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(f.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  f.db.close();
  const reopened = openReadOnly(f.dbPath);
  try {
    const db = typedOnly(reopened);
    assert.deepEqual(readDocument(db, selection), afterDelete);
    for (const [revision, expected] of [[f.revision, original()], [inserted.revision, afterInsert], [reordered.revision, afterReorder], [deleted.revision, afterDelete]]) {
      const document = readDocumentRevision(db, { ...selection, revision });
      assert.deepEqual(document, expected);
      for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(document, locale), renderLoreMarkdown(expected, locale));
    }
  } finally { reopened.close(); }
});

test('structural errors and post-history failure roll back coordinates, identities, order and CAS', (t) => {
  const f = fixture(t);
  const node = { kind: 'rule', anchor: 'inserted' };
  const insert = { type: 'insertNode', index: 1, node };
  const snapshot = () => Object.fromEntries(['source_record', 'document_node_identity', 'document_revision', 'text_document_node', 'text_document_anchor', 'document_head', 'document_authority']
    .map((table) => [table, f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
  const before = snapshot();
  for (const bad of [
    { type: 'insertNode' }, { ...insert, index: -1 }, { ...insert, index: 20 }, { ...insert, node: { ...node, extra: true } },
    { ...insert, node: { kind: 'heading', anchor: 'h', text: { ko: 'h', en: 'h' } } },
    { ...insert, node: { kind: 'paragraph', anchor: 'p', text: { ko: 'missing English' } } },
    { ...insert, node: { kind: 'list', anchor: 'sparse', items: new Array(2) } },
    { type: 'deleteNode', nodeId: 'absent' }, { type: 'reorderNodes', nodeIds: ['stable', 'stable'] },
    { type: 'reorderNodes', nodeIds: ['list'] },
  ]) {
    assert.throws(() => edit(f, [insert, bad]), { code: 'E_DOCUMENT_COMMAND' });
    assert.deepEqual(snapshot(), before);
  }
  assert.throws(() => edit(f, [{ type: 'reorderNodes', nodeIds: ['stable', 'list'] }]), { code: 'E_DOCUMENT_NO_CHANGE' });
  assert.throws(() => edit(f, [{ type: 'deleteNode', nodeId: 'list' }, { type: 'deleteNode', nodeId: 'stable' }]), { code: 'E_DOCUMENT_COMMAND' });
  f.db.exec("CREATE TRIGGER fail_structural_head BEFORE UPDATE ON document_head BEGIN SELECT RAISE(ABORT,'structural head failure'); END");
  assert.throws(() => edit(f, [insert]), /structural head failure/u);
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('self-links are re-resolved and historical link targets survive target deletion', (t) => {
  const f = fixture(t);
  const inserted = edit(f, [{ type: 'insertNode', index: 0, node: {
    kind: 'paragraph', anchor: 'self-link', text: { ko: [{ text: 'target', link: { domain: 'technology', slug: 'Fixture', anchor: 'stable' } }], en: 'target' },
  } }]);
  const oldLink = f.db.prepare('SELECT * FROM document_revision_text_document_link WHERE revision_id=? AND resolution=?').get(inserted.revision, 'anchor');
  assert.ok(oldLink);
  const deleted = edit(f, [{ type: 'deleteNode', nodeId: 'stable' }], inserted.revision);
  assert.equal(f.db.prepare("SELECT resolution FROM text_document_link WHERE json_pointer LIKE '/document-nodes/self-link/%'").get().resolution, 'missing-anchor');
  assert.deepEqual(f.db.prepare('SELECT * FROM document_revision_text_document_link WHERE revision_id=? AND resolution=?').get(inserted.revision, 'anchor'), oldLink);
  assert.equal(readDocumentRevision(typedOnly(f.db), { ...selection, revision: inserted.revision }).content.length, 3);
  assert.equal(readDocumentRevision(typedOnly(f.db), { ...selection, revision: deleted.revision }).content.length, 2);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('cross-document link proofs block target deletion but do not block stable reordering', (t) => {
  const other = original(); other.id = 'other'; other.slug = 'Other';
  other.content = [{ kind: 'paragraph', anchor: 'incoming', text: { ko: [{ text: 'target', link: { domain: 'technology', slug: 'Fixture', anchor: 'stable' } }], en: 'other' } }];
  const f = fixture(t, { companions: [other] });
  assert.throws(() => edit(f, [{ type: 'deleteNode', nodeId: 'stable' }]), { code: 'E_DOCUMENT_LINK_EDITOR_REQUIRED' });
  assert.deepEqual(readDocument(f.db, selection), original());
  const links = f.db.prepare('SELECT * FROM text_document_link WHERE source_id=2').all();
  const result = edit(f, [{ type: 'reorderNodes', nodeIds: ['list', 'stable'] }]);
  assert.deepEqual(f.db.prepare('SELECT * FROM text_document_link WHERE source_id=2').all(), links);
  assert.deepEqual(readDocumentRevision(typedOnly(f.db), { ...selection, revision: result.revision }).content.map((n) => n.anchor), ['list', 'stable']);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('existing v1 history migrates atomically without disabling FKs or losing sealed rows', (t) => {
  const document = original();
  document.content[1].items[0].en = [{ text: 'target', link: { domain: 'technology', slug: 'Fixture', anchor: 'stable' } }];
  const f = fixture(t, { legacy: true, document });
  const textEdit = edit(f);
  const history = () => Object.fromEntries(f.db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'document_revision%' ORDER BY name").all()
    .map(({ name }) => [name, f.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
  const old = history();
  const oldSchema = f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE name LIKE 'document_%' ORDER BY name").all();
  assert.throws(() => edit(f, [{ type: 'insertNode' }], textEdit.revision), { code: 'E_DOCUMENT_COMMAND' });
  assert.deepEqual(history(), old);
  assert.deepEqual(f.db.prepare("SELECT name,sql FROM sqlite_schema WHERE name LIKE 'document_%' ORDER BY name").all(), oldSchema);
  const result = edit(f, [{ type: 'insertNode', index: 1, node: { kind: 'rule', anchor: 'new-rule' } },
    { type: 'deleteNode', nodeId: 'stable' }], textEdit.revision);
  assert.equal(f.db.prepare('SELECT version FROM document_authority').get().version, 2);
  for (const [table, rows] of Object.entries(old)) {
    const after = f.db.prepare(`SELECT * FROM ${table} WHERE revision_id<>? ORDER BY rowid`).all(result.revision);
    assert.deepEqual(after, rows);
  }
  assert.deepEqual(readDocumentRevision(typedOnly(f.db), { ...selection, revision: f.revision }), document);
  assert.equal(readDocumentRevision(typedOnly(f.db), { ...selection, revision: textEdit.revision }).content[0].text.ko, 'after');
  assert.throws(() => f.db.exec('DELETE FROM document_revision_text_document_node'), /immutable/u);
  assert.throws(() => f.db.exec('DELETE FROM document_node_identity'), /immutable/u);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(f.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  f.db.close();
  const reopened = openReadOnly(f.dbPath);
  try { assert.deepEqual(readDocument(typedOnly(reopened), selection).content.map((n) => n.anchor), ['new-rule', 'list']); }
  finally { reopened.close(); }
});

test('structural authoring on v2 never reads source records or filesystem schemas', (t) => {
  const f = fixture(t);
  const read = fs.readFileSync;
  const connection = new Proxy(f.db, { get(target, property) {
    if (property === 'prepare') return (sql) => {
      assert.doesNotMatch(sql, /\b(?:FROM|JOIN)\s+source_record\b|\braw_bytes\b/iu);
      return target.prepare(sql);
    };
    const value = Reflect.get(target, property, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  try {
    fs.readFileSync = () => { throw new Error('filesystem source fallback forbidden'); };
    syncBuiltinESMExports();
    const result = editDocumentOnConnection(connection, { ...selection, expectedRevision: f.revision, actor: 'a', reason: 'r',
      changes: [{ type: 'insertNode', index: 1, node: { kind: 'rule', anchor: 'offline' } }] });
    assert.deepEqual(readDocumentRevision(typedOnly(f.db), { ...selection, revision: result.revision }).content.map((n) => n.anchor), ['stable', 'offline', 'list']);
  } finally { fs.readFileSync = read; syncBuiltinESMExports(); }
});
