import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, resolve } from 'node:path'
import { currentOfficeAppointments, loadPersonDetailSources, loadPersonHoldingsContext,
  projectPersonStateInputs, produceFromPersonDetailSources } from './person-detail-inputs.mjs'
import { preservedPersonalTier } from './person-detail-production.mjs'
import { authenticatePersonalTierProvenance, assertPersonalTierPreservation, PERSONAL_TIER_PRESERVATION_IDS } from './personal-tier-provenance.mjs'
import { loadApprovedOrganizationAliases } from './approved-organization-aliases.mjs'

test('authenticated personal tiers preserve all 1022 baseline projections and the exact 83 identities', async () => {
  const root = new URL('../', import.meta.url).pathname
  const sources = await loadPersonDetailSources({ repoRoot: root })
  const preservation = sources.personalTierPreservation
  assertPersonalTierPreservation(preservation)
  assert.equal(preservation.size, 83)
  assert.deepEqual([...preservation.keys()].sort(), [...PERSONAL_TIER_PRESERVATION_IDS].sort())
  const organizationAliases = await loadApprovedOrganizationAliases(root)
  const state = projectPersonStateInputs(sources.renderedBySlug, sources.pagesBySlug, { organizationAliases })
  const appointments = currentOfficeAppointments(sources.officeAppointmentSource, sources.issuedById)
  const appointmentBefore = structuredClone(sources.officeAppointmentSource)
  const context = await loadPersonHoldingsContext(sources, { repoRoot: root, ...state })
  const result = await produceFromPersonDetailSources(sources, { ...state, personalHoldings: context.personalHoldings, officeAppointments: appointments })
  assert.equal(result.personDetails.length, 1022)
  const { stdout: commonDir } = await promisify(execFile)('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'])
  const baselineBytes = await readFile(resolve(dirname(commonDir.trim()), '.omo/private/seoul-migration/baseline.json'))
  assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223')
  const baseline = JSON.parse(baselineBytes)
  const originals = baseline.files.filter(row => /^public\/person-details\/person-\d+\.json$/u.test(row.path))
  assert.equal(originals.length, 1022)
  const projected = new Map(result.personDetails.map(row => [row.characterId, row]))
  const mismatches = []
  for (let offset = 0; offset < originals.length; offset += 16) {
    await Promise.all(originals.slice(offset, offset + 16).map(async ref => {
      const { stdout } = await promisify(execFile)('git', ['-C', root, 'show', baseline.baseCommit + ':' + ref.path], { encoding: 'buffer', maxBuffer: 1024 * 1024 })
      assert.equal(createHash('sha256').update(stdout).digest('hex'), ref.sha256)
      const old = JSON.parse(stdout), current = projected.get(old.characterId)
      if (!current || current.id !== old.id || current.name !== old.name || current.state !== old.state || current.commonTier !== old.commonTier) mismatches.push(old.characterId)
    }))
  }
  assert.deepEqual(mismatches, [])
  for (const [id, row] of preservation) {
    const detail = projected.get(id)
    assert.equal(detail.commonTier, row.commonTier)
    assert.equal(detail.rank, '미등록')
    assert.equal(appointments.has(id), false)
  }
  const k157 = projected.get('K157')
  assert.equal(k157.fields['공무원 직위·직급'], '없음')
  assert.equal(k157.fields['생업 역할'], '서울역 대합실 역장')
  assert.equal(appointments.size, 95)
  assert.deepEqual(sources.officeAppointmentSource, appointmentBefore)
  for (const [id, appointment] of appointments) {
    const detail = projected.get(id)
    assert.deepEqual([detail.position, detail.rank, detail.commonTier], [appointment.position, appointment.rank, appointment.commonTier])
  }
}, 30000)

test('authenticated personal tier input rejects missing maps and substituted identities or source blocks', async () => {
  const root = new URL('../', import.meta.url).pathname
  const preservation = await authenticatePersonalTierProvenance(root)
  const envelope = JSON.parse(await readFile(new URL('../lore/characters/Cast-State-06.json', import.meta.url), 'utf8'))
  const input = { personId: 'K157', publicId: 'person-0158', name: '설다흰', stateId: 'S06', source: 'Cast-State-06', envelope }
  assert.equal(preservedPersonalTier(input, preservation), 'T4')
  for (const map of [undefined, new Map(), new Map([...preservation].slice(1))]) {
    assert.throws(() => preservedPersonalTier(input, map), /E_PERSON_TIER_PRESERVATION_MAP/)
  }
  for (const change of [{ personId: 'K999' }, { publicId: 'person-0001' }, { name: '다른 인물' }, { stateId: 'S01' },
    { source: 'Core-Characters' }, { appointment: { commonTier: 'T4' } }, { envelope: {} }]) {
    assert.throws(() => preservedPersonalTier({ ...input, ...change }, preservation), /E_PERSON_TIER_PRESERVATION_BINDING/)
  }
  const changed = structuredClone(envelope)
  changed.content.find(block => block.anchor === '인물-설다흰-list2').items[2].ko = '공무원 직위·직급: 국장'
  assert.throws(() => preservedPersonalTier({ ...input, envelope: changed }, preservation), /E_PERSON_TIER_PRESERVATION_BINDING/)
  assert.throws(() => assertPersonalTierPreservation(new Map(preservation)), /E_PERSON_TIER/)
})

test('all registered people have a common T1-T5 tier', async () => {
  const root = new URL('../public/person-details/', import.meta.url)
  const files = (await readdir(root)).filter((name) => name.endsWith('.json'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  assert.equal(files.length, registry.persons.length)
  for (const file of files) {
    const person = JSON.parse(await readFile(new URL(file, root), 'utf8'))
    assert.match(person.commonTier, /^T[1-5]$/u, file)
  }
})

test('people page filters by common tier and not by position', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /공통 티어/)
  assert.match(page, /commonTier/)
  assert.doesNotMatch(page, /직위<select/)
})

test('typed current appointments retain every person and personal tier without reviving historical offices', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/relations/opening-office-appointments.json', import.meta.url), 'utf8'))
  const appointments = source.appointments
  const people = JSON.parse(await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), 'utf8')).people
  const current = currentOfficeAppointments(source, new Map(people.map(person => [person.id, person])))
  const projected = people.map(person => ({ ...person, ...(current.get(person.id) ?? {}) }))
  assert.equal(appointments.length, 95)
  assert.equal(current.size, 95)
  assert.equal(projected.length, 1022)
  assert.deepEqual(projected.map(person => person.id), people.map(person => person.id))
  const allocation = JSON.parse(await readFile(new URL('../lore/relations/opening-feudal-allocation.json', import.meta.url), 'utf8'))
  const retained = appointments.filter(row => row.current.status === 'retained-office')
  assert.equal(retained.length, 15)
  assert.equal(appointments.filter(row => row.current.status === 'unappointed').length, 3)
  for (const row of appointments) {
    const person = people.find(person => person.id === row.personId)
    assert.ok(person)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${person.url.split('/').pop()}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.characterId, row.personId)
    assert.equal(detail.commonTier, row.history.commonTier)
    const projection = current.get(row.personId)
    assert.equal(projection.position, row.current.position?.ko ?? '')
    assert.equal(projection.rank, row.current.rank?.ko ?? '')
    assert.equal(projection.commonTier, row.history.commonTier)
    assert.equal(row.history.personId, row.personId)
    assert.equal(row.history.stateId, row.stateId)
    if (row.current.status === 'retained-office') {
      const rights = row.current.evidence.filter(ref => ref.kind === 'existing-right')
      assert.ok(rights.length > 0, row.personId)
      for (const ref of rights) assert.equal(allocation.titles[Number(ref.jsonPointer.split('/').pop())].holderPersonId, row.personId)
      if (row.personId !== 'K441') {
        assert.deepEqual(row.current.position, row.history.position)
        assert.deepEqual(row.current.rank, row.history.rank)
      }
    } else if (row.personId !== 'K1008') {
      assert.equal(row.current.rank, null)
      assert.ok(!/영주|공작|Territorial lord|Maritime lord|Duke/u.test(JSON.stringify(row.current.position)), row.personId)
    }
    if (row.current.status === 'unappointed') {
      assert.equal(projection.position, '')
      assert.equal(projection.rank, '')
    }
    assert.equal(detail.state, row.stateId)
    assert.equal(detail.personSheet.variants.length, 2)
    assert.ok(detail.personSheet.variants.every(variant => variant.legacy.operative === false))
  }
})


test('current appointment validation rejects ambiguous legacy, missing evidence and invented rank projections', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/relations/opening-office-appointments.json', import.meta.url), 'utf8'))
  const people = JSON.parse(await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), 'utf8')).people
  const issued = new Map(people.map(person => [person.id, person]))
  for (const mutate of [
    draft => { draft.schema = 'opening-office-appointments.v1' },
    draft => { draft.appointments[1].current.status = 'retired' },
    draft => { draft.appointments[1].current.position = draft.appointments[1].history.position },
    draft => { draft.appointments[8].current.rank = draft.appointments[8].history.rank },
    draft => { draft.appointments[8].current.commonTier = 'T1' },
    draft => { draft.appointments[8].current.evidence = [] },
    draft => { draft.appointments[8].current.status = 'retained-office'; draft.appointments[8].current.rank = draft.appointments[8].history.rank },
    draft => { draft.appointments.push(draft.appointments[0]) },
  ]) {
    const changed = structuredClone(source)
    mutate(changed)
    assert.throws(() => currentOfficeAppointments(changed, issued), /E_OPENING_OFFICE/)
  }
})
