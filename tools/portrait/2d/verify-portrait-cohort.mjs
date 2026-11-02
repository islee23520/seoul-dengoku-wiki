#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, generate } from './emit-character-prompt.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export async function planCohort({ wikiRoot, referencePath, identityMap = {}, excludedIds = [], stylePath = join(root, 'style-lock.json') }) {
  const catalog = JSON.parse(await readFile(join(wikiRoot, 'portrait-catalog.json'), 'utf8'));
  const plans = [];
  let shared = null;
  for (const entry of catalog.entries) {
    if (excludedIds.includes(entry.personId)) continue;
    const wikiToken = join(wikiRoot, 'public/portrait-tokens', `${entry.personId}.json`);
    const token = JSON.parse(await readFile(wikiToken, 'utf8'));
    const person = JSON.parse(await readFile(join(wikiRoot, 'public/person-details', `${entry.personId}.json`), 'utf8'));
    if (person.name !== entry.name || token.name !== entry.name || token.personId !== entry.personId || person.id !== entry.personId || token.characterId !== entry.characterId) throw new Error(`portrait identity mismatch: ${entry.personId}`);
    if (token.facts?.gender !== person.gender) throw new Error(`portrait gender mismatch: ${entry.personId}`);
    const existingImage = join(wikiRoot, 'public/portraits', `${entry.personId}.png`);
    if (sha(await readFile(existingImage)) !== entry.imageSha256 || token.image.sha256 !== entry.imageSha256) throw new Error(`portrait provenance mismatch: ${entry.personId}`);
    const ownerPhotoRequired = token.references?.identityRole?.startsWith('owner-');
    if (ownerPhotoRequired && !identityMap[entry.personId]) throw new Error(`owner photo reference required: ${entry.personId}`);
    const identityReference = identityMap[entry.personId] ?? existingImage;
    const identitySha256 = sha(await readFile(identityReference));
    if (ownerPhotoRequired && identitySha256 !== token.references.identitySha256) throw new Error(`owner photo hash mismatch: ${entry.personId}`);
    const input = { wikiToken, mode: 'portrait', referencePath, stylePath };
    const result = await emit(input);
    const contract = { camera: result.camera, pose: result.pose, cameraContractId: result.cameraContractId, styleId: result.styleId, styleSha256: result.referenceSha256 };
    if (shared && JSON.stringify(shared) !== JSON.stringify(contract)) throw new Error(`shared portrait contract mismatch: ${entry.personId}`);
    shared = contract;
    plans.push({ personId: entry.personId, name: entry.name, input, identityReference, identitySha256 });
  }
  if (!plans.length) throw new Error('no portrait candidates selected');
  return { contract: shared, plans };
}

export async function verifyCohort(options, generateImage = generate) {
  const plan = await planCohort(options);
  if (!options.outputDir) throw new Error('new output directory required');
  await mkdir(options.outputDir);
  const manifest = { schemaVersion: 1, status: options.planOnly ? 'input-contract-verified-only' : 'generating', contract: plan.contract, visualStatus: 'unreviewed', candidates: plan.plans.map(p => ({ personId: p.personId, name: p.name, identitySha256: p.identitySha256, status: 'not-generated' })) };
  const save = () => writeFile(join(options.outputDir, 'cohort.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await save();
  if (options.planOnly) return manifest;
  for (const [index, item] of plan.plans.entries()) {
    const output = join(options.outputDir, `${item.personId}.png`);
    const receipt = await generateImage(item.input, { output, identityReference: item.identityReference });
    manifest.candidates[index] = { ...manifest.candidates[index], status: 'candidate-unreviewed', image: `${item.personId}.png`, imageSha256: receipt.imageSha256 };
    await save();
  }
  manifest.status = 'candidate-unreviewed';
  await save();
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = flag => { const i = process.argv.indexOf(flag); return i < 0 ? null : process.argv[i + 1]; };
  try {
    if (!arg('--wiki-root') || !arg('--reference') || !arg('--output-dir')) throw new Error('usage: --wiki-root <wiki> --reference <B.png> --output-dir <new-folder> [--identity-map <json>] [--plan-only]');
    const identityMap = arg('--identity-map') ? JSON.parse(await readFile(arg('--identity-map'), 'utf8')) : {};
    const result = await verifyCohort({ wikiRoot: arg('--wiki-root'), referencePath: arg('--reference'), outputDir: arg('--output-dir'), identityMap, planOnly: process.argv.includes('--plan-only') });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
