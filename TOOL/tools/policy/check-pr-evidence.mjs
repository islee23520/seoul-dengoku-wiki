import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function validatePrEvidence({ prNumber, baseSha, headSha = 'HEAD', headRef = '', root = ROOT }) {
  if (!Number.isInteger(prNumber) || prNumber <= 0) throw new Error('prNumber must be a positive integer');
  const runGit = (args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const cleanupMatch = /^cleanup\/evidence-pr-(\d+)$/.exec(headRef);
  const evidencePrNumber = cleanupMatch ? Number(cleanupMatch[1]) : prNumber;
  const expectedRoot = `evidence/pr-${evidencePrNumber}/`;
  const changed = runGit(['diff', '--name-status', '--find-renames', `${baseSha}...${headSha}`, '--', 'evidence'])
    .split('\n')
    .filter(Boolean)
    .map(line => line.split('\t'));
  const touched = changed.flatMap(parts => parts.slice(1)).filter(path => path.startsWith('evidence/'));
  const artifactTouched = touched.filter(path => path !== 'evidence/README.md');
  const errors = [];
  for (const path of artifactTouched) {
    if (!path.startsWith(expectedRoot)) errors.push(`EVIDENCE_OUTSIDE_PR_ROOT:${path}`);
  }
  if (artifactTouched.length === 0) return { status: 'PASS', changed: touched, errors: [] };

  if (cleanupMatch) {
    for (const parts of changed) {
      const [status, ...paths] = parts;
      for (const path of paths.filter(value => value.startsWith('evidence/') && value !== 'evidence/README.md')) {
        if (status !== 'D') errors.push(`CLEANUP_MUST_ONLY_DELETE:${path}`);
      }
    }
    return { status: errors.length === 0 ? 'PASS' : 'FAIL', changed: touched, errors };
  }

  const manifestPath = `${expectedRoot}manifest.json`;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve(root, manifestPath), 'utf8'));
  } catch {
    errors.push(`MISSING_OR_INVALID_MANIFEST:${manifestPath}`);
    return { status: 'FAIL', changed: touched, errors };
  }
  if (manifest.schema_version !== 1) errors.push('INVALID_SCHEMA_VERSION');
  if (manifest.pr_number !== prNumber) errors.push('PR_NUMBER_MISMATCH');
  if (manifest.status !== 'review-only') errors.push('INVALID_EVIDENCE_STATUS');
  if (typeof manifest.evidence_for_sha !== 'string') {
    errors.push('MISSING_EVIDENCE_FOR_SHA');
  } else {
    try {
      execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', manifest.evidence_for_sha, headSha]);
    } catch {
      errors.push('EVIDENCE_SHA_NOT_IN_PR_HISTORY');
    }
  }
  if (!Array.isArray(manifest.files)) errors.push('INVALID_FILES_LIST');
  const entries = new Map((manifest.files ?? []).map(entry => [entry.path, entry.sha256]));
  const committedFiles = runGit(['ls-tree', '-r', '--name-only', headSha, '--', expectedRoot])
    .split('\n')
    .filter(path => path && path !== manifestPath);
  for (const path of committedFiles) {
    const local = relative(expectedRoot, path);
    if (entries.get(local) !== sha256(resolve(root, path))) errors.push(`HASH_MISSING_OR_MISMATCH:${local}`);
  }
  for (const path of entries.keys()) {
    if (!committedFiles.includes(`${expectedRoot}${path}`)) errors.push(`MANIFEST_FILE_MISSING:${path}`);
  }
  return { status: errors.length === 0 ? 'PASS' : 'FAIL', changed: touched, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prNumber = Number(process.env.PR_NUMBER);
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA || 'HEAD';
  const headRef = process.env.HEAD_REF || '';
  if (!baseSha) throw new Error('BASE_SHA is required');
  const result = validatePrEvidence({ prNumber, baseSha, headSha, headRef });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exitCode = 1;
}
