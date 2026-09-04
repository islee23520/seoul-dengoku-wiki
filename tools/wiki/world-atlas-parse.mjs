import { createHash } from 'node:crypto';

import { ATLAS_SCHEMA, COMPANY_TOKENS } from './world-atlas-schema.mjs';

export function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function extractAtlasJson(markdown) {
  const matches = [...markdown.matchAll(/```json\s*([\s\S]*?)```/g)];
  const atlasBlock = matches.map((m) => m[1]).find((body) => body.includes(ATLAS_SCHEMA));
  if (!atlasBlock) return { ok: false, error: 'missing atlas json fence' };
  try {
    return { ok: true, value: JSON.parse(atlasBlock) };
  } catch (err) {
    return { ok: false, error: err instanceof SyntaxError ? err.message : 'invalid atlas json' };
  }
}

export function parseCastIndex(markdown) {
  const humans = [];
  let stateName = null;
  let stateId = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^## 국가 (\d+) (.+)$/);
    if (heading) {
      stateId = `S${heading[1].padStart(2, '0')}`;
      stateName = heading[2].trim();
      continue;
    }
    if (!stateId || !line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 3 || cells[0] === '이름' || cells[0].startsWith('---') || cells[0] === '') continue;
    humans.push({
      id: `K${String(humans.length + 1).padStart(3, '0')}`,
      name: cells[0],
      role: cells[1],
      stage: cells[2],
      state_id: stateId,
      state_name: stateName,
      source_anchor: `Cast-Index.md#${stateId}`,
    });
  }
  return humans;
}

export function proseSentences(prose) {
  const body = String(prose ?? '')
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')
    .trim();
  if (body === '') return [];
  return body
    .split(/(?<=다\.)(?:\s+|$)|(?<=[.。!?])(?:\s+|$)/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

export function scanCompanyTokens(text, fail, rule, where) {
  for (const token of COMPANY_TOKENS) {
    if (String(text).includes(token)) fail(rule, `${where} token=${token}`);
  }
}
