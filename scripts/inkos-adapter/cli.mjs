import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { exportPacket } from './export.mjs';
import { collectCandidate } from './collect.mjs';
import { prepareDraft } from './prepare.mjs';
import { canonicalJson, fail, parseSelection, sha256Bytes } from './contracts.mjs';
import { createImmutableFile, ensureHostDirectory, hostPath, readHostFile } from './io.mjs';

export const HELP = { commands: {
  export: '--db DB --selection SEL --trusted-root HOST --worker-out WORKER',
  collect: '--trusted-root HOST --packet-id PID --candidate RETURN --db DB --out CANDIDATE',
  'prepare-draft': '--trusted-root HOST --candidate-id CID --db DB --out PREVIEW',
  '--help': '',
}, boundary: 'candidate-only; read-only DB; no approval, apply, or publish' };

export function runCli(argv) {
  const [command, ...args] = argv;
  if (['apply', 'approve', 'publish'].includes(command)) fail('E_ADAPTER_COMMAND', 'command forbidden');
  if (!Object.hasOwn(HELP.commands, command)) fail('E_ADAPTER_ARGUMENTS', 'unknown subcommand');
  if (command === '--help') {
    if (args.length) fail('E_ADAPTER_ARGUMENTS', 'help accepts no arguments');
    return HELP;
  }
  const names = [...HELP.commands[command].matchAll(/--([a-z-]+)/gu)].map(match => match[1]);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || !names.includes(key) || Object.hasOwn(options, key)
      || !args[i + 1] || args[i + 1].startsWith('--')) fail('E_ADAPTER_ARGUMENTS', 'unknown, duplicate, or missing flag');
    options[key] = args[i + 1];
  }
  if (names.some(name => !Object.hasOwn(options, name))) fail('E_ADAPTER_ARGUMENTS', 'required flags missing');
  const trustedRoot = hostPath(options['trusted-root']);
  if (command === 'export') return exportPacket({ dbPath: options.db, selection: parseSelection(readHostFile(options.selection)), trustedRoot, workerOut: options['worker-out'] });
  if (command === 'prepare-draft') return prepareDraft({ trustedRoot, candidateId: options['candidate-id'], dbPath: options.db, out: options.out });
  const candidatePath = hostPath(options.candidate);
  const result = collectCandidate({ trustedRoot, packetId: options['packet-id'], candidatePath });
  const bytes = readHostFile(result.receiptPath);
  const index = { version: 1, candidateId: result.candidateId, packetId: options['packet-id'], candidatePath,
    receiptPath: result.receiptPath, receiptSha256: sha256Bytes(bytes) };
  ensureHostDirectory(join(trustedRoot, 'index'));
  const indexPath = join(trustedRoot, 'index', `${result.candidateId}.json`);
  const indexBytes = Buffer.from(canonicalJson(index));
  try { createImmutableFile(indexPath, indexBytes); }
  catch (error) {
    if (error.code !== 'E_ADAPTER_CONFLICT') throw error;
    if (!readHostFile(indexPath).equals(indexBytes)) fail('E_ADAPTER_CONFLICT', 'trusted index differs');
  }
  createImmutableFile(options.out, bytes);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = runCli(process.argv.slice(2));
    // prepare-draft writes this exact canonical envelope; keep its byte hash
    // in stdout only, outside the file being hashed and the reusable API.
    const output = process.argv[2] === 'prepare-draft'
      ? { ...result, previewFileSha256: sha256Bytes(Buffer.from(canonicalJson(result))) } : result;
    console.log(JSON.stringify(output));
  }
  catch (error) {
    console.error(JSON.stringify({ code: error.code?.startsWith('E_ADAPTER_') ? error.code : 'E_ADAPTER_IO', message: error.message }));
    process.exitCode = 1;
  }
}
