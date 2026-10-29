export const koText = (leaf) => typeof leaf === 'string' ? leaf : leaf.map((run) => run.text).join('')

const fail = (code, id = '') => { throw new Error(`${code}:${id}`) }

// Every dated paragraph under a `### YYYY년` heading is a current Seoul event.
export function projectSeoulCurrentTimeline(content, relatedDocuments) {
  if (!Array.isArray(content)) fail('E_TIMELINE_SOURCE_SHAPE')
  const projected = []
  const citations = new Map()
  const currentEvents = new Map()
  const seen = new Set()
  let year = null
  let regionalHeading = null
  for (const block of content) {
    if (block.kind === 'heading' && block.depth <= 3) {
      const candidate = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
      year = Number.isInteger(candidate) ? candidate : null
      regionalHeading = null
      if (year !== null) {
        projected.push(block)
        citations.set(year, [])
        currentEvents.set(year, [])
      }
      continue
    }
    if (year !== null && block.kind === 'heading' && block.depth === 4) {
      regionalHeading = block
      continue
    }
    if (year === null || block.kind !== 'paragraph') continue
    const id = block.anchor
    if (typeof id !== 'string' || !id || seen.has(id)) fail('E_TIMELINE_EVENT_ANCHOR', id)
    seen.add(id)
    const citation = { id, year, sourceRoute: `/world/Century-Annals#${id}` }
    if (regionalHeading) {
      projected.push(regionalHeading)
      regionalHeading = null
    }
    projected.push(block)
    currentEvents.get(year).push(citation)
  }
  return buildTimelineYears(projected, relatedDocuments).map((entry) => ({
    ...entry,
    events: currentEvents.get(entry.year),
    historicalCitations: citations.get(entry.year),
  }))
}

// A year is a `### YYYY년` heading in the annals; its paragraphs run until the next year or era heading,
// so every entry links to an anchor that exists on the Century-Annals page.
export function buildTimelineYears(content, relatedDocuments) {
  const firstSentence = (text) => text.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim() ?? text.trim()
  const byYear = new Map()
  const theaterChronicleYears = new Set()
  let currentYear = null
  let regionalEvent = null
  for (const block of content) {
    if (block.kind === 'heading' && currentYear !== null && /-xt0[1-5]-/u.test(block.anchor ?? '')) theaterChronicleYears.add(currentYear)
    if (block.kind === 'heading' && block.depth <= 3) {
      const year = block.depth === 3 ? Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1]) : NaN
      currentYear = Number.isInteger(year) ? year : null
      regionalEvent = null
      if (currentYear !== null) {
        if (byYear.has(currentYear)) throw new Error(`E_TIMELINE_DUPLICATE_YEAR:${currentYear}`)
        byYear.set(currentYear, { prose: [], regionalEvents: [] })
      }
      continue
    }
    if (currentYear === null) continue
    const entry = byYear.get(currentYear)
    if (block.kind === 'heading' && block.depth === 4) {
      regionalEvent = block.anchor?.startsWith('peninsula-')
        ? { title: koText(block.text.ko), prose: '', sourceRoute: `/world/Century-Annals#${block.publicAnchors?.[0] ?? block.anchor}` }
        : null
      if (regionalEvent) entry.regionalEvents.push(regionalEvent)
    }
    if (block.kind === 'paragraph') {
      const prose = koText(block.text.ko)
      if (regionalEvent) regionalEvent.prose = [regionalEvent.prose, prose].filter(Boolean).join(' ')
      else entry.prose.push(prose)
    }
  }
  return [...byYear.entries()].sort(([left], [right]) => left - right).map(([year, { prose, regionalEvents }]) => {
    const overviewProse = prose.length ? prose : regionalEvents.map((event) => event.prose).filter(Boolean)
    const immediate = firstSentence(overviewProse.at(-1) ?? '')
    return {
      year,
      summary: prose.length ? prose.slice(0, 2).join(' ') : regionalEvents.map((event) => event.prose).join(' '),
      pressure: firstSentence(overviewProse[0] ?? ''),
      decision: firstSentence(overviewProse[1] ?? overviewProse[0] ?? ''),
      immediate,
      aftermath: immediate,
      regionalEvents,
      sourceRoute: `/world/Century-Annals#${year}년`,
      relatedDocuments: relatedDocuments([...prose, ...regionalEvents.map((event) => event.prose)].join('\n'), theaterChronicleYears.has(year) || regionalEvents.length > 0),
    }
  })
}
