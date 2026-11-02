import { createHash } from 'node:crypto';
import { parse as parseDesign, strictJSONParse } from '../2d/design-prompt.mjs';
import { neutralRecord, slotFields } from '../neutral-slots.mjs';
import { z } from 'zod';
export const fields = ['purpose','title','aspect_ratio','orientation','style_and_mood','fidelity_anchors','subject','expression_and_gaze','hair','makeup','wardrobe','scene','composition','pose','lighting','camera','color_grading','quality','negative_prompt'];
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const clean = value => typeof value === 'string' ? value.replace(/\[span_\d+\]\((?:start_span|end_span)\)/g, '') : Array.isArray(value) ? value.map(clean) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)])) : value;
const Source = z.object({ document:z.enum(['look','preview','package','rule']), pointer:z.string().startsWith('/'), sha256:z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const Field = z.object({ status:z.enum(['source-bound','derived','unknown']), sources:z.array(Source), value:z.json() }).strict().superRefine((v,c)=>{ if(v.status==='unknown' ? v.value!==null || v.sources.length!==0 : v.value===null || v.sources.length===0) c.addIssue({code:'custom',message:'field status/source/value mismatch'}); });
export const schema = z.object({ projectionSchema:z.literal('portrait-design-token-projection.v1'), characterId:z.string(), lookId:z.string(), binding:z.object({sourceSHA:z.string().regex(/^[a-f0-9]{64}$/), inputSnapshotSHA:z.string().regex(/^[a-f0-9]{64}$/), previewSHA:z.string().regex(/^[a-f0-9]{64}$/), packageSHA:z.string().regex(/^[a-f0-9]{64}$/), ruleSHA:z.string().regex(/^[a-f0-9]{64}$/), packageVersion:z.number().int().positive(), ruleVersion:z.number().int().positive(), referenceVersion:z.string(), references:z.array(z.json())}).strict(), fields:z.object(Object.fromEntries(fields.map(k=>[k,Field]))).strict(), editActivation:z.object({recordProtectedGarment:z.boolean(), activatedSlots:z.array(z.string()), source:z.literal('preview-design-model')}).strict(), generationModel:z.json() }).strict();
function bytes(input,key){ if(!(input[key] instanceof Uint8Array)) throw new Error('required bytes: '+key); return Buffer.from(input[key]); }
export function project(input) {
  const required=['lookBytes','previewBytes','packageBytes','ruleBytes','sourceImageBytes','sourceSHA'];
  if(!input || required.some(k=>!Object.hasOwn(input,k)) || Object.keys(input).some(k=>!required.includes(k))) throw new Error('required fields or unsupported flat-text overrides');
  const lb=bytes(input,'lookBytes'), pb=bytes(input,'previewBytes'), kb=bytes(input,'packageBytes'), rb=bytes(input,'ruleBytes');
  if(sha(bytes(input,'sourceImageBytes'))!==input.sourceSHA) throw new Error('source hash mismatch');
  const look=strictJSONParse(lb.toString()), preview=strictJSONParse(pb.toString()), pkg=strictJSONParse(kb.toString()), rule=strictJSONParse(rb.toString());
  for(const k of ['schemaVersion','characterId','name','lookId','identity','slots','faceMode']) if(!Object.hasOwn(look,k)) throw new Error('required look field: '+k);
  for(const [slot,names] of Object.entries(slotFields)) for(const name of names) if(!Object.hasOwn(look.slots[slot]??{},name)) throw new Error('required slot: '+slot+'.'+name);
  const record=neutralRecord(look), model=parseDesign(preview.output?.designPrompt);
  if(preview.id!==look.characterId || preview.output.binding.characterId!==look.characterId || preview.output.binding.name!==look.name || record.identity.characterId!==look.characterId || record.identity.name!==look.name) throw new Error('identity mismatch');
  if(model.inputSnapshotSHA!==sha(lb) || preview.output.expected.inputSnapshotSHA!==sha(lb)) throw new Error('input snapshot hash mismatch');
  if(pkg.version!==model.packageVersion || preview.output.expected.packageVersion!==pkg.version || pkg.id!=='seoul-dengoku-portrait-package') throw new Error('package version mismatch');
  const asset=pkg.assets.find(a=>a.role==='canvas-rule'); if(!asset || asset.sha256!==sha(rb)) throw new Error('rule hash mismatch');
  for(const ref of model.references) if(!pkg.assets.some(a=>a.sha256===ref.sourceHash)) throw new Error('reference hash mismatch');
  if(model.output.width!==1024 || model.output.height!==1536 || model.output.background!=='transparent') throw new Error('portrait canvas/background mismatch');
  if(JSON.stringify(model.face)!==JSON.stringify(look.faceMode)) throw new Error('face ID mismatch');
  for(const [slot,names] of Object.entries(slotFields)) for(const name of names) { const t=record.slots[slot][name]; const v=typeof t.value==='number'?{value:t.value,unit:t.unit}:t.value; if(JSON.stringify(v)!==JSON.stringify(model.appearance[slot][name])) throw new Error('authored leaf mismatch: '+slot+'.'+name); }
  const hashes={look:sha(lb),preview:sha(pb),package:sha(kb),rule:sha(rb)};
  const ptr=(document,pointer)=>({document,pointer,sha256:hashes[document]});
  const known=(value,sources,status='source-bound')=>({status,sources,value:clean(value)});
  const from=(value,...pointers)=>known(value,pointers.map(p=>ptr('preview','/output/designPrompt'+p)));
  const unknown=()=>({status:'unknown',sources:[],value:null});
  const f={purpose:from(model.output.format,'/output/format'),title:known(look.name,[ptr('look','/name')]),aspect_ratio:from('2:3','/output/width','/output/height'),orientation:from('portrait','/output/width','/output/height'),style_and_mood:from(model.references.filter(r=>r.role==='drawing-technique-only'),'/references'),fidelity_anchors:from(model.references,'/references'),subject:from({recipient:model.recipient,face:model.face,faceTraits:model.appearance.face,body:model.appearance.body},'/recipient','/face','/appearance/face','/appearance/body'),expression_and_gaze:from({description:model.appearance.face.description,gazeCamera:model.composition.gazeCamera},'/appearance/face/description','/composition/gazeCamera'),hair:from(model.appearance.hair,'/appearance/hair'),makeup:unknown(),wardrobe:from({outfit:model.appearance.outfit,accessories:model.appearance.accessories},'/appearance/outfit','/appearance/accessories'),scene:unknown(),composition:from(model.composition,'/composition'),pose:from({coordinatedHeadTorso:model.composition.coordinatedHeadTorso,viewerRight:model.composition.viewerRight},'/composition/coordinatedHeadTorso','/composition/viewerRight'),lighting:unknown(),camera:unknown(),color_grading:unknown(),quality:from(model.output,'/output'),negative_prompt:from({noBakedText:model.output.noBakedText,backgroundInstruction:model.output.backgroundInstruction??null},'/output/noBakedText','/output')};
  f.aspect_ratio.status=f.orientation.status='derived';
  const activatedSlots=model.garmentEdit?.activatedSlots??[];
  return schema.parse({projectionSchema:'portrait-design-token-projection.v1',characterId:look.characterId,lookId:look.lookId,binding:{sourceSHA:input.sourceSHA,inputSnapshotSHA:sha(lb),previewSHA:sha(pb),packageSHA:sha(kb),ruleSHA:sha(rb),packageVersion:pkg.version,ruleVersion:rule.schemaVersion,referenceVersion:rule.referenceVersion,references:model.references},fields:f,editActivation:{recordProtectedGarment:!activatedSlots.includes('appearance.outfit.upper'),activatedSlots,source:'preview-design-model'},generationModel:parseDesign(clean(model))});
}
export function validateProjection(text,input) { const value=schema.parse(strictJSONParse(text)); if(JSON.stringify(value)!==JSON.stringify(project(input))) throw new Error('projection differs from bound source; overrides rejected'); return value; }
export function generationFacing(text,input) { return parseDesign(validateProjection(text,input).generationModel); }
