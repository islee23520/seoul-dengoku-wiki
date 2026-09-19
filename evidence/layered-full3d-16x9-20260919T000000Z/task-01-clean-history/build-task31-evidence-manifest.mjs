import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = dirname(import.meta.filename);
const files = readdirSync(root).sort();
for (const file of files) { const entry = lstatSync(join(root, file)); if (!entry.isFile()) throw new Error(`unsupported entry ${file}`); }
const excluded = new Set(['cleanup.json', 'task31-evidence-manifest.json']);
const included = files.filter((file) => !excluded.has(file));
const entries = included.map((path) => ({ path, sha256: createHash('sha256').update(readFileSync(join(root, path))).digest('hex') }));
const manifestSha256 = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
writeFileSync(join(root, 'task31-evidence-manifest.json'), `${JSON.stringify({ version: 1, files: entries, manifestSha256 }, null, 2)}\n`);
