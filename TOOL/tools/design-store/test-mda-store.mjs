import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';

import {
  AESTHETIC_KINDS,
  DB_NAME,
  exportDocumentPage,
  exportIndexPage,
  ingestCanonDir,
  listCanonFiles,
  putDocument,
  validateDocument,
  verifyStore,
} from './mda-store.mjs';

const SAMPLE = {
  id: 'janseon-core',
  title: '서울:전국',
  onePage: {
    title: '서울:전국',
    audience: 'designers',
    pictureNote: 'one page, pictures over prose',
    panels: [
      {
        heading: '제품',
        body: '인물 중심 **4X + RPG**입니다',
        sourcePath: 'Concept.md',
      },
    ],
  },
  mechanics: [
    {
      name: '시야',
      body: '시야와 카메라는 용사주식회사 채널의 2.5D 전투 화면을 따른다.',
      sourcePath: 'Intent.md',
    },
  ],
  dynamics: [
    {
      name: '전투 형태',
      body: '전투 형태는 Songs of Silence와 같은 실시간 진형·카드 전투다.',
      sourcePath: 'Intent.md',
    },
  ],
  aesthetics: [
    {
      kind: 'Sensation',
      body: '젖은 콘크리트, 꺼진 안내판, 비상 전원, 녹슨 선로, 손때 묻은 노선도',
      sourcePath: 'Design.md',
    },
  ],
};

function freshDir() {
  return mkdtempSync(join(tmpdir(), 'mda-store-'));
}

test('empty document is rejected', () => {
  const err = validateDocument({});
  assert.ok(err.length > 0, JSON.stringify(err));
});

test('unknown aesthetic kind is rejected', () => {
  const bad = structuredClone(SAMPLE);
  bad.aesthetics[0].kind = 'Fun';
  const err = validateDocument(bad);
  assert.ok(err.some((e) => e.includes('aesthetic')), JSON.stringify(err));
  assert.ok(AESTHETIC_KINDS.includes('Challenge'));
});

test('put then verify PASS', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, true, JSON.stringify(res));
    assert.equal(res.documents, 1);
    assert.deepEqual(res.missing, []);
    assert.deepEqual(res.mutated, []);
    assert.deepEqual(res.extras, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('verify FAILS when a document row is deleted', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath);
    db.prepare("DELETE FROM documents WHERE id = 'janseon-core'").run();
    db.close();
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, false);
    assert.ok(res.missing.includes('janseon-core'), JSON.stringify(res));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('verify FAILS when an extra document row exists', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath);
    db.prepare(
      "INSERT INTO documents (id, title, one_page_title, audience, picture_note, section, source_git) VALUES ('ghost','x','x','x','x','설계','')",
    ).run();
    db.close();
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, false);
    assert.ok(res.extras.includes('ghost'), JSON.stringify(res));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('verify FAILS when stored DB bytes are mutated', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const buf = readFileSync(dbPath);
    buf[buf.length - 20] = buf[buf.length - 20] ^ 0xff;
    writeFileSync(dbPath, buf);
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, false);
    assert.ok(res.mutated.length > 0, JSON.stringify(res));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('mechanics without a name are rejected', () => {
  const bad = structuredClone(SAMPLE);
  delete bad.mechanics[0].name;
  const err = validateDocument(bad);
  assert.ok(err.some((e) => e.includes('name')), JSON.stringify(err));
});

test('export page HTML contains a mechanics string from SQLite', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const htmlPath = join(dir, 'index.html');
    exportDocumentPage({ dbPath, outPath: htmlPath, documentId: 'janseon-core' });
    const html = readFileSync(htmlPath, 'utf8');
    assert.match(html, /2\.5D 전투 화면/);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const row = db.prepare('SELECT body FROM mechanics WHERE document_id = ?').get('janseon-core');
    db.close();
    assert.ok(html.includes(row.body));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('schema keeps foreign keys and lookup tables', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON');
    const version = db.prepare('PRAGMA user_version').get().user_version;
    assert.equal(version, 3);
    const fks = db.prepare("PRAGMA foreign_key_list('mechanics')").all();
    assert.ok(fks.some((fk) => fk.table === 'documents'), JSON.stringify(fks));
    const kinds = db.prepare('SELECT kind FROM aesthetic_kinds ORDER BY kind').all().map((r) => r.kind);
    assert.ok(kinds.includes('Sensation'));
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('orphan mechanic row is rejected by foreign key', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON');
    assert.throws(() => {
      db.prepare(
        'INSERT INTO mechanics (document_id, seq, name, body, source_path) VALUES (?, ?, ?, ?, ?)',
      ).run('no-such', 0, '시야', 'x', 'Intent.md');
    });
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('deleting a document cascades child rows', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON');
    db.prepare("DELETE FROM documents WHERE id = 'janseon-core'").run();
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM mechanics').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM one_page_panels').get().n, 0);
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('export index lists the document title from SQLite', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const htmlPath = join(dir, 'hub.html');
    exportIndexPage({ dbPath, outPath: htmlPath });
    const html = readFileSync(htmlPath, 'utf8');
    assert.match(html, /서울:전국/);
    assert.match(html, /janseon-core\//);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ingestCanonDir stores one row per markdown file and hub lists it', () => {
  const dir = freshDir();
  try {
    const canonRoot = join(dir, 'canon');
    mkdirSync(join(canonRoot, 'regions'), { recursive: true });
    writeFileSync(join(canonRoot, 'Alpha.md'), '# 알파\n\n본문\n');
    writeFileSync(join(canonRoot, 'regions', 'README.md'), '# 지역\n\n## 구\n');
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const ingested = ingestCanonDir({ dbPath, canonRoot, pathPrefix: 'LORE' });
    assert.equal(ingested.files, 2);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const n = db.prepare('SELECT COUNT(*) AS n FROM canon_files').get().n;
    assert.equal(n, 2);
    const headings = db.prepare('SELECT COUNT(*) AS n FROM canon_headings').get().n;
    assert.ok(headings >= 3, String(headings));
    db.close();
    const htmlPath = join(dir, 'hub.html');
    exportIndexPage({ dbPath, outPath: htmlPath });
    const html = readFileSync(htmlPath, 'utf8');
    assert.match(html, /canon\/alpha\//);
    assert.match(html, /canon\/regions--readme\//);
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, true, JSON.stringify(res));
    assert.equal(res.canon, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ingestCanonDir excludes project guidance files across canon domains', () => {
  const dir = freshDir();
  try {
    const firstRoot = join(dir, 'first');
    const secondRoot = join(dir, 'second');
    mkdirSync(firstRoot, { recursive: true });
    mkdirSync(secondRoot, { recursive: true });
    writeFileSync(join(firstRoot, 'AGENTS.md'), '# 첫 지침\n');
    writeFileSync(join(secondRoot, 'AGENTS.md'), '# 둘째 지침\n');
    writeFileSync(join(firstRoot, 'Alpha.md'), '# 알파\n');
    writeFileSync(join(secondRoot, 'Beta.md'), '# 베타\n');
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const ingested = ingestCanonDir({
      dbPath,
      canonRoot: firstRoot,
      canonDomains: [
        { root: firstRoot, prefix: 'FIRST' },
        { root: secondRoot, prefix: 'SECOND' },
      ],
    });
    assert.equal(ingested.files, 2);
    const rows = listCanonFiles({ dbPath });
    assert.deepEqual(rows.map((row) => row.path), ['FIRST/Alpha.md', 'SECOND/Beta.md']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('verify FAILS when a canon_files row is deleted', () => {
  const dir = freshDir();
  try {
    const canonRoot = join(dir, 'canon');
    mkdirSync(canonRoot, { recursive: true });
    writeFileSync(join(canonRoot, 'Alpha.md'), '# 알파\n');
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    ingestCanonDir({ dbPath, canonRoot, pathPrefix: 'LORE' });
    const db = new DatabaseSync(dbPath);
    db.prepare("DELETE FROM canon_files WHERE id = 'alpha'").run();
    db.close();
    const res = verifyStore({ dbPath });
    assert.equal(res.pass, false);
    assert.ok(res.canonMissing.includes('alpha'), JSON.stringify(res));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('schema version 3 exposes canon_files', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const version = db.prepare('PRAGMA user_version').get().user_version;
    assert.equal(version, 3);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
    assert.ok(tables.includes('canon_files'), JSON.stringify(tables));
    assert.ok(tables.includes('canon_headings'), JSON.stringify(tables));
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
