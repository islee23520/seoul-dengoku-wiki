#!/usr/bin/env node
// W5-28 step 8b — 빌드 산출 가시 텍스트 4부류 스캔(두 언어).
// script/style/HTML 주석/태그를 걷어 내고 href/id 속성은 보지 않는다(scan-terms와 같은 추출 원칙).
// 부류: sixteen(십육국 계열) / church(성직 어휘) / slaughter(살육 서사) / y2030(2030년 표기) / old-org(옛 국가·조직명).
// 각 히트를 record-schema|owner-pending|real-building-name|approved-term|leftover 로 분류해 JSON을 남긴다.
// 사용법: node scripts/pages/w5-28-scan-built.mjs --html <dist-dir> [--json <path>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIST = path.resolve(opt('--html', 'C:/Users/oliver/AppData/Local/Temp/w528-dist'));

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
// 분류 규칙(측정 기반): w5-26 잔존 분류表(펜스 JSON·설계 참조·슬러그), 090/110 owner-decision 항목,
// 존속 조직명(옛 국가는 단체로 존속), 살육 부정문(바이블 4절), Century-Annals 구 제목(계획 29행 대기).
// 분류되지 않는 것은 leftover-candidate로 남기고 보고서에서 전수 목록화한다.
const PENDING_PERSONS = new Set(['0001', '0029', '0116', '0220', '0246', '0272', '0323', '0349', '0399', '0457', '1005', '1008', '0145', '0086', '0088', '0089', '0094', '0095', '0096', '0104', '0105', '0108']);
const DATE_CTX = /\b20\d{2}-\d{2}-\d{2}\b/;
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
    const isGdd = /(^|\/)gdd\//.test(rel);
    const isPerson = /people\/person-/.test(rel);
    const isFamily = rel.includes('/families/');
    const isRelations = rel.includes('/relations/');
    const isLicense = rel.includes('/license/');
    const pid = rel.match(/person-(\d+)/)?.[1];
    for (const c of CLASSES) {
      c.re.lastIndex = 0;
      const m = [...text.matchAll(c.re)];
      if (!m.length) continue;
      let klass;
      if (isLicense) klass = 'record-schema (라이선스 원문)';
      else if (c.id === 'y2030') {
        if (text.includes('2030–2126')) klass = 'owner-pending (Century-Annals 구 제목 2030–2126 — 계획 29행 개명 대기)';
        else if (DATE_CTX.test(text)) klass = 'record-schema (생년·날짜 표기)';
        else klass = 'leftover-candidate';
      } else if (c.id === 'slaughter') klass = 'approved-term (살육 부정문·동물 관리 서술 — 바이블 4절 허용)';
      else if (isGdd) klass = c.id === 'church' ? 'record-schema (CK3/CK2 게임 메커니즘 인용 — w5-26 잔존 분류)' : 'record-schema (펜스 JSON payload·예시 표·슬러그 인용 — w5-26 잔존 분류)';
      else if (isPerson) klass = PENDING_PERSONS.has(pid) ? 'owner-pending (Q 대기 인물 — org-name-map·성직 어휘 미적용)' : (c.id === 'old-org' ? 'approved-term (존속 조직명)' : 'owner-pending (090 owner-decision 항목)');
      else if (isFamily || isRelations) klass = c.id === 'old-org' ? 'approved-term (존속 조직명)' : 'owner-pending (가계도·가신 성직 문장 — owner-decision)';
      else if (c.id === 'old-org') klass = 'approved-term (존속 조직명 — 옛 국가는 단체로 존속)';
      else if (c.id === 'sixteen' && /states\/index\.html$/.test(rel) && /폐지|retired/.test(text)) klass = 'approved-term (725 UI 전환 안내문 “십육국 체제는 폐지됐다/retired”)';
      else klass = 'leftover-candidate';
      const i = text.indexOf(m[0][0]);
      hits.push({ page: rel, class: c.id, count: m.length, matches: [...new Set(m.map((x) => x[0]))].slice(0, 6), classification: klass, excerpt: text.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, ' ').trim() });
    }
  }
})(DIST);
const byClass = {}; const byKlass = {};
for (const h of hits) { byClass[h.class] = (byClass[h.class] ?? 0) + h.count; byKlass[h.classification] = (byKlass[h.classification] ?? 0) + h.count; }
const summary = { pages, hitPages: hits.length, totalMatches: hits.reduce((s, h) => s + h.count, 0), byClass, byClassification: byKlass, leftoverCandidates: hits.filter((h) => h.classification === 'leftover-candidate').length };
console.log(JSON.stringify(summary, null, 1));
const ji = args.indexOf('--json');
if (ji >= 0) { fs.mkdirSync(path.dirname(path.join(REPO, args[ji + 1])), { recursive: true }); fs.writeFileSync(path.join(REPO, args[ji + 1]), JSON.stringify({ summary, hits }, null, 1)); }
