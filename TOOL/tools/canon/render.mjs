import { CanonError } from './errors.mjs'

export const row = (cells) => `| ${cells.join(' | ')} |`

export function renderTableRows(header, rows) {
  return [row(header), `|${header.map(() => '---').join('|')}|`, ...rows.map(row)].join('\n')
}

function renderInline(inline, resolveDocHref) {
  switch (inline.kind) {
    case 'text':
      return inline.text
    case 'link':
      return `[${inline.text}](${inline.href})`
    case 'docLink':
      return `[${inline.text}](${resolveDocHref(inline.targetDocumentId)})`
    default:
      throw new CanonError('E_UNSUPPORTED_INLINE', inline.kind)
  }
}

// `renderTable(block)` is the only domain-specific part; every other block kind is shared.
export function renderDocument({ document, blocks }, renderTable, resolveDocHref) {
  const blocksById = new Map(blocks.map((block) => [block.id, block]))
  const renderBlock = (block) => {
    switch (block.kind) {
      case 'heading':
        return `${'#'.repeat(block.level)} ${block.inlines.map((inline) => renderInline(inline, resolveDocHref)).join('')}`
      case 'paragraph':
        return block.inlines.map((inline) => renderInline(inline, resolveDocHref)).join('')
      case 'table':
        return renderTable(block)
      default:
        throw new CanonError('E_UNSUPPORTED_BLOCK', `${block.id}: ${block.kind}`)
    }
  }
  return `${document.blockIds.map((id) => renderBlock(blocksById.get(id))).join('\n\n')}\n`
}
