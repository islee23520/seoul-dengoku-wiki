import { CanonError } from './errors.mjs'

export const row = (cells) => `| ${cells.join(' | ')} |`

export function renderTableRows(header, rows, dividers = header.map(() => '---')) {
  return [row(header), `|${dividers.join('|')}|`, ...rows.map(row)].join('\n')
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

function renderList(block, resolveDocHref) {
  return block.items
    .map((item, index) => {
      const inlines = Array.isArray(item) ? item : item.inlines
      const parent = `${block.ordered ? `${index + 1}. ` : '- '}${inlines.map((inline) => renderInline(inline, resolveDocHref)).join('')}`
      if (Array.isArray(item)) return parent
      if (item.continuation) return [parent, ...item.continuation].join('\n')
      const { ordered, indent, items } = item.children
      return [parent, ...items.map((child, childIndex) => `${' '.repeat(indent)}${ordered ? `${childIndex + 1}. ` : '- '}${child.map((inline) => renderInline(inline, resolveDocHref)).join('')}`)].join('\n')
    })
    .join('\n')
}

// `renderTable(block)` is the only domain-specific part; every other block kind is shared.
export function renderDocument({ document, blocks }, renderTable, resolveDocHref) {
  const blocksById = new Map(blocks.map((block) => [block.id, block]))
  const renderBlock = (block) => {
    switch (block.kind) {
      case 'heading':
        return `${'#'.repeat(block.level)} ${block.inlines.map((inline) => renderInline(inline, resolveDocHref)).join('')}`
      case 'paragraph':
        return (block.lines ?? [block.inlines]).map((line) => line.map((inline) => renderInline(inline, resolveDocHref)).join('')).join('\n')
      case 'list':
        return renderList(block, resolveDocHref)
      case 'blockQuote':
        return block.lines.map((inlines) => inlines.length ? `> ${inlines.map((inline) => renderInline(inline, resolveDocHref)).join('')}` : '>').join('\n')
      case 'thematicBreak':
        return block.marker
      case 'linkReferenceDefinition':
        return `[${block.label}]: ${block.href}`
      case 'table':
        return block.rawRows
          ? [block.rawHeader ? `|${block.rawHeader.join('|')}|` : row(block.header), `|${block.dividers.join('|')}|`, ...block.rawRows.map((cells) => `|${cells.join('|')}|`)].join('\n')
          : block.dividers ? renderTableRows(block.header, block.rows, block.dividers) : renderTable(block)
      case 'codeFence':
        return `${block.fence}${block.info}\n${block.text}${block.text && !block.text.endsWith('\n') ? '\n' : ''}${block.fence}`
      default:
        throw new CanonError('E_UNSUPPORTED_BLOCK', `${block.id}: ${block.kind}`)
    }
  }
  return `${document.blockIds.map((id, index) => `${index ? '\n'.repeat((blocksById.get(id).blankLinesBefore ?? 1) + 1) : ''}${renderBlock(blocksById.get(id))}`).join('')}${'\n'.repeat(document.terminalLineFeeds ?? 1)}`
}
