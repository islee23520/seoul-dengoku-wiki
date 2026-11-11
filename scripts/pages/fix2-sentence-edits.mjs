#!/usr/bin/env node
// W5-28 fix2 — D1/D2 문장 교정 적용기 (docs/fix2-sentence-rules.json).
// D1: 090 인계 org-name-map의 조직→정치체 뒤섞임(흰십자단 61셀 포함, w5-28-orgmap-sweep.json 전량 판독) 복원.
// D2: 존속 조직명 면제 매치 전수 분류에서 걸러진 국가 기능 문장의 중립 재작성(후속 확장분).
// blackout-year-edit.mjs와 같은 원칙(셀 경로 일치 + old 문자열 치환)이지만 한 셀에 같은 문장이
// N회 반복된 경우를 지원한다: 규칙에 expect=N이 있으면 정확히 N회 전부 치환하고, 아니면 old가
// 정확 1회일 때만 1회 치환한다. 재직렬화는 ck3-stats.mjs의 parseInsertLine/insertLine(형식 바이트 불변).
// 재현: 사전 단계 트리(6917e110f)에서 실행하면 바이트 동일한 090/110을 만든다(멱등 아님).
// fix12: 규칙이 참조하는 파일만 적재하고(lazy) 115-retainer_graph 노드 state(세력 id) 규칙을 지원한다.
// 사용법: node scripts/pages/fix2-sentence-edits.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseInsertLine, insertLine } from './ck3-stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { PARSE: 2, RESERIALIZE: 3, RULE: 21, WRITE: 23 };
const FILES = {
  '090': { name: '090-person-details.sql', table: 'person_detail', cols: ['person_id', 'clan_id', 'json', 'json_ko'], idCol: 'person_id' },
  '110': { name: '110-family-trees.sql', table: 'family_tree', cols: null, idCol: 'clan_id' },
  // fix12: 가신도 노드 state(세력 id) 규칙. 090과 같은 json/json_ko 재직렬화 경로(단일 행, id 'retainer').
  '115': { name: '115-retainer-graph.sql', table: 'retainer_graph', cols: null, idCol: 'id' },
  // fix4: 050 wiki_person 평문 열(position/position_ko) 규칙. insertLine은 숫자 sort 열을 따옴표 문자열로
  // 재직렬화하므로(형식 불변 불가) 050은 원시 라인 치환으로만 적용한다(rawLine).
  '050': {
    name: '050-wiki-people.sql', table: 'wiki_person', idCol: 'id', rawLine: true,
    cols: ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'],
  },
};
function splitStatements(text, file) {
  if (!text.startsWith('--')) throw Object.assign(new Error(`E_HEADER: ${file} 머리말 주석 2줄이 아니다`), { code: EXIT.PARSE });
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  const headerLines = [text.slice(0, nl), text.slice(nl + 1, nl2)];
  const lines = text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
  return { headerLines, lines };
}
function resolvePath(root, p) {
  if (!p.startsWith('$.')) throw new Error(`E_PATH: ${p}`);
  let cur = root; let rest = p.slice(2);
  for (;;) {
    const m = /^\[(\d+)\]/.exec(rest);
    if (m) { cur = cur[Number(m[1])]; rest = rest.slice(m[0].length); if (rest.startsWith('.')) rest = rest.slice(1); continue; }
    if (rest === '') return cur;
    const keys = cur && typeof cur === 'object' && !Array.isArray(cur) ? Object.keys(cur).filter((k) => rest.startsWith(k)) : [];
    if (!keys.length) throw new Error(`E_PATH_RESOLVE: ${p}`);
    const key = keys.sort((a, b) => b.length - a.length)[0];
    cur = cur[key]; rest = rest.slice(key.length);
    if (rest.startsWith('.')) rest = rest.slice(1);
    else if (rest !== '' && !rest.startsWith('[')) throw new Error(`E_PATH_SHAPE: ${p}`);
  }
}
function setAtPath(root, p, value) {
  const lastDot = p.lastIndexOf('.');
  const lastSeg = lastDot > 1 ? p.slice(lastDot + 1) : p.slice(2);
  const idxM = /^(.+)\[(\d+)\]$/.exec(lastSeg);
  let parent; let key;
  if (idxM) { parent = resolvePath(root, lastDot > 1 ? `${p.slice(0, lastDot + 1)}${idxM[1]}` : `$.${idxM[1]}`); key = Number(idxM[2]); }
  else { parent = lastDot > 1 ? resolvePath(root, p.slice(0, lastDot)) : root; key = lastSeg; }
  if (parent === undefined || parent === null) throw new Error(`E_PATH_SET: ${p}`);
  parent[key] = value;
}
function loadFile(spec, filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { headerLines, lines } = splitStatements(raw, spec.name);
  const cols = spec.cols ?? (() => {
    const head = /^INSERT INTO \w+ \(([^)]*)\) VALUES \(/.exec(lines[0]);
    if (!head) throw Object.assign(new Error(`E_INSERT_SHAPE: ${spec.name}`), { code: EXIT.PARSE });
    return head[1].split(',').map((c) => c.trim());
  })();
  const rows = lines.map((l) => parseInsertLine(l, spec.table, cols));
  for (let i = 0; i < rows.length; i++) {
    if (insertLine(spec.table, cols, rows[i]) !== lines[i]) {
      throw Object.assign(new Error(`E_RESERIALIZE: ${spec.name} ${rows[i][spec.idCol]}`), { code: EXIT.RESERIALIZE });
    }
  }
  return { raw, headerLines, lines, cols, rows };
}
// 050 wiki_person: 재직렬화 무결성 검사 대신 행 형식만 검사하고 원시 라인을 보존한다(숫자 열 치환 방지).
function loadRawFile(spec, filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { headerLines, lines } = splitStatements(raw, spec.name);
  const headRe = new RegExp(`^INSERT INTO ${spec.table} \\(([^)]*)\\) VALUES \\('([^']+)',`);
  const byRow = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = headRe.exec(lines[i]);
    if (!m) throw Object.assign(new Error(`E_INSERT_SHAPE: ${spec.name} 행 ${i + 1}`), { code: EXIT.PARSE });
    if (m[1].split(',').map((c) => c.trim()).join(',') !== spec.cols.join(',')) {
      throw Object.assign(new Error(`E_INSERT_SHAPE: ${spec.name} 열 순서 불일치`), { code: EXIT.PARSE });
    }
    byRow.set(m[2], i);
  }
  return { raw, headerLines, lines, cols: spec.cols, rows: null, byRow, changedLines: new Set() };
}

export function run({ rulesPath, logPath, dryRun }) {
  const from = Number(process.env.FIX2_FROM ?? 0);
  const table = JSON.parse(fs.readFileSync(path.join(REPO, rulesPath), 'utf8'));
  const rules = table.rules.slice(from);
  const loaded = {};
  for (const rule of rules) {
    if (loaded[rule.file] || !FILES[rule.file]) continue; // 없는 파일 사양은 규칙 적용 시점에 E_FILE로 실패
    const spec = FILES[rule.file];
    loaded[rule.file] = spec.rawLine
      ? loadRawFile(spec, path.join(REPO, 'data/sql', spec.name))
      : loadFile(spec, path.join(REPO, 'data/sql', spec.name));
  }
  for (const [fk, ld] of Object.entries(loaded)) {
    if (!ld.rows) continue; // 050 raw-line: 행 파싱은 규칙 적용 시점에만
    ld.parsed = ld.rows.map((r) => ({ ...r, _je: JSON.parse(r.json), _jk: JSON.parse(r.json_ko) }));
    ld.byRow = new Map(ld.parsed.map((r) => [r[FILES[fk].idCol], r]));
  }
  const perRule = [];
  const failures = [];
  let applied = 0;
  const byFile = Object.fromEntries(Object.keys(loaded).map((k) => [k, 0]));
  const changedCells = new Set();
  const multiCells = 0;
  for (const rule of rules) {
    const spec = FILES[rule.file]; const ld = loaded[rule.file];
    if (!spec || !ld) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_FILE: ${rule.file}` }); continue; }
    if (spec.rawLine) {
      const lineIdx = ld.byRow.get(rule.id);
      if (lineIdx === undefined) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NO_ROW: ${rule.id}` }); continue; }
      const row = parseInsertLine(ld.lines[lineIdx], spec.table, spec.cols);
      const cell = row[rule.column];
      if (typeof cell !== 'string') { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NOT_STRING: ${rule.id} ${rule.column} ${rule.path}` }); continue; }
      const cnt = cell.split(rule.old).length - 1;
      const expect = rule.expect ?? 1;
      if (cnt !== expect) {
        failures.push({ rule: { ...rule, new: undefined }, why: `E_NO_UNIQUE_MATCH: ${rule.id} ${rule.column} ${rule.path} (occurrences=${cnt}, expect=${expect})` });
        continue;
      }
      const escOld = rule.old.replaceAll("'", "''");
      const escNew = rule.new.replaceAll("'", "''");
      const rawCnt = ld.lines[lineIdx].split(escOld).length - 1;
      if (rawCnt !== expect) {
        failures.push({ rule: { ...rule, new: undefined }, why: `E_RAW_AMBIGUOUS: ${rule.id} ${rule.column} ${rule.path} (cell=${cnt}, raw=${rawCnt}) — 셀 밖 같은 어구 또는 이스케이프 차이` });
        continue;
      }
      ld.lines[lineIdx] = expect === 1 ? ld.lines[lineIdx].replace(escOld, escNew) : ld.lines[lineIdx].split(escOld).join(escNew);
      ld.changedLines.add(lineIdx);
      applied++; byFile[rule.file]++; changedCells.add(`${rule.file}|${rule.id}|${rule.column}|${rule.path}`);
      perRule.push({ file: rule.file, id: rule.id, column: rule.column, path: rule.path, result: 'applied', occurrences: cnt });
      continue;
    }
    const row = ld.byRow.get(rule.id);
    if (!row) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NO_ROW: ${rule.id}` }); continue; }
    const doc = rule.column === 'json' ? row._je : row._jk;
    let cur;
    try { cur = resolvePath(doc, rule.path); } catch (e) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: e.message }); continue; }
    if (typeof cur !== 'string') { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NOT_STRING: ${rule.id} ${rule.column} ${rule.path}` }); continue; }
    const cnt = cur.split(rule.old).length - 1;
    const expect = rule.expect ?? 1;
    if (cnt !== expect) {
      failures.push({ rule: { ...rule, new: undefined }, why: `E_NO_UNIQUE_MATCH: ${rule.id} ${rule.column} ${rule.path} (occurrences=${cnt}, expect=${expect})` });
      continue;
    }
    const next = cnt === 1 ? cur.replace(rule.old, rule.new) : cur.split(rule.old).join(rule.new);
    setAtPath(doc, rule.path, next);
    applied++; byFile[rule.file]++; changedCells.add(`${rule.file}|${rule.id}|${rule.column}|${rule.path}`);
    perRule.push({ file: rule.file, id: rule.id, column: rule.column, path: rule.path, result: 'applied', occurrences: cnt });
  }
  if (failures.length) {
    for (const f of failures.slice(0, 8)) console.error(f.why);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 규칙 실패 — 아무것도 기록하지 않았다`), { code: EXIT.RULE });
  }
  const outputs = {};
  for (const [fk, ld] of Object.entries(loaded)) {
    const spec = FILES[fk];
    if (spec.rawLine) {
      outputs[fk] = { text: `${ld.headerLines[0]}\n${ld.headerLines[1]}\n\n${ld.lines.join('\n')}\n`, changedRows: ld.changedLines.size };
      continue;
    }
    const outRows = ld.parsed.map((r) => { const o = { ...r }; delete o._je; delete o._jk; o.json = JSON.stringify(r._je); o.json_ko = JSON.stringify(r._jk); return o; });
    let changedRows = 0;
    for (let i = 0; i < outRows.length; i++) if (insertLine(spec.table, ld.cols, outRows[i]) !== ld.lines[i]) changedRows++;
    outputs[fk] = { text: `${ld.headerLines[0]}\n${ld.headerLines[1]}\n\n${outRows.map((r) => insertLine(spec.table, ld.cols, r)).join('\n')}\n`, changedRows };
  }
  const log = {
    generatedBy: 'scripts/pages/fix2-sentence-edits.mjs',
    rulesPath, purpose: table.purpose, policy: table.policy, ruleRange: from ? `[${from}..${table.rules.length - 1}] 증분 적용(정본 재현은 전체 테이블 0번부터)` : '전체 테이블',
    counts: { rulesTotal: table.rules.length, rulesApplied: applied, rulesSkippedBefore: from, byFile, multiOccurrence: rules.filter((r) => r.expect).length, changedCells: changedCells.size, changedRows: Object.fromEntries(Object.entries(outputs).map(([k, o]) => [k, o.changedRows])), failed: 0 },
    keptTotal: Array.isArray(table.kept) ? table.kept.length : null,
    perRule,
  };
  if (!dryRun) {
    for (const fk of Object.keys(outputs)) fs.writeFileSync(path.join(REPO, 'data/sql', FILES[fk].name), outputs[fk].text);
    fs.mkdirSync(path.dirname(path.join(REPO, logPath)), { recursive: true });
    fs.writeFileSync(path.join(REPO, logPath), JSON.stringify(log, null, 1));
  }
  return { applied, byFile, changedCells: changedCells.size, changedRows: Object.fromEntries(Object.entries(outputs).map(([k, o]) => [k, o.changedRows])), rulesTotal: rules.length, multiOccurrence: rules.filter((r) => r.expect).length };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let r;
  try {
    const logOverride = process.env.FIX2_LOG;
    r = run({ rulesPath: 'docs/fix2-sentence-rules.json', logPath: logOverride ?? 'docs/drafts/reports/w5-28-fix2-edits-log.json', dryRun });
  } catch (e) { console.error(e.message); process.exit(e.code && Number.isInteger(e.code) ? e.code : 70); }
  console.log(JSON.stringify({ ...r, dryRun }, null, 1));
}
if (pathToFileURL(process.argv[1]).href === import.meta.url) main();
