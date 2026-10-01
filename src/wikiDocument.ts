import { fromWikiBlocks, type WikiBlock, type WikiContentNode } from '@seoul-dengoku/document-renderer'

export const wikiBlockText = (node: WikiBlock): string => node.value ?? (node.children ?? []).map(wikiBlockText).join('')

export const wikiHeadingId = (text: string): string =>
  text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')

export const wikiArticleContent = (blocks: readonly WikiBlock[]): WikiContentNode[] => {
  const content = fromWikiBlocks(blocks)
  const reserved = new Set<string>()
  const natural = new Set<string>()
  const collect = (node: WikiBlock): void => {
    if (node.type === 'html') {
      const id = node.value?.match(/^<a id="([^"<>]+)">$/u)?.[1]
      if (id) reserved.add(id)
    }
    node.children?.forEach(collect)
  }
  content.forEach(({ node, anchors }) => {
    collect(node)
    const id = anchors.get(node)
    if (id && node.type === 'heading') natural.add(id)
    else if (id) reserved.add(id)
  })
  const used = new Set(reserved)
  return content.map((entry) => {
    if (entry.node.type !== 'heading') return entry
    const base = entry.anchors.get(entry.node)
    if (!base) return entry
    let id = base
    if (used.has(id)) {
      for (let suffix = 2; used.has(id) || natural.has(id); suffix += 1) id = `${base}-${suffix}`
    }
    used.add(id)
    return { ...entry, anchors: new Map([...entry.anchors, [entry.node, id]]) }
  })
}
