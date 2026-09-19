#!/usr/bin/env bash
set -euo pipefail

ROOT=/e/git/seoul-dengoku-web
INPUT_ROOT=${HUB_RELEASE_ROOT:-$ROOT}
cd "$ROOT"

expected=$(awk '{print $1}' "$INPUT_ROOT/seoul-dengoku-site.tar.sha256")
actual=$(sha256sum "$INPUT_ROOT/seoul-dengoku-site.tar" | awk '{print $1}')
test "$expected" = "$actual"

node "$INPUT_ROOT/check-live-contract.mjs" http://127.0.0.1:8080 live-http-green.json "$INPUT_ROOT/wikiCatalog.ts"
node "$INPUT_ROOT/verify-staged-release.mjs" site staged-release-live.json

node - <<'NODE'
const fs = require('node:fs')
const manifest = JSON.parse(fs.readFileSync('site/deployment-manifest.json', 'utf8'))
const inputRoot = process.env.HUB_RELEASE_ROOT || '.'
const pages = JSON.parse(fs.readFileSync(`${inputRoot}/hub-pages.json`, 'utf8')).pages
const failures = []
const crypto = require('node:crypto')

;(async () => {
  for (const page of pages) {
    const route = `/${page.target}/`
    const response = await fetch(`http://127.0.0.1:8080${route}`)
    if (response.status !== 200) failures.push(`${response.status}:${route}`)
    if (!manifest.pages.some((row) => row.id === page.id)) failures.push(`manifest:${page.id}`)
  }
  for (const artifact of manifest.artifacts) {
    const path = `site/${artifact.path}`
    if (!fs.existsSync(path)) {
      failures.push(`missing:${artifact.path}`)
      continue
    }
    const digest = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
    if (digest !== artifact.sha256) failures.push(`sha256:${artifact.path}`)
  }
  const result = { status: failures.length ? 'FAIL' : 'PASS', pages: pages.length, files: manifest.files, failures }
  fs.writeFileSync('hub-remote-verify.json', `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result))
  if (failures.length) process.exit(1)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
NODE

printf 'HUB_REMOTE_VERIFY_PASS sha256=%s\n' "$actual"
