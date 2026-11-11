#!/usr/bin/env node
// W5 row 25 — auxiliary data alignment to the three-faction canon.
//
// The sixteen states disappear: the states tables (wiki_state, map_state) become
// three faction rows, and every state id / state display name in the auxiliary
// tables is replaced by the faction (or, where a person row names a Seoul
// district, the duchy) using the confirmed mapping below.
//
// Method (same contract as scripts/pages/w4-edit.mjs on feat/w4-drafts):
//   * every SQL file is loaded through node:sqlite and read as data;
//   * edits are computed as literal replacements inside the existing
//     `INSERT INTO ... VALUES (...);` lines, so every byte outside a changed
//     value literal — headers, blank lines, row order, quoting, spacing — is
//     preserved;
//   * JSON columns are only rewritten when JSON.stringify(JSON.parse(v)) === v
//     holds for the original (otherwise the script stops loudly);
//   * any id that is not in the mapping table and not an explicit keep
//     (S00 unaffiliated, polity:daejeon) fails the run.
//
// Mapping source: docs/w4-rules.json `stateIdMapping` at origin/feat/w4-drafts
// (commit ea16f908f75c32729124c4809ceec1dfbb0284f3), reproduced verbatim below.
// Each old state maps to the faction of its capital station's district
// (data/sql/040-wiki-states.sql capital → data/sql/120-map-core.sql map_station
// district → CANON-BIBLE 2.4 row). Verified by an independent reviewer; do not
// re-derive.
//
// Canon sources for replacement text: CANON-BIBLE sections 1, 2 (2.4 table),
// 3 (timeline), 5 (glossary), 6 (named-person exceptions) — [승인] items only.
//
// Usage: node scripts/pages/aux-edit.mjs --sql-dir <dir> [--report <path>]
//   --sql-dir  directory holding the data/sql files (default: <repo>/data/sql)
//   --report   apply-log output (default: docs/drafts/reports/w5-25-apply-log.json)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const SQL_DIR = arg('sql-dir', path.join(REPO, 'data/sql'));
const REPORT = arg('report', path.join(REPO, 'docs/drafts/reports/w5-25-apply-log.json'));

const fail = (code, detail) => {
  console.error(`E_${code}: ${detail}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// 1. Confirmed state→faction mapping (docs/w4-rules.json @ origin/feat/w4-drafts
//    ea16f908f, `stateIdMapping`, verbatim subset: id, faction, source rows).
// ---------------------------------------------------------------------------
const STATE_MAPPING_ROWS = [
  { id: 'S01', faction: 'free-city', wikiStateRow: { table: 'wiki_state', slug: 's01', name_ko: '수문국', capital: 'Yangpyeong', capital_ko: '양평' }, mapStationRow: { table: 'map_station', name: 'Yangpyeong', name_ko: '양평', district: 'Yangcheon-gu', district_ko: '양천구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 16, district_ko: '양천구', faction: 'free-city' } },
  { id: 'S02', faction: 'free-city', wikiStateRow: { table: 'wiki_state', slug: 's02', name_ko: '규격맹', capital: 'Guro', capital_ko: '구로' }, mapStationRow: { table: 'map_station', name: 'Guro', name_ko: '구로', district: 'Guro-gu', district_ko: '구로구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 18, district_ko: '구로구', faction: 'free-city' } },
  { id: 'S03', faction: 'arc', wikiStateRow: { table: 'wiki_state', slug: 's03', name_ko: '태욱그룹', capital: 'Yangjae', capital_ko: '양재' }, mapStationRow: { table: 'map_station', name: 'Yangjae', name_ko: '양재', district: 'Seocho-gu', district_ko: '서초구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 22, district_ko: '서초구', faction: 'arc' } },
  { id: 'S04', faction: 'arc', wikiStateRow: { table: 'wiki_state', slug: 's04', name_ko: 'Arc (삼성)', capital: 'Samseong', capital_ko: '삼성' }, mapStationRow: { table: 'map_station', name: 'Samseong', name_ko: '삼성', district: 'Gangnam-gu', district_ko: '강남구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 23, district_ko: '강남구', faction: 'arc' } },
  { id: 'S05', faction: 'arc', wikiStateRow: { table: 'wiki_state', slug: 's05', name_ko: '동방사', capital: 'Amsa', capital_ko: '암사' }, mapStationRow: { table: 'map_station', name: 'Amsa', name_ko: '암사', district: 'Gangdong-gu', district_ko: '강동구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 25, district_ko: '강동구', faction: 'arc' } },
  { id: 'S06', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's06', name_ko: '대한민국정부', capital: 'Gwanghwamun', capital_ko: '광화문' }, mapStationRow: { table: 'map_station', name: 'Gwanghwamun', name_ko: '광화문', district: 'Jongno-gu', district_ko: '종로구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 9, district_ko: '종로구', faction: 'government' } },
  { id: 'S07', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's07', name_ko: '환적국', capital: 'Yongsan', capital_ko: '용산' }, mapStationRow: { table: 'map_station', name: 'Yongsan', name_ko: '용산', district: 'Yongsan-gu', district_ko: '용산구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 2, district_ko: '용산구', faction: 'government' } },
  { id: 'S08', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's08', name_ko: '중앙정보부', capital: 'Noksapyeong', capital_ko: '녹사평' }, mapStationRow: { table: 'map_station', name: 'Noksapyeong', name_ko: '녹사평', district: 'Yongsan-gu', district_ko: '용산구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 2, district_ko: '용산구', faction: 'government' } },
  { id: 'S09', faction: 'free-city', wikiStateRow: { table: 'wiki_state', slug: 's09', name_ko: '여의도출자연합회', capital: 'Yeouido', capital_ko: '여의도' }, mapStationRow: { table: 'map_station', name: 'Yeouido', name_ko: '여의도', district: 'Yeongdeungpo District', district_ko: '영등포구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 17, district_ko: '영등포구', faction: 'free-city' } },
  { id: 'S10', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's10', name_ko: '안국총림', capital: 'Anguk', capital_ko: '안국' }, mapStationRow: { table: 'map_station', name: 'Anguk', name_ko: '안국', district: 'Jongno-gu', district_ko: '종로구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 9, district_ko: '종로구', faction: 'government' } },
  { id: 'S11', faction: 'arc', wikiStateRow: { table: 'wiki_state', slug: 's11', name_ko: '성하그룹', capital: 'Gangnam', capital_ko: '강남' }, mapStationRow: { table: 'map_station', name: 'Gangnam', name_ko: '강남', district: 'Seocho-gu', district_ko: '서초구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 22, district_ko: '서초구', faction: 'arc' } },
  { id: 'S12', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's12', name_ko: '신내운수', capital: 'Sinnae', capital_ko: '신내' }, mapStationRow: { table: 'map_station', name: 'Sinnae', name_ko: '신내', district: 'Jungnang-gu', district_ko: '중랑구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 7, district_ko: '중랑구', faction: 'government' } },
  { id: 'S13', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's13', name_ko: '흰십자단', capital: 'Jegi-dong', capital_ko: '제기동' }, mapStationRow: { table: 'map_station', name: 'Jegi-dong', name_ko: '제기동', district: 'Dongdaemun-gu', district_ko: '동대문구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 6, district_ko: '동대문구', faction: 'government' } },
  { id: 'S14', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's14', name_ko: '아관사', capital: 'Guui', capital_ko: '구의' }, mapStationRow: { table: 'map_station', name: 'Guui', name_ko: '구의', district: 'Gwangjin-gu', district_ko: '광진구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 5, district_ko: '광진구', faction: 'government' } },
  { id: 'S15', faction: 'government', wikiStateRow: { table: 'wiki_state', slug: 's15', name_ko: 'Arc (명동)', capital: 'Myeongdong', capital_ko: '명동' }, mapStationRow: { table: 'map_station', name: 'Myeongdong', name_ko: '명동', district: 'Jung-gu', district_ko: '중구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 3, district_ko: '중구', faction: 'government' } },
  { id: 'S16', faction: 'arc', wikiStateRow: { table: 'wiki_state', slug: 's16', name_ko: 'Arc (정동)', capital: 'Suseo', capital_ko: '수서' }, mapStationRow: { table: 'map_station', name: 'Suseo', name_ko: '수서', district: 'Gangnam-gu', district_ko: '강남구' }, bibleRow: { table: 'CANON-BIBLE 2.4', row: 23, district_ko: '강남구', faction: 'arc' } },
];
if (STATE_MAPPING_ROWS.length !== 16) fail('MAPPING_COUNT', String(STATE_MAPPING_ROWS.length));
const TO_FACTION = new Map(STATE_MAPPING_ROWS.map((m) => [m.id, m.faction]));
for (const id of ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12','S13','S14','S15','S16']) {
  if (!TO_FACTION.has(id)) fail('MAPPING_MISSING', id);
}
// ids that are not one of the sixteen and stay as-is (canon-compatible markers)
const KEEP_IDS = new Set(['S00', 'polity:daejeon']);
const mapId = (id, where) => {
  if (id === null || id === undefined || id === '') return id;
  if (KEEP_IDS.has(id)) return id;
  const f = TO_FACTION.get(id);
  if (!f) fail('UNMAPPED_ID', `${where}: ${id}`);
  return f;
};
const S0X_TEST = /\bS(?:0[1-9]|1[0-6])\b/;
const S0X_ALL = /\bS(?:0[1-9]|1[0-6])\b/g;

// ---------------------------------------------------------------------------
// 2. Load every SQL file through node:sqlite (the data view) and keep the raw
//    text (the format view).
// ---------------------------------------------------------------------------
const FILES = [
  '010-meta.sql', '020-wiki-categories.sql', '035-factions.sql', '040-wiki-states.sql',
  '050-wiki-people.sql', '060-wiki-updates.sql', '100-clans.sql', '110-family-trees.sql',
  '115-retainer-graph.sql', '120-map-core.sql', '121-map-titles.sql', '122-map-rail.sql',
  '123-map-holdings.sql',
];
const raw = new Map();
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=OFF');
for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) {
  const text = fs.readFileSync(path.join(SQL_DIR, f), 'utf8');
  raw.set(f, text);
  try { db.exec(text); } catch { /* non-standalone files are skipped; scope files must load */ }
}
for (const f of FILES) if (!raw.has(f)) fail('FILE_MISSING', f);
db.exec('PRAGMA foreign_keys=ON');
const all = (sql, ...a) => db.prepare(sql).all(...a);

// ---------------------------------------------------------------------------
// 3. Runtime-derived tables (single sources of truth; no hardcoding drift).
// ---------------------------------------------------------------------------
const factions = all('SELECT * FROM faction ORDER BY sort');
const factionById = new Map(factions.map((f) => [f.id, f]));
for (const id of ['government', 'free-city', 'arc', 'independent']) if (!factionById.has(id)) fail('FACTION_MISSING', id);
const F_NAME = (id) => factionById.get(id).name;          // en display name
const F_NAME_KO = (id) => factionById.get(id).name_ko;    // ko display name

// duchy table: map_title rank='duchy' rows (id 'geography:duchy:NNNNN')
const duchies = all("SELECT id, name, name_ko FROM map_title WHERE rank = 'duchy' ORDER BY sort");
if (duchies.length !== 25) fail('DUCHY_COUNT', String(duchies.length));
const duchyByKoName = new Map(duchies.map((d) => [d.name_ko, d]));

// old map-layer display names per state, extracted from station control
// (audit only — actual replacement is always keyed by the id in the same object)
const displayName = { en: new Map(), ko: new Map() };
for (const r of all('SELECT control, control_ko FROM map_station')) {
  const c = JSON.parse(r.control), k = JSON.parse(r.control_ko);
  if (!c.primary || KEEP_IDS.has(c.primary)) continue;
  const en = c.polityNames?.[0], ko = k.polityNames?.[0];
  if (!en || !ko) fail('DISPLAY_NAME_MISSING', c.primary);
  const prevEn = displayName.en.get(c.primary), prevKo = displayName.ko.get(c.primary);
  if ((prevEn && prevEn !== en) || (prevKo && prevKo !== ko)) fail('DISPLAY_NAME_INCONSISTENT', c.primary);
  displayName.en.set(c.primary, en);
  displayName.ko.set(c.primary, ko);
}
if (displayName.en.size !== 16) fail('DISPLAY_NAME_STATES', String(displayName.en.size));

// map_state anchor rule: for each faction take the smallest-sort old state whose
// wiki_state.faction_id AND mapping faction both equal it (continuity anchor).
const wikiStates = all('SELECT slug, id, sort, faction_id, capital, capital_ko, base, base_ko FROM wiki_state ORDER BY sort');
if (wikiStates.length !== 16) fail('WIKI_STATE_COUNT', String(wikiStates.length));
const anchors = new Map();
for (const s of wikiStates) {
  const f = TO_FACTION.get(s.id);
  if (!f || s.faction_id !== f) continue;
  if (!anchors.has(f) || s.sort < anchors.get(f).sort) anchors.set(f, s);
}
for (const f of ['government', 'free-city', 'arc']) {
  if (!anchors.has(f)) fail('ANCHOR_MISSING', f);
  const anchorState = anchors.get(f).id;
  const ms = all('SELECT * FROM map_state WHERE state_id = ?', anchorState)[0];
  if (!ms) fail('ANCHOR_MAP_STATE', anchorState);
  if (ms.color !== factionById.get(f).color) fail('ANCHOR_COLOR', `${f}: ${ms.color}`);
  anchors.set(f, { state: anchors.get(f), mapState: ms });
}

// faction district counts (CANON-BIBLE 2.4, owner rule 8: 25 duchies = 14+7+4)
const DUCHY_COUNT = { government: 14, 'free-city': 7, arc: 4 };

// ---------------------------------------------------------------------------
// 4. SQL literal surgery helpers
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
  return out; // raw literal texts (leading spaces preserved)
};
const literalOf = (v) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const INSERT_RE = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \((.*)\);$/;
const stripQuotes = (s) => s.trim().slice(1, -1).replaceAll("''", "'");
const dec = (lit) => {
  const t = lit.trim();
  if (t === 'NULL') return null;
  if (t.startsWith("'")) return stripQuotes(t);
  return t;
};

function parseFile(name) {
  const text = raw.get(name);
  if (text.includes('\r')) fail('CRLF', name);
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

// ---------------------------------------------------------------------------
// 5. Edit-plan machinery
// ---------------------------------------------------------------------------
const log = { generatedAt: new Date().toISOString(), sqlDir: SQL_DIR, mapping: STATE_MAPPING_ROWS, files: {}, decisions: {}, rulerRows: [], personTextExceptions: [], duchyOverrides: [], remainingOldNames: [] };
const plans = new Map();
const planOf = (f) => {
  if (!plans.has(f)) plans.set(f, { lineReplacements: new Map(), lineDeletions: new Set(), lineInsertions: [] });
  return plans.get(f);
};
const fileLog = (f) => (log.files[f] ??= { tables: {} });
const tableLog = (f, t) => (fileLog(f).tables[t] ??= { cells: 0, byColumn: {} });

const editCell = (f, stmt, col, newValue, note) => {
  const p = planOf(f);
  const ci = stmt.cols.indexOf(col);
  if (ci < 0) fail('COL_MISSING', `${f} ${stmt.table}.${col}`);
  const oldRaw = stmt.lits[ci];
  const neu = literalOf(newValue);
  if (oldRaw.trim() === neu) return false;
  const cur = p.lineReplacements.get(stmt.lineIdx) ?? stmt.line;
  const m = cur.match(INSERT_RE);
  if (!m) fail('REEDIT_PARSE', `${f}:${stmt.lineIdx + 1}`);
  const lits = splitTopLevel(m[3]);
  const lead = lits[ci].slice(0, lits[ci].length - lits[ci].trimStart().length);
  lits[ci] = lead + neu;
  p.lineReplacements.set(stmt.lineIdx, `INSERT INTO ${m[1]} (${m[2]}) VALUES (${lits.join(',')});`);
  const t = tableLog(f, stmt.table);
  t.cells += 1;
  t.byColumn[col] = (t.byColumn[col] ?? 0) + 1;
  if (note) (t.notes ??= []).push(note);
  return true;
};
const insertLine = (f, lineIdx, newLine) => planOf(f).lineInsertions.push({ afterIdx: lineIdx, line: newLine });
const renderRow = (table, cols, row, rawLits = {}) =>
  `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => (c in rawLits ? rawLits[c] : literalOf(row[c]))).join(',')});`;
const rawLitOf = (stmt, col) => stmt.lits[stmt.cols.indexOf(col)].trim();

// ---------------------------------------------------------------------------
// 5a. wiki_state: 16 rows -> 3 faction rows (minimum structure)
//     Text composed only from CANON-BIBLE [승인] facts (§2.1-2.3, §2.4, §3).
// ---------------------------------------------------------------------------
const WIKI_STATE_TEXT = {
  government: {
    government: 'Paper ministries and multiparty democracy of the old republic; in practice only the OMO Party and the Claw Party remain, a modern feudal system',
    government_ko: '서류상으로는 옛 대한민국의 부처와 다당제를 유지하나 실제로는 OMO당과 클로당 두 당뿐인 현대 봉건제',
    power: '14 duchies', power_ko: '14개 공작령',
    cause: 'Remnant administration north of the Han River after the Great Blackout; only people written in its ledger count as citizens',
    cause_ko: '대정전 이후 한강 이북의 잔존 행정으로, 장부에 기록된 사람만 국민으로 인정한다',
    ruler: 'President for Life, elected by the Senators', ruler_ko: '종신 대통령 — 상원의원들이 선출',
  },
  'free-city': {
    government: 'A union of independent city-states in the manner of the Greek poleis; each city holds its own duchy and there is no king',
    government_ko: '그리스 폴리스처럼 독립한 도시국가들의 연합으로 도시마다 각자 공작령을 쥐며 왕은 없다',
    power: '7 duchies', power_ko: '7개 공작령',
    cause: 'Engineer cities trading goods and skills south of the Han River after the Great Blackout',
    cause_ko: '대정전 이후 한강 이남에서 물자와 기술을 주고받는 엔지니어 도시들',
    ruler: 'No king; each city is its own power', ruler_ko: '왕 없음 — 도시마다 각자 권력',
  },
  arc: {
    government: 'A theocratic hierarchy led by the Hierophant Go Ye-jin, in the manner of a Shia clan government',
    government_ko: '교주 고예진을 정점으로 둔 신권 체제로 시아파식 가문 통치를 따른다',
    power: '4 duchies', power_ko: '4개 공작령',
    cause: 'Around 2122 the Gangnam shelters united under the name Arc',
    cause_ko: '2122년 무렵 강남 대피소들이 아크라는 이름으로 묶였다',
    ruler: 'Go Ye-jin (Hierophant, Messiah)', ruler_ko: '고예진 (교주·메시아)',
  },
};

// 5b. named-person text exceptions (CANON-BIBLE §6 [승인] items and §4 forbidden
//     vocabulary). 조재표 replacement wording sourced from existing
//     person_detail values "규환 일행 지휘자" / "Leader of the Returning Party".
const PERSON_TEXT = {
  'person-0998': { position: 'Duke of Gwanak · Heir of the I Clan, First Branch Workshop', position_ko: '관악 공작 · 제1분공방 이씨 가문 후계' },
  'person-1018': { title: 'Hierophant of the Arc', title_ko: '아크의 교주' },
  'person-1017': { title: 'Bodyguard of Go Ye-jin', title_ko: '고예진의 경호원' },
  'person-1003': { title: 'Leader of the Returning Party', title_ko: '귀환 일행 지휘자', position: 'Leader of the Returning Party — signs off on travel routes, escort contracts, and withdrawal decisions', position_ko: '귀환 일행 지휘자 — 이동 경로·호위 계약·철수 판단에 서명' },
  'person-0086': { position: '', position_ko: '', rank: 'None', rank_ko: '없음' },
  'person-0088': { title: '', title_ko: '', position: '', position_ko: '', rank: 'None', rank_ko: '없음' },
  'person-0089': { position: '', position_ko: '', rank: 'None', rank_ko: '없음' },
  'person-0094': { position: '', position_ko: '', rank: 'None', rank_ko: '없음' },
  'person-0095': { rank: 'None', rank_ko: '없음' },
  'person-0096': { rank: 'None', rank_ko: '없음' },
  'person-0104': { rank: 'None', rank_ko: '없음' },
  'person-0105': { rank: 'None', rank_ko: '없음' },
  'person-0108': { rank: 'None', rank_ko: '없음' },
};
const RANK_MARK = /군주|위원장|영주|평의원|회장|당회장|사령관|대통령|의장|방장|단장|수석 신도|공작/;

// ---------------------------------------------------------------------------
// 6. Per-file rule application
// ---------------------------------------------------------------------------

// =========================== 035-factions.sql ==============================
{
  const f = '035-factions.sql';
  const { stmts } = parseFile(f);
  const arc = stmts.find((s) => s.table === 'faction' && dec(s.lits[s.cols.indexOf('id')]) === 'arc');
  if (!arc) fail('ARC_ROW', f);
  editCell(f, arc, 'ai_position', 'Faith and baptism');
  editCell(f, arc, 'ai_position_ko', '신앙·세례');
  tableLog(f, 'faction').note = 'arc ai_position "Enemies of Humanity/인류의 적" → "Faith and baptism/신앙·세례" (plan row 25: 035 세력 ai_position; 아크는 인류의 적이 아니라 기계 신앙 공동체 — 바이블 §2.3)';
}

// =========================== 040-wiki-states.sql ===========================
{
  const f = '040-wiki-states.sql';
  const { stmts } = parseFile(f);
  const stateStmts = stmts.filter((s) => s.table === 'wiki_state');
  if (stateStmts.length !== 16) fail('WS_ROWS', String(stateStmts.length));
  const cols = stateStmts[0].cols;
  const lastIdx = stateStmts[stateStmts.length - 1].lineIdx;
  for (const s of stateStmts) planOf(f).lineDeletions.add(s.lineIdx);
  for (const [fac, i] of [['government', 0], ['free-city', 1], ['arc', 2]]) {
    const facRow = factionById.get(fac);
    const a = anchors.get(fac).state;
    insertLine(f, lastIdx, renderRow('wiki_state', cols, {
      slug: fac, id: fac, sort: i, faction_id: fac,
      name: facRow.name, name_ko: facRow.name_ko,
      ...WIKI_STATE_TEXT[fac],
      capital: a.capital, capital_ko: a.capital_ko,
      base: facRow.center_region || a.base, base_ko: facRow.center_region_ko || a.base_ko,
    }));
  }
  tableLog(f, 'wiki_state').rowsBefore = 16;
  tableLog(f, 'wiki_state').rowsAfter = 3;
  tableLog(f, 'wiki_state').note = `십육국 16행 → 세 세력 3행(스키마가 허용하는 최소 구조). id=세력 id(사이트 조인 호환), 표기문은 바이블 §2·§3 [승인] 문장만 사용. 지도 앵커 규칙(신·구 세력 일치하는 최소 sort): ${[...anchors.entries()].map(([k, v]) => `${k}←${v.state.id}`).join(', ')}`;
}

// =========================== 050-wiki-people.sql ===========================
{
  const f = '050-wiki-people.sql';
  const { stmts } = parseFile(f);
  const people = all('SELECT * FROM wiki_person ORDER BY sort');
  if (people.length !== 1022) fail('PERSON_COUNT', String(people.length));
  const stmtByPk = new Map();
  for (const s of stmts.filter((s) => s.table === 'wiki_person')) {
    const pk = s.lits[s.cols.indexOf('id')].trim();
    if (stmtByPk.has(pk)) fail('DUP_PK', pk);
    stmtByPk.set(pk, s);
  }
  const byFaction = {}; const byDuchy = {}; const kept = {};
  const personOutcome = new Map();
  for (const p of people) {
    const stmt = stmtByPk.get(`'${p.id}'`);
    if (!stmt) fail('PERSON_STMT', p.id);

    const textEdit = PERSON_TEXT[p.id];
    if (textEdit) {
      for (const [col, v] of Object.entries(textEdit)) editCell(f, stmt, col, v);
      log.personTextExceptions.push({ id: p.id, name_ko: p.name_ko, changes: textEdit });
    }

    const oldId = p.state_id;
    let outcome;
    if (KEEP_IDS.has(oldId)) {
      kept[oldId] = (kept[oldId] ?? 0) + 1;
      outcome = { state_id: oldId, basis: 'kept — not a sixteen-state id (unaffiliated / outside-Seoul marker)' };
    } else {
      const faction = TO_FACTION.get(oldId);
      if (!faction) fail('UNMAPPED_ID', `wiki_person ${p.id}: ${oldId}`);
      const probe = `${textEdit?.position_ko ?? p.position_ko ?? ''} ${p.title_ko ?? ''}`;
      const matched = duchies.filter((d) => new RegExp(`(?<![가-힣])${d.name_ko}(?![가-힣])`).test(probe));
      if (p.id === 'person-0998') {
        const d = duchyByKoName.get('관악구');
        editCell(f, stmt, 'state_id', d.id); editCell(f, stmt, 'state_name', d.name); editCell(f, stmt, 'state_name_ko', d.name_ko);
        byDuchy[d.id] = (byDuchy[d.id] ?? 0) + 1;
        log.duchyOverrides.push({ id: p.id, duchy: d.id, basis: '바이블 §6 [승인] 관악 공작' });
        outcome = { state_id: d.id, basis: 'duchy — bible §6 approved Duke of Gwanak' };
      } else if (matched.length === 1) {
        const d = matched[0];
        editCell(f, stmt, 'state_id', d.id); editCell(f, stmt, 'state_name', d.name); editCell(f, stmt, 'state_name_ko', d.name_ko);
        byDuchy[d.id] = (byDuchy[d.id] ?? 0) + 1;
        log.duchyOverrides.push({ id: p.id, duchy: d.id, basis: `position_ko/title_ko names ${d.name_ko}` });
        outcome = { state_id: d.id, basis: `duchy — own row names ${d.name_ko}` };
      } else if (matched.length > 1) {
        fail('DUCHY_AMBIGUOUS', `${p.id}: ${matched.map((d) => d.name_ko).join('/')}`);
      } else {
        editCell(f, stmt, 'state_id', faction);
        editCell(f, stmt, 'state_name', F_NAME(faction));
        editCell(f, stmt, 'state_name_ko', F_NAME_KO(faction));
        byFaction[faction] = (byFaction[faction] ?? 0) + 1;
        outcome = { state_id: faction, basis: `faction — confirmed mapping ${oldId}→${faction}` };
      }
    }
    personOutcome.set(p.id, outcome);
    if (RANK_MARK.test(`${p.title_ko ?? ''}\u0000${p.position_ko ?? ''}`)) {
      log.rulerRows.push({
        id: p.id, name_ko: p.name_ko, title_ko: p.title_ko, position_ko: p.position_ko,
        old_state: oldId, new_state: outcome.state_id,
        action: textEdit ? 'polity columns + bible-decided retitle (§6/§4)' : (KEEP_IDS.has(oldId) ? 'no polity change (kept marker); no text change' : 'polity columns only (retitle pending owner Q18-Q29)'),
      });
    }
  }
  log.decisions.wikiPerson = { total: people.length, byFaction, byDuchy, kept };
  tableLog(f, 'wiki_person').note = `state_id/state_name/state_name_ko 1,022행 전수: 세력 ${Object.values(byFaction).reduce((a, b) => a + b, 0)}행, 공작령 ${Object.values(byDuchy).reduce((a, b) => a + b, 0)}행, 유지(S00·daejeon) ${Object.values(kept).reduce((a, b) => a + b, 0)}행. faction_id 열은 본 과제 범위 밖(미변경)`;
  // person prose mentions of old state organization names (kept; classified)
  {
    const KO = /수문국|규격맹|환적국|안국총림|성하그룹|흰십자단|아관사|태욱그룹|동방사|여의도출자연합회|중앙정보부|신내운수/;
    const EN = /Floodgate State|Standards League|Transshipment State|Anguk Grand Monastery|Seongha Group|White Cross Order|Russian Legation Command|Taeuk Group|Eastern Command|Yeouido Investment Federation|Central Intelligence (?:Agency|Bureau)|Sinnae Transport|Sluice Bureau|Jeongdong Labor Federation|Myeongbu Church|Roster Church|Registry Church/i;
    for (const p of people) {
      if (KO.test(`${p.title_ko ?? ''} ${p.position_ko ?? ''}`) || EN.test(`${p.title ?? ''} ${p.position ?? ''}`)) {
        log.remainingOldNames.push({ file: f, table: 'wiki_person', id: p.id, column: 'title/position prose', classification: 'person-title prose kept (직함·직위 산문 — 소유자 재직함 판단 Q18-Q29 대기)' });
      }
    }
  }
}

// =========================== 060-wiki-updates.sql ==========================
{
  const f = '060-wiki-updates.sql';
  const { stmts } = parseFile(f);
  const ups = stmts.filter((s) => s.table === 'wiki_update');
  if (ups.length !== 5) fail('UPDATE_ROWS', String(ups.length));
  const maxSort = Math.max(...ups.map((s) => Number(dec(s.lits[s.cols.indexOf('sort')]))));
  const last = ups.find((s) => Number(dec(s.lits[s.cols.indexOf('sort')])) === maxSort);
  insertLine(f, last.lineIdx, renderRow('wiki_update', ups[0].cols, {
    sort: maxSort + 1, date: '2026-11-11', category: 'Data alignment', category_ko: '데이터 정합',
    status: 'Under review', status_ko: '검토 중',
    title: 'Align auxiliary data with the three-faction canon', title_ko: '보조 데이터를 세 세력 정본에 맞춘다',
    source: 'branch:feat/w5-25-aux', slug: null,
  }));
  tableLog(f, 'wiki_update').rowsBefore = 5;
  tableLog(f, 'wiki_update').rowsAfter = 6;
  tableLog(f, 'wiki_update').note = '계획 25행: 재작성 알림 새 행 +1만. 기존 5행(과거 이력)은 제목·내용 미변경';
}

// ============ map-layer JSON transforms (always keyed by the id
// ============ carried in the same object — display names collide in ko) =====
const PROSE_NAME = {
  en: { government: 'the Government', 'free-city': 'the Free City', arc: 'Arc' },
  ko: { government: '정부', 'free-city': '자유도시', arc: '아크' },
};
const nameOfFaction = (lang, faction) => (lang === 'ko' ? F_NAME_KO(faction) : F_NAME(faction));
const remapPolityList = (arr, where) => {
  const out = [];
  for (const id of arr ?? []) {
    const m = mapId(id, where);
    if (!out.includes(m)) out.push(m); // w4 dedupe rule: collapse same-faction duplicates
  }
  return out;
};
const collectDeltaIds = (o, found) => {
  if (Array.isArray(o)) { for (const v of o) collectDeltaIds(v, found); return; }
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (k === 'deltaId' && typeof v === 'string' && S0X_TEST.test(v)) found.push(v);
      else collectDeltaIds(v, found);
    }
  }
};
const stripDeltaIds = (o) => {
  if (Array.isArray(o)) return o.map(stripDeltaIds);
  if (o && typeof o === 'object') {
    const c = {};
    for (const [k, v] of Object.entries(o)) c[k] = k === 'deltaId' ? null : stripDeltaIds(v);
    return c;
  }
  return o;
};
const assertNoResidual = (obj, where) => {
  // deltaId is the provenance id of a past control-delta event (e.g.
  // "S08-TRANSFER-2126-Gwanaksan") — a historical record, kept verbatim
  // and classified in the apply log instead of failing.
  const found = [];
  collectDeltaIds(obj, found);
  for (const d of found) log.remainingOldNames.push({ file: '120-map-core.sql', table: where.split(' ')[0], id: where, column: 'deltaId', value: d, classification: 'historical delta id kept (과거 관제 변경 이벤트의 식별자)' });
  const s = JSON.stringify(stripDeltaIds(obj));
  if (S0X_TEST.test(s)) fail('CONTROL_RESIDUAL_ID', where);
  const arcName = F_NAME('arc'); // 'Arc' is both an old display name and the faction name
  for (const [sid, n] of displayName.en) if (!KEEP_IDS.has(sid) && n !== arcName && s.includes(`"${n}"`)) fail('CONTROL_RESIDUAL_NAME', `${where}: ${n}`);
  for (const [sid, n] of displayName.ko) if (!KEEP_IDS.has(sid) && n !== arcName && s.includes(`"${n}"`)) fail('CONTROL_RESIDUAL_NAME_KO', `${where}: ${n}`);
};
const remapControl = (lang) => (obj, where) => {
  const primaryFaction = obj.primary && !KEEP_IDS.has(obj.primary) ? TO_FACTION.get(obj.primary) : null;
  if (!primaryFaction && obj.primary && !KEEP_IDS.has(obj.primary)) fail('UNMAPPED_ID', `${where}.primary: ${obj.primary}`);
  if (obj.polityIds) obj.polityIds = remapPolityList(obj.polityIds, `${where}.polityIds`);
  if (obj.primary !== null && obj.primary !== undefined && obj.primary !== '') obj.primary = mapId(obj.primary, `${where}.primary`);
  if (obj.polityNames) {
    obj.polityNames = [...new Set((obj.polityIds ?? []).map((id) => (KEEP_IDS.has(id) ? id : nameOfFaction(lang, id))))];
  }
  if (obj.hierarchy?.state) {
    if (!primaryFaction) fail('HIERARCHY_WITHOUT_PRIMARY', where);
    obj.hierarchy.state = nameOfFaction(lang, primaryFaction);
  }
  if (obj.currentHegemons) {
    const seen = new Set();
    obj.currentHegemons = obj.currentHegemons.filter((h) => {
      if (h.stateId && !KEEP_IDS.has(h.stateId)) {
        const fac = TO_FACTION.get(h.stateId);
        if (!fac) fail('UNMAPPED_ID', `${where}.hegemon.stateId: ${h.stateId}`);
        if (h.kind === 'state') h.name = nameOfFaction(lang, fac);
        h.stateId = fac;
      } else if (h.kind === 'union' && h.name === 'Arc') {
        h.name = nameOfFaction(lang, 'arc');
      }
      const key = JSON.stringify(h);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  for (const ms of obj.memberSurfaces ?? []) {
    if (ms.primary !== null && ms.primary !== undefined && ms.primary !== '') ms.primary = mapId(ms.primary, `${where}.memberSurfaces.primary`);
    if (ms.polityIds) ms.polityIds = remapPolityList(ms.polityIds, `${where}.memberSurfaces.polityIds`);
    if (ms.surfacePolityIds) ms.surfacePolityIds = remapPolityList(ms.surfacePolityIds, `${where}.memberSurfaces.surfacePolityIds`);
  }
  assertNoResidual(obj, where);
};

// =========================== 120-map-core.sql ==============================
{
  const f = '120-map-core.sql';
  const { stmts } = parseFile(f);
  const stmtByPk = (table, pk) => {
    const m = new Map();
    for (const s of stmts.filter((s) => s.table === table)) {
      const key = s.lits[s.cols.indexOf(pk)].trim();
      if (m.has(key)) fail('DUP_PK', `${table} ${key}`);
      m.set(key, s);
    }
    return m;
  };

  for (const s of stmts.filter((s) => s.table === 'map_meta')) {
    if (S0X_TEST.test(dec(s.lits[s.cols.indexOf('value')]))) fail('MAP_META_STATE', s.line);
  }

  // map_state: 16 -> 3 faction anchors; coordinate literals copied verbatim
  const msStmts = stmts.filter((s) => s.table === 'map_state');
  if (msStmts.length !== 16) fail('MAP_STATE_ROWS', String(msStmts.length));
  const msCols = msStmts[0].cols;
  const msLast = msStmts[msStmts.length - 1].lineIdx;
  for (const s of msStmts) planOf(f).lineDeletions.add(s.lineIdx);
  for (const [fac, a] of [...anchors.entries()].sort((x, y) => factionById.get(x[0]).sort - factionById.get(y[0]).sort)) {
    const msStmt = msStmts.find((s) => dec(s.lits[s.cols.indexOf('state_id')]) === a.state.id);
    insertLine(f, msLast, renderRow('map_state', msCols, { state_id: fac, exclusive_districts: DUCHY_COUNT[fac] }, {
      label_x: rawLitOf(msStmt, 'label_x'), label_y: rawLitOf(msStmt, 'label_y'),
      capital_x: rawLitOf(msStmt, 'capital_x'), capital_y: rawLitOf(msStmt, 'capital_y'),
      capital_station_id: rawLitOf(msStmt, 'capital_station_id'), capital_region_id: rawLitOf(msStmt, 'capital_region_id'),
      color: rawLitOf(msStmt, 'color'),
    }));
  }
  tableLog(f, 'map_state').rowsBefore = 16;
  tableLog(f, 'map_state').rowsAfter = 3;
  tableLog(f, 'map_state').note = `16행 → 세 세력 앵커 3행. 좌표·수도역·색은 연속성 앵커(신·구 세력 일치 최소 sort: ${[...anchors.entries()].map(([k, v]) => `${k}←${v.state.id}`).join(', ')})의 원본 리터럴을 그대로 복사하고 exclusive_districts만 바이블 §2.4의 14/7/4로. 색이 faction.color와 일치함을 실행중 검증`;

  // map_region.polities
  const regions = stmtByPk('map_region', 'id');
  let regionChanged = 0;
  for (const r of all('SELECT id, polities FROM map_region')) {
    const stmt = regions.get(`'${r.id}'`);
    if (!stmt) fail('REGION_STMT', r.id);
    const neu = editJson(r.polities, `map_region ${r.id}.polities`, (arr) => remapPolityList(arr, `map_region ${r.id}`));
    if (editCell(f, stmt, 'polities', neu)) regionChanged++;
  }
  tableLog(f, 'map_region').note = `polities(정치 소속 목록) 424/427행 값 치환(비어있는 3행 유지) — 실제 변경 ${regionChanged}행`;

  // map_station
  const stations = stmtByPk('map_station', 'id');
  let stCol = 0, stCtl = 0;
  for (const r of all('SELECT id, surface_polity_ids, control, control_ko FROM map_station')) {
    const stmt = stations.get(`'${r.id}'`);
    if (!stmt) fail('STATION_STMT', r.id);
    const sp = editJson(r.surface_polity_ids, `map_station ${r.id}.surface_polity_ids`, (arr) => remapPolityList(arr, `map_station ${r.id}`));
    if (editCell(f, stmt, 'surface_polity_ids', sp)) stCol++;
    const c = editJson(r.control, `map_station ${r.id}.control`, remapControl('en'));
    if (editCell(f, stmt, 'control', c)) stCtl++;
    const ck = editJson(r.control_ko, `map_station ${r.id}.control_ko`, remapControl('ko'));
    if (editCell(f, stmt, 'control_ko', ck)) stCtl++;
  }
  tableLog(f, 'map_station').note = `surface_polity_ids ${stCol}/312, control·control_ko ${stCtl}/624열 치환(polityIds·primary·polityNames·hierarchy.state·currentHegemons의 id와 표기명; 같은 세력으로 합쳐지는 목록은 중복 제거)`;

  // map_edge
  const edges = stmtByPk('map_edge', 'id');
  let edCtl = 0;
  for (const r of all('SELECT id, control, control_ko FROM map_edge')) {
    const stmt = edges.get(`'${r.id}'`);
    if (!stmt) fail('EDGE_STMT', r.id);
    const c = editJson(r.control, `map_edge ${r.id}.control`, remapControl('en'));
    if (editCell(f, stmt, 'control', c)) edCtl++;
    const ck = editJson(r.control_ko, `map_edge ${r.id}.control_ko`, remapControl('ko'));
    if (editCell(f, stmt, 'control_ko', ck)) edCtl++;
  }
  tableLog(f, 'map_edge').note = `control·control_ko ${edCtl}/762열 치환(분쟁 구간 polityIds 중복 제거 포함)`;

  // map_landmark
  const marks = stmtByPk('map_landmark', 'id');
  let lmHolder = 0, lmDetail = 0;
  for (const r of all('SELECT id, holder_id, detail, detail_ko FROM map_landmark')) {
    const stmt = marks.get(`'${r.id}'`);
    if (!stmt) fail('LANDMARK_STMT', r.id);
    if (r.holder_id && !KEEP_IDS.has(r.holder_id)) {
      const h = TO_FACTION.get(r.holder_id);
      if (!h) fail('UNMAPPED_ID', `map_landmark ${r.id}: ${r.holder_id}`);
      if (editCell(f, stmt, 'holder_id', h)) lmHolder++;
    }
    for (const [col, lang] of [['detail', 'en'], ['detail_ko', 'ko']]) {
      if (!S0X_TEST.test(r[col])) continue;
      const neu = r[col].replace(S0X_ALL, (m0) => PROSE_NAME[lang][TO_FACTION.get(m0)]);
      if (editCell(f, stmt, col, neu)) lmDetail++;
    }
  }
  tableLog(f, 'map_landmark').note = `holder_id ${lmHolder}/19행 세력 id로, detail 산문의 S0x 토큰 ${lmDetail}열 세력 이름으로. 지명·좌표·역할 미변경`;

  // remaining old state names in prose (kept; classified for the report)
  const NAME_RE_KO = /수문국|규격맹|환적국|안국총림|성하그룹|흰십자단|아관사|태욱그룹|동방사|여의도출자연합회|대한민국정부|중앙정보부|신내운수/;
  const NAME_RE_EN = /Floodgate State|Standards League|Transshipment State|Anguk Grand Monastery|Seongha Group|White Cross Order|Russian Legation Command|Taeuk Group|Eastern Command|Yeouido Investment Federation|Central Intelligence Agency|Sinnae Transport|Sluice Bureau|Jeongdong Labor Federation|Registry Church|Roster Church|Myeongbu Church/i;
  const CHURCH_PLACE_RE_EN = /\b(?:[A-Za-z]+ )?(?:Church|Catholic Church)\b|\bChurch\b/i;
  const CHURCH_PLACE_RE_KO = /교회|성당|예배당/;
  for (const r of all('SELECT id, summary, summary_ko, opening_state, opening_state_ko FROM map_region')) {
    for (const [col, re] of [['summary', NAME_RE_EN], ['summary_ko', NAME_RE_KO], ['opening_state', NAME_RE_EN], ['opening_state_ko', NAME_RE_KO]]) {
      if (re.test(r[col])) log.remainingOldNames.push({ file: f, table: 'map_region', id: r.id, column: col, classification: 'prose-kept (지역 요약 산문 — 소유자 판단 대기)' });
    }
    for (const [col, re] of [['summary', CHURCH_PLACE_RE_EN], ['summary_ko', CHURCH_PLACE_RE_KO], ['opening_state', CHURCH_PLACE_RE_EN], ['opening_state_ko', CHURCH_PLACE_RE_KO]]) {
      if (re.test(r[col])) log.remainingOldNames.push({ file: f, table: 'map_region', id: r.id, column: col, classification: 'place-kept (실재 교회 건물 지명 — 바이블 §4 대체 항목이 “일반 역 시설명(사당 여부는 소유자 결정)”으로 미둠)' });
    }
  }
  for (const r of all('SELECT id, detail, detail_ko FROM map_landmark')) {
    if (NAME_RE_KO.test(r.detail_ko) || NAME_RE_EN.test(r.detail)) log.remainingOldNames.push({ file: f, table: 'map_landmark', id: r.id, column: 'detail/detail_ko', classification: 'prose-kept (랜드마크 설명 산문 — 소유자 판단 대기)' });
  }
}

// =========================== 123-map-holdings.sql ==========================
{
  const f = '123-map-holdings.sql';
  const { stmts } = parseFile(f);
  const holds = new Map(stmts.filter((s) => s.table === 'map_holding').map((s) => [s.lits[s.cols.indexOf('id')].trim(), s]));
  // old-state name tokens that appear inside holding names (compiled from data)
  const NAME_TOKENS = ['수문국', '대한민국정부', '여의도출자연합회', '안국총림', '태욱그룹', '성하그룹', 'Arc',
    'Sluice Bureau', 'Government of the Republic of Korea', 'Yeouido Investment Federation', 'Yeouido Investment Alliance',
    'Anguk Monastic Assembly', 'Taeuk Group', 'Seongha Group', 'Roster Church', 'Jeongdong Labor Federation'];
  const stripStateName = (s, where) => {
    let out = ` ${s} `;
    for (const tok of NAME_TOKENS) out = out.replaceAll(` ${tok} `, ' ');
    out = out.slice(1, -1);
    if (out !== s) log.remainingOldNames.push({ file: f, table: 'map_holding', id: where, column: 'name', classification: '이름에서 국가 표기 토큰 제거(지명 유지)' });
    return out;
  };
  const remapHoldingData = (obj, where) => {
    if (obj.stateId) obj.stateId = mapId(obj.stateId, `${where}.data.stateId`);
    if (obj.name?.ko) obj.name.ko = stripStateName(obj.name.ko, where);
    // `id` mirrors the SQL primary key and `titleId` is a logical title
    // reference — both are stable identifiers whose -S0x suffix stays.
    const kept = [];
    collectDeltaIds(obj, kept); // generic id collector: any S0x under deltaId
    for (const key of ['id', 'titleId']) {
      if (typeof obj[key] === 'string' && S0X_TEST.test(obj[key])) kept.push(`${key}=${obj[key]}`);
    }
    for (const k of kept) log.remainingOldNames.push({ file: f, table: 'map_holding', id: where, column: k.split('=')[0], value: k.split('=').slice(1).join('='), classification: 'stable identifier kept (SQL 기본키 논리 참조)' });
    const stripped = JSON.parse(JSON.stringify(obj));
    delete stripped.id; delete stripped.titleId;
    if (S0X_TEST.test(JSON.stringify(stripped))) fail('HOLDING_DATA_RESIDUAL', where);
  };
  let hState = 0, hData = 0, hName = 0;
  for (const r of all('SELECT id, name, name_ko, state_id, data, data_ko FROM map_holding')) {
    const stmt = holds.get(`'${r.id}'`);
    if (!stmt) fail('HOLDING_STMT', r.id);
    if (r.state_id && !KEEP_IDS.has(r.state_id)) {
      const fac = TO_FACTION.get(r.state_id);
      if (!fac) fail('UNMAPPED_ID', `map_holding ${r.id}: ${r.state_id}`);
      if (editCell(f, stmt, 'state_id', fac)) hState++;
    }
    const d = editJson(r.data, `map_holding ${r.id}.data`, (o) => remapHoldingData(o, r.id));
    if (editCell(f, stmt, 'data', d)) hData++;
    const dk = editJson(r.data_ko, `map_holding ${r.id}.data_ko`, (o) => remapHoldingData(o, r.id));
    if (editCell(f, stmt, 'data_ko', dk)) hData++;
    for (const col of ['name', 'name_ko']) {
      const neu = stripStateName(r[col], r.id);
      if (editCell(f, stmt, col, neu)) hName++;
    }
  }
  const hg = all("SELECT json FROM retainer_graph WHERE id='retainer'")[0];
  if (/"holding:/.test(hg.json)) fail('HOLDING_REF', 'retainer_graph references holding ids');
  tableLog(f, 'map_holding').note = `state_id ${hState}/50행 세력 id로, data의 stateId 치환·이름의 국가 토큰 제거 ${hName}열. id 문자열(예: opening-duchy-gu-11620-S02)의 -S0x 접미는 식별자로 유지(retainer_graph holdingIds 참조 없음을 실행중 검증)`;
  for (const r of all('SELECT station_id, data, data_ko FROM map_underground')) {
    if (S0X_TEST.test(r.data) || S0X_TEST.test(r.data_ko)) fail('UNDERGROUND_STATE', r.station_id);
  }
}

// =========================== 110-family-trees.sql ==========================
{
  const f = '110-family-trees.sql';
  const { stmts } = parseFile(f);
  const trees = new Map(stmts.filter((s) => s.table === 'family_tree').map((s) => [s.lits[s.cols.indexOf('clan_id')].trim(), s]));
  const walk = (obj, fn) => { if (Array.isArray(obj)) { for (const v of obj) walk(v, fn); } else if (obj && typeof obj === 'object') { fn(obj); for (const v of Object.values(obj)) walk(v, fn); } };
  const remapTree = (lang) => (obj, where) => {
    walk(obj, (o) => {
      if ('stateId' in o && typeof o.stateId === 'string' && o.stateId) o.stateId = mapId(o.stateId, `${where}.stateId`);
      if (o.affiliation && typeof o.affiliation === 'object' && o.affiliation.kind === 'state') {
        const a = o.affiliation;
        if (!a.stateId) fail('TREE_AFFIL_WITHOUT_ID', where);
        const fac = mapId(a.stateId, `${where}.affiliation.stateId`);
        if (!KEEP_IDS.has(fac)) a.name = nameOfFaction(lang, fac);
      }
    });
  };
  let n = 0;
  for (const r of all('SELECT clan_id, json, json_ko FROM family_tree')) {
    const stmt = trees.get(`'${r.clan_id}'`);
    if (!stmt) fail('TREE_STMT', r.clan_id);
    for (const [col, lang] of [['json', 'en'], ['json_ko', 'ko']]) {
      const neu = editJson(r[col], `family_tree ${r.clan_id}.${col}`, remapTree(lang));
      if (editCell(f, stmt, col, neu)) n++;
    }
  }
  tableLog(f, 'family_tree').note = `node/affiliation의 "stateId":"S02·S06"(736회) → 세력 id, affiliation.name → 세력 이름 (${n}/296열)`;
}

// =========================== 115-retainer-graph.sql ========================
{
  const f = '115-retainer-graph.sql';
  const { stmts } = parseFile(f);
  const stmt = stmts.find((s) => s.table === 'retainer_graph' && s.lits[s.cols.indexOf('id')].trim() === "'retainer'");
  if (!stmt) fail('RETAINER_STMT', f);
  const walk = (obj, fn) => { if (Array.isArray(obj)) { for (const v of obj) walk(v, fn); } else if (obj && typeof obj === 'object') { fn(obj); for (const v of Object.values(obj)) walk(v, fn); } };
  const remap = (obj, where) => {
    walk(obj, (o) => {
      if ('state' in o && typeof o.state === 'string' && o.state) o.state = mapId(o.state, `${where}.state`);
      if ('stateId' in o && typeof o.stateId === 'string' && o.stateId) o.stateId = mapId(o.stateId, `${where}.stateId`);
    });
  };
  const r = all("SELECT json, json_ko FROM retainer_graph WHERE id='retainer'")[0];
  let n = 0;
  for (const col of ['json', 'json_ko']) {
    const neu = editJson(r[col], `retainer_graph.${col}`, remap);
    if (editCell(f, stmt, col, neu)) n++;
  }
  tableLog(f, 'retainer_graph').note = `node.state / court.stateId의 S0x → 세력 id, polity:daejeon 유지 (${n}/2열)`;
}

// ================= 010/020/100/121/122: audit (expect no state refs) =======
for (const f of ['010-meta.sql', '020-wiki-categories.sql', '100-clans.sql', '121-map-titles.sql', '122-map-rail.sql']) {
  const { stmts } = parseFile(f);
  for (const s of stmts) {
    for (let i = 0; i < s.lits.length; i++) {
      if (s.lits[i].includes("'") && S0X_TEST.test(stripQuotes(s.lits[i]))) fail('AUDIT_STATE_ID', `${f} ${s.table}.${s.cols[i]}`);
    }
  }
  fileLog(f).note = 'audit only: 모든 열에서 S01..S16 id 0건 — 변경 없음';
}

// ---------------------------------------------------------------------------
// 7. Apply the plans (line surgery)
// ---------------------------------------------------------------------------
const beforeText = new Map(FILES.map((f) => [f, raw.get(f)]));
for (const f of FILES) {
  const plan = plans.get(f);
  if (!plan) continue;
  const lines = raw.get(f).split('\n');
  for (const [idx, neu] of plan.lineReplacements) lines[idx] = neu;
  for (const idx of plan.lineDeletions) lines[idx] = null;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== null) out.push(lines[i]);
    for (const ins of plan.lineInsertions) if (ins.afterIdx === i) out.push(ins.line);
  }
  fs.writeFileSync(path.join(SQL_DIR, f), out.join('\n'));
}

// ---------------------------------------------------------------------------
// 8. Reload and verify (row counts, residual ids, JSON parse, unchanged lines)
// ---------------------------------------------------------------------------
{
  const vdb = new DatabaseSync(':memory:');
  vdb.exec('PRAGMA foreign_keys=OFF');
  for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) {
    try { vdb.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8')); } catch (e) { fail('RELOAD', `${f}: ${e.message}`); }
  }
  const vall = (sql) => { try { return vdb.prepare(sql).all(); } catch (e) { fail('VERIFY_QUERY', `${sql}: ${e.message}`); } };
  const expect = {
    wiki_state: 3, map_state: 3, wiki_update: 6, wiki_person: 1022, map_region: 427, map_station: 312,
    map_edge: 381, map_landmark: 19, map_holding: 50, map_title: 80, family_tree: 148, retainer_graph: 1, faction: 4,
    site_meta: 6, wiki_category: 23, clan: 177, nonkorean_family: 62,
  };
  for (const [t, n] of Object.entries(expect)) {
    const got = vall(`SELECT COUNT(*) n FROM ${t}`)[0].n;
    if (got !== n) fail('ROW_COUNT', `${t} => ${got}, expected ${n}`);
  }
  const checks = [
    ["SELECT COUNT(*) n FROM wiki_person WHERE state_id GLOB 'S0[1-9]' OR state_id GLOB 'S1[0-6]'", 0],
    ["SELECT COUNT(*) n FROM wiki_person WHERE state_id = 'S00'", 4],
    ["SELECT COUNT(*) n FROM wiki_person WHERE state_id = 'polity:daejeon'", 4],
    ["SELECT COUNT(*) n FROM wiki_person WHERE state_name = 'Myeongbu Church'", 0],
    ["SELECT COUNT(*) n FROM map_holding WHERE state_id GLOB 'S*'", 0],
    ["SELECT COUNT(*) n FROM map_landmark WHERE holder_id GLOB 'S*'", 0],
    ["SELECT COUNT(*) n FROM map_state", 3],
    ["SELECT COUNT(*) n FROM wiki_state", 3],
  ];
  for (const [sql, n] of checks) {
    const got = vall(sql)[0].n;
    if (got !== n) fail('RESIDUAL', `${sql} => ${got}, expected ${n}`);
  }
  const ws = vall('SELECT id FROM wiki_state ORDER BY sort').map((r) => r.id);
  if (ws.join(',') !== 'government,free-city,arc') fail('WIKI_STATE_IDS', ws.join(','));
  const ms = vall('SELECT state_id FROM map_state ORDER BY state_id').map((r) => r.state_id);
  if (ms.join(',') !== 'arc,free-city,government') fail('MAP_STATE_IDS', ms.join(','));
  const msCols = vall('SELECT exclusive_districts d FROM map_state ORDER BY state_id');
  const dmap = Object.fromEntries(msCols.map((r, i) => [ms[i], r.d]));
  if (dmap.government !== 14 || dmap['free-city'] !== 7 || dmap.arc !== 4) fail('MAP_STATE_DISTRICTS', JSON.stringify(dmap));
  for (const r of vall('SELECT surface_polity_ids, control, control_ko FROM map_station')) {
    JSON.parse(r.surface_polity_ids); JSON.parse(r.control); JSON.parse(r.control_ko);
  }
  for (const r of vall('SELECT control, control_ko FROM map_edge')) { JSON.parse(r.control); JSON.parse(r.control_ko); }
  for (const r of vall('SELECT polities FROM map_region')) JSON.parse(r.polities);
  for (const r of vall('SELECT data, data_ko FROM map_holding')) { JSON.parse(r.data); JSON.parse(r.data_ko); }
  for (const r of vall('SELECT json, json_ko FROM family_tree')) { JSON.parse(r.json); JSON.parse(r.json_ko); }
  for (const r of vall('SELECT json, json_ko FROM retainer_graph')) { JSON.parse(r.json); JSON.parse(r.json_ko); }
  log.verification = { rowCounts: expect, residualChecks: Object.fromEntries(checks.map(([sql, n]) => [sql.replace('SELECT COUNT(*) n FROM ', ''), n])) };
}

// unchanged-line guarantee: line-by-line walk over before/after
for (const f of FILES) {
  const before = (beforeText.get(f) ?? '').split('\n');
  const after = fs.readFileSync(path.join(SQL_DIR, f), 'utf8').split('\n');
  const plan = plans.get(f);
  const repl = plan?.lineReplacements ?? new Map();
  const del = plan?.lineDeletions ?? new Set();
  const insByAnchor = new Map();
  for (const ins of plan?.lineInsertions ?? []) {
    if (!insByAnchor.has(ins.afterIdx)) insByAnchor.set(ins.afterIdx, []);
    insByAnchor.get(ins.afterIdx).push(ins.line);
  }
  const expected = [];
  for (let i = 0; i < before.length; i++) {
    if (!del.has(i)) expected.push(repl.get(i) ?? before[i]);
    for (const l of insByAnchor.get(i) ?? []) expected.push(l);
  }
  if (expected.length !== after.length) fail('LINE_COUNT', `${f}: expected ${expected.length} lines, got ${after.length}`);
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== after[i]) fail('LINE_MISMATCH', `${f}:${i + 1}`);
  }
  const fl = fileLog(f);
  fl.linesBefore = before.length;
  fl.linesAfter = after.length;
  fl.changedLines = repl.size;
  fl.deletedLines = del.size;
  fl.addedLines = plan?.lineInsertions.length ?? 0;
}

// dedupe the classified remaining-name log
const seen = new Set();
log.remainingOldNames = log.remainingOldNames.filter((x) => {
  const k = JSON.stringify(x);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(log, null, 1) + '\n');
console.log(`OK: aux data aligned. Log: ${path.relative(REPO, REPORT)}`);
console.log(`  wiki_person: ${JSON.stringify(log.decisions.wikiPerson)}`);
console.log(`  duchy overrides: ${log.duchyOverrides.length}`);
console.log(`  ruler rows listed: ${log.rulerRows.length}`);
console.log(`  person text exceptions: ${log.personTextExceptions.length}`);
console.log(`  remaining old-name mentions (classified): ${log.remainingOldNames.length}`);
