#!/usr/bin/env node
// W5-28 step 5 — 090 인계 적용 (docs/drafts/reports/w5-25-handoff-090.json).
// 정책(통합 브리프 수정 B, 기본 step 5를 대체):
//  1. replace 항목만 적용. owner-decision 항목은 절대 적용하지 않는다(skipped-owner-decision).
//  2. 050 직함이 소유자 질문 대기로 남은 인물(아래 PENDING_TITLE_PERSONS)의 org-name-map 항목은
//     적용하지 않는다(skipped-pending) — 잘못된 직함('Free City elected monarch' 등) 생성 방지.
//  3. 중첩 stateId(confirmedHoldings/openingTitles/subordinateHoldings/politicalIdentities)는
//     렌더·검색되지 않음을 측정했다(site/people.mjs는 name/rank/basis/holderName만 렌더,
//     peopleFilter.ts는 050 PersonRow만 검색) → 역사 식별자로 그대로 둔다.
//     보이는 산문의 '(S0x)' 괄호는 제거한다(paren-s0x-strip).
//  4. 누락된 지정 인물 항목을 추가한다(bible6-exception-en): person-1017 'Independent courier',
//     person-1018 'Inter-Region Contract Advisor'·'She holds no office in any state.',
//     person-0998 품계 'Director/이사' → 'Duke/공작'(관악 공작 [승인]).
//  5. old 문자열이 경로에서 정확히 일치하지 않으면 크게 실패한다(원자적: 하나라도 실패하면 기록 없음).
// 재현: 사전 단계 트리에서 실행하면 바이트 동일한 090을 만든다(멱등 아님 — 재실행은 사전 트리에서).
// 사용법: node scripts/pages/handoff-090-apply.mjs [--sql-dir data/sql] [--handoff <json>] [--log <json>] [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseInsertLine, insertLine } from './ck3-stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

const DETAIL_FILE = '090-person-details.sql';
const DETAIL_COLS = ['person_id', 'clan_id', 'json', 'json_ko'];

// 소유자 질문 대기로 050 직함이 남은 인들 — 바이블 §9/aux 보고서 §6 표에서 도출:
//  Q29 8인(구 국가 수장): 0001 한재목, 0029 강민서, 0116 배우진, 0220 최지우, 0272 이홍원, 0349 고서준, 1005 정서온, 1008 민웅기
//  Q26 0246 백온, Q27 0323 류은비, Q25 0399 정유라, Q28 0145 윤서린, Q21 0457 차예원,
//  Q22 0086 임하준, Q23 0088 오경재(직함 공석 대기), 성직 계급 공석 0089·0094·0095·0096·0104·0105·0108
export const PENDING_TITLE_PERSONS = [
  'person-0001', 'person-0029', 'person-0116', 'person-0220', 'person-0272', 'person-0349', 'person-1005', 'person-1008',
  'person-0246', 'person-0323', 'person-0399', 'person-0145', 'person-0457',
  'person-0086', 'person-0088', 'person-0089', 'person-0094', 'person-0095', 'person-0096', 'person-0104', 'person-0105', 'person-0108',
];

const EXIT = { USAGE: 1, PARSE: 2, RESERIALIZE: 3, NO_MATCH: 21, ADDED_NO_MATCH: 22, WRITE: 23 };

function splitStatements(text) {
  if (!text.startsWith('--')) throw Object.assign(new Error('E_HEADER: 090 머리말 주석 2줄이 아니다'), { code: EXIT.PARSE });
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  const headerLines = [text.slice(0, nl), text.slice(nl + 1, nl2)];
  const lines = text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
  return { headerLines, lines };
}

// $.a.b[i].c — 키에 공백·'·'·'/'가 있으므로 매 단계 '남은 경로를 접두로 시작하는 가장 긴 키'를 고른다.
export function resolvePath(root, path) {
  if (!path.startsWith('$.')) throw new Error(`E_PATH: ${path}`);
  let cur = root; let rest = path.slice(2);
  for (;;) {
    const m = /^\[(\d+)\]/.exec(rest);
    if (m) { cur = cur[Number(m[1])]; rest = rest.slice(m[0].length); if (rest.startsWith('.')) rest = rest.slice(1); continue; }
    if (rest === '') return cur;
    const keys = cur && typeof cur === 'object' && !Array.isArray(cur) ? Object.keys(cur).filter((k) => rest.startsWith(k)) : [];
    if (!keys.length) throw new Error(`E_PATH_RESOLVE: ${path} (rest=${rest.slice(0, 30)})`);
    const key = keys.sort((a, b) => b.length - a.length)[0];
    cur = cur[key]; rest = rest.slice(key.length);
    if (rest.startsWith('.')) rest = rest.slice(1);
    else if (rest !== '' && !rest.startsWith('[')) throw new Error(`E_PATH_SHAPE: ${path} (rest=${rest})`);
  }
}
function setAtPath(root, path, value) {
  if (!path.startsWith('$.')) throw new Error(`E_PATH: ${path}`);
  const lastDot = path.lastIndexOf('.');
  const lastSeg = lastDot > 1 ? path.slice(lastDot + 1) : path.slice(2);
  const idxM = /^(.+)\[(\d+)\]$/.exec(lastSeg);
  let parent; let key;
  if (idxM) { parent = resolvePath(root, lastDot > 1 ? `${path.slice(0, lastDot + 1)}${idxM[1]}` : `$.${idxM[1]}`); key = Number(idxM[2]); }
  else { parent = lastDot > 1 ? resolvePath(root, path.slice(0, lastDot)) : root; key = lastSeg; }
  if (parent === undefined || parent === null) throw new Error(`E_PATH_SET: ${path}`);
  parent[key] = value;
}

const walkStrings = (obj, fn, p = '') => {
  if (Array.isArray(obj)) { obj.forEach((v, i) => walkStrings(v, fn, `${p}[${i}]`)); return; }
  if (obj && typeof obj === 'object') { for (const [k, v] of Object.entries(obj)) walkStrings(v, fn, p ? `${p}.${k}` : k); return; }
  if (typeof obj === 'string') fn(p, obj);
};

export function run({ sqlDir, handoffPath, logPath, dryRun }) {
  const detailPath = path.join(REPO, sqlDir, DETAIL_FILE);
  const raw = fs.readFileSync(detailPath, 'utf8');
  const { headerLines, lines } = splitStatements(raw);
  if (lines.length !== 1022) throw Object.assign(new Error(`E_ROW_COUNT: ${lines.length} != 1022`), { code: EXIT.PARSE });
  const rows = lines.map((l) => parseInsertLine(l, 'person_detail', DETAIL_COLS));
  // 형식 무결성: 변경 전 원본 행을 재직렬화해 바이트 동일인지 확인(손편집 감지).
  for (let i = 0; i < rows.length; i++) {
    if (insertLine('person_detail', DETAIL_COLS, rows[i]) !== lines[i]) {
      throw Object.assign(new Error(`E_RESERIALIZE: ${rows[i].person_id}`), { code: EXIT.RESERIALIZE });
    }
  }
  const parsed = rows.map((r) => ({ ...r, _je: JSON.parse(r.json), _jk: JSON.parse(r.json_ko) }));
  const byPerson = new Map(parsed.map((r) => [r.person_id, r]));

  const H = JSON.parse(fs.readFileSync(path.join(REPO, handoffPath), 'utf8'));
  const items = H.items;
  const perItem = [];
  const counts = { applied: 0, 'skipped-owner-decision': 0, 'skipped-pending': 0, failed: 0 };
  const byRule = {};
  const failures = [];

  for (const it of items) {
    const row = byPerson.get(it.person);
    if (!row) { failures.push({ item: it, why: `E_NO_PERSON ${it.person}` }); counts.failed++; perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'failed', why: 'no person row' }); continue; }
    const doc = it.column === 'json' ? row._je : row._jk;
    if (it.action === 'owner-decision') { counts['skipped-owner-decision']++; byRule[it.rule] = byRule[it.rule] ?? {}; byRule[it.rule]['skipped-owner-decision'] = (byRule[it.rule]['skipped-owner-decision'] ?? 0) + 1; perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'skipped-owner-decision' }); continue; }
    if (it.rule === 'org-name-map' && PENDING_TITLE_PERSONS.includes(it.person)) {
      counts['skipped-pending']++; byRule[it.rule] = byRule[it.rule] ?? {}; byRule[it.rule]['skipped-pending'] = (byRule[it.rule]['skipped-pending'] ?? 0) + 1;
      perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'skipped-pending' });
      continue;
    }
    let cur;
    try { cur = resolvePath(doc, it.path); } catch (e) { failures.push({ item: it, why: e.message }); counts.failed++; perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'failed', why: e.message }); continue; }
    if (typeof cur !== 'string' || cur !== it.old) {
      const why = `E_NO_MATCH: ${it.person} ${it.column} ${it.path}`;
      failures.push({ item: { person: it.person, column: it.column, path: it.path, rule: it.rule }, why });
      counts.failed++; perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'failed', why });
      continue;
    }
    setAtPath(doc, it.path, it.new);
    counts.applied++; byRule[it.rule] = byRule[it.rule] ?? {}; byRule[it.rule].applied = (byRule[it.rule].applied ?? 0) + 1;
    perItem.push({ person: it.person, column: it.column, path: it.path, rule: it.rule, action: it.action, result: 'applied' });
  }

  // ---- 수정 B.3: 누락된 지정 인물 항목(승인값 출처: 바이블 §6 / aux 적용본 050) ----
  const addedItems = [];
  const addFix = (person, column, path, expectFn, transformFn, note) => {
    const row = byPerson.get(person);
    const doc = column === 'json' ? row._je : row._jk;
    let cur; try { cur = resolvePath(doc, path); } catch (e) { throw Object.assign(new Error(`E_ADDED_PATH: ${person} ${column} ${path}: ${e.message}`), { code: EXIT.ADDED_NO_MATCH }); }
    if (typeof cur !== 'string' || !expectFn(cur)) throw Object.assign(new Error(`E_ADDED_NO_MATCH: ${person} ${column} ${path} :: ${JSON.stringify(String(cur).slice(0, 120))}`), { code: EXIT.ADDED_NO_MATCH });
    const next = transformFn(cur);
    if (next !== cur) { setAtPath(doc, path, next); addedItems.push({ person, column, path, rule: 'bible6-exception-en', note, old: cur, new: next }); }
    else addedItems.push({ person, column, path, rule: 'bible6-exception-en', note, old: cur, new: next, result: 'no-change' });
  };
  // person-1017: 'Independent courier' → 승인 직위 'Bodyguard of Go Ye-jin'(§6 경호원 [승인])
  addFix('person-1017', 'json', '$.fields.Civil and Community Duties',
    (v) => v.startsWith('Independent courier'),
    (v) => v.replace(/^Independent courier/, 'Bodyguard of Go Ye-jin'),
    '§6 경호원 [승인] — 영문 필드 누락 보강');
  // person-1018: 'Inter-Region Contract Advisor' → 'Hierophant of the Arc'(§6 교주 [승인])
  addFix('person-1018', 'json', '$.fields.Civil and Community Duties',
    (v) => v.startsWith('Inter-Region Contract Advisor'),
    (v) => v.replace(/^Inter-Region Contract Advisor/, 'Hierophant of the Arc'),
    '§6 교주 [승인] — 영문 필드 누락 보강');
  // person-1018: 소속 산문 — org-name-map 적용후 'Arc (S16). She holds no office in any state.'
  addFix('person-1018', 'json', '$.fields.Affiliation',
    (v) => v === 'Arc (S16). She holds no office in any state.',
    () => 'Arc. She is the Hierophant of the Arc.',
    '§6 교주 [승인] — 모순 문장 교체');
  // person-0998: 품계 'Director/이사' → 'Duke/공작'(관악 공작 [승인])
  addFix('person-0998', 'json', '$.fields.Rank', (v) => v === 'Director', () => 'Duke', '§6 관악 공작 [승인] — 품계 정합');
  addFix('person-0998', 'json_ko', '$.fields.품계', (v) => v === '이사', () => '공작', '§6 관악 공작 [승인] — 품계 정합');
  addFix('person-0998', 'json', '$.biography',
    (v) => v.includes('- Rank: Director') && !v.includes('- Rank: Director-General'),
    (v) => v.replace('- Rank: Director\n', '- Rank: Duke\n'),
    '§6 관악 공작 [승인] — 생애 품계 행 정합');

  // ---- 수정 B.2: 보이는 산문 '(S0x)' 괄호 제거 ----
  const PAREN_TEST = /\(S(?:0[1-9]|1[0-6])\)/;
  const PAREN_G = /\s*\(S(?:0[1-9]|1[0-6])\)/g;
  const paren = { fieldsChanged: 0, hitsRemoved: 0, byColumn: { json: 0, json_ko: 0 } };
  for (const row of parsed) {
    for (const [col, doc] of [['json', row._je], ['json_ko', row._jk]]) {
      walkStrings(doc, (p, v) => {
        if (PAREN_TEST.test(v)) {
          const hits = [...v.matchAll(PAREN_G)].length;
          const next = v.replace(PAREN_G, '');
          setAtPath(doc, `$.${p}`, next);
          paren.fieldsChanged++; paren.hitsRemoved += hits; paren.byColumn[col]++;
        }
      });
    }
  }

  // ---- 중첩 stateId 측정 기록(변경 없음) ----
  const nestedStateId = { decision: 'untouched (not rendered, not searched — site/people.mjs renders name/rank/basis/holderName only; peopleFilter.ts searches the 050 PersonRow)', counts: {} };
  for (const row of parsed) {
    for (const doc of [row._je, row._jk]) {
      walkStrings(doc, (p) => {
        const m = /^([a-zA-Z]+)\[\d+\]\.stateId$/.exec(p);
        if (m) nestedStateId.counts[m[1]] = (nestedStateId.counts[m[1]] ?? 0) + 1;
      });
    }
  }

  if (failures.length) {
    for (const f of failures.slice(0, 10)) console.error(`${f.why}`);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 실패 — 아무것도 기록하지 않았다`), { code: EXIT.NO_MATCH });
  }

  // ---- 지정 인물 잔여 감사(전체 목록 로그) ----
  const NAMED = ['person-0998', 'person-1018', 'person-1017', 'person-1009', 'person-1010', 'person-1003', 'person-0457', 'person-0086', 'person-0088', 'person-0374', 'person-0399', 'person-0246', 'person-0323', 'person-0145', 'person-0195', 'person-0001', 'person-0029', 'person-0116', 'person-0220', 'person-0272', 'person-0349', 'person-1005', 'person-1008', 'person-0057'];
  const STALE_PROBES = ['Independent Courier', 'Independent courier', 'Inter-Region Contract Advisor', 'Inter-District Contract Advisor', 'She holds no office in any state', 'holds no office in any nation', '독립 전령', '권역 간 계약 자문가', '낭인', 'Famous Ronin', 'Ronin Commander', 'Taeuk Life Safety', '태욱 생명안전', 'Director', '이사', '당회장', 'Moderator of Myeongbu', 'Arc King', 'Arc 왕', '성전총림', '흰십자단'];
  const namedAudit = [];
  for (const pid of NAMED) {
    const row = byPerson.get(pid);
    for (const [col, doc] of [['json', row._je], ['json_ko', row._jk]]) {
      walkStrings(doc, (p, v) => {
        for (const s of STALE_PROBES) {
          if (v.includes(s)) {
            let klass;
            if (PENDING_TITLE_PERSONS.includes(pid)) klass = 'pending-person-kept (Q 대기 — 이번 적용 범위 밖)';
            else if (s === 'Director' || s === '이사') klass = 'approved-kept (승인/유지 문구 안의 동형 어절 — 0998 품계는 추가 항목으로 수정됨)';
            else if (/\$(title|rank|position)$/.test(p) || /fields\.(Title|직함|Rank|품계)/.test(p)) klass = 'should-be-fixed';
            else klass = 'prose-context (owner-decision 계열 — 문맥 재작성 필요)';
            namedAudit.push({ person: pid, column: col, path: `$.${p}`, probe: s, classification: klass, excerpt: v.slice(0, 90) });
          }
        }
      });
    }
  }

  // ---- 재직렬화 + 기록 ----
  const outRows = parsed.map((r) => ({ person_id: r.person_id, clan_id: r.clan_id, json: JSON.stringify(r._je), json_ko: JSON.stringify(r._jk) }));
  let changed = 0;
  for (let i = 0; i < outRows.length; i++) if (outRows[i].json !== rows[i].json || outRows[i].json_ko !== rows[i].json_ko) changed++;
  const outText = `${headerLines[0]}\n${headerLines[1]}\n\n${outRows.map((r) => insertLine('person_detail', DETAIL_COLS, r)).join('\n')}\n`;

  const log = {
    generatedBy: 'scripts/pages/handoff-090-apply.mjs',
    policy: {
      ownerDecision: 'never applied',
      pendingTitlePersons: PENDING_TITLE_PERSONS,
      pendingRule: '050 직함이 소유자 질문 대기로 남은 인들 — org-name-map 미적용(skipped-pending)',
      nestedStateId, paren,
    },
    counts, byRule, itemsTotal: items.length, rowsChanged: changed,
    addedItems, namedAudit,
    perItem,
  };
  if (!dryRun) {
    fs.writeFileSync(detailPath, outText);
    fs.mkdirSync(path.dirname(path.join(REPO, logPath)), { recursive: true });
    fs.writeFileSync(path.join(REPO, logPath), JSON.stringify(log, null, 1));
  }
  return { counts, byRule, added: addedItems.length, paren, rowsChanged: changed, itemsTotal: items.length };
}

function main() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  let r;
  try {
    r = run({
      sqlDir: opt('--sql-dir', 'data/sql'),
      handoffPath: opt('--handoff', 'docs/drafts/reports/w5-25-handoff-090.json'),
      logPath: opt('--log', 'docs/drafts/reports/w5-28-handoff-apply-log.json'),
      dryRun: flag('--dry-run'),
    });
  } catch (e) { console.error(e.message); process.exit(e.code && Number.isInteger(e.code) ? e.code : 70); }
  console.log(JSON.stringify({ ...r, paren: undefined, parenStrip: r.paren, dryRun: flag('--dry-run') }, null, 1));
}
if (pathToFileURL(process.argv[1]).href === import.meta.url) main();
