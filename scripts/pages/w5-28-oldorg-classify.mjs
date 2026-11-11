#!/usr/bin/env node
// W5-28 fix2 D2 — 존속 조직명 면제 매치 전수 분류기(두 언어, 매치 단위).
// 이전 검사(w5-28-scan-built.mjs)의 '존속 조직명' 자동 면제(615)와 Q 대기 인물 보류(211)를
// 더 이상 면제 근거로 쓰지 않는다: 이 스크립트는 빌드 산출의 old-org 매치 전부를 잡아
// (a) 전체 문장(잘리지 않은)과 (b) 국가 기능 키워드 보조 플래그를 붙여 분류 원장을 만든다.
// 국가 기능 키워드(과업 정의): 시민·민정 명부, 호적·병적 등록, 경비지구, 동원, 군 문서,
//   민정 행정, 과세, 법원 — 한국어·영어 패턴.
// 판정(상태기능 여부, 재작성/보류)은 사람이 문장을 읽어 한다(보고서 w5-28-fix2.md).
// 사용법: node scripts/pages/w5-28-oldorg-classify.mjs --html <dist> [--json <path>]
// 기본값: --html <os.tmpdir()>/w528fix2-dist
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--html', path.join(os.tmpdir(), 'w528fix2-dist')));

const visible = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const OLD_ORG = /(수문국|규격맹|태욱그룹|성하그룹|안국총림|흰십자단|동방사|여의도출자연합회|환적국|신내운수|아관사|Floodgate (?:Bureau|State)|Standards League|Taeuk Group|Seongha Group|Anguk Grand Monastery|White Cross(?: Corps| Order| Society)?|Eastern Command|Yeouido Investment Federation|Religious Alliance|Myeongbu Church|Transshipment (?:Bureau|State)|Sinnae Transport|Agwansa)/g;
const PENDING_PERSONS = new Set(['0001', '0029', '0116', '0220', '0246', '0272', '0323', '0349', '0399', '0457', '1005', '1008', '0145', '0086', '0088', '0089', '0094', '0095', '0096', '0104', '0105', '0108']);
// 국가 기능 키워드(판독 보조)
const STATE_FN = {
  'register-list': /(명부|대장|등록|등재|호적|병적|시민권|세례록|ledger|register|roster|citizenship|household)/i,
  'conscription-mobilisation': /(징집|소집|동원|병력|징발|conscription|mobilization|mobilisation|requisition|manpower)/i,
  'military-docs': /(군사|군 문서|군서류|작전표|지휘|military document|operations chart|command|별칭)/i,
  'guard-district': /(경비지구|수비대|경비|순찰|초병|초소|guard district|garrison|sentry|patrol)/i,
  'civil-admin': /(행정|민정|관공|회의 기록|감사|civil service|administration|audit)/i,
  'taxation-court': /(관문세|통행세|과세|세금|재판|법원|gate tax|gate-toll|taxation|court|toll)/i,
};
function fullSentence(text, idx) {
  let s = idx; let e = idx;
  while (s > 0 && !'.!?…\n'.includes(text[s - 1])) s--;
  while (e < text.length && !'.!?…\n'.includes(text[e])) e++;
  return text.slice(s, e).replace(/\s+/g, ' ').trim();
}
const matches = [];
let pages = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    pages++;
    const rel = path.relative(DIST, p).replaceAll('\\', '/');
    const text = visible(fs.readFileSync(p, 'utf8'));
    const pid = rel.match(/person-(\d+)/)?.[1] ?? '';
    const pageInfo = {
      isGdd: /(^|\/)gdd\//.test(rel),
      isPerson: /people\/person-/.test(rel),
      isFamily: rel.includes('/families/'), isRelations: rel.includes('/relations/'),
      pid,
    };
    for (const m of text.matchAll(OLD_ORG)) {
      const sentence = fullSentence(text, m.index);
      const kw = Object.entries(STATE_FN).filter(([, re]) => re.test(sentence)).map(([k]) => k);
      matches.push({
        page: rel, org: m[0], sentence,
        priorClass: pageInfo.isGdd ? 'gdd-record' : pageInfo.isPerson && PENDING_PERSONS.has(pageInfo.pid) ? 'q-pending-person' : pageInfo.isPerson ? 'person-exempt' : pageInfo.isFamily || pageInfo.isRelations ? 'family-exempt' : 'wiki-exempt',
        pageType: pageInfo.isGdd ? 'gdd' : pageInfo.isPerson ? 'person' : pageInfo.isFamily ? 'family' : pageInfo.isRelations ? 'relations' : 'wiki',
        keywordFlags: kw,
      });
    }
  }
})(DIST);
const byPrior = {}; const byOrg = {}; let kwFlagged = 0;
for (const m of matches) { byPrior[m.priorClass] = (byPrior[m.priorClass] ?? 0) + 1; byOrg[m.org] = (byOrg[m.org] ?? 0) + 1; if (m.keywordFlags.length) kwFlagged++; }
const uniqSentences = new Map();
for (const m of matches) {
  const k = m.sentence;
  if (!uniqSentences.has(k)) uniqSentences.set(k, { sentence: m.sentence, orgs: new Set(), pages: [], priorClasses: new Set(), kw: new Set() });
  const u = uniqSentences.get(k);
  u.orgs.add(m.org); if (u.pages.length < 5) u.pages.push(m.page); u.priorClasses.add(m.priorClass); m.keywordFlags.forEach((x) => u.kw.add(x));
}
const summary = { pages, matches: matches.length, byPrior, byOrg, distinctSentences: uniqSentences.size, kwFlaggedMatches: kwFlagged };
console.log(JSON.stringify(summary, null, 1));
const outPath = opt('--json', 'docs/drafts/reports/w5-28-oldorg-classify.json');
const outAbs = path.isAbsolute(outPath) ? outPath : path.join(REPO, outPath);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, JSON.stringify({
  generatedBy: 'scripts/pages/w5-28-oldorg-classify.mjs',
  note: '판정(상태기능·재작성/보류)은 사람이 읽어 w5-28-fix2.md와 w5-28-owner-pending-sentences.json에 기록한다',
  stateFunctionKeywords: Object.fromEntries(Object.entries(STATE_FN).map(([k, v]) => [k, String(v)])),
  summary,
  sentences: [...uniqSentences.values()].map((u) => ({ sentence: u.sentence, orgs: [...u.orgs], pages: u.pages, priorClasses: [...u.priorClasses], keywordFlags: [...u.kw] })),
  matches,
}, null, 1));
