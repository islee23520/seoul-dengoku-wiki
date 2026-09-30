export type SourceSpan = { path: string; start: number; end: number; unit: 'unicode-code-point'; textStart: number; textEnd: number }
export type SelectableTextLeaf = { leafId: string; blockAnchor: string; blockKind: string; text: string; sourceSpans: SourceSpan[] }
export type FeedbackDocument = { documentId: string; sourceRevision: string; selectableLeaves: SelectableTextLeaf[] }
export type SelectionPart = {
  blockAnchor: string
  blockKind: string
  leafId: string
  exactQuote: string
  prefix: string
  suffix: string
  range: { start: number; end: number; unit: 'unicode-code-point' }
  sourceSpans: Array<Omit<SourceSpan, 'textStart' | 'textEnd'>>
}
export type FeedbackAnchor = {
  schemaVersion: 'feedback-anchor.v1'
  documentId: string
  route: string
  locale: 'ko' | 'en'
  sourceRevision: string
  selections: SelectionPart[]
}

const codePoints = (text: string) => Array.from(text)
const utf16ToCodePoint = (text: string, offset: number) => codePoints(text.slice(0, offset)).length
const CONTEXT_LENGTH = 32

export function clipSourceSpans(leaf: SelectableTextLeaf, start: number, end: number): SelectionPart['sourceSpans'] {
  return leaf.sourceSpans.flatMap((span) => {
    const overlapStart = Math.max(start, span.textStart)
    const overlapEnd = Math.min(end, span.textEnd)
    if (overlapStart >= overlapEnd) return []
    return [{
      path: span.path,
      start: span.start + overlapStart - span.textStart,
      end: span.start + overlapEnd - span.textStart,
      unit: 'unicode-code-point' as const,
    }]
  })
}

const leafElements = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-feedback-leaf]'))
const elementTextOffset = (element: HTMLElement, node: Node, offset: number) => {
  const range = document.createRange()
  range.setStart(element, 0)
  range.setEnd(node, offset)
  return utf16ToCodePoint(element.textContent ?? '', range.toString().length)
}

export function captureFeedbackAnchor(root: HTMLElement, documentInfo: FeedbackDocument, route: string, locale: 'ko' | 'en', selection = window.getSelection()): FeedbackAnchor | null {
  if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null
  const elements = leafElements(root)
  const startIndex = elements.findIndex((element) => element.contains(range.startContainer))
  const endIndex = elements.findIndex((element) => element.contains(range.endContainer))
  if (startIndex < 0 || endIndex < 0) return null
  const first = Math.min(startIndex, endIndex)
  const last = Math.max(startIndex, endIndex)
  const byId = new Map(documentInfo.selectableLeaves.map((leaf) => [leaf.leafId, leaf]))
  const parts: SelectionPart[] = []
  for (let index = first; index <= last; index += 1) {
    const element = elements[index]
    const leaf = byId.get(element.dataset.feedbackLeaf ?? '')
    if (!leaf) return null
    let start = 0
    let end = codePoints(leaf.text).length
    if (index === startIndex) start = elementTextOffset(element, range.startContainer, range.startOffset)
    if (index === endIndex) end = elementTextOffset(element, range.endContainer, range.endOffset)
    if (startIndex > endIndex) [start, end] = [end, start]
    if (start === end) continue
    const text = codePoints(leaf.text)
    parts.push({
      blockAnchor: leaf.blockAnchor,
      blockKind: leaf.blockKind,
      leafId: leaf.leafId,
      exactQuote: text.slice(start, end).join(''),
      prefix: text.slice(Math.max(0, start - CONTEXT_LENGTH), start).join(''),
      suffix: text.slice(end, end + CONTEXT_LENGTH).join(''),
      range: { start, end, unit: 'unicode-code-point' },
      sourceSpans: clipSourceSpans(leaf, start, end),
    })
  }
  if (!parts.length) return null
  return { schemaVersion: 'feedback-anchor.v1', documentId: documentInfo.documentId, route, locale, sourceRevision: documentInfo.sourceRevision, selections: parts }
}

const sortValue = (value: unknown): unknown => Array.isArray(value) ? value.map(sortValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, sortValue((value as Record<string, unknown>)[key])])) : value
const personLeaf = (leafId: string, blockAnchor: string, blockKind: string, text: string, path: string): SelectableTextLeaf => ({
  leafId, blockAnchor, blockKind, text,
  sourceSpans: [{ path, start: 0, end: codePoints(text).length, unit: 'unicode-code-point', textStart: 0, textEnd: codePoints(text).length }],
})
const sectionLeaves = (label: string, markdown: string): SelectableTextLeaf[] => {
  const lines = markdown.split('\n')
  const leaves: SelectableTextLeaf[] = []
  let paragraph: string[] = []
  let part = 0
  const flush = () => { if (paragraph.length) { const text = paragraph.join('\n'); leaves.push(personLeaf(`section:${label}:paragraph:${part++}`, `section:${label}`, 'person-section-paragraph', text, `/sections/${label}`)); paragraph = [] } }
  lines.forEach((line) => {
    const item = line.match(/^[-*+]\s+(.+)$/u)
    if (item) { flush(); leaves.push(personLeaf(`section:${label}:list:${part++}`, `section:${label}`, 'person-section-list-item', item[1], `/sections/${label}`)); return }
    if (!line) { flush(); return }
    paragraph.push(line)
  })
  flush()
  return leaves
}
export async function personFeedbackDocument(detail: { id: string; sections: Record<string, string>; biography: string }): Promise<FeedbackDocument> {
  const canonical = `${JSON.stringify(sortValue(detail), null, 2)}\n`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  const sourceRevision = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const section = Object.entries(detail.sections).flatMap(([label, text]) => sectionLeaves(label, text))
  const biography = detail.biography.split(/\n{2,}/u).filter(Boolean).map((text, index) => personLeaf(`biography:paragraph:${index}`, 'biography', 'person-biography', text.replace(/\*\*/gu, ''), '/biography'))
  return { documentId: `PERSON:${detail.id}`, sourceRevision, selectableLeaves: [...section, ...biography] }
}
