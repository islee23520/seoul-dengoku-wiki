import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, access, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = '/Users/danny/Documents/Character-Assembly-POC/2026-09-19';
const required = [
  '2026-09-19 16.47.12.jpg', '2026-09-19 16.47.26.jpg',
  'muscular human figure 3d model (1).zip', 'muscular human figure 3d model.zip',
  'muscular human figure 3d model.glb', 'stylized doll head 3d model.glb',
  'stylized doll head 3d model.zip', 'bald head 3d model.zip', 'bald head 3d model.glb',
  'bjd-base-sheet_2026-09-19_16-47-12-face.png',
  'bjd-base-sheet_2026-09-19_16-47-26-face.png',
  'bjd-tapose-2part-sheet-female-body.png',
  'human figure 3d model.glb', 'human figure 3d model.zip',
  'muscular human figure 3d model (1).glb',
  'bjd-tapose-2part-sheet-female-face.png', 'bjd-tapose-2part-sheet-female.png',
  'bjd-tapose-2part-sheet-body.png', 'bjd-tapose-2part-sheet.png',
];
const related = [
  'human figure 3d model (1).glb', 'human figure 3d model (1).zip',
  'bjd-tapose-2part-sheet-body-dollbase.png',
  'bjd-tapose-2part-sheet-female-body-dollbase.png',
  'bjd-tapose-2part-sheet-face.png',
];
const digest = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const manifest = [];
const archives = [];
const baseline = [];
await mkdir(path.join(root, 'sources/originals'), { recursive: true });
for (const name of [...required, ...related]) {
  const source = path.join('/Users/danny/Downloads', name);
  const copy = path.join(root, 'sources/originals', name);
  let exists = true;
  try { await access(copy); } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; }
  baseline.push({ name, copiedBeforeRun: exists });
  const sha256 = await digest(source);
  if (!exists) await copyFile(source, copy);
  const copiedSha256 = await digest(copy);
  if (copiedSha256 !== sha256) throw new Error(`Source-copy hash mismatch: ${name}`);
  manifest.push({ name, source, copy, bytes: (await stat(copy)).size, sha256, required: required.includes(name) });
  if (name.endsWith('.zip')) {
    const members = execFileSync('/usr/bin/unzip', ['-Z1', copy], { encoding: 'utf8' }).trim().split('\n');
    const directory = path.join(root, 'sources/extracted', name.slice(0, -4));
    for (const member of members) {
      const output = path.resolve(directory, member);
      if (!output.startsWith(directory + path.sep)) throw new Error(`Unsafe archive member: ${member}`);
    }
    await mkdir(directory, { recursive: true });
    execFileSync('/usr/bin/unzip', ['-n', '-q', copy, '-d', directory]);
    const entries = [];
    for (const member of members.filter((entry) => !entry.endsWith('/'))) {
      const extracted = path.join(directory, member);
      entries.push({ member, extracted, bytes: (await stat(extracted)).size, sha256: await digest(extracted) });
    }
    archives.push({ name, directory, entries });
  }
}
await writeFile(path.join(root, 'reports/source-manifest.json'), JSON.stringify({ files: manifest, archives }, null, 2));
await writeFile(path.join(root, 'reports/source-verification.json'), JSON.stringify({
  baseline, requiredCount: required.length, copiedCount: manifest.length,
  verifiedCount: manifest.length, allHashesMatch: true, archives: archives.length,
  preservedOriginals: true,
}, null, 2));
console.log(JSON.stringify({ status: 'SOURCE_COPY_PASS', required: required.length, copied: manifest.length, archives: archives.length }));
