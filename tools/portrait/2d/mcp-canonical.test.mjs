import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once, EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

const root = fileURLToPath(new URL('.', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const timeout = () => AbortSignal.timeout(10000);

// Speak native newline-delimited MCP JSON-RPC; never load the server in this process.
async function connect(env) {
  const child = spawn(process.execPath, [join(root, 'mcp.mjs')], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  const closed = once(child, 'close');
  const replies = new EventEmitter();
  let buffer = '', stderr = '', id = 0;
  child.stderr.on('data', bytes => { stderr += bytes; });
  child.stdout.on('data', bytes => {
    buffer += bytes;
    let end;
    while ((end = buffer.indexOf('\n')) !== -1) {
      const response = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (response.id != null) replies.emit(String(response.id), response);
    }
  });
  const request = async (method, params) => {
    const requestId = ++id;
    const received = once(replies, String(requestId), { signal: timeout() });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
    const [response] = await received;
    assert.equal(response.error, undefined, JSON.stringify(response.error));
    return response.result;
  };
  try {
    const initialized = await request('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'canonical-stdio-qa', version: '1.0.0' } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    return { child, initialized, request, async close() {
      child.stdin.end();
      const result = await Promise.race([closed, once(replies, 'never', { signal: timeout() })]);
      assert.equal(stderr, '');
      assert.throws(() => process.kill(child.pid, 0), /ESRCH/);
      return { pid: child.pid, exit: result, absent: true };
    } };
  } catch (error) { child.kill(); await closed; throw error; }
}

async function exercise(actual = false) {
  const base = fileURLToPath(new URL('../../../.omo/evidence/cast-remaining-delivery-20261003/task-26/mcp/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'fixture-'));
  const providerEvents = new EventEmitter();
  const posts = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    posts.push({ path: req.url, body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/chat/completions') {
      const source = JSON.parse(body).messages[1].content;
      res.end(JSON.stringify({ choices: [{ message: { content: source.replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) } }] }));
    } else if (req.url === '/images/edits') {
      const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
      assert.equal(form.get('prompt').includes('serializedRecipientContext='), false);
      assert.equal(form.get('prompt').includes('lore/name-pools/person-id-registry.json'), false);
      assert.equal(form.get('prompt').includes('Authored K027 background.'), false);
      res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
      providerEvents.emit('image');
    } else { res.statusCode = 404; res.end('{}'); }
  });
  let client, port;
  const report = { actual, sourceSha256: sha(await readFile(join(root, 'mcp.mjs'))), exchanges: [] };
  try {
    const listening = once(server, 'listening', { signal: timeout() });
    server.listen(0, '127.0.0.1');
    await listening;
    port = server.address().port;
    const record = JSON.parse(await readFile(actual ? process.env.MCP_QA_TOKEN : join(root, 'characters/shin-jongmok.json'), 'utf8'));
    if (!actual) {
      const registry = JSON.stringify({ persons: [{ id: 'K027', name: '기바름' }] });
      const background = JSON.stringify({ content: [{ ko: 'Authored K027 background.' }] });
      for (const path of ['lore/name-pools', 'lore/characters', 'public/person-details']) await mkdir(join(dir, path), { recursive: true });
      await writeFile(join(dir, 'lore/name-pools/person-id-registry.json'), registry);
      await writeFile(join(dir, 'lore/characters/card.json'), background);
      Object.assign(record, { characterId: 'K027', name: '기바름', personId: 'person-0027', identity: { characterId: 'K027', name: '기바름' }, birthContext: { birthDate: '2071-11-28', age: 55, ageAsOf: '2126-12-31' }, canonicalContext: { characterId: 'K027', name: '기바름', personId: 'person-0027', registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: sha(registry) }, background: [{ path: 'lore/characters/card.json', pointer: '/content/0', sha256: sha(background), text: 'Authored K027 background.' }] } });
      await writeFile(join(dir, 'lore/name-pools/cast-birthdays.json'), JSON.stringify({ ageAsOf: record.birthContext.ageAsOf, people: [{ id: record.characterId, name: record.name, birthDate: record.birthContext.birthDate }] }));
      await writeFile(join(dir, 'public/person-details/person-0027.json'), JSON.stringify({ id: record.personId, name: record.name, detailRoute: '/people/person-0027', familyTree: { personId: record.characterId }, ...record.birthContext }));
    }
    const token = join(dir, 'token.json');
    const reference = join(dir, 'style.png');
    const style = join(dir, 'style.json');
    await writeFile(token, JSON.stringify(record));
    await writeFile(reference, png);
    await writeFile(style, JSON.stringify({ styleId: 'local-qa', status: 'owner-selected-reference', referenceSha256: sha(png) }));
    // Whitelist only explicitly owned local configuration; no production keys, URLs, HOME or NODE_OPTIONS.
    const env = { PATH: process.env.PATH, HOME: dir, PORTRAIT_STYLE_REFERENCE: reference, PORTRAIT_OUTPUT_DIR: dir, PORTRAIT_CANONICAL_ROOT: actual ? process.env.MCP_QA_CANONICAL_ROOT : dir, CHARACTER_AI_BASE_URL: `http://127.0.0.1:${port}`, CHARACTER_AI_API_KEY: '', CHARACTER_AI_IMAGE_MODEL: 'local-fake', CHARACTER_AI_TRANSLATION_MODEL: 'local-fake' };
    client = await connect(env);
    report.initialize = client.initialized;
    const tools = await client.request('tools/list', {});
    assert.ok(tools.tools.some(tool => tool.name === 'preview_prompt'));
    assert.equal(tools.tools.find(tool => tool.name === 'preview_prompt').inputSchema.properties.canonicalRoot, undefined);
    const args = { wikiToken: token, faceMode: { kind: 'unique', variantId: null }, mode: 'portrait', stylePath: style };
    const call = async (name, arguments_) => {
      const result = await client.request('tools/call', { name, arguments: arguments_ });
      report.exchanges.push({ name, arguments: arguments_, result });
      return result;
    };
    const valid = await call('preview_prompt', { ...args, canonicalRoot: '/untrusted-request-root' });
    assert.notEqual(valid.isError, true, valid.content[0].text);
    const parsed = JSON.parse(valid.content[0].text);
    assert.equal(parsed.characterId, 'K027');
    assert.deepEqual(parsed.canonicalContext, record.canonicalContext);
    assert.deepEqual(parsed.birthContext, record.birthContext);
    assert.equal(Object.hasOwn(parsed, 'canonicalRoot'), false);
    assert.ok(!parsed.prompt.includes(env.PORTRAIT_CANONICAL_ROOT));
    for (const kind of ['date', 'age', 'sha', 'pointer']) {
      const invalid = structuredClone(record);
      if (kind === 'date') invalid.birthContext.birthDate = '2071-02-31';
      if (kind === 'age') invalid.birthContext.age++;
      if (kind === 'sha') invalid.canonicalContext.registry.sha256 = '0'.repeat(64);
      if (kind === 'pointer') invalid.canonicalContext.registry.pointer = '/persons/999999';
      await writeFile(token, JSON.stringify(invalid));
      for (const name of ['preview_prompt', 'generate_image']) {
        const result = await call(name, args);
        assert.equal(result.isError, true, kind);
        assert.match(JSON.parse(result.content[0].text).error, /canonical/);
      }
      assert.equal(posts.length, 0);
    }
    await writeFile(token, JSON.stringify(record));
    const imageReceived = once(providerEvents, 'image', { signal: timeout() });
    const generated = await call('generate_image', args);
    assert.notEqual(generated.isError, true, generated.content[0].text);
    await imageReceived;
    const receipt = JSON.parse(generated.content[0].text);
    assert.equal(receipt.characterId, 'K027');
    assert.deepEqual(receipt.birthContext, record.birthContext);
    assert.deepEqual(receipt.canonicalContext, record.canonicalContext);
    const files = await readdir(dir);
    const image = files.find(name => name.startsWith('character-') && name.endsWith('.png'));
    assert.equal(sha(await readFile(join(dir, image))), receipt.imageSha256);
    report.generatedReceipt = JSON.parse(await readFile(join(dir, image + '.json'), 'utf8'));
    report.requestReceipt = JSON.parse(await readFile(join(dir, image + '.request.json'), 'utf8'));
    assert.equal(posts.filter(post => post.path === '/images/edits').length, 1);
    report.posts = posts;
    report.childCleanup = await client.close(); client = null;
    delete env.PORTRAIT_CANONICAL_ROOT;
    client = await connect(env);
    const missing = await call('preview_prompt', { ...args, canonicalRoot: actual ? process.env.MCP_QA_CANONICAL_ROOT : dir });
    assert.equal(missing.isError, true);
    assert.equal(JSON.parse(missing.content[0].text).error, 'authoritative context requires canonicalRoot');
    const legacy = await call('preview_prompt', { character: 'shin-jongmok', faceMode: args.faceMode, mode: args.mode, stylePath: style });
    assert.notEqual(legacy.isError, true, legacy.content[0].text);
    assert.equal(JSON.parse(legacy.content[0].text).canonicalContext, undefined);
  } finally {
    if (client) report.legacyChildCleanup = await client.close();
    if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (port) {
      await assert.rejects(fetch(`http://127.0.0.1:${port}`, { signal: timeout() }));
      report.providerCleanup = { port, absent: true };
    }
    await rm(dir, { recursive: true, force: true });
    report.fixturesRemoved = true;
    if (actual) console.log('MCP_STDIO_QA=' + JSON.stringify(report));
  }
}

test('trusted startup canonical root reaches native stdio preview and generation; invalid and legacy boundaries remain intact', () => exercise());
if (process.env.MCP_QA_TOKEN) test('actual current K027 source snapshots cross fresh native MCP stdio', () => exercise(true));
