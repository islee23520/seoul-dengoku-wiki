import type { WikiBlock } from '@seoul-dengoku/document-renderer'

type WikiLocale = 'ko' | 'en'
export type WikiApiDocument = { title: string; route: string; blocks: WikiBlock[]; reviewText: string }
export type DocumentState = { slug: string; locale: WikiLocale } & (
  { status: 'ready'; document: WikiApiDocument } | { status: 'loading' | 'not-found' | 'error' }
)

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const block = (value: unknown): value is WikiBlock => {
  if (!record(value) || typeof value.type !== 'string' || !value.type) return false
  for (const key of ['value', 'url', 'alt']) if (value[key] !== undefined && typeof value[key] !== 'string') return false
  if (value.depth !== undefined && !Number.isInteger(value.depth)) return false
  if (value.start !== undefined && value.start !== null && !Number.isInteger(value.start)) return false
  if (value.ordered !== undefined && typeof value.ordered !== 'boolean') return false
  if (value.checked !== undefined && value.checked !== null && typeof value.checked !== 'boolean') return false
  for (const key of ['lang', 'meta']) if (value[key] !== undefined && value[key] !== null && typeof value[key] !== 'string') return false
  if (value.align !== undefined && (!Array.isArray(value.align) || !value.align.every((item) => item === null || typeof item === 'string'))) return false
  return value.children === undefined || (Array.isArray(value.children) && value.children.every(block))
}

export async function fetchWikiDocument(slug: string, locale: WikiLocale, options: { signal?: AbortSignal; fetcher?: typeof fetch } = {}): Promise<WikiApiDocument | null> {
  if (!/^[\p{L}\p{N}_-]+$/u.test(slug) || !['ko', 'en'].includes(locale)) throw new Error('Invalid document selector')
  const response = await (options.fetcher ?? fetch)(`/wiki/api/documents/world/${encodeURIComponent(slug)}?locale=${locale}`, {
    method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' }, signal: options.signal,
  })
  if (!/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('Invalid document content type')
  const body: unknown = await response.json()
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Document request failed (${response.status})`)
  const route = `${locale === 'en' ? '/en' : ''}/world/${slug === 'index' ? '' : slug}`
  if (!record(body) || typeof body.title !== 'string' || !body.title.trim() || body.route !== route
    || typeof body.reviewText !== 'string' || !Array.isArray(body.blocks) || !body.blocks.every(block)) throw new Error('Invalid document response')
  return body as WikiApiDocument
}

export function createDocumentController(onState: (state: DocumentState) => void, fetcher: typeof fetch = fetch) {
  let request = 0
  let controller: AbortController | null = null
  return {
    async load(slug: string, locale: WikiLocale) {
      const id = ++request
      controller?.abort()
      const owned = new AbortController()
      controller = owned
      onState({ slug, locale, status: 'loading' })
      try {
        const document = await fetchWikiDocument(slug, locale, { signal: owned.signal, fetcher })
        if (request !== id || owned.signal.aborted) return
        onState(document ? { slug, locale, status: 'ready', document } : { slug, locale, status: 'not-found' })
      } catch {
        if (request === id && !owned.signal.aborted) onState({ slug, locale, status: 'error' })
      }
    },
    dispose() { request += 1; controller?.abort(); controller = null },
  }
}
