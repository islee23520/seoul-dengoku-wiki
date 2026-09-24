#!/usr/bin/env bun
// lore-restyle.mjs — dump a lore doc to an editable spec, or build md+json from a spec.
// usage: bun scripts/lore-restyle.mjs dump  <worktree> <domain/Doc> <spec.json>
//        bun scripts/lore-restyle.mjs build <worktree> <domain/Doc> <spec.json>
// Spec entries (in document order):
//   {"keep":"<anchor>"}           heading/table/list/code/quote copied verbatim (md + json)
//   {"i":["가. 제목","A. Title"]}  bold item line
//   {"p":["한국어 문단","English paragraph"]}  prose; links in markdown syntax [text](url), url as in the original md
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
const [mode, wt, doc, specPath] = process.argv.slice(2);
const mdPath = `${wt}/lore/${doc}.md`, jsonPath = `${wt}/lore/${doc}.json`;
const md = await Bun.file(mdPath).text();
const j = JSON.parse(await Bun.file(jsonPath).text());
const tree = fromMarkdown(md, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
const kids = tree.children.filter(c => c.type !== "html" && c.type !== "definition");
if (kids.length !== j.content.length) throw new Error(`block mismatch md=${kids.length} json=${j.content.length}`);
const slice = n => md.slice(n.position.start.offset, n.position.end.offset);
// url <-> link object map from aligned paragraphs/headings
const key = r => JSON.stringify(r.link ?? { href: r.href });
const urlOf = new Map(), linkOf = new Map();
const walkLinks = (n, out) => { if (n.type === "link") out.push(n.url); (n.children ?? []).forEach(c => walkLinks(c, out)); return out; };
kids.forEach((k, i) => { const b = j.content[i]; if (!b.text) return; const urls = walkLinks(k, []); const runs = typeof b.text.ko === "string" ? [] : b.text.ko.filter(r => r.link || r.href);
  urls.forEach((u, x) => { if (runs[x]) { urlOf.set(key(runs[x]), u); linkOf.set(u, runs[x].link ? { link: runs[x].link } : { href: runs[x].href }); } }); });
const toMd = leaf => typeof leaf === "string" ? leaf : leaf.map(r => (r.link || r.href) ? `[${r.text}](${urlOf.get(key(r)) ?? r.href ?? "UNMAPPED"})` : (r.strong ? `**${r.text}**` : r.text)).join("");
if (mode === "dump") {
  const entries = j.content.map(b => b.kind === "paragraph" ? { p: [toMd(b.text.ko), toMd(b.text.en)], was: b.anchor } : { keep: b.anchor, kind: b.kind, ...(b.kind === "heading" ? { text: b.text.ko } : {}) });
  await Bun.write(specPath, JSON.stringify({ doc, summary: { ko: j.locales?.ko?.summary, en: j.locales?.en?.summary }, entries }, null, 1) + "\n");
  console.log(`dumped ${entries.length} entries -> ${specPath}`); process.exit(0);
}
const spec = JSON.parse(await Bun.file(specPath).text());
const byAnchor = new Map(j.content.map((b, i) => [b.anchor, i]));
const toRuns = s => { const re = /(\*\*([^*]+)\*\*)|\[([^\]]+)\]\(([^)]+)\)/g; const runs = []; let last = 0, m;
  while ((m = re.exec(s))) { if (m.index > last) runs.push({ text: s.slice(last, m.index) });
    if (m[1]) runs.push({ text: m[2], strong: true });
    else { const l = linkOf.get(m[4]); if (!l) throw new Error(`unknown link url ${m[4]} (use a url that exists in the original md)`); runs.push({ text: m[3], ...l }); }
    last = re.lastIndex; }
  if (!runs.length) return s; if (last < s.length) runs.push({ text: s.slice(last) }); return runs; };
const blocks = [], content = []; let base = j.content[0].anchor, k = 0; const seen = new Set();
for (const e of spec.entries) {
  if (e.keep) { const i = byAnchor.get(e.keep); if (i === undefined) throw new Error(`unknown keep anchor ${e.keep}`); if (seen.has(e.keep)) throw new Error(`duplicate keep ${e.keep}`); seen.add(e.keep);
    const b = structuredClone(j.content[i]); blocks.push(slice(kids[i]));
    if (b.kind === "heading") { base = b.anchor; k = 0; } else { k++; b.anchor = `${base}-${b.kind}${k}`; }
    content.push(b); continue; }
  k++;
  if (e.i) { blocks.push(`**${e.i[0]}**`); content.push({ kind: "paragraph", anchor: `${base}-p${k}`, text: { en: [{ text: e.i[1], strong: true }], ko: [{ text: e.i[0], strong: true }] } }); continue; }
  if (e.p) { if (!e.p[0]?.trim() || !e.p[1]?.trim()) throw new Error(`empty paragraph near ${base}`); blocks.push(e.p[0]); content.push({ kind: "paragraph", anchor: `${base}-p${k}`, text: { en: toRuns(e.p[1]), ko: toRuns(e.p[0]) } }); continue; }
  throw new Error("bad entry " + JSON.stringify(e));
}
const nonProse = j.content.filter(b => b.kind !== "paragraph").map(b => b.anchor).filter(a => !seen.has(a));
if (nonProse.length) throw new Error(`non-prose blocks dropped: ${nonProse.join(", ")}`);
const tail = md.match(/\n*$/)[0] || "\n";
const out = blocks.join("\n\n") + tail;
const h = new Bun.CryptoHasher("sha256"); h.update(out); const hash = h.digest("hex");
j.content = content; j.provenance.original_hash = hash;
j.provenance.history.push(`2026-09-24 Korean lore/${doc}.md rewritten in findings style (setting-style guide), facts kept; SHA-256 ${hash}. English revised to match paragraph by paragraph.`);
if (spec.summary?.ko && j.locales) { j.locales.ko.summary = spec.summary.ko; j.locales.en.summary = spec.summary.en; }
await Bun.write(mdPath, out); await Bun.write(jsonPath, JSON.stringify(j, null, 2) + "\n");
console.log(`built ${doc}: ${content.length} blocks, sha256 ${hash}`);
