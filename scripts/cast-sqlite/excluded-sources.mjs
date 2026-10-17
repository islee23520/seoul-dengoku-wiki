import { readFile } from 'node:fs/promises';

// These editorial sources are provenance inputs, never source_file/source_record inputs.
// The nine current-engine profile batches have a separate hash-only projection manifest.
const SOUL_BATCH_PATHS = Object.freeze([
  'special', 'state-01-02', 'state-03-04', 'state-05-06', 'state-07-08',
  'state-09-10', 'state-11-12', 'state-13-14', 'state-15-16',
].map((name) => `lore/editorial/soul-batches/${name}.json`));

export const EXCLUDED_SOURCE_MANIFEST = Object.freeze([
  ['lore/editorial/Character-System-Contract.json', 'private-character-system-contract'],
  ['lore/editorial/Opening-Profile-Sample.json', 'private-editorial-sample'],
  ['lore/editorial/Seoul-Narrative-Review.json', 'private-editorial-scope-review'],
  ['lore/editorial/Seoul-Relocation-Ledger.json', 'private-editorial-owner-approval-pending'],
  ['lore/editorial/Seoul-Scope-Contract.json', 'private-editorial-scope-review'],
  ['lore/editorial/Soul-Assignments.json', 'private-soul-historical-motif'],
  ['lore/editorial/Soul-Candidates.json', 'private-soul-historical-motif'],
  ['lore/editorial/Soul-Duplicate-Review.json', 'private-soul-historical-motif'],
  ...SOUL_BATCH_PATHS.map((path) => [path, 'private-soul-historical-motif']),
].map(([logical_path, exclusion_reason]) => Object.freeze({ logical_path, exclusion_reason })));

export const EXCLUDED_SOURCE_PATHS = Object.freeze(EXCLUDED_SOURCE_MANIFEST.map((entry) => entry.logical_path));
export const EXCLUDED_SOURCE_TABLE_COLUMNS = Object.freeze({
  excluded_source: Object.freeze(['logical_path', 'sha256', 'byte_length', 'exclusion_reason']),
});

const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };

export async function loadExcludedSourceFiles({ sourceRoot, resolveTrustedSourcePath, sha256 }) {
  if (typeof resolveTrustedSourcePath !== 'function' || typeof sha256 !== 'function') {
    fail('E_EXCLUDED_LOADER', 'trusted resolver and hash function are required');
  }
  return Object.freeze(await Promise.all(EXCLUDED_SOURCE_MANIFEST.map(async (entry) => {
    const path = await resolveTrustedSourcePath(sourceRoot, entry.logical_path);
    const bytes = await readFile(path);
    return Object.freeze({ ...entry, sha256: sha256(bytes), byte_length: bytes.length });
  })));
}

export function mapExcludedSourceDomains({ bundle }) {
  const files = bundle?.excludedFiles;
  if (!Array.isArray(files) || files.length !== EXCLUDED_SOURCE_MANIFEST.length) {
    fail('E_EXCLUDED_MANIFEST', 'excluded source set is incomplete');
  }
  const rows = files.map((file, index) => {
    const expected = EXCLUDED_SOURCE_MANIFEST[index];
    if (file === null || typeof file !== 'object' || Array.isArray(file)
      || Object.keys(file).length !== 4
      || file.logical_path !== expected.logical_path || file.exclusion_reason !== expected.exclusion_reason
      || typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(file.sha256)
      || !Number.isSafeInteger(file.byte_length) || file.byte_length < 0) {
      fail('E_EXCLUDED_MANIFEST', expected.logical_path);
    }
    return Object.freeze({ logical_path: file.logical_path, sha256: file.sha256,
      byte_length: file.byte_length, exclusion_reason: file.exclusion_reason });
  });
  return Object.freeze({ excluded_source: Object.freeze(rows) });
}
