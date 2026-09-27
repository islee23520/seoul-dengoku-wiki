import { createHash } from 'node:crypto'

import { ATLAS_SCHEMA } from './world-atlas-schema.mjs'

export function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function extractAtlasJson(markdown) {
  const matches = [...markdown.matchAll(/```json\s*([\s\S]*?)```/g)];
  const atlasMatch = matches.find((match) => match[1].includes(ATLAS_SCHEMA));
  const atlasBlock = atlasMatch?.[1];
  if (!atlasBlock) return { ok: false, error: 'missing atlas json fence' };
  try {
    const value = JSON.parse(atlasBlock);
    const headings = [...markdown.matchAll(/^## 무소속\s*$/gm)];
    if (headings.length !== 1) return { ok: false, error: 'E_UNAFFILIATED_HEADING' };
    const heading = headings[0];
    if (heading.index < atlasMatch.index + atlasMatch[0].length || /^## /m.test(markdown.slice(heading.index + heading[0].length))) {
      return { ok: false, error: 'E_UNAFFILIATED_POSITION' };
    }
    const section = markdown.slice(heading.index + heading[0].length).trim();
    const fence = section.match(/^```json\s*([\s\S]*?)```$/);
    if (!fence) return { ok: false, error: 'E_UNAFFILIATED_FENCE' };
    const collection = JSON.parse(fence[1]);
    if (Object.hasOwn(value, 'unaffiliated') || Object.keys(collection).join() !== 'unaffiliated') {
      return { ok: false, error: 'E_UNAFFILIATED_COLLECTION' };
    }
    const keys = [...fence[1].matchAll(/"(K\d+)"\s*:/g)].map((match) => match[1]);
    if (new Set(keys).size !== keys.length) return { ok: false, error: 'E_UNAFFILIATED_DUPLICATE_ID' };
    return { ok: true, value: { ...value, unaffiliated: collection.unaffiliated } };
  } catch (err) {
    return { ok: false, error: err instanceof SyntaxError ? err.message : 'invalid atlas json' };
  }
}
