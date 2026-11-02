#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,checked} from './workflow.mjs';
import {measuredRegistration} from './math-adapter.mjs';

export async function prepareMathEdit(layoutPath,reviewPath,registryPath,outputImage,requestPath,{masterOnly=false}={}) {
  const layoutBytes=await readFile(layoutPath),layout=JSON.parse(layoutBytes);
  if(layout.schema==='anatomy-completion-layout.r1') {
    if(!masterOnly)throw new Error('completion requires --master-only');
    const registryBytes=await readFile(registryPath),registry=JSON.parse(registryBytes),subject=registry.entries.find(e=>e.personId==='person-1003');
    const source={path:resolve(registryPath,'../'+subject.image.path),sha256:subject.image.sha256};
    const templatePath=fileURLToPath(new URL('./templates.json',import.meta.url)),bytes=await readFile(templatePath),template=JSON.parse(bytes);
    const request={schema:'paperdoll-masked-edit.v1',layout:{path:resolve(layoutPath),sha256:hash(layoutBytes)},editLayoutReview:{path:resolve(reviewPath),sha256:hash(await readFile(reviewPath))},personId:'person-1003',characterId:'K1003',source,registry:{path:resolve(registryPath),sha256:hash(registryBytes)},master:layout.files['registered-completion-master.png'],mask:layout.files['api-completion-mask.png'],referenceRoles:['registered-editable-master'],maskSemantics:'alpha-zero-editable-first-image',stage:'anatomy-completion',prompt:template.masterOnlyCommon+'\n'+template.stages['anatomy-completion'],template:{path:templatePath,sha256:hash(bytes)},output:resolve(outputImage),size:layout.canvas.join('x')};
    await writeFile(requestPath,JSON.stringify(request,null,2)+'\n',{flag:'wx'});return {status:'prepared-completion-not-posted',requestPath:resolve(requestPath)};
  }
  if(layout.schema!=='paperdoll-mathematical-edit-layout.r2')throw new Error('corrected actual mathematical layout r2 required');
  await measuredRegistration(layout.mathematicalAudit,layout.source.sha256);
  const master=layout.files['registered-master-native.png'],mask=layout.files['api-edit-mask-native.png'];
  await checked(master);await checked(mask);
  const templatePath=fileURLToPath(new URL('./templates.json',import.meta.url)),bytes=await readFile(templatePath),template=JSON.parse(bytes);
  const registryBytes=await readFile(registryPath);
  // Review path may not exist yet: preparation never manufactures approval.
  let reviewSha256=null;try{reviewSha256=hash(await readFile(reviewPath));}catch(e){if(e.code!=='ENOENT')throw e;}
  const request={schema:'paperdoll-masked-edit.v1',layout:{path:resolve(layoutPath),sha256:hash(layoutBytes)},editLayoutReview:{path:resolve(reviewPath),sha256:reviewSha256},personId:'person-1003',characterId:'K1003',source:layout.source,registry:{path:resolve(registryPath),sha256:hash(registryBytes)},master,mask,referenceRoles:['registered-editable-master','same-recipient-identity-technique'],maskSemantics:'alpha-zero-editable-first-image',stage:'anatomy-master',prompt:template.maskedEditCommon+'\n'+template.stages['anatomy-master'],template:{path:templatePath,sha256:hash(bytes)},output:resolve(outputImage),size:layout.nativeCanvas.join('x')};
  if(masterOnly){request.referenceRoles=['registered-editable-master'];request.stage='anatomy-master-only';request.prompt=template.masterOnlyCommon+'\n'+template.stages['anatomy-master-only'];}
  await writeFile(requestPath,JSON.stringify(request,null,2)+'\n',{flag:'wx'});
  return {status:reviewSha256?'prepared-review-validation-at-dispatch':'prepared-not-dispatchable-review-missing',requestPath:resolve(requestPath)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{if(!(process.argv.length===7||process.argv.length===8&&process.argv[7]==='--master-only'))throw new Error('Usage: prepare-math-edit.mjs LAYOUT REVIEW REGISTRY OUTPUT_IMAGE REQUEST [--master-only]');console.log(JSON.stringify(await prepareMathEdit(...process.argv.slice(2,7).map(p=>resolve(p)),{masterOnly:process.argv[7]==='--master-only'})));}
  catch(e){console.error(e.message);process.exitCode=2;}
}
