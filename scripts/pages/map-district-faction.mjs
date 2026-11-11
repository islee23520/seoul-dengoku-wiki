#!/usr/bin/env node
// W5-28 fix10 — 지도 진영 필드를 소유자의 구 배정에서 재유도한다.
//
// 소유자 배정(2026-11-10, 구 문자열 그대로가 구속력 있는 입력이다):
//   "everything north of the Han River is wholly Government: Mapo, Yongsan, Jung,
//    Seongdong, Gwangjin, Dongdaemun, Jungnang, Seongbuk, Jongno, Seodaemun,
//    Eunpyeong, Gangbuk, Dobong, Nowon (14 districts, '마포구 용산구 중구 성동구
//    광진구 동대문구 중랑구 성북구 종로구 서대문구 은평구 강북구 도봉구 노원구');
//    Arc holds Seocho, Gangnam, Songpa, Gangdong (서초구 강남구 송파구 강동구);
//    the Free Cities hold Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon,
//    Dongjak, Gwanak (강서구 양천구 영등포구 구로구 금천구 동작구 관악구),
//    one duchy per district."
//  = docs/CANON-BIBLE.md §2.4(25공작령 배정표)·§1 규칙 8, site/map.mjs DISTRICT_FACTION과 동일.
//
// 이전 전환(W5-25)은 각 지역의 옛 국가 S0x를 세력으로 치환했다(수도역 구 기준).
// 그 결과 map_region.polities·map_station·map_edge·map_landmark·map_holding의 진영값이
// "그 행이 속한 구의 소유자 배정"과 어긋나는 행이 생겼다. 이 스크립트는 그 값만
// 행 자신의 구(지역·역은 district_ko, 나머지는 참조로 유도)의 배정 진영으로 다시 쓴다.
//
// 규칙:
//   * map_region.polities       — 전 행을 구 배정 진영으로. 빈 [] 행은 정상 거주 동(후암동·
//                                 용산2가동·이태원2동)이므로 구 진영을 준다(물/공원 특수지가 아니었다).
//   * map_station               — surface_polity_ids·control/control_ko의 진영 필드
//                                 (polityIds·primary·polityNames·hierarchy.state·currentHegemons·memberSurfaces).
//                                 primary==null(경합)은 진영이 아니므로 그대로 둔다.
//                                 currentHegemons 중 kind='neutral'은 세 세력이 아니므로 그대로 둔다(보고).
//   * map_edge                  — source='derived-from-stations'. 양 끝 역의 구 진영이 같으면 그 진영으로,
//                                 다르면 국경 구간(별도 논리)이므로 건드리지 않는다(보고).
//   * map_landmark.holder_id    — region_id → 구 배정 진영.
//   * map_holding               — 참조(stationRef/facilityRef/landmarkRef/adminRefs)가 유도하는 구 진영으로
//                                 state_id·data.stateId·data_ko.stateId. id·titleId 등 안정 식별자는 유지.
//   * 그 밖(retainer_graph 인물·궁정 소속, opening_state 산문의 '후국/Vassal State', 지명 산문)은
//     구 배정이 아닌 논리에서 온 값이므로 바꾸지 않고 보고한다.
//
// 방법(W5-25 scripts/pages/aux-edit.mjs과 같은 계약): SQL 전체를 node:sqlite로 읽고,
// INSERT 문 안에서 바뀐 값 리터럴만 교체해 원본 줄을 다시 만든다(나머지 바이트 불변).
// 파싱·직렬화 보조함수는 aux-edit.mjs에서 그대로 옮겼다(새 직렬화기를 쓰지 않는다).
//
// 사용법:
//   node scripts/pages/map-district-faction.mjs            # 적용(변경 없으면 아무 것도 쓰지 않는다)
//   node scripts/pages/map-district-faction.mjs --check    # 검사만: 무편집 재직렬화가 원본과 바이트 동일인지
//                                                          # 증명하고 예정 변경 수를 보고한다. 쓰지 않는다.
//   node scripts/pages/map-district-faction.mjs --log <path>
//
// 결정성: 재실행(적용본 위)은 계획이 비어 아무 것도 쓰지 않는다. 적용 로그에 시간 등
// 비결정 요소를 넣지 않는다. 알 수 없는 구·규칙 밖 열·예상 밖 참조는 즉시 크게 실패한다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SQL_DIR = path.resolve(REPO, 'data/sql');
const LOG_DEFAULT = path.resolve(REPO, 'docs/drafts/reports/w5-28-fix10-map-apply-log.json');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const LOG_PATH = (() => { const i = argv.indexOf('--log'); return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : LOG_DEFAULT; })();

const fail = (code, detail) => { console.error(`E_${code}: ${detail}`); process.exit(1); };

// ---------------------------------------------------------------------------
// 1. 소유자의 구→진영 배정표 (구속력 있는 입력; 위 소유자 발언 그대로)
// ---------------------------------------------------------------------------
const OWNER_RULE = {
  government: ['마포구', '용산구', '중구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '종로구', '서대문구', '은평구', '강북구', '도봉구', '노원구'],
  arc: ['서초구', '강남구', '송파구', '강동구'],
  'free-city': ['강서구', '양천구', '영등포구', '구로구', '금천구', '동작구', '관악구'],
};
const FACTIONS = ['government', 'free-city', 'arc'];
const DISPLAY = {
  en: { government: 'The Government', 'free-city': 'Free City', arc: 'Arc' },
  ko: { government: '정부', 'free-city': '자유도시', arc: 'Arc' },
};
const DISTRICT_TO_FACTION = new Map(Object.entries(OWNER_RULE).flatMap(([f, ds]) => ds.map((d) => [d, f])));
{
  const counts = Object.fromEntries(Object.entries(OWNER_RULE).map(([f, ds]) => [f, ds.length]));
  if (Object.keys(counts).length !== 3 || counts.government !== 14 || counts['free-city'] !== 7 || counts.arc !== 4) fail('RULE_TABLE', JSON.stringify(counts));
  if (new Set(Object.values(OWNER_RULE).flat()).size !== 25) fail('RULE_TABLE', 'districts not unique');
}
const FACTION_IDS = new Set(FACTIONS);
const langFactionNames = (lang) => FACTIONS.map((f) => DISPLAY[lang][f]);

// 빈 진영 행 사전 판정: 이 행들이 아니면 크게 실패한다(새 빈 행은 사람의 판단이 필요하다).
const EXPECTED_EMPTY_REGIONS = ['region:1117051000', 'region:1117052000', 'region:1117066000']; // 후암동·용산2가동·이태원2동 (용산구)
const EXPECTED_EMPTY_STATION_SP = ['대치', '녹사평']; // 강남구 대치·용산구 녹사평 — control은 각각 arc·government인데 surface_polity_ids만 비어 있었다

// ---------------------------------------------------------------------------
// 2. SQL 적재(node:sqlite 데이터 뷰) + 원본 텍스트(형식 뷰)
// ---------------------------------------------------------------------------
const raw = new Map();
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=OFF');
for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) {
  const text = fs.readFileSync(path.join(SQL_DIR, f), 'utf8');
  if (text.includes('\r')) fail('CRLF', f);
  raw.set(f, text);
  try { db.exec(text); } catch { /* 단독 실행 불가 파일(스키마 등)은 건너뛴다 */ }
}
const all = (sql, ...a) => db.prepare(sql).all(...a);
const TOUCHED_FILES = ['120-map-core.sql', '123-map-holdings.sql'];
for (const f of TOUCHED_FILES) if (!raw.has(f)) fail('FILE_MISSING', f);

// ---------------------------------------------------------------------------
// 3. 파싱·직렬화 보조 — aux-edit.mjs에서 그대로 옮김(리터럴 수술 방식)
// ---------------------------------------------------------------------------
const splitTopLevel = (s) => {
  const out = []; let cur = '', inStr = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inStr) {
      if (c === "'") {
        if (s[i + 1] === "'") { cur += "''"; i += 2; continue; }
        inStr = false; cur += c; i++; continue;
      }
      cur += c; i++; continue;
    }
    if (c === "'") { inStr = true; cur += c; i++; continue; }
    if (c === ',') { out.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  out.push(cur);
  return out; // 원본 리터럴 텍스트(선행 공백 보존)
};
const literalOf = (v) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const INSERT_RE = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \((.*)\);$/;

function parseFile(name) {
  const text = raw.get(name);
  const lines = text.split('\n');
  const stmts = [];
  lines.forEach((line, idx) => {
    const m = line.match(INSERT_RE);
    if (!m) return;
    const [, table, colsRaw, valsRaw] = m;
    const cols = colsRaw.split(',').map((c) => c.trim());
    const lits = splitTopLevel(valsRaw);
    if (cols.length !== lits.length) fail('PARSE_ARITY', `${name}:${idx + 1} ${table}`);
    stmts.push({ lineIdx: idx, table, cols, lits, line });
  });
  return { lines, stmts };
}
const editJson = (val, where, fn) => {
  if (JSON.stringify(JSON.parse(val)) !== val) fail('JSON_ROUNDTRIP', where);
  const obj = JSON.parse(val);
  const out = fn(obj, where);
  return JSON.stringify(out === undefined ? obj : out);
};

const plans = new Map(); // file -> Map<lineIdx, newLine>
const planOf = (f) => { if (!plans.has(f)) plans.set(f, new Map()); return plans.get(f); };
const editCell = (f, stmt, col, newValue) => {
  const ci = stmt.cols.indexOf(col);
  if (ci < 0) fail('COL_MISSING', `${f} ${stmt.table}.${col}`);
  const oldRaw = stmt.lits[ci];
  const neu = literalOf(newValue);
  if (oldRaw.trim() === neu) return false;
  const cur = planOf(f).get(stmt.lineIdx) ?? stmt.line;
  const m = cur.match(INSERT_RE);
  if (!m) fail('REEDIT_PARSE', `${f}:${stmt.lineIdx + 1}`);
  const lits = splitTopLevel(m[3]);
  const lead = lits[ci].slice(0, lits[ci].length - lits[ci].trimStart().length);
  lits[ci] = lead + neu;
  planOf(f).set(stmt.lineIdx, `INSERT INTO ${m[1]} (${m[2]}) VALUES (${lits.join(',')});`);
  return true;
};

// 무편집 재직렬화 증명: 파싱된 모든 INSERT 문을 같은 직렬화기로 다시 만들어 원본 줄과 비교
function assertRoundTrip() {
  for (const f of TOUCHED_FILES) {
    const { stmts } = parseFile(f);
    for (const s of stmts) {
      const rebuilt = `INSERT INTO ${s.table} (${s.cols.join(', ')}) VALUES (${s.lits.join(',')});`;
      const rebuiltTight = `INSERT INTO ${s.table} (${s.cols.join(',')}) VALUES (${s.lits.join(',')});`;
      if (rebuilt !== s.line && rebuiltTight !== s.line) fail('ROUNDTRIP', `${f}:${s.lineIdx + 1} ${s.table}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. 변경 계획
// ---------------------------------------------------------------------------
const wantOf = (districtKo, where) => {
  const f = DISTRICT_TO_FACTION.get(districtKo);
  if (!f) fail('UNKNOWN_DISTRICT', `${where}: ${districtKo}`);
  return f;
};
const changeLog = { map_region: [], map_station: [], map_edge: [], map_landmark: [], map_holding: [] };
const notes = { neutralHegemons: [], borderEdges: [], emptyRegionsDecided: [], emptyStationSpDecided: [] };

const asWantList = (arr, want, where, collapse = false) => {
  const set = [...new Set(arr)];
  for (const id of set) if (!FACTION_IDS.has(id)) fail('CONTROL_ID', `${where}: ${id}`);
  if (set.length > 1 && !collapse) fail('MULTI_FACTION', `${where}: ${JSON.stringify(arr)}`);
  if (set.length === 1 && set[0] === want) return null; // 이미 정합
  return [want];
};

// 진영 컬렉션 필드를 want 진영 하나로 정리한다(정확히 그 값이 아니면 기록·치환).
// primary==null(경합)·neutral 종주는 진영이 아니므로 건드리지 않는다.
// collapse=true(구간): 옛 국가 경합이 남긴 다진영 목록(예: 정부 구간의 ["arc","government"])도
// 소유자 배정 진영 하나로 줄인다. 종주 목록은 치환 뒤 이름 중복을 없앤다(stateId 있는 항목 우선).
const fixControl = (obj, lang, want, where, sink, collapse = false) => {
  const disp = DISPLAY[lang][want];
  const factionNames = langFactionNames(lang);
  if (obj.polityIds) { const neu = asWantList(obj.polityIds, want, `${where}.polityIds`, collapse); if (neu) { sink.push([`${where}.polityIds`, JSON.stringify(obj.polityIds), JSON.stringify(neu)]); obj.polityIds = neu; } }
  if (obj.polityNames) { if (!(obj.polityNames.length === 1 && obj.polityNames[0] === disp)) { sink.push([`${where}.polityNames`, JSON.stringify(obj.polityNames), JSON.stringify([disp])]); obj.polityNames = [disp]; } }
  if (obj.primary !== null && obj.primary !== undefined && obj.primary !== '') {
    if (!FACTION_IDS.has(obj.primary)) fail('CONTROL_ID', `${where}.primary: ${obj.primary}`);
    if (obj.primary !== want) { sink.push([`${where}.primary`, obj.primary, want]); obj.primary = want; }
  }
  if (obj.hierarchy?.state) {
    if (!factionNames.includes(obj.hierarchy.state)) fail('CONTROL_NAME', `${where}.hierarchy.state: ${obj.hierarchy.state}`);
    if (obj.hierarchy.state !== disp) { sink.push([`${where}.hierarchy.state`, obj.hierarchy.state, disp]); obj.hierarchy.state = disp; }
  }
  for (const [i, h] of (obj.currentHegemons ?? []).entries()) {
    const hw = `${where}.currentHegemons[${i}]`;
    if (h.kind === 'neutral') { notes.neutralHegemons.push({ where: hw, kind: h.kind, name: h.name }); continue; } // 세 세력이 아님 — 보고 대상
    const nameIsFaction = typeof h.name === 'string' && factionNames.includes(h.name);
    if (h.stateId !== null && h.stateId !== undefined) {
      if (!FACTION_IDS.has(h.stateId)) fail('CONTROL_ID', `${hw}.stateId: ${h.stateId}`);
      if (h.stateId !== want || (nameIsFaction && h.name !== disp)) {
        const before = `${h.kind}:${h.name ?? '-'}:${h.stateId}`;
        h.stateId = want;
        if (nameIsFaction) h.name = disp;
        sink.push([hw, before, `${h.kind}:${h.name ?? '-'}:${h.stateId}`]);
      }
    } else if (nameIsFaction) {
      // union 종주: 이름만 진영 표기명을 운반한다(stateId 없음)
      if (h.name !== disp) { sink.push([`${hw}.name`, h.name, disp]); h.name = disp; }
    } else {
      fail('HEGEMON_SHAPE', `${hw}: ${JSON.stringify(h)}`);
    }
  }
  for (const [i, ms] of (obj.memberSurfaces ?? []).entries()) {
    const mw = `${where}.memberSurfaces[${i}]`;
    if (ms.primary !== null && ms.primary !== undefined && ms.primary !== '') {
      if (!FACTION_IDS.has(ms.primary)) fail('CONTROL_ID', `${mw}.primary: ${ms.primary}`);
      if (ms.primary !== want) { sink.push([`${mw}.primary`, ms.primary, want]); ms.primary = want; }
    }
    if (ms.polityIds) { const neu = asWantList(ms.polityIds, want, `${mw}.polityIds`, collapse); if (neu) { sink.push([`${mw}.polityIds`, JSON.stringify(ms.polityIds), JSON.stringify(neu)]); ms.polityIds = neu; } }
    if (ms.surfacePolityIds) { const neu = asWantList(ms.surfacePolityIds, want, `${mw}.surfacePolityIds`, collapse); if (neu) { sink.push([`${mw}.surfacePolityIds`, JSON.stringify(ms.surfacePolityIds), JSON.stringify(neu)]); ms.surfacePolityIds = neu; } }
  }
  // 종주 목록 이름 중복 제거(치환 뒤 같은 표기명이 두 번 나오는 것을 막는다; stateId 있는 항목 우선)
  if (obj.currentHegemons && obj.currentHegemons.length > 1) {
    const byName = new Map();
    for (const h of obj.currentHegemons) {
      if (typeof h.name !== 'string') continue;
      const prev = byName.get(h.name);
      if (prev === undefined || (prev.stateId === undefined && h.stateId !== undefined)) byName.set(h.name, h);
    }
    const dedup = obj.currentHegemons.filter((h) => byName.get(h.name) === h);
    if (dedup.length !== obj.currentHegemons.length) {
      sink.push([`${where}.currentHegemons(dedupe)`, JSON.stringify(obj.currentHegemons), JSON.stringify(dedup)]);
      obj.currentHegemons = dedup;
    }
  }
};

// ---- 120-map-core.sql ----
{
  const f = '120-map-core.sql';
  const { stmts } = parseFile(f);
  const byPk = (table, pk) => {
    const m = new Map();
    for (const s of stmts.filter((x) => x.table === table)) {
      const key = s.lits[s.cols.indexOf(pk)].trim();
      if (m.has(key)) fail('DUP_PK', `${table} ${key}`);
      m.set(key, s);
    }
    return m;
  };

  // 데이터 교차 검증: map_state 독점 구 수가 규칙표와 일치하는지
  for (const r of all('SELECT state_id, exclusive_districts FROM map_state')) {
    if (OWNER_RULE[r.state_id] && OWNER_RULE[r.state_id].length !== r.exclusive_districts) fail('RULE_VS_MAP_STATE', `${r.state_id}: ${r.exclusive_districts}`);
  }

  // map_region.polities
  const regions = byPk('map_region', 'id');
  for (const r of all('SELECT id, name, name_ko, district_ko, polities FROM map_region ORDER BY sort')) {
    const stmt = regions.get(`'${r.id}'`);
    if (!stmt) fail('REGION_STMT', r.id);
    const want = wantOf(r.district_ko, `map_region ${r.id}`);
    const arr = JSON.parse(r.polities);
    let before = r.polities; let after = null;
    if (arr.length === 0) {
      if (!EXPECTED_EMPTY_REGIONS.includes(r.id)) fail('UNEXPECTED_EMPTY_POLITIES', `${r.id} ${r.name_ko} ${r.district_ko}`);
      notes.emptyRegionsDecided.push({ id: r.id, name: r.name, name_ko: r.name_ko, district_ko: r.district_ko, decision: '정상 거주 동(주민센터·급수 서사 있음, 물/공원 특수지 아님) — 구 진영을 준다', to: want });
      after = JSON.stringify([want]);
    } else {
      const neu = asWantList(arr, want, `map_region ${r.id}.polities`);
      if (neu) after = JSON.stringify(neu);
    }
    if (after !== null) {
      changeLog.map_region.push({ id: r.id, name_ko: r.name_ko, district_ko: r.district_ko, column: 'polities', before, after });
      editCell(f, stmt, 'polities', after);
    }
  }

  // map_station
  const stations = byPk('map_station', 'id');
  for (const r of all('SELECT id, name, name_ko, district_ko, surface_polity_ids, control, control_ko FROM map_station ORDER BY sort')) {
    const stmt = stations.get(`'${r.id}'`);
    if (!stmt) fail('STATION_STMT', r.id);
    const want = wantOf(r.district_ko, `map_station ${r.id}`);
    const rec = { id: r.id, name: r.name, district_ko: r.district_ko, changes: [] };
    const sp = JSON.parse(r.surface_polity_ids);
    if (sp.length === 0) {
      if (!EXPECTED_EMPTY_STATION_SP.includes(r.id)) fail('UNEXPECTED_EMPTY_SP', `${r.id} ${r.name_ko}`);
      notes.emptyStationSpDecided.push({ id: r.id, name: r.name, district_ko: r.district_ko, decision: 'control은 진영을 갖고 있으나 surface_polity_ids만 비어 있었다 — 정상 역이므로 구 진영을 준다', to: want });
      rec.changes.push(['surface_polity_ids', r.surface_polity_ids, JSON.stringify([want])]);
      editCell(f, stmt, 'surface_polity_ids', JSON.stringify([want]));
    } else {
      const neu = asWantList(sp, want, `map_station ${r.id}.surface_polity_ids`);
      if (neu) { rec.changes.push(['surface_polity_ids', r.surface_polity_ids, JSON.stringify(neu)]); editCell(f, stmt, 'surface_polity_ids', JSON.stringify(neu)); }
    }
    for (const [col, lang] of [['control', 'en'], ['control_ko', 'ko']]) {
      const sub = [];
      const neu = editJson(r[col], `map_station ${r.id}.${col}`, (obj) => { fixControl(obj, lang, want, `station ${r.id}.${col}`, sub); });
      if (sub.length) { rec.changes.push([col, sub]); editCell(f, stmt, col, neu); }
    }
    if (rec.changes.length) changeLog.map_station.push(rec);
  }

  // map_edge — 양 끝 역의 구 진영이 같을 때만
  const stDistrict = new Map(all('SELECT id, name, name_ko, district_ko FROM map_station').flatMap((s) => [[s.id, s.district_ko], [s.name, s.district_ko], [s.name_ko, s.district_ko]]));
  const edges = byPk('map_edge', 'id');
  for (const r of all('SELECT id, a, b, control, control_ko FROM map_edge ORDER BY sort')) {
    const stmt = edges.get(`'${r.id}'`);
    if (!stmt) fail('EDGE_STMT', r.id);
    const dA = stDistrict.get(r.a); const dB = stDistrict.get(r.b);
    if (!dA || !dB) fail('EDGE_ENDPOINT', `${r.id}: ${r.a}/${r.b}`);
    const fA = wantOf(dA, `edge ${r.id}.a`); const fB = wantOf(dB, `edge ${r.id}.b`);
    if (fA !== fB) { notes.borderEdges.push({ id: r.id, a: r.a, b: r.b, district_a: dA, district_b: dB, faction_a: fA, faction_b: fB }); continue; }
    const want = fA;
    const cells = [];
    for (const [col, lang] of [['control', 'en'], ['control_ko', 'ko']]) {
      const sub = [];
      const neu = editJson(r[col], `map_edge ${r.id}.${col}`, (obj) => { fixControl(obj, lang, want, `edge ${r.id}.${col}`, sub, true); });
      if (sub.length) { cells.push([col, sub]); editCell(f, stmt, col, neu); }
    }
    if (cells.length) changeLog.map_edge.push({ id: r.id, endpoints: `${r.a}~${r.b}`, district_ko: dA, changes: cells });
  }

  // map_landmark.holder_id
  const marks = byPk('map_landmark', 'id');
  const regionDistrict = new Map(all('SELECT id, district_ko FROM map_region').map((x) => [x.id, x.district_ko]));
  for (const r of all('SELECT id, name, region_id, holder_id FROM map_landmark ORDER BY sort')) {
    const stmt = marks.get(`'${r.id}'`);
    if (!stmt) fail('LANDMARK_STMT', r.id);
    const dk = regionDistrict.get(r.region_id);
    if (!dk) fail('LANDMARK_REGION', `${r.id}: ${r.region_id}`);
    const want = wantOf(dk, `map_landmark ${r.id}`);
    if (r.holder_id !== null && !FACTION_IDS.has(r.holder_id)) fail('LANDMARK_HOLDER', `${r.id}: ${r.holder_id}`);
    if (r.holder_id !== want) {
      changeLog.map_landmark.push({ id: r.id, name: r.name, district_ko: dk, column: 'holder_id', before: r.holder_id, after: want });
      editCell(f, stmt, 'holder_id', want);
    }
  }
}

// ---- 123-map-holdings.sql ----
{
  const f = '123-map-holdings.sql';
  const { stmts } = parseFile(f);
  const holds = new Map(stmts.filter((s) => s.table === 'map_holding').map((s) => [s.lits[s.cols.indexOf('id')].trim(), s]));
  const regionDistrict = new Map(all('SELECT id, district_ko FROM map_region').map((x) => [x.id, x.district_ko]));
  const stDistrict = new Map(all('SELECT id, name, name_ko, district_ko FROM map_station').flatMap((s) => [[s.id, s.district_ko], [s.name, s.district_ko], [s.name_ko, s.district_ko]]));
  const lmRegion = new Map(all('SELECT id, region_id FROM map_landmark').map((x) => [x.id, x.region_id]));
  for (const r of all('SELECT id, name, name_ko, state_id, data, data_ko FROM map_holding ORDER BY sort')) {
    const stmt = holds.get(`'${r.id}'`);
    if (!stmt) fail('HOLDING_STMT', r.id);
    // 참조로 구 집합 유도(전 보유가 하나의 구 진영을 가리켜야 한다)
    const ds = new Set();
    const resolveStation = (sid, w) => { const d = stDistrict.get(sid); if (!d) fail('HOLDING_REF', `${r.id} ${w}: ${sid}`); ds.add(d); };
    const d = JSON.parse(r.data);
    for (const a of d.adminRefs ?? []) { const x = regionDistrict.get(a.id); if (!x) fail('HOLDING_REF', `${r.id} adminRefs ${a.id}`); ds.add(x); }
    if (d.stationRef?.stationId) resolveStation(d.stationRef.stationId, 'stationRef');
    if (d.facilityRef?.stationId) resolveStation(d.facilityRef.stationId, 'facilityRef.stationId');
    if (d.facilityRef?.stationName) resolveStation(d.facilityRef.stationName, 'facilityRef.stationName');
    if (d.landmarkRef?.landmarkId) { const reg = lmRegion.get(d.landmarkRef.landmarkId); const x = reg ? regionDistrict.get(reg) : null; if (!x) fail('HOLDING_REF', `${r.id} landmarkRef`); ds.add(x); }
    const facs = [...new Set([...ds].map((x) => wantOf(x, `holding ${r.id}`)))];
    if (facs.length !== 1) fail('HOLDING_DISTRICT', `${r.id}: ${[...ds].join('|')}`);
    const want = facs[0];
    if (!FACTION_IDS.has(r.state_id)) fail('HOLDING_STATE', `${r.id}: ${r.state_id}`);
    const dk = JSON.parse(r.data_ko);
    const cells = [];
    if (r.state_id !== want) cells.push(['state_id', r.state_id, want]);
    for (const [col, ref] of [['data', d], ['data_ko', dk]]) {
      if (ref.stateId !== undefined && ref.stateId !== null) {
        if (!FACTION_IDS.has(ref.stateId)) fail('HOLDING_STATE', `${r.id}.${col}: ${ref.stateId}`);
        if (ref.stateId !== want) cells.push([`${col}.stateId`, ref.stateId, want]);
      }
    }
    if (!cells.length) continue;
    changeLog.map_holding.push({ id: r.id, name_ko: r.name_ko, districts: [...ds].join('|'), changes: cells });
    if (r.state_id !== want) editCell(f, stmt, 'state_id', want);
    for (const [col, ref] of [['data', d], ['data_ko', dk]]) {
      if (ref.stateId !== undefined && ref.stateId !== null && ref.stateId !== want) {
        ref.stateId = want;
        editCell(f, stmt, col, JSON.stringify(ref));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5. 검사 모드: 무편집 재직렬화 증명 + 예정 변경 보고, 아무 것도 쓰지 않는다
// ---------------------------------------------------------------------------
assertRoundTrip();
if (CHECK) {
  const pending = Object.fromEntries(Object.entries(changeLog).map(([t, xs]) => [t, xs.length]));
  console.log(`CHECK OK: round-trip byte-identical on ${TOUCHED_FILES.join(', ')}; nothing written.`);
  console.log(`  pending changes (apply mode would write): ${JSON.stringify(pending)}`);
  console.log(`  border edges left: ${notes.borderEdges.length}; neutral hegemons left: ${notes.neutralHegemons.length}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 6. 적용 + 적용 후 검증
// ---------------------------------------------------------------------------
const TABLES = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((x) => x.name);
const preImage = {};
for (const t of TABLES) {
  const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  preImage[t] = { cols, rows: all(`SELECT * FROM ${t}`).map((r) => cols.map((c) => r[c])) };
}

let wroteAny = false;
if (plans.size === 0) {
  console.log('OK: nothing to change (already aligned). No file written.');
} else {
  for (const [f, plan] of plans) {
    if (plan.size === 0) continue;
    const lines = raw.get(f).split('\n');
    for (const [idx, neu] of plan) lines[idx] = neu;
    fs.writeFileSync(path.join(SQL_DIR, f), lines.join('\n'));
    wroteAny = true;
  }
}

// 재적재 후 전 셀 대조: 허용 표·열 외 변화 0, 행 수 불변, 재유도 검증
{
  const vdb = new DatabaseSync(':memory:');
  vdb.exec('PRAGMA foreign_keys=OFF');
  for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) {
    try { vdb.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8')); } catch (e) { fail('RELOAD', `${f}: ${e.message}`); }
  }
  const vall = (sql) => vdb.prepare(sql).all();
  const ALLOWED = new Set([
    'map_region.polities', 'map_station.surface_polity_ids', 'map_station.control', 'map_station.control_ko',
    'map_edge.control', 'map_edge.control_ko', 'map_landmark.holder_id',
    'map_holding.state_id', 'map_holding.data', 'map_holding.data_ko',
  ]);
  const pkOf = { map_region: 'id', map_station: 'id', map_edge: 'id', map_landmark: 'id', map_holding: 'id' };
  for (const t of TABLES) {
    const snap = preImage[t];
    const after = vall(`SELECT * FROM ${t}`);
    if (after.length !== snap.rows.length) fail('ROW_COUNT', `${t}: ${after.length} != ${snap.rows.length}`);
    const afterRows = after.map((r) => snap.cols.map((c) => r[c]));
    const pk = pkOf[t];
    if (pk) {
      const kIdx = snap.cols.indexOf(pk);
      const afterBy = new Map(afterRows.map((r) => [r[kIdx], r]));
      for (const b of snap.rows) {
        const a = afterBy.get(b[kIdx]);
        if (!a) fail('ROW_MISSING', `${t} ${b[kIdx]}`);
        snap.cols.forEach((c, i) => { if (a[i] !== b[i] && !ALLOWED.has(`${t}.${c}`)) fail('UNEXPECTED_CHANGE', `${t}.${c} ${b[kIdx]}`); });
      }
    } else if (JSON.stringify(afterRows) !== JSON.stringify(snap.rows)) {
      fail('UNEXPECTED_CHANGE', `${t} changed outside allowed tables`);
    }
  }
  // 재유도 검증: 모든 map_region polities == 구 배정(빈 행 0), 모든 역 sp == 구 배정
  for (const r of vall('SELECT id, district_ko, polities FROM map_region')) {
    const want = wantOf(r.district_ko, `verify ${r.id}`);
    const p = JSON.parse(r.polities);
    if (!(p.length === 1 && p[0] === want)) fail('VERIFY_POLITIES', `${r.id}: ${r.polities} want ${want}`);
  }
  for (const r of vall('SELECT id, district_ko, surface_polity_ids FROM map_station')) {
    const want = wantOf(r.district_ko, `verify station ${r.id}`);
    const p = JSON.parse(r.surface_polity_ids);
    if (!(p.length === 1 && p[0] === want)) fail('VERIFY_SP', `${r.id}: ${r.surface_polity_ids} want ${want}`);
  }
}

// ---------------------------------------------------------------------------
// 7. 적용 로그(결정적 — 시간 등 비결정 요소 없음)
// ---------------------------------------------------------------------------
if (wroteAny || !fs.existsSync(LOG_PATH)) {
  const counts = Object.fromEntries(Object.entries(changeLog).map(([t, xs]) => [t, xs.length]));
  const log = {
    generatedBy: 'scripts/pages/map-district-faction.mjs',
    task: 'W5-28 fix10 — 지도 진영 필드를 소유자 구 배정에서 재유도',
    rule: OWNER_RULE,
    counts,
    changes: changeLog,
    decisions: {
      emptyPolityRegions: notes.emptyRegionsDecided,
      emptyStationSurfacePolityIds: notes.emptyStationSpDecided,
      borderEdgesLeft: notes.borderEdges,
      neutralHegemonsLeft: notes.neutralHegemons,
      outOfScope: [
        'retainer_graph 노드/궁정 소속 — 인물 기록(050)에서 온 값, 구 배정 아님',
        "map_region.opening_state/_ko의 '후국/Vassal State' 산문(용산구 9개 지역 ×2언어=18셀) — 세 세력 표기명이 아닌 옛 서사 표현",
        "map_region.summary_ko의 '고려대학Arc로병원'(구로구 region:1153053000) — W5-25 잔여 산문 결함(진영 필드 아님)",
        "map_region.summary의 'the Gauge'(종로구 region:1111061500) — 옛 조직명 잔여 산문",
        'map_holding id의 -S0x 접미·data.titleId — 안정 식별자(W5-25 결정 유지)',
        'map_region.status 등 진영이 아닌 열 — 불변',
      ],
    },
  };
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 1) + '\n');
  console.log(`OK: applied. rows changed per table: ${JSON.stringify(counts)}`);
  console.log(`  log: ${path.relative(REPO, LOG_PATH)}`);
}