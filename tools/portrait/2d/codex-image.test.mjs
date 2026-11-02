import { test, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, writeFile, readFile, rm, access } from 'node:fs/promises';
import { watch } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { generateCodexImage, decodeCodexPng } from './codex-image.mjs';

const executable = fileURLToPath(new URL('./test-fixtures/codex-app-server.mjs', import.meta.url));
const evidenceRoot = fileURLToPath(new URL('../../../.omo/evidence/portable-image-connection-20261004/codex/tests/', import.meta.url));
let directory, output, log;
beforeEach(async () => {
  await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
  directory = await mkdtemp(join(evidenceRoot, 'run-'));
  output = join(directory, 'output.png'); log = join(directory, 'protocol.json');
  process.env.CODEX_FIXTURE_LOG = log;
});
afterEach(async () => { delete process.env.CODEX_FIXTURE_LOG; await rm(directory, { recursive: true, force: true }); });
const generate = (prompt, options = {}) => generateCodexImage({ prompt, output, executable, timeoutMs: 5000, ...options });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function cleaned() {
  const recorded = JSON.parse(await readFile(log, 'utf8'));
  expect(() => process.kill(recorded.pid, 0)).toThrow();
  await expect(access(recorded.cwd)).rejects.toThrow();
  return recorded;
}

test('real stdio lifecycle buffers pre-reply events and preserves prompt/reference order, hashes and receipt', async () => {
  const a = join(directory, 'style.png'), b = join(directory, 'pose.png');
  await writeFile(a, 'style'); await writeFile(b, 'pose');
  const prompt = 'happy: exact visual prompt\n{"id":"K001"}';
  const receipt = await generate(prompt, { referencePaths: [b, a], expectedReferenceHashes: [sha256('pose'), sha256('style')], transparentBackground: true });
  const bytes = await readFile(output);
  expect(decodeCodexPng(bytes)).toMatchObject({ width: 1, height: 1, channels: 4 });
  expect(receipt).toMatchObject({ model: 'gpt-image-2', modelException: true, capabilityVersion: '0.160.0', requestId: 3, turnId: 'turn-opaque', threadId: 'thread-opaque', itemId: 'image-opaque', prompt, revisedPrompt: prompt, promptChanged: false, imagegenRequestId: null, size: 'auto', width: 1, height: 1 });
  expect(receipt.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  expect(receipt.references).toEqual([b, a].map((path, i) => ({ path, sha256: createHash('sha256').update(i ? 'style' : 'pose').digest('hex') })));
  expect(receipt.modelEvidence.providerAttested).toBe(false);
  expect(receipt.sourceBinding.actualReferenceArgumentsAttested).toBe(false);
  expect(JSON.parse(await readFile(receipt.receiptPath, 'utf8'))).toEqual(receipt);
  const recorded = await cleaned();
  expect(recorded.turnParams.input).toEqual([{ type: 'text', text: prompt, text_elements: [] }, { type: 'localImage', path: b }, { type: 'localImage', path: a }]);
  expect(recorded.threadParams).toMatchObject({ ephemeral: true, sandbox: 'read-only', approvalPolicy: 'never' });
  expect(recorded.cwd).not.toBe(directory);
  expect(dirname(recorded.cwd)).toBe(directory);
  expect(recorded.argv).toContain('features.shell_tool=false');
});

test.each(['changed-pose', 'wrong-hash', 'wrong-order', 'wrong-count'])('expected reference binding rejects %s before actual producer spawn', async kind => {
  const style = join(directory, 'style.png'), pose = join(directory, 'pose.png');
  await writeFile(style, 'style'); await writeFile(pose, 'original pose');
  let expectedReferenceHashes = [sha256('style'), sha256('original pose')];
  if (kind === 'changed-pose') await writeFile(pose, 'changed pose after caller snapshot');
  if (kind === 'wrong-hash') expectedReferenceHashes[1] = 'a'.repeat(64);
  if (kind === 'wrong-order') expectedReferenceHashes.reverse();
  if (kind === 'wrong-count') expectedReferenceHashes.pop();
  const currentBytes = await Promise.all([style, pose].map(path => readFile(path)));
  let error;
  try { await generate('happy: pinned references', { referencePaths: [style, pose], expectedReferenceHashes }); }
  catch (caught) { error = caught; }
  const producerStarted = await access(log).then(() => true, () => false);
  const outputs = await Promise.all([output, output + '.request.json', output + '.receipt.json'].map(path => access(path).then(() => true, () => false)));
  await writeFile(join(evidenceRoot, 'reference-binding-' + kind + '.json'), JSON.stringify({ kind, expectedReferenceHashes, actualHashes: currentBytes.map(sha256), error: error?.message ?? null, producerStarted, outputs, directory, adapterSourceSha256: sha256(await readFile(new URL('./codex-image.mjs', import.meta.url))) }, null, 2) + '\n');
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toMatch(/reference.*(?:hash|count|binding)/i);
  expect(producerStarted).toBe(false);
  expect(outputs).toEqual([false, false, false]);
  for (const [index, path] of [style, pose].entries()) expect(await readFile(path)).toEqual(currentBytes[index]);
});

test.each([
  ['usage', 'Codex image generation failed'], ['auth', 'Codex RPC failed'],
  ['badpng', 'Codex output is not PNG'], ['noimage', 'without imageGeneration'],
  ['tool', 'unrelated tool'], ['error', 'Codex turn error'],
  ['turnfail', 'Codex turn failed'], ['exit', 'exited before completion'],
])('%s fails without fallback, leaves no output and cleans process', async (mode, message) => {
  await expect(generate(`${mode}: visual prompt`)).rejects.toThrow(message);
  for (const path of [output, `${output}.request.json`, `${output}.receipt.json`]) await expect(access(path)).rejects.toThrow();
  await cleaned();
});

test('failure retains opaque correlation and actual usage limit metadata', async () => {
  const error = await generate('usage: prompt').catch(error => error);
  expect(error).toMatchObject({ requestId: 3, threadId: 'thread-opaque', turnId: 'turn-opaque', itemId: 'image-opaque', imageFailure: { type: 'usageLimitExceeded', limitId: 'image_gen', resetsAt: 1786150800 } });
});

test('revised prompt is recorded without claiming source binding', async () => {
  const receipt = await generate('revised: required id');
  expect(receipt).toMatchObject({ promptChanged: true, prompt: 'revised: required id', revisedPrompt: 'revised required fields', sourceBinding: { requiredMachineFieldsValidated: false } });
});

test.each(['', '.request.json', '.receipt.json'])('collision %s rejects before spawning and preserves existing bytes', async suffix => {
  await writeFile(output + suffix, 'existing');
  await expect(generate('happy: prompt')).rejects.toMatchObject({ code: 'EEXIST' });
  expect(await readFile(output + suffix, 'utf8')).toBe('existing');
  await expect(access(log)).rejects.toThrow();
});

test('more than five references rejects before process or file creation', async () => {
  await expect(generate('happy: prompt', { referencePaths: Array(6).fill('absent') })).rejects.toThrow('at most five');
  await expect(access(output)).rejects.toThrow(); await expect(access(log)).rejects.toThrow();
});

test('abort subscribes to fixture turn arrival rather than a sleep', async () => {
  const controller = new AbortController();
  const watcher = watch(directory, (_event, filename) => { if (filename === 'protocol.json') controller.abort(); });
  try { await expect(generate('abort: prompt', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' }); }
  finally { watcher.close(); }
  await cleaned(); await expect(access(output)).rejects.toThrow();
});

test('bounded timeout kills an unresponsive actual process', async () => {
  await expect(generate('timeout: prompt', { timeoutMs: 1000 })).rejects.toThrow('timed out');
  await cleaned();
});

test('PNG decoding detects CRC corruption and decodes pixels', () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==', 'base64');
  expect([...decodeCodexPng(png).pixels]).toEqual([255, 0, 0, 255]);
  png[45] ^= 1;
  expect(() => decodeCodexPng(png)).toThrow('CRC');
});

test.each([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 32, 40, 67])('short or truncated PNG length %i rejects with a deliberate error', length => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==', 'base64');
  let error;
  try { decodeCodexPng(png.subarray(0, length)); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(Error);
  expect(error).not.toBeInstanceOf(RangeError);
  expect(error.message).toMatch(/not PNG|truncated PNG/);
});
