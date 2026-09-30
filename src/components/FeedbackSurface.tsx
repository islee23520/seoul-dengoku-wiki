import { useLayoutEffect, type PropsWithChildren, type RefObject } from 'react'
import type { FeedbackDocument } from '../feedbackSelection'

export function FeedbackSurface({ rootRef, documentInfo, onBound, children }: PropsWithChildren<{ rootRef: RefObject<HTMLDivElement>; documentInfo: FeedbackDocument; onBound?: (bound: boolean) => void }>) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) { onBound?.(false); return }
    const elements = Array.from(root.querySelectorAll<HTMLElement>(documentInfo.selector))
    elements.forEach((element) => { delete element.dataset.feedbackLeaf })
    let cursor = 0
    const bindings: Array<[HTMLElement, string]> = []
    for (const leaf of documentInfo.leaves) {
      const index = elements.findIndex((element, candidate) => candidate >= cursor && element.textContent === leaf.text)
      if (index < 0) { onBound?.(false); return }
      bindings.push([elements[index], leaf.leafId])
      cursor = index + 1
    }
    bindings.forEach(([element, leafId]) => { element.dataset.feedbackLeaf = leafId })
    onBound?.(true)
    return () => { bindings.forEach(([element]) => { delete element.dataset.feedbackLeaf }); onBound?.(false) }
  }, [documentInfo, onBound, rootRef])
  return <div ref={rootRef}>{children}</div>
}
