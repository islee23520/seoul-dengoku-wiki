import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'docs/assets/bom/donor/oddland-asset-catalog.json');
const hashList = join(root, 'docs/assets/bom/donor/oddland-donor-import.sha256');
const kinds = new Set(['model','texture','material','animation-clip','animator-controller','prefab-vfx','prefab-character','prefab-equipment','prefab-environment','prefab-projectile','prefab-other','audio-sfx','shader','font','sprite-atlas','spine-skeleton','spine-runtime-code','scene','post-process-profile','physics-material','text-data','doc']);
const families = /^(stage[1-4]|robson|arcade|loby|main|boss|pet|platformer|obstacles|objects|fx|grenade|portal|powershot|highlight|common|runtime|shader|postfx|scene|mail|font|ui|spine-(player|npc|tutorial|stage[1-4]|robson|common)|mecanim-[a-z0-9_-]+|sound-[a-z0-9_-]+|icon-[a-z0-9_-]+)$/;
const dispositions = new Set(['blockout-geometry','vfx-candidate','sfx-candidate','ui-reference-only','character-poc-only','tooling-runtime','excluded-artifact']);
function catalog() { assert.ok(existsSync(out), 'catalog must exist'); return JSON.parse(readFileSync(out)); }
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
test('markdown totals agree', () => { const c=catalog(); const md=readFileSync(out.replace('.json','.md'),'utf8'); assert.match(md,new RegExp(`Total assets[^\\n]*${c.total}`)); });
