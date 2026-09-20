import type { ReactNode } from 'react'

type FlagDesign = { background: string; foreground: string; symbol: ReactNode }

const flagDesigns: Record<string, FlagDesign> = {
  S01: { background: '#164e63', foreground: '#f4f0e6', symbol: <><path d="M32 16h8v36h-8zm48 0h8v36h-8zM32 16h56v8H32zM24 52h72v8H24zm0 16h72v8H24z" /></> },
  S02: { background: '#303841', foreground: '#f2cc73', symbol: <path fillRule="evenodd" d="M40 12h40l16 28-16 28H40L24 40zm8 16v24h24V28z" /> },
  S03: { background: '#7b3f27', foreground: '#fae6b1', symbol: <><path fillRule="evenodd" d="M24 28h64l12 20v8H24zm12 8v12h44V36z" /><circle cx="40" cy="62" r="8" /><circle cx="84" cy="62" r="8" /></> },
  S04: { background: '#573d68', foreground: '#f4f0e6', symbol: <><path d="m28 16 32 8 32-8v16l-32 8-32-8z" /><path d="m44 48 32 0 8 16H36z" /></> },
  S05: { background: '#344a36', foreground: '#e5d493', symbol: <path fillRule="evenodd" d="M28 16h64v28L60 68 28 44zm28 8v28h8V24z" /> },
  S06: { background: '#f4f0e6', foreground: '#7a2f36', symbol: <><rect x="36" y="16" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="8" /><path d="M48 28h24v8H48zm8 8h8v16h-8z" /></> },
  S07: { background: '#283c55', foreground: '#e7edf0', symbol: <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="butt" strokeLinejoin="miter" d="M52 68V44L28 20m40 48V44l24-24M44 56h32" /> },
  S08: { background: '#eee0bd', foreground: '#55432e', symbol: <path fillRule="evenodd" d="M36 12h32l16 16v40H36zm32 0v16h16M48 40h24v8H48z" /> },
  S09: { background: '#493044', foreground: '#e8c77d', symbol: <><rect x="24" y="20" width="24" height="40" /><rect x="72" y="20" width="24" height="40" /><path d="m48 40 12-12 12 12-12 12z" /></> },
  S10: { background: '#624a32', foreground: '#f3e5bf', symbol: <><path d="M44 36V20l16-8 16 8v16z" /><rect x="36" y="44" width="48" height="8" /><rect x="24" y="60" width="72" height="8" /></> },
  S11: { background: '#273d3a', foreground: '#cde6e0', symbol: <path fillRule="evenodd" d="M36 12h48v56H36zm8 8v8h32v-8zm0 16v8h32v-8zm0 16v8h32v-8z" /> },
  S12: { background: '#dceae7', foreground: '#234957', symbol: <><path d="M24 20h56v-8l20 16-20 16v-8H24z" /><path d="M96 52H40v-8L20 60l20 16v-8h56z" /></> },
  S13: { background: '#294f40', foreground: '#f0e8d4', symbol: <><path d="M28 36h64L80 64H40z" /><path d="m60 28 16-16 8 8-16 16z" /></> },
  S14: { background: '#713b30', foreground: '#ebd3a5', symbol: <><path d="M24 64V32l16-16 8 16v32z" /><path d="M72 64V32l8-16 16 16v32z" /></> },
  S15: { background: '#35354e', foreground: '#eae7f2', symbol: <><path fill="none" stroke="currentColor" strokeWidth="8" d="M32 64V36q0-24 28-24t28 24v28" /><rect x="48" y="36" width="24" height="24" /></> },
  S16: { background: '#4e3540', foreground: '#f2d9c1', symbol: <><rect x="28" y="36" width="16" height="20" /><rect x="52" y="20" width="16" height="36" /><rect x="76" y="36" width="16" height="20" /><rect x="20" y="64" width="80" height="8" /></> },
}

export function StateFlag({ stateId, title }: { stateId: string; title?: string }) {
  const design = flagDesigns[stateId] ?? flagDesigns.S01
  return (
    <svg className="state-flag" viewBox="0 0 120 80" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ background: design.background, color: design.foreground }}>
      <g fill="currentColor">{design.symbol}</g>
    </svg>
  )
}
