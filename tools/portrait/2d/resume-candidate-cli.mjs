#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectCandidate } from './resume-candidate.mjs';

// Inspect caller-owned candidate paths; this entry never loads a provider.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('usage: node resume-candidate-cli.mjs <inspection.json>');
    console.log(JSON.stringify(await inspectCandidate(JSON.parse(await readFile(process.argv[2], 'utf8')))));
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
