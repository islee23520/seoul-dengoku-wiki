import type { FeedbackDocument, SelectableTextLeaf, SourceSegment } from './feedbackSelection'

export type FeedbackViewState = { status: 'ready'; document: FeedbackDocument } | { status: 'unavailable'; code: string }

const string = (value: unknown): value is string => typeof value === 'string'
const integer = (value: unknown): value is number => Number.isInteger(value)
const hex = (value: unknown) => string(value) && /^[a-f0-9]{64}$/u.test(value)
const publicSpan = (value: any) => value && string(value.path) && value.path.startsWith('/') && integer(value.start) && integer(value.end) && value.start >= 0 && value.end > value.start && value.unit === 'unicode-code-point'
const segment = (value: any): value is SourceSegment => publicSpan(value) && integer(value.textStart) && integer(value.textEnd) && value.textStart >= 0 && value.textEnd > value.textStart && (value.kind === 'literal' ? value.end - value.start === value.textEnd - value.textStart : value.kind === 'entity' && value.textEnd - value.textStart === 1 && string(value.visibleText) && Array.from(value.visibleText).length === 1)
const leaf = (value: any): value is SelectableTextLeaf => value && string(value.leafId) && value.leafId && string(value.blockAnchor) && value.blockAnchor && string(value.blockKind) && value.blockKind && string(value.text) && value.text && Array.isArray(value.sourceSegments) && value.sourceSegments.length > 0 && value.sourceSegments.every(segment)

export function validateFeedbackDocument(value: unknown, route: string, locale: 'ko' | 'en'): FeedbackDocument {
  if (!value || typeof value !== 'object') throw new Error('invalid selectable view')
  const view = value as FeedbackDocument
  if (view.schemaVersion !== 'feedback-selectable-view.v1' || view.mappingVersion !== 'selectable-text-catalog.v2' || view.route !== route || view.locale !== locale || !string(view.documentId) || !hex(view.sourceRevision) || view.revisionAlgorithm !== 'sha256-canonical-json.v1' || !hex(view.viewRevision) || !string(view.selector) || !Array.isArray(view.leaves) || !view.leaves.every(leaf) || new Set(view.leaves.map((item) => item.leafId)).size !== view.leaves.length) throw new Error('invalid selectable view')
  for (const item of view.leaves) {
    let cursor = 0
    const sourceEnds = new Map<string, number>()
    for (const value of item.sourceSegments) {
      if (value.textStart !== cursor || value.textEnd > Array.from(item.text).length) throw new Error('invalid selectable view')
      const previous = sourceEnds.get(value.path)
      if (previous !== undefined && value.start < previous) throw new Error('invalid selectable view')
      sourceEnds.set(value.path, value.end)
      cursor = value.textEnd
    }
    if (cursor !== Array.from(item.text).length) throw new Error('invalid selectable view')
  }
  return view
}

export async function fetchFeedbackDocument(route: string, locale: 'ko' | 'en', options: { signal?: AbortSignal; fetcher?: typeof fetch } = {}): Promise<FeedbackViewState> {
  const fetcher = options.fetcher ?? fetch
  const query = new URLSearchParams({ route, locale })
  const response = await fetcher(`/api/feedback/selectable-view?${query}`, { method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' }, signal: options.signal })
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const body = contentType.startsWith('application/json') ? await response.json().catch(() => null) : null
  if ([403, 404, 422].includes(response.status)) return { status: 'unavailable', code: body?.error?.code ?? 'selectable-view-unavailable' }
  if (!response.ok) throw new Error(body?.error?.message ?? '선택 가능한 원문 정보를 불러오지 못했습니다.')
  return { status: 'ready', document: validateFeedbackDocument(body, route, locale) }
}
