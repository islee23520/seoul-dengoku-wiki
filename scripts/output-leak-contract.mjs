// Public content hashes bind approved images; they are not LFS pointer text.
export function approvedPortraitHashes(catalog, selection, reviews) {
  const hashes = new Set(selection.records.filter(row => row.verdict === 'pass' && catalog.entries.some(entry => entry.personId === row.personId && entry.imageSha256 === row.imageSha256)).map(row => row.imageSha256))
  for (const entry of catalog.entries) {
    const review = reviews.find(row => row.personId === entry.personId)
    if (review?.ownerVerdict?.verdict === 'pass' && review.characterId === entry.characterId && review.imageSha256 === entry.imageSha256) hashes.add(entry.imageSha256)
  }
  return hashes
}

export function outputLeakFindings(bytes, forbidden, lfsOids, approved) {
  const text = bytes.toString('utf8')
  return [
    ...(/version https:\/\/git-lfs|oid sha256:/m.test(text) ? [{ kind: 'lfs-pointer-syntax' }] : []),
    ...[...forbidden, ...lfsOids.filter(oid => !approved.has(oid))]
      .filter(token => bytes.includes(Buffer.from(token))).map(token => ({ token })),
  ]
}
