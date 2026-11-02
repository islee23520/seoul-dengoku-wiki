#!/usr/bin/env node
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getCast, readCastStore, registerCast } from '../../cast-cli/src/store.js';
import { neutralRecord } from '../neutral-slots.mjs';
import { selectFace } from '../2d/face-selection.mjs';
export const help = 'seoul-character: list | register --record draft.json | export --cast-id ID [--look look.json] | portrait | full-body | 3d-generate | 3d-render\n2D: --cast-id ID --look look.json --style style.json --reference image.png [--canonical-root trusted-directory] [--output new.png]\n3D mesh generation: 3d-generate --cast-id ID --look look.json --image authored-fullbody.png --output-dir NEW_DIR [--execute] [--model version] [--no-wait]\n3D render: 3d-render (legacy alias 3d) --cast-id ID --input model.glb [--output new.png]\nMesh generation exports the actual Tripo command unless --execute is supplied. Render exports unless --output is supplied. --slot-overrides changes slots, never identity. Registration is local draft storage, never canon.';
export function castLook(character, look = {}) {
  const gender = character.gender === '남' ? '남성' : character.gender === '여' ? '여성' : character.gender;
  const identity = look.identity ?? {};
  const declared = identity.gender?.value ?? identity.gender ?? look.appearance?.gender;
  if ((look.characterId && look.characterId !== character.id) || (identity.characterId && identity.characterId !== character.id) || (look.name && look.name !== character.name) || (identity.name && identity.name !== character.name) || (declared && declared !== gender)) throw new Error('look identity does not match selected cast ID/name/gender');
  const source = 'seoul-cast:characters/' + character.id;
  return neutralRecord({ ...look, schemaVersion: look.schemaVersion ?? 2, characterId: character.id, name: character.name, sourceStatus: look.sourceStatus ?? 'authored-draft', sourceRefs: [...new Set([...(look.sourceRefs ?? []), source])], identity: { ...identity, characterId: character.id, name: character.name, gender: { value: gender, status: 'authored-draft', source } } });
}
export async function invokeTripo(command, argv) {
  return new Promise((done, reject) => {
    const child = spawn(command, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', value => stdout += value);
    child.stderr.on('data', value => stderr += value);
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) { const error = new Error(stderr); error.exitCode = code; reject(error); }
      else { try { done(JSON.parse(stdout)); } catch (error) { reject(error); } }
    });
  });
}
export async function run(args, { storePath, invoke = invokeTripo } = {}) {
  const command = args[0] ?? 'help';
  const option = key => { const i = args.indexOf(key); return i < 0 ? null : args[i + 1]; };
  if (['help', '--help', '-h'].includes(command)) return help;
  if (command === 'list') return readCastStore(storePath);
  if (command === 'register') {
    if (!option('--record')) throw new Error('--record required');
    return registerCast(JSON.parse(await readFile(option('--record'), 'utf8')), storePath);
  }
  if (!['export', 'portrait', 'full-body', '3d', '3d-render', '3d-generate'].includes(command)) throw new Error('unknown command: ' + command);
  if (!option('--cast-id')) throw new Error('--cast-id required');
  const character = await getCast(option('--cast-id'), storePath);
  const look = option('--look') ? JSON.parse(await readFile(option('--look'), 'utf8')) : {};
  if (option('--face-mode')) look.faceMode = { kind: option('--face-mode'), variantId: option('--face-variant-id') };
  if (option('--face-selection')) look.faceSelection = JSON.parse(await readFile(option('--face-selection'), 'utf8'));
  const faceVariantCatalogPath = option('--face-catalog') ?? process.env.PORTRAIT_FACE_CATALOG ?? null;
  const record = await selectFace(castLook(character, look), { required: args.includes('--new-sheet'), catalogPath: faceVariantCatalogPath, canonicalRoot: option('--canonical-root') });
  const binding = { characterId: record.characterId, name: record.name, gender: record.identity.gender, castStatus: 'local-draft', reviewStatus: 'candidate-unreviewed' };
  if (command === 'export') return { binding, record };
  if (command === '3d-generate') {
    if (!option('--look') || !option('--image') || !option('--output-dir')) throw new Error('--look, --image and --output-dir required');
    const image = resolve(option('--image'));
    const outputDir = resolve(option('--output-dir'));
    try { await stat(outputDir); throw new Error('output directory already exists: ' + outputDir); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const imageSha256 = createHash('sha256').update(await readFile(image)).digest('hex');
    const argv = ['generate', 'image-to-model', image, '--out', outputDir, '--json', '--no-open', '--name', record.characterId];
    if (option('--model')) argv.push('--model', option('--model'));
    if (args.includes('--no-wait')) argv.push('--no-wait');
    const contract = { pipeline: '3d-generation', binding, record, image, imageSha256, outputDir, command: '/opt/homebrew/bin/tripo', argv, execution: args.includes('--execute') ? 'requested' : 'export-only' };
    if (!args.includes('--execute')) return contract;
    const backend = await invoke(contract.command, argv);
    const { mkdir } = await import('node:fs/promises');
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, 'cast.json'), JSON.stringify({ ...binding, imageSha256, backend }, null, 2), { flag: 'wx' });
    return { ...contract, execution: 'backend-returned', backend };
  }
  if (command === '3d' || command === '3d-render') {
    if (!option('--input')) throw new Error('--input model required');
    const argv = [fileURLToPath(new URL('./portrait-gen.ts', import.meta.url)), 'generate', '--input', option('--input')];
    if (option('--output')) argv.push('--output', option('--output'));
    const contract = { pipeline: '3d', binding, record, command: process.execPath, argv };
    if (option('--output')) {
      const { renderPortrait } = await import('../pipeline/portrait.ts');
      const receipt = await renderPortrait({ input: option('--input'), output: option('--output') });
      const { writeFile } = await import('node:fs/promises');
      await writeFile(option('--output') + '.cast.json', JSON.stringify({ ...binding, imageSha256: receipt.outputSha256 }, null, 2), { flag: 'wx' });
    }
    return contract;
  }
  if (!option('--look') || !option('--reference') || !option('--style')) throw new Error('--look, --reference and --style required');
  const { emit, generate } = await import('../2d/emit-character-prompt.mjs');
  const input = { character: record, canonicalRoot: option('--canonical-root'), faceVariantCatalogPath, requireFaceMode: args.includes('--new-sheet'), mode: command, referencePath: option('--reference'), stylePath: option('--style'), slotOverrides: option('--slot-overrides') ? JSON.parse(await readFile(option('--slot-overrides'), 'utf8')) : {} };
  const result = option('--output') ? await generate(input, { output: option('--output'), identityReference: option('--identity-reference') }) : await emit(input);
  if (option('--output')) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(option('--output') + '.cast.json', JSON.stringify({ ...binding, imageSha256: result.imageSha256 }, null, 2), { flag: 'wx' });
  }
  return { ...result, binding };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await run(process.argv.slice(2)); console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = error.exitCode ?? 2; }
}
