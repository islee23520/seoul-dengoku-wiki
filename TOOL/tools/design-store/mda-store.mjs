#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export const DB_NAME = 'mda-design-store.sqlite';
export const RECEIPT_NAME = 'mda-design-store.receipt.json';
export const AESTHETIC_KINDS = [
  'Sensation',
  'Fantasy',
  'Narrative',
  'Challenge',
  'Fellowship',
  'Discovery',
  'Expression',
  'Submission',
];
export const SECTION_ORDER = ['제품', '캠페인', '전투', '세계', '전략', '정치', '인물', '구현'];
export const SCHEMA_VERSION = 3;
const SCHEMA_SQL = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'schema.sql'), 'utf8');

function sha256Bytes(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function receiptPath(dbPath) {
  return join(dirname(dbPath), RECEIPT_NAME);
}

export function validateDocument(doc) {
  const err = [];
  if (!doc || typeof doc !== 'object') return ['document required'];
  if (!doc.id) err.push('id required');
  if (!doc.title) err.push('title required');
  const page = doc.onePage;
  if (!page || typeof page !== 'object') err.push('onePage required');
  else {
    if (!page.title) err.push('onePage.title required');
    if (!page.audience) err.push('onePage.audience required');
    if (!page.pictureNote) err.push('onePage.pictureNote required');
    if (!Array.isArray(page.panels) || page.panels.length === 0) err.push('onePage.panels required');
    else {
      for (const panel of page.panels) {
        if (!panel?.heading || !panel?.body || !panel?.sourcePath) err.push('panel heading/body/sourcePath required');
      }
    }
  }
  for (const field of ['mechanics', 'dynamics']) {
    if (!Array.isArray(doc[field]) || doc[field].length === 0) err.push(`${field} required`);
    else {
      for (const row of doc[field]) {
        if (!row?.name || !row?.body || !row?.sourcePath) err.push(`${field} name/body/sourcePath required`);
      }
    }
  }
  if (!Array.isArray(doc.aesthetics) || doc.aesthetics.length === 0) err.push('aesthetics required');
  else {
    for (const row of doc.aesthetics) {
      if (!row?.body || !row?.sourcePath) err.push('aesthetic body/sourcePath required');
      if (!AESTHETIC_KINDS.includes(row.kind)) err.push(`aesthetic kind invalid: ${row.kind}`);
    }
  }
  return err;
}

function seedLookups(db) {
  const insertSection = db.prepare('INSERT OR IGNORE INTO sections (id, sort) VALUES (?, ?)');
  SECTION_ORDER.forEach((id, i) => insertSection.run(id, i));
  insertSection.run('설계', SECTION_ORDER.length);
  const insertKind = db.prepare('INSERT OR IGNORE INTO aesthetic_kinds (kind) VALUES (?)');
  for (const kind of AESTHETIC_KINDS) insertKind.run(kind);
}

function ensureSource(db, path) {
  db.prepare('INSERT OR IGNORE INTO sources (path) VALUES (?)').run(path);
}

function openSchema(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version < SCHEMA_VERSION) {
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec(`
      DROP TABLE IF EXISTS canon_headings;
      DROP TABLE IF EXISTS canon_files;
      DROP TABLE IF EXISTS aesthetics;
      DROP TABLE IF EXISTS dynamics;
      DROP TABLE IF EXISTS mechanics;
      DROP TABLE IF EXISTS one_page_panels;
      DROP TABLE IF EXISTS documents;
      DROP TABLE IF EXISTS sources;
      DROP TABLE IF EXISTS aesthetic_kinds;
      DROP TABLE IF EXISTS sections;
    `);
    db.exec(SCHEMA_SQL);
    db.exec('PRAGMA foreign_keys = ON');
  }
  seedLookups(db);
  return db;
}

export function putDocument({ dbPath, document, sourceGit = '' }) {
  const errors = validateDocument(document);
  if (errors.length) throw new Error(errors.join('; '));
  const db = openSchema(dbPath);
  db.exec('BEGIN');
  db.exec('PRAGMA foreign_keys = ON');
  const section = document.section || '설계';
  db.prepare('INSERT OR IGNORE INTO sections (id, sort) VALUES (?, ?)').run(section, 99);
  const sourcePaths = [
    ...document.onePage.panels.map((row) => row.sourcePath),
    ...document.mechanics.map((row) => row.sourcePath),
    ...document.dynamics.map((row) => row.sourcePath),
    ...document.aesthetics.map((row) => row.sourcePath),
  ];
  for (const path of sourcePaths) ensureSource(db, path);
  db.prepare('DELETE FROM documents WHERE id = ?').run(document.id);
  db.prepare(
    `INSERT INTO documents (id, title, one_page_title, audience, picture_note, section, source_git)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       one_page_title=excluded.one_page_title,
       audience=excluded.audience,
       picture_note=excluded.picture_note,
       section=excluded.section,
       source_git=excluded.source_git`,
  ).run(
    document.id,
    document.title,
    document.onePage.title,
    document.onePage.audience,
    document.onePage.pictureNote,
    section,
    sourceGit,
  );
  const insertPanel = db.prepare(
    'INSERT INTO one_page_panels (document_id, seq, heading, body, source_path) VALUES (?, ?, ?, ?, ?)',
  );
  document.onePage.panels.forEach((panel, i) => {
    insertPanel.run(document.id, i, panel.heading, panel.body, panel.sourcePath);
  });
  const insertLayer = db.prepare(
    'INSERT INTO mechanics (document_id, seq, name, body, source_path) VALUES (?, ?, ?, ?, ?)',
  );
  document.mechanics.forEach((row, i) => insertLayer.run(document.id, i, row.name, row.body, row.sourcePath));
  const insertDyn = db.prepare(
    'INSERT INTO dynamics (document_id, seq, name, body, source_path) VALUES (?, ?, ?, ?, ?)',
  );
  document.dynamics.forEach((row, i) => insertDyn.run(document.id, i, row.name, row.body, row.sourcePath));
  const insertAes = db.prepare(
    'INSERT INTO aesthetics (document_id, seq, kind, body, source_path) VALUES (?, ?, ?, ?, ?)',
  );
  document.aesthetics.forEach((row, i) => insertAes.run(document.id, i, row.kind, row.body, row.sourcePath));
  db.exec('COMMIT');
  db.close();
  writeReceipt(dbPath);
  return { id: document.id, documents: readReceiptIds(dbPath).documents.length };
}

function readReceiptIds(dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const documents = db.prepare('SELECT id FROM documents ORDER BY id').all().map((r) => r.id);
  let canon = [];
  try {
    canon = db.prepare('SELECT id FROM canon_files ORDER BY id').all().map((r) => r.id);
  } catch {
    canon = [];
  }
  db.close();
  return { documents, canon };
}

function writeReceipt(dbPath) {
  const ids = readReceiptIds(dbPath);
  const dbSha = sha256Bytes(readFileSync(dbPath));
  writeFileSync(receiptPath(dbPath), `${JSON.stringify({ dbSha256: dbSha, ...ids }, null, 2)}\n`);
}

export function verifyStore({ dbPath }) {
  const result = {
    pass: false,
    documents: 0,
    canon: 0,
    missing: [],
    extras: [],
    canonMissing: [],
    canonExtras: [],
    mutated: [],
  };
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(receiptPath(dbPath), 'utf8'));
  } catch {
    result.mutated.push('receipt-missing');
    return result;
  }
  let actualSha;
  try {
    actualSha = sha256Bytes(readFileSync(dbPath));
  } catch {
    result.mutated.push('db-missing');
    return result;
  }
  if (actualSha !== receipt.dbSha256) result.mutated.push('db-bytes');
  const expected = new Set(receipt.documents || []);
  const expectedCanon = new Set(receipt.canon || []);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const actualIds = db.prepare('SELECT id FROM documents ORDER BY id').all().map((r) => r.id);
  let actualCanon = [];
  try {
    actualCanon = db.prepare('SELECT id FROM canon_files ORDER BY id').all().map((r) => r.id);
  } catch {
    actualCanon = [];
  }
  db.close();
  result.documents = actualIds.length;
  result.canon = actualCanon.length;
  for (const id of expected) if (!actualIds.includes(id)) result.missing.push(id);
  for (const id of actualIds) if (!expected.has(id)) result.extras.push(id);
  for (const id of expectedCanon) if (!actualCanon.includes(id)) result.canonMissing.push(id);
  for (const id of actualCanon) if (!expectedCanon.has(id)) result.canonExtras.push(id);
  result.pass =
    result.missing.length === 0 &&
    result.mutated.length === 0 &&
    result.extras.length === 0 &&
    result.canonMissing.length === 0 &&
    result.canonExtras.length === 0;
  return result;
}

export function listMarkdownFiles(rootDir) {
  const out = [];
  const excludedDirectories = new Set(['node_modules', 'dist', 'coverage']);
  function walk(dir, prefix) {
    for (const name of readdirSync(dir).sort()) {
      if (name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${name}` : name;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (excludedDirectories.has(name)) continue;
        walk(full, rel);
      }
      else if (name.endsWith('.md')) out.push(rel);
    }
  }
  walk(rootDir, '');
  return out;
}

function slugFromRel(rel) {
  return rel.replace(/\.md$/i, '').replaceAll('/', '--').toLowerCase();
}

function titleFromMarkdown(text, rel) {
  const m = text.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/[*_`]/g, '').trim();
  return rel.replace(/\.md$/i, '');
}

function headingsFromMarkdown(text) {
  const rows = [];
  const re = /^(#{1,6})\s+(.+)$/gm;
  let match;
  let seq = 0;
  while ((match = re.exec(text))) {
    rows.push({ seq, level: match[1].length, text: match[2].trim() });
    seq += 1;
  }
  return rows;
}

export function ingestCanonDir({ dbPath, canonRoot, pathPrefix = 'LORE', canonDomains, reset = true }) {
  const domains = canonDomains ?? [{ root: canonRoot, prefix: pathPrefix, exclude: () => false }];
  const db = openSchema(dbPath);
  db.exec('BEGIN');
  db.exec('PRAGMA foreign_keys = ON');
  if (reset) db.exec('DELETE FROM canon_files');
  const insertFile = db.prepare(
    'INSERT INTO canon_files (id, path, title, sha256, bytes) VALUES (?, ?, ?, ?, ?)',
  );
  const insertHeading = db.prepare(
    'INSERT INTO canon_headings (file_id, seq, level, text) VALUES (?, ?, ?, ?)',
  );
  let fileCount = 0;
  for (const { root, prefix, exclude = () => false } of domains) {
  for (const rel of listMarkdownFiles(root).filter((candidate) => candidate !== 'AGENTS.md' && !candidate.endsWith('/AGENTS.md') && !exclude(candidate))) {
    fileCount += 1;
    const sourcePath = `${prefix}/${rel}`;
    ensureSource(db, sourcePath);
    const buf = readFileSync(join(root, rel));
    const text = buf.toString('utf8');
    const id = slugFromRel(rel);
    insertFile.run(id, sourcePath, titleFromMarkdown(text, rel), sha256Bytes(buf), buf.length);
    for (const h of headingsFromMarkdown(text)) {
      insertHeading.run(id, h.seq, h.level, h.text);
    }
  }
  }
  db.exec('COMMIT');
  db.close();
  writeReceipt(dbPath);
  return { files: fileCount };
}

export function listCanonFiles({ dbPath }) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  let rows = [];
  try {
    rows = db.prepare('SELECT id, path, title, bytes FROM canon_files ORDER BY path').all();
  } catch {
    rows = [];
  }
  db.close();
  return rows;
}

export function listDocuments({ dbPath }) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const rows = db.prepare(`
    SELECT d.id, d.title, d.audience, d.picture_note, d.section,
           COALESCE(s.sort, 99) AS section_sort
    FROM documents d
    LEFT JOIN sections s ON s.id = d.section
  `).all();
  db.close();
  return rows.sort((a, b) => {
    if (a.section_sort !== b.section_sort) return a.section_sort - b.section_sort;
    return String(a.title).localeCompare(String(b.title), 'ko');
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function exportDocumentPage({ dbPath, outPath, documentId }) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) {
    db.close();
    throw new Error(`document not found: ${documentId}`);
  }
  const panels = db.prepare('SELECT * FROM one_page_panels WHERE document_id = ? ORDER BY seq').all(documentId);
  const mechanics = db.prepare('SELECT * FROM mechanics WHERE document_id = ? ORDER BY seq').all(documentId);
  const dynamics = db.prepare('SELECT * FROM dynamics WHERE document_id = ? ORDER BY seq').all(documentId);
  const aesthetics = db.prepare('SELECT * FROM aesthetics WHERE document_id = ? ORDER BY seq').all(documentId);
  db.close();
  const list = (rows, map) => rows.map(map).join('\n');
  const pagePanels = panels.filter((p) => !String(p.heading).includes('요구'));
  const reqPanels = panels.filter((p) => String(p.heading).includes('요구'));
  const reqSection = reqPanels.length
    ? `<section>
<h2>요구 티켓</h2>
<p class="layer">MDA 층은 설계 어휘다. 개발 단위는 GitHub 이슈다.</p>
${list(reqPanels, (p) => `<h3>${escapeHtml(p.heading)}</h3><p>${escapeHtml(p.body)}</p><p class="src">${escapeHtml(p.source_path)}</p>`)}
</section>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(doc.title)} — 설계 문서</title>
<style>
:root { --ink:#1a1714; --paper:#f4efe4; --line:#c9b896; --metro:#1d4e89; --mute:#6b6256; }
body { margin:0; font:16px/1.55 "Apple SD Gothic Neo","Noto Sans KR",sans-serif; color:var(--ink); background:var(--paper); }
main { max-width:880px; margin:0 auto; padding:36px 24px 80px; }
.kicker { letter-spacing:.14em; font-size:11px; color:var(--mute); }
h1 { font-family:"Song Myung","Apple Myungjo",serif; font-size:32px; margin:8px 0 12px; }
section { margin:28px 0; padding:18px; background:#fffdf8; border:1px solid var(--line); }
h2 { font-size:18px; margin:0 0 8px; }
.layer { font-size:13px; color:var(--mute); margin:0 0 12px; }
.src { font-size:12px; color:var(--mute); }
li { margin:6px 0; }
</style>
</head>
<body>
<main>
<p class="kicker">MDA + one-page · SQLite · ${escapeHtml(doc.section || '설계')}</p>
<p><a href="../" style="color:var(--metro)">설계 목차</a></p>
<h1>${escapeHtml(doc.title)}</h1>
<p>${escapeHtml(doc.picture_note)} · ${escapeHtml(doc.audience)}</p>
<section>
<h2>한 장</h2>
<p class="layer">각 칸은 그 요소가 무엇인지.</p>
${list(pagePanels, (p) => `<h3>${escapeHtml(p.heading)}</h3><p>${escapeHtml(p.body)}</p><p class="src">${escapeHtml(p.source_path)}</p>`)}
</section>
${reqSection}
<section>
<h2>Mechanics</h2>
<p class="layer">규칙·동사·수치. 시스템이 가진 데이터와 알고리즘.</p>
<ul>${list(mechanics, (p) => `<li><b>${escapeHtml(p.name || '항목')}</b> — ${escapeHtml(p.body)} <span class="src">${escapeHtml(p.source_path)}</span></li>`)}</ul>
</section>
<section>
<h2>Dynamics</h2>
<p class="layer">그 규칙이 플레이어 입력과 만나 시간에 따라 만드는 런타임.</p>
<ul>${list(dynamics, (p) => `<li><b>${escapeHtml(p.name || '항목')}</b> — ${escapeHtml(p.body)} <span class="src">${escapeHtml(p.source_path)}</span></li>`)}</ul>
</section>
<section>
<h2>Aesthetics</h2>
<p class="layer">플레이어가 느끼는 반응. Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission.</p>
<ul>${list(aesthetics, (p) => `<li><b>${escapeHtml(p.kind)}</b> — ${escapeHtml(p.body)} <span class="src">${escapeHtml(p.source_path)}</span></li>`)}</ul>
</section>
</main>
</body>
</html>
`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  return outPath;
}

export function exportCanonPage({ dbPath, outPath, fileId }) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const file = db.prepare('SELECT * FROM canon_files WHERE id = ?').get(fileId);
  if (!file) {
    db.close();
    throw new Error(`canon file not found: ${fileId}`);
  }
  const headings = db.prepare('SELECT seq, level, text FROM canon_headings WHERE file_id = ? ORDER BY seq').all(fileId);
  db.close();
  const headingList = headings.map((h) => `<li>H${h.level} ${escapeHtml(h.text)}</li>`).join('\n');
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(file.title)} — 정본</title>
<style>
:root { --ink:#1a1714; --paper:#f4efe4; --line:#c9b896; --metro:#1d4e89; --mute:#6b6256; }
body { margin:0; font:16px/1.55 "Apple SD Gothic Neo","Noto Sans KR",sans-serif; color:var(--ink); background:var(--paper); }
main { max-width:880px; margin:0 auto; padding:36px 24px 80px; }
.kicker { letter-spacing:.14em; font-size:11px; color:var(--mute); }
h1 { font-family:"Song Myung","Apple Myungjo",serif; font-size:32px; margin:8px 0 12px; }
section { margin:28px 0; padding:18px; background:#fffdf8; border:1px solid var(--line); }
.src { font-size:12px; color:var(--mute); }
</style>
</head>
<body>
<main>
<p class="kicker">정본 파일 · SQLite</p>
<p><a href="../" style="color:var(--metro)">설계 목차</a></p>
<h1>${escapeHtml(file.title)}</h1>
<p class="src">${escapeHtml(file.path)} · ${file.bytes} bytes · ${escapeHtml(file.sha256)}</p>
<section>
<h2>머리글</h2>
<ul>${headingList || '<li>머리글 없음</li>'}</ul>
</section>
</main>
</body>
</html>
`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  return outPath;
}

export function exportIndexPage({ dbPath, outPath }) {
  const rows = listDocuments({ dbPath });
  const canon = listCanonFiles({ dbPath });
  const groups = new Map();
  for (const row of rows) {
    const section = row.section || '설계';
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(row);
  }
  const sections = [...groups.entries()].map(([section, docs]) => {
    const cards = docs.map((d) => `<li><a href="${escapeHtml(d.id)}/"><b>${escapeHtml(d.title)}</b></a><p>${escapeHtml(d.picture_note)}</p></li>`).join('\n');
    return `<section><h2>${escapeHtml(section)}</h2><ul class="toc">${cards}</ul></section>`;
  }).join('\n');
  const canonCards = canon.map((f) => `<li><a href="canon/${escapeHtml(f.id)}/"><b>${escapeHtml(f.title)}</b></a><p>${escapeHtml(f.path)}</p></li>`).join('\n');
  const canonSection = canon.length
    ? `<section><h2>정본 전체</h2><p class="layer">코퍼스 마크다운 ${canon.length}개</p><ul class="toc">${canonCards}</ul></section>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>서울:전국 — 설계 문서</title>
<style>
:root { --ink:#1a1714; --paper:#f4efe4; --line:#c9b896; --metro:#1d4e89; --mute:#6b6256; }
body { margin:0; font:16px/1.55 "Apple SD Gothic Neo","Noto Sans KR",sans-serif; color:var(--ink); background:var(--paper); }
main { max-width:880px; margin:0 auto; padding:36px 24px 80px; }
.kicker { letter-spacing:.14em; font-size:11px; color:var(--mute); }
h1 { font-family:"Song Myung","Apple Myungjo",serif; font-size:32px; margin:8px 0 12px; }
section { margin:28px 0; padding:18px; background:#fffdf8; border:1px solid var(--line); }
h2 { font-size:18px; margin:0 0 8px; }
.layer { font-size:13px; color:var(--mute); margin:0 0 12px; }
.toc { list-style:none; padding:0; margin:0; }
.toc li { margin:0 0 14px; padding:0 0 12px; border-bottom:1px solid var(--line); }
.toc a { color:var(--metro); text-decoration:none; }
.toc p { margin:4px 0 0; color:var(--mute); font-size:14px; }
</style>
</head>
<body>
<main>
<p class="kicker">MDA + one-page · SQLite · LORE·GAME-LOGIC·GDD 정본</p>
<h1>서울:전국 — 설계 문서</h1>
<p>한 장이 아니라 정본 문서를 층별로 채운 목차다. 각 칸은 그 요소가 무엇인지.</p>
${sections}
${canonSection}
</main>
</body>
</html>
`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  return { path: outPath, documents: rows.length, canon: canon.length };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command };
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--db') opts.db = rest[++i];
    else if (rest[i] === '--out') opts.out = rest[++i];
    else if (rest[i] === '--id') opts.id = rest[++i];
    else if (rest[i] === '--json') opts.json = rest[++i];
    else throw new Error(`unknown argument: ${rest[i]}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.command === 'put') {
    const document = JSON.parse(readFileSync(opts.json, 'utf8'));
    const res = putDocument({ dbPath: opts.db, document });
    console.log(JSON.stringify({ command: 'put', ...res }));
    return;
  }
  if (opts.command === 'verify') {
    const result = verifyStore({ dbPath: opts.db });
    console.log(JSON.stringify(result));
    if (!result.pass) process.exitCode = 1;
    return;
  }
  if (opts.command === 'export') {
    const path = exportDocumentPage({ dbPath: opts.db, outPath: opts.out, documentId: opts.id });
    console.log(JSON.stringify({ command: 'export', path }));
    return;
  }
  if (opts.command === 'export-index') {
    const res = exportIndexPage({ dbPath: opts.db, outPath: opts.out });
    console.log(JSON.stringify({ command: 'export-index', ...res }));
    return;
  }
  throw new Error('unknown command');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
