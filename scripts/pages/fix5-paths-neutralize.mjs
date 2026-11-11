#!/usr/bin/env node
// W5-28 fix5 B3 — 이 브랜치가 추가한 추적 파일의 개인 Windows 프로필 경로 접두어를 중립 토큰으로
// 바꾼다('C:/Users/oliver/AppData/Local/…' → '<tmp>/…', 역슬래시 JSON 이스케이프 형태 포함,
// 'C:/Users/oliver/.omo/…' → '<omo>/…', 'C:\Users\oliver\bin' PATH 접두 → '<home>\bin'). 대상은 이 브랜치에서 새로 추가된 docs/ 행뿐이며
// main 에 이미 있던 파일(tools/portal, gdd/RESEARCH)은 건드리지 않는다.
// 각 파일에서 치환 어귀가 정확히 예상 횟수만큼 있을 때만 전부 바꾼다. 하나라도 어긋나면
// exit 21, 아무 파일도 쓰지 않는다(멱등 아님 — fd286b06a 트리에서 재실행해 재현한다).
// docs/gdd-rules.json의 measurement·docs/w4-rules.json의 conflicts/summary 는 스크립트가
// 역참조하지 않는 기록 필드다(grep 확인, dry-run 재현으로 행동 불변 확인).
// 사용법: node scripts/pages/fix5-paths-neutralize.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { RULE: 21, WRITE: 23 };

// [file, old, new, expect] — fd286b06a 기준 실측 치환 표.
const REPLACEMENTS = [
  ['docs/drafts/reports/w3-b.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 2],
  ['docs/drafts/reports/w3-c.md', 'C:/Users/oliver/.omo', '<omo>', 1],
  ['docs/drafts/reports/w3-d.md', 'C:/Users/oliver/.omo', '<omo>', 1],
  ['docs/drafts/reports/w34-apply.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w4.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-25-apply-log.json', 'C:\\\\Users\\\\oliver\\\\AppData\\\\Local\\\\Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-25.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-26-apply-log.json', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-26.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 2],
  ['docs/drafts/reports/w5-27.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 5],
  ['docs/drafts/reports/w5-27.md', 'C:/Users/oliver/.omo', '<omo>', 1],
  ['docs/drafts/reports/w5-28-fix.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix2.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix3.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix4.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-28.md', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/drafts/reports/w5-25.md', 'C:\\Users\\oliver\\bin', '<home>\\bin', 1],
  ['docs/gdd-rules.json', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 1],
  ['docs/w4-rules.json', 'C:/Users/oliver/AppData/Local/Temp', '<tmp>', 2],
];

export function run({ dryRun = false } = {}) {
  const texts = new Map();
  const failures = [];
  let replacements = 0;
  for (const [file, oldS, newS, expect] of REPLACEMENTS) {
    const p = path.join(REPO, file);
    if (!texts.has(p)) texts.set(p, fs.readFileSync(p, 'utf8'));
    const text = texts.get(p);
    const cnt = text.split(oldS).length - 1;
    if (cnt !== expect) { failures.push(`E_NO_UNIQUE_MATCH: ${file} '${oldS.slice(0, 44)}…' (occurrences=${cnt}, expect=${expect})`); continue; }
    texts.set(p, text.split(oldS).join(newS));
    replacements += expect;
  }
  // 치환 뒤에도 남은 개인 프로필 경로가 있으면 실패
  for (const [p, text] of texts) {
    const resid = (text.split('C:/Users/oliver').length - 1) + (text.split('C:\\\\Users\\\\oliver').length - 1);
    if (resid > 0) failures.push(`E_RESIDUAL: ${path.relative(REPO, p)} 에 C:/Users/oliver ${resid}건 잔여`);
  }
  if (failures.length) {
    for (const f of failures.slice(0, 8)) console.error(f);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 치환 실패 — 아무것도 기록하지 않았다`), { code: EXIT.RULE });
  }
  if (!dryRun) for (const [p, text] of texts) fs.writeFileSync(p, text);
  return { files: texts.size, replacements, dryRun };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  try {
    console.log(JSON.stringify(run({ dryRun }), null, 1));
  } catch (e) {
    console.error(e.message);
    process.exit(e.code && Number.isInteger(e.code) ? e.code : 70);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
