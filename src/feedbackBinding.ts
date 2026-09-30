import type { SelectableTextLeaf } from './feedbackSelection'

export type FeedbackBinding = readonly [HTMLElement, string]

const directText = (element: HTMLElement) => Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent ?? '').join('')
const parentCandidate = (element: HTMLElement, candidates: Set<HTMLElement>) => {
  let parent = element.parentElement
  while (parent) {
    if (candidates.has(parent)) return parent
    parent = parent.parentElement
  }
  return null
}

export function bindFeedbackLeaves(root: HTMLElement, selector: string, leaves: SelectableTextLeaf[]): FeedbackBinding[] | null {
  const all = Array.from(root.querySelectorAll<HTMLElement>(selector))
  const set = new Set(all)
  // Shared Markdown rendering may expose both a loose-list LI and its child P.
  // Keep the structural occurrence node; nested candidates are not separate leaves.
  const elements = all.filter((element) => !parentCandidate(element, set))
  if (elements.length !== leaves.length) return null
  const bindings: Array<[HTMLElement, string]> = []
  for (let index = 0; index < leaves.length; index += 1) {
    const element = elements[index]
    const text = element.textContent ?? ''
    if (text !== leaves[index].text) return null
    if (element.tagName === 'LI' && directText(element) && text !== directText(element)) return null
    bindings.push([element, leaves[index].leafId])
  }
  return bindings
}
