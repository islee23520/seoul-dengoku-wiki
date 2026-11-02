import { slotFields, sha, previewPortrait } from '../lib/index.mjs';
export const bytes = v => Buffer.from(JSON.stringify(v));
export const trait = value => ({ value, status: value === null ? 'unknown' : 'authored-draft', source: value === null ? null : 'synthetic:/author' });
export function fixture() {
  const slots = Object.fromEntries(Object.entries(slotFields).map(([slot, names]) => [slot, Object.fromEntries(names.map(name => [name, trait(null)]))]));
  slots.face.description = trait('Angular face'); slots.hair.description = trait('Short black hair'); slots.body.skin = trait('Warm brown');
  slots.body.height = { ...trait(170), unit: 'cm' }; slots.outfit.upper = trait('Blue jacket'); slots.outfit.lower = trait('Gray trousers'); slots.outfit.footwear = trait('Black boots'); slots.outfit.neckline = trait('High collar');
  const look = { schemaVersion: 2, characterId: 'synthetic-a', name: 'Synthetic Avatar', lookId: 'look-a', identity: { characterId: 'synthetic-a', name: 'Synthetic Avatar', gender: trait('female'), ageCategory: trait('adult') }, faceMode: { kind: 'unique', variantId: null }, slots };
  const lookBytes = bytes(look), inputSnapshotSHA = sha(lookBytes);
  const a = sha(Buffer.from('synthetic-style')), b = sha(Buffer.from('synthetic-frame'));
  const references = [{ index:1,role:'drawing-technique-only',sha256:a },{ index:2,role:'framing-only',sha256:b,guide:{mode:'portrait',gender:'female',sourceHash:b,landmarkBinding:'headtop'} }];
  const composition = { shot:'medium-close-up-119',cameraContractId:'synthetic-frame',mode:'portrait',coordinatedHeadTorso:true,viewerRight:true,gazeCamera:true,fullHeadShoulderConstraints:true,measuredFrameGuide:{landmarks:['headtop'],contractId:'synthetic-frame'} };
  const design = previewPortrait({lookBytes,references,composition,packageVersion:1});
  const sourceImageBytes = Buffer.from('synthetic-source-bytes'), ruleBytes = bytes({schemaVersion:2,referenceVersion:'synthetic-rule'});
  const packageBytes = bytes({id:'seoul-dengoku-portrait-package',version:1,assets:[{role:'canvas-rule',sha256:sha(ruleBytes)},...references.map(r=>({sha256:r.sha256}))]});
  const previewBytes = bytes({id:look.characterId,output:{binding:{characterId:look.characterId,name:look.name},designPrompt:design,expected:{inputSnapshotSHA,packageVersion:1}}});
  return {look,lookBytes,inputSnapshotSHA,references,composition,design,normalized:{lookBytes,previewBytes,packageBytes,ruleBytes,sourceImageBytes,sourceSHA:sha(sourceImageBytes)}};
}
export function modeFixture(mode) {
  const f=fixture(), selected=['body','head','hair','upper','lower','footwear','equipment'];
  const sourced=value=>({value,status:'authored-draft',source:'synthetic:/mode'});
  const modeSource={schema:'avatar-mode-source.v1',mode,characterId:f.look.characterId,lookId:f.look.lookId,inputSnapshotSHA:f.inputSnapshotSHA,
    canvas:sourced({width:1024,height:2048,unit:'px'}),pose:sourced({coordinateSystem:'right-handed-y-up',unit:'cm',anchors:Object.fromEntries(selected.map(part=>[part,{parent:part==='body'?null:'body',anchor:'authored-'+part,position:[0,0,0]}]))}),
    coverage:sourced(Object.fromEntries(selected.map(part=>[part,{visibility:'visible',geometry:null}]))),parts:mode==='3Dparts'?sourced(selected):null};
  const modeBytes=bytes(modeSource);
  return {...f,modeSource,input:{lookBytes:f.lookBytes,inputSnapshotSHA:f.inputSnapshotSHA,modeBytes,modeSHA:sha(modeBytes)}};
}
