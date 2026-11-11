// W5-28 — 110 부모 비교 디버그 (재실행 가능)
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
console.log('aux parent:', execFileSync('git', ['-C', REPO, 'log', '--oneline', '-3', 'origin/feat/w5-25-aux'], { encoding: 'utf8' }));
const a = execFileSync('git', ['-C', REPO, 'show', 'origin/feat/w5-25-aux:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 });
const b = execFileSync('git', ['-C', REPO, 'show', 'origin/feat/w5-25-aux~1:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 });
const c = execFileSync('git', ['-C', REPO, 'show', 'origin/feat/w2-applied:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 });
console.log('aux110 bytes:', a.length, '| aux~1 bytes:', b.length, '| w2applied bytes:', c.length);
console.log('aux~1 == w2applied?', b === c);
console.log('current == aux110?', execFileSync('git', ['-C', REPO, 'show', 'HEAD:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 }) === a);
