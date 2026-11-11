#!/usr/bin/env node
// W5-28 — SITE_BASE=/ 빌드·검사 러너 (MSYS 경로 변환 오염 방지: env를 argv 스폰으로 주입).
// 사용법: node scripts/pages/w5-28-run-build.mjs [--out <dir>] [--check-only]
// 빌드는 node site/build.mjs, 검사는 node site/check-site.mjs 를 같은 SITE_OUT로 실행한다.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', 'C:/Users/oliver/AppData/Local/Temp/w528-dist'));
const RECEIPT_DIR = path.resolve(opt('--receipts', 'C:/Users/oliver/AppData/Local/Temp/w5-28-scratch/build'));
fs.mkdirSync(RECEIPT_DIR, { recursive: true }); // OUT은 build.mjs가 지우고 다시 만들므로 영수증은 OUT 밖에 쓴다
const env = { ...process.env, SITE_BASE: '/', SITE_OUT: OUT, FORCE_COLOR: '0', NO_COLOR: '1' };
delete env.MSYS_ARG_CONV_EXCL;
const run = (cmd, cmdArgs) => {
  const r = spawnSync(process.execPath, [path.join(REPO, 'site', cmd), ...cmdArgs], { cwd: REPO, env, encoding: 'utf8', maxBuffer: 1 << 27 });
  const tag = cmd.replace('.mjs', '');
  fs.writeFileSync(path.join(RECEIPT_DIR, `${tag}.receipt.json`), JSON.stringify({ exit: r.status, at: new Date().toISOString() }, null, 1));
  process.stdout.write(`[${tag}] exit=${r.status}\n`);
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status;
};
let code = 0;
if (!args.includes('--check-only')) code = run('build.mjs', []);
if (code === 0) code = run('check-site.mjs', []);
process.exit(code);
