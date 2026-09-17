import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Phase 0 host contract for "OpenWeight MeshyGen Plus".
 * Ground truth: UNVERIFIED — no official GitHub/HF/docs/license/version/hash.
 * Never substitute commercial Meshy.ai. allow_inference stays false until a
 * future user-supplied exact official URL/model card/license is independently verified.
 */
export const MESHYGEN_PLUS_IDENTITY = Object.freeze({
  identity: 'OpenWeight MeshyGen Plus',
  research_result: 'UNVERIFIED',
  verified: false,
  allow_inference: false,
  official_url: null,
  model_id: null,
  license: null,
  version: null,
  content_hash: null,
  provider: null,
  notes: 'No official open-weight identity located. Commercial meshy.ai is not a substitute.',
});

/** Hostnames that must never be treated as the open-weight identity. */
export const UNOFFICIAL_MESHY_HOST_MARKERS = Object.freeze([
  'meshy.ai',
  'www.meshy.ai',
  'api.meshy.ai',
]);

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isUnofficialMeshyUrl(url) {
  const raw = normalize(url);
  if (!raw) return false;
  return UNOFFICIAL_MESHY_HOST_MARKERS.some((marker) =>
    raw.includes(marker) || raw.includes(`://${marker}`) || raw.startsWith(marker));
}

/**
 * Validate an observed MeshyGen Plus host/identity claim.
 * Default (no args) returns the locked UNVERIFIED fail-closed state.
 */
export function validateMeshygenPlusHostContract(observed = {}) {
  const codes = [];

  if (isUnofficialMeshyUrl(observed.official_url) || isUnofficialMeshyUrl(observed.url) || isUnofficialMeshyUrl(observed.repo)) {
    codes.push('unofficial_or_ambiguous_identity');
  }
  if (isUnofficialMeshyUrl(observed.model_id) || /meshy\.ai/i.test(String(observed.model_id ?? ''))) {
    codes.push('unofficial_or_ambiguous_identity');
  }

  const verified = observed.verified === true;
  const hasOfficialUrl = Boolean(observed.official_url && String(observed.official_url).trim());
  const hasModel = Boolean(observed.model_id && String(observed.model_id).trim());
  const hasLicense = Boolean(observed.license && String(observed.license).trim());
  const hasVersion = Boolean(observed.version && String(observed.version).trim());
  const hasHash = Boolean(observed.content_hash && String(observed.content_hash).trim());

  // Phase 0: identity remains UNVERIFIED. Even if a caller stamps verified=true,
  // missing independently verified official fields keep inference disabled.
  if (!verified || !hasOfficialUrl || !hasModel || !hasLicense || !hasVersion || !hasHash) {
    if (!codes.includes('unofficial_or_ambiguous_identity')) {
      codes.push('meshygen_unverified');
    }
  }

  // No path may enable inference under Phase 0 without an externally verified pin
  // that is not present in this worktree.
  const allowInference = false;
  const ok = false;

  return {
    ok,
    codes: codes.length > 0 ? [...new Set(codes)] : ['meshygen_unverified'],
    verified: false,
    allow_inference: allowInference,
    research_result: 'UNVERIFIED',
    refused_before_gpu: true,
    identity: MESHYGEN_PLUS_IDENTITY.identity,
    expected: { ...MESHYGEN_PLUS_IDENTITY },
  };
}

export function loadMeshygenPlusDefaultContract() {
  return { ...MESHYGEN_PLUS_IDENTITY };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);
  if (command === 'pin' || command === 'identity') {
    process.stdout.write(`${JSON.stringify(MESHYGEN_PLUS_IDENTITY, null, 2)}\n`);
    return 0;
  }
  if (command === 'check') {
    let observed = {};
    if (args.observed) {
      observed = JSON.parse(readFileSync(args.observed, 'utf8'));
    }
    const result = validateMeshygenPlusHostContract(observed);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 2;
  }
  process.stderr.write('usage: node tools/art/meshygen-plus-host-contract.mjs pin|identity|check [--observed <file.json>]\n');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
