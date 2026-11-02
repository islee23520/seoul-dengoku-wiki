#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { prepareCompactPrompt } from '../lib/compact-prompt.mjs';

try {
  if (process.argv.length !== 3) throw new Error('usage: node bin/portrait-compact-prepare.mjs <design-json>');
  console.log(JSON.stringify(prepareCompactPrompt(JSON.parse(await readFile(process.argv[2], 'utf8'))), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
