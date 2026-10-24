import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInkosAdapterFixture } from './inkos-adapter-fixture.mjs';
import { exportPacket } from '../inkos-adapter/export.mjs';
import { collectCandidate } from '../inkos-adapter/collect.mjs';
import { readHostFile, createImmutableFile } from '../inkos-adapter/io.mjs';
import { digestJson, LIMITS, sha256Bytes } from '../inkos-adapter/contracts.mjs';

const hash = path => sha256Bytes(fs.readFileSync(path));
function fixture(t) {
  const f = createInkosAdapterFixture({ parent: fs.realpathSync(tmpdir()) });
  const before = hash(f.dbPath);
  t.after(() => {
    assert.equal(hash(f.dbPath), before);
    f.cleanup();
    assert.throws(() => fs.lstatSync(f.directory), { code: 'ENOENT' });
    console.log('cleanup ENOENT; fixture DB sha256 before/after equal:', before);
  });
  const trustedRoot = join(f.directory, 'host'); fs.mkdirSync(trustedRoot);
  const packet = exportPacket({ ...f, trustedRoot, workerOut: join(f.directory, 'worker') });
  const candidate = { version: 1, packetId: packet.packetId, inputDigest: packet.inputDigest,
    targetKey: 'source-1', replacementText: 'Synthetic candidate; DROP TABLE x; /private/file; $(touch injected)',
    citations: [{ sourceKey: 'source-2', anchor: 'paragraph' }] };
  const candidatePath = join(f.directory, 'candidate.json');
  fs.writeFileSync(candidatePath, JSON.stringify(candidate));
  return { ...f, ...packet, candidate, options: { trustedRoot, packetId: packet.packetId, candidatePath } };
}
function reject(f, code) {
  assert.throws(() => collectCandidate(f.options), { code });
  assert.equal(fs.existsSync(join(f.options.trustedRoot, 'candidates')), false);
}

test('trusted source linkage, exact hashes, candidate-only injection and immutable replay', t => {
  const f = fixture(t);
  const result = collectCandidate(f.options);
  const bytes = fs.readFileSync(result.receiptPath);
  assert.equal(result.receiptSha256, hash(result.receiptPath));
  const receipt = JSON.parse(bytes);
  const manifest = JSON.parse(fs.readFileSync(f.manifestPath));
  assert.deepEqual(receipt.sources, f.sources);
  assert.deepEqual(receipt.target, { ...f.sources[0], anchor: 'paragraph' });
  assert.deepEqual(receipt.citations, [{ ...f.sources[1], anchor: 'paragraph' }]);
  assert.equal(receipt.manifestDigest, digestJson(manifest));
  assert.equal(receipt.inputDigest, f.inputDigest);
  assert.equal(receipt.candidateSha256, hash(f.options.candidatePath));
  assert.equal(receipt.replacementSha256, sha256Bytes(Buffer.from(f.candidate.replacementText)));
  assert.equal(receipt.replacementText, f.candidate.replacementText);
  assert.equal(receipt.ownerApproval, false); assert.equal(receipt.status, 'candidate-only');
  assert.deepEqual(collectCandidate(f.options), result);
  // Reformatting the manifest does not change its canonical digest.
  fs.writeFileSync(f.manifestPath, JSON.stringify(manifest, null, 2));
  assert.deepEqual(collectCandidate(f.options), result);
  f.candidate.replacementText += ' different';
  fs.writeFileSync(f.options.candidatePath, JSON.stringify(f.candidate));
  assert.notEqual(collectCandidate(f.options).candidateId, result.candidateId);
  assert.deepEqual(fs.readFileSync(result.receiptPath), bytes);
  assert.equal(fs.existsSync(join(f.directory, 'injected')), false);
  console.log('generated receipt sha256:', sha256Bytes(bytes));
});

for (const [name, mutation, code] of [
  ['approved', c => ({ ...c, approved: true }), 'E_ADAPTER_SCHEMA'],
  ['absolute model path', c => ({ ...c, path: '/private/secret' }), 'E_ADAPTER_SCHEMA'],
  ['target', c => ({ ...c, targetKey: 'forged' }), 'E_ADAPTER_BINDING'],
  ['source', c => ({ ...c, citations: [{ sourceKey: 'forged', anchor: 'paragraph' }] }), 'E_ADAPTER_BINDING'],
  ['anchor', c => ({ ...c, citations: [{ sourceKey: 'source-2', anchor: 'bad' }] }), 'E_ADAPTER_BINDING'],
  ['digest', c => ({ ...c, inputDigest: 'b'.repeat(64) }), 'E_ADAPTER_BINDING'],
  ['duplicate JSON keys', c => JSON.stringify(c).replace('"version":1', '"version":1,"version":1'), 'E_ADAPTER_DUPLICATE_KEY'],
  ['malformed', () => '{', 'E_ADAPTER_JSON'],
  ['NUL text', c => ({ ...c, replacementText: 'a\0b' }), 'E_ADAPTER_SCHEMA'],
  ['oversize file', () => ' '.repeat(LIMITS.fileBytes + 1), 'E_ADAPTER_LIMIT'],
  ['oversize replacement', c => ({ ...c, replacementText: 'x'.repeat(LIMITS.replacementBytes + 1) }), 'E_ADAPTER_LIMIT'],
]) test(`reject ${name}`, t => {
  const f = fixture(t); const value = mutation(f.candidate);
  fs.writeFileSync(f.options.candidatePath, typeof value === 'string' ? value : JSON.stringify(value));
  reject(f, code);
});

test('trusted bundle byte drift rejects without output', t => {
  const f = fixture(t);
  fs.appendFileSync(join(f.options.trustedRoot, 'packets', f.packetId, 'bundle.json'), ' ');
  reject(f, 'E_ADAPTER_BINDING');
});

for (const mode of ['symlink', 'parent symlink', 'hardlink', '..', 'NUL']) test(`reject host candidate ${mode}`, t => {
  const f = fixture(t); const path = f.options.candidatePath;
  if (mode === 'symlink') { fs.symlinkSync(path, path + '.alias'); f.options.candidatePath += '.alias'; }
  if (mode === 'parent symlink') { fs.symlinkSync(f.directory, join(f.directory, 'alias')); f.options.candidatePath = join(f.directory, 'alias', 'candidate.json'); }
  if (mode === 'hardlink') fs.linkSync(path, path + '.alias');
  if (mode === '..') f.options.candidatePath = f.directory + '/host/../candidate.json';
  if (mode === 'NUL') f.options.candidatePath += '\0';
  reject(f, 'E_ADAPTER_PATH');
});

test('same-descriptor and parent swap detection at deterministic syscall boundaries', t => {
  const f = fixture(t); const open = fs.openSync;
  const mock = t.mock.method(fs, 'openSync', (path, ...args) => {
    const fd = open(path, ...args);
    if (path === f.options.candidatePath) { fs.renameSync(path, path + '.old'); fs.writeFileSync(path, '{}'); }
    return fd;
  });
  assert.throws(() => readHostFile(f.options.candidatePath), { code: 'E_ADAPTER_PATH' });
  mock.mock.restore();
  const directory = join(f.directory, 'sub'); fs.mkdirSync(directory);
  const path = join(directory, 'file'); fs.writeFileSync(path, 'bytes');
  const read = fs.readSync; let swapped = false;
  const readMock = t.mock.method(fs, 'readSync', (...args) => {
    const n = read(...args);
    if (!swapped) { swapped = true; fs.renameSync(directory, directory + '.old'); fs.symlinkSync(directory + '.old', directory); }
    return n;
  });
  assert.throws(() => readHostFile(path), { code: 'E_ADAPTER_PATH' });
  readMock.mock.restore();
});

test('existing foreign receipt, output aliases and unsupported filesystem never succeed', t => {
  const f = fixture(t); const output = join(f.directory, 'foreign'); fs.writeFileSync(output, 'foreign bytes');
  assert.throws(() => createImmutableFile(output, Buffer.from('new')), { code: 'E_ADAPTER_CONFLICT' });
  fs.symlinkSync(output, output + '.link');
  assert.throws(() => createImmutableFile(output + '.link', Buffer.from('new')), { code: 'E_ADAPTER_CONFLICT' });
  assert.equal(fs.readFileSync(output, 'utf8'), 'foreign bytes');
  const mock = t.mock.method(fs, 'statfsSync', () => ({ type: 0x6969 }));
  assert.throws(() => readHostFile(output), { code: 'E_ADAPTER_UNSUPPORTED' });
  mock.mock.restore();
  const result = collectCandidate(f.options); fs.writeFileSync(result.receiptPath, 'foreign receipt');
  assert.throws(() => collectCandidate(f.options), { code: 'E_ADAPTER_CONFLICT' });
  assert.equal(fs.readFileSync(result.receiptPath, 'utf8'), 'foreign receipt');
});

for (const restored of [false, true]) test(`output parent swap ${restored ? 'restored' : 'left'} creates no foreign file`, t => {
  const f = fixture(t);
  const parent = join(f.directory, 'output');
  const foreign = join(f.directory, 'foreign');
  fs.mkdirSync(parent); fs.mkdirSync(foreign);
  fs.writeFileSync(join(parent, 'canary'), 'host bytes');
  fs.writeFileSync(join(foreign, 'canary'), 'foreign bytes');
  const before = fs.statSync(parent, { bigint: true });
  const output = join(parent, 'receipt.json');
  const open = fs.openSync; const cwd = process.cwd(); let triggered = false;
  const mock = t.mock.method(fs, 'openSync', (name, ...args) => {
    if (resolve(name) !== output || triggered) return open(name, ...args);
    triggered = true;
    fs.renameSync(parent, parent + '.moved'); fs.symlinkSync(foreign, parent);
    const fd = open(name, ...args);
    if (restored) { fs.unlinkSync(parent); fs.renameSync(parent + '.moved', parent); }
    return fd;
  });
  try {
    assert.throws(() => createImmutableFile(output, Buffer.from('fourteen bytes')), { code: 'E_ADAPTER_PATH' });
  } finally { mock.mock.restore(); }
  assert.equal(triggered, true);
  assert.equal(process.cwd(), cwd);
  assert.deepEqual(fs.readdirSync(foreign), ['canary']);
  assert.equal(fs.readFileSync(join(foreign, 'canary'), 'utf8'), 'foreign bytes');
  const host = restored ? parent : parent + '.moved';
  assert.equal(fs.statSync(host, { bigint: true }).ino, before.ino);
  assert.deepEqual(fs.readdirSync(host), ['canary']);
  assert.equal(fs.readFileSync(join(host, 'canary'), 'utf8'), 'host bytes');
  assert.equal(fs.lstatSync(parent).isSymbolicLink(), !restored);
  console.log(`output swap ${restored ? 'restored' : 'left'}: E_ADAPTER_PATH; foreign receipt absent; host inode/canary intact`);
});

test('two real processes contend from an IPC barrier and preserve existing receipt bytes', async t => {
  const f = fixture(t);
  const original = collectCandidate(f.options); const before = fs.readFileSync(original.receiptPath);
  const source = `import {collectCandidate} from ${JSON.stringify(new URL('../inkos-adapter/collect.mjs', import.meta.url).href)};
    process.on('message', options => {try { const result=collectCandidate(options); process.send({result},()=>process.exit(0)); }
    catch(e) {process.send({code:e.code},()=>process.exit(1));}}); process.send('ready');`;
  const children = [0, 1].map(() => spawn(process.execPath, ['--input-type=module', '-e', source], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }));
  t.after(() => children.forEach(child => { if (child.exitCode === null) child.kill(); }));
  const signal = AbortSignal.timeout(10000);
  const ready = children.map(child => once(child, 'message', { signal }));
  await Promise.all(ready);
  // A fresh candidate forces an exclusive-create race; no sleeps or assumed winner.
  f.candidate.replacementText += ' race'; fs.writeFileSync(f.options.candidatePath, JSON.stringify(f.candidate));
  const results = children.map(child => once(child, 'message', { signal }));
  const exits = children.map(child => once(child, 'exit', { signal }));
  children.forEach(child => child.send(f.options));
  const messages = (await Promise.all(results)).map(([value]) => value);
  const statuses = await Promise.all(exits);
  assert.ok(messages.some(value => value.result));
  messages.forEach((value, index) => {
    assert.equal(statuses[index][0], value.result ? 0 : 1);
    if (!value.result) assert.equal(value.code, 'E_ADAPTER_CONFLICT');
  });
  const winner = messages.find(value => value.result).result;
  const racedBytes = fs.readFileSync(winner.receiptPath);
  assert.deepEqual(collectCandidate(f.options), winner);
  assert.deepEqual(fs.readFileSync(winner.receiptPath), racedBytes);
  assert.deepEqual(fs.readFileSync(original.receiptPath), before);
});
