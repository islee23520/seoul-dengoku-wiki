import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson, sha256Text } from './world-atlas-parse.mjs';
import { projectionsFromAtlas } from './world-atlas-render.mjs';
import { ISOMETRIC_DIAGRAM_ASSETS } from './world-atlas-schema.mjs';

function parseArgs(argv) {
  const opts = { atlas: null, out: null, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--check') opts.check = true;
    else if (flag === '--atlas') {
      i += 1;
      if (argv[i] === undefined) throw new Error('missing value for --atlas');
      opts.atlas = argv[i];
    } else if (flag === '--out') {
      i += 1;
      if (argv[i] === undefined) throw new Error('missing value for --out');
      opts.out = argv[i];
    } else throw new Error(`unknown argument: ${flag}`);
  }
  if (!opts.atlas) throw new Error('--atlas is required');
  return opts;
}

export function projectionDestination(outDir, name) {
  if (ISOMETRIC_DIAGRAM_ASSETS.includes(name) && basename(outDir) === 'game-logic') {
    return join(dirname(outDir), 'assets', 'wiki', name);
  }
  return join(outDir, name);
}

export async function materializeWorldAtlas({ atlasPath, outDir, check = false }) {
  const markdown = await readFile(atlasPath, 'utf8');
  const parsed = extractAtlasJson(markdown);
  if (!parsed.ok) throw new Error(parsed.error);
  const atlasHash = sha256Text(markdown);
  const files = projectionsFromAtlas(parsed.value, atlasHash);
  const hashes = {};
  if (check) {
    const mismatches = [];
    for (const [name, body] of Object.entries(files)) {
      hashes[name] = sha256Text(body);
      let existing;
      try {
        existing = await readFile(projectionDestination(outDir, name), 'utf8');
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          mismatches.push(`missing ${name}`);
          continue;
        }
        throw err;
      }
      if (existing !== body) mismatches.push(`stale ${name}`);
    }
    if (mismatches.length > 0) {
      const error = new Error(mismatches.join('\n'));
      error.hashes = hashes;
      throw error;
    }
    return { hashes, atlasHash };
  }
  await mkdir(outDir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    hashes[name] = sha256Text(body);
    const dest = projectionDestination(outDir, name);
    const tmp = `${dest}.tmp`;
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(tmp, body);
    await rename(tmp, dest);
  }
  return { hashes, atlasHash };
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const atlasPath = resolve(opts.atlas);
    const outDir = resolve(opts.out ?? dirname(atlasPath));
    const result = await materializeWorldAtlas({ atlasPath, outDir, check: opts.check });
    for (const [name, hash] of Object.entries(result.hashes)) {
      console.log(`${name} ${hash}`);
    }
    console.log(`atlas ${result.atlasHash}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
