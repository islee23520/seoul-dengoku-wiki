import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const [repoRoot, requestedPath, outputPath] = process.argv.slice(2);
const worktrees = execFileSync('git', ['-C', repoRoot, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' });
const processes = execFileSync('ps', ['aux'], { encoding: 'utf8' }).split('\n').filter((line) => line.includes('Unity.app/Contents/MacOS/Unity') && line.includes(`${requestedPath}/GAME`));
let openFiles = [];
if (existsSync(requestedPath)) {
  try { openFiles = execFileSync('lsof', ['+D', `${requestedPath}/GAME`], { encoding: 'utf8' }).split('\n').filter(Boolean); } catch { openFiles = []; }
}
writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'task02-cleanup.v2', detached_worktree_path: requestedPath,
  unity_processes_remaining: processes.length, open_file_lines_remaining: openFiles.length,
  path_exists_after_removal: existsSync(requestedPath), registration_exists_after_removal: worktrees.includes(`worktree ${requestedPath}\n`),
}, null, 2)}\n`);
