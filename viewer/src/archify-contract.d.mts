export interface ArchifyReference {
  readonly domainId: string
  readonly diagramId: string
  readonly moduleTitle: string
}
export interface ArchifyEntry extends ArchifyReference {
  readonly file: string
  readonly sha256: string
}
export interface ArchifyManifest {
  readonly schemaVersion: 1
  readonly diagrams: readonly ArchifyEntry[]
}
export class ArchifyContractError extends Error {
  readonly code: string
  constructor(code: string)
}
export function parseArchifyReference(source: string): ArchifyReference
export function parseArchifyManifest(value: unknown): ArchifyManifest
export function resolveArchifyReference(reference: ArchifyReference, manifest: ArchifyManifest): ArchifyEntry
export function archifyHref(entry: ArchifyEntry): string
