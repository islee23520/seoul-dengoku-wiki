#!/usr/bin/env node
// Post-build gate for the two-locale site. VitePress already fails the build on dead internal links.
//   English pages (everything outside /ko/ and the showcase): no Hangul, title contains the English site title.
//   Korean pages (/ko/): must contain Hangul and the Korean site title.
//   The showcase is a separate authored app (Korean voice, English subtitles) and is exempt from the language rules
//   but must exist with its assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.env.SITE_OUT ?? path.join(REPO, 'dist-pages'));
const info = JSON.parse(fs.readFileSync(path.join(OUT, 'build.json'), 'utf8'));
const HANGUL = /[\uAC00-\uD7A3]/;
const errors = [];
const count = { en: 0, ko: 0, showcase: 0 };
// The language switcher is labelled in its own language (한국어) on every English page; that label is not page content.
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<a [^>]*href="[^"]*\/ko\/[^"]*"[^>]*>[\s\S]*?<\/a>/g, ' ').replace(/<[^>]+>/g, ' ');

(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    const rel = path.relative(OUT, p).replaceAll('\\', '/');
    const html = fs.readFileSync(p, 'utf8');
    const title = html.match(/<title>([^<]*)/)?.[1] ?? '';
    if (rel.startsWith('wiki/seoul-showcase/')) { count.showcase++; continue; }
    // The LICENSE is a mixed-language legal document; it is published verbatim, never machine-translated.
    if (rel.startsWith('wiki/license/')) { count[rel.startsWith('ko/') ? 'ko' : 'en']++; continue; }
    if (rel === '404.html') continue;
    if (rel.startsWith('ko/')) {
      count.ko++;
      if (!HANGUL.test(visible(html))) errors.push(`KO page without Korean text: ${rel}`);
      if (!title.includes('서울 지하철 왕조')) errors.push(`KO title: ${rel} -> ${title}`);
      if (!/<html[^>]*lang="ko-KR"/.test(html)) errors.push(`KO lang attribute: ${rel}`);
    } else {
      count.en++;
      if (HANGUL.test(visible(html)) || HANGUL.test(title)) errors.push(`HANGUL on English page: ${rel}`);
      if (!title.includes('Seoul Metro Dynasties')) errors.push(`EN title: ${rel} -> ${title}`);
      if (!/<html[^>]*lang="en-US"/.test(html)) errors.push(`EN lang attribute: ${rel}`);
    }
  }
})(OUT);

const perLocale = info.wikiDocs + info.gddDocs + info.states + info.people + info.factions + (info.clans ?? 0) + 5;
if (count.en < perLocale) errors.push(`EN pages ${count.en} < rows ${perLocale}`);
if (count.ko < perLocale) errors.push(`KO pages ${count.ko} < rows ${perLocale}`);
if (count.showcase < 1) errors.push('showcase index.html missing');
const sc = path.join(OUT, 'wiki/seoul-showcase/index.html');
if (fs.existsSync(sc)) {
  const html = fs.readFileSync(sc, 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)) {
    const rel = m[1].replace(new RegExp(`^${info.base}`), '');
    if (!fs.existsSync(path.join(OUT, rel))) errors.push(`showcase asset missing: ${m[1]}`);
  }
}
// language toggle and showcase buttons must be wired on the home pages
for (const [rel, locale] of [['index.html', 'en'], ['ko/index.html', 'ko']]) {
  const html = fs.readFileSync(path.join(OUT, rel), 'utf8');
  if (!html.includes('seoul-showcase')) errors.push(`${locale} home has no showcase link`);
  if (!/VPNavBarTranslations|translations/.test(html) && !html.includes('lang')) errors.push(`${locale} home has no language switch`);
}
console.log(`checked EN ${count.en} + KO ${count.ko} + showcase ${count.showcase} files (rows per locale ${perLocale})`);
if (errors.length) { console.error(errors.slice(0, 40).join('\n')); console.error(`${errors.length} problem(s)`); process.exit(1); }
console.log('OK: English pages have no Hangul, Korean pages have Korean, titles and lang attributes correct, showcase present');
