export type PortraitToken = {
  personId: string
  characterId: string
  name: string
  approval: string
  facts: { gender: string; role: string }
  artProposal: { face: string; hair: string; upper: string; lower: string | null; footwear: string | null }
  style: { referenceSha256: string; portraitShotId: string }
}

export type PromptOverrides = { gender?: string; ageCategory?: string; mood?: string; hair?: string; upper?: string; lower?: string; footwear?: string; variantId?: string }

export function editedPortraitToken(token: PortraitToken, overrides: PromptOverrides) {
  composePortraitPrompt(token, 'portrait', 'yokoyama-b', overrides)
  const edited = structuredClone(token)
  edited.artProposal.hair = overrides.hair ?? token.artProposal.hair
  edited.artProposal.upper = overrides.upper ?? token.artProposal.upper
  edited.artProposal.lower = overrides.lower ?? token.artProposal.lower
  edited.artProposal.footwear = overrides.footwear ?? token.artProposal.footwear
  const args = localCharacterArguments(overrides)
  const generationOverrides = Object.fromEntries(['gender', 'ageCategory', 'mood'].flatMap((key, index) => {
    const flag = ['--gender', '--age-category', '--mood'][index]
    const position = args.indexOf(flag)
    return position < 0 ? [] : [[key, args[position + 1]]]
  }))
  return { ...edited, variantId: overrides.variantId ?? null, basePersonId: token.personId, generationOverrides, draftReviewStatus: 'unreviewed', sourceImageRole: 'identity-reference-only' }
}

export function localCharacterArguments(overrides: PromptOverrides) {
  const values: Record<string, Record<string, string>> = {
    gender: { '남성': 'male', '여성': 'female' },
    ageCategory: { '성인': 'adult', '미성년': 'minor' },
    mood: { '차분한 절제': 'calm', '피로가 엷은 표정': 'weary', '단호한 시선': 'resolute' },
  }
  const args: string[] = []
  for (const [key, flag] of [['gender', '--gender'], ['ageCategory', '--age-category'], ['mood', '--mood']] as const) {
    if (!overrides[key]) continue
    const value = values[key][overrides[key]!]
    if (!value) throw new Error('지원하지 않는 로컬 속성 값')
    args.push(flag, value)
  }
  if (args.length && !overrides.variantId) throw new Error('속성 교체에는 별도 변형 ID가 필요합니다.')
  if (overrides.variantId) args.push('--variant-id', overrides.variantId)
  return args
}

export const publicChoices = {
  gender: ['남성', '여성'],
  ageCategory: ['성인', '미성년'],
  mood: ['차분한 절제', '피로가 엷은 표정', '단호한 시선'],
} as const

export const cameraViews = {
  portrait: { source: 'https://uniform.wingzero.tw/ko/prompts/camera-shot-size/119', camera: 'medium close-up: full head, both shoulders and upper chest, no waist' },
  front: { source: 'https://uniform.wingzero.tw/ko/prompts/camera-shot-size/116', camera: 'full shot head to toe, exact front view, neutral pose' },
  profile: { source: 'https://uniform.wingzero.tw/ko/prompts/camera-angle/247', camera: 'full shot head to toe, exact side profile, neutral pose' },
  side: { source: 'https://uniform.wingzero.tw/ko/prompts/camera-angle/248', camera: 'full shot head to toe, oblique side view, neutral pose' },
  back: { source: 'https://uniform.wingzero.tw/ko/prompts/camera-angle/122', camera: 'full shot head to toe, exact back view, neutral pose' },
} as const

export const mangaStyles = {
  'yokoyama-b': { source: 'https://uniform.wingzero.tw/ko/prompts/anime-manga-style/56', sourcePrompt: { field: 'anime manga style', value: '橫山光輝' }, description: 'B안 이미지의 프로젝트 보조 작화 규칙: 먹선·넓은 명암 면·저채도. 한 작가 프리셋을 모든 인물에 동일 적용한다.' },
  'yoshikazu-yasuhiko': { source: 'https://uniform.wingzero.tw/ko/prompts/anime-manga-style/81', sourcePrompt: null, description: '야스히코 요시카즈 참고 실험: 유려한 인물 윤곽과 부드러운 고전 애니메이션 채색' },
} as const

export function composePortraitPrompt(token: PortraitToken, view: keyof typeof cameraViews, style: keyof typeof mangaStyles, overrides: PromptOverrides = {}) {
  if (token.approval !== 'art-proposal' || !token.artProposal.face || !token.artProposal.hair || !token.artProposal.upper) throw new Error('검증되지 않은 인물 토큰')
  if (Object.keys(overrides).some((key) => key !== 'variantId' && Boolean(overrides[key as keyof PromptOverrides])) && !overrides.variantId) throw new Error('속성 교체에는 별도 변형 ID가 필요합니다.')
  const missing = ['lower', 'footwear'].filter((key) => !(overrides[key as 'lower' | 'footwear'] ?? token.artProposal[key as 'lower' | 'footwear']))
  const identityChanged = Boolean(overrides.gender && overrides.gender !== token.facts.gender) || Boolean(overrides.ageCategory && overrides.ageCategory !== '성인')
  const fields = [token.name, overrides.gender ?? token.facts.gender, overrides.ageCategory ?? '성인', overrides.mood ?? '차분한 절제', token.facts.role, identityChanged ? '' : token.artProposal.face, overrides.hair ?? token.artProposal.hair, overrides.upper ?? token.artProposal.upper]
  if (view !== 'portrait') fields.push(...[overrides.lower ?? token.artProposal.lower, overrides.footwear ?? token.artProposal.footwear].filter((value): value is string => Boolean(value)))
  return {
    schemaVersion: 1,
    characterId: token.characterId,
    personId: token.personId,
    approval: token.approval,
    variantId: overrides.variantId ?? null,
    basePersonId: token.personId,
    selectedProperties: { gender: fields[1], ageCategory: fields[2], mood: fields[3], face: fields[5], hair: fields[6], upper: fields[7] },
    view,
    style,
    styleReferenceSha256: token.style.referenceSha256,
    camera: cameraViews[view],
    mangaStyle: mangaStyles[style],
    missing: view === 'portrait' ? [] : missing,
    prompt: `${fields.filter(Boolean).join('; ')}. ${cameraViews[view].camera}. ${mangaStyles[style].sourcePrompt ? `${mangaStyles[style].sourcePrompt.field}: ${mangaStyles[style].sourcePrompt.value}. ` : ''}${mangaStyles[style].description}. ${identityChanged ? '선택한 성별·연령에 맞는 별도 외형 변형을 만든다. 머리·의복은 유지한다.' : '같은 인물의 얼굴·머리·의복을 유지한다.'} 현대 서울 폐허, 임의 문장·무기·글자 없음.`,
  }
}

export function portraitPromptYAML(value: ReturnType<typeof composePortraitPrompt>) {
  const scalar = (item: unknown) => JSON.stringify(item)
  return [
    `characterId: ${scalar(value.characterId)}`,
    `personId: ${scalar(value.personId)}`,
    `approval: ${scalar(value.approval)}`,
    `variantId: ${scalar(value.variantId)}`,
    `selectedProperties: ${scalar(value.selectedProperties)}`,
    `view: ${scalar(value.view)}`,
    `style: ${scalar(value.style)}`,
    `styleReferenceSha256: ${scalar(value.styleReferenceSha256)}`,
    `camera: ${scalar(value.camera.camera)}`,
    `cameraSource: ${scalar(value.camera.source)}`,
    `styleSource: ${scalar(value.mangaStyle.source)}`,
    `artistPrompt: ${scalar(value.mangaStyle.sourcePrompt)}`,
    `missing: ${scalar(value.missing)}`,
    `prompt: ${scalar(value.prompt)}`,
  ].join('\n') + '\n'
}
