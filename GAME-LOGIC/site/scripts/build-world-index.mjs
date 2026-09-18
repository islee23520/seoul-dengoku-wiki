import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

// ── 수장: Sixteen-States 수령 서술에서 「이름은 국가 직위다」 패턴 파싱 ──
const TIER1 = ['역장','위원장','회장','당회장','사령관','대통령','종정','교정원장','대주교','이사장','대표']
const sixteenRaw = read('LORE/factions/Sixteen-States.md')
const leaderByState = {}
const rulerRe = new RegExp('([가-힣]{2,4})은 (대한민국정부|전국경제인연합회|삼성그룹|현대자동차주식회사|대한예수교장로회|천주교 서울대교구|대한불교조계종|원불교|전국민주노동조합총연맹|급수계약정|규격동맹|선로후계정|호위보호정|관문군정|중립호송시|의약중립맹) (' + TIER1.join('|') + ')', 'g')
for (const m of sixteenRaw.matchAll(rulerRe)) {
  if (!leaderByState[m[2]]) leaderByState[m[2]] = m[1]
}
const rulerRe2 = new RegExp('([가-힣]{2,4})(?:는|은) (대한민국정부|전국경제인연합회|삼성그룹|현대자동차주식회사|대한예수교장로회|천주교 서울대교구|대한불교조계종|원불교|전국민주노동조합총연맹|급수계약정|규격동맹|선로후계정|호위보호정|관문군정|중립호송시|의약중립맹) (' + TIER1.join('|') + ')', 'g')
for (const m of sixteenRaw.matchAll(rulerRe2)) {
  if (!leaderByState[m[2]]) leaderByState[m[2]] = m[1]
}
// 승계 문장이 있으면 현직자로 덮어쓴다(임하준 실종→오경재 승계)
for (const m of sixteenRaw.matchAll(/([가-힣]{2,4})가 [^.]{0,40}(?:뒤를 이어|승계해?|이어서) ([가-힣]{2,4})?(?:으)?로? ([가-힣]{2,6})[에에]?(?: 앉| 즉임| 취임)/g)) {
  if (m[1] && Object.values(leaderByState).includes(m[1]) === false) continue
}
const succ = sixteenRaw.match(/([가-힣]{2,4})가 총회 인준으로 그 뒤를 이어 당회장에 앉았다/)
if (succ) { const st = Object.keys(leaderByState).find(k => leaderByState[k] === '임하준'); if (st) leaderByState[st] = succ[1] }
// 국명 유사 매칭(소속 축약 대비)
const core = read('LORE/characters/Core-Characters.md')

// ── 16국: 수장 맵의 국가명이 곧 국가 집합(16 tier1 수장 → 16국) ──
const sixteen = read('LORE/factions/Sixteen-States.md')
const tableInfo = {}
for (const line of sixteen.split('\n')) {
  const m = line.match(/^\|\s*([^|]+?)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/)
  if (!m || /국명|---/.test(m[1])) continue
  const name = m[1].trim()
  if (tableInfo[name]) continue
  const origin = m[2].trim()
  const station = (origin.match(/중심\s*([가-힣·\s]+?역)/) || [])[1] || (origin.match(/([가-힣]{2,6}역)/) || [])[1] || (name === '대한민국정부' ? '광화문역' : '')
  tableInfo[name] = {
    station: station.replace(/^중심\s*/, ''),
    type: m[3].trim().split('·')[0].trim(),
    isPower: /강국/.test(m[4]) ? '강국' : '약소',
  }
}
const stateOrder = ['급수계약정','규격동맹','현대자동차주식회사','대한예수교장로회','호위보호정','대한민국정부','선로후계정','원불교','전국경제인연합회','대한불교조계종','삼성그룹','중립호송시','의약중립맹','관문군정','천주교 서울대교구','전국민주노동조합총연맹']
const states = stateOrder.map(name => ({
  name,
  station: tableInfo[name]?.station || '-',
  type: tableInfo[name]?.type || '-',
  isPower: tableInfo[name]?.isPower || '약소',
  leader: leaderByState[name] || '-',
}))

// ── 이벤트 피드: Scenario-Timeline에서 코드펜스 밖 이벤트 행 ──
const tl = read('LORE/chronology/Scenario-Timeline.md')
let inFence = false
const events = []
for (const line of tl.split('\n')) {
  if (line.trim().startsWith('```')) { inFence = !inFence; continue }
  if (inFence) continue
  if (/^\s*[-|*]\s|^\|/.test(line) || /^\d{3,4}년|^\*\*/.test(line.trim())) {
    const text = line.replace(/^\s*[-|*]\s*/, '').replace(/^\|/, '').trim()
    if (text.length > 8 && !/required_|immediate_|follow_up|player_entry/.test(text)) events.push(text)
  }
}
const feed = events.slice(-8).reverse()

// ── 섹션 패널 ──
const sections = [
  ['개요', 'overview/World-Unbinding.html'], ['사람과 기체', 'people-and-machines/People-and-Machines.html'],
  ['연표', 'chronology/Scenario-Timeline.html'], ['지명', 'places/World-and-Subway-Layers.html'],
  ['세력과 집단', 'factions/Sixteen-States.html'], ['직책', 'offices/Offices-and-Ranks.html'],
  ['물건과 물질', 'goods/Era-Arms-and-Tech-Level.html'], ['건축물', 'structures/Structures.html'],
  ['기술', 'technology/Lost-Technology-Lineage.html'], ['질병과 증상', 'ailments/Ailments.html'],
  ['문화', 'culture/Faith-Culture-Schism.html'], ['경제와 보급', 'economy/Economy-and-Production.html'],
  ['등장인물', 'characters/Core-Characters.html'],
]

let md = `# 세계관 색인

서울:전국 세계관의 색인 대문이다. 16국·최신 사건·문서 판이 한자리에 열린다.

## 16국

| 국명 | 중심역 | 형태 | 강국 | 수장 |
|---|---|---|---|---|
${states.map(s => `| [${s.name}](Sixteen-States.html) | ${s.station} | ${s.type} | ${s.isPower} | ${s.leader} |`).join('\n')}

## 최신 사건

${feed.map(e => `- ${e}`).join('\n')}

## 문서 판

${sections.map(([label, href]) => `- [${label}](${href})`).join('\n')}
`

const out = resolve(root, 'GAME-LOGIC/site/world/index.md')
writeFileSync(out, md)
if (states.length !== 16) { console.error(`ERROR: parsed ${states.length}/16 states`); process.exit(1) }
if (feed.length === 0) { console.error('ERROR: no timeline events parsed'); process.exit(1) }
console.log(`Successfully built world index — ${states.length} states, ${feed.length} events, leaders: ${states.filter(s => s.leader !== '-').length}/16`)
