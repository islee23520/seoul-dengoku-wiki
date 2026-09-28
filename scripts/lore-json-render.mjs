// Render a lore authoring JSON document (lore/**/<Page>.json) back to Markdown for one locale.
// The wiki pipeline (mount.mjs -> wiki-source/world -> React wiki) consumes rendered Markdown, so JSON pages
// enter it through this renderer instead of hand-kept .md files.
import { posix } from 'node:path'

const headingId = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')

const leafRuns = (leaf) => (typeof leaf === 'string' ? [{ text: leaf }] : leaf)

function linkTarget(run, fromDir, targetFile) {
  if (run.href) return run.href
  const { domain, slug, anchor } = run.link
  if (domain === 'gdd') {
    const [section, name] = slug.split('/')
    // GDD pages are published by GDD/viewer under /gdd/<category>/<slug>.
    const route = ['rules', 'references', 'architecture', 'art'].includes(section) ? `/gdd/${section}/${name}`
      : !name ? `/gdd/design/${section}` : null
    return `${route ?? `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/locales/ko-KR/${section}/${name.toLowerCase()}.json`}${anchor ? `#${anchor}` : ''}`
  }
  const path = posix.relative(fromDir, targetFile(domain, slug))
  return `${path}${anchor ? `#${anchor}` : ''}`
}

function renderLeaf(leaf, context, { cell = false } = {}) {
  return leafRuns(leaf).map((run) => {
    let text = cell ? run.text.replace(/\|/g, '\\|') : run.text
    if (run.strong) text = `**${text}**`
    return run.link || run.href ? `[${text}](${linkTarget(run, context.fromDir, context.targetFile)})` : text
  }).join('')
}

function renderNode(node, locale, context) {
  switch (node.kind) {
    case 'heading': {
      const heading = `${'#'.repeat(node.depth)} ${renderLeaf(node.text[locale], context)}`
      const legacy = /-xt0[1-5]-/u.test(node.anchor ?? '') ? [node.anchor] : []
      const aliases = [...legacy, ...(node.publicAnchors ?? [])]
      const natural = headingId(leafRuns(node.text[locale]).map((run) => run.text).join(''))
      const markup = aliases.filter((alias) => alias !== natural && !context.ids.has(alias)).map((alias) => {
        if (!/^[\p{L}\p{N}_-]+$/u.test(alias)) throw new Error(`${node.anchor}: unsafe public anchor ${alias}`)
        context.ids.add(alias)
        return `<a id="${alias}"></a>`
      })
      return markup.length ? `${markup.join('\n')}\n\n${heading}` : heading
    }
    case 'paragraph':
      return renderLeaf(node.text[locale], context)
    case 'quote':
      return renderLeaf(node.text[locale], context).split('\n').map((line) => `> ${line}`).join('\n')
    case 'rule':
      return '---'
    case 'list': {
      const start = node.start ?? 1
      return node.items.map((item, index) => `${node.ordered ? `${start + index}.` : '-'} ${renderLeaf(item[locale], context)}`).join('\n')
    }
    case 'table': {
      const row = (cells) => `| ${cells.map((cell) => renderLeaf(cell[locale], context, { cell: true })).join(' | ')} |`
      return [row(node.columns), `|${node.columns.map(() => '---').join('|')}|`, ...node.rows.map(row)].join('\n')
    }
    case 'code':
      return `\`\`\`${node.language}${node.info ? ` ${node.info}` : ''}\n${node.text[locale]}\n\`\`\``
    default:
      throw new Error(`${node.anchor}: unsupported node kind ${node.kind}`)
  }
}

// targetFile(domain, slug) returns the repository path a lore link points at, e.g. 'lore/culture/Martial-Paths.md'.
export function renderLoreMarkdown(document, locale, targetFile = (domain, slug) => `lore/${domain === 'root' ? '' : `${domain}/`}${slug}.md`) {
  const fromDir = document.domain === 'root' ? 'lore' : `lore/${document.domain}`
  const aliases = new Set()
  for (const node of document.content) for (const alias of node.publicAnchors ?? []) {
    if (aliases.has(alias)) throw new Error(`${node.anchor}: duplicate public anchor ${alias}`)
    aliases.add(alias)
  }
  const ids = new Set(document.content.filter((node) => node.kind === 'heading')
    .map((node) => headingId(leafRuns(node.text[locale]).map((run) => run.text).join(''))))
  const context = { fromDir, targetFile, ids }
  return `${document.content.map((node) => renderNode(node, locale, context)).join('\n\n')}\n`
}
