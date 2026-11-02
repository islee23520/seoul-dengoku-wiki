import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { inspectCandidate } from './resume-candidate.mjs';
import { validateCanonicalContext } from './emit-character-prompt.mjs';
import { validateVisualSnapshot } from './cliproxy-edit.mjs';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const inputBytes = record => JSON.stringify(record);
export function candidatePaths(imagePath, inputPath) {
  return { imagePath, inputPath, requestPath: imagePath + '.request.json', receiptPath: imagePath + '.receipt.json' };
}
async function bindingAt(path) {
  try { const value = JSON.parse(await readFile(path, 'utf8')); return value.schemaVersion === 1 ? value.binding : null; }
  catch (error) { if (error.code === 'ENOENT' || error instanceof SyntaxError) return null; throw error; }
}
export async function inspectBatchCandidate({ record, imagePath, inputPath, canonicalRoot, rejectedImageSha256 = [] }) {
  const result = await inspectCandidate({ ...candidatePaths(imagePath, inputPath), expected: { characterId: record.characterId, name: record.name, inputSha256: digest(inputBytes(record)) }, binding: await bindingAt(imagePath + '.resume.json'), rejectedImageSha256 });
  if (result.status === 'generated' && (record.canonicalContext != null || record.birthContext != null)) {
    try { await validateCanonicalContext(record, canonicalRoot); }
    catch (error) { return { ...result, status: 'unverified', reason: 'canonical-source-changed', canonicalError: error.message, requiresNewSuffix: true }; }
  }
  return result;
}

// The callback executes the actual generation request. Bind only new output,
// immediately after the provider's sourceSnapshot proves the original context.
export async function runBatchCandidate({ record, imagePath, inputPath, canonicalRoot, buildRequest, provider, rejectedImageSha256 = [] }) {
  const before = await inspectBatchCandidate({ record, imagePath, inputPath, canonicalRoot, rejectedImageSha256 });
  if (before.status === 'generated') return { ...before, reused: true };
  if (before.requiresNewSuffix) throw new Error('new candidate suffix required: ' + before.reason);
  await validateCanonicalContext(record, canonicalRoot);
  try { await readFile(imagePath + '.resume.json'); throw new Error('new candidate suffix required: occupied binding'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(dirname(inputPath), { recursive: true });
  try { await writeFile(inputPath, inputBytes(record), { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; if (!Buffer.from(inputBytes(record)).equals(await readFile(inputPath))) throw new Error('input snapshot changed; new suffix required'); }
  const request = await buildRequest(record, imagePath);
  const prompt = request.argv[request.argv.indexOf('--prompt') + 1];
  const contextLine = prompt.split('\n').find(line => line.startsWith('serializedRecipientContext='));
  if (!contextLine) throw new Error('original recipient context required');
  const context = JSON.parse(contextLine.slice('serializedRecipientContext='.length));
  if (context.characterId !== record.characterId || context.name !== record.name || !isDeepStrictEqual(context.canonicalContext, record.canonicalContext) || !isDeepStrictEqual(context.birthContext, record.birthContext)) throw new Error('emitter context provenance mismatch');
  await mkdir(dirname(imagePath), { recursive: true });
  await provider(request);
  const paths = candidatePaths(imagePath, inputPath);
  const savedRequest = JSON.parse(await readFile(paths.requestPath, 'utf8'));
  if (!savedRequest.visualSnapshot) throw new Error('provider visualSnapshot required for new candidate');
  if (savedRequest.sourceSnapshot?.promptSha256 !== digest(prompt) || savedRequest.sourceSnapshot.prompt !== prompt || !isDeepStrictEqual(savedRequest.sourceSnapshot.recipientContext, context)) throw new Error('provider sourceSnapshot mismatch');
  validateVisualSnapshot(savedRequest);
  const binding = { characterId: record.characterId, name: record.name };
  for (const [key, path] of Object.entries(paths)) binding[key.replace('Path', 'Sha256')] = digest(await readFile(path));
  if (savedRequest.visualSnapshot) {
    binding.sourcePromptSha256 = savedRequest.sourceSnapshot.promptSha256;
    binding.transmittedPromptSha256 = savedRequest.visualSnapshot.transmittedPromptSha256;
  }
  const options = { ...paths, expected: { characterId: record.characterId, name: record.name, inputSha256: digest(inputBytes(record)) }, binding, rejectedImageSha256 };
  const result = await inspectCandidate(options);
  if (result.status !== 'generated') throw new Error('candidate not verified: ' + result.reason);
  await validateCanonicalContext(record, canonicalRoot);
  await writeFile(imagePath + '.resume.json', JSON.stringify({ schemaVersion: 1, status: 'candidate-unreviewed', binding }), { flag: 'wx' });
  return { ...result, reused: false };
}
