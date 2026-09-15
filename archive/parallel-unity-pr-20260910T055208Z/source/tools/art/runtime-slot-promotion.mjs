import { readFileSync, writeFileSync, existsSync, realpathSync, mkdirSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { evaluatePromotedAsset, runtimeSlotContract, defaultRepoRoot } from './runtime-asset-provenance.mjs';

const [mode, requestPath] = process.argv.slice(2);
const root = defaultRepoRoot;
const request = JSON.parse(readFileSync(requestPath, 'utf8'));
const row = request.asset;
const slot = runtimeSlotContract.slots.find(s => s.slot === row?.runtime_slot);
if (!slot) throw new Error('Unknown runtime slot');
const canonical = path => typeof path === 'string' && !path.includes('\\') && !path.includes(':')
  && path.split('/').every(p => p && p !== '.' && p !== '..');
const sources = request.candidate_files;
const paths = Object.keys(row.runtime_files ?? {});
if (!sources || Object.keys(sources).length !== paths.length) throw new Error('Candidate file set mismatch');
for (const path of paths) {
  const source = sources[path];
  if (!canonical(path) || !path.startsWith(slot.destination) || !canonical(source)
    || !source.startsWith(runtimeSlotContract.candidate_root)
    || !realpathSync(resolve(root, source)).startsWith(realpathSync(resolve(root, runtimeSlotContract.candidate_root)) + sep)) {
    throw new Error('Non-candidate source or forbidden destination');
  }
  let ancestor = dirname(resolve(root, path));
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  if (!realpathSync(ancestor).startsWith(realpathSync(resolve(root, 'Game/Assets/Janseon/Art')) + sep)
    && realpathSync(ancestor) !== realpathSync(resolve(root, 'Game/Assets/Janseon/Art'))) throw new Error('Destination symlink escape');
}
const fixture = Object.values(sources).every(p => p.startsWith(runtimeSlotContract.candidate_root + 'TestPromotion-'));
const bomPath = request.bom_path ?? runtimeSlotContract.bom_path;
if (bomPath !== runtimeSlotContract.bom_path
  && !(fixture && canonical(bomPath) && bomPath.startsWith('.omo/evidence/gateway-slot-wiring/fixtures/'))) {
  throw new Error('Alternate BOM is test-only');
}
const bom = existsSync(resolve(root, bomPath))
  ? JSON.parse(readFileSync(resolve(root, bomPath), 'utf8')) : { schema_version: 1, assets: [] };
if (!Array.isArray(bom.assets) || bom.assets.some(a => a.runtime_slot === row.runtime_slot || a.asset_id === row.asset_id)) {
  throw new Error('Refusing existing slot replacement');
}
if (mode === 'prepare') {
  const evaluated = evaluatePromotedAsset(row, { repoRoot: root, runtimeFileSources: sources });
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated.errors));
  for (const path of paths) if (existsSync(resolve(root, path)) || existsSync(resolve(root, path + '.meta'))) throw new Error('Refusing destination overwrite');
  console.log(JSON.stringify({ slot: slot.slot, kind: slot.import, fixture,
    files: Object.entries(row.runtime_slot_files).map(([key, path]) => ({ key, path: path.slice(5), source: sources[path], sha256: row.runtime_files[path] })) }));
} else if (mode === 'commit') {
  if (slot.import === 'character') {
    row.generated_from = { kind: 'sprite-guid-retarget-v1', source_binding_hash: row.source_binding.sha256, candidate_files: sources };
    for (const [key, path] of Object.entries(row.runtime_slot_files)) {
      if (key.endsWith('/clip')) row.runtime_files[path] = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
    }
  }
  const evaluated = evaluatePromotedAsset(row, { repoRoot: root });
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated.errors));
  bom.assets.push(row);
  mkdirSync(dirname(resolve(root, bomPath)), { recursive: true });
  writeFileSync(resolve(root, bomPath), JSON.stringify(bom, null, 2) + '\n', { flag: existsSync(resolve(root, bomPath)) ? 'w' : 'wx' });
  console.log(JSON.stringify({ ok: true, fixture, bom_path: bomPath }));
} else throw new Error('Expected prepare or commit');
