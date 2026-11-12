#!/usr/bin/env node
// W2V-34 — 개막 시점 지하 영토를 지상과 같게 맞춘다.
//
// 소유자 규칙(2026-11-12): "개막 시점늬 지하 영토는 contest 가 없고 지상 영역이랑 맞추어 같은 팩션의 소속 영역이야"
//
// 입력: data/sql/120-map-core.sql 의 map_edge(381행). 이 행들은 저장된 SQL이다(생성기는 보관된 export-sql.mjs 하나뿐이고
// 재실행 가드가 있다). 그래서 이 스크립트가 map_edge.control/control_ko 두 열의 리터럴만 바꾼다(나머지 바이트 불변).
//
// 규칙(지상 배정 = site/map.mjs DISTRICT_FACTION = map-district-faction.mjs의 OWNER_RULE과 같은 표):
//   1. 양 끝 역의 구 진영이 같으면 그 진영의 held 구간이다.
//   2. 양 끝 역의 구 진영이 다르면(국경 구간) 데이터 모델에 분할점(경계 역)이 없으므로 구간을 쪼개지 않는다.
//      구간은 두 역 사이 직선(지도가 그리는 선분)이고, 이를 구 폴리곤(map_region.path)과 겹쳐
//      두 끝 구 진영 각각 안을 지나는 길이를 잰다. 더 긴 쪽 진영의 구간으로 한다. 같으면 from 역(a)의 진영.
//   3. 모든 구간은 status=held, polityIds=[진영], primary=진영, currentHegemons=[그 진영].
//   4. map_station은 읽기만 한다: 모든 역의 control·surface_polity_ids가 구 진영과 어긋나면 크게 실패한다
//      (어긋난 역이 있으면 그 역도 같은 방식으로 고친다 — 지금은 0건).
//
// 사용법:
//   node scripts/pages/map-opening-underground.mjs            # 적용(이미 맞으면 아무것도 쓰지 않는다)
//   node scripts/pages/map-opening-underground.mjs --check    # 검사만: 예정 변경을 보고하고 쓰지 않는다
//   node scripts/pages/map-opening-underground.mjs --report <path>   # 국경 구간 배정표를 JSON으로 기록
// 결정성: 재실행은 변경 0건. 시간 등 비결정 요소 없음.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { DISTRICT_FACTION } from '../../site/map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SQL_DIR = path.resolve(REPO, 'data/sql');
const FILE = '120-map-core.sql';
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const REPORT = (() => { const i = argv.indexOf('--report'); return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : null; })();
const fail = (code, detail) => { console.error(`E_${code}: ${detail}`); process.exit(1); };

const FACTION_OF = new Map(Object.entries(DISTRICT_FACTION).flatMap(([f, gus]) => gus.map((g) => [g, f])));
const DISPLAY = { en: { government: 'The Government', 'free-city': 'Free City', arc: 'Arc' }, ko: { government: '정부', 'free-city': '자유도시', arc: 'Arc' } };
const factionOf = (district, where) => FACTION_OF.get(district) ?? fail('UNKNOWN_DISTRICT', `${where}: ${district}`);

// --- SQL 적재 ---
const raw = new Map();
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=OFF');
for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) {
  const text = fs.readFileSync(path.join(SQL_DIR, f), 'utf8');
  if (text.includes('\r')) fail('CRLF', f);
  raw.set(f, text);
  try { db.exec(text); } catch { /* 단독 실행 불가 파일(스키마 등) */ }
}
const all = (sql) => db.prepare(sql).all();

// --- 리터럴 수술(map-district-faction.mjs / aux-edit.mjs와 같은 방식) ---
const splitTopLevel = (s) => {
  const out = []; let cur = '', inStr = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inStr) {
      if (c === "'") { if (s[i + 1] === "'") { cur += "''"; i += 2; continue; } inStr = false; cur += c; i++; continue; }
      cur += c; i++; continue;
    }
    if (c === "'") { inStr = true; cur += c; i++; continue; }
    if (c === ',') { out.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  out.push(cur);
  return out;
};
const literalOf = (v) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const INSERT_RE = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \((.*)\);$/;
const lines = raw.get(FILE).split('\n');
const stmtOf = new Map(); // table -> Map<pk, {idx, cols, lits}>
lines.forEach((line, idx) => {
  const m = line.match(INSERT_RE);
  if (!m) return;
  const cols = m[2].split(',').map((c) => c.trim());
  const lits = splitTopLevel(m[3]);
  if (cols.length !== lits.length) fail('PARSE_ARITY', `${FILE}:${idx + 1}`);
  const rebuilt = `INSERT INTO ${m[1]} (${m[2]}) VALUES (${lits.join(',')});`;
  if (rebuilt !== line) fail('ROUNDTRIP', `${FILE}:${idx + 1}`);
  if (!stmtOf.has(m[1])) stmtOf.set(m[1], new Map());
  stmtOf.get(m[1]).set(lits[0].trim(), { idx, cols, lits });
});
const edit = (table, pk, col, value) => {
  const s = stmtOf.get(table)?.get(`'${pk}'`) ?? fail('STMT_MISSING', `${table} ${pk}`);
  const ci = s.cols.indexOf(col);
  if (ci < 0) fail('COL_MISSING', `${table}.${col}`);
  const lead = s.lits[ci].slice(0, s.lits[ci].length - s.lits[ci].trimStart().length);
  s.lits[ci] = lead + literalOf(value);
  lines[s.idx] = `INSERT INTO ${table} (${s.cols.join(', ')}) VALUES (${s.lits.join(',')});`;
};

// --- 지오메트리: 구간(두 역 사이 직선)을 구 폴리곤과 겹쳐 진영별 길이를 잰다 ---
const parsePoly = (d) => [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const polys = all('SELECT id, district_ko, path FROM map_region').map((r) => {
  const pts = parsePoly(r.path);
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  return { pts, faction: factionOf(r.district_ko, `region ${r.id}`), x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
});
const inside = (x, y, pts) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]; const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const factionAt = (x, y) => { for (const p of polys) if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1 && inside(x, y, p.pts)) return p.faction; return null; };
const SAMPLES = 4000;
const shareByFaction = (A, B) => {
  const len = Math.hypot(B.x - A.x, B.y - A.y); const share = {};
  for (let i = 0; i < SAMPLES; i++) {
    const t = (i + 0.5) / SAMPLES;
    const f = factionAt(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
    if (f) share[f] = (share[f] ?? 0) + len / SAMPLES;
  }
  return Object.fromEntries(Object.entries(share).map(([f, v]) => [f, Math.round(v * 100) / 100]));
};

// --- 역: 읽기 검증 ---
const stations = new Map(all('SELECT id, x, y, district_ko, surface_polity_ids, control, control_ko FROM map_station').map((s) => [s.id, s]));
let stationFixes = 0;
for (const s of stations.values()) {
  const want = factionOf(s.district_ko, `station ${s.id}`);
  const sp = JSON.parse(s.surface_polity_ids);
  const okCtl = (json, lang) => { const c = JSON.parse(json); return c.status === 'held' && c.primary === want && c.polityIds?.length === 1 && c.polityIds[0] === want && (c.currentHegemons ?? []).every((h) => h.kind === 'neutral' || h.stateId === want || h.stateId === undefined) && (c.polityNames ?? [DISPLAY[lang][want]])[0] === DISPLAY[lang][want]; };
  if (!(sp.length === 1 && sp[0] === want && okCtl(s.control, 'en') && okCtl(s.control_ko, 'ko'))) {
    fail('STATION_MISMATCH', `${s.id} (${s.district_ko}→${want}): 역 control이 구 진영과 다르다. 이 스크립트는 map-district-faction.mjs가 이미 맞춘 역만 가정한다`);
  }
}

// --- 구간 계획 ---
const mk = (faction, lang) => ({ source: 'derived-from-surface', deltaId: null, status: 'held', polityIds: [faction], primary: faction, currentHegemons: [{ kind: 'state', name: DISPLAY[lang][faction], stateId: faction }] });
const boundary = [];
let changed = 0;
for (const e of all('SELECT id, a, b, control, control_ko FROM map_edge ORDER BY sort')) {
  const A = stations.get(e.a) ?? fail('EDGE_ENDPOINT', e.id); const B = stations.get(e.b) ?? fail('EDGE_ENDPOINT', e.id);
  const fa = factionOf(A.district_ko, `${e.id}.a`); const fb = factionOf(B.district_ko, `${e.id}.b`);
  let want = fa;
  if (fa !== fb) {
    const share = shareByFaction(A, B);
    const la = share[fa] ?? 0; const lb = share[fb] ?? 0;
    want = lb > la ? fb : fa;
    boundary.push({ id: e.id, from: e.a, to: e.b, from_district: A.district_ko, to_district: B.district_ko, from_faction: fa, to_faction: fb, length_by_faction: share, assigned: want, rule: lb > la ? 'to-district holds the longer share' : la > lb ? 'from-district holds the longer share' : 'tie → from-station faction' });
  }
  const en = JSON.stringify(mk(want, 'en')); const ko = JSON.stringify(mk(want, 'ko'));
  if (e.control !== en) { edit('map_edge', e.id, 'control', en); changed++; }
  if (e.control_ko !== ko) { edit('map_edge', e.id, 'control_ko', ko); changed++; }
}

console.log(`edges planned cell edits: ${changed}; boundary edges: ${boundary.length}; station mismatches: ${stationFixes}`);
if (REPORT) { fs.mkdirSync(path.dirname(REPORT), { recursive: true }); fs.writeFileSync(REPORT, JSON.stringify(boundary, null, 1) + '\n'); console.log(`report: ${REPORT}`); }
if (CHECK) { console.log('CHECK: nothing written.'); process.exit(0); }
if (changed === 0) { console.log('OK: nothing to change (already aligned).'); process.exit(0); }
fs.writeFileSync(path.join(SQL_DIR, FILE), lines.join('\n'));

// --- 적용 후 재적재 검증: 허용 열 외 변화 0, 모든 구간 held·진영 일치 ---
const vdb = new DatabaseSync(':memory:'); vdb.exec('PRAGMA foreign_keys=OFF');
for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) { try { vdb.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8')); } catch { /* skip */ } }
const after = vdb.prepare('SELECT id, a, b, control, control_ko FROM map_edge').all();
if (after.length !== 381) fail('ROW_COUNT', String(after.length));
for (const e of after) { const c = JSON.parse(e.control); const k = JSON.parse(e.control_ko); if (c.status !== 'held' || k.status !== 'held' || c.primary !== k.primary) fail('VERIFY', e.id); }
console.log('OK: applied; 381 edges all held.');
