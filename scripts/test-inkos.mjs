import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const cli = fileURLToPath(new URL('./inkos.mjs', import.meta.url))
const fork = join(root, 'vendor/seoul-dengoku-inkos')
const git = args => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_MASTER: '1' } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

test('installed fork matches the committed submodule pin and owner remote', () => {
  const pin = git(['ls-files', '--stage', '--', 'vendor/seoul-dengoku-inkos']).split(/\s+/)[1]
  assert.equal(git(['-C', fork, 'rev-parse', 'HEAD']), pin)
  assert.equal(git(['config', '-f', '.gitmodules', '--get', 'submodule.vendor/seoul-dengoku-inkos.url']), 'https://github.com/islee23520/seoul-dengoku-inkos')
  assert.equal(git(['config', '-f', '.gitmodules', '--get', 'submodule.vendor/seoul-dengoku-inkos.branch']), 'master')
})

test('fork CLI forwards arguments and initializes Korean projects in the caller directory', t => {
  const scratch = mkdtempSync(join(tmpdir(), 'wiki-inkos-'))
  t.after(() => rmSync(scratch, { recursive: true, force: true }))
  const run = args => {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: root, encoding: 'utf8', timeout: 30_000, env: { ...process.env, INIT_CWD: scratch },
    })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }
  assert.ok(run(['--help']).length > 0)
  const version = JSON.parse(readFileSync(join(fork, 'packages/cli/package.json'), 'utf8')).version
  assert.equal(run(['--version']).trim(), version)
  run(['init', '--lang', 'ko'])
  assert.equal(JSON.parse(readFileSync(join(scratch, 'inkos.json'), 'utf8')).language, 'ko')
})
