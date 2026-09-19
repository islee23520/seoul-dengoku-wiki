import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from './runtime.mjs';

const directoryUrl = new URL('.',import.meta.url);
const path = name => fileURLToPath(new URL(name,directoryUrl));
test('packed glTF ORM exports external Unity channel maps with factors and metric height', async () => {
  const directory = await mkdtemp(join(tmpdir(),'character-pbr-test-'));
  async function run(...args) {
    const result = await execute(process.execPath,[path('cli.mjs'),'--json',...args]);
    const response = JSON.parse(result.stdout);
    assert.equal(response.ok,true,result.stdout+result.stderr);
    return response.data;
  }
  try {
    const glb = join(directory,'source.glb'), blend = join(directory,'aligned.blend'), fbx = join(directory,'character.fbx');
    await run('exec','--script',path('qa-pbr.py'),'--output',glb);
    await run('align','--input',glb,'--output',blend,'--height','1.75');
    const exported = await run('export','--input',blend,'--output',fbx);
    const manifest = JSON.parse(await readFile(exported.manifest,'utf8'));
    assert.equal(manifest.heightMeters,1.75);
    assert.equal(manifest.pbr.sourceImages.length,3);
    const pixels = await run('exec','--script',path('qa-pbr-check.py'),'--spec',exported.manifest);
    assert.equal(pixels.pass,true);
    assert.ok(Math.abs(pixels.pixels.metallicSmoothness[0]-.4)<.01);
    assert.ok(Math.abs(pixels.pixels.metallicSmoothness[3]-.7)<.01);
    assert.ok(Math.abs(pixels.pixels.occlusion[1]-.2)<.01);
  } finally { await rm(directory,{recursive:true,force:true}); }
});
