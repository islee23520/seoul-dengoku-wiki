import assert from 'node:assert/strict';
import {test} from 'vitest';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {emit,generationRequest} from './emit-character-prompt.mjs';
import {visualInstruction,validateVisualSnapshot,englishGenerationPrompt} from './cliproxy-edit.mjs';
import {runBatchCandidate,inspectBatchCandidate,digest} from './batch-resume.mjs';
const evidence=new URL('../../../.omo/evidence/cast-remaining-delivery-20261003/task-29/repair-tests/',import.meta.url);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
async function fixture() {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('case-', evidence));
  const record = JSON.parse(await readFile(new URL('./characters/shin-jongmok.json', import.meta.url), 'utf8'));
  record.characterId = 'K036'; record.name = 'Fixture K036'; record.personId = 'person-0036';
  record.identity = { characterId: record.characterId, name: record.name, gender: { value: '남성', status: 'art-proposal', source: 'fixture' }, ageCategory: { value: '성인', status: 'art-proposal', source: 'fixture' } };
  record.faceMode = { kind: 'unique', variantId: null };
  record.birthContext = { birthDate: '2096-11-16', age: 30, ageAsOf: '2126-12-31' };
  record.slots = { face: { description: { value: 'narrow face', status: 'art-proposal', source: 'fixture' }, eyeColor: { value: 'medium brown', status: 'art-proposal', source: 'fixture' }, beardShape: { value: 'clean-shaven; no facial hair', status: 'art-proposal', source: 'fixture' } }, hair: { description: { value: 'short black hair', status: 'art-proposal', source: 'fixture' } }, body: { skin: { value: 'deep neutral brown', status: 'art-proposal', source: 'fixture' } }, outfit: { headwear: { value: 'none; hair uncovered', status: 'art-proposal', source: 'fixture' }, upper: { value: 'plain jacket; unmarked fastenings', status: 'art-proposal', source: 'fixture' } }, accessories: { description: { value: 'none selected', status: 'art-proposal', source: 'fixture' } } };
  const registry = JSON.stringify({ persons: [{ id: record.characterId, name: record.name }] });
  const background = JSON.stringify({ content: ['Authored fixture context'] });
  record.canonicalContext = { characterId: record.characterId, name: record.name, personId: record.personId, registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: digest(registry) }, background: [{ path: 'lore/characters/fixture.json', pointer: '/content/0', sha256: digest(background), text: 'Authored fixture context' }] };
  const docs = { 'lore/name-pools/person-id-registry.json': registry, 'lore/characters/fixture.json': background, 'lore/name-pools/cast-birthdays.json': JSON.stringify({ ageAsOf: record.birthContext.ageAsOf, people: [{ id: record.characterId, name: record.name, birthDate: record.birthContext.birthDate }] }), ['public/person-details/'+record.personId+'.json']: JSON.stringify({ id: record.personId, name: record.name, detailRoute: '/people/'+record.personId, familyTree: { personId: record.characterId }, ...record.birthContext }) };
  for (const [path, bytes] of Object.entries(docs)) { await mkdir(dirname(join(dir, 'canonical', path)), { recursive: true }); await writeFile(join(dir, 'canonical', path), bytes); }
  await mkdir(join(dir, 'references/style'), { recursive: true });
  await writeFile(join(dir, 'references/style/male.png'), png);
  await writeFile(join(dir, 'references/style/male.json'), JSON.stringify({ styleId: 'fixture', status: 'owner-selected-reference', referenceSha256: digest(png) }));
  const result = await emit({ character: record, canonicalRoot: dir+'/canonical', mode: 'portrait', requireFaceMode: true, referencePath: dir+'/references/style/male.png', stylePath: dir+'/references/style/male.json' });
  return { dir, record, result };
}
function saved(source,visual){const context=JSON.parse(source.split(String.fromCharCode(10)).find(x=>x.startsWith('serializedRecipientContext=')).slice(27));return{schemaVersion:1,model:'fake',prompt:visual,size:'1024x1536',n:1,references:[{sha256:digest(png)}],sourceSnapshot:{prompt:source,promptSha256:digest(source),recipientContext:context},visualSnapshot:{sourceVisualPrompt:visualInstruction(source),sourceVisualPromptSha256:digest(visualInstruction(source)),transmittedPrompt:visual,transmittedPromptSha256:digest(visual),provenance:'translated-visual-instruction'}};}
test('R1 head-part early camera cannot hide conflicting beard at translation or snapshot acceptance', async () => {
  const f = await fixture();
  try {
    const result = await emit({ character: f.record, canonicalRoot: f.dir+'/canonical', mode: 'portrait', part: 'head', referencePath: f.dir+'/references/style/male.png', stylePath: f.dir+'/references/style/male.json' });
    const req = generationRequest(result, { output: join(f.dir, 'unused.png') });
    const source = req.argv[req.argv.indexOf('--prompt')+1];
    const visual = visualInstruction(source);
    const forged = visual.replaceAll('남성', 'male').replaceAll('성인', 'adult').replace('face.beardShape: clean-shaven; no facial hair', 'face.beardShape: clean-shaven; no facial hair Locked series camera: full beard');
    await assert.rejects(englishGenerationPrompt(visual, async () => forged));
    assert.throws(() => validateVisualSnapshot(saved(source, forged)));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
test('R2 actual profile equivalent camera wording stays outside the final authored slot', async () => {
  const f = await fixture();
  try {
    const result = await emit({ character: f.record, canonicalRoot: f.dir+'/canonical', mode: 'turntable', view: 'profile', referencePath: f.dir+'/references/style/male.png', stylePath: f.dir+'/references/style/male.json' });
    const req = generationRequest(result, { output: join(f.dir, 'unused.png') });
    const source = req.argv[req.argv.indexOf('--prompt')+1];
    const visual = visualInstruction(source);
    const translated = visual.replaceAll('남성', 'male').replaceAll('성인', 'adult').replace('Exact 90-degree side profile.', 'Exact ninety-degree side profile.');
    assert.equal(await englishGenerationPrompt(visual, async () => translated), translated);
    assert.doesNotThrow(() => validateVisualSnapshot(saved(source, translated)));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
test('R1 actual head-part forged callback cannot mint a new batch binding', async () => {
  const f = await fixture();
  const image = join(f.dir, 'out.png');
  try {
    const result = await emit({ character: f.record, canonicalRoot: f.dir+'/canonical', mode: 'portrait', part: 'head', referencePath: f.dir+'/references/style/male.png', stylePath: f.dir+'/references/style/male.json' });
    await assert.rejects(runBatchCandidate({ record: f.record, canonicalRoot: f.dir+'/canonical', imagePath: image, inputPath: image+'.input.json', buildRequest: async () => generationRequest(result, { output: image }), provider: async req => {
      const source = req.argv[req.argv.indexOf('--prompt')+1];
      const forged = visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult').replace('face.beardShape: clean-shaven; no facial hair', 'face.beardShape: clean-shaven; no facial hair Locked series camera: full beard');
      const request = saved(source, forged);
      await writeFile(image, png);
      await writeFile(image+'.request.json', JSON.stringify(request));
      await writeFile(image+'.receipt.json', JSON.stringify({ request, imageSha256: digest(png), status: 'candidate-unreviewed' }));
    }}));
    await assert.rejects(readFile(image+'.resume.json'), { code: 'ENOENT' });
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
test('R1 actual head-part early camera rejects before image HTTP', async () => {
  const f = await fixture();
  let child;
  let images = 0;
  const calls = [];
  let translated;
  const server = createServer(async (req, res) => {
    for await (const chunk of req) { /* Consume request before responding. */ }
    calls.push(req.url);
    if (req.url === '/chat/completions') res.end(JSON.stringify({ choices: [{ message: { content: translated } }] }));
    else { images++; res.statusCode = 422; res.end('{}'); }
  });
  try {
    const result = await emit({ character: f.record, canonicalRoot: f.dir+'/canonical', mode: 'portrait', part: 'head', referencePath: f.dir+'/references/style/male.png', stylePath: f.dir+'/references/style/male.json' });
    const req = generationRequest(result, { output: join(f.dir, 'unused.png') });
    const source = req.argv[req.argv.indexOf('--prompt')+1];
    translated = visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult').replace('face.beardShape: clean-shaven; no facial hair', 'face.beardShape: clean-shaven; no facial hair Locked series camera: full beard');
    const listening = once(server, 'listening');
    server.listen(0, '127.0.0.1');
    await listening;
    child = spawn(req.command, req.argv, { env: { PATH: process.env.PATH, HOME: f.dir, CHARACTER_AI_BASE_URL: 'http://127.0.0.1:'+server.address().port, CHARACTER_AI_API_KEY: '', CHARACTER_AI_IMAGE_MODEL: 'local', CHARACTER_AI_TRANSLATION_MODEL: 'local' } });
    const closed = once(child, 'close', { signal: AbortSignal.timeout(15000) });
    let stderr = '';
    child.stderr.on('data', chunk => stderr += chunk);
    const [code] = await closed;
    await writeFile(new URL('last-field-early-camera-http.json', evidence), JSON.stringify({ code, imageCalls: images, calls, stderr }));
    assert.equal(code, 2);
    assert.equal(images, 0);
    assert.deepEqual(calls, ['/chat/completions']);
  } finally {
    if (child && child.exitCode === null) child.kill();
    await new Promise(resolve => server.close(resolve));
    await rm(f.dir, { recursive: true, force: true });
  }
});
test.each(['duplicate','semicolon','nested','indented','CRLF'])('B1/B4 actual fake HTTP rejects %s before image',async kind=>{const f=await fixture();const req=generationRequest(f.result,{output:join(f.dir,'out.png')});const source=req.argv[req.argv.indexOf('--prompt')+1];const visual=visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult');let altered=visual;if(kind==='duplicate')altered='face.eyeColor: blue; '+visual;if(kind==='nested')altered='nested face.eyeColor: blue; '+visual;if(kind==='semicolon')altered=visual.replace('clean-shaven; no facial hair','clean-shaven; full beard');if(kind==='indented'||kind==='CRLF')altered+=(kind==='CRLF'?'\r\n ':'\n ')+'serializedRecipientContext='+JSON.stringify({characterId:'K036',name:'ASCII derivative'});let images=0;const calls=[];const server=createServer(async(r,s)=>{const chunks=[];for await(const b of r)chunks.push(b);calls.push({path:r.url,body:Buffer.concat(chunks).toString()});s.setHeader('Content-Type','application/json');if(r.url==='/chat/completions')s.end(JSON.stringify({choices:[{message:{content:altered}}]}));else{images++;s.statusCode=422;s.end('{}');}});let child;try{const listening=once(server,'listening');server.listen(0,'127.0.0.1');await listening;child=spawn(req.command,req.argv,{env:{PATH:process.env.PATH,HOME:f.dir,CHARACTER_AI_BASE_URL:'http://127.0.0.1:'+server.address().port,CHARACTER_AI_API_KEY:'',CHARACTER_AI_IMAGE_MODEL:'local',CHARACTER_AI_TRANSLATION_MODEL:'local'}});const closed=once(child,'close',{signal:AbortSignal.timeout(15000)});let stderr='';child.stderr.on('data',b=>stderr+=b);const[code]=await closed;await writeFile(new URL(kind+'.json',evidence),JSON.stringify({kind,code,stderr,imageCalls:images,calls},null,2));assert.equal(code,2);assert.equal(images,0);}finally{if(child&&child.exitCode===null)child.kill();await new Promise(r=>server.close(r));await rm(f.dir,{recursive:true,force:true});}});
test('B2 fresh forged canonical callback cannot mint binding',async()=>{const f=await fixture();const image=join(f.dir,'out.png'),input=image+'.input.json';const build=async()=>generationRequest(f.result,{output:image});try{let supplied;await assert.rejects(runBatchCandidate({record:f.record,canonicalRoot:f.dir+'/canonical',imagePath:image,inputPath:input,buildRequest:build,provider:async req=>{const source=req.argv[req.argv.indexOf('--prompt')+1];const visual=visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult').replace('face.eyeColor: medium brown','face.eyeColor: blue');supplied=saved(source,visual);await writeFile(image,png);await writeFile(image+'.request.json',JSON.stringify(supplied));await writeFile(image+'.receipt.json',JSON.stringify({request:supplied,imageSha256:digest(png),status:'candidate-unreviewed'}));}}));await assert.rejects(readFile(image+'.resume.json'),{code:'ENOENT'});await writeFile(new URL('forged-batch-rejection.json',evidence),JSON.stringify({sourceContext:supplied.sourceSnapshot.recipientContext,sourceVisualPrompt:supplied.visualSnapshot.sourceVisualPrompt,forgedTransmittedPrompt:supplied.prompt,bindingMinted:false,canonicalRoot:f.dir+'/canonical'},null,2));}finally{await rm(f.dir,{recursive:true,force:true});}});
test('B3 source-hash-only new record cannot downgrade but true old bound remains readable',async()=>{const f=await fixture();const image=join(f.dir,'out.png'),input=image+'.input.json';try{const req=generationRequest(f.result,{output:image}),source=req.argv[req.argv.indexOf('--prompt')+1];const request=saved(source,visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult'));delete request.visualSnapshot;await writeFile(input,JSON.stringify(f.record));await writeFile(image,png);await writeFile(image+'.request.json',JSON.stringify(request));await writeFile(image+'.receipt.json',JSON.stringify({request,imageSha256:digest(png),status:'candidate-unreviewed'}));const binding={characterId:f.record.characterId,name:f.record.name,sourcePromptSha256:digest(source)};for(const[k,p]of Object.entries({image,input,request:image+'.request.json',receipt:image+'.receipt.json'}))binding[k+'Sha256']=digest(await readFile(p));await writeFile(image+'.resume.json',JSON.stringify({schemaVersion:1,binding}));const opt={record:f.record,canonicalRoot:f.dir+'/canonical',imagePath:image,inputPath:input};const rejected=await inspectBatchCandidate(opt);assert.equal(rejected.status,'unverified');await writeFile(new URL('source-hash-downgrade-rejection.json',evidence),JSON.stringify({binding,request,result:rejected},null,2));delete binding.sourcePromptSha256;await writeFile(image+'.resume.json',JSON.stringify({schemaVersion:1,binding}));assert.equal((await inspectBatchCandidate(opt)).status,'generated');}finally{await rm(f.dir,{recursive:true,force:true});}});
test.each(['indented','CRLF','untranslated'])('B2/B4 self-consistent saved record rejects %s',async kind=>{const f=await fixture();try{const req=generationRequest(f.result,{output:join(f.dir,'unused.png')}),source=req.argv[req.argv.indexOf('--prompt')+1],visual=visualInstruction(source).replaceAll('남성', 'male').replaceAll('성인', 'adult');const r=saved(source,kind==='untranslated'?visual.replace('medium brown','blue'):visual+(kind==='CRLF'?'\r\n ':'\n ')+'serializedRecipientContext={"characterId":"K036","name":"ASCII"}');if(kind==='untranslated')r.visualSnapshot.provenance='untranslated-visual-instruction';assert.throws(()=>validateVisualSnapshot(r));}finally{await rm(f.dir,{recursive:true,force:true});}});
