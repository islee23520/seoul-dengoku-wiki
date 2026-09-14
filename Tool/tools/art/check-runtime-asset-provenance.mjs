#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  auditRuntimeProvenance,
  defaultRepoRoot,
  formatAuditFailure,
} from './runtime-asset-provenance.mjs';

const repoRoot = resolve(process.env.JANSEON_REPO_ROOT || defaultRepoRoot);
const audit = auditRuntimeProvenance(repoRoot, {
  tripoUserDirectAuthorized: false,
  meshyOfficialContractVerified: false,
});

const summary = {
  ok: audit.ok,
  violation_count: audit.violations.length,
  blocked_slot_count: audit.blockedSlots.length,
  provider_lock: audit.providerLock,
  violations: audit.violations,
  blocked_slots: audit.blockedSlots,
  classification_count: audit.classifications.length,
  runtime_reference_count: audit.runtimeReferences.length,
  bom_invalid_for_runtime: audit.bomEvaluations.filter((b) => !b.ok).length,
  bom_valid_for_runtime: audit.bomEvaluations.filter((b) => b.ok).length,
  runtime_slot_evaluations: audit.bomEvaluations.filter((b) => b.runtime_slot),
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify({ ...summary, audit }, null, 2)}\n`);
}

const outIdx = process.argv.indexOf('--write-evidence');
if (outIdx >= 0) {
  const evidenceDir = process.argv[outIdx + 1]
    ? resolve(process.argv[outIdx + 1])
    : join(repoRoot, '.omo/evidence/unity-poc-core-loop/task-16-assets');
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, 'runtime-asset-reference-manifest.json'), `${JSON.stringify({
    generated_by: 'Tool/tools/art/check-runtime-asset-provenance.mjs',
    repo_root: repoRoot,
    ...summary,
    classifications: audit.classifications,
    runtime_references: audit.runtimeReferences,
    bom_evaluations: audit.bomEvaluations,
  }, null, 2)}\n`);
  writeFileSync(join(evidenceDir, 'gate-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
}

if (!audit.ok) {
  console.error(formatAuditFailure(audit));
  process.exitCode = 1;
} else {
  console.log(
    `runtime asset provenance gate passed (${audit.violations.length} violations, `
    + `${audit.runtimeReferences.length} runtime refs, ${audit.blockedSlots.length} blocked future slots, `
    + `${audit.bomEvaluations.filter((b) => !b.ok).length} BOM rows quarantined from runtime)`,
  );
}
