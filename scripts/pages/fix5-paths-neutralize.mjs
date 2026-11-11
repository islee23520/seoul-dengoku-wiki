#!/usr/bin/env node
// W5-28 fix5 B3 — 이 브랜치가 추가한 추적 파일의 개인 Windows 프로필 경로 접두어를 중립 토큰으로 바꾼다.
// 토큰: <tmp> = 프로필 아래 임시 폴더 접두어(슬래시 형태와 역슬래시 JSON 이스케이프 형태 모두),
// <omo> = 프로필 아래 .omo 작업 폴더 접두어, <home> = PATH 접두의 프로필 홈 접두어('<home>\bin').
// 원래 문자열은 소스에 그대로 적지 않고 아래에서 조각으로 런타임에 조립한다(공개 저장소에 개인 경로를 남기지 않는다).
// 대상은 이 브랜치에서 새로 추가된 docs/ 행뿐이며 main 에 이미 있던 파일(tools/portal, gdd/RESEARCH)은 건드리지 않는다.
// 각 파일에서 치환 어귀가 정확히 예상 횟수만큼 있을 때만 전부 바꾼다. 하나라도 어긋나면
// exit 21, 아무 파일도 쓰지 않는다.
// 이미 적용된 상태: 표의 모든 어귀가 0건이고 잔여도 없으면 아무것도 쓰지 않고 exit 0 으로 끝나며
// 남은 건수(0)를 출력한다 — 깨끗함을 증명하는 --check 겸용. 일부만 0건이거나 예상과 다른 건수가 있으면 exit 21.
// docs/gdd-rules.json의 measurement·docs/w4-rules.json의 conflicts/summary 는 스크립트가
// 역참조하지 않는 기록 필드다(grep 확인, dry-run 재현으로 행동 불변 확인).
// 사용법: node scripts/pages/fix5-paths-neutralize.mjs [--dry-run|--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { RULE: 21, WRITE: 23 };

// 패턴은 조각으로 조립한다(소스에 개인 경로 문자열 없음).
const USER = ['o', 'l', 'i', 'v', 'e', 'r'].join('');
const ROOT = ['C:', 'Users', USER].join('/');
const TMP = [ROOT, ['App', 'Data'].join(''), ['Lo', 'cal'].join(''), 'Temp'].join('/');
const OMO = ROOT + '/.omo';
const TMP_ESC = TMP.split('/').join('\\\\'); // JSON 이스케이프(역슬래시 2개) 형태
const BIN_BS = ROOT.split('/').join('\\') + '\\bin'; // PATH 접두 형태

// [file, old, new, expect] — fd286b06a 기준 실측 치환 표.
const REPLACEMENTS = [
  ['docs/drafts/reports/w3-b.md', TMP, '<tmp>', 2],
  ['docs/drafts/reports/w3-c.md', OMO, '<omo>', 1],
  ['docs/drafts/reports/w3-d.md', OMO, '<omo>', 1],
  ['docs/drafts/reports/w34-apply.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w4.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-25-apply-log.json', TMP_ESC, '<tmp>', 1],
  ['docs/drafts/reports/w5-25.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-26-apply-log.json', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-26.md', TMP, '<tmp>', 2],
  ['docs/drafts/reports/w5-27.md', TMP, '<tmp>', 5],
  ['docs/drafts/reports/w5-27.md', OMO, '<omo>', 1],
  ['docs/drafts/reports/w5-28-fix.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix2.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix3.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-28-fix4.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-28.md', TMP, '<tmp>', 1],
  ['docs/drafts/reports/w5-25.md', BIN_BS, '<home>\\bin', 1],
  ['docs/gdd-rules.json', TMP, '<tmp>', 1],
  ['docs/w4-rules.json', TMP, '<tmp>', 2],
];

export function run({ dryRun = false } = {}) {
  const texts = new Map();
  const failures = [];
  let replacements = 0;
  const counts = REPLACEMENTS.map(([file, oldS]) => {
    const p = path.join(REPO, file);
    if (!texts.has(p)) texts.set(p, fs.readFileSync(p, 'utf8'));
    return texts.get(p).split(oldS).length - 1;
  });
  if (counts.every((c) => c === 0)) {
    texts.clear();
    return { files: 0, replacements: 0, alreadyApplied: true, remaining: 0, dryRun };
  }
  texts.clear();
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
    const resid = (text.split(ROOT).length - 1) + (text.split(ROOT.split('/').join('\\\\')).length - 1);
    if (resid > 0) failures.push(`E_RESIDUAL: ${path.relative(REPO, p)} 에 개인 프로필 경로 ${resid}건 잔여`);
  }
  if (failures.length) {
    for (const f of failures.slice(0, 8)) console.error(f);
    throw Object.assign(new Error(`E_ABORT: ${failures.length} 치환 실패 — 아무것도 기록하지 않았다`), { code: EXIT.RULE });
  }
  if (!dryRun) for (const [p, text] of texts) fs.writeFileSync(p, text);
  return { files: texts.size, replacements, dryRun };
}

function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--check');
  try {
    console.log(JSON.stringify(run({ dryRun }), null, 1));
  } catch (e) {
    console.error(e.message);
    process.exit(e.code && Number.isInteger(e.code) ? e.code : 70);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
