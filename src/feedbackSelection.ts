export type PublicSourceSpan = { path: string; start: number; end: number; unit: 'unicode-code-point' }
export type LiteralSourceSegment = PublicSourceSpan & { kind: 'literal'; textStart: number; textEnd: number }
export type EntitySourceSegment = PublicSourceSpan & { kind: 'entity'; textStart: number; textEnd: number; visibleText: string }
export type SourceSegment = LiteralSourceSegment | EntitySourceSegment
export type SelectableTextLeaf = { leafId: string; blockAnchor: string; blockKind: string; text: string; sourceSegments: SourceSegment[] }
export type FeedbackDocument = {
  schemaVersion: 'feedback-selectable-view.v1'
  mappingVersion: 'selectable-text-catalog.v2'
  documentId: string
  route: string
  locale: 'ko' | 'en'
  sourceRevision: string
  revisionAlgorithm: 'sha256-canonical-json.v1'
  selector: string
  viewRevision: string
  leaves: SelectableTextLeaf[]
}
export type SelectionPart = {
  blockAnchor: string
  blockKind: string
  leafId: string
  exactQuote: string
  prefix: string
  suffix: string
  range: { start: number; end: number; unit: 'unicode-code-point' }
  sourceSpans: PublicSourceSpan[]
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

export function clipSourceSegments(leaf: SelectableTextLeaf, start: number, end: number): PublicSourceSpan[] {
  return leaf.sourceSegments.flatMap((segment) => {
    const overlapStart = Math.max(start, segment.textStart)
    const overlapEnd = Math.min(end, segment.textEnd)
    if (overlapStart >= overlapEnd) return []
    if (segment.kind === 'entity') return [{ path: segment.path, start: segment.start, end: segment.end, unit: segment.unit }]
    return [{
      path: segment.path,
      start: segment.start + overlapStart - segment.textStart,
      end: segment.start + overlapEnd - segment.textStart,
      unit: segment.unit,
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
  if (documentInfo.route !== route || documentInfo.locale !== locale || !selection || selection.rangeCount !== 1 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null
  const elements = leafElements(root)
  const startIndex = elements.findIndex((element) => element.contains(range.startContainer))
  const endIndex = elements.findIndex((element) => element.contains(range.endContainer))
  if (startIndex < 0 || endIndex < 0) return null
  const first = Math.min(startIndex, endIndex)
  const last = Math.max(startIndex, endIndex)
  const byId = new Map(documentInfo.leaves.map((leaf) => [leaf.leafId, leaf]))
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
      sourceSpans: clipSourceSegments(leaf, start, end),
    })
  }
  if (!parts.length) return null
  return { schemaVersion: 'feedback-anchor.v1', documentId: documentInfo.documentId, route, locale, sourceRevision: documentInfo.sourceRevision, selections: parts }
}
