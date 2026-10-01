// The house projection keeps source_kind for authoring; publication omits only its generated list item.
export function publicHouseContent(document) {
  if (document.slug !== 'Operating-Houses') return document
  return { ...document, content: document.content.map((node, index) => node.kind === 'list'
    && document.content[index - 1]?.kind === 'heading' && document.content[index - 1].depth === 2
    && node.items[2]?.en === 'Source layer: original-fiction' && node.items[2]?.ko === '출처층: original-fiction'
    ? { ...node, items: node.items.filter((_item, itemIndex) => itemIndex !== 2) }
    : node) }
}
