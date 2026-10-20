import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'vitest'
import { authenticateTimelineWharfSuccessor, authenticateTimelineWharfPublicationReview, timelineWharfPredecessorReader, TIMELINE_SOURCE, TIMELINE_RECEIPT, TIMELINE_DIRECTORY, TIMELINE_REVIEW } from './timeline-wharf-successor.mjs'

const root = resolve(import.meta.dirname, '..')
test('timeline successor replays only the approved locale leaves and exact inverse', async () => {
  const result = await authenticateTimelineWharfSuccessor(root)
  const before = JSON.parse(result.before), current = JSON.parse(result.current)
  for (const operation of result.receipt.operations) before.content[14].text[operation.pointer.split('/').at(-1)] = operation.after
  assert.deepEqual(before, current)
  const predecessor = await timelineWharfPredecessorReader(root)
  assert.deepEqual(await predecessor(resolve(root, TIMELINE_SOURCE)), result.before)
  const { review } = await authenticateTimelineWharfPublicationReview(root)
  assert.equal(review.sourceSha256, result.receipt.afterSha256)
})
test('timeline rejects a changed publication review', async () => {
  const reader = async requested => requested === resolve(root, TIMELINE_REVIEW)
    ? Buffer.concat([await readFile(requested), Buffer.from(' ')]) : readFile(requested)
  await assert.rejects(authenticateTimelineWharfPublicationReview(root, reader), { code: 'E_REVIEW_HASH', path: TIMELINE_REVIEW })
})
test.each([TIMELINE_SOURCE, TIMELINE_RECEIPT, TIMELINE_DIRECTORY + 'before.json',
  '.omo/evidence/seoul-lock/timeline-wharf-owner-approval-20261020.md',
  '.omo/private/seoul-migration/connected-chronology-applied-20261015.json'])('timeline rejects changed exact authority bytes at %s', async path => {
  const reader = async requested => requested === resolve(root, path)
    ? Buffer.concat([await readFile(requested), Buffer.from(' ')]) : readFile(requested)
  await assert.rejects(authenticateTimelineWharfSuccessor(root, reader), { code: 'E_REVIEW_HASH', path })
})
