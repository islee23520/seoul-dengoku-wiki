#!/usr/bin/env node
// W5-28 H1 — 구 대정전(2030) 서술 교정 적용기 (docs/blackout-year-rules.json).
// 규칙 1건 = 문장(또는 값) 1개: (file, id, column, path)가 가리키는 셀에서 old가 정확 1회 나올 때
// 1회만 new로 바꾼다. 숫자 전역 치환은 하지 않는다. 대상: 090-person-details.sql, 110-family-trees.sql.
// 재직렬화는 handoff-090-apply.mjs와 같은 ck3-stats.mjs의 parseInsertLine/insertLine을 쓴다(형식 바이트 불변).
// 재현: 사전 단계 트리(이 스크립트 적용 전 상태)에서 실행하면 바이트 동일한 결과를 낸다.
// 이미 적용된 트리에서 재실행하면 old가 없어 크게 실패한다(멱등 아님 — 사전 트리에서 재실행).
// 사용법: node scripts/pages/blackout-year-edit.mjs [--rules docs/blackout-year-rules.json]
//                                                [--log docs/drafts/reports/w5-28-blackout-apply-log.json] [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseInsertLine, insertLine } from './ck3-stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { USAGE: 1, PARSE: 2, RESERIALIZE: 3, RULE: 21, WRITE: 23 };

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

// $.a.b[i].c — 키에 공백·'·'·'/'가 있으므로 매 단계 '남은 경로를 접두로 시작하는 가장 긴 키'를 고른다(handoff-090-apply와 동일).
function resolvePath(root, path) {
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
  const lastDot = path.lastIndexOf('.');
  const lastSeg = lastDot > 1 ? path.slice(lastDot + 1) : path.slice(2);
  const idxM = /^(.+)\[(\d+)\]$/.exec(lastSeg);
  let parent; let key;
  if (idxM) { parent = resolvePath(root, lastDot > 1 ? `${path.slice(0, lastDot + 1)}${idxM[1]}` : `$.${idxM[1]}`); key = Number(idxM[2]); }
  else { parent = lastDot > 1 ? resolvePath(root, path.slice(0, lastDot)) : root; key = lastSeg; }
  if (parent === undefined || parent === null) throw new Error(`E_PATH_SET: ${path}`);
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

function run({ rulesPath, logPath, dryRun }) {
  const table = JSON.parse(fs.readFileSync(path.join(REPO, rulesPath), 'utf8'));
  const rules = table.rules;
  const loaded = {
    '090': loadFile(FILES['090'], path.join(REPO, 'data/sql', FILES['090'].name)),
    '110': loadFile(FILES['110'], path.join(REPO, 'data/sql', FILES['110'].name)),
  };
  for (const [k, ld] of Object.entries(loaded)) {
    ld.byRow = new Map(ld.rows.map((r) => [r[FILES[k].idCol], r]));
    ld.parsed = ld.rows.map((r) => ({ ...r, _je: JSON.parse(r.json), _jk: JSON.parse(r.json_ko) }));
    ld.byRow = new Map(ld.parsed.map((r) => [r[FILES[k].idCol], r]));
  }

  const perRule = [];
  const failures = [];
  let applied = 0;
  const byFile = { '090': 0, '110': 0 };
  const changedCells = new Set();
  for (const rule of rules) {
    const spec = FILES[rule.file];
    const ld = loaded[rule.file];
    if (!spec || !ld) { failures.push({ rule, why: `E_FILE: ${rule.file}` }); continue; }
    const row = ld.byRow.get(rule.id);
    if (!row) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NO_ROW: ${rule.id}` }); continue; }
    const doc = rule.column === 'json' ? row._je : row._jk;
    let cur;
    try { cur = resolvePath(doc, rule.path); } catch (e) { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: e.message }); continue; }
    if (typeof cur !== 'string') { failures.push({ rule: { ...rule, old: undefined, new: undefined }, why: `E_NOT_STRING: ${rule.id} ${rule.column} ${rule.path}` }); continue; }
    const first = cur.indexOf(rule.old);
    if (first < 0 || cur.indexOf(rule.old, first + 1) >= 0) {
      failures.push({ rule: { ...rule, new: undefined }, why: `E_NO_UNIQUE_MATCH: ${rule.id} ${rule.column} ${rule.path} (occurrences=${first < 0 ? 0 : 2}+)` });
      continue;
    }
    setAtPath(doc, rule.path, cur.slice(0, first) + rule.new + cur.slice(first + rule.old.length));
    applied++; byFile[rule.file]++; changedCells.add(`${rule.file}|${rule.id}|${rule.column}|${rule.path}`);
    perRule.push({ file: rule.file, id: rule.id, column: rule.column, path: rule.path, result: 'applied' });
  }
  if (failures.length) {
    for (const f of failures.slice(0, 8)) console.error(f.why);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 규칙 실패 — 아무것도 기록하지 않았다`), { code: EXIT.RULE });
  }

  // 재직렬화 + 무결성: 바뀌지 않은 행은 원본 라인과 바이트 동일이어야 한다.
  const outputs = {};
  for (const [k, ld] of Object.entries(loaded)) {
    const spec = FILES[k];
    const outRows = ld.parsed.map((r) => {
      const o = { ...r };
      delete o._je; delete o._jk;
      o.json = JSON.stringify(r._je); o.json_ko = JSON.stringify(r._jk);
      return o;
    });
    let changedRows = 0;
    for (let i = 0; i < outRows.length; i++) {
      const line = insertLine(spec.table, ld.cols, outRows[i]);
      if (line !== ld.lines[i]) changedRows++;
    }
    outputs[k] = { text: `${ld.headerLines[0]}\n${ld.headerLines[1]}\n\n${outRows.map((r) => insertLine(spec.table, ld.cols, r)).join('\n')}\n`, changedRows };
  }

  const log = {
    generatedBy: 'scripts/pages/blackout-year-edit.mjs',
    rulesPath, policy: table.policy, approvedWording: table.approvedWording,
    counts: { rulesTotal: rules.length, applied, byFile, changedCells: changedCells.size, changedRows: { '090': outputs['090'].changedRows, '110': outputs['110'].changedRows }, failed: 0 },
    keptTotal: Array.isArray(table.kept) ? table.kept.length : null,
    perRule,
  };
  if (!dryRun) {
    fs.writeFileSync(path.join(REPO, 'data/sql', FILES['090'].name), outputs['090'].text);
    fs.writeFileSync(path.join(REPO, 'data/sql', FILES['110'].name), outputs['110'].text);
    fs.mkdirSync(path.dirname(path.join(REPO, logPath)), { recursive: true });
    fs.writeFileSync(path.join(REPO, logPath), JSON.stringify(log, null, 1));
  }
  return { applied, byFile, changedCells: changedCells.size, changedRows: { '090': outputs['090'].changedRows, '110': outputs['110'].changedRows }, rulesTotal: rules.length };
}

function main() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  let r;
  try {
    r = run({
      rulesPath: opt('--rules', 'docs/blackout-year-rules.json'),
      logPath: opt('--log', 'docs/drafts/reports/w5-28-blackout-apply-log.json'),
      dryRun: flag('--dry-run'),
    });
  } catch (e) { console.error(e.message); process.exit(e.code && Number.isInteger(e.code) ? e.code : 70); }
  console.log(JSON.stringify({ ...r, dryRun: flag('--dry-run') }, null, 1));
}
if (pathToFileURL(process.argv[1]).href === import.meta.url) main();
