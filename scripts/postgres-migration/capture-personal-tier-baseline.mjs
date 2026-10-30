#!/usr/bin/env node
// Explicit archival capture only; it does not grant publication or canon approval.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import pg from 'pg';
import {
  PERSONAL_TIER_BASELINE_REVISION as revision, PERSONAL_TIER_BASELINE_MANIFEST_PATH as manifestPath,
  PERSONAL_TIER_BASELINE_MANIFEST_SHA256 as manifestSeal, personalTierBaselineIdentity as identity
} from '../personal-tier-provenance.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw new Error(code); };
const args = process.argv.slice(2);
if (args.length !== 5 || args[0] !== '--source-root' || args[2] !== '--actor' || args[4] !== '--approve-baseline-capture'
  || !args[1] || !args[3]?.trim() || !process.env.WIKI_BASELINE_CAPTURE_PG) fail('E_BASELINE_CAPTURE_ARGUMENTS');
const root = resolve(args[1]);
const git = (...argv) => execFileSync('git', ['-C', root, ...argv], { maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
if (git('rev-parse', '--verify', `${revision}^{commit}`).toString().trim() !== revision) fail('E_BASELINE_REVISION');
const tree = git('ls-tree', '-r', '-z', revision, '--', 'public/person-details',
  'lore/characters/Cast-State-06.json', 'lore/characters/Cast-State-16.json', 'lore/offices/Offices-and-Ranks.json');
const captured = tree.toString('utf8').split('\0').filter(Boolean).map(line => {
  const [metadata, path] = line.split('\t');
  const [mode, type, gitBlob] = metadata.split(' ');
  if (mode !== '100644' || type !== 'blob' || !/^(?:public\/person-details\/person-\d+\.json|lore\/characters\/Cast-State-(?:06|16)\.json|lore\/offices\/Offices-and-Ranks\.json)$/.test(path)) fail('E_BASELINE_TREE');
  const bytes = git('cat-file', 'blob', gitBlob);
  const gitHash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (gitHash !== gitBlob) fail('E_BASELINE_BLOB');
  return { path, gitBlob, sha256: hash(bytes), byteLength: bytes.length, bytes };
});
const entries = captured.map(({ bytes, ...entry }) => entry);
const manifest = Buffer.from(JSON.stringify({ schema: 'personal-tier-baseline.v1', revision, entries }));
if (hash(manifest) !== manifestSeal) fail('E_BASELINE_MANIFEST_SEAL');
const all = [...captured, { path: manifestPath, gitBlob: null, sha256: manifestSeal, byteLength: manifest.length, bytes: manifest }];
const client = new pg.Client({ connectionString: process.env.WIKI_BASELINE_CAPTURE_PG });
try {
  await client.connect();
  await client.query('BEGIN');
  const policy = await client.query('SELECT singleton, privacy FROM wiki_private.ev_evidence_policy');
  if (policy.rows.length !== 1 || Number(policy.rows[0].singleton) !== 1 || policy.rows[0].privacy !== 'restricted-internal-only') fail('E_PRIVATE');
  for (const entry of all) {
    const id = identity(entry.path);
    const recordSha = hash(JSON.stringify([id, 'baseline', entry.path, revision, revision, entry.gitBlob, entry.sha256, entry.byteLength, []]));
    const existing = await client.query('SELECT identity, kind, logical_path, revision, git_revision, git_blob, raw_bytes, sha256, byte_length, record_sha256 FROM wiki_private.ev_evidence WHERE identity=$1', [id]);
    if (existing.rows.length) {
      const row = existing.rows[0];
      const refs = await client.query('SELECT 1 FROM wiki_private.ev_evidence_reference WHERE source_identity=$1', [id]);
      if (existing.rows.length !== 1 || refs.rows.length || row.kind !== 'baseline' || row.logical_path !== entry.path
        || row.revision !== revision || row.git_revision !== revision || row.git_blob !== entry.gitBlob
        || row.sha256 !== entry.sha256 || Number(row.byte_length) !== entry.byteLength || row.record_sha256 !== recordSha
        || !Buffer.from(row.raw_bytes).equals(entry.bytes)) fail('E_BASELINE_IDENTITY_CONFLICT');
    } else {
      await client.query(`INSERT INTO wiki_private.ev_evidence
        (identity,kind,logical_path,revision,git_revision,git_blob,raw_bytes,sha256,byte_length,record_sha256)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, 'baseline', entry.path, revision, revision, entry.gitBlob, entry.bytes, entry.sha256, entry.byteLength, recordSha]);
    }
  }
  await client.query('COMMIT');
  console.log(JSON.stringify({ result: 'baseline-captured', revision, manifestSha256: manifestSeal, entries: captured.length, actor: args[3] }));
} catch (error) {
  try { await client.query('ROLLBACK'); } catch { }
  throw error;
} finally { await client.end(); }
