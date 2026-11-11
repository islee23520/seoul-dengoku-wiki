#!/usr/bin/env node
// W5-28 step 8e — 통합 사이트 독자 시나리브라우저 순회(두 언어).
// dist-pages를 Bun.serve로 띄우고 헤드리스 WebView로 걷는다: HTTP 상태, console/pageerror 수, h1,
// 언어 전환 링크 존재(3페이지), 데스크톱 1280·모바일 390 스크린샷(4페이지×2언어).
// 사용법: node scripts/pages/w5-28-browser-walk.mjs [--dist <dir>] [--shots <dir>] [--json <path>]
// 요구: bun 런타임(WebView 내장). node로 실행하면 bun을 다시 띄운다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--dist', 'C:/Users/oliver/AppData/Local/Temp/w528-dist'));
const SHOTS = path.resolve(opt('--shots', 'C:/Users/oliver/AppData/Local/Temp/w5-28-scratch/shots'));
const JSON_OUT = path.resolve(opt('--json', 'docs/drafts/reports/w5-28-browser-walk.json'));

if (!process.execPath.includes('bun')) {
  const bun = process.env.BUN_PATH ?? 'bun';
  const r = spawnSync(bun, [fileURLToPath(import.meta.url), ...args], { stdio: 'inherit', env: process.env, cwd: REPO });
  process.exit(r.status ?? 1);
}

const PAGES = [
  ['home', '/'],
  ['factions-index', '/wiki/factions/'],
  ['faction-government', '/wiki/factions/government/'],
  ['faction-free-city', '/wiki/factions/free-city/'],
  ['faction-arc', '/wiki/factions/arc/'],
  ['duchies', '/wiki/duchies/'],
  ['Scenario-Timeline', '/wiki/Scenario-Timeline/'],
  ['Century-Annals', '/wiki/Century-Annals/'],
  ['World-Unbinding', '/wiki/World-Unbinding/'],
  ['Offices-and-Ranks', '/wiki/Offices-and-Ranks/'],
  ['Faith-Culture-Schism', '/wiki/Faith-Culture-Schism/'],
  ['Characters-Factions-and-Professions', '/wiki/Characters-Factions-and-Professions/'],
  ['Glossary', '/wiki/Glossary/'],
  ['World-Map-Construction', '/wiki/World-Map-Construction/'],
  ['Structures', '/wiki/Structures/'],
  ['Hostile-Ecology-Index', '/wiki/Hostile-Ecology-Index/'],
  ['Hostile-Group-G01', '/wiki/Hostile-Group-G01/'],
  ['Hostile-Group-G10', '/wiki/Hostile-Group-G10/'],
  ['Hostile-Group-G20', '/wiki/Hostile-Group-G20/'],
  ['External-Theaters', '/wiki/External-Theaters/'],
  ['Regional-Physical-AI-Arcs', '/wiki/Regional-Physical-AI-Arcs/'],
  ['person-0145', '/wiki/people/person-0145/'],
  ['person-0998', '/wiki/people/person-0998/'],
  ['person-0057', '/wiki/people/person-0057/'],
  ['person-1018', '/wiki/people/person-1018/'],
  ['family-tree', '/wiki/families/c624-d574-c8fc/'],
  ['people-search', '/wiki/people/'],
  ['map', '/wiki/map/'],
  ['showcase', '/wiki/seoul-showcase/'],
  ['gdd-one', '/gdd/overview/'],
];
const SHOT_PAGES = ['home', 'factions-index', 'person-1018', 'Hostile-Ecology-Index'];
const TOGGLE_PAGES = ['home', 'Century-Annals', 'person-1018'];

const server = Bun.serve({ port: 0, async fetch(req) {
  const u = new URL(req.url);
  let p = u.pathname;
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, p);
  if (!fs.existsSync(file)) { if (fs.existsSync(path.join(DIST, p, 'index.html'))) file = path.join(DIST, p, 'index.html'); else return new Response('not found', { status: 404 }); }
  const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.json') ? 'application/json' : file.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
  return new Response(fs.readFileSync(file), { headers: { 'content-type': type } });
} });
const BASE = `http://localhost:${server.port}`;

const results = [];
for (const lang of ['en', 'ko']) {
  for (const [name, route] of PAGES) {
    const url = BASE + (lang === 'ko' ? '/ko' : '') + route;
    let status = 0;
    try { status = (await fetch(url)).status; } catch (e) { results.push({ lang, name, status: 0, error: String(e) }); continue; }
    if (status !== 200) { results.push({ lang, name, status }); continue; }
    const web = new Bun.WebView({ headless: true, width: 1280, height: 900 });
    const consoleErrors = [];
    web.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(String(msg.text()).slice(0, 160)); });
    web.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err).slice(0, 160)}`));
    await web.loadURL(url);
    await new Promise((r) => setTimeout(r, 700));
    const h1 = await web.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '');
    const toggle = await web.evaluate(() => !!document.querySelector('a[href*="/ko/"], a[href="/"], .VPNavBarTranslations'));
    if (SHOT_PAGES.includes(name)) {
      await web.screenshot({ path: path.join(SHOTS, `${lang}-${name}-1280.png`) });
      await web.setViewportSize?.({ width: 390, height: 844 });
      await new Promise((r) => setTimeout(r, 300));
      await web.screenshot({ path: path.join(SHOTS, `${lang}-${name}-390.png`) });
      await web.setViewportSize?.({ width: 1280, height: 900 });
    }
    web.close();
    results.push({ lang, name, status, consoleErrors: consoleErrors.length, consoleErrorSample: consoleErrors.slice(0, 3), h1: h1.slice(0, 80), langToggle: TOGGLE_PAGES.includes(name) ? toggle : undefined });
  }
}
server.stop(true);
fs.mkdirSync(path.dirname(path.join(REPO, JSON_OUT)), { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });
fs.writeFileSync(path.join(REPO, JSON_OUT), JSON.stringify({ base: BASE, pages: PAGES.length, results }, null, 1));
const bad = results.filter((r) => r.status !== 200 || r.consoleErrors > 0);
console.log(JSON.stringify({ total: results.length, non200: results.filter((r) => r.status !== 200).length, pagesWithConsoleErrors: bad.filter((r) => r.consoleErrors).length, non200List: results.filter((r) => r.status !== 200).map((r) => `${r.lang}:${r.name}:${r.status}`), errorPages: bad.filter((r) => r.consoleErrors).map((r) => `${r.lang}:${r.name}(${r.consoleErrors})`) }, null, 1));
