export const validatedDensities = (regions, source) => {
  const values = source.density2126ByDong
  const codes = new Set(regions.map((region) => region.id.replace(/^region:/u, '')))
  if (codes.size !== 427 || Object.keys(values).length !== 427 || Object.keys(values).some((code) => !codes.has(code) || !Number.isFinite(values[code]) || values[code] < 0)) {
    throw new Error('E_REGION_POPULATION_COVERAGE')
  }
  return values
}
