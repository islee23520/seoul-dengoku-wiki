#!/usr/bin/env node
// W5-28 step 8e — 통합 사이트 독자 시나리브라우저 순회(두 언어).
// dist-pages를 로컬 http로 띄우고 헤드리스 Edge(msedge.exe --headless --remote-debugging-port)를
// CDP(WebSocket)로 구동한다: HTTP 상태(fetch), console error·exception(CDP Runtime 이벤트 + 서빙 레이어
// 주입 수집기 이중 확인), h1, 언어 전환 링크(3페이지), 데스크톱 1280·모바일 390 스크린샷(4페이지×2언어).
// 사용법: node scripts/pages/w5-28-browser-walk.mjs [--dist <dir>] [--shots <dir>] [--json <path>] [--edge <exe>] [--port 9223]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--dist', 'C:/Users/oliver/AppData/Local/Temp/w528-dist'));
const SHOTS = path.resolve(opt('--shots', 'C:/Users/oliver/AppData/Local/Temp/w5-28-scratch/shots'));
const JSON_RAW = opt('--json', 'docs/drafts/reports/w5-28-browser-walk.json');
const JSON_OUT = path.isAbsolute(JSON_RAW) ? JSON_RAW : path.join(REPO, JSON_RAW);
const EDGE = opt('--edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const PORT = Number(opt('--port', '9223'));

const PAGES = [
  ['home', '/'], ['factions-index', '/wiki/factions/'], ['faction-government', '/wiki/factions/government/'],
  ['faction-free-city', '/wiki/factions/free-city/'], ['faction-arc', '/wiki/factions/arc/'], ['duchies', '/wiki/duchies/'],
  ['Scenario-Timeline', '/wiki/Scenario-Timeline/'], ['Century-Annals', '/wiki/Century-Annals/'], ['World-Unbinding', '/wiki/World-Unbinding/'],
  ['Offices-and-Ranks', '/wiki/Offices-and-Ranks/'], ['Faith-Culture-Schism', '/wiki/Faith-Culture-Schism/'],
  ['Characters-Factions-and-Professions', '/wiki/Characters-Factions-and-Professions/'], ['Glossary', '/wiki/Glossary/'],
  ['World-Map-Construction', '/wiki/World-Map-Construction/'], ['Structures', '/wiki/Structures/'],
  ['Hostile-Ecology-Index', '/wiki/Hostile-Ecology-Index/'], ['Hostile-Group-G01', '/wiki/Hostile-Group-G01/'],
  ['Hostile-Group-G10', '/wiki/Hostile-Group-G10/'], ['Hostile-Group-G20', '/wiki/Hostile-Group-G20/'],
  ['External-Theaters', '/wiki/External-Theaters/'], ['Regional-Physical-AI-Arcs', '/wiki/Regional-Physical-AI-Arcs/'],
  ['person-0145', '/wiki/people/person-0145/'], ['person-0998', '/wiki/people/person-0998/'],
  ['person-0057', '/wiki/people/person-0057/'], ['person-1018', '/wiki/people/person-1018/'],
  ['family-tree', '/wiki/families/c624-d574-c8fc/'], ['people-search', '/wiki/people/'], ['map', '/wiki/map/'],
  ['showcase', '/wiki/seoul-showcase/'],
];
const SHOT_PAGES = ['home', 'factions-index', 'person-1018', 'Hostile-Ecology-Index'];
const TOGGLE_PAGES = ['home', 'Century-Annals', 'person-1018'];
const PROBE = `<script>window.__errs=[];window.addEventListener("error",function(e){window.__errs.push(String(e.message||e.error).slice(0,160))});window.addEventListener("unhandledrejection",function(e){window.__errs.push(String(e.reason).slice(0,160))});var _ce=console.error;console.error=function(){try{window.__errs.push(Array.from(arguments).join(" ").slice(0,160))}catch(_){}_ce.apply(console,arguments)};</script>`;

// ---- 로컬 서버(프로브 주입) ----
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.json') ? 'application/json' : file.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
  let body = fs.readFileSync(file);
  if (file.endsWith('.html')) body = Buffer.from(String(body).replace('</head>', PROBE + '</head>'));
  res.writeHead(200, { 'content-type': type });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---- GDD 실재 slug 하나 선정 ----
const gddDir = path.join(DIST, 'gdd');
const gddSlug = fs.existsSync(gddDir) ? fs.readdirSync(gddDir).find((d) => fs.existsSync(path.join(gddDir, d, 'index.html'))) : null;
if (gddSlug) PAGES.push(['gdd-one', `/gdd/${gddSlug}/`]);

// ---- Edge CDP 구동(실행마다 새 프로필, 종료 시 확실 정리) ----
const profile = fs.mkdtempSync(path.join(path.dirname(SHOTS), 'edge-cdp-'));
const proc = spawn(EDGE, ['--headless', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { proc.kill(); } catch {} try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup); process.on('SIGINT', () => { cleanup(); process.exit(130); });
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 400));
  try { const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); wsUrl = v.webSocketDebuggerUrl; break; } catch {}
}
if (!wsUrl) { console.error('E_CDP: Edge DevTools 미기동'); process.exit(21); }

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = (e) => j(new Error('ws ' + e)); });
let msgId = 0;
const pending = new Map();
const sessions = new Map(); // sessionId -> {events: [], loaded: false}
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); return; }
  if (m.sessionId && sessions.has(m.sessionId)) {
    const s = sessions.get(m.sessionId);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') s.events.push((m.params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160));
    if (m.method === 'Runtime.exceptionThrown') s.events.push('exception: ' + String(m.params.exceptionDetails?.text ?? '').slice(0, 140));
    if (m.method === 'Page.loadEventFired') s.loaded = true;
  }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++msgId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });

const results = [];
for (const lang of ['en', 'ko']) {
  for (const [name, route] of PAGES) {
    const url = BASE + (lang === 'ko' ? '/ko' : '') + route;
    const status = await new Promise((resolve) => { const q = http.get(url, (m) => { m.resume(); resolve(m.statusCode); }); q.on('error', () => resolve(0)); });
    if (status !== 200) { results.push({ lang, name, status }); continue; }
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = { events: [], loaded: false };
    sessions.set(sessionId, s);
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Page.navigate', { url }, sessionId);
    for (let i = 0; i < 40 && !s.loaded; i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 350));
    const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)).result?.value;
    const h1 = await ev("document.querySelector('h1')?.textContent?.trim() ?? ''");
    const errs = await ev('JSON.parse(JSON.stringify(window.__errs ?? []))');
    const toggle = await ev("!!document.querySelector('a[href*=\"/ko/\"], a[href=\"/\"], .VPNavBarTranslations')");
    results.push({ lang, name, status, cdpErrors: s.events.length, cdpErrorSample: s.events.slice(0, 3), probeErrors: errs.length, consoleErrors: s.events.length + errs.length, consoleErrorSample: [...s.events, ...errs].slice(0, 3), h1: String(h1).slice(0, 80), langToggle: TOGGLE_PAGES.includes(name) ? toggle : undefined });
    sessions.delete(sessionId);
    await send('Target.closeTarget', { targetId });
  }
}
fs.mkdirSync(SHOTS, { recursive: true });
const shots = [];
for (const lang of ['en', 'ko']) {
  for (const name of SHOT_PAGES) {
    const route = PAGES.find(([n]) => n === name)[1];
    const url = BASE + (lang === 'ko' ? '/ko' : '') + route;
    for (const [w, h, tag] of [[1280, 900, '1280'], [390, 844, '390']]) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = { events: [], loaded: false };
      sessions.set(sessionId, s);
      await send('Page.enable', {}, sessionId);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: tag === '390' }, sessionId);
      await send('Page.navigate', { url }, sessionId);
      for (let i = 0; i < 40 && !s.loaded; i++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 400));
      const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const out = path.join(SHOTS, `${lang}-${name}-${tag}.png`);
      fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
      shots.push({ file: path.basename(out), bytes: fs.statSync(out).size });
      sessions.delete(sessionId);
      await send('Target.closeTarget', { targetId });
    }
  }
}
ws.close();
cleanup();
server.close();
fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, edge: EDGE + ' (CDP)', gddSlug, pages: PAGES.length, results, shots }, null, 1));
const bad = results.filter((x) => x.status !== 200);
const errPages = results.filter((x) => x.consoleErrors > 0);
console.log(JSON.stringify({
  total: results.length, non200: bad.length, non200List: bad.map((x) => `${x.lang}:${x.name}:${x.status}`),
  pagesWithConsoleErrors: errPages.length, errorPages: errPages.map((x) => `${x.lang}:${x.name}(${x.consoleErrors}) ${JSON.stringify(x.consoleErrorSample).slice(0, 140)}`),
  langToggle: results.filter((x) => x.langToggle !== undefined).map((x) => `${x.lang}:${x.name}=${x.langToggle}`),
  shotsOk: shots.filter((s) => s.bytes > 5000).length + '/' + shots.length,
  h1Samples: results.filter((x) => ['home', 'person-1018', 'Hostile-Ecology-Index', 'showcase'].includes(x.name) && x.lang === 'ko' && typeof x.h1 === 'string').map((x) => `${x.name}:${x.h1.slice(0, 40)}`),
}, null, 1));
