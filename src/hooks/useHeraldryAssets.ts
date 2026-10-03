import { useEffect, useState } from 'react'

type Asset = { readonly path: string; readonly sha256: string }
type PersonIdentity = { readonly characterId: string; readonly name: string; readonly state: string; readonly stateName: string; readonly clan: { readonly id: string; readonly name: string } | null }
export type HeraldryAssets = { readonly schemaVersion: 1; readonly states: Readonly<Record<string, Asset>>; readonly clans: Readonly<Record<string, Asset>>; readonly people: Readonly<Record<string, PersonIdentity>> }
type Snapshot = { readonly assets: HeraldryAssets | null; readonly failed: boolean }
let current: Snapshot = { assets: null, failed: false }
const listeners = new Set<(snapshot: Snapshot) => void>()
let pending: Promise<void> | null = null
let refreshQueued = false

function refresh(): Promise<void> {
  if (pending) {
    refreshQueued = true
    return pending
  }
  pending = fetch(`${import.meta.env.BASE_URL}heraldry-assets.json`, { cache: 'no-store' })
    .then(async response => {
      if (!response.ok) throw new Error(`Heraldry HTTP ${response.status}`)
      const assets = await response.json() as HeraldryAssets
      if (assets.schemaVersion !== 1 || !assets.states || !assets.clans || !assets.people) throw new Error('Invalid heraldry registry')
      if (refreshQueued || listeners.size === 0) return
      current = { assets, failed: false }
      listeners.forEach(listener => listener(current))
    }).catch(() => {
      if (refreshQueued || listeners.size === 0) return
      current = { ...current, failed: true }
      listeners.forEach(listener => listener(current))
    }).finally(() => {
      pending = null
      if (refreshQueued) {
        refreshQueued = false
        if (listeners.size > 0) void refresh()
      }
    })
  return pending
}

const update = () => { void refresh() }

export function useHeraldryAssets(): Snapshot {
  const [assets, setAssets] = useState(current)
  useEffect(() => {
    listeners.add(setAssets)
    if (listeners.size === 1) {
      window.addEventListener('focus', update)
      update()
    }
    return () => {
      listeners.delete(setAssets)
      if (listeners.size === 0) {
        window.removeEventListener('focus', update)
        refreshQueued = false
      }
    }
  }, [])
  return assets
}

export function heraldryUrl(asset: Asset): string {
  return `${import.meta.env.BASE_URL}${asset.path}?v=${asset.sha256}`
}
