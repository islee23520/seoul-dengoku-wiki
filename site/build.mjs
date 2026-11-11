#!/usr/bin/env node
// Seoul Metro Dynasties - GitHub Pages build.
// data/sql/*.sql (raw SQL) -> in-memory SQLite -> Markdown sources in site/.vp-src -> VitePress -> dist-pages/
// Two locales: English at the site root and Korean under /ko/. Both read the same SQL (*_ko columns hold the originals).
// Env: SITE_BASE (default /seoul-dengoku-wiki/), SITE_REPO_URL, SITE_OUT.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { personPage, familyTreeSvg, STR } from './people.mjs';
import { buildMapData, DISTRICT_FACTION } from './map.mjs';
import { relationsPage, licensePage } from './relations.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SQL_DIR = path.join(REPO, 'data/sql');
const SRC = path.join(HERE, '.vp-src');
const OUT = path.resolve(process.env.SITE_OUT ?? path.join(REPO, 'dist-pages'));
let BASE = process.env.SITE_BASE ?? '/seoul-dengoku-wiki/';
if (!BASE.startsWith('/')) BASE = `/${BASE}`;
if (!BASE.endsWith('/')) BASE += '/';
const REPO_URL = process.env.SITE_REPO_URL ?? 'https://github.com/islee23520/seoul-dengoku-wiki';
const SHOWCASE_DIR = path.join(REPO, 'artifacts/seoul-showcase');
const SHOWCASE_ROUTE = 'wiki/seoul-showcase/';

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
};

// ---- UI strings (the only hand-written text; everything else comes from SQL) ----
// Owner decision 2026-11-10: how each faction is governed. Titles (duchies) are held per district (gu).
const FACTION_STRUCTURE = {
  government: {
    en: 'Fourteen districts north of the Han river. Each district elects a National Assembly member, and each member holds that district\'s duchy under the title Senator. The Senators act like the prince-electors of the Holy Roman Empire: they gather candidates from among themselves and elect the President, who serves for life. Two parties compete: the OMO Party and the Claw Party.',
    ko: '한강 이북 14개 구. 각 구가 국회의원을 뽑고, 그 의원이 해당 구의 공작위를 가지며 칭호는 Senator이다. Senator는 신성로마제국의 선제후처럼 자기들 중에서 후보를 모아 대통령을 선출하고, 대통령은 종신직이다. 정당은 OMO당과 Claw당 둘이다.',
  },
  'free-city': {
    en: 'Seven districts south of the Han river (Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon, Dongjak, Gwanak). Every city is an independent power holding its own duchy. There is no king above them and no common ruler; the cities trade goods and skills as the Union.',
    ko: '한강 이남의 7개 구(강서·양천·영등포·구로·금천·동작·관악). 각 도시가 공작위를 가진 개별 세력이며, 그 위에 왕도 공통 지도자도 없다. 도시들은 유니온으로서 물자와 기술을 주고받는다.',
  },
  arc: {
    en: 'Four districts of Gangnam (Seocho, Gangnam, Songpa, Gangdong). A theocratic hierarchy centred on the head of the faith, the Hierophant (Go Ye-jin), in the manner of a Shia clan government. Followers replace body parts with machines and, after death, give their brains to the shrine as the god\'s memory.',
    ko: '강남 4개 구(서초·강남·송파·강동). 교주(고예진)를 중심으로 한 신권 하이라키로, 시아파를 참조한 씨족정 방식이다. 신도는 몸을 기계로 바꾸고 죽은 뒤 뇌를 성소에 봉헌해 신의 기억이 된다.',
  },
};
const UI = {
  en: {
    lang: 'en-US', label: 'English', prefix: '', wiki: 'Wiki', states: 'States', duchies: 'Duchies', orgs: 'Organizations (former states)', orgsNote: 'The sixteen-state chart is retired. Territory is now held as one duchy per district under three factions; the rows below are the organizations that used to be states.', factions: 'Factions', people: 'People', gdd: 'Design Docs (GDD)', showcase: 'Showcase',
    updates: 'Update History', wikiHome: 'Wiki Home', gddHome: 'GDD Home', designDocs: 'Design Docs', overview: 'Overview', onThisPage: 'On this page',
    prev: 'Previous page', next: 'Next page', menu: 'Menu', search: 'Search', noResults: 'No results for', reset: 'Reset search', toSelect: 'to select', toNavigate: 'to navigate', toClose: 'to close',
    appearance: 'Appearance', returnTop: 'Return to top', skip: 'Skip to content', footerMsg: 'Public world bible and game design documents.',
    heroText: 'World Bible & Game Design', openWiki: 'Open the Wiki', readGdd: 'Read the GDD', openShowcase: 'Watch the Showcase',
    showcaseCard: 'Interactive Showcase', showcaseDetail: 'A narrated, illustrated tour of the metro world. Korean voice with English subtitles.',
    openSource: 'Open Source', openSourceDetail: 'Everything is built from raw SQL data in the public repository.',
    wikiLead: (n) => `${n} articles on the world, its states, people and history. Pick a category below or use the sidebar.`,
    statesLead: (n, f) => `${f} factions rule the metro world: the Government, the Free City and Arc. Their domains are held as duchies, one per district.`,
    peopleLead: (n) => `${n} characters. Use the site search or your browser's find (Ctrl+F) to locate a name.`,
    gddLead: (n) => `${n} design documents: rules, architecture, art direction, decision records, references and system design.`,
    cols: { id: 'ID', state: 'State', ruler: 'Ruler', capital: 'Capital', power: 'Power', faction: 'Faction', name: 'Name', title: 'Title', occupation: 'Occupation', rank: 'Rank' },
    fields: { stateId: 'State ID', government: 'Government', power: 'Power', origin: 'Origin', ruler: 'Ruler', capital: 'Capital', faction: 'Faction', base: 'Base', position: 'Position', occupation: 'Occupation', gender: 'Gender', stage: 'Stage', state: 'State', rank: 'Rank', title: 'Title' },
    members: 'Member states', centerRegion: 'Center', aiPosition: 'Stance toward AI', recorded: (n) => `${n} recorded people.`, independentNote: 'Affiliation is not yet decided in the canon.',
    featStates: (n) => `Three factions - the Government, the Free City and Arc - and the duchies they hold.`, featPeople: (n) => `${n} characters with ranks, occupations and allegiances.`,
    featWiki: (n) => `${n} articles on history, factions, ecology, culture and geography of a post-blackout Seoul.`, featGdd: (n) => `${n} documents covering rules, systems, art direction and decisions.`,
    featUpdates: 'What changed in the wiki and when.', tagline: meta.tagline, siteTitle: meta.title,
  },
  ko: {
    lang: 'ko-KR', label: '한국어', prefix: 'ko/', wiki: '위키', states: '국가', duchies: '공작령', orgs: '단체 (옛 국가)', orgsNote: '십육국 체제는 폐지됐다. 영토는 이제 세 세력 아래 구 하나가 공작위 하나로 나뉜다. 아래 표는 옛 국가였던 단체들이다.', factions: '세력', people: '인물', gdd: '설계 문서(GDD)', showcase: '쇼케이스',
    updates: '갱신 이력', wikiHome: '위키 홈', gddHome: 'GDD 홈', designDocs: '설계 문서', overview: '개요', onThisPage: '이 페이지에서',
    prev: '이전 문서', next: '다음 문서', menu: '메뉴', search: '검색', noResults: '결과 없음:', reset: '검색 초기화', toSelect: '선택', toNavigate: '이동', toClose: '닫기',
    appearance: '화면 모드', returnTop: '맨 위로', skip: '본문으로 건너뛰기', footerMsg: '공개 세계관 위키와 게임 설계 문서.',
    heroText: '세계관 위키 · 게임 설계', openWiki: '위키 열기', readGdd: 'GDD 읽기', openShowcase: '쇼케이스 보기',
    showcaseCard: '인터랙티브 쇼케이스', showcaseDetail: '지하철 세계를 돌아보는 음성 해설 투어. 한국어 음성과 영어 자막.',
    openSource: '오픈 소스', openSourceDetail: '모든 내용은 공개 저장소의 SQL 원본 데이터에서 빌드됩니다.',
    wikiLead: (n) => `세계와 국가, 인물, 역사를 다룬 문서 ${n}개. 아래 분류에서 고르거나 사이드바를 이용하세요.`,
    statesLead: (n, f) => `정부, 자유도시, Arc ${f}개 세력이 지하철 세계를 다스립니다. 영지는 구 하나가 공작위 하나로 나뉩니다.`,
    peopleLead: (n) => `등장인물 ${n}명. 사이트 검색이나 브라우저 찾기(Ctrl+F)로 이름을 찾으세요.`,
    gddLead: (n) => `규칙, 아키텍처, 아트, 결정 기록, 레퍼런스, 시스템 설계 문서 ${n}개.`,
    cols: { id: 'ID', state: '국가', ruler: '군주', capital: '수도', power: '국력', faction: '세력', name: '이름', title: '직함', occupation: '직업', rank: '직급' },
    fields: { stateId: '국가 ID', government: '정체', power: '국력', origin: '기원', ruler: '군주', capital: '수도', faction: '세력', base: '거점', position: '직위', occupation: '직업', gender: '성별', stage: '단계', state: '국가', rank: '직급', title: '직함' },
    members: '소속 국가', centerRegion: '중심 지역', aiPosition: 'AI에 대한 입장', recorded: (n) => `등록된 인물 ${n}명.`, independentNote: '정본에서 아직 소속이 정해지지 않았습니다.',
    featStates: (n) => `정부, 자유도시, Arc 세 세력과 그들이 가진 공작령.`, featPeople: (n) => `직급, 직업, 소속을 가진 인물 ${n}명.`,
    featWiki: (n) => `대정전 이후 서울의 역사, 세력, 생태, 문화, 지리를 다룬 문서 ${n}개.`, featGdd: (n) => `규칙, 시스템, 아트 방향, 결정 기록을 담은 문서 ${n}개.`,
    featUpdates: '위키가 언제 무엇이 바뀌었는지.', tagline: meta.tagline_ko, siteTitle: meta.title_ko,
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
  const stationsOfGu = (gu) => raw.map.stations.filter((s) => s.district_ko === gu).length;

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
  factions.filter((x) => members(x.id).length || people.some((p) => p.faction_id === x.id)).forEach((x) => {
    const peopleN = people.filter((p) => p.faction_id === x.id).length;
    write(`${L.prefix}wiki/factions/${x.id}/index.md`, page(g(x, 'name'), `# ${g(x, 'name')}\n\n${FACTION_STRUCTURE[x.id]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n| ${L === UI.ko ? "항목" : "Field"} | ${L === UI.ko ? "값" : "Value"} |\n| --- | --- |\n${g(x, 'center_region') ? `| ${L.centerRegion} | ${cell(g(x, 'center_region'))} |\n| ${L.aiPosition} | ${cell(g(x, 'ai_position'))} |\n` : ''}| ${L.fields.state} | ${members(x.id).length} |\n| ${L.people} | ${peopleN} |\n\n${x.id === 'independent' ? `${L.independentNote}\n\n` : ''}## ${L.duchies}\n\n| ${L === UI.ko ? '공작령' : 'Duchy'} | ${L === UI.ko ? '백작령' : 'Counties'} | ${L === UI.ko ? '역' : 'Stations'} |\n| --- | --- | --- |\n${duchiesOf(x.id).map((t) => `| [${cell(g(t, 'name'))}](${P(`wiki/duchies/${duchySlug(t)}/`)}) | ${JSON.parse(t.county_ids).length} | ${stationsOfGu(t.name_ko)} |`).join('\n')}\n\n## ${L.orgs}\n\n${members(x.id).map((s) => `- ${cell(g(s, 'name'))} — ${cell(g(s, 'ruler'))}`).join('\n')}\n`));
  });

  // states
  // /wiki/states/ now shows the three factions only (owner decision: the sixteen-state chart is retired)
  write(`${L.prefix}wiki/states/index.md`, page(L.factions, `# ${L.factions}\n\n${L.statesLead(states.length, factionCount)}\n\n${factions.filter((x) => x.id !== 'independent').map((x) => `## [${g(x, 'name')}](${P(`wiki/factions/${x.id}/`)})\n\n${FACTION_STRUCTURE[x.id]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n- ${L.duchies}: ${duchiesOf(x.id).length} · ${L.people}: ${people.filter((p) => p.faction_id === x.id).length}\n`).join('\n')}
\n---\n\n${L.orgsNote}`));
  // duchies: one per district (gu), faction by owner rule
  write(`${L.prefix}wiki/duchies/index.md`, page(L.duchies, `# ${L.duchies}\n\n${L === UI.ko ? '구 하나가 공작위 하나다. 각 공작령은 세 세력 중 하나에 속한다.' : 'One duchy per district. Each duchy belongs to one of the three factions.'}\n\n| ${L === UI.ko ? '공작령' : 'Duchy'} | ${L.factions} | ${L === UI.ko ? '백작령' : 'Counties'} | ${L === UI.ko ? '역' : 'Stations'} |\n| --- | --- | --- | --- |\n${duchyRows.map((t) => `| [${g(t, 'name')}](${P(`wiki/duchies/${duchySlug(t)}/`)}) | [${cell(factionName(guFaction.get(t.name_ko)))}](${P(`wiki/factions/${guFaction.get(t.name_ko)}/`)}) | ${JSON.parse(t.county_ids).length} | ${stationsOfGu(t.name_ko)} |`).join('\n')}`));
  duchyRows.forEach((t) => {
    const fid = guFaction.get(t.name_ko); const counties = JSON.parse(t.county_ids).map((id) => titleById.get(id)).filter(Boolean);
    write(`${L.prefix}wiki/duchies/${duchySlug(t)}/index.md`, page(g(t, 'name'), `# ${g(t, 'name')}\n\n- ${L.factions}: [${cell(factionName(fid))}](${P(`wiki/factions/${fid}/`)})\n- ${L === UI.ko ? '백작령' : 'Counties'}: ${counties.map((c) => cell(g(c, 'name'))).join(' · ')}\n- ${L === UI.ko ? '역' : 'Stations'}: ${stationsOfGu(t.name_ko)}\n\n${FACTION_STRUCTURE[fid]?.[L === UI.ko ? 'ko' : 'en'] ?? ''}\n\n[${L === UI.ko ? '영토 지도에서 보기' : 'Open the territory map'}](${P('wiki/map/')})`));
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


  // updates
  const byDate = new Map();
  for (const u of updates) { if (!byDate.has(u.date)) byDate.set(u.date, []); byDate.get(u.date).push(u); }
  write(`${L.prefix}wiki/updates/index.md`, page(L.updates, `# ${L.updates}\n\n${[...byDate].map(([d, us]) => `## ${d}\n\n${us.map((u) => `- **${g(u, 'status')}** · ${g(u, 'category')} — ${u.slug && raw.docs.some((x) => x.slug === u.slug) ? `[${g(u, 'title')}](${P(`wiki/${u.slug}/`)})` : g(u, 'title')}`).join('\n')}\n`).join('\n')}`));

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
        [P('wiki/')]: [{ text: L.wiki, items: [{ text: L.wikiHome, link: P('wiki/') }, { text: L.factions, link: P('wiki/factions/') }, { text: L.duchies, link: P('wiki/duchies/') }, { text: L === UI.ko ? '영토 지도' : 'Territory Map', link: P('wiki/map/') }, { text: L.people, link: P('wiki/people/') }, { text: STR[L === UI.ko ? 'ko' : 'en'].clanIndex, link: P('wiki/families/') }, { text: L.updates, link: P('wiki/updates/') }, { text: L === UI.ko ? '가신 관계' : 'Retainers', link: P('wiki/relations/') }, { text: 'License', link: P('wiki/license/') }] }, ...wikiGroups],
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
write('.vitepress/config.mjs', `export default ${JSON.stringify(config, (k, v) => (v instanceof RegExp ? { __re: v.source } : v), 1).replace(/\{\s*"__re":\s*"([^"]+)"\s*\}/g, '/$1/')}\n`);

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

fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({ title: meta.title, base: BASE, locales: ['en', 'ko'], wikiDocs: raw.docs.length, gddDocs: raw.gddDocs.length, factions: raw.factions.length, clans: raw.clans.length, mapRegions: raw.map.regions.length, mapTitles: raw.map.titles.length, mapStations: raw.map.stations.length, personDetails: raw.details.size, states: raw.states.length, people: raw.people.length, updates: raw.updates.length, showcase, sqlFiles: files }, null, 1));
console.log(`built ${meta.title} (en + ko): wiki ${raw.docs.length}, gdd ${raw.gddDocs.length}, factions ${raw.factions.length}, states ${raw.states.length}, people ${raw.people.length}; showcase ${showcase} -> ${path.relative(REPO, OUT)} (base ${BASE})`);
