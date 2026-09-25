import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const lore = resolve(repo, 'lore')
const parse = (text) => fromMarkdown(text, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit) }
const plain = (node) => node.value ?? (node.children ?? []).map(plain).join('')
const slug = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
const exists = async (path) => { try { return (await stat(path)).isFile() } catch { return false } }
const files = []
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await collect(path)
    else if (entry.isFile() && /\.(md|json)$/.test(entry.name)) files.push(path)
  }
}
const generated = resolve(repo, 'wiki/src/generated/world')
const headingCache = new Map()
async function anchors(path) {
  if (headingCache.has(path)) return headingCache.get(path)
  const text = await readFile(path, 'utf8')
  const ids = new Set()
  walk(parse(text), (node) => {
    if (node.type === 'heading') ids.add(slug(plain(node)))
    if (node.type === 'html') {
      const match = node.value.match(/<a id="([^"<>]+)"/)
      if (match) ids.add(match[1])
    }
    if (node.type === 'paragraph') {
      const year = plain(node).match(/(?:^|\s)((?:20|21)\d{2})년/u)?.[1]
      if (year) ids.add(`${year}년`)
    }
  })
  headingCache.set(path, ids)
  return ids
}

export async function loreLinkFailures() {
  files.length = 0
  await collect(lore)
  const failures = []
  async function check(href, source) {
    if (!href || /^(?:https?:|mailto:|git:|\/gdd\/|\/ui-)/.test(href)) return
    const [rawPath, rawHash] = href.split('#', 2)
    if (rawPath.startsWith('/world/')) {
      const name = basename(rawPath.replace(/\.html$/, ''))
      const target = resolve(generated, `${name}.json`)
      if (!(await exists(target))) { failures.push(`${source}: missing route ${href}`); return }
      if (rawHash) {
        const ids = new Set()
        const document = JSON.parse(await readFile(target, 'utf8'))
        for (const block of document.blocks ?? []) walk(block, (node) => {
          if (node.type === 'heading') ids.add(slug(plain(node)))
          if (node.type === 'html') {
            const match = node.value?.match(/<a id="([^"<>]+)"/)
            if (match) ids.add(match[1])
          }
          if (node.type === 'paragraph') {
            const year = plain(node).match(/(?:^|\s)((?:20|21)\d{2})년/u)?.[1]
            if (year) ids.add(`${year}년`)
          }
        })
        if (!ids.has(decodeURIComponent(rawHash))) failures.push(`${source}: missing route anchor ${href}`)
      }
      return
    }
    if (rawPath.startsWith('/')) return // Other hub routes belong to separate applications.
    let path, hash
    try { path = decodeURIComponent(rawPath); hash = rawHash ? decodeURIComponent(rawHash) : '' }
    catch { failures.push(`${source}: invalid encoding ${href}`); return }
    const target = path ? resolve(dirname(source), path) : source
    if (!(await exists(target))) { failures.push(`${source}: missing ${href}`); return }
    if (hash && extname(target) === '.md' && !(await anchors(target)).has(hash)) failures.push(`${source}: missing anchor ${href}`)
  }
  for (const file of files) {
    if (file.endsWith('.md')) {
      const links = []
      walk(parse(await readFile(file, 'utf8')), (node) => { if (node.type === 'link' || node.type === 'image') links.push(node.url) })
      for (const href of links) await check(href, file)
    } else {
      const json = JSON.parse(await readFile(file, 'utf8'))
      const references = []
      function scan(value) {
        if (Array.isArray(value)) { value.forEach(scan); return }
        if (!value || typeof value !== 'object') return
        if (value.link?.domain && value.link?.slug && value.link.domain !== 'gdd') {
          const { domain, slug: name, anchor } = value.link
          references.push({ href: `${domain === 'root' ? '../' : `../${domain}/`}${name}.md${anchor ? `#${anchor}` : ''}`, source: file })
        }
        if (typeof value.href === 'string') references.push({ href: value.href, source: file })
        for (const [key, child] of Object.entries(value)) {
          if (key === 'link') continue
          if (key === 'canon_refs' && Array.isArray(child)) {
            for (const ref of child) if (typeof ref === 'string' && ref.startsWith('lore/')) references.push({ href: resolve(repo, ref), source: file })
          } else scan(child)
        }
      }
      scan(json)
      for (const { href, source } of references) {
        if (href.startsWith(repo)) { if (!(await exists(href))) failures.push(`${source}: missing ${href}`) }
        else await check(href, source)
      }
    }
  }
  return failures
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = await loreLinkFailures()
  if (failures.length) { console.error(`LORE_LINK_FAIL (${failures.length}):\n${failures.join('\n')}`); process.exitCode = 1 }
  else console.log(`LORE_LINK_PASS: ${files.length} files`)
}
