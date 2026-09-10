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
  ['HC01', '삼성전자'],
  ['HC02', '현대자동차'],
  ['HC03', 'LG생활건강'],
  ['HC04', 'SK에너지'],
  ['HC05', '북문지식원'],
  ['HC06', '쿠팡'],
  ['HC07', '포스코'],
  ['HC08', '한화에어로스페이스'],
  ['HC09', '롯데쇼핑'],
  ['HC10', 'CJ제일제당'],
  ['HC11', 'CJ대한통운'],
  ['HC12', '현대중공업'],
  ['HC13', 'HD현대건설'],
  ['HC14', '신한지주'],
  ['HC15', '네이버'],
  ['HC16', 'KT'],
  ['HC17', 'LG에너지솔루션'],
  ['HC18', 'HMM'],
  ['HC19', '호텔신라'],
  ['HC20', 'HYBE'],
  ['HC21', '카카오'],
  ['HC22', '테슬라코리아'],
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

export const getGroupDossierFilename = (id) => `Hostile-Group-${id}.md`;

export const ISOMETRIC_DIAGRAM_ASSETS = Object.freeze([
  'world-atlas-isometric.svg',
  'house-influence-isometric.svg',
  'hostile-ecology-isometric.svg',
]);

export const WIKI_PALETTE = Object.freeze({
  paper: '#F6F4EF',
  ink: '#172A46',
  blue: '#356FB6',
  teal: '#2E8C87',
  red: '#C84D4D',
});

export const ISOMETRIC_CAMERA = Object.freeze({
  projection: 'orthographic',
  yawDegrees: 45,
  pitchDegrees: 35.264,
  tileMeters: 1.5,
  cardinals: Object.freeze(['북', '동', '남', '서']),
});

export const SUBWAY_SURFACE_LAYERS = Object.freeze([
  ['LY01', '지상 폐허'],
  ['LY02', '역사 대합실'],
  ['LY03', '승강장·선로'],
  ['LY04', '환승 통로'],
  ['LY05', '심층 터널'],
  ['LY06', '차량기지 인접 거점'],
].map(([id, name]) => Object.freeze({ id, name })));

export const DIAGRAM_REQUIRED_FIELDS = Object.freeze([
  'id', 'asset', 'title', 'desc', 'tile_px', 'content_box', 'callout_zones',
  'layers', 'nodes', 'edges', 'legend', 'wiki_links', 'camera', 'source_kind',
]);

export const DIAGRAM_NODE_FIELDS = Object.freeze([
  'id', 'kind', 'ref', 'grid', 'layer', 'label_priority', 'callout', 'source_kind',
]);

export const DIAGRAM_EDGE_FIELDS = Object.freeze([
  'id', 'from', 'to', 'kind', 'relation', 'source_kind',
]);
