import { createHash } from 'node:crypto'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { canonicalJson } from './world-atlas-schema.mjs'

const length = (value) => Array.from(value).length
export const canonicalRevision = (value) => createHash('sha256').update(canonicalJson(value)).digest('hex')
const selected = (value, locale) => value?.[locale] ?? value?.ko
const plainSpan = (path, text) => ({ path, start: 0, end: length(text), unit: 'unicode-code-point' })
const mappedSpan = (path, start, end, textStart, textEnd) => ({ path, start, end, unit: 'unicode-code-point', textStart, textEnd })

function textSourceSpans(raw,value,path,sourceBase,textBase){
 const spans=[];let source=0,text=0
 while(text<length(value)){
  const visible=Array.from(value)[text]
  if(raw[source]==='\\'&&Array.from(raw)[source+1]===visible){source+=1}
  else if(raw[source]==='&'){
   const end=raw.indexOf(';',source)
   if(end>source){const token=raw.slice(source,end+1),decoded=mdastText(fromMarkdown(token).children[0]);if(decoded===visible){spans.push(mappedSpan(path,sourceBase+source,sourceBase+source+1,textBase+text,textBase+text+1));source=end+1;text+=1;continue}}
  }
  const current=Array.from(raw)[source]
  if(current!==visible)throw new Error(`E_FEEDBACK_SOURCE_MAP:${path}`)
  spans.push(mappedSpan(path,sourceBase+source,sourceBase+source+1,textBase+text,textBase+text+1));source+=1;text+=1
 }
 return spans
}

function visibleMarkdown(markdown, path, context = 'paragraph') {
  if (context === 'code') return { text: markdown, sourceSpans: [plainSpan(path, markdown)] }
  const wrappers = context === 'table' ? { prefix: '| ' , suffix: ' |\n| --- |' } : context === 'list' ? { prefix: '- ', suffix: '' } : context === 'heading' ? { prefix: '## ', suffix: '' } : { prefix: '', suffix: '' }
  const authored = `${wrappers.prefix}${markdown}${wrappers.suffix}`
  const root = fromMarkdown(authored, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
  const spans = []
  let text = ''
  const walk = (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      const value = node.value ?? ''
      if (!value) return
      const textStart = length(text), textEnd = textStart + length(value)
      const startOffset = node.position.start.offset - wrappers.prefix.length
      const endOffset = node.position.end.offset - wrappers.prefix.length
      if (endOffset <= 0 || startOffset >= markdown.length) return
      const raw = markdown.slice(Math.max(0, startOffset), Math.min(markdown.length, endOffset))
      const sourceStart = length(markdown.slice(0, Math.max(0, startOffset)))
      try { spans.push(...textSourceSpans(raw,value,path,sourceStart,textStart)) }
      catch { const relative=raw.indexOf(value);if(relative<0)throw new Error(`E_FEEDBACK_SOURCE_MAP:${path}`);spans.push(mappedSpan(path,sourceStart+length(raw.slice(0,relative)),sourceStart+length(raw.slice(0,relative))+length(value),textStart,textEnd)) }
      text += value
      return
    }
    if (node.type === 'break') {
      const textStart = length(text); text += '\n'; spans.push(mappedSpan(path, length(markdown.slice(0, Math.max(0, node.position.start.offset - wrappers.prefix.length))), length(markdown.slice(0, Math.max(0, node.position.start.offset - wrappers.prefix.length))) + 1, textStart, textStart + 1)); return
    }
    for (const child of node.children ?? []) walk(child)
  }
  const target = context === 'table' ? root.children[0]?.children?.[0]?.children?.[0] : context === 'list' ? root.children[0]?.children?.[0] : root.children[0]
  if (target) walk(target)
  if (!text) return { text: '', sourceSpans: [] }
  const merged=[]
  for(const span of spans){const previous=merged.at(-1);if(previous&&previous.path===span.path&&previous.end===span.start&&previous.textEnd===span.textStart){previous.end=span.end;previous.textEnd=span.textEnd}else merged.push(span)}
  spans.splice(0,spans.length,...merged)
  if (spans.length === 1 && spans[0].start === 0 && spans[0].end === length(markdown) && spans[0].textEnd === length(text)) return { text, sourceSpans: [plainSpan(path, text)] }
  return { text, sourceSpans: spans }
}

function visibleRun(markdown,path){
 if(/^\s+$/u.test(markdown))return{text:markdown,sourceSpans:[plainSpan(path,markdown)]}
 const leading=markdown.match(/^\s*/u)?.[0]??'',trailing=markdown.match(/\s*$/u)?.[0]??''
 const core=markdown.slice(leading.length,markdown.length-trailing.length)
 const result=core?visibleMarkdown(core,path):{text:'',sourceSpans:[]}
 const spans=[];let text=''
 if(leading){const end=length(leading);text+=leading;spans.push(mappedSpan(path,0,end,0,end))}
 const offset=length(text);text+=result.text;spans.push(...result.sourceSpans.map(span=>'textStart'in span?{...span,start:span.start+length(leading),end:span.end+length(leading),textStart:span.textStart+offset,textEnd:span.textEnd+offset}:mappedSpan(span.path,span.start+length(leading),span.end+length(leading),offset,offset+length(result.text))))
 if(trailing){const sourceStart=length(markdown)-length(trailing),textStart=length(text);text+=trailing;spans.push(mappedSpan(path,sourceStart,length(markdown),textStart,length(text)))}
 return{text,sourceSpans:spans}
}

function visibleValue(value, path, locale, context) {
  const localized = selected(value, locale)
  if (typeof localized === 'string') return visibleMarkdown(localized, path, context)
  let text = ''
  const sourceSpans = []
  for (const [index, run] of localized.entries()) {
    const visible = visibleRun(run.text, `${path}/${index}/text`)
    const overlap = text.endsWith(' ') && visible.text.startsWith(' ') ? 1 : 0
    const offset = length(text) - overlap
    text += visible.text.slice(overlap)
    sourceSpans.push(...visible.sourceSpans.flatMap((span) => { const start='textStart'in span?span.textStart:0,end='textEnd'in span?span.textEnd:length(visible.text),a=Math.max(overlap,start);return a>=end?[]:[mappedSpan(span.path,span.start+a-start,span.end,offset+a,end-overlap+offset)] }))
  }
  return { text, sourceSpans }
}
const leaf = (block, leafId, blockKind, value, path, locale, blockAnchor = block.anchor) => ({ leafId, blockAnchor, blockKind, ...visibleValue(value, path, locale, blockKind === 'table' ? 'table' : blockKind === 'list' ? 'list' : blockKind === 'heading' ? 'heading' : blockKind === 'code' ? 'code' : 'paragraph') })

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

const mdastText = (node) => node?.value ?? (node?.children ?? []).map(mdastText).join('')
export function readerLeaves(blocks) {
  const values=[]
  for(const block of blocks){
    if(block.type==='html'||block.type==='thematicBreak')continue
    if(block.type==='paragraph'&&(block.children??[]).every((child)=>child.type==='html'))continue
    if(block.type==='list'){for(const item of block.children??[])values.push({kind:'list',text:mdastText(item)});continue}
    if(block.type==='table'){for(const row of block.children??[])for(const cell of row.children??[])values.push({kind:'table',text:mdastText(cell)});continue}
    if(['paragraph','heading','blockquote','code'].includes(block.type))values.push({kind:block.type==='blockquote'?'quote':block.type,text:mdastText(block)})
  }
  return values.filter((value)=>value.text)
}
function alignPublishedLeaves(sourceLeaves,blocks){
 const actual=readerLeaves(blocks),out=[];let cursor=0
 for(const expected of actual){const index=sourceLeaves.findIndex((candidate,position)=>position>=cursor&&candidate.text===expected.text&&candidate.blockKind===expected.kind);if(index<0)throw new Error(`E_FEEDBACK_READER_PARITY:${expected.kind}:${expected.text.slice(0,80)}`);out.push(sourceLeaves[index]);cursor=index+1}
 return out
}

export function articleFeedbackRecord({ envelope, route, locale, blocks }) {
  const authored=articleLeaves(envelope,locale)
  return { documentId: envelope.id, route, locale, sourceRevision: canonicalRevision(envelope), selector: 'p, h2, h3, h4, h5, h6, blockquote, pre, li, th, td', leaves: blocks ? alignPublishedLeaves(authored,blocks) : authored }
}


function personSegment(envelope, headingAnchor) {
  const start = envelope.content.findIndex((block) => block.kind === 'heading' && block.anchor === headingAnchor)
  if (start < 0) throw new Error(`E_PERSON_FEEDBACK_HEADING:${headingAnchor}`)
  const depth = envelope.content[start].depth
  let end = start + 1
  while (end < envelope.content.length && !(envelope.content[end].kind === 'heading' && envelope.content[end].depth <= depth)) end += 1
  return envelope.content.slice(start + 1, end).map((block) => ({ block, index: envelope.content.indexOf(block) }))
}
function localizedFragments(segment,locale){
 const fragments=[]
 for(const {block,index} of segment){const base=`/content/${index}`;const add=(value,path)=>{const localized=selected(value,locale);if(typeof localized==='string')fragments.push({text:localized,path});else localized?.forEach((run,runIndex)=>fragments.push({text:run.text,path:`${path}/${runIndex}/text`}))};if(block.text)add(block.text,`${base}/text/${locale}`);block.items?.forEach((item,itemIndex)=>add(item,`${base}/items/${itemIndex}/${locale}`))}
 return fragments
}
function clipVisibleSpans(visible,start,end){
 return visible.sourceSpans.flatMap((span)=>{const spanStart='textStart'in span?span.textStart:0,spanEnd='textEnd'in span?span.textEnd:length(visible.text),a=Math.max(start,spanStart),b=Math.min(end,spanEnd);return a>=b?[]:[mappedSpan(span.path,span.start+a-spanStart,span.start+b-spanStart,a-start,b-start)]})
}
function sectionSurfaceLeaves(markdown){
 const root=fromMarkdown(markdown,{extensions:[gfm()],mdastExtensions:[gfmFromMarkdown()]});const out=[]
 const add=(node,kind)=>{const text=mdastText(node);if(text)out.push({text,kind})}
 for(const node of root.children){if(node.type==='paragraph')add(node,'person-section-paragraph');if(node.type==='list')for(const item of node.children??[])add(item,'person-section-list-item')}
 return out
}
function actualSectionLeaves(sections,segment,locale,personId){
 const fragments=localizedFragments(segment,locale).map((fragment)=>({...fragment,visible:visibleMarkdown(fragment.text,fragment.path)})),leaves=[]
 for(const [section,markdown] of Object.entries(sections)){
  let part=0
  for(const surface of sectionSurfaceLeaves(markdown)){
   const source=fragments.find((fragment)=>fragment.visible.text.includes(surface.text))
   if(!source)throw new Error(`E_PERSON_SECTION_SOURCE:${personId}:${section}:${surface.text.slice(0,40)}`)
   const start=length(source.visible.text.slice(0,source.visible.text.indexOf(surface.text))),end=start+length(surface.text)
   leaves.push({leafId:`section:${section}:${surface.kind.endsWith('list-item')?'list':'paragraph'}:${part++}`,blockAnchor:`section:${section}`,blockKind:surface.kind,text:surface.text,sourceSpans:clipVisibleSpans(source.visible,start,end)})
  }
 }
 return leaves
}
export function personFeedbackRecord({ envelope, personId, route, headingAnchor, headingText, locale, sections = {} }) {
  const resolvedAnchor = headingAnchor ?? envelope.content.find((block) => block.kind === 'heading' && selected(block.text, locale) === headingText)?.anchor
  const segment=personSegment(envelope,resolvedAnchor)
  const leaves=actualSectionLeaves(sections,segment,locale,personId)
  for (const { block, index } of segment) {
    const base = `/content/${index}`
    if (block.kind === 'list') {
      block.items.forEach((item, itemIndex) => leaves.push(leaf(block, `biography:${block.anchor}:item:${itemIndex}`, 'person-biography-list-item', item, `${base}/items/${itemIndex}/${locale}`, locale, 'biography')))
      continue
    }
    if (block.kind !== 'rule' && block.kind !== 'heading') leaves.push(...articleLeaves({ content: [block] }, locale).map((value) => ({ ...value, leafId: `biography:${value.leafId}`, blockAnchor: 'biography', blockKind: `person-biography-${value.blockKind}`, sourceSpans: value.sourceSpans.map((span) => ({ ...span, path: span.path.replace('/content/0', base) })) })))
  }
  return { documentId: `PERSON:${personId}`, route, locale, sourceRevision: canonicalRevision(envelope), selector: 'section[data-feedback-section] p, section[data-feedback-section] li, details[data-feedback-biography] p, details[data-feedback-biography] li', leaves }
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
