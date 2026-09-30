import { useEffect, useRef, useState } from 'react'
import { createFeedbackViewController } from '../feedbackViewController'
import type { FeedbackViewState } from '../feedbackViewApi'

export function useFeedbackDocument(route: string, locale: 'ko' | 'en') {
  const [state, setState] = useState<FeedbackViewState | { status: 'loading' | 'error' }>({ status: 'loading' })
  const controller = useRef<ReturnType<typeof createFeedbackViewController> | null>(null)
  if (!controller.current) controller.current = createFeedbackViewController(setState)
  useEffect(() => {
    const current = controller.current!
    void current.load(route, locale)
    return () => current.dispose()
  }, [route, locale])
  return state
}
