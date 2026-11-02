import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { jobPath, listJobs } from './catalog.ts';
import { requireNew } from './portrait.ts';

/** Publish only rendered PNG results and a read-only UI, never sources/providers/legacy data. */
export async function stagePortraits(publicRoot:string,workspace:string,destination:string) {
  const output=resolve(destination);
  await requireNew(output);
  await mkdir(output,{recursive:true});
  for(const file of ['index.html','portrait.css','portrait-ui.mjs'])await copyFile(join(publicRoot,file),join(output,file));
  const jobs=await listJobs(workspace),published=[];
  await mkdir(join(output,'portraits'));
  for(const job of jobs) {
    if(job.status!=='PASS')continue;
    const filename=job.id+'.png';
    await copyFile(jobPath(workspace,job.id,'portrait.png'),join(output,'portraits',filename));
    published.push({...job,pngUrl:'./portraits/'+filename});
  }
  await writeFile(join(output,'catalog.json'),JSON.stringify({readOnly:true,mode:'prebaked-3d',assets:[],jobs:published},null,2));
  return {output,mode:'prebaked-3d',readOnly:true,portraits:published.length};
}
