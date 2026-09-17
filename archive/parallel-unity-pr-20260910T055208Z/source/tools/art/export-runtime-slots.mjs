import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditRuntimeProvenance, runtimeSlotContract, defaultRepoRoot } from './runtime-asset-provenance.mjs';

const root = resolve(process.argv[2] || defaultRepoRoot);
const audit = auditRuntimeProvenance(root);
if (!audit.ok) throw new Error(JSON.stringify(audit.violations));
const bom = JSON.parse(readFileSync(resolve(root, runtimeSlotContract.bom_path), 'utf8'));
const entries = runtimeSlotContract.slots.map(slot => {
  const valid = audit.bomEvaluations.find(row => row.ok && row.runtime_slot === slot.slot);
  const row = valid && bom.assets.find(asset => asset.asset_id === valid.asset_id);
  return {
    slot: slot.slot, bound: Boolean(row), sourceBindingHash: row?.source_binding.sha256 ?? '',
    files: row ? Object.entries(row.runtime_slot_files).map(([key, path]) => ({ key, path: path.slice('Game/'.length) })) : [],
  };
});
console.log(JSON.stringify({ entries }));
