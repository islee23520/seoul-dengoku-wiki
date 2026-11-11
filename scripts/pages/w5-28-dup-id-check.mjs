#!/usr/bin/env node
// W5-28 M2 검증 — 빌드된 실제 HTML 전수에서 중복 id를 잰다.
// 태그 속성 id="..."(명시 앵커·자동 생성 헤딩 id 포함)를 페이지별로 세어 2회 이상 나오는 id를 보고한다.
// 사용법: node scripts/pages/w5-28-dup-id-check.mjs --html <dist-dir> [--json <path>]
// 기본값: --html <os.tmpdir()>/w528-dist
// 기대: 기존 빌드의 사전 존재 중복(KO Century-Annals '2125년-Arc') 1건만 남는다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--html', path.join(os.tmpdir(), 'w528-dist')));

const ID_RE = /\sid="([^"]+)"/g;
const dups = [];
let pages = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    pages++;
    const html = fs.readFileSync(p, 'utf8');
    const byId = new Map();
    for (const m of html.matchAll(ID_RE)) byId.set(m[1], (byId.get(m[1]) ?? 0) + 1);
    const pageDups = [...byId.entries()].filter(([, n]) => n > 1);
    if (pageDups.length) dups.push({ page: path.relative(DIST, p).replaceAll('\\', '/'), dups: pageDups.map(([id, n]) => ({ id, n })) });
  }
})(DIST);
const summary = { pages, pagesWithDuplicates: dups.length, duplicateIdOccasions: dups.reduce((s, d) => s + d.dups.length, 0) };
console.log(JSON.stringify({ summary, dups }, null, 1));
const ji = args.indexOf('--json');
if (ji >= 0) { fs.mkdirSync(path.dirname(path.join(REPO, args[ji + 1])), { recursive: true }); fs.writeFileSync(path.join(REPO, args[ji + 1]), JSON.stringify({ summary, dups }, null, 1)); }
process.exit(dups.length ? 2 : 0);
