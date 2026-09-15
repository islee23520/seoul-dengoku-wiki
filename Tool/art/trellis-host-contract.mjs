import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TRELLIS_MODEL, TRELLIS_REVISION } from './catalog.mjs';

export const TRELLIS_COMMIT = TRELLIS_REVISION;
export { TRELLIS_MODEL };

export const OFFICIAL_TRELLIS_HOST_CONTRACT = Object.freeze({
  repo: 'https://github.com/microsoft/TRELLIS',
  commit: TRELLIS_COMMIT,
  model: TRELLIS_MODEL,
  license: 'MIT',
  execution: 'direct_python',
  tool: 'trellis',
  provider: 'microsoft',
  python_min: '3.8',
  python_preferred: '3.10',
  host_root: 'E:\\git\\janseon-asset-pipeline',
  min_vram_mib: 16000,
  cpu_fallback: false,
  community_backends: Object.freeze(['trellis2', 'trellis.2', 'comfyui', 'comfyui_trellis']),
  unapproved_providers: Object.freeze(['azure', 'tripo3d', 'tripo']),
});

const REQUIRED_FIELDS = [
  'repo',
  'commit',
  'model',
  'license',
  'execution',
  'tool',
  'provider',
];

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateTrellisHostContract(observed = {}) {
  const codes = [];
  const missing = REQUIRED_FIELDS.filter((field) => observed[field] == null || observed[field] === '');
  if (missing.length > 0) codes.push('missing_required_field');

  if (observed.repo && observed.repo !== OFFICIAL_TRELLIS_HOST_CONTRACT.repo) {
    codes.push('wrong_repo');
  }
  if (observed.commit && observed.commit !== TRELLIS_COMMIT) {
    codes.push('wrong_commit');
  }
  if (observed.model && observed.model !== TRELLIS_MODEL) {
    codes.push('wrong_model');
  }
  if (observed.license && observed.license !== OFFICIAL_TRELLIS_HOST_CONTRACT.license) {
    codes.push('wrong_license');
  }

  const execution = normalize(observed.execution);
  const tool = normalize(observed.tool);
  const provider = normalize(observed.provider);
  const device = normalize(observed.device);

  if (
    OFFICIAL_TRELLIS_HOST_CONTRACT.community_backends.includes(execution)
    || OFFICIAL_TRELLIS_HOST_CONTRACT.community_backends.includes(tool)
  ) {
    codes.push('community_backend_forbidden');
  }
  if (OFFICIAL_TRELLIS_HOST_CONTRACT.unapproved_providers.includes(provider)) {
    codes.push('unapproved_backend_forbidden');
  }
  if (execution === 'cpu' || device === 'cpu' || observed.cpu_fallback === true) {
    codes.push('cpu_fallback_forbidden');
  }
  if (execution && execution !== OFFICIAL_TRELLIS_HOST_CONTRACT.execution) {
    if (!codes.includes('community_backend_forbidden') && !codes.includes('cpu_fallback_forbidden')) {
      codes.push('wrong_execution');
    }
  }
  if (tool && tool !== OFFICIAL_TRELLIS_HOST_CONTRACT.tool) {
    if (!codes.includes('community_backend_forbidden')) codes.push('wrong_tool');
  }
  if (provider && provider !== OFFICIAL_TRELLIS_HOST_CONTRACT.provider) {
    if (!codes.includes('unapproved_backend_forbidden')) codes.push('wrong_provider');
  }

  const vram = Number(observed.vram_mib);
  if (Number.isFinite(vram) && vram < OFFICIAL_TRELLIS_HOST_CONTRACT.min_vram_mib) {
    codes.push('vram_below_minimum');
  }

  const ok = codes.length === 0;
  return {
    ok,
    codes,
    refused_before_gpu: !ok,
    allow_inference: ok,
    expected: {
      repo: OFFICIAL_TRELLIS_HOST_CONTRACT.repo,
      commit: TRELLIS_COMMIT,
      model: TRELLIS_MODEL,
      license: OFFICIAL_TRELLIS_HOST_CONTRACT.license,
      execution: OFFICIAL_TRELLIS_HOST_CONTRACT.execution,
    },
  };
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
  if (command === 'pin') {
    process.stdout.write(`${JSON.stringify(OFFICIAL_TRELLIS_HOST_CONTRACT, null, 2)}\n`);
    return 0;
  }
  if (command === 'check') {
    if (!args.observed) {
      process.stderr.write('usage: node Tool/art/trellis-host-contract.mjs check --observed <file.json>\n');
      return 1;
    }
    const observed = JSON.parse(readFileSync(args.observed, 'utf8'));
    const result = validateTrellisHostContract(observed);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 2;
  }
  process.stderr.write('usage: node Tool/art/trellis-host-contract.mjs pin|check --observed <file.json>\n');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
