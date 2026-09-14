import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const out = join(root, 'Reference/assets/bom/donor/oddland-asset-catalog.json');
const markdown = out.replace('.json', '.md');
const generator = join(root, 'Tool/tools/art/catalog-oddland-donor.mjs');
const hashList = join(root, 'Reference/assets/bom/donor/oddland-donor-import.sha256');
const kinds = new Set(['model','texture','material','animation-clip','animator-controller','prefab-vfx','prefab-character','prefab-equipment','prefab-environment','prefab-projectile','prefab-other','audio-sfx','shader','font','sprite-atlas','spine-skeleton','spine-runtime-code','scene','post-process-profile','physics-material','text-data','doc']);
const families = /^(stage[1-4]|robson|arcade|loby|main|boss|pet|platformer|obstacles|objects|fx|grenade|portal|powershot|highlight|common|runtime|shader|postfx|scene|mail|font|ui|spine-(player|npc|tutorial|stage[1-4]|robson|common)|mecanim-[a-z0-9_-]+|sound-[a-z0-9_-]+|icon-[a-z0-9_-]+)$/;
const dispositions = new Set(['blockout-geometry','vfx-candidate','sfx-candidate','ui-reference-only','character-poc-only','tooling-runtime','excluded-artifact']);
const ordinalCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
function catalog() { assert.ok(existsSync(out), 'catalog must exist'); return JSON.parse(readFileSync(out)); }
function runCatalog(argument) {
  return spawnSync(process.execPath, [generator, argument], { cwd: root, encoding: 'utf8' });
}
function markdownTable(marker) {
  const source = readFileSync(markdown, 'utf8');
  const match = source.match(new RegExp(`<!-- ${marker}:start -->\\n([\\s\\S]*?)<!-- ${marker}:end -->`));
  assert.ok(match, `missing ${marker} table`);
  return match[1]
    .trim()
    .split('\n')
    .filter(line => line.startsWith('|'))
    .slice(2)
    .map(line => line
      .split('|')
      .slice(1, -1)
      .map(cell => {
        const value = cell.trim();
        return value.startsWith('`') && value.endsWith('`') ? value.slice(1, -1) : value;
      }));
}
test('check rejects Markdown-only drift', { concurrency: false }, () => {
  const originalJson = readFileSync(out);
  const originalMarkdown = readFileSync(markdown);
  const baseline = runCatalog('--check');
  assert.equal(baseline.status, 0, baseline.stderr);

  const driftedMarkdown = Buffer.concat([
    originalMarkdown,
    Buffer.from('\n<!-- corrective Markdown drift fixture -->\n'),
  ]);
  let result;
  let jsonAfterCheck;
  let markdownAfterCheck;
  try {
    writeFileSync(markdown, driftedMarkdown);
    result = runCatalog('--check');
    jsonAfterCheck = readFileSync(out);
    markdownAfterCheck = readFileSync(markdown);
  } finally {
    writeFileSync(markdown, originalMarkdown);
  }

  assert.ok(readFileSync(markdown).equals(originalMarkdown), 'Markdown drift fixture must be restored exactly');
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, '--check must reject Markdown-only drift');
  assert.ok(jsonAfterCheck.equals(originalJson), '--check must not rewrite JSON');
  assert.ok(markdownAfterCheck.equals(driftedMarkdown), '--check must not rewrite Markdown');
});
test('summary leaves JSON and Markdown bytes unchanged', { concurrency: false }, () => {
  const originalJson = readFileSync(out);
  const originalMarkdown = readFileSync(markdown);
  const baseline = runCatalog('--check');
  assert.equal(baseline.status, 0, baseline.stderr);

  const driftedMarkdown = Buffer.concat([
    originalMarkdown,
    Buffer.from('\n<!-- read-only summary fixture -->\n'),
  ]);
  let result;
  let jsonAfterSummary;
  let markdownAfterSummary;
  try {
    writeFileSync(markdown, driftedMarkdown);
    result = runCatalog('--summary');
    jsonAfterSummary = readFileSync(out);
    markdownAfterSummary = readFileSync(markdown);
  } finally {
    writeFileSync(markdown, originalMarkdown);
  }

  assert.ok(readFileSync(markdown).equals(originalMarkdown), 'summary fixture must be restored exactly');
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(jsonAfterSummary.equals(originalJson), '--summary must not rewrite JSON');
  assert.ok(markdownAfterSummary.equals(driftedMarkdown), '--summary must not rewrite Markdown');
});
test('catalog contract and manifest coverage', () => {
  const c = catalog(); const listed = new Set(readFileSync(hashList,'utf8').trim().split('\n').map(x=>x.split('  ')[1]).filter(x=>!x.endsWith('.meta')));
  assert.equal(c.schema_version, 1); assert.equal(c.total, listed.size); assert.equal(c.rows.length, listed.size);
  assert.deepEqual(new Set(c.rows.map(r=>r.path)), listed);
  for (const r of c.rows) { assert.ok(kinds.has(r.kind), r.path); assert.match(r.family, families, r.path); assert.ok(dispositions.has(r.disposition), r.path); assert.equal(r.ext, r.path.slice(r.path.lastIndexOf('.')).toLowerCase()); assert.match(r.sha256,/^[0-9a-f]{64}$/); assert.equal(typeof r.bytes,'number'); }
  assert.equal(c.generated_from, createHash('sha256').update(readFileSync(hashList)).digest('hex'));
});
test('classification samples', () => {
 const c = catalog(); const by = p => c.rows.find(r=>r.path===p);
 assert.deepEqual([by('Res/XResource/SpineAssets/Stage1/Pig/City_pigzombie.atlas.txt').kind,by('Res/XResource/SpineAssets/Stage1/Pig/City_pigzombie.atlas.txt').note],['spine-skeleton','atlas']);
 assert.equal(by('Res/XResource/SpineAssets/Stage1/Pig/City_pigzombie_SkeletonData.asset').kind,'spine-skeleton');
 assert.equal(by('Res/Atlas/BMDOHYEON_HUD_Atlas.asset').kind,'sprite-atlas');
 assert.equal(by('Res/GameAssets/Prefabs/Fx/FX_Assassin_Skill.prefab').kind,'prefab-vfx');
 const characterPrefab = by('Res/Prefabs/Character/CharPlayer.prefab');
 assert.deepEqual([characterPrefab.kind, characterPrefab.family, characterPrefab.disposition], ['prefab-character','spine-player','character-poc-only']);
 const characterSpinePrefab = by('Res/Prefabs/CharacterSpines/Town/NPC/Merchant_Upgrade.prefab');
 assert.equal(characterSpinePrefab.kind, 'prefab-character');
 const pigAtlas = by('Res/XResource/SpineAssets/Stage1/Pig/City_pigzombie.atlas.txt');
 assert.equal(pigAtlas.family, 'spine-stage1');
 assert.equal(by('Res/XResource/Scenes/Union.unity').disposition,'excluded-artifact');
 assert.equal(by('Spine/Runtime/spine-unity.asmdef').kind,'spine-runtime-code');
 const postfx = c.rows.filter(r => r.path.startsWith('Post Processing Profiles/') && r.ext === '.asset');
 assert.ok(postfx.length > 0);
 for (const r of postfx) assert.deepEqual([r.kind, r.family, r.disposition], ['post-process-profile','postfx','vfx-candidate']);
 assert.equal(c.rows.filter(r => r.rule === 'other' || r.rule === 'fallback').length, 0);
 const spineAssets = c.rows.filter(r => r.path.startsWith('Spine/Runtime/') && r.ext === '.asset');
 assert.ok(spineAssets.length > 0);
 for (const r of spineAssets) assert.deepEqual([r.kind, r.family, r.disposition], ['text-data','runtime','tooling-runtime']);
 assert.equal(by('Res/Font/BrandGrade/BrandGrade.txt').kind,'text-data');
});
test('markdown joint and family fit tables cover catalog', () => {
  const c = catalog();
  const expectedJoint = new Map();
  const expectedFamilies = new Map();
  for (const row of c.rows) {
    const jointKey = [row.kind, row.family, row.disposition].join('\u0000');
    const joint = expectedJoint.get(jointKey) ?? { count: 0, bytes: 0 };
    joint.count += 1;
    joint.bytes += row.bytes;
    expectedJoint.set(jointKey, joint);

    const family = expectedFamilies.get(row.family) ?? {
      count: 0,
      kinds: new Set(),
      dispositions: new Set(),
    };
    family.count += 1;
    family.kinds.add(row.kind);
    family.dispositions.add(row.disposition);
    expectedFamilies.set(row.family, family);
  }

  const actualJoint = new Map();
  for (const [kind, family, disposition, count, bytes] of markdownTable('oddland-joint-table')) {
    const key = [kind, family, disposition].join('\u0000');
    assert.equal(actualJoint.has(key), false, `duplicate joint table key: ${kind} / ${family} / ${disposition}`);
    actualJoint.set(key, {
      count: Number(count),
      bytes: Number(bytes),
    });
  }
  assert.equal(actualJoint.size, expectedJoint.size);
  assert.deepEqual(
    [...actualJoint].sort(([left], [right]) => ordinalCompare(left, right)),
    [...expectedJoint].sort(([left], [right]) => ordinalCompare(left, right)),
  );

  const actualFamilies = new Map();
  for (const [family, count, kinds, dispositions, fitNote] of markdownTable('oddland-family-fit-table')) {
    assert.ok(fitNote.length > 0, family);
    assert.equal(actualFamilies.has(family), false, `duplicate family fit table key: ${family}`);
    actualFamilies.set(family, {
      count: Number(count),
      kinds: kinds.split(', ').filter(Boolean),
      dispositions: dispositions.split(', ').filter(Boolean),
    });
  }
  const normalizedExpectedFamilies = new Map(
    [...expectedFamilies].map(([family, values]) => [family, {
      count: values.count,
      kinds: [...values.kinds].sort(ordinalCompare),
      dispositions: [...values.dispositions].sort(ordinalCompare),
    }]),
  );
  assert.equal(actualFamilies.size, normalizedExpectedFamilies.size);
  assert.deepEqual(
    [...actualFamilies].sort(([left], [right]) => ordinalCompare(left, right)),
    [...normalizedExpectedFamilies].sort(([left], [right]) => ordinalCompare(left, right)),
  );
});
test('markdown totals agree', () => { const c=catalog(); const md=readFileSync(markdown,'utf8'); assert.match(md,new RegExp(`Total assets[^\\n]*${c.total}`)); });
