import { execFileSync } from 'node:child_process';
import { lstatSync, realpathSync } from 'node:fs';

export const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

export const registeredWorktree = (repoRoot, requestedPath) => {
  const records = git(repoRoot, ['worktree', 'list', '--porcelain']).split('\n\n').map((block) => Object.fromEntries(block.split('\n').filter(Boolean).map((line) => {
    const separator = line.indexOf(' ');
    return separator < 0 ? [line, true] : [line.slice(0, separator), line.slice(separator + 1)];
  })));
  const canonical = realpathSync(requestedPath);
  const entry = records.find((record) => record.worktree && realpathSync(record.worktree) === canonical);
  if (!entry || entry.worktree !== requestedPath || entry.bare || entry.branch) throw new TypeError('exact detached worktree registration not found');
  return { registered_path: entry.worktree, registered_head: entry.HEAD, registered_detached: entry.detached === true };
};

export const observeRun = (repoRoot, request, requestCommit) => {
  const worktree = request.detached_worktree_path;
  const project = request.project_path;
  if (!lstatSync(worktree).isDirectory() || !lstatSync(project).isDirectory()) throw new TypeError('requested worktree or project path missing');
  const registration = registeredWorktree(repoRoot, worktree);
  return {
    observation_id: `${process.pid}-${Date.now()}`,
    observed_at_utc: new Date().toISOString(),
    observer_pid: process.pid,
    request_commit: requestCommit,
    head: git(worktree, ['rev-parse', '--verify', 'HEAD^{commit}']),
    tree: git(worktree, ['rev-parse', '--verify', 'HEAD^{tree}']),
    tracked_status: git(worktree, ['status', '--porcelain', '--untracked-files=no']),
    worktree_path: worktree,
    worktree_realpath: realpathSync(worktree),
    project_path: project,
    project_realpath: realpathSync(project),
    ...registration,
  };
};
