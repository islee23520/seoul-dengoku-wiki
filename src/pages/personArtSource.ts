type ArtPerson = { readonly id: string; readonly name: string; readonly detailRoute: string }
type ArtDetail = {
  readonly id: string
  readonly name: string
  readonly sourceRoute: string
  readonly fields: Record<string, string>
  readonly sections: Record<string, string>
}

export function resolveArtPerson<T extends ArtPerson>(id: string | null, catalog: readonly T[]): T | null {
  return catalog.find((person) => person.id === id) ?? null
}

export function makeArtSourcePacket(person: ArtPerson, detail: ArtDetail) {
  if (person.id !== detail.id || person.name !== detail.name) return null
  return {
    schemaVersion: 1,
    personId: person.id,
    name: person.name,
    sourceRoute: detail.sourceRoute,
    fields: detail.fields,
    sections: detail.sections,
  }
}
