import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectReference, previewReference, resolveSource } from '../bin/wiki-portrait-reference.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'wiki-portrait-reference-'));
  try {
    const token = { personId: 'person-1003', characterId: 'K1003', name: '조재표', approval: 'art-proposal', facts: { gender: '남성' }, artProposal: { face: 'angular jaw' } };
    const bodies = { image: Buffer.from('fixture-image'), tokens: Buffer.from(JSON.stringify(token)), review: Buffer.from('{}') };
    const entry = { personId: token.personId, characterId: token.characterId, name: token.name, style: { path: 'style.json' } };
    for (const [key, bytes] of Object.entries(bodies)) {
      const path = key === 'image' ? 'images/person-1003.png' : `${key}/person-1003.json`;
      entry[key] = { path, repositoryPath: `public/${path}`, sha256: hash(bytes), sourceUrl: `https://example.test/${path}` };
      await mkdir(join(root, key === 'image' ? 'images' : key), { recursive: true });
      await writeFile(join(root, path), bytes);
    }
    await writeFile(join(root, 'style.json'), JSON.stringify({ status: 'owner-selected-reference', styleId: 'fixture', referenceSha256: entry.image.sha256 }));
    const manifest = { entries: [entry] };
    await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
    await run({ root, manifest, entry, bodies, token });
  } finally {
    await rm(root, { recursive: true });
  }
}

test('registered wiki portrait preserves permanent identity and validates source bytes', async () => fixture(async ({ root, entry }) => {
  const selected = await selectReference('person-1003', root);
  assert.equal(selected.entry.characterId, 'K1003');
  assert.equal(selected.entry.name, '조재표');
  assert.equal(selected.referencePath, selected.identityReference);
  const result = await previewReference('person-1003', root);
  assert.equal(result.preview.referenceSha256, entry.image.sha256);
  await assert.rejects(selectReference('missing-person', root), /unknown portrait person ID/);
}));

test('modified local image bytes stop reference selection', async () => fixture(async ({ root, entry }) => {
  await writeFile(join(root, entry.image.path), 'modified-image');
  await assert.rejects(selectReference('person-1003', root), /portrait reference hash mismatch/);
}));

test('remote selection downloads pinned sources once and reuses verified cache offline', async () => fixture(async ({ root, manifest, entry, bodies }) => {
  manifest.sourceRepository = { remote: 'https://github.com/islee23520/seoul-dengoku-wiki.git', revision: 'a'.repeat(40) };
  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
  const urls = [];
  const options = { cacheRoot: join(root, 'cache'), fetchSource: async url => {
    urls.push(url);
    const key = Object.keys(bodies).find(key => url.endsWith(entry[key].repositoryPath));
    assert.ok(key);
    return new Response(bodies[key]);
  } };
  const selected = await selectReference('person-1003', root, options);
  assert.equal(urls.length, 3);
  assert.ok(urls[0].startsWith('https://media.githubusercontent.com/media/islee23520/seoul-dengoku-wiki/'));
  assert.ok(urls[1].startsWith('https://raw.githubusercontent.com/islee23520/seoul-dengoku-wiki/'));
  assert.ok(urls.every(url => url.includes(manifest.sourceRepository.revision)));
  assert.deepEqual(await readFile(selected.referencePath), bodies.image);
  const offline = { ...options, fetchSource: async () => { throw new Error('unexpected network access'); } };
  assert.equal((await selectReference('person-1003', root, offline)).referencePath, selected.referencePath);
  await writeFile(selected.referencePath, 'tampered cache');
  await assert.rejects(selectReference('person-1003', root, offline), /wiki source hash mismatch/);
}));

test('remote HTTP failures and corrupt downloads never populate cache', async () => fixture(async ({ root, entry }) => {
  const repository = { remote: 'https://github.com/islee23520/seoul-dengoku-wiki.git', revision: 'b'.repeat(40) };
  const options = { cacheRoot: join(root, 'cache') };
  await assert.rejects(resolveSource(entry.image, repository, { ...options, fetchSource: async () => new Response('', { status: 404 }) }), /wiki source fetch failed \(404\)/);
  for (const key of ['image', 'tokens', 'review']) {
    await assert.rejects(resolveSource(entry[key], repository, { ...options, fetchSource: async () => new Response('corrupt') }), /wiki source hash mismatch/);
    await assert.rejects(readFile(join(options.cacheRoot, repository.revision, entry[key].path)), { code: 'ENOENT' });
  }
}));

test('valid token bytes with a different permanent identity are rejected', async () => fixture(async ({ root, entry, token, manifest }) => {
  const bytes = JSON.stringify({ ...token, characterId: 'K0001' });
  entry.tokens.sha256 = hash(bytes);
  await writeFile(join(root, entry.tokens.path), bytes);
  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
  await assert.rejects(selectReference('person-1003', root), /portrait identity mismatch/);
}));
