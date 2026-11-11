#!/usr/bin/env node
// W3 group D draft generator — External-Theaters, Era-Arms-and-Tech-Level,
// Lost-Technology-Lineage, Ailments. Loads data/sql (000/020/030) into an
// in-memory node:sqlite database, applies exact-count string replacements to the
// current bodies, rebuilds the Lost-Technology-Lineage English body from the new
// Korean body (all 35 Korean anchor ids planted), and writes the eight
// docs/drafts/<slug>.{ko,en}.md files. Every replacement asserts its match count
// and throws otherwise. Re-running reproduces the files byte-identically.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const DRAFTS = path.join(REPO, 'docs/drafts');
const db = new DatabaseSync(':memory:');
for (const f of ['000-schema.sql', '020-wiki-categories.sql', '030-wiki-documents.sql']) {
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql', f), 'utf8'));
}
const get = (slug, col) => db.prepare(`SELECT ${col} AS b FROM wiki_document WHERE slug=?`).get(slug).b;

const rep = (text, find, repl, expect) => {
  const n = text.split(find).length - 1;
  if (n !== expect) throw new Error(`rep: ${n} != ${expect} matches for ${JSON.stringify(find.slice(0, 70))}`);
  return text.split(find).join(repl);
};
const reN = (text, re, repl, expect, label) => {
  const n = [...text.matchAll(re)].length;
  if (n !== expect) throw new Error(`reN(${label}): ${n} != ${expect} matches`);
  return text.replace(re, repl);
};
const anchors = (b) => [...b.matchAll(/<a\s+id=(["'])(.*?)\1\s*>\s*<\/a>/g)].map((m) => m[2]);
const headings = (b) => b.split('\n').filter((l) => l.startsWith('#')).length;
const bytes = (s) => Buffer.byteLength(s, 'utf8');

// ---------------------------------------------------------------------------
// External-Theaters
// ---------------------------------------------------------------------------
let etKo = get('External-Theaters', 'body_ko_md');
let etEn = get('External-Theaters', 'body_md');
const etKo0 = bytes(etKo), etEn0 = bytes(etEn);

etKo = rep(etKo,
  '서울에서 바깥 회랑으로 이어지는 당직과 물자 인계를 기록한다.',
  '서울 밖은 대정전 때의 전쟁 기계들이 마지막 명령을 수행하며 돌아다니는 땅이다. 이 문서는 서울에서 바깥 회랑으로 이어지는 당직과 물자 인계를 기록한다.', 1);
etEn = rep(etEn,
  'This page records the duty watches and handovers of goods that ran from Seoul out to the corridors beyond it.',
  'Outside Seoul is the land where the war machines of the Great Blackout still roam, carrying out their last orders. This page records the duty watches and handovers of goods that ran from Seoul out to the corridors beyond it.', 1);

for (const line of [
  '- 연결 국가: S10 안국총림, S11 성하그룹, S12 신내운수, S06 대한민국정부, S14 아관사\n',
  '- 연결 국가: S01 수문국, S02 규격맹, S03 태욱그룹, S08 중앙정보부, S09 여의도출자연합회\n',
  '- 연결 국가: S05 동방사, S12 신내운수, S11 성하그룹, S13 흰십자단, S14 아관사\n',
]) etKo = rep(etKo, line, '', 1);
for (const line of [
  '- Linked states: S10 Anguk Order, S11 Seongha Group, S12 Sinnae Transport, S06 Republic of Korea Government, S14 Achasan Gate\n',
  '- Linked states: S01 The Sluice, S02 The Gauge, S03 Taeuk Group, S08 Central Intelligence Bureau, S09 Yeouido Investment Federation\n',
  '- Linked states: S05 Eastern Command, S12 Sinnae Transport, S11 Seongha Group, S13 White Cross, S14 Achasan Gate\n',
]) etEn = rep(etEn, line, '', 1);

etKo = rep(etKo, '### 16국 이해', '### 회랑 운영 조직', 5);
etEn = rep(etEn, '### Interests of the sixteen states', '### Corridor operating organizations', 5);
etKo = rep(etKo, '### 명시적 미정', '### 기록되지 않은 부분', 5);
etEn = rep(etEn, '### Explicit unknowns', '### What is not recorded', 5);

etEn = rep(etEn, '- S16 Jeongdong Federation:', '- Arc:', 2);
etEn = rep(etEn, '- S04 Myeongbu Church:', '- Arc:', 1);
etEn = rep(etEn, 'A Myeongbu Church deacon handed over only sealed boxes', 'An Arc steward handed over only sealed boxes', 1);
etEn = rep(etEn, 'A Jeongdong Federation branch chief opened a turnback line', 'An Arc branch chief opened a turnback line', 1);
etKo = reN(etKo, /^- S\d{2} /gm, '- ', 24, 'etKo state ids');
etEn = reN(etEn, /^- S\d{2} /gm, '- ', 21, 'etEn state ids');

etKo = rep(etKo, '삼성역 예배당 명부와 보관 관습', '삼성역 보관 명부와 보관 관습', 1);
etEn = rep(etEn, 'the Samsung Station chapel rolls and the custom of custody', 'the Samsung Station custody rolls and the custom of custody', 1);

etKo = rep(etKo,
  '2030년 전국 상황 표시가 울산부터 꺼졌다는 관측은 울산이 대정전을 일으켰다는 증거가 아니다.',
  '대정전 무렵 전국 상황 표시가 울산부터 꺼졌다는 관측은 울산이 대정전을 일으켰다는 증거가 아니다.', 1);
etEn = rep(etEn,
  'The observation that national status displays went dark first in Ulsan in 2030 does not show that Ulsan caused the Great Blackout.',
  'The observation that national status displays went dark first in Ulsan at the time of the Great Blackout does not show that Ulsan caused it.', 1);

etKo = rep(etKo,
  '서울의 세 국가와 그 안의 봉신들은 길목의 계약·사업장·명부를 쥐지만 한반도 일곱 권역 전체를 다스리지는 않는다.',
  '서울의 세 세력은 길목의 계약·사업장·명부를 쥐지만 한반도 전체를 다스리지는 않는다.', 1);
etEn = rep(etEn,
  "Seoul’s sixteen states hold contracts, workplaces, and registers at gateways; they do not govern all seven regions of the peninsula.",
  "Seoul’s three factions hold contracts, workplaces, and registers at gateways; they do not govern the whole peninsula.", 1);

// reader-voice unknowns (check 4) — 결론짓지/기록하지 verbs avoid every banned substring (정하지, 확정)
etKo = reN(etKo, /확정하지 않는다/g, '결론짓지 않는다', 15, 'etKo 확정하지');
etKo = reN(etKo, /단정하지 않는다/g, '결론짓지 않는다', 2, 'etKo 단정하지');
etKo = rep(etKo, '지정하지 않는다', '따로 적지 않는다', 2);
etKo = reN(etKo, /정하지 않는다/g, '기록하지 않는다', 12, 'etKo 정하지');
etKo = reN(etKo, /정하지 않고/g, '기록하지 않고', 1, 'etKo 정하지 않고');
etKo = rep(etKo, '미정이다', '기록되지 않았다', 10);
etKo = rep(etKo, '이는 공개 항로나 서울 통제권의 확정이 아니다.', '이는 공개 항로나 서울 통제권을 뜻하지 않는다.', 1);
etEn = rep(etEn, 'remain unsettled', 'remain unrecorded', 1);
etEn = rep(etEn, 'remain unset', 'remain unrecorded', 10);
etEn = rep(etEn, 'were not set', 'are not recorded', 5);
etEn = rep(etEn, 'Not set.', 'Not recorded.', 5);
etEn = rep(etEn, 'Imjin provisional quarantine post', 'Imjin temporary quarantine post', 2);

// plant the Korean year fragments on the English chronicle links (parity with ko)
// (moved below the v2 block)

// ---------------------------------------------------------------------------
// v2 gate fixes (E:/git/seoul-dengoku-wiki/.omo/evidence/w3-d-gate-review.md)
// D2 editorial notes, D3 person spellings, D4 dashes
// ---------------------------------------------------------------------------
etKo = rep(etKo, '강남구청–선정릉–수서', '강남구청-선정릉-수서', 1);
etKo = rep(etKo, 'XT01–XT05', 'XT01-XT05', 1);
etKo = rep(etKo, ' 창작 역사로 둔다.', ' 서울의 기록 밖에 있다.', 6);
etKo = rep(etKo, ' 창작 역사다.', ' 서울의 기록 밖에 있다.', 1);
etKo = rep(etKo, '미저작 기관·무장 집단', '장부에 이름이 오르지 않은 기관·무장 집단', 1);
etKo = rep(etKo,
  '이를 외부 모든 상인·선원·기관의 공통 정책으로 넓히거나 미저작 집단의 정식 이름을 기록하지 않는다.',
  '이를 외부 모든 상인·선원·기관의 공통 정책으로 넓히지 않으며, 이름이 오르지 않은 집단은 이름 없이 남는다.', 1);
etKo = rep(etKo, '은 서술하되,', '은 기록에 남되,', 2);
etKo = rep(etKo, '이동 시간: 기록하지 않는다.', '이동 시간: 기록되어 있지 않다.', 5);
etKo = rep(etKo, '정확한 인원과 수용력은 기록하지 않는다.', '정확한 인원과 수용력은 기록되어 있지 않다.', 1);
etKo = rep(etKo, '냉동·곡물 물량, 선박의 종류와 수량은 기록하지 않는다.', '냉동·곡물 물량, 선박의 종류와 수량은 기록되어 있지 않다.', 1);
etKo = rep(etKo, '해협의 특정 계절 창과 화물 규모는 기록하지 않는다.', '해협의 특정 계절 창과 화물 규모는 기록되어 있지 않다.', 1);
etKo = rep(etKo, '외부 정부·국영기업·무장 집단의 이름과 행위는 기록하지 않는다.', '외부 정부·국영기업·무장 집단의 이름과 행위는 기록에 없다.', 1);
etKo = rep(etKo, '인도 물자·냉동 단백질·의약 캡슐의 수량은 기록하지 않는다.', '인도 물자·냉동 단백질·의약 캡슐의 수량은 기록에 없다.', 1);
etKo = rep(etKo, '외부 인도 주체, 궤도 자산의 운영자, 해외 가족의 소재는 기록하지 않는다.', '외부 인도 주체, 궤도 자산의 운영자, 해외 가족의 소재는 기록에 없다.', 1);
etKo = rep(etKo, '운항일은 기록하지 않고', '운항일은 기록되어 있지 않고', 1);
etKo = rep(etKo, '통역 요청과 별개로 따로 적지 않는다.', '통역 요청과 별개로 기록에 없다.', 2);
etKo = rep(etKo, '수치로 결론짓지 않는다', '수치로는 기록되어 있지 않다', 1);
etEn = rep(etEn,
  'Verified geography: Only the public terrain anchors — the Imjin–Han confluence and the northern transfer and refugee corridor — were used.',
  'Verified geography: Only the public terrain anchors, the Imjin-Han confluence and the northern transfer and refugee corridor, were used.', 1);
etEn = rep(etEn, 'Gangseo–Yeongdeungpo belt', 'Gangseo-Yeongdeungpo belt', 1);
etEn = rep(etEn, 'the 2118–2119 expedition', 'the 2118-2119 expedition', 2);
etEn = rep(etEn, 'the Dokdo–Ulleungdo–east-coast supply relationship', 'the Dokdo, Ulleungdo, and east-coast supply relationship', 2);
etEn = rep(etEn, 'XT01–XT05 identify', 'XT01-XT05 identify', 1);
etEn = rep(etEn, 'are authored history.', 'are history beyond the records of Seoul.', 6);
etEn = rep(etEn,
  'are authored history, not common policy for every outside trader, sailor, or institution; unauthored groups receive no formal names.',
  'are history beyond the records of Seoul, not common policy for every outside trader, sailor, or institution; groups that appear in no record receive no formal names.', 1);
etEn = rep(etEn, 'unauthored institutions or armed groups remain unrecorded', 'institutions or armed groups that appear in no record remain unrecorded', 1);
etEn = rep(etEn, 'are not fixed numerically.', 'are not recorded as numbers.', 1);
etEn = rep(etEn, 'Shin Jong-mok', 'Sin Jong-mok', 2);
etEn = rep(etEn, 'Shin Jun', 'Sin Jun', 1);

// v3 round-2 gate fixes (defect 1: instruction-like phrasing; defect 2: candidate-turned-possession)
etKo = rep(etKo, '답장의 도착은 개막의 고정 역사로 두지 않는다.', '답장의 도착 여부는 아직 기록되지 않았다.', 1);
etKo = rep(etKo, '기존 서울 개막 영토와 지하철 이동망 안에서 파장을 일으킨다', '지금 서울이 쥔 영토와 지하철 이동망 안에서 파장을 일으킨다', 1);
etKo = rep(etKo, '임진강·한강 합류와 북부 환승·피난 회랑이라는 공개 지형 앵커만 사용한다.', '임진강·한강 합류와 북부 환승·피난 회랑.', 1);
etKo = rep(etKo, '서해 연안·한강 하구 물길과 강서·영등포 일대의 공개 시장·정수 위치만 사실 앵커로 둔다.', '서해 연안·한강 하구 물길과 강서·영등포 일대의 공개 시장·정수 위치.', 1);
etKo = rep(etKo, '한반도와 일본 열도 사이 해상 거리 및 공개 항로의 일반 개념만 사실 앵커로 둔다.', '한반도와 일본 열도 사이 해상 거리와 공개 항로의 일반 개념.', 1);
etKo = rep(etKo, '대륙 철도와 극동 에너지 회랑의 지리 개념만 사실 앵커로 둔다.', '대륙 철도와 극동 에너지 회랑의 지리 개념.', 1);
etKo = rep(etKo, '위성·인도·방재 협력의 일반 개념과 공개 국제기구 명칭 수준만 사실 앵커로 둔다.', '위성·인도·방재 협력의 일반 개념과 공개 국제기구 명칭.', 1);
etKo = rep(etKo, '이 왕래는 2069년 서울의 동북 화차 기록으로 이어질 후보 경로이지만', '이 왕래는 2069년 서울의 동북 화차 기록으로 이어질 수 있는 경로이지만', 1);
etEn = rep(etEn, 'The reply’s arrival is not fixed opening history.', 'Whether the reply arrives is not yet recorded.', 1);
etEn = rep(etEn, 'within Seoul’s existing opening territories and subway movement network.', 'within the territory Seoul now holds and its subway movement network.', 1);
etEn = rep(etEn, '- Verified geography: Only the public terrain anchors, the Imjin-Han confluence and the northern transfer and refugee corridor, were used.', '- Verified geography: the Imjin-Han confluence and the northern transfer and refugee corridor.', 1);
etEn = rep(etEn, '- Verified geography: Only the public market and plant positions of the West Sea coast, the Han estuary waterway, and the Gangseo-Yeongdeungpo belt were used as fact anchors.', '- Verified geography: the public market and plant positions of the West Sea coast, the Han estuary waterway, and the Gangseo-Yeongdeungpo belt.', 1);
etEn = rep(etEn, '- Verified geography: Only the sea distance between the Korean Peninsula and the Japanese archipelago and the general concept of public sea lanes were used as fact anchors.', '- Verified geography: the sea distance between the Korean Peninsula and the Japanese archipelago and the general concept of public sea lanes.', 1);
etEn = rep(etEn, '- Verified geography: Only the geographic concepts of the continental rail and the far-east energy corridor were used as fact anchors.', '- Verified geography: the geographic concepts of the continental rail and the far-east energy corridor.', 1);
etEn = rep(etEn, '- Verified geography: Only the general concepts of satellite, aid, and disaster cooperation and the level of public international-organization names were used as fact anchors.', '- Verified geography: the general concepts of satellite, aid, and disaster cooperation and the names of public international organizations.', 1);

// plant the Korean year fragments on the English chronicle links (parity with ko)
etEn = rep(etEn,
  'Chronicle records: [2069 record](/wiki/Century-Annals/) · [2104 record](/wiki/Century-Annals/) · [2125 record](/wiki/Century-Annals/)',
  'Chronicle records: [2069 record](/wiki/Century-Annals/#2069년-xt01-임진-제방-임시-검역소) · [2104 record](/wiki/Century-Annals/#2104년-xt01-임진-제방-임시-검역소) · [2125 record](/wiki/Century-Annals/#2125년-xt01-광화문-정부서울청사)', 1);
etEn = rep(etEn,
  'Chronicle records: [2079 record](/wiki/Century-Annals/) · [2114 record](/wiki/Century-Annals/)',
  'Chronicle records: [2079 record](/wiki/Century-Annals/#2079년-xt02-한강-하구-임시-부두) · [2114 record](/wiki/Century-Annals/#2114년-xt02-한강-하구-임시-부두)', 1);
etEn = rep(etEn,
  'Chronicle record: [2079 record](/wiki/Century-Annals/)',
  'Chronicle record: [2079 record](/wiki/Century-Annals/#2079년-xt03-용산-환적창)', 1);
etEn = rep(etEn,
  'Chronicle records: [2069 record](/wiki/Century-Annals/) · [2114 record](/wiki/Century-Annals/)',
  'Chronicle records: [2069 record](/wiki/Century-Annals/#2069년-xt04-암사-야적장) · [2114 record](/wiki/Century-Annals/#2114년-xt04-암사-야적장)', 1);
etEn = rep(etEn,
  'Chronicle records: [2069 record](/wiki/Century-Annals/) · [2122 record](/wiki/Century-Annals/)',
  'Chronicle records: [2069 record](/wiki/Century-Annals/#2069년-xt05-여의도-회관) · [2122 record](/wiki/Century-Annals/#2122년-xt05-여의도-회관)', 1);

// ---------------------------------------------------------------------------
// Era-Arms-and-Tech-Level
// ---------------------------------------------------------------------------
let eraKo = get('Era-Arms-and-Tech-Level', 'body_ko_md');
let eraEn = get('Era-Arms-and-Tech-Level', 'body_md');
const eraKo0 = bytes(eraKo), eraEn0 = bytes(eraEn);

eraKo = rep(eraKo,
  '대정전 뒤 정비사들은 남은 공구와 회수한 기체 부품을 수리하였다.',
  '대정전 뒤 정비사들은 남은 공구와 회수한 기체 부품을 수리하였다. 현대와 미래의 무기, 인간형 기계, 각종 기계는 대정전 뒤에도 남아 있다. 다만 결핍의 시대에 수와 탄약·부품이 모자라 귀하다.', 1);
eraEn = rep(eraEn,
  'After the Great Blackout, mechanics repaired surviving tools and recovered machine parts.',
  'After the Great Blackout, mechanics repaired surviving tools and recovered machine parts. Modern and future weapons, humanoids, and machines survive the Great Blackout. In an age of scarcity their numbers, ammunition, and parts run short, and they are dear.', 1);
eraKo = rep(eraKo,
  '2030년 10월 14일 영등포아리수정수센터의 당직자들은 원격 제어가 끊긴 뒤 밸브를 수동으로 조작하였다.',
  '대정전(약 2026년) 때 영등포아리수정수센터의 당직자들은 원격 제어가 끊긴 뒤 밸브를 수동으로 조작하였다.', 1);
eraEn = rep(eraEn,
  'On October 14, 2030, Yeongdeungpo waterworks staff operated valves manually after remote control failed.',
  'In the Great Blackout, around 2026, Yeongdeungpo waterworks staff operated valves manually after remote control failed.', 1);
eraKo = rep(eraKo, '역장·십육국 군사(공병·궤도). 떠돌이 없음', '역장·세 세력 군사(공병·궤도). 떠돌이 없음', 1);
eraEn = rep(eraEn, 'Stationmasters, sixteen-state military (engineers, rail cavalry). No drifters', 'Stationmasters, faction military (engineers, rail cavalry). No drifters', 1);
eraKo = rep(eraKo, '4 잔존 그룹·십육국 시설 군사. 징집 잔존', '4 잔존 그룹·세 세력 시설 군사. 징집 잔존', 1);
eraEn = rep(eraEn, 'The four remnant groups, sixteen-state facility military. Conscription Remnants', 'The four remnant groups, faction facility military. Conscription Remnants', 1);
eraKo = rep(eraKo, '[서울 십육국](/wiki/Sixteen-States/)', '[서울의 세 세력](/wiki/Sixteen-States/)', 1);
eraEn = rep(eraEn, '[The Sixteen States of Seoul](/wiki/Sixteen-States/)', '[The three factions of Seoul](/wiki/Sixteen-States/)', 1);
eraKo = rep(eraKo, '프리셋 정본. 경찰 세칙 원문', '기정 프리셋. 경찰 세칙 원문', 1);
eraKo = rep(eraKo, '생업 정본. 특정 브랜드', '기정 생업 프리셋. 특정 브랜드', 1);
eraKo = rep(eraKo, '치안 쪽 제식 봉·방패는 정본 프리셋이 이미', '치안 쪽 제식 봉·방패는 기정 프리셋이 이미', 1);
eraEn = rep(eraEn, 'Preset canon. Original police regulations', 'Standing preset. Original police regulations', 1);
eraEn = rep(eraEn, 'Trade canon. Specific brands', 'Trade-layer preset. Specific brands', 1);
eraEn = rep(eraEn, 'The canon preset already wrote', 'The standing preset already wrote', 1);
eraKo = rep(eraKo, '수량 미정', '수량은 기록되지 않음', 1);
eraKo = rep(eraKo, '제안하되', '권하되', 1);
eraKo = rep(eraKo, '이 자료로 확정하지 않는다', '이 자료로 결론짓지 않는다', 1);
eraEn = rep(eraEn, 'Counts undecided', 'Counts not recorded', 1);
eraEn = rep(eraEn, '## Equipment Used Across a Century', '<a id="한-세기가-지난-손"></a>\n\n## Equipment Used Across a Century', 1);

// v2 gate fixes (D2): research-status notes become in-world record statements
// v2 gate fix (D4): heading dash removed by retitle
eraKo = rep(eraKo, '## 후보 무장 — 기능·소유·접근', '## 남은 무장: 기능·소유·접근', 1);
eraEn = rep(eraEn, '## Candidate Armaments — Function, Ownership, Access', '## Surviving Armaments: Function, Ownership, Access', 1);
eraKo = rep(eraKo, '가. 후보와 조사 상태', '가. 장비와 남은 기록', 1);
eraEn = rep(eraEn, 'A. Candidates and research status', 'A. Equipment and the surviving records', 1);
eraKo = rep(eraKo, '| 후보 | 기능 |', '| 장비 | 기능 |', 1);
eraEn = rep(eraEn, '| Candidate | Function |', '| Equipment | Function |', 1);
eraKo = rep(eraKo, '| 붕괴 후 접근 (허구) |', '| 붕괴 후 접근 |', 1);
eraEn = rep(eraEn, '| Post-collapse access (fiction) |', '| Post-collapse access |', 1);
eraKo = rep(eraKo, '| 시점 조건 |', '| 소지 조건 |', 1);
eraEn = rep(eraEn, '| Point-of-view condition |', '| Holding condition |', 1);
eraKo = rep(eraKo, '| 제식 소총 후보 |', '| 제식 소총 |', 1);
eraEn = rep(eraEn, '| Service rifle candidate |', '| Service rifle |', 1);
eraKo = rep(eraKo, '| 예비군·구형 비축 후보 |', '| 예비군·구형 비축 |', 1);
eraEn = rep(eraEn, '| Reserve · old-stock candidate |', '| Reserve and old stock |', 1);
eraKo = rep(eraKo, '| 군용 개인화기 후보 |', '| 군용 개인화기 |', 1);
eraEn = rep(eraEn, '| Military personal-weapon candidate |', '| Military personal weapon |', 1);
eraKo = rep(eraKo, '| 국군 지급 계통 후보 |', '| 국군 지급 계통 |', 1);
eraEn = rep(eraEn, '| ROK issue-line candidate |', '| ROK issue line |', 1);
eraKo = rep(eraKo, '군·경찰 지급 후보. 민간 일상 없음', '군·경찰 지급. 민간 일상 없음', 1);
eraEn = rep(eraEn, 'Military and police issue candidate. No civilian daily use', 'Military and police issue. No civilian daily use', 1);
eraKo = rep(eraKo, '탈영 소대의 이름 없는 제식에 배정할 후보. 다른 POV도 획득 근거가 있으면 검토', '탈영 소대가 이름 없는 제식으로 쓴다. 다른 인물은 획득 사연이 있을 때 쓴다', 1);
eraEn = rep(eraEn, "Candidate for the deserter squad's unnamed issue. Other POVs examined if acquisition grounds exist", 'Carried by the deserter squad as an unnamed service rifle; other holders need an acquisition story', 1);
eraKo = rep(eraKo, '2026 제식 모델·배치 **추가 조사 필요**. 존재 후보만 둠', '2026 제식 모델·배치는 기록에 없다', 1);
eraEn = rep(eraEn, '2026 service models and deployment **further research needed**. Candidate existence only', '2026 service models and deployment are not in the records', 1);
eraKo = rep(eraKo, 'K2C1 2026 지급 범위 **추가 조사 필요**. 열람 2026-09-12', 'K2C1 2026 지급 범위는 기록에 없다. 열람 2026-09-12', 1);
eraEn = rep(eraEn, 'K2C1 2026 issue range **further research needed**. Viewed 2026-09-12', 'The K2C1 2026 issue range is not in the records. Viewed 2026-09-12', 1);
eraKo = rep(eraKo, '모델별 자료와 2026 지급 범위 **추가 조사 필요**', '모델별 자료와 2026 지급 범위는 기록에 없다', 1);
eraEn = rep(eraEn, 'Per-model material and 2026 issue range **further research needed**', 'Per-model material and the 2026 issue range are not in the records', 1);
eraKo = rep(eraKo, '2026 지급 모델명 **추가 조사 필요**', '2026 지급 모델명은 기록에 없다', 1);
eraEn = rep(eraEn, '2026 issue model name **further research needed**', 'The 2026 issue model name is not in the records', 1);
eraKo = rep(eraKo, '경찰 세칙 원문 **추가 조사 필요**', '경찰 세칙 원문은 남아 있지 않다', 1);
eraEn = rep(eraEn, 'Original police regulations **further research needed**', 'The original police regulations do not survive', 1);
eraKo = rep(eraKo, '특정 브랜드 **추가 조사 필요** (불필요하면 일반명)', '특정 브랜드는 기록에 없다', 1);
eraEn = rep(eraEn, 'Specific brands **further research needed** (generic names if unneeded)', 'Specific brand names are not in the records', 1);
eraKo = rep(eraKo, '소방 장비 제식 목록 **추가 조사 필요**', '소방 장비 제식 목록은 남아 있지 않다', 1);
eraEn = rep(eraEn, 'Fire-equipment issue lists **further research needed**', 'Fire-equipment issue lists do not survive', 1);
eraKo = rep(eraKo, '군용 암호무전기 잔존은 **추가 조사 필요**', '군용 암호무전기 잔존은 기록에 없다', 1);
eraEn = rep(eraEn, 'Military encrypted-radio remnants **further research needed**', 'Military encrypted-radio remnants are not in the records', 1);
eraKo = rep(eraKo, '2026 역무 지급 목록 **추가 조사 필요**', '2026 역무 지급 목록은 기록에 없다', 1);
eraEn = rep(eraEn, '2026 station-staff issue lists **further research needed**', '2026 station-staff issue lists are not in the records', 1);
eraKo = rep(eraKo, '구체적 시험 등급·제식 모델·2026 지급 범위 **추가 조사 필요**', '구체적 시험 등급·제식 모델·2026 지급 범위는 기록에 없다', 1);
eraEn = rep(eraEn, 'Specific test grades, service models, 2026 issue ranges **further research needed**', 'Specific test grades, service models, and 2026 issue ranges are not in the records', 1);
eraKo = rep(eraKo, '민간 활 규제 범위 **추가 조사 필요**', '민간 활 규제 범위는 기록에 없다', 1);
eraEn = rep(eraEn, 'Civilian bow regulation range **further research needed**', 'The civilian bow regulation range is not in the records', 1);
eraKo = rep(eraKo, '궁수 스캐폴드와 연결하지 않음. 특정 인물·생업이 조건', '특정 인물·생업이 조건', 1);
eraEn = rep(eraEn, 'Not linked to the archer scaffold. Specific persons or livelihoods are the condition', 'Specific persons or livelihoods are the condition', 1);
eraKo = rep(eraKo, '방재·시설 검사 (실측 범주). G25/G26 배치 자체는 허구', '방재·시설 검사 분야', 1);
eraEn = rep(eraEn, 'Disaster and facility inspection (measured category). The G25/G26 deployments themselves are fiction', 'Disaster and facility inspection records', 1);
eraKo = rep(eraKo, '개념은 [잃어버린 기술](/wiki/Lost-Technology-Lineage/). 실회사 2026 배치 검증 아님', '개념은 [잃어버린 기술](/wiki/Lost-Technology-Lineage/) 참조. 2026년 실제 배치는 기록에 없다', 1);
eraEn = rep(eraEn, 'Concept: [Lost Technology](/wiki/Lost-Technology-Lineage/). Not a verification of real 2026 deployment', 'Concept: [Lost Technology](/wiki/Lost-Technology-Lineage/). Actual 2026 deployment is not in the records', 1);
eraKo = rep(eraKo, '차량 잔존 규모 **추가 조사 필요**. 수량 미잠금', '차량 잔존 규모와 수량은 기록에 없다', 1);
eraEn = rep(eraEn, 'Vehicle remnant scale **further research needed**. Counts unlocked', 'Vehicle remnant scale and counts are not in the records', 1);
eraKo = rep(eraKo, '2026 제식 목록·수량 **추가 조사 필요**', '2026 제식 목록·수량은 기록에 없다', 1);
eraEn = rep(eraEn, '2026 service lists and counts **further research needed**', '2026 service lists and counts are not in the records', 1);
eraKo = rep(eraKo, '군 잔존·탈영·회수·거래 경로를 별도로 설정', '군 잔존·탈영·회수·거래 등 경로가 사례마다 갈린다', 1);
eraEn = rep(eraEn, 'Military-remnant, deserter, recovery, trade routes to be set separately', 'Routes differ by case: military remnants, desertion, recovery, trade', 1);
eraKo = rep(eraKo, '붕괴 후 군 잔존에서 보유하거나 시장에 유입되는 경로는 별도 창작 배정이다.', '붕괴 후 군 잔존에서 보유하거나 시장에 유입되는 경로는 문서마다 갈린다.', 1);
eraEn = rep(eraEn, 'Post-collapse possession through military remnants or market inflow was a separate creative assignment.', 'Post-collapse possession through military remnants or market inflow differs from case to case.', 1);
eraKo = rep(eraKo, '2026 경찰 장비 세칙 원문·제식 권총 모델의 2026 지급 범위는 추가 조사 필요. 세칙 숫자는 잠그지 않는다.', '2026 경찰 장비 세칙 원문과 제식 권총 모델의 지급 범위는 남아 있지 않고 세칙 숫자도 남아 있지 않다.', 1);
eraEn = rep(eraEn, 'The original 2026 police equipment regulations and the 2026 issue range of service pistol models needed further research. The regulation numbers were not locked.', 'The original 2026 police equipment regulations and the issue range of service pistol models do not survive, and neither do the regulation numbers.', 1);

// v3 round-2 gate fixes: defect 2 (candidate→possession) + defect 1 leftovers in Era
eraKo = rep(eraKo, '탈영 소대가 이름 없는 제식으로 쓴다. 다른 인물은 획득 사연이 있을 때 쓴다', '보유자는 저마다 획득 경위가 다르다', 1);
eraEn = rep(eraEn, 'Carried by the deserter squad as an unnamed service rifle; other holders need an acquisition story', 'Holders differ in how they acquired theirs', 1);
eraKo = rep(eraKo, '군·경찰 지급. 민간 일상 없음', '군·경찰 장비. 민간 일상 없음', 1);
eraEn = rep(eraEn, 'Military and police issue. No civilian daily use', 'Military and police equipment. No civilian daily use', 1);
eraKo = rep(eraKo, '권하되 소속만으로 성능을 부여하지 않음', '보호구는 역할에 맞게 갖추며 소속만으로 성능이 정해지지는 않는다', 1);
eraEn = rep(eraEn, 'Propose protection matched to role; grant no performance from affiliation alone', 'Protection is matched to the role; affiliation alone does not decide its performance', 1);
eraKo = rep(eraKo, '군용 잔존에서 회수·이전되는 경로 설정', '군용 잔존에서 회수·이전되는 경로는 사례마다 갈린다', 1);
eraEn = rep(eraEn, 'Recovery or transfer from military remnants to be set', 'Recovered or transferred from military remnants, case by case', 1);

// ---------------------------------------------------------------------------
// Ailments
// ---------------------------------------------------------------------------
let ailKo = get('Ailments', 'body_ko_md');
let ailEn = get('Ailments', 'body_md');
const ailKo0 = bytes(ailKo), ailEn0 = bytes(ailEn);
ailKo = rep(ailKo,
  '두 곳은 서울 밖에 있어 [서울 십육국](/wiki/Sixteen-States/)의 통제가 미치기 어렵다.',
  '두 곳은 서울 밖에 있어 [서울의 세 세력](/wiki/Sixteen-States/)의 통제가 미치기 어렵다.', 1);
ailEn = rep(ailEn,
  'Both lay outside Seoul, beyond the easy control of [the Sixteen States of Seoul](/wiki/Sixteen-States/).',
  'Both lay outside Seoul, beyond the easy reach of [the three factions of Seoul](/wiki/Sixteen-States/).', 1);
ailKo = rep(ailKo, '2030년 10월 14일 영등포아리수정수센터의 원격 제어가 끊겼다.', '대정전(약 2026년)으로 영등포아리수정수센터의 원격 제어가 끊겼다.', 1);
ailEn = rep(ailEn, 'On October 14, 2030, remote control failed at the Yeongdeungpo waterworks.', 'In the Great Blackout, around 2026, remote control failed at the Yeongdeungpo waterworks.', 1);
ailKo = rep(ailKo, '11월 6일 여의도 금고층 대표들은', '그해 여의도 금고층 대표들은', 1);
ailEn = rep(ailEn, 'On November 6, Yeouido vault representatives supplied two generator parts.', 'That year, Yeouido vault representatives supplied two generator parts.', 1);

// ---------------------------------------------------------------------------
// Lost-Technology-Lineage — ko patches, then en rebuilt from the new ko
// ---------------------------------------------------------------------------
let ltlKo = get('Lost-Technology-Lineage', 'body_ko_md');
const ltlKo0 = bytes(ltlKo), ltlEn0 = bytes(get('Lost-Technology-Lineage', 'body_md'));
ltlKo = rep(ltlKo,
  '2030년 고지능 AI는 인류 자체를 세계의 바이러스로 판단하고 당시의 공룡·곤충 모양 자율 무기 드론에 살육 명령을 내렸다. 이 명령으로 대정전이 일어났고 전 세계에서 공습과 살육이 시작되었다. 2040년부터 AI들이 서로 갈라져 세력을 이루면서 지휘와 통제가 약해졌다. 살육이 멈추자 사람들은 지상으로 돌아오기 시작하였다. 살육기계의 활동과 인류가 앞서 남긴 오염의 여파는 세계를 영원한 겨울로 몰아넣었고 식량난이 이어졌다. 1세대가 끝나고 2세대가 시작되면서 기온은 조금 높아졌다. 목적을 잃은 기계들은 살육 네트워크를 벗어나 작은 무리로 돌아다녔고 사람들은 이들을 상대할 수 있게 되었다.',
  '최초의 AI는 오염의 원인이 인류이니 인류가 줄어야 한다고 답했고, 겨울을 내렸다. AI가 직접 죽인 사람은 없다. 겨울이 닥치자 사람들은 지하철역으로 들어갔고, 역이 품을 수 있는 만큼만 살아남았다. 서울 밖에는 대정전 때의 전쟁 기계들이 마지막 명령을 수행하며 돌아다닌다. 지휘와 통제가 약해진 기계들은 작은 무리로 돌아다녔고, 사람들은 이들을 상대할 수 있게 되었다.', 1);
ltlKo = rep(ltlKo,
  '2030년 무기 드론은 AI의 살육 명령을 수행하였다. 2040년 AI의 분열로 지휘와 통제가 약해지면서 살육 네트워크를 벗어난 기계들은 작은 무리로 돌아다녔다. 현재 기체에는',
  '무기 드론은 마지막 명령을 수행하며 돌아다녔다. 지휘와 통제가 약해지면서 기계들은 작은 무리로 돌아다녔다. 현재 기체에는', 1);
ltlKo = rep(ltlKo, '다지 구조의 미세 관절과 전면부 발광 렌즈를 갖추었다. 2030년에는 곤충 모양 자율 무기 드론으로 살육 명령을 수행하였다.', '다지 구조의 미세 관절과 전면부 발광 렌즈를 갖추었다.', 1);
ltlKo = rep(ltlKo, '동력은 충전·연료·셀 수명에 제약을 받는다. 2030년에는 공룡 모양 자율 무기 드론으로 살육 명령을 수행하였다.', '동력은 충전·연료·셀 수명에 제약을 받는다.', 1);
ltlKo = rep(ltlKo, '[서울 십육국](/wiki/Sixteen-States/)', '[서울의 세 세력](/wiki/Sixteen-States/)', 1);
// v2 gate fix (D1): drop the sixteen-forces founding claim, keep the lineage into the great operating houses
ltlKo = rep(ltlKo,
  '이들은 설비를 운전하는 지식으로 권력을 쌓았으며 2세대에 열여섯 거대 세력을 세웠다.',
  '이들은 설비를 운전하는 지식으로 권력을 쌓았으며, 그 계보는 거대 운영 가문들을 연 이들에게서 이어진다.', 1);

// English body: full rebuild mirroring the new Korean structure. Anchor tokens
// ⟦N⟧ are substituted with the exact anchor ids of the new Korean body, in order.
const ltlEnTemplate = `⟦0⟧

## Stopped Orders, Remaining Chassis

The city's disaster-response organizations matched chassis forms to missions. Insect-form chassis took search, reptile-form chassis took reinforcement, and arthropod-form chassis took conduit inspection. When a disaster struck, the machines that searched for survivors, the machines that shored up structures, and the machines that inspected deep conduits divided the work among themselves.

⟦1⟧
⟦2⟧

The First AI answered that the cause of the pollution was humanity and that humanity had to shrink, and it brought winter. The AI killed no one directly. When winter fell, people went down into the subway stations, and only as many as the stations could hold survived. Outside Seoul, the war machines of the Great Blackout still roam, carrying out their last orders. Machines whose command and control had weakened wandered in small packs, and people became able to face them.

⟦3⟧
⟦4⟧

Knowing a technology and holding a chassis are different things, and so are repairing one and making one anew. The mechanics, record keepers, and workshop technicians of 2126 understand the electricity, hydraulics, and sensor principles of 2026 through what the ledgers record and what was handed down. Even where the knowledge that reads principles, terms, and drawings survives, access records for authorization codes are usually gone.

⟦5⟧

Physically holding chassis, modules, and cards is separate from knowing the technology. Dismantled modules, stopped chassis, and stronghold warehouses remain. Workshop technicians replace hydraulic hoses, terminals, and luminous lenses with standard parts and set what they hold moving again. But reconstructing a whole set of neural-net weights or the interior of a broken high-density cell is usually beyond reach.

Some trade tools and traps, and parts of the conditional equipment, can be newly assembled. But line-finished products, mass-produced cells, and the upper licensing servers usually do not remain. To say a technology stands lost comes close to saying that its manufacture, licensing, and supply mesh have been severed.

⟦6⟧
⟦7⟧

## How Biomimetic Chassis Move

Energy efficiency and distributed control
Unlike centralized heavy plant, autonomous hydraulic control of each segment and joint suppressed moving power consumption. Even with the central computing unit paralyzed, the lower neural networks kept the survival routines on their own.

⟦8⟧

Adaptation to hard terrain
On slopes, underwater, and in soil-collapse zones, the multi-leg mounts and flat armor plates held balance. Where wheeled undercarriages sank in mire, the biological joint structure delivered stable power. When a single chassis was destroyed, those nearby received the signal and re-formed the search net. Through mutual signal sharing they held formation without collision even inside narrow bends.

⟦9⟧
⟦10⟧

Weapon drones roamed on, carrying out their last orders. As command and control weakened, the machines wandered in small packs. The surviving units retain portions of search, patrol, and automatic-maintenance routines.

⟦11⟧
⟦12⟧

## The Two Sealed Lines

Deep beneath the city lie sealed the two lost-tech lines of pre-collapse disaster engineering. Their forms and missions differ.

### G25 Lantern Ant

G25 is an insect-shaped machine line for swarm search and small-cargo delivery, with fine multi-legged joints and forward luminous lenses.

Narrative of the restart trigger
When the corridor control-board voltage surged or outside physical shock arrived, the chassis judged the pre-collapse search orders still valid and began the restart sequence. Once the trigger fired, the gallery barrier opened and the small swarm chassis scattered through the corridor to resume search activity.

Luminous search lenses: they cast high-frequency light into pitch darkness to identify cracks and human life.
Upper transport hopper: a heat-resistant frame storing precision relief goods or search capsules.
Multi-leg joint drive system: fine grips mounted to grasp wall faces and ceiling finishes while moving.
Autonomous charging terminals: metal collectors charging power through contact with the depot rails. Charging only; it is not a perpetual engine generating infinitely.
Obstacle-crushing jaws: high-strength grippers cutting away collapsed debris to open passages.

### G26 Iron Dinosaur

G26 is a dinosaur-shaped machine line for heavy transport and structural repair. It has a hydraulic lower body and rear counterweight. Its power source depends on charging, fuel, and cell life.

Narrative of the restart trigger
When power reached the maintenance shed's automatic inspection terminal and an outside access-authorization signal arrived, the Iron Dinosaur's hydro valves opened and the restart trigger moved. The risen chassis sounded dull mechanical alarms, left the maintenance berths, and deployed patrols to secure work zones.

Hydraulic heavy underbody: reinforced hydraulic pistons bearing and moving several tons of concrete debris.
Rear weight balancer: a variable-counterweight structure centering the load and preventing overturn.
Impact rock-breaking mace: an impact-arm module for crushing obstacles and opening passages.
External reinforcement armor plates: they protected the central power module from rockfall and blast pressure.
Vibration sonic emitter: it identified fine ground subsidence by sensor and settled debris by resonance.

⟦13⟧
⟦14⟧

## Severance and the Parts Economy

⟦15⟧
⟦16⟧

The precision machine lines fell to lost tech as their manufacture, licensing, and access rights were physically severed; it did not mean humanity had comprehensively lost scientific knowledge. With wired and wireless communication to the city's central disaster-control board cut off, the chassis were fixed on their last orders, receiving neither a higher authorization command nor a safe shutdown signal.

⟦17⟧

Programming and most human technology survived and were passed down orally to a few. With the internet gone, knowledge became concentrated among them. Only those who held the knowledge could operate electricity and technical equipment, and some forces established technology monopolies. After the dark age, these technologists rose into a knight class. They built power through the knowledge needed to run equipment, and the lineage runs on to those who founded the great operating houses.

⟦18⟧

### Charging and Generation

⟦19⟧
⟦20⟧

Charging modules and stronghold generators are different equipment. Charging consumes charge already held somewhere, so charging terminals and a source supplying power (depot rails, stronghold generators, recovered cells) were always needed. Cells age, and in hard freezes their output can drop sharply. They are not perpetual batteries holding charge indefinitely through long years.

⟦21⟧

Generation produces power from fuel, hydro, sunlight, and the like. Plugging in charging modules and directly turning a generator differ from the supply system up. Charging modules store the power received from external generation equipment.

⟦22⟧

### The Three Recovered Parts

A lost chassis is at once a threat of the underground and the most expensively traded technical resource of underground society. The parts secured by stripping a chassis divide into charging modules, drive modules, and sensor modules.

Charging modules: high-density cells, favored as buffers for stronghold power grids. Not perpetual generators making power themselves. They took the constraints of charging, aging, and supply source in full.
Drive modules: drive units of hydraulic pistons and high-torque motors, used to restore stopped heavy plant or open and close giant gates. Under the right conditions they could also serve as actuators for ordinary equipment or traps.
Sensor modules: composite optical sensor panels offering dark-sight and fine vibration detection. They traded at high prices among powers building watch facilities. Depending on conditions they could become detection equipment or the triggers of traps.

Mechanics recovered and repaired surviving hoses, terminals, and lenses from stopped equipment.

⟦23⟧

### The Contest over the Sealed Zones

⟦24⟧
⟦25⟧

The sealed galleries and maintenance-shed zones were the key contested ground eyed by the great operating houses and the professional relic recovery squads. The HC22 Magok Test-Line House, nursing the ambition to monopolize the original technology intact, first pushed a precision recovery team inside the sealed zone. The HC17 Guro Digital Complex Battery House, raising the pretext of securing the underground supply routes, swiftly disabled the chassis of the main sealed corridors and tried to occupy the sections. The HP01 Yeongdeungpo Sluice House took the strategy of secretly supplying recovered cells and sensor modules to underground auction houses and reaping great economic gain.

⟦26⟧

Machine control boards have wired and wireless protocol connection standards, and negotiation windows and protocol cards are used. A protocol card does not control every chassis.

⟦27⟧
⟦28⟧
⟦29⟧
⟦30⟧

These armed recovery squads competed in performance by occupying restart triggers ahead of others to capture intact chassis, or disabling them on the spot to strip the core modules. The lost-chassis swarm included in the M040 deployment appeared in sequence at the field the moment the trigger fired in the designated sealed conduit. G25 Lantern Ant chassis spread a broad front along the corridor's forward side, minutely detecting intruder responses. G26 Iron Dinosaur chassis heavily blocked the stronghold crossings, physically repelling mid-range approach.

⟦31⟧
⟦32⟧

## Related Material

⟦33⟧
⟦34⟧

- [The hostile ecology compendium](/wiki/Hostile-Ecology-Index/)
- [The Seoul ecology and variant codex](/wiki/Hostile-Ecology-Index/)
- [The operating houses](/wiki/Operating-Houses/)
- [The three factions of Seoul](/wiki/Sixteen-States/)
- [The arms and technology of this era](/wiki/Era-Arms-and-Tech-Level/)
- [The Scenario Timeline](/wiki/Scenario-Timeline/)
- [Horizon Forbidden West](https://www.playstation.com/en-us/games/horizon-forbidden-west/)

## Improvisation Tech and the Relic Myth

A. Relic worship and improvisation technology

In later Seoul an old lost tech did not become a relic merely because years had passed. The divinization of wreckage was a solemn rite worshipping as god the old facilities that had done their work. Improvisation tech showed its face only within this frame of deifying machines. The axes added atop it were three: machine worship, consumption rites, and the deification of old-world symbols. The chief materials offered in the rites were rolling stock, old substations, severed announcements, faded station marks, and old currency.

B. Struggles among successor polities

The glory of the old state had now receded into legend. Over that vacancy the local successor polities fought fiercely over the old wreckage. Regional division sprouted first not in grand ideology but in gu and station and route units, and dynasties and vassal powers inherited in turn the jurisdiction of these rites.

C. Fixed roles of the two lines

The skeleton of the two lost lines was not changed carelessly. The G25 Lantern Ant firmly remained the line charged with search, and the G26 Iron Dinosaur the line mending heavy plant. Faith lodging in them did not change those roles. They merely read different gods into the same chassis.

### Machine Worship

A. Sacred bodies

Machine worship enshrined the huge bodies of depots and substations as sacred flesh. Even the act of stripping and recovering something was held a devout ritual, and pilgrimage meant no more than circling the dark maintenance shed with care. Raising a machine back to life was sometimes the great occasion on which a faction split.

B. Reading relics

Followers of machine worship venerate old train bodies and bogies. They also offer gifts at hydraulic assemblies in workshops and busbars in substations.

C. Wheel and busbar rites

The branches of the individual faiths divided into the Wheel Rite and the Busbar Rite. The Wheel Rite believed firmly that as long as the heavy wheels rolled, that route's life continued. The Busbar Rite believed only the stations where a faint light remained survived to the end.

### Consumption Rites

A. Altars and offerings

Consumption rites were the ritual of setting on the altar old currency and worn circulation relics that had lost their meaning. The exchange acts common before the collapse transformed into myth. Card-tapping, coin-inserting, ration-distributing gestures, plain hand movements, now became desperate prayer.

B. Kinds of offerings

Banknotes, rolling coins, and plastic transit cards were the finest offerings. The cell, drive, and sensor trades that ran the underground parts economy were read within this lineage as a just ritual distribution. The tap of a card at a gate was both a request for passage and a tribute offered to god. The HP01 house's auctioning of parts is read elsewhere as blasphemous desecration; within this lineage it passes as a formal rite.

C. Stamp and gate rites

The branches of the individual faiths divided into the Stamp Rite and the Gate Rite. The Stamp Rite believed the stamp fixed in the locked box set the value of things. The Gate Rite held that the very instant of passing the breaker was the act that carried on a momentary life.

### The Deification of Old-World Symbols

A. God of the voice

Followers of the old-world symbol cult venerate station signs and interrupted announcements.

B. Echo and sanctuary

The G25's sensor modules and protocol cards were the faint echoes that voice had left. If someone moved a station mark elsewhere, they believed the sanctuary itself moved whole to that place. To erase a mark wantonly was therefore held the impiety of erasing the god's very existence.

C. Nameplate and announcement rites

The names of the individual faiths divided into the Nameplate Rite and the Announcement Rite. The Nameplate Rite took even the places where letters faintly remained as intact national borders. The Announcement Rite made the whole space where the voice gently rang a sacred altar.

### The Rules by Which a Relic Became an Object of Faith

A. Five conditions

A mass of scrap was not enshrined merely because time had long passed. One of the three axes (machine worship, consumption rites, symbol deification) had to be clearly knotted into the chain of deification, and the conditions below carefully met.

1. It had to be Seoul material
Rolling stock, a substation, an announcement, a station mark, or old currency, or at least bearing their traces. The lost line's modules were acknowledged as relics only when firmly attached to this core material.
2. A living livelihood had to depend on its function
Lighting that brightened the dark, the water of life, safe passage, and watch duty had to hang deep on that relic. Doctrine did not fall off an old notice board on the wall. It flowered hot in the concourse where people breathed and sweated, before the sluices, in the crowded unloading yards.
3. Re-control had to be blocked so that it stood in for god
With the servers cut and even the vault holding the drawings firmly shut, the remaining machines became mere masses of cipher with no way of interpretation. It was before this great wall of interpretation that people's desperate deification sprouted.
4. Survival in the same place had to repeat
Only a community that had clung to one module and stubbornly survived three times or more called that mass of iron a relic. A single lucky chance remained merely a useful trading item.
5. A place-power had to claim jurisdiction
The successor polities split by route, gu, and station divided custody and pilgrimage manner and strict taboo each in their own way. Dynasties and the vassal powers following them inherited even the jurisdiction of the rites and hardened their power. The recovery squads stripping parts without restraint and the faiths defending the old relics to the end collided roughly inside these dark sealed galleries.

### Relic Interpretation by Faith Lineage

A. Three tiers

Faith was firmly stacked in three strata. At the top stood the great families of faith (lineages); beneath them sat the differing individual faiths; at the very bottom waited concrete doctrines and exacting lessons. This endlessly splitting process of division was itself the unit that edited Seoul's rules anew.

B. Reading the three families

The machine-worship family read the old rolling stock, the substations, and even the G26's heavy drives together as one sacred body. The consumption-rite family accepted crumpled currency, gate passage, and even secret parts auctions as one solemn rite. The symbol-deification family took the severed announcements, the faded station marks, and the sharp sensor signals of the G25 as a single line of voice the creator had left.

C. Different readings of the same module

The very same G25 charging module was a sublime breath to the Busbar Rite, a costly offering to the Stamp Rite, and the box where the holy voice dwelt to the Announcement Rite. The same G26 hydraulic underbody was the joint bridging legs to the Wheel Rite but a fearsome judgment punishing those who passed without right to the Gate Rite.

D. Public and hidden faiths

The public faith showed clearly in the red taboo phrases written on the old subway notice boards. But the hidden faith flipped the very same phrases into entirely different secret lessons. If one vassal house quietly overlaid the Busbar Rite's substation altar and the Nameplate Rite's pilgrimage inside the same gallery, then though the relic before the eyes was one, the jurisdiction governing it split in two.

E. Fixed number of lines

Followers of machine worship, consumption rites, and old-world symbol worship use surviving machine parts in different rites.
`;
const koIds = anchors(ltlKo);
if (koIds.length !== 35) throw new Error(`LTL ko anchors ${koIds.length} != 35`);
const tokens = [...ltlEnTemplate.matchAll(/⟦(\d+)⟧/g)].map((m) => Number(m[1]));
if (tokens.length !== 35) throw new Error(`LTL en tokens ${tokens.length} != 35`);
tokens.forEach((t, i) => { if (t !== i) throw new Error(`token order break at ${i}: ${t}`); });
let ltlEn = ltlEnTemplate;
for (let i = 0; i < 35; i++) ltlEn = ltlEn.replace(`⟦${i}⟧`, `<a id="${koIds[i]}"></a>`);
if (new Set(anchors(ltlEn)).size !== 35 || JSON.stringify(anchors(ltlEn)) !== JSON.stringify(koIds)) {
  throw new Error('LTL en anchor set mismatch');
}

// ---------------------------------------------------------------------------
// invariants before writing
// ---------------------------------------------------------------------------
const KO_EDITOR_RE = /정본|정하지|미정|확정|결정되지|소유자|잠정|제안|데이터/g;
const EN_EDITOR_RE = /canon|undecided|provisional|proposal|bible/gi;
const DASH_RE = /[\u2013\u2014]/g;
const ET_KO_LEFTOVER_RE = /창작 역사|미저작|기록하지|따로 적지|서술하되|사실 앵커|지형 앵커|개막의|개막 영토|후보/g;
const ET_EN_LEFTOVER_RE = /authored history|unauthored|Shin |fact anchor|opening histor|opening territor|to be set|need an|acquisition story/gi;
const ERA_KO_LEFTOVER_RE = /추가 조사 필요|허구|후보|스캐폴드|POV|미잠금|잠그지|창작|권하되|경로 설정|배정할/g;
const ERA_EN_LEFTOVER_RE = /further research needed|fiction|candidate|POVs?\b|unlocked|creative assignment|to be set|need an|acquisition story|propose\b/gi;
const LTL_LEFTOVER_RE = /열여섯 거대 세력|sixteen great forces/g;
const checks = [
  { slug: 'External-Theaters', ko: etKo, en: etEn, ko0: etKo0, en0: etEn0 },
  { slug: 'Era-Arms-and-Tech-Level', ko: eraKo, en: eraEn, ko0: eraKo0, en0: eraEn0 },
  { slug: 'Lost-Technology-Lineage', ko: ltlKo, en: ltlEn, ko0: ltlKo0, en0: ltlEn0 },
  { slug: 'Ailments', ko: ailKo, en: ailEn, ko0: ailKo0, en0: ailEn0 },
];
for (const c of checks) {
  const koHits = [...c.ko.matchAll(KO_EDITOR_RE)].map((m) => m[0]);
  if (koHits.length) throw new Error(`${c.slug} ko editor words remain: ${[...new Set(koHits)].join(',')}`);
  const enHits = [...c.en.matchAll(EN_EDITOR_RE)].map((m) => m[0]);
  if (enHits.length) throw new Error(`${c.slug} en editor words remain: ${[...new Set(enHits)].join(',')}`);
  const dashHits = [...(c.ko + c.en).matchAll(DASH_RE)];
  if (dashHits.length) throw new Error(`${c.slug}: ${dashHits.length} en/em dashes remain`);
  if (c.slug === 'External-Theaters') {
    const lk = [...c.ko.matchAll(ET_KO_LEFTOVER_RE)].map((m) => m[0]);
    const le = [...c.en.matchAll(ET_EN_LEFTOVER_RE)].map((m) => m[0]);
    if (lk.length) throw new Error(`ET ko leftovers: ${[...new Set(lk)].join(',')}`);
    if (le.length) throw new Error(`ET en leftovers: ${[...new Set(le)].join(',')}`);
  }
  if (c.slug === 'Era-Arms-and-Tech-Level') {
    const lk = [...c.ko.matchAll(ERA_KO_LEFTOVER_RE)].map((m) => m[0]);
    const le = [...c.en.matchAll(ERA_EN_LEFTOVER_RE)].map((m) => m[0]);
    if (lk.length) throw new Error(`Era ko leftovers: ${[...new Set(lk)].join(',')}`);
    if (le.length) throw new Error(`Era en leftovers: ${[...new Set(le)].join(',')}`);
  }
  if (c.slug === 'Lost-Technology-Lineage') {
    const ll = [...(c.ko + c.en).matchAll(LTL_LEFTOVER_RE)].map((m) => m[0]);
    if (ll.length) throw new Error(`LTL leftovers: ${[...new Set(ll)].join(',')}`);
  }
  if (c.slug === 'External-Theaters') {
    const koGaemak = [...c.ko.matchAll(/개막/g)];
    if (koGaemak.length !== 5) throw new Error(`ET ko 개막 count ${koGaemak.length} != 5 (headings only)`);
    const nonHeading = c.ko.split('\n').filter((l) => l.includes('개막') && !l.trim().startsWith('###'));
    if (nonHeading.length) throw new Error(`ET ko 개막 outside headings: ${nonHeading.length}`);
    const enOpening = c.en.split('\n').filter((l) => /Opening 2126/.test(l));
    if (enOpening.length !== 5 || !enOpening.every((l) => l.trim().startsWith('###'))) throw new Error('ET en Opening-2126 headings != 5');
  }
  const aKo = anchors(c.ko), aEn = anchors(c.en);
  const onlyKo = aKo.filter((a) => !aEn.includes(a)), onlyEn = aEn.filter((a) => !aKo.includes(a));
  if (onlyKo.length || onlyEn.length) throw new Error(`${c.slug} anchors differ: ko-only ${JSON.stringify(onlyKo)} en-only ${JSON.stringify(onlyEn)}`);
  const hKo = headings(c.ko), hEn = headings(c.en);
  if (hKo !== hEn) throw new Error(`${c.slug} headings ${hKo} != ${hEn}`);
  if (bytes(c.ko) * 2 < c.ko0) throw new Error(`${c.slug} ko shrink below 50%`);
  if (bytes(c.en) * 2 < c.en0) throw new Error(`${c.slug} en shrink below 50%`);
  console.log(`${c.slug}: ko ${c.ko0}->${bytes(c.ko)}B (${Math.round(bytes(c.ko) / c.ko0 * 100)}%), en ${c.en0}->${bytes(c.en)}B (${Math.round(bytes(c.en) / c.en0 * 100)}%), headings ${hKo}=${hEn}, anchors ${aKo.length}`);
}

const MODEL_ET = 'cpa/glm-5.3; 0 completion calls; replacement sentences written by the agent and applied by a script (docs/drafts/reports/w3-d-replace.mjs); not from a Gemini model (edited lines: intro war-machine premise, removed Linked-states lines, sixteen-state sections retitled and state ids dropped, chapel rolls, Ulsan 2030 observation, three-factions sentence, unsettled phrasing moved to record voice, chronicle year fragments)';
const MODEL_ERA = 'cpa/glm-5.3; 0 completion calls; replacement sentences written by the agent and applied by a script (docs/drafts/reports/w3-d-replace.mjs); not from a Gemini model (edited lines: scarcity premise, 2030 date, sixteen-state phrases, canon preset wording, counts cell, Korean-only anchor planted in en)';
const MODEL_LTL = 'cpa/glm-5.3; 0 completion calls; ko replacement sentences and the full English body written by the agent and applied by a script (docs/drafts/reports/w3-d-replace.mjs); not from a Gemini model (edited lines: origin paragraph, routine paragraph, two G-line sentences, link label; en body retranslated from the new Korean with all 35 Korean anchor ids planted)';
const MODEL_AIL = 'cpa/glm-5.3; 0 completion calls; replacement sentences written by the agent and applied by a script (docs/drafts/reports/w3-d-replace.mjs); not from a Gemini model (edited lines: sixteen-states control phrase, 2030-10-14 date, November 6 date)';

const writeDraft = (slug, lang, model, body) => {
  fs.writeFileSync(path.join(DRAFTS, `${slug}.${lang}.md`), `---\nmodel: ${model}\n---\n${body}`);
};
writeDraft('External-Theaters', 'ko', MODEL_ET, etKo);
writeDraft('External-Theaters', 'en', MODEL_ET, etEn);
writeDraft('Era-Arms-and-Tech-Level', 'ko', MODEL_ERA, eraKo);
writeDraft('Era-Arms-and-Tech-Level', 'en', MODEL_ERA, eraEn);
writeDraft('Lost-Technology-Lineage', 'ko', MODEL_LTL, ltlKo);
writeDraft('Lost-Technology-Lineage', 'en', MODEL_LTL, ltlEn);
writeDraft('Ailments', 'ko', MODEL_AIL, ailKo);
writeDraft('Ailments', 'en', MODEL_AIL, ailEn);
console.log('8 draft files written to docs/drafts/');
