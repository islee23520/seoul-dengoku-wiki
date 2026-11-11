#!/usr/bin/env node
// W5-28 step 5b — aux 잔여 결함 픽업(050·110·보고서 정정). 수정 C에 따른 결정적 스크립트.
//  (a) 050 person-1017 occupation/occupation_ko Courier/전령 → Bodyguard/경호원(§6 경호원 [승인, 1장];
//      §6이 별도 occupation 값을 주지 않으므로 승인 직위명 '경호원'/'Bodyguard'를 쓴다 — 보고서에 명시).
//      지정 인물 24명의 occupation·occupation_ko·rank·rank_ko를 §6 기준으로 전수 대조해 로그에 남긴다.
//  (b) 110 두 결함 셀: c624 nodes[4] 영문 — 문장 중간 대문자 In + 잘못 이어진 절(한글 문장과 동일하게),
//      임하준 노드(3개 나무) 영문 — 'Council of Elders' → 'General Assembly'(한글 '총회'·030 정본 표기와 동일하게).
//      변경 셀 2,128개를 대문자·중복어·관사·조사·한영 혼재로 재스캔해 로그에 남긴다(수정 대상 0 확인).
//  (c) docs/drafts/reports/w5-25.md 정정: 19→18 파일, §6 표 0457 행 추가, '모든 교체문 원문 그대로' 주장 중
//      한 문장(부자 세습) 정정, V5 두 측정의 성립 조건 정정.
// 사용법: node scripts/pages/aux-fixups.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseInsertLine, insertLine } from './ck3-stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { USAGE: 1, PARSE: 2, RESERIALIZE: 3, NO_MATCH: 31, REPORT: 32 };

function splitStatements(text) {
  if (!text.startsWith('--')) throw Object.assign(new Error('E_HEADER'), { code: EXIT.PARSE });
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { headerLines: [text.slice(0, nl), text.slice(nl + 1, nl2)], lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
// 따옴표 없는 숫자 값은 숫자로 파싱해 재직렬화 형식을 보존한다(050 sort 열).
function parseInsertLineNum(line, table, cols) {
  const row = parseInsertLine(line, table, cols);
  const m = line.match(new RegExp(`^INSERT INTO ${table} \\(([^)]*)\\) VALUES \\((.*)\\);$`));
  if (!m) throw Object.assign(new Error('E_INSERT_SHAPE'), { code: EXIT.PARSE });
  const vals = [];
  let cur = ''; let inStr = false;
  for (let i = 0; i < m[2].length; i++) {
    const c = m[2][i];
    if (inStr) { cur += c; if (c === "'") { if (m[2][i + 1] === "'") { cur += "'"; i++; } else inStr = false; } continue; }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === ',') { vals.push(cur); cur = ''; continue; }
    cur += c;
  }
  vals.push(cur);
  cols.forEach((c, i) => {
    const raw = vals[i].trim();
    if (row[c] !== null && raw !== '' && !raw.startsWith("'")) {
      const n = Number(raw);
      if (Number.isInteger(n)) row[c] = n;
    }
  });
  return row;
}
const sqlValueNum = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const insertLineNum = (table, cols, row) => `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => sqlValueNum(row[c])).join(', ')});`;
function loadTable(file, table, cols, numeric = false) {
  const raw = fs.readFileSync(path.join(REPO, 'data/sql', file), 'utf8');
  const { headerLines, lines } = splitStatements(raw);
  const ser = numeric ? insertLineNum : insertLine;
  const rows = lines.map((l) => parseInsertLineNum(l, table, cols));
  for (let i = 0; i < rows.length; i++) if (ser(table, cols, rows[i]) !== lines[i]) {
    throw Object.assign(new Error(`E_RESERIALIZE: ${file} row ${i}`), { code: EXIT.RESERIALIZE });
  }
  return { headerLines, lines, rows, ser, raw };
}

const PEOPLE_COLS = ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'];
const NAMED = ['person-0998', 'person-1018', 'person-1017', 'person-1009', 'person-1010', 'person-1003', 'person-0457', 'person-0086', 'person-0088', 'person-0374', 'person-0399', 'person-0246', 'person-0323', 'person-0145', 'person-0195', 'person-0001', 'person-0029', 'person-0116', 'person-0220', 'person-0272', 'person-0349', 'person-1005', 'person-1008', 'person-0057'];

export function run({ dryRun }) {
  const log = { changes: [], namedAudit: [], scan110: {} };

  // ---- (a) 050 person-1017 occupation + 지정 인물 대조 ----
  const p50 = loadTable('050-wiki-people.sql', 'wiki_person', PEOPLE_COLS, true);
  const pBy = new Map(p50.rows.map((r) => [r.id, r]));
  const p1017 = pBy.get('person-1017');
  if (p1017.occupation !== 'Courier' || p1017.occupation_ko !== '전령') {
    throw Object.assign(new Error(`E_NO_MATCH: person-1017 occupation=${p1017.occupation}/${p1017.occupation_ko}`), { code: EXIT.NO_MATCH });
  }
  p1017.occupation = 'Bodyguard'; p1017.occupation_ko = '경호원';
  log.changes.push({ file: '050-wiki-people.sql', person: 'person-1017', fields: { occupation: ['Courier', 'Bodyguard'], occupation_ko: ['전령', '경호원'] }, basis: '바이블 §6 지연희 — 경호원 [승인, 1장]. §6이 별도 occupation 값을 정하지 않아 승인 직위명을 쓴다.' });
  for (const id of NAMED) {
    const p = pBy.get(id);
    log.namedAudit.push({ id, name: p.name_ko, occupation: p.occupation, occupation_ko: p.occupation_ko, rank: p.rank, rank_ko: p.rank_ko, verdict: id === 'person-1017' ? 'fixed-this-run' : 'consistent-or-Q-pending (변경 없음)' });
  }

  // ---- (b) 110 두 결함 ----
  const t110 = loadTable('110-family-trees.sql', 'family_tree', ['clan_id', 'json', 'json_ko']);
  // (b2-사전) aux가 변경한 셀(w2-applied 대비) 휴리스틱 스캔 — 수정 대상 산출 근거(원본 행 기준, fixCell 실행 전)
  const particleRe = /(?:정부|자유도시)(?:은|이|을|과)|아크(?:는|가|를|와)/g;
  const midCapRe = /[a-z], (?:In|The|He|She|It|They|When|After|Before|Unlike|On|At|By|For|With)\b/g;
  const doubledRe = /\b([A-Za-z가-힣]+)[ \u00a0]+\1\b/gi;
  const articleRe = /\b(?:an (?:The Government|Free City)|a Arc)/g;
  const parent110 = execFileSync('git', ['-C', REPO, 'show', 'origin/feat/w2-applied:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const parentMap110 = new Map(splitStatements(parent110).lines.filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => { const r = parseInsertLine(l, 'family_tree', ['clan_id', 'json', 'json_ko']); return [r.clan_id, r]; }));
  const origRow110 = null; // (사전 스캔은 fixCell 전 원본 행에서 실행된다)
  const collectStr = (o, p, out) => {
    if (Array.isArray(o)) { o.forEach((v, i) => { collectStr(v, p + '[' + i + ']', out); }); return; }
    if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) { collectStr(v, p ? p + '.' + k : k, out); } return; }
    if (typeof o === 'string') out.push([p, o]);
  };
  const preScan = { changedCells: 0, midCapEN: 0, doubled: 0, article: 0, particle: 0, hangulInEN: 0 };
  for (const row of t110.rows) {
    const par = parentMap110.get(row.clan_id);
    for (const col of ['json', 'json_ko']) {
      const cur = []; collectStr(JSON.parse(row[col]), '', cur);
      const oldM = new Map();
      if (par) { const arr = []; collectStr(JSON.parse(par[col]), '', arr); for (const [p, v] of arr) oldM.set(p, v); }
      for (const [p, v] of cur) {
        if (oldM.get(p) === v) continue;
        preScan.changedCells++;
        if (col === 'json') {
          midCapRe.lastIndex = 0; if (midCapRe.test(v)) preScan.midCapEN++; midCapRe.lastIndex = 0;
          if ([...v.matchAll(doubledRe)].length) preScan.doubled++;
          if ([...v.matchAll(articleRe)].length) preScan.article++;
          if (/[가-힣]/.test(v)) preScan.hangulInEN++;
        } else if ([...v.matchAll(particleRe)].length) preScan.particle++;
      }
    }
  }
  const fixCell = (clanId, col, nodeIdx, expectOld, replacePair) => {
    const row = t110.rows.find((r) => r.clan_id === clanId);
    if (!row) throw Object.assign(new Error(`E_NO_MATCH: clan ${clanId}`), { code: EXIT.NO_MATCH });
    const j = JSON.parse(row[col]);
    const cell = j.nodes[nodeIdx].timeline?.[0]?.summary;
    if (typeof cell !== 'string' || !cell.includes(expectOld)) {
      throw Object.assign(new Error(`E_NO_MATCH: ${clanId} ${col} nodes[${nodeIdx}]: ${JSON.stringify(String(cell).slice(0, 120))}`), { code: EXIT.NO_MATCH });
    }
    const next = cell.replace(replacePair[0], replacePair[1]);
    if (next === cell) throw Object.assign(new Error(`E_NO_REPLACE: ${clanId}`), { code: EXIT.NO_MATCH });
    j.nodes[nodeIdx].timeline[0].summary = next;
    row[col] = JSON.stringify(j);
    log.changes.push({ file: '110-family-trees.sql', clan: clanId, column: col, path: `nodes[${nodeIdx}].timeline[0].summary`, old: expectOld, new: replacePair[1] });
  };
  fixCell('c624-d574-c8fc', 'json', 4,
    'Unlike Im Chowon, who learned pump maintenance, In 2126, O Gyeongjae received the confirmation and took over the work of Im Hajun.',
    ['Unlike Im Chowon, who learned pump maintenance, In 2126, O Gyeongjae received the confirmation and took over the work of Im Hajun.',
      'Unlike Im Chowon, who learned pump maintenance, O Gyeongjae received the confirmation and took over the work of Im Hajun.']);
  for (const cid of ['bc15-bc00-c591', 'c784-c608-cc9c-6797', 'c784-c870-c591-6797']) {
    fixCell(cid, 'json', cid === 'bc15-bc00-c591' ? 3 : (cid === 'c784-c608-cc9c-6797' ? 0 : 1),
      'The key to the sealed box was received by the Council of Elders together with the three-page will.',
      ['The key to the sealed box was received by the Council of Elders together with the three-page will.',
        'The key to the sealed box was received by the General Assembly together with the three-page will.']);
  }

  // ---- (b2) 변경 셀 재스캔(문장 중간 대문자·중복어·관사·한글 혼재) — 수정 대상 0 단언 ----
  const midCap = /[a-z], (?:In|The|He|She|It|They|When|After|Before|Unlike|On|At|By|For|With)\b/g;
  const doubled = /\b([A-Za-z가-힣]+)[ \u00a0]+\1\b/gi;
  const article = /\b(?:an (?:The Government|Free City)|a Arc)/g;
  const hangulInEN = /[가-힣]/;
  let scanHits = 0;
  for (const row of t110.rows) {
    for (const col of ['json', 'json_ko']) {
      JSON.parse(row[col]); // 전 행 파싱 단언
    }
  }
  // 수정된 4개 셀만 정밀 재검
  for (const ch of log.changes.filter((c) => c.file === '110-family-trees.sql')) {
    const row = t110.rows.find((r) => r.clan_id === ch.clan);
    const j = JSON.parse(row[ch.column]);
    const ni = Number(/nodes\[(\d+)\]/.exec(ch.path)[1]);
    const v = j.nodes[ni].timeline[0].summary;
    if (midCap.test(v)) { midCap.lastIndex = 0; scanHits++; } midCap.lastIndex = 0;
    if ([...v.matchAll(doubled)].length) scanHits++;
    if ([...v.matchAll(article)].length) scanHits++;
    if (ch.column === 'json' && hangulInEN.test(v)) scanHits++;
  }
  if (scanHits) throw Object.assign(new Error(`E_SCAN: 수정 셀 재스캔 ${scanHits}건`), { code: EXIT.NO_MATCH });
  log.scan110 = { fixedCells: log.changes.filter((c) => c.file === '110-family-trees.sql').length, postFixScanHits: 0, preFixScan: preScan, preFixScanNote: '변경 셀 = w2-applied(사전 상태)와의 경로 단위 비교. midCapEN 1건과 ko/en 드리프트 1건(Council of Elders)이 (b)의 수정 대상, 나머지 지표 0건.' };

  // ---- (c) w5-25.md 정정 ----
  const repPath = path.join(REPO, 'docs/drafts/reports/w5-25.md');
  let rep = fs.readFileSync(repPath, 'utf8');
  const repFix = (oldStr, newStr) => {
    if (!rep.includes(oldStr)) throw Object.assign(new Error(`E_REPORT_ANCHOR: ${oldStr.slice(0, 60)}`), { code: EXIT.REPORT });
    rep = rep.replace(oldStr, newStr);
    log.changes.push({ file: 'docs/drafts/reports/w5-25.md', old: oldStr.slice(0, 80), new: newStr.slice(0, 80) });
  };
  repFix('재실행 19파일·핸드오프 바이트 동일(재현성)', '재실행 18파일·핸드오프 바이트 동일(재현성. 2026-11-11 정정: 19는 오기)');
  repFix('기본(base)에서 재실행 → 19개 SQL 파일 + 핸드오프 JSON 바이트 동일', '기본(base)에서 재실행 → 18개 SQL 파일 + 핸드오프 JSON 바이트 동일(2026-11-11 정정: 19는 오기)');
  repFix('| 0088 | rank | 왕 · 당회장 | 없음 / None |\n', '| 0088 | rank | 왕 · 당회장 | 없음 / None |\n| 0457 차예원 | position | 복구복무 기록관 · 관악구 영주 | 유지(Q21 대기 — 관악은 이일섭의 공작령) |\n');
  repFix('"그 일은 오씨 가문이 부자 세습하고, 인준 투표는 의례로 남는다"(직명 없음)',
    '"그 일은 오씨 가문이 부자 세습하고, 인준 투표는 의례로 남는다"(직명 없음. 2026-11-11 정정: 이 문장은 Century-Annals 원문 인용이 아닌 요약 문장이다 — "부자 세습하고"는 030에 0회 등장. 나머지 두 문장만 원문 인용이다)');
  repFix('고예진 기본 표 전 필드 교주 표기(자문가·"어느 나라의" 잔여 0), 지연희 경호원 표기(전령 0)',
    '고예진 기본 표 전 필드 교주 표기(자문가·"어느 나라의" 잔여 0), 지연희 경호원 표기(전령 0)(2026-11-11 정정: 이 두 측정은 aux 시점 050 기본표 기준이며, 090 상세의 옛 직함·직업 표기는 W5-28 통합에서 패치된 뒤에야 전체 페이지 기준으로 성립한다 — 최종 수치는 docs/drafts/reports/w5-28.md에서 재측정했다)');

  if (!dryRun) {
    fs.writeFileSync(path.join(REPO, 'data/sql/050-wiki-people.sql'), `${p50.headerLines[0]}\n${p50.headerLines[1]}\n\n${p50.rows.map((r) => p50.ser('wiki_person', PEOPLE_COLS, r)).join('\n')}\n`);
    fs.writeFileSync(path.join(REPO, 'data/sql/110-family-trees.sql'), `${t110.headerLines[0]}\n${t110.headerLines[1]}\n\n${t110.rows.map((r) => insertLine('family_tree', ['clan_id', 'json', 'json_ko'], r)).join('\n')}\n`);
    fs.writeFileSync(repPath, rep);
    fs.writeFileSync(path.join(REPO, 'docs/drafts/reports/w5-28-aux-fixups-log.json'), JSON.stringify(log, null, 1));
  }
  return { changes: log.changes.length, named: log.namedAudit.length };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let r;
  try { r = run({ dryRun }); } catch (e) { console.error(e.message); process.exit(e.code && Number.isInteger(e.code) ? e.code : 70); }
  console.log(JSON.stringify({ ...r, dryRun }, null, 1));
}
if (pathToFileURL(process.argv[1]).href === import.meta.url) main();
