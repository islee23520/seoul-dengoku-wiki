export function parseArchitectureCsv(text) {
  const records = []
  let fields = [], value = '', quoted = false, line = 1, startLine = 1
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) { fields.push(value); value = '' }
    else if (char === '\n' && !quoted) {
      fields.push(value.replace(/\r$/, ''))
      records.push({ csvLine: startLine, fields })
      fields = []; value = ''; line += 1; startLine = line
    } else { value += char; if (char === '\n') line += 1 }
  }
  if (value || fields.length) { fields.push(value.replace(/\r$/, '')); records.push({ csvLine: startLine, fields }) }
  if (quoted) throw new Error('E_ARCHITECTURE_CSV_QUOTE')
  const headers = records.shift().fields
  return records.map(({ csvLine, fields }, rowIndex) => {
    if (fields.length !== headers.length) throw new Error(`E_ARCHITECTURE_CSV_COLUMNS:${csvLine}`)
    return { csvLine, rowIndex, values: Object.fromEntries(headers.map((header, index) => [header, fields[index]])) }
  })
}

export function reconcileArchitecture(station, rows) {
  if (station.observed_levels_source !== 'OA-11572') return { status: 'source-unavailable', verified: false, lines: [] }
  const lines = station.observed_levels.lines.map((observed, index) => {
    const candidates = rows.filter((row) => row.values['역명'] === station.name && row.values['호선'] === observed.line)
    const expected = { 역명: station.name, 호선: observed.line, 형식: observed.form, 층수: observed.code, '면적(㎡)': observed.area, 준공년도: observed.year }
    const base = { observedPointer: `/observed_levels/lines/${index}`, key: { stationName: station.name, line: observed.line }, expected }
    if (!candidates.length) return { ...base, status: 'source-row-missing', verified: false, rows: [] }
    if (candidates.length !== 1) return { ...base, status: 'ambiguous-source-key', verified: false, rows: candidates }
    const row = candidates[0]
    const mismatches = Object.keys(expected).filter((field) => row.values[field] !== expected[field])
    return { ...base, status: mismatches.length ? 'field-mismatch' : 'matched', verified: mismatches.length === 0, rows: [row], mismatches }
  })
  return { status: lines.length && lines.every((line) => line.verified) ? 'matched' : 'unverified', verified: lines.length > 0 && lines.every((line) => line.verified), lines }
}
