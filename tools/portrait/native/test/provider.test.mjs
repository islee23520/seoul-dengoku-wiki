import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generatePortrait } from '../lib/index.mjs';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
test('native provider sends real multipart edit wire and validates returned PNG; no paid endpoint',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'avatar-wire-'));
  const pixels=Buffer.alloc(1024*1536*4);pixels.set([30,40,50,255],0);
  const png=encodeFinalPng({width:1024,height:1536,pixels});let captured;
  const server=createServer(async(req,res)=>{const chunks=[];for await(const c of req)chunks.push(c);captured={url:req.url,headers:req.headers,body:Buffer.concat(chunks).toString()};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{b64_json:png.toString('base64')}]}));});
  const ready=once(server,'listening');server.listen(0,'127.0.0.1');await ready;
  try {
    const config=join(dir,'connection.json'),image=join(dir,'reference.png'),output=join(dir,'output.png');
    await writeFile(config,JSON.stringify({schemaVersion:1,provider:'openai-compatible',baseUrl:'http://127.0.0.1:'+server.address().port+'/v1',allowUnauthenticated:true}));await writeFile(image,png);
    const r=await generatePortrait(['--connection-config',config,'--image',image,'--prompt','One original avatar with blue jacket.','--size','1024x1536','--background','transparent','-o',output]);
    assert.equal(r.ok,true);assert.equal(captured.url,'/v1/images/edits');assert.match(captured.headers['content-type'],/^multipart\/form-data;/);assert.match(captured.body,/name="image\[\]"/);assert.match(captured.body,/gpt-image-2.5-sunburst/);assert.equal(captured.headers.authorization,undefined);assert.deepEqual(await readFile(output),png);assert.equal(JSON.parse(await readFile(output+'.receipt.json','utf8')).status,'candidate-unreviewed');
    await assert.rejects(generatePortrait(['--connection-config',config,'--image',image,'--prompt','Original avatar','-o',output]),/exists/);
  } finally {await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});

test('a dispatched HTTP failure retains the exact request and forbids accidental repeat', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'avatar-http-failure-'));
  let calls = 0;
  const server = createServer(async (req, res) => { for await (const chunk of req) {} calls++; res.writeHead(503).end('unavailable'); });
  const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
  try {
    const config = join(dir, 'connection.json'), image = join(dir, 'reference.png'), output = join(dir, 'candidate.png');
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, allowUnauthenticated: true }));
    const pixels = Buffer.alloc(16 * 16 * 4, 255); await writeFile(image, encodeFinalPng({ width: 16, height: 16, pixels }));
    const args = ['--connection-config', config, '--image', image, '--prompt', 'One original portrait.', '-o', output];
    await assert.rejects(generatePortrait(args), /HTTP 503/);
    const request = JSON.parse(await readFile(output + '.request.json', 'utf8'));
    assert.equal(request.model, 'gpt-image-2.5-sunburst');
    await assert.rejects(generatePortrait(args), /already exists/);
    assert.equal(calls, 1);
  } finally { const closed = once(server, 'close'); server.close(); await closed; await rm(dir, { recursive: true, force: true }); }
});
