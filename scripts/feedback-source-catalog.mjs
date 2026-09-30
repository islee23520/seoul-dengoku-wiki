import { createHash } from 'node:crypto'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { canonicalJson } from './world-atlas-schema.mjs'

const length = (value) => Array.from(value).length
export const canonicalRevision = (value) => createHash('sha256').update(canonicalJson(value)).digest('hex')
const selected = (value, locale) => value?.[locale] ?? value?.ko
const pointer = (part) => part.replaceAll('~', '~0').replaceAll('/', '~1')
const plainSpan = (path, text) => ({ path, start: 0, end: length(text), unit: 'unicode-code-point' })
const mappedSpan = (path, start, end, textStart, textEnd) => ({ path, start, end, unit: 'unicode-code-point', textStart, textEnd })

function visibleMarkdown(markdown, path) {
  const root = fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
  const spans = []
  let text = ''
  const walk = (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      const value = node.value ?? ''
      if (!value) return
      const textStart = length(text), textEnd = textStart + length(value)
      const raw = markdown.slice(node.position.start.offset, node.position.end.offset)
      const relative = raw.indexOf(value)
      if (relative < 0) throw new Error(`E_FEEDBACK_SOURCE_MAP:${path}`)
      const sourceStart = length(markdown.slice(0, node.position.start.offset + relative))
      spans.push(mappedSpan(path, sourceStart, sourceStart + length(value), textStart, textEnd))
      text += value
      return
    }
    if (node.type === 'break') {
      const textStart = length(text); text += '\n'; spans.push(mappedSpan(path, length(markdown.slice(0, node.position.start.offset)), length(markdown.slice(0, node.position.start.offset)) + 1, textStart, textStart + 1)); return
    }
    for (const child of node.children ?? []) walk(child)
  }
  for (const child of root.children) walk(child)
  if (!text) return { text: '', sourceSpans: [] }
  if (spans.length === 1 && spans[0].start === 0 && spans[0].end === length(markdown) && spans[0].textEnd === length(text)) return { text, sourceSpans: [plainSpan(path, text)] }
  return { text, sourceSpans: spans }
}

function visibleRun(markdown,path){
 const leading=markdown.match(/^\s*/u)?.[0]??'',trailing=markdown.match(/\s*$/u)?.[0]??''
 const core=markdown.slice(leading.length,markdown.length-trailing.length)
 const result=core?visibleMarkdown(core,path):{text:'',sourceSpans:[]}
 const spans=[];let text=''
 if(leading){const end=length(leading);text+=leading;spans.push(mappedSpan(path,0,end,0,end))}
 const offset=length(text);text+=result.text;spans.push(...result.sourceSpans.map(span=>'textStart'in span?{...span,start:span.start+length(leading),end:span.end+length(leading),textStart:span.textStart+offset,textEnd:span.textEnd+offset}:mappedSpan(span.path,span.start+length(leading),span.end+length(leading),offset,offset+length(result.text))))
 if(trailing){const sourceStart=length(markdown)-length(trailing),textStart=length(text);text+=trailing;spans.push(mappedSpan(path,sourceStart,length(markdown),textStart,length(text)))}
 return{text,sourceSpans:spans}
}

function visibleValue(value, path, locale) {
  const localized = selected(value, locale)
  if (typeof localized === 'string') return visibleMarkdown(localized, path)
  let text = ''
  const sourceSpans = []
  for (const [index, run] of localized.entries()) {
    const visible = visibleRun(run.text, `${path}/${index}/text`)
    const offset = length(text)
    text += visible.text
    sourceSpans.push(...visible.sourceSpans.map((span) => 'textStart' in span ? { ...span, textStart: span.textStart + offset, textEnd: span.textEnd + offset } : mappedSpan(span.path, span.start, span.end, offset, offset + length(visible.text))))
  }
  return { text, sourceSpans }
}
const leaf = (block, leafId, blockKind, value, path, locale, blockAnchor = block.anchor) => ({ leafId, blockAnchor, blockKind, ...visibleValue(value, path, locale) })

export function articleLeaves(envelope, locale) {
  const leaves = []
  envelope.content.forEach((block, index) => {
    const base = `/content/${index}`
    if (index === 0 && block.kind === 'heading' && block.depth === 1) return
    if (block.kind === 'rule') return
    if (block.kind === 'list') {
      block.items.forEach((item, itemIndex) => leaves.push(leaf(block, `${block.anchor}:item:${itemIndex}`, block.kind, item, `${base}/items/${itemIndex}/${locale}`, locale)))
      return
    }
    if (block.kind === 'table') {
      block.columns.forEach((cell, column) => leaves.push(leaf(block, `${block.anchor}:cell:0:${column}`, block.kind, cell, `${base}/columns/${column}/${locale}`, locale)))
      block.rows.forEach((row, rowIndex) => row.forEach((cell, column) => leaves.push(leaf(block, `${block.anchor}:cell:${rowIndex + 1}:${column}`, block.kind, cell, `${base}/rows/${rowIndex}/${column}/${locale}`, locale))))
      return
    }
    leaves.push(leaf(block, `${block.anchor}:text`, block.kind, block.text, `${base}/text/${locale}`, locale))
  })
  return leaves.filter((value) => value.text && value.sourceSpans.length)
}

export function articleFeedbackRecord({ envelope, route, locale }) {
  return { documentId: envelope.id, route, locale, sourceRevision: canonicalRevision(envelope), selector: 'p, h2, h3, h4, h5, h6, blockquote, pre, li, th, td', leaves: articleLeaves(envelope, locale) }
}
const label = (text) => text.match(/^([^\n.]+)\./u)?.[1]?.trim()
function personSegment(envelope, headingAnchor) {
  const start = envelope.content.findIndex((block) => block.kind === 'heading' && block.anchor === headingAnchor)
  if (start < 0) throw new Error(`E_PERSON_FEEDBACK_HEADING:${headingAnchor}`)
  const depth = envelope.content[start].depth
  let end = start + 1
  while (end < envelope.content.length && !(envelope.content[end].kind === 'heading' && envelope.content[end].depth <= depth)) end += 1
  return envelope.content.slice(start + 1, end).map((block) => ({ block, index: envelope.content.indexOf(block) }))
}
export function personFeedbackRecord({ envelope, personId, route, headingAnchor, headingText, locale }) {
  const resolvedAnchor = headingAnchor ?? envelope.content.find((block) => block.kind === 'heading' && selected(block.text, locale) === headingText)?.anchor
  const leaves = []
  for (const { block, index } of personSegment(envelope, resolvedAnchor)) {
    const base = `/content/${index}`
    if (block.kind === 'paragraph') {
      const localized = selected(block.text, locale)
      const runs = typeof localized === 'string' ? null : localized
      if (runs?.length && runs.some((run) => run.strong)) {
        let section = null, part = 0
        for (const [runIndex, run] of runs.entries()) {
          if (run.strong && label(run.text)) { section = label(run.text); part = 0; continue }
          if (!section || !run.text.trim()) continue
          const leading = run.text.match(/^\s*/u)?.[0] ?? ''
          const authored = run.text.slice(leading.length).replace(/\n$/u, '')
          if (!authored) continue
          const visible = visibleMarkdown(authored, `${base}/text/${locale}/${runIndex}/text`)
          leaves.push({ leafId: `section:${section}:paragraph:${part++}`, blockAnchor: `section:${section}`, blockKind: 'person-section-paragraph', text: visible.text, sourceSpans: visible.sourceSpans.map((span) => ({ ...span, start: span.start + length(leading), end: span.end + length(leading) })) })
        }
        continue
      }
    }
    if (block.kind === 'list') {
      block.items.forEach((item, itemIndex) => leaves.push(leaf(block, `biography:${block.anchor}:item:${itemIndex}`, 'person-biography-list-item', item, `${base}/items/${itemIndex}/${locale}`, locale, 'biography')))
      continue
    }
    if (block.kind !== 'rule' && block.kind !== 'heading') leaves.push(...articleLeaves({ content: [block] }, locale).map((value) => ({ ...value, leafId: `biography:${value.leafId}`, blockAnchor: 'biography', blockKind: `person-biography-${value.blockKind}`, sourceSpans: value.sourceSpans.map((span) => ({ ...span, path: span.path.replace('/content/0', base) })) })))
  }
  return { documentId: `PERSON:${personId}`, route, locale, sourceRevision: canonicalRevision(envelope), selector: 'section[data-feedback-section] p, section[data-feedback-section] li, details[data-feedback-biography] p', leaves }
}

export function privateCatalog(records) {
  const documents = {}
  const locales = new Set(records.map((record) => record.locale))
  if (locales.size > 1) throw new Error('E_FEEDBACK_CATALOG_MIXED_LOCALE')
  for (const record of records) {
    if (documents[record.documentId]) throw new Error(`E_FEEDBACK_CATALOG_DUPLICATE:${record.documentId}`)
    documents[record.documentId] = { documentId: record.documentId, route: record.route, locale: record.locale, selector: record.selector, currentRevision: record.sourceRevision, revisions: { [record.sourceRevision]: { leaves: record.leaves } } }
  }
  return { schemaVersion: 'selectable-text-catalog.v1', locale: [...locales][0], documents }
}
