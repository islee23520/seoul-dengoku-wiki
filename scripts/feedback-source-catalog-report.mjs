import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const sha=(value)=>createHash('sha256').update(value).digest('hex')
const result={schemaVersion:'feedback-source-catalog-report.v1',catalogs:{},coverage:{},exclusions:{apiDerivedSheets:'excluded: GurpsSection/ValuesDesireSection are outside the feedback selector and have no catalog leaves'},baselines:{serviceCommit:'df9da19d540d46cd4aa9de9721aec3cf5ef19287',u2Candidate:'8195406a3350b02346bfd4eb4c89e80d399d097b'}}
for(const locale of ['ko','en']){const path=resolve(root,`src/generated-private/feedback-selectable-views.${locale}.json`),bytes=await readFile(path);const catalog=JSON.parse(bytes);const kinds={};let leaves=0,spans=0,multiSpanLeaves=0,persons=0;for(const document of Object.values(catalog.documents)){if(document.documentId.startsWith('PERSON:'))persons++;for(const leaf of document.revisions[document.currentRevision].leaves){leaves++;spans+=leaf.sourceSpans.length;if(leaf.sourceSpans.length>1)multiSpanLeaves++;kinds[leaf.blockKind]=(kinds[leaf.blockKind]??0)+1}}result.catalogs[locale]={path:`src/generated-private/feedback-selectable-views.${locale}.json`,bytes:(await stat(path)).size,sha256:sha(bytes),documents:Object.keys(catalog.documents).length,persons,leaves,spans,multiSpanLeaves,kinds}}
for(const path of ['scripts/feedback-source-catalog.mjs','scripts/generate-catalog.mjs','scripts/test-feedback-source-catalog.mjs']){const bytes=await readFile(resolve(root,path));result.coverage[path]={sha256:sha(bytes),bytes:bytes.length}}
const target=process.argv[2]??resolve(root,'.omo/taskU3catalog/source-catalog-report.json');await mkdir(dirname(target),{recursive:true});await writeFile(target,`${JSON.stringify(result,null,2)}\n`);console.log(`FEEDBACK_CATALOG_REPORT ${target}`)
