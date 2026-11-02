#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checked,hash} from './workflow.mjs';

// Exact source-contour r2 adapter. Partial draft remains partial: no fabricated
// death/headless roles, state ownership, pivots or approval.
export async function inspectRegistration(path) {
  const bytes=await readFile(path),draft=JSON.parse(bytes);
  if(draft.schema!=='paperdoll-registration-draft.r2')throw new Error('unsupported actual registration revision');
  await checked({path:draft.source,sha256:draft.sourceSHA256});
  const components=[];
  for(const [role,part] of Object.entries(draft.roles)) {
    const maskPath=resolve(dirname(path),part.mask),maskBytes=await readFile(maskPath);
    const sourcePixels={path:resolve(dirname(path),part.sourcePixels.path),sha256:part.sourcePixels.sha256};await checked(sourcePixels);
    const [left,top,right,bottom]=part.bounds;
    components.push({role,mask:{path:maskPath,sha256:hash(maskBytes)},occupiedBounds:[left,top,right-left,bottom-top],sourcePixels,sourcePolygon:part.polygonSource});
  }
  return {schema:'paperdoll-partial-registration.v1',status:'draft-not-approved',artDraft:{path:resolve(path),sha256:hash(bytes)},canvas:{width:draft.canvas[0],height:draft.canvas[1]},source:{path:draft.source,sha256:draft.sourceSHA256},sourceTransform:draft.transform,anchors:draft.anchors,components,editRegions:draft.editRegions,nativeProposal:draft.nativeProposal,missing:['explicit active states and per-state neck ownership','target B registered master and API mask with exact hashes','selected B target-region transforms/anchors, not superseded source registration','deadHead/headlessBody are not present; not required for initial anatomy edit but required for final seven-role export']};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {if(process.argv.length!==4)throw new Error('Usage: inspect-registration.mjs R2_JSON OUTPUT');await writeFile(resolve(process.argv[3]),JSON.stringify(await inspectRegistration(resolve(process.argv[2])),null,2)+'\n',{flag:'wx'});}
  catch(error){console.error(error.message);process.exitCode=2;}
}
