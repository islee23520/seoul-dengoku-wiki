#!/usr/bin/env node
// W5-28 step 8b (2026-11-11 H1 개정) — 빌드 산출 가시 텍스트 4부류 스캔(두 언어), 매치 단위 분류.
// script/style/HTML 주석/태그를 걷어 내고 href/id 속성은 보지 않는다(scan-terms와 같은 추출 원칙).
// 부류: sixteen(십육국 계열) / church(성직 어휘) / slaughter(살육 서사) / y2030(2030 표기) / old-org(옛 국가·조직명).
// 분류는 페이지 단위가 아니라 **매치 단위**로 매치를 둘러싼 문장에서 판정한다(H1 결함 수정):
//   y2030 → title(구 제목 2030–2126) / old-blackout(구 대정전 서술) / birth-or-date(생년·이야기 내 날짜)
//           / hash-substring(해시·경로 부분문자열) / other(전수 목록 대상)
//   나머지 부류 → record-schema | owner-pending | approved-term | disclosed-followup | other
//   approved-term 가운데 '존속 조직명' 근거는 미검증 면제다 — exemptionBasis: 'surviving-org' 로 표시해
//   보고서가 의존 매치 수를 세고 표본 검수하게 한다(자동 면제로 신뢰하지 않는다).
// 사용법: node scripts/pages/w5-28-scan-built.mjs --html <dist-dir> [--json <path>]
// 기본값: --html <os.tmpdir()>/w528-dist
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--html', path.join(os.tmpdir(), 'w528-dist')));

const visible = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const CLASSES = [
  { id: 'sixteen', re: /(십육국|십육 ?개국|16 ?개국|열여섯 (?:나라|국가|개국)|sixteen[- ]states?|Seoul Sixteen|16 states)/gi },
  { id: 'church', re: /(당회장|(?<![가-힣])장로(?:회|들)?(?![가-힣])|목사|주교|대교구|교황|추기경|(?<![가-힣])권사(?![가-힣])|(?<![가-힣])집사(?![가-힣])|교회|성당|예배당?|\b(?:archbishops?|archdioces[ea]s?|popes?|priests?|deacons?|bishops?|pastors?|cardinals?|cathedrals?|church(?:es)?|moderators?)\b)/gi },
  { id: 'slaughter', re: /(살육|인류 말살|인류 감축|\bslaughter\b|\bgenocide\b|\bexterminat\w*(?= (?:of )?(?:humanity|humans|mankind|the human race)\b))/gi },
  { id: 'y2030', re: /\b2030\b/g },
  { id: 'old-org', re: /(수문국|규격맹|태욱그룹|성하그룹|안국총림|흰십자단|동방사|여의도출자연합회|Floodgate (?:Bureau|State)|Standards League|Taeuk Group|Seongha Group|Anguk Grand Monastery|White Cross Corps|Eastern Command|Yeouido Investment Federation|Religious Alliance|Myeongbu Church)/g },
];
// 소유자 질문 대기 인물(직함 보류) — handoff-090-apply.mjs PENDING_TITLE_PERSONS와 같은 목록.
const PENDING_PERSONS = new Set(['0001', '0029', '0116', '0220', '0246', '0272', '0323', '0349', '0399', '0457', '1005', '1008', '0145', '0086', '0088', '0089', '0094', '0095', '0096', '0104', '0105', '0108']);

// ---- 매치 단위 판정 ----
const BLACKOUT_CTX = /대정전|Great Blackout|10월 14일|October 14, ?2030|2030년 ?10월|communications (?:failed|are cut)|통신이 끊기|설비가 멈추|equipment stop|cloud learning|구름 학습/;
const DATE_OR_BIRTH = /생년|출생|born (?:in|on)|\b\d{4}-\d{2}-\d{2}\b|birth|Birth|예비군 중대/;
function sentenceAround(text, idx) {
  let s = idx; let e = idx;
  while (s > 0 && !'.!?…\n'.includes(text[s - 1]) && idx - s < 160) s--;
  while (e < text.length && !'.!?…\n'.includes(text[e]) && e - idx < 200) e++;
  return text.slice(s, e).replace(/\s+/g, ' ').trim();
}
function classifyY2030(sentence, text, idx, matchLen) {
  const around = text.slice(Math.max(0, idx - 40), idx + matchLen + 40);
  if (/2030[-–]2126/.test(around)) return { klass: 'title (구 Century-Annals 제목 2030–2126 — 폐기 예정 표기)', exemptionBasis: null };
  if (BLACKOUT_CTX.test(sentence)) return { klass: 'old-blackout (구 대정전 서술 — 바이블 3절 위반)', exemptionBasis: null };
  if (DATE_OR_BIRTH.test(sentence)) return { klass: 'birth-or-date (생년·이야기 내 날짜)', exemptionBasis: null };
  const run = text.slice(Math.max(0, idx - 24), idx + matchLen + 24).match(/[\w:/\\.-]{16,}/);
  if (run && run[0].length >= 16 && /[0-9a-f]{6}/i.test(run[0])) return { klass: 'hash-substring (해시·경로 부분문자열)', exemptionBasis: null };
  return { klass: 'other-y2030 (전수 목록 대상)', exemptionBasis: null };
}
function classifyOther(classId, sentence, pageInfo) {
  const { isGdd, isPerson, isFamily, isRelations, isLicense, pid } = pageInfo;
  if (isLicense) return { klass: 'record-schema (라이선스 원문)', exemptionBasis: null };
  if (classId === 'slaughter') return { klass: 'approved-term (살육 부정문·동물 관리 서술 — 바이블 4절 허용)', exemptionBasis: 'slaughter-negation' };
  if (isGdd) return { klass: classId === 'church' ? 'record-schema (CK3/CK2 게임 메커니즘 인용 — w5-26 잔존 분류)' : 'record-schema (펜스 JSON payload·예시 표·슬러그 인용 — w5-26 잔존 분류)', exemptionBasis: 'gdd-record' };
  if (isPerson) {
    if (PENDING_PERSONS.has(pid)) return { klass: 'owner-pending (Q 대기 인물 — org-name-map·성직 어휘 미적용)', exemptionBasis: null };
    if (classId === 'old-org') return { klass: 'approved-term (존속 조직명 — 옛 국가는 단체로 존속)', exemptionBasis: 'surviving-org' };
    return { klass: 'owner-pending (090 owner-decision 항목)', exemptionBasis: null };
  }
  if (isFamily || isRelations) {
    if (classId === 'old-org') return { klass: 'approved-term (존속 조직명 — 가계도·가신 산문)', exemptionBasis: 'surviving-org' };
    return { klass: 'owner-pending (가계도·가신 성직 문장 — owner-decision)', exemptionBasis: null };
  }
  if (classId === 'old-org') return { klass: 'approved-term (존속 조직명 — 옛 국가는 단체로 존속)', exemptionBasis: 'surviving-org' };
  if (classId === 'sixteen' && pageInfo.retiredUiNotice) return { klass: 'disclosed-followup (725 UI 전환 안내문 “십육국 체제는 폐지됐다/retired”)', exemptionBasis: 'ui-notice' };
  return { klass: 'other (전수 목록 대상 — leftover 후보)', exemptionBasis: null };
}

const hits = [];
let pages = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    pages++;
    const rel = path.relative(DIST, p).replaceAll('\\', '/');
    const text = visible(fs.readFileSync(p, 'utf8'));
    const pageInfo = {
      isGdd: /(^|\/)gdd\//.test(rel),
      isPerson: /people\/person-/.test(rel),
      isFamily: rel.includes('/families/'),
      isRelations: rel.includes('/relations/'),
      isLicense: rel.includes('/license/'),
      pid: rel.match(/person-(\d+)/)?.[1] ?? '',
      retiredUiNotice: /states\/index\.html$/.test(rel) && /폐지|retired/.test(text),
    };
    for (const c of CLASSES) {
      c.re.lastIndex = 0;
      const ms = [...text.matchAll(c.re)];
      if (!ms.length) continue;
      const perMatch = ms.map((m) => {
        const sentence = sentenceAround(text, m.index);
        const { klass, exemptionBasis } = c.id === 'y2030' ? classifyY2030(sentence, text, m.index, m[0].length) : classifyOther(c.id, sentence, pageInfo);
        return { text: m[0], sentence: sentence.slice(0, 160), klass, exemptionBasis };
      });
      const byKlass = {};
      for (const pm of perMatch) byKlass[pm.klass] = (byKlass[pm.klass] ?? 0) + 1;
      hits.push({ page: rel, class: c.id, count: ms.length, matches: [...new Set(ms.map((x) => x[0]))].slice(0, 6), classification: byKlass, perMatch, excerpt: perMatch[0].sentence.slice(0, 120) });
    }
  }
})(DIST);
const byClass = {}; const byKlass = {}; let totalMatches = 0; let exemptionSurvivingOrg = 0; let otherLeftover = 0;
for (const h of hits) {
  byClass[h.class] = (byClass[h.class] ?? 0) + h.count; totalMatches += h.count;
  for (const [k, v] of Object.entries(h.classification)) {
    byKlass[k] = (byKlass[k] ?? 0) + v;
    if (h.perMatch.length) { /* class-level tally only */ }
  }
  for (const pm of h.perMatch) if (pm.exemptionBasis === 'surviving-org') exemptionSurvivingOrg++;
  for (const pm of h.perMatch) if (/^other/.test(pm.klass)) otherLeftover++;
}
const uniqueHitPages = new Set(hits.map((h) => h.page)).size;
const summary = {
  pages, hitPages: hits.length, uniqueHitPages, totalMatches, byClass, byClassification: byKlass,
  leftoverCandidates: otherLeftover,
  reliesOnSurvivingOrgExemption: exemptionSurvivingOrg,
};
console.log(JSON.stringify(summary, null, 1));
const ji = args.indexOf('--json');
if (ji >= 0) { fs.mkdirSync(path.dirname(path.join(REPO, args[ji + 1])), { recursive: true }); fs.writeFileSync(path.join(REPO, args[ji + 1]), JSON.stringify({ summary, hits }, null, 1)); }
