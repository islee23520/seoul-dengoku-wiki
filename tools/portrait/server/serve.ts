import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import { jobPath, listAssets, listJobs, renderAsset } from '../pipeline/catalog.ts';
import { checkPortrait, MODE, PortraitError } from '../pipeline/portrait.ts';

export interface ServeOptions {
  readonly root:string;readonly publicRoot?:string;readonly assets?:string;readonly port?:number;
  readonly host?:string;readonly listen?:boolean;readonly blender?:string;
}
export interface PortraitGenServer { readonly app:FastifyInstance;readonly url:string;readonly close:()=>Promise<void> }

function bodyOptions(body:unknown):{assetId:string;width:number;height:number;yaw:number;framing:string} {
  if(typeof body==='object'&&body!==null&&('provider'in body||'slot'in body||'gate1'in body))throw new PortraitError('RETIRED_2D_PIPELINE','2D/provider fields are retired');
  if(typeof body!=='object'||body===null||!('assetId'in body)||typeof body.assetId!=='string')throw new PortraitError('ASSET_REQUIRED','assetId required');
  const width='width'in body?body.width:512,height='height'in body?body.height:640,yaw='yaw'in body?body.yaw:0,framing='framing'in body?body.framing:'upper';
  if(typeof width!=='number'||typeof height!=='number'||typeof yaw!=='number'||typeof framing!=='string')throw new PortraitError('RENDER_OPTIONS','Invalid render options');
  return {assetId:body.assetId,width,height,yaw,framing};
}

export async function createPortraitGenServer(options:ServeOptions):Promise<PortraitGenServer> {
  const root=resolve(options.root),publicRoot=resolve(options.publicRoot??root),assets=resolve(options.assets??join(root,'assets/prebaked'));
  const host=options.host??'127.0.0.1';
  if(!['127.0.0.1','::1','localhost'].includes(host))throw new PortraitError('HOST','Local Blender rendering binds loopback only');
  const app=Fastify({logger:false,bodyLimit:16384});
  app.addHook('onSend',async(_request,reply)=>{reply.header('cache-control','no-store');reply.header('x-content-type-options','nosniff');});
  app.addHook('onRequest',async(request,reply)=>{
    const origin=request.headers.origin;
    if(origin) {
      let hostname;
      try {hostname=new URL(origin).host;}catch{return reply.code(403).send({error:{code:'ORIGIN',message:'Invalid origin'}});}
      if(hostname!==request.headers.host)return reply.code(403).send({error:{code:'ORIGIN',message:'Cross-origin requests denied'}});
    }
  });
  app.setErrorHandler((error,_request,reply)=>{reply.code(error instanceof PortraitError?400:500).send({error:{code:error instanceof PortraitError?error.code:'FAILED',message:error instanceof Error?error.message:String(error)}});});
  const staticFiles:Readonly<Record<string,string>>={'index.html':'text/html; charset=utf-8','portrait.css':'text/css; charset=utf-8','portrait-ui.mjs':'text/javascript; charset=utf-8'};
  for(const prefix of ['','/portrait-gen']) {
    app.get(prefix+'/',async(_request,reply)=>reply.type('text/html; charset=utf-8').send(await readFile(join(publicRoot,'index.html'))));
    for(const [file,type]of Object.entries(staticFiles))app.get(prefix+'/'+file,async(_request,reply)=>reply.type(type).send(await readFile(join(publicRoot,file))));
    app.get(prefix+'/healthz',async()=>({ok:true,mode:MODE,readOnly:false}));
    app.get(prefix+'/api/assets',async()=>({assets:await listAssets(assets)}));
    app.get(prefix+'/api/jobs',async()=>({jobs:await listJobs(root)}));
    app.post(prefix+'/api/generate',async(request)=>{const {assetId,...render}=bodyOptions(request.body);return renderAsset(root,assets,assetId,{...render,blender:options.blender});});
    app.get(prefix+'/api/jobs/:id/png',async(request,reply)=>{
      const params=request.params;
      if(typeof params!=='object'||params===null||!('id'in params)||typeof params.id!=='string')throw new PortraitError('JOB_ID','Invalid job');
      const receipt=await checkPortrait(jobPath(root,params.id,'portrait.png.json'));
      return reply.type('image/png').header('content-disposition','inline; filename="portrait.png"').send(await readFile(receipt.output));
    });
    for(const route of ['/api/pins','/api/comfy','/api/jobs/:id/gate','/api/turntables','/api/turntables/:id','/turntables'])app.all(prefix+route,async(_request,reply)=>reply.code(410).send({error:{code:'RETIRED_2D_PIPELINE',message:'Use prebaked 3D object rendering; previous 2D/provider workflow is retired'}}));
  }
  const url=options.listen===false?'http://127.0.0.1:0':await app.listen({host,port:options.port??8130});
  return {app,url,close:()=>app.close()};
}
