import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { test } from 'vitest';
import { baseSheetPrompt, splitBaseSheet, generateBaseSheet } from './danny-base-sheet.mjs';

const scratch = new URL('../../../.omo/evidence/danny-cli-recovery/', import.meta.url);
await mkdir(scratch, { recursive: true });

test('male base sheet ships the captured source prompt without paraphrasing', async () => {
  const result = await baseSheetPrompt('male');
  assert.equal(result.prompt, (await readFile(new URL('./danny-base-sheet-prompt.txt', import.meta.url), 'utf8')).trim());
  assert.deepEqual(result.outputContract.pieces, ['head', 'connected-body']);
  assert.deepEqual(result.outputContract.splitSize, [1024, 1024]);
});

test('female variant preserves source provenance and two-piece contract', async () => {
  const male = await baseSheetPrompt('male');
  const female = await baseSheetPrompt('female');
  assert.notEqual(female.prompt, male.prompt);
  assert.equal(female.sourcePromptSha256, male.sourcePromptSha256);
  assert.deepEqual(female.outputContract, male.outputContract);
  await assert.rejects(baseSheetPrompt('unknown'), /gender/);
});

test('split pipeline records two square outputs and refuses a repeated split', async () => {
  const dir = await mkdtemp(new URL('base-sheet-test-', scratch));
  try {
    const sheet = join(dir, 'sheet.png');
    execFileSync('python3', ['-c', 'from PIL import Image,ImageDraw; import sys; im=Image.new("RGB",(120,180),(235,235,235)); d=ImageDraw.Draw(im); d.rectangle((40,12,79,49),fill=(222,222,222)); d.rectangle((20,90,99,159),fill=(60,60,60)); im.save(sys.argv[1])', sheet]);
    const receipt = await splitBaseSheet(sheet);
    assert.equal(receipt.status, 'split-unreviewed');
    assert.equal(receipt.outputs.length, 2);
    assert.ok(receipt.outputs.every(output => output.size[0] === 1024 && output.size[1] === 1024 && /^[a-f0-9]{64}$/.test(output.sha256)));
    await assert.rejects(splitBaseSheet(sheet), /receipt already exists/);
    assert.deepEqual(JSON.parse(await readFile(`${sheet}.split.json`, 'utf8')), receipt);
  } finally { await rm(dir, { recursive: true }); }
});

test('existing split output blocks generation before invoking the backend', async () => {
  const dir = await mkdtemp(new URL('base-sheet-preflight-', scratch));
  try {
    const referencePath = join(dir, 'reference.png');
    const output = join(dir, 'new.png');
    await writeFile(referencePath, 'reference fixture');
    await writeFile(join(dir, 'new-body.png'), 'preserved');
    await assert.rejects(generateBaseSheet({ referencePath, output, split: true, generator: join(dir, 'absent-backend.py') }), /output already exists/);
    await assert.rejects(stat(output), { code: 'ENOENT' });
    assert.equal(await readFile(join(dir, 'new-body.png'), 'utf8'), 'preserved');
  } finally { await rm(dir, { recursive: true }); }
});

test('base sheet verifies actual bridge request and preserves source prompt separately', async () => {
  const dir = await mkdtemp(new URL('base-sheet-bridge-', scratch));
  try {
    const referencePath = join(dir, 'reference.png');
    const output = join(dir, 'sheet.png');
    const generator = join(dir, 'bridge.mjs');
    await writeFile(referencePath, 'reference fixture');
    const stylePath = join(dir, 'style.json');
    await writeFile(stylePath, JSON.stringify({ referenceSha256: createHash('sha256').update('reference fixture').digest('hex') }));
    await writeFile(generator, `
      import { readFile, writeFile } from 'node:fs/promises';
      import { createHash } from 'node:crypto';
      const value = flag => process.argv[process.argv.indexOf(flag) + 1];
      const hash = bytes => createHash('sha256').update(bytes).digest('hex');
      const bytes = Buffer.from([137,80,78,71,13,10,26,10]);
      const request = { model: 'fixture', prompt: 'Actual English prompt', references: [{ sha256: hash(await readFile(value('--image'))) }] };
      await writeFile(value('-o'), bytes);
      await writeFile(value('-o') + '.request.json', JSON.stringify(request));
      await writeFile(value('-o') + '.receipt.json', JSON.stringify({ request, imageSha256: value('-o').endsWith('tampered.png') ? '0'.repeat(64) : hash(bytes) }));
    `);
    const result = await generateBaseSheet({ referencePath, output, generator, stylePath });
    assert.equal(result.prompt, 'Actual English prompt');
    assert.equal(result.sourcePrompt, (await baseSheetPrompt()).prompt);
    assert.deepEqual(result.request, JSON.parse(await readFile(output + '.request.json', 'utf8')));
    assert.equal(result.generator, 'cliproxy-edit.mjs');
    assert.equal(result.status, 'candidate-unreviewed');
    await assert.rejects(generateBaseSheet({ referencePath, output, generator }), /output already exists/);
    const tamperedOutput = join(dir, 'tampered.png');
    await assert.rejects(generateBaseSheet({ referencePath, output: tamperedOutput, generator, stylePath }), /request or receipt mismatch/);
    await assert.rejects(stat(tamperedOutput + '.json'), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true }); }
});

test('wrong B reference is rejected before invoking the image bridge', async () => {
  const dir = await mkdtemp(new URL('base-sheet-style-', scratch));
  try {
    const referencePath = join(dir, 'wrong.png');
    const output = join(dir, 'sheet.png');
    await writeFile(referencePath, 'not the selected B image');
    await assert.rejects(generateBaseSheet({ referencePath, output, generator: join(dir, 'absent.mjs') }), /B reference hash mismatch/);
    await assert.rejects(stat(output + '.request.json'), { code: 'ENOENT' });
    await assert.rejects(stat(output), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true }); }
});
