// W5-28 step 5 사전 조사 4 — named person 050 확정값·090 부실 표기 감사 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';

function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { headerLines: [text.slice(0, nl), text.slice(nl + 1, nl2)], lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
const PEOPLE_COLS = ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'];
const people = splitStatements(fs.readFileSync('data/sql/050-wiki-people.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO wiki_person')).map((l) => parseInsertLine(l, 'wiki_person', PEOPLE_COLS));
const pBy = new Map(people.map((p) => [p.id, p]));

const NAMED = ['person-0998','person-1018','person-1017','person-1009','person-1010','person-1003','person-0457','person-0086','person-0088','person-0374','person-0399','person-0246','person-0323','person-0145','person-0195','person-0001','person-0029','person-0116','person-0220','person-0272','person-0349','person-1005','person-1008','person-0057'];
console.log('== 050 named values (post-aux) ==');
for (const id of NAMED) {
  const p = pBy.get(id);
  console.log(`${id} ${p.name_ko} | title=${p.title}|${p.title_ko} | pos=${p.position}|${p.position_ko} | rank=${p.rank}|${p.rank_ko} | occ=${p.occupation}|${p.occupation_ko} | faction=${p.faction_id}`);
}

// 090에서 named person의 부실 표기 감사: 050 교체 이전값(구값)이 090 표시 필드 문자열에 남은 경우
const OLD050 = {
  'person-0998': { pos_ko: '충청권 공작 · 세종·아산·천안 영주 · 제1분공방 이씨 가문 후계' },
  'person-1018': { title_ko: '권역 간 계약 자문가', title: 'Inter-District Contract Advisor', rank_ko: '해당 없음 — 어느 나라의 관직도 맡지 않는다.', rank: 'N/A — holds no office in any nation.', pos_ko: '권역 간 계약 자문가', pos: 'Inter-District Contract Advisor' },
  'person-1017': { title_ko: '독립 전령', title: 'Independent Courier', pos_ko: '독립 전령', pos: 'Independent Courier' },
  'person-1003': { title_ko: '유명 낭인 지휘자', title: 'Famous Ronin Commander' },
  'person-0057': { title_ko: '태욱 생명안전 연구책임자', title: 'Taeuk Life Safety Research Director' },
  'person-0086': { pos_ko: '전 Arc 당회장', pos: 'Former Moderator of Myeongbu Church', rank_ko: '당회장', rank: 'Moderator' },
  'person-0088': { pos_ko: 'Arc 왕 · Arc 당회장', pos: 'Arc King · Arc Moderator', rank_ko: '왕 · 당회장', rank: 'King · Moderator', title_ko: '당회장', title: 'Moderator' },
};
const DETAIL_COLS = ['person_id', 'clan_id', 'json', 'json_ko'];
const rows = splitStatements(fs.readFileSync('data/sql/090-person-details.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO person_detail')).map((l) => parseInsertLine(l, 'person_detail', DETAIL_COLS));
const rBy = new Map(rows.map((r) => [r.person_id, r]));
console.log('\n== stale-string hits in 090 (named persons) ==');
const STALE = ['Independent Courier','Independent courier','Inter-Region Contract Advisor','Inter-District Contract Advisor','She holds no office in any state','holds no office in any nation','독립 전령','권역 간 계약 자문가','낭인','Director','이사','Famous Ronin','Taeuk Life Safety','태욱 생명안전','당회장','Moderator of Myeongbu','Arc King','Arc 왕'];
for (const id of NAMED) {
  const r = rBy.get(id);
  if (!r) continue;
  for (const col of ['json', 'json_ko']) {
    const j = JSON.parse(r[col]);
    const hits = [];
    const walk = (o, p) => {
      if (Array.isArray(o)) { o.forEach((v, i) => walk(v, `${p}[${i}]`)); return; }
      if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k); return; }
      if (typeof o === 'string') for (const s of STALE) if (o.includes(s)) hits.push(`${p} :: ${s} :: ${o.slice(0, 90)}`);
    };
    walk(j, '');
    for (const h of hits) console.log(`${id} ${col} ${h}`);
  }
}
