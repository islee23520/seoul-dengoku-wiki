import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './document-store/evidence.mjs'

// A fictional organization keeps its ledger name while cards may name it by its
// public 2026 identity (office-rank retrofit proposal, 2026-10-17). Leader
// grounding that matches a state's name inside person cards also accepts it.
export const proposalPath = '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/proposal.json'

export function organizationAliases(proposalBytes) {
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
        'da361fc618c2ab82d67e01f7ced773fadc8189bc75194c5aaa3a6e6d5ca43fc0'))
    } finally { store.close() }
  }
  return organizationAliases(await reader(resolve(root, proposalPath)))
}

export const stateNames = (name, aliases) => [name, ...(aliases?.get(name) ?? [])]
