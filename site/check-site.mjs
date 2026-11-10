#!/usr/bin/env node
// Post-build gate for the two-locale site. VitePress already fails the build on dead internal links.
//   English pages (everything outside /ko/ and the showcase): no Hangul, title contains the English site title.
//   Korean pages (/ko/): must contain Hangul and the Korean site title.
//   The showcase is a separate authored app (Korean voice, English subtitles) and is exempt from the language rules
//   but must exist with its assets.
//   Every internal #fragment link must resolve to an id/name on its own page or on the target built page (en and ko).
//   Relative internal hrefs are resolved against the source page's own URL path before the fragment is checked;
//   query strings are dropped and directory, /index and /index.html targets all resolve to the same built page.
//   Links already broken in the current content are grandfathered by docs/.anchor-baseline-broken (one `page -> target#fragment`
//   per line); any fragment broken outside that baseline fails the check. Regenerate the baseline with --write-fragment-baseline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.env.SITE_OUT ?? path.join(REPO, 'dist-pages'));
const info = JSON.parse(fs.readFileSync(path.join(OUT, 'build.json'), 'utf8'));
const HANGUL = /[\uAC00-\uD7A3]/;
const errors = [];
const count = { en: 0, ko: 0, showcase: 0 };
const pageAnchors = new Map();
const fragmentLinkInstances = []; // { entry: `${source} -> ${target}#${fragment}`, targetRel, fragment }
const baselinePath = path.join(REPO, 'docs/.anchor-baseline-broken');
const knownBroken = new Set(fs.existsSync(baselinePath)
  ? fs.readFileSync(baselinePath, 'utf8').split(/\r?\n/).filter(Boolean)
  : []);
// The language switcher is labelled in its own language (한국어) on every English page; that label is not page content.
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<a [^>]*href="[^"]*\/ko\/[^"]*"[^>]*>[\s\S]*?<\/a>/g, ' ').replace(/<[^>]+>/g, ' ');

// Path of a built page relative to OUT, e.g. wiki/foo/index.html -> foo, ko/gdd/a/b/index.html -> a/b.
const slugOf = (rel) => rel.replace(/^(?:ko\/)?(?:wiki|gdd)\//, '').replace(/\/index\.html$/, '');
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    const rel = path.relative(OUT, p).replaceAll('\\', '/');
    const html = fs.readFileSync(p, 'utf8');
    const title = html.match(/<title>([^<]*)/)?.[1] ?? '';
    // Anchors and #fragment links are collected on every page (showcase, license and 404 included)
    // so that a fragment link whose target is one of those pages still resolves.
    const anchors = new Set();
    for (const m of html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) anchors.add(decodeHtml(m[2]));
    for (const m of html.matchAll(/<(?:a|area)\b[^>]*\bname\s*=\s*(["'])(.*?)\1/gi)) anchors.add(decodeHtml(m[2]));
    pageAnchors.set(rel, anchors);
    const sourceSlug = slugOf(rel);
    for (const m of html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gi)) {
      const href = decodeHtml(m[2]);
      const hash = href.indexOf('#');
      if (hash < 0) continue;
      let pathname = href.slice(0, hash);
      let fragment = href.slice(hash + 1);
      try { fragment = decodeURIComponent(fragment); } catch { /* keep the raw fragment */ }
      if (!fragment) continue;
      // Split the query string off the pathname once, up front, for every URL shape (root-relative included),
      // so /wiki/x/?a=1#frag resolves against /wiki/x/ instead of a nonexistent ?a=1/index.html target.
      pathname = pathname.replace(/[?].*$/, '');
      let targetRel;
      if (!pathname) targetRel = rel; // same-page fragment
      else {
        // A relative internal URL is resolved against the source page's own URL path (en pages and /ko/ pages alike),
        // so ../person-0002/#frag is checked against person-0002's anchors instead of being skipped.
        if (!pathname.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(pathname)) {
          pathname = path.posix.join(path.posix.dirname(`/${rel}`), pathname);
        }
        // /wiki/x, /wiki/x/, /wiki/x/index and /wiki/x/index.html (en and /ko/ alike) name the same built page.
        const target = pathname.replace(/\/+$/, '').replace(/\/index(?:\.html)?$/, '');
        const match = target.match(/^\/(ko\/)?(wiki|gdd)\/(.+)$/);
        if (!match) continue; // external URLs and non-page assets are out of scope
        targetRel = `${match[1] ?? ''}${match[2]}/${match[3]}/index.html`;
      }
      const targetSlug = slugOf(targetRel);
      fragmentLinkInstances.push({ entry: `${sourceSlug} -> ${targetSlug}#${fragment}`, targetRel, fragment });
    }
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

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}
const brokenFragments = new Set();
for (const { entry, targetRel, fragment } of fragmentLinkInstances) {
  const anchors = pageAnchors.get(targetRel);
  if (!anchors || !anchors.has(fragment)) brokenFragments.add(entry);
}
const brokenList = [...brokenFragments].sort();
const newBroken = brokenList.filter((entry) => !knownBroken.has(entry));
console.log(`Fragments checked ${fragmentLinkInstances.length} links, known-broken ${brokenList.length - newBroken.length}, new-broken ${newBroken.length}`);
if (process.argv.includes('--write-fragment-baseline')) {
  fs.writeFileSync(baselinePath, brokenList.length ? `${brokenList.join('\n')}\n` : '', 'utf8');
  console.log(`Wrote ${brokenList.length} broken fragment(s) to docs/.anchor-baseline-broken`);
}
if (newBroken.length) errors.push(...newBroken.map((entry) => `Broken fragment: ${entry}`));

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
console.log('OK: English pages have no Hangul, Korean pages have Korean, titles and lang attributes correct, showcase present, fragments resolve');
