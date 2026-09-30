import { useEffect, useRef, useState } from 'react'
import { fetchFeedbackDocument, type FeedbackViewState } from '../feedbackViewApi'

export function useFeedbackDocument(route: string, locale: 'ko' | 'en') {
  const [state, setState] = useState<FeedbackViewState | { status: 'loading' | 'error' }>({ status: 'loading' })
  const request = useRef(0)
  useEffect(() => {
    const id = ++request.current
    const controller = new AbortController()
    setState({ status: 'loading' })
    void fetchFeedbackDocument(route, locale, { signal: controller.signal }).then((next) => {
      if (request.current === id) setState(next)
    }).catch((error: unknown) => {
      if (controller.signal.aborted || request.current !== id) return
      console.error(error instanceof Error ? error.message : error)
      setState({ status: 'error' })
    })
    return () => { controller.abort(); if (request.current === id) request.current += 1 }
  }, [route, locale])
  return state
}
