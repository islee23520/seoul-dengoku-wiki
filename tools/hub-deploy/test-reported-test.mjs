import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'

const runner = fileURLToPath(new URL('./run-reported-test.mjs', import.meta.url))
const shell = fileURLToPath(new URL('./build-hub-in-docker.sh', import.meta.url))

test('sensitive argv pairs and assignments execute unchanged but never enter reports or output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-argv-'))
  try {
    const reportPath = join(root, 'report.json')
    const childPath = join(root, 'child.mjs')
    const secrets = Array.from({ length: 6 }, (_, index) => `fixture-private-${index}`)
    const args = ['--token', secrets[0], '--password', secrets[1], '--api-key', secrets[2],
      `--token=${secrets[3]}`, `--password=${secrets[4]}`, `--api-key=${secrets[5]}`, '--label', 'public']
    await writeFile(childPath, `
      import assert from 'node:assert/strict'
      assert.deepEqual(process.argv.slice(2), JSON.parse(process.env.EXPECTED_ARGS))
      for (const value of process.argv.slice(2)) {
        process.stdout.write(value + '\\n')
        process.stderr.write(value + '\\n')
      }
      console.log('tests 1\\npass 0\\nfail 1\\nskipped 0\\ntodo 0\\ncancelled 0')
      process.exit(7)
    `)
    const env = { ...process.env, CI_TEST_REPORT: reportPath, CI_RUN_ID: 'argv-run',
      CI_SOURCE_SHA: 'a'.repeat(40), EXPECTED_ARGS: JSON.stringify(args) }
    const result = spawnSync(process.execPath, [runner, 'test', 'argv', process.execPath, childPath, ...args], { env, encoding: 'utf8', timeout: 30000 })
    assert.equal(result.status, 7, result.stderr)
    const text = await readFile(reportPath, 'utf8')
    const report = JSON.parse(text)
    assert.equal(report.steps[0].exitCode, 7)
    assert.equal(report.testStatus, 'FAIL')
    assert.deepEqual(report.steps[0].counts, { tests: 1, pass: 0, fail: 1, skipped: 0, todo: 0, cancelled: 0 })
    assert.deepEqual(report.steps[0].args.slice(-2), ['--label', 'public'])
    const log = await readFile(join(root, report.steps[0].logFile), 'utf8')
    for (const secret of secrets) {
      for (const recorded of [text, log, result.stdout, result.stderr]) assert.ok(!recorded.includes(secret))
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('two standalone runs share an output directory without replacing the first report', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-two-runs-'))
  try {
    const script = await readFile(shell, 'utf8')
    const declarations = script.match(/^export CI_(?:TEST_RUNNER|TEST_REPORT|RUN_ID|SOURCE_SHA)=.*$/gm).join('\n')
    const env = { ...process.env, OUTPUT_ROOT: root, WORK_ROOT: root, SOURCE_ROOT: root,
      CI_TEST_RUNNER: runner, CI_SOURCE_SHA: 'a'.repeat(40), NODE: process.execPath }
    delete env.CI_TEST_REPORT
    const command = `${declarations}\n"$NODE" "$CI_TEST_RUNNER" test "$CI_RUN_ID" "$NODE" -e 'console.log("tests 1\\npass 1\\nfail 0\\nskipped 0\\ntodo 0\\ncancelled 0")'`
    let firstBytes, firstLog
    for (const runId of ['first-run', 'second-run']) {
      const result = spawnSync('bash', ['-euc', command], { env: { ...env, CI_RUN_ID: runId }, encoding: 'utf8', timeout: 30000 })
      assert.equal(result.status, 0, result.stderr)
      const bytes = await readFile(join(root, `${runId}.report.json`), 'utf8')
      const report = JSON.parse(bytes)
      assert.equal(report.runId, runId)
      assert.equal(report.sourceSha, env.CI_SOURCE_SHA)
      assert.equal(report.testStatus, 'PASS')
      assert.equal(report.steps.length, 1)
      if (runId === 'first-run') {
        firstBytes = bytes
        firstLog = await readFile(join(root, report.steps[0].logFile), 'utf8')
      }
    }
    assert.equal(await readFile(join(root, 'first-run.report.json'), 'utf8'), firstBytes)
    const first = JSON.parse(firstBytes)
    assert.equal(await readFile(join(root, first.steps[0].logFile), 'utf8'), firstLog)
    assert.deepEqual((await readdir(root)).filter(name => name.endsWith('.report.json')).sort(), ['first-run.report.json', 'second-run.report.json'])
    const mismatch = spawnSync('bash', ['-euc', command], {
      env: { ...env, CI_RUN_ID: 'different-run', CI_TEST_REPORT: join(root, 'first-run.report.json') },
      encoding: 'utf8', timeout: 30000,
    })
    assert.notEqual(mismatch.status, 0)
    assert.match(mismatch.stderr, /Report source identity mismatch/)
    assert.equal(await readFile(join(root, 'first-run.report.json'), 'utf8'), firstBytes)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('all six adjacent counters survive and sensitive output is redacted without changing FAIL', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-adjacent-'))
  try {
    const reportPath = join(root, 'report.json')
    const env = { ...process.env, CI_TEST_REPORT: reportPath, CI_RUN_ID: 'fixture-run', CI_SOURCE_SHA: 'a'.repeat(40) }
    const expected = { tests: 13, pass: 7, fail: 2, skipped: 1, todo: 1, cancelled: 2 }
    const secret = 'fixture-private-value'
    for (const [index, [prefix, newline]] of [['', '\n'], ['# ', '\n'], ['ℹ ', '\r\n']].entries()) {
      const counters = Object.entries(expected).map(([key, value]) => `${prefix}${key} ${value}`).join(newline) + newline
      const program = `process.stdout.write(${JSON.stringify(counters + 'Authorization: Bearer ' + secret + newline)}); process.stderr.write(${JSON.stringify('token=' + secret + newline)}); process.exit(7)`
      const result = spawnSync(process.execPath, [runner, 'test', `adjacent-${index}`, process.execPath, '-e', program], { env, encoding: 'utf8' })
      assert.equal(result.status, 7, result.stderr)
      const reportText = await readFile(reportPath, 'utf8')
      const report = JSON.parse(reportText)
      const step = report.steps.at(-1)
      assert.deepEqual(step.counts, expected)
      assert.equal(step.exitCode, 7)
      assert.equal(step.status, 'FAIL')
      assert.equal(report.testStatus, 'FAIL')
      assert.equal(report.deploymentStatus, 'NOT_RUN')
      const log = await readFile(join(root, step.logFile), 'utf8')
      assert.ok(log.includes(counters))
      assert.match(log, /\[REDACTED sensitive log line\]/)
      for (const text of [log, reportText, result.stdout, result.stderr]) {
        assert.ok(!text.includes(secret))
      }
    }
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    assert.equal(report.steps.length, 3)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('failed tests retain exit7 and raw output and stop hub staging under set-e', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-test-'))
  try {
    const reportPath = join(root, 'report.json')
    const env = { ...process.env, CI_TEST_REPORT: reportPath, CI_RUN_ID: 'fixture-run', CI_SOURCE_SHA: 'a'.repeat(40), RUNNER: runner, NODE: process.execPath, ARTIFACT: join(root, 'artifact.txt') }
    const result = spawnSync('bash', ['-euc', '"$NODE" "$RUNNER" test failure "$NODE" -e "console.log(\'Tests  1 failed | 2 passed (3)\'); process.exit(7)"; printf artifact > "$ARTIFACT"; "$NODE" "$RUNNER" test next "$NODE" -e "console.log(\'next-suite\')"'], { env, encoding: 'utf8' })
    assert.equal(result.status, 7, result.stderr)
    await assert.rejects(readFile(env.ARTIFACT), { code: 'ENOENT' })
    const stageScript = join(root, 'stage.mjs')
    const stageModule = new URL('./hub-deploy.mjs', import.meta.url).href
    await writeFile(stageScript, `import { stageHub } from ${JSON.stringify(stageModule)}; await stageHub({ root: process.env.FIXTURE_ROOT, output: process.env.ARTIFACT, wikiDist: 'wiki', pages: [] })`)
    const stage = spawnSync('bash', ['-euc', '"$NODE" "$RUNNER" test gate "$NODE" -e "process.exit(7)"; "$NODE" "$STAGE_SCRIPT"'], {
      env: { ...env, CI_TEST_REPORT: join(root, 'stage-report.json'), FIXTURE_ROOT: root, STAGE_SCRIPT: stageScript }, encoding: 'utf8', timeout: 30000,
    })
    assert.equal(stage.status, 7, stage.stderr)
    assert.ok(!(await readdir(root)).includes('artifact.txt'), 'stageHub must not create its output directory after a failed gate')
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    assert.equal(report.testStatus, 'FAIL')
    assert.deepEqual(report.steps.map(step => step.exitCode), [7])
    assert.deepEqual(report.steps[0].counts, { pass: 2, fail: 1, tests: 3 })
    assert.match(await readFile(join(root, report.steps[0].logFile), 'utf8'), /1 failed \| 2 passed/)
    assert.equal(report.deploymentStatus, 'NOT_RUN')
    const build = spawnSync('bash', ['-euc', '"$NODE" -e "process.exit(9)"; printf changed > "$ARTIFACT"'], { env, encoding: 'utf8' })
    assert.equal(build.status, 9)
    await assert.rejects(readFile(env.ARTIFACT), { code: 'ENOENT' })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('reported test failures continue diagnostics but block final hub packaging', async () => {
  const script = await readFile(shell, 'utf8')
  const checks = script.split('\n').filter(line => /^node "\$CI_TEST_RUNNER" test /.test(line))
  assert.equal(checks.length, 27)
  assert.ok(checks.every(line => line.endsWith('|| CI_TEST_FAILURE=1')), 'every reported test must preserve failure and continue diagnostics')
  const stop = script.indexOf("if [[ \"${CI_TEST_FAILURE:-0}\" == 1 ]]")
  const packageSite = script.indexOf('node TOOL/tools/deploy/hub-deploy.mjs')
  const archive = script.indexOf('tar -C "$OUTPUT_ROOT/site"')
  assert.ok(stop >= 0 && stop < packageSite && packageSite < archive, 'failed post-build diagnostics must block site staging and packaging')
  assert.match(script, /HUB_DOCKER_BUILD_FAIL required tests failed/)
})

test('missing command is honestly reported but unavailable report storage is a real failure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-startup-'))
  try {
    const reportPath = join(root, 'report.json')
    const env = { ...process.env, CI_TEST_REPORT: reportPath, CI_RUN_ID: 'fixture-run', CI_SOURCE_SHA: 'a'.repeat(40) }
    const result = spawnSync(process.execPath, [runner, 'test', 'missing', join(root, 'does-not-exist')], { env, encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    assert.equal(report.testStatus, 'FAIL')
    assert.ok(report.steps[0].startupError)
    const blocked = join(root, 'not-a-directory')
    await writeFile(blocked, 'file')
    const failure = spawnSync(process.execPath, [runner, 'test', 'blocked', process.execPath, '-e', 'process.exit(0)'], { env: { ...env, CI_TEST_REPORT: join(blocked, 'report.json') }, encoding: 'utf8' })
    assert.notEqual(failure.status, 0)
    assert.match(failure.stderr, /TEST_REPORT_FAILED/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('signal termination is recorded and propagated as a failing wrapper exit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reported-signal-'))
  try {
    const reportPath = join(root, 'report.json')
    const env = { ...process.env, CI_TEST_REPORT: reportPath, CI_RUN_ID: 'signal-run', CI_SOURCE_SHA: 'a'.repeat(40) }
    const result = spawnSync(process.execPath, [runner, 'test', 'signal', process.execPath, '-e', 'process.kill(process.pid, "SIGTERM")'], { env, encoding: 'utf8', timeout: 30000 })
    assert.notEqual(result.status, 0)
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    assert.equal(report.testStatus, 'FAIL')
    assert.equal(report.steps[0].status, 'FAIL')
    assert.equal(report.steps[0].exitCode, null)
    assert.equal(report.steps[0].signal, 'SIGTERM')
    assert.equal(report.steps[0].startupError, null)
    assert.match(result.stdout, /status=FAIL exit=null/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('all21 hub checks use persistent reporting while compilation and packaging remain direct', async () => {
  const script = await readFile(shell, 'utf8')
  const names = [...script.matchAll(/^node "\$CI_TEST_RUNNER" test (hub-check-\d+) /gm)].map(match => match[1])
  assert.deepEqual(names, Array.from({ length: 21 }, (_, index) => `hub-check-${index + 1}`))
  assert.match(script, /^npm --prefix WIKI run build$/m)
  assert.match(script, /^node TOOL\/tools\/deploy\/hub-deploy\.mjs /m)
  assert.doesNotMatch(script, /patina-human-gate|patina-human-receipt/)
  assert.match(script, /CI_TEST_RUNNER:-\$WORK_ROOT\/TOOL\/tools\/deploy\/run-reported-test\.mjs/)
  assert.match(script, /CI_TEST_REPORT:-\$OUTPUT_ROOT\/\$CI_RUN_ID\.report\.json/)
  for (const name of ['hub-map-check', 'hub-atlas-check', 'hub-lore-schema', 'hub-glossary-check', 'hub-offices-check', 'hub-structures-check']) {
    assert.ok(script.includes(`node "$CI_TEST_RUNNER" test ${name} `), name)
  }
})
