import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DocumentContent } from '@seoul-dengoku/document-renderer'
import { articleFeedbackRecord, canonicalRevision, PERSON_SECTION_ORDER, personFeedbackRecord } from './feedback-source-catalog.mjs'

const fixture = {
  id: 'DOC:fixture', domain: 'world', locales: { ko: { title: '표본', summary: '', tense: 'present' }, en: { title: 'Fixture', summary: '', tense: 'present' } },
  content: [
    { kind: 'heading', anchor: 'root', depth: 1, text: { ko: '표본', en: 'Fixture' } },
    { kind: 'paragraph', anchor: 'inline', text: { ko: [{ text: '생애.', strong: true }, { text: ' A😀 ' }, { text: '링크', href: '/x' }], en: [{ text: 'Life.', strong: true }, { text: ' A😀 ' }, { text: 'link', href: '/x' }] } },
    { kind: 'paragraph', anchor: 'scalar', text: { ko: '`코드`와 [표시](x)', en: '`code` and [label](x)' } },
    { kind: 'list', anchor: 'list', items: [{ ko: '중복', en: 'duplicate' }, { ko: '중복', en: 'duplicate' }] },
    { kind: 'table', anchor: 'table', columns: [{ ko: '열', en: 'column' }], rows: [[{ ko: [{ text: '강조', strong: true }, { text: ' 셀' }], en: 'cell' }]] },
  ],
}

test('canonical article records preserve renderer-visible inline, code, table, list and duplicate identities', () => {
  const record = articleFeedbackRecord({ envelope: fixture, route: '/world/fixture', locale: 'ko' })
  assert.equal(record.documentId, 'DOC:fixture')
  assert.match(record.sourceRevision, /^[a-f0-9]{64}$/u)
  assert.equal(record.leaves.find((leaf) => leaf.leafId === 'inline:text').text, '생애. A😀 링크')
  const scalar = record.leaves.find((leaf) => leaf.leafId === 'scalar:text')
  assert.equal(scalar.text, '코드와 표시')
  assert.ok(scalar.sourceSpans.length >= 2)
  assert.deepEqual(record.leaves.filter((leaf) => leaf.blockAnchor === 'list').map((leaf) => leaf.leafId), ['list:item:0', 'list:item:1'])
  assert.equal(record.leaves.find((leaf) => leaf.leafId === 'table:cell:1:0').text, '강조 셀')
  const english = articleFeedbackRecord({ envelope: fixture, route: '/en/world/fixture', locale: 'en' }); assert.equal(english.leaves.find((leaf) => leaf.leafId === 'inline:text').text, 'Life. A😀 link')
  assert.deepEqual(record.leaves.map((leaf) => leaf.text).filter((text) => text === '중복'), ['중복', '중복'])
})



test('publication-context boundary cases preserve actual reader text and source intervals', () => {
  const envelope=structuredClone(fixture)
  envelope.content=[
   {kind:'heading',anchor:'root',depth:1,text:{ko:'표본',en:'Fixture'}},
   {kind:'paragraph',anchor:'space',text:{ko:[{text:'A'},{text:' '},{text:'B'}],en:'A B'}},
   {kind:'paragraph',anchor:'entity',text:{ko:'A &amp; B',en:'A &amp; B'}},
   {kind:'table',anchor:'literal-table',columns:[{ko:'1.',en:'1.'},{ko:'---',en:'---'},{ko:'#',en:'#'}],rows:[]},
   {kind:'code',anchor:'literal-code',language:'text',text:{ko:'**literal**\nA😀',en:'**literal**\nA😀'}},
  ]
  const record=articleFeedbackRecord({envelope,route:'/world/boundary',locale:'ko'})
  assert.equal(record.leaves.find((leaf)=>leaf.leafId==='space:text').text,'A B')
  assert.equal(record.leaves.find((leaf)=>leaf.leafId==='entity:text').text,'A & B')
  assert.deepEqual(record.leaves.filter((leaf)=>leaf.blockAnchor==='literal-table').map((leaf)=>leaf.text),['1.','---','#'])
  assert.equal(record.leaves.find((leaf)=>leaf.leafId==='literal-code:text').text,'**literal**\nA😀')
  for(const leaf of record.leaves)for(let index=1;index<leaf.sourceSpans.length;index+=1)assert.ok(leaf.sourceSpans[index-1].end<=leaf.sourceSpans[index].start||leaf.sourceSpans[index-1].path!==leaf.sourceSpans[index].path)
})

test('person authority uses the canonical source envelope and stable heading segment', () => {
  const envelope = structuredClone(fixture)
  envelope.id = 'DOC:people'
  envelope.content = [
    { kind: 'heading', anchor: 'person-a', depth: 3, text: { ko: '인물 가', en: 'Person A' } },
    { kind: 'paragraph', anchor: 'person-a-p1', text: { ko: [{ text: '생애.', strong: true }, { text: ' 같은 문장.\n' }, { text: '관직.', strong: true }, { text: ' 기록관.' }], en: [{ text: 'Life.', strong: true }, { text: ' Same.' }] } },
    { kind: 'list', anchor: 'person-a-list', items: [{ ko: '중복', en: 'duplicate' }, { ko: '중복', en: 'duplicate' }] },
    { kind: 'heading', anchor: 'person-b', depth: 3, text: { ko: '인물 나', en: 'Person B' } },
  ]
  const person = personFeedbackRecord({ envelope, personId: 'person-0001', route: '/people/person-0001', headingAnchor: 'person-a', locale: 'ko', sections: { 생애: '같은 문장.', 관직: '기록관.' } })
  assert.equal(person.documentId, 'PERSON:person-0001')
  assert.equal(person.sourceRevision, articleFeedbackRecord({ envelope, route: '/world/people', locale: 'ko' }).sourceRevision)
  assert.ok(person.leaves.some((leaf) => leaf.blockAnchor === 'section:생애' && leaf.text === '같은 문장.'))
  assert.ok(person.leaves.some((leaf) => leaf.blockKind === 'person-biography-list-item'))
  assert.equal(person.leaves.filter((leaf) => leaf.text === '중복').length, 2)
})



test('actual generated article and person leaves match renderer HTML surfaces and exclude API-derived sheets', async () => {
  const catalog=JSON.parse(await readFile(resolve('src/generated-private/feedback-selectable-views.ko.json'),'utf8'))
  const article=catalog.documents['DOC:World-Unbinding'];const articleRevision=article.revisions[article.currentRevision]
  const articleHtml=renderToStaticMarkup(createElement(DocumentContent,{content:fixture.content,locale:'ko'}))
  assert.ok(article.selector.includes('th')&&article.selector.includes('td'))
  assert.ok(articleRevision.leaves.some((leaf)=>leaf.blockKind==='table'&&leaf.leafId.includes(':cell:')))
  const person=catalog.documents['PERSON:person-0001'];const personRevision=person.revisions[person.currentRevision]
  assert.ok(person.selector.includes('section[data-feedback-section]')&&person.selector.includes('details[data-feedback-biography]'))
  assert.ok(personRevision.leaves.some((leaf)=>leaf.blockKind==='person-section-paragraph'))
  assert.ok(Object.values(catalog.documents).filter((value)=>value.documentId.startsWith('PERSON:')).some((value)=>value.revisions[value.currentRevision].leaves.some((leaf)=>leaf.blockKind==='person-biography-list-item')))
  assert.ok(personRevision.leaves.every((leaf)=>!leaf.leafId.includes('gurps')&&!leaf.leafId.includes('sheet')&&!leaf.leafId.includes('values')))
  const rendered=articleHtml.replace(/<[^>]+>/gu,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');for(const leaf of articleFeedbackRecord({envelope:fixture,route:'/world/fixture',locale:'ko'}).leaves.filter((value)=>value.leafId!=='scalar:text'))assert.ok(rendered.includes(leaf.text),leaf.leafId)
})



test('actual publication transforms and person surfaces exactly match current generated readers', async () => {
  const catalog=JSON.parse(await readFile(resolve('src/generated-private/feedback-selectable-views.ko.json'),'utf8'))
  const states=catalog.documents['DOC:Sixteen-States'],statesLeaves=states.revisions[states.currentRevision].leaves
  assert.equal(statesLeaves.find((leaf)=>leaf.leafId==='table:cell:15:5').text,'2079. 10. 간판 게시')
  const houses=catalog.documents['DOC:Operating-Houses'],houseLeaves=houses.revisions[houses.currentRevision].leaves
  assert.equal(houseLeaves.some((leaf)=>leaf.text.includes('출처층: original-fiction')),false)
  assert.equal(catalog.documents['DOC:Glossary'],undefined)
  const details=['person-0001','person-0002']
  for(const id of details){const detail=JSON.parse(await readFile(resolve(`public/person-details/${id}.json`),'utf8')),record=catalog.documents[`PERSON:${id}`],leaves=record.revisions[record.currentRevision].leaves;for(const label of PERSON_SECTION_ORDER.filter((value)=>detail.sections[value]))assert.ok(leaves.some((leaf)=>leaf.blockAnchor===`section:${label}`),`${id}:${label}`);assert.ok(leaves.some((leaf)=>leaf.blockKind.startsWith('person-biography-')),id);assert.ok(record.selector.includes('details[data-feedback-biography] li'))}
  let displayed=0,covered=0
  for(const [documentId,record] of Object.entries(catalog.documents).filter(([id])=>id.startsWith('PERSON:'))){const id=documentId.slice('PERSON:'.length),detail=JSON.parse(await readFile(resolve(`public/person-details/${id}.json`),'utf8')),leaves=record.revisions[record.currentRevision].leaves;for(const label of PERSON_SECTION_ORDER.filter((value)=>detail.sections[value])){displayed++;if(leaves.some((leaf)=>leaf.blockAnchor===`section:${label}`))covered++}}
  assert.equal(covered,displayed)
})



test('actual person order, hidden-section filtering and duplicate source provenance follow PersonDetailPage', async () => {
 const catalog=JSON.parse(await readFile(resolve('src/generated-private/feedback-selectable-views.ko.json'),'utf8')),record=catalog.documents['PERSON:person-0002'],leaves=record.revisions[record.currentRevision].leaves
 const sections=[...new Set(leaves.filter((leaf)=>leaf.blockAnchor.startsWith('section:')).map((leaf)=>leaf.blockAnchor.slice('section:'.length)))]
 const detail=JSON.parse(await readFile(resolve('public/person-details/person-0002.json'),'utf8'))
 assert.deepEqual(sections,PERSON_SECTION_ORDER.filter((label)=>detail.sections[label]))
 const hidden=catalog.documents['PERSON:person-0998'],hiddenLeaves=hidden.revisions[hidden.currentRevision].leaves;assert.equal(hiddenLeaves.some((leaf)=>leaf.blockAnchor==='section:신념'),false)
 const envelope=JSON.parse(await readFile(resolve('lore/characters/Cast-State-01.json'),'utf8')),mutatedDetail=structuredClone(detail);envelope.content[6].text.ko[1].text=` ${detail.sections['생애']}`;mutatedDetail.sections['관직']=detail.sections['생애']
 const duplicate=personFeedbackRecord({envelope,personId:detail.id,route:detail.detailRoute,headingText:`인물 ${detail.name}`,locale:'ko',sections:mutatedDetail.sections}),life=duplicate.leaves.find((leaf)=>leaf.leafId==='section:생애:paragraph:0'),office=duplicate.leaves.find((leaf)=>leaf.leafId==='section:관직:paragraph:0')
 assert.equal(life.sourceSpans[0].path,'/content/5/items/3/ko/2/text');assert.equal(office.sourceSpans[0].path,'/content/6/text/ko/1/text')
})

test('actual reader-order multi-section selection passes df9 and reverse order fails', async (t) => {
 const catalogPath=resolve('src/generated-private/feedback-selectable-views.ko.json'),catalog=JSON.parse(await readFile(catalogPath,'utf8')),document=catalog.documents['PERSON:person-0002'],leaves=document.revisions[document.currentRevision].leaves
 const make=(leaf)=>({blockAnchor:leaf.blockAnchor,blockKind:leaf.blockKind,leafId:leaf.leafId,exactQuote:leaf.text,prefix:'',suffix:'',range:{start:0,end:Array.from(leaf.text).length,unit:'unicode-code-point'},sourceSpans:leaf.sourceSpans.map(({path,start,end,unit})=>({path,start,end,unit}))})
 const office=make(leaves.find((leaf)=>leaf.leafId==='section:관직:paragraph:0')),martial=make(leaves.find((leaf)=>leaf.leafId==='section:무공:paragraph:0')),base={schemaVersion:'feedback-anchor.v1',documentId:document.documentId,route:document.route,locale:'ko',sourceRevision:document.currentRevision}
 const root=await mkdtemp(join(tmpdir(),'feedback-person-order-'));t.onTestFinished(()=>rm(root,{recursive:true,force:true}));const service=process.env.FEEDBACK_SERVICE_ROOT??'/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-reader-quality-feedback-service-u3/TOOL/feedback-service',child=spawn(process.execPath,[resolve(service,'src/server.mjs')],{env:{...process.env,NODE_ENV:'test',FEEDBACK_AUTH_PROVIDER:'test',FEEDBACK_DB_PATH:join(root,'feedback.sqlite'),FEEDBACK_REDACTION_JOURNAL_PATH:join(root,'authority/redactions.jsonl'),FEEDBACK_SELECTABLE_VIEW_PATH:catalogPath,FEEDBACK_SESSION_SECRET:'o'.repeat(48),FEEDBACK_REVIEWER_IDS:'900',FEEDBACK_PORT:'0'},stdio:['ignore','pipe','pipe']});t.onTestFinished(()=>{if(child.exitCode===null)child.kill('SIGTERM')});const ready=await waitLine(child.stdout,'FEEDBACK_READY '),url=ready.slice(15).replace('/api/feedback/health',''),auth=await fetch(`${url}/api/feedback/auth/test-session`,{method:'POST',headers:{'x-test-github-id':'100','x-test-login':'order'}}),authBody=await auth.json(),cookie=auth.headers.get('set-cookie').split(';')[0];const submit=(selections,key)=>fetch(`${url}/api/feedback/submissions`,{method:'POST',headers:{cookie,'x-csrf-token':authBody.csrfToken,'idempotency-key':key,'content-type':'application/json'},body:JSON.stringify({anchor:{...base,selections},body:'person order',reason:'기타'})});assert.equal((await submit([office,martial],'reader-order')).status,201);assert.equal((await submit([martial,office],'reverse-order')).status,422)
})

const waitLine = (stream, prefix) => new Promise((resolve, reject) => {
  let text = ''
  const onData = (chunk) => { text += chunk; const line = text.split('\n').find((candidate) => candidate.startsWith(prefix)); if (line) { cleanup(); resolve(line) } }
  const onEnd = () => { cleanup(); reject(new Error(`missing ${prefix}: ${text}`)) }
  const cleanup = () => { stream.off('data', onData); stream.off('end', onEnd) }
  stream.on('data', onData); stream.on('end', onEnd)
})

test('actual generated private catalog validates through the confirmed U3 HTTP process', async (t) => {
  const catalogPath = resolve('src/generated-private/feedback-selectable-views.ko.json')
  const englishCatalog = JSON.parse(await readFile(resolve('src/generated-private/feedback-selectable-views.en.json'), 'utf8')); assert.ok(Object.values(englishCatalog.documents).every((value) => value.locale === 'en' && value.route.startsWith('/en/')))
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  const document = Object.values(catalog.documents).find((value) => value.locale === 'ko' && Object.values(value.revisions)[0].leaves.some((leaf) => leaf.sourceSpans.length > 1))
  assert.ok(document)
  const [revision, revisionValue] = Object.entries(document.revisions)[0]
  const leaf = revisionValue.leaves.find((candidate) => candidate.sourceSpans.length > 1)
  const end = Math.min(3, Array.from(leaf.text).length)
  const selectionSpans = leaf.sourceSpans.flatMap((span) => { const start = Math.max(0, span.textStart), stop = Math.min(end, span.textEnd); return start >= stop ? [] : [{ path: span.path, start: span.start + start - span.textStart, end: span.start + stop - span.textStart, unit: 'unicode-code-point' }] })
  const anchor = { schemaVersion: 'feedback-anchor.v1', documentId: document.documentId, route: document.route, locale: document.locale, sourceRevision: revision, selections: [{ blockAnchor: leaf.blockAnchor, blockKind: leaf.blockKind, leafId: leaf.leafId, exactQuote: Array.from(leaf.text).slice(0, end).join(''), prefix: '', suffix: Array.from(leaf.text).slice(end, end + 32).join(''), range: { start: 0, end, unit: 'unicode-code-point' }, sourceSpans: selectionSpans }] }
  const root = await mkdtemp(join(tmpdir(), 'feedback-catalog-http-'))
  t.onTestFinished(() => rm(root, { recursive: true, force: true }))
  const service = process.env.FEEDBACK_SERVICE_ROOT ?? '/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-reader-quality-feedback-service-u3/TOOL/feedback-service'
  const child = spawn(process.execPath, [resolve(service, 'src/server.mjs')], { env: { ...process.env, NODE_ENV: 'test', FEEDBACK_AUTH_PROVIDER: 'test', FEEDBACK_DB_PATH: join(root, 'feedback.sqlite'), FEEDBACK_REDACTION_JOURNAL_PATH: join(root, 'authority/redactions.jsonl'), FEEDBACK_SELECTABLE_VIEW_PATH: catalogPath, FEEDBACK_SESSION_SECRET: 'c'.repeat(48), FEEDBACK_REVIEWER_IDS: '900', FEEDBACK_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] })
  t.onTestFinished(() => { if (child.exitCode === null) child.kill('SIGTERM') })
  const ready = await waitLine(child.stdout, 'FEEDBACK_READY ')
  const base = ready.slice('FEEDBACK_READY '.length).replace('/api/feedback/health', '')
  const authResponse = await fetch(`${base}/api/feedback/auth/test-session`, { method: 'POST', headers: { 'x-test-github-id': '100', 'x-test-login': 'catalog-test' } })
  const authBody = await authResponse.json(); const cookie = authResponse.headers.get('set-cookie').split(';')[0]
  const submit = async (value, key) => fetch(`${base}/api/feedback/submissions`, { method: 'POST', headers: { cookie, 'x-csrf-token': authBody.csrfToken, 'idempotency-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ anchor: value, body: 'catalog integration', reason: '기타' }) })
  assert.equal((await submit(anchor, 'catalog-valid')).status, 201)
  const states=catalog.documents['DOC:Sixteen-States'],statesLeaf=states.revisions[states.currentRevision].leaves.find((value)=>value.leafId==='table:cell:15:5');const statesAnchor={schemaVersion:'feedback-anchor.v1',documentId:states.documentId,route:states.route,locale:'ko',sourceRevision:states.currentRevision,selections:[{blockAnchor:statesLeaf.blockAnchor,blockKind:statesLeaf.blockKind,leafId:statesLeaf.leafId,exactQuote:statesLeaf.text,prefix:'',suffix:'',range:{start:0,end:Array.from(statesLeaf.text).length,unit:'unicode-code-point'},sourceSpans:statesLeaf.sourceSpans.map(({path,start,end,unit})=>({path,start,end,unit}))}]};assert.equal((await submit(statesAnchor,'catalog-states-date')).status,201)
  const changed=JSON.parse(await readFile(resolve('lore/factions/Sixteen-States.json'),'utf8'));changed.content[7].rows[14][5].ko+=' 변경';const staleFromMutation=structuredClone(statesAnchor);staleFromMutation.sourceRevision=canonicalRevision(changed);const changedResponse=await submit(staleFromMutation,'catalog-source-mutated');assert.equal(changedResponse.status,422);assert.equal((await changedResponse.json()).error.code,'source-changed')
  const wrong = structuredClone(anchor); wrong.selections[0].sourceSpans[0].end += 1
  assert.equal((await submit(wrong, 'catalog-wrong')).status, 422)
  const stale = structuredClone(anchor); stale.sourceRevision = 'f'.repeat(64)
  const staleResponse = await submit(stale, 'catalog-stale'); assert.equal(staleResponse.status, 422); assert.equal((await staleResponse.json()).error.code, 'source-changed')
})
