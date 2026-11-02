import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve, sep } from 'node:path';
import { checkPortrait, PortraitError, renderPortrait, type RenderOptions } from './portrait.ts';

export interface Asset { readonly id: string; readonly name: string; readonly format: string }
export interface Job {
  readonly id: string; readonly status: 'PASS' | 'FAIL'; readonly pngUrl?: string;
  readonly sourceName: string; readonly width: number; readonly height: number; readonly error?: string;
}
export async function listAssets(directory: string): Promise<readonly Asset[]> {
  let entries;
  try { entries = await readdir(directory,{withFileTypes:true}); }
  catch(error) { if(error instanceof Error && 'code' in error && error.code==='ENOENT')return [];throw error; }
  return entries.filter(e=>e.isFile()&&['.blend','.glb','.gltf','.fbx'].includes(extname(e.name).toLowerCase())).map(e=>({
    id:createHash('sha256').update(e.name).digest('hex'),name:e.name,format:extname(e.name).slice(1).toUpperCase(),
  })).sort((a,b)=>a.name.localeCompare(b.name));
}
export function jobsDirectory(root: string): string { return join(root,'work','portraits'); }
export function jobPath(root: string,id: string,file: string): string {
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(id)||!['portrait.png','portrait.png.json','job.json'].includes(file))throw new PortraitError('JOB_ID','Invalid job reference');
  return join(jobsDirectory(root),id,file);
}
export async function listJobs(root: string): Promise<readonly Job[]> {
  let ids;
  try { ids=await readdir(jobsDirectory(root),{withFileTypes:true}); }
  catch(error) { if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return [];throw error; }
  const jobs: Job[]=[];
  for(const id of ids.filter(e=>e.isDirectory())) {
    const value:unknown=JSON.parse(await readFile(jobPath(root,id.name,'job.json'),'utf8'));
    if(typeof value!=='object'||value===null||!('sourceName'in value)||typeof value.sourceName!=='string'||!('width'in value)||typeof value.width!=='number'||!('height'in value)||typeof value.height!=='number')throw new PortraitError('JOB_INVALID','Invalid stored job');
    try {
      await checkPortrait(jobPath(root,id.name,'portrait.png.json'));
      jobs.push({id:id.name,status:'PASS',sourceName:value.sourceName,width:value.width,height:value.height,pngUrl:`./api/jobs/${id.name}/png`});
    } catch(error) {
      jobs.push({id:id.name,status:'FAIL',sourceName:value.sourceName,width:value.width,height:value.height,error:error instanceof Error?error.message:String(error)});
    }
  }
  return jobs;
}
export async function renderAsset(root:string,directory:string,assetId:string,options:Omit<RenderOptions,'input'|'output'>):Promise<Job> {
  const asset=(await listAssets(directory)).find(a=>a.id===assetId);
  if(!asset)throw new PortraitError('ASSET_MISSING','Select an existing prebaked 3D asset');
  const source=resolve(directory,asset.name), base=await realpath(directory);
  if((await lstat(source)).isSymbolicLink()||!(await realpath(source)).startsWith(base+sep))throw new PortraitError('ASSET_PATH','Asset escapes prebaked directory');
  const id=randomUUID(),output=jobPath(root,id,'portrait.png');
  await mkdir(join(jobsDirectory(root),id),{recursive:true});
  const summary={id,sourceName:basename(source),width:options.width??512,height:options.height??640};
  await writeFile(jobPath(root,id,'job.json'),JSON.stringify(summary),{flag:'wx'});
  const receipt=await renderPortrait({...options,input:source,output});
  return {...summary,status:receipt.status,pngUrl:`./api/jobs/${id}/png`};
}
