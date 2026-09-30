export function personRouteFailures(people, details, source, issued) {
  const failures = []
  const routes = new Set()
  const peopleByName = new Map(people.map((person) => [person.name, person]))
  if (peopleByName.size !== people.length) failures.push('duplicate-person-name')
  if (source.length !== people.length) failures.push('person-source-coverage')
  for (const [index, entry] of source.entries()) {
    const person = people[index]
    const id = `person-${String(index + 1).padStart(4, '0')}`
    if (person?.id !== id || person?.name !== entry.name) failures.push(`person-source-identity:${id}`)
  }
  if (issued.length !== people.length) failures.push('person-registry-coverage')
  for (const entry of issued) if (!peopleByName.has(entry.name)) failures.push(`missing-issued-person:${entry.id}`)
  const issuedNames = new Set(issued.map((entry) => entry.name))
  if (issuedNames.size !== issued.length) failures.push('duplicate-issued-name')
  for (const person of people) if (!issuedNames.has(person.name)) failures.push(`unissued-person:${person.id}`)
  for (const person of people) {
    const route = `/people/${person.id}`
    if (person.detailRoute !== route || !/^\/people\/person-\d{4}$/u.test(route)) failures.push(`person-route:${person.id}`)
    if (routes.has(person.detailRoute)) failures.push(`duplicate-person-route:${person.detailRoute}`)
    routes.add(person.detailRoute)
    const detail = details.get(person.id)
    if (!detail) failures.push(`missing-person-detail:${person.id}`)
    else if (detail.id !== person.id || detail.detailRoute !== route || detail.name !== person.name) failures.push(`person-detail-identity:${person.id}`)
  }
  const ids = new Set(people.map((person) => person.id))
  for (const id of details.keys()) if (!ids.has(id)) failures.push(`unindexed-person-detail:${id}`)
  return failures
}
