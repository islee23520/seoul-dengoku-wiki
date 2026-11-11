// W5-28 step 5b 사전 조사 — 110 c624 셀·한영 대응·정본 문장 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
const TREE_COLS = ['clan_id', 'json', 'json_ko'];
const trees = splitStatements(fs.readFileSync('data/sql/110-family-trees.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => parseInsertLine(l, 'family_tree', TREE_COLS));
const t = trees.find((r) => r.clan_id === 'c624-d574-c8fc');
if (!t) { console.log('clan c624-d574-c8fc tree NOT FOUND'); process.exit(0); }
for (const [col, raw] of [['json', t.json], ['json_ko', t.json_ko]]) {
  const j = JSON.parse(raw);
  const n4 = j.nodes[4];
  console.log(`== ${col} nodes[4] == name=${n4.name} personId=${n4.personId}`);
  console.log(`summary: ${JSON.stringify(n4.summary ?? '').slice(0, 500)}`);
  console.log(`timeline[0].summary: ${JSON.stringify(n4.timeline?.[0]?.summary ?? '').slice(0, 900)}`);
  if (n4.timeline?.[1]) console.log(`timeline[1].summary: ${JSON.stringify(n4.timeline[1].summary).slice(0, 400)}`);
}
// Century-Annals 정본 문장 (030)
const { parseDocumentsFile, loadDatabase } = await import('./rewrite-doc.mjs');
const text = fs.readFileSync('data/sql/030-wiki-documents.sql', 'utf8');
const parsed = parseDocumentsFile(text);
const db = loadDatabase('data/sql');
const row = db.prepare('SELECT body_md, body_ko_md FROM wiki_document WHERE slug = ?').get('Century-Annals');
for (const [label, body] of [['en', row.body_md], ['ko', row.body_ko_md]]) {
  const idxs = [];
  const re = label === 'ko' ? /임하준|총회|인준/gi : /Im (?:Hajun|Chowon)|O Gyeongjae|confirmation|Council/gi;
  let m; while ((m = re.exec(body))) idxs.push(m.index);
  console.log(`\n== Century-Annals ${label}: ${idxs.length} hits ==`);
  const seen = new Set();
  for (const i of idxs.slice(0, 12)) {
    const snip = body.slice(Math.max(0, i - 130), i + 220).replace(/\n+/g, ' | ');
    if (!seen.has(snip)) { seen.add(snip); console.log('· ' + snip); }
  }
}
