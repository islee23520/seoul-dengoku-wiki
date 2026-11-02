import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFile, writeFile, open, mkdtemp, rm, realpath } from 'node:fs/promises';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export const CODEX_IMAGE_MODEL = 'gpt-image-2';
export const CODEX_PROTOCOL_VERSION = '0.160.0';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const opaque = value => typeof value === 'string' && value.length > 0;

// Decode the PNG scanlines, not merely its header. Codex's ordinary RGB/RGBA8
// output is supported; other PNG encodings fail explicitly rather than convert.
export function decodeCodexPng(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Codex output is not PNG');
  let width, height, channels, ended = false;
  const compressed = [];
  for (let offset = 8; offset < bytes.length;) {
    if (bytes.length - offset < 12) throw new Error('truncated PNG');
    const size = bytes.readUInt32BE(offset);
    if (offset + size + 12 > bytes.length) throw new Error('truncated PNG');
    const chunk = bytes.subarray(offset + 4, offset + 8 + size);
    let crc = 0xffffffff;
    for (const byte of chunk) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    if (((crc ^ 0xffffffff) >>> 0) !== bytes.readUInt32BE(offset + 8 + size)) throw new Error('invalid PNG CRC');
    const type = chunk.subarray(0, 4).toString('ascii');
    const body = chunk.subarray(4);
    if (offset === 8 && type !== 'IHDR') throw new Error('PNG missing IHDR');
    if (type === 'IHDR') {
      if (width !== undefined || size !== 13) throw new Error('invalid PNG IHDR');
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      channels = body[9] === 6 ? 4 : body[9] === 2 ? 3 : 0;
      if (!width || !height || width * height > 40_000_000 || body[8] !== 8 || !channels || body[10] || body[11] || body[12]) throw new Error('unsupported PNG encoding or dimensions');
    } else if (type === 'IDAT') compressed.push(body);
    else if (type === 'IEND') {
      if (size || offset + 12 !== bytes.length) throw new Error('invalid PNG end');
      ended = true; break;
    } else if (type[0] === type[0].toUpperCase() && type !== 'PLTE') throw new Error('unsupported PNG critical chunk');
    offset += size + 12;
  }
  if (!ended || !compressed.length) throw new Error('incomplete PNG');
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: (stride + 1) * height });
  if (raw.length !== (stride + 1) * height) throw new Error('invalid PNG scanline length');
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error('invalid PNG filter');
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const prediction = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      pixels[y * stride + x] = raw[y * (stride + 1) + x + 1] + prediction;
    }
  }
  return { width, height, channels, pixels };
}

export async function generateCodexImage({ prompt, referencePaths = [], expectedReferenceHashes, transparentBackground = false, output, executable = 'codex', signal, timeoutMs = 180000 }) {
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('visual prompt required');
  if (!Array.isArray(referencePaths) || referencePaths.length > 5 || referencePaths.some(p => typeof p !== 'string' || !p)) throw new Error('Codex accepts at most five reference paths');
  if (expectedReferenceHashes !== undefined && (!Array.isArray(expectedReferenceHashes) || expectedReferenceHashes.length !== referencePaths.length || expectedReferenceHashes.some(value => typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)))) throw new Error('expected reference hash count or format mismatch');
  if (typeof transparentBackground !== 'boolean' || typeof output !== 'string' || !output.endsWith('.png')) throw new Error('PNG output and boolean transparentBackground required');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 1800000) throw new Error('invalid Codex timeout');
  signal?.throwIfAborted();
  const paths = referencePaths.map(p => resolve(p));
  const references = await Promise.all(paths.map(async path => ({ path, sha256: hash(await readFile(path)) })));
  if (expectedReferenceHashes && references.some((reference, index) => reference.sha256 !== expectedReferenceHashes[index])) throw new Error('reference hash mismatch before Codex spawn');
  const destination = resolve(output);
  const requestPath = `${destination}.request.json`, receiptPath = `${destination}.receipt.json`;
  const reserved = [];
  let child, timer, abort, lines, closePromise;
  const context = { requestId: null, threadId: null, turnId: null, itemId: null };
  let cwd;
  try {
    // Reserve all three paths before any model call. Never overwrite existing files.
    for (const path of [destination, requestPath, receiptPath]) {
      const handle = await open(path, 'wx', 0o600); reserved.push(path); await handle.close();
    }
    cwd = await mkdtemp(join(dirname(destination), '.codex-image-work-'));
    const pending = new Map(), events = [];
    let sequence = 0, eventWaiter, failure;
    const fail = error => {
      failure ??= error;
      for (const entry of pending.values()) entry.reject(failure);
      pending.clear(); eventWaiter?.reject(failure); eventWaiter = null;
    };
    const config = {
      model_provider: 'openai', forced_login_method: 'chatgpt',
      'features.shell_tool': false, 'features.code_mode': false,
      'features.code_mode_only': false, 'features.multi_agent': false,
      'features.multi_agent_v2': false, 'features.plugins': false,
      'features.apps': false, 'features.hooks': false,
      'features.codex_hooks': false, 'features.memories': false,
      'features.memory_tool': false, 'features.view_image': false,
      'features.skip_host_skill_discovery': true, web_search: 'disabled',
      mcp_servers: {}, 'analytics.enabled': false,
    };
    const command = executable.includes('/') ? resolve(executable) : executable;
    child = spawn(command, ['app-server', '--listen', 'stdio://', ...Object.entries(config).flatMap(([key, value]) => ['-c', `${key}=${typeof value === 'string' ? JSON.stringify(value) : typeof value === 'object' ? '{}' : value}`])], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    closePromise = new Promise(res => child.once('close', (code, signal) => { fail(Object.assign(new Error('Codex app-server exited before completion'), { code, exitSignal: signal })); res(); }));
    child.once('error', fail);
    child.stdin.on('error', fail);
    // Consume without logging: stderr can contain account or request details.
    child.stderr.on('data', () => {});
    lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
    lines.on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { fail(new Error('invalid app-server JSON')); return; }
      if (message.id !== undefined && message.method) {
        child.stdin.write(JSON.stringify({ id: message.id, error: { code: -32601, message: 'Adapter does not permit interactive tools' } }) + '\n');
        fail(new Error('Codex requested an unrelated interactive tool')); return;
      }
      if (message.id !== undefined) {
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.error) entry.reject(Object.assign(new Error('Codex RPC failed'), { rpcError: message.error, requestId: message.id }));
        else entry.resolve(message.result);
      } else if (message.method) {
        if (eventWaiter) { eventWaiter.resolve(message); eventWaiter = null; }
        else events.push(message);
      }
    });
    abort = () => fail(Object.assign(new Error('Codex image request aborted'), { name: 'AbortError' }));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    timer = setTimeout(() => fail(new Error('Codex image request timed out')), timeoutMs);
    const rpc = (method, params) => {
      if (failure) return Promise.reject(failure);
      const id = ++sequence;
      if (method === 'turn/start') context.requestId = id;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
      });
    };
    const nextEvent = () => failure ? Promise.reject(failure) : events.length ? Promise.resolve(events.shift()) : new Promise((resolve, reject) => { eventWaiter = { resolve, reject }; });
    const initialized = await rpc('initialize', { clientInfo: { name: 'portrait_image_adapter', version: '1.0.0' }, capabilities: { experimentalApi: true } });
    if (!initialized?.userAgent?.startsWith(`portrait_image_adapter/${CODEX_PROTOCOL_VERSION} `)) throw new Error('unsupported Codex app-server version; requires 0.160.0');
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    const instructions = `Generate exactly one image with image_gen.imagegen. Do not use any other tools, do not retry or fall back. Use the user's entire text unchanged as the tool prompt. Use transparent_background=${transparentBackground}. Use referenced_image_paths exactly in this order: ${JSON.stringify(paths)}. Do not include recent images. Finish after the image tool result.`;
    const started = await rpc('thread/start', { cwd, ephemeral: true, modelProvider: 'openai', approvalPolicy: 'never', sandbox: 'read-only', baseInstructions: instructions });
    if (!opaque(started?.thread?.id)) throw new Error('missing Codex thread ID');
    context.threadId = started.thread.id;
    if ((await Promise.all(paths.map(path => readFile(path)))).some((bytes, index) => hash(bytes) !== references[index].sha256)) throw new Error('reference hash changed before Codex turn');
    const input = [{ type: 'text', text: prompt, text_elements: [] }, ...paths.map(path => ({ type: 'localImage', path }))];
    const request = { prompt, promptSha256: hash(prompt), references, transparentBackground, size: 'auto', model: CODEX_IMAGE_MODEL, input };
    await writeFile(requestPath, JSON.stringify(request, null, 2) + '\n');
    const turn = await rpc('turn/start', { threadId: context.threadId, input });
    if (!opaque(turn?.turn?.id)) throw new Error('missing Codex turn ID');
    context.turnId = turn.turn.id;
    let image;
    while (true) {
      const event = await nextEvent();
      const p = event.params;
      if (p?.threadId !== context.threadId || (p.turnId && p.turnId !== context.turnId)) continue;
      if (event.method === 'error') throw Object.assign(new Error('Codex turn error'), { turnError: p.error });
      if (event.method === 'item/started' || event.method === 'item/completed') {
        if (!p.item || !opaque(p.item.id)) throw new Error('invalid Codex item');
        if (['commandExecution', 'fileChange', 'mcpToolCall', 'dynamicToolCall', 'collabAgentToolCall', 'webSearch'].includes(p.item.type)) throw new Error('Codex attempted an unrelated tool');
        if (event.method === 'item/completed' && p.item.type === 'imageGeneration') {
          if (image) throw new Error('Codex returned multiple images');
          image = p.item; context.itemId = image.id;
          if (image.status !== 'completed') throw Object.assign(new Error('Codex image generation failed'), { imageFailure: image.failure, revisedPrompt: image.revisedPrompt, savedPath: image.savedPath ?? null });
        }
      }
      if (event.method === 'turn/completed') {
        if (p.turn?.id !== context.turnId) continue;
        if (p.turn.status !== 'completed') throw Object.assign(new Error('Codex turn failed'), { turnError: p.turn.error });
        break;
      }
    }
    if (!image) throw new Error('Codex turn completed without imageGeneration; tool may be unavailable');
    if (typeof image.revisedPrompt !== 'string' || typeof image.result !== 'string' || !isAbsolute(image.savedPath ?? '') || image.failure != null) throw new Error('invalid completed imageGeneration fields');
    if (image.transparentBackground !== transparentBackground) throw new Error('Codex output background differs from request');
    const bytes = Buffer.from(image.result, 'base64');
    if (!bytes.length || bytes.toString('base64') !== image.result) throw new Error('invalid Codex image base64');
    const decoded = decodeCodexPng(bytes);
    const savedPath = await realpath(image.savedPath);
    if (!(await readFile(savedPath)).equals(bytes)) throw new Error('Codex savedPath bytes differ from image result');
    if ((await Promise.all(paths.map(path => readFile(path)))).some((bytes, index) => hash(bytes) !== references[index].sha256)) throw new Error('reference hash changed during Codex generation');
    const receipt = {
      provider: 'codex-subscription', model: CODEX_IMAGE_MODEL, modelException: true,
      modelEvidence: { type: 'adapter-pinned-official-source', version: CODEX_PROTOCOL_VERSION, source: 'https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/ext/image-generation/src/tool.rs', providerAttested: false },
      capabilityVersion: CODEX_PROTOCOL_VERSION, ...context,
      imagegenRequestId: null, imagegenRequestIdUnavailable: 'Not exposed by app-server wire protocol',
      prompt, promptSha256: hash(prompt), revisedPrompt: image.revisedPrompt,
      promptChanged: image.revisedPrompt !== prompt, references,
      sourceBinding: { actualReferenceArgumentsAttested: false, requiredMachineFieldsValidated: false, reason: 'App-server does not expose image tool arguments; caller must guard revisedPrompt before accepting output' },
      transparentBackground, size: 'auto', width: decoded.width, height: decoded.height,
      output: destination, savedPath, sha256: hash(bytes), requestPath, receiptPath,
      artifactOrigin: 'App-server image extension writes under its existing Codex home; original preserved, verified bytes copied to output',
    };
    signal?.throwIfAborted();
    if (failure) throw failure;
    await writeFile(destination, bytes);
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
    signal?.throwIfAborted();
    if (failure) throw failure;
    return receipt;
  } catch (error) {
    Object.assign(error, { ...context, requestId: error.requestId ?? context.requestId });
    await Promise.all(reserved.map(path => rm(path, { force: true })));
    throw error;
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort);
    lines?.close();
    if (child) { child.kill('SIGKILL'); await closePromise; }
    if (cwd) await rm(cwd, { recursive: true, force: true });
  }
}
