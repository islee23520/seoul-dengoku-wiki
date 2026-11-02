#!/usr/bin/env node
import { resolve } from 'node:path';
import { auditBatch } from '../lib/batch-audit.mjs';

try {
  if (process.argv.length !== 3) throw new Error('usage: node bin/portrait-batch-audit.mjs <batch-root>');
  console.log(JSON.stringify(await auditBatch(resolve(process.argv[2])), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
