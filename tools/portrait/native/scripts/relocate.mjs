import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const run=(command,args,cwd)=>new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);child.once('error',reject);child.once('exit',code=>code===0?resolve(out):reject(new Error(command+' exited '+code+': '+err)));});
const temporary=await mkdtemp(join(tmpdir(),'seoul-avatar-relocation-'));
const tarball=resolve('seoul-avatar-generator-0.1.0.tgz');
await run('npm',['install','--ignore-scripts','--prefix',temporary,tarball],temporary);
const installed=join(temporary,'node_modules/seoul-avatar-generator');
const results=[];
for(const [command,path] of [['preview','preview-request.json'],['fullbody','fullbody-request.json'],['3Dparts','3Dparts-request.json']]) {
  const text=await run(join(temporary,'node_modules/.bin/seoul-avatar'),[command,'examples/'+path],installed);
  const output=JSON.parse(text);assert.ok(output.schema);results.push({command,schema:output.schema,inputSnapshotSHA:output.inputSnapshotSHA,parts:output.parts?.length??null});
  if(command==='3Dparts') {assert.equal(output.parts.length,7);assert.equal(output.meshGenerated,false);}
}
assert.equal(new Set(results.map(r=>r.inputSnapshotSHA)).size,1);
const paths=[];
async function scan(dir) {for(const e of await readdir(dir,{withFileTypes:true})) {const p=join(dir,e.name);if(e.isDirectory()) await scan(p);else {const text=await readFile(p,'utf8');assert.doesNotMatch(text,/\/Volumes\/|\/Users\/|\.omo\/|private\/K\d/);paths.push(p.slice(installed.length+1));}}}
await scan(installed);
const evidence={schema:'avatar-relocation-evidence.v1',temporary,tarball,results,packagedFiles:paths.length,privatePathScan:'passed',paidCalls:0};
await writeFile(join(temporary,'relocation-evidence.json'),JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
