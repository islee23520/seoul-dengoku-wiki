#!/usr/bin/env node
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,dirname,basename,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readCurrentMachineConnection,readConnectionConfig,resolveConnection} from '../image-connection.mjs';
import {decodeCodexPng} from '../codex-image.mjs';
import {strictJSONParse} from '../design-prompt.mjs';
import {checked,hash,canonical,geometryCheck} from './workflow.mjs';
import {measuredRegistration} from './math-adapter.mjs';
import {ownershipPng} from './ownership-png.mjs';

const assert=(value,message)=>{if(!value)throw new Error(message);};
const json=async path=>strictJSONParse((await readFile(path)).toString('utf8'));
const absent=async path=>{try{await access(path);}catch(e){if(e.code==='ENOENT')return;throw e;}throw new Error('refusing overwrite: '+path);};
const save=async(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});

// Explicit invocation only. Never retries a POST or removes a dispatch claim.
export async function maskedEdit(requestPath,{connectionConfig,checkOnly=false}={}) {
  const request=await json(requestPath);
  assert(request.schema==='paperdoll-masked-edit.v1','unsupported masked edit request');
  assert(Object.keys(request).every(k=>['schema','config','layout','editLayoutReview','personId','characterId','source','registry','master','mask','referenceRoles','maskSemantics','stage','prompt','template','output','size'].includes(k)),'unknown request field');
  const masterOnly=canonical(request.referenceRoles)===canonical(['registered-editable-master']);
  assert(masterOnly||canonical(request.referenceRoles)===canonical(['registered-editable-master','same-recipient-identity-technique']),'exact upload roles required');
  if(request.layout) {
    const layout=strictJSONParse((await checked(request.layout)).toString('utf8'));
    if(layout.schema==='anatomy-completion-layout.r1') {
      assert(masterOnly && request.stage==='anatomy-completion' && layout.canvas.join('x')===request.size,'completion uses one registered master and exact canvas');
      assert(canonical(layout.files['registered-completion-master.png'])===canonical(request.master) && canonical(layout.files['api-completion-mask.png'])===canonical(request.mask),'completion artifact mismatch');
      const ownership=ownershipPng(await checked(layout.files['protected-face-alpha.png'])),api=decodeCodexPng(await checked(request.mask));
      assert(ownership.width===api.width&&ownership.height===api.height,'completion ownership dimensions mismatch');
      assert(!ownership.owned.some((v,i)=>v>0&&api.pixels[i*4+3]===0),'completion editable face intersection');
      const review=strictJSONParse((await checked(request.editLayoutReview)).toString('utf8'));
      assert(review.verdict==='APPROVED_EDIT_INPUT_ONLY' && review.layoutSha256===request.layout.sha256 && review.masterSha256===request.master.sha256 && review.maskSha256===request.mask.sha256 && review.reviewer,'completion root review binding mismatch');
      for(const image of review.reviewedFiles)await checked(image);
      for(const artifact of Object.values(layout.files))await checked(artifact);
    } else {
    assert(layout.schema==='paperdoll-mathematical-edit-layout.r2' && layout.status==='READY_FOR_ROOT_MASK_REVIEW_NOT_DISPATCH_APPROVAL','corrected actual anatomy edit layout r2 required');
    const measured=await measuredRegistration(layout.mathematicalAudit,request.source.sha256);
    assert(canonical(layout.source)===canonical(request.source) && canonical(layout.headFit)===canonical(measured.headFit) && canonical(layout.torsoGarmentProxyFit)===canonical(measured.torsoGarmentProxyFit) && canonical(layout.neckConstraint)===canonical(measured.neckConstraint),'layout math/source binding mismatch');
    assert(canonical(layout.files['registered-master-native.png'])===canonical(request.master) && canonical(layout.files['api-edit-mask-native.png'])===canonical(request.mask),'actual layout master/mask mismatch');
    assert(layout.faceProtection?.workingOwnership && layout.faceProtection.intentionalFaceSeamEdits===false,'exact transformed source face ownership required');
    await checked(layout.faceProtection.sourceOwnership);
    const protectedFace=ownershipPng(await checked(layout.faceProtection.workingOwnership)),editMask=decodeCodexPng(await checked(request.mask));
    assert(protectedFace.width*2===editMask.width && protectedFace.height*2===editMask.height,'protected face mask registration mismatch');
    for(let y=0;y<editMask.height;y++)for(let x=0;x<editMask.width;x++)assert(!(protectedFace.owned[Math.floor(y/2)*protectedFace.width+Math.floor(x/2)]>0 && editMask.pixels[(y*editMask.width+x)*4+3]===0),'API editable pixels intersect protected source face');
    assert(layout.nativeUniformScale===2 && layout.workingCanvas[0]*2===layout.nativeCanvas[0] && layout.workingCanvas[1]*2===layout.nativeCanvas[1],'uniform native registration mismatch');
    await checked(layout.sourceLandmarks);await checked(layout.directComparison);
    const review=strictJSONParse((await checked(request.editLayoutReview)).toString('utf8'));
    assert(review.verdict==='APPROVED_EDIT_REGION_LAYOUT' && review.layoutSha256===request.layout.sha256 && review.reportSha256===layout.mathematicalAudit.sha256 && review.masterSha256===request.master.sha256 && review.maskSha256===request.mask.sha256 && review.protectedFaceMaskSha256===layout.faceProtection.workingOwnership.sha256 && review.sourceSha256===request.source.sha256 && review.reviewer && review.overlay,'exact registered edit-layout review required');
    await checked(review.overlay);
    assert(request.stage===(masterOnly?'anatomy-master-only':'anatomy-master') && request.personId==='person-1003' && request.characterId==='K1003','initial anatomy layout identity/stage mismatch');
    assert(layout.nativeCanvas.join('x')===request.size,'layout native size mismatch');
    }
  } else {
  const config=strictJSONParse((await checked(request.config)).toString('utf8'));
  const geometryBytes=await checked(config.geometry),geometryRecord=strictJSONParse(geometryBytes.toString('utf8'));
  const audit=geometryRecord.mathematicalAudit;
  assert(audit?.kind==='reference-constraint-solve' && audit.status==='ROOT_REVIEWED_NUMERIC_AND_OVERLAY','mathematical reference audit and direct overlay review required; B aesthetic selection withdrawn');
  await measuredRegistration(audit.report,request.source.sha256);
  await checked(audit.overlay);await checked(audit.rootReview);
  assert(audit.sourceSha256===request.source.sha256 && audit.masterSha256===request.master.sha256 && audit.maskSha256===request.mask.sha256,'numeric audit source/master/mask binding mismatch');
  const rootReview=strictJSONParse((await checked(audit.rootReview)).toString('utf8'));
  assert(rootReview.verdict==='ROOT_REVIEWED_NUMERIC_AND_OVERLAY' && rootReview.reportSha256===audit.report.sha256 && rootReview.overlaySha256===audit.overlay.sha256,'stale mathematical/overlay review');
  const editLayout=geometryRecord.status==='APPROVED_EDIT_REGION_LAYOUT';
  const geometry=await geometryCheck(config,{draft:editLayout});
  if(editLayout) {
    const approval=geometry.editApproval;
    assert(approval?.verdict==='APPROVED_EDIT_REGION_LAYOUT' && approval.reviewer && approval.masterSha256===request.master.sha256 && approval.maskSha256===request.mask.sha256 && approval.sourceSha256===request.source.sha256,'exact source/master/mask edit-layout approval required');
    await checked(approval.evidence);
    assert(geometry.lifecycle==='registered-edit-layout','registered edit-layout lifecycle required');
  }
  assert(geometry.master && canonical(geometry.master)===canonical(request.master),'registered master binding mismatch');
  assert(geometry.editMasks?.[request.stage] && canonical(geometry.editMasks[request.stage])===canonical(request.mask),'approved stage edit mask binding mismatch');
  assert(request.maskSemantics==='alpha-zero-editable-first-image','explicit API mask alpha semantics required');
  assert(config.subjects.some(s=>s.personId===request.personId && s.characterId===request.characterId),'wrong source identity');
  }
  assert(request.maskSemantics==='alpha-zero-editable-first-image','explicit API mask alpha semantics required');
  const source=await checked(request.source), registry=strictJSONParse((await checked(request.registry)).toString('utf8'));
  const subject=registry.entries?.find(s=>s.personId===request.personId);
  assert(subject?.characterId===request.characterId && subject.image?.sha256===request.source.sha256 && resolve(dirname(request.registry.path),subject.image.path)===request.source.path,'source registry mismatch');
  const masterBytes=await checked(request.master), maskBytes=await checked(request.mask);
  const master=decodeCodexPng(masterBytes),mask=decodeCodexPng(maskBytes);
  assert(maskBytes.length<4*1024*1024 && mask.channels===4 && mask.width===master.width && mask.height===master.height,'mask PNG dimensions/alpha/size mismatch');
  assert(mask.pixels.some((v,i)=>i%4===3&&v===0)&&mask.pixels.some((v,i)=>i%4===3&&v===255),'mask requires editable and preserved pixels');
  assert(source.length<50*1024*1024 && masterBytes.length<50*1024*1024,'image exceeds API size limit');
  const template=await checked(request.template);
  assert(request.template.path===fileURLToPath(new URL('./templates.json',import.meta.url)),'unknown template');
  const templates=strictJSONParse(template.toString('utf8'));
  assert(Object.hasOwn(templates.stages,request.stage) && typeof request.prompt==='string' && request.prompt===(masterOnly?templates.masterOnlyCommon:templates.maskedEditCommon)+'\n'+templates.stages[request.stage],'prompt/template mismatch');
  const match=/^(\d+)x(\d+)$/.exec(request.size);const width=Number(match?.[1]),height=Number(match?.[2]);
  assert(width%16===0&&height%16===0&&width*height>=655360&&width*height<=8294400&&width<=3840&&height<=3840&&width/height>=1/3&&width/height<=3,'unsupported native dimensions');
  assert(width===master.width&&height===master.height,'native request must match registered transport master; no implicit resize');
  assert(isAbsolute(request.output)&&request.output.endsWith('.png')&&![request.source.path,request.master.path,request.mask.path].includes(request.output),'new absolute output required');
  if(checkOnly) return {status:'local-guards-pass-no-post',requestSha256:hash(canonical(request)),masterSha256:request.master.sha256,maskSha256:request.mask.sha256,size:request.size};
  const selected=connectionConfig ? resolveConnection(await readConnectionConfig({connectionConfig})) : await readCurrentMachineConnection();
  assert(selected.provider==='openai-compatible'&&selected.imageModel==='gpt-image-2.5-sunburst','existing Sunburst resolver required');
  assert(![selected.apiKey,selected.translation?.apiKey].filter(Boolean).some(key=>JSON.stringify(request).includes(key)),'secret in request');
  for(const path of [request.output,request.output+'.dispatch.json',request.output+'.response.json',request.output+'.receipt.json',request.output+'.native.png']) await absent(path);
  await mkdir(dirname(request.output),{recursive:true});
  const bindingSha256=hash(canonical(request));
  await save(request.output+'.dispatch.json',{schema:'paperdoll-mask-dispatch.v1',bindingSha256,request,status:'attempted-no-automatic-retry',templateVersion:templates.version,reviewState:'unreviewed'});
  const form=new FormData();
  for(const [key,value] of Object.entries({model:selected.imageModel,prompt:request.prompt,n:'1',size:request.size,background:'transparent',output_format:'png'}))form.set(key,value);
  form.append('image[]',new Blob([masterBytes],{type:'image/png'}),basename(request.master.path));
  if(!masterOnly)form.append('image[]',new Blob([source],{type:'image/png'}),basename(request.source.path));
  form.append('mask',new Blob([maskBytes],{type:'image/png'}),basename(request.mask.path));
  let response;
  try {response=await fetch(selected.baseUrl.replace(/\/$/,'')+'/images/edits',{method:'POST',headers:selected.apiKey?{Authorization:'Bearer '+selected.apiKey}:{},body:form,signal:AbortSignal.timeout(300000)});}
  catch {await save(request.output+'.receipt.json',{bindingSha256,status:'transport-uncertain-do-not-retry',reviewState:'unreviewed'});throw new Error('transport uncertain; claim retained, no retry');}
  const raw=await response.text();
  // Preserve the native response unless it contains an actual resolved credential.
  if([selected.apiKey,selected.translation?.apiKey].filter(Boolean).some(key=>raw.includes(key))) {await save(request.output+'.receipt.json',{bindingSha256,status:'rejected-secret-in-provider-response',reviewState:'unreviewed'});throw new Error('provider response contains credential; not persisted');}
  await writeFile(request.output+'.response.json',raw,{flag:'wx',mode:0o600});
  let result,status='rejected',nativeSha256=null,validationFailure=null;
  try {
    assert(response.ok,'HTTP '+response.status);result=strictJSONParse(raw);
    assert(result.data?.length===1&&typeof result.data[0].b64_json==='string','expected one native image');
    const bytes=Buffer.from(result.data[0].b64_json,'base64');nativeSha256=hash(bytes);
    await writeFile(request.output+'.native.png',bytes,{flag:'wx'});
    assert(result.model===undefined||result.model===selected.imageModel,'response model mismatch');
    const image=decodeCodexPng(bytes);
    assert(image.width===width&&image.height===height&&image.channels===4&&image.pixels.some((v,i)=>i%4===3&&v===0)&&image.pixels.some((v,i)=>i%4===3&&v===255),'native dimensions/alpha mismatch');
    await writeFile(request.output,bytes,{flag:'wx'});status='candidate-unreviewed';
  } catch(error) {validationFailure=error.message;}
  const receipt={schema:'paperdoll-mask-result.v1',bindingSha256,httpStatus:response.status,responseSha256:hash(raw),nativeSha256,status,validationFailure,reviewState:'unreviewed'};
  await save(request.output+'.receipt.json',receipt);assert(status==='candidate-unreviewed','native response rejected; preserved response/claim, no retry');return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {assert(process.argv.length===3 || process.argv.length===4&&process.argv[3]==='--check','Usage: masked-edit.mjs REQUEST_JSON [--check]');console.log(JSON.stringify(await maskedEdit(resolve(process.argv[2]),{checkOnly:process.argv[3]==='--check'})));}
  catch(error){console.error(error.message);process.exitCode=2;}
}
