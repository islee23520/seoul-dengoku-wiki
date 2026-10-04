// Public portrait reviews carry image-bound operational metadata, never review evidence.
const pick = (source, fields) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('E_PORTRAIT_PUBLIC_SCHEMA: expected object')
  return Object.fromEntries(fields.filter(key => source[key] !== undefined).map(key => [key, source[key]]))
}
const requirePublic = failures => {
  if (failures.length) throw new Error('E_PORTRAIT_PUBLIC_SCHEMA: ' + failures.join(', '))
}

export function publicPortraitStringFailures(value, path = '$') {
  if (typeof value === 'string') {
    const publicPath = (path === 'token.image.path' && /^\/portraits\/person-[0-9]{4}\.png$/.test(value)) || (path === 'token.imageReview.record' && /^\/portrait-reviews\/person-[0-9]{4}\.json$/.test(value))
    const privateValue = /(?:^|[\s="'(])file:|(?:^|[\s="'(])\/\/(?=[^\s/])|(?:^|[\s="'(])\/(?=[^\s/])|(?:^|[\s="'(])[a-zA-Z]:[\\/]|\\\\[^\\]|\.omo(?:[\\/]|$)|(?:OPENAI_API_KEY|CLIPROXY_API_KEY|Authorization\s*:|apiKey\s*[:=]|Bearer\s+|sk-[a-zA-Z0-9]{16})/i.test(value)
    return !publicPath && privateValue ? [path] : []
  }
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, item]) => publicPortraitStringFailures(item, path + '.' + key))
}

export function publicPortraitReview(review) {
  const summary = pick(review, ['schemaVersion', 'personId', 'characterId', 'imageSha256', 'canonPromotion', 'final3dPortraitContractSatisfied', 'technology'])
  if (review.ownerVerdict !== undefined) summary.ownerVerdict = pick(review.ownerVerdict, ['verdict'])
  if (review.imageModification !== undefined) summary.imageModification = pick(review.imageModification, ['operation', 'inputSha256', 'outputSha256', 'generationReceiptAvailable', 'originalRgbPreserved', 'exactReductionMeasured'])
  if (review.imageHashHistory !== undefined) requirePublic(portraitReviewFailures({ imageHashHistory: review.imageHashHistory }))
  const history = [...(review.imageHashHistory ?? [])]
  for (let previous = review.previousImageReview; previous; previous = previous.previousImageReview) {
    if (previous.imageHashHistory !== undefined) requirePublic(portraitReviewFailures({ imageHashHistory: previous.imageHashHistory }))
    history.push(previous.imageSha256, ...(previous.imageHashHistory ?? []))
  }
  if (history.length) summary.imageHashHistory = [...new Set(history)]
  requirePublic(portraitReviewFailures(summary))
  return summary
}

export function publicPortraitSelection(selection) {
  const summary = {
    ...pick(selection, ['schemaVersion', 'status', 'canonPromotion', 'final3dPortraitContractSatisfied', 'previousVerdictsPreserved']),
    records: selection.records.map(row => pick(row, ['personId', 'characterId', 'name', 'imageSha256', 'previousImageSha256', 'verdict', 'operation'])),
  }
  requirePublic(portraitSelectionFailures(summary))
  return summary
}

// Validation rejects unknown fields instead of granting publication by key removal.
export function portraitReviewFailures(review) {
  const fields = {
    schemaVersion: 'number', personId: 'string', characterId: 'string', imageSha256: 'hash',
    canonPromotion: 'boolean', final3dPortraitContractSatisfied: 'boolean', technology: 'string',
    ownerVerdict: { verdict: 'string' },
    imageModification: { operation: 'string', inputSha256: 'hash', outputSha256: 'hash', generationReceiptAvailable: 'boolean', originalRgbPreserved: 'boolean', exactReductionMeasured: 'boolean' },
    imageHashHistory: 'hashes',
  }
  return publicSchemaFailures(review, fields, 'review')
}

export function portraitSelectionFailures(selection) {
  return publicSchemaFailures(selection, {
    schemaVersion: 'number', status: 'string', canonPromotion: 'boolean', final3dPortraitContractSatisfied: 'boolean', previousVerdictsPreserved: 'boolean',
    records: [{ personId: 'string', characterId: 'string', name: 'string', imageSha256: 'hash', previousImageSha256: 'hash', verdict: 'string', operation: 'string' }],
  }, 'selection')
}

function publicSchemaFailures(value, fields, root) {
  const failures = []
  function check(value, contract, path) {
    if (Array.isArray(contract)) {
      if (!Array.isArray(value)) { failures.push(path); return }
      value.forEach((item, index) => check(item, contract[0], path + '[' + index + ']'))
    } else if (typeof contract === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { failures.push(path); return }
      for (const [key, item] of Object.entries(value)) {
        if (!Object.hasOwn(contract, key)) failures.push(path + '.' + key)
        else check(item, contract[key], path + '.' + key)
      }
    } else if (contract === 'hashes') {
      if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && /^[a-f0-9]{64}$/.test(item))) failures.push(path)
    } else if (contract === 'hash') {
      if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) failures.push(path)
    } else if (typeof value !== contract) failures.push(path)
    else if (contract === 'string') failures.push(...publicPortraitStringFailures(value, path))
  }
  check(value, fields, root)
  return failures
}

export function generationEvidencePaths(value, path = '$') {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, item]) =>
    ['generationRequest', 'generationReceipt', 'previousImageReview'].includes(key)
      ? [path + '.' + key]
      : generationEvidencePaths(item, path + '.' + key))
}
