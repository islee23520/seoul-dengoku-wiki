import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, isAbsolute } from 'node:path';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// publisher receives only native bytes and their binding, never the private request.
// remoteHashLookup returns the remote SHA-256, or null for confirmed absence.
// For relative producer paths, producerBase is the absolute CLI generation cwd.
// No resume-cwd or manifest-directory fallback can recover that missing binding.
export async function resumePublication({ manifestPath, statePath, producerBase, publisher, remoteHashLookup }) {
  if (resolve(manifestPath) === resolve(statePath)) throw new Error('publication state must be separate from preservation');
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schema !== 'native-output-preservation.v1' || !Array.isArray(manifest.outputs) || !manifest.outputs.length || manifest.outputs.some(item => !Number.isInteger(item.index) || item.index <= 0 || typeof item.path !== 'string' || !item.path.length || !/^[a-f0-9]{64}$/.test(item.imageSha256) || !['pending', 'accepted', 'rejected'].includes(item.outputValidationStatus)) || new Set(manifest.outputs.map(item => item.index)).size !== manifest.outputs.length) throw new Error('invalid native preservation manifest');
  if (manifest.outputs.some(item => !isAbsolute(item.path)) && (typeof producerBase !== 'string' || !isAbsolute(producerBase))) throw new Error('absolute producerBase required for relative native paths');
  const sourcePaths = manifest.outputs.map(item => isAbsolute(item.path) ? item.path : resolve(producerBase, item.path));
  if (sourcePaths.some(path => resolve(path) === resolve(statePath))) throw new Error('publication state must be separate from native outputs');
  const manifestSha256 = digest(manifestBytes);
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (state && (state.schema !== 'native-publication-resume.v1' || state.ownerVerdict !== 'pending' || state.manifestSha256 !== manifestSha256 || !Array.isArray(state.outputs) || state.outputs.length !== manifest.outputs.length || state.outputs.some((item, index) => item.index !== manifest.outputs[index].index || item.imageSha256 !== manifest.outputs[index].imageSha256 || item.outputValidationStatus !== manifest.outputs[index].outputValidationStatus || !['pending', 'uncertain', 'published'].includes(item.status)))) throw new Error('publication state binding mismatch');
  state ??= { schema: 'native-publication-resume.v1', manifestSha256, ownerVerdict: 'pending', outputs: manifest.outputs.map(item => ({ index: item.index, imageSha256: item.imageSha256, outputValidationStatus: item.outputValidationStatus, status: 'pending', publicationError: null })) };
  const persist = () => writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
  await persist();
  const sources = [];
  // Validate every source before the first upload, including confirmed resumptions.
  for (const [index, output] of manifest.outputs.entries()) {
    try {
      const bytes = await readFile(sourcePaths[index]);
      if (digest(bytes) !== output.imageSha256) throw new Error('native source SHA-256 mismatch');
      sources.push(bytes);
    } catch (error) {
      state.outputs[index].publicationError = error.message;
      await persist();
      throw error;
    }
  }
  for (const [index, output] of manifest.outputs.entries()) {
    const item = state.outputs[index];
    if (item.status === 'published') continue;
    const binding = { index: output.index, imageSha256: output.imageSha256 };
    try {
      if (item.status === 'uncertain') {
        const remote = await remoteHashLookup(binding);
        if (remote !== null) {
          if (remote !== output.imageSha256) throw new Error('remote SHA-256 mismatch');
          item.status = 'published'; item.publicationError = null;
          await persist();
          continue;
        }
        item.status = 'pending';
        await persist();
      }
      // A process death or lost response after this write must trigger lookup.
      item.status = 'uncertain'; item.publicationError = null;
      await persist();
      await publisher({ ...binding, bytes: sources[index] });
      if (await remoteHashLookup(binding) !== output.imageSha256) throw new Error('remote SHA-256 mismatch');
      item.status = 'published'; item.publicationError = null;
      await persist();
    } catch (error) {
      item.publicationError = error.message;
      await persist();
      throw error;
    }
  }
  return state;
}
