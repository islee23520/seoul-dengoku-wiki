import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { listDocuments } from './cast-sqlite/document-read.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lore = resolve(repo, 'lore')
const parse = (text) => fromMarkdown(text, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit) }
const plain = (node) => node.value ?? (node.children ?? []).map(plain).join('')
const slug = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
const currentDocuments = new Set()
const typedTargets = new Map()
const exists = async path => {
  path = resolve(path)
  if (currentDocuments.has(path) || typedTargets.has(path)) return true
  if (path.startsWith(lore + '/') && path.endsWith('.json')) {
    try {
      typedTargets.set(path, readCanonicalDocument(relative(repo, path)))
      return true
    } catch (error) {
      if (!/^E_CANONICAL_DOCUMENT_IDENTITY:|^E_SCOPE_DB_SOURCE_UNSUPPORTED/u.test(error.message)) throw error
    }
  }
  try { return (await stat(path)).isFile() } catch { return false }
}
const files = []
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await collect(path)
    else if (entry.isFile() && /\.(md|json)$/.test(entry.name)) files.push(path)
  }
}
const generated = resolve(repo, 'src/generated/world')
const headingCache = new Map()
const privatePages = new Set(['Cast-Profile-Contract', 'Cast-Registration-Template', 'Random-Cast-Roster'])
async function anchors(path) {
  if (headingCache.has(path)) return headingCache.get(path)
  const text = extname(path) === '.json'
    ? renderLoreMarkdown(typedTargets.get(resolve(path)) ?? (currentDocuments.has(resolve(path)) ? readCanonicalDocument(relative(repo, path)) : JSON.parse(await readFile(path, 'utf8'))), 'ko')
    : await readFile(path, 'utf8')
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
  headingCache.clear()
  currentDocuments.clear()
  typedTargets.clear()
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(repo, 'data/canonical/wiki-cast.sqlite'))
  try {
    for (const corpusKind of ['current', 'example']) for (const identity of listDocuments(db, { corpusKind, visibility: 'internal' }))
      currentDocuments.add(resolve(repo, identity.logical_path))
  } finally { db.close() }
  await collect(lore)
  for (const path of currentDocuments) if (!files.includes(path)) files.push(path)
  const failures = []
  async function targetFor(path) {
    if (extname(path) === '.md') {
      const json = path.slice(0, -3) + '.json'
      if (await exists(json)) {
        const value = typedTargets.get(resolve(json)) ?? (currentDocuments.has(resolve(json)) ? readCanonicalDocument(relative(repo, json)) : JSON.parse(await readFile(json, 'utf8')))
        if (Array.isArray(value.content) && value.domain) return json
      }
    }
    return path
  }
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
    const target = await targetFor(path ? resolve(dirname(source), path) : source)
    if (extname(source) === '.json' && privatePages.has(basename(target, extname(target)))) { failures.push(`${source}: private ${href}`); return }
    if (!(await exists(target))) { failures.push(`${source}: missing ${href}`); return }
    if (hash && ['.md', '.json'].includes(extname(target)) && !(await anchors(target)).has(hash)) failures.push(`${source}: missing anchor ${href}`)
  }
  for (const file of files) {
    if (file.endsWith('.md')) {
      const links = []
      walk(parse(await readFile(file, 'utf8')), (node) => { if (node.type === 'link' || node.type === 'image') links.push(node.url) })
      for (const href of links) await check(href, file)
    } else {
      const json = currentDocuments.has(resolve(file)) ? readCanonicalDocument(relative(repo, file)) : JSON.parse(await readFile(file, 'utf8'))
      const references = []
      function scan(value) {
        if (Array.isArray(value)) { value.forEach(scan); return }
        if (!value || typeof value !== 'object') return
        if (value.link?.domain && value.link?.slug && value.link.domain !== 'gdd') {
          const { domain, slug: name, anchor } = value.link
          references.push({ href: relative(dirname(file), resolve(lore, domain === 'root' ? '' : domain, `${name}.md`)) + (anchor ? `#${anchor}` : ''), source: file })
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
        if (href.startsWith(repo)) { if (!(await exists(await targetFor(href)))) failures.push(`${source}: missing ${href}`) }
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
