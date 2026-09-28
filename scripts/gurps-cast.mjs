#!/usr/bin/env node
// 겁스 4판 인물 수치(lore/name-pools/gurps-cast.json)의 파생·검사기.
//
//   node scripts/gurps-cast.mjs --write        카드에서 다시 파생해 gurps-cast.json을 쓴다.
//   node scripts/gurps-cast.mjs --check        파일을 독립 검사하고, 다시 파생한 결과와 바이트 단위로 대조한다.
//   node scripts/gurps-cast.mjs --review <tsv> 문장 틀별 판정 표를 쓴다(검토용, 저장소 밖 경로).
//
// 규칙의 원천은 lore/characters/Cast-Profile-Contract.md §겁스 4판이다. 수치는 gurps-cast.json에만 둔다.
// 카드 산문은 읽기만 한다. 인용은 카드 JSON 노드의 한국어 문자열과 글자 단위로 대조한다.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const OUT = 'lore/name-pools/gurps-cast.json'
export const SCHEMA = 'wiki-gurps-cast.v1'
const CONTRACT = 'lore/characters/Cast-Profile-Contract.md'
const REGISTRY = 'lore/name-pools/person-id-registry.json'
const VALUES = 'lore/name-pools/values-cast.json'
// 입력 해시(person-id-registry approvalRef, 2026-09-28 K1019 발급 소유자 승인). 두 파일은 이 작업에서 바뀌면 안 된다.
export const APPROVED_HASHES = {
  [VALUES]: 'd8539fc26d75566cb9e5109ff2963f773641c3ae0442583c2649c45d9ac17508',
  [REGISTRY]: 'd5fb337c16d91f4ac0200ea91accb16400742e53e1ed5a046f76f381ddf41f23',
}
const CARD_FILES = [
  ...Array.from({ length: 16 }, (_, i) => `lore/characters/Cast-State-${String(i + 1).padStart(2, '0')}.json`),
  'lore/characters/Core-Characters.json',
  'lore/characters/Cast-Unaffiliated.json',
  'lore/factions/Diaspora-Corridors.json',
]

// ---- 규칙표 (GURPS Basic Set 4판: B14–17 능력·보조 특성, B170 Skill Cost Table, B26–27 Reputation, B43 Combat Reflexes) ----
export const ATTR_COST = { ST: 10, DX: 20, IQ: 20, HT: 10 }
export const DIFF_BASE = { E: 0, A: -1, H: -2, VH: -3 }
export const TIERS = { A: 12, B: 8, C: 4, D: 2 }
export const ABILITY_BASE = 10
export const ABILITY_CAP = 3
// 계약의 출발 구간. 경계값은 위 구간에 넣는다(125 → 숙련자, 200 → 주역·강자).
// 75 CP 미만은 모자란 만큼 미사용 점수(unspent points)로 채운다(소유자 결정 2026-09-28, G2 Q2 B). 그래서 75 미만 구간은 없다.
export const BANDS = [
  { name: '일반 인물', min: 75, max: 124 },
  { name: '숙련자', min: 125, max: 199 },
  { name: '주역·강자', min: 200, max: 300 },
]
export function stepFor(cp) {
  if (cp === 1) return 0
  if (cp === 2) return 1
  if (cp === 4) return 2
  if (cp >= 8 && cp % 4 === 0) return 3 + (cp - 8) / 4
  return null
}
export const UNSPENT_FLOOR = 75
// 사용자 확정 직위 줄이 직접 가리키는 핵심 기술의 A 등급(소유자 결정 2026-09-28, G2 Q6 C). 견본 밖에서는 이 한 칸뿐이다.
export const OWNER_TIER_A = { K1004: 'Observation' }
const CONFIRMED_OFFICE = /^직위: .+ \(사용자 확정\)$/u
export const bandFor = (total) => BANDS.filter((b) => total >= b.min && total <= b.max).map((b) => b.name)
// Per·Will은 IQ에서 파생하므로(B16) 그 기술의 행위 문장은 IQ 근거로 센다.
const abilityOf = (attr) => (attr === 'Per' || attr === 'Will' ? 'IQ' : attr)

// ---- 기술 목록 (Basic Set 4판 기준 능력/난이도) ----
export const SKILLS = {
  administration: { name: 'Administration', ko: '행정·기록', attr: 'IQ', diff: 'A' },
  observation: { name: 'Observation', ko: '관찰(경비·순찰)', attr: 'Per', diff: 'A' },
  mechanic: { name: 'Mechanic/TL?', ko: '기계 정비', attr: 'IQ', diff: 'A' },
  electrician: { name: 'Electrician/TL?', ko: '전력 설비', attr: 'IQ', diff: 'A' },
  electronicsOp: { name: 'Electronics Operation/TL? (Communications)', ko: '통신 운용', attr: 'IQ', diff: 'A' },
  electronicsRepair: { name: 'Electronics Repair/TL? (Communications)', ko: '통신 장비 정비', attr: 'IQ', diff: 'A' },
  physician: { name: 'Physician/TL?', ko: '진료', attr: 'IQ', diff: 'H' },
  firstAid: { name: 'First Aid/TL?', ko: '응급 처치·환자 이송', attr: 'IQ', diff: 'E' },
  pharmacy: { name: 'Pharmacy/TL? (Herbal)', ko: '약재', attr: 'IQ', diff: 'H' },
  hazmat: { name: 'Hazardous Materials/TL? (Biological)', ko: '검역·방역', attr: 'IQ', diff: 'A' },
  chemistry: { name: 'Chemistry/TL?', ko: '수질·시료 검사', attr: 'IQ', diff: 'H' },
  merchant: { name: 'Merchant', ko: '거래·경매', attr: 'IQ', diff: 'A' },
  accounting: { name: 'Accounting', ko: '회계·감사', attr: 'IQ', diff: 'H' },
  forgery: { name: 'Forgery/TL?', ko: '위조 감별', attr: 'IQ', diff: 'H' },
  diplomacy: { name: 'Diplomacy', ko: '교섭·조정', attr: 'IQ', diff: 'H' },
  leadership: { name: 'Leadership', ko: '지휘', attr: 'IQ', diff: 'A' },
  interrogation: { name: 'Interrogation', ko: '증인 대질', attr: 'IQ', diff: 'A' },
  areaKnowledge: { name: 'Area Knowledge (근무 구역)', ko: '지역 지식(전령·전달)', attr: 'IQ', diff: 'E' },
  navigation: { name: 'Navigation/TL? (Land)', ko: '길찾기(지상)', attr: 'IQ', diff: 'A' },
  cartography: { name: 'Cartography/TL?', ko: '실측·지도', attr: 'IQ', diff: 'A' },
  boating: { name: 'Boating/TL? (Unpowered)', ko: '수상 운송', attr: 'DX', diff: 'A' },
  farming: { name: 'Farming/TL?', ko: '경작·종자', attr: 'IQ', diff: 'A' },
  cooking: { name: 'Cooking', ko: '배급솥', attr: 'IQ', diff: 'A' },
  research: { name: 'Research/TL?', ko: '연구 기록', attr: 'IQ', diff: 'A' },
  leatherworking: { name: 'Leatherworking', ko: '가죽 공정', attr: 'DX', diff: 'E' },
  teaching: { name: 'Teaching', ko: '교습', attr: 'IQ', diff: 'A' },
  religiousRitual: { name: 'Religious Ritual', ko: '의례', attr: 'IQ', diff: 'H' },
  breathControl: { name: 'Breath Control', ko: '호흡 수련(심법)', attr: 'HT', diff: 'H' },
  shield: { name: 'Shield', ko: '방패술', attr: 'DX', diff: 'E' },
  staff: { name: 'Staff', ko: '봉', attr: 'DX', diff: 'A' },
  judo: { name: 'Judo', ko: '유도', attr: 'DX', diff: 'H' },
}

// ---- 생업 칸 사전: 생업 문자열 조각 → 기술. 위에서부터 적용하며, 한 생업에서 여러 기술이 나올 수 있다. ----
export const OCCUPATION_RULES = [
  ['administration', /기록|장부|필사|명부|원장|등기|인수인계|인계|공증|서기|대조|게시|대장 작성|일지|문서|사본|전표|송장|배차|출발 서명|서명 확인|접수|대기표|기재|보관|선거|개표|투표|감찰|봉인 관리|칸 배정|통지|창구|관리|인준|각인|배분|확인|검증|감독|통제|승인|재고|잔량|중량|무게|공개|보고|폐쇄|증언/],
  ['observation', /경비|순찰|초계|초소|수비|검문|출입 통제|단속|감시|매복 흔적|정찰|척후|호송(?!칸)|암호패|숙영 차단|무장 난입 제지|봉화|고지 횃불|검색|경보|당직$/],
  ['electronicsRepair', /통신 정비|통신 장비|안테나/],
  ['mechanic', /펌프기술|(?<!통신 )정비|수리|점검|검수|제동|차륜|부품|조립|결함|제빙기|누수|레버|제습기|스위치/],
  ['electrician', /발전|배전|전력|전원|충전/],
  ['electronicsOp', /송신|무전|방송/],
  ['physician', /진료|수술|치료|처방|병상|의료조|의료단/],
  ['firstAid', /부상자 이송|환자 호송|의료이송|의무 이송|이송 시각|이송 배차|중증도/],
  ['pharmacy', /약재|약초|시약|약품|투약|위조약|복용/],
  ['hazmat', /방역|검역|격리/],
  ['chemistry', /수질|채수|탁도|시료|표본 심사|안전 표본/],
  ['merchant', /경매|거래|시세|중개|환전|물류상|낙찰|시작가|시장/],
  ['accounting', /감사|정산|이중 지급|결제권|출자 장부/],
  ['forgery', /감정|감별|필적|위조/],
  ['diplomacy', /조정|중재|교섭|협상|쟁점/],
  ['leadership', /단장|대장$|편성|지휘/],
  ['interrogation', /대질/],
  ['areaKnowledge', /전령|전갈|전달|배달|안내/],
  ['navigation', /탐사/],
  ['cartography', /측량|실측|좌표|지도|선로도|조사/],
  ['boating', /수상 운송|나룻배/],
  ['farming', /경작|종자|곡물/],
  ['cooking', /배급솥/],
  ['research', /연구/],
  ['leatherworking', /가죽/],
  ['teaching', /교관|훈련·/],
]

// ---- 행위 문장 사전: 카드의 행위 문장 → 기술(선택), 추가 능력(선택). ----
// 문장 전체를 대조하는 틀(exact)을 먼저, 그다음 부분 패턴을 본다. skip은 행위가 아닌 문장(태도·경과·임명)이다.
export const SENTENCE_RULES = [
  // 행위가 아니거나 기술 근거가 되지 못하는 문장 틀
  { skip: true, re: /^(품계|직함은|생업 별명은|생업은) / },
  { skip: true, re: /세대\.$|에서 자랐다\.$|자리는 .+열렸다\.$|^이 일로 .+올랐다\.$/ },
  { skip: true, re: /^(빈 면제 칸을 위험 신호로 본다|말은 짧고 경로 쪽지는 길다|숨이 차도 사본 두 장을 한 손에 쥔다|늦은 보고를 죄로 본다)\./ },
  { skip: true, re: /인명 장부부터 (꺼내 들고 나왔다|챙겼다)\.$/ },
  { skip: true, re: /사적 청탁을 돌려보내고 공개 창구로 보냈다\.$/ },
  // 기술 근거가 되는 문장 틀
  { skill: 'mechanic', abilities: ['HT'], re: /고장 난 제동을 밤새 고쳐/ },
  { skill: 'mechanic', re: /불량 부품 상자를 출고 직전에 되돌려 보냈다/ },
  { skill: 'mechanic', re: /새는 이음매 세 곳을 찾아내/ },
  { skill: 'mechanic', re: /우회 급수로를 열었다/ },
  { skill: 'observation', re: /매복 흔적을 먼저 읽어/ },
  { skill: null, abilities: ['ST'], re: /환승 통로를 뚫어 부상자를 먼저 옮겼다/ },
  { skill: 'administration', re: /젖은 인준 문서를 말려 필사본으로 남겼다/ },
  { skill: 'administration', re: /최초 보고가 틀리자 참관 칸을 다시 열었다/ },
  { skill: 'leadership', re: /당직 두 명을 세워 이중 확인을 만들었다/ },
  { skill: 'interrogation', re: /공개 대질을 열었다/ },
  { skill: 'diplomacy', re: /밤새 나눴다/ },
  { skill: 'leadership', re: /피난 인파를 대표해 문을 열었다/ },
  { skill: 'leadership', re: /발언을 그 자리에서 끊는다|발언 시간을 넘기면 쪽지를 의장 앞에 밀어 넣는다/ },
  { skill: 'leadership', re: /작업 조를 순환 배치하고/ },
  { skill: 'mechanic', re: /(제동|차륜) (두께|마모)|마모 무늬로 야간 운행 거리를 읽고|공차로 사람을 기억하고|펌프 부품 상자의 무게가 장부와 다르면 즉시 저울을 갈아 끼우고/ },
  { skill: 'electrician', re: /예비 전원을 세 곳으로 나누고|연료 잔량과 출력 일지를 봉인해/ },
  { skill: 'observation', re: /(소리로|진동을|소리를|쇠망치 소리를) .*(읽고|먼저 듣고)|위조 각인을 사람 말보다 먼저 듣고|기름 냄새로 위장 물자를 가리고|습기로 사절 인파를 가늠하고|상자 무게로 속임수를 읽고/ },
  { skill: 'forgery', re: /글씨 기울기로 필적을 가늠하고|먹지 번짐을 사람 말보다 먼저 읽고/ },
  { skill: 'merchant', re: /시세를 올리기 전에 한 번 더 읽는다|시세를 강바람보다 빨리 읽고|시작가와 낙찰가를 벽에 쓰고/ },
  { skill: 'pharmacy', re: /약재 무게를 두 저울로 재고|건조 중량을 매일 벽에 적고|약초 건조 중량과 투약 명부/ },
  { skill: 'physician', re: /중증도만으로 치료한다|진료 소견을 나란히 붙이고|진료를 연다|선창 진료를 닫는다/ },
  { skill: 'firstAid', re: /이송 시각을 분 단위로 적고/ },
  { skill: 'physician', re: /왕진을 멈추지 않았다/ },
  { skill: 'forgery', re: /위조 화폐를 거두고/ },
  { skill: 'cartography', re: /실측한 길만 실선으로 남기고|측량 숫자를 현장에서 두 번 읽고/ },
  // 무소속 카드의 칸 문장
  { skill: 'staff', re: /^(호위 도구는|즉석 근접 도구는) 다룬다\.?$/ },
  { skill: 'observation', re: /명령을 전달·해석하고 정찰·호위 결과에 자기 이름으로 서명/ },
  { skill: 'electronicsRepair', re: /통신 장비를 정비했다|이동식 민간 중계기를 더했다/ },
  { skill: 'farming', re: /농업으로 생계를 잇고/ },
  // 기록·봉인·게시 절차 (행정)
  { skill: 'administration', re: /(열쇠와 기록만 넘기고|인수인계만 기록한다|개표 기록과 .+ 보관한다|칠판에 (쓰|적)|벽에 (다시 )?(쓰|적|붙이)|게시판에 (직접 )?붙이|게시하고|같은 줄에 적고|같은 벽에 붙이고|상자마다 적|서면만 받고|문장으로 다시 받아 적는다|받아 적|명부 두 장이 맞을 때만|사본 공증은|난외에 (따로 |오래 )?(적|남긴)|분필로 남긴다|종료일과 감사 조항을 먼저|철하지 않는다|재서명만 받는다|분필 색으로 칸 용도를 나누고|호송증에 .+ 적고|명부를 소리 내어 읽고|이름을 소리 내어 읽고|온도를 두 시간에 한 번 소리 내어 읽고|온도와 중량을 정오에 다시 읽고|배급표를 공개하고|인수인계|권한 행사와 반환 시각을 분 단위로 적었다|기록에 당시의 증언을 남겼다|증인란에 이름을 올렸다|출항 잔량을 공개하고|재현 가능한 실험 기록을 요구하고|정비 일지를 공개하고|곡물 재고를 세 차례 다시 세었고)/ },
]

// 일반 계열: 위의 틀에 없는 관직·일화·생애 문장. 능동 행위로 끝나는 문장에서 첫 계열 하나만 쓴다(성격 문장에는 쓰지 않는다).
export const GENERIC_SECTIONS = new Set(['관직', '일화', '생애', 'summary', 'narrative', '직위'])
export const NOT_ACTIVE = /(되었다|됐다|된다|되지 않았다|이다|먼저였다|뒤였다|주였다|원로였다|있다|없다|있었다|남았다|남는다|올랐다|생겼다|않았다|받았다|뽑혔으며.*|앉혔다|따른다|못한다|거쳤다|읽힌다|보인다|다툰다|주장했다|속삭이기 시작했다)\.$/u
export const GENERIC_RULES = [
  ['physician', /처방량을|칼을 계속했다|진료를 열|진료를 연기|중증도 표만 남겼다|수술은 .+서명|우선 치료 요청은 .+거절|진료 소견을 나란히|병상 대기 명부를/u],
  ['pharmacy', /가짜 약 상자를 .+봉인|약봉지를 이중 봉인|상자 하나를 깨 보이고|약재 하역 순서/u],
  ['hazmat', /격리 막과 출입 도장|격리 칸에 두고/u],
  ['chemistry', /수질 표본을 봉인|수질 쪽지를 매일 봉인|수질 표본 스티커를 확인|채수 시각과 시약 로트|채수와 .+원장에 남기|채수·균열/u],
  ['electrician', /예비 전지를 돌렸다|비상 발전을 .+(잠그|묶)|충전 줄을 뽑|회로를 내리|회로는 .+올린다|배전을 끊|전력 배분을 .+남기|출력 일지|쇄정만 남기|스위치를 물리적으로 빼|배전은 .+허용|충전 함의 빗장/u],
  ['electronicsOp', /정정 방송을 붙였다|송신을 끊지 않고/u],
  ['electronicsRepair', /안테나를 닦았다/u],
  ['mechanic', /을 고쳐|를 고쳐|수리하|수리해|정비하|정비해|분해|갈아 다시|결함을 만져내|점검을 의무화|점검하|점검해|계측 도장을 찍|재측정|깎인 베어링을 .+걸어|측정 없이 쓰지 않는다|차륜과 제동 상자를 .+올리고|제동을 잠그고|마모표와 패킹 날을/u],
  ['cartography', /측량했다|줄자로 다시 재|실측하지 않은 .+점선|수심과 .+원장|좌표를 같은 원장|측량과 송신 속보를 겹쳐|채수와 송신 속보를 겹쳐/u],
  ['merchant', /저울을 .*(걷어|바꿨|잠갔|멈추게)|경매를 .*(미뤘|유찰)|경매 자격|낙찰 무효|실재고만 저울에 올리|시세는 다음 날|공개 경매|경매 시작 전|선석 순번|아침 저울을 공개|회수 중량을 공개 저울|호송권 낙찰|정정 시세를 붙였다|상자를 봉한 채 값을 올렸다|거래를 끊었다|거래를 끊는다/u],
  ['observation', /도꾼을 붙잡|난입자를 문 밖에서 붙들|등잔을 모두 밝히/u],
  ['leadership', /소집했다|평의회를 소집한다|피난 인파를 대표|피해자 줄을 세우고|당직 두 명을 세워/u],
  ['diplomacy', /조건을 나눠|합의하였다|합의했다|하기로 합의/u],
  ['cooking', /솥은 불을 피우지/u],
  ['administration', /(적(고|는다|었다|게)|쓰(고|되|는다)|붙(이고|인다|였다)|남기(고|며)|남긴다|남겼다|봉인(하|해|한|했)|기록(하|한|했|해)|공개(하|한|했)|게시(하|한)|서명(하|한|했)|날인|철하|필사|대조(하|해|한)|받아 적|올리고|올린다|올렸다|되돌|돌려보|잠갔다|잠근다|청구했다|폭로했다|증언했다|보관하|보관한|나눠 |배포하|배달하|넘기고|넘긴다|넘겼다)/u],
]
// 일화·생애 문장은 본인의 행위만 센다. 본인 이름이 주어면 그 뒤를, 아니면 마지막 「…자」「,」 뒤의 주절을 보고,
// 주절에 다른 주어(…이/가)가 있으면 본인 행위가 아니다. 관직·직위 칸의 현재형은 본인이 주어인 문장으로 본다.
const EVENT_SECTIONS = new Set(['일화', '생애', 'summary', 'narrative'])
export function mainClause(text, section, name) {
  if (!EVENT_SECTIONS.has(section)) return text
  const own = text.match(new RegExp(`(?:^|[ ,])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:은|는|이|가) `, 'u'))
  if (own) return text.slice(own.index + own[0].length)
  const cut = Math.max(text.lastIndexOf(', '), ...[...text.matchAll(/[가-힣]자 /gu)].map((m) => m.index + m[0].length - 2))
  const main = cut >= 0 ? text.slice(cut + 2) : text
  const body = main.replace(/^\d{4}년 /u, '')
  return /(^|\s)[가-힣]+(이|가|들이) /u.test(body) || /^[가-힣·]+(은|는) /u.test(body) ? null : main
}

const CAST_SUFFIX = /\s*\((창작 제안|사용자 확정|미확인|발급된 인물 ID|개막 체류지 사용자 확정)\)\s*$/u

// ---- 원천 읽기 ----
const cache = new Map()
export function readSource(root, path) {
  const key = `${root}\0${path}`
  if (!cache.has(key)) {
    const raw = readFileSync(join(root, path), 'utf8')
    cache.set(key, { raw, json: path.endsWith('.json') ? JSON.parse(raw) : null })
  }
  return cache.get(key)
}
const sha256 = (root, path) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
const leafText = (value) => (typeof value === 'string' ? value : Array.isArray(value) ? value.map((run) => run.text).join('') : '')
export function pointerGet(obj, pointer) {
  return pointer.split('/').slice(1).map((k) => k.replace(/~1/g, '/').replace(/~0/g, '~')).reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
// 증거 한 건: 저장소 경로 + JSON 포인터(없으면 파일 전체) + 원문 인용. 인용이 원문에 글자 그대로 있어야 한다.
export function quoteHolds(root, ev) {
  if (!ev || typeof ev.path !== 'string' || typeof ev.quote !== 'string' || !ev.quote) return false
  if (!existsSync(join(root, ev.path))) return false
  const { raw, json } = readSource(root, ev.path)
  if (ev.pointer === undefined) return raw.includes(ev.quote)
  if (!json) return false
  const node = pointerGet(json, ev.pointer)
  return typeof leafText(node) === 'string' && leafText(node).includes(ev.quote)
}

const SECTION = /^(?:\*\*)?(생애|관직|무공|일화|가문|관계|야망|공포|개입|신념)\.(?:\*\*)?\s*/u
const TIER_BY_SECTION = { 관직: 'B', p1: 'B', 성격: 'B', 직위: 'B', '통치 방식': 'B', '통치·교섭 방식': 'B', '무장 접근': 'C', 일화: 'C', 생애: 'C', summary: 'C', narrative: 'C' }
const ACTION_FIELDS = new Set(['직위', '무장 접근', '통치 방식', '통치·교섭 방식', '성격'])

// 인물 한 명의 카드 조각: 제목 블록부터 같은 깊이 이하의 다음 제목 전까지.
function cardBlocks(root, name) {
  const cards = []
  for (const path of CARD_FILES) {
    const content = readSource(root, path).json.content
    content.forEach((block, index) => {
      if (block.kind !== 'heading') return
      const heading = leafText(block.text?.ko)
      const bare = heading.replace(/^인물 /u, '').replace(/ \(.*\)$/u, '')
      if (bare !== name || (block.depth === 2 && path.endsWith('Cast-Unaffiliated.json'))) return
      let end = index + 1
      while (end < content.length && !(content[end].kind === 'heading' && content[end].depth <= block.depth)) end += 1
      cards.push({ path, index, depth: block.depth, blocks: content.slice(index + 1, end).map((b, k) => ({ block: b, index: index + 1 + k })) })
    })
  }
  return cards
}

// 카드의 한국어 문장을 절(section)과 함께 꺼낸다.
function cardSentences(card, core) {
  const state = card.path.includes('/Cast-State-')
  const out = []
  const fields = []
  let first = true
  for (const { block, index } of card.blocks) {
    const leaves = block.kind === 'list'
      ? block.items.map((item, j) => ({ text: leafText(item?.ko), pointer: `/content/${index}/items/${j}/ko` }))
      : block.text ? [{ text: leafText(block.text.ko), pointer: `/content/${index}/text/ko` }] : []
    for (const leaf of leaves) {
      let section = block.kind === 'paragraph'
        ? (core && first ? 'summary' : state && block.anchor?.endsWith('-p1') ? 'p1' : 'narrative')
        : 'field'
      for (const line of leaf.text.split('\n')) {
        const label = line.match(SECTION)
        let body = line
        if (label) { section = label[1]; body = line.slice(label[0].length) }
        if (!label && section === 'field') {
          const field = line.match(/^([^:]{1,12}):\s*(.+)$/u)
          if (field) {
            fields.push({ key: field[1].trim(), value: field[2].trim(), pointer: leaf.pointer, quote: line })
            if (ACTION_FIELDS.has(field[1].trim())) {
              const confirmed = CONFIRMED_OFFICE.test(line)
              for (const s of field[2].split(/(?<=[.])\s+/u)) if (s.trim()) out.push({ section: field[1].trim(), text: s.trim().replace(CAST_SUFFIX, ''), pointer: leaf.pointer, line, confirmed })
            }
            continue
          }
        }
        if (section === 'field' || section === 'narrative' && /^:::/u.test(body)) continue
        for (const s of body.split(/(?<=[.])\s+/u)) if (s.trim()) out.push({ section, text: s.trim(), pointer: leaf.pointer })
      }
      if (block.kind === 'paragraph') first = false
    }
  }
  return { sentences: out, fields }
}

// ---- 인물 한 명의 파생 ----
function evidence(path, pointer, quote) { return { path, pointer, quote } }

export function classifySentence(text, section, name = '') {
  for (const rule of SENTENCE_RULES) if (rule.re.test(text)) return rule
  if (!GENERIC_SECTIONS.has(section) || NOT_ACTIVE.test(text)) return null
  const main = mainClause(text, section, name)
  if (main === null) return { skip: true, generic: true, other: true }
  for (const [skill, re] of GENERIC_RULES) if (re.test(main)) return { skill, generic: true }
  return null
}

function occupationSkills(value) {
  // 「주 X / 부 Y」「X (주), Y (부)」「X (주). Y (부, …)」: 부 생업은 C 등급.
  const clean = value.replace(CAST_SUFFIX, '')
  const parts = []
  const slash = clean.match(/^주\s+(.+?)\s*\/\s*부\s+(.+)$/u)
  const paren = clean.match(/^(.+?)\s*\(주\)[,.]?\s*(.+?)\s*\(부[^)]*\)$/u)
  if (slash) parts.push({ text: slash[1], tier: 'B' }, { text: slash[2], tier: 'C' })
  else if (paren) parts.push({ text: paren[1], tier: 'B' }, { text: paren[2], tier: 'C' })
  else parts.push({ text: clean, tier: 'B' })
  const found = []
  for (const part of parts) for (const [skill, re] of OCCUPATION_RULES) if (re.test(part.text)) found.push({ skill, tier: part.tier })
  return found
}

// 카드의 「언어:」 줄에 적힌 언어를 적힌 순서대로 싣는다(소유자 결정 2026-09-28, G2 Q8 C).
// 첫 언어만 Native, 나머지 숙련도는 미정(null)이며 모두 0 CP다. 숙련도 CP는 뒤의 규칙을 기다린다.
const LANGUAGE_NAME = /북경 관화|고려말|[가-힣]+어/gu
const NOT_LANGUAGE = new Set(['시장어', '일상어', '용어'])
export function languagesOf(root, name) {
  for (const card of cardBlocks(root, name)) {
    const field = cardSentences(card, card.path.endsWith('Core-Characters.json')).fields.find((f) => f.key === '언어')
    if (!field) continue
    const first = field.value.replace(CAST_SUFFIX, '').split(/\.\s/u)[0]
    const names = [...new Set([...first.matchAll(LANGUAGE_NAME)].map((m) => m[0]).filter((n) => !NOT_LANGUAGE.has(n)))]
    return names.map((n, i) => ({ name: n, level: i === 0 ? 'Native' : null, cp: 0, evidence: [evidence(card.path, field.pointer, field.quote)] }))
  }
  return []
}

const MARTIAL = [
  [/^수문호흡법\./u, ['breathControl']],
  [/^차륜강체공\./u, ['breathControl']],
  [/^호위철벽진\./u, ['shield']],
  [/^유도\./u, ['judo']],
]

export function derivePerson(root, person, castNames) {
  const cards = cardBlocks(root, person.name)
  const otherSubject = new RegExp(`(^|[ ,])(${[...castNames].filter((n) => n !== person.name).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(은|는|이|가) `, 'u')
  const skillEv = new Map()
  const abilityEv = { ST: [], DX: [], IQ: [], HT: [] }
  const seenAbility = { ST: new Set(), DX: new Set(), IQ: new Set(), HT: new Set() }
  const addSkill = (skill, tier, ev, section) => {
    const cur = skillEv.get(skill) ?? { tier, evidence: [] }
    if (TIERS[tier] > TIERS[cur.tier]) cur.tier = tier
    if (!cur.evidence.some((e) => e.path === ev.path && e.pointer === ev.pointer && e.quote === ev.quote)) cur.evidence.push({ ...ev, section, tier })
    skillEv.set(skill, cur)
  }
  let role = null
  const review = []
  for (const card of cards) {
    const core = card.path.endsWith('Core-Characters.json')
    const { sentences, fields } = cardSentences(card, core)
    for (const field of fields) {
      if (field.key === '생업' && !role) role = { display: field.value.replace(CAST_SUFFIX, ''), evidence: [evidence(card.path, field.pointer, field.quote)] }
      if (field.key === '생업') for (const { skill, tier } of occupationSkills(field.value)) addSkill(skill, tier, evidence(card.path, field.pointer, field.quote), '생업')
    }
    for (const s of sentences) {
      if (s.section === '생업' || ['관계', '야망', '공포', '개입', '가문', '신념'].includes(s.section)) continue
      if (s.section === '무공') {
        for (const [re, skills] of MARTIAL) if (re.test(s.text)) for (const skill of skills) addSkill(skill, 'C', evidence(card.path, s.pointer, s.text), '무공')
        continue
      }
      if (!role && s.section === '관직' && /^생업 별명은 /u.test(s.text)) role = { display: s.text.replace(/^생업 별명은 /u, '').replace(/\.$/u, ''), evidence: [evidence(card.path, s.pointer, s.text)] }
      if (s.section === '관직' && /^생업 별명은 /u.test(s.text)) {
        for (const { skill, tier } of occupationSkills(s.text.replace(/^생업 별명은 /u, '').replace(/\.$/u, ''))) addSkill(skill, tier, evidence(card.path, s.pointer, s.text), '생업')
        continue
      }
      if (otherSubject.test(s.text)) { review.push({ section: s.section, text: s.text, verdict: 'other-subject' }); continue }
      const rule = classifySentence(s.text, s.section, person.name)
      review.push({ section: s.section, text: s.text, verdict: rule ? (rule.skip ? (rule.other ? 'other-actor' : 'skip') : `${rule.generic ? '~' : ''}${rule.skill ?? '-'}${rule.abilities ? `+${rule.abilities.join('')}` : ''}`) : 'unmatched' })
      if (!rule || rule.skip) continue
      const ev = evidence(card.path, s.pointer, s.text)
      // 사용자 확정 직위 줄이 가리키는 기술은 A다. 인용은 확정 표시가 보이도록 직위 줄 전체로 한다.
      const confirmed = s.section === '직위' && s.confirmed
      const tier = confirmed ? 'A' : TIER_BY_SECTION[s.section] ?? 'C'
      if (rule.skill && !rule.skipSkill) addSkill(rule.skill, tier, confirmed ? evidence(card.path, s.pointer, s.line) : ev, s.section)
      const abilities = new Set(rule.abilities ?? [])
      if (rule.skill && !rule.skipSkill) abilities.add(abilityOf(SKILLS[rule.skill].attr))
      for (const a of abilities) {
        if (seenAbility[a].has(s.text)) continue
        seenAbility[a].add(s.text)
        abilityEv[a].push(ev)
      }
    }
    // 생업 칸이 없는 카드(Core)의 생업 별명은 역할 표시로만 쓴다.
  }
  const attributes = Object.fromEntries(Object.keys(ATTR_COST).map((a) => {
    const count = Math.min(ABILITY_CAP, abilityEv[a].length)
    const value = ABILITY_BASE + count
    return [a, { value, cp: (value - ABILITY_BASE) * ATTR_COST[a], rule: 'card-actions', evidence: abilityEv[a].slice(0, ABILITY_CAP) }]
  }))
  const skills = [...skillEv.entries()].map(([key, { tier, evidence: evs }]) => ({ key, tier, evidence: evs }))
  return { cards, role, attributes, skills, traits: [], review }
}

// ---- 승인 견본(G1)의 두 사람: 견본값을 그대로 쓰고, 능력 규칙과의 차이는 pilot-diff에 적는다. ----
const U = 'lore/characters/Cast-Unaffiliated.json'
const C = 'lore/characters/Core-Characters.json'
const MP = 'lore/culture/Martial-Paths.json'
const CA = 'lore/chronology/Century-Annals.json'
const REL = 'lore/characters/Cast-Relations.json'
const TL = 'lore/chronology/Scenario-Timeline.json'
const G = 'WORLD_BUILDING_GUIDE.md'
const PILOT_SOURCES = {
  'contract-combat': [CONTRACT, undefined, '조재표와 신종목은 높은 전투력의 주역·강자 구간에서 먼저 검토한다.'],
  'contract-pilot': [CONTRACT, undefined, 'G1 견본은 소유자가 견본값으로 승인했다(2026-09-28).'],
  'contract-cr': [CONTRACT, undefined, '조재표와 신종목에게 Combat Reflexes [15]를 둔다.'],
  'contract-shin': [CONTRACT, undefined, '신종목의 DX는 13이고 총검술(Spear)은 12 CP다.'],
  'contract-rep': [CONTRACT, undefined, 'Reputation은 카드가 유명세를 적은 사람에게만 둔다.'],
  'guide-bayonet': [G, undefined, '최소 문구는 `무공: 총검술` 또는 `신종목은 총검술을 익혔다.`다.'],
  'jo-residence': [U, '/content/3/items/2/ko', '현재 거주지 서울 전역 이동 회랑'],
  'jo-job': [U, '/content/3/items/7/ko', '생업: 주 탐사원 / 부 순찰대 (창작 제안)'],
  'jo-office': [U, '/content/3/items/9/ko', '직위: 유명 낭인 지휘자 — 이동 경로·호위 계약·철수 판단에 서명 (사용자 확정)'],
  'jo-arms': [U, '/content/3/items/11/ko', '무장 접근: 보유 지팡이와 낡은 여행복. 즉석 근접 도구는 다룬다. 총기·탄약·전력 경로는 미확인 (창작 제안)'],
  'jo-temper': [U, '/content/3/items/12/ko', '사람보다 경로와 약속 이행을 먼저 보지만 부하의 철수선을 버리지 않는 계산적 현장 지휘자다 (창작 제안)'],
  'jo-fear': [U, '/content/3/items/14/ko', '공포: 유명세가 일행을 현상금·징집·정치 선전의 표적으로 만드는 것 (창작 제안)'],
  'jo-rule': [U, '/content/3/items/15/ko', '통치 방식: 위험·대가·철수 조건을 먼저 공개하고 계약한다.'],
  'jo-mugong': [U, '/content/4/text/ko', '무공. 호위철벽진의 상륙호위진. 좁은 상륙 지점에서 민간인 철수로를 지키며 일행과 함께 물러나는 진형을 가르친다. 실제 해병대 복무와 총기 접근은 미확인이다.'],
  'jo-mp-class': [MP, '/content/92/text/ko', '분류: 지휘·편성'],
  'jo-mp-p1': [MP, '/content/93/text/ko', '조재표는 일행에게 상륙호위진의 편성 절차를 가르친다.'],
  'jo-annals-2121': [CA, '/content/482/text/ko', '2121년 2월 조재표가 경기 북부에서 서울로 들어왔다. 같은 해 조재표는 역과 회랑의 길 안내와 호위 계약을 맡기 시작하였다.'],
  'shin-p1': [C, '/content/173/text/ko', '호출부호는 백야다. 동방사 특수회수반의 선임 공작원이었다.'],
  'shin-p2-2119': [C, '/content/174/text/ko', '2119년 11월 동방사 특수회수반 선임 공작원 신종목은 명부 밖 피난민을 데리고 귀환했다.'],
  'shin-p2-move': [C, '/content/174/text/ko', '2120년 4월 신종목은 특수회수반에서 물러나 아들 신준과 강남구청 생활권으로 옮겼다.'],
  'shin-p2-contract': [C, '/content/174/text/ko', '그는 호위·탐사 계약을 맡고'],
  'shin-p2-radio': [C, '/content/174/text/ko', '수리한 무전기로 옛 호출부호를 송신했다.'],
  'shin-p2-log': [C, '/content/174/text/ko', '2121년 1월 의무원·주민·보호자의 응답을 기록했다.'],
  'shin-p2-net': [C, '/content/174/text/ko', '귀환망은 2124년 강남구청에서 선정릉과 수서까지 생활권 12곳을 이었다.'],
  'shin-p3': [C, '/content/175/text/ko', '생업 별명은 호위·탐사 계약·무전 송신.'],
  'shin-mugong': [C, '/content/176/text/ko', '무공. 총검술.'],
  'shin-p5': [C, '/content/177/text/ko', '귀환합성국의 이동식 중계 장비를 위해 현장 회수와 주민 동의를 맡는다.'],
  'shin-p8-relay': [C, '/content/179/text/ko', '새 중계기를 들일 때마다 현장 회수와 주민 동의를 직접 맡는다.'],
  'shin-annals-2119': [CA, '/content/441/text/ko', '마지막 회수 작전에서 명부 밖 피난민을 데리고 귀환하였다.'],
  'shin-annals-2120': [CA, '/content/454/text/ko', '2120년부터 신종목은 수리한 무전기로 특수회수반의 호출부호를 송신하였다.'],
  'shin-annals-2120-move': [CA, '/content/456/text/ko', '아이 신준과 함께 강남구청 생활권으로 거처를 옮긴 뒤 호위·탐사 계약을 맡았다.'],
  'shin-rel-195': [REL, '/content/1/rows/195/3/ko', '민웅기가 떠난 뒤 귀환합성국의 현장 회수와 주민 동의를 맡음'],
  'shin-timeline-2124': [TL, '/content/12/text/ko', '2124년 귀환망은 강남구청에서 선정릉과 수서까지 생활권 12곳을 이었으며 신종목이 그 명단을 기록하였다.'],
  'shin-timeline-20': [TL, '/content/20/text/ko', '귀환합성국의 송수신부를 폐쇄 통신창고에서 회수하려 하면 신종목과 같은 부품으로 생활 전력을 유지하는 주민이 회수 수량을 두고 협의한다.'],
  'mp-bayonet': [MP, '/content/17/rows/6/2/ko', '군 경력·징집 잔존자가 빈 총대의 무게와 날을 전한다'],
}
const src = (...ids) => ids.map((id) => { const [path, pointer, quote] = PILOT_SOURCES[id]; return pointer === undefined ? { path, quote } : { path, pointer, quote } })
const pilotSkill = (name, ko, attr, diff, tier, ids) => ({ curated: { name, ko, attr, diff }, tier, evidence: src(...ids) })
export const PILOT = {
  K1003: {
    attributes: {
      ST: [11, ['contract-pilot', 'jo-arms']],
      DX: [12, ['contract-pilot', 'jo-arms']],
      IQ: [13, ['contract-pilot', 'jo-office', 'jo-temper']],
      HT: [12, ['contract-pilot', 'jo-residence', 'jo-annals-2121']],
    },
    role: 'jo-job',
    traits: [
      { name: 'Reputation +2 (유능한 호위 지휘자; 서울 역·회랑의 호위 의뢰인과 통행자 — 큰 집단 ×1/2; 항상 ×1)', kind: 'advantage', rule: 'reputation', level: 2, people: 0.5, frequency: 1, cp: 5, page: 'B26–27', evidence: src('jo-office', 'jo-fear', 'contract-rep') },
      { name: 'Combat Reflexes', kind: 'advantage', rule: 'combat-reflexes', cp: 15, page: 'B43', evidence: src('contract-cr') },
    ],
    skills: [
      pilotSkill('Leadership', '지휘', 'IQ', 'A', 'A', ['jo-office', 'jo-temper', 'jo-mp-p1']),
      pilotSkill('Tactics', '전술(상륙호위진 편성·철수 판단)', 'IQ', 'H', 'A', ['jo-office', 'jo-mugong', 'jo-mp-class', 'jo-mp-p1', 'contract-combat']),
      pilotSkill('Navigation/TL? (Land)', '길찾기(지상)', 'IQ', 'A', 'B', ['jo-office', 'jo-job', 'jo-annals-2121']),
      pilotSkill('Area Knowledge (서울 역·회랑)', '지역 지식', 'IQ', 'E', 'B', ['jo-residence', 'jo-annals-2121']),
      pilotSkill('Diplomacy', '교섭(호위 계약)', 'IQ', 'H', 'B', ['jo-office', 'jo-rule', 'jo-annals-2121']),
      pilotSkill('Teaching', '교습(상륙호위진)', 'IQ', 'A', 'B', ['jo-mugong', 'jo-mp-p1']),
      pilotSkill('Observation', '관찰', 'Per', 'A', 'C', ['jo-job']),
      pilotSkill('Staff', '봉(지팡이)', 'DX', 'A', 'C', ['jo-arms']),
      pilotSkill('Hiking', '장거리 도보', 'HT', 'A', 'D', ['jo-residence']),
    ],
  },
  K1009: {
    attributes: {
      ST: [11, ['contract-pilot', 'contract-combat', 'shin-mugong', 'mp-bayonet']],
      DX: [13, ['contract-pilot', 'contract-shin', 'shin-mugong']],
      IQ: [12, ['contract-pilot', 'shin-p1', 'shin-p2-radio', 'shin-p2-log']],
      HT: [12, ['contract-pilot', 'shin-p2-2119', 'shin-p2-contract']],
    },
    role: 'shin-p3',
    traits: [
      { name: 'Combat Reflexes', kind: 'advantage', rule: 'combat-reflexes', cp: 15, page: 'B43', evidence: src('contract-cr') },
    ],
    skills: [
      pilotSkill('Spear (fixed bayonet)', '총검술', 'DX', 'A', 'A', ['shin-mugong', 'guide-bayonet', 'mp-bayonet', 'contract-combat', 'contract-shin']),
      pilotSkill('Electronics Operation/TL? (Communications)', '무전 운용', 'IQ', 'A', 'B', ['shin-p2-radio', 'shin-p3', 'shin-p5', 'shin-annals-2120']),
      pilotSkill('Area Knowledge (강남구청 생활권·귀환망 12곳)', '지역 지식', 'IQ', 'E', 'B', ['shin-p2-move', 'shin-p2-net', 'shin-timeline-2124']),
      pilotSkill('Scrounging', '현장 회수', 'Per', 'E', 'B', ['shin-p5', 'shin-p8-relay', 'shin-rel-195', 'shin-timeline-20']),
      pilotSkill('Diplomacy', '교섭(주민 동의)', 'IQ', 'H', 'B', ['shin-p5', 'shin-p8-relay', 'shin-rel-195', 'shin-timeline-20']),
      pilotSkill('Navigation/TL? (Land)', '길찾기(지상)', 'IQ', 'A', 'B', ['shin-p2-contract', 'shin-p3', 'shin-annals-2120-move']),
      pilotSkill('Leadership', '지휘(피난민 귀환)', 'IQ', 'A', 'C', ['shin-p2-2119', 'shin-annals-2119']),
      pilotSkill('Observation', '관찰(호위)', 'Per', 'A', 'C', ['shin-p2-contract']),
      pilotSkill('Hiking', '장거리 도보', 'HT', 'A', 'D', ['shin-p2-contract']),
    ],
  },
}

// ---- 계산 ----
function secondary(attrs, combatReflexes) {
  const speed = (attrs.DX.value + attrs.HT.value) / 4
  return {
    HP: attrs.ST.value, Will: attrs.IQ.value, Per: attrs.IQ.value, FP: attrs.HT.value,
    BasicSpeed: speed, BasicMove: Math.floor(speed), BasicLift: Math.round((attrs.ST.value * attrs.ST.value) / 5),
    Dodge: Math.floor(speed) + 3 + (combatReflexes ? 1 : 0),
  }
}
function skillLevel(attrs, sec, attr, diff, cp) {
  const base = attr === 'Per' ? sec.Per : attr === 'Will' ? sec.Will : attrs[attr]?.value
  const step = stepFor(cp)
  if (base === undefined || step === null || !(diff in DIFF_BASE)) return null
  return base + DIFF_BASE[diff] + step
}
function traitCp(t) {
  if (t.rule === 'reputation') return 5 * t.level * t.people * t.frequency
  if (t.rule === 'combat-reflexes') return 15
  return null
}

function finish(record) {
  const cr = record.traits.some((t) => t.rule === 'combat-reflexes')
  record.secondary = secondary(record.attributes, cr)
  for (const s of record.skills) { s.cp = TIERS[s.tier]; s.level = skillLevel(record.attributes, record.secondary, s.attr, s.diff, s.cp) }
  const attrCp = Object.values(record.attributes).reduce((n, a) => n + a.cp, 0)
  const adv = record.traits.filter((t) => t.kind === 'advantage').reduce((n, t) => n + t.cp, 0)
  const dis = record.traits.filter((t) => t.kind === 'disadvantage').reduce((n, t) => n + t.cp, 0)
  const skills = record.skills.reduce((n, s) => n + s.cp, 0)
  const spent = attrCp + adv + dis + skills
  const unspent = Math.max(0, UNSPENT_FLOOR - spent)
  const total = spent + unspent
  record.cp = { attributes: attrCp, advantages: adv, disadvantages: dis, skills, spent, unspent, total }
  record.band = bandFor(total)[0]
  record.baseline = spent === 0
  return record
}

const SKILL_ORDER = Object.keys(SKILLS)
export function build(root = ROOT) {
  const registry = JSON.parse(readSource(root, REGISTRY).raw)
  const values = JSON.parse(readSource(root, VALUES).raw).people
  const indexByName = new Map(values.map((p, i) => [p.name, i]))
  const castNames = new Set(values.map((p) => p.name))
  const people = []
  const review = []
  for (const entry of registry.persons) {
    const index = indexByName.get(entry.name)
    const base = {
      id: entry.id,
      name: entry.name,
      url: `/people/person-${String(index + 1).padStart(4, '0')}`,
      state: values[index].state,
    }
    const pilot = PILOT[entry.id]
    if (pilot) {
      const attributes = Object.fromEntries(Object.entries(pilot.attributes).map(([a, [value, ids]]) => [a, { value, cp: (value - ABILITY_BASE) * ATTR_COST[a], rule: 'pilot-approved', evidence: src(...ids) }]))
      const [path, pointer, quote] = PILOT_SOURCES[pilot.role]
      people.push(finish({
        ...base,
        method: 'pilot-approved',
        role: { display: quote.replace(/^생업(: | 별명은 )/u, '').replace(CAST_SUFFIX, '').replace(/\.$/u, ''), evidence: [{ path, pointer, quote }] },
        attributes,
        traits: pilot.traits.map((t) => ({ ...t })),
        skills: pilot.skills.map((s) => ({ ...s.curated, tier: s.tier, evidence: s.evidence })),
        languages: languagesOf(root, entry.name),
      }))
      continue
    }
    const d = derivePerson(root, entry, castNames)
    for (const r of d.review) review.push({ id: entry.id, ...r })
    const skills = d.skills
      .sort((a, b) => TIERS[b.tier] - TIERS[a.tier] || SKILL_ORDER.indexOf(a.key) - SKILL_ORDER.indexOf(b.key))
      .map(({ key, tier, evidence: evs }) => ({ ...SKILLS[key], tier, evidence: evs.map(({ path, pointer, quote }) => ({ path, pointer, quote })) }))
    people.push(finish({
      ...base,
      method: 'card-lexicon',
      role: d.role ?? { display: '미등록', evidence: [] },
      attributes: d.attributes,
      traits: [],
      skills,
      languages: languagesOf(root, entry.name),
    }))
  }
  const doc = {
    schema: SCHEMA,
    status: 'proposal',
    note: '겁스 4판(Basic Set 2004) 인물 수치. 규칙은 lore/characters/Cast-Profile-Contract.md §겁스 4판을 따른다. 카드 산문은 바꾸지 않았고, 모든 비기본 수치에 카드 인용을 붙였다. 조재표(K1003)·신종목(K1009)은 G1 승인 견본값이다. 75 CP 미만인 사람은 모자란 만큼 cp.unspent(미사용 점수)로 채웠고, 미사용 점수는 기술·능력으로 쓰지 않았다(G2 Q2 B). 이연 Observation A는 사용자 확정 직위 줄에 따른다(G2 Q6 C). 언어는 카드에 적힌 것만 0 CP로 싣는다(G2 Q8 C). scripts/gurps-cast.mjs --check가 인용·계산·순서·해시를 검사한다.',
    invariants: { ...APPROVED_HASHES },
    rules: {
      edition: 'GURPS Basic Set: Characters, 4th ed. (SJG 2004)',
      contract: CONTRACT,
      attribute_cost_per_level: ATTR_COST,
      ability: { base: ABILITY_BASE, per_action_sentence: 1, cap: ABILITY_CAP, per_and_will_count_as: 'IQ' },
      skill_cost_table: 'B170',
      difficulty_base: DIFF_BASE,
      tiers: TIERS,
      bands: BANDS,
      unspent: { floor: UNSPENT_FLOOR, rule: '75 CP 미만이면 모자란 만큼 미사용 점수(unspent points)로 둔다. 기술·능력·특성으로 쓰지 않는다(소유자 결정 2026-09-28, G2 Q2 B)' },
      owner_tier_a: { ...OWNER_TIER_A, rule: '사용자 확정 직위 줄이 직접 가리키는 핵심 기술(소유자 결정 2026-09-28, G2 Q6 C)' },
      languages: '카드 「언어:」 줄의 언어만, 첫 언어 Native, 나머지 숙련도 미정(null), 모두 0 CP. 숙련도 CP는 뒤의 규칙을 기다린다(소유자 결정 2026-09-28, G2 Q8 C)',
      traits: { reputation: 'B26–27, 카드가 유명세를 적은 사람만', combat_reflexes: 'B43, 15 CP, Dodge +1, 소유자가 지명한 사람만', disadvantages: '발급하지 않음' },
      tl: '/TL? — 캠페인 기술 수준 미정(G1 Q14)',
    },
    count: people.length,
    people,
  }
  return { doc, review }
}

export const serialize = (doc) => `${JSON.stringify(doc, null, 1)}\n`

// ---- 독립 검사: 파일에 적힌 수치를 믿지 않고 규칙표로 다시 계산한다. ----
export function verify(doc, root = ROOT) {
  const errors = []
  const fail = (m) => { if (errors.length < 200) errors.push(m) }
  if (doc.schema !== SCHEMA) fail(`schema: ${doc.schema}`)
  for (const [path, hash] of Object.entries(APPROVED_HASHES)) {
    const got = sha256(root, path)
    if (got !== hash) fail(`승인 해시 변경: ${path} ${got}`)
    if (doc.invariants?.[path] !== hash) fail(`invariants 불일치: ${path}`)
  }
  const registry = JSON.parse(readSource(root, REGISTRY).raw)
  if (registry.approvalRef?.inputSha256 !== APPROVED_HASHES[VALUES]) fail('registry approvalRef.inputSha256 ≠ values-cast 승인 해시')
  const values = JSON.parse(readSource(root, VALUES).raw).people
  const indexByName = new Map(values.map((p, i) => [p.name, i]))
  if (!Array.isArray(doc.people) || doc.people.length !== registry.persons.length || doc.count !== registry.persons.length) fail(`인원: ${doc.people?.length} ≠ ${registry.persons.length}`)
  if (registry.persons.length !== 1019) fail(`registry 인원 ${registry.persons.length} ≠ 1019`)
  registry.persons.forEach((entry, i) => {
    const want = `K${String(i + 1).padStart(3, '0')}`
    if (entry.id !== want) fail(`registry 순서: ${i} ${entry.id} ≠ ${want}`)
  })
  const rules = doc.rules ?? {}
  if (JSON.stringify(rules.tiers) !== JSON.stringify(TIERS)) fail('rules.tiers가 A12/B8/C4/D2가 아님')
  if (rules.ability?.cap !== ABILITY_CAP || rules.ability?.base !== ABILITY_BASE) fail('rules.ability가 기본 10·상한 +3이 아님')
  ;(doc.people ?? []).forEach((p, i) => {
    const entry = registry.persons[i]
    const tag = `${p.id} ${p.name}`
    if (!entry || p.id !== entry.id || p.name !== entry.name) { fail(`${i}: ${tag} ≠ registry ${entry?.id} ${entry?.name}`); return }
    const vi = indexByName.get(p.name)
    const url = `/people/person-${String(vi + 1).padStart(4, '0')}`
    if (vi === undefined || p.url !== url) fail(`${tag} URL ${p.url} ≠ ${url}`)
    if (values[vi]?.state !== p.state) fail(`${tag} state ${p.state}`)
    const pilot = p.method === 'pilot-approved'
    if (pilot && !PILOT[p.id]) fail(`${tag}: 견본이 아닌데 pilot-approved`)
    if (!pilot && p.method !== 'card-lexicon') fail(`${tag}: method ${p.method}`)
    // 역할 표시 = 출처 있는 생업
    if (p.role?.display !== '미등록' && !(p.role?.evidence?.length && p.role.evidence.every((e) => quoteHolds(root, e)))) fail(`${tag}: 역할 표시 인용 불일치`)
    if (p.role?.display === '미등록' && p.role.evidence?.length) fail(`${tag}: 미등록 역할에 증거`)
    // 능력: 기본 10 + 행위 문장 1건당 +1, 최대 +3
    let attrCp = 0
    for (const [a, cost] of Object.entries(ATTR_COST)) {
      const at = p.attributes?.[a]
      if (!at) { fail(`${tag} ${a} 없음`); continue }
      if (!Number.isInteger(at.value) || at.value < ABILITY_BASE || at.value > ABILITY_BASE + ABILITY_CAP) fail(`${tag} ${a} ${at.value}: 10–13 밖`)
      const want = (at.value - ABILITY_BASE) * cost
      if (at.cp !== want) fail(`${tag} ${a} ${at.value}: 적힌 ${at.cp} CP, 계산 ${want}`)
      attrCp += want
      if (!Array.isArray(at.evidence)) { fail(`${tag} ${a}: evidence 목록 없음`); continue }
      at.evidence.forEach((e) => { if (!quoteHolds(root, e)) fail(`${tag} ${a}: 인용 불일치 ${e.path}#${e.pointer ?? ''} «${e.quote}»`) })
      if (at.rule === 'card-actions') {
        const distinct = new Set(at.evidence.map((e) => e.quote))
        if (distinct.size !== at.evidence.length) fail(`${tag} ${a}: 같은 문장을 두 번 셈`)
        if (at.value !== ABILITY_BASE + Math.min(ABILITY_CAP, distinct.size)) fail(`${tag} ${a} ${at.value}: 행위 문장 ${distinct.size}건과 맞지 않음(기본 10, 1건당 +1, 최대 +3)`)
      } else if (at.rule === 'pilot-approved') {
        if (!pilot) fail(`${tag} ${a}: 견본값 규칙은 견본 두 사람에게만`)
        if (!at.evidence.some((e) => e.quote === PILOT_SOURCES['contract-pilot'][2])) fail(`${tag} ${a}: 견본 승인 인용 없음`)
      } else fail(`${tag} ${a}: rule ${at.rule}`)
    }
    const cr = (p.traits ?? []).some((t) => t.rule === 'combat-reflexes')
    const sec = secondary(p.attributes, cr)
    for (const [k, v] of Object.entries(sec)) if (p.secondary?.[k] !== v) fail(`${tag} ${k}: 적힌 ${p.secondary?.[k]}, 계산 ${v}`)
    let adv = 0, dis = 0
    for (const t of p.traits ?? []) {
      const want = traitCp(t)
      if (want === null) fail(`${tag} 특성 ${t.name}: 규칙 ${t.rule} 미지원`)
      else if (t.cp !== want) fail(`${tag} 특성 ${t.name}: 적힌 ${t.cp}, 계산 ${want}`)
      if (t.kind === 'disadvantage') fail(`${tag}: 단점은 아직 발급하지 않는다`)
      if (t.rule === 'combat-reflexes' && !['K1003', 'K1009'].includes(p.id)) fail(`${tag}: Combat Reflexes는 소유자가 지명한 사람만`)
      if (!t.evidence?.length || !t.evidence.every((e) => quoteHolds(root, e))) fail(`${tag} 특성 ${t.name}: 인용 불일치`)
      if (t.rule === 'reputation' && !t.evidence.some((e) => /유명/u.test(e.quote))) fail(`${tag}: Reputation 근거에 유명세 문장이 없음`)
      if (t.kind === 'advantage') adv += want ?? 0; else dis += want ?? 0
    }
    let skillCp = 0
    const names = new Set()
    for (const s of p.skills ?? []) {
      if (names.has(s.name)) fail(`${tag} ${s.name}: 기술 중복`)
      names.add(s.name)
      if (!(s.tier in TIERS)) { fail(`${tag} ${s.name}: 등급 ${s.tier} 무효`); continue }
      if (s.tier === 'A' && !pilot) {
        if (OWNER_TIER_A[p.id] !== s.name) fail(`${tag} ${s.name}: A 등급은 견본과 소유자가 정한 사용자 확정 직위 기술에만`)
        if (!(s.evidence ?? []).some((e) => CONFIRMED_OFFICE.test(e.quote) && quoteHolds(root, e))) fail(`${tag} ${s.name}: A 등급에 사용자 확정 직위 인용이 없음`)
      }
      if (s.cp !== TIERS[s.tier]) fail(`${tag} ${s.name}: 등급 ${s.tier}=${TIERS[s.tier]} CP인데 ${s.cp} CP`)
      const known = Object.values(SKILLS).find((k) => k.name === s.name)
      if (!pilot && (!known || known.attr !== s.attr || known.diff !== s.diff)) fail(`${tag} ${s.name}: 기술표(${known ? `${known.attr}/${known.diff}` : '없음'})와 기준·난이도 불일치 ${s.attr}/${s.diff}`)
      const level = skillLevel(p.attributes, sec, s.attr, s.diff, s.cp)
      if (level === null) fail(`${tag} ${s.name}: 계산 불가(${s.attr}/${s.diff}/${s.cp})`)
      else if (s.level !== level) fail(`${tag} ${s.name}: 적힌 수준 ${s.level}, 계산 ${level}`)
      if (!s.evidence?.length) fail(`${tag} ${s.name}: 출처 없음`)
      for (const e of s.evidence ?? []) if (!quoteHolds(root, e)) fail(`${tag} ${s.name}: 인용 불일치 ${e.path}#${e.pointer ?? ''} «${e.quote}»`)
      if (/Guns|Soldier|Beam Weapons|Gunner/u.test(s.name)) fail(`${tag} ${s.name}: 총기·복무 기술은 근거 규칙이 없다`)
      skillCp += TIERS[s.tier]
    }
    if (OWNER_TIER_A[p.id] && p.skills?.find((s) => s.name === OWNER_TIER_A[p.id])?.tier !== 'A') fail(`${tag} ${OWNER_TIER_A[p.id]}: 소유자 결정 A 등급이 아님`)
    const spent = attrCp + adv + dis + skillCp
    const unspent = Math.max(0, UNSPENT_FLOOR - spent)
    const total = spent + unspent
    const want = { attributes: attrCp, advantages: adv, disadvantages: dis, skills: skillCp, spent, unspent, total }
    for (const [k, v] of Object.entries(want)) if (p.cp?.[k] !== v) fail(`${tag} cp.${k}: 적힌 ${p.cp?.[k]}, 계산 ${v}`)
    if (Object.keys(p.cp ?? {}).join() !== Object.keys(want).join()) fail(`${tag} cp 칸이 ${Object.keys(want).join('·')}가 아님`)
    const bands = bandFor(total)
    if (bands.length !== 1 || p.band !== bands[0]) fail(`${tag} 구간: 적힌 ${p.band}, 계산 ${bands.join('/') || '범위 밖'}`)
    if (p.baseline !== (spent === 0)) fail(`${tag} baseline 표시 불일치`)
    // 언어: 카드 「언어:」 줄에서 다시 뽑은 목록과 같아야 하고, 모두 0 CP, 첫 언어만 Native
    const langs = languagesOf(root, p.name)
    if (!Array.isArray(p.languages) || JSON.stringify(p.languages.map((l) => l.name)) !== JSON.stringify(langs.map((l) => l.name))) fail(`${tag} 언어: 적힌 ${p.languages?.map((l) => l.name)}, 카드 ${langs.map((l) => l.name)}`)
    ;(p.languages ?? []).forEach((l, k) => {
      if (l.cp !== 0) fail(`${tag} 언어 ${l.name}: ${l.cp} CP — 숙련도 CP는 아직 매기지 않는다`)
      if (l.level !== (k === 0 ? 'Native' : null)) fail(`${tag} 언어 ${l.name}: 숙련도 ${l.level}`)
      if (!l.evidence?.length || !l.evidence.every((e) => /^언어: /u.test(e.quote) && quoteHolds(root, e))) fail(`${tag} 언어 ${l.name}: 인용 불일치`)
    })
    if (spent === 0 && (p.skills.length || Object.values(p.attributes).some((a) => a.value !== ABILITY_BASE || a.evidence.length))) fail(`${tag}: 기준값인데 근거·수치가 있음`)
  })
  if (PILOT.K1003 && doc.people?.[1002]?.cp?.total !== 216) fail(`K1003 총점 ${doc.people?.[1002]?.cp?.total} ≠ 승인 216`)
  if (PILOT.K1009 && doc.people?.[1008]?.cp?.total !== 207) fail(`K1009 총점 ${doc.people?.[1008]?.cp?.total} ≠ 승인 207`)
  return errors
}

export function summary(doc) {
  const people = doc.people
  const nonBaseline = people.filter((p) => !p.baseline).length
  const bands = {}
  for (const p of people) bands[p.band] = (bands[p.band] ?? 0) + 1
  const unspent = people.filter((p) => p.cp.unspent > 0).length
  const languages = people.filter((p) => p.languages.length).length
  return { people: people.length, nonBaseline, baseline: people.length - nonBaseline, bands, unspent, languages, K1003: people[1002].cp.total, K1009: people[1008].cp.total }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const outPath = join(ROOT, OUT)
  if (args.includes('--write')) {
    const { doc } = build()
    const errors = verify(doc)
    if (errors.length) { errors.forEach((e) => console.error(`✗ ${e}`)); console.error('FAIL: 파생 결과가 검사를 통과하지 못해 쓰지 않았다'); process.exit(1) }
    writeFileSync(outPath, serialize(doc))
    console.log(`WROTE ${OUT}`, JSON.stringify(summary(doc)))
  } else if (args.includes('--review')) {
    const target = args[args.indexOf('--review') + 1]
    if (!target) { console.error('usage: --review <tsv>'); process.exit(2) }
    const { review } = build()
    const counts = new Map()
    for (const r of review) {
      const key = `${r.section}\t${r.verdict}\t${r.text}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    writeFileSync(target, [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n}\t${k}`).join('\n') + '\n')
    console.log(`REVIEW ${target}: ${counts.size} sentence templates`)
  } else if (args.includes('--check')) {
    if (!existsSync(outPath)) { console.error(`FAIL: ${OUT} 없음`); process.exit(1) }
    const raw = readFileSync(outPath, 'utf8')
    const doc = JSON.parse(raw)
    const errors = verify(doc)
    const rebuilt = serialize(build().doc)
    if (rebuilt !== raw) errors.push(`${OUT}가 카드에서 다시 파생한 결과와 다르다(node scripts/gurps-cast.mjs --write)`)
    if (errors.length) { errors.forEach((e) => console.error(`✗ ${e}`)); console.error(`FAIL: ${errors.length}건`); process.exit(1) }
    console.log('PASS: K001–K1019 신원·순서·URL, 승인 해시, 능력(기본 10·+1/문장·최대 +3)·기술(A12/B8/C4/D2, B170)·보조 특성·CP·미사용 점수(75 하한)·구간·언어(0 CP), 모든 인용 원문 대조, 재파생 일치', JSON.stringify(summary(doc)))
  } else {
    console.error('usage: node scripts/gurps-cast.mjs --write | --check | --review <tsv>')
    process.exit(2)
  }
}
