import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';

import {
  AESTHETIC_KINDS,
  DB_NAME,
  exportDocumentPage,
  putDocument,
  validateDocument,
  verifyStore,
} from './mda-store.mjs';

const SAMPLE = {
  id: 'janseon-core',
  title: '잔선: 서울',
  onePage: {
    title: '잔선: 서울',
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
      body: '고정 직교 아이소메트릭 카메라와 4방향 타일 격자를 공유합니다',
      sourcePath: 'Concept.md',
    },
  ],
  dynamics: [
    {
      body: '실시간 진형·카드 전투',
      sourcePath: 'Concept.md',
    },
  ],
  aesthetics: [
    {
      kind: 'Challenge',
      body: '전투는 턴제 SRPG가 아닙니다',
      sourcePath: 'Concept.md',
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
      "INSERT INTO documents (id, title, one_page_title, audience, picture_note, source_git) VALUES ('ghost','x','x','x','x','')",
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

test('export page HTML contains a mechanics string from SQLite', () => {
  const dir = freshDir();
  try {
    const dbPath = join(dir, DB_NAME);
    putDocument({ dbPath, document: SAMPLE });
    const htmlPath = join(dir, 'index.html');
    exportDocumentPage({ dbPath, outPath: htmlPath, documentId: 'janseon-core' });
    const html = readFileSync(htmlPath, 'utf8');
    assert.match(html, /4방향 타일 격자/);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const row = db.prepare('SELECT body FROM mechanics WHERE document_id = ?').get('janseon-core');
    db.close();
    assert.ok(html.includes(row.body));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
