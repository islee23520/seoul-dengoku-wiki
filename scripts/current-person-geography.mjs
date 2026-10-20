// Vocabulary terms can also be ordinary words or approved political/person
// names. Exclude only those explicit non-geographic contexts, not place tokens.
export function externalToponymHits(detail, vocabulary) {
  const internal = vocabulary.internal.filter(term => typeof term === 'string' && term).sort((a, b) => b.length - a.length)
  const external = vocabulary.external.filter(term => typeof term === 'string' && term && !internal.includes(term))
  const patterns = external.map(term => [term, new RegExp(/[A-Za-z]/.test(term)
    ? `(?<![A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z])`
    : term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u')])
  const hits = []
  const inspect = (value, pointer) => {
    if (typeof value === 'string') {
      let text = value
      for (const term of [...internal, detail.name, '대한민국정부', '수문경비', '무주지', '러시아어', '고려인'].filter(Boolean)) text = text.split(term).join(' '.repeat(term.length))
      text = text.replace(/부여(?=하지|한다|한 |된 |되는 )/gu, '  ')
      if (/\/designation\//u.test(pointer)) text = text.replace(/영주/gu, '  ')
      for (const [term, pattern] of patterns) if (pattern.test(text)) hits.push({ person: detail.characterId, pointer, term, value })
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) inspect(child, `${pointer}/${key}`)
    }
  }
  for (const field of ['territory', 'confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'retinueGroups', 'openingDisposition', 'wandering_force', 'currentLocationRefs', 'locationRefs']) inspect(detail[field], `/${field}`)
  for (const [index, title] of (detail.openingTitles ?? []).entries()) {
    if (title.kind !== 'nonterritorial-political-title') inspect(title, `/openingTitles/${index}`)
  }
  if (detail.sovereignTitle?.territorialScale != null) inspect(detail.sovereignTitle, '/sovereignTitle')
  for (const [field, value] of Object.entries(detail.fields ?? {})) {
    if (/^(?:업무 위치|거주 위치|거주지|거주·업무 위치)$/.test(field)) inspect(value, `/fields/${field}`)
  }
  return hits
}
