#!/usr/bin/env node
// v3 인물 적용기 (계획 .omo/plans/wiki-lore-rebuild-v3.md 과제 26, 규칙의 정본은 docs/design/v3/07-people-and-war.md 8~10절).
// 입력 docs/drafts/people/{government,free-city,arc}.jsonl(07장 9.1절)을 읽어 REDESIGN 칸만 다시 쓴다.
//   050 wiki_person 열, 090 person_detail json/json_ko(Kinship basis 포함), 110 산 사람·선대 노드의 timeline/affiliation/sourceRefs,
//   115 retainer_graph 한 행(주군 칸에서 다시 만듦), 123 map_holding, 100 nonkorean_family basis와 clan 분파 이름·상태,
//   public/portrait-tokens/*.json의 stateId·facts.role·옷과 장신구 문구(07장 9.2절 portrait 표)와 textToImage.
// 고정 사실(README, scripts/pages/v3-fixed-facts.mjs)은 쓰지 않는다. 입력 줄에 고정 키가 있으면 그 줄을 거부하고,
// 쓰기 직전에 고정 칸이 바뀌었는지 다시 대조해 바뀌었으면 아무것도 쓰지 않는다(E_FIXED_WRITE).
// 090·초상 토큰의 키 가운데 07장 10절 처분표(FIXED/REDESIGN/DROP)에 없는 것이 있으면 실패한다(E_UNDISPOSED_KEY).
//
// 사용법:
//   node scripts/pages/v3-apply-people.mjs --check-only      [--input-dir docs/drafts/people] [--sql-dir data/sql] [--tokens-dir public/portrait-tokens]
//   node scripts/pages/v3-apply-people.mjs --dry-run         [... --recompute-stats]
//   node scripts/pages/v3-apply-people.mjs [--recompute-stats] [--force-allocation] [--report <json>]
//   --input-dir   입력 폴더. <faction>.jsonl이 없으면 <faction>/batch-*.jsonl을 이어 붙여 id 순으로 읽는다.
//   --sql-dir     SQL 폴더(기본 SITE_SQL_DIR 또는 data/sql). --tokens-dir 초상 토큰 폴더.
//   --recompute-stats  1,022명의 여섯 능력치를 deriveTableStats(v3 직업, 품계)로 다시 쓰고 sourceStatus를 ck3-table-derived로 둔다.
//   --force-allocation 배치 오류(정원·자리 겹침·주군·나이·거점처럼 과제 30이 맞출 것)가 있어도 쓴다. 스키마·고정 사실 오류는 늘 막는다.
//   --report      오류와 바뀐 수를 JSON으로 쓴다(저장소 밖 경로 권장).
// 종료 코드: 0 성공, 1 입력 오류(스키마·고정·배치), 2 사용법, 3 처분 없는 키, 4 고정 칸 쓰기 시도, 5 SQL 형식.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { OCCUPATION_CLASSES, RANK_MODIFIER, CK3_KEYS, deriveTableStats } from './ck3-stats.mjs';
import { textToImageBlock } from '../../server/portrait-text-to-image.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FACTION_FILES = ['government', 'free-city', 'arc'];
const FILE_OF_FACTION = { government: 'government', 'free-city': 'free-city', arc: 'arc', independent: 'government' };
const FACTIONS = ['government', 'free-city', 'arc', 'independent'];
const FCODE = { government: 'G', 'free-city': 'F', arc: 'A', independent: 'I' };

// ---- 07장 8.2절 직업 목록 [occupation_ko, occupation, 등급, 세력] ------------------------------------
export const OCCUPATIONS = [
  ['국정 총괄', 'Affairs of state', 'governance', 'G'], ['구 행정', 'District administration', 'governance', 'G'],
  ['부처 행정', 'Ministry administration', 'governance', 'G'], ['동 행정', 'Dong administration', 'governance', 'G'],
  ['역 행정', 'Station administration', 'governance', 'G'], ['도시 운영', 'City governance', 'governance', 'F'],
  ['구간 운영', 'Section running', 'governance', 'F'], ['역반 운영', 'Station crew running', 'governance', 'F'],
  ['신앙 통솔', 'Leading the faith', 'governance', 'A'], ['곁집 통솔', 'Leading a Near House', 'governance', 'A'],
  ['대피소 통솔', 'Leading a shelter', 'governance', 'A'], ['정비대 통솔', 'Leading a bench', 'governance', 'A'],
  ['군 지휘', 'Military command', 'soldier', 'GA'], ['징집 보병', 'Levy infantry', 'soldier', 'G'],
  ['가문 징집', 'House levy', 'soldier', 'A'], ['계약 보병', 'Contract infantry', 'soldier', 'F'],
  ['세례 전투', 'Baptised fighting', 'soldier', 'A'], ['소총 사격', 'Rifle shooting', 'soldier', 'GFA'],
  ['포병', 'Artillery', 'soldier', 'G'], ['드론 조종', 'Drone piloting', 'soldier', 'GF'], ['지휘 참모', 'Staff officer', 'soldier', 'GA'],
  ['출입구 경비', 'Entrance guard', 'guard', 'GFA'], ['검문소 경비', 'Checkpoint guard', 'guard', 'G'], ['순찰', 'Patrol', 'guard', 'GFA'],
  ['경호', 'Bodyguard', 'guard', 'GFA'], ['치안', 'Policing', 'guard', 'G'], ['지킴 몫', 'Watch duty', 'guard', 'F'],
  ['진료', 'Medical care', 'medical', 'GFA'], ['응급 처치', 'Emergency care', 'medical', 'GFA'],
  ['약품 관리', 'Medicine keeping', 'medical', 'GFA'], ['세례자 돌봄', 'Recovery care', 'medical', 'A'],
  ['이식 정비', 'Implant maintenance', 'fitting', 'AF'], ['세례 집도', 'Baptism fitting', 'fitting', 'A'], ['충전 관리', 'Charging upkeep', 'fitting', 'A'],
  ['섬유당 통 관리', 'Fibre-sugar vats', 'provision', 'GFA'], ['빛밭 경작', 'Light-field farming', 'provision', 'GFA'],
  ['버섯 재배', 'Mushroom growing', 'provision', 'GFA'], ['벌레 치기', 'Insect rearing', 'provision', 'GFA'],
  ['얼음 어로', 'Ice fishing', 'provision', 'GFA'], ['싹 기르기', 'Sprouting', 'provision', 'GFA'], ['부엌 취사', 'Kitchen cooking', 'provision', 'GFA'],
  ['눈 굴 지기', 'Snow-shaft keeping', 'labour', 'GFA'], ['제설', 'Snow clearing', 'labour', 'GFA'], ['땔감 벌목', 'Firewood felling', 'labour', 'GF'],
  ['화덕 지기', 'Hearth keeping', 'labour', 'GFA'], ['메탄 통 지기', 'Methane vat keeping', 'labour', 'GFA'], ['짐꾼', 'Porter', 'labour', 'GFA'],
  ['옷 짓기', 'Clothes making', 'labour', 'GFA'],
  ['배급 집행', 'Ration issuing', 'trade', 'G'], ['장터 거래', 'Market trading', 'trade', 'GFA'], ['부품 거래', 'Parts trading', 'trade', 'FA'],
  ['계약 교섭', 'Contract negotiation', 'trade', 'GFAI'], ['물자 계량', 'Goods weighing', 'trade', 'GFA'], ['급수 배분', 'Water allotment', 'trade', 'GFA'],
  ['환전', 'Money changing', 'trade', 'F'], ['증표 발행', 'Coupon issuing', 'trade', 'G'],
  ['전령', 'Messenger', 'courier', 'GFAI'], ['짐 호송', 'Cargo escort', 'courier', 'GFA'], ['열차 배차', 'Train dispatch', 'courier', 'GFA'],
  ['수레 운전', 'Cart driving', 'courier', 'GFA'], ['나루 건넘 안내', 'River crossing guide', 'courier', 'GF'], ['무전 중계', 'Radio relay', 'courier', 'GFA'],
  ['교주의 말 전달', 'Carrying the Word', 'courier', 'A'],
  ['펌프 정비', 'Pump maintenance', 'maintenance', 'GFA'], ['바람틀 정비', 'Windmill maintenance', 'maintenance', 'GF'],
  ['열 펌프 정비', 'Heat-pump maintenance', 'maintenance', 'GFA'], ['수차 정비', 'Water-wheel maintenance', 'maintenance', 'FA'],
  ['우물 정비', 'Well maintenance', 'maintenance', 'GFA'], ['취수구 정비', 'Intake maintenance', 'maintenance', 'GFA'],
  ['전선 정비', 'Line maintenance', 'maintenance', 'GFA'], ['부품 가공', 'Parts machining', 'maintenance', 'FA'],
  ['차량 정비', 'Vehicle maintenance', 'maintenance', 'GFA'], ['통신 정비', 'Radio maintenance', 'maintenance', 'GFA'], ['공구 제작', 'Tool making', 'maintenance', 'GF'],
  ['고물 채집', 'Salvage gathering', 'scout', 'GFA'], ['섬유 채집', 'Fibre gathering', 'scout', 'GFA'], ['테두리 정찰', 'Edge watch', 'scout', 'GFA'],
  ['탐사', 'Survey', 'scout', 'GFA'], ['정보 수집', 'Intelligence gathering', 'scout', 'GFA'], ['동력 덩이 채집', 'Power-core running', 'scout', 'FA'],
  ['귀환 탐사', 'Return crossing', 'scout', 'I'],
  ['장부 기재', 'Ledger entry', 'record', 'G'], ['명부 필사', 'Register copying', 'record', 'G'], ['공문 필사', 'Document copying', 'record', 'G'],
  ['비서 업무', 'Secretarial work', 'record', 'G'], ['계약서 기록', 'Contract records', 'record', 'F'], ['셈판 기록', 'Tally-board keeping', 'record', 'FA'],
  ['세례록 기록', 'Baptism roll keeping', 'record', 'A'], ['교육', 'Schooling and teaching', 'record', 'GFA'],
];
// ---- 07장 8.5절 품계 목록 [rank_ko, rank, 세력] -----------------------------------------------------
export const RANKS = [
  ['대통령', 'President', 'G'], ['국회의원', 'Assembly Member', 'G'], ['장관', 'Minister', 'G'], ['차관', 'Vice Minister', 'G'],
  ['청장', 'Commissioner', 'G'], ['총재', 'Governor', 'G'], ['원장', 'Director', 'G'], ['구청장', 'Head of the District Office', 'G'],
  ['동장', 'Dong Chief', 'G'], ['역장', 'Stationmaster', 'G'], ['서기관', 'Senior Secretary', 'G'], ['사무관', 'Deputy Director', 'G'],
  ['주사', 'Officer', 'G'], ['서기', 'Clerk', 'G'], ['경찰관', 'Police Officer', 'G'], ['전문의', 'Specialist', 'G'], ['수련의', 'Resident doctor', 'G'],
  ['교사', 'Teacher', 'G'], ['등재민', 'Registered resident', 'G'], ['이병', 'Private', 'G'], ['일병', 'Private First Class', 'G'], ['상병', 'Corporal', 'G'],
  ['병장', 'Sergeant', 'G'], ['하사', 'Staff Sergeant', 'G'], ['중사', 'Sergeant First Class', 'G'], ['상사', 'Master Sergeant', 'G'],
  ['소위', 'Second Lieutenant', 'G'], ['중위', 'First Lieutenant', 'G'], ['대위', 'Captain', 'G'], ['소령', 'Major', 'G'], ['중령', 'Lieutenant Colonel', 'G'], ['대령', 'Colonel', 'G'],
  ['공작', 'Duke', 'F'], ['나루지기', 'Ferry Keeper', 'F'], ['장주', 'Market Master', 'F'], ['공장장', 'Works Master', 'F'], ['경계장', 'Edge Warden', 'F'],
  ['기지장', 'Depot Master', 'F'], ['바람지기', 'Wind Keeper', 'F'], ['구간장', 'Section Chief', 'F'], ['역반장', 'Station Foreman', 'F'],
  ['건널목장', 'Crossing Chief', 'F'], ['교대장', 'Shift Chief', 'F'], ['밭장', 'Field Chief', 'F'], ['대주', 'Bench Owner', 'F'], ['작업조장', 'Crew Chief', 'F'],
  ['손', 'Hand', 'F'], ['일손', 'Labourer', 'F'], ['견습', 'Apprentice', 'F'],
  ['교주', 'Hierophant', 'A'], ['곁집장', 'Head of the Near House', 'A'], ['곁집 어른', 'Near House elder', 'A'], ['대피소장', 'Shelter Head', 'A'],
  ['정비장', 'Bench Keeper', 'A'], ['호위장', 'Guard Captain', 'A'], ['말지기', 'Word Keeper', 'A'], ['곁집원', 'Near House member', 'A'],
  ['정비공', 'Fitter', 'A'], ['세례자', 'Baptised', 'A'], ['미세례자', 'Unbaptised', 'A'], ['후계', 'Heir', 'GFA'], ['미등록', 'Unregistered', 'I'],
];
// ---- 07장 5.1절 품계별 최소 나이, 06장 12.4절 직업 최소 나이 ------------------------------------------
const RANK_MIN_AGE = {
  '대통령': 25, '국회의원': 18, '장관': 30, '차관': 30, '청장': 30, '총재': 30, '원장': 30, '구청장': 30, '동장': 25, '역장': 25, '서기관': 30,
  '사무관': 25, '주사': 20, '서기': 16, '경찰관': 19, '전문의': 30, '수련의': 24, '교사': 22, '이병': 19, '일병': 19, '상병': 19, '병장': 19,
  '하사': 18, '중사': 22, '상사': 28, '소위': 20, '중위': 22, '대위': 24, '소령': 30, '중령': 33, '대령': 35, '후계': 16, '등재민': 0,
  '공작': 25, '나루지기': 25, '장주': 25, '공장장': 25, '경계장': 25, '기지장': 25, '바람지기': 25, '구간장': 25, '역반장': 20, '대주': 20,
  '작업조장': 20, '건널목장': 25, '교대장': 20, '밭장': 20, '손': 16, '일손': 16, '견습': 12,
  '교주': 25, '곁집장': 0, '곁집 어른': 40, '대피소장': 28, '정비장': 25, '호위장': 30, '말지기': 25, '정비공': 18, '세례자': 16, '곁집원': 0, '미세례자': 0,
  '미등록': 0,
};
// 07장 5.1절의 직업 최소 나이는 06장 12.4절 갈래의 역할 낱말에 붙는다. 그 낱말이 닿는 직업 문구는 07장 8.7절 06 줄이다.
// 직업 등급(scout, provision)으로 묶지 않는다: 바깥 일의 전령은 courier 등급이고, 탐사·벌레 치기 따위는 06장 갈래에 없다.
const ARC_OCCUPATION_MIN_AGE = new Map([
  ['계약 교섭', 30], // 교섭인
  ['세례 전투', 20], // 세례 전투원
  ['가문 징집', 17], // 가문 징집병
  // 물·전기·열: 수차지기, 취수구지기, 열 펌프지기, 출입구지기
  ...['수차 정비', '취수구 정비', '열 펌프 정비', '눈 굴 지기'].map((k) => [k, 16]),
  // 먹거리: 섬유당 통지기, 빛밭지기, 버섯 굴지기, 얼음 낚시꾼, 부엌 일꾼
  ...['섬유당 통 관리', '빛밭 경작', '버섯 재배', '얼음 어로', '부엌 취사'].map((k) => [k, 16]),
  // 바깥 일: 고물꾼, 섬유 캐는 사람, 테두리 망꾼, 동력 덩이 캐는 사람, 전령
  ...['고물 채집', '섬유 채집', '테두리 정찰', '동력 덩이 채집', '전령'].map((k) => [k, 18]),
]);
function occupationMinAge(faction, occKo) {
  if (faction !== 'arc') return 0;
  return ARC_OCCUPATION_MIN_AGE.get(occKo) ?? 0;
}
// ---- 07장 5.2절 나이 띠 -----------------------------------------------------------------------------
const TIER_BAND = { T1: [40, 70], T2: [35, 68], T3: [35, 65], T4: [30, 62] };
const T5_BAND = {
  governance: [35, 65], guard: [19, 55], medical: [25, 62], fitting: [20, 58], provision: [16, 62], labour: [16, 62],
  trade: [20, 62], courier: [16, 50], maintenance: [18, 62], scout: [18, 50], record: [19, 60],
};
const SOLDIER_BAND = { government: [19, 40], 'free-city': [18, 45], arc: [20, 45], independent: [18, 45] };
const CHILD_ROLE = /부양 식구|아이|견습/;
// 정부 품계 가운데 나이에서 정해지는 것(07장 8.6절 기본 품계표: 서기·주사·사무관, 수련의·전문의, 국군 병사·분대장, 구 부대 지휘관).
const AGE_DERIVED_RANKS = new Set(['서기', '주사', '사무관', '수련의', '전문의', '이병', '일병', '상병', '병장', '하사', '중사', '상사', '대위', '소령']);
// ---- 07장 9.5절 가치관 ------------------------------------------------------------------------------
const AXES_EN = ['Authority', 'Openness', 'Force', 'Material', 'Communal', 'Principle', 'Public', 'Eligibility', 'Dispersed', 'Transformative'];
const AXES_KO = ['권위', '개방', '무력', '물질', '공동', '원칙', '공개', '자격', '분산', '변혁'];
const V3_BASE = {
  government: [40, -30, 10, 0, 20, 40, -20, 30, -40, -30], 'free-city': [-30, 20, -20, 40, 0, 10, 30, 40, 50, 10],
  arc: [30, -10, 0, -30, 40, 10, -40, 0, -20, 40], independent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const OLD_MEAN = {
  government: [-3, 24, -25, 3, 15, 18, 5, 15, 10, -8], 'free-city': [3, 7, -9, 25, 23, 18, 31, 22, -3, 1],
  arc: [3, 7, -11, 18, 18, 19, 3, 33, 12, -3], independent: [-18, 23, -15, 18, 29, 11, 9, 33, 30, 23],
};
const CLASS_VALUE_MOD = {
  governance: { Authority: 10 }, soldier: { Force: 15 }, guard: { Force: 10, Principle: 5 }, medical: { Communal: 10 },
  fitting: { Transformative: 10 }, provision: { Communal: 10 }, labour: { Communal: 5, Force: 5 }, trade: { Material: 10, Openness: 5 },
  courier: { Openness: 10 }, maintenance: { Eligibility: 10 }, scout: { Openness: 5, Public: -5 }, record: { Principle: 10, Public: 5 },
};
// ---- 07장 4.1절 단계가 바뀌는 넷, 4.3절 구 본역, 6.1절 가구 셋 -----------------------------------------
const STAGE_CHANGES = { 'person-1018': 'Key', 'person-0086': 'S1', 'person-0998': 'Key', 'person-0029': 'S1' };
const HOME_STATION = {
  '종로구': '종로3가', '중구': '서울역', '용산구': '삼각지', '성동구': '왕십리', '광진구': '건대입구', '동대문구': '청량리', '중랑구': '상봉',
  '성북구': '보문', '강북구': '4.19민주묘지', '도봉구': '창동', '노원구': '노원', '은평구': '연신내', '서대문구': '충정로', '마포구': '공덕',
  '강서구': '김포공항', '양천구': '신정네거리', '영등포구': 'Yeongdeungpo', '구로구': 'Guro', '금천구': '가산디지털단지', '동작구': '노량진',
  '관악구': '신림', '서초구': '고속터미널', '강남구': '수서', '송파구': '잠실', '강동구': '천호',
};
const HOUSEHOLDS = { 'hh:person-0086': ['person-0086', 'person-0087', 'person-0090'], 'hh:person-1005': ['person-1005', 'person-0399'], 'hh:person-1009': ['person-1009', 'person-1010'] };
const TIE_TYPES = { Contract: '계약', Oath: '맹세', 'Master and Disciple': '스승과 제자', Rivalry: '경쟁', Debt: '빚', Grudge: '원한', 'Protective Residence': '보호체류' };
const TYPE_KO = { ...TIE_TYPES, Command: '지휘', Kinship: '친족' };

// ---- 07장 9.2절 입력 스키마 --------------------------------------------------------------------------
const INPUT_KEYS = ['id', 'faction_id', 'row', 'role', 'seat', 'tier', 'stage', 'title_ko', 'title_en', 'position_ko', 'position_en', 'rank_ko', 'rank_en',
  'occupation_ko', 'occupation_en', 'location', 'household', 'liege', 'partCount', 'age', 'biography_ko', 'biography_en', 'kinBasis', 'ties', 'traits',
  'skills', 'portrait', 'retinue', 'nonKoreanFamilyBasis', 'ledger'];
const REQUIRED_Y = ['id', 'faction_id', 'row', 'role', 'seat', 'tier', 'stage', 'title_ko', 'title_en', 'position_ko', 'position_en', 'rank_ko', 'rank_en',
  'occupation_ko', 'occupation_en', 'location', 'household', 'liege', 'partCount', 'biography_ko', 'biography_en', 'ledger'];
// 고정 사실의 키(README 고정 사실, v3-fixed-facts.mjs). 입력에 있으면 그 줄을 거부한다.
const FIXED_INPUT_KEYS = ['name', 'name_ko', 'name_en', 'gender', 'gender_ko', 'gender_en', 'birthDate', 'birthday', 'ageAsOf', 'generation', 'characterId',
  'clan', 'clan_id', 'clanId', 'sort', 'detailRoute', 'rightsPermissions', 'face', 'hair', 'identity', 'image', 'slots', 'members', 'crest', 'crest_motif',
  'bongwan', 'surname', 'nodes', 'edges', 'kinship', 'relations'];
const PORTRAIT_KEYS = ['upper_ko', 'outfit_ko', 'lower_en', 'footwear_en', 'headwear_en', 'neckline_en', 'accessories_en', 'accessoriesColor_en',
  'accessoriesMaterial_en', 'accessoriesMounting_en', 'accessoriesShape_en', 'palette', 'descriptionRole_en'];
const TRAIT_KEYS = ['id', 'name_ko', 'name_en', 'description_ko', 'description_en', 'behavior_ko', 'behavior_en', 'stress_ko', 'stress_en', 'relationship_ko', 'relationship_en'];
const RETINUE_KEYS = ['id', 'name_ko', 'name_en', 'count', 'duties_ko', 'duties_en', 'technicalLimits_ko', 'technicalLimits_en', 'personhoodReview', 'holdingIds', 'formalTitle'];

// ---- 07장 10절 처분표 ---------------------------------------------------------------------------------
const F = 'FIXED'; const R = 'REDESIGN'; const D = 'DROP';
const expand = (prefix, keys, leaves) => keys.flatMap((k) => [`${prefix}.${k}`, ...(leaves ?? []).map((l) => `${prefix}.${k}.${l}`)]);
const ab = CK3_KEYS.flatMap((k) => [`characterProfile.abilities.${k}`, `characterProfile.abilities.${k}.base`, `characterProfile.abilities.${k}.effective`]);
const HOLD_RE = ['id', 'name', 'name.ko', 'holderPersonId', 'directLiegePersonId', 'stateId', 'adminRefs', 'adminRefs[]', 'adminRefs[].id', 'adminRefs[].name', 'territorialScale', 'titleId', 'geometrySource', 'formalTitleRank'];
export const DETAIL_DISPOSITION = Object.fromEntries([
  ...['id', 'name', 'gender', 'birthDate', 'birthday', 'age', 'ageAsOf', 'generation', 'characterId', 'clan', 'clan.id', 'clan.name', 'clan.crest', 'detailRoute'].map((k) => [k, F]),
  ...['title', 'position', 'rank', 'occupation', 'stage', 'state', 'stateName', 'commonTier', 'sourceStatus', 'sourceKind', 'minors', 'biography'].map((k) => [k, R]),
  ...['sourceRoute', 'locked', 'openingDisposition', 'openingDisposition.status', 'openingDisposition.openingYear'].map((k) => [k, D]),
  ['rightsPermissions', F], ...expand('rightsPermissions', ['applicability', 'externalReuseRequiresSeparateSubjectPermission', 'identityBasisRef']).map((k) => [k, F]),
  ...['nameUse', 'likenessUse'].flatMap((u) => [`rightsPermissions.${u}`, ...['evidenceRef', 'recordedOn', 'status', 'uses'].map((l) => `rightsPermissions.${u}.${l}`)]).map((k) => [k, F]),
  ['fields', R], ['sections', R],
  ['values', R], ...AXES_EN.map((a) => [`values.${a}`, R]), ...AXES_KO.map((a) => [`values.${a}`, R]),
  ['desire', R], ...['Longing', 'Monopoly', 'Risk', 'Display', 'Sustained', 'Orientation', 'Union', '갈망', '독점', '위험', '과시', '지속', '지향', '결합'].map((a) => [`desire.${a}`, R]),
  ...['household', 'household.personFaith', 'household.houseFaith', 'household.humanoidAdmission'].map((k) => [k, R]),
  // v3 꼴에서 새로 생기는 키(07장 9.4절 가구 id·역할, 9.4절 보유지 name.en). 적용기를 다시 돌릴 수 있게 처분을 둔다.
  ...['household.id', 'household.role', 'confirmedHoldings[].name.en', 'subordinateHoldings[].name.en', 'subordinateHoldings[].stationRef', 'subordinateHoldings[].stationRef.stationId', 'subordinateHoldings[].stationRef.stationName'].map((k) => [k, R]),
  ...['relations', 'relations.incoming', 'relations.outgoing'].map((k) => [k, R]),
  ...['incoming', 'outgoing'].flatMap((d) => [`relations.${d}[]`, `relations.${d}[].from`, `relations.${d}[].type`, `relations.${d}[].to`, `relations.${d}[].basis`]).map((k) => [k, 'RELATION']),
  ...['proseContacts', 'proseContacts[]', 'proseContacts[].basis', 'proseContacts[].recipientId', 'proseContacts[].recipientName', 'proseContacts[].sourceRef', 'proseContacts[].sourceRef.anchor', 'proseContacts[].sourceRef.path'].map((k) => [k, D]),
  ...['court', 'court.id', 'court.members', 'court.members[]', 'court.members[].name', 'court.members[].personId'].map((k) => [k, R]),
  ...['directLiege', 'directLiege.personId', 'directLiege.name', 'directLiege.courtId', 'directLiege.effectiveYear', 'directLiege.ownerTerm', 'directLiege.relationKind'].map((k) => [k, R]),
  ...['retinueGroups', 'retinueGroups[]', ...['id', 'name', 'courtId', 'liegePersonId', 'count', 'duties', 'duties[]', 'personhoodReview', 'technicalLimits', 'technicalLimits[]', 'holdingIds', 'formalTitle'].map((k) => `retinueGroups[].${k}`)].map((k) => [k, R]),
  ['characterProfile', R], ['characterProfile.abilities', R], ...ab.map((k) => [k, R]), ['characterProfile.narrative', D],
  ...['skills', 'skills[]', 'skills[].id', 'skills[].name', 'skills[].rating'].map((k) => [`characterProfile.${k}`, R]),
  ...['traits', 'traits[]', ...['id', 'name', 'description', 'behavior', 'stress', 'relationship', 'effects', 'effects[]', 'effects[].ability', 'effects[].delta'].map((k) => `traits[].${k}`)].map((k) => [`characterProfile.${k}`, R]),
  ...['health', 'health.status', 'health.bodyParts', 'health.bodyParts[]', 'health.bodyParts[].id', 'health.bodyParts[].function', 'health.bodyParts[].severity', 'health.diseases'].map((k) => [`characterProfile.${k}`, R]),
  ...['openingTitles', 'openingTitles[]', ...['id', 'name', 'rank', 'holderPersonId', 'stateId', 'basis', 'geographicTitleId', 'jurisdictionRefs', 'jurisdictionRefs[]', 'parentTitleId', 'parentTitle', 'parentTitle.id', 'parentTitle.name', 'parentTitle.holderPersonId'].map((k) => `openingTitles[].${k}`)].map((k) => [k, D]),
  ...['politicalIdentities', 'politicalIdentities[]', ...['id', 'kind', 'rank', 'holderPersonId', 'stateId', 'politicalParentTitleId', 'directOwnership', 'personalLieges', 'personalLieges[]', 'personalLieges[].holdingId', 'personalLieges[].directLiegePersonId'].map((k) => `politicalIdentities[].${k}`)].map((k) => [k, D]),
  ['confirmedHoldings', R], ['confirmedHoldings[]', R], ...[...HOLD_RE, 'stationRef', 'stationRef.stationId', 'stationRef.stationName'].map((k) => [`confirmedHoldings[].${k}`, R]),
  ...['componentRefs', 'designation', 'facilityRef', ...['layerId', 'layerName', 'siteAnchor', 'siteSourcePath', 'sourcePath', 'stationId', 'stationIdentity', 'stationIdentity.district', 'stationIdentity.lat', 'stationIdentity.lon', 'stationName'].map((k) => `facilityRef.${k}`),
    'landmarkRef', 'landmarkRef.landmarkId', 'landmarkRef.sourcePath', 'liegeRelationshipKind', 'parentGeography', 'wholeSeoulControl'].map((k) => [`confirmedHoldings[].${k}`, D]),
  ['subordinateHoldings', R], ['subordinateHoldings[]', R], ...[...HOLD_RE, 'holderName', 'holderRoute'].map((k) => [`subordinateHoldings[].${k}`, R]),
  ...['componentRefs', 'designation', 'liegeRelationshipKind', 'parentGeography', 'wholeSeoulControl'].map((k) => [`subordinateHoldings[].${k}`, D]),
]);
// fields/sections의 옛 키(07장 10.2절). Contributor/기여자만 FIXED로 이어 쓰고 나머지는 지운다.
const OLD_FIELD_KEYS = new Set(['Affiliation', 'Appearance', 'Armed Access', 'Assigned Duties', 'Belongings', 'Birthplace', 'Character ID', 'Civil Servant Position and Grade',
  'Civil and Community Duties', 'Community Role', 'Community of origin', 'Conscription history', 'Constitutional Body', 'Current Office', 'Date of Birth', 'Desires',
  'Desires and Tastes', 'Duty', 'Existing Residence', 'Fear', 'Feudal Rank', 'Feudal Title', 'Gender', 'Governing and negotiation style', 'Key Relationship',
  'Key relationships', 'Language', 'Livelihood', 'Livelihood Role', 'Name', 'Office', 'Offices', 'Personal Ambition', 'Personality', 'Player Intervention',
  'Position and Grade', 'Rank', 'Relationships', 'Residence', 'Residence Location', 'Residence and Work Location', 'Role', 'Status', 'Style of Governance', 'Title',
  'Triggering Incident', 'Values', 'Work Location',
  '가치관', '개인 야망', '거주 위치', '거주·업무 위치', '거주지', '공동체 역할', '공무원 직위·직급', '공포', '관계', '관직', '기존 거주 위치', '담당 업무', '무장 접근',
  '민간·공동체 직무', '봉건 작위', '봉건 품계', '생년월일', '생업', '생업 역할', '성격', '성명', '성별', '소속', '소지품', '언어', '업무', '업무 위치', '역할', '외형', '욕망',
  '욕망과 취향', '주요 관계', '지위', '직무', '직위', '직위·직급', '직함', '징집 이력', '촉발 사건', '출생지', '출신 공동체', '캐릭터 ID', '통치 방식', '통치·교섭 방식',
  '품계', '플레이어 개입', '핵심 관계', '헌법기관', '현재 관직']);
const FIELD_FIXED_KEYS = new Set(['Contributor', '기여자']);
// v3 꼴의 fields 키(07장 10.2절). 다시 돌릴 때 REDESIGN으로 다시 쓴다.
const V3_FIELD_KEYS = new Set(['Affiliation', 'Title', 'Rank', 'Livelihood', 'Work Station', 'Home Station', 'Household', 'Part Count', '소속', '직함', '품계', '생업', '일하는 역', '잠자는 역', '가구', '부위 수']);
const OLD_SECTION_KEYS = new Set(['Ambition', 'Anecdote', 'Belief', 'Body', 'Civil Servant Position and Grade', 'Contract and Authority', 'Courier and Escort', 'Duty',
  'Escort Formation', 'Escort and Withdrawal', 'Fear', 'Functional/Livelihood Role', 'Goals', 'Houses', 'Intervention', 'Life', 'Livelihood', 'Offices', 'Relationships',
  'Training', 'Traits', '가문', '개입', '계약과 권한', '공무원 직위·직급', '공포', '관계', '관직', '기능·생업 역할', '목표', '생애', '생업', '신념', '신체', '야망', '업무',
  '일화', '전령과 호위', '직무', '특성', '호위 대열', '호위와 철수', '훈련']);
const slotLeaves = ['value', 'status', 'source', 'derived'];
export const TOKEN_DISPOSITION = Object.fromEntries([
  ...['schemaVersion', 'personId', 'characterId', 'name', 'approval', 'variantId'].map((k) => [k, F]),
  ['identity', F], ...['characterId', 'name', 'gender', 'age', 'ageAsOf', 'ageCategory'].map((k) => [`identity.${k}`, F]),
  ...expand('identity', ['ethnicity', 'origin'], ['value', 'status', 'source', 'derived']).map((k) => [k, F]),
  ['facts', R], ['facts.gender', F], ['facts.genderUserLocked', F], ['facts.role', R], ['stateId', R],
  ['artProposal', R], ...['face', 'hair', 'eyes', 'skin', 'approvalNote', 'approvedAppearance', 'approvedOutfit', 'approvedEquipmentIds'].map((k) => [`artProposal.${k}`, F]),
  ...['description', 'outfit', 'upper', 'lower', 'footwear', 'accessories', 'headwear', 'palette', 'palette[]', 'carriedWeapons'].map((k) => [`artProposal.${k}`, R]),
  ['slots', R], ['slots.face', F], ...expand('slots.face', ['description', 'faceShape', 'eyeShape', 'eyeColor', 'eyebrowShape', 'noseShape', 'mouthShape', 'lipColor', 'beardShape'], slotLeaves).map((k) => [k, F]),
  ['slots.hair', F], ...expand('slots.hair', ['description', 'color', 'length', 'shape'], slotLeaves).map((k) => [k, F]),
  ['slots.body', F], ...expand('slots.body', ['build', 'height', 'weight', 'skin', 'bustSize'], slotLeaves).map((k) => [k, F]), ['slots.body.height.unit', F], ['slots.body.weight.unit', F],
  ['slots.outfit', R], ...expand('slots.outfit', ['upper', 'lower', 'footwear', 'headwear', 'neckline', 'marks'], slotLeaves).map((k) => [k, R]),
  ['slots.accessories', R], ...expand('slots.accessories', ['description', 'color', 'material', 'mounting', 'shape'], slotLeaves).map((k) => [k, R]),
  ['style', F], ...['styleId', 'referenceSha256', 'portraitShotId', 'crop', 'referenceRole', 'referencePolicy', 'generationReferenceDerivation', 'generationReferenceSha256'].map((k) => [`style.${k}`, F]),
  ['generationContract', F], ...['portraitShotId', 'direction', 'camera', 'pose', 'background', 'model', 'styleReferenceRole'].map((k) => [`generationContract.${k}`, F]),
  ['image', F], ...['path', 'sha256', 'width', 'height'].map((k) => [`image.${k}`, F]),
  ['imageReview', F], ...['record', 'imageSha256', 'scope', 'verdict'].map((k) => [`imageReview.${k}`, F]),
  ['references', F], ...['excludePhoto', 'excludePhoto[]', 'identityRole', 'identitySelectionNote', 'identitySha256', 'imageText', 'originalIdentityRole', 'originalIdentitySha256', 'reviewScope', 'reviewStatus', 'styleSha256'].map((k) => [`references.${k}`, F]),
  ['textToImage', R], ...['schemaVersion', 'model', 'defaultStyle', 'views'].map((k) => [`textToImage.${k}`, R]),
  ...['portrait', 'front', 'back', 'side', 'profile'].flatMap((v) => [`textToImage.views.${v}`, ...['size', 'prompt', 'negativePrompt'].map((l) => `textToImage.views.${v}.${l}`)]).map((k) => [k, R]),
]);
const PEOPLE_FIXED_COLS = ['id', 'sort', 'name', 'name_ko', 'gender', 'gender_ko'];

// ---- 오류 모음 ---------------------------------------------------------------------------------------
// severity: 'hard'(스키마·고정·참조, 늘 막는다) | 'alloc'(과제 30이 맞출 배치·내용, --force-allocation으로 넘길 수 있다)
class Problems {
  constructor() { this.list = []; }
  add(severity, kind, faction, id, msg) { this.list.push({ severity, kind, faction: faction ?? '-', id: id ?? '-', msg }); }
  count(sev) { return this.list.filter((p) => !sev || p.severity === sev).length; }
}

// ---- SQL 파일 읽기와 쓰기(행당 INSERT 1문, 원래 구분자·숫자 꼴 보존) ------------------------------------
function tokenizeValues(s) {
  const vals = []; let i = 0; let sep = null;
  while (i < s.length) {
    if (s[i] === "'") {
      let j = i + 1; let v = '';
      for (;;) {
        if (j >= s.length) throw new Error('E_SQL_SHAPE: unterminated string');
        if (s[j] === "'") { if (s[j + 1] === "'") { v += "'"; j += 2; continue; } j++; break; }
        v += s[j]; j++;
      }
      vals.push({ str: true, value: v }); i = j;
    } else {
      let j = i; while (j < s.length && s[j] !== ',') j++;
      const raw = s.slice(i, j); vals.push({ str: false, raw, value: raw === 'NULL' ? null : raw }); i = j;
    }
    if (i < s.length) {
      if (s[i] !== ',') throw new Error(`E_SQL_SHAPE: expected comma at ${i}`);
      const thisSep = s[i + 1] === ' ' ? ', ' : ',';
      if (sep === null) sep = thisSep; else if (sep !== thisSep) throw new Error('E_SQL_SHAPE: mixed separators');
      i += thisSep.length;
    }
  }
  return { vals, sep: sep ?? ', ' };
}
export function parseRow(line) {
  const m = /^INSERT INTO (\w+) \(([^)]*)\) VALUES \((.*)\);$/s.exec(line);
  if (!m) throw new Error(`E_SQL_SHAPE: ${line.slice(0, 80)}`);
  const colSep = m[2].includes(', ') ? ', ' : ',';
  const cols = m[2].split(colSep);
  const { vals, sep } = tokenizeValues(m[3]);
  if (vals.length !== cols.length) throw new Error(`E_SQL_SHAPE: ${cols.length} columns, ${vals.length} values`);
  return { table: m[1], cols, colSep, sep, vals, get: (c) => vals[cols.indexOf(c)].value };
}
const quote = (v) => `'${String(v).replaceAll("'", "''")}'`;
export function serializeRow(r) {
  return `INSERT INTO ${r.table} (${r.cols.join(r.colSep)}) VALUES (${r.vals.map((v) => (v.str ? quote(v.value) : v.raw)).join(r.sep)});`;
}
function setVal(r, col, value) {
  const i = r.cols.indexOf(col);
  if (i < 0) throw new Error(`E_SQL_SHAPE: no column ${col}`);
  const old = r.vals[i];
  if (value === null) r.vals[i] = { str: false, raw: 'NULL', value: null };
  else if (typeof value === 'number') r.vals[i] = { str: false, raw: String(value), value: String(value) };
  else r.vals[i] = { str: true, value: String(value) };
  return old.value !== r.vals[i].value;
}
function readSqlFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const rows = []; const prefix = []; let started = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('INSERT INTO ')) {
      started = true;
      const r = parseRow(l);
      if (serializeRow(r) !== l) throw new Error(`E_SQL_RESERIALIZE: ${path.basename(file)} line ${i + 1}`);
      rows.push(r);
    } else if (!started) prefix.push(l);
    else if (l !== '' || i !== lines.length - 1) throw new Error(`E_SQL_SHAPE: ${path.basename(file)} line ${i + 1} is not an INSERT`);
  }
  return { file, text, prefix, rows };
}
const sqlText = (f) => `${f.prefix.join('\n')}\n${f.rows.map(serializeRow).join('\n')}\n`;

// ---- 경로 훑기(처분표 대조용) ---------------------------------------------------------------------------
function walkPaths(v, p, out) {
  if (Array.isArray(v)) { out.add(p); v.forEach((x) => walkPaths(x, `${p}[]`, out)); } else if (v && typeof v === 'object') {
    if (p) out.add(p);
    for (const k of Object.keys(v)) walkPaths(v[k], p ? `${p}.${k}` : k, out);
  } else out.add(p);
}

// ---- 기하: 역이 속한 동(07장 4.3절) -----------------------------------------------------------------------
function parsePolys(d) {
  const polys = []; let cur = null;
  for (const m of d.matchAll(/([MLZ])\s*(?:(-?[\d.]+)[ ,](-?[\d.]+))?/g)) {
    if (m[1] === 'M') { cur = [[+m[2], +m[3]]]; polys.push(cur); } else if (m[1] === 'L') cur.push([+m[2], +m[3]]);
  }
  return polys;
}
function inPolys(polys, x, y) {
  let inside = false;
  for (const poly of polys) for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---- 문장 ----------------------------------------------------------------------------------------------
const sentences = (s) => (String(s).match(/[^.!?]*?[.!?]+["'”’)]*(?=\s|$)/gs) ?? []).map((x) => x.trim()).filter(Boolean);
const firstSentence = (s) => sentences(s)[0] ?? String(s).trim();
const stationKo = (st) => (st.name_ko.endsWith('역') ? st.name_ko : `${st.name_ko}역`);
const stationEn = (st) => (/Station$/.test(st.name) ? st.name : `${st.name} Station`);
const nOf = (id) => Number(id.slice(7));
const round5 = (v) => Math.max(-100, Math.min(100, Math.round(v / 5) * 5));

// ---- 기준 자료 읽기 ----------------------------------------------------------------------------------------
function loadBase(sqlDir, tokensDir) {
  const db = new DatabaseSync(':memory:');
  for (const f of fs.readdirSync(sqlDir).filter((x) => x.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(sqlDir, f), 'utf8'));
  const all = (sql) => db.prepare(sql).all().map((r) => ({ ...r }));
  const people = all('SELECT * FROM wiki_person ORDER BY id');
  const details = new Map(all('SELECT * FROM person_detail').map((r) => [r.person_id, { clan_id: r.clan_id, en: JSON.parse(r.json), ko: JSON.parse(r.json_ko) }]));
  const stations = new Map(all('SELECT id, sort, name, name_ko, district_ko, x, y, degree, control FROM map_station').map((s) => [s.id, s]));
  const regions = new Map(all('SELECT id, sort, name, name_ko, district, district_ko, path FROM map_region').map((r) => [r.id, { ...r, polys: parsePolys(r.path) }]));
  const duchies = new Map(all("SELECT id, name, name_ko FROM map_title WHERE rank = 'duchy'").map((t) => [t.id, t]));
  const duchyByDistrict = new Map([...duchies.values()].map((t) => [t.name_ko, t]));
  const states = new Map(all('SELECT id, name, name_ko FROM wiki_state').map((s) => [s.id, s]));
  states.set('independent', { id: 'independent', name: 'Unaffiliated', name_ko: '무소속' });
  const clans = all('SELECT id, branches, branches_ko FROM clan').map((c) => ({ id: c.id, branches: JSON.parse(c.branches), branches_ko: JSON.parse(c.branches_ko) }));
  const clanOf = new Map(all('SELECT clan_id, person_id FROM clan_member').map((m) => [m.person_id, m.clan_id]));
  for (const [pid, d] of details) if (!clanOf.has(pid) && d.clan_id) clanOf.set(pid, d.clan_id);
  const nonKorean = all('SELECT id, members FROM nonkorean_family ORDER BY sort').map((f) => ({ id: f.id, members: JSON.parse(f.members) }));
  // 역 → 동
  const dongOfStation = new Map();
  for (const st of stations.values()) {
    let hit = null;
    for (const r of regions.values()) if (inPolys(r.polys, st.x, st.y)) { hit = r.id; break; }
    if (!hit) { try { hit = JSON.parse(st.control).surfaceRegionId ?? null; } catch { hit = null; } }
    dongOfStation.set(st.id, hit);
  }
  const stationsOfDong = new Map();
  for (const [sid, rid] of dongOfStation) { if (!rid) continue; if (!stationsOfDong.has(rid)) stationsOfDong.set(rid, []); stationsOfDong.get(rid).push(stations.get(sid)); }
  const stationByKo = new Map([...stations.values()].map((s) => [s.name_ko, s]));
  // 05장 3절 구간(19곳)
  const sections = new Map();
  const md = fs.readFileSync(path.join(REPO, 'docs/design/v3/05-free-city.md'), 'utf8').split('\n');
  let stem = null;
  for (const l of md) {
    const h = /^### 3\.\d+ (\S+):/.exec(l); if (h) { stem = h[1]; continue; }
    if (/^## /.test(l)) stem = null;
    if (stem && l.startsWith('- **역(')) {
      for (const m of l.replace(/^- \*\*역\(\d+\)\.\*\* /, '').matchAll(/(\S+) 구간: ([^.]+)\./g)) {
        const ids = m[2].split(',').map((x) => x.trim()).map((nm) => (stations.has(nm) ? nm : stationByKo.get(nm)?.id ?? null));
        sections.set(`section:${stem}구:${m[1]}`, { district: `${stem}구`, name: m[1], stationIds: ids });
      }
    }
  }
  // 정원표(04 16.2, 05 12.2, 06 12.2) 줄·단계 수
  const quotas = loadQuotas();
  // 기록된 나이는 동결 스냅샷(과제 1)의 것이다. 적용기를 다시 돌려도 5.2절로 더한 나이를 기록된 나이로 잘못 읽지 않는다.
  const snap = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/design/v3/fixed-facts.snapshot.json'), 'utf8'));
  const frozenAge = new Map(snap.people.filter((p) => p.en?.age !== undefined).map((p) => [p.id, p.en.age]));
  const tokens = new Map();
  if (fs.existsSync(tokensDir)) for (const f of fs.readdirSync(tokensDir).filter((x) => x.endsWith('.json')).sort()) {
    const text = fs.readFileSync(path.join(tokensDir, f), 'utf8');
    tokens.set(f.replace(/\.json$/, ''), { file: f, text, token: JSON.parse(text) });
  }
  return { people, details, clanOf, frozenAge, stations, regions, duchies, duchyByDistrict, states, clans, nonKorean, dongOfStation, stationsOfDong, sections, quotas, tokens };
}
function loadQuotas() {
  const q = new Map(); // `${faction}|${row}` -> {Key,S1,..}
  const add = (fac, row, arr) => q.set(`${fac}|${row}`, { Key: arr[0], S1: arr[1], S2: arr[2], S3: arr[3], S4: arr[4] });
  const read = (f) => fs.readFileSync(path.join(REPO, 'docs/design/v3', f), 'utf8').split('\n');
  const section = (lines, head) => { const i = lines.findIndex((l) => l.startsWith(head)); const j = lines.findIndex((l, k) => k > i && /^###? /.test(l)); return lines.slice(i, j < 0 ? undefined : j); };
  const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim().replace(/\*\*/g, ''));
  for (const l of section(read('04-government.md'), '### 16.2')) {
    const c = cells(l); if (c.length < 7 || !/구/.test(c[0]) || c[0] === '구' || /합계/.test(c[0])) continue;
    add('government', c[0].startsWith('강남구(장부 밖') ? '강남구(장부 밖)' : c[0], c.slice(2, 7).map(Number));
  }
  for (const l of section(read('05-free-city.md'), '### 12.2')) {
    const c = cells(l); if (c.length !== 7 || !/^[가-힣]+$/.test(c[0]) || ['도시', '합'].includes(c[0])) continue;
    add('free-city', `${c[0]}구`, c.slice(2, 7).map(Number));
  }
  for (const l of section(read('06-arc.md'), '### 12.2')) {
    const c = cells(l); if (c.length !== 7 || /^자리$|합계|배정|^-+$/.test(c[0])) continue;
    add('arc', c[0].startsWith('교주의 집') ? '교주의 집' : c[0], c.slice(1, 6).map(Number));
  }
  // 07장 3.3절 배정으로 더해지는 사람
  const bump = (k, st, n) => { const v = q.get(k); if (v) v[st] += n; };
  bump('free-city|구로구', 'S1', 2); bump('free-city|구로구', 'S2', 2); bump('arc|교주의 집', 'S1', 1);
  q.set('independent|none', { Key: 0, S1: 3, S2: 0, S3: 0, S4: 0 });
  return q;
}

// ---- 입력 읽기 ------------------------------------------------------------------------------------------
function loadInputs(inputDir, problems) {
  const lines = [];
  for (const fac of FACTION_FILES) {
    const single = path.join(inputDir, `${fac}.jsonl`);
    const batchDir = path.join(inputDir, fac);
    let sources = [];
    if (fs.existsSync(single)) sources = [single];
    else if (fs.existsSync(batchDir)) sources = fs.readdirSync(batchDir).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort().map((f) => path.join(batchDir, f));
    if (!sources.length) { problems.add('hard', 'input-missing', fac, null, `no ${fac}.jsonl and no ${fac}/batch-*.jsonl in ${inputDir}`); continue; }
    const got = [];
    for (const src of sources) {
      const text = fs.readFileSync(src, 'utf8');
      if (text.includes('\r')) problems.add('hard', 'line-ending', fac, null, `${path.basename(src)} has CR characters (LF only)`);
      text.split('\n').forEach((l, i) => {
        if (!l.trim()) return;
        try { got.push({ obj: JSON.parse(l), file: fac, src: `${path.relative(inputDir, src)}:${i + 1}` }); } catch (e) { problems.add('hard', 'json', fac, null, `${path.basename(src)}:${i + 1} ${e.message}`); }
      });
    }
    if (sources.length === 1 && sources[0] === single) {
      for (let i = 1; i < got.length; i++) if (String(got[i - 1].obj.id) > String(got[i].obj.id)) { problems.add('hard', 'order', fac, got[i].obj.id, `${fac}.jsonl is not in id order`); break; }
    }
    got.sort((a, b) => (String(a.obj.id) < String(b.obj.id) ? -1 : 1));
    lines.push(...got);
  }
  return lines;
}

// ---- 줄 검사(07장 9.2절) ---------------------------------------------------------------------------------
const isStr = (v) => typeof v === 'string';
const nonEmpty = (v) => isStr(v) && v.trim().length > 0;
function validateLine(L, base, ctx, P) {
  const o = L.obj; const id = o.id; const fac = L.file;
  const hard = (kind, msg) => P.add('hard', kind, fac, id, msg);
  const alloc = (kind, msg) => P.add('alloc', kind, fac, id, msg);
  if (!isStr(id) || !/^person-\d{4}$/.test(id)) { hard('schema', `bad id ${JSON.stringify(id)}`); return false; }
  const old = base.people.find((p) => p.id === id);
  if (!old) { hard('unknown-id', 'id is not in 050'); return false; }
  const det = base.details.get(id);
  const recorded = base.frozenAge.has(id);
  let ok = true;
  for (const k of Object.keys(o)) {
    if (FIXED_INPUT_KEYS.includes(k)) { hard('fixed-key', `refused: fixed key "${k}" (README fixed facts)`); ok = false; } else if (!INPUT_KEYS.includes(k)) { hard('unknown-key', `key "${k}" is not in 07 9.2`); ok = false; }
  }
  if (o.age !== undefined && recorded) { hard('fixed-key', `refused: "age" is a recorded fixed fact (${base.frozenAge.get(id)})`); ok = false; }
  if (!ok) return false;
  for (const k of REQUIRED_Y) if (!(k in o)) hard('missing-key', `required key "${k}"`);
  if (!FACTIONS.includes(o.faction_id)) hard('schema', `faction_id ${JSON.stringify(o.faction_id)}`);
  else if (FILE_OF_FACTION[o.faction_id] !== fac) hard('file', `faction_id ${o.faction_id} belongs in ${FILE_OF_FACTION[o.faction_id]}.jsonl`);
  for (const k of ['row', 'role']) if (!nonEmpty(o[k])) hard('schema', `${k} must be a non-empty string`);
  for (const k of ['title_ko', 'title_en', 'position_ko', 'position_en']) if (!isStr(o[k]) || (!o[k].trim() && id !== 'person-1010')) hard('schema', `${k} must be a non-empty string`);
  if (!/^T[1-5]$/.test(o.tier ?? '')) hard('schema', `tier ${JSON.stringify(o.tier)}`);
  const expStage = STAGE_CHANGES[id] ?? old.stage;
  if (!['Key', 'S1', 'S2', 'S3', 'S4'].includes(o.stage)) hard('schema', `stage ${JSON.stringify(o.stage)}`);
  else if (o.stage !== expStage) alloc('stage', `stage ${o.stage}, 07 4.1 expects ${expStage}`);
  // 품계·직업
  const rank = RANKS.find((r) => r[0] === o.rank_ko);
  if (!rank) hard('unknown-rank', `rank_ko "${o.rank_ko}" is not in 07 8.5`);
  else {
    if (o.rank_en !== rank[1]) hard('rank-en', `rank_en "${o.rank_en}" should be "${rank[1]}"`);
    if (FACTIONS.includes(o.faction_id) && !rank[2].includes(FCODE[o.faction_id])) alloc('rank-faction', `rank ${o.rank_ko} is for ${rank[2]}, person is ${o.faction_id}`);
  }
  const occ = OCCUPATIONS.find((r) => r[0] === o.occupation_ko);
  if (!occ) hard('unknown-occupation', `occupation_ko "${o.occupation_ko}" is not in 07 8.2`);
  else {
    if (o.occupation_en !== occ[1]) hard('occupation-en', `occupation_en "${o.occupation_en}" should be "${occ[1]}"`);
    if (FACTIONS.includes(o.faction_id) && !occ[3].includes(FCODE[o.faction_id])) alloc('occupation-faction', `occupation ${o.occupation_ko} is for ${occ[3]}, person is ${o.faction_id}`);
  }
  // 자리
  const s = o.seat;
  if (s !== null && s !== undefined) {
    if (typeof s !== 'object' || !['head', 'district', 'dong', 'section', 'station'].includes(s.layer)) hard('seat', `seat ${JSON.stringify(s)}`);
    else if (s.layer === 'district' && !base.duchies.has(s.titleId)) hard('seat-id', `seat titleId ${s.titleId} is not a map_title duchy`);
    else if (s.layer === 'dong' && !base.regions.has(s.regionId)) hard('seat-id', `seat regionId ${s.regionId} is not a map_region`);
    else if (s.layer === 'station' && !base.stations.has(s.stationId)) hard('seat-id', `seat stationId ${s.stationId} is not a map_station`);
    else if (s.layer === 'section' && !base.sections.has(s.sectionId)) hard('seat-id', `seat sectionId ${s.sectionId} is not a 05 section 3 section`);
    else {
      const want = { head: ['government', 'arc'], district: ['government', 'free-city', 'arc'], dong: ['government', 'arc'], section: ['free-city'], station: ['government', 'free-city', 'arc'] }[s.layer];
      if (!want.includes(o.faction_id)) alloc('seat-faction', `seat layer ${s.layer} is not used by ${o.faction_id}`);
    }
  }
  const layer = s?.layer ?? null;
  const tierWant = { head: 'T1', district: 'T1', dong: 'T3', section: 'T3', station: 'T4' }[layer] ?? null;
  if (/^T[1-5]$/.test(o.tier ?? '')) {
    if (tierWant && o.tier !== tierWant) alloc('tier', `tier ${o.tier} but seat layer ${layer} means ${tierWant} (07 4.2)`);
    if (!tierWant && ['T1', 'T3', 'T4'].includes(o.tier)) alloc('tier', `tier ${o.tier} needs a seat (07 4.2)`);
  }
  // 거점
  const loc = o.location;
  if (!loc || typeof loc !== 'object') hard('schema', 'location must be {workStationId, homeStationId}');
  else for (const k of ['workStationId', 'homeStationId']) if (!base.stations.has(loc[k])) hard('station-id', `location.${k} "${loc[k]}" is not a map_station id`);
  // 가구
  const hh = o.household;
  if (!hh || !isStr(hh.id) || !['head', 'member', 'single'].includes(hh.role)) hard('schema', `household ${JSON.stringify(hh)}`);
  else {
    const fixedHh = Object.entries(HOUSEHOLDS).find(([, m]) => m.includes(id));
    const want = fixedHh ? { id: fixedHh[0], role: fixedHh[1][0] === id ? 'head' : 'member' } : { id: `hh:${id}`, role: 'single' };
    if (hh.id !== want.id || hh.role !== want.role) hard('household', `household ${hh.id}/${hh.role}, 07 6.1 expects ${want.id}/${want.role}`);
  }
  // 주군
  if (o.liege !== null && o.liege !== undefined) {
    if (!isStr(o.liege) || !base.people.some((p) => p.id === o.liege)) hard('liege-id', `liege ${JSON.stringify(o.liege)} is not a person id`);
    else if (o.liege === id) hard('liege-id', 'liege is the person itself');
  }
  // 부위 수
  if (id === 'person-1018') { if (o.partCount !== null) alloc('partCount', 'Hierophant partCount must be null (07 8.6)'); } else if (!Number.isInteger(o.partCount) || o.partCount < 0) hard('schema', `partCount ${JSON.stringify(o.partCount)}`);
  // 나이
  if (!recorded) {
    if (!Number.isInteger(o.age) || o.age < 0 || o.age > 110) hard('age', `age required for a person with no recorded age (got ${JSON.stringify(o.age)})`);
  }
  // 약력
  for (const k of ['biography_ko', 'biography_en']) {
    if (!nonEmpty(o[k])) { hard('schema', `${k} must be a non-empty string`); continue; }
    const n = sentences(o[k]).length;
    if (n < 2 || n > 6) alloc('biography-length', `${k} has ${n} sentences (07 9.3: 2-6)`);
  }
  // 친족 basis
  const kinOld = det ? ['outgoing', 'incoming'].flatMap((d) => (det.en.relations?.[d] ?? []).filter((r) => r.type === 'Kinship').map((r) => ({ dir: d, from: r.from, to: r.to }))) : [];
  if (kinOld.length) {
    if (!Array.isArray(o.kinBasis) || o.kinBasis.length !== kinOld.length) hard('kinBasis', `kinBasis needs ${kinOld.length} entries in 090 order`);
    else o.kinBasis.forEach((k, i) => {
      if (k.dir !== kinOld[i].dir || k.from !== kinOld[i].from || k.to !== kinOld[i].to) hard('kinBasis', `kinBasis[${i}] dir/from/to must equal 090 (${kinOld[i].dir} ${kinOld[i].from} -> ${kinOld[i].to})`);
      if (!nonEmpty(k.basis_ko) || !nonEmpty(k.basis_en)) hard('kinBasis', `kinBasis[${i}] needs basis_ko and basis_en`);
    });
  } else if (o.kinBasis !== undefined) hard('kinBasis', 'kinBasis only for the six people with 090 Kinship entries');
  // ties, traits, skills
  const minTies = o.stage === 'Key' ? 2 : o.stage === 'S1' ? 1 : 0;
  if (o.ties !== undefined && !Array.isArray(o.ties)) hard('schema', 'ties must be an array');
  const ties = Array.isArray(o.ties) ? o.ties : [];
  if (ties.length < minTies) alloc('ties', `${o.stage} needs at least ${minTies} ties (has ${ties.length})`);
  ties.forEach((t, i) => {
    if (!base.people.some((p) => p.id === t.to) || t.to === id) hard('tie-id', `ties[${i}].to ${JSON.stringify(t.to)}`);
    if (!(t.type in TIE_TYPES)) hard('tie-type', `ties[${i}].type ${JSON.stringify(t.type)}`);
    if (!nonEmpty(t.basis_ko) || !nonEmpty(t.basis_en)) hard('schema', `ties[${i}] needs basis_ko and basis_en`);
  });
  for (const [k, max, keys] of [['traits', 2, TRAIT_KEYS], ['skills', 3, ['id', 'name_ko', 'name_en', 'rating']]]) {
    if (o[k] === undefined) { if (o.stage === 'Key') alloc(k, `Key needs at least one ${k.slice(0, -1)}`); continue; }
    if (!Array.isArray(o[k]) || o[k].length > max) { hard('schema', `${k} must be an array of at most ${max}`); continue; }
    if (o.stage === 'Key' && !o[k].length) alloc(k, `Key needs at least one ${k.slice(0, -1)}`);
    o[k].forEach((t, i) => {
      for (const kk of keys) if (kk === 'rating' ? !(Number.isInteger(t.rating) && t.rating >= 1 && t.rating <= 100) : !nonEmpty(t[kk])) hard('schema', `${k}[${i}].${kk}`);
      for (const kk of Object.keys(t)) if (!keys.includes(kk)) hard('schema', `${k}[${i}] has unknown key ${kk}${kk === 'effects' ? ' (effects are not written, 07 8.1)' : ''}`);
    });
  }
  // 초상
  const tok = base.tokens.get(id);
  const needsPortrait = tok && !tok.token.image?.sha256;
  if (needsPortrait) {
    const pt = o.portrait;
    if (!pt || typeof pt !== 'object') hard('portrait', 'portrait required (token without an image, 07 9.2)');
    else {
      const need = PORTRAIT_KEYS.filter((k) => k !== 'descriptionRole_en');
      for (const k of need) if (k === 'palette' ? !(Array.isArray(pt.palette) && pt.palette.length === 3 && pt.palette.every(nonEmpty)) : !nonEmpty(pt[k])) hard('portrait', `portrait.${k}`);
      if (tok.token.artProposal?.description && !nonEmpty(pt.descriptionRole_en)) hard('portrait', 'portrait.descriptionRole_en required (token has artProposal.description)');
      for (const k of Object.keys(pt)) if (!PORTRAIT_KEYS.includes(k)) hard('portrait', `portrait has unknown key ${k}`);
    }
  } else if (o.portrait !== undefined) hard('portrait', tok ? 'portrait refused: the token is bound to its image (07 10.3)' : 'portrait refused: the person has no token');
  // 수행단
  if (id === 'person-1008') {
    const r = o.retinue;
    if (!r) hard('retinue', 'retinue required for person-1008');
    else for (const k of RETINUE_KEYS) if (!(k in r)) hard('retinue', `retinue.${k}`);
  } else if (o.retinue !== undefined) hard('retinue', 'retinue only for person-1008');
  if (!Array.isArray(o.ledger) || !o.ledger.every(isStr)) hard('schema', 'ledger must be an array of strings');
  if (o.nonKoreanFamilyBasis !== undefined) {
    const nk = o.nonKoreanFamilyBasis;
    if (!nk || !base.nonKorean.some((f) => f.id === nk.familyId) || !nonEmpty(nk.basis_ko) || !nonEmpty(nk.basis_en)) hard('nonKorean', `nonKoreanFamilyBasis ${JSON.stringify(nk).slice(0, 80)}`);
  }
  // 기록된 나이가 품계 최소 나이보다 적은가(07 4.7절 4번, 5.3절)
  if (recorded && rank && occ) {
    const min = Math.max(RANK_MIN_AGE[o.rank_ko] ?? 0, occupationMinAge(o.faction_id, o.occupation_ko));
    if (base.frozenAge.get(id) < min) alloc('age-min', `recorded age ${base.frozenAge.get(id)} < minimum ${min} for ${o.rank_ko}/${o.occupation_ko} (07 5.1, 5.3)`);
  }
  ctx.valid.set(id, { o, file: fac, occ, rank });
  return true;
}

// ---- 교차 검사와 계산 ---------------------------------------------------------------------------------------
function crossCheck(lines, base, ctx, P) {
  const seen = new Map();
  for (const L of lines) {
    const id = L.obj?.id;
    if (!isStr(id)) continue;
    if (seen.has(id)) P.add('hard', 'duplicate-id', L.file, id, `id appears in ${seen.get(id)} and ${L.src}`); else seen.set(id, L.src);
  }
  for (const p of base.people) if (!seen.has(p.id)) P.add('hard', 'missing-id', FILE_OF_FACTION[p.faction_id] ?? '-', p.id, 'no input line for this 050 person');
  const V = ctx.valid;
  const fac = (id) => V.get(id)?.file ?? '-';
  // 자리 겹침
  const seatKey = (s) => (s ? `${s.layer}:${s.titleId ?? s.regionId ?? s.sectionId ?? s.stationId ?? (s.layer === 'head' ? 'head' : '?')}` : null);
  const bySeat = new Map();
  for (const [id, v] of V) {
    const k = seatKey(v.o.seat); if (!k) continue;
    const kk = v.o.seat.layer === 'head' ? `${k}:${v.o.faction_id}` : k;
    if (bySeat.has(kk)) P.add('alloc', 'duplicate-seat', v.file, id, `seat ${kk} is also held by ${bySeat.get(kk)}`); else bySeat.set(kk, id);
  }
  // T1 수
  const t1 = { government: 0, 'free-city': 0, arc: 0 };
  for (const v of V.values()) if (v.o.tier === 'T1' && v.o.faction_id in t1) t1[v.o.faction_id]++;
  for (const [f, want] of Object.entries({ government: 15, 'free-city': 7, arc: 5 })) if (t1[f] !== want) P.add('alloc', 'tier-count', FILE_OF_FACTION[f], null, `${f} has ${t1[f]} T1 people, 07 4.2 says ${want}`);
  // 국회의원 열넷은 서로 다른 집안
  const naClan = new Map();
  for (const [id, v] of V) if (v.o.faction_id === 'government' && v.o.seat?.layer === 'district') {
    const c = base.clanOf.get(id) ?? null;
    if (c && naClan.has(c)) P.add('alloc', 'assembly-clan', 'government', id, `same clan ${c} as Assembly member ${naClan.get(c)} (07 4.2)`); else if (c) naClan.set(c, id);
  }
  // 정원표 줄·단계 수
  const cnt = new Map();
  for (const v of V.values()) { const k = `${v.o.faction_id}|${v.o.row}`; if (!cnt.has(k)) cnt.set(k, { Key: 0, S1: 0, S2: 0, S3: 0, S4: 0 }); if (cnt.get(k)[v.o.stage] !== undefined) cnt.get(k)[v.o.stage]++; }
  for (const k of new Set([...cnt.keys(), ...base.quotas.keys()])) {
    const got = cnt.get(k) ?? { Key: 0, S1: 0, S2: 0, S3: 0, S4: 0 }; const want = base.quotas.get(k);
    const [f, row] = k.split('|');
    if (!want) { P.add('alloc', 'quota', FILE_OF_FACTION[f] ?? '-', null, `row "${row}" is not a quota-table row (${Object.values(got).reduce((a, b) => a + b, 0)} people)`); continue; }
    const diffs = Object.keys(want).filter((st) => got[st] !== want[st]).map((st) => `${st} ${got[st]}/${want[st]}`);
    if (diffs.length) P.add('alloc', 'quota', FILE_OF_FACTION[f], null, `row ${row}: ${diffs.join(', ')} (got/table)`);
  }
  // 자리 주인 표
  const holder = { head: {}, district: {}, dong: {}, section: {}, station: {} };
  for (const [id, v] of V) {
    const s = v.o.seat; if (!s) continue;
    if (s.layer === 'head') holder.head[v.o.faction_id] = id;
    if (s.layer === 'district') holder.district[base.duchies.get(s.titleId)?.name_ko] = id;
    if (s.layer === 'dong') holder.dong[s.regionId] = id;
    if (s.layer === 'section') holder.section[s.sectionId] = id;
    if (s.layer === 'station') holder.station[s.stationId] = id;
  }
  ctx.holder = holder;
  const districtOf = (v) => {
    const s = v.o.seat;
    if (s?.layer === 'district') return base.duchies.get(s.titleId)?.name_ko;
    if (s?.layer === 'dong') return base.regions.get(s.regionId)?.district_ko;
    if (s?.layer === 'section') return base.sections.get(s.sectionId)?.district;
    if (s?.layer === 'station') return base.stations.get(s.stationId)?.district_ko;
    const m = /^(\S+?구)/.exec(v.o.row); return m ? m[1] : null;
  };
  const houseHolder = (id, v) => {
    const clan = base.clanOf.get(id); if (!clan) return null;
    for (const [oid, ov] of V) if (oid !== id && ov.o.faction_id === v.o.faction_id && ['district', 'head'].includes(ov.o.seat?.layer) && base.clanOf.get(oid) === clan) return oid;
    return null;
  };
  // 07장 6.2절 의원 집안 칸(과제 30 결정): 정부 줄의 후계·배우자·친족·아이 네 칸. 주군은 그 줄 의석의 국회의원이다.
  // 종신 대통령의 옛 의석(종로)도 그 의석을 받은 사람(district 자리 주인)이 주군이고, 대통령(head 자리)은 주군이 아니다.
  const isAssemblyHouse = (v) => v.o.faction_id === 'government' && !v.o.seat && /^의원 집안/.test(v.o.role);
  const rowMember = (v) => holder.district[districtOf(v)] ?? null;
  // 주군 다시 계산(07장 9.4절)
  const expected = (id, v) => {
    if (id === 'person-1004') return 'person-1003';
    const f = v.o.faction_id; const s = v.o.seat; const top = f === 'government' ? holder.head.government ?? null : f === 'arc' ? holder.head.arc ?? null : null;
    if (s?.layer === 'head') return null;
    if (s?.layer === 'district') return top;
    if (s?.layer === 'dong' || s?.layer === 'section') return holder.district[districtOf(v)] ?? null;
    if (s?.layer === 'station') {
      let up = null;
      if (f === 'free-city') { for (const [sid, sec] of base.sections) if (sec.stationIds.includes(s.stationId) && holder.section[sid]) { up = holder.section[sid]; break; } } else up = holder.dong[base.dongOfStation.get(s.stationId)] ?? null;
      return up ?? holder.district[districtOf(v)] ?? null;
    }
    if (isAssemblyHouse(v)) return rowMember(v);
    if (v.o.tier === 'T2') {
      if (/후계|이을 자식/.test(v.o.role)) return houseHolder(id, v);
      return f === 'free-city' ? holder.district[districtOf(v)] ?? null : top;
    }
    if (v.o.tier === 'T5') {
      if (f === 'government' && /대통령실|대통령 비서관|비서관|경호/.test(v.o.role)) return holder.head.government ?? null;
      if (f === 'arc' && v.o.row === '교주의 집') return holder.head.arc ?? null;
      if (/의원 집안|우두머리 집안|곁집 집안/.test(v.o.role)) return houseHolder(id, v);
    }
    return null;
  };
  for (const [id, v] of V) {
    const want = expected(id, v);
    if ((v.o.liege ?? null) !== want) {
      const assembly = isAssemblyHouse(v);
      const house = !assembly && /후계|이을 자식|의원 집안|우두머리 집안|곁집 집안/.test(v.o.role) && !want;
      const note = assembly ? `; Assembly-house slot, liege is the Member of row ${v.o.row}${want ? '' : ' (no district seat holder)'}, 07 6.2` : house ? `; no T1 seat holder of the same clan ${base.clanOf.get(id) ?? '(no clan)'} in the faction, 07 6.2` : '';
      P.add('alloc', 'liege', v.file, id, `liege ${v.o.liege ?? 'null'}, 07 9.4 gives ${want ?? 'null'} (role ${v.o.role}, tier ${v.o.tier}${note})`);
    }
  }
  // 의원 집안 칸의 핏줄(07장 6.2절): 후계와 아이는 국회의원과 같은 씨족, 아이는 국회의원보다 어리다. 배우자·친족 칸은 다른 씨족을 허용한다.
  const ageOf = (pid) => base.frozenAge.get(pid) ?? V.get(pid)?.o.age;
  for (const [id, v] of V) {
    if (!isAssemblyHouse(v) || !/후계|아이/.test(v.o.role)) continue;
    const m = rowMember(v); if (!m) continue;
    const c = base.clanOf.get(id) ?? null; const mc = base.clanOf.get(m) ?? null;
    if (c !== mc) P.add('alloc', 'assembly-house-clan', v.file, id, `${v.o.role} has clan ${c ?? '(no clan)'}, the Member ${m} of row ${v.o.row} has ${mc ?? '(no clan)'}; heir and child slots are the Member's own clan (07 6.2)`);
    if (/아이/.test(v.o.role)) {
      const a = ageOf(id); const ma = ageOf(m);
      if (Number.isInteger(a) && Number.isInteger(ma) && a >= ma) P.add('alloc', 'assembly-house-age', v.file, id, `child age ${a} is not younger than the Member ${m} (${ma}) of row ${v.o.row} (07 6.2)`);
    }
  }
  // 자리 주인의 일하는 역(07장 4.6절 2번)
  for (const [id, v] of V) {
    const s = v.o.seat; if (!s || !v.o.location) continue;
    let want = null;
    if (s.layer === 'head') want = v.o.faction_id === 'government' ? '광화문' : '잠실';
    else if (s.layer === 'district') want = HOME_STATION[base.duchies.get(s.titleId)?.name_ko] ?? null;
    else if (s.layer === 'dong') { const st = [...(base.stationsOfDong.get(s.regionId) ?? [])].sort((a, b) => b.degree - a.degree || a.sort - b.sort)[0]; want = st?.id ?? null; } else if (s.layer === 'section') want = base.sections.get(s.sectionId)?.stationIds[0] ?? null;
    else if (s.layer === 'station') want = s.stationId;
    if (want && v.o.location.workStationId !== want) P.add('alloc', 'location', v.file, id, `seat holder works at ${v.o.location.workStationId}, 07 4.6 gives ${want}`);
    if (s.layer === 'dong' && !base.stationsOfDong.get(s.regionId)?.length) P.add('alloc', 'location', v.file, id, `dong seat ${s.regionId} has no station inside it`);
  }
  // 부위 수(07장 8.6절)
  for (const [id, v] of V) {
    if (id === 'person-1018') continue;
    const n = nOf(id); const r = v.o.role; let want;
    if (v.o.faction_id !== 'arc') want = v.o.occupation_ko === '이식 정비' ? null : 0;
    else if (id === 'person-1017') want = 0;
    else if (/곁집장/.test(r)) want = 2 + (n % 2);
    else if (/정비장/.test(r)) want = 3 + (n % 2);
    else if (/대피소장/.test(r)) want = 1 + (n % 2);
    else if (/호위장/.test(r)) want = 3;
    else if (/세례 전투원/.test(r)) want = 2 + (n % 3);
    else if (/곁집 어른|맞수/.test(r)) want = 2;
    else if (/정비공/.test(r)) want = 1 + (n % 2);
    else if (/말지기|교섭인|교주 호위/.test(r)) want = 1;
    else if (/가문 징집병/.test(r)) want = 0;
    else want = n % 6 === 0 ? 1 : 0;
    if (want === null) { if (v.o.partCount > 1) P.add('alloc', 'partCount', v.file, id, `partCount ${v.o.partCount}, at most 1 outside the Arc`); } else if (v.o.partCount !== want) P.add('alloc', 'partCount', v.file, id, `partCount ${v.o.partCount}, 07 8.6 gives ${want} (role ${r})`);
  }
  // 나이 없는 사람의 나이(07장 5.2절)
  const recAge = (pid) => base.frozenAge.get(pid);
  const branchOf = new Map();
  for (const c of base.clans) for (const b of c.branches_ko) for (const m of b.members ?? []) branchOf.set(m, b.members);
  for (const [id, v] of V) {
    if (recAge(id) !== undefined || !Number.isInteger(v.o.age) || !v.occ || !v.rank) continue;
    const cls = v.occ[2];
    let band = CHILD_ROLE.test(v.o.role) ? [6, 15] : TIER_BAND[v.o.tier] ?? (cls === 'soldier' ? SOLDIER_BAND[v.o.faction_id] : T5_BAND[cls]);
    band = [...band];
    // 5.2절: 품계는 쓰지 않는다. 나이에서 정해지는 정부 품계(8.6절)의 최소 나이는 띠에 넣지 않고, 역할로 정해지는 품계와 직업의 최소 나이만 넣는다.
    const min = Math.max(AGE_DERIVED_RANKS.has(v.o.rank_ko) ? 0 : RANK_MIN_AGE[v.o.rank_ko] ?? 0, occupationMinAge(v.o.faction_id, v.o.occupation_ko));
    if (min > band[0]) band[0] = min;
    if (band[1] < band[0]) band[1] = band[0];
    const kin = (branchOf.get(id) ?? []).map(recAge).filter((a) => a !== undefined);
    if (kin.length) {
      const w = [Math.min(...kin) - 8, Math.max(...kin) + 8];
      const lo = Math.max(band[0], w[0]); const hi = Math.min(band[1], w[1]);
      band = lo <= hi ? [lo, hi] : (w[0] > band[1] ? [band[1], band[1]] : [band[0], band[0]]);
    }
    const want = band[0] + (nOf(id) % (band[1] - band[0] + 1));
    if (v.o.age !== want) P.add('alloc', 'age', v.file, id, `age ${v.o.age}, 07 5.2 gives ${want} (band ${band[0]}-${band[1]}${kin.length ? ', kin window' : ''})`);
  }
  // 비한국계 가족 basis 자리(07장 9.2절)
  const famLine = new Map();
  for (const [id, v] of V) if (v.o.nonKoreanFamilyBasis) {
    const fid = v.o.nonKoreanFamilyBasis.familyId;
    if (famLine.has(fid)) P.add('hard', 'nonKorean', v.file, id, `family ${fid} basis is also on ${famLine.get(fid)}`); else famLine.set(fid, id);
  }
  for (const fam of base.nonKorean) {
    const byFile = {};
    for (const m of fam.members) { const f = fac(m); if (f !== '-') (byFile[f] ??= []).push(m); }
    const best = FACTION_FILES.filter((f) => byFile[f]).sort((a, b) => byFile[b].length - byFile[a].length || FACTION_FILES.indexOf(a) - FACTION_FILES.indexOf(b))[0];
    const want = best ? byFile[best].sort()[0] : null;
    const got = famLine.get(fam.id);
    if (!got) P.add('hard', 'nonKorean', best ?? '-', want, `non-Korean family ${fam.id} has no nonKoreanFamilyBasis line (expected on ${want})`);
    else if (want && got !== want) P.add('alloc', 'nonKorean', fac(got), got, `family ${fam.id} basis belongs on ${want} (07 9.2)`);
  }
}

// ---- 레코드 만들기 ---------------------------------------------------------------------------------------------
function build(base, ctx, opts) {
  const V = ctx.valid;
  const P = new Map(base.people.map((p) => [p.id, p]));
  const nodeId = (pid) => base.details.get(pid)?.en?.characterId ?? pid;
  const st = (sid) => base.stations.get(sid);
  const subs = new Map();
  for (const [id, v] of V) if (v.o.liege) { if (!subs.has(v.o.liege)) subs.set(v.o.liege, []); subs.get(v.o.liege).push(id); }
  for (const a of subs.values()) a.sort();
  const stateOf = (f) => base.states.get(f === 'independent' ? 'independent' : f);
  // 050
  const people050 = new Map();
  for (const [id, v] of V) {
    const o = v.o; const s = stateOf(o.faction_id);
    people050.set(id, {
      faction_id: o.faction_id, title: o.title_en, title_ko: o.title_ko, position: o.position_en, position_ko: o.position_ko, rank: o.rank_en, rank_ko: o.rank_ko,
      tier: o.tier, occupation: o.occupation_en, occupation_ko: o.occupation_ko, stage: o.stage, stage_ko: o.stage === 'Key' ? '주요' : o.stage,
      state_id: o.faction_id, state_name: s.name, state_name_ko: s.name_ko,
    });
  }
  const nameOf = (pid, ko) => (ko ? P.get(pid).name_ko : P.get(pid).name);
  // 나이
  const ages = new Map();
  for (const [id, v] of V) {
    const d = base.details.get(id)?.en;
    if (base.frozenAge.has(id)) ages.set(id, { birthDate: d.birthDate, birthday: d.birthday, age: d.age, ageAsOf: d.ageAsOf, recorded: true });
    else {
      const n = nOf(id); const age = v.o.age; const mm = String((n % 12) + 1).padStart(2, '0'); const dd = String(((n * 7) % 28) + 1).padStart(2, '0');
      ages.set(id, { birthDate: `${2126 - age}-${mm}-${dd}`, birthday: `${mm}-${dd}`, age, ageAsOf: '2126-12-31', recorded: false });
    }
  }
  // 신앙
  const personFaith = (v) => {
    const pc = v.o.partCount;
    if (v.o.faction_id === 'arc') return pc === null ? 'none' : pc >= 1 ? 'baptised' : 'unbaptised';
    return pc >= 1 ? 'fitted' : 'none';
  };
  // 보유지(07장 9.4절)
  const holdings = new Map(); // pid -> holding {en, ko, scale, sortKey}
  const holdingIds = new Set(); // --force-allocation로 겹친 자리를 쓸 때는 id 순으로 먼저 온 사람만 보유지를 받는다
  for (const [id, v] of [...V].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const s = v.o.seat; if (!s || s.layer === 'head') continue;
    const sid = v.o.faction_id; const liege = v.o.liege ? nodeId(v.o.liege) : null;
    let h;
    const common = (hid, en, ko, scale, extra) => ({
      id: hid, holderPersonId: nodeId(id), directLiegePersonId: liege, stateId: sid, scale, nameEn: en, nameKo: ko, ...extra,
    });
    if (s.layer === 'district') {
      const t = base.duchies.get(s.titleId); const code = s.titleId.split(':').pop();
      const dongs = [...base.regions.values()].filter((r) => r.district_ko === t.name_ko).sort((a, b) => a.sort - b.sort);
      h = common(`holding:v3:duchy:${code}`, `${t.name} duchy`, `${t.name_ko} 공작령`, 'duchy', { adminRefs: dongs, titleId: s.titleId });
    } else if (s.layer === 'dong') {
      const r = base.regions.get(s.regionId);
      h = common(`holding:v3:dong:${s.regionId.split(':').pop()}`, r.name, r.name_ko, 'dong', { adminRefs: [r], titleId: null });
    } else if (s.layer === 'section') {
      const sec = base.sections.get(s.sectionId); const first = st(sec.stationIds[0]);
      const dongs = [...new Set(sec.stationIds.map((x) => base.dongOfStation.get(x)).filter(Boolean))].map((rid) => base.regions.get(rid));
      h = common(`holding:v3:section:${sec.district}:${sec.name}`, `${first?.name ?? sec.name} section`, `${sec.name} 구간`, 'section', { adminRefs: dongs, titleId: null, station: first });
    } else if (s.layer === 'station') {
      const x = st(s.stationId); const rid = base.dongOfStation.get(s.stationId);
      h = common(`holding:v3:station:${s.stationId}`, stationEn(x), stationKo(x), 'station', { adminRefs: rid ? [base.regions.get(rid)] : [], titleId: null, station: x });
    }
    if (holdingIds.has(h.id)) continue;
    holdingIds.add(h.id); holdings.set(id, h);
  }
  const holdingRecord = (h, ko, extra = {}) => {
    const rec = { id: h.id, name: ko ? { ko: h.nameKo } : { en: h.nameEn }, holderPersonId: h.holderPersonId, directLiegePersonId: h.directLiegePersonId, stateId: h.stateId };
    if (h.station) rec.stationRef = { stationId: h.station.id, stationName: ko ? h.station.name_ko : h.station.name };
    rec.adminRefs = h.adminRefs.map((r) => ({ id: r.id, name: ko ? r.name_ko : r.name }));
    Object.assign(rec, { territorialScale: h.scale, titleId: h.titleId, geometrySource: null, formalTitleRank: null }, extra);
    return rec;
  };
  // 090
  const details090 = new Map();
  for (const [id, v] of V) {
    const o = v.o; const old = base.details.get(id); const p050 = people050.get(id); const age = ages.get(id);
    const work = st(o.location.workStationId); const home = st(o.location.homeStationId);
    const head = Object.entries(HOUSEHOLDS).find(([hid]) => hid === o.household.id);
    const headId = head ? head[1][0] : id;
    const hhObj = { id: o.household.id, role: o.household.role, personFaith: personFaith(v), houseFaith: personFaith(V.get(headId) ?? v), humanoidAdmission: o.retinue ? 'admitted' : 'none' };
    const pc = o.partCount ?? 0;
    const bodyOrder = ['left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso'];
    const machine = new Set(['right-arm', 'left-arm', 'right-leg', 'left-leg', 'torso', 'head'].slice(0, Math.min(pc, 6)));
    const abilities = opts.recompute
      ? deriveTableStats(id, o.occupation_ko, o.rank_ko).stats
      : (old?.en?.characterProfile?.abilities ?? deriveTableStats(id, o.occupation_ko, o.rank_ko).stats);
    const oldValues = old?.en?.values;
    const cls = v.occ[2];
    // 9.5절. 상세 기록이 있던 사람(동결 시 나이가 기록된 511명)은 옛 값 − 옛 세력 평균 + v3 기준값.
    // 이미 v3 꼴인 기록(household.id가 있음)을 다시 돌리면 지금 값 − 지금 세력의 v3 기준값 + 새 세력의 v3 기준값(기준값이 10의 배수라 값이 그대로다).
    const curFaction = base.people.find((x) => x.id === id).faction_id;
    const isV3 = old?.en?.household?.id !== undefined;
    const valueNums = AXES_EN.map((a, i) => (base.frozenAge.has(id) && oldValues
      ? round5(oldValues[a] - (isV3 ? V3_BASE[curFaction][i] : OLD_MEAN[curFaction][i]) + V3_BASE[o.faction_id][i])
      : round5(V3_BASE[o.faction_id][i] + (CLASS_VALUE_MOD[cls][a] ?? 0))));
    const liege = o.liege;
    const mk = (ko) => {
      const L = (en, k) => (ko ? k : en);
      const src = ko ? old?.ko : old?.en;
      const rec = {};
      rec.id = id; rec.name = src?.name ?? nameOf(id, ko);
      rec.title = L(o.title_en, o.title_ko); rec.position = L(o.position_en, o.position_ko);
      if (src?.characterId !== undefined) rec.characterId = src.characterId;
      rec.rank = L(o.rank_en, o.rank_ko); rec.commonTier = o.tier; rec.occupation = L(o.occupation_en, o.occupation_ko);
      rec.gender = src?.gender ?? (ko ? P.get(id).gender_ko : P.get(id).gender);
      rec.stage = ko ? p050.stage_ko : p050.stage; rec.state = p050.state_id; rec.stateName = ko ? p050.state_name_ko : p050.state_name;
      rec.detailRoute = src?.detailRoute ?? `/people/${id}`;
      rec.birthDate = age.birthDate; rec.birthday = age.birthday; rec.age = age.age; rec.ageAsOf = age.ageAsOf;
      if (src?.generation !== undefined) rec.generation = src.generation;
      if (src?.clan !== undefined) rec.clan = src.clan;
      rec.sourceStatus = opts.recompute ? 'ck3-table-derived' : (src?.sourceStatus ?? 'ck3-table-derived');
      rec.sourceKind = 'proposal'; rec.minors = age.age < 18;
      if (src?.rightsPermissions !== undefined) rec.rightsPermissions = src.rightsPermissions;
      rec.biography = L(o.biography_en, o.biography_ko);
      const fields = {};
      const contributor = src?.fields?.[ko ? '기여자' : 'Contributor'];
      if (contributor !== undefined) fields[ko ? '기여자' : 'Contributor'] = contributor;
      fields[L('Affiliation', '소속')] = rec.stateName; fields[L('Title', '직함')] = rec.title; fields[L('Rank', '품계')] = rec.rank; fields[L('Livelihood', '생업')] = rec.occupation;
      fields[L('Work Station', '일하는 역')] = ko ? stationKo(work) : stationEn(work); fields[L('Home Station', '잠자는 역')] = ko ? stationKo(home) : stationEn(home);
      fields[L('Household', '가구')] = o.household.role === 'head' ? L('Head of household', '가구주') : o.household.role === 'member' ? L(`Member of ${nameOf(headId, false)}'s household`, `${nameOf(headId, true)} 가구의 가구원`) : L('Single household', '혼자 사는 가구');
      if (o.faction_id === 'arc' && o.partCount !== null) fields[L('Part Count', '부위 수')] = o.partCount;
      rec.fields = fields;
      const off = ko
        ? [rec.title && `직함 ${rec.title}.`, rec.position && `직위 ${rec.position}.`, `품계 ${rec.rank}.`, `일하는 역 ${stationKo(work)}.`]
        : [rec.title && `Title ${rec.title}.`, rec.position && `Position ${rec.position}.`, `Rank ${rec.rank}.`, `Work station ${stationEn(work)}.`];
      rec.sections = ko ? { 생애: o.biography_ko, 관직: off.filter(Boolean).join(' ') } : { Life: o.biography_en, Offices: off.filter(Boolean).join(' ') };
      rec.values = Object.fromEntries((ko ? AXES_KO : AXES_EN).map((a, i) => [a, valueNums[i]]));
      if (src?.desire !== undefined) rec.desire = src.desire;
      rec.household = { ...hhObj };
      // 관계
      const T = (t) => (ko ? TYPE_KO[t] : t);
      const kin = (dir) => (src?.relations?.[dir] ?? []).filter((r) => r.type === (ko ? '친족' : 'Kinship'));
      const withBasis = (dir) => { const bs = (o.kinBasis ?? []).filter((k) => k.dir === dir); return kin(dir).map((r, i) => ({ from: r.from, type: r.type, to: r.to, basis: ko ? bs[i].basis_ko : bs[i].basis_en })); };
      const kinOut = withBasis('outgoing'); const kinIn = withBasis('incoming');
      const cmdBasis = (lid) => { const lt = ko ? people050.get(lid).title_ko : people050.get(lid).title; const nm = nameOf(lid, ko); return ko ? `${lt ? `${lt} ` : ''}${nm}의 직속` : `Directly under ${lt ? `${lt} ` : ''}${nm}`; };
      const outgoing = [...kinOut];
      if (liege) outgoing.push({ from: nameOf(id, ko), type: T('Command'), to: nameOf(liege, ko), basis: cmdBasis(liege) });
      for (const t of o.ties ?? []) outgoing.push({ from: nameOf(id, ko), type: T(t.type), to: nameOf(t.to, ko), basis: ko ? t.basis_ko : t.basis_en });
      const incoming = [...kinIn];
      for (const sub of subs.get(id) ?? []) incoming.push({ from: nameOf(sub, ko), type: T('Command'), to: nameOf(id, ko), basis: cmdBasis(id) });
      for (const [oid, ov] of V) for (const t of ov.o.ties ?? []) if (t.to === id) incoming.push({ from: nameOf(oid, ko), type: T(t.type), to: nameOf(id, ko), basis: ko ? t.basis_ko : t.basis_en });
      rec.relations = { outgoing, incoming };
      if (liege) rec.directLiege = { personId: nodeId(liege), name: nameOf(liege, ko), courtId: `court:${nodeId(liege)}`, effectiveYear: 2126, ownerTerm: L('Direct liege', '직속 주군'), relationKind: 'direct-liege' };
      if (subs.get(id)?.length) rec.court = { id: `court:${nodeId(id)}`, members: subs.get(id).map((sid2) => ({ personId: nodeId(sid2), name: nameOf(sid2, ko) })) };
      if (o.retinue) {
        const r = o.retinue;
        rec.retinueGroups = [{ id: r.id, name: L(r.name_en, r.name_ko), courtId: `court:${nodeId(id)}`, liegePersonId: nodeId(id), count: r.count, duties: L(r.duties_en, r.duties_ko), personhoodReview: r.personhoodReview, technicalLimits: L(r.technicalLimits_en, r.technicalLimits_ko), holdingIds: r.holdingIds, formalTitle: r.formalTitle }];
      }
      rec.characterProfile = {
        abilities: Object.fromEntries(CK3_KEYS.map((k) => [k, { base: abilities[k].base, effective: abilities[k].base }])),
        skills: (o.skills ?? []).map((s) => ({ id: s.id, name: L(s.name_en, s.name_ko), rating: s.rating })),
        traits: (o.traits ?? []).map((t) => ({ id: t.id, name: L(t.name_en, t.name_ko), description: L(t.description_en, t.description_ko), behavior: L(t.behavior_en, t.behavior_ko), stress: L(t.stress_en, t.stress_ko), relationship: L(t.relationship_en, t.relationship_ko), effects: [] })),
        health: { status: pc >= 1 ? 'fitted' : 'unassessed', bodyParts: bodyOrder.map((b) => ({ id: b, severity: null, function: machine.has(b) ? 'machine' : null })), diseases: [] },
      };
      const h = holdings.get(id);
      if (h || old?.en?.confirmedHoldings !== undefined) rec.confirmedHoldings = h ? [holdingRecord(h, ko)] : [];
      const subH = (subs.get(id) ?? []).filter((x) => holdings.has(x));
      if (subH.length) rec.subordinateHoldings = subH.map((x) => holdingRecord(holdings.get(x), ko, { holderName: nameOf(x, ko), holderRoute: `/people/${x}` }));
      return rec;
    };
    details090.set(id, { clan_id: old?.clan_id ?? null, en: mk(false), ko: mk(true) });
  }
  // 115
  const graph = (ko) => {
    const inGraph = new Set();
    for (const [id, v] of V) if (v.o.liege) { inGraph.add(id); inGraph.add(v.o.liege); }
    if (V.has('person-1008') && V.get('person-1008').o.retinue) inGraph.add('person-1008');
    const ids = [...inGraph].sort();
    const r = V.get('person-1008')?.o.retinue;
    return {
      groups: r ? [{ id: r.id, name: ko ? r.name_ko : r.name_en, courtId: `court:${nodeId('person-1008')}`, liegePersonId: nodeId('person-1008'), count: r.count, duties: ko ? r.duties_ko : r.duties_en, personhoodReview: r.personhoodReview, technicalLimits: ko ? r.technicalLimits_ko : r.technicalLimits_en, holdingIds: r.holdingIds, formalTitle: r.formalTitle }] : [],
      nodes: ids.map((pid) => ({ id: nodeId(pid), name: nameOf(pid, ko), state: people050.get(pid).state_id, detailRoute: `/people/${pid}` })),
      edges: [...V].filter(([, v]) => v.o.liege).sort(([a], [b]) => (a < b ? -1 : 1)).map(([pid, v]) => ({ fromPersonId: nodeId(pid), toPersonId: nodeId(v.o.liege), courtId: `court:${nodeId(v.o.liege)}` })),
      courts: [...subs.keys()].sort().map((pid) => ({ id: `court:${nodeId(pid)}`, ownerPersonId: nodeId(pid), stateId: people050.get(pid).state_id })),
    };
  };
  const scaleRank = { duchy: 0, section: 1, dong: 1, station: 2 };
  const holdingRows = [...holdings.entries()].sort(([, a], [, b]) => scaleRank[a.scale] - scaleRank[b.scale] || (a.id < b.id ? -1 : 1));
  return { people050, details090, graph, holdingRows, holdingRecord, nodeId, nameOf };
}

// ---- 고정 칸 대조 ------------------------------------------------------------------------------------------
const FIXED_DETAIL_TOP = ['id', 'name', 'gender', 'birthDate', 'birthday', 'age', 'ageAsOf', 'generation', 'characterId', 'clan', 'detailRoute', 'rightsPermissions'];
function assertFixed(label, a, b, errs) { if (JSON.stringify(a) !== JSON.stringify(b)) errs.push(`${label}: ${JSON.stringify(a)?.slice(0, 60)} -> ${JSON.stringify(b)?.slice(0, 60)}`); }
const kinOf = (j) => ['outgoing', 'incoming'].flatMap((d) => (j.relations?.[d] ?? []).filter((r) => r.type === 'Kinship' || r.type === '친족').map((r) => [d, r.from, r.type, r.to]));
function getPath(o, p) { return p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o); }

// ---- main ------------------------------------------------------------------------------------------------
export function run(opts) {
  const P = new Problems();
  const base = loadBase(opts.sqlDir, opts.tokensDir);
  // 처분표(090, 초상 토큰)
  const undisposed = new Set();
  for (const [id, d] of base.details) for (const j of [d.en, d.ko]) {
    const ps = new Set(); walkPaths(j, '', ps);
    for (const p of ps) {
      if (!p) continue;
      const fm = /^(fields|sections)\.(.+)$/.exec(p);
      if (fm) { const set = fm[1] === 'fields' ? OLD_FIELD_KEYS : OLD_SECTION_KEYS; if (!set.has(fm[2]) && !(fm[1] === 'fields' && (FIELD_FIXED_KEYS.has(fm[2]) || V3_FIELD_KEYS.has(fm[2])))) undisposed.add(`090 ${p} (${id})`); continue; }
      if (!(p in DETAIL_DISPOSITION)) undisposed.add(`090 ${p} (${id})`);
    }
  }
  for (const [pid, t] of base.tokens) { const ps = new Set(); walkPaths(t.token, '', ps); for (const p of ps) if (p && !(p in TOKEN_DISPOSITION)) undisposed.add(`token ${p} (${pid})`); }
  if (undisposed.size) { const e = new Error(`E_UNDISPOSED_KEY (${undisposed.size}): no FIXED/REDESIGN/DROP in 07 section 10:\n${[...undisposed].slice(0, 40).join('\n')}`); e.code = 3; throw e; }
  // 직업 목록이 v3 OCCUPATION_CLASSES에서 의도한 등급으로 첫 일치하는지, 품계 목록이 RANK_MODIFIER와 같은지
  for (const [ko, , cls] of OCCUPATIONS) { const d = deriveTableStats('self-check', ko, '미등록'); if (d.classId !== cls) throw Object.assign(new Error(`E_TABLE: ${ko} -> ${d.classId}, 07 8.2 says ${cls}`), { code: 2 }); }
  for (const [ko] of RANKS) if (!RANK_MODIFIER[ko]) throw Object.assign(new Error(`E_TABLE: rank ${ko} missing from RANK_MODIFIER`), { code: 2 });
  if (Object.keys(RANK_MODIFIER).length !== RANKS.length) throw Object.assign(new Error('E_TABLE: RANK_MODIFIER and 07 8.5 differ'), { code: 2 });

  const lines = loadInputs(opts.inputDir, P);
  const ctx = { valid: new Map() };
  for (const L of lines) validateLine(L, base, ctx, P);
  crossCheck(lines, base, ctx, P);
  const summary = { lines: lines.length, valid: ctx.valid.size, hard: P.count('hard'), alloc: P.count('alloc'), problems: P.list };
  if (opts.checkOnly) return { mode: 'check-only', summary };
  if (summary.hard) return { mode: opts.dryRun ? 'dry-run' : 'apply', refused: 'hard input errors', summary };
  if (summary.alloc && !opts.forceAllocation) return { mode: opts.dryRun ? 'dry-run' : 'apply', refused: 'allocation errors (use --force-allocation for a scratch run)', summary };

  const B = build(base, ctx, opts);
  const fixedErrs = [];
  const changes = {};
  const files = {};
  const sqlPath = (f) => path.join(opts.sqlDir, f);
  // 050
  {
    const f = readSqlFile(sqlPath('050-wiki-people.sql')); let n = 0;
    for (const r of f.rows) {
      const id = r.get('id'); const before = PEOPLE_FIXED_COLS.map((c) => r.get(c));
      let ch = false; for (const [c, v] of Object.entries(B.people050.get(id))) ch = setVal(r, c, v) || ch;
      PEOPLE_FIXED_COLS.forEach((c, i) => assertFixed(`050 ${id}.${c}`, before[i], r.get(c), fixedErrs));
      if (ch) n++;
    }
    files['050-wiki-people.sql'] = f; changes['050 rows'] = n;
  }
  // 090
  {
    const f = readSqlFile(sqlPath('090-person-details.sql')); let n = 0;
    for (const r of f.rows) {
      const id = r.get('person_id'); const nd = B.details090.get(id); const od = base.details.get(id);
      for (const lang of ['en', 'ko']) {
        const o = od[lang]; const nw = nd[lang];
        for (const k of FIXED_DETAIL_TOP) if (o[k] !== undefined) assertFixed(`090 ${id}.${lang}.${k}`, o[k], nw[k], fixedErrs);
        assertFixed(`090 ${id}.${lang}.kinship`, kinOf(o), kinOf(nw), fixedErrs);
        if (o.fields?.Contributor !== undefined || o.fields?.['기여자'] !== undefined) assertFixed(`090 ${id}.${lang}.contributor`, o.fields.Contributor ?? o.fields['기여자'], nw.fields.Contributor ?? nw.fields['기여자'], fixedErrs);
      }
      assertFixed(`090 ${id}.clan_id`, od.clan_id, nd.clan_id, fixedErrs);
      const ch1 = setVal(r, 'json', JSON.stringify(nd.en)); const ch2 = setVal(r, 'json_ko', JSON.stringify(nd.ko));
      if (ch1 || ch2) n++;
    }
    files['090-person-details.sql'] = f; changes['090 rows'] = n;
  }
  // 110
  {
    const f = readSqlFile(sqlPath('110-family-trees.sql')); let n = 0; let living = 0;
    const NODE_FIXED = ['id', 'personId', 'kind', 'name', 'nameEn', 'birthDate', 'deathDate', 'detailRoute'];
    for (const r of f.rows) {
      let rowCh = false;
      for (const [col, ko] of [['json', false], ['json_ko', true]]) {
        const j = JSON.parse(r.get(col)); const before = JSON.stringify({ n: j.nodes.map((x) => NODE_FIXED.map((k) => x[k])), e: j.edges });
        for (const node of j.nodes) {
          if (node.kind === 'person') {
            const pid = /^\/people\/(person-\d{4})$/.exec(node.detailRoute ?? '')?.[1];
            const v = pid && ctx.valid.get(pid);
            if (!v) { fixedErrs.push(`110 node ${node.id}: no person for ${node.detailRoute}`); continue; }
            const p050 = B.people050.get(pid);
            node.sourceRefs = [{ path: `docs/drafts/people/${v.file}.jsonl`, anchor: pid }];
            node.timeline = [{ year: 2126, summary: firstSentence(ko ? v.o.biography_ko : v.o.biography_en) }];
            node.affiliation = { kind: 'state', stateId: p050.state_id, name: ko ? p050.state_name_ko : p050.state_name };
            if (!ko) living++;
          } else node.timeline = [];
        }
        assertFixed(`110 ${r.get('clan_id')}.${col}`, before, JSON.stringify({ n: j.nodes.map((x) => NODE_FIXED.map((k) => x[k])), e: j.edges }), fixedErrs);
        rowCh = setVal(r, col, JSON.stringify(j)) || rowCh;
      }
      if (rowCh) n++;
    }
    files['110-family-trees.sql'] = f; changes['110 trees'] = n; changes['110 living nodes'] = living;
  }
  // 115
  {
    const f = readSqlFile(sqlPath('115-retainer-graph.sql'));
    if (f.rows.length !== 1) throw Object.assign(new Error('E_SQL_SHAPE: 115 must have exactly one row'), { code: 5 });
    const ch1 = setVal(f.rows[0], 'json', JSON.stringify(B.graph(false))); const ch2 = setVal(f.rows[0], 'json_ko', JSON.stringify(B.graph(true)));
    files['115-retainer-graph.sql'] = f; changes['115 rows'] = ch1 || ch2 ? 1 : 0;
    const g = B.graph(false); changes['115 nodes/edges/courts'] = `${g.nodes.length}/${g.edges.length}/${g.courts.length}`;
  }
  // 123
  {
    const f = readSqlFile(sqlPath('123-map-holdings.sql'));
    const firstIdx = f.rows.findIndex((r) => r.table === 'map_holding');
    const tmpl = f.rows[firstIdx];
    const oldCount = f.rows.filter((r) => r.table === 'map_holding').length;
    const newRows = B.holdingRows.map(([, h], i) => {
      const r = { ...tmpl, vals: tmpl.vals.map((x) => ({ ...x })), get: null };
      r.get = (c) => r.vals[r.cols.indexOf(c)].value;
      setVal(r, 'id', h.id); setVal(r, 'sort', i); setVal(r, 'name', h.nameEn); setVal(r, 'name_ko', h.nameKo);
      setVal(r, 'holder_person_id', h.holderPersonId); setVal(r, 'state_id', h.stateId);
      setVal(r, 'data', JSON.stringify(B.holdingRecord(h, false))); setVal(r, 'data_ko', JSON.stringify(B.holdingRecord(h, true)));
      return r;
    });
    f.rows = f.rows.flatMap((r, i) => (r.table !== 'map_holding' ? [r] : i === firstIdx ? newRows : []));
    files['123-map-holdings.sql'] = f; changes['123 map_holding'] = `${oldCount} -> ${newRows.length}`;
  }
  // 100
  {
    const f = readSqlFile(sqlPath('100-clans.sql')); let nb = 0; let nf = 0;
    const famBasis = new Map(); for (const v of ctx.valid.values()) if (v.o.nonKoreanFamilyBasis) famBasis.set(v.o.nonKoreanFamilyBasis.familyId, v.o.nonKoreanFamilyBasis);
    for (const r of f.rows) {
      if (r.table === 'clan') {
        let ch = false;
        for (const [col, ko] of [['branches', false], ['branches_ko', true]]) {
          const arr = JSON.parse(r.get(col)); const before = JSON.stringify(arr.map((b) => [b.id, b.members]));
          for (const b of arr) {
            const syl = ko ? /^(\S+) 항렬/.exec(b.name)?.[1] : /^(\S+) Generation/i.exec(b.name)?.[1];
            if (!syl) { fixedErrs.push(`100 ${r.get('id')} branch ${b.id}: cannot read the generation syllable from "${b.name}"`); continue; }
            b.name = ko ? `${syl} 항렬 가계` : `${syl} generation line`; b.status = ko ? '추정' : 'Inferred';
          }
          assertFixed(`100 ${r.get('id')}.${col}`, before, JSON.stringify(arr.map((b) => [b.id, b.members])), fixedErrs);
          ch = setVal(r, col, JSON.stringify(arr)) || ch;
        }
        if (ch) nb++;
      } else if (r.table === 'nonkorean_family') {
        const b = famBasis.get(r.get('id'));
        if (b) { const ch = setVal(r, 'basis', b.basis_en); if (setVal(r, 'basis_ko', b.basis_ko) || ch) nf++; }
      }
    }
    files['100-clans.sql'] = f; changes['100 clans with branches'] = nb; changes['100 nonkorean_family'] = nf;
  }
  // 초상 토큰
  const tokenOut = new Map();
  {
    let n = 0;
    for (const [pid, t] of base.tokens) {
      const v = ctx.valid.get(pid); if (!v) continue;
      const tok = structuredClone(t.token); const p050 = B.people050.get(pid);
      tok.stateId = p050.state_id === 'independent' ? null : p050.state_id;
      tok.facts.role = p050.position_ko.trim() || null;
      const pt = v.o.portrait;
      if (pt && !tok.image?.sha256) {
        const ap = tok.artProposal;
        ap.upper = pt.upper_ko; ap.outfit = pt.outfit_ko; ap.lower = pt.lower_en; ap.footwear = pt.footwear_en; ap.accessories = pt.accessories_en;
        if (ap.headwear !== undefined) ap.headwear = pt.headwear_en;
        ap.palette = [...pt.palette];
        if (ap.description && pt.descriptionRole_en) { const i = ap.description.indexOf(';'); ap.description = i >= 0 ? `${pt.descriptionRole_en}${ap.description.slice(i)}` : pt.descriptionRole_en; }
        const slot = (value) => ({ value, status: 'derived-proposal', source: 'v3-07:clothing', derived: true });
        const so = tok.slots.outfit;
        so.upper = slot(pt.upper_ko); so.lower = slot(pt.lower_en); so.footwear = slot(pt.footwear_en); so.headwear = slot(pt.headwear_en); so.neckline = slot(pt.neckline_en);
        tok.slots.accessories = { description: slot(pt.accessories_en), color: slot(pt.accessoriesColor_en), material: slot(pt.accessoriesMaterial_en), mounting: slot(pt.accessoriesMounting_en), shape: slot(pt.accessoriesShape_en) };
      }
      tok.textToImage = textToImageBlock(tok);
      for (const [p, disp] of Object.entries(TOKEN_DISPOSITION)) if (disp === F && !p.includes('[]')) assertFixed(`token ${pid}.${p}`, getPath(t.token, p), getPath(tok, p), fixedErrs);
      const text = `${JSON.stringify(tok, null, 2)}\n`;
      if (text !== t.text) n++;
      tokenOut.set(t.file, text);
    }
    changes['portrait tokens'] = n;
  }
  if (fixedErrs.length) { const e = new Error(`E_FIXED_WRITE (${fixedErrs.length}): refused to write a FIXED field:\n${fixedErrs.slice(0, 30).join('\n')}`); e.code = 4; throw e; }
  const byteChanges = {}; const texts = {};
  for (const [name, f] of Object.entries(files)) { const t = sqlText(f); texts[name] = t; byteChanges[name] = t === f.text ? 'unchanged' : `${Buffer.byteLength(f.text)} -> ${Buffer.byteLength(t)} bytes`; }
  // 쓰기 전에 새 SQL 전체가 스키마에 실리는지 확인한다(기본 키 겹침 등).
  {
    const db = new DatabaseSync(':memory:');
    for (const name of fs.readdirSync(opts.sqlDir).filter((x) => x.endsWith('.sql')).sort()) {
      try { db.exec(texts[name] ?? fs.readFileSync(path.join(opts.sqlDir, name), 'utf8')); } catch (e) { throw Object.assign(new Error(`E_SQL_LOAD: ${name}: ${e.message}`), { code: 5 }); }
    }
  }
  if (!opts.dryRun) for (const [name, f] of Object.entries(files)) fs.writeFileSync(f.file, texts[name]);
  if (!opts.dryRun) for (const [file, text] of tokenOut) fs.writeFileSync(path.join(opts.tokensDir, file), text);
  return { mode: opts.dryRun ? 'dry-run' : 'apply', summary, changes, byteChanges, recompute: !!opts.recompute };
}

// ---- CLI ---------------------------------------------------------------------------------------------------
function printProblems(list, max) {
  const by = {};
  for (const p of list) { const k = `${p.severity} ${p.faction} ${p.kind}`; by[k] = (by[k] ?? 0) + 1; }
  const out = Object.entries(by).sort().map(([k, v]) => `  ${k}: ${v}`);
  out.push(...list.slice(0, max).map((p) => `  [${p.severity}] ${p.faction} ${p.id} ${p.kind}: ${p.msg}`));
  if (list.length > max) out.push(`  ... ${list.length - max} more (use --report)`);
  return out.join('\n');
}
function main() {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  if (flag('--help') || flag('-h')) { process.stdout.write(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).join('\n') + '\n'); process.exit(0); }
  const known = ['--check-only', '--dry-run', '--recompute-stats', '--force-allocation', '--input-dir', '--sql-dir', '--tokens-dir', '--report', '--max'];
  for (let i = 0; i < args.length; i++) { if (!known.includes(args[i])) { process.stderr.write(`unknown argument ${args[i]}\n`); process.exit(2); } if (['--input-dir', '--sql-dir', '--tokens-dir', '--report', '--max'].includes(args[i])) i++; }
  const opts = {
    inputDir: path.resolve(opt('--input-dir', path.join(REPO, 'docs/drafts/people'))),
    sqlDir: path.resolve(opt('--sql-dir', process.env.SITE_SQL_DIR ?? path.join(REPO, 'data/sql'))),
    tokensDir: path.resolve(opt('--tokens-dir', path.join(REPO, 'public/portrait-tokens'))),
    checkOnly: flag('--check-only'), dryRun: flag('--dry-run'), recompute: flag('--recompute-stats'), forceAllocation: flag('--force-allocation'),
  };
  let res;
  try { res = run(opts); } catch (e) { process.stderr.write(`${e.message}\n`); process.exit(Number.isInteger(e.code) ? e.code : 70); }
  const reportPath = opt('--report', null);
  if (reportPath) fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(res, null, 1)}\n`);
  const s = res.summary;
  process.stdout.write(`mode=${res.mode} input=${opts.inputDir} sql=${opts.sqlDir}\nlines=${s.lines} valid=${s.valid} hard=${s.hard} alloc=${s.alloc}\n`);
  if (s.problems.length) process.stdout.write(`${printProblems(s.problems, Number(opt('--max', 40)))}\n`);
  if (res.refused) { process.stdout.write(`REFUSED: ${res.refused}; nothing written\n`); process.exit(1); }
  if (res.changes) process.stdout.write(`changes: ${JSON.stringify(res.changes)}\nfiles: ${JSON.stringify(res.byteChanges)}${res.mode === 'dry-run' ? '\n(dry-run: nothing written)' : ''}\n`);
  process.exit(res.mode === 'check-only' && (s.hard || s.alloc) ? 1 : 0);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
