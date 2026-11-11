// STEP 8 — 빌드 산출 전체 페이지(양 언어)의 '가시 텍스트'에서 금지 용어 잔존을 찾는다.
// script/style/HTML 주석/태그 제거, href·id 속성은 결코 스캔하지 않는다. 수정하지 않고 목록화만 한다.
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const TERMS = process.argv[3]; // docs/canon-terms.json
const REPORT = process.argv[4]; // 선택: 결과 JSON을 남길 경로
if (!OUT || !TERMS) { console.error('usage: node w34-leftover.mjs <builtOutDir> <canonTermsJson> [reportJson]'); process.exit(2); }

const canon = JSON.parse(fs.readFileSync(TERMS, 'utf8'));
const forbidden = canon.forbidden ?? [];
// canon 표 + 과제 지정 추가 리터럴
const extras = [
  { id: 'extra-sipgukguk-ko', re: /십육국/g, lang: 'ko', note: 'task literal' },
  { id: 'extra-sixteen-states-vis', re: /sixteen states/gi, lang: 'en', note: 'task literal' },
  { id: 'extra-sixteen-states-slug-vis', re: /Sixteen-States/g, lang: 'both', note: 'task literal (visible link text like Sixteen-States.md)' },
];
// extras는 컴파일된 정규식(re)로 제공되므로, re가 있으면 그것을 그대로 쓰고 없을 때만 pattern+flags로 컴파일한다.
const patterns = [...forbidden, ...extras].map((p) => ({ id: p.id ?? 'unknown', re: p.re ?? new RegExp(p.pattern ?? '<never>', (p.flags ?? '') + 'g'), lang: p.lang ?? 'both', note: p.note ?? '' }));

function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
function visibleText(html) {
  let t = html.replace(/<!--[\s\S]*?-->/g, ' ');
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&nbsp;', ' ');
  return t;
}
function sourceOf(rel) {
  if (rel === 'index.html' || rel === 'ko/index.html') return 'site-code(home)';
  if (rel.startsWith('wiki/seoul-showcase/') || rel.startsWith('ko/wiki/seoul-showcase/')) return 'showcase';
  if (rel.startsWith('gdd/') || rel.startsWith('ko/gdd/')) return 'gdd';
  if (rel.startsWith('wiki/people/') || rel.startsWith('ko/wiki/people/')) return 'people';
  if (rel.startsWith('wiki/families/') || rel.startsWith('ko/wiki/families/')) return 'clans(families)';
  if (/wiki\/states?\//.test(rel) || /wiki\/factions\//.test(rel)) return 'states/factions';
  if (/\/map\//.test(rel) || /-map\b/.test(rel)) return 'map';
  if (rel.startsWith('wiki/') || rel.startsWith('ko/wiki/')) return 'wiki-documents';
  return 'other';
}

const hits = []; // {page, source, patternId, phrase, count}
for (const abs of walkHtml(OUT)) {
  const rel = path.relative(OUT, abs).replaceAll('\\', '/');
  const text = visibleText(fs.readFileSync(abs, 'utf8'));
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let n = 0, m;
    while ((m = p.re.exec(text))) {
      n += 1;
      if (hits.length < 4000) hits.push({ page: rel, source: sourceOf(rel), patternId: p.id, phrase: m[0], context: text.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\s+/g, ' ').trim() });
      if (n > 5000) break;
    }
  }
}
const byPattern = {}, bySource = {};
for (const h of hits) { byPattern[h.patternId] = (byPattern[h.patternId] ?? 0) + 1; bySource[h.source] = (bySource[h.source] ?? 0) + 1; }
const pagesAffected = [...new Set(hits.map((h) => h.page))];
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify({ totalHits: hits.length, pagesAffected: pagesAffected.length, byPattern, bySource, hits }, null, 1));
console.log(JSON.stringify({ totalHits: hits.length, pagesAffected: pagesAffected.length, byPattern, bySource }, null, 1));
