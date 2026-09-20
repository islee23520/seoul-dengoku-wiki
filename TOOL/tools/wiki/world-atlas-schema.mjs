export const ATLAS_SCHEMA = 'world-narrative-atlas.v1';
export const ATLAS_OWNER = 'wiki-world';
export const SOURCE_KINDS = Object.freeze(['verified', 'inference', 'original-fiction']);

export const STATES = Object.freeze([
  ['S01', '급수계약정'],
  ['S02', '규격동맹'],
  ['S03', '현대자동차주식회사'],
  ['S04', '대한예수교장로회'],
  ['S05', '호위보호정'],
  ['S06', '대한민국정부'],
  ['S07', '선로후계정'],
  ['S08', '원불교'],
  ['S09', '전국경제인연합회'],
  ['S10', '대한불교조계종'],
  ['S11', '삼성그룹'],
  ['S12', '중립호송시'],
  ['S13', '의약중립맹'],
  ['S14', '관문군정'],
  ['S15', '천주교 서울대교구'],
  ['S16', '전국민주노동조합총연맹'],
].map(([id, name]) => Object.freeze({ id, name })));

export const STATE_BY_ID = Object.freeze(Object.fromEntries(STATES.map((s) => [s.id, s])));
export const STATE_BY_NAME = Object.freeze(Object.fromEntries(STATES.map((s) => [s.name, s])));

export const CORPORATE_HOUSES = Object.freeze([
  ['HC01', '여의도전산가'],
  ['HC02', '신정차륜가'],
  ['HC03', '마곡생명가'],
  ['HC04', '뚝섬열원가'],
  ['HC05', '북한산보국문기록가'],
  ['HC06', '노량진배달가'],
  ['HC07', '구로합금가'],
  ['HC08', '창동방호가'],
  ['HC09', '서울역재고가'],
  ['HC10', '마곡종자가'],
  ['HC11', '용산호송가'],
  ['HC12', '금천구청중기가'],
  ['HC13', '수서건설가'],
  ['HC14', '여의도장부가'],
  ['HC15', '디지털미디어시티색인가'],
  ['HC16', '용산교환가'],
  ['HC17', '구로디지털단지전지가'],
  ['HC18', '용산선박가'],
  ['HC19', '동대입구객사가'],
  ['HC20', '디지털미디어시티공연가'],
  ['HC21', '디지털미디어시티결제가'],
  ['HC22', '마곡시험선가'],
].map(([id, name]) => Object.freeze({ id, name })));

export const CIVIC_HOUSES = Object.freeze([
  ['HP01', '영등포수문가'],
  ['HP02', '용산선로문'],
  ['HP03', '청량리의료원가'],
  ['HP04', '서울역기록법가'],
  ['HP05', '북한산보국문귀환회'],
  ['HP06', '제기동치유문'],
  ['HP07', '한강진교량공회'],
  ['HP08', '노량진냉동상단'],
  ['HP09', '디지털미디어시티신탁가'],
  ['HP10', '이태원통역문'],
].map(([id, name]) => Object.freeze({ id, name })));

export const LOCKED_HOUSES = Object.freeze([...CORPORATE_HOUSES, ...CIVIC_HOUSES]);

export const THEATERS = Object.freeze([
  ['XT01', '임진강관문전구'],
  ['XT02', '서해곡창전구'],
  ['XT03', '대한해협전구'],
  ['XT04', '두만강극동전구'],
  ['XT05', '인천신탁전구'],
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
  ['G25', '등불개미군', 'rogue-robot'],
  ['G26', '화석포효군', 'rogue-robot'],
  ['G27', '심층삼엽군', 'rogue-robot'],
].map(([id, name, category]) => Object.freeze({ id, name, category })));

export const COMPANY_TOKENS = Object.freeze([
  '삼성전자', 'Samsung', '현대자동차', 'Hyundai Motor', 'LG생활건강', 'LG전자',
  'LG에너지솔루션', 'SK에너지', 'SK하이닉스', '카카오', '네이버', 'NAVER',
  '포스코', 'POSCO', '한화에어로스페이스', '기아자동차', '쿠팡', 'Coupang',
  '롯데쇼핑', '롯데케미칼', 'CJ제일제당', 'CJ대한통운', '현대중공업',
  'HD현대건설', '신한지주', 'HMM', '호텔신라', 'HYBE', '테슬라코리아',
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
  chronology: 'Regional-Physical-AI-Arcs.md',
  relationLedger: 'World-Relation-Ledger.md',
  expansionIndex: 'World-Expansion-Index.md',
});

export const getGroupDossierFilename = (id) => `Hostile-Group-${id}.md`;

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
