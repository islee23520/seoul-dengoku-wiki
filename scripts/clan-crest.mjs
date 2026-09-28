// 문중 문장 생성기(소유자 결정 2026-09-29): 원형 단색 문양, 글자 없음.
// CK3 카몬 템플릿처럼 배치 × 테두리 × 문양 × 변형 × 잉크색을 곱해 고른다(조합 방식만 참고, 도안은 한국 전통 문양으로 새로 그린다).
// 문중 id의 SHA-256으로 첫 후보를 정하고, 이미 다른 문중이 쓴 조합이면 다음 조합으로 넘어가 겹치지 않게 한다.
import { createHash } from 'node:crypto'

export const INKS = { blue: '#1f4e79', red: '#9b2226', ochre: '#9a6b12', black: '#1f2a33' }
export const LAYOUTS = ['radial3', 'radial4', 'radial5', 'radial6', 'radial8', 'pair', 'stack3', 'single', 'wreath', 'block']
export const FRAMES = ['none', 'plain', 'double', 'beaded', 'jagged', 'octagon', 'needle']
export const MOTIFS = ['cloud', 'lotus', 'plum', 'bamboo', 'pine', 'wave', 'key', 'bell', 'arrow', 'lozenge', 'bat', 'butterfly', 'tortoise', 'chilbo', 'feather', 'fan']
export const MODIFIERS = ['plain', 'alternating', 'hole', 'inverted']

const r = (n) => Math.round(n * 100) / 100

// 문양은 (0,0) 중심, 대략 -10..10 크기의 채운 도형이다.
const MOTIF_PATH = {
  cloud: 'M-9 3 C-9 -3 -3 -6 0 -2 C2 -8 9 -7 9 -1 C9 4 4 5 2 3 C3 7 -3 8 -5 5 C-8 7 -9 5 -9 3 Z',
  lotus: 'M0 -10 C6 -4 6 5 0 10 C-6 5 -6 -4 0 -10 Z',
  plum: Array.from({ length: 5 }, (_, i) => { const a = (i * 72 - 90) * Math.PI / 180; const x = r(5 * Math.cos(a)); const y = r(5 * Math.sin(a)); return `M${x + 4.5} ${y} A4.5 4.5 0 1 1 ${x - 4.5} ${y} A4.5 4.5 0 1 1 ${x + 4.5} ${y} Z` }).join(' '),
  bamboo: 'M0 -10 C3 -5 3 5 0 10 C-1 5 -1 -5 0 -10 Z M-6 -6 C-2 -4 -1 0 -1 2 C-4 0 -6 -3 -6 -6 Z',
  pine: 'M-1 10 L-1 -2 L-8 -9 L-6 -10 L0 -4 L6 -10 L8 -9 L1 -2 L1 10 Z',
  wave: 'M-10 6 C-8 -2 -2 -8 5 -6 C9 -5 10 -1 7 1 C5 -2 1 -2 0 2 C-1 6 3 8 8 6 L10 8 L-10 8 Z',
  key: 'M-8 -8 H8 V8 H-4 V-4 H4 V4 H0 V0 H2 V2 H-2 V6 H6 V-6 H-6 V8 H-8 Z',
  bell: 'M0 -10 C5 -10 7 -5 7 2 L9 6 H-9 L-7 2 C-7 -5 -5 -10 0 -10 Z M-2 7 H2 V10 H-2 Z',
  arrow: 'M0 -10 L8 2 L2 0 L2 10 L-2 10 L-2 0 L-8 2 Z',
  lozenge: 'M0 -10 L10 0 L0 10 L-10 0 Z M0 -4 L-4 0 L0 4 L4 0 Z',
  bat: 'M0 -3 C2 -7 6 -8 10 -5 C8 -3 8 0 10 2 C6 1 4 3 2 6 L0 4 L-2 6 C-4 3 -6 1 -10 2 C-8 0 -8 -3 -10 -5 C-6 -8 -2 -7 0 -3 Z',
  butterfly: 'M0 -2 C-3 -10 -10 -9 -9 -2 C-8 2 -3 1 0 0 C-3 2 -8 5 -5 9 C-2 10 0 5 0 2 C0 5 2 10 5 9 C8 5 3 2 0 0 C3 1 8 2 9 -2 C10 -9 3 -10 0 -2 Z',
  tortoise: 'M0 -10 L9 -5 L9 5 L0 10 L-9 5 L-9 -5 Z M0 -5 L4 -2.5 L4 2.5 L0 5 L-4 2.5 L-4 -2.5 Z',
  chilbo: 'M0 -10 C5 -10 5 -4 0 0 C-5 -4 -5 -10 0 -10 Z M10 0 C10 5 4 5 0 0 C4 -5 10 -5 10 0 Z M0 10 C-5 10 -5 4 0 0 C5 4 5 10 0 10 Z M-10 0 C-10 -5 -4 -5 0 0 C-4 5 -10 5 -10 0 Z',
  feather: 'M0 -10 C5 -6 5 4 0 10 C-5 4 -5 -6 0 -10 Z M0 -8 L0 10',
  fan: 'M0 8 L-9 -4 A11 11 0 0 1 9 -4 Z',
}

const place = (motif, x, y, scale, rotation = 0) => `<path transform="translate(${r(x)} ${r(y)}) rotate(${r(rotation)}) scale(${r(scale)})" d="${MOTIF_PATH[motif]}" fill-rule="evenodd"/>`
const polar = (radius, degrees) => [50 + radius * Math.cos((degrees - 90) * Math.PI / 180), 50 + radius * Math.sin((degrees - 90) * Math.PI / 180)]

function layout(kind, first, second, alternating, inset) {
  const m = (i) => (alternating && i % 2 ? second : first)
  const radial = (count, radius, scale) => Array.from({ length: count }, (_, i) => { const deg = i * 360 / count; const [x, y] = polar(radius * inset, deg); return place(m(i), x, y, scale * inset, deg) }).join('')
  switch (kind) {
    case 'radial3': return radial(3, 17, 1.35)
    case 'radial4': return radial(4, 18, 1.15)
    case 'radial5': return radial(5, 19, 1.0)
    case 'radial6': return radial(6, 20, 0.9)
    case 'radial8': return radial(8, 22, 0.72)
    case 'pair': return place(first, 50 - 12 * inset, 50, 1.9 * inset, -18) + place(alternating ? second : first, 50 + 12 * inset, 50, 1.9 * inset, 18)
    case 'stack3': return [-17, 0, 17].map((dy, i) => place(m(i), 50, 50 + dy * inset, 0.95 * inset)).join('')
    case 'single': return place(first, 50, 50, 3.1 * inset)
    case 'wreath': return Array.from({ length: 10 }, (_, i) => { const side = i < 5 ? -1 : 1; const k = i % 5; const deg = side * (150 - k * 26); const [x, y] = polar(27 * inset, deg); return place(m(k), x, y, 0.62 * inset, deg + side * 90) }).join('') + place(second, 50, 50, 1.3 * inset)
    default: return [[-11, -11], [11, -11], [-11, 11], [11, 11]].map(([dx, dy], i) => place(m(i), 50 + dx * inset, 50 + dy * inset, 0.95 * inset, 45)).join('')
  }
}

function frame(kind) {
  const ring = (radius, width) => `<circle cx="50" cy="50" r="${radius}" fill="none" stroke-width="${width}"/>`
  switch (kind) {
    case 'plain': return ring(45, 3.2)
    case 'double': return ring(46, 2) + ring(41.5, 1.2)
    case 'beaded': return ring(43.5, 1.4) + Array.from({ length: 28 }, (_, i) => { const [x, y] = polar(47, i * 360 / 28); return `<circle cx="${r(x)}" cy="${r(y)}" r="1.5" stroke="none"/>` }).join('')
    case 'jagged': return `<path d="${Array.from({ length: 49 }, (_, i) => { const [x, y] = polar(i % 2 ? 43 : 47, i * 7.5); return `${i ? 'L' : 'M'}${r(x)} ${r(y)}` }).join(' ')} Z" fill="none" stroke-width="1.8" stroke-linejoin="round"/>`
    case 'octagon': return `<path d="${Array.from({ length: 8 }, (_, i) => { const [x, y] = polar(46, i * 45 + 22.5); return `${i ? 'L' : 'M'}${r(x)} ${r(y)}` }).join(' ')} Z" fill="none" stroke-width="2.6" stroke-linejoin="round"/>`
    case 'needle': return ring(42, 1.4) + Array.from({ length: 36 }, (_, i) => { const [x1, y1] = polar(43.5, i * 10); const [x2, y2] = polar(48, i * 10); return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke-width="1.4"/>` }).join('')
    default: return ''
  }
}

// 모든 조합을 한 줄로 늘어놓은 뒤 문중마다 한 칸씩 차지한다.
const COMBOS = LAYOUTS.length * FRAMES.length * MOTIFS.length * MOTIFS.length * MODIFIERS.length * Object.keys(INKS).length
function decode(n) {
  const pick = (list) => { const value = list[n % list.length]; n = Math.floor(n / list.length); return value }
  const layoutKind = pick(LAYOUTS)
  const frameKind = pick(FRAMES)
  const motif = pick(MOTIFS)
  const secondMotif = pick(MOTIFS)
  const modifier = pick(MODIFIERS)
  const ink = pick(Object.keys(INKS))
  return { layout: layoutKind, frame: frameKind, motif, secondMotif: secondMotif === motif ? MOTIFS[(MOTIFS.indexOf(motif) + 7) % MOTIFS.length] : secondMotif, modifier, ink }
}
const signature = (c) => [c.layout, c.frame, c.motif, c.modifier === 'alternating' || c.layout === 'wreath' ? c.secondMotif : '-', c.modifier, c.ink].join('|')
const seed = (id) => Number(createHash('sha256').update(String(id)).digest().readBigUInt64BE(0) % BigInt(COMBOS))

// 같은 문중 목록을 넣으면 늘 같은 배정이 나온다. 목록 순서는 id 정렬로 고정한다.
export function assignCrests(clanIds) {
  const used = new Set()
  const out = new Map()
  for (const id of [...clanIds].sort()) {
    let n = seed(id)
    let choice = decode(n)
    while (used.has(signature(choice))) { n = (n + 1) % COMBOS; choice = decode(n) }
    used.add(signature(choice))
    out.set(id, choice)
  }
  return out
}

export function renderCrest(choice) {
  const color = INKS[choice.ink]
  const inverted = choice.modifier === 'inverted'
  const fg = inverted ? '#ffffff' : color
  const inset = choice.frame === 'none' ? 1 : 0.86
  const disc = inverted ? `<circle cx="50" cy="50" r="${choice.frame === 'none' ? 47 : 41}" fill="${color}" stroke="none"/>` : ''
  const hole = choice.modifier === 'hole' ? `<circle cx="50" cy="50" r="7" fill="none" stroke="${fg}" stroke-width="3"/>` : ''
  const body = layout(choice.layout, choice.motif, choice.secondMotif, choice.modifier === 'alternating', inset)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g fill="${color}" stroke="${color}">${frame(choice.frame)}</g>${disc}<g fill="${fg}" stroke="${fg}" stroke-width="0.6">${body}${hole}</g></svg>\n`
}
