// Public vocabulary only; editorial soul and approval records never enter this bundle.
export const ORIGINAL_CAPABILITIES = [
  { id: 'leadership', label: '통솔' },
  { id: 'strategy', label: '전략' },
  { id: 'negotiation', label: '교섭' },
  { id: 'management', label: '운영' },
  { id: 'insight', label: '통찰' },
  { id: 'learning', label: '학습' },
  { id: 'prowess', label: '기량' },
  { id: 'endurance', label: '체력' },
] as const

export const ORIGINAL_RULES_VERSION = 'seoul-character-system-contract.v1'
export const ORIGINAL_PROFILE_ID = 'seoul-character-profile.v1'

export const PERSONAL_FIELDS = [
  { key: 'name', label: '이름' }, { key: 'state', label: '국가' },
  { key: 'position', label: '직위' }, { key: 'rank', label: '신분' },
  { key: 'occupation', label: '생업' }, { key: 'gender', label: '성별' },
  { key: 'birth', label: '생일' }, { key: 'bongwan', label: '본관' },
  { key: 'tier', label: '인물 단계' },
  { key: 'selectedBackground', label: '배경' },
  { key: 'selectedAppearance', label: '외형' },
  { key: 'selectedAmbition', label: '개막 야망' },
] as const

export const TRAIT_FIELDS = [
  { key: 'selectedAdvantages', label: '강점' },
  { key: 'selectedDisadvantages', label: '제약' },
  { key: 'selectedQuirks', label: '버릇' },
] as const
