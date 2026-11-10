#!/usr/bin/env node
// Seoul Metro Dynasties - GitHub Pages build.
// data/sql/*.sql (raw SQL) -> in-memory SQLite -> Markdown sources in site/.vp-src -> VitePress -> dist-pages/
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

const db = new DatabaseSync(':memory:');
const files = fs.readdirSync(SQL_DIR).filter((f) => f.endsWith('.sql')).sort();
if (!files.length) throw new Error(`E_NO_SQL: no .sql files in ${SQL_DIR}`);
for (const f of files) db.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8'));
const all = (sql) => db.prepare(sql).all();
const meta = Object.fromEntries(all('SELECT key, value FROM site_meta').map((r) => [r.key, r.value]));
const wikiCats = all('SELECT * FROM wiki_category ORDER BY sort');
const wikiDocs = all('SELECT * FROM wiki_document ORDER BY category_id, sort, title');
const states = all('SELECT * FROM wiki_state ORDER BY sort');
const people = all('SELECT * FROM wiki_person ORDER BY sort');
const updates = all('SELECT * FROM wiki_update ORDER BY sort');
const gddCats = all('SELECT * FROM gdd_category ORDER BY sort');
const gddDocs = all('SELECT * FROM gdd_document ORDER BY category_id, sort');

const yaml = (s) => JSON.stringify(String(s));
// Body text is rendered verbatim: v-pre stops Vue from interpreting {{ }} or <tags> inside prose.
function escapeProse(md) {
  let fence = null;
  return md.split('\n').map((line) => {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; return line; }
    if (fence) return line;
    return line.split(/(`+[^`]*`+)/).map((seg, i) => (i % 2 ? seg : seg.replace(/<(?!a id="[\w-]*"><\/a>|\/a>)/g, '&lt;').replace(/\{\{/g, '&#123;&#123;'))).join('');
  }).join('\n');
}
const slashLinks = (md) => md.replace(/\]\((\/(?:wiki|gdd)\/[^)\s#?]*[^)\s#?/])(#[^)\s]*)?\)/g, ']($1/$2)');
const encodeUrls = (md) => md.replace(/https?:\/\/[^\s)<>\]`]*[\uAC00-\uD7A3][^\s)<>\]`]*/g, (u) => `[${new URL(u.replace(/[\uAC00-\uD7A3]+/g, (h) => encodeURIComponent(h))).hostname}](${u.replace(/[\uAC00-\uD7A3]+/g, (h) => encodeURIComponent(h))})`);
const labelBareUrls = (md) => md.replace(/(?<![(\[<"`=])https?:\/\/[^\s)<>\]`]*%[0-9A-Fa-f]{2}[^\s)<>\]`]*/g, (u) => `[${new URL(u).hostname}](${u})`);
const body = (md) => `::: v-pre\n${escapeProse(slashLinks(labelBareUrls(encodeUrls(md))))}\n:::\n`;
const cell = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const write = (rel, content) => {
  const p = path.join(SRC, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};
const page = (title, content, fm = {}) => {
  const front = { title, ...fm };
  return `---\n${Object.entries(front).map(([k, v]) => `${k}: ${typeof v === 'string' ? yaml(v) : JSON.stringify(v)}`).join('\n')}\n---\n\n${content}`;
};

fs.rmSync(SRC, { recursive: true, force: true });
fs.mkdirSync(SRC, { recursive: true });

// ---- wiki articles
wikiDocs.forEach((d) => {
  const body_md = d.body_md.replace(/^#\s+.+\n+/, '');
  write(`wiki/${d.slug}/index.md`, page(d.title, `# ${d.title}\n\n${body(body_md)}`));
});
const docsOf = (cid) => wikiDocs.filter((d) => d.category_id === cid);
const wikiGroups = wikiCats.filter((c) => !c.parent_id).map((c) => ({ text: c.label, collapsed: true, items: docsOf(c.id).map((d) => ({ text: d.title, link: `/wiki/${d.slug}/` })) })).filter((g) => g.items.length);

write('wiki/index.md', page('Wiki', `# Wiki\n\n${wikiDocs.length} articles on the world, its states, people and history. Pick a category below or use the sidebar.\n\n[States (${states.length})](/wiki/states/) · [People (${people.length})](/wiki/people/) · [Update history](/wiki/updates/)\n\n${wikiCats.filter((c) => !c.parent_id && docsOf(c.id).length).map((c) => `## ${c.label}\n\n${c.summary}\n\n${docsOf(c.id).map((d) => `- [${d.title}](/wiki/${d.slug}/)`).join('\n')}\n`).join('\n')}`));

// ---- states + people
write('wiki/states/index.md', page('States', `# States\n\n${states.length} states hold the stations and districts of the metro world.\n\n| ID | State | Ruler | Capital | Power | Hegemon |\n| --- | --- | --- | --- | --- | --- |\n${states.map((s) => `| ${s.id} | [${cell(s.name)}](/wiki/states/${s.slug}/) | ${cell(s.ruler)} | ${cell(s.capital)} | ${cell(s.power)} | ${cell(s.hegemon)} |`).join('\n')}\n`));
states.forEach((s) => {
  const members = people.filter((p) => p.state_id === s.id);
  write(`wiki/states/${s.slug}/index.md`, page(s.name, `# ${s.name}\n\n## Overview\n\n| | |\n| --- | --- |\n| State ID | ${s.id} |\n| Government | ${cell(s.government)} |\n| Power | ${cell(s.power)} |\n| Origin | ${cell(s.cause)} |\n| Ruler | ${cell(s.ruler)} |\n| Capital | ${cell(s.capital)} |\n| Hegemon | ${cell(s.hegemon)} |\n| Base | ${cell(s.base)} |\n\n## People\n\n${members.length} recorded people.\n\n${members.map((p) => `- [${p.name}](/wiki/people/${p.id}/) — ${p.title}`).join('\n')}\n`));
});
write('wiki/people/index.md', page('People', `# People\n\n${people.length} characters. Use the browser's find (Ctrl+F) or the site search to locate a name.\n\n| Name | Title | State | Occupation | Rank |\n| --- | --- | --- | --- | --- |\n${people.map((p) => `| [${cell(p.name)}](/wiki/people/${p.id}/) | ${cell(p.title)} | ${cell(p.state_name)} | ${cell(p.occupation)} | ${cell(p.rank)} |`).join('\n')}\n`, { outline: false }));
people.forEach((p) => {
  const st = states.find((s) => s.id === p.state_id);
  write(`wiki/people/${p.id}/index.md`, page(p.name, `# ${p.name}\n\n| | |\n| --- | --- |\n| Title | ${cell(p.title)} |\n| Position | ${cell(p.position)} |\n| Rank | ${cell(p.rank)} |\n| Occupation | ${cell(p.occupation)} |\n| Gender | ${cell(p.gender)} |\n| Stage | ${cell(p.stage)} |\n| State | ${st ? `[${cell(st.name)}](/wiki/states/${st.slug}/)` : cell(p.state_name)} |\n`, { outline: false }));
});

// ---- updates
const byDate = new Map();
for (const u of updates) { if (!byDate.has(u.date)) byDate.set(u.date, []); byDate.get(u.date).push(u); }
write('wiki/updates/index.md', page('Update History', `# Update History\n\n${[...byDate].map(([d, us]) => `## ${d}\n\n${us.map((u) => `- **${u.status}** · ${u.category} — ${u.slug ? `[${u.title}](/wiki/${u.slug}/)` : u.title}`).join('\n')}\n`).join('\n')}`));

// ---- GDD
gddDocs.forEach((d) => {
  const content = d.body_md.replace(/^#\s+.+\n+/, '');
  write(`gdd/${d.category_id}/${d.slug}/index.md`, page(d.title, `# ${d.title}\n\n${d.summary ? `${d.summary}\n\n` : ''}${body(content)}`));
});
const gddGroups = gddCats.map((c) => ({ text: c.label, collapsed: true, items: gddDocs.filter((d) => d.category_id === c.id).map((d) => ({ text: d.title, link: `/gdd/${d.category_id}/${d.slug}/` })) })).filter((g) => g.items.length);
write('gdd/index.md', page('Game Design Documents', `# Game Design Documents\n\n${gddDocs.length} design documents: rules, architecture, art direction, decision records, references and system design.\n\n${gddGroups.map((g) => `## ${g.text}\n\n${g.items.map((i) => `- [${i.text}](${i.link})`).join('\n')}\n`).join('\n')}`));

// ---- home (VitePress hero + feature cards, same as the reference)
write('index.md', `---\nlayout: home\ntitle: ${yaml(meta.title)}\nhero:\n  name: ${yaml(meta.title)}\n  text: "World Bible & Game Design"\n  tagline: ${yaml(meta.tagline)}\n  actions:\n    - theme: brand\n      text: Open the Wiki\n      link: /wiki/\n    - theme: alt\n      text: Read the GDD\n      link: /gdd/\nfeatures:\n  - title: World Wiki\n    details: ${yaml(`${wikiDocs.length} articles on history, factions, ecology, culture and geography of a post-blackout Seoul.`)}\n    link: /wiki/\n  - title: States\n    details: ${yaml(`${states.length} states fighting over the metro stations and districts.`)}\n    link: /wiki/states/\n  - title: People\n    details: ${yaml(`${people.length} characters with ranks, occupations and allegiances.`)}\n    link: /wiki/people/\n  - title: Design Docs (GDD)\n    details: ${yaml(`${gddDocs.length} documents covering rules, systems, art direction and decisions.`)}\n    link: /gdd/\n  - title: Update History\n    details: What changed in the wiki and when.\n    link: /wiki/updates/\n  - title: Open Source\n    details: Everything is built from raw SQL data in the public repository.\n    link: ${yaml(REPO_URL)}\n---\n`);

// ---- VitePress config + theme (seoul-dengoku tokens over the default theme)
write('.vitepress/theme/index.ts', `import DefaultTheme from 'vitepress/theme'\nimport './custom.css'\nexport default DefaultTheme\n`);
fs.copyFileSync(path.join(HERE, 'theme/custom.css'), path.join(SRC, '.vitepress/theme/custom.css'));
fs.mkdirSync(path.join(SRC, 'public'), { recursive: true });
fs.copyFileSync(path.join(HERE, 'assets/favicon.svg'), path.join(SRC, 'public/favicon.svg'));
const config = {
  title: meta.title, description: meta.tagline, lang: 'en-US', base: BASE, cleanUrls: false, srcDir: '.', outDir: OUT,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }], ['meta', { name: 'theme-color', content: '#b63c32' }]],
  lastUpdated: false,
  themeConfig: {
    logo: { src: '/favicon.svg', alt: meta.title },
    nav: [{ text: 'Wiki', link: '/wiki/' }, { text: 'States', link: '/wiki/states/' }, { text: 'People', link: '/wiki/people/' }, { text: 'Design Docs (GDD)', link: '/gdd/' }],
    sidebar: {
      '/wiki/': [{ text: 'Wiki', items: [{ text: 'Wiki Home', link: '/wiki/' }, { text: 'States', link: '/wiki/states/' }, { text: 'People', link: '/wiki/people/' }, { text: 'Update History', link: '/wiki/updates/' }] }, ...wikiGroups],
      '/gdd/': [{ text: 'Design Docs', items: [{ text: 'GDD Home', link: '/gdd/' }] }, ...gddGroups],
    },
    socialLinks: [{ icon: 'github', link: REPO_URL }],
    search: { provider: 'local', options: { translations: { button: { buttonText: 'Search', buttonAriaLabel: 'Search' }, modal: { noResultsText: 'No results for', resetButtonTitle: 'Reset search', footer: { selectText: 'to select', navigateText: 'to navigate', closeText: 'to close' } } } } },
    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: 'Previous page', next: 'Next page' },
    darkModeSwitchLabel: 'Appearance', sidebarMenuLabel: 'Menu', returnToTopLabel: 'Return to top', langMenuLabel: 'Change language', skipToContentLabel: 'Skip to content',
    footer: { message: 'Public world bible and game design documents.', copyright: meta.title },
  },
};
write('postcss.config.cjs', 'module.exports = { plugins: {} }\n');
write('.vitepress/config.mjs', `export default ${JSON.stringify(config, null, 1)}\n`);

// ---- build
fs.rmSync(OUT, { recursive: true, force: true });
const bin = path.join(HERE, 'node_modules/vitepress/bin/vitepress.js');
const r = spawnSync(process.execPath, [bin, 'build', SRC], { stdio: 'inherit', cwd: HERE });
if (r.status !== 0) process.exit(r.status ?? 1);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({ title: meta.title, base: BASE, wikiDocs: wikiDocs.length, gddDocs: gddDocs.length, states: states.length, people: people.length, updates: updates.length, sqlFiles: files }, null, 1));
console.log(`built ${meta.title}: wiki ${wikiDocs.length}, gdd ${gddDocs.length}, states ${states.length}, people ${people.length} -> ${path.relative(REPO, OUT)} (base ${BASE})`);
