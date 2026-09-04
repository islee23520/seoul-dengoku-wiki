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

export function normalizeStoryTemplateText(text, batchNames = [], batchIds = []) {
  let t = String(text ?? '');
  const ids = [...batchIds].sort((a, b) => b.length - a.length);
  const names = [...batchNames].sort((a, b) => b.length - a.length);
  for (const id of ids) t = t.split(id).join('');
  for (const name of names) t = t.split(name).join('');
  t = t.replace(/STORY-B\d{3}-[A-Z0-9]+/g, '');
  t = t.replace(/\b(?:HC|HP|XT|S)\d{2}\b/g, '');
  t = t.replace(/[A-Z]+-\d+(?:-[A-Z0-9]+)*/g, '');
  t = t.replace(/\d+/g, '#');
  t = t.replace(/\s+/g, '');
  return t;
}

export function charBigramSet(text) {
  const out = new Set();
  const s = String(text ?? '');
  for (let i = 0; i < s.length - 1; i += 1) out.add(s.slice(i, i + 2));
  return out;
}

export function bigramJaccard(a, b) {
  const A = charBigramSet(a);
  const B = charBigramSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/** Near-copy scaffold detector: strip IDs/names/codes then compare section bodies. */
export function findNearTemplatePairs(actors, sectionKeys, opts = {}) {
  const threshold = opts.threshold ?? 0.62;
  const minLen = opts.minLen ?? 48;
  const names = actors.map((a) => a.name).filter(Boolean);
  const ids = actors.map((a) => a.id).filter(Boolean);
  const hits = [];
  for (const key of sectionKeys) {
    const norms = actors.map((actor) => ({
      id: actor.id,
      text: normalizeStoryTemplateText(actor.sections?.[key] ?? '', names, ids),
    }));
    for (let i = 0; i < norms.length; i += 1) {
      for (let j = i + 1; j < norms.length; j += 1) {
        if (norms[i].text.length < minLen || norms[j].text.length < minLen) continue;
        const sim = bigramJaccard(norms[i].text, norms[j].text);
        if (sim >= threshold) {
          hits.push({ key, left: norms[i].id, right: norms[j].id, similarity: sim });
        }
      }
    }
  }
  return hits;
}
