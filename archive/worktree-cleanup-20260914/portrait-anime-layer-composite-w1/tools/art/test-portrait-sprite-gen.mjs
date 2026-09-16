import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  buildPortraitSpriteGenPlan,
  curatePortraitSpriteGen,
  stagePortraitSpriteGenPngs,
} from './portrait-sprite-gen.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const RECIPE = resolve(ROOT, 'web/portrait-demo/assets/recipe.json');

test('portrait sprite-gen plan imports every full-size source as one named still row', () => {
  const plan = buildPortraitSpriteGenPlan(RECIPE);

  assert.equal(plan.base.path, resolve(ROOT, 'web/portrait-demo/assets/v2/target.png'));
  assert.equal(plan.rows.length, 22);
  assert.equal(new Set(plan.rows.map((row) => row.name)).size, plan.rows.length);
  for (const row of plan.rows) {
    assert.equal(row.width, 1145);
    assert.equal(row.height, 1374);
    assert.equal(row.source.endsWith('.png'), true);
  }
  assert.ok(plan.rows.some((row) => row.name.includes('hair-h1')));
  assert.ok(plan.rows.some((row) => row.refs.some((ref) => ref.role === 'basis')));
});

test('portrait sprite-gen staging preserves sources, creates one _base, and records unknown rights', () => {
  const plan = buildPortraitSpriteGenPlan(RECIPE);
  const directory = mkdtempSync(resolve(tmpdir(), 'portrait-sprite-gen-'));
  try {
    const staged = stagePortraitSpriteGenPngs(plan, resolve(directory, 'pngs'));
    assert.deepEqual(readFileSync(staged.base), readFileSync(plan.base.path));
    assert.equal(staged.rows.length, plan.rows.length);
    for (const row of staged.rows) {
      assert.deepEqual(readFileSync(row.source), readFileSync(row.imported));
    }
    const provenance = JSON.parse(readFileSync(staged.provenance, 'utf8'));
    assert.equal(provenance.rights, 'unknown');
    assert.equal(provenance.approved, false);
    assert.equal(provenance.workflow, 'imported-still-curation');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('portrait sprite-gen plan rejects a missing source before any import run can be created', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'portrait-sprite-gen-missing-'));
  try {
    const recipe = JSON.parse(readFileSync(RECIPE, 'utf8'));
    recipe.assets[0].path = 'v2/base/slots/missing.png';
    const brokenRecipe = resolve(directory, 'recipe.json');
    writeFileSync(brokenRecipe, `${JSON.stringify(recipe)}\n`);
    assert.throws(() => buildPortraitSpriteGenPlan(brokenRecipe), /missing portrait source/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('portrait sprite-gen refuses an existing output directory without touching it', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'portrait-sprite-gen-existing-'));
  const output = resolve(directory, 'already-curated');
  try {
    mkdirSync(output);
    const sentinel = resolve(output, 'sentinel.txt');
    writeFileSync(sentinel, 'preserve');
    assert.throws(
      () => curatePortraitSpriteGen({ recipePath: RECIPE, outDir: output, spriteGenBin: '/not-used' }),
      /output directory already exists/,
    );
    assert.equal(readFileSync(sentinel, 'utf8'), 'preserve');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
