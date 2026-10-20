import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { mapTextCorpusLines, TEXT_CORPUS_LINES_TABLE_COLUMNS } from './text-corpus-lines.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function source(text, source_id = 1, media_type = 'text/markdown') {
  const raw_bytes = Buffer.from(text);
  return { source_id, logical_path: `synthetic-${source_id}`, media_type,
    sha256: hash(raw_bytes), byte_length: raw_bytes.length, raw_bytes, document: null };
}
function map(...files) {
  return mapTextCorpusLines({ bundle: { files } });
}

const cases = [
  { name: 'empty', text: '', lines: [], ending: 'none', final: 0 },
  { name: 'one LF', text: '\n', lines: [''], ending: 'lf', final: 1 },
  { name: 'two final LFs', text: 'a\n\n', lines: ['a', ''], ending: 'lf', final: 1 },
  { name: 'LF', text: 'a\nb\n', lines: ['a', 'b'], ending: 'lf', final: 1 },
  { name: 'CRLF', text: 'a\r\nb\r\n', lines: ['a\r', 'b\r'], ending: 'crlf', final: 1 },
  { name: 'mixed', text: 'a\r\nb\nc\r\n', lines: ['a\r', 'b', 'c\r'], ending: 'mixed', final: 1 },
  { name: 'no final LF', text: 'a\nb', lines: ['a', 'b'], ending: 'lf', final: 0 },
  { name: 'CRLF without final LF', text: 'a\r\nb', lines: ['a\r', 'b'], ending: 'crlf', final: 0 },
  { name: 'literal CR', text: 'a\rb\r', lines: ['a\rb\r'], ending: 'none', final: 0 },
  { name: 'Unicode and BOM', text: '\ufeff서울 e\u0301 😀\n끝\u2028행', lines: ['\ufeff서울 e\u0301 😀', '끝\u2028행'], ending: 'lf', final: 0 },
];

for (const sample of cases) {
  test(`Given ${sample.name}, when lines are mapped, then LF splitting roundtrips exact bytes`, () => {
    const file = source(sample.text);
    const rows = map(file);
    assert.deepEqual(rows.text_line_document, [{ source_id: 1, media_kind: 'markdown', line_count: sample.lines.length,
      ends_with_newline: sample.final, line_ending: sample.ending }]);
    assert.deepEqual(rows.text_line.map((line) => line.text), sample.lines);
    assert.deepEqual(rows.text_line.map((line) => line.line_ordinal), sample.lines.map((_, index) => index));
    const restored = Buffer.from(rows.text_line.map((line) => line.text).join('\n') + (sample.final ? '\n' : ''));
    assert.deepEqual(restored, file.raw_bytes);
    assert.equal(hash(restored), file.sha256);
    assert.ok(Object.isFrozen(rows) && Object.isFrozen(rows.text_line) && rows.text_line.every(Object.isFrozen));
  });
}

test('Given Markdown markers, when regex classification runs, then labels are stateless and preserve literal text', () => {
  const text = ' \t\r\n# Title\r\n   ###### Deep\n####### too-deep\n#no-space\n- item\n  12) item\n+ item\n* item\n| a | b |\n```js\n# inside fence\n```\n~~~\n> quote\nplain';
  const rows = map(source(text));
  assert.deepEqual(rows.text_line.map(({ line_kind, heading_depth }) => [line_kind, heading_depth]), [
    ['blank', null], ['heading', 1], ['heading', 6], ['other', null], ['other', null],
    ['list', null], ['list', null], ['list', null], ['list', null], ['table', null],
    ['fence', null], ['heading', 1], ['fence', null], ['fence', null], ['quote', null], ['other', null],
  ]);
  assert.equal(rows.text_line[1].text, '# Title\r');
});

test('Given CSV and JavaScript source bytes, when mapped, then physical lines stay opaque', () => {
  const csv = source('name,note\r\n"서울","first\nsecond"\r\n# not a heading\n', 2, 'text/csv');
  const js = source('// data\nconst names = ["서울"];\n', 3, 'text/javascript');
  const rows = map(csv, js, source('{}', 4, 'application/json'));
  assert.deepEqual(rows.text_line_document.map((row) => [row.source_id, row.media_kind, row.line_count]), [
    [2, 'csv', 4], [3, 'javascript-data', 2],
  ]);
  assert.ok(rows.text_line.every((row) => row.line_kind === 'other' && row.heading_depth === null));
  for (const file of [csv, js]) {
    const document = rows.text_line_document.find((row) => row.source_id === file.source_id);
    const restored = Buffer.from(rows.text_line.filter((row) => row.source_id === file.source_id)
      .map((row) => row.text).join('\n') + (document.ends_with_newline ? '\n' : ''));
    assert.equal(hash(restored), file.sha256);
  }
});

test('Given invalid mapper boundary inputs, when mapping, then corrupt text or ownership is rejected', () => {
  assert.throws(() => mapTextCorpusLines({ bundle: {} }), { code: 'E_TEXT_CORPUS_BUNDLE' });
  assert.throws(() => map(source('a', 0)), { code: 'E_TEXT_CORPUS_SOURCE_ID' });
  assert.throws(() => map(source('a'), source('b')), { code: 'E_TEXT_CORPUS_SOURCE_ID' });
  assert.throws(() => map({ ...source('a'), raw_bytes: 'a' }), { code: 'E_TEXT_CORPUS_BYTES' });
  assert.throws(() => map({ ...source('a'), raw_bytes: Buffer.from([0xff]) }), { code: 'E_TEXT_CORPUS_UTF8' });
});

test('Given source_file bytes and module DDL, when rows are stored, then STRICT constraints and foreign keys preserve provenance', async () => {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  try {
    db.exec(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    db.exec(await readFile(new URL('./text-corpus-lines.sql', import.meta.url), 'utf8'));
    const files = cases.map((sample, index) => source(sample.text, index + 1));
    for (const file of files) {
      db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(file.source_id, file.logical_path,
        file.media_type, file.sha256, file.byte_length, file.raw_bytes);
    }
    const rows = map(...files);
    for (const [table, columns] of Object.entries(TEXT_CORPUS_LINES_TABLE_COLUMNS)) {
      assert.deepEqual(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name), columns);
      const insert = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      for (const row of rows[table]) {
        assert.deepEqual(Object.keys(row), columns);
        insert.run(...columns.map((column) => row[column]));
      }
    }
    for (const file of files) {
      const document = db.prepare('SELECT * FROM text_line_document WHERE source_id=?').get(file.source_id);
      const lines = db.prepare('SELECT text FROM text_line WHERE source_id=? ORDER BY line_ordinal').all(file.source_id);
      const restored = Buffer.from(lines.map((row) => row.text).join('\n') + (document.ends_with_newline ? '\n' : ''));
      const stored = db.prepare('SELECT * FROM source_file WHERE source_id=?').get(file.source_id);
      assert.equal(document.line_count, lines.length);
      assert.deepEqual(restored, Buffer.from(stored.raw_bytes));
      assert.equal(hash(restored), stored.sha256);
    }
    assert.equal(db.prepare("SELECT count(*) AS n FROM pragma_table_list WHERE name IN ('text_line_document','text_line') AND strict=1").get().n, 2);
    const documentInsert = db.prepare('INSERT INTO text_line_document VALUES (?,?,?,?,?)');
    assert.throws(() => documentInsert.run(999, 'markdown', 1, 0, 'none'), /FOREIGN KEY/);
    const update = (column, value) => db.prepare(`UPDATE text_line_document SET ${column}=? WHERE source_id=2`).run(value);
    for (const [column, value] of [['media_kind', 'html'], ['line_count', -1], ['ends_with_newline', 2], ['line_ending', 'cr'], ['line_count', 'not-an-integer'], ['line_count', 0], ['line_ending', 'none']]) {
      assert.throws(() => update(column, value));
    }
    const lineInsert = db.prepare('INSERT INTO text_line VALUES (?,?,?,?,?)');
    for (const values of [[999, 0, 'x', 'other', null], [1, -1, 'x', 'other', null],
      [1, 0, 'a\nb', 'other', null], [1, 0, 'x', 'unknown', null], [1, 0, '# x', 'heading', null],
      [1, 0, '# x', 'heading', 7], [1, 0, 'x', 'other', 1], [1, 'ordinal', 'x', 'other', null]]) {
      assert.throws(() => lineInsert.run(...values));
    }
    assert.throws(() => lineInsert.run(2, 0, '', 'blank', null), /UNIQUE/);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
