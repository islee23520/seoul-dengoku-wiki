import type { WikiBlock } from '@seoul-dengoku/document-renderer'

export const wikiBlockText = (node: WikiBlock): string => node.value ?? (node.children ?? []).map(wikiBlockText).join('')

export const wikiHeadingId = (text: string): string =>
  text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
