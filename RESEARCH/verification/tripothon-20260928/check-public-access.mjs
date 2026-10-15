import { writeFile } from 'node:fs/promises'

const records = []
for (const route of ['tripothon', 'play']) {
  const url = `https://seoul-dengoku.linalab.io/${route}/`
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
  const rawLocation = response.headers.get('location')
  const target = rawLocation ? new URL(rawLocation, url) : null
  records.push({ url, httpStatus: response.status, redirect: target ? target.origin + target.pathname : null, verdict: target?.hostname.endsWith('.cloudflareaccess.com') ? 'FAIL_AUTH_REQUIRED' : 'REQUIRES_BROWSER_GAMEPLAY_QA' })
  await response.body?.cancel()
}
const report = { checkedAt: new Date().toISOString(), scope: 'Anonymous HTTP entry check only; no login, gameplay or deployment changes', records }
await writeFile(new URL('./public-demo-evidence/http-access.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
if (records.some((row) => row.verdict === 'FAIL_AUTH_REQUIRED')) process.exitCode = 1
