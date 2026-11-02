#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { inspectBatchCandidate } from './batch-resume.mjs';
try {
  console.log(JSON.stringify(await inspectBatchCandidate(JSON.parse(await readFile(process.argv[2], 'utf8')))));
} catch (error) {
  console.log(JSON.stringify({ status: 'failed', error: error.message }));
  process.exitCode = 2;
}
