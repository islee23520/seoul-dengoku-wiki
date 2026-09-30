export function personRouteFailures(people, details) {
  const failures = []
  const routes = new Set()
  for (const person of people) {
    const route = `/people/${person.id}`
    if (person.detailRoute !== route || !/^\/people\/person-\d{4}$/u.test(route)) failures.push(`person-route:${person.id}`)
    if (routes.has(person.detailRoute)) failures.push(`duplicate-person-route:${person.detailRoute}`)
    routes.add(person.detailRoute)
    const detail = details.get(person.id)
    if (!detail) failures.push(`missing-person-detail:${person.id}`)
    else if (detail.id !== person.id || detail.detailRoute !== route || detail.name !== person.name) failures.push(`person-detail-identity:${person.id}`)
  }
  for (const id of details.keys()) if (!people.some((person) => person.id === id)) failures.push(`unindexed-person-detail:${id}`)
  return failures
}
