// W5-28 step 6 — model: 행 형식 조정(옵션 a: 문서 개정) + 전수 감사 (재실행 가능, 수정 D 준수)
// docs/REWRITE-PIPELINE.md: model 값에 세미콜론 구분 출처 접미사가 올 수 있음을 문서에 반영하고,
// 모든 초안의 model: 행을 조사해 집계를 docs/drafts/reports/w5-28-model-line-audit.json에 남긴다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const PIPE = path.join(REPO, 'docs/REWRITE-PIPELINE.md');
const OLD = '- 네 필드 모두 값은 **줄 끝까지 그대로 저장된다** — 줄 안 주석 문법이 없으므로 설명을 값에 붙이지 않는다.';
const NEW = '- 네 필드 모두 값은 **줄 끝까지 그대로 저장된다** — 줄 안 주석 문법이 없다. 단 `model:` 값은 예외적으로 모델 id 뒤에 세미콜론(`;`)으로 구분한 출처 기록(호출 횟수·작성 방식·실제 모델 경위)을 붙일 수 있다(2026-11-11 W5-28 확정). 도구는 줄 전체를 그대로 저장하고 어떤 검사도 이를 거부하지 않는다. 출처 기록은 저자 표시의 정직한 근거다.';
let pipe = fs.readFileSync(PIPE, 'utf8');
if (!pipe.includes(OLD)) {
  if (pipe.includes(NEW)) { console.log('이미 개정됨'); }
  else throw new Error('E_ANCHOR: REWRITE-PIPELINE.md 문단을 찾을 수 없다');
} else {
  pipe = pipe.replace(OLD, NEW);
  fs.writeFileSync(PIPE, pipe);
  console.log('REWRITE-PIPELINE.md 개정 완료');
}
// 초안 model: 행 전수 감사
const draftsDir = path.join(REPO, 'docs/drafts');
const files = fs.readdirSync(draftsDir).filter((f) => /\.(ko|en)\.md$/.test(f)).sort();
const audit = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(draftsDir, f), 'utf8').split('\n');
  const ml = lines.find((l) => l.startsWith('model:'));
  const value = ml ? ml.slice(6).trim() : null;
  const bareId = value ? value.split(';')[0].trim() : null;
  const hasSuffix = value ? /;/.test(value) : false;
  audit.push({ file: f, modelId: bareId, hasProvenanceSuffix: hasSuffix, full: value });
}
const withSfx = audit.filter((a) => a.hasProvenanceSuffix).length;
const byModel = {};
for (const a of audit) byModel[a.modelId] = (byModel[a.modelId] ?? 0) + 1;
fs.writeFileSync(path.join(REPO, 'docs/drafts/reports/w5-28-model-line-audit.json'), JSON.stringify({ total: audit.length, withProvenanceSuffix: withSfx, bareOnly: audit.length - withSfx, byModelId: byModel, lines: audit }, null, 1));
console.log(JSON.stringify({ total: audit.length, withProvenanceSuffix: withSfx, bareOnly: audit.length - withSfx, byModelId: byModel }, null, 1));
