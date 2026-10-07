import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'

export const categories = [
  { id: 'design', label: '제품 설계', dir: '', depth: 0 },
  { id: 'rules', label: '게임 규칙', dir: 'rules', depth: 0 },
  { id: 'architecture', label: '아키텍처', dir: 'architecture', depth: 0 },
  { id: 'references', label: '레퍼런스 연구', dir: 'references', depth: 0 },
  { id: 'decisions', label: '결정 기록', dir: 'adr', depth: 0 },
  { id: 'art', label: '아트 설계', dir: 'art', depth: 0 },
  { id: 'system-design', label: '시스템 설계', dir: 'system-design', depth: 0 },
  { id: 'proposals', label: '설계 제안', dir: 'proposals', depth: 0 },
]
export const excluded = new Set(['AGENTS.md', 'README.md'])

export function categoryForPage(page) {
  if (extname(page) !== '.md' || excluded.has(basename(page))) return undefined
  return categories.find(({ dir }) => (dir || '.') === dirname(page))
}

// Status is not an admission switch. Publication preserves each collection classification.
export async function loadGddSources(gddRoot) {
  const sources = new Map()
  const add = (page, source, id) => {
    if (sources.has(page)) throw new Error(`E_GDD_SOURCE_DUPLICATE:${page}`)
    sources.set(page, { source, id })
  }
  for (const name of (await readdir(resolve(gddRoot, 'canon/collections'))).sort()) {
    if (extname(name) !== '.json') continue
    const collection = JSON.parse(await readFile(resolve(gddRoot, 'canon/collections', name), 'utf8'))
    for (const entry of collection.documents) add(entry.source.path, `canon/${entry.path}`, entry.id)
  }
  for (const name of (await readdir(resolve(gddRoot, 'canon/locales/ko-KR'))).sort()) {
    if (!/^adr-\d{3}\.json$/.test(name)) continue
    const value = JSON.parse(await readFile(resolve(gddRoot, 'canon/locales/ko-KR', name), 'utf8'))
    add(value.source.path, `canon/locales/ko-KR/${name}`, value.document.id)
  }
  return sources
}

export async function approvedDocuments(gddRoot, pagesRoot, sources) {
  sources ??= await loadGddSources(gddRoot)
  const documents = []
  for (const [page, identity] of sources) {
    const category = categoryForPage(page)
    if (!category) continue
    if (!/^canon\/locales\/ko-KR\/(?:adr-\d{3}\.json|(?:root|rules|architecture|references|art|system-design|proposals)\/[^/]+\.json)$/.test(identity.source)) {
      throw new Error(`E_GDD_SOURCE_UNPUBLISHED:${identity.source}:${page}`)
    }
    documents.push({ ...identity, route: `/${category.id}/${basename(page, '.md')}` })
  }
  if (await stat(resolve(pagesRoot, 'LICENSE.md')).then((entry) => entry.isFile(), () => false)) {
    await readFile(resolve(gddRoot, 'LICENSE'), 'utf8')
    documents.push({ source: 'LICENSE', id: 'gdd:LICENSE', route: '/design/LICENSE' })
  }
  return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
}
