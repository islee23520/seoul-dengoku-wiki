// These are preserved family keys, not Korean clan IDs or inferred kinship.
export function projectNonKoreanFamilies(people, lineageByName) {
  const families = new Map()
  for (const person of people) {
    const lineage = lineageByName.get(person.name)
    if (lineage?.namingConvention !== 'non-korean-lineage') continue
    const family = families.get(lineage.clan) ?? {
      id: lineage.clan,
      surname: lineage.surname,
      basis: lineage.reason,
      sourceRef: lineage.namingConventionSource,
      members: [],
    }
    family.members.push({ id: person.id, name: person.name, detailRoute: person.detailRoute })
    families.set(family.id, family)
  }
  return [...families.values()]
}
