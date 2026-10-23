import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { applySchema, openReadOnly } from './cast-sqlite/db.mjs';
import { flattenJson, sha256 } from './cast-sqlite/sources.mjs';
import { mapTextCorpusDocuments } from './cast-sqlite/text-corpus-documents.mjs';
import { mapTextData } from './cast-sqlite/text-data.mjs';
import { initializeDocumentAuthority, editDocumentOnConnection } from './cast-sqlite/document-edit.mjs';
import { createWikiDocumentServer } from '../server/wiki-document-api.mjs';
import { officeProjection } from './public-office-content.mjs';

const leaf = (ko, en = ko) => ({ ko, en });
function document(slug, status = 'approved') {
  return { version: 1, domain: 'technology', id: `id-${slug}`, slug, status,
    tense: leaf('present'), source: { kind: 'observed', refs: ['SECRET-SOURCE'] },
    provenance: { original_anchor: 'SECRET-PROVENANCE', original_hash: null, history: [] },
    locales: { ko: { title: `제목 ${slug}`, summary: '요약', tense: 'present' },
      en: { title: `Title ${slug}`, summary: 'Summary', tense: 'present' } },
    content: [
      { kind: 'heading', anchor: 'title', depth: 1, text: leaf(`제목 ${slug}`, `Title ${slug}`) },
      { kind: 'heading', anchor: 'section', publicAnchors: ['stable-alias'], depth: 2, text: leaf('절 이름', 'Section Name') },
      { kind: 'paragraph', anchor: 'paragraph', text: leaf([
        { text: '연결', link: { domain: 'technology', slug: 'Public', anchor: 'stable-alias' } },
      ], [{ text: 'Link', link: { domain: 'technology', slug: 'Public', anchor: 'stable-alias' } }]) },
      { kind: 'table', anchor: 'table', columns: [leaf('열', 'Column')], rows: [[leaf('값', 'Value')]] },
    ], data: { constraint: 'SECRET-DATA' } };
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'wiki-document-api-'));
  const dbPath = join(directory, 'fixture.sqlite');
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
  applySchema(db);
  db.exec(readFileSync(new URL('./cast-sqlite/public-projection.sql', import.meta.url), 'utf8'));
  const publicRules = openReadOnly(new URL('../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try {
    for (const table of ['public_projection_document', 'public_office_replacement', 'public_map_summary', 'public_map_block', 'public_map_block_locale']) {
      for (const row of publicRules.prepare(`SELECT * FROM ${table}`).all()) {
        const fields = Object.keys(row);
        db.prepare(`INSERT INTO ${table}(${fields}) VALUES(${fields.map(() => '?')})`).run(...Object.values(row));
      }
    }
  } finally { publicRules.close(); }
  const documents = ['Public', 'Private', 'Unadmitted', 'Draft', 'Incomplete', 'Stale', 'Historical', 'Operating-Houses', officeProjection.slug]
    .map((slug) => document(slug, slug === 'Draft' ? 'draft' : 'approved'));
  documents.find((entry) => entry.slug === 'Stale').content[2].text = leaf('before');
  documents[0].slug = 'public';
  for (const value of documents) for (const locale of ['ko', 'en']) {
    const runs = value.content[2].text[locale];
    if (Array.isArray(runs)) runs[0].link.slug = 'public';
  }
  const house = documents.find((entry) => entry.slug === 'Operating-Houses');
  house.content.push({ kind: 'heading', depth: 2, anchor: 'house', text: leaf('가문', 'House') },
    { kind: 'list', anchor: 'house-list', items: [leaf('one'), leaf('two'), leaf('출처층: original-fiction', 'Source layer: original-fiction')] });
  const office = documents.find((entry) => entry.slug === officeProjection.slug);
  for (const row of officeProjection.replacements) {
    let node = office.content.find((entry) => entry.anchor === row.anchor);
    if (!node) {
      node = row.row === undefined ? { kind: 'paragraph', anchor: row.anchor, text: leaf('') }
        : { kind: 'table', anchor: row.anchor, columns: Array.from({ length: row.column + 1 }, () => leaf('column')),
          rows: Array.from({ length: row.row + 1 }, () => Array.from({ length: row.column + 1 }, () => leaf(''))) };
      office.content.push(node);
    }
    (row.row === undefined ? node.text : node.rows[row.row][row.column])[row.locale] = row.before;
  }
  office.content.push({ kind: 'paragraph', anchor: officeProjection.removeAnchor, text: leaf('REMOVED-OFFICE') });
  const files = documents.map((value, index) => ({ source_id: index + 1, document: value,
    logical_path: `/nonexistent/NO-SOURCE-FILES-${index}.json`, content_policy: 'local-corpus',
    corpus_kind: value.slug === 'Historical' ? 'historical' : 'current' }));
  const insert = (table, rows) => {
    if (!rows.length) return;
    const fields = Object.keys(rows[0]);
    const statement = db.prepare(`INSERT INTO ${table}(${fields}) VALUES(${fields.map(() => '?')})`);
    for (const row of rows) statement.run(...fields.map((field) => row[field]));
  };
  const bytes = Buffer.from('ARCHIVE IS NOT JSON AND MUST NEVER BE PARSED');
  for (const file of files) {
    db.prepare('INSERT INTO source_file VALUES(?,?,?,?,?,?)').run(file.source_id, file.logical_path, 'application/json', sha256(bytes), bytes.length, bytes);
    insert('source_record', flattenJson(file.document).map((row) => ({ source_id: file.source_id, ...row })));
  }
  for (const [table, rows] of Object.entries(mapTextCorpusDocuments({ files }))) insert(table, rows);
  const bundle = { files: [{ logical_path: 'lore/name-pools/person-id-registry.json', document: { persons: [] } }, ...files] };
  for (const [table, rows] of Object.entries(mapTextData({ files, bundle }))) insert(table, rows);
  const revisions = initializeDocumentAuthority(db, { actor: 'fixture', reason: 'synthetic typed fixture', validatedSourceIds: files.map((file) => file.source_id) });
  // Manual SQL fixture admissions exercise HTTP storage invariants only. They
  // do not impersonate a branded production review or test its authentication.
  db.exec(readFileSync(new URL('./cast-sqlite/document-admission.sql', import.meta.url), 'utf8'));
  for (const file of files.filter((entry) => !['Draft', 'Unadmitted', 'Historical'].includes(entry.document.slug))) {
    const { revision } = revisions.find((entry) => entry.sourceId === file.source_id);
    const { semantic_sha256 } = db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(revision);
    db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(file.source_id, revision,
      file.logical_path, sha256(bytes), semantic_sha256, 'current-reviewed', 'approved-exact-review',
      'fixture-receipt', 'b'.repeat(64), 'fixture-only-not-authority', '2026-10-20T00:00:00Z');
  }
  const privateFile = files.find((entry) => entry.document.slug === 'Private');
  db.prepare('INSERT INTO excluded_source VALUES(?,?,?,?)').run(privateFile.logical_path, 'c'.repeat(64), 0, 'private-soul-historical-motif');
  db.exec("DELETE FROM text_document_slot WHERE source_id=5 AND json_pointer='/content/1/text/en'");
  db.exec(`CREATE TABLE article_route (
    route TEXT PRIMARY KEY, article_id TEXT NOT NULL, source_path TEXT NOT NULL,
    source_id INTEGER REFERENCES text_document(source_id),
    derivation TEXT NOT NULL CHECK(derivation IN ('typed-envelope','computed-glossary','computed-index','unadmitted-source')),
    derivation_json TEXT NOT NULL
  ) STRICT`);
  for (const file of files) {
    const value = file.document;
    const route = `/world/${value.slug === 'public' ? 'Public' : value.slug}`;
    db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?,?)').run(route, `wiki:${value.slug}`, file.logical_path,
      file.source_id, 'typed-envelope', JSON.stringify({ version: 1, materialized: true,
        documentId: value.id, domain: value.domain, envelopeSlug: value.slug }));
  }
  return { db, dbPath, files, revisions };
}

async function start(t, dbPath) {
  const child = fork(new URL('../server/wiki-document-api.mjs', import.meta.url), [], {
    env: { ...process.env, WIKI_DOCUMENT_DB: dbPath, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  child.stdout.resume();
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
    child.kill('SIGTERM');
    await exited;
  });
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`readiness timeout: ${errors}`)); }, 10000);
    const onMessage = (message) => { if (message?.type === 'ready') { cleanup(); resolve(message); } };
    const onExit = (code) => { cleanup(); reject(new Error(`startup exit ${code}: ${errors}`)); };
    const onError = (error) => { cleanup(); reject(error); };
    function cleanup() { clearTimeout(timer); child.off('message', onMessage); child.off('exit', onExit); child.off('error', onError); }
    child.on('message', onMessage); child.once('exit', onExit); child.once('error', onError);
  });
  return `http://127.0.0.1:${ready.port}/wiki/api/documents`;
}

test('forked HTTP service renders typed KO/EN articles, public projections and safe list without source files', async (t) => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  const before = readFileSync(f.dbPath);
  for (const locale of ['ko', 'en']) {
    const response = await fetch(`${base}/world/Public?locale=${locale}`);
    assert.equal(response.status, 200);
    const article = await response.json();
    assert.deepEqual(Object.keys(article).sort(), ['blocks', 'reviewText', 'route', 'title']);
    assert.equal(article.title, locale === 'ko' ? '제목 Public' : 'Title Public');
    assert.equal(article.route, `${locale === 'ko' ? '' : '/en'}/world/Public`);
    assert.match(article.reviewText, /<a id="stable-alias"><\/a>/u);
    assert.ok(article.blocks.some((block) => block.type === 'table'));
    const link = article.blocks.flatMap((block) => block.children ?? []).find((node) => node.type === 'link');
    assert.equal(link.url, `${article.route}#stable-alias`);
    assert.doesNotMatch(JSON.stringify(article), /SECRET-|raw_bytes|source_record|NO-SOURCE-FILES|position/u);
    const list = await (await fetch(`${base}?locale=${locale}`)).json();
    assert.equal(list.length, 4);
    for (const entry of list) assert.deepEqual(Object.keys(entry).sort(), ['route', 'title']);
    const house = await (await fetch(`${base}/world/Operating-Houses?locale=${locale}`)).json();
    assert.doesNotMatch(house.reviewText, /Source layer:|출처층:/u);
    const office = await (await fetch(`${base}/world/${officeProjection.slug}?locale=${locale}`)).json();
    assert.doesNotMatch(office.reviewText, /REMOVED-OFFICE/u);
    for (const row of officeProjection.replacements.filter((entry) => entry.locale === locale)) {
      assert.ok(office.reviewText.includes(row.after));
      assert.ok(!office.reviewText.includes(row.before));
    }
  }
  assert.deepEqual(readFileSync(f.dbPath), before, 'HTTP reads must not change DB bytes');
});

test('HTTP fails closed for private, unadmitted, incomplete, historical, stale and unknown documents', async (t) => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  for (const slug of ['Private', 'Unadmitted', 'Draft', 'Incomplete', 'Historical', 'Unknown']) {
    const response = await fetch(`${base}/world/${slug}`);
    assert.equal(response.status, 404, slug);
    assert.deepEqual(await response.json(), { error: 'Not found' });
  }
  assert.equal((await fetch(`${base}/world/Stale`)).status, 200);
  // Editing preserves the route but invalidates admission for the new head.
  const staleRoute = f.db.prepare('SELECT * FROM article_route WHERE source_id=6').get();
  const edited = editDocumentOnConnection(f.db, { documentId: 'id-Stale', domain: 'technology', corpusKind: 'current',
    expectedRevision: f.revisions.find((entry) => entry.sourceId === 6).revision, actor: 'fixture', reason: 'stale receipt test',
    changes: [{ type: 'setText', nodeId: 'paragraph', slot: 'text/ko', value: 'changed' }] });
  assert.deepEqual(f.db.prepare('SELECT * FROM article_route WHERE source_id=6').get(), staleRoute);
  assert.equal((await fetch(`${base}/world/Stale`)).status, 404);
  assert.equal((await (await fetch(base)).json()).length, 3);
  // Explicit SQL fixture admission is not a production approval. It proves
  // the HTTP reader consumes only the exact admitted current revision.
  const prior = f.db.prepare('SELECT * FROM document_publication_admission WHERE source_id=6').get();
  const head = f.db.prepare('SELECT semantic_sha256 FROM document_revision WHERE revision_id=?').get(edited.revision);
  f.db.prepare('INSERT INTO document_publication_admission VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(6, edited.revision,
    prior.source_path, prior.source_sha256, head.semantic_sha256, prior.classification, prior.reason,
    'successor-fixture-review', 'd'.repeat(64), 'fixture-only-not-authority', '2026-10-20T00:00:00Z');
  for (const locale of ['ko', 'en']) {
    const response = await fetch(`${base}/world/Stale?locale=${locale}`);
    assert.equal(response.status, 200);
    const body = await response.json();
    if (locale === 'ko') assert.match(body.reviewText, /changed/u);
    assert.doesNotMatch(JSON.stringify(body), /SECRET-|raw_bytes|source_record/u);
  }
  editDocumentOnConnection(f.db, { documentId: 'id-Stale', domain: 'technology', corpusKind: 'current',
    expectedRevision: edited.revision, actor: 'fixture', reason: 'next unreviewed edit',
    changes: [{ type: 'setText', nodeId: 'paragraph', slot: 'text/ko', value: 'not admitted' }] });
  assert.equal((await fetch(`${base}/world/Stale`)).status, 404);
  assert.equal((await (await fetch(base)).json()).length, 3);
});

test('request boundary rejects malformed locales, SQL, raw archives, paths and write methods', async (t) => {
  const f = fixture(t);
  const base = await start(t, f.dbPath);
  for (const query of ['locale=', 'locale=fr', 'locale=KO', 'locale=ko&locale=en', 'sql=SELECT+1', 'path=/tmp/file', 'raw=1']) {
    assert.equal((await fetch(`${base}?${query}`)).status, 400, query);
  }
  for (const suffix of ['/raw', '/source_record/Public', '/world/%2Fetc%2Fpasswd', '/world/%ZZ', '/world/Public/archive']) {
    assert.equal((await fetch(`${base}${suffix}`)).status, suffix.includes('%ZZ') ? 400 : 404, suffix);
  }
  for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await fetch(base, { method })).status, 405);
});

test('runtime SQL never reads archive/tree columns and connection rejects writes', async (t) => {
  const f = fixture(t);
  const readOnly = openReadOnly(f.dbPath);
  assert.throws(() => readOnly.exec('CREATE TABLE forbidden(value TEXT)'), /readonly/u);
  readOnly.close();
  const original = DatabaseSync.prototype.prepare;
  DatabaseSync.prototype.prepare = function (sql) {
    assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
    return original.call(this, sql);
  };
  t.after(() => { DatabaseSync.prototype.prepare = original; });
  const server = createWikiDocumentServer({ dbPath: f.dbPath });
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  t.after(async () => { const closed = once(server, 'close'); server.close(); await closed; });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/wiki/api/documents/world/Public`);
  assert.equal(response.status, 200);
  await response.json();
});

test('explicit database path is mandatory and missing database is never created', () => {
  assert.throws(() => createWikiDocumentServer({ dbPath: '' }), /WIKI_DOCUMENT_DB/u);
  assert.throws(() => createWikiDocumentServer({ dbPath: '/nonexistent/wiki-document-api/no.sqlite' }), { code: 'E_DB_OPEN' });
});

test('exact DB routes override lowercase envelope slugs without inferred aliases or computed pages', async (t) => {
  const f = fixture(t);
  f.db.exec("UPDATE article_route SET route='/world/MixedCase-Public' WHERE source_id=1");
  for (const [route, derivation] of [['/world/Glossary', 'computed-glossary'], ['/world/index', 'computed-index'], ['/world/UnadmittedMap', 'unadmitted-source']]) {
    f.db.prepare('INSERT INTO article_route VALUES(?,?,?,?,?,?)').run(route, route, '/DO-NOT-OPEN.json', null, derivation, '{}');
  }
  const base = await start(t, f.dbPath);
  for (const locale of ['ko', 'en']) {
    const response = await fetch(`${base}/world/MixedCase-Public?locale=${locale}`);
    assert.equal(response.status, 200);
    const article = await response.json();
    assert.equal(article.route, `${locale === 'ko' ? '' : '/en'}/world/MixedCase-Public`);
    assert.ok(article.reviewText.includes(`${article.route}#stable-alias`));
    assert.equal(article.title, locale === 'ko' ? '제목 Public' : 'Title Public');
  }
  for (const slug of ['public', 'Public', 'Glossary', 'index', 'UnadmittedMap']) {
    assert.equal((await fetch(`${base}/world/${slug}`)).status, 404, slug);
  }
  assert.equal((await fetch(`${base}/technology/public`)).status, 404);
  assert.throws(() => f.db.prepare('INSERT INTO article_route SELECT * FROM article_route WHERE source_id=1').run(), /UNIQUE/u);
  f.db.prepare('INSERT INTO article_route SELECT ?,article_id,source_path,source_id,derivation,derivation_json FROM article_route WHERE source_id=1')
    .run('/world/DuplicateIdentity');
  for (const slug of ['MixedCase-Public', 'DuplicateIdentity']) assert.equal((await fetch(`${base}/world/${slug}`)).status, 404);
  const list = await (await fetch(base)).json();
  assert.equal(list.some((entry) => /MixedCase-Public|DuplicateIdentity|Glossary|Unadmitted/u.test(entry.route)), false);
});

test('mismatched route identity cannot redirect to another admitted envelope', async (t) => {
  const f = fixture(t);
  f.db.exec("UPDATE article_route SET source_id=3 WHERE route='/world/Public'");
  const base = await start(t, f.dbPath);
  assert.equal((await fetch(`${base}/world/Public`)).status, 404);
  f.db.exec("UPDATE article_route SET derivation_json='{}' WHERE route='/world/Stale'");
  assert.equal((await fetch(`${base}/world/Stale`)).status, 404);
});
