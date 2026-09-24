// World index for /world/. Leaders come from Core-Characters; the 16-state table from
// Sixteen-States; the event feed from Scenario-Timeline. Pages authored as JSON are rendered
// first so this does not read deleted wiki-source Markdown.
import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { renderLoreMarkdown } from './lore-json-render.mjs'

const readPage = (loreRoot, slug) => {
  const candidates = [
    join(loreRoot, `${slug}.md`),
    join(loreRoot, `${slug}.json`),
  ]
  const domains = ['characters', 'factions', 'chronology', 'overview', 'people-and-machines', 'places', 'offices', 'goods', 'structures', 'technology', 'ailments', 'culture', 'economy']
  for (const domain of domains) {
    candidates.push(join(loreRoot, domain, `${slug}.json`), join(loreRoot, domain, `${slug}.md`))
  }
  for (const path of candidates) {
    let text
    try { text = readFileSync(path, 'utf8') } catch { continue }
    if (path.endsWith('.json')) {
      const document = JSON.parse(text)
      if (!document || !Array.isArray(document.content)) continue
      return renderLoreMarkdown(document, 'ko', (_domain, linked) => `${linked}.md`)
    }
    return text
  }
  throw new Error(`E_WORLD_INDEX_SOURCE:${slug}`)
}

const columnMap = (header) => header.split('|').slice(1, -1).map((cell) => cell.trim())

const cell = (row, prefix) => Object.entries(row).find(([key]) => key === prefix || key.startsWith(prefix))?.[1] ?? ''

const publicStateName = (cell) => cell.replace(/\([^)]*\)/gu, '').trim()

export function buildWorldIndex({ loreRoot }) {
  const core = readPage(loreRoot, 'Core-Characters')
  const sixteen = readPage(loreRoot, 'Sixteen-States')
  const lines = sixteen.split('\n')
  const tableStart = lines.findIndex((line) => line.startsWith('|') && !/^\|\s*---/.test(line))
  if (tableStart < 0) throw new Error('E_WORLD_INDEX_TABLE')
  const tableLines = []
  for (const line of lines.slice(tableStart)) {
    if (!line.startsWith('|')) break
    if (!/^\|\s*---/.test(line)) tableLines.push(line)
  }
  const header = /국명|ID/.test(tableLines[0] ?? '') ? tableLines.shift() : null
  const columns = header ? columnMap(header) : []
  const leaderSections = [...core.matchAll(/^## ([^\n]+)\n\n([\s\S]*?)(?=\n## |$)/gm)].map((match) => [match[1].trim(), match[2]])
  const states = tableLines.map((line) => {
    const cells = columnMap(line)
    const row = header
      ? Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']))
      : { '국명': cells[0] ?? '', '기원': cells[1] ?? '', '형태': cells[2] ?? '', '강국': cells[3] ?? '' }
    if (!row['국명'] || row['국명'] === '국명') return null
    const name = publicStateName(row['국명'])
    const originNames = [...row['국명'].matchAll(/기원 표기 ([^,)]+)/gu)].map((match) => match[1].trim())
    const origin = cell(row, '기원') || cell(row, '출신')
    const institution = origin.split(/[.]/u)[0].trim()
    const names = [...new Set([name, ...originNames, institution].filter((candidate) => candidate.length >= 2))]
    const embedded = (origin.match(/중심\s*([^|()]+?)역/u) ?? origin.match(/([가-힣]{2,8})역/u) ?? [])[1] ?? ''
    const capital = (cell(row, '수도역') || cell(row, '중심역')).replace(/역$/u, '').trim() || embedded.trim() || (names.includes('대한민국정부') ? '광화문' : '')
    const ranked = leaderSections
      .map(([person, section]) => {
        const intro = section.split('\n', 1)[0]
        const introHit = names.some((candidate) => candidate && (intro.startsWith(candidate) || intro.includes(`${candidate} `)))
        const bodyHit = names.some((candidate) => candidate && section.includes(candidate))
        return { person, score: introHit ? 2 : bodyHit ? 1 : 0 }
      })
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score)
    const leader = ranked[0]?.person ?? '-'
    return {
      id: (row.ID ?? '').match(/S(?:0[1-9]|1[0-6])/u)?.[0] ?? '',
      name,
      station: capital || '-',
      type: (cell(row, '정부') || cell(row, '형태') || '-').split(',')[0].trim(),
      isPower: /강국/.test(cell(row, '등급') || cell(row, '강국')) ? '강국' : '약소',
      leader,
    }
  }).filter(Boolean)
  if (states.length !== 16) throw new Error(`E_WORLD_INDEX_STATES:${states.length}`)
  const ungrounded = states.filter((state) => state.leader === '-').map((state) => state.name)
  if (ungrounded.length > 0) throw new Error(`E_WORLD_INDEX_LEADERS:${ungrounded.join(',')}`)

  const timeline = readPage(loreRoot, 'Scenario-Timeline')
  let inFence = false
  const events = []
  for (const line of timeline.split('\n')) {
    if (line.trim().startsWith('```')) { inFence = !inFence; continue }
    if (inFence) continue
    if (/^\s*[-|*]\s|^\|/.test(line) || /^\d{3,4}년|^\*\*/.test(line.trim())) {
      const text = line.replace(/^\s*[-|*]\s*/, '').replace(/^\|/, '').trim()
      if (text.length > 8 && !/required_|immediate_|follow_up|player_entry/.test(text)) events.push(text)
    }
  }
  const feed = events.slice(-8).reverse()
  if (feed.length === 0) throw new Error('E_WORLD_INDEX_EVENTS')

  const sections = [
    ['프롤로그', 'overview/World-Unbinding.html'], ['사람과 기체', 'people-and-machines/People-and-Machines.html'],
    ['연표', 'chronology/Scenario-Timeline.html'], ['지명', 'places/World-and-Subway-Layers.html'],
    ['세력과 집단', 'factions/Sixteen-States.html'], ['직책', 'offices/Offices-and-Ranks.html'],
    ['물건과 물질', 'goods/Era-Arms-and-Tech-Level.html'], ['건축물', 'structures/Structures.html'],
    ['기술', 'technology/Lost-Technology-Lineage.html'], ['질병과 증상', 'ailments/Ailments.html'],
    ['문화', 'culture/Faith-Culture-Schism.html'], ['경제와 보급', 'economy/Economy-and-Production.html'],
    ['등장인물', 'characters/Core-Characters.html'],
  ]

  return `# 세계관 색인

서울:전국 세계관의 색인 대문이다. 16국·최신 사건·문서 판이 한자리에 열린다.

## 16국

| 국명 | 중심역 | 형태 | 강국 | 수장 |
|---|---|---|---|---|
${states.map((state) => `| [${state.name}](Sixteen-States.html) | ${state.station} | ${state.type} | ${state.isPower} | ${state.leader} |`).join('\n')}

## 최신 사건

${feed.map((event) => `- ${event}`).join('\n')}

## 문서 판

${sections.map(([label, href]) => `- [${label}](${href})`).join('\n')}
`
}

const loreRootArg = process.argv[2]
if (loreRootArg && process.argv[1] && basename(process.argv[1]) === 'build-world-index.mjs') {
  const index = buildWorldIndex({ loreRoot: loreRootArg })
  const leaders = [...index.matchAll(/\| \[[^\]]+\]\([^)]+\) \| [^|]+ \| [^|]+ \| [^|]+ \| ([^|]+) \|/g)].map((match) => match[1].trim())
  console.log(`Successfully built world index — 16 states, leaders: ${leaders.filter((leader) => leader !== '-').length}/16`)
}
