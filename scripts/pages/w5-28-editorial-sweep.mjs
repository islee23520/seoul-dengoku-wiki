#!/usr/bin/env node
// W5-28 fix2 D3 — 집필 과정 어구(편집자 메타 언급) 전수 스윕.
// 대상: docs/drafts/*.ko.md·*.en.md(59문서 초안 — 030 재구축 원천)와
//       data/sql/090-person-details.sql·110-family-trees.sql·050-wiki-people.sql의 모든 문자열 셀(양언어).
// 어구(과업 지정): 창작, 설정이다, 채택하지 않, 가정하, 후보, 초안, 집필, creative, canon, draft,
//   hypothes, 'we adopt', 'not adopted', author, worldbuilding, 'for the story', 이야기상, Q[0-9]+, 소유자, owner.
// 링크 대상·앵커 id·모델 행(model:)은 문서 형식 요소라 제외하고 본문만 본다.
// 산출: docs/drafts/reports/w5-28-editorial-sweep.json — 어구별 적중(파일·행/경로·문장). 판정(세계 내
// 표기 vs 누출)은 사람이 읽어 보고서(w5-28-fix2.md)에 기록한다. 읽기 전용 스크립트.
// 사용법: node scripts/pages/w5-28-editorial-sweep.mjs [--json docs/drafts/reports/w5-28-editorial-sweep.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInsertLine } from './ck3-stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const TERMS = [
  { id: 'ko-chanjang', re: /창작/g },
  { id: 'ko-seoljeong', re: /설정이다/g },
  { id: 'ko-chaetaek', re: /채택하지 ? 않/g },
  { id: 'ko-gajeong', re: /가정하/g },
  { id: 'ko-hubo', re: /후보/g },
  { id: 'ko-choan', re: /초안/g },
  { id: 'ko-jipil', re: /집필/g },
  { id: 'en-creative', re: /\bcreative\b/gi },
  { id: 'en-canon', re: /\bcanon\b/gi },
  { id: 'en-draft', re: /\bdrafts?\b/gi },
  { id: 'en-hypothes', re: /hypothes/gi },
  { id: 'en-we-adopt', re: /\bwe adopt\b/gi },
  { id: 'en-not-adopted', re: /\bnot adopted\b/gi },
  { id: 'en-author', re: /\bauthors?\b/gi },
  { id: 'en-worldbuilding', re: /\bworldbuilding\b/gi },
  { id: 'en-for-story', re: /\bfor the story\b/gi },
  { id: 'ko-iyagisang', re: /이야기상/g },
  { id: 'qnum', re: /\bQ[0-9]+\b/g },
  { id: 'ko-soyuja', re: /소유자/g },
  { id: 'en-owner', re: /\bowners?\b/gi },
];
// 본문 추출: 마크다운 링크 대상 ](...)와 모델 행은 형식 요소 — 적중 문장에서 링크 괄호 안만 걷어낸다.
const stripLinkTargets = (s) => s.replace(/\]\([^)]*\)/g, '](LINK)');
function sentenceAround(text, idx) {
  let s = idx; let e = idx;
  while (s > 0 && !'.!?…\n'.includes(text[s - 1]) && idx - s < 160) s--;
  while (e < text.length && !'.!?…\n'.includes(text[e]) && e - idx < 220) e++;
  return text.slice(s, e).replace(/\s+/g, ' ').trim();
}

const hits = [];
function scanText(source, file, locator, text) {
  if (typeof text !== 'string' || !text) return;
  const lines = text.split('\n');
  for (const t of TERMS) {
    t.re.lastIndex = 0;
    const ms = [...text.matchAll(t.re)];
    for (const m of ms) {
      const upTo = text.slice(0, m.index);
      const line = upTo.split('\n').length;
      if (/^model:/.test(lines[line - 1] ?? '')) continue; // 초안 머리말 model 행은 형식
      const sent = sentenceAround(text, m.index);
      hits.push({ term: t.id, source, file, locator: locator === 'line' ? `line ${line}` : locator, match: m[0], sentence: stripLinkTargets(sent).slice(0, 220) });
    }
  }
}
// 1) 초안
for (const f of fs.readdirSync(path.join(REPO, 'docs/drafts'))) {
  if (!/\.(ko|en)\.md$/.test(f)) continue;
  const text = fs.readFileSync(path.join(REPO, 'docs/drafts', f), 'utf8');
  scanText('draft', f, 'line', text);
}
// 2) SQL 문자열 셀
const SQLS = [
  { file: 'data/sql/090-person-details.sql', table: 'person_detail', cols: ['person_id', 'clan_id', 'json', 'json_ko'], idCol: 'person_id' },
  { file: 'data/sql/110-family-trees.sql', table: 'family_tree', idCol: 'clan_id' },
  { file: 'data/sql/050-wiki-people.sql', table: null, idCol: null },
];
for (const spec of SQLS) {
  const raw = fs.readFileSync(path.join(REPO, spec.file), 'utf8');
  const nl = raw.indexOf('\n'); const nl2 = raw.indexOf('\n', nl + 1);
  const lines = raw.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
  for (const l of lines) {
    const head = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \(/.exec(l);
    if (!head) continue;
    const cols = head[2].split(',').map((c) => c.trim());
    const row = parseInsertLine(l, head[1], cols);
    const id = row[spec.idCol] ?? row.person_id ?? row.id ?? row.slug ?? '';
    for (const [col, v] of Object.entries(row)) {
      if (typeof v !== 'string') continue;
      if (/^\s*[\[{]/.test(v)) {
        // JSON 셀: 문자열 값만
        const walk = (o, p = '') => {
          if (Array.isArray(o)) { o.forEach((x, i) => walk(x, `${p}[${i}]`)); return; }
          if (o && typeof o === 'object') { for (const [k, x] of Object.entries(o)) walk(x, p ? `${p}.${k}` : k); return; }
          if (typeof o === 'string') scanText('sql', `${spec.file}#${id}`, `$.${p} (${col})`, o);
        };
        try { walk(JSON.parse(v)); } catch { /* 비JSON 문자열 셀은 아래에서 */ }
      } else scanText('sql', `${spec.file}#${id}`, `${col}`, v);
    }
  }
}
const byTerm = {};
for (const h of hits) byTerm[h.term] = (byTerm[h.term] ?? 0) + 1;
const bySource = {};
for (const h of hits) bySource[h.source] = (bySource[h.source] ?? 0) + 1;
const summary = { total: hits.length, byTerm, bySource };
console.log(JSON.stringify(summary, null, 1));
const outPath = opt('--json', 'docs/drafts/reports/w5-28-editorial-sweep.json');
fs.mkdirSync(path.dirname(path.join(REPO, outPath)), { recursive: true });
fs.writeFileSync(path.join(REPO, outPath), JSON.stringify({ generatedBy: 'scripts/pages/w5-28-editorial-sweep.mjs', terms: TERMS.map((t) => t.id), summary, hits }, null, 1));
