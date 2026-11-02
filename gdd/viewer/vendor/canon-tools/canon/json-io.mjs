import { CanonError } from './errors.mjs'

// Scans text that JSON.parse already accepted and rejects any object that repeats a key.
function assertNoDuplicateKeys(text, label) {
  const stack = []
  const pathOf = () => stack.slice(0, -1).map((frame) => (frame.kind === 'arr' ? `[${frame.index}]` : `.${frame.lastKey}`)).join('')
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const top = stack.at(-1)
    if (ch === '"') {
      let end = i + 1
      while (text[end] !== '"') end += text[end] === '\\' ? 2 : 1
      if (top?.kind === 'obj' && top.expectKey) {
        const key = JSON.parse(text.slice(i, end + 1))
        if (top.keys.has(key)) throw new CanonError('E_DUPLICATE_JSON_KEY', `${label}: $${pathOf()} key "${key}"`)
        top.keys.add(key)
        top.lastKey = key
      }
      i = end
    } else if (ch === '{') stack.push({ kind: 'obj', keys: new Set(), expectKey: true, lastKey: '' })
    else if (ch === '[') stack.push({ kind: 'arr', index: 0 })
    else if (ch === '}' || ch === ']') stack.pop()
    else if (ch === ':') top.expectKey = false
    else if (ch === ',') {
      if (top.kind === 'obj') top.expectKey = true
      else top.index += 1
    }
  }
}

export function parseCanonJson(text, label) {
  let data
  try {
    data = JSON.parse(text)
  } catch (error) {
    if (error instanceof SyntaxError) throw new CanonError('E_JSON_MALFORMED', `${label}: ${error.message}`)
    throw error
  }
  assertNoDuplicateKeys(text, label)
  return data
}
