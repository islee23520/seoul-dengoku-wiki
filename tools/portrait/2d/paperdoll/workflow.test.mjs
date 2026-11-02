import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { prepare, finalize, checkEntry, hash, canonical, reviewBinding, validatePlan, pngBytes } from './workflow.mjs';
import { portraitPng } from '../test-fixtures/connection.mjs';

const cli = new URL('./workflow.mjs',import.meta.url).pathname;
const configPath = new URL('./config.json',import.meta.url).pathname;
const fixtureMovement={start:{x:0,y:0,z:0},end:{x:1,y:0,z:0},sampleOffset:{x:0,y:0,z:1},cameraPosition:{x:0,y:0,z:-10},portraitSize:{x:1,y:1},speed:1,orthographicSize:2};
const encode = object => JSON.stringify(object,null,2)+'\n';
async function write(path,value) { await mkdir(join(path,'..'),{recursive:true}); await writeFile(path,typeof value === 'object' && !Buffer.isBuffer(value) ? encode(value) : value); }
async function ref(path,value) {await write(path,value); return {path,sha256:hash(await readFile(path))};}
async function invoke(args) {
  const child = spawn(process.execPath,[cli,...args],{stdio:['ignore','pipe','pipe']});
  const closed = once(child,'close',{signal:AbortSignal.timeout(30000)});
  let stdout='',stderr=''; child.stdout.on('data',b=>stdout+=b); child.stderr.on('data',b=>stderr+=b);
  const [code] = await closed; return {code,stdout,stderr};
}
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(),'paperdoll-synthetic-not-runtime-art-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const config = JSON.parse(await readFile(configPath,'utf8'));
  config.canvas={width:16,height:16};
  const master=await ref(join(dir,'synthetic-master.png'),portraitPng(16,16));
  const parts=[];
  for(const [index,role] of config.roles.entries()) {const pixels=Buffer.alloc(16*16*4);pixels[index*4+3]=255;const partMask=await ref(join(dir,role+'-mask.png'),pngBytes(16,16,pixels));parts.push({role,cropRect:[0,0,16,16],logicalSize:[16,16],pivot:[8,8],sourceAnchor:[8,8],targetAnchor:[8,8],neckSeamOwnership:role==='body'?'owns':'not-owned',transform:[1,0,0,1,0,0],transformProvenance:'synthetic identity transform; no auto-fit',mask:partMask,occupiedBounds:[index,0,1,1],occludes:[]});}
  const geometry={schema:'paperdoll-geometry.v1',status:'approved',approval:{verdict:'pass',reviewer:'synthetic fixture only',evidence:await ref(join(dir,'synthetic-approval.json'),{fixtureOnly:true})},coordinateSystem:'pixels-top-left-x-right-y-down',canvas:config.canvas,measurementEvidence:'synthetic geometry fixture only',reference:master,master,masterScale:1,neckOwner:'body',occlusionOrder:config.roles,parts};
  config.geometry=await ref(join(dir,'synthetic-geometry.json'),geometry);
  const contract={contractVersion:4,receiptType:'Janseon.Data.Opening.PortraitPaperDollReceipt',orderedRoles:config.roles,subjects:config.subjects.map((s,i)=>({...s,sourceSha256:hash(portraitPng(16+i,16)),sourceSize:{x:16+i,y:16}})),receiptSchema:{slot:{const:'portrait-paperdoll-poc'},reviewVerdict:{const:'pass'},movementStage:{speed:'positive float'},entries:{item:{}}}};
  const envelope={integrity:{algorithm:'sha256',scope:'UTF-8 JSON.stringify(contract,null,2) plus LF; insertion order as stored',sha256:hash(JSON.stringify(contract,null,2)+'\n')},contract};
  config.unityContract=await ref(join(dir,'synthetic-contract.json'),envelope);
  const configRef=await ref(join(dir,'config.json'),config);
  const registry={entries:[]};
  for(const [i,subject] of config.subjects.entries()) {
    const path=join(dir,subject.personId+'.png'), bytes=portraitPng(16+i,16);
    await write(path,bytes); registry.entries.push({...subject,image:{path:subject.personId+'.png',sha256:hash(bytes)}});
  }
  const registryRef=await ref(join(dir,'registry.json'),registry);
  const batch={schema:'paperdoll-batch.v1',config:configRef,entries:[],movementStage:fixtureMovement};
  for(const subject of config.subjects) {
    const original=registry.entries.find(e=>e.personId===subject.personId);
    const input={schema:'paperdoll-input.v1',...subject,adult:true,sameOwnerRecipient:true,source:{path:join(dir,subject.personId+'.png'),sha256:original.image.sha256},registry:registryRef,stage:'living',parameters:{background:'transparent'},output:join(dir,subject.personId+'-living.png')};
    const inputPath=join(dir,subject.personId+'-input.json'); await write(inputPath,input);
    const entry={...subject,source:input.source,registry:registryRef,sourceSize:{x:registry.entries.indexOf(original)+16,y:16},normalizationScale:{x:1,y:1},normalizationOffset:{x:0,y:0},layers:[]};
    for(const stage of ['living','deadHead','headlessBody']) {
      input.stage=stage; input.output=join(dir,subject.personId+'-'+stage+'.png'); await write(inputPath,input);
      const plan=await prepare(inputPath,configRef.path);
      const prepared=await ref(join(dir,subject.personId+'-'+stage+'.prepared.json'),plan);
      const [w,h]=plan.parameters.size.split('x').map(Number);
      const native=await ref(join(input.output+'.native','image-001.png'),portraitPng(w,h));
      await write(join(input.output+'.native','preservation.json'),{schema:'native-output-preservation.v1',request:{sourceSnapshot:{prompt:plan.prompt},size:plan.parameters.size,references:['drawing-technique-only','framing-only','recipient-appearance-only'].map(role=>({role,sha256:input.source.sha256}))},outputs:[{path:native.path,imageSha256:native.sha256,outputValidationStatus:'accepted'}]});
      const roles=stage==='living' ? config.roles.slice(0,5) : [stage];
      for(const role of roles) {
        const output=await ref(join(dir,subject.personId+'-'+role+'-export.png'),await readFile(geometry.parts.find(p=>p.role===role).mask.path));
        entry.layers.push({role,...output,prepared,native,processing:{transforms:['synthetic fixture transform only; not runtime art'],masks:[geometry.parts.find(p=>p.role===role).mask],geometrySha256:config.geometry.sha256,partTransform:[1,0,0,1,0,0]}});
      }
    }
    entry.composite={status:'checked',geometrySha256:config.geometry.sha256,reviewer:'synthetic only',layersSha256:hash(canonical(entry.layers)),image:master,evidence:await ref(join(dir,subject.personId+'-synthetic-composite-check.json'),{fixtureOnly:true})};
    await setReview(dir,entry); batch.entries.push(entry);
  }
  const batchPath=join(dir,'batch.json'); await write(batchPath,batch);
  return {dir,config,configRef,batch,batchPath,inputPath:join(dir,'person-1003-input.json')};
}
async function setReview(dir,entry) {
  entry.review=await ref(join(dir,entry.personId+'-synthetic-review.json'),{schema:'paperdoll-review.v1',verdict:'pass',scope:'APPROVED_FINAL_ART',movementSha256:hash(canonical(fixtureMovement)),reviewer:'synthetic fixture reviewer, NOT actual artwork approval',evidence:'synthetic contract fixture only; not runtime art',personId:entry.personId,characterId:entry.characterId,sourceSha256:entry.source.sha256,bindingSha256:reviewBinding(entry)});
}

test('deterministic prepare is separate from dispatch, explicit stages and no-overwrite CLI',async t=>{
  const f=await fixture(t);
  const first=await prepare(f.inputPath,f.configRef.path), second=await prepare(f.inputPath,f.configRef.path);
  assert.deepEqual(first,second); assert.equal(first.status,'prepared-not-dispatched');
  assert.equal(first.input.personId,'person-1003'); assert.equal(first.templateSha256.length,64);
  await validatePlan(first);
  const input=JSON.parse(await readFile(f.inputPath,'utf8')); input.stage='body-base'; await write(f.inputPath,input);
  assert.equal((await prepare(f.inputPath,f.configRef.path)).input.stage,'body-base');
  const out=join(f.dir,'cli.prepared.json');
  assert.equal((await invoke(['prepare',f.inputPath,out,f.configRef.path])).code,0);
  const again=await invoke(['prepare',f.inputPath,out,f.configRef.path]); assert.equal(again.code,2); assert.match(again.stderr,/EEXIST/);
  await assert.rejects(readFile(input.output),{code:'ENOENT'});
  const tampered=structuredClone(first); tampered.argv[1]='/not-the-source.png';
  const {bindingSha256,...body}=tampered; tampered.bindingSha256=hash(canonical(body));
  await assert.rejects(validatePlan(tampered),/arguments mismatch/);
});

test('source ID, registry, source hash and missing fields reject before execution',async t=>{
  const f=await fixture(t), original=JSON.parse(await readFile(f.inputPath,'utf8'));
  for(const mutate of [i=>i.characterId='K1004',i=>i.source.sha256='a'.repeat(64),i=>i.name='not registered',i=>delete i.parameters,i=>i.adult=false]) {
    const input=structuredClone(original); mutate(input); await write(f.inputPath,input);
    await assert.rejects(prepare(f.inputPath,f.configRef.path));
  }
});

test('actual CLI finalize accepts 21 synthetic PNGs, preserves binding and refuses overwrite',async t=>{
  const f=await fixture(t), out=join(f.dir,'unity.json');
  const preflight=await invoke(['finalize',f.batchPath,out,'--check']); assert.equal(preflight.code,0,preflight.stderr);
  await assert.rejects(readFile(out),{code:'ENOENT'});
  const result=await invoke(['finalize',f.batchPath,out]); assert.equal(result.code,0,result.stderr);
  const receipt=JSON.parse(await readFile(out,'utf8'));
  assert.equal(receipt.entries.length,3); assert.equal(receipt.entries.flatMap(e=>e.layers).length,21);
  assert.deepEqual(receipt.entries.map(e=>e.personId),['person-1003','person-1004','person-1009']);
  assert.equal(receipt.entries[0].reviewSha256,f.batch.entries[0].review.sha256);
  const envelope=JSON.parse(await readFile(f.config.unityContract.path,'utf8'));
  assert.deepEqual(Object.keys(receipt).sort(),['entries','movementStage','reviewVerdict','slot']);
  assert.deepEqual(receipt.movementStage,fixtureMovement);
  for(const [index,entry] of receipt.entries.entries()) {
    assert.deepEqual(entry.sourceSize,envelope.contract.subjects[index].sourceSize);
    assert.deepEqual(entry.normalizationScale,{x:1,y:1});assert.deepEqual(entry.normalizationOffset,{x:0,y:0});
    assert.deepEqual(Object.keys(entry).sort(),['characterId','layers','normalizationOffset','normalizationScale','personId','reviewSha256','sourceSha256','sourceSize']);
  }
  const retry=await invoke(['finalize',f.batchPath,out]); assert.equal(retry.code,2); assert.match(retry.stderr,/EEXIST/);
});

for(const scenario of ['valid','stale-manifest','missing-lineage','wrong-authority','wrong-bounds','unapproved-art','stale-review']) {
  test('reviewed multi-source authored entry '+scenario,async t=>{
    const f=await fixture(t),e=f.batch.entries[0];
    e.layers=e.layers.map(({role,path,sha256})=>({role,path,sha256}));
    const lineage=await ref(join(f.dir,'actual-authoring.json'),{fixtureOnly:true,multipleSources:true,rawPassed:false});
    const m={schema:'paperdoll-art-delivery-candidate.v1',personId:e.personId,characterId:e.characterId,source:e.source,canvas:[16,16],provenance:[lineage],roles:Object.fromEntries(e.layers.map(l=>[l.role,{path:l.path,sha256:l.sha256}]))};
    const manifest=await ref(join(f.dir,'delivery.json'),m);
    const a={schema:'paperdoll-source-bound-poc-art-review.v1',verdict:'ROOT_APPROVED_EXACT_POC_ART_BUNDLE',manifest,source:e.source,scope:{sourceBoundPocArtwork:true}};
    if(scenario==='unapproved-art') a.verdict='pending';
    const artApproval=await ref(join(f.dir,'art-review.json'),a);
    const oldGeometry=JSON.parse(await readFile(f.config.geometry.path,'utf8'));
    const g={schema:'paperdoll-registered-bundle-geometry.v1',manifest,artApproval,canvas:f.config.canvas,registration:'already-registered-common-plane',parts:e.layers.map((l,i)=>({...l,occupiedBounds:oldGeometry.parts[i].occupiedBounds,transform:[1,0,0,1,0,0]}))};
    if(scenario==='wrong-bounds') g.parts[0].occupiedBounds=[0,0,5,5];
    const geometry=await ref(join(f.dir,'registered.json'),g);e.authoredBundle={manifest,artApproval,geometry};
    e.composite.geometrySha256=geometry.sha256;e.composite.layersSha256=hash(canonical(e.layers));
    const authority={schema:'paperdoll-root-entry-authority.v1',verdict:'APPROVED_EXACT_POC_ENTRY_SETTINGS',personId:e.personId,sourceSha256:e.source.sha256,manifest,artApproval,movementStage:fixtureMovement,normalizationScale:e.normalizationScale,normalizationOffset:e.normalizationOffset};
    if(scenario==='wrong-authority') authority.movementStage={...fixtureMovement,speed:2};
    const authorityRef=await ref(join(f.dir,'authority.json'),authority);
    await setReview(f.dir,e);const review=JSON.parse(await readFile(e.review.path,'utf8'));review.authority=authorityRef;e.review=await ref(e.review.path,review);
    if(scenario==='stale-manifest') await write(manifest.path,{...m,personId:'tampered'});
    if(scenario==='missing-lineage') await rm(lineage.path);
    if(scenario==='stale-review') e.normalizationOffset={x:1,y:0};
    f.batch.entries=[e];await write(f.batchPath,f.batch);
    if(scenario==='valid') {const result=await checkEntry(f.batchPath);assert.equal(result.entries[0].layers.length,7);
      await assert.rejects(finalize(f.batchPath,join(f.dir,'no-single-publish.json')),/three distinct/);
      await assert.rejects(readFile(f.batchPath+'.unused-unity.json'),{code:'ENOENT'});
    } else await assert.rejects(checkEntry(f.batchPath));
  });
}

for(const scenario of ['missing-role','wrong-hash','mixed-dimensions','stale-review','wrong-source-ID','pending-contract','missing-processing','wrong-native-hash','wrong-stage','missing-review','missing-mask','stale-composite','missing-geometry','payload-tamper','source-size','missing-normalization','missing-movement','stale-movement','geometry-only-review','legacy-contract','wrong-role-order']) {
  test('finalize rejects '+scenario,async t=>{
    const f=await fixture(t), entry=f.batch.entries[0], layer=entry.layers[0];
    if(scenario==='missing-role') entry.layers.pop();
    if(scenario==='wrong-hash') layer.sha256='a'.repeat(64);
    if(scenario==='mixed-dimensions') {await write(layer.path,portraitPng(17,16)); layer.sha256=hash(await readFile(layer.path));}
    if(scenario==='stale-review') entry.normalizationOffset={x:1,y:0};
    if(scenario==='wrong-source-ID') entry.characterId='K1004';
    if(scenario==='pending-contract') {f.config.unityContract=null; f.batch.config=await ref(f.configRef.path,f.config);}
    if(scenario==='missing-processing') delete layer.processing;
    if(scenario==='wrong-native-hash') layer.native.sha256='b'.repeat(64);
    if(scenario==='wrong-stage') layer.role='deadHead';
    if(scenario==='missing-review') delete entry.review;
    if(scenario==='missing-mask') layer.processing.masks=[];
    if(scenario==='stale-composite') entry.composite.layersSha256='a'.repeat(64);
    if(scenario==='missing-geometry') {f.config.geometry=null; f.batch.config=await ref(f.configRef.path,f.config);}
    if(scenario==='payload-tamper') {const e=JSON.parse(await readFile(f.config.unityContract.path,'utf8'));e.contract.contractVersion=3;f.config.unityContract=await ref(f.config.unityContract.path,e);f.batch.config=await ref(f.configRef.path,f.config);}
    if(scenario==='source-size') entry.sourceSize={x:99,y:99};
    if(scenario==='missing-normalization') delete entry.normalizationScale;
    if(scenario==='missing-movement') delete f.batch.movementStage;
    if(scenario==='stale-movement') f.batch.movementStage={...fixtureMovement,speed:2};
    if(scenario==='legacy-contract') {
      const e=JSON.parse(await readFile(f.config.unityContract.path,'utf8'));e.contract.contractVersion=3;
      e.integrity.sha256=hash(JSON.stringify(e.contract,null,2)+'\n');
      f.config.unityContract=await ref(f.config.unityContract.path,e);f.batch.config=await ref(f.configRef.path,f.config);
    }
    if(scenario==='wrong-role-order') {
      [f.config.roles[0],f.config.roles[1]]=[f.config.roles[1],f.config.roles[0]];
      f.batch.config=await ref(f.configRef.path,f.config);
    }
    if(!['stale-composite'].includes(scenario)) entry.composite.layersSha256=hash(canonical(entry.layers));
    if(!['stale-review','missing-review'].includes(scenario)) await setReview(f.dir,entry);
    if(scenario==='geometry-only-review') {
      const review=JSON.parse(await readFile(entry.review.path,'utf8'));review.scope='ROOT_ACCEPTED_POC_COMPONENT_GEOMETRY_ONLY';entry.review=await ref(entry.review.path,review);
    }
    await write(f.batchPath,f.batch);
    const out=join(f.dir,'must-not-exist.json');
    await assert.rejects(finalize(f.batchPath,out));
    await assert.rejects(readFile(out),{code:'ENOENT'});
  });
}

test('invalid finalize CLI is explicit and writes no completion receipt',async t=>{
  const f=await fixture(t); f.batch.entries=[]; await write(f.batchPath,f.batch);
  const result=await invoke(['finalize',f.batchPath,join(f.dir,'invalid.json')]);
  assert.equal(result.code,2); assert.match(result.stderr,/three distinct/);
});

test('preview assembles registered masks; dispatch rejects legacy prepared-only input',async t=>{
  const f=await fixture(t), out=join(f.dir,'template.png');
  const result=await invoke(['preview',f.configRef.path,out]); assert.equal(result.code,0,result.stderr);
  const receipt=JSON.parse(await readFile(out+'.json','utf8'));
  assert.equal(receipt.geometrySha256,f.config.geometry.sha256);
  assert.equal(receipt.output.sha256,hash(await readFile(out)));
  const frozen=await invoke(['dispatch',f.batch.entries[0].layers[0].prepared.path]);
  assert.equal(frozen.code,2);assert.match(frozen.stderr,/unsupported masked edit request/);
});

for(const scenario of ['anisotropic-coat','independent-body','duplicate-neck','duplicate-hair','unapproved','wrong-occupied-bounds','wrong-anchor']) {
  test('geometry rejects '+scenario,async t=>{
    const f=await fixture(t), geometry=JSON.parse(await readFile(f.config.geometry.path,'utf8'));
    if(scenario==='anisotropic-coat') geometry.parts[3].transform=[1.631,0,0,1.851,0,0];
    if(scenario==='independent-body') geometry.parts[1].transform=[0.718,0,0,0.750,0,0];
    if(scenario==='duplicate-neck') geometry.parts[2].neckSeamOwnership='owns';
    if(scenario==='duplicate-hair') {
      geometry.sourceMasterSha256=masterHashForFixture();
      geometry.states=[{name:'living',roles:['hairBack','body','head','hairFront'],neckOwner:'body'}];
      for(const [index,part] of geometry.parts.entries()) part.sourcePixels=await ref(join(f.dir,part.role+'-ownership.json'),{masterSha256:geometry.sourceMasterSha256,indices:[part.role==='hairFront'?0:index]});
    }
    if(scenario==='unapproved') geometry.status='measured';
    if(scenario==='wrong-occupied-bounds') geometry.parts[0].occupiedBounds=[1,1,8,8];
    if(scenario==='wrong-anchor') geometry.parts[0].targetAnchor=[1,2];
    f.config.geometry=await ref(f.config.geometry.path,geometry); await write(f.configRef.path,f.config);
    const result=await invoke(['preview',f.configRef.path,join(f.dir,'rejected-preview.png')]);
    assert.equal(result.code,2,result.stdout);
    await assert.rejects(prepare(f.inputPath,f.configRef.path));
  });
}
function masterHashForFixture(){return 'c'.repeat(64);}

test('explicit target-design semantic transform groups permit isotropic ratio redesign, never anonymous fitting',async t=>{
  const f=await fixture(t), geometry=JSON.parse(await readFile(f.config.geometry.path,'utf8'));
  geometry.status='draft';geometry.lifecycle='schematic';
  geometry.proportionDesign={version:'synthetic-ratio-v1',method:'reference-constraint-solve',stage:'target-master-mask-design',neckSocketContinuity:'review-required',evidence:await ref(join(f.dir,'ratio-design.json'),{fixtureOnly:true})};
  geometry.transformGroups=[];
  for(const part of geometry.parts) {
    const scale=part.role==='head'?2:1;
    part.transform=[scale,0,0,scale,0,0];part.targetAnchor=[8*scale,8*scale];part.targetAnchorBinding='synthetic socket anchor';part.transformGroup=part.role;
    geometry.transformGroups.push({id:part.role,roles:[part.role],transform:part.transform,rationale:'explicit synthetic pre-generation target ratio'});
  }
  f.config.geometry=await ref(f.config.geometry.path,geometry);await write(f.configRef.path,f.config);
  const result=await invoke(['draft-preview',f.configRef.path,join(f.dir,'ratio.png'),'living']);assert.equal(result.code,0,result.stderr);
  delete geometry.proportionDesign;f.config.geometry=await ref(f.config.geometry.path,geometry);await write(f.configRef.path,f.config);
  assert.equal((await invoke(['draft-preview',f.configRef.path,join(f.dir,'unbound.png'),'living'])).code,2);
});

test('draft schematic preview needs no generated master or approval; alternatives and destination overlap are valid',async t=>{
  const f=await fixture(t), geometry=JSON.parse(await readFile(f.config.geometry.path,'utf8'));
  geometry.status='draft';geometry.lifecycle='schematic';delete geometry.master;delete geometry.approval;
  geometry.sourceMasterSha256=masterHashForFixture();
  geometry.states=[{name:'living',roles:['hairBack','body','head','hairFront'],neckOwner:'body'},{name:'headless',roles:['headlessBody'],neckOwner:'headlessBody'}];
  geometry.parts.find(p=>p.role==='headlessBody').neckSeamOwnership='owns';
  for(const [index,part] of geometry.parts.entries()) part.sourcePixels=await ref(join(f.dir,part.role+'-ownership.json'),{masterSha256:geometry.sourceMasterSha256,indices:[index]});
  geometry.parts[4].mask=geometry.parts[0].mask;geometry.parts[4].occupiedBounds=geometry.parts[0].occupiedBounds;
  f.config.geometry=await ref(f.config.geometry.path,geometry);await write(f.configRef.path,f.config);
  const out=join(f.dir,'draft.png');
  const result=await invoke(['draft-preview',f.configRef.path,out,'living']);assert.equal(result.code,0,result.stderr);
  const receipt=JSON.parse(await readFile(out+'.json','utf8'));assert.equal(receipt.masterSha256,null);assert.match(receipt.status,/draft/);
  await assert.rejects(prepare(f.inputPath,f.configRef.path),/unapproved/);
});
