import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STATES } from '../../../TOOL/tools/wiki/world-atlas-schema.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

// ── 수장: 핵심 인물 첫 문장의 국가명·최고 직위에서 파싱 ──
const core = read('LORE/characters/Core-Characters.md')
const leaderByState = {}
for (const match of core.matchAll(/^## ([^\n]+)\n\n([^\n]+)/gm)) {
  const person = match[1].trim()
  const intro = match[2].trim()
  const state = STATES.find((candidate) => intro.startsWith(`${candidate.name} `))
  if (state) leaderByState[state.name] = person
}

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
    originName: origin.split('.')[0].trim(),
  }
}
for (const [stateName, info] of Object.entries(tableInfo)) {
  if (leaderByState[stateName] || !info.originName) continue
  for (const match of core.matchAll(/^## ([^\n]+)\n\n([^\n]+)/gm)) {
    if (match[2].trim().startsWith(`${info.originName} `)) leaderByState[stateName] = match[1].trim()
  }
}
const stateOrder = STATES.map((state) => state.name)
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
  ['프롤로그', 'overview/World-Unbinding.html'], ['사람과 기체', 'people-and-machines/People-and-Machines.html'],
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

const out = resolve(root, 'WEB/wiki-source/world/index.md')
writeFileSync(out, md)
if (states.length !== 16) { console.error(`ERROR: parsed ${states.length}/16 states`); process.exit(1) }
if (feed.length === 0) { console.error('ERROR: no timeline events parsed'); process.exit(1) }
console.log(`Successfully built world index — ${states.length} states, ${feed.length} events, leaders: ${states.filter(s => s.leader !== '-').length}/16`)
