import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './document-store/evidence.mjs'

// Owner decision "중앙정보부=국가정보원 대응" (office-rank retrofit, 2026-10-17): a
// fictional organization keeps its ledger name while approved cards may name it
// by its public 2026 identity. Leader grounding that matches a state's name
// inside person cards therefore also accepts that approved nomenclature. Only
// the proposal bytes the owner approved by hash may supply an alias.
export const proposalPath = '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/proposal.json'
export const approvalPath = '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/owner-approval-20261017.json'
const requiredDecision = '중앙정보부=국가정보원 대응'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function organizationAliases(proposalBytes, approval) {
  if (approval?.kind !== 'batch-approval' || !/^[a-f0-9]{64}$/u.test(approval.proposalSha256 ?? '')
    || !Array.isArray(approval.decisions) || !approval.decisions.includes(requiredDecision)) throw new Error('E_ORGANIZATION_ALIAS_APPROVAL')
  if (sha256(proposalBytes) !== approval.proposalSha256) throw new Error('E_ORGANIZATION_ALIAS_HASH')
  const proposal = JSON.parse(Buffer.from(proposalBytes).toString('utf8'))
  if (proposal?.schema !== 'seoul.office-rank-retrofit-proposal.v1' || !Array.isArray(proposal.organizationMappings)) throw new Error('E_ORGANIZATION_ALIAS_SHAPE')
  const aliases = new Map()
  for (const row of proposal.organizationMappings) {
    if (typeof row?.fictionalName !== 'string' || !row.fictionalName || typeof row.real2026Identity !== 'string' || !row.real2026Identity
      || aliases.has(row.fictionalName)) throw new Error('E_ORGANIZATION_ALIAS_SHAPE')
    aliases.set(row.fictionalName, [row.real2026Identity])
  }
  return aliases
}

export async function loadApprovedOrganizationAliases(root, reader = readFile) {
  if (reader === readFile) {
    const store = openEvidenceStore(resolve(root,
      '.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite'),
    { capability: INTERNAL_EVIDENCE_CAPABILITY })
    try {
      return organizationAliases(store.getEvidence('scope-read:' + proposalPath,
        'da361fc618c2ab82d67e01f7ced773fadc8189bc75194c5aaa3a6e6d5ca43fc0'),
      JSON.parse(store.getEvidence('scope-read:' + approvalPath,
        '422c993948878163b4f198c016abeb83421604677ac978cb71962bdbff3899b3')))
    } finally { store.close() }
  }
  const [proposalBytes, approvalText] = await Promise.all([
    reader(resolve(root, proposalPath)),
    reader(resolve(root, approvalPath), 'utf8'),
  ])
  return organizationAliases(proposalBytes, JSON.parse(approvalText))
}

export const stateNames = (name, aliases) => [name, ...(aliases?.get(name) ?? [])]
