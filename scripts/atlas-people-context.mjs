import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function atlasPeopleContext(loreRoot) {
 const json = async path => JSON.parse(await readFile(join(loreRoot, path), 'utf8'))
 const registry = await json('name-pools/person-id-registry.json')
 const candidates = await json('name-pools/person-id-candidates.json')
 const people = (await json('name-pools/values-cast.json')).people
 const sheets = (await json('name-pools/gurps-cast.json')).people
 const issued = new Map(registry.persons.map(p => [p.id, p]))
 const names = new Set(people.map(p => p.name))
 const routes = new Map(), urls = new Set()
 for (const sheet of sheets) {
  if (routes.has(sheet.id) || urls.has(sheet.url) || issued.get(sheet.id)?.name !== sheet.name || !names.has(sheet.name) || !/^\/people\/person-\d{4}$/u.test(sheet.url)) throw new Error('E_ATLAS_PERSON_ROUTE:' + sheet.id)
  routes.set(sheet.id, { name: sheet.name, detailRoute: sheet.url }); urls.add(sheet.url)
 }
 if (routes.size !== issued.size || names.size !== people.length) throw new Error('E_ATLAS_PERSON_COVERAGE')
 return { registry, candidates, people, routes }
}
