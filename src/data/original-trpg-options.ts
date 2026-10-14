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
export const HISTORICAL_RULES_VERSION = 'seoul.opposed-d10.v1'
export const LEGACY_REVISIONS = [
  { revision: 'ce173686bcba220cd2a7dedfb5c78b941bf3c151', label: '기준 원본', sha256: 'bd6cf5638033a85c8e5970518e3f89db5a46a28c1b95c762bc083858e2275331' },
  { revision: '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4', label: '추가 기록 원본', sha256: '3e5afa93853160f4549fcda8b40f2e5c4701fada97a5b8dc9c685ee125c84b97' },
] as const

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
