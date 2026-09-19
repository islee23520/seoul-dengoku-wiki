import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = dirname(import.meta.filename);
const required = Object.freeze(['build-task31-evidence-manifest.mjs','commands.txt','generate-source-anchor-index.mjs','lineage.txt','quality-review.md','required-case-results.json','source-anchor-index.json','source-line-index.txt','test-quality-anchors.mjs','test-required-lineage-cases.mjs','test-task31-cleanup.mjs','test-task31-evidence-manifest.mjs','tree-equivalence.txt','verify-lineage.mjs','verify-quality-anchors.mjs','verify-required-lineage-cases.mjs','verify-task31-cleanup.mjs','verify-task31-evidence-manifest.mjs']);
const manifest = JSON.parse(readFileSync(join(root, 'task31-evidence-manifest.json'), 'utf8'));
const files = readdirSync(root).sort();
for (const file of files) { const entry = lstatSync(join(root, file)); if (!entry.isFile()) throw new Error(`unsupported entry ${file}`); }
const excluded = new Set(['cleanup.json', 'task31-evidence-manifest.json']);
const included = files.filter((file) => !excluded.has(file));
if (included.join('\n') !== required.slice().sort().join('\n')) throw new Error('manifest inventory mismatch');
const actual = included.map((path) => ({ path, sha256: createHash('sha256').update(readFileSync(join(root, path))).digest('hex') }));
if (JSON.stringify(actual) !== JSON.stringify(manifest.files)) throw new Error('manifest content mismatch');
const digest = createHash('sha256').update(JSON.stringify(actual)).digest('hex');
if (manifest.manifestSha256 !== digest) throw new Error('manifest digest mismatch');
console.log(`task31 manifest verified: ${actual.length} files`);
