import type { Parent, Root, RootContent, Text } from 'mdast'
import type { VFile } from 'vfile'
import { decodeString } from 'micromark-util-decode-string'

// CommonMark leaves punctuation-ended bold literal before a CJK particle.
// Use source positions so escaped asterisks cannot become delimiters.
export function remarkCjkStrong() {
  return (tree: Root, file: VFile) => {
    const source = String(file)
    function split(node: Text): RootContent[] {
      const start = node.position?.start.offset
      const end = node.position?.end.offset
      if (start === undefined || end === undefined) return [node]
      const raw = source.slice(start, end)
      const children: RootContent[] = []
      let cursor = 0
      for (const match of raw.matchAll(/\*\*([^*\r\n]+)\*\*(?=[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu)) {
        const index = match.index
        const before = raw.slice(0, index)
        const slashes = before.match(/\\+$/)?.[0].length ?? 0
        if (slashes % 2 || raw[index - 1] === '*' || /\\|^\s|\s$/u.test(match[1])) continue
        const offset = decodeString(before).length
        const literal = decodeString(match[0])
        if (node.value.slice(offset, offset + literal.length) !== literal) continue
        if (offset > cursor) children.push({ type: 'text', value: node.value.slice(cursor, offset) })
        children.push({ type: 'strong', children: [{ type: 'text', value: decodeString(match[1]) }] })
        cursor = offset + literal.length
      }
      if (!children.length) return [node]
      if (cursor < node.value.length) children.push({ type: 'text', value: node.value.slice(cursor) })
      return children
    }
    function visit(node: Parent) {
      node.children = node.children.flatMap((child) => {
        if (child.type === 'text') return split(child)
        if ('children' in child) visit(child)
        return [child]
      })
    }
    visit(tree)
  }
}
