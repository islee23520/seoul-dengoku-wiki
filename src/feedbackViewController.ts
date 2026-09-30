import { fetchFeedbackDocument, type FeedbackViewState } from './feedbackViewApi'

export type FeedbackViewController = {
  load: (route: string, locale: 'ko' | 'en') => Promise<void>
  dispose: () => void
}

export function createFeedbackViewController(onState: (state: FeedbackViewState | { status: 'loading' | 'error' }) => void, fetcher: typeof fetch = fetch): FeedbackViewController {
  let request = 0
  let controller: AbortController | null = null
  return {
    async load(route, locale) {
      const id = ++request
      controller?.abort()
      controller = new AbortController()
      onState({ status: 'loading' })
      try {
        const next = await fetchFeedbackDocument(route, locale, { signal: controller.signal, fetcher })
        if (request === id) onState(next)
      } catch (error) {
        if (controller.signal.aborted || request !== id) return
        console.error(error instanceof Error ? error.message : error)
        onState({ status: 'error' })
      }
    },
    dispose() { request += 1; controller?.abort(); controller = null },
  }
}
