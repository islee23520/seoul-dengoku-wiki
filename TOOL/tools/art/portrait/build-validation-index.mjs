#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const OUTPUT = 'GAME-REFERENCE/potray-generator/assets/v2/validation-index.json';
const RECEIPTS = [
  '.omo/evidence/portrait-stage23/validation-graph-example/receipt.json',
  '.omo/evidence/portrait-stage23/attachment-rig-examples/receipt.json',
];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const posix = path => path.split(sep).join('/');

function inside(root, target) {
  const rel = relative(root, target);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

function bound(root, value) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.includes('\0')) throw new Error(`invalid path: ${value}`);
  const path = resolve(root, value);
  if (!inside(root, path)) throw new Error(`path escapes or is missing: ${value}`);
  let cursor = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part);
    if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) throw new Error(`path escapes or is missing: ${value}`);
  }
  if (!statSync(path).isFile() || !inside(realpathSync(root), realpathSync(path))) throw new Error(`path escapes or is missing: ${value}`);
  return path;
}

export function buildValidationIndex({ repoRoot = REPO, output = OUTPUT } = {}) {
  const repo = realpathSync(resolve(repoRoot));
  if (typeof output !== 'string' || !output || isAbsolute(output) || output.includes('\0')) throw new Error(`invalid output path: ${output}`);
  const outputPath = resolve(repo, output);
  if (!inside(repo, outputPath)) throw new Error(`output escapes repository: ${output}`);
  let cursor = repo;
  for (const part of relative(repo, dirname(outputPath)).split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error(`output parent symlink forbidden: ${output}`);
  }
  const webRoot = dirname(outputPath); const artifactRoot = join(webRoot, 'validation');
  rmSync(artifactRoot, { recursive: true, force: true }); mkdirSync(artifactRoot, { recursive: true });
  const receipts = RECEIPTS.map(path => {
    const receiptPath = bound(repo, path); const bytes = readFileSync(receiptPath); const receipt = JSON.parse(bytes);
    if (receipt.schema_version !== 1 || !['PASS', 'PENDING'].includes(receipt.status) || !Array.isArray(receipt.nodes)) throw new Error(`invalid validation receipt: ${path}`);
    const receiptDirectory = dirname(receiptPath); const artifacts = [];
    for (const node of receipt.nodes) for (const artifact of node.artifacts ?? []) {
      const source = bound(receiptDirectory, artifact.path); const artifactBytes = readFileSync(source); const digest = sha256(artifactBytes);
      if (digest !== artifact.sha256) throw new Error(`validation artifact drift: ${path}/${artifact.path}`);
      const destination = join(artifactRoot, `${digest}.png`); if (!existsSync(destination)) copyFileSync(source, destination);
      artifacts.push({ node_id: node.id, node_type: node.type, status: node.status, path: artifact.path, sha256: digest, web_path: `validation/${digest}.png`, value_type: artifact.value_type });
    }
    return {
      path, sha256: sha256(bytes), graph_sha256: receipt.graph_sha256, status: receipt.status,
      visual_approval: receipt.visual_approval, failed_node: receipt.failed_node ?? null, reason: receipt.reason ?? null,
      nodes: receipt.nodes.map(node => ({ id: node.id, type: node.type, status: node.status, metrics: node.metrics ?? {}, reason: node.reason ?? null })),
      artifacts,
    };
  });
  const index = { version: 1, built_by: 'TOOL/tools/art/portrait/build-validation-index.mjs', receipts };
  index.sha256 = sha256(Buffer.from(JSON.stringify(index)));
  mkdirSync(webRoot, { recursive: true }); writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(buildValidationIndex(), null, 2));
