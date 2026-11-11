// W5-28 — parseInsertLineNum 단위 진단
import { parseInsertLine, insertLine } from './ck3-stats.mjs';
import fs from 'node:fs';
const PEOPLE_COLS = ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'];
const text = fs.readFileSync('data/sql/050-wiki-people.sql', 'utf8');
const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
const line0 = text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0)[0];
const table = 'wiki_person';
const m = line0.match(new RegExp(`^INSERT INTO ${table} \\(([^)]*)\\) VALUES \\((.*)\\);$`));
console.log('regex match:', !!m);
const vals = [];
let cur = ''; let inStr = false;
for (let i = 0; i < m[2].length; i++) {
  const c = m[2][i];
  if (inStr) { cur += c; if (c === "'") { if (m[2][i + 1] === "'") { cur += "'"; i++; } else inStr = false; } continue; }
  if (c === "'") { inStr = true; cur += c; continue; }
  if (c === ',') { vals.push(cur); cur = ''; continue; }
  cur += c;
}
vals.push(cur);
console.log('vals[1] raw:', JSON.stringify(vals[1]));
const row = parseInsertLine(line0, table, PEOPLE_COLS);
console.log('parsed sort:', JSON.stringify(row.sort));
const raw = vals[1].trim();
console.log('raw trim:', JSON.stringify(raw), 'startsWith quote:', raw.startsWith("'"), 'number:', Number(raw));
const row2 = { ...row };
row2.sort = Number(raw);
console.log('insertLine with numeric sort:', insertLine(table, PEOPLE_COLS, row2).slice(0, 140));
console.log('sqlString(0):', JSON.stringify((await import('./ck3-stats.mjs')).sqlString(0)));
