import { projectFamilyTree } from './cast-family-trees.mjs'
import { publicCharacterProfile } from './character-profile.mjs'
import { createHash } from 'node:crypto'

// The caller authenticates this map before production; current source bindings
// prevent a later input substitution from applying a preserved tier to another card.
export function preservedPersonalTier({ personId, publicId, name, stateId, source, envelope, appointment }, preservation) {
  if (!(preservation instanceof Map) || preservation.size !== 83) throw new Error('E_PERSON_TIER_PRESERVATION_MAP')
  const evidence = preservation.get(personId)
  if (!evidence) {
    if ([...preservation.values()].some(row => row.publicId === publicId || row.name === name)) throw new Error('E_PERSON_TIER_PRESERVATION_BINDING:' + personId)
    return undefined
  }
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
  if (personId !== evidence.personId || publicId !== evidence.publicId || name !== evidence.name
    || stateId !== evidence.stateId || source !== evidence.source || appointment
    || !/^T[1-5]$/u.test(evidence.commonTier)
    || !evidence.provenance?.currentRoleBlocks?.length
    || evidence.provenance.currentRoleBlocks.some(ref => {
      const blocks = envelope?.content?.filter(block => block.anchor === ref.anchor)
      return blocks?.length !== 1 || hash(blocks[0]) !== ref.sha256
    })) throw new Error('E_PERSON_TIER_PRESERVATION_BINDING:' + personId)
  return evidence.commonTier
}

// Called only after the caller has validated every holding kind and binding.
export function projectPersonHoldings(personalHoldings, issuedId, issuedById, peopleSource) {
  const direct = row => row.kind === undefined || row.kind === 'direct-property'
  const titles = personalHoldings.titles.filter(title => title.holderPersonId === issuedId)
  const superiorJurisdictions = personalHoldings.holdings.filter(holding => holding.holderPersonId === issuedId && holding.kind === 'superior-jurisdiction')
  return {
    ...((personalHoldings.politicalIdentities ?? []).some(row => row.holderPersonId === issuedId) ? {
      politicalIdentities: personalHoldings.politicalIdentities.filter(row => row.holderPersonId === issuedId),
    } : {}),
    confirmedHoldings: personalHoldings.holdings.filter(holding => holding.holderPersonId === issuedId && direct(holding)),
    ...(superiorJurisdictions.length ? { superiorJurisdictions } : {}),
    ...(titles.some(title => direct(title) && title.rank === 'duchy') ? {
      subordinateHoldings: personalHoldings.holdings.filter(holding => direct(holding) && holding.holderPersonId !== issuedId && personalHoldings.titles.some(title => direct(title) && title.id === holding.titleId && personalHoldings.titles.some(parent => direct(parent) && parent.id === title.parentTitleId && parent.holderPersonId === issuedId))).map(holding => ({ ...holding,
        holderName: issuedById.get(holding.holderPersonId).name,
        holderRoute: `/people/person-${String(peopleSource.findIndex(person => person.name === issuedById.get(holding.holderPersonId).name) + 1).padStart(4, '0')}`,
      })),
    } : {}),
    ...(titles.length ? { openingTitles: titles.map(title => ({ ...title,
      parentTitle: direct(title) && title.parentTitleId ? (() => { const parent = personalHoldings.titles.find(parent => parent.id === title.parentTitleId); return { id: parent.id, name: parent.name, holderPersonId: parent.holderPersonId } })() : null,
    })) } : {}),
  }
}

const parseCardSections = (body) => {
  const sections = {}
  if (/\*\*[^*]+?\.\*\*/u.test(body) || !/(?:^|\n)(?:호위 대열|훈련)\.\s/u.test(body)) {
    for (const match of body.matchAll(/\*\*([^*]+?)\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*#{2,3}\s|\n\s*:::|$)/g)) sections[match[1].trim()] = match[2].trim()
    return sections
  }
  const matches = [...body.matchAll(/(?:\*\*([^*]+?)\.\*\*|(?:^|\n)(생애|관직|일화|관계|야망|공포|개입|가문|신념|목표|훈련|호위 대열|호위와 철수|전령과 호위|계약과 권한|특성|신체)\.)\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n(?:생애|관직|일화|관계|야망|공포|개입|가문|신념|목표|훈련|호위 대열|호위와 철수|전령과 호위|계약과 권한|특성|신체)\.\s|\n\s*#{2,3}\s|\n\s*:::|$)/g)]
  for (const match of matches) sections[(match[1] ?? match[2]).trim()] = match[3].trim()
  return sections
}
const parseCardFields = (body) => Object.fromEntries(
  [...body.matchAll(/^- ([^:\n]+):\s*(.+)$/gm)].map((match) => [match[1].trim(), match[2].trim()]),
)
const primaryCard = (person, personCards) => {
  const cards = personCards.get(person.name) ?? []
  const selected = cards.find((card) => card.primary)
  if (selected) return selected
  const stateCard = cards.find((card) => /^Cast-State-\d{2}$/.test(card.file))
  if (stateCard) return stateCard
  return [...cards].sort((left, right) => right.body.length - left.body.length)[0]
}

// All inputs are already projected and validated by the caller. No source or output IO occurs here.
export function producePersonDetails({ peopleSource, personCards, pagesBySlug, officeAppointments,
  issuedIdByName, issuedById, genderByName, stateNameById, tiersByState, atlasPeople,
  birthdayRoster, courtDataset, personalHoldings, issuedSheets, lineageByName,
  birthdaysById, familyGraph, parentStatusById, proseContactsById, householdsById,
  personRightsPermissions, characterProfiles, openingDispositions,
  relations, personFeedbackRecord, personalTierPreservation }) {
  const peopleCatalog = peopleSource.map((person, index) => {
    const cards = personCards.get(person.name) ?? []
    const primary = primaryCard(person, personCards)
    const fields = parseCardFields(primary?.body ?? '')
    const sections = parseCardSections(primary?.body ?? '')
    const source = primary?.file ?? 'Cast-Index'
    const heading = source === 'Core-Characters' ? person.name : `인물-${primary?.heading ?? person.name}`
    const anchor = source === 'Diaspora-Corridors'
      ? heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
      : heading
    const office = sections['관직'] ?? ''
    const appointment = officeAppointments.get(issuedIdByName.get(person.name))
    if (appointment && appointment.stateId !== person.state) throw new Error('E_OPENING_OFFICE_STATE:' + appointment.personId)
    const position = appointment ? appointment.position : fields['직함'] ?? fields['직위'] ?? office.match(/직함은 ([^.]+)\./u)?.[1]?.trim() ?? person.title
    const rank = appointment ? appointment.rank : fields['품계'] ?? office.match(/품계 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
    const occupation = fields['생업'] ?? cards.map((card) => parseCardFields(card.body)['생업']).find(Boolean) ?? office.match(/생업 별명은 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
    const stateTiers = tiersByState.get(person.state)
    const tierIndex = stateTiers?.findIndex((ranks) => ranks.includes(rank)) ?? -1
    const personalTier = preservedPersonalTier({ personId: issuedIdByName.get(person.name),
      publicId: `person-${String(index + 1).padStart(4, '0')}`, name: person.name, stateId: person.state,
      source, envelope: pagesBySlug.get(source)?.value, appointment }, personalTierPreservation)
    const commonTier = personalTier ?? appointment?.commonTier ?? (person.state === 'polity:daejeon' || person.state === 'S00' || source === 'Cast-Unaffiliated' || source === 'Diaspora-Corridors' || /^품계 없음\./u.test(office) ? 'T5' : tierIndex >= 0 ? `T${tierIndex + 1}` : '')
    return {
      id: `person-${String(index + 1).padStart(4, '0')}`,
      name: person.name,
      title: appointment ? appointment.position : person.title,
      position,
      characterId: issuedIdByName.get(person.name),
      rank,
      commonTier,
      occupation,
      gender: genderByName.get(person.name)?.gender ?? (() => { throw new Error(`E_PERSON_GENDER_MISSING:${person.name}`) })(),
      stage: person.stage,
      state: person.state,
      stateName: stateNameById.get(person.state) ?? person.state_name,
      sourceRoute: `/world/${source}#${anchor}`,
      detailRoute: [...atlasPeople.routes.values()].find((route) => route.name === person.name).detailRoute,
    }
  })
  const catalogByName = new Map(peopleCatalog.map((person) => [person.name, person]))
  const familyDetailRoutes = new Map(birthdayRoster.map((person) => [person.id, catalogByName.get(person.name).detailRoute]))
  const graphPerson = (id) => {
    const issued = issuedById.get(id)
    const person = issued && catalogByName.get(issued.name)
    if (!person || person.name !== issued.name) throw new Error(`E_RETAINER_GRAPH_PERSON:${id}`)
    return { id, name: person.name, state: person.state, detailRoute: person.detailRoute }
  }
  const graphCourts = courtDataset.config.courts
  const graphRetainers = courtDataset.config.directRetainers
  const graphOwnerLieges = courtDataset.config.ownerLieges?.edges ?? []
  const graphIds = new Set(graphCourts.map((court) => court.ownerPersonId))
  for (const holding of personalHoldings.holdings) graphIds.add(holding.holderPersonId)
  for (const row of graphRetainers) {
    graphIds.add(row.personId)
    graphIds.add(row.liegePersonId)
  }
  for (const row of graphOwnerLieges) {
    graphIds.add(row.personId)
    graphIds.add(row.liegePersonId)
  }
  const membershipsById = new Map(courtDataset.config.courtMemberships.memberships.map((row) => [row.personId, row]))
  const retainerGraph = {
    groups: personalHoldings.retinueGroups,
    nodes: [...graphIds].map(graphPerson),
    edges: [
      ...graphRetainers.map(({ personId, liegePersonId, courtId }) =>
        ({ fromPersonId: personId, toPersonId: liegePersonId, courtId })),
      ...graphOwnerLieges.map(({ personId, liegePersonId, relationKind, ownerTerm }) =>
        ({ fromPersonId: personId, toPersonId: liegePersonId, courtId: membershipsById.get(personId)?.courtId ?? null, relationKind, ownerTerm })),
    ],
    courts: graphCourts.map(({ id, ownerPersonId, stateId }) => ({ id, ownerPersonId, stateId })),
  }
  const sheetById = new Map(issuedSheets.map((sheet) => [sheet.id, sheet]))
  if (sheetById.size !== issuedSheets.length) throw new Error('E_PERSON_SHEET_DUPLICATE_ID')
  const retainersById = new Map(courtDataset.config.directRetainers.map((row) => [row.personId, row]))
  const courtMembersByOwner = new Map(courtDataset.config.courts.map((court) => [court.ownerPersonId,
    [...courtDataset.config.directRetainers, ...courtDataset.config.courtMemberships.memberships].filter((row) => row.courtId === court.id)]))
  const ownerLiegeByPerson = new Map(courtDataset.config.ownerLieges?.edges?.map((row) => [row.personId, row]) ?? [])
  const personDetails = []
  const personFeedbackRecords = []
  for (const person of peopleCatalog) {
    const ledger = peopleSource.find((candidate) => candidate.name === person.name)
    const cards = personCards.get(person.name) ?? []
    const primary = primaryCard(ledger, personCards)
    const body = primary?.body ?? ''
    const sourceEnvelope = pagesBySlug.get(primary?.file)?.value
    if (!sourceEnvelope || !primary) throw new Error(`E_PERSON_FEEDBACK_SOURCE:${person.id}`)
    const lineage = lineageByName.get(person.name)
    const issuedId = issuedIdByName.get(person.name)
    if (!lineage) throw new Error(`E_PERSON_LINEAGE_MISSING:${person.name}`)
    const sheet = sheetById.get(issuedId)
    if (!sheet || sheet.name !== person.name || sheet.url !== person.detailRoute) throw new Error(`E_PERSON_SHEET_IDENTITY:${issuedId}:${person.id}`)
    const detail = {
      ...person,
      ...birthdaysById.get(issuedId),
      familyTree: { ...projectFamilyTree(familyGraph, issuedId, familyDetailRoutes), parentStatus: parentStatusById.get(issuedId) ?? null },
      proseContacts: proseContactsById.get(issuedId) ?? [],
      household: householdsById.get(issuedId),
      ...(personRightsPermissions.has(issuedId) ? { rightsPermissions: personRightsPermissions.get(issuedId) } : {}),
      characterProfile: publicCharacterProfile(characterProfiles.get(issuedId)),
      ...projectPersonHoldings(personalHoldings, issuedId, issuedById, peopleSource),
      ...(personalHoldings.polities.some(polity => polity.sovereignPersonId === issuedId) ? { sovereignTitle: personalHoldings.polities.find(polity => polity.sovereignPersonId === issuedId) } : {}),
      ...(personalHoldings.retinueGroups.some(group => group.liegePersonId === issuedId) ? { retinueGroups: personalHoldings.retinueGroups.filter(group => group.liegePersonId === issuedId) } : {}),
      ...(openingDispositions.has(issuedId) ? { openingDisposition: openingDispositions.get(issuedId) } : {}),
      clan: lineage.clan && lineage.namingConvention !== 'non-korean-lineage' ? { id: lineage.base_clan ?? lineage.clan, name: `${lineage.bongwan} ${lineage.surname}씨`, crest: `clan-crests/${lineage.base_clan ?? lineage.clan}.svg` } : null,
      generation: ledger.generation,
      minors: ledger.minors,
      sourceKind: ledger.source,
      ...(ledger.locked !== undefined ? { locked: ledger.locked } : {}),
      values: ledger.values,
      desire: ledger.desire,
      fields: parseCardFields(body),
      sections: parseCardSections(body),
      biography: body,
      sources: cards.map((card) => card.file),
      ...(retainersById.has(issuedId) ? (() => {
        const row = retainersById.get(issuedId)
        return { directLiege: { personId: row.liegePersonId, name: issuedById.get(row.liegePersonId).name,
          courtId: row.courtId, effectiveYear: courtDataset.config.courtContract.effectiveYear } }
      })() : ownerLiegeByPerson.has(issuedId) ? (() => {
        const row = ownerLiegeByPerson.get(issuedId)
        return { directLiege: { personId: row.liegePersonId, name: issuedById.get(row.liegePersonId).name,
          relationKind: row.relationKind, ownerTerm: row.ownerTerm,
          ...(membershipsById.has(issuedId) ? { courtId: membershipsById.get(issuedId).courtId } : {}),
          effectiveYear: courtDataset.config.ownerLieges.effectiveYear } }
      })() : {}),
      ...(courtMembersByOwner.has(issuedId) ? {
        court: { id: `court:${issuedId}`,
          members: courtMembersByOwner.get(issuedId).map((row) =>
            ({ personId: row.personId, name: issuedById.get(row.personId).name })) },
      } : {}),
      relations: {
        outgoing: relations.filter((relation) => relation.from === person.name),
        incoming: relations.filter((relation) => relation.to === person.name),
      },
    }
    personDetails.push(detail)
    personFeedbackRecords.push(personFeedbackRecord({ envelope: sourceEnvelope, personId: person.id, route: person.detailRoute, headingText: primary.file === 'Core-Characters' ? person.name : `인물 ${primary.heading ?? person.name}`, locale: 'ko', sections: detail.sections }))
  }
  return { peopleCatalog, personDetails, retainerGraph, familyDetailRoutes, personFeedbackRecords }
}
