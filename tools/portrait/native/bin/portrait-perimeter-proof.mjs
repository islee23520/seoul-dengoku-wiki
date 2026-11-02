#!/usr/bin/env node
import { exportPerimeterProof } from '../lib/perimeter-proof.mjs';
try {
  if (process.argv.length !== 4) throw new Error('usage: node bin/portrait-perimeter-proof.mjs <source.png> <new-output-directory>');
  const result = await exportPerimeterProof(process.argv[2], process.argv[3]);
  console.log(JSON.stringify({ sourceSHA: result.sourceSHA, tiles: result.tiles.length, perimeterPixels: result.perimeterPixels, coveredPerimeterPixels: result.coveredPerimeterPixels, resampled: result.resampled }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
