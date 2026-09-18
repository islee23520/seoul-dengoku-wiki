import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { boundPath, buildCurationCatalog, discoverStage23CandidatePaths } from './build-curation-catalog.mjs';

const repo = resolve(import.meta.dirname, '../../..');
const output = join(repo, 'Design/potrait-generator/assets/v2/curation-catalog.json');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function build() {
  return buildCurationCatalog({ repoRoot: repo });
}

function countPngs(directory) {
  return readdirSync(directory).reduce((sum, name) => {
    const path = join(directory, name);
    return sum + (statSync(path).isDirectory() ? countPngs(path) : name.endsWith('.png') ? 1 : 0);
  }, 0);
}

function explicitCandidates() {
  const specs = [];
  const face = JSON.parse(readFileSync(join(repo, '.omo/evidence/portrait-stage23/g2-art-repair-v2/acceptance.json')));
  specs.push(...face.candidates.map((candidate) => ({
    path: `.omo/evidence/portrait-stage23/g2-art-repair-v2/${candidate.path}`,
    sha256: candidate.sha256,
  })));
  const accessories = JSON.parse(readFileSync(join(repo, '.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories/acceptance.json')));
  specs.push(...Object.values(accessories.candidates).map((candidate) => ({
    path: `.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories/${candidate.candidate}`,
    sha256: candidate.sha256,
  })));
  specs.push(...Object.values(accessories.preserved_acc_eye_01_02).map((candidate) => ({
    path: `.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories/${candidate.path}`,
    sha256: candidate.sha256,
  })));
  const final = JSON.parse(readFileSync(join(repo, '.omo/evidence/portrait-stage23/g2-final-repair-v3/integration/acceptance-binding.json')));
  specs.push(...Object.values(final.accepted).map((candidate) => ({ path: candidate.candidate, sha256: candidate.sha256 })));
  specs.push(...Object.values(final.excluded).map((candidate) => ({ path: candidate.candidate, sha256: candidate.sha256 })));
  return specs;
}

test('catalog reconciles production discovery and retains every explicit candidate', () => {
  const catalog = build();
  const actualProductionPngs = countPngs(join(repo, 'Design/potrait-generator/assets/v2/plates'));
  assert.equal(catalog.counts.discovered_production_source_paths, actualProductionPngs);
  assert.ok(catalog.counts.physical_production_pngs <= actualProductionPngs);
  assert.match(catalog.sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(catalog.counts.statuses), ['accepted', 'rejected', 'superseded', 'unreviewed']);
  for (const status of Object.keys(catalog.counts.statuses)) assert.ok(catalog.counts.statuses[status] > 0, status);

  const sourcePaths = new Set(catalog.records.flatMap((record) => record.source_paths));
  for (const candidate of explicitCandidates()) {
    assert.ok(sourcePaths.has(candidate.path), `omitted explicit candidate: ${candidate.path}`);
    const copied = join(repo, `Design/potrait-generator/assets/v2/curation/${candidate.sha256}.png`);
    assert.equal(sha256(readFileSync(copied)), candidate.sha256, candidate.path);
  }

  const productionPaths = catalog.records
    .filter((record) => record.kind !== 'evidence-candidate')
    .flatMap((record) => record.source_paths);
  assert.equal(productionPaths.length, actualProductionPngs);
  assert.equal(new Set(productionPaths).size, actualProductionPngs);
  const duplicateGroups = catalog.records.filter((record) => record.kind !== 'evidence-candidate' && record.source_paths.length > 1);
  assert.ok(duplicateGroups.length >= 2);
  assert.ok(duplicateGroups.every((record) => record.source_paths.length >= 2));
  assert.equal(duplicateGroups.flatMap(record => record.source_paths).length,
    productionPaths.length - new Set(catalog.records.filter(record => record.kind !== 'evidence-candidate').map(record => record.id)).size + duplicateGroups.length);
});

test('every accepted unique candidate is production-registered and no ineligible byte enters slots', () => {
  const catalog = build();
  const manifest = JSON.parse(readFileSync(join(repo, 'Design/potrait-generator/assets/v2/library.json')));
  const production = new Set();
  for (const sex of ['female', 'male']) for (const [slot, entry] of Object.entries(manifest.sexes[sex].slots)) {
    for (const variant of entry.variants) {
      assert.equal(variant.minimum_contract?.status, 'PASS', `${sex}/${slot}/${variant.id}`);
      production.add(`${sex}\0${slot}\0${variant.sha256}`);
      for (const override of variant.render_overrides ?? []) {
        assert.equal(override.minimum_contract?.status, 'PASS', `${sex}/${slot}/${variant.id}/override`);
        production.add(`${sex}\0${slot}_overrides\0${override.sha256}`);
      }
    }
  }
  const eligible = new Set(catalog.records.filter(record => record.baseline_role === 'current_production')
    .map(record => `${record.sex}\0${record.slot}\0${record.sha256}`));
  assert.deepEqual([...production].sort(), [...eligible].sort());
});

test('stage23 candidate-intent inventory is completely indexed and contract baselines remain distinct', () => {
  const catalog = build();
  const sourcePaths = new Set(catalog.records.flatMap(record => record.source_paths));
  const discovered = discoverStage23CandidatePaths(repo);
  const resolvable = discovered.filter(path => catalog.records.some(record => record.source_paths.includes(path)));
  assert.deepEqual(resolvable, discovered);
  assert.equal(catalog.counts.stage23_candidate_paths, discovered.length);
  assert.equal(catalog.counts.contract_pass,
    catalog.records.filter(record => record.contract_pass).length);
  assert.ok(catalog.records.some(record => record.baseline_role === 'contract_pass_baseline'));
  assert.ok(catalog.records.every(record => record.baseline_role !== 'contract_pass_baseline' || record.contract_pass));
});

test('bundles include physical companions and conditional hair override members', () => {
  const catalog = build();
  const maleHair = catalog.records.filter((record) => record.sex === 'male' && record.slot === 'hair' && record.kind === 'production-plate' && record.bundle === 'hair');
  assert.equal(maleHair.length, 3);
  assert.ok(maleHair.every((record) => record.render_members.length === 4));
  const femaleClothes02 = catalog.records.find((record) => record.sex === 'female' && record.slot === 'clothes' && record.logical_id === 'female-clothes-02' && record.kind === 'production-plate');
  assert.equal(femaleClothes02.bundle, 'clothes');
  assert.equal(femaleClothes02.render_members.length, 3);
  const maleHeadgear03 = catalog.records.find((record) => record.sex === 'male' && record.slot === 'headgear' && record.logical_id === 'male-headgear-03' && record.kind === 'production-plate');
  assert.equal(maleHeadgear03.bundle, 'headgear');
  assert.equal(maleHeadgear03.render_members.length, 3);
});

test('zero-alpha records are metadata-only and hard-excluded imagery never leaks in', () => {
  const catalog = build();
  assert.ok(catalog.records.some((record) => record.metadata_only && !record.visible_card));
  assert.ok(catalog.records.filter((record) => record.metadata_only).every((record) => !record.visible_card));
  const forbidden = /(?:^|\/)(?:composites?|contact[-_]?sheets?|isolates?|references?|masks?|crops?|previews?|provider|raw|qa)(?:\/|$)/i;
  for (const record of catalog.records) {
    for (const path of record.source_paths) {
      if (!forbidden.test(path)) continue;
      assert.equal(record.kind, 'evidence-candidate', path);
      assert.notEqual(record.status, 'unreviewed', path);
    }
  }
});

test('rerun is byte deterministic', () => {
  build();
  const first = readFileSync(output);
  build();
  assert.deepEqual(readFileSync(output), first);
});

test('path escape and hash drift fail closed', () => {
  assert.throws(() => boundPath(repo, '../outside.png'), /escapes repository/);
  const fixture = mkdtempSync(join(tmpdir(), 'curation-drift-'));
  for (const path of ['Design/potrait-generator/assets/v2', 'Tool/art/portrait', '.omo/evidence/portrait-stage23']) mkdirSync(join(fixture, path), { recursive: true });
  cpSync(join(repo, 'Design/potrait-generator/assets/v2'), join(fixture, 'Design/potrait-generator/assets/v2'), { recursive: true });
  cpSync(join(repo, 'Tool/art/portrait/portrait-layer-composite.mjs'), join(fixture, 'Tool/art/portrait/portrait-layer-composite.mjs'));
  cpSync(join(repo, '.omo/evidence/portrait-stage23'), join(fixture, '.omo/evidence/portrait-stage23'), { recursive: true });
  cpSync(join(repo, '.omo/evidence/st_01a0aab3'), join(fixture, '.omo/evidence/st_01a0aab3'), { recursive: true });
  const drift = join(fixture, 'Design/potrait-generator/assets/v2/plates/female/hair/hair-h0.png');
  writeFileSync(drift, Buffer.concat([readFileSync(drift), Buffer.from([0])]));
  assert.throws(() => buildCurationCatalog({ repoRoot: fixture }), /production hash drift/);
  rmSync(fixture, { recursive: true, force: true });
});

test('boundPath rejects symlinks that resolve outside the repository', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'curation-symlink-'));
  const outside = join(tmpdir(), `curation-outside-${process.pid}.png`);
  t.after(() => { rmSync(fixture, { recursive: true, force: true }); rmSync(outside, { force: true }); });
  writeFileSync(outside, Buffer.from('outside'));
  symlinkSync(outside, join(fixture, 'link.png'));
  assert.throws(() => boundPath(fixture, 'link.png'), /symlink/);
});

test('recursive production discovery rejects symlink entries', (t) => {
  const fixture = mkdtempSync(join(tmpdir(), 'curation-tree-symlink-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  cpSync(join(repo, 'Design'), join(fixture, 'Design'), { recursive: true });
  cpSync(join(repo, 'Tool'), join(fixture, 'Tool'), { recursive: true });
  cpSync(join(repo, '.omo'), join(fixture, '.omo'), { recursive: true });
  const target = join(fixture, 'outside.png'); writeFileSync(target, Buffer.from('outside'));
  symlinkSync(target, join(fixture, 'Design/potrait-generator/assets/v2/plates/female/bg/linked.png'));
  assert.throws(() => buildCurationCatalog({ repoRoot: fixture }), /symlink forbidden/);
});
