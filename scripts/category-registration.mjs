// Category registration for published lore JSON.
// The registry is the template. An authored document is indexed under its domain
// even when it omits `categories`. An explicit list replaces that default and
// must name known categories. A domain outside the registry fails generation.
// Category templates validate source metadata and content structure before publishing.
// Public pages never receive the private template text.
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { headingId } from './lore-json-render.mjs'

const ko = (leaf) => typeof leaf === 'string' ? leaf : Array.isArray(leaf) ? leaf.map((run) => run.text).join('') : ko(leaf?.ko ?? '')

export function categoryEntities(pages, documents) {
  const routes = new Map(documents.map((document) => [document.slug, document.route]))
  const entities = []
  const technologyUses = [
    ['power', '전력', /축전 모듈|축전지|비상발전기|거점 발전기|발전기|자율 충전 단자|충전 단자|회수 셀|배터리 셀/gu],
    ['water', '급수', /정수|송수관|급수 설비|밸브|펌프/gu],
    ['production-repair', '생산·수리', /구동부 모듈|유압 중장비 하체|후방 중량 밸런서|충격 쇄석 둔기|외부 보강 장갑판|장애물 파쇄 턱|유압 피스톤|유압 실린더|고토크 모터|유압 호스|열교환기|냉각 루프|부품 건조장/gu],
    ['movement-transport', '이동·운송', /전동 화물|차륜|제동 장치|승강기|물류 휴머노이드|상부 수송 호퍼|다지 관절 구동계/gu],
    ['sensing-communications', '감지·통신', /센서 모듈|광학 센서 패널|발광 탐색 렌즈|진동 음파 방출기|프로토콜 카드|원격 제어|호출망|분산 제어/gu],
    ['medical-biological', '의료·생물', /항생제|해열제|수액|인슐린|의료 냉장고|호흡보호구/gu],
  ]
  const ecologyLabels = { 'animal-urban': '도시 동물', human: '적대 사람 집단', 'rogue-robot': '잔존 자동 기계', infected: '감염자', biomechanical: '생체기계·시설 생태', 'humanoid-mutant': '인체 변이·공생' }
  const technologies = new Map()
  for (const page of pages) {
    const source = page.value
    const route = routes.get(page.slug)
    if (!route) continue
    if (source.data?.atlas) {
      const atlas = source.data.atlas
      for (const entry of Object.values(atlas.monster_contents ?? {}).flatMap((batch) => batch.entries ?? [])) {
        const group = atlas.hostile_groups.find((item) => item.id === entry.group_id)
        const target = routes.get(`Hostile-Group-${group.id}`)
        if (!target) continue
        const role = ko(entry.bestiary?.battlefield_role ?? entry.role_class)
        entities.push({ category: 'bestiary', id: entry.id, title: ko(entry.display_name), route: `${target}#${entry.id.toLowerCase()}`, source: `${page.path}#/data/atlas/monster_contents`, path: [
          { id: `bestiary-${group.category}`, label: ecologyLabels[group.category] },
          { id: `bestiary-${group.category}-${headingId(role)}`, label: role },
          { id: `bestiary-${group.category}-${headingId(role)}-${group.id}`, label: ko(group.display_name) },
        ] })
      }
    }
    if (page.slug === 'Martial-Paths') {
      const table = source.content.find((node) => node.kind === 'table' && node.columns.map(ko).join('|') === '분류|2026 기원|기본|한자|상승|한자')
      for (const [index, row] of table.rows.entries()) for (const column of [2, 4]) {
        const title = ko(row[column])
        if (title === '—') continue
        const label = ko(row[0])
        entities.push({ category: 'culture', id: `${source.id}#${table.anchor}:${title}`, title, route: `${route}#${headingId('무공 체계')}`, source: `${page.path}#${table.anchor}`, path: [{ id: 'martial', label: '무공' }, { id: `martial-${headingId(label)}`, label }] })
      }
    }
    if (!['technology', 'goods', 'structures', 'people-and-machines', 'ailments'].includes(source.domain)) continue
    let heading = null
    let religious = false
    for (const node of source.content) {
      if (node.kind === 'heading') { heading = node; religious = /신화|숭배|의례|신격화|신앙|출처/.test(ko(node.text)); }
      if (religious || !heading || !['paragraph', 'list'].includes(node.kind)) continue
      const texts = node.kind === 'list' ? node.items.map(ko) : [ko(node.text)]
      for (const text of texts) {
        if (/^[가-힣]\. /.test(text)) continue
        if (node.kind === 'paragraph' && /^g(?:25|26)-.+-p1$/u.test(node.anchor) && /^G(?:25|26) /.test(text)) {
          const name = ko(heading.text)
          const use = name.startsWith('G25') ? ['sensing-communications', '감지·통신'] : ['production-repair', '생산·수리']
          entities.push({ category: 'technology', id: `${source.id}#${heading.anchor}`, title: name, kind: '기계 라인', description: text, route: `${route}#${heading.anchor}`, source: `${page.path}#${node.anchor}`, path: [{ id: `technology-${use[0]}`, label: use[1] }, { id: `technology-${heading.anchor}`, label: name }] })
        }
        for (const [use, label, pattern] of technologyUses) for (const match of text.matchAll(pattern)) {
          const title = match[0]
          const key = `${use}:${title}`
          const boundaries = [...text.matchAll(/[.!?](?=\s|$)/gu)].map((part) => part.index + 1)
          const sentenceStart = boundaries.filter((end) => end <= match.index).at(-1) ?? 0
          const sentenceEnd = boundaries.find((end) => end > match.index) ?? text.length
          const sentence = text.slice(sentenceStart, sentenceEnd)
          const descriptionStart = sentenceStart + sentence.search(/\S/u)
          const description = sentence.trim()
          const authoredModule = source.domain === 'technology' && /^(?:g(?:25|26)-.+-list4|지하-부품-경제-(?:list2|p3)|축전-발전-(?:p1|공급))$/u.test(node.anchor)
          const defines = authoredModule || description.startsWith(`${title}:`) || new RegExp(`${title}(?:은|는|을|를)`).test(description) && /저장한다|수동으로 조작|수동으로 기동|교체하여|공급한다|식별한다|탐지한다/.test(description) && !/못한다|아니다|보관되었다|임대로|멈춘 것/.test(description)
          const reference = `${page.path}#${node.anchor}`
          const score = (defines ? 10 : 0) + (source.domain === 'technology' ? 3 : 0) + (/저장|소모|완충|충전|식별|제공|복구|여닫|옮긴|막는다/u.test(description) ? 1 : 0)
          const previous = technologies.get(key)
          const identityAnchor = node.anchor === '지하-부품-경제-p3' && title === '센서 모듈' ? '지하-부품-경제-list2' : node.anchor === '축전-발전-공급' && title === '축전 모듈' ? '축전-발전-list2' : node.publicAnchors?.find((anchor) => /-list\d$/u.test(anchor)) ?? node.anchor
          const item = { category: 'technology', id: `${source.id}#${identityAnchor}:${title}`, title, kind: /제어|정수|발전/.test(title) ? '기술·운용' : '장비·부품', description, descriptionRange: { start: descriptionStart, end: descriptionStart + description.length, unit: 'utf-16-code-unit' }, route: `${route}#${heading.anchor}`, source: reference, path: [{ id: `technology-${use}`, label }], score, defines, references: [] }
          if (/^g(?:25|26)-/.test(heading.anchor)) item.path.push({ id: `technology-${heading.anchor}`, label: ko(heading.text) })
          if (!previous) technologies.set(key, item)
          else if (score > previous.score) { item.references = [...previous.references, previous.source]; technologies.set(key, item) }
          else if (!previous.references.includes(reference) && reference !== previous.source) previous.references.push(reference)
        }
      }
    }
  }
  entities.push(...[...technologies.values()].filter((item) => item.defines).map(({ score, defines, ...item }) => item))
  return entities
}

const atlasProjectionSlugs = new Set([
  'Operating-Houses',
  'Regional-Physical-AI-Arcs',
  'Synthetic-Actors',
  'World-Expansion-Index',
  'World-Relation-Ledger',
  'External-Theaters',
  'Hostile-Ecology-Index',
  ...Array.from({ length: 26 }, (_, index) => `Hostile-Group-G${String(index + 1).padStart(2, '0')}`),
])

const verifiedAtlasProjection = (document) =>
  atlasProjectionSlugs.has(document.slug) &&
  document.source?.kind === 'computed' &&
  document.source.refs?.includes('lore/World-Narrative-Atlas.json') &&
  document.provenance?.original_anchor === 'lore/World-Narrative-Atlas.json' &&
  document.provenance?.history?.includes('world-atlas-projections.v2')

export async function loadCategoryRegistry(registryPath) {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const categories = registry.categories ?? []
  const ids = categories.map((category) => category.id)
  if (new Set(ids).size !== ids.length) throw new Error('E_CATEGORY_REGISTRY_DUPLICATE')
  for (const category of categories) {
    if (!category.id || !category.label || !Array.isArray(category.requiredKinds) || category.requiredKinds.length === 0 ||
      category.requiredKinds.some((kind) => !['heading', 'paragraph', 'list', 'table'].includes(kind))) {
      throw new Error(`E_CATEGORY_REGISTRY_SHAPE:${category.id ?? ''}`)
    }
  }
  return registry
}

export function registeredCategories(document, registry) {
  const known = new Set(registry.categories.map((category) => category.id))
  if (!Object.hasOwn(document, 'categories')) {
    return known.has(document.domain) ? [document.domain] : []
  }
  return document.categories
}

export function registrationErrors(document, registry, sourceName) {
  const name = sourceName ?? document.slug ?? 'document'
  const known = new Set(registry.categories.map((category) => category.id))
  if (!known.has(document.domain) && document.domain !== 'root') {
    return [`E_CATEGORY_DOMAIN:${name}:${document.domain ?? ''}`]
  }
  const categories = registeredCategories(document, registry)
  if (!Array.isArray(categories) || categories.length === 0 || categories.some((id) => typeof id !== 'string' || id.length === 0)) {
    return [`E_CATEGORY_SHAPE:${name}`]
  }
  if (new Set(categories).size !== categories.length) return [`E_CATEGORY_DUPLICATE:${name}`]
  const unknown = categories.filter((id) => !known.has(id)).map((id) => `E_CATEGORY_UNKNOWN:${name}:${id}`)
  if (unknown.length) return unknown
  const errors = []
  if (!document.locales?.ko?.title || !document.locales?.ko?.summary || !document.locales?.en?.title || !document.locales?.en?.summary) {
    errors.push(`E_CATEGORY_LOCALES:${name}`)
  }
  if (!document.source?.kind || !Array.isArray(document.source.refs) || document.source.refs.length === 0 ||
    document.source.refs.some((ref) => typeof ref !== 'string' || ref.length === 0)) {
    errors.push(`E_CATEGORY_SOURCE:${name}`)
  }
  if (verifiedAtlasProjection(document)) {
    if (!document.content.some((node) => node?.kind === 'heading')) {
      errors.push(`E_CATEGORY_CONTENT:${name}:atlas-projection:heading`)
    }
    return errors
  }
  for (const id of categories) {
    const category = registry.categories.find((entry) => entry.id === id)
    for (const kind of category.requiredKinds) {
      if (!document.content.some((node) => node?.kind === kind)) errors.push(`E_CATEGORY_CONTENT:${name}:${id}:${kind}`)
    }
  }
  return errors
}

export function categoryIndex(documents, registry, entities = []) {
  const byId = new Map(registry.categories.map((category) => [category.id, {
    id: category.id,
    label: category.label,
    summary: category.summary ?? '',
    documents: [],
    children: [],
    entities: [],
  }]))
  const uncategorized = []
  for (const document of documents) {
    const entry = {
      slug: document.slug,
      route: document.route,
      title: document.title,
    }
    const ids = document.categories ?? []
    if (ids.length === 0) {
      uncategorized.push(entry)
      continue
    }
    for (const id of ids) byId.get(id).documents.push(entry)
  }
  for (const category of byId.values()) {
    category.documents.sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  }
  for (const entity of entities) {
    let parent = byId.get(entity.category)
    if (!parent) throw new Error(`E_CATEGORY_ENTITY_PARENT:${entity.id}:${entity.category}`)
    for (const branch of entity.path) {
      let child = parent.children.find((node) => node.id === branch.id)
      if (!child) {
        child = { id: branch.id, label: branch.label, summary: '', documents: [], children: [], entities: [] }
        parent.children.push(child)
      }
      parent = child
    }
    if (parent.entities.some((item) => item.id === entity.id)) throw new Error(`E_CATEGORY_ENTITY_DUPLICATE:${entity.id}`)
    const { category, path, ...entry } = entity
    parent.entities.push(entry)
  }
  uncategorized.sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  return { categories: [...byId.values()], uncategorized }
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === 'category-registration.mjs'
if (isDirectRun) {
  const root = dirname(fileURLToPath(import.meta.url))
  const registry = await loadCategoryRegistry(join(root, 'category-registry.json'))
  const target = process.argv[2]
  if (!target) {
    console.log(registry.categories.map((category) => `${category.id}\t${category.requiredKinds.join(',')}`).join('\n'))
  } else {
    const document = JSON.parse(await readFile(target, 'utf8'))
    const errors = registrationErrors(document, registry, basename(target))
    if (errors.length) {
      console.error(errors.join('\n'))
      process.exitCode = 1
    } else {
      console.log(`registered:${registeredCategories(document, registry).join(',')}`)
    }
  }
}
