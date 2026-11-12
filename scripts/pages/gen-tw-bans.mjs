#!/usr/bin/env node
// 다른 게임(TW:WH) 고유명 금지어 생성기 — 커밋된 스냅샷에서 docs/canon-terms.json의 생성 항목을 다시 만든다.
//   입력(모두 커밋됨, CI는 Fandom에 의존하지 않는다):
//     docs/canon-terms-sources/tw-names.txt      Fandom 분류 전체의 문서 제목(분류<TAB>제목)
//     docs/canon-terms-sources/tw-stoplist.txt   일반 영어 단어·고유명사 표기만 잡을 단어·제외 제목(자동 구역 + 수동 구역)
//     docs/canon-terms-sources/tw-extra.txt      제목 목록에 없는 이름(영어 보강, 한국어 표기)
//   명령:
//     node scripts/pages/gen-tw-bans.mjs            canon-terms.json의 생성 항목을 덮어쓴다
//     node scripts/pages/gen-tw-bans.mjs --check    덮어쓰지 않고 현재 파일이 생성 결과와 같은지 본다(다르면 exit 1)
//     node scripts/pages/gen-tw-bans.mjs --fetch    (네트워크) Fandom API를 cmcontinue로 끝까지 순회해 tw-names.txt를 다시 쓰고
//                                                  사전·빈도 목록으로 stoplist의 자동 구역을 다시 계산한다. 수동 구역은 보존한다.
//   규칙: 제목에서 (…) 꼬리표, /진영 꼬리표, ' – ' 변형, 앞의 The를 지우고 쉼표 앞만 쓴다. 단어마다
//     stop(일반 영어) / cs(사전에 있으나 드문 단어: 대문자 표기만) / 그 밖(조어: 대소문자 무시, 5자 이상)으로 나눈다.
//     조어가 있는 제목은 조어 단어를, 사전 단어뿐인 여러 단어 제목은 제목 전체를 대문자 표기 그대로 잡는다.
//     단어 하나짜리 일반어 제목(Engineer, Prince 등)은 금지하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const SRC = path.join(REPO, 'docs/canon-terms-sources');
const F_NAMES = path.join(SRC, 'tw-names.txt');
const F_STOP = path.join(SRC, 'tw-stoplist.txt');
const F_EXTRA = path.join(SRC, 'tw-extra.txt');
const F_TERMS = path.join(REPO, 'docs/canon-terms.json');

const API = 'https://totalwarwarhammer.fandom.com/api.php';
const CATEGORIES = [
  ['unit', 'Total War: Warhammer III units'], ['unit', 'Total War: Warhammer II units'], ['unit', 'Total War: Warhammer units'],
  ['unit', 'Regiments of Renown'], ['unit', 'Units'],
  ['char', 'Legendary lord units'], ['char', 'Lord units'], ['char', 'Hero units'], ['char', 'Legendary hero units'],
];
const CHAR_CATS = new Set(CATEGORIES.filter(([k]) => k === 'char').map(([, c]) => c));
const WORDS_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';
const FREQ_URL = 'https://norvig.com/ngrams/count_1w.txt';
const COMMON_RANK = 60000; // 사전에 있고 빈도 순위가 이 안이면 일반 영어(stop)
const MIN_CI = 5; // 대소문자 무시로 단독 금지하는 조어의 최소 글자 수
const MARK = '## manual (--fetch는 이 줄 아래를 보존한다)';
const META = /^(Total War|Unit roster|Regiments of Renown$|Legendary|Armies$|Fatigue$|Ethereal$|Charge Bonus$|Fire at will$|Skirmishing$|Unit counters$|Weapon types$)/;

const REF = '계획 과제 30(.omo/evidence/w2v/verify-task-6b.md N1, verify-task-30.md B1·B4). 생성: node scripts/pages/gen-tw-bans.mjs, 원천 docs/canon-terms-sources/ (Fandom 분류 전체, 수집일 2026-11-12)';
const PARTICLES = '은|는|이|가|의|을|를|와|과|에|에서|에게|으로|로|도|만|께|부터|까지|처럼|보다|이나|나|이며|며|이다|라는|이라는|라고|이라고';

// ---- 이름 정규화·분류 ------------------------------------------------------
export function normalizeTitle(t) {
  let s = t.replace(/\s*\([^)]*\)/g, '').replace(/\/.*$/, '').split(/\s[–-]\s/)[0];
  s = s.split(',')[0].trim().replace(/^The\s+/, '').replace(/^['’‘]+/, '').replace(/[!.\s]+$/, '');
  return s;
}
export function tokenize(name) {
  return name.split(/[\s–-]+/).map((w) => w.replace(/['’‘]s$/i, '').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')).filter(Boolean);
}
const variants = (w) => {
  const t = w.toLowerCase(); const v = [t];
  if (t.endsWith('ies')) v.push(t.slice(0, -3) + 'y');
  if (t.endsWith('es')) v.push(t.slice(0, -2));
  if (t.endsWith('s')) v.push(t.slice(0, -1));
  return v;
};

// ---- 파일 읽기 -------------------------------------------------------------
function readLines(f) { return fs.readFileSync(f, 'utf8').split(/\r?\n/); }
function readSnapshot() {
  const rows = [];
  for (const l of readLines(F_NAMES)) { if (!l || l.startsWith('#')) continue; const [cat, title] = l.split('\t'); if (title) rows.push({ cat, title }); }
  return rows;
}
function readStoplist() {
  const stop = new Set(), cs = new Set(), drop = new Set(), coined = new Set();
  for (const l of readLines(F_STOP)) {
    const m = /^(stop|cs|drop|coined) (.+?)(?:\s+#.*)?$/.exec(l); if (!m) continue; // 뒤쪽 '  # 이유' 주석은 무시
    const key = m[1] === 'drop' ? m[2] : m[2].toLowerCase();
    // 나중 줄(수동 구역)이 앞 줄(자동 구역)을 덮어쓴다
    for (const s of [stop, cs, coined]) s.delete(key);
    if (m[1] === 'stop') stop.add(key); else if (m[1] === 'cs') cs.add(key); else if (m[1] === 'coined') coined.add(key); else drop.add(key);
  }
  return { stop, cs, drop, coined };
}
function readExtra() {
  const out = { 'ci-lord': [], 'ci-unit': [], 'cs-lord': [], 'cs-unit': [], 'ko-faction': [], 'ko-lord': [], 'ko-unit': [], 'ko-cyber': [] };
  for (const l of readLines(F_EXTRA)) {
    const m = /^(ci-lord|ci-unit|cs-lord|cs-unit|ko-faction|ko-lord|ko-unit|ko-cyber) (.+)$/.exec(l); if (m) out[m[1]].push(m[2].trim());
  }
  return out;
}

// ---- 정규식 만들기(글자 트라이) -------------------------------------------
const escCh = (c) => (c === "'" ? "['’]" : c === ' ' ? '[ -]' : /[.*+?^${}()|[\]\\\-]/.test(c) ? `\\${c}` : c);
function trie(words) {
  const root = { c: new Map(), end: false };
  for (const w of words) { let n = root; for (const ch of w) { if (!n.c.has(ch)) n.c.set(ch, { c: new Map(), end: false }); n = n.c.get(ch); } n.end = true; }
  return root;
}
function trieSrc(n) {
  const alts = [...n.c.keys()].sort().map((ch) => escCh(ch) + trieSrc(n.c.get(ch)));
  if (!alts.length) return '';
  if (alts.length === 1 && !n.end) return alts[0];
  return `(?:${alts.join('|')})${n.end ? '?' : ''}`;
}
const stem = (w) => (w.length > 5 && /[^s]s$/.test(w) ? w.slice(0, -1) : w); // 복수 s는 패턴에서 s?로 받는다
export function altPattern(words, { ci }) {
  // 대소문자 무시(조어)는 복수 s를 받는다. 대문자 구분(일반어와 겹침)은 적힌 그대로만 잡아 Knight(직위)·Hierophant 같은 단수 일반어를 건드리지 않는다.
  const base = [...new Set(ci ? words.map((w) => stem(w.toLowerCase())) : words)].sort();
  return ci ? `\\b(?:${trieSrc(trie(base))})s?\\b` : `\\b(?:${trieSrc(trie(base))})\\b`;
}
export function koPattern(frags) {
  return `(?<![가-힣])(?:${[...new Set(frags)].sort().join('|')})(?:${PARTICLES})?(?![가-힣])`;
}

// ---- 생성 ------------------------------------------------------------------
export function build() {
  const rows = readSnapshot(); const sl = readStoplist(); const ex = readExtra();
  const tier = (w) => {
    const v = variants(w);
    if (v.some((x) => sl.coined.has(x))) return 'coined';
    if (v.some((x) => sl.stop.has(x))) return 'stop';
    if (v.some((x) => sl.cs.has(x))) return 'cs';
    return 'coined';
  };
  const ci = { lord: new Set(), unit: new Set() }, csw = { lord: new Set(), unit: new Set() }, csp = { lord: new Set(), unit: new Set() };
  const stat = { titles: 0, ci: 0, cs: 0, phrase: 0, dropped: 0, droppedTitles: [] };
  const seen = new Set();
  for (const { cat, title } of rows) {
    const name = normalizeTitle(title);
    if (!name || META.test(name) || seen.has(cat + '|' + name)) continue;
    seen.add(cat + '|' + name);
    const kind = CHAR_CATS.has(cat) ? 'lord' : 'unit';
    stat.titles++;
    if (sl.drop.has(name)) { stat.dropped++; stat.droppedTitles.push(name); continue; }
    const toks = tokenize(name); let emitted = false;
    for (const t of toks) {
      const k = tier(t);
      if (k === 'coined' && t.length >= MIN_CI) { ci[kind].add(t.toLowerCase()); emitted = true; stat.ci++; }
      else if (k === 'coined' && t.length >= 4) { csw[kind].add(t[0].toUpperCase() + t.slice(1).toLowerCase()); emitted = true; stat.cs++; } // 짧은 조어(Hoeth, Grom)는 대문자 표기만, 3자 이하는 건너뜀
      else if (k === 'cs') { csw[kind].add(t[0].toUpperCase() + t.slice(1)); emitted = true; stat.cs++; }
    }
    if (!emitted) {
      if (toks.length >= 2) { csp[kind].add(toks.join(' ')); stat.phrase++; }
      else { stat.dropped++; stat.droppedTitles.push(name); }
    }
  }
  // 제목 목록에 없는 보강 이름
  for (const kind of ['lord', 'unit']) {
    for (const x of ex[`ci-${kind}`]) ci[kind].add(x.toLowerCase());
    for (const x of ex[`cs-${kind}`]) (x.includes(' ') ? csp[kind] : csw[kind]).add(x);
  }
  // 이미 ci에 들어간 단어는 두 entry에 중복해 넣지 않는다(병종 쪽을 우선)
  for (const w of ci.lord) if (ci.unit.has(w)) ci.lord.delete(w);
  for (const w of csw.lord) if (csw.unit.has(w)) csw.lord.delete(w);
  const csAll = (kind) => [...csw[kind], ...csp[kind]];
  const E = (id, pattern, flags, lang, note) => ({ id, pattern, flags, lang, allowedContext: [], note });
  const entries = [
    E('tw-lords-en', altPattern([...ci.lord], { ci: true }), 'i', 'en', `[정본 바이블 4절] 토탈 워: 워해머 군주·영웅 이름의 조어 단어(영어, 대소문자 무시, 복수 s 포함, ${ci.lord.size}개). 일반 영어 단어는 넣지 않는다. 대체: 세계 안에서 지은 인물. 근거: ${REF}.`),
    E('tw-units-en', altPattern([...ci.unit], { ci: true }), 'i', 'en', `[정본 바이블 4절] 토탈 워: 워해머 병종·연대 이름의 조어 단어(영어, 대소문자 무시, 복수 s 포함, ${ci.unit.size}개). 일반 영어 단어는 넣지 않는다. 대체: 세계 안에서 지은 일반 명칭. 근거: ${REF}.`),
    E('tw-lords-en-proper', altPattern(csAll('lord'), { ci: false }), '', 'en', `[정본 바이블 4절] 토탈 워: 워해머 군주·영웅 이름 중 사전에 있는 드문 단어와 일반어로만 된 이름(대소문자 구분, 대문자 고유명사 표기만, ${csAll('lord').length}개). 일반 영어 소문자 용법은 잡지 않는다. 근거: ${REF}.`),
    E('tw-units-en-proper', altPattern(csAll('unit'), { ci: false }), '', 'en', `[정본 바이블 4절] 토탈 워: 워해머 병종 이름 중 일반 영어 명사와 겹치는 것(Spearmen, Crossbowmen, Handgunners, Swordsmen, Halberdiers, Knights, Archers 등)과 일반어로만 된 여러 단어 이름(대소문자 구분, 대문자 고유명사 표기만, ${csAll('unit').length}개). 소문자 spearmen, archers, knights of the old guard는 잡지 않는다. 근거: ${REF}. game-units-en-proper와 같은 방식.`),
    E('tw-factions-ko', koPattern(ex['ko-faction']), '', 'ko', `[정본 바이블 4절] 토탈 워: 워해머 진영·지명의 한국어 표기. 앞 글자가 한글이거나 뒤에 조사 외의 한글이 이어지면 잡지 않는다(예: 아르칸소). 일반 군사 용어(창병, 석궁병, 총병, 기사, 궁수)는 넣지 않는다. 근거: ${REF}. 표기는 나무위키·우만위키 토탈 워: 워해머 문서에서 확인했다.`),
    E('tw-lords-ko', koPattern(ex['ko-lord']), '', 'ko', `[정본 바이블 4절] 토탈 워: 워해머 군주·영웅 이름의 한국어 표기(표기 변이 포함). 앞 글자가 한글이거나 뒤에 조사(은·는·이·가·의·을·를·와·과·에 등) 외의 한글이 이어지면 잡지 않는다(예: 아르칸소, 세트라인, 칼리다스). 근거: ${REF}.`),
    E('tw-units-ko', koPattern(ex['ko-unit']), '', 'ko', `[정본 바이블 4절] 토탈 워: 워해머 병종 이름 중 구별되는 고유 명칭의 한국어 표기. 앞 글자가 한글이거나 뒤에 조사 외의 한글이 이어지면 잡지 않는다. 일반 군사 용어(창병, 석궁병, 총병, 기사, 궁수)는 넣지 않는다. 근거: ${REF}. 스팀 탱크·그레이브 가드는 기존 game-units-ko·game-units-en-proper가 맡는다.`),
    E('brand-cyber-names-ko', koPattern(ex['ko-cyber']), '', 'ko', `[정본 바이블 4절] 사이버펑크 2077 고유명의 한국어 표기(케렌지코프, 시냅스·시냅틱 가속기, 제타텍, 다이날러, 트라우마 팀, 나이트 시티, 넷워치 등). 앞 글자가 한글이거나 뒤에 조사 외의 한글이 이어지면 잡지 않는다. 근거: ${REF}, 소유자 결정(2026-11-12). brand-cyber-ko를 보완한다.`),
  ];
  return { entries, stat, sets: { ci, csw, csp } };
}

export function applyEntries(J, entries) {
  // 기존 위치 보존: 이미 있던 id는 제자리 교체, 새 id는 tw-lords-en 바로 뒤(없으면 game-units-ko 뒤)에 넣는다
  const out = [...J.forbidden];
  for (const e of entries) {
    const i = out.findIndex((x) => x.id === e.id);
    if (i >= 0) out[i] = e;
    else {
      const anchor = out.findIndex((x) => x.id === 'tw-lords-en');
      const j = anchor >= 0 ? anchor + 1 : out.findIndex((x) => x.id === 'game-units-ko') + 1;
      out.splice(j, 0, e);
    }
  }
  return { ...J, forbidden: out };
}

// ---- --fetch ---------------------------------------------------------------
async function getJson(u) { const r = await fetch(u, { signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r.json(); }
async function getText(u) { const r = await fetch(u, { signal: AbortSignal.timeout(120000) }); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r.text(); }
async function members(cat) {
  const out = []; let cont = '';
  for (let k = 0; k < 100; k++) {
    const j = await getJson(`${API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent('Category:' + cat)}&cmlimit=500&cmnamespace=0&format=json${cont}`);
    out.push(...(j.query?.categorymembers ?? []).map((x) => x.title));
    if (j.continue?.cmcontinue) cont = '&cmcontinue=' + encodeURIComponent(j.continue.cmcontinue); else return out;
  }
  throw new Error(`cmcontinue 순회가 끝나지 않는다: ${cat}`);
}
async function fetchAll() {
  const lines = [];
  for (const [, cat] of CATEGORIES) for (const t of await members(cat)) lines.push(`${cat}\t${t}`);
  const uniq = [...new Set(lines)].sort();
  fs.writeFileSync(F_NAMES, [
    '# Total War: WARHAMMER 병종·군주·영웅 문서 제목 스냅샷 (gen-tw-bans.mjs의 커밋된 입력)',
    `# 출처: ${API} (list=categorymembers, cmnamespace=0, cmlimit=500, cmcontinue로 끝까지 순회)`,
    `# 분류: ${CATEGORIES.map(([, c]) => c).join(' | ')}`,
    `# 수집일: ${new Date().toISOString().slice(0, 10)}. 한 줄 = <분류>TAB<문서 제목>. 정렬·중복 제거 완료.`,
    '# 갱신: node scripts/pages/gen-tw-bans.mjs --fetch',
    ...uniq, '',
  ].join('\n'));
  const dict = new Set((await getText(WORDS_URL)).split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const rank = new Map(); let i = 0;
  for (const l of (await getText(FREQ_URL)).split(/\r?\n/)) { const w = l.split('\t')[0]; if (w) rank.set(w, ++i); }
  const manual = fs.existsSync(F_STOP) ? readLines(F_STOP).join('\n').split(MARK)[1] ?? '\n' : '\n';
  const toks = new Set();
  for (const l of uniq) { const name = normalizeTitle(l.split('\t')[1]); if (name && !META.test(name)) for (const t of tokenize(name)) toks.add(t.toLowerCase()); }
  const stop = [], cs = [];
  for (const t of [...toks].sort()) {
    const v = variants(t);
    if (v.some((x) => dict.has(x) && (rank.get(x) ?? Infinity) <= COMMON_RANK)) stop.push(t);
    else if (v.some((x) => dict.has(x))) cs.push(t);
  }
  fs.writeFileSync(F_STOP, [
    '# TW:WH 이름 생성기의 단어 분류 (gen-tw-bans.mjs가 읽는다)',
    `# 자동 구역: 제목 단어 중 사전(${WORDS_URL})에 있고 빈도 순위(${FREQ_URL})가 ${COMMON_RANK} 안이면 stop, 사전에 있으나 드물면 cs.`,
    '#   stop = 일반 영어(단독으로 금지하지 않는다). cs = 대문자 표기만 잡는다. 어느 쪽도 아니면 조어로 보고 대소문자 무시로 잡는다.',
    '# 수동 구역: 줄 앞 키워드 stop|cs|coined <단어> 와 drop <제목 전체>. 자동 구역보다 우선한다.',
    '# 갱신: node scripts/pages/gen-tw-bans.mjs --fetch (수동 구역은 보존된다)',
    '## auto',
    ...stop.map((w) => `stop ${w}`), ...cs.map((w) => `cs ${w}`),
    MARK, manual.replace(/^\n/, '').replace(/\n+$/, ''), '',
  ].join('\n'));
  console.log(`snapshot ${uniq.length} 줄, stop ${stop.length}, cs ${cs.length}`);
}

// ---- 실행 ------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--fetch')) { await fetchAll(); return; }
  const J = JSON.parse(fs.readFileSync(F_TERMS, 'utf8'));
  const { entries, stat } = build();
  for (const e of entries) new RegExp(e.pattern, e.flags + 'g'); // 컴파일 확인
  const next = JSON.stringify(applyEntries(J, entries), null, 2) + '\n';
  const cur = fs.readFileSync(F_TERMS, 'utf8');
  console.log(`제목 ${stat.titles}개 → 조어 단어 ${stat.ci}, 드문 사전 단어 ${stat.cs}, 일반어 구 ${stat.phrase}, 제외 ${stat.dropped}`);
  if (argv.includes('--check')) { if (next !== cur) { console.error('docs/canon-terms.json이 생성 결과와 다르다 — node scripts/pages/gen-tw-bans.mjs 를 실행한다'); process.exit(1); } console.log('일치'); return; }
  fs.writeFileSync(F_TERMS, next);
  console.log(`쓴 항목: ${entries.map((e) => e.id).join(', ')}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
