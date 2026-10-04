export function validateOpeningDispositions(ledger, people) {
  const personIds = new Set(people.map(person => person.id))
  const holders = new Set(ledger.holdings.map(holding => holding.holderPersonId))
  const dispositions = new Map()
  for (const row of ledger.openingDispositions ?? []) {
    if (!personIds.has(row.personId) || dispositions.has(row.personId) ||
        row.status !== 'personal-landless' || typeof row.approvalRef !== 'string' || !row.approvalRef.trim())
      throw new Error('E_OPENING_DISPOSITION:' + row.personId)
    if (holders.has(row.personId)) throw new Error('E_OPENING_DISPOSITION_HOLDING:' + row.personId)
    dispositions.set(row.personId, { status: row.status, openingYear: ledger.openingYear })
  }
  return dispositions
}
