#!/usr/bin/env node
// W5-28 fix5 B1 — 초안 문장 교정 적용기 (docs/fix5-origin-rules.json).
// 적대 집단 기원 셀 보일러플레이트(최초의 AI 응답 → 자율 무기 드론 마지막 명령)를 중립 기원 문장으로
// 치환한다. blackout-year-edit.mjs·fix2-sentence-edits.mjs와 같은 원칙: 규칙 1건 = 정확 문장 1종이고
// 대상 파일에서 old가 정확히 expect회 나올 때만 전부 치환한다. 하나라도 어긋나면 exit 21,
// 어떤 초안·로그도 쓰지 않는다(멱등 아님 — 사전 단계 트리에서 재실행해 재현한다).
// 사용법: node scripts/pages/fix5-origin-edit.mjs [--dry-run] [--rules docs/fix5-origin-rules.json]
//                                                [--log docs/drafts/reports/w5-28-fix5-origin-apply-log.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { USAGE: 1, RULE: 21, WRITE: 23 };

export function run({ rulesPath = 'docs/fix5-origin-rules.json', logPath = 'docs/drafts/reports/w5-28-fix5-origin-apply-log.json', dryRun = false } = {}) {
  const table = JSON.parse(fs.readFileSync(path.join(REPO, rulesPath), 'utf8'));
  const draftsDir = path.join(REPO, 'docs/drafts');
  const failures = [];
  const texts = new Map();
  for (const rule of table.rules) {
    if (/\.\.?[\\/]/.test(rule.file) || !rule.file.endsWith('.md')) { failures.push(`E_FILE: ${rule.file}`); continue; }
    const p = path.join(draftsDir, rule.file);
    if (!texts.has(p)) texts.set(p, fs.readFileSync(p, 'utf8'));
    const text = texts.get(p);
    const cnt = text.split(rule.old).length - 1;
    const expect = rule.expect ?? 1;
    if (cnt !== expect) { failures.push(`E_NO_UNIQUE_MATCH: ${rule.file} (occurrences=${cnt}, expect=${expect})`); continue; }
    texts.set(p, expect === 1 ? text.replace(rule.old, rule.new) : text.split(rule.old).join(rule.new));
  }
  if (failures.length) {
    for (const f of failures.slice(0, 8)) console.error(f);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 규칙 실패 — 아무것도 기록하지 않았다`), { code: EXIT.RULE });
  }
  if (!dryRun) {
    for (const [p, text] of texts) fs.writeFileSync(p, text);
    fs.mkdirSync(path.dirname(path.join(REPO, logPath)), { recursive: true });
    fs.writeFileSync(path.join(REPO, logPath), JSON.stringify({
      generatedBy: 'scripts/pages/fix5-origin-edit.mjs', rulesPath,
      purpose: table.purpose, policy: table.policy,
      counts: { rules: table.rules.length, files: texts.size, replacements: table.rules.reduce((a, r) => a + (r.expect ?? 1), 0), failed: 0 },
      perRule: table.rules.map((r) => ({ file: r.file, occurrences: r.expect ?? 1, result: 'applied' })),
    }, null, 1));
  }
  return { rules: table.rules.length, files: texts.size, replacements: table.rules.reduce((a, r) => a + (r.expect ?? 1), 0), dryRun };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const rulesIdx = process.argv.indexOf('--rules');
  const logIdx = process.argv.indexOf('--log');
  try {
    const r = run({
      rulesPath: rulesIdx > -1 ? process.argv[rulesIdx + 1] : undefined,
      logPath: logIdx > -1 ? process.argv[logIdx + 1] : undefined,
      dryRun,
    });
    console.log(JSON.stringify(r, null, 1));
  } catch (e) {
    console.error(e.message);
    process.exit(e.code && Number.isInteger(e.code) ? e.code : 70);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
