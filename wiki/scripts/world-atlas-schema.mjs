// Subset of TOOL/tools/wiki/world-atlas-schema.mjs used to project lore/World-Narrative-Atlas.md.
// The wiki submodule has no TOOL sibling; these constants stay byte-compatible with that module.
export const ATLAS_SCHEMA = 'world-narrative-atlas.v1';

export const STATES = Object.freeze([
  ['S01', '급수계약정'],
  ['S02', '규격동맹'],
  ['S03', '양재기공주식회사'],
  ['S04', '설교명부정'],
  ['S05', '호위보호정'],
  ['S06', '대한민국정부'],
  ['S07', '선로후계정'],
  ['S08', '교헌필사정'],
  ['S09', '여의도출자연합회'],
  ['S10', '승가구휼정'],
  ['S11', '서초전산그룹'],
  ['S12', '중립호송시'],
  ['S13', '의약중립맹'],
  ['S14', '관문군정'],
  ['S15', '본당인준정'],
  ['S16', '정동노동총연맹'],
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
