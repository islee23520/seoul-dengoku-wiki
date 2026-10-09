import type { FamilyTreeData } from './components/FamilyTree'

// Same affiliation rules as generate-catalog.mjs; person-detail JSON intentionally carries no
// affiliation bytes, so this resolver enriches issued people on the render path.
export type FamilyAffiliation =
  | { readonly kind: 'state'; readonly stateId: string; readonly name: string }
  | { readonly kind: 'union' | 'neutral' | 'unaffiliated'; readonly name: string }

export type AffiliationPerson = { readonly state: string; readonly stateName: string; readonly detailRoute: string }
export type AffiliationState = { readonly id: string; readonly currentHegemon: { readonly kind: 'state'; readonly stateId: string; readonly name: string } | { readonly kind: 'union' | 'neutral'; readonly name: string } }

export function resolveAffiliation(person: AffiliationPerson | undefined, states: readonly AffiliationState[]): FamilyAffiliation | undefined {
  if (!person) return undefined
  if (person.state === 'S00') return { kind: 'unaffiliated', name: '무소속' }
  if (person.state === 'polity:daejeon') return { kind: 'neutral', name: person.stateName }
  const hegemon = states.find((entry) => entry.id === person.state)?.currentHegemon
  if (!hegemon) return undefined
  if (hegemon.kind === 'state') return { kind: 'state', stateId: hegemon.stateId, name: hegemon.name }
  if (hegemon.kind === 'union') return { kind: 'union', name: hegemon.name }
  return { kind: 'neutral', name: person.stateName }
}

export function enrichFamilyTreeAffiliations(tree: FamilyTreeData, people: readonly AffiliationPerson[], states: readonly AffiliationState[]): FamilyTreeData {
  const personByRoute = new Map(people.map((person) => [person.detailRoute, person]))
  return {
    ...tree,
    nodes: tree.nodes.map((node) => {
      if (node.affiliation || !node.personId || !node.detailRoute) return node
      const affiliation = resolveAffiliation(personByRoute.get(node.detailRoute), states)
      return affiliation ? { ...node, affiliation } : node
    }),
  }
}
