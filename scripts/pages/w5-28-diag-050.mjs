// W5-28 — 050 재직렬화 차이 진단 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine, insertLine } from './ck3-stats.mjs';
const PEOPLE_COLS = ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'];
const text = fs.readFileSync('data/sql/050-wiki-people.sql', 'utf8');
const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
const lines = text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
const row0 = lines[0];
const parsed = parseInsertLine(row0, 'wiki_person', PEOPLE_COLS);
const reser = insertLine('wiki_person', PEOPLE_COLS, parsed);
console.log('orig len', row0.length, 'reser len', reser.length);
let i = 0; while (i < Math.min(row0.length, reser.length) && row0[i] === reser[i]) i++;
console.log('first diff at', i);
console.log('ORIG:', JSON.stringify(row0.slice(Math.max(0, i - 60), i + 80)));
console.log('RES :', JSON.stringify(reser.slice(Math.max(0, i - 60), i + 80)));
