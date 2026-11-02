import { test } from 'vitest';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/portrait-gen.ts', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'portrait-slots-'));
  await mkdir(join(directory, 'slots', 'hair'), { recursive: true });
  const mesh = Buffer.from('glTF-fixture-hair');
  await writeFile(join(directory, 'slots', 'hair', 'bob.glb'), mesh);
  const entry = {
    id: 'female-hair-bob', slot: 'hair', sex: 'female', name: 'Bob cut',
    file: 'slots/hair/bob.glb', sha256: sha(mesh),
    created_at: '2026-09-23T00:00:00Z', added_by: 'test',
    recipe: {
      pipeline: 'danny-mac-base-parts+tripo', reference_plate: 'plates/female/hair/x.png', reference_sha256: 'a'.repeat(64),
      prompt: 'hair shell only', prompt_sha256: sha('hair shell only'),
      generator: { tool: 'gti', model: 'gpt-5.6-sol' }, tripo: { task_id: 'task-1', model_version: 'v3.0' },
    },
    fit: { method: 'landmark-scale', receipt: 'fit.json' },
  };
  return { directory, catalog: join(directory, 'catalog.json'), entry };
}

test('catalog add records a hash-bound made item and list shows its recipe', async () => {
  const { directory, catalog, entry } = await fixture();
  try {
    await writeFile(join(directory, 'entry.json'), JSON.stringify(entry));
    const added = run('catalog', 'add', '--catalog', catalog, '--entry', join(directory, 'entry.json'));
    assert.equal(added.status, 0, added.stdout);
    const listed = JSON.parse(run('catalog', 'list', '--catalog', catalog).stdout);
    assert.equal(listed.ok, true);
    assert.deepEqual(listed.data.items.map(item => [item.id, item.slot, item.sex, item.recipe.pipeline, item.recipe.tripo.task_id]),
      [['female-hair-bob', 'hair', 'female', 'danny-mac-base-parts+tripo', 'task-1']]);
    assert.equal(JSON.parse(await readFile(catalog, 'utf8')).items[0].sha256, entry.sha256);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('avatar validates catalog slots before launching Blender and keeps generate --slot retired', async () => {
  const { directory, catalog, entry } = await fixture();
  try {
    await writeFile(join(directory, 'entry.json'), JSON.stringify(entry));
    assert.equal(run('catalog', 'add', '--catalog', catalog, '--entry', join(directory, 'entry.json')).status, 0);
    await writeFile(join(directory, 'body.blend'), 'body');
    const avatar = (...extra) => run('avatar', '--catalog', catalog, '--body', join(directory, 'body.blend'),
      '--output', join(directory, 'out.png'), '--blender', join(directory, 'no-blender'), ...extra);
    assert.match(avatar('--sex', 'female', '--slot', 'hair=missing').stdout, /SLOT_UNKNOWN/);
    assert.match(avatar('--sex', 'male', '--slot', 'hair=female-hair-bob').stdout, /SLOT_SEX_MISMATCH/);
    assert.match(avatar('--sex', 'female', '--slot', 'hair=female-hair-bob', '--slot', 'hair=female-hair-bob').stdout, /SLOT_DUPLICATE/);
    assert.match(avatar('--sex', 'female', '--slot', 'clothes=female-hair-bob').stdout, /SLOT_KIND_MISMATCH/);
    await writeFile(join(directory, 'bad-pose.json'), JSON.stringify({ deformer: 'armature-v1', bones: { 'c_arm_fk.l': [0, 400] } }));
    assert.match(avatar('--sex', 'female', '--pose', join(directory, 'bad-pose.json')).stdout, /POSE_INVALID/);
    await writeFile(join(directory, 'unknown-pose.json'), JSON.stringify({ deformer: 'shoulder-bend-v1', arm_angle_deg: 60 }));
    assert.match(avatar('--sex', 'female', '--pose', join(directory, 'unknown-pose.json')).stdout, /POSE_INVALID/);
    await writeFile(join(directory, 'bad-prop.json'), JSON.stringify({ deformer: 'armature-v1', bones: {}, properties: { 'c_hand_ik.l': { ik_fk_switch: 'fk' } } }));
    assert.match(avatar('--sex', 'female', '--pose', join(directory, 'bad-prop.json')).stdout, /POSE_INVALID/);
    const bust = avatar('--sex', 'female', '--framing', 'bust');
    assert.doesNotMatch(bust.stdout, /RENDER_OPTIONS/);
    assert.match(bust.stdout, /BLENDER_NOT_FOUND/);
    assert.match(avatar('--sex', 'female', '--framing', 'waist').stdout, /RENDER_OPTIONS/);
    await assert.rejects(readFile(join(directory, 'out.png')), { code: 'ENOENT' });
    assert.match(run('generate', '--slot', 'hair').stdout, /RETIRED_2D_PIPELINE/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('fit refuses missing inputs and existing outputs before launching Blender', async () => {
  const { directory } = await fixture();
  try {
    await writeFile(join(directory, 'body.blend'), 'body');
    await writeFile(join(directory, 'raw.glb'), 'raw');
    await writeFile(join(directory, 'taken.glb'), 'taken');
    const fit = (...extra) => run('fit', '--slot', 'clothes', '--body', join(directory, 'body.blend'), '--blender', join(directory, 'no-blender'), ...extra);
    assert.match(fit('--input', join(directory, 'missing.glb'), '--output', join(directory, 'out.glb')).stdout, /FIT_INPUT_MISSING/);
    assert.match(fit('--input', join(directory, 'raw.glb'), '--output', join(directory, 'taken.glb')).stdout, /OUTPUT_EXISTS/);
    assert.match(run('fit', '--slot', 'wings', '--body', join(directory, 'body.blend'), '--input', join(directory, 'raw.glb'), '--output', join(directory, 'o.glb')).stdout, /SLOT_USAGE/);
    await assert.rejects(readFile(join(directory, 'out.glb')), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('catalog add rejects missing recipe, hash mismatch, and duplicate ids without writing', async () => {
  const { directory, catalog, entry } = await fixture();
  try {
    const attempt = async (name, value) => {
      await writeFile(join(directory, name), JSON.stringify(value));
      return run('catalog', 'add', '--catalog', catalog, '--entry', join(directory, name));
    };
    const { prompt: _omit, ...recipe } = entry.recipe;
    const missing = await attempt('missing.json', { ...entry, recipe });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stdout, /CATALOG_ENTRY_INVALID/);
    const mismatch = await attempt('mismatch.json', { ...entry, sha256: 'b'.repeat(64) });
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stdout, /CATALOG_SHA_MISMATCH/);
    await assert.rejects(readFile(catalog), { code: 'ENOENT' });
    assert.equal((await attempt('ok.json', entry)).status, 0);
    const duplicate = await attempt('dup.json', entry);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stdout, /CATALOG_DUPLICATE/);
    assert.equal(JSON.parse(await readFile(catalog, 'utf8')).items.length, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
