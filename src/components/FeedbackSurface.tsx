import { useLayoutEffect, type PropsWithChildren, type RefObject } from 'react'
import type { FeedbackDocument } from '../feedbackSelection'

export function FeedbackSurface({ rootRef, documentInfo, selector, children }: PropsWithChildren<{ rootRef: RefObject<HTMLDivElement>; documentInfo: FeedbackDocument; selector?: string }>) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector ?? 'p, h2, h3, h4, h5, h6, blockquote, pre, li, th, td'))
    elements.forEach((element) => { delete element.dataset.feedbackLeaf })
    let cursor = 0
    documentInfo.selectableLeaves.forEach((leaf) => {
      const index = elements.findIndex((element, candidate) => candidate >= cursor && element.textContent === leaf.text)
      if (index < 0) return
      elements[index].dataset.feedbackLeaf = leaf.leafId
      cursor = index + 1
    })
  }, [documentInfo, rootRef, selector])
  return <div ref={rootRef}>{children}</div>
}
