#!/usr/bin/env node
// W5-28 결함 수정 — 통합 문장 교정 적용기 (docs/integ-sentence-rules.json).
// 결함 H3(person-0195 org→polity + 110 c624 노드), M1('Arc of Labor Unions' 부분 치환 잔여),
// EXTRA-a(person-1017/1018 바이블 §6 승인값 정합), EXTRA-b(person-1019 십육국 절 삭제)의
// 정확한 문장·구절 규칙을 blackout-year-edit.mjs와 같은 엔진으로 적용한다(셋마다 old가 정확 1회일 때 1회 치환).
// 재현: 사전 단계 트리(이 스크립트 적용 전 상태)에서 실행하면 바이트 동일한 결과를 낸다(멱등 아님).
// 사용법: node scripts/pages/integ-sentence-edits.mjs [--dry-run]
import { run } from './blackout-year-edit.mjs';

function main() {
  const dryRun = process.argv.includes('--dry-run');
  try {
    const r = run({
      rulesPath: 'docs/integ-sentence-rules.json',
      logPath: 'docs/drafts/reports/w5-28-integ-edits-log.json',
      dryRun,
    });
    console.log(JSON.stringify({ ...r, dryRun }, null, 1));
  } catch (e) {
    console.error(e.message);
    process.exit(e.code && Number.isInteger(e.code) ? e.code : 70);
  }
}
main();
