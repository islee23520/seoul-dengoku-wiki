import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (worktree, args) => execFileSync('git', ['-C', worktree, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

const main = () => {
  const [worktree, expectedCommit, nonce, xml, log, manual, routeXml, routeLog, output] = process.argv.slice(2);
  if (!output) throw new TypeError('usage: build-task02-execution-context.mjs <worktree> <commit> <nonce> <xml> <log> <manual> <route-xml> <route-log> <output>');
  const head = git(worktree, ['rev-parse', '--verify', 'HEAD^{commit}']);
  const tree = git(worktree, ['rev-parse', '--verify', 'HEAD^{tree}']);
  if (head !== expectedCommit) throw new TypeError('detached worktree HEAD differs from expected implementation commit');
  if (git(worktree, ['status', '--porcelain', '--untracked-files=no']) !== '') throw new TypeError('detached worktree tracked state is dirty');
  const context = {
    schema_version: 'task02-execution-context.v1',
    implementation_commit: expectedCommit,
    implementation_tree: tree,
    project_path: `${worktree}/GAME`,
    head_before: expectedCommit,
    tree_before: tree,
    tracked_status_before: '',
    head_after: head,
    tree_after: tree,
    tracked_status_after: '',
    unity_binary: '/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity',
    unity_version: '6000.7.0a5',
    run_nonce: nonce,
    place_identity_xml_sha256: sha256(xml),
    place_identity_log_sha256: sha256(log),
    manual_sha256: sha256(manual),
    route_xml_sha256: sha256(routeXml),
    route_log_sha256: sha256(routeLog),
  };
  writeFileSync(output, `${JSON.stringify(context, null, 2)}\n`);
};

main();
