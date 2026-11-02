#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,checked} from './workflow.mjs';

// Maps the art owner's actual field names without manufacturing approval,
// anatomy, state membership or source ownership. Bindings supply only missing
// machine fields; role-mask geometry comes from the original draft itself.
export async function convertArtDraft(draftPath,bindingsPath,outputPath) {
  const bytes=await readFile(draftPath),draft=JSON.parse(bytes),bindings=JSON.parse(await readFile(bindingsPath,'utf8'));
  if(!draft.schema?.startsWith('paperdoll-geometry-draft.') || !draft.masks || !draft.workingCanvas || !draft.masterProposal) throw new Error('unsupported art draft shape; inspect r2 before extending');
  if(!bindings.states || !bindings.parts || !bindings.referenceMeasurements || !bindings.reference) throw new Error('missing true state/source-ownership/anchor bindings; no inferred defaults');
  const parts=[];
  for(const role of bindings.orderedRoles) {
    const mask=draft.masks[role],part=bindings.parts[role];
    if(!mask || !part?.sourcePixels || !part?.sourceAnchor || !part?.targetAnchor || !part?.pivot || !part?.transform) throw new Error('missing '+role+' mask/source ownership/anchor/pivot/transform binding');
    const path=resolve(dirname(draftPath),mask.path);await checked({path,sha256:mask.sha256});
    const [x,y,right,bottom]=mask.alphaBoundsXYXY;
    parts.push({...part,role,mask:{path,sha256:mask.sha256},occupiedBounds:[x,y,right-x,bottom-y],cropRect:[x,y,right-x,bottom-y],logicalSize:[draft.logicalCanvas[0],draft.logicalCanvas[1]]});
  }
  const output={schema:'paperdoll-geometry.v1',status:'draft',lifecycle:'schematic',coordinateSystem:'pixels-top-left-x-right-y-down',canvas:{width:draft.workingCanvas[0],height:draft.workingCanvas[1]},masterScale:draft.uniformMultiplier,reference:bindings.reference,referenceMeasurements:bindings.referenceMeasurements,measurementEvidence:'Source-bound art draft '+draft.schema,artDraft:{path:resolve(draftPath),sha256:hash(bytes)},sourceMasterSha256:bindings.sourceMasterSha256,states:bindings.states,occlusionOrder:bindings.orderedRoles,parts,...(bindings.master?{master:bindings.master}:{}),...(bindings.transformGroups?{transformGroups:bindings.transformGroups,proportionDesign:bindings.proportionDesign}:{})};
  await mkdir(dirname(outputPath),{recursive:true});await writeFile(outputPath,JSON.stringify(output,null,2)+'\n',{flag:'wx'});return output;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{if(process.argv.length!==5)throw new Error('Usage: convert-art-draft.mjs ART_DRAFT MISSING_BINDINGS OUTPUT');console.log(JSON.stringify(await convertArtDraft(...process.argv.slice(2).map(p=>resolve(p)))));}
  catch(error){console.error(error.message);process.exitCode=2;}
}
