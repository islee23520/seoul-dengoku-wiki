import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

test('every proposed portrait is bound to its person and immutable image hash', async () => {
  const catalog = JSON.parse(await readFile(new URL('../portrait-catalog.json', import.meta.url), 'utf8'));
  const genders = JSON.parse(await readFile(new URL('../lore/name-pools/gender-cast.json', import.meta.url), 'utf8')).people;
  assert.equal(catalog.entries.length, 21);
  assert.equal(new Set(catalog.entries.map(e => e.personId)).size, 21);
  assert.equal(catalog.entries.filter(e => e.stateId).length, 16);
  for (const entry of catalog.entries) {
    assert.equal(entry.approval, 'art-proposal');
    const token = JSON.parse(await readFile(new URL(`../public/portrait-tokens/${entry.personId}.json`, import.meta.url), 'utf8'));
    const image = await readFile(new URL(`../public/portraits/${entry.personId}.png`, import.meta.url));
    assert.equal(token.personId, entry.personId);
    assert.equal(token.characterId, entry.characterId);
    assert.equal(token.image.sha256, createHash('sha256').update(image).digest('hex'));
    assert.equal(token.image.sha256, entry.imageSha256);
    assert.equal(token.facts.gender, genders.find(g => g.name === entry.name)?.gender);
    assert.equal(token.facts.genderUserLocked, genders.find(g => g.name === entry.name)?.user_locked);
    assert.equal(token.style.portraitShotId, 'medium-close-up-119');
    assert.doesNotMatch(JSON.stringify(token), /(?:\/Users\/|CLIPROXY_API_KEY|OPENAI_API_KEY|Authorization|apiKey)/);
  }
});
