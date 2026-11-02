export class CanonError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`)
    this.name = 'CanonError'
    this.code = code
  }
}
