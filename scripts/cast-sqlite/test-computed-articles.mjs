import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { applySchema } from './db.mjs';
import { flattenJson, sha256 } from './sources.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
import { mapTextData } from './text-data.mjs';
import { initializeDocumentAuthority } from './document-edit.mjs';
import { initializeGlossaryStore, listGlossaryEntries, readGlossaryHead, updateGlossaryEntries } from './glossary-store.mjs';
import { readComputedArticle } from './computed-articles.mjs';
import { createWikiDocumentServer } from '../../server/wiki-document-api.mjs';
import { readSourceArchive } from './source-archive.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'computed-articles-'));
  const dbPath = join(directory, 'fixture.sqlite');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
  applySchema(db);
  const paths = ['characters/Core-Characters', 'factions/Sixteen-States', 'chronology/Scenario-Timeline', 'chronology/Century-Annals'];
  const files = paths.map((path, index) => {
    const bytes = readSourceArchive(`lore/${path}.json`);
    return { source_id: index + 1, logical_path: `lore/${path}.json`, document: JSON.parse(bytes),
      bytes, content_policy: 'local-corpus', corpus_kind: 'current' };
  });
  const insert = (table, rows) => {
    if (!rows.length) return;
    const fields = Object.keys(rows[0]);
    const stmt = db.prepare(`INSERT INTO ${table}(${fields}) VALUES(${fields.map(() => '?')})`);
    for (const row of rows) stmt.run(...fields.map(field => row[field]));
  };
  for (const file of files) {
    db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(file.source_id, file.logical_path,
      'application/json', sha256(file.bytes), file.bytes.length, Buffer.alloc(file.bytes.length));
    insert('source_record', flattenJson(file.document).map(row => ({ source_id: file.source_id, ...row })));
  }
  for (const [table, rows] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, rows);
  const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json'));
  const primaryNames = files.flatMap(file => file.document.data.primary_detail_names ?? []);
  for (const [ordinal, name] of primaryNames.entries()) {
    const person = registry.persons.find(person => person.name === name);
    db.prepare('INSERT INTO person(person_id,name,publication_ordinal,public_key,public_route,minors,values_source_ordinal) VALUES(?,?,?,?,?,?,?)')
      .run(person.id, name, ordinal + 1, person.id, `/people/${person.id}`, 0, ordinal);
  }
  const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: registry }, ...files] };
  for (const state of files.flatMap(file => file.document.data.currentAffiliation?.states ?? [])) {
    db.prepare('INSERT INTO state VALUES(?,?)').run(state.stateId, state.currentName);
  }
  for (const [table, rows] of Object.entries(mapTextData({ files, bundle }))) insert(table, rows);
  initializeDocumentAuthority(db, { actor: 'test', reason: 'actual typed content fixture', validatedSourceIds: files.map(file => file.source_id) });
  db.exec(readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8'));
  for (const file of files) {
    const head = db.prepare('SELECT r.* FROM document_head h JOIN document_revision r USING(revision_id) WHERE h.source_id=?').get(file.source_id);
    db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(file.source_id, head.revision_id,
      file.logical_path, sha256(file.bytes), head.semantic_sha256, 'current-reviewed', 'approved-exact-review', 'fixture', 'b'.repeat(64), 'fixture-only', '2026-10-20');
  }
  db.exec('CREATE TABLE article_route(route TEXT PRIMARY KEY,article_id TEXT,source_path TEXT,source_id INTEGER,derivation TEXT,derivation_json TEXT)');
  const mappings = files.map(file => ({ ...file.document, source_id: file.source_id,
    route: `/world/${file.logical_path.split('/').at(-1).replace('.json', '')}` }));
  for (const [index, file] of files.entries()) db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?,?)').run(mappings[index].route, file.document.id,
    file.logical_path, file.source_id, 'typed-envelope', JSON.stringify({ materialized: true, documentId: file.document.id, domain: file.document.domain, envelopeSlug: file.document.slug }));
  const glossaryBytes = readSourceArchive('lore/glossary.json');
  initializeGlossaryStore(db, { approvedBytes: glossaryBytes, expectedSha256: sha256(glossaryBytes), provenanceLabel: 'fixture', actor: 'test', reason: 'actual typed glossary fixture' });
  const metadata = sourceBindings => JSON.stringify({ version: 1, review: 'authenticated-current-reviewed', materialized: false, sourceBindings });
  const index = { route: '/world/', source_id: null, derivation: 'computed-index',
    derivation_json: metadata(files.slice(0, 3).map(file => ({ sourcePath: file.logical_path, sha256: sha256(file.bytes) }))) };
  const glossary = { route: '/world/Glossary', source_id: null, derivation: 'computed-glossary',
    derivation_json: metadata([{ sourcePath: 'lore/glossary.json', sha256: sha256(glossaryBytes) }]) };
  for (const row of [index, glossary]) db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?,?)').run(row.route, row.route, 'opaque', null, row.derivation, row.derivation_json);
  return { db, dbPath, mappings, index, glossary, files };
}

async function start(t, dbPath) {
  const server = createWikiDocumentServer({ dbPath });
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  t.after(async () => { const closed = once(server, 'close'); server.close(); await closed; });
  return `http://127.0.0.1:${server.address().port}/wiki/api/documents`;
}

test('computed KO/EN routes render actual typed states, leaders, events, glossary and heading TOC without archive reads', async t => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  const original = DatabaseSync.prototype.prepare;
  DatabaseSync.prototype.prepare = function (sql) {
    assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b|\bapproved_bytes\b/iu);
    return original.call(this, sql);
  };
  t.after(() => { DatabaseSync.prototype.prepare = original; });
  const before = readFileSync(f.dbPath);
  for (const locale of ['ko', 'en']) {
    const prefix = locale === 'ko' ? '' : '/en';
    const response = await fetch(`${base}/world/?locale=${locale}`);
    assert.equal(response.status, 200);
    const article = await response.json();
    assert.equal(article.route, `${prefix}/world/`);
    const indexed = await fetch(`${base}/world/index?locale=${locale}`);
    assert.equal(indexed.status, 200);
    assert.deepEqual(await indexed.json(), article);
    assert.deepEqual(article.blocks.filter(block => block.type === 'heading').map(block => block.depth), [2, 2, 2]);
    const table = article.blocks.find(block => block.type === 'table');
    assert.equal(table.children.length, 17);
    assert.ok(table.children.slice(1).every(row => row.children[3].children.length));
    assert.match(article.reviewText, new RegExp(`${prefix}/world/Sixteen-States`));
    assert.match(article.reviewText, new RegExp(`${prefix}/world/Scenario-Timeline`));
    assert.doesNotMatch(article.reviewText, /\.md\)|\.html\)/u);
    const glossaryResponse = await fetch(`${base}/world/Glossary?locale=${locale}`);
    assert.equal(glossaryResponse.status, 200);
    const glossary = await glossaryResponse.json();
    assert.equal(glossary.route, `${prefix}/world/Glossary`);
    assert.ok(glossary.blocks.some(block => block.type === 'heading'));
    const entries = listGlossaryEntries(f.db, { visibility: 'internal' });
    for (const entry of entries.filter(entry => entry.status === 'fact-public')) assert.ok(glossary.reviewText.includes(entry[`reader_definition_${locale}`]));
    for (const entry of entries.filter(entry => entry.status !== 'fact-public')) assert.ok(!glossary.reviewText.includes(`**${entry[`display_name_${locale}`]}**:`));
    const list = await (await fetch(`${base}?locale=${locale}`)).json();
    assert.ok(list.some(entry => entry.route === `${prefix}/world/`));
    assert.ok(list.some(entry => entry.route === `${prefix}/world/Glossary`));
  }
  assert.deepEqual(readFileSync(f.dbPath), before);
});

test('index immediately fails closed for missing, private, stale semantic and stale binding dependencies', async t => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  assert.equal((await fetch(`${base}/world/`)).status, 200);
  f.db.prepare('INSERT INTO excluded_source VALUES(?,?,?,?)').run(f.files[0].logical_path, 'c'.repeat(64), 0, 'private-soul-historical-motif');
  assert.equal((await fetch(`${base}/world/`)).status, 404);
  f.db.prepare('DELETE FROM excluded_source').run();
  const original = f.db.prepare('SELECT text FROM text_document_slot WHERE source_id=1 LIMIT 1').get().text;
  f.db.prepare('UPDATE text_document_slot SET text=? WHERE source_id=1 AND text=?').run('stale semantic', original);
  assert.equal((await fetch(`${base}/world/`)).status, 404);
  f.db.prepare('UPDATE text_document_slot SET text=? WHERE source_id=1 AND text=?').run(original, 'stale semantic');
  assert.equal((await fetch(`${base}/world/`)).status, 200);
  f.db.prepare('DELETE FROM text_document_slot WHERE source_id=2 AND json_pointer=?').run('/content/0/text/en');
  assert.equal((await fetch(`${base}/world/`)).status, 404);
  const meta = JSON.parse(f.index.derivation_json);
  meta.sourceBindings[0].sha256 = '0'.repeat(64);
  assert.equal(readComputedArticle(f.db, { ...f.index, derivation_json: JSON.stringify(meta) }, f.mappings, 'ko'), null);
});

test('glossary does not inherit initial review after a typed edit, or accept a mismatched archive binding', async t => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  assert.equal((await fetch(`${base}/world/Glossary`)).status, 200);
  const entry = listGlossaryEntries(f.db, { visibility: 'internal' })[0];
  updateGlossaryEntries(f.db, { expectedHead: readGlossaryHead(f.db).revision,
    updates: [{ ...entry, reader_definition_ko: 'unreviewed definition', status: 'fiction-original' }], actor: 'test', reason: 'edit invalidates review' });
  assert.equal((await fetch(`${base}/world/Glossary`)).status, 404);
  const metadata = JSON.parse(f.glossary.derivation_json);
  metadata.sourceBindings[0].sha256 = '0'.repeat(64);
  assert.equal(readComputedArticle(f.db, { ...f.glossary, derivation_json: JSON.stringify(metadata) }, f.mappings, 'ko'), null);
});

test('missing one-time glossary store and absent review metadata are unavailable', t => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const mapping = { route: '/world/Glossary', source_id: null, derivation: 'computed-glossary', derivation_json: JSON.stringify({
    version: 1, review: 'authenticated-current-reviewed', materialized: false, sourceBindings: [{ sourcePath: 'lore/glossary.json', sha256: '0'.repeat(64) }],
  }) };
  assert.equal(readComputedArticle(db, mapping, [], 'ko'), null);
  assert.equal(readComputedArticle(db, { ...mapping, derivation_json: '{}' }, [], 'ko'), null);
});
