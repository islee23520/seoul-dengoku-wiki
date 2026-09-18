import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import { compositePortraitLayers } from './portrait-layer-composite.mjs';

export function ingestSeeThroughLayers({
  inputDir,
  schema,
  map,
  mode = 'target-contract',
  outputDir,
} = {}) {
  if (!inputDir || !schema || !map) {
    throw new Error('missing ingest inputs');
  }
  const mapping = map.modes?.[mode];
  if (!mapping) {
    throw new Error(`unknown ingest mode: ${mode}`);
  }

  const tags = new Map();
  for (const file of readdirSync(inputDir)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    tags.set(basename(file, extname(file)), join(inputDir, file));
  }

  const skipped = [];
  const unmapped = [];
  const slotSources = new Map();

  for (const [tag, path] of tags) {
    if (!Object.hasOwn(mapping, tag)) {
      unmapped.push(tag);
      continue;
    }
    const dests = mapping[tag];
    if (!Array.isArray(dests) || dests.length === 0) {
      skipped.push(tag);
      continue;
    }
    for (const slotId of dests) {
      const list = slotSources.get(slotId) ?? [];
      list.push({ tag, path });
      slotSources.set(slotId, list);
    }
  }

  if (outputDir && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const combineOrder = map.combineOrder ?? {};
  const slots = {};
  for (const [slotId, sources] of slotSources) {
    const order = combineOrder[slotId];
    const ordered = order
      ? [...sources].sort((a, b) => {
          const ia = order.indexOf(a.tag);
          const ib = order.indexOf(b.tag);
          return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        })
      : sources;

    if (ordered.length === 1) {
      if (outputDir) {
        const dest = join(outputDir, `${slotId}.png`);
        copyFileSync(ordered[0].path, dest);
        slots[slotId] = dest;
      } else {
        slots[slotId] = ordered[0].path;
      }
      continue;
    }

    const miniSchema = {
      slots: ordered.map((source, index) => ({
        id: source.tag,
        z: index,
        required: true,
      })),
    };
    const miniSlots = Object.fromEntries(ordered.map((source) => [source.tag, source.path]));
    const dest = outputDir ? join(outputDir, `${slotId}.png`) : undefined;
    compositePortraitLayers({ schema: miniSchema, slots: miniSlots, outputPath: dest });
    if (dest) slots[slotId] = dest;
  }

  return { slots, skipped, unmapped };
}
