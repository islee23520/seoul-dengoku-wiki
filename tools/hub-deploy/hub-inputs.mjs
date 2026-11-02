import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const git = (cwd, args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`FEEDBACK_GIT_FAILED:${args.join(' ')}`)
  return result.stdout.trim()
}

export function hubSourceSha(root, env) {
  const sourceSha = git(root, ['rev-parse', 'HEAD'])
  if (!/^[a-f0-9]{40}$/.test(sourceSha) || (env.CI_SOURCE_SHA !== undefined && env.CI_SOURCE_SHA !== sourceSha)) throw new Error('HUB_SOURCE_SHA_MISMATCH')
  return sourceSha
}

export function hubInputs(root, env) {
  const mode = env.PRIVATE_FEEDBACK_ENABLED ?? '0'
  if (!['0', '1'].includes(mode)) throw new Error('PRIVATE_FEEDBACK_ENABLED must be 0 or 1')
  const source = env.FEEDBACK_WIKI_SOURCE, commit = env.FEEDBACK_WIKI_COMMIT
  if (mode === '0') {
    if (source || commit) throw new Error('FEEDBACK_WIKI_SOURCE_REQUIRES_PRIVATE_MODE')
    return { mode }
  }
  if (!source || !/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('FEEDBACK_WIKI_SOURCE_AND_COMMIT_REQUIRED')
  const path = resolve(source)
  if (path === resolve(join(root, 'WIKI'))) throw new Error('FEEDBACK_PRODUCER_MUST_BE_SEPARATE')
  if (git(path, ['rev-parse', 'HEAD']) !== commit || git(path, ['status', '--porcelain'])) throw new Error('FEEDBACK_WIKI_SOURCE_NOT_CLEAN_PINNED')
  git(path, ['cat-file', '-e', `${commit}:scripts/feedback-source-catalog.mjs`])
  return { mode, source: path, parentCommit: git(root, ['rev-parse', 'HEAD']), gitlink: git(root, ['rev-parse', 'HEAD:WIKI']), wikiCommit: commit }
}
