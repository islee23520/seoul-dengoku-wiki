import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { readScopeContract } from '../cast-sqlite/scope-contract-store.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';

// Diagnostic inventory only: an unsupported source is not publication approval
// or permission to replace typed data with the archived original bytes.
// The source tree is read ONLY to supply independent diagnostic pins, never
// as a fallback document. Private handles are deliberately not supplied.
const sourceRoot = resolve(process.argv[3]);
const db = new DatabaseSync(process.argv[2], { readOnly: true });
try {
  const sources = readScopeContract(db).documents.filter(row => row.status !== 'preserved');
  const supported = [], unsupported = [], privateHandleRequired = [];
  for (const row of sources) {
    const logicalPath = row.sourcePath;
    try {
      const pin = createHash('sha256').update(readFileSync(resolve(sourceRoot, logicalPath))).digest('hex');
      readScopeCurrentSource({ db, logicalPath, expectedSha256: pin });
      supported.push(logicalPath);
    } catch (error) {
      const target = /^E_(?:SCOPE_PRIVATE_SOUL(?:_SOURCE)?_REQUIRED|MAPPING_PRIVATE_PROFILE_REQUIRED)$/u.test(error.message)
        ? privateHandleRequired : unsupported;
      target.push({ path: logicalPath, error: error.message });
    }
  }
  console.log(JSON.stringify({ supportedCount: supported.length, unsupportedCount: unsupported.length,
    privateHandleRequiredCount: privateHandleRequired.length, supported, unsupported, privateHandleRequired }, null, 2));
} finally {
  db.close();
}
