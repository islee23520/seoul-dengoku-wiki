import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from './runtime.mjs';

const directory = await mkdtemp(join(tmpdir(),'character-fresh-setup-'));
const evidence = resolve(process.argv[2]);
await mkdir(evidence,{recursive:true});
try {
  const scripts = join(directory,'scripts'), config = join(directory,'config');
  await mkdir(scripts); await mkdir(config);
  const result = await execute(process.execPath,[fileURLToPath(new URL('./cli.mjs',import.meta.url)),
    '--json','setup','--addons','auto_rig_pro,rig_tools,weight_paint_tools,proxy_picker,voxel_skinning'],
  {env:{...process.env,BLENDER_USER_SCRIPTS:scripts,BLENDER_USER_CONFIG:config},timeout:300_000});
  await writeFile(join(evidence,'fresh-setup.json'),result.stdout);
  await writeFile(join(evidence,'fresh-setup.log'),result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.ok,true,result.stdout+result.stderr);
  assert.equal(response.data.actions.length,5);
  assert.ok(response.data.actions.every(a=>a.action==='installed'),result.stdout);
  console.log('FRESH_SETUP_OK five add-ons installed into isolated user directories');
} finally {
  await rm(directory,{recursive:true,force:true});
  await writeFile(join(evidence,'fresh-setup-cleanup.json'),JSON.stringify({removed:directory,ok:true}));
}
