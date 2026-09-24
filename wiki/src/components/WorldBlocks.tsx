import { createElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { normalizeWikiHref, toWikiPath } from '../wikiRouting'

export type WorldBlock = {
  type: string
  value?: string
  url?: string
  depth?: number
  ordered?: boolean
  start?: number
  lang?: string
  children?: WorldBlock[]
}

const headingId = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
export const plainText = (node: WorldBlock): string => node.value ?? (node.children ?? []).map(plainText).join('')

export function WorldBlocks({ blocks }: { blocks: WorldBlock[] }) {
  const datedYears = new Set<string>()
  const render = (node: WorldBlock, key: number): ReactNode => {
    const children = node.children?.map((child, index) => render(child, index))
    switch (node.type) {
      case 'text': return node.value
      case 'heading': {
        const depth = Math.max(1, Math.min(node.depth ?? 2, 6))
        return createElement(`h${depth}`, { key, id: headingId(plainText(node)) }, children)
      }
      case 'paragraph': {
        const year = plainText(node).match(/(?:^|\s)((?:20|21)\d{2})년/u)?.[1]
        const id = year && !datedYears.has(year) ? `${year}년` : undefined
        if (year && id) datedYears.add(year)
        return <p key={key} id={id}>{children}</p>
      }
      case 'strong': return <strong key={key}>{children}</strong>
      case 'emphasis': return <em key={key}>{children}</em>
      case 'delete': return <del key={key}>{children}</del>
      case 'inlineCode': return <code key={key}>{node.value}</code>
      case 'code': return <pre key={key}><code>{node.value}</code></pre>
      case 'break': return <br key={key} />
      case 'thematicBreak': return <hr key={key} />
      case 'blockquote': return <blockquote key={key}>{children}</blockquote>
      case 'list': return node.ordered ? <ol key={key} start={node.start}>{children}</ol> : <ul key={key}>{children}</ul>
      case 'listItem': return <li key={key}>{children}</li>
      case 'table': return <div className="wiki-table-wrap" key={key}><table><tbody>{children}</tbody></table></div>
      case 'tableRow': return <tr key={key}>{children}</tr>
      case 'tableCell': return <td key={key}>{children}</td>
      case 'link': {
        const href = normalizeWikiHref(node.url)
        return href.startsWith('/world/') ? <Link key={key} to={href}>{children}</Link>
          : <a key={key} href={href.startsWith('/') ? toWikiPath(href) : href} rel={href.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>
      }
      case 'image': return <img key={key} src={node.url} alt={node.value ?? ''} />
      case 'html': {
        const anchor = node.value?.match(/^<a id="([^"<>]+)">$/)
        return anchor ? <span key={key} id={anchor[1]} /> : null
      }
      default: throw new Error(`E_WORLD_BLOCK:${node.type}`)
    }
  }
  return <>{blocks.map(render)}</>
}

export { headingId }
