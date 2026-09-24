import { createHash } from 'node:crypto'

import { ATLAS_SCHEMA } from './world-atlas-schema.mjs'

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
