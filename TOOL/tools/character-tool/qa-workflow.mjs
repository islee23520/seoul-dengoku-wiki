import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from './runtime.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const sourceDir = fileURLToPath(new URL('.', import.meta.url));
const directory = resolve(process.argv[2]);
await mkdir(directory, { recursive: true });
const run = async (name, ...args) => {
  const result = await execute(process.execPath,[cli,'--json',...args],{timeout:600_000});
  await writeFile(join(directory,`${name}.stdout.json`), result.stdout);
  await writeFile(join(directory,`${name}.log`), result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.ok,true,`${name}: ${result.stdout}\n${result.stderr.slice(-2500)}`);
  console.log(`PASS ${name}`);
  return response.data;
};
const source = join(directory,'source.blend'), aligned = join(directory,'aligned.blend'), rigged = join(directory,'rigged.blend');
await run('fixture','exec','--script',join(sourceDir,'qa-fixture.py'),'--output',source);
await run('align','align','--input',source,'--output',aligned,'--height','2');
await run('weld','weld','--input',aligned,'--output',join(directory,'welded.blend'),'--distance','0.001');
await writeFile(join(directory,'shape.json'),JSON.stringify({name:'BendTip',deltas:[{vertex:20,offset:[.1,0,0]},{vertex:21,offset:[.1,0,0]}]}));
await run('shape','shape-key','--input',aligned,'--output',join(directory,'shaped.blend'),'--mesh','FixtureCharacter','--spec',join(directory,'shape.json'));
await run('rig','rig','--input',join(directory,'shaped.blend'),'--output',rigged,'--skeleton',source.replace('.blend','.skeleton.json'));
await writeFile(join(directory,'weights.json'),JSON.stringify({vertices:[{index:20,weights:{Root:1,Tip:3}}]}));
await run('weights','skin-edit','--input',rigged,'--output',join(directory,'weighted.blend'),'--mesh','FixtureCharacter','--spec',join(directory,'weights.json'));
await writeFile(join(directory,'bones.json'),JSON.stringify({bones:[{name:'Tip',head:[0,0,1],tail:[.05,0,2]}]}));
await run('bones','rig-edit','--input',join(directory,'weighted.blend'),'--output',join(directory,'edited.blend'),'--armature','FixtureRig','--spec',join(directory,'bones.json'));
await run('export','export','--input',join(directory,'edited.blend'),'--output',join(directory,'character.fbx'),'--require-rig');
for (const engine of ['voxel','surface']) {
  await run(engine,'rig','--input',aligned,'--output',join(directory,`${engine}.blend`),'--skeleton',source.replace('.blend','.skeleton.json'),
    '--engine',engine,'--resolution','32','--loops','1','--influences','4');
}
await run('render','render','--input',rigged,'--output',join(directory,'rest-views'));
const posed = await run('pose','render','--input',rigged,'--output',join(directory,'pose-views'),'--pose-bone','Tip','--angle','35');
assert.ok(posed.maxVertexDisplacement > .01);
await run('arp-gui','rig-template','--preset','human','--output',join(directory,'arp-human.blend'),'--gui','--screenshot',join(directory,'arp-gui.png'));
console.log('CHARACTER_QA_OK');
