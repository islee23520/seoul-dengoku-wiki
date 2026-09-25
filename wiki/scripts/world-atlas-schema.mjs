// Wiki-owned contract for lore/World-Narrative-Atlas.md and its projections.
export const ATLAS_SCHEMA = 'world-narrative-atlas.v1';
export const UNAFFILIATED_FIELDS = Object.freeze(['name', 'character_id']);
export const FROZEN_HUMAN_COUNT = 422;

export const STATES = Object.freeze([
  ['S01', '수문국'],
  ['S02', '규격맹'],
  ['S03', '태욱그룹'],
  ['S04', '명부교회'],
  ['S05', '동방사'],
  ['S06', '대한민국정부'],
  ['S07', '환적국'],
  ['S08', '중앙기술보존원'],
  ['S09', '여의도출자연합회'],
  ['S10', '안국총림'],
  ['S11', '성하그룹'],
  ['S12', '신내운수'],
  ['S13', '흰십자단'],
  ['S14', '아관사'],
  ['S15', '명동대교구'],
  ['S16', '정동노총'],
].map(([id, name]) => Object.freeze({ id, name })));

export const STATE_BY_ID = Object.freeze(Object.fromEntries(STATES.map((s) => [s.id, s])));

export const COMPANY_TOKENS = Object.freeze([
  '삼성전자', 'Samsung', '현대자동차', 'Hyundai Motor', 'LG생활건강', 'LG전자',
  'LG에너지솔루션', 'SK에너지', 'SK하이닉스', '카카오', '네이버', 'NAVER',
  '포스코', 'POSCO', '한화에어로스페이스', '기아자동차', '쿠팡', 'Coupang',
  '롯데쇼핑', '롯데케미칼', 'CJ제일제당', 'CJ대한통운', '현대중공업',
  'HD현대건설', '신한지주', 'HMM', '호텔신라', 'HYBE', '테슬라코리아',
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
