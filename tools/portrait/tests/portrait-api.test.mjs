import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createPortraitGenServer } from '../server/serve.ts';
import { checkPortrait, exportPortrait, renderPortrait } from '../pipeline/portrait.ts';
import { inspectPng } from '../pipeline/png.ts';
import { stagePortraits } from '../pipeline/stage.ts';

const root=fileURLToPath(new URL('..',import.meta.url));

test('malformed prebaked model fails without PNG or PASS receipt',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'portrait-invalid-'));
  try {
    const input=join(directory,'broken.glb'),output=join(directory,'portrait.png');
    await writeFile(input,'not a 3D model');
    await assert.rejects(renderPortrait({input,output,width:64,height:64}));
    await assert.rejects(readFile(output),{code:'ENOENT'});
    await assert.rejects(readFile(output+'.json'),{code:'ENOENT'});
  } finally {await rm(directory,{recursive:true,force:true});}
});

test('server retires legacy provider payload before any asset validation', async()=>{
  const app=await createPortraitGenServer({root,listen:false});
  try {
    const response=await app.app.inject({method:'POST',url:'/api/generate',payload:{provider:'comfyui',slot:'hair'}});
    assert.equal(response.statusCode,400);
    assert.equal(response.json().error.code,'RETIRED_2D_PIPELINE');
  } finally {await app.close();}
});

test('actual 3D API renders valid PNG without old credentials or gates and exports read-only gallery',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'portrait-3d-api-'));
  const assets=join(directory,'models');await mkdir(assets);
  const source=join(assets,'fixture.glb');
  const fixture=spawnSync(process.execPath,[join(root,'tools/character-tool/cli.mjs'),'--json','exec','--script',join(root,'tools/portrait-fixture.py'),'--output',source],{encoding:'utf8'});
  assert.equal(fixture.status,0,fixture.stdout+fixture.stderr);
  const service=await createPortraitGenServer({root:directory,publicRoot:root,assets,listen:false});
  try {
    const health=await service.app.inject({url:'/healthz'});
    assert.equal(health.json().mode,'prebaked-3d');
    const inventory=(await service.app.inject({url:'/api/assets'})).json().assets;
    assert.equal(inventory.length,1);
    for(const route of ['/api/pins','/api/comfy','/api/jobs/test/gate','/api/turntables']) {
      const retired=await service.app.inject({method:'POST',url:route,payload:{}});
      assert.equal(retired.statusCode,410,route);
    }
    const response=await service.app.inject({method:'POST',url:'/api/generate',payload:{assetId:inventory[0].id,width:128,height:160,yaw:25,framing:'upper'}});
    assert.equal(response.statusCode,200,response.body);
    const job=response.json();assert.equal(job.status,'PASS');
    const image=await service.app.inject({url:job.pngUrl.replace(/^\./,'')});
    assert.equal(image.statusCode,200);
    assert.match(image.headers['content-type'],/^image\/png/);
    assert.equal(inspectPng(image.rawPayload).height,160);
    const receipt=join(directory,'work/portraits',job.id,'portrait.png.json');
    assert.equal((await checkPortrait(receipt)).status,'PASS');
    const exported=await exportPortrait(receipt,join(directory,'export.png'));
    assert.deepEqual(await readFile(exported.output),image.rawPayload);
    const staged=await stagePortraits(root,directory,join(directory,'static'));
    assert.equal(staged.portraits,1);
    const catalog=JSON.parse(await readFile(join(directory,'static/catalog.json'),'utf8'));
    assert.equal(catalog.readOnly,true);assert.equal(catalog.jobs[0].status,'PASS');
    const bad=await service.app.inject({method:'POST',url:'/api/generate',payload:{assetId:'missing',width:128,height:160}});
    assert.notEqual(bad.statusCode,200);
    const png=join(directory,'work/portraits',job.id,'portrait.png');
    await writeFile(png,Buffer.from('not a PNG'));
    await assert.rejects(checkPortrait(receipt));
    const changed=await service.app.inject({url:'/api/jobs'});
    assert.equal(changed.json().jobs[0].status,'FAIL');
    const refused=await service.app.inject({method:'POST',url:'/api/generate',headers:{origin:'https://unrelated.invalid'},payload:{assetId:inventory[0].id}});
    assert.equal(refused.statusCode,403);
  }finally{await service.close();await rm(directory,{recursive:true,force:true});}
});
