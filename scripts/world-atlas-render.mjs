import { getGroupDossierPath, PROJECTION_PATHS_BY_KIND, STATE_BY_ID } from './world-atlas-schema.mjs'

// Generator-owned wording. Atlas values carry their own EN/KO; these labels frame them in each locale.
const L = (ko, en) => ({ en, ko })
const BESTIARY_KINDS = {
  'common-organism': L('공통종', 'Common species'),
  'mutant-organism': L('변이종', 'Mutant species'),
  machine: L('기계 기종', 'Machine type'),
  'biomechanical-organism': L('생체기계 변이', 'Biomechanical variant'),
  'infected-person': L('감염자', 'Infected person'),
  person: L('사람', 'Person'),
  humanoid: L('인간형', 'Humanoid'),
  habitat: L('서식 거점·시설', 'Habitat site or facility'),
  event: L('군집 현상', 'Swarm phenomenon'),
}
const BESTIARY_FORMATIONS = {
  single: L('독립 개체', 'Single individual'),
  group: L('무리·부대', 'Pack or unit'),
  site: L('고정 거점', 'Fixed site'),
  event: L('사건·현상', 'Event or phenomenon'),
}
const GROUP_CATEGORIES = {
  'animal-urban': L('도시 동물', 'Urban animals'),
  'humanoid-mutant': L('인체 변이·공생', 'Human mutation and symbiosis'),
  'rogue-robot': L('잔존 자동 기계', 'Surviving automatic machines'),
  biomechanical: L('생체기계·시설 생태', 'Biomechanical and facility ecology'),
  infected: L('감염자', 'The infected'),
  human: L('적대 사람 집단', 'Hostile human groups'),
}
// Schema tokens that are Korean words; their English wording lives here, not in the atlas.
export const OBLIGATION_TARGETS = Object.freeze({ 시민: L('시민', 'citizens') })
export const RUMOR_TIERS = Object.freeze({ 확인: L('확인', 'confirmed'), 보류: L('보류', 'withheld'), 전언: L('전언', 'hearsay') })
const ATLAS_SOURCE = 'lore/World-Narrative-Atlas.json'

// Mirrors WorldBlocks.tsx headingId so projection fragments resolve in the rendered page.
function headingId(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
}

// A part is a machine string or number (same in both locales), a localized {en, ko} value
// (string or run array per locale), a run, or an array of parts.
function runs(part, locale) {
  if (part === null || part === undefined) return []
  if (typeof part === 'string' || typeof part === 'number') return [{ text: String(part) }]
  if (Array.isArray(part)) return part.flatMap((item) => runs(item, locale))
  if ('en' in part && 'ko' in part) return runs(part[locale], locale)
  if (typeof part.text === 'string') return [part]
  throw new Error(`E_ATLAS_RENDER: unsupported text part ${JSON.stringify(part)}`)
}

function compact(list, map = (text) => text) {
  const out = []
  for (const run of list) {
    const next = { ...run, text: map(run.text) }
    if (!next.text) continue
    const last = out.at(-1)
    if (last && Object.keys(last).length === 1 && Object.keys(next).length === 1) last.text += next.text
    else out.push(next)
  }
  if (out.length === 0) return ''
  return out.length === 1 && Object.keys(out[0]).length === 1 ? out[0].text : out
}

const text = (...parts) => ({ en: compact(runs(parts, 'en')), ko: compact(runs(parts, 'ko')) })
// Table cells keep one line, as the Markdown projection did.
const cell = (...parts) => {
  const lines = (value) => value.replace(/\n+/g, ' / ')
  const [en, ko] = ['en', 'ko'].map((locale) => compact(runs(parts, locale), lines))
  const trim = (value) => typeof value === 'string' ? value.trim() : value
  return { en: trim(en), ko: trim(ko) }
}
function join(values, separator) {
  return values.flatMap((value, index) => index === 0 ? [value] : [separator, value])
}
const localized = (value, locale) => compact(runs(value, locale))
const link = (label, domain, slug, anchor) => ({
  en: [{ text: localized(label, 'en'), link: { domain, slug, ...(anchor ? { anchor } : {}) } }],
  ko: [{ text: localized(label, 'ko'), link: { domain, slug, ...(anchor ? { anchor } : {}) } }],
})

// A multi-paragraph atlas value keeps its paragraph boundaries: the first paragraph stays in the
// list item and each following paragraph becomes its own block, as the Markdown projection read.
function paragraphs(leaf) {
  const split = (value) => typeof value === 'string' ? value.split(/\n\s*\n/u) : [value]
  const [en, ko] = [split(leaf.en), split(leaf.ko)]
  if (en.length !== ko.length) throw new Error(`E_ATLAS_RENDER: EN/KO paragraph counts differ: ${JSON.stringify(leaf).slice(0, 120)}`)
  return ko.map((value, index) => ({ en: en[index], ko: value }))
}

function contentBuilder(slug) {
  const content = []
  let index = 0
  const anchor = (kind) => `${slug}-${kind}-${String(++index).padStart(4, '0')}`
  return {
    content,
    heading(depth, value, publicAnchors = []) {
      content.push({ kind: 'heading', depth, anchor: anchor('heading'), text: value, ...(publicAnchors.length ? { publicAnchors } : {}) })
    },
    paragraph(value) { content.push({ kind: 'paragraph', anchor: anchor('paragraph'), text: value }) },
    list(items) {
      let pending = []
      const flush = () => {
        if (pending.length) content.push({ kind: 'list', anchor: anchor('list'), items: pending })
        pending = []
      }
      for (const item of items) {
        const [first, ...rest] = paragraphs(item)
        pending.push(first)
        if (rest.length === 0) continue
        flush()
        for (const value of rest) this.paragraph(value)
      }
      flush()
    },
    table(columns, rows) { if (rows.length) content.push({ kind: 'table', anchor: anchor('table'), columns, rows }) },
    // Owned atlas prose is copied block for block; the projection gives each copy its own anchor.
    nodes(nodes = []) {
      for (const node of nodes) {
        const { publicAnchors, anchor: _anchor, ...rest } = node
        content.push({ ...rest, anchor: anchor(node.kind) })
      }
    },
  }
}

function stateLabel(atlas, id) {
  const name = (atlas.humans ?? []).find((human) => human.state_id === id)?.state_name
  if (name) return text(id, ' ', name)
  return STATE_BY_ID[id] ? text(id, ' ', STATE_BY_ID[id].name) : text(id)
}
const states = (atlas, ids = []) => join(ids.map((id) => stateLabel(atlas, id)), ', ')

function preamble(atlas, slug, fallbackTitle) {
  const page = atlas.projection_pages?.[slug] ?? {}
  const b = contentBuilder(slug)
  b.heading(1, text(page.title ?? fallbackTitle))
  if (page.intro) b.paragraph(text(page.intro))
  if (page.banner) b.paragraph(text(page.banner))
  return b
}

export function renderHouses(atlas) {
  const b = preamble(atlas, 'Operating-Houses', L('운영 조직', 'Operating Organizations'))
  for (const house of atlas.houses ?? []) {
    b.heading(2, text(house.id, ' · ', house.display_name))
    b.list([
      text(L('분류', 'Class'), ': ', house.house_class),
      text(L('상태', 'Status'), ': ', house.status),
      text(L('출처층', 'Source layer'), ': ', house.source_kind),
      text(L('연결 국가', 'Linked states'), ': ', states(atlas, house.states)),
      text(L('전속 국가', 'Exclusive states'), ': ', L('없음', 'None')),
      ...(house.ai_stewardship?.accountable_human ? [text(L('관리', 'Steward'), ': ', house.ai_stewardship.accountable_human)] : []),
    ])
    b.nodes(house.prose)
    b.heading(3, text(L('3막', 'Three acts')))
    b.list((house.arcs ?? []).map((arc) => text(L(`${arc.act}막 `, `Act ${arc.act}, `), arc.title, ': ', arc.summary)))
  }
  return b.content
}

export function renderTheaters(atlas) {
  const b = preamble(atlas, 'External-Theaters', L('외부전구', 'External Theaters'))
  for (const theater of atlas.theaters ?? []) {
    b.heading(2, text(theater.id, ' · ', theater.display_name))
    b.list([
      text(theater.reader_description),
      text(L('연결 국가', 'Linked states'), ': ', states(atlas, theater.states)),
    ])
    b.nodes(theater.prose)
    const route = theater.seoul_route
    if (route) {
      b.heading(3, text(L('서울 쪽 경로', 'Seoul-side route')))
      b.list([
        text(L('확인된 지리', 'Verified geography'), ': ', route.verified_geography),
        text(L('준비 거점', 'Staging nodes'), ': ', join(route.staging_nodes ?? [], ' → ')),
        text(L('바깥 경계', 'Outbound boundary'), ': ', route.outbound_boundary),
        text(L('이동 시간', 'Travel time'), ': ', route.fixed_duration),
      ])
    }
    const travel = theater.travel_constraints
    if (travel) {
      b.heading(3, text(L('이동·계절', 'Travel and seasons')))
      b.list([
        text(L('계절 조건', 'Seasonal conditions'), ': ', join(travel.seasonal_conditions ?? [], ' / ')),
        text(L('중단 조건', 'Suspension conditions'), ': ', join(travel.suspension_conditions ?? [], ' / ')),
        text(L('기록 원칙', 'Recording rule'), ': ', travel.rule),
      ])
    }
    if (theater.supply_chain) {
      b.heading(3, text(L('공급·검문', 'Supply and checkpoints')))
      b.list([
        ...(theater.supply_chain.flows ?? []).map((flow) => text(flow.kind, ' · ', flow.contents, ': ', flow.handoff_rule)),
        text(L('분리 원칙', 'Separation rule'), ': ', theater.supply_chain.separation_rule),
        ...(theater.checkpoints ?? []).map((checkpoint) => text(checkpoint.id, ' · ', checkpoint.place, ': ', checkpoint.function, ' / ', join(checkpoint.checks ?? [], ', '))),
      ])
    }
    const language = theater.language_rumor_protocol
    if (language) {
      b.heading(3, text(L('언어·소문', 'Language and rumor')))
      b.list([
        text(L('기록 언어', 'Record language'), ': ', language.record_language),
        text(L('통역 원칙', 'Interpreter rule'), ': ', language.interpreter_rule),
        ...(language.rumor_reliability ?? []).map((row) => text(RUMOR_TIERS[row.tier] ?? row.tier, ': ', row.rule)),
        text(L('금지 추론', 'Prohibited inference'), ': ', language.prohibited_inference),
      ])
    }
    b.heading(3, text(L('16국 이해', 'Interests of the sixteen states')))
    b.list((theater.state_interests ?? []).map((row) => text(stateLabel(atlas, row.state_id), ': ', row.interest,
      L(' / 지렛대 ', ' / leverage: '), row.leverage, L(' / 넘지 않는 선 ', ' / red line: '), row.red_line)))
    b.heading(3, text(L('생태 압력', 'Ecological pressure')))
    b.list((theater.hostile_ecology_interaction ?? []).map((row) => text(row.group_id, ': ', row.interaction,
      L(' / 대응 ', ' / response: '), row.operational_response, L(' / 비살상 제약 ', ' / nonlethal constraint: '), row.nonlethal_constraint)))
    const opening = theater.opening_event
    if (opening) {
      b.heading(3, text(L('개막 2126', 'Opening 2126')))
      b.list([
        text(L('사건', 'Event'), ': ', opening.scenario_id),
        text(L('촉발', 'Trigger'), ': ', opening.trigger),
        text(L('충돌', 'Conflict'), ': ', opening.conflict),
        text(L('첫 판단', 'First decision'), ': ', opening.player_decision),
      ])
    }
    b.heading(3, text(L('플레이어 진입', 'Player entry')))
    b.list((theater.player_entry_points ?? []).map((entry) => text(entry.id, ' · ', entry.place, ': ', entry.role,
      L(' / 첫 판단 ', ' / first decision: '), entry.first_decision)))
    b.heading(3, text(L('명시적 미정', 'Explicit unknowns')))
    b.list((theater.explicit_unknowns ?? []).map((unknown) => text(unknown)))
    b.heading(3, text(L('시나리오 쇄', 'Scenario chains')))
    b.list((theater.scenario_chains ?? []).map((chain) => text(chain.id, ': ', chain.summary)))
  }
  return b.content
}

export function renderSynthetics(atlas) {
  const b = preamble(atlas, 'Synthetic-Actors', L('합성 사회 인격', 'Synthetic Social Personas'))
  for (const actor of atlas.synthetics ?? []) {
    b.heading(2, text(actor.id, ' · ', actor.display_name, ' (', actor.callsign, ')'))
    b.list([
      text(L('급', 'Class'), ': ', actor.cls),
      text(L('기체', 'Body platform'), ': ', actor.body_platform),
      text(L('보관·법적 지위', 'Custody and legal status'), ': ', actor.custody_legal),
      text(L('기억 연속', 'Memory continuity'), ': ', actor.memory_continuity),
      text(L('에너지·부품', 'Energy and parts'), ': ', actor.energy_parts),
      text(L('정비', 'Maintenance'), ': ', actor.maintenance),
      text(L('망·안전', 'Network and safety'), ': ', actor.network_safety),
      text(L('창발 목표', 'Emergent goal'), ': ', actor.emergent_goal),
      text(L('일탈·회복', 'Divergence and recovery'), ': ', actor.divergence_recovery),
      text(L('관계', 'Relations'), ': ', join((actor.relations ?? []).map((relation) => `${relation.target} ${relation.kind}`), ', ')),
    ])
    b.nodes(actor.prose)
  }
  return b.content
}

const scenarioAnchor = (scenario) => headingId(`${scenario.id} · ${localized(scenario.title, 'ko')}`)

function scenarioOutline(b, scenario, publicAnchors = []) {
  b.heading(3, text(scenario.id, ' · ', scenario.title), publicAnchors)
  b.list([
    text(L('단계', 'Stage'), ': ', scenario.stage),
    text(L('촉발', 'Trigger'), ': ', scenario.trigger),
    text(L('관련 세력', 'Actors'), ': ', join(scenario.actors ?? [], ', ')),
    text(L('생태 기제', 'Ecological mechanism'), ': ', scenario.mechanism),
    text(L('선택지', 'Choices'), ': ', join(scenario.choices ?? [], ' / ')),
    text(L('결과', 'Outcomes'), ': ', scenario.outcomes),
    text(L('도덕 비용', 'Moral cost'), ': ', scenario.moral_cost),
    text(L('원본 항목', 'Source dossier'), ': ', scenario.dossier_ref),
  ])
}

export function renderHostileIndex(atlas) {
  const b = preamble(atlas, 'Hostile-Ecology-Index', L('서울 생태·변이 도감', 'Seoul Ecology and Variant Bestiary'))
  b.paragraph(text(L(
    '같은 서식권에 사는 공통종과 특수 변이를 구분해 읽습니다. 기계 기종, 고정 시설과 군집 현상은 생물 종과 따로 표시합니다.',
    'Common species and special variants that share a habitat are read apart. Machine types, fixed sites and swarm phenomena are marked separately from living species.',
  )))
  const entries = Object.values(atlas.monster_contents ?? {}).flatMap((content) => content.entries ?? [])
  b.table(
    [text(L('집단 도감', 'Group dossier')), text(L('생태 분류', 'Ecological class')), text(L('본문이 있는 항목', 'Entries with text'))],
    (atlas.hostile_groups ?? []).map((group) => [
      cell(link(text(group.id, ' · ', group.display_name), 'bestiary', `groups/Hostile-Group-${group.id}`)),
      cell(GROUP_CATEGORIES[group.category] ?? ''),
      cell(entries.filter((entry) => entry.group_id === group.id).length),
    ]),
  )
  for (const group of atlas.hostile_groups ?? []) {
    b.heading(2, text(group.id, ' · ', group.display_name))
    const scenarios = (group.scenario_outlines ?? []).length > 0
      ? group.scenario_outlines.map((scenario) => link(scenario.id, 'bestiary', `groups/Hostile-Group-${group.id}`, scenarioAnchor(scenario)))
      : group.scenario_links ?? []
    b.list([
      text(L('현대 불안', 'Modern anxiety'), ': ', group.modern_anxiety),
      text(L('허구 기원', 'Fictional origin'), ': ', group.fictional_origin),
      text(L('영역', 'Territory'), ': ', group.territory_migration),
      text(L('경제', 'Economy'), ': ', group.economy),
      text(L('생애', 'Life cycle'), ': ', group.lifecycle),
      ...(group.adaptation ? [text(L('장기 적응', 'Long-term adaptation'), ': ', group.adaptation)] : []),
      text(L('감각', 'Senses'), ': ', group.senses),
      text(L('위계', 'Hierarchy'), ': ', group.hierarchy),
      text(L('연결', 'Links'), ': ', JSON.stringify(group.links)),
      text(L('상승 1-3', 'Escalation 1-3'), ': ', group.escalation),
      text(L('교전', 'Combat'), ': ', group.combat_counterplay),
      text(L('교섭', 'Negotiation'), ': ', group.negotiation),
      text(L('도덕 비용', 'Moral cost'), ': ', group.moral_cost),
      text(L('시나리오', 'Scenarios'), ': ', join(scenarios, ', ')),
    ])
    for (const scenario of group.scenario_outlines ?? []) scenarioOutline(b, scenario)
  }
  return b.content
}

export function renderChronology(atlas) {
  const b = preamble(atlas, 'Regional-Physical-AI-Arcs', L('권역·피지컬 AI 서사선', 'Regional and Physical AI Arcs'))
  for (const arc of atlas.arcs ?? []) {
    b.heading(2, text(arc.id, ' · ', arc.title))
    b.list([
      text(L('가문', 'Houses'), ': ', join(arc.house_ids ?? [], ', ')),
      text(L('전구', 'Theaters'), ': ', join(arc.theater_ids ?? [], ', ')),
      text(L('합성급', 'Synthetic classes'), ': ', join(arc.synthetic_classes ?? [], ', ')),
      text(L('생태', 'Ecologies'), ': ', join(arc.group_ids ?? [], ', ')),
      ...(arc.acts ?? []).map((act) => text(L(`${act.act}막`, `Act ${act.act}`), ': ', act.summary)),
    ])
  }
  return b.content
}

export function renderRelationLedger(atlas) {
  const b = preamble(atlas, 'World-Relation-Ledger', L('세계 확장 관계 원장', 'World Expansion Relation Ledger'))
  b.table(
    [text(L('출발', 'From')), text(L('유형', 'Kind')), text(L('도착', 'To')), text(L('근거', 'Reason'))],
    (atlas.relations ?? []).map((relation) => [
      cell(relation.from_label ?? relation.from), cell(relation.kind), cell(relation.to_label ?? relation.to), cell(relation.reason),
    ]),
  )
  return b.content
}

export function renderExpansionIndex(atlas) {
  const b = preamble(atlas, 'World-Expansion-Index', L('세계 확장 색인', 'World Expansion Index'))
  const count = (key) => (atlas[key] ?? []).length
  b.list([
    text(L('가문 ', 'Houses '), count('houses'), L(' / 전구 ', ' / Theaters '), count('theaters'), L(' / 합성 ', ' / Synthetics '), count('synthetics')),
    text(L('사회배치 ', 'Social batches '), count('story_batches'), L(' / 생태 ', ' / Ecologies '), count('hostile_groups'), L(' / 몬스터배치 ', ' / Monster batches '), count('monster_batches')),
  ])
  b.heading(2, text(L('무소속', 'Unaffiliated')), ['무소속'])
  // Person pages are hub routes outside lore, so the cell keeps its route link as written.
  b.table(
    [text(L('캐릭터 ID', 'Character ID')), text(L('인물', 'Person'))],
    Object.entries(atlas.unaffiliated ?? {}).map(([id, person]) => [
      cell(person.character_id),
      cell('[', person.name, `](/people/person-${id.slice(1).padStart(4, '0')})`),
    ]),
  )
  return b.content
}

export function renderGroupDossier(group, entries = []) {
  const b = contentBuilder(`Hostile-Group-${group.id}`)
  b.heading(1, text(group.id, ' · ', group.display_name))
  b.paragraph(link(L('생태·변이 도감', 'Ecology and variant bestiary'), 'bestiary', 'Hostile-Ecology-Index'))
  if (group.bestiary) {
    b.heading(2, text(L('공통종과 변이종', 'Common species and variants')))
    b.paragraph(text(group.bestiary.common_ecology))
    b.paragraph(text(group.bestiary.variant_relation))
  }
  b.heading(2, text(L('생태 정보', 'Ecology')))
  b.table([text(L('항목', 'Item')), text(L('기록', 'Record'))], [
    [L('기원', 'Origin'), 'fictional_origin'], [L('서식·이동', 'Habitat and movement'), 'territory_migration'],
    [L('먹이·에너지', 'Food and energy'), 'economy'], [L('생애·정비', 'Life cycle and upkeep'), 'lifecycle'],
    [L('감각', 'Senses'), 'senses'], [L('집단 행동', 'Group behavior'), 'hierarchy'], [L('장기 적응', 'Long-term adaptation'), 'adaptation'],
  ].filter(([, key]) => group[key]).map(([label, key]) => [cell(label), cell(group[key])]))
  if (entries.length > 0) {
    b.heading(2, text(L('개체와 전장 편성', 'Individuals and battlefield formation')))
    if (group.bestiary) b.paragraph(text(group.bestiary.command_scope))
    b.table(
      [L('개체·전문', 'Individual'), L('구분', 'Type'), L('전장 단위', 'Battlefield unit'), L('전장 역할', 'Battlefield role'), L('기존 역할군', 'Former role class'), L('출처 배치', 'Source batch')].map((label) => text(label)),
      entries.map((entry) => [
        cell(link(text(entry.id, ' · ', entry.display_name), 'bestiary', `groups/Hostile-Group-${group.id}`, entry.id.toLowerCase())),
        cell(entry.bestiary ? BESTIARY_KINDS[entry.bestiary.kind] : ''),
        cell(entry.bestiary ? BESTIARY_FORMATIONS[entry.bestiary.formation] : ''),
        cell(entry.bestiary?.battlefield_role ?? ''),
        cell(entry.role_class),
        cell(entry.batchId),
      ]),
    )
    for (const entry of entries) {
      const data = entry.bestiary
      b.heading(3, text(entry.id, ' · ', entry.display_name), [entry.id.toLowerCase()])
      b.list([
        text(L('출처 배치', 'Source batch'), ': ', entry.batchId),
        text(L('기존 역할군', 'Former role class'), ': ', entry.role_class),
        text(L('연결', 'Links'), ': ', JSON.stringify(entry.links ?? {})),
      ])
      if (data) {
        b.table([text(L('도감 항목', 'Bestiary item')), text(L('기록', 'Record'))], [
          [cell(L('구분', 'Type')), cell(BESTIARY_KINDS[data.kind])],
          [cell(L('전장 단위', 'Battlefield unit')), cell(BESTIARY_FORMATIONS[data.formation])],
          [cell(L('전장 역할', 'Battlefield role')), cell(data.battlefield_role)],
          [cell(L('공통종·변이와 지휘 범위', 'Common species, variants and command scope')), cell(data.scope_note)],
        ])
      }
      b.nodes(entry.prose)
    }
  }
  b.heading(2, text(L('서식권 기록', 'Habitat record')))
  b.nodes(group.dossier_prose?.length ? group.dossier_prose : group.prose)
  if ((group.scenario_outlines ?? []).length > 0) b.heading(2, text(L('연결 시나리오', 'Linked scenarios')))
  // The index links each outline by its Korean heading fragment; EN pages keep it as an alias.
  for (const scenario of group.scenario_outlines ?? []) scenarioOutline(b, scenario, [scenarioAnchor(scenario)])
  return b.content
}

const slugOf = (path) => path.split('/').at(-1).replace(/\.json$/u, '')
const domainOf = (path) => path.startsWith('factions/') ? 'factions' : path.startsWith('bestiary/') ? 'bestiary' : 'root'
const categoryOf = (path) => path.startsWith('bestiary/') ? 'bestiary'
  : path === PROJECTION_PATHS_BY_KIND.theaters ? 'places'
    : path === PROJECTION_PATHS_BY_KIND.houses || path === PROJECTION_PATHS_BY_KIND.relationLedger ? 'factions'
      : path === PROJECTION_PATHS_BY_KIND.synthetics ? 'people-and-machines' : 'overview'

function projectionEnvelope(path, content, sourceHash, atlas, group = null, entries = []) {
  const slug = slugOf(path)
  const page = atlas.projection_pages?.[slug] ?? {}
  const title = content.find((node) => node.kind === 'heading').text
  const summary = page.summary ? text(page.summary) : title
  const sourceRefs = [ATLAS_SOURCE, group ? `data.atlas.hostile_groups[id=${group.id}]` : `data.atlas.projection_pages.${slug}`]
  const data = group ? {
    ecology: {
      description: group.bestiary?.common_ecology ?? group.prose[0]?.text ?? group.display_name,
      variants: entries.map((entry) => ({ id: entry.id, source_batch: entry.batchId })),
    },
    integration: {
      manifest: 'TOOL/tools/wiki/confirmed-integration-manifest.json',
      excluded: [{ id: 'M007', kind: 'monsters' }, { id: 'B017', kind: 'social' }, { id: 'B020', kind: 'social' }],
    },
  } : {}
  return {
    version: 1,
    domain: domainOf(path),
    id: group?.id ?? `DOC:${slug}`,
    slug,
    categories: [categoryOf(path)],
    status: 'approved',
    tense: { en: 'present', ko: 'present' },
    provenance: {
      original_anchor: ATLAS_SOURCE,
      original_hash: sourceHash,
      history: ['world-atlas-projections.v2'],
    },
    source: { kind: 'computed', refs: sourceRefs, hash: sourceHash },
    locales: {
      en: { title: title.en, summary: summary.en, tense: 'present' },
      ko: { title: title.ko, summary: summary.ko, tense: 'present' },
    },
    content,
    data,
  }
}

// Returns relative projection path -> JSON authoring envelope, built from the atlas's bilingual fields.
export function projectionsFromAtlas(document, sourceHash) {
  const atlas = document.data.atlas
  const entries = Object.entries(atlas.monster_contents ?? {}).flatMap(([batchId, content]) =>
    (content.entries ?? []).map((entry) => ({ ...entry, batchId })))
  const pages = [
    [PROJECTION_PATHS_BY_KIND.houses, renderHouses, (atlas.houses ?? []).length],
    [PROJECTION_PATHS_BY_KIND.theaters, renderTheaters, (atlas.theaters ?? []).length],
    [PROJECTION_PATHS_BY_KIND.synthetics, renderSynthetics, (atlas.synthetics ?? []).length],
    [PROJECTION_PATHS_BY_KIND.hostileIndex, renderHostileIndex, (atlas.hostile_groups ?? []).length],
    [PROJECTION_PATHS_BY_KIND.chronology, renderChronology, (atlas.arcs ?? []).length],
    [PROJECTION_PATHS_BY_KIND.relationLedger, renderRelationLedger, (atlas.relations ?? []).length],
    [PROJECTION_PATHS_BY_KIND.expansionIndex, renderExpansionIndex, (atlas.arcs ?? []).length],
  ]
  const output = {}
  for (const [path, render, present] of pages) {
    if (present) output[path] = projectionEnvelope(path, render(atlas), sourceHash, atlas)
  }
  // Story-batch and monster-batch pages are retired; their registries remain inside the atlas.
  for (const group of atlas.hostile_groups ?? []) {
    const groupEntries = entries.filter((entry) => entry.group_id === group.id)
    const path = getGroupDossierPath(group.id)
    output[path] = projectionEnvelope(path, renderGroupDossier(group, groupEntries), sourceHash, atlas, group, groupEntries)
  }
  return output
}
