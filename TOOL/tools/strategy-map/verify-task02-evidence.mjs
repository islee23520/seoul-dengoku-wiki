import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSourceFingerprint, requiredSourcePaths } from './build-task02-source-fingerprint.mjs';
import { requiredGreenCases } from './build-task02-green-receipt.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (message) => { throw new TypeError(message); };
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys, label) => {
  if (!isObject(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label} keys mismatch`);
};
const isHex = (value, length) => typeof value === 'string' && new RegExp(`^[0-9a-f]{${length}}$`).test(value);
const git = (repoRoot, args) => execFileSync('git', ['-C', repoRoot, ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

const manifestKeys = Object.freeze([
  'schema_version', 'implementation_commit', 'implementation_tree', 'files', 'manifest_sha256',
]);
const manualKeys = Object.freeze([
  'schema_version', 'behavior_contract_version', 'implementation_commit', 'source_manifest_sha256',
  'canonical_id', 'unknown_observed_level', 'observed_level', 'identity_equal', 'hash_equal',
  'different_platform_id', 'different_platform_unequal', 'conflict_error',
  'catalog_fingerprint_before', 'catalog_fingerprint_after', 'catalog_unchanged',
]);
const receiptKeys = Object.freeze([
  'schema_version', 'implementation_commit', 'xml_path', 'xml_sha256', 'total', 'passed',
  'failed', 'skipped', 'required_cases',
]);

const validateManifest = (manifest) => {
  exactKeys(manifest, manifestKeys, 'manifest');
  if (manifest.schema_version !== 'task02-source-fingerprint.v2') fail('manifest schema version mismatch');
  if (!isHex(manifest.implementation_commit, 40)) fail('manifest implementation commit invalid');
  if (!isHex(manifest.implementation_tree, 40)) fail('manifest implementation tree invalid');
  if (!isHex(manifest.manifest_sha256, 64)) fail('manifest sha256 invalid');
  if (!Array.isArray(manifest.files)) fail('manifest files must be an array');
  const paths = manifest.files.map((file, index) => {
    exactKeys(file, ['path', 'sha256'], `manifest file ${index}`);
    if (typeof file.path !== 'string' || !isHex(file.sha256, 64)) fail(`manifest file ${index} invalid`);
    return file.path;
  });
  if (new Set(paths).size !== paths.length) fail('manifest contains duplicate source paths');
  if (JSON.stringify(paths) !== JSON.stringify(requiredSourcePaths)) fail('manifest frozen source paths mismatch');
};

const validateManual = (manual) => {
  exactKeys(manual, manualKeys, 'manual');
  if (manual.schema_version !== 'task02-manual-place-id.v2') fail('manual schema version mismatch');
  if (manual.behavior_contract_version !== 'place-identity.v2') fail('manual behavior contract mismatch');
  if (!isHex(manual.implementation_commit, 40) || !isHex(manual.source_manifest_sha256, 64)) fail('manual commit binding invalid');
  if (typeof manual.canonical_id !== 'string' || typeof manual.different_platform_id !== 'string') fail('manual ids invalid');
  if (manual.unknown_observed_level !== null || manual.observed_level !== 3) fail('manual observed levels mismatch');
  for (const key of ['identity_equal', 'hash_equal', 'different_platform_unequal', 'catalog_unchanged']) {
    if (typeof manual[key] !== 'boolean') fail(`manual ${key} type invalid`);
  }
  if (manual.identity_equal !== true || manual.hash_equal !== true || manual.different_platform_unequal !== true) fail('manual identity observations mismatch');
  if (manual.conflict_error !== 'PlaceDefinitionConflictException') fail('manual conflict error mismatch');
  if (!isHex(manual.catalog_fingerprint_before, 64) || !isHex(manual.catalog_fingerprint_after, 64)) fail('manual catalog fingerprint invalid');
  if (!manual.catalog_unchanged || manual.catalog_fingerprint_before !== manual.catalog_fingerprint_after) fail('manual catalog mutation mismatch');
};

const validateGreenReceipt = (repoRoot, receipt) => {
  exactKeys(receipt, receiptKeys, 'green receipt');
  if (receipt.schema_version !== 'task02-green-receipt.v1') fail('green receipt schema mismatch');
  if (!isHex(receipt.implementation_commit, 40) || !isHex(receipt.xml_sha256, 64)) fail('green receipt binding invalid');
  if (typeof receipt.xml_path !== 'string') fail('green receipt xml path invalid');
  for (const key of ['total', 'passed', 'failed', 'skipped']) if (!Number.isInteger(receipt[key])) fail(`green receipt ${key} invalid`);
  if (receipt.total < 10 || receipt.passed !== receipt.total || receipt.failed !== 0 || receipt.skipped !== 0) fail('green receipt result invalid');
  if (JSON.stringify(receipt.required_cases) !== JSON.stringify(requiredGreenCases)) fail('green receipt cases mismatch');
  const xml = readFileSync(resolve(repoRoot, receipt.xml_path));
  if (sha256(xml) !== receipt.xml_sha256) fail('green XML hash mismatch');
  const text = xml.toString('utf8');
  for (const testCase of requiredGreenCases) if (!text.includes(`name="${testCase}"`)) fail(`green XML missing case ${testCase}`);
};

export const verifyTask02Evidence = (repoRoot, manifestPath, manualPath, greenReceiptPath) => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const manualBytes = readFileSync(manualPath);
  const manual = JSON.parse(manualBytes.toString('utf8'));
  const greenReceipt = JSON.parse(readFileSync(greenReceiptPath, 'utf8'));
  validateManifest(manifest);
  validateManual(manual);
  validateGreenReceipt(repoRoot, greenReceipt);
  const expected = buildSourceFingerprint(repoRoot, manifest.implementation_commit);
  if (JSON.stringify(manifest) !== JSON.stringify(expected)) fail('manifest does not match implementation commit tree');
  const currentHead = git(repoRoot, ['rev-parse', '--verify', 'HEAD^{commit}']);
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', manifest.implementation_commit, currentHead]);
  } catch {
    fail('implementation commit is not an ancestor of current HEAD');
  }
  if (manual.implementation_commit !== manifest.implementation_commit
      || greenReceipt.implementation_commit !== manifest.implementation_commit) fail('evidence implementation commit mismatch');
  if (manual.source_manifest_sha256 !== manifest.manifest_sha256) fail('manual source manifest mismatch');
  return Object.freeze({
    schema_version: 'task02-evidence-verification.v2',
    implementation_commit: manifest.implementation_commit,
    implementation_tree: manifest.implementation_tree,
    source_manifest_sha256: manifest.manifest_sha256,
    green_xml_sha256: greenReceipt.xml_sha256,
    manual_sha256: sha256(manualBytes),
    verified: true,
  });
};

const main = () => {
  const [repoRoot, manifestPath, manualPath, greenReceiptPath] = process.argv.slice(2);
  if (!repoRoot || !manifestPath || !manualPath || !greenReceiptPath) {
    throw new TypeError('usage: verify-task02-evidence.mjs <repo-root> <manifest> <manual> <green-receipt>');
  }
  process.stdout.write(`${JSON.stringify(verifyTask02Evidence(repoRoot, manifestPath, manualPath, greenReceiptPath), null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
