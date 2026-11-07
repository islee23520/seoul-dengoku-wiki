// seed-core shared projection interface — committed by the lead to divide P1/P2 ownership (plan §4).
// P1 (seed-sync generator, baseline reads) and P2 (consistent export/render snapshot) both go through
// these contracts; neither may re-implement them inline. Semantics follow the existing seed tools:
// public tables only (dual allowlist), lossless column types text/bigint/double precision/bytea.
import { createHash } from 'node:crypto'

export const LOSSLESS_TYPES = new Set(['text', 'bigint', 'double precision', 'bytea'])

// Canonical, stable JSON encoding for one seed row: object keys sorted, no spaces, LF-terminated.
// bigint is encoded as a JSON string to stay lossless beyond Number.MAX_SAFE_INTEGER.
export function losslessRowJson(row) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) throw new Error('E_SEED_ROW_OBJECT')
  const keys = Object.keys(row).sort()
  if (keys.length === 0) throw new Error('E_SEED_ROW_EMPTY')
  const parts = []
  for (const key of keys) {
    const value = row[key]
    let encoded
    if (value === null || typeof value === 'string' || typeof value === 'boolean') encoded = JSON.stringify(value)
    else if (typeof value === 'bigint') encoded = JSON.stringify(value.toString())
    else if (typeof value === 'number' && Number.isFinite(value)) encoded = JSON.stringify(value)
    else throw new Error(`E_SEED_ROW_VALUE:${key}`)
    parts.push(`${JSON.stringify(key)}:${encoded}`)
  }
  return `{${parts.join(',')}}\n`
}

export function losslessRowSha256(row) {
  return createHash('sha256').update(losslessRowJson(row)).digest('hex')
}

// Baseline contract for optimistic locking: the JSON bytes a row must reproduce byte-for-byte
// before a non-PK UPDATE may replace it. P1 reads this from the committed seed tree; P2 compares
// live export output against the same encoding. Changing this encoding invalidates every committed
// manifest and is therefore a contract change, not a refactor.
