import { readFile } from 'node:fs/promises'
import { resolve, dirname, posix } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { BASELINE_SHA256, ENTITY_SETS, baselineDocuments, coverageKey, sha256 } from './seoul-scope.mjs'
import { headingId, renderLoreMarkdown } from './lore-json-render.mjs'

// Census metadata is private, not an authored page or an admission decision.
export const CENSUS_PATHS = ['lore/editorial/Seoul-Relocation-Ledger.json', 'lore/editorial/Seoul-Narrative-Review.json']
export const MARKDOWN_SPANS_SHA256 = '687d05ef0cb723ffea58de83e9a51740cd6d27de5c5931a2c582982b02b6d48f'
export const TRIAGE_BINDING = {
  path: '.omo/private/seoul-migration/task-7-census/triage/manifest.json',
  sha256: 'f2bd10662264f5a633feb4be09461c850ba257076bef4e4a716659b8e527e9f3',
}
export const TASK2_BINDING = {
  mergeCommit: 'bae5b5800155e65193df06c27e98352932ea8821',
  reviewedCommit: '6b9022aaef5cde6db882acefe91e395c0abfe21e',
  geography: { path: 'lore/regions/seoul-electoral-titles.json', sha256: 'a422097741d7da52e50b5774c0d47b79bc8fa5e43061c39535429cd8173ae0c1' },
}
const failure = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) failure(code, path, id) }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const escape = value => String(value).replace(/~/g, '~0').replace(/\//g, '~1')
const address = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.locale])
const tuple = row => [row.sourcePath, row.jsonPointer, row.anchor, row.locale, row.originalSha256]
const rowOf = row => Array.isArray(row) ? Object.fromEntries(['sourcePath', 'jsonPointer', 'anchor', 'locale', 'originalSha256'].map((k, i) => [k, row[i]])) : row
const sealed = path => path.startsWith('vendor/issued-history/')
const digestRows = rows => {
  const hash = createHash('sha256')
  for (const row of rows) hash.update(JSON.stringify(row)).update('\n')
  return hash.digest('hex')
}
function exact(actual, expected, code, path) {
  const keys = new Set(actual)
  check(keys.size === actual.length && actual.length === expected.length && expected.every(key => keys.has(key)), code, path)
}
function shape(value, fields, path) {
  check(value && typeof value === 'object' && !Array.isArray(value) && eq(Object.keys(value).sort(), [...fields].sort()), 'E_SCOPE_SHAPE', path)
}
function pointer(value, path) {
  if (path === '') return value
  return path.slice(1).split('/').reduce((v, key) => v?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], value)
}

// Immutable inputs are never reconstructed from the current checkout. Even callers
// with a valid product manifest must present the separately pinned archive bytes.
export async function loadImmutableCensus(baseline, readBytes = readFile, baselineSha256 = BASELINE_SHA256) {
  check(baselineSha256 === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/census/baseline')
  const metadata = baseline.occurrences
  const chunks = []
  for (const [index, entry] of metadata.chunks.entries()) {
    check(entry.index === index, 'E_ARCHIVE_HASH', '/census/chunks', String(index))
    const bytes = await readBytes(entry.path)
    check(sha256(bytes) === entry.sha256, 'E_ARCHIVE_HASH', entry.path)
    chunks.push(bytes.toString().replace(/\s/g, ''))
  }
  const gzip = Buffer.from(chunks.join(''), 'base64')
  check(sha256(gzip) === metadata.gzipSha256, 'E_ARCHIVE_HASH', '/census/gzip')
  const payload = gunzipSync(gzip)
  check(payload.length === metadata.payloadBytes && sha256(payload) === metadata.payloadSha256, 'E_ARCHIVE_HASH', '/census/payload')
  const original = JSON.parse(payload)
  const supplements = {}
  for (const name of ['cardBodies', 'cardSupplement', 'issuedIdentityMap']) {
    const entry = metadata[name]
    const bytes = await readBytes(entry.path)
    check(sha256(bytes) === entry.sha256, 'E_ARCHIVE_HASH', entry.path)
    supplements[name] = JSON.parse(bytes)
  }
  const markdownPath = resolve(dirname(metadata.cardBodies.path), 'markdown-byte-spans.json')
  const markdownBytes = await readBytes(markdownPath)
  check(sha256(markdownBytes) === MARKDOWN_SPANS_SHA256, 'E_ARCHIVE_HASH', markdownPath)
  return { original, ...supplements, markdownSpans: JSON.parse(markdownBytes), markdownPath }
}

export function walkCensus(value, sourcePath) {
  const leaves = []; const blocks = []; const identities = []
  function visit(value, jsonPointer = '', anchor = null, locale = 'neutral') {
    if (typeof value === 'string') {
      leaves.push([sourcePath, jsonPointer, anchor, locale, sha256(value)])
      if (/^(?:K\d{3,4}|S\d{2}|HC\d{2}|HP\d{2}|[HFV]\d{2}|XT\d{2})$/.test(value)) identities.push({ sourcePath, jsonPointer, id: value })
    } else if (value && typeof value === 'object') {
      const nextAnchor = typeof value.anchor === 'string' ? value.anchor : anchor
      if (typeof value.kind === 'string') blocks.push({ sourcePath, jsonPointer, anchor: nextAnchor, locale, originalSha256: sha256(JSON.stringify(value)), kind: value.kind })
      for (const [key, child] of Object.entries(value)) visit(child, `${jsonPointer}/${escape(key)}`, nextAnchor, ['ko', 'en'].includes(key) ? key : locale)
    }
  }
  visit(value)
  return { leaves, blocks, identities }
}

function lines(bytes, sourcePath) {
  const rows = []
  let start = 0
  for (let i = 0; i < bytes.length; i += 1) if (bytes[i] === 10 || i === bytes.length - 1) {
    rows.push({ sourcePath, jsonPointer: `@line-byte:${start}:${i + 1}`, anchor: null, locale: 'neutral', originalSha256: sha256(bytes.subarray(start, i + 1)), startByte: start, endByte: i + 1 })
    start = i + 1
  }
  return rows
}

// Every original category remains independently indexed: a heading is not a card
// body, a kind object is not a leaf, and equal hashes do not collapse occurrences.
export function originalCategories(immutable) {
  const { original, cardBodies, cardSupplement, markdownSpans } = immutable
  return {
    leaves: original.leafStrings,
    blocks: original.blocks.map(row => ({ ...row, locale: localeAt(row.jsonPointer) })),
    headings: original.cards,
    cards: [...cardBodies.cards, ...cardSupplement.cards],
    markdown: [...original.markdown, ...cardBodies.rootMarkdown],
    lines: markdownSpans.spans.map(row => ({ ...row, jsonPointer: `@line-byte:${row.startByte}:${row.endByte}`, anchor: null })),
  }
}
function localeAt(path) {
  return path.split('/').filter(key => key === 'ko' || key === 'en').at(-1) ?? 'neutral'
}

export async function extractCensusSources(baseline, readBytes) {
  const sources = new Map()
  for (const path of baselineDocuments(baseline)) {
    const bytes = Buffer.from(await readBytes(path))
    sources.set(path, { bytes, sha256: sha256(bytes), value: path.endsWith('.json') ? JSON.parse(bytes) : null })
  }
  return sources
}

export function extractCurrentCategories(sources, original) {
  const current = { leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  const headingSources = new Set(original.headings.map(r => r.sourcePath))
  const originalHeadings = new Map(original.headings.map(r => [address(r), r]))
  for (const [path, source] of sources) {
    if (source.value) {
      const walk = walkCensus(source.value, path)
      for (const row of walk.leaves) current.leaves.push(row)
      for (const row of walk.blocks) current.blocks.push(row)
      if (headingSources.has(path)) for (const [i, block] of (source.value.content ?? []).entries()) {
        if (block.kind !== 'heading' || block.depth !== 3) continue
        for (const locale of ['en', 'ko']) {
          const name = block.text?.[locale]
          if (typeof name !== 'string' || !/^(?:인물 |Person )/.test(name) || name === '인물 카드') continue
          const row = { sourcePath: path, jsonPointer: `/content/${i}`, anchor: block.anchor ?? null, locale, name, originalSha256: sha256(JSON.stringify(block)) }
          check(originalHeadings.has(address(row)), 'E_REVIEW_COVERAGE', '/census/new-card-heading', address(row))
        }
      }
    } else if (path.endsWith('.md')) current.lines.push(...lines(source.bytes, path))
  }
  for (const row of original.headings) {
    const value = pointer(sources.get(row.sourcePath)?.value, row.jsonPointer)
    check(value?.kind === 'heading', 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    current.headings.push({ ...row, originalSha256: sha256(JSON.stringify(value)) })
  }
  for (const row of original.cards) {
    const content = sources.get(row.sourcePath)?.value?.content
    check(content && content[row.startBlock]?.kind === 'heading' && content.length >= row.endBlockExclusive, 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    let endBlockExclusive = row.startBlock + 1
    while (endBlockExclusive < content.length && !(content[endBlockExclusive].kind === 'heading' && content[endBlockExclusive].depth <= content[row.startBlock].depth)) endBlockExclusive += 1
    current.cards.push({ ...row, endBlockExclusive, originalSha256: sha256(JSON.stringify(content.slice(row.startBlock, endBlockExclusive))) })
  }
  for (const row of original.markdown) {
    const bytes = sources.get(row.sourcePath)?.bytes
    check(bytes && (row.endByte === undefined || row.endByte <= bytes.length), 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    current.markdown.push({ ...row, originalSha256: sha256(row.jsonPointer === '' ? bytes : bytes.subarray(row.startByte, row.endByte)) })
  }
  return current
}

function categoryIndex(categories) {
  const index = new Map()
  for (const [category, rows] of Object.entries(categories)) for (const raw of rows) {
    const row = rowOf(raw)
    const key = JSON.stringify([row.sourcePath, category])
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(tuple(row))
  }
  return [...index].map(([key, rows]) => {
    const [sourcePath, category] = JSON.parse(key)
    rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'))
    return { sourcePath, category, count: rows.length, sha256: digestRows(rows) }
  }).sort((a, b) => address({ ...a, jsonPointer: a.category }).localeCompare(address({ ...b, jsonPointer: b.category }), 'en'))
}

export function compareCensusCategories(original, current) {
  const mapping = []
  for (const category of Object.keys(original)) {
    const before = new Map(original[category].map(raw => { const row = rowOf(raw); return [address(row), row] }))
    const after = new Map(current[category].map(raw => { const row = rowOf(raw); return [address(row), row] }))
    check(before.size === original[category].length && after.size === current[category].length, 'E_REVIEW_COVERAGE', `/census/${category}/duplicates`)
    for (const [key, old] of before) {
      const now = after.get(key)
      if (!now && category === 'lines') {
        // Prefer the suffix displacement when repeated blank lines surround an
        // insertion. Both endpoints still require exact byte equality.
        const oldEnd = Math.max(...original.lines.filter(r => r.sourcePath === old.sourcePath).map(r => r.endByte))
        const newEnd = Math.max(...current.lines.filter(r => r.sourcePath === old.sourcePath).map(r => r.endByte))
        const moved = [...after.values()].filter(row => row.sourcePath === old.sourcePath && row.originalSha256 === old.originalSha256 && !before.has(address(row)))
          .sort((a, b) => Math.abs(a.startByte - old.startByte - (newEnd - oldEnd)) - Math.abs(b.startByte - old.startByte - (newEnd - oldEnd)))[0]
        if (moved) {
          mapping.push({ category, originalKeys: [coverageKey(old)], currentKeys: [coverageKey(moved)], disposition: 'moved', evidence: 'exact-line-byte-equality', reviewStatus: 'not-reviewed' })
          after.delete(address(moved))
          continue
        }
      }
      if (!now || !eq(tuple(old), tuple(now))) mapping.push({ category, originalKeys: [coverageKey(old)], currentKeys: now ? [coverageKey(now)] : [], disposition: now ? 'changed' : 'removed', evidence: 'independent-byte-extraction', reviewStatus: 'not-reviewed' })
    }
    for (const [key, now] of after) if (!before.has(key)) mapping.push({ category, originalKeys: [], currentKeys: [coverageKey(now)], disposition: 'added', evidence: 'independent-byte-extraction', reviewStatus: 'not-reviewed' })
  }
  return { original: categoryIndex(original), current: categoryIndex(current), exceptions: mapping,
    unchangedRule: 'For every category and positional address absent from exceptions, compare every tuple including anchor and exact UTF-8 hash; emit originalKey -> identical currentKey. No range, sample or count-only acceptance.' }
}

export function extractEntityRecords(sources) {
  const get = path => sources.get(path).value
  const records = Object.fromEntries(ENTITY_SETS.map(set => [set, []]))
  const add = (set, sourcePath, jsonPointer, id) => {
    const record = pointer(get(sourcePath), jsonPointer)
    records[set].push({ id, sourcePath, jsonPointer, sourceSha256: sources.get(sourcePath).sha256, recordSha256: sha256(JSON.stringify(record)) })
  }
  for (const [set, path, field] of [
    ['persons', 'lore/name-pools/person-id-registry.json', 'persons'],
    ['titles', 'lore/relations/opening-feudal-allocation.json', 'titles'],
    ['grants', 'lore/relations/opening-feudal-allocation.json', 'grants'],
    ['bindings', 'lore/relations/opening-feudal-allocation.json', 'existingTitleBindings'],
    ['holdings', 'lore/relations/personal-holdings.json', 'holdings'],
    ['polities', 'lore/relations/personal-holdings.json', 'polities'],
    ['courts', 'lore/relations/relations.json', 'courts'],
  ]) get(path)[field].forEach((row, i) => add(set, path, `/${field}/${i}`, set === 'bindings' ? JSON.stringify([row.holdingId, row.titleId]) : row.id))
  for (const [set, path] of [['states', 'lore/factions/Sixteen-States.json'], ['relations', 'lore/characters/Cast-Relations.json'], ['events', 'lore/chronology/Century-Annals.json']]) {
    get(path).content.forEach((block, b) => {
      if (set === 'events') {
        if (block.kind === 'paragraph' && /^(\d{4})년(?: (\d{1,2})월(?: (\d{1,2})일)?)?/.test(block.text.ko)) add(set, path, `/content/${b}`, `E:${block.anchor}`)
      } else if (block.kind === 'table' && (set === 'relations' || block.anchor === 'table')) block.rows.forEach((row, r) => add(set, path, `/content/${b}/rows/${r}`, set === 'states' ? row[0].ko : `R:${block.anchor}:${r + 1}`))
    })
  }
  return records
}

export function extractPrimaryCards(sources, people) {
  const byName = new Map()
  const paths = [...Array.from({ length: 16 }, (_, i) => `lore/characters/Cast-State-${String(i + 1).padStart(2, '0')}.json`), 'lore/characters/Core-Characters.json', 'lore/characters/Cast-Unaffiliated.json', 'lore/factions/Diaspora-Corridors.json']
  for (const sourcePath of paths) {
    const value = sources.get(sourcePath).value
    const text = renderLoreMarkdown(value, 'ko', (_domain, slug) => `${slug}.md`)
    const corridor = sourcePath.endsWith('/Diaspora-Corridors.json')
    const headings = [...text.matchAll(sourcePath.endsWith('/Core-Characters.json') ? /^## (?!인물 목록$)(.+)$/gm : /^### 인물 (.+)$/gm)]
      .map(heading => ({ heading, start: text.slice(0, heading.index).match(/(?:\n<a id="[\p{L}\p{N}_-]+"><\/a>\n*)+$/u)?.index ?? heading.index }))
    for (const [index, { heading }] of headings.entries()) {
      let name = heading[1].trim()
      if (['부록 — 가치관 숫자', '인물 카드'].includes(name)) continue
      if (corridor) name = ['린샤오메이', '팜반득', '아미라 카심', '조엘 박', '나르기즈 유수포바', '최일석'].find(n => name === n || name.startsWith(`${n} (`))
      if (!name) continue
      const boundaries = [corridor ? headings[index + 1]?.heading.index : headings[index + 1]?.start,
        sourcePath.endsWith('/Cast-Unaffiliated.json') ? text.indexOf('\n## ', heading.index + heading[0].length) : -1].filter(n => n >= 0)
      const body = text.slice(heading.index + heading[0].length, boundaries.length ? Math.min(...boundaries) : text.length).trim()
      const rows = byName.get(name) ?? []
      const block = value.content.find(b => b.kind === 'heading' && (b.text?.ko === heading[1] || b.text?.ko === `인물 ${heading[1]}`))
      rows.push({ sourcePath, anchor: block?.anchor ?? null, heading: heading[1], encounterOrder: rows.length,
        length: body.length, bodySha256: sha256(body), primary: !corridor && (value.data?.primary_detail_names?.includes(name) ?? false) })
      byName.set(name, rows)
    }
  }
  return people.map(person => {
    const candidates = byName.get(person.name) ?? []
    const selected = candidates.find(c => c.primary) ?? [...candidates].sort((a, b) => b.length - a.length)[0]
    check(selected, 'E_REVIEW_COVERAGE', '/census/primaryCard', person.id)
    return { personId: person.id, selected, reason: selected.primary ? 'explicit-primary' : 'longest-rendered-trimmed-KO-body-stable-encounter-tie', candidates }
  })
}

export async function loadDependencyTriage(root, readBytes = readFile) {
  const bytes = await readBytes(resolve(root, TRIAGE_BINDING.path))
  check(sha256(bytes) === TRIAGE_BINDING.sha256, 'E_ARCHIVE_HASH', TRIAGE_BINDING.path)
  const manifest = JSON.parse(bytes)
  const records = []
  for (const shard of manifest.shards) {
    const bytes = await readBytes(resolve(root, shard.path))
    check(sha256(bytes) === shard.sha256, 'E_ARCHIVE_HASH', shard.path)
    const value = JSON.parse(bytes)
    check(value.firstIndex === records.length && value.records.length === shard.count, 'E_REVIEW_COVERAGE', shard.path)
    records.push(...value.records)
  }
  check(records.length === manifest.input.unresolvedCount && new Set(records.map(r => r.key)).size === records.length,
    'E_REVIEW_COVERAGE', '/census/originalUnresolved')
  return records
}

const referenceKey = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.target, row.recordSha256])
const recordReference = (sources, path, jsonPointer) => {
  const source = sources.get(path)
  const value = pointer(source?.value, jsonPointer)
  check(source && value !== undefined, 'E_DEPENDENCY_REFERENCE', path, jsonPointer)
  return { sourcePath: path, jsonPointer, sourceSha256: source.sha256, recordSha256: sha256(value === null && jsonPointer === '' ? source.bytes : JSON.stringify(value)) }
}

// Selectors belong to their own source contract. A station layer is never an
// OSM site, a lineage key is not an issued person, and a public heading URL is
// distinct from a JSON block anchor. Every successful selection retains bytes.
export function createDependencyResolver(sources) {
  const indexes = new Map()
  const records = new Map()
  function index(path) {
    if (indexes.has(path)) return indexes.get(path)
    const source = sources.get(path); const value = source.value
    const anchors = new Map(); const publicAnchors = new Map()
    const add = (map, key, p) => { if (typeof key === 'string') map.set(key, [...new Set([...(map.get(key) ?? []), p])]) }
    for (const [i, block] of (value?.content ?? []).entries()) {
      if (!block || typeof block !== 'object') continue
      const p = `/content/${i}`
      add(anchors, block.anchor, p)
      for (const alias of block.publicAnchors ?? []) { add(anchors, alias, p); add(publicAnchors, alias, p) }
      if (block.kind === 'heading') {
        add(publicAnchors, block.anchor, p)
        for (const text of Object.values(block.text ?? {})) {
          const plain = typeof text === 'string' ? text : text.map(r => r.text).join('')
          add(publicAnchors, headingId(plain), p)
        }
      } else if (block.publicAnchors?.length || block.kind === 'paragraph' && value.domain === 'technology'
        && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(block.anchor)) add(publicAnchors, block.anchor, p)
      if (block.kind === 'paragraph') for (const text of Object.values(block.text ?? {})) {
        const plain = typeof text === 'string' ? text : text.map(r => r.text).join('')
        for (const match of plain.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) add(publicAnchors, match[1], p)
      }
    }
    for (const field of ['people', 'persons', 'nodes']) for (const [i, row] of (value?.[field] ?? []).entries()) add(anchors, row.id, `/${field}/${i}`)
    for (const [i, row] of (value?.candidates ?? []).entries()) {
      add(anchors, `candidates/${row.id}`, `/candidates/${i}`)
      if (row.careerSummary !== undefined) add(anchors, `candidates/${row.id}/careerSummary`, `/candidates/${i}/careerSummary`)
    }
    for (const [i, lineage] of (value?.lineages ?? []).entries()) for (const [j, member] of (lineage.members ?? []).entries()) {
      add(anchors, `${lineage.key}/${member.key}`, `/lineages/${i}/members/${j}`)
    }
    const markdown = []
    if (!value) for (const match of source.bytes.toString().matchAll(/^#{1,6} (.+)\r?$/gm)) {
      const startByte = Buffer.byteLength(source.bytes.toString().slice(0, match.index))
      markdown.push({ text: match[1], startByte, endByte: startByte + Buffer.byteLength(match[0]) })
    }
    const result = { anchors, publicAnchors, markdown }; indexes.set(path, result); return result
  }
  const target = (path, p) => {
    const key = JSON.stringify([path, p])
    if (!records.has(key)) records.set(key, recordReference(sources, path, p))
    return records.get(key)
  }
  return (raw, fromPath, selector = null, vocabulary = 'source') => {
    const [file, fragment] = raw.split('#')
    const candidates = [...new Set([file, posix.normalize(posix.join(posix.dirname(fromPath), file))]
      .flatMap(p => [p, p.replace(/\.md$/, '.json')]))]
    const path = candidates.find(p => sources.has(p))
    if (!path) return { status: 'unresolved', reason: 'local-source-missing', targets: [] }
    const source = sources.get(path)
    const anchor = selector ?? fragment ?? null
    if (!anchor) return { status: sealed(path) ? 'sealed-evidence' : 'resolved', targets: [target(path, '')] }
    const lookup = index(path)
    let pointers = []
    if (typeof anchor === 'object' && anchor.type === 'station-layer') {
      for (const [i, station] of (source.value?.stations ?? []).entries()) {
        if (station.name !== anchor.stationName || !anchor.stationIdentity
          || !['district', 'lat', 'lon'].every(k => station[k] === anchor.stationIdentity[k])) continue
        for (const [j, layer] of station.layers.entries()) if (layer.id === anchor.layerId) pointers.push(`/stations/${i}/layers/${j}`)
      }
    } else if (typeof anchor === 'object' && anchor.type === 'site') {
      for (const [i, region] of (source.value?.regions ?? []).entries()) for (const [j, building] of (region.content?.buildings ?? []).entries()) {
        if (building.anchor_ref === anchor.anchor) pointers.push(`/regions/${i}/content/buildings/${j}/anchor_ref`)
      }
    } else if (typeof anchor === 'string') {
      if (anchor.startsWith('/') && vocabulary !== 'renderer') {
        if (pointer(source.value, anchor) !== undefined) pointers = [anchor]
      } else if (!source.value) {
        const hits = lookup.markdown.filter(h => h.text === anchor || headingId(h.text) === anchor)
        if (hits.length === 1) {
          const h = hits[0]
          return { status: 'resolved', targets: [{ sourcePath: path, jsonPointer: `@byte:${h.startByte}:${h.endByte}`,
            sourceSha256: source.sha256, recordSha256: sha256(source.bytes.subarray(h.startByte, h.endByte)) }] }
        }
      } else pointers = (vocabulary === 'renderer' ? lookup.publicAnchors : lookup.anchors).get(anchor) ?? []
    }
    return pointers.length === 1 ? { status: sealed(path) ? 'sealed-evidence' : 'resolved', targets: [target(path, pointers[0])] }
      : { status: 'unresolved', reason: pointers.length > 1 ? 'selector-not-unique' : 'selector-missing', targets: [] }
  }
}

export function dependencyDispositions(sources, triage, resolveReference) {
  return triage.map(row => {
    const original = row.original
    check(row.key === referenceKey(original), 'E_REVIEW_COVERAGE', '/census/originalUnresolved', row.key)
    check(eq(recordReference(sources, original.sourcePath, original.jsonPointer), Object.fromEntries(
      ['sourcePath', 'jsonPointer', 'sourceSha256', 'recordSha256'].map(k => [k, original[k]]))), 'E_REVIEW_HASH', original.sourcePath, original.jsonPointer)
    const evidence = ref => {
      const source = sources.get(ref.sourcePath)
      check(source?.sha256 === ref.sourceSha256, 'E_REVIEW_HASH', ref.sourcePath)
      if (ref.jsonPointer === null) {
        const bytes = source.bytes.subarray(ref.startByte, ref.startByte + Buffer.byteLength(ref.heading))
        check(sha256(bytes) === ref.headingSha256, 'E_REVIEW_HASH', ref.sourcePath)
        return { sourcePath: ref.sourcePath, jsonPointer: `@byte:${ref.startByte}:${ref.startByte + bytes.length}`, sourceSha256: source.sha256, recordSha256: sha256(bytes) }
      }
      const actual = recordReference(sources, ref.sourcePath, ref.jsonPointer)
      check(actual.recordSha256 === ref.recordSha256, 'E_REVIEW_HASH', ref.sourcePath, ref.jsonPointer)
      return actual
    }
    let result
    if (row.classification === 'actual-dangling-current') {
      result = { status: 'unresolved', reason: row.currentResolution, targets: row.targets.map(evidence) }
      if (row.currentResolution === 'required-K1010-date-parent-evidence') {
        const claims = row.requiredCurrentEvidenceProposal
        const refs = [...claims.dateEvidence, ...claims.parentEvidence, ...claims.relationshipCorroboration]
        for (const ref of claims.dateEvidence) {
          const rows = sources.get(ref.sourcePath).value.people.filter(p => p.id === ref.identity)
          check(rows.length === 1 && rows[0].birthDate === ref.birthDate, 'E_DEPENDENCY_REFERENCE', ref.sourcePath, ref.identity)
        }
        for (const ref of claims.parentEvidence) {
          const selected = resolveReference(ref.sourcePath, original.sourcePath, ref.anchor)
          check(selected.status === 'resolved' && eq(selected.targets, [evidence(ref)]), 'E_DEPENDENCY_REFERENCE', ref.sourcePath, ref.anchor)
        }
        result = { status: 'supported-correspondence', targets: refs.map(evidence), claims: {
          personId: claims.personId, dates: claims.dateEvidence.map(r => ({ personId: r.identity, birthDate: r.birthDate })),
          parentId: 'K1009', parentAnchors: claims.parentEvidence.map(r => r.anchor), limitation: claims.limitations } }
      }
    } else if (row.classification === 'preserved-sealed') {
      result = { status: 'sealed-evidence', targets: row.targets.map(evidence) }
      check(result.targets.every(t => sealed(t.sourcePath)), 'E_SCOPE_ADMISSION', '/census/sealedEvidence', row.key)
    } else if (['historical-EN-Markdown-source-ref', 'explicit-moved-provenance'].includes(row.currentResolution)) {
      result = { status: 'provenance-correspondence', targets: row.targets.map(evidence) }
    } else if (row.currentResolution === 'compound-facility-reference') {
      const value = pointer(sources.get(original.sourcePath).value, original.jsonPointer)
      const station = resolveReference(value.sourcePath, original.sourcePath, { type: 'station-layer', ...value })
      const site = resolveReference(value.siteSourcePath, original.sourcePath, { type: 'site', anchor: value.siteAnchor })
      check(station.status === 'resolved' && site.status === 'resolved', 'E_DEPENDENCY_REFERENCE', original.sourcePath, original.jsonPointer)
      result = { status: 'resolved', targets: [...station.targets, ...site.targets] }
    } else {
      result = resolveReference(original.target, original.sourcePath)
      check(result.status === 'resolved', 'E_DEPENDENCY_REFERENCE', original.sourcePath, original.jsonPointer)
    }
    return { key: row.key, original, classification: row.classification, vocabulary: row.currentResolution, ...result,
      required: result.status === 'unresolved', reviewStatus: 'not-reviewed' }
  })
}

// A source/record graph retains evidence consumers as well as person relationships.
// File nodes deliberately join otherwise disjoint people: whole-file review and a
// single writer are required, not an invented independent batch per component.
export function extractDependencies(sources, people, entityRecords, triage = [], provenanceSources = new Map()) {
  const edges = []; const unresolved = []; const structural = []
  const references = []
  const profileCitationDispositions = []
  const localProvenanceDispositions = []
  const resolveReference = createDependencyResolver(sources)
  const dispositions = dependencyDispositions(sources, triage, resolveReference)
  const correspondence = new Map(dispositions.map(r => [JSON.stringify([r.original.sourcePath, r.original.jsonPointer]), r]))
  const issued = new Set(people.map(p => p.id))
  const names = new Map(people.map(p => [p.name, p.id]))
  const person = id => issued.has(id) ? id : names.get(id)
  const sourceRecords = new Map()
  const sourceRef = (path, jsonPointer) => {
    const key = JSON.stringify([path, jsonPointer])
    if (!sourceRecords.has(key)) sourceRecords.set(key, recordReference(sources, path, jsonPointer))
    return sourceRecords.get(key)
  }
  const add = (fromKey, toKey, kind, path, jsonPointer, direction = 'directed') => {
    if (fromKey && toKey) edges.push({ fromKey, toKey, kind, direction, source: sourceRef(path, jsonPointer) })
  }
  const relation = (a, b, kind, path, jsonPointer) => {
    if (!a || !b) return
    structural.push({ fromKey: a, toKey: b, kind, direction: 'directed', source: sourceRef(path, jsonPointer) })
    add(`identity:${a}`, `identity:${b}`, kind, path, jsonPointer)
  }
  const get = path => sources.get(path).value
  const cast = 'lore/characters/Cast-Relations.json'
  get(cast).content.forEach((block, b) => {
    if (block.kind === 'table') block.rows.forEach((row, r) => relation(person(row[0].ko), person(row[2].ko), `cast:${row[1].ko}`, cast, `/content/${b}/rows/${r}`))
  })
  const family = 'lore/name-pools/cast-family-trees.json'
  get(family).edges.forEach((row, i) => relation(row.from, row.to, `family:${row.type}`, family, `/edges/${i}`))
  const courts = 'lore/relations/relations.json'
  for (const [field, rows] of [['directRetainers', get(courts).directRetainers], ['ownerLieges/edges', get(courts).ownerLieges.edges]]) rows.forEach((r, i) => relation(r.personId, r.liegePersonId, 'political-liege', courts, `/${field}/${i}`))
  const courtOwners = new Map(get(courts).courts.map(c => [c.id, c.ownerPersonId]))
  get(courts).courtMemberships.memberships.forEach((r, i) => relation(r.personId, courtOwners.get(r.courtId), 'court-membership', courts, `/courtMemberships/memberships/${i}`))
  const household = 'lore/name-pools/cast-household-relations.json'
  get(household).people.forEach((row, i) => {
    for (const field of ['links', 'knownLinks']) row[field].forEach((r, j) => relation(row.personId, r.recipientId, `household:${r.type}`, household, `/people/${i}/${field}/${j}`))
  })
  const contacts = 'lore/name-pools/cast-prose-contacts.json'
  get(contacts).records.forEach((r, i) => relation(r.personId, r.recipientId, 'prose-contact', contacts, `/records/${i}`))
  for (const path of ['lore/relations/personal-holdings.json', 'lore/relations/opening-feudal-allocation.json']) {
    for (const field of ['holdings', 'grants']) (get(path)[field] ?? []).forEach((r, i) => relation(r.holderPersonId, r.directLiegePersonId, 'rights-liege', path, `/${field}/${i}`))
  }
  for (const [set, records] of Object.entries(entityRecords)) for (const row of records) add(`entity:${set}:${row.id}`, `file:${row.sourcePath}`, 'record-owner', row.sourcePath, row.jsonPointer)
  const knownIdentities = new Set([...issued, ...get(family).nodes.map(n => n.id)])
  const reference = (raw, path, jsonPointer, selector = null, vocabulary = 'source', external = null, citation = null) => {
    const prior = correspondence.get(JSON.stringify([path, jsonPointer]))
    let result
    if (external) result = { status: 'unresolved', reason: 'external-evidence-not-read', targets: [], external }
    else if (prior && vocabulary !== 'station-layer' && vocabulary !== 'site') {
      result = { status: prior.status, targets: prior.targets, ...(prior.reason ? { reason: prior.reason } : {}) }
    } else {
      result = resolveReference(raw, path, selector, vocabulary)
      // A missing current martial path may identify existing sealed evidence,
      // but it never becomes a current source or a capability assignment.
      const old = `vendor/issued-history/corpus/${raw.split('#')[0]}`
      if (result.reason === 'local-source-missing' && sources.has(old)) {
        result = resolveReference(`${old}${raw.includes('#') ? `#${raw.split('#')[1]}` : ''}`, path, selector, vocabulary)
      }
    }
    if (citation && result.reason === 'selector-missing') {
      const original = { ...sourceRef(path, jsonPointer), target: raw, selector, vocabulary,
        reason: result.reason, required: true, reviewStatus: 'not-reviewed' }
      result = { status: 'supported-correspondence', targets: citation.targets, citationBoundary: citation }
      profileCitationDispositions.push({ key: referenceKey(original), original, ...result, required: false, reviewStatus: 'not-reviewed' })
    }
    // These three dated import contracts are not generic missing-path or anchor
    // aliases. Addressing their source does not review its meaning or admit it.
    const localContract = selector === null && (
      path === 'lore/regions/sources/selection.json' && jsonPointer === '/comparison_boundary' && vocabulary === 'typed:path'
        && raw === 'boundaries-kostat-2013/seoul_municipalities_geo.json'
      || path === 'scripts/data/admin-territorial-catalog.json' && jsonPointer === '/sourceRef' && vocabulary === 'source-string'
        && raw === 'lore/regions/sources/selection.json#selected_boundary'
      || path === 'snapshots/build-inputs/creative-name-normalization.json' && jsonPointer === '/references/2' && vocabulary === 'typed:path'
        && raw === 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    if (localContract && !external) {
      result = { status: 'unresolved', reason: path === 'scripts/data/admin-territorial-catalog.json' ? 'selector-missing' : 'local-source-missing', targets: [] }
      let provenance = null
      const origin = sources.get(path).value
      if (path === 'lore/regions/sources/selection.json' && jsonPointer === '/comparison_boundary'
        && vocabulary === 'typed:path' && selector === null && raw === 'boundaries-kostat-2013/seoul_municipalities_geo.json') {
        const comparison = origin.comparison_boundary
        const importedPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
        const imported = provenanceSources.get(importedPath)
        if (comparison.source_root === '../seoul-kenshi-data/seoul-geography-20260830'
          && comparison.path === raw && comparison.source_id === 'kostat-2013'
          && comparison.effective_year === 2013 && comparison.current_boundary === false
          && imported && sha256(imported.bytes) === imported.sha256 && imported.sha256 === comparison.sha256
          && comparison.sha256 === 'cfa0c49df02184981d3f214b52729685fd5444ec1e58f04054bdf99ae4b1e836') provenance = {
          kind: 'declared-hash-2013-comparison-import', currentBoundary: false,
          targets: [recordReference(provenanceSources, importedPath, '')],
        }
      } else if (path === 'scripts/data/admin-territorial-catalog.json' && jsonPointer === '/sourceRef'
        && vocabulary === 'source-string' && selector === null && raw === 'lore/regions/sources/selection.json#selected_boundary') {
        const selectedPath = 'lore/regions/sources/selection.json'
        const source = sources.get(selectedPath)
        // JSON.parse alone erases duplicate object members. Count the exact
        // root key in the source tokens, not nested keys or content anchors.
        const tokens = source?.bytes.toString().match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]/g) ?? []
        let depth = 0; let members = 0
        for (const [i, token] of tokens.entries()) {
          if (token === '{' || token === '[') depth += 1
          else if (token === '}' || token === ']') depth -= 1
          else if (depth === 1 && token.startsWith('"') && tokens[i + 1] === ':' && JSON.parse(token) === 'selected_boundary') members += 1
        }
        if (members === 1 && source && sha256(source.bytes) === source.sha256
          && typeof origin.sourceSha256 === 'string' && origin.sourceSha256 === source.value?.selected_boundary?.sha256) provenance = {
          kind: 'hash-bound-top-level-json-member', boundarySha256: origin.sourceSha256,
          targets: [recordReference(sources, selectedPath, '/selected_boundary')],
        }
      } else if (path === 'snapshots/build-inputs/creative-name-normalization.json' && jsonPointer === '/references/2'
        && vocabulary === 'typed:path' && selector === null && raw === 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json') {
        const manifestPath = 'snapshots/build-inputs/source-manifest.json'
        const snapshotPath = 'snapshots/build-inputs/SeoulWorldGraph.json'
        const manifest = sources.get(manifestPath); const snapshot = sources.get(snapshotPath)
        const producer = manifest?.value?.producer?.game
        const files = manifest?.value?.files ?? []
        const graphBindings = files.map((record, i) => ({ record, i })).filter(({ record }) => record.path === 'SeoulWorldGraph.json')
        const originBindings = files.filter(record => record.path === 'creative-name-normalization.json')
        if (manifest && snapshot && sha256(manifest.bytes) === manifest.sha256 && sha256(snapshot.bytes) === snapshot.sha256
          && manifest.value.schemaVersion === 1 && producer?.repository === 'islee23520/seoul-dengoku'
          && producer.commit === '1a473c831c17fa227dc936bf2f98c752d4241d7b'
          && producer.path === 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'
          && graphBindings.length === 1 && graphBindings[0].record.sha256 === snapshot.sha256
          && snapshot.sha256 === '46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d'
          && originBindings.length === 1 && originBindings[0].sha256 === sources.get(path).sha256) provenance = {
          kind: 'manifest-bound-foreign-repository-import', repository: producer.repository, revision: producer.commit,
          canonicalPath: producer.path, currentRuntime: false,
          targets: [recordReference(sources, snapshotPath, ''), recordReference(sources, manifestPath, '/producer/game'),
            recordReference(sources, manifestPath, `/files/${graphBindings[0].i}`)],
        }
      }
      if (provenance) {
        const original = { ...sourceRef(path, jsonPointer), target: raw, selector, vocabulary,
          reason: result.reason, required: true, reviewStatus: 'not-reviewed' }
        result = { status: 'provenance-correspondence', targets: provenance.targets, provenanceBoundary: provenance }
        localProvenanceDispositions.push({ key: referenceKey(original), original, ...result, required: false, reviewStatus: 'not-reviewed' })
      }
    }
    const row = { source: sourceRef(path, jsonPointer), raw, selector, vocabulary, ...result, reviewStatus: 'not-reviewed' }
    references.push(row)
    for (const target of row.targets) {
      const namespace = sealed(target.sourcePath) || provenanceSources.has(target.sourcePath) ? 'preserved-file' : 'file'
      add(`file:${path}`, `${namespace}:${target.sourcePath}`, `${row.status}:${vocabulary}`, path, jsonPointer)
      edges.push({ fromKey: `file:${path}`, toKey: `record:${JSON.stringify([target.sourcePath, target.jsonPointer])}`,
        kind: `${row.status}:${vocabulary}:record`, direction: 'directed', source: row.source, target })
    }
    if (row.status === 'unresolved') unresolved.push({ ...row.source, target: raw, selector, vocabulary,
      reason: row.reason, ...(external ? { external } : {}), required: true, reviewStatus: 'not-reviewed' })
  }
  const externalRef = (repository, path, value = {}) => ({ repository, path, pointer: value.pointer ?? null,
    revision: value.commit ?? value.revision ?? null, targetSha256: value.sha256 ?? null })
  for (const [path, source] of sources) {
    if (!source.value || sealed(path)) continue
    function visit(value, jsonPointer = '') {
      if (typeof value === 'string') {
        if (knownIdentities.has(value)) add(`identity:${value}`, `file:${path}`, 'identity-source-consumer', path, jsonPointer)
        if (value.startsWith('GDD/')) reference(value, path, jsonPointer, null, 'external-GDD-path', externalRef('GDD', value.slice(4)))
        else if (/^(?:lore|docs|snapshots|vendor)\//.test(value)) {
          for (const match of value.matchAll(/(?:lore|docs|snapshots|vendor)\/[^\s#;]+?\.(?:json|md)(?:#[^\s;]+)?/g)) {
            const raw = match[0]
            // These private profile bases have a typed, quoted source contract.
            // Preserve the scanner's raw match; recognize only its exact comma
            // list or Korean conjunction boundary, never strip anchor characters.
            let citation = null
            const field = path === 'lore/editorial/profile-batches/state-09-10.json' ? 'skills'
              : path === 'lore/editorial/profile-batches/state-15-16.json' ? 'traits' : null
            if (field && new RegExp(`^/profiles/\\d+/${field}/\\d+/basis$`).test(jsonPointer) && match.index === 0
              && resolveReference(raw, path).reason === 'selector-missing') {
              const boundary = value.match(field === 'skills'
                ? /^(lore\/characters\/Cast-State-(?:09|10)\.json)#(인물-[^\s,;#]+-p3), (인물-[^\s,;#]+-p4);(?:\s|$)/u
                : /^(lore\/characters\/Cast-State-(?:15|16)\.json)#(인물-[^\s,;#]+-p4)와 (?=관계·가치 기록\.)/u)
              if (boundary && raw === `${boundary[1]}#${boundary[2]}${field === 'skills' ? ',' : '와'}`) {
                const selected = [boundary[2], ...(field === 'skills' ? [boundary[3]] : [])]
                  .map(anchor => resolveReference(boundary[1], path, anchor))
                const profilePointer = jsonPointer.split('/').slice(0, 3).join('/')
                const profile = pointer(source.value, profilePointer)
                const support = (profile.evidence ?? []).map((record, i) => ({ record, jsonPointer: `${profilePointer}/evidence/${i}` }))
                  .filter(({ record }) => record.path === boundary[1] && record.anchor === boundary[2] && typeof record.quote === 'string' && record.quote.length > 0)
                if (selected.every(result => result.status === 'resolved' && result.targets.length === 1) && support.length === 1) {
                  const targets = selected.flatMap(result => result.targets)
                  const blocks = targets.map(t => pointer(sources.get(t.sourcePath).value, t.jsonPointer))
                  const ko = blocks[0].text?.ko
                  const body = typeof ko === 'string' ? ko : Array.isArray(ko) ? ko.map(run => run.text).join('') : ''
                  if (blocks.every(block => block.kind === 'paragraph') && body.includes(support[0].record.quote)) citation = {
                    kind: field === 'skills' ? 'profile-comma-anchor-list' : 'profile-korean-conjunction',
                    candidate: `${boundary[1]}#${boundary[2]}`, additionalAnchors: field === 'skills' ? [boundary[3]] : [],
                    corroboration: sourceRef(path, support[0].jsonPointer), targets,
                  }
                }
              }
            }
            reference(raw, path, jsonPointer, null, raw.startsWith('GDD/') ? 'external-GDD-path' : 'source-string',
              raw.startsWith('GDD/') ? externalRef('GDD', raw.slice(4)) : null, citation)
          }
        }
      } else if (value && typeof value === 'object') {
        if (!Array.isArray(value)) {
          for (const [left, right, kind] of [['from', 'to', 'structured-relation'], ['holderPersonId', 'titleId', 'right-title'], ['titleId', 'parentTitleId', 'geographic-parent'], ['personId', 'eventId', 'event-participation'], ['currentPersonId', 'key', 'lineage'], ['custodianPersonId', 'actorId', 'facility-custody']]) {
            if (typeof value[left] === 'string' && typeof value[right] === 'string') add(`identity:${value[left]}`, `identity:${value[right]}`, kind, path, jsonPointer)
          }
          if (path === 'lore/relations/opening-feudal-allocation.json') {
            if (/^\/titles\/\d+$/.test(jsonPointer) && value.parentTitleId) add(`entity:titles:${value.id}`, `entity:titles:${value.parentTitleId}`, 'title-parent', path, jsonPointer)
            if (/^\/existingTitleBindings\/\d+$/.test(jsonPointer)) add(`entity:holdings:${value.holdingId}`, `entity:titles:${value.titleId}`, 'holding-title-binding', path, jsonPointer)
          }
          if (path === 'lore/relations/opening-office-appointments.json' && /^\/appointments\/\d+$/.test(jsonPointer)) {
            add(`identity:${value.personId}`, `entity:states:${value.stateId}`, 'appointment-person-state', path, jsonPointer)
          }
          if (path === 'lore/name-pools/diaspora-family-lineages.json' && /^\/lineages\/\d+\/members\/\d+$/.test(jsonPointer)) {
            const lineagePointer = jsonPointer.split('/').slice(0, 3).join('/')
            const lineage = pointer(source.value, lineagePointer)
            for (const [i, key] of (value.parentKeys ?? []).entries()) {
              const hits = lineage.members.filter(m => m.key === key)
              const familyHits = get(family).nodes.filter(n => n.id === key)
              check(hits.length === 1 || hits.length === 0 && familyHits.length === 1, 'E_DEPENDENCY_REFERENCE', path, `${jsonPointer}/parentKeys/${i}`)
              add(hits.length ? `lineage:${lineage.key}:${key}` : `identity:${key}`, `lineage:${lineage.key}:${value.key}`, 'lineage-parent', path, `${jsonPointer}/parentKeys/${i}`)
              if (value.personId ?? value.currentPersonId) add(`lineage:${lineage.key}:${value.key}`, `identity:${value.personId ?? value.currentPersonId}`, 'lineage-person', path, jsonPointer)
            }
          }
          if (value.link && typeof value.link.domain === 'string' && typeof value.link.slug === 'string') {
            const { domain, slug, anchor = null } = value.link
            const raw = domain === 'gdd' ? `GDD/${slug}${anchor ? `#${anchor}` : ''}` : `lore/${domain === 'root' ? '' : `${domain}/`}${slug}.md`
            reference(raw, path, jsonPointer, anchor, 'renderer', domain === 'gdd' ? externalRef('GDD', slug, { pointer: anchor }) : null)
          }
          if (typeof value.repository === 'string' && typeof value.path === 'string') {
            reference(value.path, path, jsonPointer, value.pointer ?? null, 'external-repository-reference', externalRef(value.repository, value.path, value))
          } else for (const [field, selector] of [['path', value.pointer ?? value.anchor ?? null],
            ['sourcePath', value.layerId ? { type: 'station-layer', stationName: value.stationName, stationIdentity: value.stationIdentity, layerId: value.layerId } : value.sourceAnchor ?? null],
            ['siteSourcePath', { type: 'site', anchor: value.siteAnchor }], ['sourceDocument', null]]) {
            const raw = value[field]
            if (typeof raw === 'string' && /\.(?:json|md)(?:#.*)?$/.test(raw)) reference(raw, path, jsonPointer, selector,
              field === 'siteSourcePath' ? 'site' : field === 'sourcePath' && value.layerId ? 'station-layer' : `typed:${field}`)
          }
        }
        for (const [key, child] of Object.entries(value)) visit(child, `${jsonPointer}/${escape(key)}`)
      }
    }
    visit(source.value)
  }
  const connected = graph => {
    const parent = new Map(people.map(p => [p.id, p.id]))
    const find = id => { if (!parent.has(id)) parent.set(id, id); const p = parent.get(id); if (p !== id) parent.set(id, find(p)); return parent.get(id) }
    for (const edge of graph) { const a = find(edge.fromKey); const b = find(edge.toKey); if (a !== b) parent.set(b, a) }
    const groups = new Map()
    for (const id of parent.keys()) { const p = find(id); if (!groups.has(p)) groups.set(p, []); groups.get(p).push(id) }
    return [...groups.values()].map(nodes => ({ nodes: nodes.sort(), personIds: nodes.filter(id => issued.has(id)).sort() }))
      .filter(g => g.personIds.length).sort((a, b) => b.personIds.length - a.personIds.length || a.personIds[0].localeCompare(b.personIds[0]))
  }
  const normalized = edges.map(e => ({ ...e, fromKey: e.fromKey.replace(/^identity:/, ''), toKey: e.toKey.replace(/^identity:/, '') }))
  return { structural, edges, references, dispositions, profileCitationDispositions, localProvenanceDispositions, unresolved, structuralGroups: connected(structural), sharedSourceGroups: connected(normalized),
    policy: 'Bidirectional closure includes incoming and outgoing evidence consumers. Groups are dependency components, not approved batches. Unresolved narrative/anchor references require later full-body review; shared files have one writer and serialized application.' }
}

export function buildCensusProducts({ baseline, immutable, sources, task2Binding, triage = [], provenanceSources = new Map() }) {
  const original = originalCategories(immutable)
  const current = extractCurrentCategories(sources, original)
  const mapping = compareCensusCategories(original, current)
  const entities = extractEntityRecords(sources)
  for (const set of ENTITY_SETS) exact(entities[set].map(r => r.id), baseline.currentEntitySets[set], set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/census/${set}`)
  const people = sources.get('lore/name-pools/person-id-registry.json').value.persons
  const primary = extractPrimaryCards(sources, people)
  const dependencies = extractDependencies(sources, people, entities, triage, provenanceSources)
  const identityMap = new Map(immutable.issuedIdentityMap.occurrences.map(row => [JSON.stringify([row.sourcePath, row.jsonPointer]), row.personIds]))
  const cardOccurrences = original.cards.map((row, index) => ({ ...row, originalKey: coverageKey(row),
    currentHash: current.cards[index].originalSha256,
    personIds: identityMap.get(JSON.stringify([row.sourcePath, row.jsonPointer])) ?? [],
    classification: sealed(row.sourcePath) ? 'sealed-history' : 'current-pending', reviewStatus: 'not-reviewed' }))
  const refsByPerson = new Map(people.map(p => [p.id, []]))
  for (const card of cardOccurrences) if (!sealed(card.sourcePath)) for (const id of card.personIds) refsByPerson.get(id)?.push(card.originalKey)
  const birthdays = sources.get('lore/name-pools/cast-birthdays.json').value.people
  const values = sources.get('lore/name-pools/values-cast.json').value.people
  const candidates = sources.get('lore/name-pools/person-id-candidates.json').value
  const binding = { baselineSha256: BASELINE_SHA256, baseCommit: baseline.baseCommit, identitySetHashes: baseline.identitySetHashes, task2: task2Binding }
  const ledger = {
    schema: 'seoul-relocation-census.v1', binding,
    people: people.map((person, i) => ({ personId: person.id, batchId: null, originalRefs: [entities.persons[i]],
      proposedLocationRefs: [], proposedHoldingRefs: [], titleChanges: [], narrativeChanges: [], preservedFacts: [], changedFacts: [], status: 'pending', approval: null,
      inventory: { issued: person, cardKeys: refsByPerson.get(person.id), primaryCard: primary[i],
        birthday: birthdays.find(p => p.id === person.id) ?? null,
        originalValues: values.find(p => p.id === person.id || p.name === person.name) ?? null,
        publicRoute: `/people/person-${String(values.findIndex(p => p.name === person.name) + 1).padStart(4, '0')}`,
        protectionStatus: 'source-retained-not-semantically-reviewed' } })),
    originalRights: ENTITY_SETS.filter(set => set !== 'persons').flatMap(set => entities[set].map(record => ({ set, id: record.id, originalRef: record, newRefs: [], disposition: 'pending', batchId: null, approval: null }))),
    cardOccurrences,
    candidateIdentity: { sourcePath: 'lore/name-pools/person-id-candidates.json', sourceSha256: sources.get('lore/name-pools/person-id-candidates.json').sha256,
      existing: candidates.existingK.map(row => ({ original: row, issuedPersonId: people.find(p => p.id === row.id && p.name === row.name)?.id ?? null })),
      candidates: candidates.candidates.map(row => ({ original: row, issuedPersonId: people.find(p => p.name === row.name)?.id ?? null, authority: 'registry-match-not-new-issuance' })) },
    dependencyDispositions: dependencies.dispositions,
    profileCitationDispositions: dependencies.profileCitationDispositions,
    localProvenanceDispositions: dependencies.localProvenanceDispositions,
    connectedGroups: dependencies.structuralGroups,
    sharedSourceGroups: dependencies.sharedSourceGroups,
    sourceFileOwnership: [...sources.keys()].filter(path => !sealed(path)).map(sourcePath => ({ sourcePath, writer: null, batchId: null, application: 'serialized-whole-source', dependencyNode: `file:${sourcePath}` })),
    batches: [], approvals: [],
  }
  const documents = [...sources].map(([sourcePath, source]) => ({ sourcePath, sourceId: source.value?.id ?? null, slug: source.value?.slug ?? null,
    sourceStatus: source.value?.status ?? null, sourceKind: baseline.files.find(f => f.path === sourcePath).kind,
    originalSha256: baseline.files.find(f => f.path === sourcePath).sha256, currentSha256: source.sha256,
    classification: sealed(sourcePath) ? 'sealed-history' : 'current-pending', disposition: 'pending-review', revisedByBatch: null, reviewedAt: null, receipt: null,
    extraction: 'full-byte-and-recursive-record-extraction', semanticReview: 'not-reviewed',
    locales: source.value?.locales ? Object.keys(source.value.locales) : [],
    originalIndex: mapping.original.filter(r => r.sourcePath === sourcePath), currentIndex: mapping.current.filter(r => r.sourcePath === sourcePath) }))
  const review = { schema: 'seoul-narrative-census.v1', binding, documents,
    preservationInventory: baseline.files.filter(file => file.kind === 'geography-source').map(file => ({ ...file, classification: 'raw-geography-preservation-only', binding: 'immutable-phase-archive', admission: 'not-current-lore', reviewStatus: 'not-reviewed' })),
    occurrenceStorage: { original: baseline.occurrences, markdownSpans: { path: immutable.markdownPath, sha256: MARKDOWN_SPANS_SHA256 },
      identityOccurrences: { count: immutable.original.identityOccurrences.length, sha256: digestRows(immutable.original.identityOccurrences) },
      keyFormula: 'JSON.stringify([sourcePath,jsonPointer,locale,originalSha256])',
      indexFormula: 'SHA256 of every lexically ordered JSON tuple followed by LF; tuples include path,pointer,anchor,locale,hash; categories remain separate',
      currentStorage: 'Replay all original categories from immutable archive; independently traverse ALL current source bytes; mapping exceptions retain every changed, added, moved or removed key. Per-source indexes authenticate the entire replay, never a sample.' },
    mapping: { unchangedRule: mapping.unchangedRule, exceptions: mapping.exceptions },
    dependencyInventory: null, dependencyTriage: TRIAGE_BINDING, receipts: [], approvals: [], samples: [],
    reviewStatus: 'not-reviewed',
  }
  return { ledger, review, dependencies, original, current }
}

// Closed pending-inventory contract. Approval/application is a later contract
// transition, not an inference from extracted bodies or archived approvals.
export function validateCensusProducts(actual, expected) {
  try {
    for (const name of ['ledger', 'review']) shape(actual[name], Object.keys(expected[name]), `/census/${name}`)
    const { ledger, review } = actual
    check(ledger.schema === expected.ledger.schema && review.schema === expected.review.schema, 'E_SCOPE_SHAPE', '/census/schema')
    for (const document of review.documents) if (sealed(document.sourcePath)) check(document.classification === 'sealed-history', 'E_SCOPE_ADMISSION', '/census/documents', document.sourcePath)
    for (const row of ledger.people) {
      check(row.approval === null, row.approval?.kind && row.approval.kind !== 'batch-allocation' ? 'E_APPROVAL_KIND' : 'E_APPROVAL_BATCH', '/census/people/approval', row.personId)
      check(row.status === 'pending' && row.batchId === null && [row.proposedLocationRefs, row.proposedHoldingRefs, row.titleChanges, row.narrativeChanges, row.preservedFacts, row.changedFacts].every(v => Array.isArray(v) && v.length === 0), 'E_SCOPE_PENDING', '/census/people/status', row.personId)
    }
    exact(ledger.people.map(p => p.personId), expected.ledger.people.map(p => p.personId), 'E_CENSUS_PERSON', '/census/people')
    exact(ledger.originalRights.map(r => JSON.stringify([r.set, r.id])), expected.ledger.originalRights.map(r => JSON.stringify([r.set, r.id])), 'E_CENSUS_RIGHT', '/census/originalRights')
    check(eq(ledger.originalRights, expected.ledger.originalRights), 'E_CENSUS_RIGHT', '/census/originalRights')
    exact(ledger.cardOccurrences.map(r => r.originalKey), expected.ledger.cardOccurrences.map(r => r.originalKey), 'E_REVIEW_COVERAGE', '/census/cards')
    check(eq(ledger.cardOccurrences, expected.ledger.cardOccurrences), 'E_REVIEW_HASH', '/census/cards')
    exact(review.documents.map(d => d.sourcePath), expected.review.documents.map(d => d.sourcePath), 'E_REVIEW_COVERAGE', '/census/documents')
    for (const doc of review.documents) {
      const wanted = expected.review.documents.find(d => d.sourcePath === doc.sourcePath)
      check(doc.currentSha256 === wanted.currentSha256, sealed(doc.sourcePath) ? 'E_ARCHIVE_HASH' : 'E_REVIEW_HASH', '/census/documents', doc.sourcePath)
      for (const kind of ['originalIndex', 'currentIndex']) {
        exact(doc[kind].map(r => r.category), wanted[kind].map(r => r.category), 'E_REVIEW_COVERAGE', `/census/${kind}`, doc.sourcePath)
        for (const index of doc[kind]) {
          const other = wanted[kind].find(r => r.category === index.category)
          check(index.count === other.count, 'E_REVIEW_COVERAGE', `/census/${kind}`, doc.sourcePath)
          check(index.sha256 === other.sha256, kind === 'currentIndex' ? 'E_REVIEW_HASH' : 'E_ARCHIVE_HASH', `/census/${kind}`, doc.sourcePath)
        }
      }
    }
    check(eq(ledger.binding, expected.ledger.binding) && eq(review.binding, expected.review.binding), 'E_ARCHIVE_HASH', '/census/binding')
    check(eq(ledger.connectedGroups, expected.ledger.connectedGroups) && eq(ledger.sharedSourceGroups, expected.ledger.sharedSourceGroups)
      && eq(actual.dependencies, expected.dependencies), 'E_REVIEW_COVERAGE', '/census/dependencies')
    check(eq(review.mapping, expected.review.mapping), 'E_REVIEW_COVERAGE', '/census/mapping')
    check(eq(ledger, expected.ledger) && eq(review, expected.review), 'E_REVIEW_COVERAGE', '/census/metadata')
    return { ok: true, errors: [] }
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/census', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}

export function validateIndependentReview(review, original, current, documents) {
  const owners = new Map(documents.map(d => [d.sourcePath, d.batchId]))
  const originalRows = new Map(); const currentRows = new Map()
  for (const rows of Object.values(original)) for (const raw of rows) { const r = rowOf(raw); originalRows.set(coverageKey(r), { key: coverageKey(r), batchId: owners.get(r.sourcePath) ?? null }) }
  for (const rows of Object.values(current)) for (const raw of rows) { const r = rowOf(raw); currentRows.set(coverageKey(r), { key: coverageKey(r), sha256: r.originalSha256, batchId: owners.get(r.sourcePath) ?? null }) }
  exact(review.originalKeys.map(r => r.key), [...originalRows.keys()], 'E_REVIEW_COVERAGE', '/review/independentOriginalKeys')
  exact(review.currentKeys.map(r => r.key), [...currentRows.keys()], 'E_REVIEW_COVERAGE', '/review/independentCurrentKeys')
  for (const row of review.originalKeys) {
    shape(row, ['key', 'batchId'], '/review/originalKeys')
    check(row.batchId === originalRows.get(row.key).batchId, 'E_APPROVAL_BATCH', '/review/originalKeys', row.key)
  }
  for (const row of review.currentKeys) {
    shape(row, ['key', 'sha256', 'batchId'], '/review/currentKeys')
    check(row.sha256 === currentRows.get(row.key).sha256, 'E_REVIEW_HASH', '/review/currentKeys', row.key)
    check(row.batchId === currentRows.get(row.key).batchId, 'E_APPROVAL_BATCH', '/review/currentKeys', row.key)
  }
}

export function validateDependencyClosure(contract, batches, dependencies, { mode = 'inspection', batchId = null } = {}) {
  const documents = new Map(contract.documents.map(d => [d.sourcePath, d]))
  const people = new Map(contract.entities.filter(e => e.kind === 'person').map(e => [e.id, e]))
  const batchIndex = new Map(batches.map(b => [b.id, b]))
  const selected = new Set(batchId ? [batchId] : [])
  for (const id of selected) for (const dependency of batchIndex.get(id)?.dependencyBatchIds ?? []) selected.add(dependency)
  for (const ref of dependencies.unresolved ?? []) {
    const document = documents.get(ref.sourcePath)
    const claimed = document?.status === 'active' || batches.some(b => b.approval && b.documentPaths?.includes(ref.sourcePath))
    check(!(ref.required && (mode === 'publication' || claimed || selected.has(document?.batchId))),
      'E_DEPENDENCY_UNRESOLVED', ref.sourcePath, ref.jsonPointer)
  }
  for (const entity of people.values()) {
    if (entity.status !== 'active') continue
    const closure = new Set([entity.batchId])
    for (const id of closure) {
      check(batchIndex.has(id), 'E_APPROVAL_BATCH', '/census/dependencyBatchIds', id)
      for (const dependency of batchIndex.get(id).dependencyBatchIds) closure.add(dependency)
    }
    const group = dependencies.sharedSourceGroups.find(g => g.personIds.includes(entity.id))
    check(group, 'E_REVIEW_COVERAGE', '/census/dependencyGroup', entity.id)
    for (const id of group.personIds) {
      check(people.get(id)?.status === 'active', 'E_SCOPE_PENDING', '/census/dependencyPerson', id)
      check(closure.has(people.get(id).batchId), 'E_APPROVAL_BATCH', '/census/dependencyPerson', id)
    }
    for (const node of group.nodes.filter(n => n.startsWith('file:'))) {
      const path = node.slice(5)
      const document = documents.get(path)
      check(document?.status === 'active', 'E_SCOPE_PENDING', '/census/dependencySource', path)
      check(closure.has(document.batchId), 'E_APPROVAL_BATCH', '/census/dependencySource', path)
    }
  }
}

export async function loadAndValidateCensus({ root, baseline, baselineSha256, contract, batches, review: machineReview, mode = 'publication', batchId = null, readBytes = readFile }) {
  const load = async path => JSON.parse(await readBytes(resolve(root, path)))
  const ledger = await load(CENSUS_PATHS[0]); const review = await load(CENSUS_PATHS[1])
  const immutable = await loadImmutableCensus(baseline, readBytes, baselineSha256)
  const sources = await extractCensusSources(baseline, path => readBytes(resolve(root, path)))
  // Raw comparison geography stays outside the authored-document denominator.
  const provenanceSources = new Map()
  const comparisonPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
  const comparisonBytes = Buffer.from(await readBytes(resolve(root, comparisonPath)))
  provenanceSources.set(comparisonPath, { bytes: comparisonBytes, sha256: sha256(comparisonBytes), value: JSON.parse(comparisonBytes) })
  const geoBytes = await readBytes(resolve(root, TASK2_BINDING.geography.path))
  check(sha256(geoBytes) === TASK2_BINDING.geography.sha256, 'E_REVIEW_HASH', TASK2_BINDING.geography.path)
  const geography = JSON.parse(geoBytes)
  const geometry = geography.spatialSource.geometry
  check(sha256(await readBytes(resolve(root, geometry.path))) === geometry.sha256, 'E_SCOPE_GEOMETRY', geometry.path)
  const binding = { ...TASK2_BINDING, spatial: geography.spatialSource, sourceFacts: geography.evidence }
  const artifact = review.dependencyInventory
  shape(artifact, ['path', 'sha256', 'payloadSha256', 'encoding'], '/census/dependencyInventory')
  check(artifact.path.startsWith('.omo/private/seoul-migration/task-7-census/') && !artifact.path.split('/').includes('..') && artifact.encoding === 'base64-gzip-json', 'E_SCOPE_SHAPE', '/census/dependencyInventory')
  const encoded = await readBytes(resolve(root, artifact.path))
  check(sha256(encoded) === artifact.sha256, 'E_ARCHIVE_HASH', artifact.path)
  const payload = gunzipSync(Buffer.from(encoded.toString().replace(/\s/g, ''), 'base64'))
  check(sha256(payload) === artifact.payloadSha256, 'E_ARCHIVE_HASH', '/census/dependencyInventory/payload')
  const dependencies = JSON.parse(payload)
  const triage = await loadDependencyTriage(root, readBytes)
  const expected = buildCensusProducts({ baseline, immutable, sources, task2Binding: binding, triage, provenanceSources })
  expected.review.dependencyInventory = artifact
  const result = validateCensusProducts({ ledger, review, dependencies }, expected)
  if (!result.ok) return result
  validateDependencyClosure(contract, batches, dependencies, { mode, batchId })
  if (machineReview !== null) validateIndependentReview(machineReview, expected.original, expected.current, contract.documents)
  return { ...result, dependencyReport: { originalDispositions: dependencies.dispositions.length,
    profileCitationDispositions: dependencies.profileCitationDispositions.length,
    localProvenanceDispositions: dependencies.localProvenanceDispositions.length,
    references: dependencies.references.length, unresolved: dependencies.unresolved.length,
    byVocabulary: Object.fromEntries([...new Set(dependencies.unresolved.map(r => r.vocabulary))]
      .map(kind => [kind, dependencies.unresolved.filter(r => r.vocabulary === kind).length])),
    artifact: review.dependencyInventory, semanticReview: 'not-reviewed' } }
}
