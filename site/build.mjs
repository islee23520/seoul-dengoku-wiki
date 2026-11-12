#!/usr/bin/env node
// Seoul Metro Dynasties - GitHub Pages build.
// data/sql/*.sql (raw SQL) -> in-memory SQLite -> Markdown sources in site/.vp-src -> VitePress -> dist-pages/
// Two locales: English at the site root and Korean under /ko/. Both read the same SQL (*_ko columns hold the originals).
// Env: SITE_BASE (default /seoul-dengoku-wiki/), SITE_REPO_URL, SITE_OUT, SITE_SQL_DIR (default data/sql; scratch SQL copies for checks).
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { personPage, familyTreeSvg, STR } from './people.mjs';
import { buildMapData, DISTRICT_FACTION } from './map.mjs';
import { relationsPage, licensePage } from './relations.mjs';
import { collectReleases, renderRelease } from '../scripts/pages/release-notes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SQL_DIR = path.resolve(process.env.SITE_SQL_DIR ?? path.join(REPO, 'data/sql'));
const SRC = path.join(HERE, '.vp-src');
const OUT = path.resolve(process.env.SITE_OUT ?? path.join(REPO, 'dist-pages'));
let BASE = process.env.SITE_BASE ?? '/seoul-dengoku-wiki/';
if (!BASE.startsWith('/')) BASE = `/${BASE}`;
if (!BASE.endsWith('/')) BASE += '/';
const REPO_URL = process.env.SITE_REPO_URL ?? 'https://github.com/islee23520/seoul-dengoku-wiki';
// Absolute origin for hreflang links (Pages: configure-pages outputs.origin). Unset -> root-relative links.
const ORIGIN = (process.env.SITE_ORIGIN ?? '').replace(/\/+$/, '');
const SHOWCASE_DIR = path.join(REPO, 'artifacts/seoul-showcase');
const SHOWCASE_ROUTE = 'wiki/seoul-showcase/';
// Release history is generated from git tags and first-parent history at build time (nothing is committed back). Needs full history + tags.
const RELEASES = collectReleases({ repo: REPO, repoUrl: REPO_URL });

const db = new DatabaseSync(':memory:');
const files = fs.readdirSync(SQL_DIR).filter((f) => f.endsWith('.sql')).sort();
if (!files.length) throw new Error(`E_NO_SQL: no .sql files in ${SQL_DIR}`);
for (const f of files) db.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8'));
const all = (sql) => db.prepare(sql).all();
const meta = Object.fromEntries(all('SELECT key, value FROM site_meta').map((r) => [r.key, r.value]));
const raw = {
  cats: all('SELECT * FROM wiki_category ORDER BY sort'),
  docs: all('SELECT * FROM wiki_document ORDER BY category_id, sort, title'),
  factions: all('SELECT * FROM faction ORDER BY sort'),
  states: all('SELECT * FROM wiki_state ORDER BY sort'),
  people: all('SELECT * FROM wiki_person ORDER BY sort'),
  updates: all('SELECT * FROM wiki_update ORDER BY sort'),
  gddCats: all('SELECT * FROM gdd_category ORDER BY sort'),
  gddDocs: all('SELECT * FROM gdd_document ORDER BY category_id, sort'),
  details: new Map(all('SELECT * FROM person_detail').map((r) => [r.person_id, r])),
  clans: all('SELECT * FROM clan ORDER BY sort'),
  clanMembers: all('SELECT * FROM clan_member ORDER BY clan_id, sort'),
  nonKorean: all('SELECT * FROM nonkorean_family ORDER BY sort'),
  trees: new Map(all('SELECT * FROM family_tree').map((r) => [r.clan_id, r])),
  map: {
    meta: all('SELECT * FROM map_meta'), regions: all('SELECT * FROM map_region ORDER BY sort'), titles: all('SELECT * FROM map_title ORDER BY sort'), stations: all('SELECT * FROM map_station ORDER BY sort'),
    edges: all('SELECT * FROM map_edge ORDER BY sort'), lines: all('SELECT * FROM map_line ORDER BY sort'), landmarks: all('SELECT * FROM map_landmark ORDER BY sort'), rail: all('SELECT * FROM map_rail ORDER BY sort'),
    holdings: all('SELECT * FROM map_holding ORDER BY sort'), underground: all('SELECT * FROM map_underground ORDER BY sort'), mapStates: all('SELECT * FROM map_state'),
  },
  units: all('SELECT * FROM wiki_unit ORDER BY faction_id, sort, id'),
};

// ---- units (wiki_unit): category order, labels and build-failing checks ----
// Every unit row comes from SQL. The vocabularies below are the contract of docs/design/roster-framework.md
// (section 2.1 categories in page order, 2.2 roles, 6.1 scarce inputs); only their ids and labels live here.
const UNIT_CATEGORIES = [
  { id: 'commander', en: 'Commanders and Heroes', ko: '지휘관과 영웅' },
  { id: 'infantry', en: 'Infantry', ko: '보병' },
  { id: 'missile', en: 'Missile', ko: '사격병' },
  { id: 'fast', en: 'Fast and Mounted', ko: '기동병' },
  { id: 'drone', en: 'Drones', ko: '드론' },
  { id: 'war-machine', en: 'Armour and War Machines', ko: '장갑과 전쟁 기계' },
  { id: 'support', en: 'Support', ko: '지원' },
];
// Section 2.2: role id -> labels, the categories it may be used in, and the text glyph of its badge.
const UNIT_ROLES = {
  command: { ko: '지휘', en: 'Command', cats: ['commander'], icon: '★' },
  champion: { ko: '투사', en: 'Champion', cats: ['commander'], icon: '✦' },
  line: { ko: '전열', en: 'Line', cats: ['infantry'], icon: '▮' },
  shock: { ko: '충격', en: 'Shock', cats: ['infantry', 'fast'], icon: '➤' },
  'anti-armour': { ko: '대장갑', en: 'Anti-armour', cats: ['infantry', 'missile'], icon: '⊗' },
  skirmish: { ko: '산개', en: 'Skirmish', cats: ['missile', 'fast'], icon: '∴' },
  rifle: { ko: '소총', en: 'Rifle', cats: ['missile'], icon: '•' },
  marksman: { ko: '저격', en: 'Marksman', cats: ['missile'], icon: '◎' },
  artillery: { ko: '포격', en: 'Artillery', cats: ['missile', 'war-machine'], icon: '⌒' },
  recon: { ko: '정찰', en: 'Recon', cats: ['fast', 'drone'], icon: '◉' },
  raider: { ko: '습격', en: 'Raider', cats: ['fast'], icon: '↯' },
  strike: { ko: '타격', en: 'Strike', cats: ['drone'], icon: '✕' },
  armour: { ko: '장갑', en: 'Armour', cats: ['war-machine'], icon: '■' },
  breacher: { ko: '돌파', en: 'Breacher', cats: ['infantry', 'support'], icon: '⇥' },
  engineer: { ko: '공병', en: 'Engineer', cats: ['support'], icon: '⚙' },
  medic: { ko: '구호', en: 'Medic', cats: ['support'], icon: '✚' },
  countermeasure: { ko: '대응', en: 'Countermeasure', cats: ['support'], icon: '⊘' },
};
// Section 6.1: the only scarce_input words, with their page labels.
const SCARCE_INPUTS = {
  ammo: { ko: '탄약', en: 'Ammunition' }, cells: { ko: '전지', en: 'Cells' }, implants: { ko: '이식 부품', en: 'Implants' },
  fuel: { ko: '연료', en: 'Fuel' }, parts: { ko: '기계 부품', en: 'Machine parts' }, medicine: { ko: '의약품', en: 'Medicine' },
};
// Section 6.2: the rules in priority order (Scarce-1 > ... > Scarce-5). Each matching rule gives one value; Scarce-4
// gives fuel for the Government and the Arc, cells for the Free City. expectedScarce() runs the 6.2 steps:
// matched values in priority order, duplicates keep the higher priority, a single value on a drone or war-machine
// gets ',parts', and only the top two are kept. A unit matching no rule must be NULL. The build requires
// scarce_input to equal that result exactly (values and order).
const SCARCE4_BY_FACTION = { government: 'fuel', arc: 'fuel', 'free-city': 'cells' };
const SCARCE_RULES = [
  { id: 'Scarce-1', when: (u) => u.category === 'drone', value: () => 'cells', text: 'category drone gives cells' },
  { id: 'Scarce-2', when: (u) => u.attrs.includes('baptised') || u.attrs.includes('wired-body'), value: () => 'implants', text: 'baptised or wired-body gives implants' },
  { id: 'Scarce-3', when: (u) => u.ammo !== null && u.category !== 'drone' && !u.attrs.includes('muscle-powered'), value: () => 'ammo', text: 'non-NULL ammo on a non-drone without muscle-powered gives ammo' },
  { id: 'Scarce-4', when: (u) => u.category === 'war-machine', value: (u) => SCARCE4_BY_FACTION[u.faction_id], text: 'war-machine gives fuel (Government, Arc) or cells (Free City)' },
  { id: 'Scarce-5', when: (u) => u.role === 'medic', value: () => 'medicine', text: 'role medic gives medicine' },
];
const expectedScarce = (u) => {
  const matched = SCARCE_RULES.filter((r) => r.when(u));
  const values = [];
  for (const r of matched) { const v = r.value(u); if (v && !values.includes(v)) values.push(v); }
  if (values.length === 1 && (u.category === 'drone' || u.category === 'war-machine') && values[0] !== 'parts') values.push('parts');
  return { matched, values: values.slice(0, 2) };
};
// Section 7 tag vocabulary: every id a roster may put in attributes, with its page labels. The build fails
// (naming the tag) when a unit uses a tag that is not listed here, so no id is ever shown raw on a page.
const UNIT_TAGS = {
  'ledger-levy': { ko: '장부 징발', en: 'Ledger levy' }, 'house-bound': { ko: '가문 결속', en: 'House-bound' }, 'hired-company': { ko: '계약 용병', en: 'Hired company' },
  'charge-breaker': { ko: '돌격 막이', en: 'Charge breaker' }, 'shield-line': { ko: '방패줄', en: 'Shield line' }, 'plate-biter': { ko: '쇠뚫이', en: 'Plate biter' },
  'machine-hunter': { ko: '기계 사냥', en: 'Machine hunter' }, 'net-casting': { ko: '그물치기', en: 'Net casting' }, 'static-veil': { ko: '잡음 장막', en: 'Static veil' },
  'fibre-guided': { ko: '줄조종', en: 'Fibre-guided' }, 'radio-linked': { ko: '전파 조종', en: 'Radio-linked' }, 'frost-hardened': { ko: '혹한 단련', en: 'Frost-hardened' },
  'thin-clad': { ko: '얇은 차림', en: 'Thin-clad' }, 'tunnel-fighter': { ko: '굴길 싸움', en: 'Tunnel fighter' }, 'rail-borne': { ko: '궤도 기동', en: 'Rail-borne' },
  'quiet-step': { ko: '발소리 죽이기', en: 'Quiet step' }, 'scout-deploy': { ko: '선발 배치', en: 'Scout deploy' }, 'roll-call': { ko: '호명', en: 'Roll call' },
  'field-repair': { ko: '현장 수리', en: 'Field repair' }, 'field-dressing': { ko: '응급 처치', en: 'Field dressing' }, 'breach-charge': { ko: '문 따기', en: 'Breach charge' },
  baptised: { ko: '세례받은 몸', en: 'Baptised body' }, 'wired-body': { ko: '기계 이식', en: 'Wired body' }, 'iron-dread': { ko: '쇠울림', en: 'Iron dread' },
  'last-to-leave': { ko: '끝까지 남는 자', en: 'Last to leave' }, 'skilled-crew': { ko: '숙련 조원', en: 'Skilled crew' }, 'hand-loaded': { ko: '재장전 탄', en: 'Hand-loaded' },
  'muscle-powered': { ko: '근력 사격', en: 'Muscle-powered' }, irreplaceable: { ko: '다시 못 만드는 것', en: 'Irreplaceable' },
};
// Section 9.2 "deliberate gaps" of each faction, one entry per gap. These are design choices, not the categories
// that happen to be empty, so they are written out here. A faction with units must have an entry (checked below).
const FACTION_GAPS = {
  government: {
    ko: ['이식 병종이 없다.', '용병이 없다.', '지원과 현장 수리가 얇다 (지원 1~2개).', '1~2등급 징집병의 사기가 낮다.'],
    en: ['No implant units.', 'No mercenaries.', 'Support and field repair are thin (1-2 support units).', 'Tier 1-2 conscripts have low morale.'],
  },
  'free-city': {
    ko: ['장부식 대량 징집이 없다 (1등급 보병은 최대 1개).', '5등급이 없다.', '무거운 장갑이 4등급에서 멈춘다.', '지휘관 호위가 적다 (1~2개).'],
    en: ['No ledger-style mass conscription (at most one tier 1 infantry unit).', 'No tier 5.', 'Heavy armour stops at tier 4.', 'Few commander escorts (1-2 units).'],
  },
  arc: {
    ko: ['드론이 없다.', '포가 없다.', '사격병이 적고 3등급에서 멈춘다.', '영토가 4구뿐이라 명단이 18~22개로 작다.'],
    en: ['No drones.', 'No artillery.', 'Few missile units, and they stop at tier 3.', 'Only four districts of territory, so the roster is small (18-22 units).'],
  },
};
// The society document of each faction (wiki_document slug); linked only when the row exists.
const FACTION_SOCIETY_DOC = { government: 'Government-Society', 'free-city': 'Free-City-Society', arc: 'Arc-Society' };
const UNIT_KO_PAIRS = ['name', 'recruit_building', 'equipment', 'appearance'];
{
  const errs = [];
  const unitIds = new Set(raw.units.map((u) => u.id));
  // Rule (e): attributes and counters are JSON text with no CHECK in the schema; both must be arrays of strings.
  const list = (u, k) => {
    let v;
    try { v = JSON.parse(u[k]); } catch (e) { errs.push(`${u.id}: ${k} is not valid JSON (${e.message})`); return []; }
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) { errs.push(`${u.id}: ${k} must be a JSON array of strings, got ${u[k]}`); return []; }
    return v;
  };
  for (const u of raw.units) {
    u.attrs = list(u, 'attributes');
    u.counterIds = list(u, 'counters');
    if (!raw.factions.some((x) => x.id === u.faction_id)) errs.push(`${u.id}: faction_id '${u.faction_id}' is not a faction`);
    if (!UNIT_CATEGORIES.some((c) => c.id === u.category)) errs.push(`${u.id}: [category] '${u.category}' is not one of ${UNIT_CATEGORIES.map((c) => c.id).join(' | ')}`);
    const role = Object.hasOwn(UNIT_ROLES, u.role) ? UNIT_ROLES[u.role] : null;
    if (!role) errs.push(`${u.id}: [role] '${u.role}' is not one of ${Object.keys(UNIT_ROLES).join(' | ')}`);
    else if (!role.cats.includes(u.category)) errs.push(`${u.id}: [role] '${u.role}' is not allowed in category '${u.category}' (allowed: ${role.cats.join(', ')})`);
    // Rule (b): an *_ko partner may not be empty while its English value is set (and the reverse).
    for (const k of UNIT_KO_PAIRS) {
      const en = String(u[k] ?? '').trim(), ko = String(u[`${k}_ko`] ?? '').trim();
      if (en && !ko) errs.push(`${u.id}: ${k}_ko is empty while ${k} is set`);
      if (ko && !en) errs.push(`${u.id}: ${k} is empty while ${k}_ko is set`);
    }
    // Rule (a): every counters id must be an existing unit.
    for (const c of u.counterIds) if (!unitIds.has(c)) errs.push(`${u.id}: counters names unknown unit id '${c}'`);
    for (const a of u.attrs) if (!Object.hasOwn(UNIT_TAGS, a)) errs.push(`${u.id}: [tag] attribute '${a}' has no ko/en label in UNIT_TAGS (site/build.mjs)`);
    // Rule (d): scarce_input is NULL or 1-2 section 6.1 words joined by ',' with no space; then Scarce-1..5.
    u.scarce = [];
    if (u.scarce_input !== null) {
      const s = String(u.scarce_input);
      const words = s.split(',');
      if (!/^[a-z]+(?:,[a-z]+)?$/.test(s)) errs.push(`${u.id}: [Scarce-format] scarce_input '${s}' must be one value or two joined by ',' with no space`);
      else if (words.some((w) => !Object.hasOwn(SCARCE_INPUTS, w))) errs.push(`${u.id}: [Scarce-vocab] scarce_input '${s}' uses a word outside ${Object.keys(SCARCE_INPUTS).join(', ')}`);
      else if (words[0] === words[1]) errs.push(`${u.id}: [Scarce-format] scarce_input '${s}' repeats a value`);
      else u.scarce = words;
    }
    if (u.scarce_input === null || u.scarce.length) {
      const { matched, values } = expectedScarce(u);
      const got = u.scarce_input === null ? 'NULL' : `'${u.scarce_input}'`, want = values.length ? `'${values.join(',')}'` : 'NULL';
      if (matched.some((r) => r.id === 'Scarce-1') && matched.some((r) => r.id === 'Scarce-2')) errs.push(`${u.id}: [Scarce-1+2] a drone may not also be baptised or wired-body (section 6.2 step 6)`);
      else if (u.category === 'war-machine' && !SCARCE4_BY_FACTION[u.faction_id]) errs.push(`${u.id}: [Scarce-4] no Scarce-4 value for faction '${u.faction_id}'`);
      else if (u.scarce.join(',') !== values.join(',')) {
        // Name the rule that explains the difference: a matched rule whose value is missing, then the step 5 parts
        // value, then an order or extra-value problem.
        const missing = matched.filter((r) => values.includes(r.value(u)) && !u.scarce.includes(r.value(u)));
        const rule = missing.length ? missing.map((r) => `${r.id}: ${r.text}`).join('; ')
          : values.includes('parts') && !u.scarce.includes('parts') ? 'Scarce-parts: a drone or war-machine with one input adds parts second (step 5)'
          : u.scarce.length === values.length && u.scarce.every((w) => values.includes(w)) ? 'Scarce-order: the higher-priority value comes first (steps 1-4)'
          : matched.length ? 'Scarce-extra: only the values the matched rules give (steps 2-6)' : 'Scarce-none: no Scarce rule matches, so scarce_input must be NULL';
        errs.push(`${u.id}: [${rule.split(':')[0]}] ${rule.slice(rule.indexOf(':') + 2)}; scarce_input is ${got}, section 6.2 gives ${want}`);
      }
    }
  }
  // Rule (c): tier 4-5 units may be at most 30% of a faction's roster.
  for (const fid of new Set(raw.units.map((u) => u.faction_id))) {
    if (!FACTION_GAPS[fid]) errs.push(`faction '${fid}' has units but no FACTION_GAPS entry (section 9.2)`);
    const us = raw.units.filter((u) => u.faction_id === fid), high = us.filter((u) => u.tier >= 4);
    if (high.length / us.length > 0.3) errs.push(`${high.map((u) => u.id).join(', ')}: tier 4-5 share in faction '${fid}' is ${high.length}/${us.length} (${Math.round((100 * high.length) / us.length)}%), above 30%`);
  }
  if (errs.length) { console.error(errs.map((e) => `E_UNIT: ${e}`).join('\n')); console.error(`E_UNIT: ${errs.length} unit problem(s) in wiki_unit (${SQL_DIR})`); process.exit(1); }
}

// ---- UI strings (the only hand-written text; everything else comes from SQL) ----
// How each polity is governed (v3 bible: CANON-BIBLE 2.1-2.4, docs/design/v3/01-core 7-8). One duchy per district (gu).
const FACTION_STRUCTURE = {
  government: {
    en: 'The fourteen districts north of the Han River. The Government calls itself the Republic of Korea and keeps its institutions as they survived scarcity: on paper the ministries of the three branches and many parties, in practice two parties, the OMO Party and the Claw Party, and Assembly seats that pass down within families. The Member of the National Assembly elected in each district holds that district\'s duchy. The fourteen Members raise a President for Life from among themselves, and all fourteen must stamp. Only people written in the Government\'s ledger count as citizens; once registered, a person may not change home or work at will. Everything south of the river is "outside the ledger".',
    ko: '한강 북쪽 14구. 정부는 스스로를 대한민국이라 부르고, 대한민국 제도를 결핍 속에서 남은 꼴 그대로 지킨다. 서류상으로는 삼권의 부처와 다당제가 있지만 실제 당은 OMO당과 클로당 둘이고, 의석은 의원 집안 안에서 물린다. 각 구에서 뽑힌 국회의원이 그 구의 공작령을 쥔다. 열네 국회의원이 자기들 가운데서 종신 대통령을 추대하며, 열넷이 모두 도장을 찍어야 한다. 정부는 장부에 기재된 사람만 국민으로 인정하고, 등재민은 사는 곳과 일을 마음대로 바꿀 수 없다. 강 남쪽은 모두 "장부 밖"이다.',
  },
  'free-city': {
    en: 'The seven districts south-west of the Han River (Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon, Dongjak, Gwanak). The Free Cities are not one power and have no name for the whole: each city is its own power and holds its own duchy, and no one stands over all seven. Most people are engineers who trade goods and skills; with no way to tell whose skill is higher, they never chose one leader. Each city names its head after its own work, and the house of I Ilseop, Duke of Gwanak, took the Government\'s own word for a duchy on purpose. When the cities must decide something together, one of them calls a contract meeting.',
    ko: '한강 남서쪽 7구(강서·양천·영등포·구로·금천·동작·관악). 자유도시들은 하나의 권력이 아니고, 묶어 부르는 이름도 없다. 도시마다 각자 권력이고 각자 공작령을 쥐며, 일곱 도시 위에 서는 사람은 없다. 주민 대부분은 물자와 기술을 주고받는 엔지니어이고, 누구 기술이 더 높은지 따질 방법이 없어 지도자 하나를 뽑지 못했다. 도시마다 제 일에서 우두머리의 칭호를 짓고, 관악 공작 이일섭의 집안은 정부의 공작령 말을 일부러 가져왔다. 함께 정할 일이 생기면 한 도시가 계약회를 연다.',
  },
  arc: {
    en: 'The four Gangnam districts south-east of the Han River (Seocho, Gangnam, Songpa, Gangdong), split off from the Free Cities. Go Ye-jin is the Hierophant, and believers call her the Messiah. Rule passes through the Hierophant\'s line and the houses closest to her: each district is held by one of the four Near Houses. Believers replace parts of the body with machines; this is baptism, and faith is counted in parts. When a believer dies the brain is sealed and placed in the sanctuary, and it becomes the memory of the First AI.',
    ko: '한강 남동쪽 강남 4구(서초·강남·송파·강동). 자유도시에서 갈라져 나왔다. 고예진이 교주이고, 신도는 그를 메시아라 부른다. 통치는 교주의 혈통과 교주 곁에 선 집안들로 이어지며, 네 구를 곁집 넷이 하나씩 맡는다. 신도는 몸의 부위를 기계로 바꾸고, 이것이 세례다. 신앙은 부위 수로 센다. 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다.',
  },
};
// Duchy holder title (01-core 8, 07-people-and-war 4.4) and seat station (07 4.3, 05 2, 06 4). Keyed by gu name (map_title.name_ko).
const DUCHY_HOLDER = {
  '종로구': ['종로3가'], '중구': ['서울역'], '용산구': ['삼각지'], '성동구': ['왕십리'], '광진구': ['건대입구'], '동대문구': ['청량리'], '중랑구': ['상봉'], '성북구': ['보문'], '강북구': ['4.19민주묘지'], '도봉구': ['창동'], '노원구': ['노원'], '은평구': ['연신내'], '서대문구': ['충정로'], '마포구': ['공덕'],
  '강서구': ['김포공항', '바람지기', 'Wind Keeper'], '양천구': ['신정네거리', '기지장', 'Depot Master'], '영등포구': ['Yeongdeungpo', '장주', 'Market Master'], '구로구': ['Guro', '공장장', 'Works Master'], '금천구': ['가산디지털단지', '경계장', 'Edge Warden'], '동작구': ['노량진', '나루지기', 'Ferry Keeper'], '관악구': ['신림', '공작', 'Duke'],
  '서초구': ['고속터미널'], '강남구': ['수서'], '송파구': ['잠실'], '강동구': ['천호'],
};
const UI = {
  en: {
    lang: 'en-US', label: 'English', prefix: '', wiki: 'Wiki', states: 'Polities', duchies: 'Duchies', orgs: 'Polity and head', orgsNote: 'Seoul has three polities and no others. Each district is one duchy: fourteen for the Government, seven for the Free Cities, four for Arc. Beyond Seoul no one rules; the old war machines keep the rim.', factions: 'Factions', people: 'People', gdd: 'Design Docs (GDD)', showcase: 'Showcase',
    updates: 'Update History', wikiHome: 'Wiki Home', gddHome: 'GDD Home', designDocs: 'Design Docs', overview: 'Overview', onThisPage: 'On this page',
    prev: 'Previous page', next: 'Next page', menu: 'Menu', search: 'Search', noResults: 'No results for', reset: 'Reset search', toSelect: 'to select', toNavigate: 'to navigate', toClose: 'to close',
    appearance: 'Appearance', returnTop: 'Return to top', skip: 'Skip to content', footerMsg: 'Public world bible and game design documents.',
    heroText: 'World Bible & Game Design', openWiki: 'Open the Wiki', readGdd: 'Read the GDD', openShowcase: 'Watch the Showcase',
    showcaseCard: 'Interactive Showcase', showcaseDetail: 'An illustrated chronicle of the station world in text. Korean lines with English subtitles.',
    openSource: 'Open Source', openSourceDetail: 'Everything is built from raw SQL data in the public repository.',
    wikiLead: (n) => `${n} articles on the world, its polities, people and history. Pick a category below or use the sidebar.`,
    statesLead: (n, f) => `Seoul in 2126 has ${f} polities: the Government, the Free Cities and Arc. Each district is one duchy.`,
    peopleLead: (n) => `${n} characters. Use the site search or your browser's find (Ctrl+F) to locate a name.`,
    gddLead: (n) => `${n} design documents: rules, architecture, art direction, decision records, references and system design.`,
    cols: { id: 'ID', state: 'Polity', ruler: 'Head', capital: 'Seat', power: 'Territory', faction: 'Faction', name: 'Name', title: 'Title', occupation: 'Occupation', rank: 'Rank' },
    fields: { stateId: 'Polity ID', government: 'How it is governed', power: 'Territory', origin: 'Origin', ruler: 'Head', capital: 'Seat', faction: 'Faction', base: 'Base', position: 'Position', occupation: 'Occupation', gender: 'Gender', stage: 'Stage', state: 'Polity', rank: 'Rank', title: 'Title' },
    members: 'Polity', centerRegion: 'Land', aiPosition: 'Stance toward the First AI', recorded: (n) => `${n} recorded people.`, independentNote: 'These people belong to none of the three polities.',
    featStates: (n) => `Three polities - the Government, the Free Cities and Arc - and the twenty-five duchies they hold.`, featPeople: (n) => `${n} people with their titles, occupations and polities.`,
    featWiki: (n) => `${n} articles on the history, polities, ecology, culture and geography of Seoul in the eternal winter.`, featGdd: (n) => `${n} documents covering rules, systems, art direction and decisions.`,
    featUpdates: 'What changed in the wiki and when.', tagline: meta.tagline, siteTitle: meta.title,
    u: {
      units: 'Units', title: (n) => `${n}: Units`, lead: (n) => `${n} units, grouped by category.`, identity: 'Identity', society: 'Society', factionPage: 'Faction page',
      strengths: 'Strengths (categories fielded)', gaps: 'Deliberate gaps', highTier: 'Tier 4-5 share',
      unit: 'Unit', role: 'Role', tier: 'Tier', squad: 'Squad', hp: 'HP', ma: 'Melee attack', md: 'Melee defence', ws: 'Weapon strength', armour: 'Armour', missile: 'Missile damage', range: 'Range', ammo: 'Ammo', speed: 'Speed', ldr: 'Leadership', cost: 'Cost', upkeep: 'Upkeep', cap: 'Cap',
      category: 'Category', recruit: 'Recruited at', scarce: 'Scarce input', attributes: 'Attributes', counters: 'Counters', equipment: 'Equipment', look: 'Appearance', gdd: 'Design reference', details: 'Unit details', openUnits: 'Units of this faction',
    },
  },
  ko: {
    lang: 'ko-KR', label: '한국어', prefix: 'ko/', wiki: '위키', states: '정체', duchies: '공작령', orgs: '정체와 수장', orgsNote: '서울에는 세 정체가 있고 그 밖의 나라는 없다. 구 하나가 공작령 하나다. 정부가 열넷, 자유도시들이 일곱, 아크가 넷을 쥔다. 서울 밖에는 다스리는 사람이 없고, 옛 전쟁 기계가 테두리를 지킨다.', factions: '세력', people: '인물', gdd: '설계 문서(GDD)', showcase: '쇼케이스',
    updates: '갱신 이력', wikiHome: '위키 홈', gddHome: 'GDD 홈', designDocs: '설계 문서', overview: '개요', onThisPage: '이 페이지에서',
    prev: '이전 문서', next: '다음 문서', menu: '메뉴', search: '검색', noResults: '결과 없음:', reset: '검색 초기화', toSelect: '선택', toNavigate: '이동', toClose: '닫기',
    appearance: '화면 모드', returnTop: '맨 위로', skip: '본문으로 건너뛰기', footerMsg: '공개 세계관 위키와 게임 설계 문서.',
    heroText: '세계관 위키 · 게임 설계', openWiki: '위키 열기', readGdd: 'GDD 읽기', openShowcase: '쇼케이스 보기',
    showcaseCard: '인터랙티브 쇼케이스', showcaseDetail: '역에 사는 세계를 글로 돌아보는 그림 연대기. 한국어 대사와 영어 자막.',
    openSource: '오픈 소스', openSourceDetail: '모든 내용은 공개 저장소의 SQL 원본 데이터에서 빌드됩니다.',
    wikiLead: (n) => `세계와 정체, 인물, 역사를 다룬 문서 ${n}개. 아래 분류에서 고르거나 사이드바를 이용하세요.`,
    statesLead: (n, f) => `2126년 서울에는 정부, 자유도시들, 아크 ${f}개 정체가 있습니다. 구 하나가 공작령 하나입니다.`,
    peopleLead: (n) => `등장인물 ${n}명. 사이트 검색이나 브라우저 찾기(Ctrl+F)로 이름을 찾으세요.`,
    gddLead: (n) => `규칙, 아키텍처, 아트, 결정 기록, 레퍼런스, 시스템 설계 문서 ${n}개.`,
    cols: { id: 'ID', state: '소속 단체', ruler: '수장', capital: '자리', power: '땅', faction: '세력', name: '이름', title: '직함', occupation: '직업', rank: '품계' },
    fields: { stateId: '정체 ID', government: '다스리는 법', power: '땅', origin: '기원', ruler: '수장', capital: '자리', faction: '세력', base: '거점', position: '직위', occupation: '직업', gender: '성별', stage: '단계', state: '소속 단체', rank: '품계', title: '직함' },
    members: '정체', centerRegion: '땅', aiPosition: '최초의 AI를 보는 눈', recorded: (n) => `등록된 인물 ${n}명.`, independentNote: '세 정체 어디에도 들지 않은 사람들입니다.',
    featStates: (n) => `정부, 자유도시들, 아크 세 정체와 그들이 쥔 25공작령.`, featPeople: (n) => `칭호와 직업, 소속 정체를 가진 인물 ${n}명.`,
    featWiki: (n) => `영원한 겨울의 서울을 다룬 역사, 정체, 생태, 문화, 지리 문서 ${n}개.`, featGdd: (n) => `규칙, 시스템, 아트 방향, 결정 기록을 담은 문서 ${n}개.`,
    featUpdates: '위키가 언제 무엇이 바뀌었는지.', tagline: meta.tagline_ko, siteTitle: meta.title_ko,
    u: {
      units: '병종', title: (n) => `${n} 병종`, lead: (n) => `병종 ${n}개를 분류별로 묶었다.`, identity: '정체성', society: '사회', factionPage: '세력 문서',
      strengths: '강점 (갖춘 분류)', gaps: '의도된 공백', highTier: '4~5등급 비율',
      unit: '병종', role: '역할', tier: '등급', squad: '분대 인원', hp: '체력', ma: '근접 공격', md: '근접 방어', ws: '무기 위력', armour: '장갑', missile: '원거리 피해', range: '사거리', ammo: '탄약', speed: '속도', ldr: '통솔', cost: '비용', upkeep: '유지비', cap: '보유 한도',
      category: '분류', recruit: '모집 건물', scarce: '희소 자원', attributes: '특성', counters: '상대 우위', equipment: '장비', look: '외형', gdd: '설계 참조', details: '병종 상세', openUnits: '이 세력의 병종',
    },
  },
};

const yaml = (s) => JSON.stringify(String(s));
function escapeProse(md) {
  let fence = null;
  return md.split('\n').map((line) => {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; return line; }
    if (fence) return line;
    return line.split(/(`+[^`]*`+)/).map((seg, i) => (i % 2 ? seg : seg.replace(/<(?!a id="[^"]*"><\/a>|\/a>)/g, '&lt;').replace(/\{\{/g, '&#123;&#123;'))).join('');
  }).join('\n');
}
// Percent-encode Hangul in URLs; bare URLs get an ASCII label, URLs already inside a Markdown link keep their label.
const encodeUrls = (md) => md.replace(/(\]\()?(https?:\/\/[^\s)<>\]`]*[\uAC00-\uD7A3][^\s)<>\]`]*)/g, (m, inLink, u) => {
  const enc = u.replace(/[\uAC00-\uD7A3]+/g, (h) => encodeURIComponent(h));
  return inLink ? `](${enc}` : `[${new URL(enc).hostname}](${enc})`;
});
const labelBareUrls = (md) => md.replace(/(?<![(\[<"`=])https?:\/\/[^\s)<>\]`]*%[0-9A-Fa-f]{2}[^\s)<>\]`]*/g, (u) => `[${new URL(u).hostname}](${u})`);
// A link whose visible text is itself a URL with Hangul gets the host name as its label.
const relabelHangulUrlText = (md) => md.replace(/\[(https?:\/\/[^\]\s]*[\uAC00-\uD7A3][^\]\s]*)\]\(([^)\s]+)\)/g, (m, text, href) => `[${new URL(href).hostname}](${href})`);
const slashLinks = (md) => md.replace(/\]\((\/(?:wiki|gdd)\/[^)\s#?]*[^)\s#?/])(#[^)\s]*)?\)/g, ']($1/$2)');
// Locale-neutral links (/wiki/x/) point at the same locale: prefix Korean pages with /ko.
const localize = (md, L) => (L.prefix ? md.replace(/\]\(\/(wiki|gdd)\//g, (m, s) => `](/${L.prefix}${s}/`) : md);
const body = (md, L) => `::: v-pre\n${escapeProse(localize(slashLinks(relabelHangulUrlText(labelBareUrls(encodeUrls(md)))), L))}\n:::\n`;
const cell = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const write = (rel, content) => {
  const p = path.join(SRC, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};
const page = (title, content, fm = {}) => `---\n${Object.entries({ title, ...fm }).map(([k, v]) => `${k}: ${typeof v === 'string' ? yaml(v) : JSON.stringify(v)}`).join('\n')}\n---\n\n${content}`;

fs.rmSync(SRC, { recursive: true, force: true });
fs.mkdirSync(SRC, { recursive: true });

// Pick the field for a locale: English columns are plain, Korean ones end in _ko.
const f = (L) => (row, k) => (L === UI.ko ? row[`${k}_ko`] : row[k]);

const localeConfigs = {};
for (const L of [UI.en, UI.ko]) {
  const g = f(L);
  const P = (route) => `/${L.prefix}${route}`;
  const factions = raw.factions;
  const factionName = (id) => g(factions.find((x) => x.id === id), 'name');
  const states = raw.states, people = raw.people, updates = raw.updates;
  const docsOf = (cid) => raw.docs.filter((d) => d.category_id === cid);
  const factionCount = factions.filter((x) => states.some((s) => s.faction_id === x.id)).length;
  // Territory: one duchy per district (gu), faction per owner rule (map.mjs DISTRICT_FACTION).
  const titleById = new Map(raw.map.titles.map((t) => [t.id, t]));
  const duchyRows = raw.map.titles.filter((t) => t.rank === 'duchy');
  const guFaction = new Map(Object.entries(DISTRICT_FACTION).flatMap(([fid, gus]) => gus.map((gu) => [gu, fid])));
  const duchyOfGu = new Map(duchyRows.map((t) => [t.name_ko, t]));
  const duchySlug = (t) => t.id.split(':').pop();
  const duchiesOf = (fid) => duchyRows.filter((t) => guFaction.get(t.name_ko) === fid);
  const stationsOfGu = (gu) => raw.map.stations.filter((s) => s.district_ko === gu && s.line_ids !== '[]').length; // inhabited stations only (01-core 4.3)
  const ko = L === UI.ko;
  const holderTitle = (t) => {
    const fid = guFaction.get(t.name_ko), stemKo = t.name_ko.replace(/구$/, ''), stemEn = t.name.replace(/-gu$/, ''), h = DUCHY_HOLDER[t.name_ko];
    if (fid === 'government') return ko ? `${t.name_ko} 국회의원` : `Member of the National Assembly for ${t.name}`;
    if (fid === 'free-city') return t.name_ko === '관악구' ? (ko ? '관악 공작' : 'Duke of Gwanak') : (ko ? `${stemKo} ${h[1]}` : `${stemEn} ${h[2]}`);
    return ko ? `${stemKo} 곁집장` : `Head of the ${stemEn} Near House`;
  };
  const seatOf = (t) => { const s = raw.map.stations.find((x) => x.id === DUCHY_HOLDER[t.name_ko][0]); return s ? (ko ? s.name_ko : s.name) : ''; };
  const D = ko ? { duchy: '공작령', holder: '보유자 칭호', seat: '본역', counties: '옛 지역구', stations: '역', lead: '구 하나가 공작령 하나다. 각 공작령은 세 정체 가운데 하나에 속하고, 보유자의 칭호는 정체마다 다르다. 누가 보유자인지는 인물 기록이 정한다.', open: '영토 지도에서 보기' } : { duchy: 'Duchy', holder: 'Holder title', seat: 'Seat station', counties: 'Old constituencies', stations: 'Stations', lead: 'One duchy per district. Each duchy belongs to one of the three polities, and the holder\'s title differs by polity. Who holds each seat is set in the people records.', open: 'Open the territory map' };

  // wiki articles
  raw.docs.forEach((d) => {
    const bodyMd = (L === UI.ko ? d.body_ko_md : d.body_md).replace(/^#\s+.+\n+/, '');
    write(`${L.prefix}wiki/${d.slug}/index.md`, page(g(d, 'title'), `# ${g(d, 'title')}\n\n${body(bodyMd, L)}`));
  });
  const wikiGroups = raw.cats.filter((c) => !c.parent_id).map((c) => ({ text: g(c, 'label'), collapsed: true, items: docsOf(c.id).map((d) => ({ text: g(d, 'title'), link: P(`wiki/${d.slug}/`) })) })).filter((x) => x.items.length);
  write(`${L.prefix}wiki/index.md`, page(L.wiki, `# ${L.wiki}\n\n${L.wikiLead(raw.docs.length)}\n\n[${L.factions}](${P('wiki/factions/')}) · [${L.duchies} (${duchyRows.length})](${P('wiki/duchies/')}) · [${L.people} (${people.length})](${P('wiki/people/')}) · [${L.updates}](${P('wiki/updates/')})\n\n${raw.cats.filter((c) => !c.parent_id && docsOf(c.id).length).map((c) => `## ${g(c, 'label')}\n\n${g(c, 'summary')}\n\n${docsOf(c.id).map((d) => `- [${g(d, 'title')}](${P(`wiki/${d.slug}/`)})`).join('\n')}\n`).join('\n')}`));

  // factions: territory = duchies; organizations = former states
  const members = (fid) => states.filter((s) => s.faction_id === fid);
  write(`${L.prefix}wiki/factions/index.md`, page(L.factions, `# ${L.factions}\n\n${L.statesLead(states.length, factionCount)}\n\n${factions.filter((x) => members(x.id).length).map((x) => `## [${g(x, 'name')}](${P(`wiki/factions/${x.id}/`)})\n\n${FACTION_STRUCTURE[x.id]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n${duchiesOf(x.id).map((t) => `- [${g(t, 'name')}](${P(`wiki/duchies/${duchySlug(t)}/`)})`).join('\n')}\n`).join('\n')}`));
  const hasFactionPage = (x) => members(x.id).length || people.some((p) => p.faction_id === x.id);
  const unitsOf = (fid) => raw.units.filter((u) => u.faction_id === fid);
  factions.filter(hasFactionPage).forEach((x) => {
    const peopleN = people.filter((p) => p.faction_id === x.id).length;
    write(`${L.prefix}wiki/factions/${x.id}/index.md`, page(g(x, 'name'), `# ${g(x, 'name')}\n\n${FACTION_STRUCTURE[x.id]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n| ${L === UI.ko ? "항목" : "Field"} | ${L === UI.ko ? "값" : "Value"} |\n| --- | --- |\n${g(x, 'center_region') ? `| ${L.centerRegion} | ${cell(g(x, 'center_region'))} |\n| ${L.aiPosition} | ${cell(g(x, 'ai_position'))} |\n` : ''}| ${L.fields.ruler} | ${cell(members(x.id).map((s) => g(s, 'ruler')).join(' · ')) || '-'} |\n| ${L.duchies} | ${duchiesOf(x.id).length} |\n| ${L.people} | ${peopleN} |\n${unitsOf(x.id).length ? `| ${L.u.units} | [${unitsOf(x.id).length}](${P(`wiki/factions/${x.id}/units/`)}) |\n\n[${L.u.openUnits}](${P(`wiki/factions/${x.id}/units/`)})\n` : ''}\n${x.id === 'independent' ? `${L.independentNote}\n\n` : ''}## ${L.duchies}\n\n| ${D.duchy} | ${D.holder} | ${D.seat} | ${D.stations} |\n| --- | --- | --- | --- |\n${duchiesOf(x.id).map((t) => `| [${cell(g(t, 'name'))}](${P(`wiki/duchies/${duchySlug(t)}/`)}) | ${cell(holderTitle(t))} | ${cell(seatOf(t))} | ${stationsOfGu(t.name_ko)} |`).join('\n')}\n`));
  });

  // units: one page per faction that has wiki_unit rows (no rows -> no page and no link)
  const unitFactions = factions.filter((x) => unitsOf(x.id).length);
  unitFactions.forEach((x) => {
    const U = L.u, us = unitsOf(x.id), name = g(x, 'name');
    const num = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
    const txt = (v) => (v === null || v === undefined || String(v).trim() === '' ? '-' : cell(v));
    const catLabel = (c) => c[L === UI.ko ? 'ko' : 'en'];
    const lk = L === UI.ko ? 'ko' : 'en';
    // Role badge: a text glyph plus the localized role label (CSS in theme/custom.css, no image assets).
    // body() escapes '<' in prose, so the markdown carries a @@ROLE:<id>@@ token that is swapped for the badge afterwards.
    const roleBadge = (u) => `@@ROLE:${u.role}@@`;
    const badgeHtml = (role) => `<span class="unit-role unit-role-${role}" title="${UNIT_ROLES[role][lk]}"><span class="unit-role-icon" aria-hidden="true">${UNIT_ROLES[role].icon}</span>${UNIT_ROLES[role][lk]}</span>`;
    const scarceText = (u) => (u.scarce.length ? u.scarce.map((w) => SCARCE_INPUTS[w][lk]).join(' · ') : '-');
    const present = UNIT_CATEGORIES.filter((c) => us.some((u) => u.category === c.id));
    const tagLabel = (a) => UNIT_TAGS[a][lk];
    const high = us.filter((u) => u.tier >= 4).length;
    const soc = FACTION_SOCIETY_DOC[x.id] && raw.docs.find((d) => d.slug === FACTION_SOCIETY_DOC[x.id]);
    const unitName = (id) => g(raw.units.find((u) => u.id === id), 'name');
    const counterLinks = (u) => (u.counterIds.length ? u.counterIds.map((id) => `[${cell(unitName(id))}](${raw.units.find((v) => v.id === id).faction_id === x.id ? '' : P(`wiki/factions/${raw.units.find((v) => v.id === id).faction_id}/units/`)}#unit-${id})`).join(', ') : '-');
    const head = [U.unit, U.role, U.tier, U.squad, U.hp, U.ma, U.md, U.ws, U.armour, U.missile, U.range, U.ammo, U.speed, U.ldr, U.cost, U.upkeep, U.cap, U.counters];
    const row = (u) => [`[${cell(g(u, 'name'))}](#unit-${u.id})`, roleBadge(u), num(u.tier), num(u.squad_size), num(u.hp), num(u.melee_attack), num(u.melee_defence), num(u.weapon_strength), num(u.armour), num(u.missile_damage), num(u.range), num(u.ammo), num(u.speed), num(u.leadership), num(u.cost), num(u.upkeep), num(u.unit_cap), counterLinks(u)];
    const table = (rows) => `| ${head.join(' | ')} |\n| ${head.map((_, i) => (i < 2 || i === head.length - 1 ? '---' : '---:')).join(' | ')} |\n${rows.map((u) => `| ${row(u).join(' | ')} |`).join('\n')}\n`;
    const summary = [
      soc ? `- ${U.society}: [${cell(g(soc, 'title'))}](${P(`wiki/${soc.slug}/`)})` : '',
      hasFactionPage(x) ? `- ${U.factionPage}: [${cell(name)}](${P(`wiki/factions/${x.id}/`)})` : '',
      duchiesOf(x.id).length ? `- ${L.duchies}: ${duchiesOf(x.id).map((t) => `[${cell(g(t, 'name'))}](${P(`wiki/duchies/${duchySlug(t)}/`)})`).join(' · ')}` : '',
      `- ${U.strengths}: ${present.map((c) => `${catLabel(c)} (${us.filter((u) => u.category === c.id).length})`).join(' · ')}`,
      `- ${U.gaps}:\n${FACTION_GAPS[x.id][lk].map((t) => `  - ${t}`).join('\n')}`,
      `- ${U.highTier}: ${high}/${us.length}`,
    ].filter(Boolean).join('\n');
    const detail = (u) => `### ${cell(g(u, 'name'))} {#unit-${u.id}}\n\n| ${L === UI.ko ? '항목' : 'Field'} | ${L === UI.ko ? '값' : 'Value'} |\n| --- | --- |\n| ${U.category} | ${catLabel(UNIT_CATEGORIES.find((c) => c.id === u.category))} |\n| ${U.role} | ${roleBadge(u)} |\n| ${U.tier} | ${num(u.tier)} |\n| ${U.recruit} | ${txt(g(u, 'recruit_building'))} |\n| ${U.scarce} | ${scarceText(u)} |\n| ${U.attributes} | ${u.attrs.length ? u.attrs.map((a) => `\`${tagLabel(a)}\``).join(' ') : '-'} |\n| ${U.counters} | ${counterLinks(u)} |\n| ${U.equipment} | ${txt(g(u, 'equipment'))} |\n| ${U.look} | ${txt(g(u, 'appearance'))} |\n| ${U.gdd} | ${u.gdd_ref ? `\`${cell(u.gdd_ref)}\`` : '-'} |\n`;
    const md = `## ${U.identity}\n\n${summary}\n\n${present.map((c) => `## ${catLabel(c)}\n\n${table(us.filter((u) => u.category === c.id))}`).join('\n')}\n## ${U.details}\n\n${present.flatMap((c) => us.filter((u) => u.category === c.id)).map(detail).join('\n')}`;
    write(`${L.prefix}wiki/factions/${x.id}/units/index.md`, page(U.title(name), `# ${U.title(name)}\n\n${U.lead(us.length)}\n\n<div class="unit-roster">\n\n${body(md, L).replace(/@@ROLE:([a-z-]+)@@/g, (m, role) => badgeHtml(role))}\n</div>\n`, { outline: [2, 2] }));
  });

  // states
  // /wiki/states/ now shows the three factions only (owner decision: the sixteen-state chart is retired)
  write(`${L.prefix}wiki/states/index.md`, page(L.factions, `# ${L.factions}\n\n${L.statesLead(states.length, factionCount)}\n\n${factions.filter((x) => x.id !== 'independent').map((x) => `## [${g(x, 'name')}](${P(`wiki/factions/${x.id}/`)})\n\n${FACTION_STRUCTURE[x.id]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n- ${L.duchies}: ${duchiesOf(x.id).length} · ${L.people}: ${people.filter((p) => p.faction_id === x.id).length}\n`).join('\n')}
\n---\n\n${L.orgsNote}`));
  // duchies: one per district (gu), faction by owner rule
  write(`${L.prefix}wiki/duchies/index.md`, page(L.duchies, `# ${L.duchies}\n\n${D.lead}\n\n| ${D.duchy} | ${L.fields.faction} | ${D.holder} | ${D.seat} | ${D.stations} |\n| --- | --- | --- | --- | --- |\n${duchyRows.map((t) => `| [${g(t, 'name')}](${P(`wiki/duchies/${duchySlug(t)}/`)}) | [${cell(factionName(guFaction.get(t.name_ko)))}](${P(`wiki/factions/${guFaction.get(t.name_ko)}/`)}) | ${cell(holderTitle(t))} | ${cell(seatOf(t))} | ${stationsOfGu(t.name_ko)} |`).join('\n')}`));
  duchyRows.forEach((t) => {
    const fid = guFaction.get(t.name_ko); const counties = JSON.parse(t.county_ids).map((id) => titleById.get(id)).filter(Boolean);
    write(`${L.prefix}wiki/duchies/${duchySlug(t)}/index.md`, page(g(t, 'name'), `# ${g(t, 'name')}\n\n- ${L.fields.faction}: [${cell(factionName(fid))}](${P(`wiki/factions/${fid}/`)})\n- ${D.holder}: ${cell(holderTitle(t))}\n- ${D.seat}: ${cell(seatOf(t))}\n- ${D.stations}: ${stationsOfGu(t.name_ko)}\n- ${D.counties}: ${counties.map((c) => cell(g(c, 'name'))).join(' · ')}\n\n${FACTION_STRUCTURE[fid]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n[${D.open}](${P('wiki/map/')})`));
  });
  // people: search page (client island) + one rich page per person from person_detail
  const SS = L === UI.ko ? STR.ko : STR.en;
  write(`${L.prefix}wiki/people/index.md`, page(L.people, `# ${L.people}\n\n${L.peopleLead(people.length)}\n\n<PeopleSearch locale="${L === UI.ko ? 'ko' : 'en'}" prefix="${L.prefix}" />\n\n<noscript>\n\n${SS.noscript}\n\n| ${L.cols.name} | ${L.cols.title} | ${L.cols.state} | ${L.cols.occupation} | ${L.cols.rank} |\n| --- | --- | --- | --- | --- |\n${people.map((p) => `| [${cell(g(p, 'name'))}](${P(`wiki/people/${p.id}/`)}) | ${cell(g(p, 'title'))} | ${cell(g(p, 'state_name'))} | ${cell(g(p, 'occupation'))} | ${cell(g(p, 'rank'))} |`).join('\n')}\n\n</noscript>\n`, { outline: false }));
  const clanOf = new Map(raw.clanMembers.map((m) => [m.person_id, raw.clans.find((c) => c.id === m.clan_id)]));
  people.forEach((p) => {
    const row = raw.details.get(p.id);
    const d = row ? JSON.parse(L === UI.ko ? row.json_ko : row.json) : null;
    const dKo = row ? JSON.parse(row.json_ko) : null;
    const md = personPage({ p, d, dKo, ko: L === UI.ko, g, P, stateRow: states.find((s) => s.id === p.state_id), factionName, clan: clanOf.get(p.id) });
    write(`${L.prefix}wiki/people/${p.id}/index.md`, page(g(p, 'name'), `${md}`, { outline: d ? [2, 3] : false }));
  });

  // retainer relations (old /people/relations) and license (old /license)
  {
    const row = all("SELECT * FROM retainer_graph WHERE id='retainer'")[0];
    const graph = JSON.parse(L === UI.ko ? row.json_ko : row.json);
    const rel = relationsPage({ graph, ko: L === UI.ko, g, P, states, people, details: raw.details, body, REPO });
    write(`${L.prefix}wiki/relations/index.md`, page(rel.title, rel.md.content, { outline: [2, 3] }));
    const lic = licensePage({ ko: L === UI.ko, body: (md) => body(md, L), REPO });
    write(`${L.prefix}wiki/license/index.md`, page(lic.title, lic.md, { outline: false }));
  }
  // world map: a page that mounts the TerritoryMap island (data is fetched from /data/map.*.json)
  write(`${L.prefix}wiki/map/index.md`, page(L === UI.ko ? '서울 영토 지도' : 'Territory Map', `# ${L === UI.ko ? '서울 영토 지도' : 'Territory Map'}\n\n<TerritoryMap locale="${L === UI.ko ? 'ko' : 'en'}" prefix="${L.prefix}" />\n\n<noscript>\n\n${L === UI.ko ? '지도는 자바스크립트가 필요합니다.' : 'The map needs JavaScript.'}\n\n</noscript>\n`, { outline: false, aside: false }));
  // families: clan index, one page per clan with its family tree, non-Korean families
  const memberCount = new Map();
  raw.clanMembers.forEach((m) => memberCount.set(m.clan_id, (memberCount.get(m.clan_id) ?? 0) + 1));
  const charToPerson = new Map(); // family-tree node personId (K001) -> roster id
  raw.details.forEach((row, pid) => { const dd = JSON.parse(row.json); if (dd.characterId) charToPerson.set(dd.characterId, pid); });
  write(`${L.prefix}wiki/families/index.md`, page(SS.clanIndex, `# ${SS.clanIndex}\n\n${SS.clanLead(raw.clans.length, raw.clanMembers.length)}\n\n| ${L === UI.ko ? '본관' : 'Bongwan'} | ${L === UI.ko ? '성씨' : 'Surname'} | ${L === UI.ko ? '인원' : 'Members'} |\n| --- | --- | --- |\n${raw.clans.map((c) => `| [${cell(g(c, 'bongwan'))}](${P(`wiki/families/${c.id}/`)}) | ${cell(g(c, 'surname'))} | ${memberCount.get(c.id) ?? 0} |`).join('\n')}\n\n## ${SS.nonKorean}\n\n${SS.nonKoreanLead}\n\n${raw.nonKorean.map((n) => `- **${cell(g(n, 'surname'))}** — ${cell(g(n, 'basis'))} (${JSON.parse(n.members).map((id) => `[${(people.find((p) => p.id === id) ? g(people.find((p) => p.id === id), 'name') : id)}](${P(`wiki/people/${id}/`)})`).join(', ')})`).join('\n')}\n`, { outline: false }));
  raw.clans.forEach((c) => {
    const mem = raw.clanMembers.filter((m) => m.clan_id === c.id).map((m) => people.find((p) => p.id === m.person_id)).filter(Boolean);
    const tree = raw.trees.get(c.id);
    const t = tree ? JSON.parse(L === UI.ko ? tree.json_ko : tree.json) : null;
    const branches = JSON.parse(L === UI.ko ? c.branches_ko : c.branches);
    const title = L === UI.ko ? `${c.bongwan_ko} ${c.surname_ko}씨` : `${c.bongwan} ${c.surname}`;
    write(`${L.prefix}wiki/families/${c.id}/index.md`, page(title, `# ${title}\n\n<img class="clan-crest" src="${BASE}clan-crests/${c.id}.svg" alt="" width="72" height="72" onerror="this.remove()">\n\n## ${SS.members(mem.length)}\n\n| ${L.cols.name} | ${L.cols.state} | ${L.cols.occupation} |\n| --- | --- | --- |\n${mem.map((p) => `| [${cell(g(p, 'name'))}](${P(`wiki/people/${p.id}/`)}) | ${cell(g(p, 'state_name'))} | ${cell(g(p, 'occupation'))} |`).join('\n')}\n\n${c.show_branches && branches.length ? `## ${SS.branches}\n\n${branches.map((b) => `- ${cell(b.name)} · ${cell(b.status)} · ${(b.members ?? []).map((id) => `[${(people.find((p) => p.id === id) ? g(people.find((p) => p.id === id), 'name') : id)}](${P(`wiki/people/${id}/`)})`).join(', ')}`).join('\n')}\n\n` : ''}${t ? `## ${SS.treeTitle}\n\n${familyTreeSvg(t, { ko: L === UI.ko, P, personIdByCharacter: charToPerson })}\n` : ''}`));
  });


  // updates: releases generated from git (newest first), then the 6 hand-kept rows from SQL as a 'before automatic versioning' section
  const byDate = new Map();
  for (const u of updates) { if (!byDate.has(u.date)) byDate.set(u.date, []); byDate.get(u.date).push(u); }
  const U = L === UI.ko
    ? { intro: '이 페이지는 git 커밋에서 자동으로 만든다. 버전은 main의 git 태그 vX.Y.Z가 정본이며, feat는 minor, 그 밖의 유형은 patch, `!`나 BREAKING 꼬리말은 major로 올린다. 배포되는 main의 병합마다 릴리즈 하나가 만들어진다.', pending: '태그는 배포 뒤에 만들어진다', before: '자동 버저닝 이전', beforeLead: '자동 버저닝 이전에 손으로 관리한 갱신 기록이다.' }
    : { intro: 'This page is generated from git commits. The version is the git tag vX.Y.Z on main: feat bumps minor, any other type bumps patch, and `!` or a BREAKING footer bumps major. Every merge to main that deploys becomes one release. Commit subjects are the original Korean text, shown unchanged and not machine-translated; only the type labels are English.', pending: 'tag is created after deploy', before: 'Before automatic versioning', beforeLead: 'Update records kept by hand before automatic versioning.' };
  const releasesMd = RELEASES.releases.slice().reverse().map((r) => renderRelease(r, L === UI.ko ? 'ko' : 'en', { titleLevel: 2, spanKo: L !== UI.ko, pendingLabel: U.pending })).join('\n');
  const handMd = [...byDate].map(([d, us]) => `### ${d}\n\n${us.map((u) => `- **${g(u, 'status')}** · ${g(u, 'category')} — ${u.slug && raw.docs.some((x) => x.slug === u.slug) ? `[${g(u, 'title')}](${P(`wiki/${u.slug}/`)})` : g(u, 'title')}`).join('\n')}\n`).join('\n');
  write(`${L.prefix}wiki/updates/index.md`, page(L.updates, `# ${L.updates}\n\n${U.intro}\n\n${releasesMd}\n## ${U.before}\n\n${U.beforeLead}\n\n${handMd}`));

  // GDD
  raw.gddDocs.forEach((d) => {
    const content = (L === UI.ko ? d.body_ko_md : d.body_md).replace(/^#\s+.+\n+/, '');
    write(`${L.prefix}gdd/${d.category_id}/${d.slug}/index.md`, page(g(d, 'title'), `# ${g(d, 'title')}\n\n${g(d, 'summary') ? `${g(d, 'summary')}\n\n` : ''}${body(content, L)}`));
  });
  const gddGroups = raw.gddCats.map((c) => ({ text: g(c, 'label'), collapsed: true, items: raw.gddDocs.filter((d) => d.category_id === c.id).map((d) => ({ text: g(d, 'title'), link: P(`gdd/${d.category_id}/${d.slug}/`) })) })).filter((x) => x.items.length);
  write(`${L.prefix}gdd/index.md`, page(L.gdd, `# ${L.gdd}\n\n${L.gddLead(raw.gddDocs.length)}\n\n${gddGroups.map((x) => `## ${x.text}\n\n${x.items.map((i) => `- [${i.text}](${i.link})`).join('\n')}\n`).join('\n')}`));

  // home (hero + feature cards); showcase links are real files outside VitePress, so they open as full page loads
  const showcaseLink = `${BASE}${SHOWCASE_ROUTE}`;
  write(`${L.prefix}index.md`, `---\nlayout: home\ntitle: ${yaml(L.siteTitle)}\nhero:\n  name: ${yaml(L.siteTitle)}\n  text: ${yaml(L.heroText)}\n  tagline: ${yaml(L.tagline)}\n  actions:\n    - theme: brand\n      text: ${yaml(L.openWiki)}\n      link: ${P('wiki/')}\n    - theme: alt\n      text: ${yaml(L.openShowcase)}\n      link: ${showcaseLink}\n      target: _self\n    - theme: alt\n      text: ${yaml(L.readGdd)}\n      link: ${P('gdd/')}\nfeatures:\n  - title: ${yaml(L.wiki)}\n    details: ${yaml(L.featWiki(raw.docs.length))}\n    link: ${P('wiki/')}\n  - title: ${yaml(L.factions)}\n    details: ${yaml(L.featStates(states.length))}\n    link: ${P('wiki/factions/')}\n  - title: ${yaml(L.people)}\n    details: ${yaml(L.featPeople(people.length))}\n    link: ${P('wiki/people/')}\n  - title: ${yaml(L.gdd)}\n    details: ${yaml(L.featGdd(raw.gddDocs.length))}\n    link: ${P('gdd/')}\n  - title: ${yaml(L.showcaseCard)}\n    details: ${yaml(L.showcaseDetail)}\n    link: ${showcaseLink}\n    linkText: ${yaml(L.openShowcase)}\n  - title: ${yaml(L.openSource)}\n    details: ${yaml(L.openSourceDetail)}\n    link: ${yaml(REPO_URL)}\n---\n`);

  localeConfigs[L === UI.en ? 'root' : 'ko'] = {
    label: L.label, lang: L.lang, link: `/${L.prefix}`, title: L.siteTitle, description: L.tagline,
    themeConfig: {
      nav: [
        { text: L.wiki, link: P('wiki/') }, { text: L.factions, link: P('wiki/factions/') }, { text: L === UI.ko ? '지도' : 'Map', link: P('wiki/map/') }, { text: L.people, link: P('wiki/people/') },
        { text: L.gdd, link: P('gdd/') }, { text: L.showcase, link: showcaseLink, target: '_self' },
      ],
      sidebar: {
        [P('wiki/')]: [{ text: L.wiki, items: [{ text: L.wikiHome, link: P('wiki/') }, { text: L.factions, link: P('wiki/factions/') }, { text: L.duchies, link: P('wiki/duchies/') }, { text: L === UI.ko ? '영토 지도' : 'Territory Map', link: P('wiki/map/') }, { text: L.people, link: P('wiki/people/') }, { text: STR[L === UI.ko ? 'ko' : 'en'].clanIndex, link: P('wiki/families/') }, { text: L.updates, link: P('wiki/updates/') }, { text: L === UI.ko ? '가신 관계' : 'Retainers', link: P('wiki/relations/') }, { text: 'License', link: P('wiki/license/') }] }, ...(unitFactions.length ? [{ text: L.u.units, collapsed: true, items: unitFactions.map((x) => ({ text: g(x, 'name'), link: P(`wiki/factions/${x.id}/units/`) })) }] : []), ...wikiGroups],
        [P('gdd/')]: [{ text: L.designDocs, items: [{ text: L.gddHome, link: P('gdd/') }] }, ...gddGroups],
      },
      outline: { level: [2, 3], label: L.onThisPage },
      docFooter: { prev: L.prev, next: L.next },
      darkModeSwitchLabel: L.appearance, sidebarMenuLabel: L.menu, returnToTopLabel: L.returnTop, langMenuLabel: L.label, skipToContentLabel: L.skip,
      footer: { message: L.footerMsg, copyright: L.siteTitle },
    },
  };
}

// ---- VitePress config + theme -------------------------------------------
fs.cpSync(path.join(HERE, 'theme'), path.join(SRC, '.vitepress/theme'), { recursive: true });
fs.mkdirSync(path.join(SRC, 'public/data'), { recursive: true });
for (const L of [UI.en, UI.ko]) {
  const g = f(L);
  const S = L === UI.ko ? STR.ko : STR.en;
  const rows = raw.people.map((p) => [p.id, g(p, 'name'), L === UI.ko ? p.name : p.name_ko, g(p, 'title'), g(p, 'position'), g(p, 'rank'), p.tier, g(p, 'occupation'), g(p, 'gender'), g(p, 'stage'), p.state_id, g(p, 'state_name'), p.faction_id]);
  const dataset = {
    labels: { ...S.f, search: S.search, searchPh: S.searchPh, filters: S.filters, all: S.all, reset: S.reset, results: L === UI.ko ? '명' : 'results', none: L === UI.ko ? '조건에 맞는 인물이 없습니다.' : 'No people match these filters.', more: L === UI.ko ? '더 보기' : 'Show more', loading: L === UI.ko ? '불러오는 중…' : 'Loading…', failed: L === UI.ko ? '인물 목록을 불러오지 못했습니다.' : 'Could not load the people list.', retry: L === UI.ko ? '다시 시도' : 'Retry', occupationPh: L === UI.ko ? '예: 급수' : 'e.g. water', ...S.cols },
    factions: raw.factions.filter((x) => raw.states.some((st) => st.faction_id === x.id)).map((x) => ({ id: x.id, name: g(x, 'name') })),
    states: raw.states.map((st) => ({ id: st.id, name: g(st, 'name') })),
    tiers: [...new Set(raw.people.map((p) => p.tier))].sort(),
    genders: [...new Set(raw.people.map((p) => g(p, 'gender')))].sort(),
    rows,
  };
  fs.writeFileSync(path.join(SRC, `public/data/people.${L === UI.ko ? 'ko' : 'en'}.json`), JSON.stringify(dataset));
}
{
  const charToPerson = new Map();
  raw.details.forEach((row, pid) => { const dd = JSON.parse(row.json); if (dd.characterId) charToPerson.set(dd.characterId, pid); });
  const personById = new Map(raw.people.map((p) => [p.id, p]));
  let shared = null;
  for (const L of [UI.en, UI.ko]) {
    const m = buildMapData(raw.map, { ko: L === UI.ko, factions: raw.factions, states: raw.states, charToPerson, personName: (id) => (L === UI.ko ? personById.get(id)?.name_ko : personById.get(id)?.name) ?? id });
    fs.writeFileSync(path.join(SRC, `public/data/map.core.${L === UI.ko ? 'ko' : 'en'}.json`), JSON.stringify(m.core));
    shared ??= m;
  }
  fs.writeFileSync(path.join(SRC, 'public/data/map.geometry.json'), JSON.stringify({ titles: shared.titleGeom, regions: shared.regionGeom }));
  fs.writeFileSync(path.join(SRC, 'public/data/map.rail.json'), JSON.stringify(shared.rail));
}
fs.mkdirSync(path.join(SRC, 'public'), { recursive: true });
// Clan crests are small public SVGs (allowlisted); copy only the ones the clan pages reference.
const crestSrc = path.join(REPO, 'public/clan-crests');
if (fs.existsSync(crestSrc)) { fs.mkdirSync(path.join(SRC, 'public/clan-crests'), { recursive: true }); for (const c of raw.clans) { const p = path.join(crestSrc, `${c.id}.svg`); if (fs.existsSync(p)) fs.copyFileSync(p, path.join(SRC, 'public/clan-crests', `${c.id}.svg`)); } }
fs.copyFileSync(path.join(HERE, 'assets/favicon.svg'), path.join(SRC, 'public/favicon.svg'));
write('postcss.config.cjs', 'module.exports = { plugins: {} }\n');
const searchLocales = {
  root: { translations: { button: { buttonText: UI.en.search, buttonAriaLabel: UI.en.search }, modal: { noResultsText: UI.en.noResults, resetButtonTitle: UI.en.reset, footer: { selectText: UI.en.toSelect, navigateText: UI.en.toNavigate, closeText: UI.en.toClose } } } },
  ko: { translations: { button: { buttonText: UI.ko.search, buttonAriaLabel: UI.ko.search }, modal: { noResultsText: UI.ko.noResults, resetButtonTitle: UI.ko.reset, footer: { selectText: UI.ko.toSelect, navigateText: UI.ko.toNavigate, closeText: UI.ko.toClose } } } },
};
// ---- language selection (plan w2v task 29) -------------------------------
// Every route is written once per locale, so a page's twin (/wiki/x/ <-> /ko/wiki/x/) exists unless listed in NO_TWIN.
// The inline head script runs before the page renders (no flash of the wrong language):
//   ?lang=en|ko -> explicit choice, stored under sdw-lang; a stored choice turns browser detection off for good and
//   only moves a locale home (/ <-> /ko/); with no choice the first en/ko entry of navigator.languages picks the
//   locale (anything else -> English). It redirects only to a twin that exists, with location.replace, and the target
//   page reaches the same decision, so it cannot loop. The showcase and non-HTML paths are skipped.
const srcRoutes = new Set();
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!rel && (e.name === '.vitepress' || e.name === 'public')) continue; walk(path.join(d, e.name), `${rel}${e.name}/`); }
    else if (e.name === 'index.md') srcRoutes.add(rel);
  }
})(SRC, '');
const twinOf = (r) => (r === 'ko/' || r.startsWith('ko/') ? r.slice(3) : `ko/${r}`);
const NO_TWIN = [...srcRoutes].filter((r) => !srcRoutes.has(twinOf(r))).sort();
const langScript = `(function(){if(window.__sdwLang)return;window.__sdwLang=1;try{
var B=${JSON.stringify(BASE)},N=${JSON.stringify(NO_TWIN)},K='sdw-lang',p=location.pathname;if(p.indexOf(B)!==0)return;
var r=p.slice(B.length),k=/^ko(\\/|$)/.test(r),cur=k?'ko':'en',rest=k?r.replace(/^ko\\/?/,''):r;
if(/^wiki\\/seoul-showcase(\\/|$)/.test(rest)||/\\.(?!html$)[a-z0-9]+$/i.test(rest))return;
var q=(location.search.match(/[?&]lang=([^&#]*)/)||[])[1],s=null,w;
try{s=localStorage.getItem(K);if(s!=='en'&&s!=='ko')s=localStorage.getItem('smd-locale')}catch(e){}
if(q==='en'||q==='ko'){w=q;try{localStorage.setItem(K,q)}catch(e){}}
else if(s==='en'||s==='ko'){if(rest.replace(/index\\.html$/,'')!=='')return;w=s}
else{var L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];w='en';
for(var i=0;i<L.length;i++){var t=String(L[i]).toLowerCase().split('-')[0];if(t==='en'||t==='ko'){w=t;break}}}
if(w===cur)return;var c=decodeURI(r).replace(/index\\.html$/,'');if(c&&c.slice(-1)!=='/')c+='/';if(N.indexOf(c)>=0)return;
location.replace(B+(w==='ko'?'ko/'+rest:rest)+location.search+location.hash)}catch(e){}})()`;
const config = {
  title: meta.title, description: meta.tagline, base: BASE, cleanUrls: false, srcDir: '.', outDir: OUT,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }], ['meta', { name: 'theme-color', content: '#b63c32' }]],
  lastUpdated: false,
  ignoreDeadLinks: [new RegExp(`^${BASE}${SHOWCASE_ROUTE}`).source ? /seoul-showcase/ : /seoul-showcase/],
  locales: localeConfigs,
  themeConfig: {
    logo: { src: '/favicon.svg', alt: meta.title },
    socialLinks: [{ icon: 'github', link: REPO_URL }],
    search: { provider: 'local', options: { locales: searchLocales } },
  },
};
write('.vitepress/config.mjs', `const config = ${JSON.stringify(config, (k, v) => (v instanceof RegExp ? { __re: v.source } : v), 1).replace(/\{\s*"__re":\s*"([^"]+)"\s*\}/g, '/$1/')};
// hreflang alternates per page (in frontmatter.head, so client navigation keeps them current); x-default = English.
const NO_TWIN = new Set(${JSON.stringify(NO_TWIN)});
const HREF = ${JSON.stringify(`${ORIGIN}${BASE}`)};
// The language script goes into the SSR head of every page except 404 (a missing page has no twin to go to).
const LANG_SCRIPT = ${JSON.stringify(langScript)};
config.transformHead = ({ pageData }) => (pageData.relativePath === '404.md' ? [] : [['script', {}, LANG_SCRIPT]]);
config.transformPageData = (pageData) => {
  const route = pageData.relativePath.replace(/index\\.md$/, '');
  const ko = route === 'ko/' || route.startsWith('ko/');
  const en = ko ? route.slice(3) : route;
  const alt = {};
  if (!ko || !NO_TWIN.has(route)) alt.en = en;
  if (ko || !NO_TWIN.has(route)) alt.ko = 'ko/' + en;
  const links = Object.entries(alt).map(([lang, r]) => ['link', { rel: 'alternate', hreflang: lang, href: HREF + r }]);
  if (alt.en !== undefined) links.push(['link', { rel: 'alternate', hreflang: 'x-default', href: HREF + alt.en }]);
  pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...links];
};
export default config;
`);

// ---- build --------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
const bin = path.join(HERE, 'node_modules/vitepress/bin/vitepress.js');
const r = spawnSync(process.execPath, [bin, 'build', SRC], { stdio: 'inherit', cwd: HERE });
if (r.status !== 0) process.exit(r.status ?? 1);

// ---- interactive showcase (separate Vite app, mounted next to the wiki) --
let showcase = 'skipped';
if (fs.existsSync(path.join(SHOWCASE_DIR, 'package.json'))) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const sh = process.platform === 'win32';
  const env = { ...process.env, BASE_PATH: `${BASE}${SHOWCASE_ROUTE}` };
  for (const args of [['ci', '--ignore-scripts', '--no-audit', '--no-fund'], ['run', 'build']]) {
    const s = spawnSync(npm, args, { cwd: SHOWCASE_DIR, stdio: 'inherit', env, shell: sh });
    if (s.status !== 0) { console.error(`E_SHOWCASE_BUILD: npm ${args.join(' ')} failed`); process.exit(s.status ?? 1); }
  }
  const dist = path.join(SHOWCASE_DIR, 'dist/public');
  // Honor the repository's public-artifact allowlist: nothing outside it may ship.
  const allow = JSON.parse(fs.readFileSync(path.join(REPO, 'artifact-allowlist.json'), 'utf8'));
  const pattern = new RegExp(JSON.stringify(allow).includes('"seoul-showcase"') ? findAllow(allow, 'seoul-showcase') : '$^');
  const rejected = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (!pattern.test(path.relative(dist, p).replaceAll('\\', '/'))) rejected.push(path.relative(dist, p)); } })(dist);
  if (rejected.length) { console.error(`E_SHOWCASE_ALLOWLIST: ${rejected.length} file(s) outside artifact-allowlist.json, e.g. ${rejected.slice(0, 3).join(', ')}`); process.exit(1); }
  fs.cpSync(dist, path.join(OUT, SHOWCASE_ROUTE), { recursive: true });
  showcase = `mounted at ${BASE}${SHOWCASE_ROUTE}`;
}
function findAllow(obj, key) {
  let found = null;
  (function w(v) { if (found || !v || typeof v !== 'object') return; if (typeof v[key] === 'string') { found = v[key]; return; } Object.values(v).forEach(w); })(obj);
  return found ?? '$^';
}

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// ---- fragment href normalization (2026-11-11, canon rewrite W5-28) -----------------------
// VitePress가 내부 #파편 링크를 재슬러그화하면서(숫자 앞 '_', NFD 분해, 제목 id의 '·' 세그먼트) 명시
// <a id> 앵커(NFC 그대로)·제목 슬러그 id와 어긋나는 href를 만든다. 사후 규칙: 대상 페이지의 실제 id
// 집합에서 정규 비교(underscore 제거·NFC·'·' 세그먼트 무시)로 유일한 후보를 찾은 경우에만 href를 그
// 실재 id로 되돌린다. 후보가 0개거나 2개 이상이면 손대지 않는다(검사가 크게 실패한다 — 검사 완화 아님).
const decodeHtmlAttr = (v) => v.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
{
  const pages = [];
  (function collect(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) collect(p);
      else if (p.endsWith('.html')) {
        const rel = path.relative(OUT, p).replaceAll('\\', '/');
        const html = fs.readFileSync(p, 'utf8');
        const anchors = new Set();
        for (const m of html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) anchors.add(decodeHtmlAttr(m[2]));
        for (const m of html.matchAll(/<(?:a|area)\b[^>]*\bname\s*=\s*(["'])(.*?)\1/gi)) anchors.add(decodeHtmlAttr(m[2]));
        pages.push({ rel, anchors, html });
      }
    }
  })(OUT);
  const byRel = new Map(pages.map((p) => [p.rel, p]));
  const normFrag = (f) => f.normalize('NFC').replace(/^_+/, '').replace(/·-?/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  let rewritten = 0;
  for (const pg of pages) {
    const out = pg.html.replace(/(\bhref\s*=\s*["'])([^"']*#[^"']*)(["'])/gi, (whole, pre, href, post) => {
      const hash = href.indexOf('#');
      if (hash < 0) return whole;
      const pathname = href.slice(0, hash);
      const fragment = href.slice(hash + 1);
      if (!fragment) return whole;
      let frag; try { frag = decodeURIComponent(fragment); } catch { frag = fragment; }
      const pn0 = pathname.replace(/[?].*$/, '');
      let targetRel;
      if (!pn0) targetRel = pg.rel;
      else {
        let pn = pn0;
        if (!pn.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(pn)) pn = path.posix.join(path.posix.dirname(`/${pg.rel}`), pn);
        const target = pn.replace(/\/+$/, '').replace(/\/index(?:\.html)?$/, '');
        const m = target.match(/^\/(ko\/)?(wiki|gdd)\/(.+)$/);
        if (!m) return whole;
        targetRel = `${m[1] ?? ''}${m[2]}/${m[3]}/index.html`;
      }
      const t = byRel.get(targetRel);
      if (!t) return whole;
      if (t.anchors.has(frag)) return whole;
      const want = normFrag(frag);
      const cands = [...t.anchors].filter((a) => normFrag(a) === want);
      if (cands.length === 1) { rewritten++; return `${pre}${pathname}#${encodeURIComponent(cands[0])}${post}`; }
      return whole;
    });
    if (out !== pg.html) { fs.writeFileSync(path.join(OUT, pg.rel), out); pg.html = out; }
  }
  console.log(`fragment href normalization: ${rewritten} href(s) rewritten to real ids`);
}

fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({ title: meta.title, base: BASE, locales: ['en', 'ko'], wikiDocs: raw.docs.length, gddDocs: raw.gddDocs.length, factions: raw.factions.length, clans: raw.clans.length, mapRegions: raw.map.regions.length, mapTitles: raw.map.titles.length, mapStations: raw.map.stations.length, personDetails: raw.details.size, states: raw.states.length, people: raw.people.length, updates: raw.updates.length, releases: { head: RELEASES.head, count: RELEASES.releases.length, versions: RELEASES.releases.map((r) => ({ version: r.version, date: r.date, tagged: r.tagged, bump: r.bump, commits: r.counts.commits })), warnings: RELEASES.warnings }, showcase, sqlFiles: files }, null, 1));
console.log(`built ${meta.title} (en + ko): wiki ${raw.docs.length}, gdd ${raw.gddDocs.length}, factions ${raw.factions.length}, states ${raw.states.length}, people ${raw.people.length}; showcase ${showcase} -> ${path.relative(REPO, OUT)} (base ${BASE})`);
