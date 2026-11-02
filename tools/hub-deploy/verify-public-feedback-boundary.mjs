import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
const privateDocument = (value) => value && typeof value === 'object' && !Array.isArray(value)
  && typeof value.documentId === 'string' && typeof value.currentRevision === 'string'
  && value.revisions && typeof value.revisions === 'object'
const privateCatalog = (value) => value && typeof value === 'object' && !Array.isArray(value)
  && value.schemaVersion === 'selectable-text-catalog.v2' && value.documents && typeof value.documents === 'object'
  && Object.values(value.documents).some(privateDocument)

function inspect(value, name, depth = 0) {
  if (typeof value === 'string') {
    const text = value.trimStart()
    if (text[0] !== '{' && text[0] !== '[' && text[0] !== '"') return
    if (depth >= 4) throw new Error(`FEEDBACK_PUBLIC_JSON_DEPTH:${name}`)
    try { inspect(JSON.parse(text), name, depth + 1) }
    catch (error) { if (!(error instanceof SyntaxError)) throw error }
    return
  }
  if (!value || typeof value !== 'object') return
  if (privateCatalog(value)) throw new Error(`FEEDBACK_PUBLIC_CATALOG:${name}`)
  if (own(value, 'sourceToken')) throw new Error(`FEEDBACK_PUBLIC_SOURCE_TOKEN:${name}`)
  for (const child of Object.values(value)) inspect(child, name, depth)
}

const staticString = (node) => node.type === 'StringLiteral' ? node.value
  : node.type === 'TemplateLiteral' && node.expressions.length === 0 ? node.quasis[0].value.cooked : undefined

function staticValue(node, name) {
  const text = staticString(node)
  if (text !== undefined) return text
  if (node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') return node.value
  if (node.type === 'NullLiteral') return null
  if (node.type === 'ArrayExpression') return node.elements.map((item) => item ? staticValue(item, name) : null)
  // Bundlers compact literal string arrays into a literal .split(separator).
  // Decode only this closed form; never execute a call from the bundle.
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
    && !node.callee.computed && node.callee.property.type === 'Identifier' && node.callee.property.name === 'split'
    && node.arguments.length === 1) {
    const value = staticString(node.callee.object), separator = staticString(node.arguments[0])
    if (typeof value === 'string' && typeof separator === 'string') return value.split(separator)
  }
  if (node.type === 'ObjectExpression') {
    const result = Object.create(null)
    for (const property of node.properties) {
      if (property.type !== 'ObjectProperty' || property.method) throw new Error(`FEEDBACK_PUBLIC_JS_UNSUPPORTED:${name}`)
      const key = !property.computed && property.key.type === 'Identifier' ? property.key.name : staticValue(property.key, name)
      if (typeof key !== 'string' && typeof key !== 'number') throw new Error(`FEEDBACK_PUBLIC_JS_UNSUPPORTED:${name}`)
      if (key === 'sourceToken') throw new Error(`FEEDBACK_PUBLIC_SOURCE_TOKEN:${name}`)
      result[key] = staticValue(property.value, name)
    }
    return result
  }
  throw new Error(`FEEDBACK_PUBLIC_JS_UNSUPPORTED:${name}`)
}

function inspectJavaScript(source, name) {
  const ast = parse(source, { sourceType: 'unambiguous', allowReturnOutsideFunction: true })
  const privateKey = (node) => node.type === 'Identifier' ? node.name : staticString(node)
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'ObjectProperty' && privateKey(node.key) === 'sourceToken') throw new Error(`FEEDBACK_PUBLIC_SOURCE_TOKEN:${name}`)
    if (node.type === 'MemberExpression' && privateKey(node.property) === 'sourceToken') throw new Error(`FEEDBACK_PUBLIC_SOURCE_TOKEN:${name}`)
    if (node.type === 'ObjectExpression' && ['schemaVersion', 'documents'].every((key) => node.properties.some((property) => property.type === 'ObjectProperty' && privateKey(property.key) === key))) {
      inspect(staticValue(node, name), name)
    }
    if (node.type === 'StringLiteral' || node.type === 'TemplateLiteral') {
      const text = staticString(node)
      if (text !== undefined) inspect(text, name)
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'extra', 'errors', 'comments', 'tokens'].includes(key)) continue
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(ast.program)
}

export async function verifyPublicFeedbackBoundary(site) {
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name), name = relative(site, path)
      if (entry.isDirectory()) { await visit(path); continue }
      if (!entry.isFile()) continue
      if (/generated-private|feedback-selectable-views\.(?:ko|en)\.json|TOOL\/feedback-service/i.test(name)) throw new Error(`FEEDBACK_PUBLIC_PATH:${name}`)
      const extension = extname(name).toLowerCase()
      if (extension === '.json') inspect(JSON.parse(await readFile(path, 'utf8')), name)
      if (extension === '.js' || extension === '.mjs') inspectJavaScript(await readFile(path, 'utf8'), name)
    }
  }
  await visit(site)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('PUBLIC_SITE_ROOT_REQUIRED')
  await verifyPublicFeedbackBoundary(resolve(process.argv[2]))
}
