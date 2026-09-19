import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = dirname(import.meta.filename);
const files = readdirSync(root).filter((file) => statSync(join(root, file)).isFile() && file !== 'cleanup.json' && !file.startsWith('task31-evidence-manifest'));
const entries = files.sort().map((path) => ({ path, sha256: createHash('sha256').update(readFileSync(join(root, path))).digest('hex') }));
const manifestSha256 = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
writeFileSync(join(root, 'task31-evidence-manifest.json'), `${JSON.stringify({ version: 1, files: entries, manifestSha256 }, null, 2)}\n`);
