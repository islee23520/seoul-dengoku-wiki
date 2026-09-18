import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, readdir, readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

import { classifyPath, mediaType } from './classifier.mjs';
import { parseReceipt } from './receipts.mjs';

const posix = value => value.split('\\').join('/');
const SHA256 = /^[0-9a-f]{64}$/i;
const DECISIONS = new Set(['PASS', 'REJECTED', 'PENDING', 'SUPERSEDED', 'UNREVIEWED']);
const PNG_PROPERTY_KEYS = ['image.width', 'image.height', 'image.bit_depth', 'image.color_type'];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function readHeader(path) {
  const file = await open(path, 'r');
  try {
    const bytes = Buffer.alloc(26);
    const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
    return bytes.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

function pngProperties(bytes) {
  if (bytes.length < 26 || bytes.subarray(1, 4).toString() !== 'PNG') return [];
  return [
    ['image.width', bytes.readUInt32BE(16)],
    ['image.height', bytes.readUInt32BE(20)],
    ['image.bit_depth', bytes[24]],
    ['image.color_type', bytes[25]],
  ];
}

function repositoryPath(repo, value, field) {
  if (typeof value !== 'string' || !value || isAbsolute(value)) throw new Error(`${field} must be a repository-relative path`);
  const absolute = resolve(repo, value);
  const rel = posix(relative(repo, absolute));
  if (rel === '..' || rel.startsWith('../')) throw new Error(`${field} must be a repository-relative path`);
  return rel;
}

function validateCuratedClaim(claim, assetsByPath, repo, db) {
  const targetPath = repositoryPath(repo, claim.path, 'decision target');
  const receiptPath = repositoryPath(repo, claim.receipt, 'decision receipt');
  if (!SHA256.test(claim.sha256 ?? '')) throw new Error(`decision target SHA invalid: ${targetPath}`);
  if (!DECISIONS.has(claim.decision)) throw new Error(`decision status invalid: ${claim.decision}`);
  if (typeof claim.authority !== 'string' || !claim.authority) throw new Error(`decision authority missing: ${targetPath}`);
  const target = assetsByPath.get(targetPath);
  if (!target) throw new Error(`decision target missing from evidence: ${targetPath}`);
  if (target.digest !== claim.sha256.toLowerCase()) throw new Error(`decision target SHA mismatch: ${targetPath}`);
  const receipt = assetsByPath.get(receiptPath);
  const receiptExtension = extname(receiptPath).toLowerCase();
  if (!receipt || !['.json', '.md', '.txt'].includes(receiptExtension)) throw new Error(`decision receipt missing from evidence: ${receiptPath}`);
  if (claim.receipt_sha256 !== undefined) {
    if (!SHA256.test(claim.receipt_sha256)) throw new Error(`decision receipt SHA invalid: ${receiptPath}`);
    if (receipt.digest !== claim.receipt_sha256.toLowerCase()) throw new Error(`decision receipt SHA mismatch: ${receiptPath}`);
  }
  const priorUnpinnedBinding = claim.receipt_sha256 === undefined && db.prepare(`SELECT 1 FROM evaluation_observations
    WHERE target_path = ? AND receipt_path = ? AND source_kind = 'curated' LIMIT 1`).get(targetPath, receiptPath);
  return { targetPath, receiptPath, target, receipt, record: !priorUnpinnedBinding };
}

export async function scanEvidence({ db, repoRoot, evidenceRoot, additionalRoots = [], decisionsPath = resolve(repoRoot, 'Design/potrait-generator/config/asset-decisions.json') }) {
  const repo = resolve(repoRoot);
  const canonicalRepo = await realpath(repo);
  const roots = [resolve(evidenceRoot)];
  for (const root of additionalRoots) {
    const absoluteRoot = resolve(repo, root);
    const canonicalRoot = await realpath(absoluteRoot);
    const rel = posix(relative(canonicalRepo, canonicalRoot));
    if (!rel || rel === '..' || rel.startsWith('../')) throw new Error(`additional scan root must be inside the repository: ${root}`);
    roots.push(absoluteRoot);
  }
  const filesByPath = new Map();
  for (const root of roots) {
    for (const absolutePath of await walk(root)) {
      const path = posix(relative(repo, absolutePath));
      if (!filesByPath.has(path)) filesByPath.set(path, absolutePath);
    }
  }
  const files = [...filesByPath.values()];
  let cacheHits = 0;
  let metadataCacheHits = 0;
  let headersRead = 0;
  const paths = [];
  const receipts = [];
  const cacheGet = db.prepare('SELECT * FROM file_cache WHERE path = ?');
  for (const absolutePath of files) {
    const info = await stat(absolutePath);
    const path = posix(relative(repo, absolutePath));
    const mtimeMs = Math.trunc(info.mtimeMs);
    const cached = cacheGet.get(path);
    const cacheMatch = cached && cached.byte_size === info.size && cached.mtime_ms === mtimeMs;
    const classified = classifyPath(path);
    const digest = cacheMatch ? (cacheHits += 1, cached.sha256) : await sha256(absolutePath);
    const row = { absolutePath, path, digest, info, mtimeMs, ...classified };
    paths.push(row);
    if (classified.stage === 'receipt') receipts.push(row);
  }
  const assetsByPath = new Map(paths.map(row => [row.path, row]));

  let decisions = [];
  try {
    const document = JSON.parse(await readFile(decisionsPath, 'utf8'));
    if (!Array.isArray(document.decisions)) throw new Error('asset decisions must contain a decisions array');
    decisions = document.decisions.map(claim => ({ claim, binding: validateCuratedClaim(claim, assetsByPath, repo, db) }));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  db.exec('BEGIN IMMEDIATE; DELETE FROM asset_paths;');
  try {
    const content = db.prepare('INSERT OR IGNORE INTO content_objects(sha256, byte_size, extension, media_type) VALUES(?,?,?,?)');
    const asset = db.prepare(`INSERT INTO asset_paths(path,sha256,byte_size,mtime_ms,stage,asset_class,lifecycle,failure_related,sex,slot,logical_id)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
    const cache = db.prepare(`INSERT INTO file_cache(path,byte_size,mtime_ms,sha256,stage,asset_class,lifecycle,failure_related,sex,slot,logical_id)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET byte_size=excluded.byte_size,mtime_ms=excluded.mtime_ms,sha256=excluded.sha256,stage=excluded.stage,asset_class=excluded.asset_class,lifecycle=excluded.lifecycle,failure_related=excluded.failure_related,sex=excluded.sex,slot=excluded.slot,logical_id=excluded.logical_id`);
    const property = db.prepare('INSERT OR REPLACE INTO properties(sha256,key,value_json,source_path) VALUES(?,?,?,?)');
    const propertyCount = db.prepare(`SELECT COUNT(DISTINCT key) AS count FROM properties
      WHERE sha256 = ? AND source_path = ? AND key IN ('image.width','image.height','image.bit_depth','image.color_type')`);
    for (const row of paths) {
      const extension = extname(row.path).toLowerCase();
      content.run(row.digest, row.info.size, extension || '<none>', mediaType(extension));
      asset.run(row.path, row.digest, row.info.size, row.mtimeMs, row.stage, row.assetClass, row.lifecycle, row.failureRelated ? 1 : 0, row.sex, row.slot, row.logicalId);
      cache.run(row.path, row.info.size, row.mtimeMs, row.digest, row.stage, row.assetClass, row.lifecycle, row.failureRelated ? 1 : 0, row.sex, row.slot, row.logicalId);
      for (const [key, value] of [['path.stage', row.stage], ['path.lifecycle', row.lifecycle], ['path.asset_class', row.assetClass], ['path.sex', row.sex], ['path.slot', row.slot]]) {
        if (value !== null) property.run(row.digest, key, JSON.stringify(value), row.path);
      }
      if (extension === '.png') {
        if (propertyCount.get(row.digest, row.path).count === PNG_PROPERTY_KEYS.length) metadataCacheHits += 1;
        else {
          const bytes = await readHeader(row.absolutePath);
          headersRead += 1;
          for (const [key, value] of pngProperties(bytes)) property.run(row.digest, key, JSON.stringify(value), row.path);
        }
      }
    }
    const evaluation = db.prepare(`INSERT OR IGNORE INTO evaluation_observations(receipt_path,receipt_sha256,target_path,target_sha256,decision,authority,dimension,raw_status,summary,source_kind)
      VALUES(?,?,?,?,?,?,?,?,?,?)`);
    for (const receipt of receipts) {
      for (const claim of parseReceipt({ absolutePath: receipt.absolutePath, relativePath: receipt.path, receiptSha: receipt.digest })) {
        evaluation.run(claim.receiptPath, claim.receiptSha, claim.targetPath, claim.targetSha, claim.decision, claim.authority, claim.dimension, claim.rawStatus, claim.summary, claim.sourceKind);
      }
    }
    for (const { claim, binding } of decisions) {
      if (!binding.record) continue;
      evaluation.run(binding.receiptPath, binding.receipt.digest, binding.targetPath, binding.target.digest, claim.decision, claim.authority, claim.dimension ?? 'acceptance', claim.raw_status ?? claim.decision, claim.summary ?? claim.decision, 'curated');
      for (const [key, value] of Object.entries(claim.properties ?? {})) property.run(binding.target.digest, `curated.${key}`, JSON.stringify(value), binding.receiptPath);
    }
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
  return {
    filesScanned: paths.length,
    contentObjects: db.prepare('SELECT COUNT(*) AS count FROM content_objects').get().count,
    cacheHits,
    metadataCacheHits,
    headersRead,
    receipts: receipts.length,
  };
}
