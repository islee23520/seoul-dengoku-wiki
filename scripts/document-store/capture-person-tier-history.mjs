import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';

// Offline capture of historical Git objects only, never current document data.
const [root, databasePath] = process.argv.slice(2);
if (!root || !databasePath) throw new Error('E_TIER_HISTORY_ARGUMENTS');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const baselineBytes = await readFile(resolve(root, '.omo/private/seoul-migration/baseline.json'));
if (sha(baselineBytes) !== '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223') throw new Error('E_TIER_HISTORY_BASELINE');
const baseline = JSON.parse(baselineBytes);
const revision = '6754735a88420f68830308658206c1e9b2d971a5';
if (baseline.immutable !== true || baseline.baseCommit !== revision) throw new Error('E_TIER_HISTORY_BASELINE');
const details = baseline.files.filter(row => /^public\/person-details\/person-\d+\.json$/u.test(row.path));
if (details.length !== 1022 || new Set(details.map(row => row.path)).size !== 1022) throw new Error('E_TIER_HISTORY_COVERAGE');
const paths = [...details.map(row => row.path), 'lore/characters/Cast-State-06.json',
  'lore/characters/Cast-State-16.json', 'lore/offices/Offices-and-Ranks.json'];
const store = openEvidenceStore(databasePath, { capability: INTERNAL_EVIDENCE_CAPABILITY, create: true, readOnly: false });
try {
  for (const path of paths) {
    const rows = baseline.files.filter(row => row.path === path);
    if (rows.length !== 1) throw new Error('E_TIER_HISTORY_IDENTITY');
    const { stdout } = await promisify(execFile)('git', ['-C', root, 'show', `${revision}:${path}`],
      { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_MASTER: '1' } });
    if (sha(stdout) !== rows[0].sha256) throw new Error(`E_TIER_HISTORY_HASH:${path}`);
    const identity = `git:${revision}:${path}`;
    store.importBatch([{ identity, logicalPath: path, revision, gitRevision: revision,
      kind: 'archive', bytes: stdout, sha256: rows[0].sha256, references: [] }]);
    if (!store.getEvidence(identity, rows[0].sha256).equals(stdout)) throw new Error('E_TIER_HISTORY_READBACK');
  }
  console.log(JSON.stringify({ historicalRecords: paths.length, baselinePeople: details.length,
    revision, completeAuthenticationClosure: false }));
} finally { store.close(); }
