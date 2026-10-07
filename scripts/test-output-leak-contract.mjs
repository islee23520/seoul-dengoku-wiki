import assert from 'node:assert/strict'
import { test } from 'vitest'
import { approvedPortraitHashes, outputLeakFindings } from './output-leak-contract.mjs'

test('approved public hashes require catalog identity and selection or review approval', () => {
  const imageSha256 = 'a'.repeat(64)
  const catalog = { entries: [{ personId: 'person-1017', characterId: 'K1017', imageSha256 }] }
  const selection = { records: [] }
  const review = { personId: 'person-1017', characterId: 'K1017', imageSha256, ownerVerdict: { verdict: 'pass' } }
  assert.deepEqual([...approvedPortraitHashes(catalog, selection, [review])], [imageSha256])
  assert.equal(approvedPortraitHashes(catalog, selection, [{ ...review, characterId: 'K001' }]).size, 0)
  assert.equal(approvedPortraitHashes(catalog, selection, [{ ...review, ownerVerdict: { verdict: 'fail' } }]).size, 0)
  assert.deepEqual([...approvedPortraitHashes(catalog, { records: [{ personId: 'person-1017', imageSha256, verdict: 'pass' }] }, [])], [imageSha256])
})

test('public image digest exemptions never exempt pointer syntax or private source tokens', () => {
  const oid = 'a'.repeat(64)
  const approved = new Set([oid])
  assert.deepEqual(outputLeakFindings(Buffer.from(JSON.stringify({ imageSha256: oid })), [], [oid], approved), [])
  assert.deepEqual(outputLeakFindings(Buffer.from(oid), [], [oid], new Set()), [{ token: oid }])
  for (const pointer of [`version https://git-lfs.github.com/spec/v1\noid sha256:${oid}\nsize 12`, `oid sha256:${oid}`, JSON.stringify({ raw: `version https://git-lfs.github.com/spec/v1\noid sha256:${oid}` })]) {
    assert.ok(outputLeakFindings(Buffer.from(pointer), [], [oid], approved).some(row => row.kind === 'lfs-pointer-syntax'))
  }
  assert.deepEqual(outputLeakFindings(Buffer.from('/parent/private'), ['/parent/'], [oid], approved), [{ token: '/parent/' }])
})
