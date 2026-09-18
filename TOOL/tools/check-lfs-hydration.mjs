import { closeSync, fstatSync, lstatSync, openSync, readdirSync, readSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const report = { filesScanned: 0, pointers: [], errors: [] };
const pointer = /^version https:\/\/git-lfs\.github\.com\/spec\/v1\r?\n(?:ext-[0-9]+-[a-zA-Z0-9.-]+ [^\r\n]+\r?\n)*oid sha256:[0-9a-f]{64}\r?\nsize (?:0|[1-9][0-9]*)\r?\n$/;

function scan(path, requiredRoot = false) {
  const absolute = join(root, path);
  try {
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && (!stat.isFile() || requiredRoot))) {
      report.errors.push({ path, code: 'UNSUPPORTED_FILE_TYPE' });
      return;
    }
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute).sort()) scan(`${path}/${name}`);
      return;
    }
    const fd = openSync(absolute, 'r');
    try {
      // LFS pointers are smaller than 1024 bytes; do not load full binary assets.
      const buffer = Buffer.alloc(1024);
      const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
      if (fstatSync(fd).size < 1024 && pointer.test(buffer.toString('utf8', 0, bytesRead))) {
        report.pointers.push(path);
      }
      report.filesScanned += 1;
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    report.errors.push({ path, code: error.code, message: error.message });
  }
}

for (const path of ['GAME/Assets', 'GAME-REFERENCE/assets']) scan(path, true);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pointers.length || report.errors.length ? 1 : 0;
