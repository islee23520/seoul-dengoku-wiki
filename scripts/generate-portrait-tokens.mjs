// Completes a portrait design token for every published person.
// Authored values (any slot whose status is not `derived-proposal`) are never changed.
// Empty slots and earlier derived values are (re)derived from the person's published
// tier, occupation, gender, age, and lineage, and are marked `derived: true` so they
// stay distinguishable from owner-authored or source-backed appearance.
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatorStage, requireGenerationPublication } from './generate-release.mjs'
import { textToImageBlock } from '../server/portrait-text-to-image.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPortraitGenderInputs } from './cast-sqlite/portrait-gender-input.mjs'
import { readPortraitFamilyInputs } from './cast-sqlite/portrait-family-input.mjs'
import { readPersonDisposition } from './cast-sqlite/person-disposition.mjs'

export async function generatePortraitTokens(root) {
  const { root: stageRoot, writeFile } = await generatorStage(root)
  const tokenRoot = resolve(stageRoot, 'public/portrait-tokens')
  const detailRoot = resolve(stageRoot, 'public/person-details')
  const DERIVED = 'derived-proposal'
  const DERIVED_DATE = '20261019'

  const tokenDatabasePath = process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite')
  const genders = (() => {
      const db = openReadOnly(tokenDatabasePath)
      try { return readPortraitGenderInputs(db) } finally { db.close() }
    })()
  const familyByPerson = (() => {
      const db = openReadOnly(tokenDatabasePath)
      try { return readPortraitFamilyInputs(db) } finally { db.close() }
    })()

  const pick = (personId, key, list) => list[createHash('sha256').update(`${personId}:${key}`).digest().readUInt32BE(0) % list.length]
  const derived = (value, basis) => ({ value, status: DERIVED, source: `derived-${DERIVED_DATE}:${basis}`, derived: true })

  const has = (text, pattern) => pattern.test(text)
  function roleOf(detail) {
    const text = `${detail.occupation ?? ''} ${detail.position ?? ''} ${detail.title ?? ''}`
    if (detail.commonTier === 'T1' || detail.commonTier === 'T2') return 'leader'
    if (has(text, /처방|의무|방역|의료|간호|치료|진료|약제|약방/)) return 'medic'
    if (has(text, /경비|순찰|호송|수비|경계|위병|방위|검문|초소|경호|병력|대장/)) return 'guard'
    if (has(text, /정비|수리|설비|기관|전력|발전|공구|배관|공동구|차량|선로|기술/)) return 'mechanic'
    if (has(text, /경작|밭|농|곡물|채소|재배|양식|사육|버섯/)) return 'farmer'
    if (has(text, /전령|전갈|연락|배달|운송|탐사/)) return 'messenger'
    if (has(text, /상인|교역|환전|시장|중개|거래|판매|상점|통역/)) return 'merchant'
    if (has(text, /장경|총림|사제|예배|의례|추모|신앙|종교|경전|성당|교회/)) return 'religious'
    if (has(text, /기록|장부|명부|필사|서기|인계|열쇠|문서|인준|등기|회계|금고|재고/)) return 'records'
    return 'duty'
  }
  const surfaceExposed = (detail) => has(`${detail.occupation ?? ''} ${detail.position ?? ''}`, /순찰|호송|탐사|경작|밭|능선|교량|전령|운송|정찰|수색|채집|지상|외곽|교역|농/)

  function heritageOf(detail) {
    const community = detail.fields?.['출신 공동체'] ?? ''
    const pairs = [[/아프리카계 미국인/, 'Korean and African-American mixed heritage', /한국계/], [/중국동포/, 'Chinese-Korean (Joseonjok) heritage'], [/베트남/, 'Vietnamese heritage'], [/아랍|이라크/, 'Iraqi Arab heritage'], [/우즈베크/, 'Uzbek and Koryo-saram mixed heritage']]
    for (const [pattern, value, also] of pairs) if (pattern.test(community) && (!also || also.test(community))) return { value, basis: 'person-details.출신-공동체' }
    const family = familyByPerson.get(detail.id)
    if (!family) return null
    if (/아프리카계 미국인/.test(family.basis)) return { value: 'African-American heritage', basis: 'nonKoreanFamilyCatalog.basis' }
    const surname = family.basis.match(/^([^가-힣]+?) 가계/)?.[1]?.split(' ').at(-1) ?? ''
    if (/^(Adeyemi|Mensah|Ndiaye)$/.test(surname)) return { value: 'West African heritage', basis: 'nonKoreanFamilyCatalog.surname-lineage' }
    if (/^(Torres|García)$/.test(surname)) return { value: 'Hispanic heritage', basis: 'nonKoreanFamilyCatalog.surname-lineage' }
    return { value: 'European heritage', basis: 'nonKoreanFamilyCatalog.surname-lineage' }
  }

  const palettes = ['charcoal', 'olive drab', 'slate blue', 'khaki', 'rust brown', 'navy', 'dove grey', 'mustard ochre', 'forest green', 'burgundy', 'sand beige', 'oxblood', 'clay brown', 'cream']
  const uppers = {
    leader: { male: ['double-breasted wool suit jacket with wide peaked lapels over a high-collared shirt', 'tailored wool officer-cut tunic without insignia, belted at the waist', 'long fitted wool frock jacket over a buttoned waistcoat'], female: ['fitted 1940s wool skirt-suit jacket with padded shoulders over a silk blouse', 'tailored high-collared wool dress jacket with covered buttons', 'belted wool wrap coat-dress with a soft shawl collar'] },
    guard: ['belted canvas field jacket with flap chest pockets', 'wool service tunic without insignia, cinched by a leather belt', 'short wool battle-dress style jacket with buttoned cuffs'],
    medic: ['cotton coat over a knitted wool sweater', 'medical smock with rolled sleeves over a knit vest', 'buttoned linen work coat over a turtleneck'],
    mechanic: ['heavy canvas work coverall with rolled sleeves', 'denim chore jacket over a henley shirt', 'patched twill work jacket with reinforced elbows'],
    farmer: ['cotton work jacket with patched elbows', 'padded quilted vest over a collarless work shirt', 'rough wool knit pullover with rolled sleeves'],
    messenger: ['short belted leather courier jacket', 'wool pea jacket with a turned-up collar', 'zip-front canvas windbreaker over a knit sweater'],
    merchant: ['wool tweed jacket over a knit vest', 'long belted wool coat with deep patch pockets', 'cardigan-style knit jacket over a collared shirt'],
    religious: ['long plain wool coat with a standing collar', 'simple high-collared tunic under a long woven shawl', 'loose wool robe-like overcoat with wide sleeves'],
    records: ['wool cardigan over a collared shirt with sleeve garters', "plain single-breasted clerk's jacket with cotton oversleeves", 'buttoned wool vest over a long-sleeved collared shirt'],
    duty: ['plain wool work jacket over a collared shirt', 'knit wool sweater over a collared shirt', 'short wool jacket with a stand collar'],
  }
  const layer = (detail, surface) => surface ? ', under a heavy wool greatcoat with a raised collar for surface cold' : detail.commonTier === 'T5' ? ', with a thick knitted scarf and an extra padded layer' : detail.commonTier === 'T4' ? ', with a light knitted scarf' : detail.commonTier === 'T3' ? '' : ', in thin fine-weave fabric'
  const necklines = { leader: 'buttoned high shirt collar', guard: 'closed turn-down collar', medic: 'open coat collar over a rolled sweater neck', mechanic: 'open work collar', farmer: 'collarless round neck', messenger: 'turned-up jacket collar', merchant: 'shirt collar under a knit vest', religious: 'standing collar', records: 'buttoned shirt collar', duty: 'buttoned shirt collar' }
  const lowers = {
    work: ['canvas work trousers tucked into boots', 'heavy twill trousers with knee patches', 'wool trousers bloused over boots'],
    male: ['straight wool trousers', 'high-waisted pleated trousers', 'wool breeches with buttoned cuffs'],
    female: ['A-line mid-calf wool skirt over thick stockings', 'high-waisted wide-leg wool trousers', 'straight wool trousers', 'pleated knee-length wool skirt over thick stockings'],
  }
  const footwears = { leader: ['polished leather oxford shoes', 'polished leather knee boots'], guard: ['lace-up leather combat boots'], mechanic: ['steel-toe leather work boots'], farmer: ['rubber-soled leather work boots'], messenger: ['worn leather ankle boots'], merchant: ['laced leather walking shoes'], religious: ['soft leather slip-on shoes'], medic: ['laced leather walking shoes'], records: ['laced leather walking shoes'], duty: ['leather ankle boots', 'laced leather walking shoes'] }
  const headwears = { guard: 'soft wool field cap without badge', mechanic: 'flat cloth cap', farmer: 'knitted wool watch cap' }
  const accessoryKits = {
    leader: { description: 'plain brass pocket watch on a short chain', shape: 'round watch with a fine chain', color: 'aged brass', material: 'brass', mounting: 'chain clipped to the waistcoat or jacket buttonhole' },
    guard: { description: 'small hand lamp clipped to a leather belt', shape: 'compact cylindrical lamp', color: 'dull steel and dark brown leather', material: 'steel, leather', mounting: 'clipped at the belt' },
    medic: { description: 'canvas medical satchel without markings', shape: 'flat rectangular satchel', color: 'undyed canvas and brown leather', material: 'canvas, leather', mounting: 'strap across the shoulder' },
    mechanic: { description: 'rolled leather tool roll and work gloves tucked into the belt', shape: 'rolled bundle and gloves', color: 'oiled brown leather', material: 'leather, steel', mounting: 'tucked into the belt' },
    farmer: { description: 'cloth-wrapped seed pouch tied at the hip', shape: 'small drawstring pouch', color: 'undyed linen', material: 'linen, cord', mounting: 'tied at the hip' },
    messenger: { description: 'leather dispatch satchel', shape: 'flat flap satchel', color: 'worn brown leather', material: 'leather, brass buckle', mounting: 'strap across the chest' },
    merchant: { description: 'small leather coin purse and a folded ledger', shape: 'pouch and narrow ledger', color: 'brown leather and paper', material: 'leather, paper', mounting: 'purse at the belt, ledger in the coat pocket' },
    religious: { description: 'simple wooden prayer beads', shape: 'loop of round beads', color: 'dark polished wood', material: 'wood, cord', mounting: 'wrapped around the wrist' },
    records: { description: 'brass key ring and a small ledger satchel', shape: 'key ring and flat satchel', color: 'aged brass and brown leather', material: 'brass, leather', mounting: 'key ring at the belt, satchel across the shoulder' },
    duty: { description: 'duty whistle on a cord lanyard', shape: 'small cylindrical whistle', color: 'dull brass', material: 'brass, cord', mounting: 'lanyard around the neck' },
  }

  function deriveSlots(detail, heritage, authoredPalette, hasPortrait) {
    const id = detail.id
    const female = detail.gender === '여성'
    const role = roleOf(detail)
    const surface = surfaceExposed(detail)
    const age = detail.age
    const older = typeof age === 'number' && age >= 50
    const eastAsian = !heritage || /Korean|Chinese|Vietnamese|Koryo/.test(heritage.value) && !/African/.test(heritage.value)
    const palette = authoredPalette?.length ? authoredPalette : [pick(id, 'palette-0', palettes), pick(id, 'palette-1', palettes), pick(id, 'palette-2', palettes)].filter((value, index, all) => all.indexOf(value) === index)
    const ageBasis = 'age+gender'
    const ageFace = typeof age !== 'number' ? '' : age < 30 ? ', youthful smooth skin' : age < 50 ? ', faint expression lines' : age < 65 ? ', visible crow\'s feet and forehead lines' : ', deep wrinkles and a weathered face'
    const hairColor = eastAsian ? (older ? pick(id, 'hair-color', ['black streaked with grey', 'salt-and-pepper', 'dark brown with grey at the temples']) : pick(id, 'hair-color', ['black', 'black', 'dark brown']))
      : /African/.test(heritage.value) ? (older ? 'black with grey' : 'black') : (older ? pick(id, 'hair-color', ['ash brown with grey', 'grey', 'greying blond']) : pick(id, 'hair-color', ['dark brown', 'light brown', 'blond', 'auburn', 'black']))
    const hairStyle = female
      ? pick(id, 'hair', [['shoulder-length hair styled in 1940s victory rolls', 'shoulder-length'], ['hair pinned in a low chignon bun', 'long'], ['chin-length bob with soft waves', 'short'], ['long hair tied in a low ponytail', 'long'], ['short pin-curled hair', 'short'], ['braids pinned up into a crown', 'long']])
      : pick(id, 'hair', [['short side-parted hair combed neatly', 'short'], ['short cropped hair', 'short'], ['short hair slicked back with a side part', 'short'], ['short wavy hair', 'short'], ['very short buzz-cut hair', 'very short'], ['medium-length hair swept back', 'medium']])
    const skin = eastAsian ? pick(id, 'skin', ['light warm beige', 'medium warm beige', 'fair with a neutral undertone', 'light olive', 'tan warm beige'])
      : /African/.test(heritage.value) ? pick(id, 'skin', ['deep brown', 'medium brown', 'dark brown']) : /Arab|Hispanic|Uzbek/.test(heritage.value) ? pick(id, 'skin', ['olive tan', 'warm light brown']) : pick(id, 'skin', ['fair', 'fair with pink undertone', 'light beige'])
    const upperBase = role === 'leader' ? pick(id, 'upper', uppers.leader[female ? 'female' : 'male']) : pick(id, 'upper', uppers[role])
    const lowerPool = ['guard', 'mechanic', 'farmer', 'messenger'].includes(role) ? lowers.work : lowers[female ? 'female' : 'male']
    const kit = accessoryKits[role]
    const outfitBasis = `occupation+commonTier+surface-exposure(${surface ? 'surface' : 'underground'})+1940s-winter-baseline`
    const buildPool = ['guard', 'mechanic', 'farmer'].includes(role) ? ['sturdy', 'broad-shouldered', 'lean and wiry', 'stocky'] : ['slim', 'average', 'lean', 'soft rounded', 'average with narrow shoulders']
    return {
      palette,
      face: {
        description: derived(`${female ? 'Adult woman' : 'Adult man'} with a calm, restrained expression${ageFace}`, ageBasis),
        faceShape: derived(pick(id, 'face-shape', ['oval', 'long oval', 'square with a firm jaw', 'round', 'heart-shaped', 'diamond-shaped with high cheekbones', 'rectangular']), 'art-default-variation'),
        eyeColor: derived(eastAsian || /African/.test(heritage.value) ? 'dark brown' : pick(id, 'eye-color', ['brown', 'hazel', 'grey-blue', 'green', 'blue']), 'heritage'),
        eyeShape: derived(pick(id, 'eye-shape', eastAsian ? ['narrow almond', 'monolid almond', 'gently hooded', 'upturned almond', 'round'] : ['almond', 'deep-set', 'round', 'gently hooded']), 'art-default-variation'),
        eyebrowShape: derived(pick(id, 'brow', ['straight and thick', 'softly arched', 'straight and thin', 'angled', 'low and heavy']), 'art-default-variation'),
        lipColor: derived(female ? pick(id, 'lip', ['muted pink', 'dusty rose', 'muted red']) : 'natural muted rose', 'gender'),
        mouthShape: derived(pick(id, 'mouth', ['thin straight lips', 'closed mouth with a fuller lower lip', 'wide closed mouth', 'small closed mouth']), 'art-default-variation'),
        noseShape: derived(pick(id, 'nose', eastAsian ? ['straight narrow bridge', 'low broad bridge', 'short rounded tip', 'straight bridge with a soft tip'] : ['straight bridge', 'slightly aquiline', 'broad bridge', 'short rounded tip']), 'art-default-variation'),
        beardShape: derived(female ? 'none' : pick(id, 'beard', older ? ['clean shaven', 'neatly trimmed mustache', 'short trimmed grey-flecked beard', 'light stubble'] : ['clean shaven', 'clean shaven', 'light stubble', 'neatly trimmed mustache']), ageBasis),
      },
      hair: {
        description: derived(hairStyle[0], 'gender+1940s-hairstyle'),
        shape: derived(hairStyle[0], 'gender+1940s-hairstyle'),
        color: derived(hairColor, 'heritage+age'),
        length: derived(hairStyle[1], 'gender+1940s-hairstyle'),
      },
      body: {
        build: derived(pick(id, 'build', buildPool), 'occupation'),
        weight: { ...derived('average for build', 'coarse-default'), unit: null },
        height: { ...derived(female ? 'average adult female height' : 'average adult male height', 'coarse-default'), unit: null },
        bustSize: derived(female ? pick(id, 'bust', ['average', 'modest']) : 'flat chest', 'gender'),
        skin: derived(skin, 'heritage'),
      },
      outfit: {
        headwear: hasPortrait ? derived('none', 'approved-portrait-consistency') : derived(surface ? pick(id, 'headwear', ['knitted wool watch cap', 'fur-lined ear-flap cap']) : headwears[role] ?? 'none', outfitBasis),
        upper: derived(`${palette[0]} ${upperBase}${layer(detail, surface)}`, outfitBasis),
        lower: derived(`${palette[1] ?? palette[0]} ${pick(id, 'lower', lowerPool)}`, outfitBasis),
        footwear: derived(surface && role !== 'leader' ? 'thick-soled leather winter boots with wool socks' : pick(id, 'footwear', footwears[role]), outfitBasis),
        marks: derived('none visible', 'no-insignia-rule'),
        neckline: derived(necklines[role], outfitBasis),
      },
      accessories: Object.fromEntries(Object.entries(kit).map(([key, value]) => [key, derived(value, `occupation(${role})`)])),
    }
  }

  // Source-backed measurements written in Korean card prose (e.g. "신장 183cm, 체중 70kg").
  function measured(detail) {
    const text = detail.fields?.['외형'] ?? ''
    const height = text.match(/신장\s*(\d{2,3})\s*cm/)
    const weight = text.match(/체중\s*(\d{2,3})\s*kg/)
    const source = `person-details.${detail.id}.외형`
    return {
      height: height ? { value: Number(height[1]), status: 'source', source, unit: 'cm' } : null,
      weight: weight ? { value: Number(weight[1]), status: 'source', source, unit: 'kg' } : null,
    }
  }

  // Fill a slot only when it is empty or was itself derived before.
  const replaceable = (slot) => !slot || slot.value === null || slot.value === undefined || slot.status === 'unknown' || slot.status === DERIVED

  function completeSlots(slots, fresh, detail) {
    const merged = structuredClone(slots ?? {})
    for (const [group, values] of Object.entries(fresh)) {
      if (group === 'palette') continue
      merged[group] ??= {}
      for (const [key, slot] of Object.entries(values)) if (replaceable(merged[group][key])) merged[group][key] = slot
    }
    const source = measured(detail)
    for (const key of ['height', 'weight']) if (source[key] && replaceable(merged.body[key])) merged.body[key] = source[key]
    return merged
  }

  await mkdir(tokenRoot, { recursive: true })
  const detailFiles = (await readdir(detailRoot)).filter((file) => /^person-[0-9]{4}\.json$/.test(file)).sort()
  const existing = new Set((await readdir(tokenRoot)).filter((file) => file.endsWith('.json')))
  const dispositions = (() => {
    const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'))
    try {
      return db.prepare("SELECT 1 FROM sqlite_schema WHERE name='person_disposition'").get() ? readPersonDisposition(db) : null
    } finally { db.close() }
  })()
  const stats = { created: 0, completed: 0, total: 0 }

  for (const file of detailFiles) {
    const detail = JSON.parse(await readFile(resolve(detailRoot, file), 'utf8'))
    if (dispositions?.get(detail.characterId)?.status === 'retired-current') continue
    const heritage = heritageOf(detail)
    const previous = existing.has(file) ? JSON.parse(await readFile(resolve(tokenRoot, file), 'utf8')) : null
    const fresh = deriveSlots(detail, heritage, previous?.artProposal?.palette, Boolean(previous?.image?.sha256))
    if (previous && (previous.personId !== detail.id || previous.name !== detail.name)) throw new Error(`E_PORTRAIT_TOKEN_IDENTITY:${file}`)
    const gender = genders.get(detail.name)
    const template = {
      schemaVersion: 1,
      personId: detail.id,
      characterId: detail.characterId,
      name: detail.name,
      stateId: detail.state === 'S00' ? null : detail.state,
      approval: 'art-proposal',
      facts: { gender: detail.gender, genderUserLocked: gender?.user_locked ?? false, role: detail.position?.trim() || null },
      artProposal: {},
      style: { styleId: `derived-cast-default-${DERIVED_DATE}`, referenceSha256: null, portraitShotId: 'medium-close-up-119', crop: 'head, both shoulders and upper chest', referenceRole: 'technique-only' },
      image: null,
      references: null,
      variantId: null,
      imageReview: null,
      identity: {
        characterId: detail.characterId,
        name: detail.name,
        ethnicity: heritage ? derived(heritage.value, heritage.basis) : derived('unconfirmed; art default East Asian appearance', 'art-default-origin-unconfirmed'),
        origin: heritage ? derived(heritage.value, heritage.basis) : { value: 'unconfirmed', status: 'unknown', source: null },
        gender: detail.gender,
        ageCategory: typeof detail.age === 'number' && detail.age < 19 ? 'minor' : 'adult',
      },
      slots: {},
      generationContract: {
        portraitShotId: 'medium-close-up-119',
        direction: 'viewer-right',
        camera: 'eye-level three-quarter medium close-up; full head, both shoulders and upper chest; same scale across recipients',
        pose: 'neutral still bust; shoulders level; head and torso turned slightly viewer-right; no head tilt or gestures',
        styleReferenceRole: 'technique-only',
        model: 'gpt-image-2.5',
        background: 'transparent RGBA; alpha0 background',
      },
    }
    // Older tokens predate the identity, slots or generationContract sections; add only what is absent.
    const token = previous ? { ...template, ...previous, identity: { ...template.identity, ...previous.identity }, slots: previous.slots ?? {} } : template
    token.facts.role = detail.position?.trim() || null
    // Current-state identity must follow the live detail; the previous-token merge
    // above would otherwise preserve a retired polity indefinitely.
    token.stateId = template.stateId
    token.identity.age = typeof detail.age === 'number' ? detail.age : null
    token.identity.ageAsOf = detail.ageAsOf ?? null
    const proposal = token.artProposal
    // Authored artProposal text whose slot is still empty becomes that slot's authored value.
    const seed = (group, key, value) => {
      if (!value || !replaceable(token.slots?.[group]?.[key]) || token.slots?.[group]?.[key]?.status === DERIVED) return
      token.slots[group] ??= {}
      token.slots[group][key] = { value, status: token.approval, source: `portrait-tokens/${token.personId}.json` }
    }
    if (previous) {
      seed('outfit', 'lower', proposal.lower)
      seed('outfit', 'footwear', proposal.footwear)
      seed('accessories', 'description', proposal.accessories)
    }
    token.slots = completeSlots(token.slots, fresh, detail)
    const { face, hair, outfit, accessories } = token.slots
    // face, hair and upper of portrait-catalog tokens are bound to portrait-properties.json; fill only when empty.
    proposal.face ??= face.description.value
    proposal.hair ??= hair.description.value
    proposal.upper ??= outfit.upper.value
    proposal.outfit ??= outfit.upper.value
    proposal.palette ??= fresh.palette
    proposal.carriedWeapons ??= 'none depicted; no ownership inferred'
    proposal.lower = outfit.lower.value
    proposal.footwear = outfit.footwear.value
    proposal.accessories = accessories.description.value
    token.textToImage = textToImageBlock(token)
    await writeFile(resolve(tokenRoot, file), JSON.stringify(token, null, 2) + '\n')
    stats.total += 1
    if (previous) stats.completed += 1
    else stats.created += 1
  }

  console.log(`PORTRAIT_TOKENS_GENERATED: ${stats.total} tokens (${stats.created} created, ${stats.completed} completed)`)
  return stats
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  await requireGenerationPublication(root)
  await generatePortraitTokens(root)
}
