import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * ComfyUI texture path is intake-only under Phase 0.
 * Starts from human/external precomputed files; verifies hashes/workflow/provenance/rights.
 * Never spawns or invokes ComfyUI generation.
 */
export const INTAKE_ONLY = true;
export const ALLOW_INVOCATION = false;

export const REQUIRED_INTAKE_FIELDS = Object.freeze([
  'workflow_hash',
  'input_hashes',
  'raw_hash',
  'output_hash',
  'source_provenance',
  'rights_status',
  'status',
]);

const SHA256_RE = /^[a-f0-9]{64}$/i;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSha256(value) {
  return typeof value === 'string' && SHA256_RE.test(value);
}

/**
 * Validate a ComfyUI texture intake receipt/manifest fragment.
 * Missing each required field fails. Rights must be allowed; status must be promoted
 * for promotion/runtime wiring. No generation invocation fields are accepted as live paths.
 */
export function validateComfyuiTextureIntake(receipt = {}) {
  const codes = [];
  if (!isRecord(receipt)) {
    return { ok: false, codes: ['malformed_json'], intake_only: true, allow_invocation: false };
  }

  for (const field of REQUIRED_INTAKE_FIELDS) {
    if (!Object.hasOwn(receipt, field) || receipt[field] == null || receipt[field] === '') {
      codes.push(`missing_${field}`);
      codes.push('missing_field');
    }
  }

  if (Object.hasOwn(receipt, 'workflow_hash') && receipt.workflow_hash != null && !isSha256(receipt.workflow_hash)) {
    codes.push('invalid_workflow_hash');
  }
  if (Object.hasOwn(receipt, 'raw_hash') && receipt.raw_hash != null && !isSha256(receipt.raw_hash)) {
    codes.push('invalid_raw_hash');
  }
  if (Object.hasOwn(receipt, 'output_hash') && receipt.output_hash != null && !isSha256(receipt.output_hash)) {
    codes.push('invalid_output_hash');
  }
  if (Object.hasOwn(receipt, 'input_hashes')) {
    if (!Array.isArray(receipt.input_hashes) || receipt.input_hashes.length === 0) {
      codes.push('missing_input_hashes');
      codes.push('missing_field');
    } else if (!receipt.input_hashes.every(isSha256)) {
      codes.push('invalid_input_hashes');
    }
  }

  if (Object.hasOwn(receipt, 'rights_status') && receipt.rights_status !== 'allowed') {
    codes.push('rights_not_allowed');
  }
  if (Object.hasOwn(receipt, 'status') && receipt.status !== 'promoted') {
    codes.push('status_not_promoted');
  }

  // Reject any attempt to mark this receipt as a live generation invocation.
  if (receipt.invoke === true || receipt.generate === true || receipt.spawn === true) {
    codes.push('comfyui_invocation_forbidden');
  }
  if (receipt.execution && /generat|invoke|spawn/i.test(String(receipt.execution))) {
    codes.push('comfyui_invocation_forbidden');
  }

  const unique = [...new Set(codes)];
  return {
    ok: unique.length === 0,
    codes: unique,
    intake_only: true,
    allow_invocation: false,
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
  if (command === 'check') {
    if (!args.receipt) {
      process.stderr.write('usage: node tools/art/comfyui-texture-intake-contract.mjs check --receipt <file.json>\n');
      return 1;
    }
    const receipt = JSON.parse(readFileSync(args.receipt, 'utf8'));
    const result = validateComfyuiTextureIntake(receipt);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 2;
  }
  process.stderr.write('usage: node tools/art/comfyui-texture-intake-contract.mjs check --receipt <file.json>\n');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
