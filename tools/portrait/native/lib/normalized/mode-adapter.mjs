import { createHash } from 'node:crypto';
export const modes = ['portrait','fullbody','3Dparts'];
export const parts = ['head','hair','body','upper','lower','footwear','equipment'];
const hash=b=>createHash('sha256').update(b).digest('hex');
// Inject the product's strict parser; the core has no repository imports or prompt builder.
export function createModeAdapter({ strictParse }) {
  return function modeToken({ lookBytes, inputSnapshotSHA, mode, modeBytes=null, modeSHA=null }) {
    if(!(lookBytes instanceof Uint8Array) || hash(lookBytes)!==inputSnapshotSHA) throw new Error('input snapshot hash mismatch');
    if(!modes.includes(mode)) throw new Error('unsupported mode');
    const look=strictParse(Buffer.from(lookBytes).toString());
    if(![1,2].includes(look.schemaVersion) || !look.characterId || !look.name || !look.lookId || !look.identity || !look.slots) throw new Error('shared identity and slots required');
    if(look.identity.characterId!==look.characterId || look.identity.name!==look.name) throw new Error('identity mismatch');
    let specific={canvas:null,pose:null,coverage:null,parts:null};
    if(modeBytes!==null) {
      if(!(modeBytes instanceof Uint8Array) || hash(modeBytes)!==modeSHA) throw new Error('mode source hash mismatch');
      const c=strictParse(Buffer.from(modeBytes).toString());
      const keys=['schema','mode','characterId','lookId','inputSnapshotSHA','canvas','pose','coverage','parts'];
      if(keys.some(k=>!Object.hasOwn(c,k)) || Object.keys(c).some(k=>!keys.includes(k)) || c.schema!=='avatar-mode-source.v1' || c.mode!==mode || c.characterId!==look.characterId || c.lookId!==look.lookId || c.inputSnapshotSHA!==inputSnapshotSHA) throw new Error('mode contract mismatch');
      const sourced=v=>v===null || v && Object.keys(v).sort().join(',')==='source,status,value' && v.value!==null && typeof v.source==='string' && v.source.length>0 && ['approved','authored-draft','art-proposal'].includes(v.status);
      for(const k of ['canvas','pose','coverage','parts']) if(!sourced(c[k])) throw new Error('explicit mode source required: '+k);
      if(c.canvas && (!Number.isInteger(c.canvas.value.width) || c.canvas.value.width<1 || !Number.isInteger(c.canvas.value.height) || c.canvas.value.height<1 || c.canvas.value.unit!=='px')) throw new Error('explicit pixel canvas required');
      if(c.parts && (mode!=='3Dparts' || !Array.isArray(c.parts.value) || !c.parts.value.length || new Set(c.parts.value).size!==c.parts.value.length || c.parts.value.some(p=>!parts.includes(p)))) throw new Error('unsupported segmentation part');
      specific=Object.fromEntries(['canvas','pose','coverage','parts'].map(k=>[k,structuredClone(c[k])]));
    } else if(modeSHA!==null) throw new Error('mode bytes required');
    return {schema:'avatar-mode-token-projection.v1',mode,inputSnapshotSHA,modeSHA,shared:structuredClone(look),modeSpecific:specific,hiddenAnatomyInferred:false};
  };
}
