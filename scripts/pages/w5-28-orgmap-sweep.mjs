#!/usr/bin/env node
// W5-28 fix2 D1b — 090 인계 org-name-map 적용 2,454항목 전수 스윕(조직→정치체 뒤섞임 후보 플래그).
// 기준(과업 정의를 전수화 — 이전 좁은 스윕[서술어 패턴만]보다 훨씬 넓게, 조직 어휘가 사라지고
// 정치체 단어(정부|자유도시|아크|Government|Free City|Arc)가 들어온 문장 쌍은 빠짐없이 플래그):
//  (a) ko-particle-verb  조직 명사 + 조사(에서|에게|의|은|는|이|가) + 일하/배우/이끌/지키/등록 계열 동사
//  (b) ko-particle-other 조사가 붙었으나 (a)의 동사 외 서술(뼈대를 만든다 등)
//  (c) ko-place-of-org   지명 + '의' + 조직구
//  (d) ko-attribute-review 조사 없는 위치(소속·직함 표시 등 — 판독 보조)
//  (e) en-at-in-of       at/in/of the Government|Free City|Arc 및 소유격('s) — 기저가 명명된 조직 명사
//  (f) en-other          그 외 영어 위치
// 판정은 사람이 문장을 읽어 한다(보고서 w5-28-fix2.md). 부류는 위치 설명일 뿐 판정이 아니다.
// 입력(전부 커밋본): docs/drafts/reports/w5-25-handoff-090.json(항목 원장),
//                    docs/drafts/reports/w5-28-handoff-apply-log.json(적용 결과).
// item.old가 기저 문장(71a8f7cc1의 090 값 — 핸드오프가 첫 적용 단계였고 적용 스크립트는
// cur===old 정합을 요구했으므로 old = 기저 셀 값)이다.
// 출력: docs/drafts/reports/w5-28-orgmap-sweep.json — 플래그 전수 목록(person, column, path,
// base sentence, new sentence, class) + 부류별 계수. 읽기 전용: 어떤 트리에서 실행해도
// 같은 커밋 입력 위에서는 바이트 동일한 산출.
// 사용법: node scripts/pages/w5-28-orgmap-sweep.mjs [--json docs/drafts/reports/w5-28-orgmap-sweep.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const POLITY_KO = /(정부|자유도시|아크)|\b(?:the\s+)?(?:Government|Free\s+City|Arc)\b/;
const POLITY_EN = /\b(?:the\s+)?(?:Government|Free\s+City|Arc)\b/;
// 조직 명사: 인계 어휘의 원 조직명 + 일반 접미사형(단|부|국|청|그룹|연맹|조합|본부|총림|맹|사무소)
const ORG_KO_NAMED = /(흰십자단|중앙정보부|대한민국정부|신내운수|아관사|동방사|환적국|안국총림|성하전자|성하그룹|태욱그룹|여의도출자연합회|수문국|규격맹|행정청|길목사무소)/g;
const ORG_KO_SUFFIX = /[가-힣]{2,}(?:단|부|국|청|그룹|연맹|조합|본부|총림|맹|사무소)/g;
const PARTICLE = /(에서|에게|의|은|는|이|가)/;
const VERB_WORK = /(일하|근무|배우|가르치|이끌|지키|경비|등록|등재|재직|봉직|수련|도제|훈련|복무|파견|몸담|근속|소속|지도|감독|섬기|재임|당직|봉사)/;
const PLACE_OF_ORG = /[가-힣]{1,6}(?:동|구|역)의[^.!?…\n]{0,24}(?:단|부|국|청|그룹|연맹|조합|본부|의료국|총림|맹)/;
const EN_ORG = /\b(?:Corps|Agency|Burea[u]?s?|Company|Companies|Guild|Union|Unions|Clinic|Headquarters|Association|League|Office|Group|Council|Command|Society|Institute|Laborator(?:y|ies)|Federation|Monaster(?:y|ies)|Order|Transport(?:ation)?|Ministry|Department|Board|Service|Administration|Alliance|Legation|Arisu|White Cross|Taeuk|Seongha|Sinnae|Agwansa|Anguk|Jeongdong|Yeouido|Gauge)\b/g;
const EN_AT_IN_OF = /\b(?:at|in|of)\s+(?:the\s+)?(?:Government|Free City|Arc)\b|\b(?:the\s+)?(?:Government|Free City|Arc)'s\b/;

function sentences(text) {
  return text.split(/(?<=[.!?…])|\n+/g).map((s) => s.trim()).filter((s) => s.length > 0);
}
function bestPair(olds, news) {
  // 문장 수가 같으면 색인 정렬, 다르면 정치체를 담은 새 문장 후보 가운데 접두사가 가장 긴 쌍.
  if (olds.length === news.length) return olds.map((o, i) => [o, news[i]]);
  const cands = news.filter((w) => POLITY_KO.test(w) || POLITY_EN.test(w));
  const used = new Set();
  const pairs = [];
  for (const o of olds) {
    let best = null; let bestScore = -1;
    for (const w of cands) {
      if (used.has(w)) continue;
      let k = 0; const min = Math.min(o.length, w.length);
      while (k < min && o[k] === w[k]) k++;
      if (k > bestScore) { bestScore = k; best = w; }
    }
    if (best) { used.add(best); pairs.push([o, best]); } else pairs.push([o, null]);
  }
  return pairs;
}
function koOrgsGone(o, w) {
  const named = [...o.matchAll(ORG_KO_NAMED)].map((m) => m[0]);
  const suffix = [...o.matchAll(ORG_KO_SUFFIX)].map((m) => m[0]);
  const all = [...new Set([...named, ...suffix])];
  return all.filter((s) => !w.includes(s));
}
function enOrgsGone(o, w) {
  return [...new Set([...o.matchAll(EN_ORG)].map((m) => m[0]))].filter((s) => !new RegExp(`\\b${s}\\b`).test(w));
}
function classify(olds, news) {
  const flags = [];
  for (const [o, w] of bestPair(olds, news)) {
    if (!o || !w) continue;
    if (!(POLITY_KO.test(w) || POLITY_EN.test(w))) continue;
    const koGone = koOrgsGone(o, w);
    if (koGone.length) {
      let klass;
      if (PLACE_OF_ORG.test(o)) klass = 'ko-place-of-org';
      else if (PARTICLE.test(o) && VERB_WORK.test(o)) klass = 'ko-particle-verb';
      else if (PARTICLE.test(o)) klass = 'ko-particle-other';
      else klass = 'ko-attribute-review';
      flags.push({ class: klass, org: koGone.join('|'), old: o, new: w });
      continue;
    }
    const enGone = enOrgsGone(o, w);
    if (enGone.length) {
      flags.push({ class: EN_AT_IN_OF.test(w) ? 'en-at-in-of' : 'en-other', org: enGone.join('|'), old: o, new: w });
    }
  }
  return flags;
}

const H = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/drafts/reports/w5-25-handoff-090.json'), 'utf8'));
const L = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/drafts/reports/w5-28-handoff-apply-log.json'), 'utf8'));
const applied = new Set(L.perItem.filter((i) => i.rule === 'org-name-map' && i.result === 'applied').map((i) => `${i.person}|${i.column}|${i.path}`));

const flagged = [];
let items = 0;
const seen = new Set();
for (const it of H.items) {
  const k = `${it.person}|${it.column}|${it.path}`;
  if (!applied.has(k) || seen.has(k)) continue;
  seen.add(k);
  items++;
  const flags = classify(sentences(it.old), sentences(it.new));
  for (const f of flags) flagged.push({ person: it.person, column: it.column, path: it.path, class: f.class, org: f.org, baseSentence: f.old, newSentence: f.new });
}
const byClass = {};
for (const f of flagged) byClass[f.class] = (byClass[f.class] ?? 0) + 1;
const byColumn = {};
for (const f of flagged) byColumn[f.column] = (byColumn[f.column] ?? 0) + 1;
const out = {
  generatedBy: 'scripts/pages/w5-28-orgmap-sweep.mjs',
  inputs: {
    handoff: 'docs/drafts/reports/w5-25-handoff-090.json',
    applyLog: 'docs/drafts/reports/w5-28-handoff-apply-log.json',
    baseNote: 'item.old = 핸드오프 적용 직전(기저, 71a8f7cc1) 셀 값 — 적용 스크립트가 cur===old 정합을 요구',
  },
  criterion: {
    'ko-particle-verb': '기저 조직 명사 + 조사(에서|에게|의|은|는|이|가) + 일하/배우/이끌/지키/등록 계열 동사 문장',
    'ko-particle-other': '조사가 붙은 조직 명사 위치 — 동사가 (a) 목록 외인 서술(뼈대를 만든다 등)',
    'ko-place-of-org': '지명 + 의 + 조직구',
    'ko-attribute-review': '조사 없는 위치(소속·직함 표시 등) — 판독 보조',
    'en-at-in-of': 'at/in/of the Government|Free City|Arc 및 소유격 — 기저가 명명된 조직 명사',
    'en-other': '그 외 영어 위치',
  },
  counts: { itemsSwept: items, flagged: flagged.length, byClass, byColumn },
  flagged,
};
const outPath = opt('--json', 'docs/drafts/reports/w5-28-orgmap-sweep.json');
fs.mkdirSync(path.dirname(path.join(REPO, outPath)), { recursive: true });
fs.writeFileSync(path.join(REPO, outPath), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.counts, null, 1));
