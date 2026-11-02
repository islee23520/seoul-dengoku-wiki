import { mkdir as mkdirEvidence } from 'node:fs/promises';
await mkdirEvidence(new URL('../../../.omo/evidence/portrait-neutral-tests/', import.meta.url), { recursive: true });
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'vitest';
import { planCohort, verifyCohort } from './verify-portrait-cohort.mjs';

async function fixture() {
  const dir = await mkdtemp(new URL('../../../.omo/evidence/portrait-neutral-tests/cohort-test-', import.meta.url));
  const wikiRoot = join(dir, 'wiki');
  await mkdir(join(wikiRoot, 'public/portrait-tokens'), { recursive: true });
  await mkdir(join(wikiRoot, 'public/portraits'));
  await mkdir(join(wikiRoot, 'public/person-details'));
  const bytes = Buffer.from('reference fixture');
  const hash = createHash('sha256').update(bytes).digest('hex');
  const referencePath = join(dir, 'B.png');
  await writeFile(referencePath, bytes);
  const style = JSON.parse(await readFile(new URL('./style-lock.json', import.meta.url), 'utf8'));
  style.referenceSha256 = hash;
  const stylePath = join(dir, 'style.json');
  await writeFile(stylePath, JSON.stringify(style));
  const entries = ['person-0001', 'person-0002'].map((personId, i) => ({ personId, characterId: `K${String(i + 1).padStart(3, '0')}`, name: `인물${i}`, imageSha256: hash }));
  await writeFile(join(wikiRoot, 'portrait-catalog.json'), JSON.stringify({ entries }));
  for (const entry of entries) {
    await writeFile(join(wikiRoot, 'public/person-details', `${entry.personId}.json`), JSON.stringify({ id: entry.personId, name: entry.name, gender: '남성' }));
    await writeFile(join(wikiRoot, 'public/portraits', `${entry.personId}.png`), bytes);
    await writeFile(join(wikiRoot, 'public/portrait-tokens', `${entry.personId}.json`), JSON.stringify({ schemaVersion: 1, approval: 'art-proposal', ...entry, facts: { gender: '남성', role: '기록원' }, artProposal: { face: '작성된 얼굴', hair: '검은 머리', upper: '작업 재킷' }, image: { sha256: hash } }));
  }
  return { dir, wikiRoot, referencePath, stylePath, outputDir: join(dir, 'new-output') };
}

test('all candidates use one shared contract and preserve separate identities', async () => {
  const options = await fixture();
  try {
    const plan = await planCohort(options);
    assert.equal(plan.plans.length, 2);
    assert.equal(plan.contract.styleId, 'owner-image-reference-20261002');
    assert.notEqual(plan.plans[0].identityReference, plan.plans[1].identityReference);
    const called = [];
    const result = await verifyCohort(options, async (input, args) => {
      called.push(args);
      return { imageSha256: 'a'.repeat(64) };
    });
    assert.equal(called.length, 2);
    assert.equal(result.status, 'candidate-unreviewed');
    assert.equal(result.visualStatus, 'unreviewed');
    await assert.rejects(verifyCohort(options), { code: 'EEXIST' });
  } finally { await rm(options.dir, { recursive: true }); }
});

test('incorrect existing image hash fails before creating outputs', async () => {
  const options = await fixture();
  try {
    await writeFile(join(options.wikiRoot, 'public/portraits/person-0001.png'), 'changed image');
    await assert.rejects(verifyCohort(options), /provenance mismatch/);
    await assert.rejects(readFile(join(options.outputDir, 'cohort.json')), { code: 'ENOENT' });
  } finally { await rm(options.dir, { recursive: true }); }
});

test('reordered wiki detail IDs cannot attach a portrait to another person', async () => {
  const options = await fixture();
  try {
    await writeFile(join(options.wikiRoot, 'public/person-details/person-0001.json'), JSON.stringify({ name: '다른 인물', gender: '남성' }));
    await assert.rejects(verifyCohort(options), /identity mismatch/);
    await assert.rejects(readFile(join(options.outputDir, 'cohort.json')), { code: 'ENOENT' });
  } finally { await rm(options.dir, { recursive: true }); }
});

test('owner gender corrections block stale art tokens before generation', async () => {
  const options = await fixture();
  try {
    await writeFile(join(options.wikiRoot, 'public/person-details/person-0001.json'), JSON.stringify({ id: 'person-0001', name: '인물0', gender: '여성' }));
    await assert.rejects(verifyCohort(options), /gender mismatch/);
  } finally { await rm(options.dir, { recursive: true }); }
});

test('owner photo contract never silently falls back to a generated portrait', async () => {
  const options = await fixture();
  try {
    const path = join(options.wikiRoot, 'public/portrait-tokens/person-0001.json');
    const token = JSON.parse(await readFile(path, 'utf8'));
    const photo = join(options.dir, 'owner.png');
    const bytes = Buffer.from('owner photo bytes');
    await writeFile(photo, bytes);
    token.references = { identityRole: 'owner-face-and-hair-only', identitySha256: createHash('sha256').update(bytes).digest('hex') };
    await writeFile(path, JSON.stringify(token));
    let calls = 0;
    await assert.rejects(verifyCohort(options, async () => { calls++; }), /owner photo reference required/);
    assert.equal(calls, 0);
    await assert.rejects(planCohort({ ...options, identityMap: { 'person-0001': options.referencePath } }), /owner photo hash mismatch/);
    const plan = await planCohort({ ...options, identityMap: { 'person-0001': photo } });
    assert.equal(plan.plans[0].identityReference, photo);
    assert.equal(plan.plans[0].identitySha256, token.references.identitySha256);
    await assert.rejects(readFile(join(options.outputDir, 'cohort.json')), { code: 'ENOENT' });
  } finally { await rm(options.dir, { recursive: true }); }
});

test.each([
  ['portrait-tokens', 'characterId', 'K1009'],
  ['person-details', 'id', 'person-0002'],
])('mismatched permanent ID in %s rejects before generation or output creation', async (folder, field, value) => {
  const options = await fixture();
  try {
    const path = join(options.wikiRoot, 'public', folder, 'person-0001.json');
    const record = JSON.parse(await readFile(path, 'utf8'));
    record[field] = value;
    await writeFile(path, JSON.stringify(record));
    let calls = 0;
    await assert.rejects(verifyCohort(options, async () => { calls++; }), /identity mismatch/);
    assert.equal(calls, 0);
    await assert.rejects(readFile(join(options.outputDir, 'cohort.json')), { code: 'ENOENT' });
  } finally { await rm(options.dir, { recursive: true }); }
});
