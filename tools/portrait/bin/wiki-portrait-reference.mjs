#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const library = fileURLToPath(new URL('../references/wiki-people/', import.meta.url));

export async function resolveSource(source, repository, { cacheRoot = resolve(process.env.XDG_CACHE_HOME || resolve(homedir(), '.cache'), 'seoul-dengoku-tools', 'wiki-people'), fetchSource = fetch } = {}) {
  const path = resolve(cacheRoot, repository.revision, source.path);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const base = repository.remote.replace('https://github.com/', '').replace(/\.git$/, '');
    const host = source.repositoryPath.endsWith('.png') ? 'media.githubusercontent.com/media' : 'raw.githubusercontent.com';
    const url = `https://${host}/${base}/${repository.revision}/${source.repositoryPath}`;
    const response = await fetchSource(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`wiki source fetch failed (${response.status}): ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`wiki source hash mismatch: ${source.repositoryPath}`);
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, bytes);
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`wiki source hash mismatch: ${source.repositoryPath}`);
  return path;
}

export async function selectReference(personId, root = library, options = {}) {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  const entry = manifest.entries.find(item => item.personId === personId);
  if (!entry) throw new Error(`unknown portrait person ID: ${personId}`);
  const sourcePath = source => manifest.sourceRepository ? resolveSource(source, manifest.sourceRepository, options) : resolve(root, source.path);
  const image = await sourcePath(entry.image);
  const bytes = await readFile(image);
  if (createHash('sha256').update(bytes).digest('hex') !== entry.image.sha256) throw new Error('portrait reference hash mismatch');
  const tokenPath = await sourcePath(entry.tokens);
  const tokenBytes = await readFile(tokenPath);
  if (createHash('sha256').update(tokenBytes).digest('hex') !== entry.tokens.sha256) throw new Error('portrait token hash mismatch');
  const token = JSON.parse(tokenBytes);
  if (token.personId !== personId || token.characterId !== entry.characterId || token.name !== entry.name) throw new Error('portrait identity mismatch');
  const reviewPath = await sourcePath(entry.review);
  if (createHash('sha256').update(await readFile(reviewPath)).digest('hex') !== entry.review.sha256) throw new Error('portrait review hash mismatch');
  const character = {
    schemaVersion: 2, personId, characterId: entry.characterId, name: entry.name,
    sourceStatus: token.approval, sourceRefs: [entry.tokens.sourceUrl],
    ...(token.identity ? { identity: token.identity } : { identity: { characterId: entry.characterId, name: entry.name, gender: token.facts.gender } }),
    ...(token.slots ? { slots: token.slots } : { artProposal: Object.fromEntries(['face', 'hair', 'upper', 'lower', 'footwear'].map(key => [key, token.artProposal[key] ?? null])) }),
    faceMode: { kind: 'unique', variantId: null },
  };
  return { entry, character, wikiToken: tokenPath, reviewPath, referencePath: image, identityReference: image, stylePath: resolve(root, entry.style.path) };
}

export async function previewReference(personId, root = library, databasePath = null) {
  const selected = await selectReference(personId, root);
  if (databasePath) {
    const { openPeopleStore, getPerson } = await import('../../people/people-store.mjs');
    const db = openPeopleStore(databasePath);
    try {
      const person = getPerson(db, personId);
      if (person.character_id !== selected.entry.characterId || person.name !== selected.entry.name || person.portrait?.image_sha256 !== selected.entry.image.sha256) throw new Error('people database portrait mismatch');
    } finally { db.close(); }
  }
  const { emit } = await import('../2d/emit-character-prompt.mjs');
  const preview = await emit({ character: selected.character, referencePath: selected.referencePath, stylePath: selected.stylePath, mode: 'portrait' });
  return { personId, characterId: selected.entry.characterId, identityReference: selected.identityReference, preview };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const id = process.argv[2];
    if (!id || id === 'list') {
      const manifest = JSON.parse(await readFile(resolve(library, 'manifest.json'), 'utf8'));
      console.log(JSON.stringify(manifest.entries.map(({ personId, characterId, name }) => ({ personId, characterId, name })), null, 2));
    } else {
      const dbIndex = process.argv.indexOf('--db');
      console.log(JSON.stringify(await previewReference(id, library, dbIndex >= 0 ? resolve(process.argv[dbIndex + 1]) : null), null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
