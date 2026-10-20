import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { authenticateReviewWordingSuccessor, WORDING_RECEIPT } from './review-wording-successor.mjs'
const hash = value => createHash('sha256').update(value).digest('hex')
export async function materializeReviewWordingMapping(root) {
  await authenticateReviewWordingSuccessor(root)
  const executable = new URL('../.omo/private/seoul-migration/person-detail-field-mappings-20261019/materialize.mjs', import.meta.url)
  if (hash(await readFile(executable)) !== '266548ddfc8a585f581d25e331f02eefe61251fc5c8904c06e5fa45ff77f7867') throw new Error('E_MAPPING_EXECUTABLE_HASH')
  const { materialize } = await import('../.omo/private/seoul-migration/person-detail-field-mappings-20261019/materialize.mjs')
  const result = await materialize()
  const receipt = JSON.parse(result.bytes)
  receipt.approvalRef = WORDING_RECEIPT
  const bytes = JSON.stringify(receipt) + '\n'
  return { bytes, sha256: hash(bytes), count: result.count, mappings: result.mappings }
}
