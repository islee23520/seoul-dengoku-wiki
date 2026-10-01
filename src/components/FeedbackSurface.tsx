import { useLayoutEffect, type PropsWithChildren, type RefObject } from 'react'
import { bindFeedbackLeaves } from '../feedbackBinding'
import type { FeedbackDocument } from '../feedbackSelection'

export function FeedbackSurface({ rootRef, documentInfo, onBound, children }: PropsWithChildren<{ rootRef: RefObject<HTMLDivElement>; documentInfo: FeedbackDocument; onBound?: (bound: boolean) => void }>) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) { onBound?.(false); return }
    root.querySelectorAll<HTMLElement>('[data-feedback-leaf]').forEach((element) => { delete element.dataset.feedbackLeaf })
    const bindings = bindFeedbackLeaves(root, documentInfo.selector, documentInfo.leaves)
    if (!bindings) { onBound?.(false); return }
    bindings.forEach(([element, leafId]) => { element.dataset.feedbackLeaf = leafId })
    onBound?.(true)
    return () => { bindings.forEach(([element]) => { delete element.dataset.feedbackLeaf }); onBound?.(false) }
  }, [documentInfo, onBound, rootRef])
  return <div ref={rootRef}>{children}</div>
}
