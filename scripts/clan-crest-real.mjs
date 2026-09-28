// Real clan seals from Wikimedia Commons (public domain), redrawn in one ink inside the crest canvas.
const WHITE = /^(?:#fff|#ffffff|white)$/i

function recolor(value) {
  const v = value.trim()
  if (v === 'none' || v.startsWith('url(') || WHITE.test(v)) return v
  return 'currentColor'
}

export function normalizeRealEmblem(svgText) {
  const viewBox = svgText.match(/<svg\b[^>]*\bviewBox="([^"]+)"/)?.[1]
  if (!viewBox) throw new Error('E_REAL_EMBLEM_VIEWBOX')
  let body = svgText
    .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
    .replace(/<sodipodi:namedview[\s\S]*?(?:\/>|<\/sodipodi:namedview>)/g, '')
    .replace(/<title[\s\S]*?<\/title>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(?:inkscape|sodipodi|xml):[\w-]+="[^"]*"/g, '')
    .replace(/\b(fill|stroke)="([^"]*)"/g, (_, key, value) => `${key}="${recolor(value)}"`)
    .replace(/\b(fill|stroke)\s*:\s*([^;"]+)/g, (_, key, value) => `${key}:${recolor(value)}`)
  body = body.replace(/\s*\n\s*/g, ' ').trim()
  if (/<(?:text|image|script)\b/.test(body)) throw new Error('E_REAL_EMBLEM_CONTENT')
  return { viewBox, body }
}

export function renderRealCrest(emblem, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g color="${color}" fill="${color}"><svg x="4" y="4" width="92" height="92" viewBox="${emblem.viewBox}" preserveAspectRatio="xMidYMid meet">${emblem.body}</svg></g></svg>\n`
}
