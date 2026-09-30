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
const personLeaf = (leafId: string, blockAnchor: string, blockKind: string, text: string, path: string, sourceSpans: SourceSpan[]): SelectableTextLeaf => ({ leafId, blockAnchor, blockKind, text, sourceSpans })
const markdownProjection = (source: string, path: string, sourceStart: number) => {
  const points = codePoints(source)
  let text = ''
  const sourceSpans: SourceSpan[] = []
  let sourceIndex = 0
  let textIndex = 0
  const append = (start: number, end: number) => {
    if (end <= start) return
    const run = points.slice(start, end).join('')
    const runStart = textIndex
    text += run
    textIndex += end - start
    sourceSpans.push({ path, start: sourceStart + start, end: sourceStart + end, unit: 'unicode-code-point', textStart: runStart, textEnd: textIndex })
  }
  const project = (start: number, end: number) => {
    let cursor = start
    let plainStart = cursor
    while (cursor < end) {
      if (points[cursor] === '*' && points[cursor + 1] === '*') {
        append(plainStart, cursor)
        cursor += 2
        plainStart = cursor
        continue
      }
      if (points[cursor] === '[') {
        let labelEnd = cursor + 1
        while (labelEnd < end && points[labelEnd] !== ']') labelEnd += 1
        if (labelEnd < end && points[labelEnd + 1] === '(') {
          let targetEnd = labelEnd + 2
          while (targetEnd < end && points[targetEnd] !== ')') targetEnd += 1
          if (targetEnd < end) {
            append(plainStart, cursor)
            project(cursor + 1, labelEnd)
            cursor = targetEnd + 1
            plainStart = cursor
            continue
          }
        }
      }
      cursor += 1
    }
    append(plainStart, end)
  }
  project(0, points.length)
  return { text, sourceSpans }
}
const markdownLeaves = (prefix: string, blockAnchor: string, blockKind: string, markdown: string, path: string): SelectableTextLeaf[] => {
  const points = codePoints(markdown)
  const leaves: SelectableTextLeaf[] = []
  let cursor = 0
  let part = 0
  while (cursor < points.length) {
    while (points[cursor] === '\n') cursor += 1
    if (cursor >= points.length) break
    const blockStart = cursor
    let blockEnd = cursor
    while (blockEnd < points.length && !(points[blockEnd] === '\n' && points[blockEnd + 1] === '\n')) blockEnd += 1
    const block = points.slice(blockStart, blockEnd).join('')
    let lineStart = 0
    const lines = block.split('\n')
    const isList = lines.every((line) => /^[-*+]\s+/u.test(line))
    if (isList) {
      for (const line of lines) {
        const marker = line.match(/^[-*+]\s+/u)?.[0] ?? ''
        const projected = markdownProjection(line.slice(marker.length), path, blockStart + lineStart + codePoints(marker).length)
        leaves.push(personLeaf(`${prefix}:list:${part++}`, blockAnchor, `${blockKind}-list-item`, projected.text, path, projected.sourceSpans))
        lineStart += codePoints(line).length + 1
      }
    } else {
      const projected = markdownProjection(block, path, blockStart)
      leaves.push(personLeaf(`${prefix}:paragraph:${part++}`, blockAnchor, `${blockKind}-paragraph`, projected.text, path, projected.sourceSpans))
    }
    cursor = blockEnd + 2
  }
  return leaves
}
export async function personFeedbackDocument(detail: { id: string; sections: Record<string, string>; biography: string }): Promise<FeedbackDocument> {
  const canonical = `${JSON.stringify(sortValue(detail), null, 2)}\n`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  const sourceRevision = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const section = Object.entries(detail.sections).flatMap(([label, text]) => markdownLeaves(`section:${label}`, `section:${label}`, 'person-section', text, `/sections/${label}`))
  const biography = markdownLeaves('biography', 'biography', 'person-biography', detail.biography, '/biography')
  return { documentId: `PERSON:${detail.id}`, sourceRevision, selectableLeaves: [...section, ...biography] }
}
