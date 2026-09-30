import { createHash } from 'node:crypto'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { canonicalJson } from './world-atlas-schema.mjs'

const length = (value) => Array.from(value).length
export const canonicalRevision = (value) => createHash('sha256').update(canonicalJson(value)).digest('hex')
const selected = (value, locale) => value?.[locale] ?? value?.ko
const literalSegment = (path, start, end, textStart, textEnd) => ({ kind: 'literal', path, start, end, unit: 'unicode-code-point', textStart, textEnd })
const plainSegment = (path, text) => literalSegment(path, 0, length(text), 0, length(text))
const entitySegment = (path, start, end, textStart, sourceToken, visibleText) => ({ kind: 'entity', path, start, end, unit: 'unicode-code-point', textStart, textEnd: textStart + 1, sourceToken, visibleText })

function textSourceSegments(raw,value,path,sourceBase,textBase){
 const source=Array.from(raw),visible=Array.from(value),segments=[];let sourceIndex=0
 for(let textIndex=0;textIndex<visible.length;textIndex+=1){
  if(source[sourceIndex]==='\\'&&source[sourceIndex+1]===visible[textIndex])sourceIndex+=1
  if(source[sourceIndex]==='&'){
   const end=source.indexOf(';',sourceIndex)
   if(end>sourceIndex){const token=source.slice(sourceIndex,end+1).join(''),decoded=mdastText(fromMarkdown(token).children[0]);if(decoded===visible[textIndex]){segments.push(entitySegment(path,sourceBase+sourceIndex,sourceBase+end+1,textBase+textIndex,token,visible[textIndex]));sourceIndex=end+1;continue}}
  }
  if(source[sourceIndex]!==visible[textIndex])throw new Error(`E_FEEDBACK_SOURCE_MAP:${path}`)
  segments.push(literalSegment(path,sourceBase+sourceIndex,sourceBase+sourceIndex+1,textBase+textIndex,textBase+textIndex+1));sourceIndex+=1
 }
 return segments
}
function visibleMarkdown(markdown, path, context = 'paragraph') {
  if (context === 'code') return { text: markdown, sourceSegments: [plainSegment(path, markdown)] }
  const wrappers = context === 'table' ? { prefix: '| ' , suffix: ' |\n| --- |' } : context === 'list' ? { prefix: '- ', suffix: '' } : context === 'heading' ? { prefix: '## ', suffix: '' } : { prefix: '', suffix: '' }
  const authored = `${wrappers.prefix}${markdown}${wrappers.suffix}`
  const root = fromMarkdown(authored, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
  const segments = []
  let text = ''
  const walk = (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      const value = node.value ?? ''
      if (!value) return
      const textStart = length(text)
      const startOffset = node.position.start.offset - wrappers.prefix.length
      const endOffset = node.position.end.offset - wrappers.prefix.length
      if (endOffset <= 0 || startOffset >= markdown.length) return
      const raw = markdown.slice(Math.max(0, startOffset), Math.min(markdown.length, endOffset))
      let sourceStart = length(markdown.slice(0, Math.max(0, startOffset))),sourceRaw=raw
      const literal=raw.indexOf(value)
      if(literal>=0){sourceStart+=length(raw.slice(0,literal));sourceRaw=value}
      segments.push(...textSourceSegments(sourceRaw,value,path,sourceStart,textStart))
      text += value
      return
    }
    if (node.type === 'break') {
      const textStart = length(text); text += '\n'; segments.push(literalSegment(path, length(markdown.slice(0, Math.max(0, node.position.start.offset - wrappers.prefix.length))), length(markdown.slice(0, Math.max(0, node.position.start.offset - wrappers.prefix.length))) + 1, textStart, textStart + 1)); return
    }
    for (const child of node.children ?? []) walk(child)
  }
  const target = context === 'table' ? root.children[0]?.children?.[0]?.children?.[0] : context === 'list' ? root.children[0]?.children?.[0] : root.children[0]
  if (target) walk(target)
  if (!text) return { text: '', sourceSegments: [] }
  const merged=[]
  for(const value of segments){const previous=merged.at(-1);if(value.kind==='literal'&&previous?.kind==='literal'&&previous.path===value.path&&previous.end===value.start&&previous.textEnd===value.textStart){previous.end=value.end;previous.textEnd=value.textEnd}else merged.push(value)}
  if (merged.length === 1 && merged[0].kind === 'literal' && merged[0].start === 0 && merged[0].end === length(markdown) && merged[0].textEnd === length(text)) return { text, sourceSegments: [plainSegment(path, text)] }
  return { text, sourceSegments: merged }
}

function visibleValue(value,path,locale,context){
 const localized=selected(value,locale)
 if(typeof localized==='string')return visibleMarkdown(localized,path,context)
 const authored=localized.map((run)=>run.text).join('')
 const rendered=visibleMarkdown(authored,path,context)
 let sourceCursor=0
 const runs=localized.map((run,index)=>{const start=sourceCursor;sourceCursor+=length(run.text);return{index,start,end:sourceCursor}})
 const sourceSegments=rendered.sourceSegments.flatMap((segment)=>runs.flatMap((run)=>{const a=Math.max(segment.start,run.start),b=Math.min(segment.end,run.end);if(a>=b)return[];if(segment.kind==='entity'){if(a!==segment.start||b!==segment.end)throw new Error(`E_FEEDBACK_ENTITY_RUN_BOUNDARY:${path}`);return[entitySegment(`${path}/${run.index}/text`,a-run.start,b-run.start,segment.textStart,segment.sourceToken,segment.visibleText)]}return[literalSegment(`${path}/${run.index}/text`,a-run.start,b-run.start,segment.textStart+a-segment.start,segment.textStart+b-segment.start)]}))
 return{text:rendered.text,sourceSegments}
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
  return leaves.filter((value) => value.text && value.sourceSegments.length)
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


export const PERSON_SECTION_ORDER=['생애','관직','무공','일화','가문','관계','야망','공포','개입']

function personSegment(envelope, headingAnchor) {
  const start = envelope.content.findIndex((block) => block.kind === 'heading' && block.anchor === headingAnchor)
  if (start < 0) throw new Error(`E_PERSON_FEEDBACK_HEADING:${headingAnchor}`)
  const depth = envelope.content[start].depth
  let end = start + 1
  while (end < envelope.content.length && !(envelope.content[end].kind === 'heading' && envelope.content[end].depth <= depth)) end += 1
  return envelope.content.slice(start + 1, end).map((block) => ({ block, index: envelope.content.indexOf(block) }))
}
function localizedFragments(segment,locale){
 const bySection=new Map();let currentSection=null
 const add=(section,text,path,sourceBase=0)=>{if(!section||!text)return;const visible=visibleMarkdown(text,path);visible.sourceSegments=visible.sourceSegments.map((segment)=>({...segment,start:segment.start+sourceBase,end:segment.end+sourceBase}));const rows=bySection.get(section)??[];rows.push({text,path,visible});bySection.set(section,rows)}
 const processValue=(value,path)=>{
  const localized=selected(value,locale)
  if(Array.isArray(localized)){
   for(const [runIndex,run] of localized.entries()){
    const name=run.strong?run.text.match(/^([^\n.]+)\./u)?.[1]?.trim():null
    if(name){currentSection=name;continue}
    add(currentSection,run.text,`${path}/${runIndex}/text`)
   }
   return
  }
  const root=fromMarkdown(localized,{extensions:[gfm()],mdastExtensions:[gfmFromMarkdown()]})
  const visit=(node,inLabel=false)=>{
   if(node.type==='strong'){const name=mdastText(node).match(/^([^\n.]+)\./u)?.[1]?.trim();if(name){currentSection=name;return}}
   if(!inLabel&&(node.type==='text'||node.type==='inlineCode')){const base=length(localized.slice(0,node.position.start.offset));add(currentSection,node.value,path,base);return}
   for(const child of node.children??[])visit(child,inLabel)
  }
  for(const node of root.children)visit(node)
 }
 for(const {block,index} of segment){const base=`/content/${index}`;if(block.text)processValue(block.text,`${base}/text/${locale}`);block.items?.forEach((item,itemIndex)=>processValue(item,`${base}/items/${itemIndex}/${locale}`))}
 return bySection
}
function clipVisibleSegments(visible,start,end){return visible.sourceSegments.flatMap((segment)=>{const a=Math.max(start,segment.textStart),b=Math.min(end,segment.textEnd);if(a>=b)return[];if(segment.kind==='entity')return[{...segment,textStart:a-start,textEnd:b-start}];return[literalSegment(segment.path,segment.start+a-segment.textStart,segment.start+b-segment.textStart,a-start,b-start)]})}
function sectionSurfaceLeaves(markdown){const root=fromMarkdown(markdown,{extensions:[gfm()],mdastExtensions:[gfmFromMarkdown()]});const out=[];const add=(node,kind)=>{const text=mdastText(node);if(text)out.push({text,kind})};for(const node of root.children){if(node.type==='paragraph')add(node,'person-section-paragraph');if(node.type==='list')for(const item of node.children??[])add(item,'person-section-list-item')}return out}
function actualSectionLeaves(sections,segment,locale,personId){
 const bySection=localizedFragments(segment,locale),leaves=[]
 for(const section of PERSON_SECTION_ORDER){const markdown=sections[section];if(!markdown)continue;let part=0,fragmentCursor=0
  for(const surface of sectionSurfaceLeaves(markdown)){const fragments=bySection.get(section)??[];let sourceIndex=-1,offset=-1
   for(let index=fragmentCursor;index<fragments.length;index+=1){const found=fragments[index].visible.text.indexOf(surface.text);if(found>=0){sourceIndex=index;offset=length(fragments[index].visible.text.slice(0,found));break}}
   if(sourceIndex<0)throw new Error(`E_PERSON_SECTION_SOURCE:${personId}:${section}:${surface.text.slice(0,40)}`)
   const source=fragments[sourceIndex];fragmentCursor=sourceIndex+1;leaves.push({leafId:`section:${section}:${surface.kind.endsWith('list-item')?'list':'paragraph'}:${part++}`,blockAnchor:`section:${section}`,blockKind:surface.kind,text:surface.text,sourceSegments:clipVisibleSegments(source.visible,offset,offset+length(surface.text))})
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
    if (block.kind !== 'rule' && block.kind !== 'heading') leaves.push(...articleLeaves({ content: [block] }, locale).map((value) => ({ ...value, leafId: `biography:${value.leafId}`, blockAnchor: 'biography', blockKind: `person-biography-${value.blockKind}`, sourceSegments: value.sourceSegments.map((segment) => ({ ...segment, path: segment.path.replace('/content/0', base) })) })))
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
  return { schemaVersion: 'selectable-text-catalog.v2', locale: [...locales][0], documents }
}
