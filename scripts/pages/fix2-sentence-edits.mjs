#!/usr/bin/env node
// W5-28 fix2 — D1/D2 문장 교정 적용기 (docs/fix2-sentence-rules.json).
// D1: 090 인계 org-name-map의 조직→정치체 뒤섞임(흰십자단 61셀 포함, w5-28-orgmap-sweep.json 전량 판독) 복원.
// D2: 존속 조직명 면제 매치 전수 분류에서 걸러진 국가 기능 문장의 중립 재작성(후속 확장분).
// blackout-year-edit.mjs와 같은 원칙(셀 경로 일치 + old 문자열 치환)이지만 한 셀에 같은 문장이
// N회 반복된 경우를 지원한다: 규칙에 expect=N이 있으면 정확히 N회 전부 치환하고, 아니면 old가
// 정확 1회일 때만 1회 치환한다. 재직렬화는 ck3-stats.mjs의 parseInsertLine/insertLine(형식 바이트 불변).
// 재현: 사전 단계 트리(6917e110f)에서 실행하면 바이트 동일한 090/110을 만든다(멱등 아님).
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

export function run({ rulesPath, logPath, dryRun }) {
  const from = Number(process.env.FIX2_FROM ?? 0);
  const table = JSON.parse(fs.readFileSync(path.join(REPO, rulesPath), 'utf8'));
  const rules = table.rules.slice(from);
  const loaded = {
    '090': loadFile(FILES['090'], path.join(REPO, 'data/sql', FILES['090'].name)),
    '110': loadFile(FILES['110'], path.join(REPO, 'data/sql', FILES['110'].name)),
  };
  for (const [fk, ld] of Object.entries(loaded)) {
    ld.parsed = ld.rows.map((r) => ({ ...r, _je: JSON.parse(r.json), _jk: JSON.parse(r.json_ko) }));
    ld.byRow = new Map(ld.parsed.map((r) => [r[FILES[fk].idCol], r]));
  }
  const perRule = [];
  const failures = [];
  let applied = 0;
  const byFile = { '090': 0, '110': 0 };
  const changedCells = new Set();
  const multiCells = 0;
  for (const rule of rules) {
    const spec = FILES[rule.file]; const ld = loaded[rule.file];
    if (!spec || !ld) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_FILE: ${rule.file}` }); continue; }
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
    const outRows = ld.parsed.map((r) => { const o = { ...r }; delete o._je; delete o._jk; o.json = JSON.stringify(r._je); o.json_ko = JSON.stringify(r._jk); return o; });
    let changedRows = 0;
    for (let i = 0; i < outRows.length; i++) if (insertLine(spec.table, ld.cols, outRows[i]) !== ld.lines[i]) changedRows++;
    outputs[fk] = { text: `${ld.headerLines[0]}\n${ld.headerLines[1]}\n\n${outRows.map((r) => insertLine(spec.table, ld.cols, r)).join('\n')}\n`, changedRows };
  }
  const log = {
    generatedBy: 'scripts/pages/fix2-sentence-edits.mjs',
    rulesPath, purpose: table.purpose, policy: table.policy, ruleRange: from ? `[${from}..${table.rules.length - 1}] 증분 적용(정본 재현은 전체 테이블 0번부터)` : '전체 테이블',
    counts: { rulesTotal: table.rules.length, rulesApplied: applied, rulesSkippedBefore: from, byFile, multiOccurrence: rules.filter((r) => r.expect).length, changedCells: changedCells.size, changedRows: { '090': outputs['090'].changedRows, '110': outputs['110'].changedRows }, failed: 0 },
    keptTotal: Array.isArray(table.kept) ? table.kept.length : null,
    perRule,
  };
  if (!dryRun) {
    fs.writeFileSync(path.join(REPO, 'data/sql', FILES['090'].name), outputs['090'].text);
    fs.writeFileSync(path.join(REPO, 'data/sql', FILES['110'].name), outputs['110'].text);
    fs.mkdirSync(path.dirname(path.join(REPO, logPath)), { recursive: true });
    fs.writeFileSync(path.join(REPO, logPath), JSON.stringify(log, null, 1));
  }
  return { applied, byFile, changedCells: changedCells.size, changedRows: { '090': outputs['090'].changedRows, '110': outputs['110'].changedRows }, rulesTotal: rules.length, multiOccurrence: rules.filter((r) => r.expect).length };
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
