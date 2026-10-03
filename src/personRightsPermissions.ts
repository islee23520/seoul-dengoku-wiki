export type PermissionStatus = 'not-recorded' | 'granted' | 'revoked' | 'declined'
export type PersonUsePermission = {
  readonly status: PermissionStatus
  readonly uses: readonly ('wiki-display' | 'game-use' | 'commercial-use')[]
  readonly date?: string
  readonly recordedOn?: string
  readonly evidenceRef?: string
  readonly priorLicenses?: readonly {
    readonly sourceRef: string
    readonly licenseRef: string
    readonly conditionsRef: string
  }[]
}
export type PersonRightsPermissions = {
  readonly applicability: 'real-person'
  readonly identityBasisRef: string
  readonly externalReuseRequiresSeparateSubjectPermission: true
  readonly nameUse: PersonUsePermission
  readonly likenessUse: PersonUsePermission
}
