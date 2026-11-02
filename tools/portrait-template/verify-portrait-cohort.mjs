export * from '../portrait/2d/verify-portrait-cohort.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../portrait/2d/verify-portrait-cohort.mjs', import.meta.url)), ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
  child.on('error', error => { console.error(error.message); process.exitCode = 2; });
  child.on('close', code => { process.exitCode = code ?? 2; });
}
