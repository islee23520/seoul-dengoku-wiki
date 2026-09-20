import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) process.exitCode = 2;
else {
  const rows = readFileSync(path, 'utf8').trimEnd().split('\n');
  const header = rows.shift()?.split('\t');
  const required = ['path:line', 'old meaning', 'new authority', 'action', 'status'];
  const errors = [];
  if (!required.every((value, index) => header?.[index] === value)) errors.push('invalid header');
  for (const [index, row] of rows.entries()) {
    const columns = row.split('\t');
    if (columns.length !== required.length || !columns[0].includes(':')) errors.push(`malformed row ${index + 2}`);
    if (columns[4] === 'active-conflict') errors.push(`active docs-only conflict ${columns[0]}`);
    if (columns[4] !== 'active-target-replaced' && columns[4] !== 'historical-nonnormative' && columns[4] !== 'unchanged-justified') errors.push(`invalid status ${columns[0]}`);
    if (columns[4] === 'active-target-replaced' && !/풀 3D|다층|uGUI 16:9|FixedUpdate|fixedDeltaTime|구현 권위|활성 목표|후속 구현/.test(columns[2])) errors.push(`missing active authority ${columns[0]}`);
  }
  console.log(JSON.stringify({ rows: rows.length, errors }, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}
