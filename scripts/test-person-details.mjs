import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const sourcePages = new Map()
const cardSources = ['Cast-State-01', 'Cast-State-02', 'Cast-State-03', 'Cast-State-04', 'Cast-State-05',
  'Cast-State-06', 'Cast-State-07', 'Cast-State-08', 'Cast-State-09', 'Cast-State-10', 'Cast-State-11',
  'Cast-State-12', 'Cast-State-13', 'Cast-State-14', 'Cast-State-15', 'Cast-State-16',
  'Core-Characters', 'Cast-Unaffiliated']
const selectedCard = async (name) => {
  const candidates = []
  for (const slug of cardSources) {
    if (!sourcePages.has(slug)) {
      const document = JSON.parse(await readFile(new URL(`../lore/characters/${slug}.json`, import.meta.url), 'utf8'))
      sourcePages.set(slug, { markdown: renderLoreMarkdown(document, 'ko'), primary: document.data?.primary_detail_names ?? [] })
    }
    const source = sourcePages.get(slug)
    const heading = slug === 'Core-Characters' ? `## ${name}` : `### 인물 ${name}`
    const start = source.markdown.indexOf(`${heading}\n`)
    if (start < 0) continue
    const body = source.markdown.slice(start + heading.length).split(/\n#{2,3} /u, 1)[0]
    candidates.push({ slug, body, primary: source.primary.includes(name) })
  }
  assert.ok(candidates.length > 0, name)
  return candidates.find((card) => card.primary) ?? candidates.sort((a, b) => b.body.trim().length - a.body.trim().length)[0]
}
const assertMartialSource = async (detail, id) => {
  const issued = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
    .persons.find((person) => person.id === id || person.name === id)
  assert.equal(detail.name, issued?.name, id)
  const card = await selectedCard(issued.name)
  const anchor = card.slug === 'Core-Characters' ? issued.name : `인물-${issued.name}`
  assert.equal(detail.sourceRoute, `/world/${card.slug}#${anchor}`, id)
  assert.equal(detail.biography, card.body.trim(), id)
  const martial = card.body.match(/\*\*무공\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*:::|$)/u)?.[1]?.trim()
  assert.ok(martial, id)
  assert.equal(detail.sections['무공'], martial, id)
}

test('S01 court projection retains exact approved direct lieges and owner memberships', async () => {
  const approved = [
    ['K002', 'K904 K568 K616 K712 K856 K952 K1001 K424 K520 K760 K808 K664 K472'],
    ['K017', 'K504 K744 K600 K552 K456 K840 K888 K648 K936 K984 K792 K696'],
    ['K003', 'K968 K440 K728 K488 K920 K536 K824 K776 K632 K872 K584 K680'],
  ]
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const details = new Map()
  for (const file of (await readdir(new URL('../public/person-details/', import.meta.url))).filter((name) => name.endsWith('.json'))) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${file}`, import.meta.url), 'utf8'))
    details.set(detail.name, detail)
  }
  const person = (id) => {
    const issued = registry.persons.find((entry) => entry.id === id)
    assert.ok(issued, id)
    const detail = details.get(issued.name)
    assert.ok(detail, id)
    return detail
  }
  const expectedMembers = new Set()
  const expectedOwners = new Set()
  const checkProjection = (getPerson) => {
    for (const [ownerId, members] of approved) {
      const owner = getPerson(ownerId)
      const courtId = `court:${ownerId}`
      expectedOwners.add(owner.name)
      const ids = members.split(' ')
      assert.equal(owner.court?.id, courtId, ownerId)
      assert.deepEqual(owner.court?.members.map(({ personId, name }) => [personId, name]),
        ids.map((id) => [id, getPerson(id).name]), ownerId)
      assert.equal(owner.directLiege, undefined, ownerId)
      for (const id of ids) {
        const detail = getPerson(id)
        expectedMembers.add(detail.name)
        assert.deepEqual(detail.directLiege,
          { personId: ownerId, name: owner.name, courtId, effectiveYear: 2126 }, id)
        assert.equal(detail.court, undefined, id)
        assert.equal(detail.relations.outgoing.filter((edge) => edge.to === owner.name && edge.type === '지휘').length, 1, id)
      }
    }
  }
  checkProjection(person)
  assert.equal(expectedMembers.size, 37)
  assert.equal(expectedOwners.size, 3)
  assert.ok(expectedMembers.has(person('K872').name))
  assert.ok(!expectedMembers.has(person('K272').name))
  assert.equal(details.size, 1022)
  for (const detail of details.values()) {
    if (detail.state === 'S01' && !expectedMembers.has(detail.name)) assert.equal(detail.directLiege, undefined, detail.name)
    if (detail.state === 'S01' && !expectedOwners.has(detail.name)) assert.equal(detail.court, undefined, detail.name)
  }
  const withoutLiege = new Map(details)
  withoutLiege.set(person('K904').name, { ...person('K904'), directLiege: undefined })
  assert.throws(() => checkProjection((id) => withoutLiege.get(registry.persons.find((entry) => entry.id === id).name)), /K904/)
  const wrongLiege = new Map(details)
  wrongLiege.set(person('K904').name, { ...person('K904'), directLiege: { ...person('K904').directLiege, personId: 'K003' } })
  assert.throws(() => checkProjection((id) => wrongLiege.get(registry.persons.find((entry) => entry.id === id).name)), /K904/)
  const wrongMember = new Map(details)
  wrongMember.set(person('K002').name, { ...person('K002'), court: { ...person('K002').court,
    members: person('K002').court.members.map((member) => member.personId === 'K904' ? { ...member, personId: 'K272' } : member) } })
  assert.throws(() => checkProjection((id) => wrongMember.get(registry.persons.find((entry) => entry.id === id).name)), /K002/)
  const missingMember = new Map(details)
  missingMember.set(person('K002').name, { ...person('K002'), court: { ...person('K002').court,
    members: person('K002').court.members.filter((member) => member.personId !== 'K904') } })
  assert.throws(() => checkProjection((id) => missingMember.get(registry.persons.find((entry) => entry.id === id).name)), /K002/)
})

test('S02/S03 court projection retains exact approved direct lieges and owner memberships', async () => {
  const approved = [
    ['K032', 'K041'], ['K037', 'K047'], ['K033', 'K049'], ['K058', 'K068'],
    ['K060', 'K069 K071'], ['K061', 'K073 K075'], ['K062', 'K074'],
  ]
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8'))
  const catalogText = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(catalogText.slice('export const peopleCatalog = '.length, catalogText.indexOf(' as const\n')))
  const issuedById = new Map(registry.persons.map((person) => [person.id, person]))
  const stateByName = new Map(values.people.map((person) => [person.name, person.state]))
  const details = new Map()
  for (const file of (await readdir(new URL('../public/person-details/', import.meta.url))).filter((name) => name.endsWith('.json'))) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${file}`, import.meta.url), 'utf8'))
    details.set(detail.id, detail)
  }
  const person = (id, records = details) => {
    const issued = issuedById.get(id)
    assert.ok(issued, id)
    const matches = catalog.filter((entry) => entry.name === issued.name)
    assert.equal(matches.length, 1, id)
    const route = matches[0].detailRoute
    assert.match(route, /^\/people\/person-\d{4}$/u, id)
    const detail = records.get(route.slice('/people/'.length))
    assert.ok(detail, id)
    assert.equal(detail.id, matches[0].id, id)
    assert.equal(detail.name, issued.name, id)
    assert.equal(detail.state, stateByName.get(issued.name), id)
    assert.equal(matches[0].state, stateByName.get(issued.name), id)
    return detail
  }
  const expectedMembers = new Set()
  const expectedOwners = new Set()
  const check = (getPerson) => {
    for (const [ownerId, members] of approved) {
      const owner = getPerson(ownerId)
      const ids = members.split(' ')
      expectedOwners.add(owner.id)
      assert.equal(owner.court?.id, `court:${ownerId}`, ownerId)
      assert.deepEqual(owner.court?.members, ids.map((id) => ({ personId: id, name: issuedById.get(id).name })), ownerId)
      assert.equal(owner.directLiege, undefined, ownerId)
      for (const id of ids) {
        const member = getPerson(id)
        expectedMembers.add(member.id)
        assert.deepEqual(member.directLiege,
          { personId: ownerId, name: issuedById.get(ownerId).name, courtId: `court:${ownerId}`, effectiveYear: 2126 }, id)
        assert.equal(member.court, undefined, id)
        assert.equal(member.relations.outgoing.filter((edge) => edge.to === owner.name && edge.type === '지휘').length, 1, id)
      }
    }
  }
  check(person)
  assert.equal(expectedMembers.size, 9)
  assert.equal(expectedOwners.size, 7)
  assert.equal(details.size, 1022)
  for (const detail of details.values()) {
    if (detail.state !== 'S01' && !expectedMembers.has(detail.id)) assert.equal(detail.directLiege, undefined, detail.id)
    if (detail.state !== 'S01' && !expectedOwners.has(detail.id)) assert.equal(detail.court, undefined, detail.id)
  }
  const omitted = new Map(details)
  omitted.set(person('K041').id, { ...person('K041'), directLiege: undefined })
  assert.throws(() => check((id) => person(id, omitted)), /K041/)
  const wrongCourt = new Map(details)
  wrongCourt.set(person('K060').id, { ...person('K060'), court: { ...person('K060').court,
    members: person('K060').court.members.filter((member) => member.personId !== 'K071') } })
  assert.throws(() => check((id) => person(id, wrongCourt)), /K060/)
  const wrongIdentity = new Map(details)
  wrongIdentity.set(person('K041').id, { ...person('K041'), name: issuedById.get('K194').name })
  wrongIdentity.set(person('K032').id, { ...person('K032'), court: { ...person('K032').court,
    members: [{ personId: 'K041', name: issuedById.get('K194').name }] } })
  assert.throws(() => check((id) => person(id, wrongIdentity)), /K041/)
  const blankIdentity = new Map(details)
  blankIdentity.set(person('K041').id, { ...person('K041'), name: '' })
  blankIdentity.set(person('K032').id, { ...person('K032'), court: { ...person('K032').court,
    members: [{ personId: 'K041', name: '' }] } })
  assert.throws(() => check((id) => person(id, blankIdentity)), /K041/)
  const foreignState = new Map(details)
  foreignState.set(person('K041').id, { ...person('K041'), state: 'S08' })
  assert.throws(() => check((id) => person(id, foreignState)), /K041/)
  const wrongOwner = new Map(details)
  wrongOwner.set(person('K032').id, { ...person('K032'), name: issuedById.get('K194').name })
  assert.throws(() => check((id) => person(id, wrongOwner)), /K032/)
  const personCourt = new Map(details)
  personCourt.set(person('K032').id, { ...person('K032'), court: { ...person('K032').court, id: 'K032' } })
  assert.throws(() => check((id) => person(id, personCourt)), /K032/)
})

test('all canonical people expose unique detail routes and structured data', async () => {
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const routes = [...catalog.matchAll(/"detailRoute": "([^"]+)"/g)].map((match) => match[1])
  const detailRoot = new URL('../public/person-details/', import.meta.url)
  const names = (await readdir(detailRoot)).filter((name) => name.endsWith('.json'))
  assert.equal(routes.length, 1022)
  assert.equal(new Set(routes).size, 1022)
  assert.ok(routes.every((route) => /^\/people\/person-\d{4}$/u.test(route)))
  assert.equal(names.length, 1022)
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(name, detailRoot), 'utf8'))
    assert.ok(detail.biography.length > 0, name)
    if (detail.clan) {
      assert.match(detail.clan.crest, /^clan-crests\/[a-z0-9-]+\.svg$/u, name)
      assert.ok((await readFile(new URL(`../public/${detail.clan.crest}`, import.meta.url), 'utf8')).includes('<svg'), name)
    } else {
      const lineage = JSON.parse(await readFile(new URL('../lore/name-pools/cast-hangnyeol.json', import.meta.url), 'utf8'))
        .people.find((person) => person.name === detail.name)
      assert.ok(lineage, name)
      if (lineage.status === 'no-bongwan') assert.equal(lineage.clan, undefined, name)
      else {
        assert.equal(lineage.clan, null, name)
        assert.ok(['unused', 'unconfirmed'].includes(lineage.status), name)
      }
    }
    assert.equal(Object.keys(detail.values).length, 10, name)
    assert.equal(Object.keys(detail.desire).length, 7, name)
    assert.ok(['여성', '남성'].includes(detail.gender), name)
    if (detail.name === '신준') {
      assert.equal(detail.minors, true, name)
      assert.equal(detail.title, '', name)
      assert.equal(detail.position, '', name)
      assert.equal(detail.desire.지향, null, name)
      assert.equal(detail.desire.결합, null, name)
    } else assert.ok(detail.position.length > 0, name)
    assert.ok(detail.rank.length > 0, name)
    assert.ok(detail.occupation.length > 0, name)
  }
})

test('thirteen S01 ration clerks have owner-approved command ties to I Seodam', async () => {
  const names = ['임달나', '백산석', '성달현', '한북우', '김빛호', '문숲민', '곽가현', '이민석', '송재현', '고늘진', '노솔호', '이하석', '임건우']
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const details = new Map()
  for (const match of catalog.matchAll(/"id": "(person-\d{4})",\s*"name": "([^"]+)"/gu)) {
    if (names.includes(match[2])) details.set(match[2], match[1])
  }
  assert.equal(details.size, names.length)
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${details.get(name)}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.relations.outgoing.filter((edge) => edge.to === '이서담' && edge.type === '지휘').length, 1, name)
  }
})

test('twelve S01 concourse explorers have owner-approved command ties to Byeon Goun', async () => {
  const names = ['이늘민', '최아아', '송하지', '임서나', '성수현', '양자태', '성하현', '백차래', '정남준', '안구민', '신차민', '차자원']
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const details = new Map()
  for (const match of catalog.matchAll(/"id": "(person-\d{4})",\s*"name": "([^"]+)"/gu)) {
    if (names.includes(match[2])) details.set(match[2], match[1])
  }
  assert.equal(details.size, names.length)
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${details.get(name)}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.relations.outgoing.filter((edge) => edge.to === '변고운' && edge.type === '지휘').length, 1, name)
  }
})

test('twelve S01 bridge couriers have owner-approved command ties to Kim Taeun', async () => {
  const names = ['민차현', '송은지', '허바우', '백미래', '남아은', '성사현', '조바원', '구람희', '임람나', '안새민', '이다민', '송다지']
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const details = new Map()
  for (const match of catalog.matchAll(/"id": "(person-\d{4})",\s*"name": "([^"]+)"/gu)) {
    if (names.includes(match[2])) details.set(match[2], match[1])
  }
  assert.equal(details.size, names.length)
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${details.get(name)}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.relations.outgoing.filter((edge) => edge.to === '김태운' && edge.type === '지휘').length, 1, name)
  }
})

test('Oh Haerin keeps the owner-confirmed female identity', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0195.json', import.meta.url), 'utf8'))
  const ledger = JSON.parse(await readFile(new URL('../lore/name-pools/gender-cast.json', import.meta.url), 'utf8'))
  const gender = ledger.people.find((person) => person.name === '오해린')
  assert.equal(detail.name, '오해린')
  assert.equal(detail.gender, '여성')
  assert.equal(gender.gender, '여성')
  assert.equal(gender.user_locked, true)
})

test('S01 issued cards retain an explicit occupation and martial state in person details', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-01.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const issued = new Set(registry.persons.map((person) => person.name))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 65)
  const details = new Map()
  const detailRoot = new URL('../public/person-details/', import.meta.url)
  for (const file of (await readdir(detailRoot)).filter((name) => name.endsWith('.json'))) {
    const detail = JSON.parse(await readFile(new URL(file, detailRoot), 'utf8'))
    details.set(detail.name, detail)
  }
  for (const [index, heading] of headings.entries()) {
    assert.ok(issued.has(heading.name), heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const occupation = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
      .map((item) => typeof item.ko === 'string' ? item.ko : item.ko.map((run) => run.text).join(''))
      .find((item) => item.startsWith('생업: '))?.slice(4)
    assert.ok(occupation && occupation !== '미등록', heading.name)
    const detail = details.get(heading.name)
    assert.ok(detail, heading.name)
    assert.equal(detail.occupation, occupation, heading.name)
    if (detail.sourceRoute.startsWith('/world/Cast-State-01#')) assert.equal(detail.fields['생업'], occupation, heading.name)
    await assertMartialSource(detail, heading.name)
  }
})

test('S02 issued cards retain distinct bilingual livelihoods and their martial state', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-02.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 66)
  assert.ok(headings.some(({ name }) => name === '이일섭'))
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id, heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupation = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.ok(occupation, heading.name)
    assert.match(occupation.en, /^Livelihood: \S/u, heading.name)
    const livelihood = occupation.ko.slice(4)
    assert.notEqual(livelihood, '미등록', heading.name)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    assert.notEqual(livelihood, title, heading.name)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${id.slice(1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name)
    assert.equal(detail.occupation, livelihood, heading.name)
    assert.equal(detail.fields['생업'], livelihood, heading.name)
    await assertMartialSource(detail, heading.name)
  }
})

test('all currently issued S03 cards retain bilingual livelihoods distinct from office and martial path', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-03.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.ok(headings.length > 0)
  assert.equal(new Set(headings.map(({ name }) => name)).size, headings.length)
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id, heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.equal(occupations.length, 1, heading.name)
    const occupation = occupations[0]
    assert.match(occupation.en, /^Livelihood: \S/u, heading.name)
    const livelihood = occupation.ko.slice(4)
    assert.notEqual(livelihood, '미등록', heading.name)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    assert.notEqual(livelihood, title, heading.name)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${id.slice(1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name)
    assert.equal(detail.occupation, livelihood, heading.name)
    assert.equal(detail.fields['생업'], livelihood, heading.name)
    await assertMartialSource(detail, heading.name)
  }
})

test('all 64 issued S04 K IDs retain sourced bilingual livelihoods and martial paths', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-04.json', import.meta.url), 'utf8'))
  const markdown = renderLoreMarkdown(document, 'ko')
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map(({ id, name }) => [name, id]))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const detailIndexByName = new Map(values.map(({ name }, index) => [name, index + 1]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 64)
  const ids = headings.map(({ name }) => idByName.get(name))
  assert.equal(new Set(ids).size, 64)
  assert.ok(ids.every((id) => /^K\d{3,4}$/u.test(id)))
  const martial = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  for (const [index, heading] of headings.entries()) {
    const id = ids[index]
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const livelihoods = fields.filter((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.equal(livelihoods.length, 1, id)
    const occupation = livelihoods[0]
    assert.match(occupation.en, /^Livelihood: \S/u, id)
    const ko = occupation.ko.slice(4)
    assert.notEqual(ko, '미등록', id)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    const rank = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('품계: '))?.ko.slice(4)
    assert.notEqual(ko, title, id)
    assert.notEqual(ko, rank, id)
    const detailIndex = detailIndexByName.get(heading.name)
    assert.ok(detailIndex, id)
    const detailId = `person-${String(detailIndex).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, ko, id)
    assert.equal(detail.fields['생업'], ko, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-04#'), id)
    await assertMartialSource(detail, id)
  }
})

test('all 65 issued S05 cards retain bilingual livelihoods and their original martial declarations', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-05.json', import.meta.url), 'utf8'))
  const markdown = renderLoreMarkdown(document, 'ko')
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map(({ id, name }) => [name, id]))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const detailIndexByName = new Map(values.map(({ name }, index) => [name, index + 1]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const baeDetail = JSON.parse(await readFile(new URL('../public/person-details/person-0116.json', import.meta.url), 'utf8'))
  assert.equal(baeDetail.sourceRoute, '/world/Cast-State-05#인물-배우진')
  assert.equal(baeDetail.fields['생업'], '복구복무 명부·부품 대가 조정')
  await assertMartialSource(baeDetail, 'K115')
  await assert.rejects(assertMartialSource({ ...baeDetail, sections: { ...baeDetail.sections, 무공: '' } }, 'K115'), /K115/)
  await assert.rejects(assertMartialSource({ ...baeDetail, name: '정소율' }, 'K115'), /K115/)
  await assert.rejects(assertMartialSource({ ...baeDetail, sections: { ...baeDetail.sections, 무공: '단철공.' } }, 'K115'), /K115/)
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 65)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(/^K\d{3,4}$/u.test(id ?? ''), heading.name)
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const livelihoods = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(livelihoods.length, 1, id)
    assert.match(plain(livelihoods[0].en), /^Livelihood: \S/u, id)
    const occupation = plain(livelihoods[0].ko).slice(4)
    assert.notEqual(occupation, '미등록', id)
    assert.notEqual(occupation, fields.find((item) => plain(item.ko).startsWith('품계: '))?.ko.slice(4), id)
    assert.notEqual(occupation, fields.find((item) => plain(item.ko).startsWith('직함: '))?.ko.slice(4), id)
    const detailIndex = detailIndexByName.get(heading.name)
    assert.ok(detailIndex, id)
    const detailId = `person-${String(detailIndex).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-05#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 65)
})

test('all 61 issued S06 cards retain bilingual livelihoods and their original martial declarations', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-06.json', import.meta.url), 'utf8'))
  const markdown = renderLoreMarkdown(document, 'ko')
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const matches = registry.persons.filter((person) => person.name === heading.name)
    assert.equal(matches.length, 1, heading.name)
    const id = matches[0].id
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const occupation = plain(occupations[0].ko).slice(4)
    assert.ok(occupation && occupation !== '미등록', id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S06'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S06', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-06#'), id)
    await assertMartialSource(detail, id)
  }
  assert.equal(seen.size, 61)
})

test('all 61 issued S07 K IDs retain sourced bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-07.json', import.meta.url), 'utf8'))
  const markdown = renderLoreMarkdown(document, 'ko')
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const matches = registry.persons.filter((person) => person.name === heading.name)
    assert.equal(matches.length, 1, heading.name)
    const id = matches[0].id
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.flatMap((item) => [...plain(item.ko).matchAll(/(?:^|\n)-?\s*생업: ([^\n]+)/gu)].map((match) => match[1]))
    assert.equal(occupations.length, 1, id)
    const occupation = occupations[0]
    assert.ok(occupation && occupation !== '미등록', id)
    assert.ok(fields.some((item) => /(?:^|\n)-?\s*Livelihood: \S/u.test(plain(item.en))), id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S07'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S07', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-07#'), id)
    await assertMartialSource(detail, id)
  }
  assert.equal(seen.size, 61)
})

test('all 61 issued S08 K IDs retain sourced bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-08.json', import.meta.url), 'utf8'))
  const markdown = renderLoreMarkdown(document, 'ko')
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const matches = registry.persons.filter((person) => person.name === heading.name)
    assert.equal(matches.length, 1, heading.name)
    const id = matches[0].id
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.flatMap((item) => [...plain(item.ko).matchAll(/(?:^|\n)-?\s*생업: ([^\n]+)/gu)].map((match) => match[1]))
    assert.equal(occupations.length, 1, id)
    const occupation = occupations[0]
    assert.ok(occupation && occupation !== '미등록', id)
    assert.ok(fields.some((item) => /(?:^|\n)-?\s*Livelihood: \S/u.test(plain(item.en))), id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S08'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S08', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-08#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('all 62 issued S09 K IDs retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-09.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const matches = registry.persons.filter((person) => person.name === heading.name)
    assert.equal(matches.length, 1, heading.name)
    const id = matches[0].id
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const occupation = plain(occupations[0].ko).slice(4)
    assert.ok(occupation && occupation !== '미등록', id)
    const title = fields.find((item) => plain(item.ko).startsWith('직함: '))
    const rank = fields.find((item) => plain(item.ko).startsWith('품계: '))
    assert.notEqual(occupation, plain(title.ko).slice(4).split('\n')[0], id)
    assert.notEqual(occupation, plain(rank.ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S09'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S09', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-09#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S10 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-10.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupation = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupation.length, 1, id)
    assert.match(plain(occupation[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupation[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S10')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-10#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S11 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-11.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S11')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-11#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('S12 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-12.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S12')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-12#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S13 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-13.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S13')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-13#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S14 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-14.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S14')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-14#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
  const core = JSON.parse(await readFile(new URL('../lore/characters/Core-Characters.json', import.meta.url), 'utf8'))
  const coreTak = core.content.find((block) => block.anchor === '탁서윤-p3')
  assert.match(plain(coreTak.text.ko), /생업 별명은 ([^.]+)\./u)
  const takDetail = JSON.parse(await readFile(new URL('../public/person-details/person-1006.json', import.meta.url), 'utf8'))
  assert.equal(takDetail.name, '탁서윤')
  assert.equal(takDetail.occupation, plain(coreTak.text.ko).match(/생업 별명은 ([^.]+)\./u)[1])
  await assertMartialSource(takDetail, 'K1006')
})

test('S15 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-15.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S15')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-15#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('S16 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-16.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S16')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-16#'), id)
    await assertMartialSource(detail, id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('person detail page renders tables and the canonical prose sections', async () => {
  const supported = ['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입']
  const details = await Promise.all(['person-0001', 'person-0002', 'person-1009'].map(async (id) =>
    JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))))
  assert.deepEqual(new Set(details.flatMap((detail) => Object.keys(detail.sections))), new Set(supported))
  for (const detail of details) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(PersonDetailContent, { detail, personId: detail.id })))
    assert.ok(html.includes(`data-person-id="${detail.id}"`), detail.id)
    assert.ok(html.includes('<h2>기본 정보</h2>'), detail.id)
    assert.ok(html.includes('<h2>가치관</h2>'), detail.id)
    assert.ok(html.includes('<h2>욕망</h2>'), detail.id)
    assert.ok(html.includes('<h2>정본 상세</h2>'), detail.id)
    for (const label of Object.keys(detail.sections)) {
      assert.ok(html.includes(`<h3>${label}</h3>`), `${detail.id}:${label}`)
    }
  }
  const missing = renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(PersonDetailContent, {
      detail: { ...details[0], sections: { 무공: '', 야망: '목표' } }, personId: details[0].id,
    })))
  assert.ok(!missing.includes('<h3>무공</h3>'))
  assert.ok(missing.includes('<h3>야망</h3>'))

  for (const [id, name] of [['person-1003', '조재표'], ['person-1004', '이연']]) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
    const card = await selectedCard(name)
    const formation = card.body.match(/\*\*호위 대열\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*:::|$)/u)?.[1]?.trim()
    assert.ok(formation, id)
    assert.equal(detail.sections['호위 대열'], formation, id)
    const html = renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(PersonDetailContent, { detail, personId: detail.id })))
    const canonical = html.split('<summary>정본 카드 원문 전체</summary>')[0]
    assert.ok(canonical.includes(`<h3>호위 대열</h3><p>${formation}</p>`), id)
    assert.ok(!canonical.includes('<h3>무공</h3>'), id)
  }
})

test('Jo Jaepyo has the landing formation without an invented Marine Corps service record', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1003.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '조재표')
  assert.ok(detail.sections['호위 대열'])
  assert.equal(detail.sections['무공'], undefined)
  assert.doesNotMatch(detail.sections['호위 대열'], /해병대 복무|총기 접근/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-조재표')
})

test('Lee Yeon has the escort formation without invented firearm access or service', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1004.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '이연')
  assert.ok(detail.sections['호위 대열'])
  assert.equal(detail.sections['무공'], undefined)
  assert.doesNotMatch(detail.sections['호위 대열'], /총기 접근|복무 이력/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-이연')
})

test('Min Woonggi practices judo separately from his repair trade', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1008.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '민웅기')
  assert.match(detail.sections['무공'], /^유도\./u)
  assert.doesNotMatch(detail.sections['무공'], /징집 이력|무기·탄약 접근/u)
  assert.doesNotMatch(detail.sections['무공'], /공동 서사|조재표와 이연/u)
  assert.doesNotMatch(detail.biography, /공동 서사|왜 따르는가/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-민웅기')
})

test('Shin Jongmok has an opening objective grounded in his return-net work', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1009.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '신종목')
  assert.ok(detail.sections['야망'])
  assert.equal(detail.sourceRoute, '/world/Core-Characters#신종목')
})

test('Shin Jongmok exposes the directed bayonet skill without inferred equipment or rank', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/characters/Core-Characters.json', import.meta.url), 'utf8'))
  const martial = source.content.find((block) => block.anchor === '신종목-p4')
  assert.equal(martial.text.ko.map((run) => run.text).join(''), '무공. 총검술.')
  assert.equal(martial.text.en.map((run) => run.text).join(''), 'Martial path. Bayonet fighting.')
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1009.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '신종목')
  assert.equal(detail.sections['무공'], '총검술.')
  assert.match(detail.biography, /\*\*무공\.\*\* 총검술\./u)
  assert.doesNotMatch(detail.biography, /\*\*무공\.\*\* 없음\. 생업만\./u)
  assert.equal(detail.sourceRoute, '/world/Core-Characters#신종목')
})

test('Kim Yeongyu has an opening objective without claiming approval', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1007.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '김연규')
  assert.ok(detail.sections['야망'])
  assert.equal(detail.sourceRoute, '/world/Core-Characters#김연규')
})

test('K998 keeps his detail route after relocation to the First Branch Workshop', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0998.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '이일섭')
  assert.equal(detail.state, 'S02')
  assert.equal(detail.title, '제1분공방 이씨 가문 후계')
  assert.equal(detail.rank, '이사')
  assert.equal(detail.commonTier, 'T3')
  assert.equal(detail.occupation, '제1분공방 차량기지 밭 경작·곡물 재고 관리')
  assert.equal(detail.sourceRoute, '/world/Cast-State-02#인물-이일섭')
  assert.equal(detail.fields.기여자, '[islee23520](https://github.com/islee23520)')
  assert.deepEqual(detail.relations, { outgoing: [], incoming: [] })
  assert.doesNotMatch(detail.biography, /아관사|구의|고서준|곽민재|하윤목|원장 서기/)
})
