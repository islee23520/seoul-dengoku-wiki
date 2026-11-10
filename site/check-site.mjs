#!/usr/bin/env node
// Post-build gate: no Hangul in rendered text, every page titled, expected page counts. Dead links are
// already fatal inside the VitePress build itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.env.SITE_OUT ?? path.join(REPO, 'dist-pages'));
const info = JSON.parse(fs.readFileSync(path.join(OUT, 'build.json'), 'utf8'));
const HANGUL = /[\uAC00-\uD7A3]/;
const errors = [];
let pages = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.html')) continue;
    pages++;
    const html = fs.readFileSync(p, 'utf8');
    const rel = path.relative(OUT, p).replaceAll('\\', '/');
    if (HANGUL.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '))) errors.push(`HANGUL ${rel}`);
    if (!rel.startsWith('404') && !/<title>[^<]*Seoul Metro Dynasties/.test(html)) errors.push(`TITLE ${rel}`);
  }
})(OUT);
const expected = 1 + 1 + 1 + info.wikiDocs + 1 + 1 + info.states + 1 + info.people + 1 + 1 + info.gddDocs + 1;
if (pages < info.wikiDocs + info.gddDocs + info.states + info.people) errors.push(`COUNT ${pages} pages is fewer than the SQL rows`);
console.log(`checked ${pages} pages (expected about ${expected}); wiki ${info.wikiDocs}, gdd ${info.gddDocs}, states ${info.states}, people ${info.people}`);
if (errors.length) { console.error(errors.slice(0, 40).join('\n')); process.exit(1); }
console.log('OK: no Hangul, all pages titled');
