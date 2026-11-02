#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==';
const send = value => process.stdout.write(JSON.stringify(value) + '\n');
const event = (method, params) => send({ method, params: { threadId: 'thread-opaque', turnId: 'turn-opaque', ...params } });
let threadParams;
createInterface({ input: process.stdin }).on('line', line => {
  const m = JSON.parse(line);
  if (m.method === 'initialize') send({ id: m.id, result: { userAgent: 'portrait_image_adapter/0.160.0 (fixture)', platformOs: 'macos' } });
  if (m.method === 'thread/start') {
    threadParams = m.params;
    send({ id: m.id, result: { thread: { id: 'thread-opaque' } } });
  }
  if (m.method !== 'turn/start') return;
  const prompt = m.params.input[0].text;
  const mode = prompt.split(':')[0];
  if (process.env.CODEX_FIXTURE_LOG) writeFileSync(process.env.CODEX_FIXTURE_LOG, JSON.stringify({ pid: process.pid, cwd: process.cwd(), argv: process.argv.slice(2), threadParams, turnParams: m.params }));
  if (mode === 'abort' || mode === 'timeout') return;
  if (mode === 'auth') { send({ id: m.id, error: { code: -32000, message: 'authentication required' } }); return; }
  if (mode === 'exit') { process.exit(7); }
  const savedPath = join(process.cwd(), 'generated.png');
  const result = mode === 'badpng' ? Buffer.from('not PNG').toString('base64') : png;
  writeFileSync(savedPath, Buffer.from(result, 'base64'));
  const item = { type: 'imageGeneration', id: 'image-opaque', status: mode === 'usage' ? 'failed' : 'completed', revisedPrompt: mode === 'revised' ? 'revised required fields' : prompt, result, transparentBackground: threadParams.baseInstructions.includes('transparent_background=true'), failure: mode === 'usage' ? { type: 'usageLimitExceeded', limitId: 'image_gen', resetsAt: 1786150800 } : null, savedPath };
  event('item/started', { item: { ...item, status: 'in_progress', result: '' } });
  if (mode === 'tool') event('item/started', { item: { type: 'commandExecution', id: 'cmd' } });
  if (mode !== 'noimage') event('item/completed', { item });
  if (mode === 'error') event('error', { error: { codexErrorInfo: 'unauthorized' } });
  // Events deliberately arrive BEFORE the turn/start RPC reply.
  event('turn/completed', { turn: { id: 'turn-opaque', status: mode === 'turnfail' ? 'failed' : 'completed', error: mode === 'turnfail' ? { message: 'failed' } : null } });
  send({ id: m.id, result: { turn: { id: 'turn-opaque', status: 'inProgress' } } });
});
