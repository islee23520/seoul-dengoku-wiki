#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export async function splitBaseSheet(sheetPath) {
  try { await stat(`${sheetPath}.split.json`); throw new Error('split receipt already exists'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const sourceSha256 = createHash('sha256').update(await readFile(sheetPath)).digest('hex');
  const stdout = await new Promise((done, reject) => {
    const child = spawn('python3', [fileURLToPath(new URL('./split-base-sheet.py', import.meta.url)), sheetPath]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? done(stdout) : reject(new Error(`sheet split failed: ${stderr}`)));
  });
  const report = JSON.parse(stdout)[0];
  const outputs = [];
  for (const output of report.outputs) {
    const bytes = await readFile(output.path);
    outputs.push({ ...output, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const receipt = { sourceSha256, status: 'split-unreviewed', gap: report.gap, faceBBox: report.face_bbox, bodyBBox: report.body_bbox, outputs };
  await writeFile(`${sheetPath}.split.json`, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  return receipt;
}

export async function generateBaseSheet({ gender = 'male', referencePath, output, split = false, generator = fileURLToPath(new URL('./cliproxy-edit.mjs', import.meta.url)), stylePath = fileURLToPath(new URL('./style-lock.json', import.meta.url)) }) {
  const input = await baseSheetPrompt(gender);
  const reference = await readFile(referencePath);
  if (!output?.endsWith('.png')) throw new Error('new PNG output required');
  const splitOutputs = split ? [`${output.slice(0, -4)}-face.png`, `${output.slice(0, -4)}-body.png`, `${output}.split.json`] : [];
  for (const path of [output, `${output}.json`, `${output}.request.json`, `${output}.receipt.json`, ...splitOutputs]) {
    try { await stat(path); throw new Error(`output already exists: ${path}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const referenceSha256 = createHash('sha256').update(reference).digest('hex');
  const style = JSON.parse(await readFile(stylePath, 'utf8'));
  if (referenceSha256 !== style.referenceSha256) throw new Error('B reference hash mismatch before sheet generation');
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, [generator, '--image', referencePath, '--expected-style-sha256', referenceSha256, '--aspect-ratio', '3:4', '--prompt', input.prompt, '-o', output]);
    let errors = '';
    child.stderr.on('data', chunk => { errors = `${errors}${chunk}`.slice(-2000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? done() : reject(new Error(`sheet generation failed: ${errors}`)));
  });
  const bytes = await readFile(output);
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('generator did not produce PNG');
  const request = JSON.parse(await readFile(`${output}.request.json`, 'utf8'));
  const actualReceipt = JSON.parse(await readFile(`${output}.receipt.json`, 'utf8'));
  const imageSha256 = createHash('sha256').update(bytes).digest('hex');
  if (actualReceipt.imageSha256 !== imageSha256 || JSON.stringify(request) !== JSON.stringify(actualReceipt.request) || request.references[0].sha256 !== referenceSha256) throw new Error('sheet request or receipt mismatch');
  const receipt = { ...input, sourcePrompt: input.prompt, prompt: request.prompt, request, status: 'candidate-unreviewed', referenceSha256, imageSha256, generator: 'cliproxy-edit.mjs', splitStatus: 'not-run' };
  await writeFile(`${output}.json`, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  return receipt;
}

export async function baseSheetPrompt(gender = 'male') {
  if (!['male', 'female'].includes(gender)) throw new Error('gender must be male or female');
  const source = await readFile(new URL('./danny-base-sheet-prompt.txt', import.meta.url), 'utf8');
  const prompt = gender === 'male' ? source.trim() : source.trim()
    .replace('only for art style (', "only for art style and for the FEMALE character's identity (")
    .replace('torso, pelvis, both arms and both legs all attached.', 'torso, pelvis, both arms and both legs all attached, female body proportions.')
    .replace('simple plain underclothing', 'plain sports top and briefs');
  return { promptId: 'PROMPT-1', gender, prompt, sourcePromptSha256: createHash('sha256').update(source).digest('hex'),
    source: 'Danny char-base-2d-concept references/pipeline-playbook.md section 1, 2026-09-19',
    status: 'candidate-input', outputContract: { pieces: ['head', 'connected-body'], pose: { arms: 'T-pose', legs: 'A-pose' }, splitSize: [1024, 1024] } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = flag => { const at = process.argv.indexOf(flag); return at < 0 ? null : process.argv[at + 1]; };
  try {
    if (arg('--split-sheet')) {
      console.log(JSON.stringify(await splitBaseSheet(arg('--split-sheet')), null, 2));
      process.exit(0);
    }
    if (process.argv.includes('--split') && !arg('--output')) throw new Error('--split requires --output');
    const result = arg('--output')
      ? await generateBaseSheet({ gender: arg('--gender') ?? 'male', referencePath: arg('--reference'), output: arg('--output'), split: process.argv.includes('--split'), generator: arg('--generator') ?? undefined })
      : await baseSheetPrompt(arg('--gender') ?? 'male');
    const split = process.argv.includes('--split') ? await splitBaseSheet(arg('--output')) : null;
    console.log(JSON.stringify(split ? { generation: result, split } : result, null, 2));
  }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
