export const ATLAS_SCHEMA = 'world-narrative-atlas.v1';
export const ATLAS_OWNER = 'wiki-world';
export const SOURCE_KINDS = Object.freeze(['verified', 'inference', 'original-fiction']);

export const STATES = Object.freeze([
  ['S01', '여의신정수문정부'],
  ['S02', '서남제작동맹'],
  ['S03', '마곡연구평의회'],
  ['S04', '뚝도공방연합'],
  ['S05', '암사고덕상수단'],
  ['S06', '도성기록청'],
  ['S07', '용산철도후국'],
  ['S08', '노량진남관상회'],
  ['S09', '상암송신공사'],
  ['S10', '북산피난연맹'],
  ['S11', '창동차륜방'],
  ['S12', '신내망우환승시'],
  ['S13', '약령의정동맹'],
  ['S14', '아차구의관문국'],
  ['S15', '가락잠실배급국'],
  ['S16', '수서강남협약도시'],
].map(([id, name]) => Object.freeze({ id, name })));

export const STATE_BY_ID = Object.freeze(Object.fromEntries(STATES.map((s) => [s.id, s])));
export const STATE_BY_NAME = Object.freeze(Object.fromEntries(STATES.map((s) => [s.name, s])));

export const CORPORATE_HOUSES = Object.freeze([
  ['HC01', '청람전자원'],
  ['HC02', '해륜기동문'],
  ['HC03', '백광생활과학가'],
  ['HC04', '통맥에너지연합'],
  ['HC05', '북문지식원'],
  ['HC06', '골목연결국'],
  ['HC07', '해동제철성'],
  ['HC08', '성화궤도방위문'],
  ['HC09', '도성생활유통가'],
  ['HC10', '서부식문화동맹'],
  ['HC11', '백야배송단'],
  ['HC12', '거도중공회'],
  ['HC13', '도성건축연맹'],
  ['HC14', '여의장부원'],
].map(([id, name]) => Object.freeze({ id, name })));

export const CIVIC_HOUSES = Object.freeze([
  ['HP01', '아리수수문가'],
  ['HP02', '환승선로문'],
  ['HP03', '공동의료원가'],
  ['HP04', '도성기록법가'],
  ['HP05', '북산귀환회'],
  ['HP06', '약령치유문'],
  ['HP07', '한강교량공회'],
  ['HP08', '시장냉동상단'],
  ['HP09', '데이터신탁가'],
  ['HP10', '외교통역문'],
].map(([id, name]) => Object.freeze({ id, name })));

export const LOCKED_HOUSES = Object.freeze([...CORPORATE_HOUSES, ...CIVIC_HOUSES]);

export const THEATERS = Object.freeze([
  ['XT01', '임진관문전구'],
  ['XT02', '서해곡창전구'],
  ['XT03', '해협삼로전구'],
  ['XT04', '두만극동전구'],
  ['XT05', '원양신탁전구'],
].map(([id, name]) => Object.freeze({ id, name })));

export const HOSTILE_GROUPS = Object.freeze([
  ['G01', '범람멧돼지군', 'animal-urban'],
  ['G02', '전파까마귀떼', 'animal-urban'],
  ['G03', '유기견철군', 'animal-urban'],
  ['G04', '하수너구리족', 'animal-urban'],
  ['G05', '환승쥐군락', 'animal-urban'],
  ['G06', '철새습지포식군', 'animal-urban'],
  ['G07', '전해질화상군', 'humanoid-mutant'],
  ['G08', '클린룸변이자', 'humanoid-mutant'],
  ['G09', '저온포자숙주', 'humanoid-mutant'],
  ['G10', '침수곰팡이호흡단', 'humanoid-mutant'],
  ['G11', '맞춤의료잔존체', 'humanoid-mutant'],
  ['G12', '미세섬유피부군', 'humanoid-mutant'],
  ['G13', '야간분류군', 'rogue-robot'],
  ['G14', '유령배차대', 'rogue-robot'],
  ['G15', '돌봄순환체', 'rogue-robot'],
  ['G16', '도면유령기계단', 'rogue-robot'],
  ['G17', '감시궤도군', 'rogue-robot'],
  ['G18', '폐선보수열차군', 'rogue-robot'],
  ['G19', '냉각수색인균체', 'biomechanical'],
  ['G20', '철비늘군체', 'biomechanical'],
  ['G21', '통신근균체', 'biomechanical'],
  ['G22', '폐전지금속군락', 'biomechanical'],
  ['G23', '저온포자막', 'biomechanical'],
  ['G24', '의료조직기계군', 'biomechanical'],
].map(([id, name, category]) => Object.freeze({ id, name, category })));

export const COMPANY_TOKENS = Object.freeze([
  '삼성전자', 'Samsung', '현대자동차', 'Hyundai Motor', 'LG전자', 'SK하이닉스',
  '카카오', '네이버', 'NAVER', '포스코', 'POSCO', '한화에어로스페이스',
  '기아자동차', '쿠팡', 'Coupang', '롯데케미칼', '현대중공업',
]);

export const HOUSE_REQUIRED_FIELDS = Object.freeze([
  'id', 'display_name', 'house_class', 'status', 'owner', 'source_kind',
  'source_anchors', 'revision', 'projection_targets', 'states',
  'exclusive_state_ids', 'charter', 'membership', 'succession', 'regency',
  'protected_guests', 'ai_stewardship', 'obligations', 'arcs', 'prose',
]);

export const STORY_SECTION_KEYS = Object.freeze([
  '정체성·출신',
  '붕괴 전 삶',
  '가문·기업·공동체',
  '붕괴의 상처',
  '생존 전환점',
  '현재 지위',
  '비밀·빚·죄책감',
  '관계 공동과거',
  '3막 개인 서사선',
  '분기 결말',
]);

export const PROJECTION_FILES = Object.freeze({
  houses: 'Operating-Houses.md',
  theaters: 'External-Theaters.md',
  synthetics: 'Synthetic-Actors.md',
  storyManifest: 'Story-Batch-Manifest.md',
  hostileIndex: 'Hostile-Ecology-Index.md',
  monsterManifest: 'Monster-Batch-Manifest.md',
  chronology: 'Regional-Physical-AI-Arcs.md',
  relationLedger: 'World-Relation-Ledger.md',
  expansionIndex: 'World-Expansion-Index.md',
});
