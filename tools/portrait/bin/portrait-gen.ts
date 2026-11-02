#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blenderPath, worker } from '../tools/character-tool/runtime.mjs';
import { checkPortrait, exportPortrait, MODE, PortraitError, renderPortrait } from '../pipeline/portrait.ts';
import { listAssets, listJobs } from '../pipeline/catalog.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const retired = new Set(['pin','collect','gate','verify-comfy','edit-record','turntable','base-parts','manifest','resolve','rebind','import','convert']);
const help = `portrait-gen — pre-baked 3D object → portrait PNG
  doctor                         Local Blender capabilities, no provider credentials
  generate --input model.glb --output portrait.png [--width 512 --height 640]
           [--yaw 0 --framing upper|full --blender executable]
  check --receipt portrait.png.json
  export --receipt portrait.png.json --output copy.png
  assets [--assets /path/to/prebaked]
  list [--root /path/to/workspace]
  serve [--root workspace --assets prebaked-directory --port 8130]
  stage --output /new/static-directory [--root workspace]
  avatar --sex female|male --body body.blend --output portrait.png [--slot hair=<id> --slot clothes=<id> ...]
         [--pose pose.json --textures dir --catalog assets/3d/catalog.json --width --height --yaw --framing]
  fit --slot clothes|hair|headgear --body body.blend --input raw.glb --output fitted.glb [--faces 80000]
  catalog add --entry item.json [--catalog assets/3d/catalog.json]   Record a made hair/clothes/headgear mesh
  catalog list [--catalog assets/3d/catalog.json]                    Show what was made, how, and added
PASS = successful local 3D render with a valid nonempty PNG. Former 2D/provider gates are retired.
`;

try {
  const args = process.argv.slice(2), first = args[0] ?? 'help';
  if (retired.has(first) || args.some(a => ['--provider','--live','--gate1','--gate2','--gate3','--numeric','--artistic'].includes(a) || (a==='--slot'&&!['avatar','fit'].includes(first)))) throw new PortraitError('RETIRED_2D_PIPELINE','The 2D/provider workflow is retired; generate from --input prebaked 3D object');
  const {values,positionals} = parseArgs({args,allowPositionals:true,options:{
    input:{type:'string'},output:{type:'string'},receipt:{type:'string'},width:{type:'string'},height:{type:'string'},
    yaw:{type:'string'},framing:{type:'string'},blender:{type:'string'},root:{type:'string'},assets:{type:'string'},
    port:{type:'string'},host:{type:'string'},help:{type:'boolean'},json:{type:'boolean'},
    catalog:{type:'string'},entry:{type:'string'},body:{type:'string'},sex:{type:'string'},pose:{type:'string'},textures:{type:'string'},
    slot:{type:'string',multiple:true},faces:{type:'string'},
  }});
  const command = values.help ? 'help' : positionals[0] ?? 'help';
  if(positionals.length>(command==='catalog'?2:1))throw new PortraitError('USAGE','Only one command is allowed');
  const workspace=resolve(values.root??root),assets=resolve(values.assets??join(workspace,'assets/prebaked'));
  const required=(value:string|undefined,name:string):string=>{if(!value)throw new PortraitError('USAGE',`${name} required`);return value;};
  let result:unknown;
  switch(command) {
    case 'help': process.stdout.write(help); break;
    case 'doctor': result={mode:MODE,capabilities:await worker(await blenderPath(values.blender),{command:'doctor'})}; break;
    case 'generate': result=await renderPortrait({input:required(values.input,'--input'),output:required(values.output,'--output'),
      width:values.width===undefined?512:Number(values.width),height:values.height===undefined?640:Number(values.height),
      yaw:values.yaw===undefined?0:Number(values.yaw),framing:values.framing??'upper',blender:values.blender}); break;
    case 'check': result=await checkPortrait(required(values.receipt,'--receipt')); break;
    case 'export': result=await exportPortrait(required(values.receipt,'--receipt'),required(values.output,'--output')); break;
    case 'assets': result={assets:await listAssets(assets)}; break;
    case 'list': result={jobs:await listJobs(workspace)}; break;
    case 'avatar': {
      const {renderAvatar}=await import('../pipeline/avatar.ts');
      result=await renderAvatar({catalog:resolve(values.catalog??join(root,'assets/3d/catalog.json')),body:required(values.body,'--body'),
        sex:required(values.sex,'--sex'),slots:values.slot??[],pose:values.pose,textures:values.textures,output:required(values.output,'--output'),
        width:values.width===undefined?512:Number(values.width),height:values.height===undefined?640:Number(values.height),
        yaw:values.yaw===undefined?0:Number(values.yaw),framing:values.framing??'upper',blender:values.blender}); break;
    }
    case 'fit': {
      const {fitSlot}=await import('../pipeline/fit.ts');
      result=await fitSlot({slot:required(values.slot?.[0],'--slot'),body:required(values.body,'--body'),input:required(values.input,'--input'),
        output:required(values.output,'--output'),faces:values.faces===undefined?undefined:Number(values.faces),blender:values.blender}); break;
    }
    case 'catalog': {
      const {addCatalogItem,loadCatalog}=await import('../pipeline/slots.ts');
      const catalog=resolve(values.catalog??join(root,'assets/3d/catalog.json'));
      if(positionals[1]==='add')result={item:await addCatalogItem(catalog,required(values.entry,'--entry'))};
      else if(positionals[1]==='list')result={items:(await loadCatalog(catalog)).items};
      else throw new PortraitError('USAGE','catalog add|list');
      break;
    }
    case 'stage': {
      const {stagePortraits}=await import('../pipeline/stage.ts');
      result=await stagePortraits(root,workspace,required(values.output,'--output')); break;
    }
    case 'serve': {
      const {createPortraitGenServer}=await import('../server/serve.ts');
      const port=Number(values.port??8130),host=values.host??'127.0.0.1';
      if(!Number.isInteger(port)||port<0||port>65535)throw new PortraitError('PORT','Invalid port');
      const server=await createPortraitGenServer({root:workspace,publicRoot:root,assets,port,host,blender:values.blender});
      process.stdout.write(JSON.stringify({ok:true,mode:MODE,url:server.url})+'\n');
      const shutdown=()=>{server.close().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});};
      process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);break;
    }
    default: throw new PortraitError('USAGE','Unknown command; use --help');
  }
  if(result!==undefined)process.stdout.write(JSON.stringify({ok:true,data:result},null,values.json?0:2)+'\n');
} catch(error) {
  const code=error instanceof PortraitError?error.code:error instanceof Error&&'code'in error?String(error.code):'FAILED';
  process.stdout.write(JSON.stringify({ok:false,error:{code,message:error instanceof Error?error.message:String(error)}})+'\n');
  process.exitCode=2;
}
