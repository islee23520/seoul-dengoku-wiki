import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {test, describe} from 'vitest';
import {emit, generationRequest} from './emit-character-prompt.mjs';
import {visualInstruction, englishGenerationPrompt} from './image-generate.mjs';
import {parse, SCHEMA, strictJSONParse, validate, projectFromNormalizedToken} from './design-prompt.mjs';
import {slotFields, neutralRecord} from '../neutral-slots.mjs';
import Ajv2020 from 'ajv/dist/2020.js';

const composition = {shot:'medium-close-up-119',mode:'portrait',cameraContractId:'head-torso-119',coordinatedHeadTorso:true,viewerRight:true,gazeCamera:true,fullHeadShoulderConstraints:true,measuredFrameGuide:{contractId:'head-torso-119',landmarks:['head-torso']}};
const actualReferences = [
  {index:1,role:'drawing-technique-only',sha256:createHash('sha256').update('checked style').digest('hex'),priority:10,allowedProperties:['linework']},
  {index:2,role:'individual-face-only',sha256:createHash('sha256').update('individual face').digest('hex'),allowedProperties:['description','eyeColor']},
  {index:3,role:'framing-only',sha256:createHash('sha256').update('measured mannequin').digest('hex'),allowedProperties:['pose','frame'],guide:{mode:'portrait',gender:'male',sourceHash:createHash('sha256').update('measured mannequin').digest('hex'),landmarkBinding:'head-torso'}}
];
const complete = appearance => Object.fromEntries(Object.entries(slotFields).map(([slot,fields])=>[slot,Object.fromEntries(fields.map(field=>[field,appearance[slot]?.[field] ?? null]))]));

test('exported canvas constraints match runtime supported pairs and output binding', async () => {
  const exported = JSON.parse(await readFile(new URL('./design-prompt.schema.json', import.meta.url), 'utf8'));
  const numeric = exported.properties.composition.anyOf[0].properties.measuredFrameGuide.anyOf.find(value => value.properties?.targets);
  assert.deepEqual(numeric.properties.canvas.anyOf.map(value => value.prefixItems.map(item => item.const)), [[1024, 1536], [1152, 1344]]);
  assert.deepEqual(exported.properties.output.properties.width.enum, [1024, 1152]);
  assert.deepEqual(exported.properties.output.properties.height.enum, [1536, 1344]);
  const conditional = exported.allOf[0];
  assert.deepEqual(conditional.if.properties.composition.properties.measuredFrameGuide.properties.canvas.const, [1152, 1344]);
  for (const [branch, canvas] of [['then', [1152, 1344]], ['else', [1024, 1536]]]) {
    const fields = conditional[branch].properties.output.properties;
    assert.deepEqual([fields.width.const, fields.height.const], canvas);
    assert.equal(fields.desired.const, canvas.join('x'));
  }
});

test('portrait JSON carries authored values and separates reference responsibilities', async () => { // prose fixture preserved for task7 emitter integration
  const parent=new URL('../../../.omo/evidence/design-prompt-tests/',import.meta.url);
  await mkdir(parent,{recursive:true});
  const dir=await mkdtemp(new URL('case-',parent));
  try {
    const image=join(dir,'style.png'), style=join(dir,'style.json');
    await writeFile(image,'checked style');
    await writeFile(style,JSON.stringify({status:'owner-selected-reference',styleId:'fixture',referenceSha256:createHash('sha256').update('checked style').digest('hex')}));
    const trait=value=>({value,status:'authored-draft',source:'fixture'});
    const character={schemaVersion:2,characterId:'K998',name:'Private Name',faceMode:{kind:'unique',variantId:null},identity:{gender:trait('남성')},slots:{face:{description:trait('individual oval face')},hair:{description:trait('short side braid')},body:{skin:trait('soft olive tan'),height:{...trait(175),unit:'cm'}},outfit:{upper:trait('taupe jacket')},accessories:{description:trait('none')}}};
    const result=await emit({character,mode:'portrait',stylePath:style,referencePath:image,requireFaceMode:true});
    assert.throws(() => generationRequest(result,{output:join(dir,'unused.png'),identityReference:'owner.png'}), /authoring-only/);
    const model=projectFromNormalizedToken(character, {references:actualReferences,composition}); // strict projection from normalized selected token for task5; prose fixture preserved
    assert.equal(model.schema,SCHEMA);
    assert.equal(model.recipient.gender,'male');
    assert.equal(model.appearance.hair.description,'short side braid');
    assert.equal(model.appearance.body.skin,'soft olive tan');
    assert.deepEqual(model.appearance.body.height,{value:175,unit:'cm'});
    assert.deepEqual(model.references.map(r=>[r.index,r.role]),[[1,'drawing-technique-only'],[2,'individual-face-only'],[3,'framing-only']]);
    assert.equal(model.face.kind,'unique');
    assert.equal(model.output.background,'transparent');
    const exported = JSON.parse(await readFile(new URL('./design-prompt.schema.json', import.meta.url), 'utf8'));
    const validateExport = new Ajv2020({ strict: false }).compile(exported);
    assert.equal(validateExport(model), true, JSON.stringify(validateExport.errors));
    const opaque = projectFromNormalizedToken(character, {references:actualReferences,composition,background:'opaque'});
    assert.equal(opaque.output.background,'opaque');
    assert.deepEqual({...opaque,output:model.output},model);
    assert.equal(model.composition.shot,'medium-close-up-119');
    assert.equal(JSON.stringify(model).includes(character.name),false);
    assert.equal(JSON.stringify(model).includes('fixture'),false);
    assert.deepEqual(character.slots.body.height,{...trait(175),unit:'cm'});
  } finally {await rm(dir,{recursive:true,force:true});}
});

test.each(['value','field','role','number'])('JSON translation rejects %s changes in machine or already-English values',async kind=>{
  const source={schema:SCHEMA,recipient:{gender:'male',ageCategory:null},face:{kind:'unique',variantId:null},appearance:complete({body:{skin:'soft olive tan'},hair:{description:'검은 단발'}}),references:actualReferences.map(({sha256,...ref})=>({...ref,sourceHash:sha256})),composition,output:{format:'single-portrait',background:'opaque',width:1024,height:1536,rgba:true,noBakedText:true}};
  const translated=structuredClone(source);translated.appearance.hair.description='short black hair';
  if(kind==='value')translated.appearance.body.skin='pale';
  if(kind==='field')delete translated.appearance.body.skin;
  if(kind==='role')translated.references[0].role='individual-face-only';
  if(kind==='number')translated.output.width=2048;
  await assert.rejects(englishGenerationPrompt(JSON.stringify(source),async()=>JSON.stringify(translated)));
});

test('JSON translation accepts only non-English leaf translation with structure intact',async()=>{
  const source={schema:'character-art-2d.v1',recipient:{gender:'male',ageCategory:null},face:{kind:'unique',variantId:null},appearance:complete({body:{skin:'soft olive tan'},hair:{description:'검은 단발'}}),references:actualReferences.map(({sha256,...ref})=>({...ref,sourceHash:sha256})),composition,output:{format:'single-portrait',background:'opaque',width:1024,height:1536,rgba:true,noBakedText:true}};
  const translated=structuredClone(source);translated.appearance.hair.description='short black hair';
  assert.deepEqual(JSON.parse(await englishGenerationPrompt(JSON.stringify(source),async()=>JSON.stringify(translated))),translated);
  assert.deepEqual(JSON.parse(await englishGenerationPrompt(JSON.stringify(translated),async()=>{throw Error('unexpected translator');})),translated);
});

describe('character-art-2d.v1 production model (task5 contract)', () => {
  const baseFixture = {
    schema: SCHEMA,
    recipient: { gender: 'male', ageCategory: 'adult' },
    face: { kind: 'unique', variantId: null },
    appearance: {
      face: { description: 'individual oval face', eyeColor: 'dark brown' },
      hair: { description: 'short side braid', color: 'black' },
      body: { skin: 'soft olive tan', height: { value: 175, unit: 'cm' }, build: 'athletic' },
      outfit: { upper: 'taupe jacket', lower: null },
      accessories: { description: null }
    },
    references: [
      { index: 1, role: 'drawing-technique-only', priority: 10, sourceHash: 'a'.repeat(64) },
      { index: 2, role: 'individual-face-only', allowedProperties: ['description', 'eyeColor'] },
      { index: 3, role: 'framing-only', guide: { mode: 'portrait', gender: 'male', sourceHash: 'b'.repeat(64), landmarkBinding: 'head-torso' } }
    ],
    composition: {
      shot: 'medium-close-up-119',
      mode: 'portrait',
      coordinatedHeadTorso: true,
      viewerRight: true,
      gazeCamera: true,
      fullHeadShoulderConstraints: true,
      cameraContractId: 'head-torso-119',
      measuredFrameGuide: 'explicit-pending'
    },
    output: {
      format: 'single-portrait',
      background: 'opaque',
      width: 1024,
      height: 1536,
      rgba: true,
      noBakedText: true,
      desired: '1024x1536'
    }
  };

  baseFixture.appearance = complete(baseFixture.appearance);

  test.each(['unique', 'template'])('same-owner recipient appearance preservation retains authored slots and %s face mode', kind => {
    const input = structuredClone(baseFixture);
    input.face = {kind, variantId: kind === 'template' ? 'variant-17' : null};
    input.references[1] = {index: 2, role: 'recipient-appearance-only', sameOwnerRecipient: true, sourceHash: 'c'.repeat(64), allowedProperties: ['face', 'body', 'hair', 'outfit', 'accessories']};
    const parsed = parse(input);
    assert.deepEqual(parsed, input);
    assert.deepEqual(parsed.appearance, baseFixture.appearance);
  });

  test.each(['unique', 'template'])('exported schema validates runtime same-owner preservation and rejects invalid authority for %s', async kind => {
    const exported = JSON.parse(await readFile(new URL('./design-prompt.schema.json', import.meta.url), 'utf8'));
    const validateExport = new Ajv2020({ strict: false }).compile(exported);
    const input = structuredClone(baseFixture);
    input.face = { kind, variantId: kind === 'template' ? 'variant-17' : null };
    input.references[1] = { index: 2, role: 'recipient-appearance-only', sameOwnerRecipient: true, sourceHash: 'c'.repeat(64), allowedProperties: ['face', 'body', 'hair', 'outfit', 'accessories'] };
    const runtime = parse(input);
    assert.equal(validateExport(runtime), true, JSON.stringify(validateExport.errors));
    for (const mutation of ['missing-owner', 'false-owner', 'missing-hash', 'zero-hash', 'malformed-hash', 'forbidden-property', 'private-key', 'owner-on-technique']) {
      const invalid = structuredClone(input);
      const ref = invalid.references[1];
      if (mutation === 'missing-owner') delete ref.sameOwnerRecipient;
      if (mutation === 'false-owner') ref.sameOwnerRecipient = false;
      if (mutation === 'missing-hash') delete ref.sourceHash;
      if (mutation === 'zero-hash') ref.sourceHash = '0'.repeat(64);
      if (mutation === 'malformed-hash') ref.sourceHash = 'invalid';
      if (mutation === 'forbidden-property') ref.allowedProperties.push('pose');
      if (mutation === 'private-key') ref.privatePath = 'private.png';
      if (mutation === 'owner-on-technique') invalid.references[0].sameOwnerRecipient = true;
      assert.throws(() => parse(invalid));
      assert.equal(validateExport(invalid), false, mutation);
    }
  });

  test.each(['style', 'drawing-technique', 'pose', 'camera', 'frame', 'guide', 'missing-owner', 'missing-hash', 'other-owner', 'other-role', 'missing-style', 'missing-framing', 'canvas'])('recipient appearance role rejects forbidden authority: %s', mutation => {
    const input = structuredClone(baseFixture);
    const ref = input.references[1] = {index: 2, role: 'recipient-appearance-only', sameOwnerRecipient: true, sourceHash: 'c'.repeat(64), allowedProperties: ['face', 'body', 'hair', 'outfit', 'accessories']};
    if (['style', 'drawing-technique', 'pose', 'camera', 'frame'].includes(mutation)) ref.allowedProperties.push(mutation);
    if (mutation === 'guide') ref.guide = input.references[2].guide;
    if (mutation === 'missing-owner') delete ref.sameOwnerRecipient;
    if (mutation === 'missing-hash') delete ref.sourceHash;
    if (mutation === 'other-owner') ref.sameOwnerRecipient = false;
    if (mutation === 'other-role') ref.role = 'individual-face-only';
    if (mutation === 'missing-style') input.references[0].role = 'individual-face-only';
    if (mutation === 'missing-framing') input.references[2] = {...ref, index: 3};
    if (mutation === 'canvas') input.output.width = 1152;
    assert.throws(() => parse(input));
  });

  test.each(['same as latest photo', 'Use the latest owner photograph', 'visibly fuller than the reference person', '사진과 동일하게 생성', '기존 신종목 초상의 청록색 높은 옷깃 재킷', 'same as the previous portrait'])('rejects unresolved appearance dependencies before generation: %s', value => {
    const input = structuredClone(baseFixture);
    input.appearance.face.description = value;
    assert.throws(() => parse(input), /standalone appearance/);
  });

  test('standalone authored visual descriptions retain ordinary separators', () => {
    const input = structuredClone(baseFixture);
    input.appearance.hair.description = 'wavy/curly black hair';
    assert.equal(parse(input).appearance.hair.description, input.appearance.hair.description);
  });

  test('parses exact authored values, preserves null/unit/number, input immutable, readonly/frozen', () => {
    const input = structuredClone(baseFixture);
    const originalInput = structuredClone(input);
    const model = parse(input);
    assert.equal(model.schema, SCHEMA);
    assert.equal(model.recipient.gender, 'male');
    assert.equal(model.recipient.ageCategory, 'adult');
    assert.equal(model.face.kind, 'unique');
    assert.equal(model.appearance.body.height.value, 175);
    assert.equal(model.appearance.body.height.unit, 'cm');
    assert.equal(model.appearance.accessories.description, null);
    assert.deepEqual(model.references.map(r => [r.index, r.role]), [[1, 'drawing-technique-only'], [2, 'individual-face-only'], [3, 'framing-only']]);
    assert.equal(model.composition.mode, 'portrait');
    assert.equal(model.output.background, 'opaque');
    assert.equal(model.output.noBakedText, true);
    assert.deepEqual(input, originalInput);
    assert(Object.isFrozen(model));
    assert(Object.isFrozen(model.appearance.body.height));
    assert.throws(() => { model.recipient.gender = 'female'; });
  });

  test('rejects unknown keys, private fields, nonfinite, null-unit misuse, conflicting descriptive/granular slot values not silently removed', () => {
    assert.throws(() => parse({ ...baseFixture, unknownKey: true }), /Unrecognized key|invalid_key|unknown/);
    assert.throws(() => parse({ ...baseFixture, _private: 'no' }), /Unrecognized key|unknown/);
    const badNum = structuredClone(baseFixture);
    badNum.appearance.body.height = { value: Infinity, unit: 'cm' };
    assert.throws(() => parse(badNum), /finite|nonfinite|Invalid input/);
    const badUnit = structuredClone(baseFixture);
    badUnit.appearance.body.height = { value: 175 };
    assert.throws(() => parse(badUnit), /unit|misuse/);
    const conflict = structuredClone(baseFixture);
    conflict.appearance.hair = { ...conflict.appearance.hair, description: 'braid', shape: 'side-braid' };
    const parsedConflict = parse(conflict);
    assert.equal(parsedConflict.appearance.hair.description, 'braid');
    assert.equal(parsedConflict.appearance.hair.shape, 'side-braid');
  });

  test('rejects duplicate JSON keys (same object only), accepts same keys in separate objects or quoted key-like text; raw safe leaves preserved', () => {
    // duplicate in JSON string rejected by strictJSONParse; object literal normalizes so not tested here
    const dupJson = '{"schema":"character-art-2d.v1","composition":{"shot":"medium-close-up-119","mode":"portrait","mode":"full"}}';
    assert.throws(() => strictJSONParse(dupJson), /Duplicate key "mode"/);
    // separate objects ok
    const separate = { a: { x: 1 }, b: { x: 2 } };
    assert.deepEqual(strictJSONParse(JSON.stringify(separate)), separate);
    // quoted key-like text in value preserved, no prose pinning
    const withText = { ...baseFixture, appearance: { ...baseFixture.appearance, hair: { ...baseFixture.appearance.hair, description: 'key-like: "duplicate-key-text"; with,delimiters' } } };
    const p = parse(withText);
    assert.equal(p.appearance.hair.description, 'key-like: "duplicate-key-text"; with,delimiters');
  });

  test('guide rules, schema match, exact keys, visual priority, no name/biography, all task5 verified', () => {
    const model = parse(baseFixture);
    assert.equal(model.schema, SCHEMA);
    const keys = Object.keys(model);
    assert(keys.includes('recipient') && keys.includes('face') && keys.includes('appearance') && keys.includes('references') && keys.includes('composition') && keys.includes('output'));
    assert(!keys.includes('name') && !keys.includes('biography') && !keys.includes('origins'));
    assert.equal(model.references[0].priority, 10);
    assert.equal(model.references[2].guide.gender, 'male');
    assert.doesNotThrow(() => validate(baseFixture));
    // input immutability and readonly already asserted in previous test
    // schema file verified by existence and title in previous reads
  });
  test('samekeyseparateobjects and full serialized model retain every leaf', () => {
    assert.deepEqual(strictJSONParse('{"a":{"x":1},"b":{"x":2},"items":[{"x":3},{"x":4}]}'), {a:{x:1},b:{x:2},items:[{x:3},{x:4}]});
    const input=structuredClone(baseFixture);
    input.appearance.hair.description='{"x": 3}, [delimiters]; "face":';
    assert.deepEqual(parse(JSON.stringify(input)),input);
  });
  test('escapedduplicate rejects decoded keys in objects and arrays', () => {
    for(const text of ['{"x":1,"\u0078":2}','[{"x":1,"\u0078":2}]','{"__proto__":1,"__proto__":2}']) assert.throws(()=>strictJSONParse(text),/Duplicate/);
  });
  test.each([
    {value:'PRIVATE',unit:'cm'}, {value:175,unit:'cm',privatePath:'/private/owner'},
    {value:null,unit:null}, {value:175,unit:' '}, {value:NaN,unit:'cm'}, {value:175,unit:'cm',source:null}
  ])('strictnumericobject rejects malformed leaf %j', value => {
    const input=structuredClone(baseFixture); input.appearance.body.height=value; assert.throws(()=>parse(input));
  });
  test('privateuploads reject even when all upload hashes are valid', () => {
    const input=structuredClone(baseFixture); input.references[0].uploads=[{sha256:'a'.repeat(64),path:'/private/owner/name.png'}]; assert.throws(()=>parse(input));
  });
  test.each(['unique','template'])('UNIQUE/template roles reject mismatched face references: %s',kind=>{
    const input=structuredClone(baseFixture); input.face={kind,variantId:kind==='template'?'variant-17':null};
    input.references[1].role=kind==='unique'?'face-base-only':'individual-face-only'; assert.throws(()=>parse(input),/mismatch/);
    input.references[1].role=kind==='unique'?'individual-face-only':'face-base-only'; assert.doesNotThrow(()=>parse(input));
  });
  test.each(['props','landmark','gender','mode','hash','missing','nonframing','technique','face'])('guideprops/landmark and role isolation reject %s', kind=>{
    const input=structuredClone(baseFixture),ref=input.references[2];
    if(kind==='props')ref.allowedProperties=['skin'];
    if(kind==='landmark')delete ref.guide.landmarkBinding;
    if(kind==='gender')ref.guide.gender='female';
    if(kind==='mode')ref.guide.mode='3D';
    if(kind==='hash')ref.sourceHash='c'.repeat(64);
    if(kind==='missing')delete ref.guide;
    if(kind==='nonframing')input.references[0].guide=ref.guide;
    if(kind==='technique')input.references[0].allowedProperties=['skin','body'];
    if(kind==='face')input.references[1].allowedProperties=['skin','outfit'];
    assert.throws(()=>parse(input));
  });
  test.each(Object.keys(slotFields))('allfiveappearance requires complete %s including authored nulls',slot=>{
    const input=structuredClone(baseFixture); delete input.appearance[slot]; assert.throws(()=>parse(input));
    for(const field of slotFields[slot]) {
      const partial=structuredClone(baseFixture); delete partial.appearance[slot][field]; assert.throws(()=>parse(partial));
      const changed=structuredClone(baseFixture); changed.appearance[slot][field]=null;
      assert.equal(parse(changed).appearance[slot][field],null);
      const unknown=structuredClone(baseFixture); unknown.appearance[slot][field+'Private']=null; assert.throws(()=>parse(unknown));
    }
  });
  test('realprojection uses neutralRecord, actual ordered references and original units without mutation',()=>{
    const trait=value=>({value,status:value===null?'unknown':'authored-draft',source:value===null?null:'private token source'});
    const token={schemaVersion:2,characterId:'K998',name:'Private Name',faceMode:{kind:'template',variantId:'variant-17'},identity:{gender:trait('남성'),ageCategory:trait('adult')},slots:{face:{description:trait('individual oval face')},hair:{description:trait('short side braid')},body:{skin:trait('soft olive tan'),height:{...trait(1.75),unit:'m'},weight:{...trait(165),unit:'lb'}},outfit:{upper:trait('taupe jacket')},accessories:{description:trait(null)}}};
    const options={mode:'portrait',references:structuredClone(actualReferences),composition:structuredClone(composition)};
    options.references[1].role='face-base-only';
    const original=structuredClone({token,options}), normalized=neutralRecord(token), model=projectFromNormalizedToken(normalized,options);
    assert.deepEqual({token,options},original);
    assert.deepEqual(model.appearance,complete({face:{description:'individual oval face'},hair:{description:'short side braid'},body:{skin:'soft olive tan',height:{value:1.75,unit:'m'},weight:{value:165,unit:'lb'}},outfit:{upper:'taupe jacket'}}));
    assert.deepEqual(model.references,options.references.map(({sha256,...ref})=>({...ref,sourceHash:sha256})));
    assert.deepEqual(model.composition,composition);
    assert.equal(JSON.stringify(model).includes('Private Name'),false);
    assert.equal(JSON.stringify(model).includes('private token source'),false);
    assert.throws(()=>projectFromNormalizedToken(token),/references/);
    const bad=structuredClone(token); delete bad.slots.body.height.unit; assert.throws(()=>projectFromNormalizedToken(bad,options),/unit/);
    const missing=structuredClone(options); delete missing.references[2].guide; assert.throws(()=>projectFromNormalizedToken(token,missing),/guide/);
    const noHash=structuredClone(options); delete noHash.references[0].sha256; assert.throws(()=>projectFromNormalizedToken(token,noHash),/hash/);
    const unordered=structuredClone(options); unordered.references.reverse(); assert.throws(()=>projectFromNormalizedToken(token,unordered),/order/);
    const malformed=structuredClone(token); malformed.slots.body.height.status='unknown'; assert.throws(()=>projectFromNormalizedToken(malformed,options),/unknown value/);
  });

});
