import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { flattenJson, sha256 } from './sources.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';
import { mapTextCorpusDocuments, TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS } from './text-corpus-documents.mjs';
import { readCanonicalAuthoringSchemas } from './authoring-schema-documents.mjs';

const leaf = (ko, en = ko) => ({ ko, en });
function document(slug = 'Page') {
  return {
    version: 1, domain: 'test', id: `id-${slug}`, slug, status: 'draft', categories: ['first', 'second'],
    tense: { ko: 'past', en: 'present' }, source: { kind: 'observed', refs: ['ref-a', 'ref-b'], hash: 'a'.repeat(64) },
    provenance: { original_anchor: 'original', original_hash: null, history: ['old', 'old'] },
    locales: { ko: { title: '제목', summary: '요약', tense: 'past' }, en: { title: 'Title', summary: 'Summary', tense: 'present' } },
    content: [
      { kind: 'heading', anchor: 'heading', publicAnchors: ['public'], depth: 2, text: leaf('자연 제목', 'Natural title') },
      { kind: 'paragraph', anchor: 'paragraph', text: leaf('  공백\n<a id="inline"></a> | **원문**', '  spaces\n<a id="inline-en"></a> | **raw**') },
      { kind: 'quote', anchor: 'quote', text: leaf([{ text: ' A ', strong: true }, { text: '\nB|\u0000' }]) },
      { kind: 'rule', anchor: 'rule', publicAnchors: ['rule-public'] },
      { kind: 'code', anchor: 'code', language: 'json', info: 'example', text: leaf('{"ko": true}\n', '{"en": true}\n') },
      { kind: 'list', anchor: 'list', ordered: true, start: 0, items: [leaf('first'), leaf('second')] },
      { kind: 'table', anchor: 'table', columns: [leaf('one'), leaf('two')], rows: [[leaf(''), leaf('x')], [leaf('last')]] },
    ], data: { arbitrary: { 'a/b~c': [null, true, 7] } },
  };
}
const file = (source_id, d = document(), corpus_kind = 'current') => ({ source_id, document: d, corpus_kind, content_policy: 'local-corpus' });
const map = (...files) => mapTextCorpusDocuments({ files });
const link = (slug, anchor, domain = 'test') => ({ text: 'link', link: { domain, slug, ...(anchor ? { anchor } : {}) } });

test('caller-supplied schema definitions map and reject invalid envelopes without reading a schema file', () => {
  const definitions = readCanonicalAuthoringSchemas()['lore/authoring.shared.schema.json'].$defs;
  const input = file(1);
  const expected = map(input);
  const read = fs.readFileSync, parse = JSON.parse;
  try {
    fs.readFileSync = JSON.parse = () => { throw new Error('schema file fallback forbidden'); };
    syncBuiltinESMExports();
    assert.deepEqual(mapTextCorpusDocuments({ files: [input], definitions }), expected);
    const invalid = structuredClone(input);
    invalid.document.content[0].depth = 99;
    assert.throws(() => mapTextCorpusDocuments({ files: [invalid], definitions }), { code: 'E_TEXT_DOCUMENT_SHAPE' });
  } finally { fs.readFileSync = read; JSON.parse = parse; syncBuiltinESMExports(); }
});

test('all seven kinds retain locale text, runs, list start, ragged rows and empty cells without mutation', () => {
  const input = file(1);
  const before = structuredClone(input);
  const output = map(input);
  assert.deepEqual(input, before);
  assert.deepEqual(output.text_document_node.map((row) => row.kind), ['heading', 'paragraph', 'quote', 'rule', 'code', 'list', 'table']);
  assert.deepEqual(output.text_document_locale.map((row) => [row.locale, row.title, row.summary, row.tense]), [['ko', '제목', '요약', 'past'], ['en', 'Title', 'Summary', 'present']]);
  assert.deepEqual(output.text_document_category.map((row) => row.category), ['first', 'second']);
  assert.deepEqual(output.text_document_source_ref.map((row) => row.reference), ['ref-a', 'ref-b']);
  assert.deepEqual(output.text_document_history.map((row) => row.entry), ['old', 'old']);
  assert.equal(output.text_document[0].status, 'draft');
  assert.equal(output.text_document[0].source_hash, 'a'.repeat(64));
  assert.equal(output.text_document[0].data_pointer, '/data');
  assert.equal(output.text_document_node[5].list_start, 0);
  assert.deepEqual(output.text_document_list_item.map((row) => row.ordinal), [0, 1]);
  assert.deepEqual(output.text_document_table_row.map((row) => row.ordinal), [0, 1]);
  assert.equal(output.text_document_table_cell.length, 5);
  assert.equal(output.text_document_slot.find((row) => row.json_pointer === '/content/6/rows/0/0/ko').text, '');
  for (const row of output.text_document_slot) {
    const authored = row.json_pointer.split('/').slice(1).reduce((value, part) => value[part], input.document);
    assert.equal(row.text, typeof authored === 'string' ? authored : authored.map((run) => run.text).join(''));
    assert.equal(row.representation, typeof authored === 'string' ? 'string' : 'runs');
  }
  assert.deepEqual(output.text_document_run.filter((row) => row.slot_pointer === '/content/2/text/ko').map((row) => [row.text, row.strong]), [[' A ', 1], ['\nB|\u0000', null]]);
  for (const [table, rows] of Object.entries(output)) {
    assert.ok(Object.isFrozen(rows) && rows.every(Object.isFrozen));
    for (const row of rows) assert.deepEqual(Object.keys(row).sort(), [...TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS[table]].sort());
  }
  assert.ok(Object.isFrozen(output));
});

test('links resolve by corpus, locale and renderer-visible anchor, independent of file order', () => {
  const a = file(1, document('From'));
  a.document.content[2].text = leaf([
    link('Page'), link('Page', 'heading'), link('Page', 'public'), link('Page', '자연-제목'),
    link('Page', 'inline'), link('Page', 'quote'), link('Absent'), link('OnlyOld'),
    link('Guide', 'part', 'gdd'), { text: 'external', href: 'https://example.org/path#anchor', strong: true },
  ]);
  const b = file(2);
  const historical = file(3, document('Page'), 'historical');
  const onlyOld = file(4, document('OnlyOld'), 'historical');
  const example = file(5, document('Page'), 'example');
  const result = map(a, b, historical, onlyOld, example);
  assert.deepEqual(result, map(example, onlyOld, historical, b, a));
  const ko = result.text_document_link.filter((row) => row.source_id === 1 && row.locale === 'ko');
  assert.deepEqual(ko.map((row) => row.resolution), ['document', 'anchor', 'anchor', 'anchor', 'anchor', 'missing-anchor', 'missing-target', 'missing-target', 'gdd', 'external']);
  assert.ok(ko.slice(0, 6).every((row) => row.target_source_id === 2));
  assert.equal(result.text_document_link.find((row) => row.source_id === 1 && row.locale === 'en' && row.json_pointer.endsWith('/3')).resolution, 'missing-anchor');
  for (const locale of ['ko', 'en']) {
    const rendered = renderLoreMarkdown(b.document, locale);
    for (const row of result.text_document_anchor.filter((row) => row.source_id === 2 && row.locale === locale && row.published && row.anchor_kind !== 'natural')) {
      assert.ok(rendered.includes(`<a id="${row.anchor}"></a>`));
    }
  }
});

test('duplicate natural and inline anchors are ambiguous, while authored/public collisions fail', () => {
  const target = file(2);
  target.document.content.push({ kind: 'heading', anchor: 'other', depth: 1, text: leaf('자연 제목', 'Natural title') });
  target.document.content[1].text.ko += '<a id="inline"></a>';
  const from = file(1, document('From'));
  from.document.content[2].text = leaf([link('Page', '자연-제목'), link('Page', 'inline')]);
  assert.deepEqual(map(from, target).text_document_link.filter((row) => row.locale === 'ko').map((row) => row.resolution), ['ambiguous-anchor', 'ambiguous-anchor']);
  target.document.content[1].anchor = 'heading';
  assert.throws(() => map(target), { code: 'E_TEXT_DOCUMENT_DUPLICATE_ANCHOR' });
  target.document.content[1].anchor = 'paragraph';
  target.document.content[1].publicAnchors = ['public'];
  assert.throws(() => map(target), { code: 'E_TEXT_DOCUMENT_DUPLICATE_ANCHOR' });
  assert.throws(() => map(file(1), file(2)), { code: 'E_TEXT_DOCUMENT_DUPLICATE_SLUG' });
  assert.throws(() => map(file(1), file(1, document('Other'))), { code: 'E_TEXT_DOCUMENT_DUPLICATE_SOURCE' });
});

test('renderer suppresses aliases shadowed by natural IDs and preserves technology paragraph exceptions', () => {
  const input = file(1);
  input.document.domain = 'technology';
  input.document.content[0].anchor = 'natural-title';
  input.document.content[1].anchor = 'visible-tech';
  input.document.content.push({ kind: 'paragraph', anchor: 'hidden-p2', text: leaf('hidden') });
  const result = map(input);
  for (const locale of ['ko', 'en']) {
    const rendered = renderLoreMarkdown(input.document, locale);
    const anchors = result.text_document_anchor.filter((row) => row.locale === locale);
    assert.equal(anchors.find((row) => row.anchor_kind === 'authored' && row.anchor === 'natural-title').published, locale === 'en' ? 0 : 1);
    assert.equal(anchors.find((row) => row.anchor === 'visible-tech').published, 1);
    assert.equal(anchors.find((row) => row.anchor === 'hidden-p2').published, 0);
    assert.ok(rendered.includes('<a id="visible-tech"></a>'));
    assert.ok(!rendered.includes('<a id="hidden-p2"></a>'));
  }
});

test('shared schema drives rejection of malformed and unknown document shapes', () => {
  const mutations = [
    (d) => { d.version = 2; }, (d) => { d.extra = true; }, (d) => { delete d.locales.en; },
    (d) => { d.content[0].depth = 0; }, (d) => { d.content[1].text.ko = ''; },
    (d) => { d.content[3].kind = 'unknown'; }, (d) => { delete d.content[4].language; },
    (d) => { d.content[5].ordered = false; }, (d) => { d.content[5].start = -1; },
    (d) => { d.content[2].text.ko = [{ text: 'x', strong: false }]; },
    (d) => { d.content[2].text.ko = [{ ...link('Page'), href: 'https://example.org' }]; },
    (d) => { d.content[2].text.ko = [{ text: 'x', href: 'http://example.org' }]; },
    (d) => { d.source.refs = []; }, (d) => { d.categories.push('first'); },
  ];
  for (const mutate of mutations) {
    const d = document(); mutate(d);
    assert.throws(() => map(file(1, d)), { code: 'E_TEXT_DOCUMENT_SHAPE' });
  }
  const d = document();
  delete d.categories; delete d.content[4].info; delete d.content[5].ordered;
  d.source = { kind: 'original-fiction', refs: [] };
  assert.equal(map(file(1, d)).text_document_category.length, 0);
  assert.throws(() => map({ ...file(1), content_policy: 'hash-only' }), { code: 'E_TEXT_DOCUMENT_POLICY' });
  d.status = 'excluded';
  assert.equal(map(file(1, d)).text_document[0].status, 'excluded');
  assert.throws(() => mapTextCorpusDocuments({ files: null }), { code: 'E_TEXT_DOCUMENT_INPUT' });
});

test('STRICT tables insert into a temporary base-schema DB and enforce provenance and corpus FKs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'text-corpus-'));
  const db = new DatabaseSync(join(directory, 'documents.sqlite'));
  try {
    db.exec('PRAGMA foreign_keys=ON');
    db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('./text-corpus-documents.sql', import.meta.url), 'utf8'));
    const a = file(1, document('From'));
    a.document.content[2].text = leaf([link('Page', 'public')]);
    a.document.content[2].text.ko.push({ text: '\u0000' });
    const files = [a, file(2), file(3, { ...document(), status: 'excluded' }, 'historical')];
    for (const { source_id, document: d } of files) {
      const bytes = Buffer.from(JSON.stringify(d));
      db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(source_id, `synthetic/${source_id}.json`, 'application/json', sha256(bytes), bytes.length, bytes);
      for (const record of flattenJson(d)) {
        const columns = ['source_id', ...Object.keys(record)];
        db.prepare(`INSERT INTO source_record (${columns}) VALUES (${columns.map(() => '?')})`).run(source_id, ...Object.values(record));
      }
    }
    const mapped = map(...files);
    for (const [table, columns] of Object.entries(TEXT_CORPUS_DOCUMENTS_TABLE_COLUMNS)) {
      assert.deepEqual(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name).sort(), [...columns].sort());
      const insert = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${columns.map(() => '?')})`);
      for (const row of mapped[table]) insert.run(...columns.map((column) => row[column]));
      assert.equal(db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, mapped[table].length);
    }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(db.prepare("SELECT hex(text) AS bytes FROM text_document_run WHERE source_id=1 AND json_pointer='/content/2/text/ko/1'").get().bytes, '00');
    const rejects = [
      "UPDATE text_document SET source_id=99 WHERE source_id=1",
      "UPDATE text_document_locale SET json_pointer='/missing' WHERE source_id=1",
      "UPDATE text_document_node SET ordinal=-1 WHERE source_id=1",
      "UPDATE text_document_node SET kind='unknown' WHERE source_id=1",
      "UPDATE text_document_node SET depth=NULL WHERE kind='heading'",
      "UPDATE text_document_node SET list_start='not-an-integer' WHERE kind='list'",
      "UPDATE text_document_run SET href='https://example.org' WHERE source_id=1",
      "UPDATE text_document_table_cell SET row_pointer='/content/0' WHERE cell_kind='body'",
      "UPDATE text_document_link SET target_source_id=3 WHERE source_id=1",
      "UPDATE text_document_link SET target_anchor_ordinal=999 WHERE source_id=1",
      "UPDATE text_document_link SET resolution='pending' WHERE source_id=1",
      "UPDATE text_document SET slug='Page' WHERE source_id=1",
    ];
    for (const sql of rejects) assert.throws(() => db.exec(sql), undefined, sql);
    assert.ok(db.prepare('PRAGMA table_list').all().filter((row) => row.name.startsWith('text_document')).every((row) => row.strict === 1));
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
