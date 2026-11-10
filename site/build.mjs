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
};

// ---- UI strings (the only hand-written text; everything else comes from SQL) ----
const UI = {
  en: {
    lang: 'en-US', label: 'English', prefix: '', wiki: 'Wiki', states: 'States', factions: 'Factions', people: 'People', gdd: 'Design Docs (GDD)', showcase: 'Showcase',
    updates: 'Update History', wikiHome: 'Wiki Home', gddHome: 'GDD Home', designDocs: 'Design Docs', overview: 'Overview', onThisPage: 'On this page',
    prev: 'Previous page', next: 'Next page', menu: 'Menu', search: 'Search', noResults: 'No results for', reset: 'Reset search', toSelect: 'to select', toNavigate: 'to navigate', toClose: 'to close',
    appearance: 'Appearance', returnTop: 'Return to top', skip: 'Skip to content', footerMsg: 'Public world bible and game design documents.',
    heroText: 'World Bible & Game Design', openWiki: 'Open the Wiki', readGdd: 'Read the GDD', openShowcase: 'Watch the Showcase',
    showcaseCard: 'Interactive Showcase', showcaseDetail: 'A narrated, illustrated tour of the sixteen states. Korean voice with English subtitles.',
    openSource: 'Open Source', openSourceDetail: 'Everything is built from raw SQL data in the public repository.',
    wikiLead: (n) => `${n} articles on the world, its states, people and history. Pick a category below or use the sidebar.`,
    statesLead: (n, f) => `${n} states in ${f} factions hold the stations and districts of the metro world.`,
    peopleLead: (n) => `${n} characters. Use the site search or your browser's find (Ctrl+F) to locate a name.`,
    gddLead: (n) => `${n} design documents: rules, architecture, art direction, decision records, references and system design.`,
    cols: { id: 'ID', state: 'State', ruler: 'Ruler', capital: 'Capital', power: 'Power', faction: 'Faction', name: 'Name', title: 'Title', occupation: 'Occupation', rank: 'Rank' },
    fields: { stateId: 'State ID', government: 'Government', power: 'Power', origin: 'Origin', ruler: 'Ruler', capital: 'Capital', faction: 'Faction', base: 'Base', position: 'Position', occupation: 'Occupation', gender: 'Gender', stage: 'Stage', state: 'State', rank: 'Rank', title: 'Title' },
    members: 'Member states', centerRegion: 'Center', aiPosition: 'Stance toward AI', recorded: (n) => `${n} recorded people.`, independentNote: 'Affiliation is not yet decided in the canon.',
    featStates: (n) => `${n} states grouped into three factions: the Government, the Free City and Arc.`, featPeople: (n) => `${n} characters with ranks, occupations and allegiances.`,
    featWiki: (n) => `${n} articles on history, factions, ecology, culture and geography of a post-blackout Seoul.`, featGdd: (n) => `${n} documents covering rules, systems, art direction and decisions.`,
    featUpdates: 'What changed in the wiki and when.', tagline: meta.tagline, siteTitle: meta.title,
  },
  ko: {
    lang: 'ko-KR', label: '한국어', prefix: 'ko/', wiki: '위키', states: '국가', factions: '세력', people: '인물', gdd: '설계 문서(GDD)', showcase: '쇼케이스',
    updates: '갱신 이력', wikiHome: '위키 홈', gddHome: 'GDD 홈', designDocs: '설계 문서', overview: '개요', onThisPage: '이 페이지에서',
    prev: '이전 문서', next: '다음 문서', menu: '메뉴', search: '검색', noResults: '결과 없음:', reset: '검색 초기화', toSelect: '선택', toNavigate: '이동', toClose: '닫기',
    appearance: '화면 모드', returnTop: '맨 위로', skip: '본문으로 건너뛰기', footerMsg: '공개 세계관 위키와 게임 설계 문서.',
    heroText: '세계관 위키 · 게임 설계', openWiki: '위키 열기', readGdd: 'GDD 읽기', openShowcase: '쇼케이스 보기',
    showcaseCard: '인터랙티브 쇼케이스', showcaseDetail: '열여섯 국가를 돌아보는 음성 해설 투어. 한국어 음성과 영어 자막.',
    openSource: '오픈 소스', openSourceDetail: '모든 내용은 공개 저장소의 SQL 원본 데이터에서 빌드됩니다.',
    wikiLead: (n) => `세계와 국가, 인물, 역사를 다룬 문서 ${n}개. 아래 분류에서 고르거나 사이드바를 이용하세요.`,
    statesLead: (n, f) => `${f}개 세력에 속한 ${n}개 국가가 지하철 세계의 역과 구역을 나눠 가지고 있습니다.`,
    peopleLead: (n) => `등장인물 ${n}명. 사이트 검색이나 브라우저 찾기(Ctrl+F)로 이름을 찾으세요.`,
    gddLead: (n) => `규칙, 아키텍처, 아트, 결정 기록, 레퍼런스, 시스템 설계 문서 ${n}개.`,
    cols: { id: 'ID', state: '국가', ruler: '군주', capital: '수도', power: '국력', faction: '세력', name: '이름', title: '직함', occupation: '직업', rank: '직급' },
    fields: { stateId: '국가 ID', government: '정체', power: '국력', origin: '기원', ruler: '군주', capital: '수도', faction: '세력', base: '거점', position: '직위', occupation: '직업', gender: '성별', stage: '단계', state: '국가', rank: '직급', title: '직함' },
    members: '소속 국가', centerRegion: '중심 지역', aiPosition: 'AI에 대한 입장', recorded: (n) => `등록된 인물 ${n}명.`, independentNote: '정본에서 아직 소속이 정해지지 않았습니다.',
    featStates: (n) => `${n}개 국가를 정부, 자유도시, Arc 세 세력으로 묶었습니다.`, featPeople: (n) => `직급, 직업, 소속을 가진 인물 ${n}명.`,
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

  // wiki articles
  raw.docs.forEach((d) => {
    const bodyMd = (L === UI.ko ? d.body_ko_md : d.body_md).replace(/^#\s+.+\n+/, '');
    write(`${L.prefix}wiki/${d.slug}/index.md`, page(g(d, 'title'), `# ${g(d, 'title')}\n\n${body(bodyMd, L)}`));
  });
  const wikiGroups = raw.cats.filter((c) => !c.parent_id).map((c) => ({ text: g(c, 'label'), collapsed: true, items: docsOf(c.id).map((d) => ({ text: g(d, 'title'), link: P(`wiki/${d.slug}/`) })) })).filter((x) => x.items.length);
  write(`${L.prefix}wiki/index.md`, page(L.wiki, `# ${L.wiki}\n\n${L.wikiLead(raw.docs.length)}\n\n[${L.factions}](${P('wiki/factions/')}) · [${L.states} (${states.length})](${P('wiki/states/')}) · [${L.people} (${people.length})](${P('wiki/people/')}) · [${L.updates}](${P('wiki/updates/')})\n\n${raw.cats.filter((c) => !c.parent_id && docsOf(c.id).length).map((c) => `## ${g(c, 'label')}\n\n${g(c, 'summary')}\n\n${docsOf(c.id).map((d) => `- [${g(d, 'title')}](${P(`wiki/${d.slug}/`)})`).join('\n')}\n`).join('\n')}`));

  // factions
  const members = (fid) => states.filter((s) => s.faction_id === fid);
  write(`${L.prefix}wiki/factions/index.md`, page(L.factions, `# ${L.factions}\n\n${L.statesLead(states.length, factionCount)}\n\n${factions.filter((x) => members(x.id).length).map((x) => `## [${g(x, 'name')}](${P(`wiki/factions/${x.id}/`)})\n\n${members(x.id).map((s) => `- [${g(s, 'name')}](${P(`wiki/states/${s.slug}/`)}) — ${g(s, 'ruler')}`).join('\n')}\n`).join('\n')}`));
  factions.filter((x) => members(x.id).length).forEach((x) => {
    const peopleN = people.filter((p) => p.faction_id === x.id).length;
    write(`${L.prefix}wiki/factions/${x.id}/index.md`, page(g(x, 'name'), `# ${g(x, 'name')}\n\n| | |\n| --- | --- |\n${g(x, 'center_region') ? `| ${L.centerRegion} | ${cell(g(x, 'center_region'))} |\n| ${L.aiPosition} | ${cell(g(x, 'ai_position'))} |\n` : ''}| ${L.fields.state} | ${members(x.id).length} |\n| ${L.people} | ${peopleN} |\n\n${x.id === 'independent' ? `${L.independentNote}\n\n` : ''}## ${L.members}\n\n| ${L.cols.id} | ${L.cols.state} | ${L.cols.ruler} | ${L.cols.capital} | ${L.cols.power} |\n| --- | --- | --- | --- | --- |\n${members(x.id).map((s) => `| ${s.id} | [${cell(g(s, 'name'))}](${P(`wiki/states/${s.slug}/`)}) | ${cell(g(s, 'ruler'))} | ${cell(g(s, 'capital'))} | ${cell(g(s, 'power'))} |`).join('\n')}\n`));
  });

  // states
  write(`${L.prefix}wiki/states/index.md`, page(L.states, `# ${L.states}\n\n${L.statesLead(states.length, factionCount)}\n\n| ${L.cols.id} | ${L.cols.state} | ${L.cols.faction} | ${L.cols.ruler} | ${L.cols.capital} | ${L.cols.power} |\n| --- | --- | --- | --- | --- | --- |\n${states.map((s) => `| ${s.id} | [${cell(g(s, 'name'))}](${P(`wiki/states/${s.slug}/`)}) | [${cell(factionName(s.faction_id))}](${P(`wiki/factions/${s.faction_id}/`)}) | ${cell(g(s, 'ruler'))} | ${cell(g(s, 'capital'))} | ${cell(g(s, 'power'))} |`).join('\n')}\n`));
  states.forEach((s) => {
    const ms = people.filter((p) => p.state_id === s.id);
    write(`${L.prefix}wiki/states/${s.slug}/index.md`, page(g(s, 'name'), `# ${g(s, 'name')}\n\n## ${L.overview}\n\n| | |\n| --- | --- |\n| ${L.fields.stateId} | ${s.id} |\n| ${L.fields.faction} | [${cell(factionName(s.faction_id))}](${P(`wiki/factions/${s.faction_id}/`)}) |\n| ${L.fields.government} | ${cell(g(s, 'government'))} |\n| ${L.fields.power} | ${cell(g(s, 'power'))} |\n| ${L.fields.origin} | ${cell(g(s, 'cause'))} |\n| ${L.fields.ruler} | ${cell(g(s, 'ruler'))} |\n| ${L.fields.capital} | ${cell(g(s, 'capital'))} |\n| ${L.fields.base} | ${cell(g(s, 'base'))} |\n\n## ${L.people}\n\n${L.recorded(ms.length)}\n\n${ms.map((p) => `- [${g(p, 'name')}](${P(`wiki/people/${p.id}/`)}) — ${g(p, 'title')}`).join('\n')}\n`));
  });

  // people
  write(`${L.prefix}wiki/people/index.md`, page(L.people, `# ${L.people}\n\n${L.peopleLead(people.length)}\n\n| ${L.cols.name} | ${L.cols.title} | ${L.cols.state} | ${L.cols.occupation} | ${L.cols.rank} |\n| --- | --- | --- | --- | --- |\n${people.map((p) => `| [${cell(g(p, 'name'))}](${P(`wiki/people/${p.id}/`)}) | ${cell(g(p, 'title'))} | ${cell(g(p, 'state_name'))} | ${cell(g(p, 'occupation'))} | ${cell(g(p, 'rank'))} |`).join('\n')}\n`, { outline: false }));
  people.forEach((p) => {
    const st = states.find((s) => s.id === p.state_id);
    write(`${L.prefix}wiki/people/${p.id}/index.md`, page(g(p, 'name'), `# ${g(p, 'name')}\n\n| | |\n| --- | --- |\n| ${L.fields.title} | ${cell(g(p, 'title'))} |\n| ${L.fields.position} | ${cell(g(p, 'position'))} |\n| ${L.fields.rank} | ${cell(g(p, 'rank'))} |\n| ${L.fields.occupation} | ${cell(g(p, 'occupation'))} |\n| ${L.fields.gender} | ${cell(g(p, 'gender'))} |\n| ${L.fields.stage} | ${cell(g(p, 'stage'))} |\n| ${L.fields.state} | ${st ? `[${cell(g(st, 'name'))}](${P(`wiki/states/${st.slug}/`)})` : cell(g(p, 'state_name'))} |\n${st ? `| ${L.fields.faction} | [${cell(factionName(p.faction_id))}](${P(`wiki/factions/${p.faction_id}/`)}) |\n` : ''}`, { outline: false }));
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
        { text: L.wiki, link: P('wiki/') }, { text: L.factions, link: P('wiki/factions/') }, { text: L.people, link: P('wiki/people/') },
        { text: L.gdd, link: P('gdd/') }, { text: L.showcase, link: showcaseLink, target: '_self' },
      ],
      sidebar: {
        [P('wiki/')]: [{ text: L.wiki, items: [{ text: L.wikiHome, link: P('wiki/') }, { text: L.factions, link: P('wiki/factions/') }, { text: L.states, link: P('wiki/states/') }, { text: L.people, link: P('wiki/people/') }, { text: L.updates, link: P('wiki/updates/') }] }, ...wikiGroups],
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
write('.vitepress/theme/index.ts', `import DefaultTheme from 'vitepress/theme'\nimport './custom.css'\nexport default DefaultTheme\n`);
fs.copyFileSync(path.join(HERE, 'theme/custom.css'), path.join(SRC, '.vitepress/theme/custom.css'));
fs.mkdirSync(path.join(SRC, 'public'), { recursive: true });
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
fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({ title: meta.title, base: BASE, locales: ['en', 'ko'], wikiDocs: raw.docs.length, gddDocs: raw.gddDocs.length, factions: raw.factions.length, states: raw.states.length, people: raw.people.length, updates: raw.updates.length, showcase, sqlFiles: files }, null, 1));
console.log(`built ${meta.title} (en + ko): wiki ${raw.docs.length}, gdd ${raw.gddDocs.length}, factions ${raw.factions.length}, states ${raw.states.length}, people ${raw.people.length}; showcase ${showcase} -> ${path.relative(REPO, OUT)} (base ${BASE})`);
