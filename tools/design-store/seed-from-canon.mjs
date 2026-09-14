#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { putDocument, exportDocumentPage, DB_NAME } from './mda-store.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../..');
const instancePath = join(here, 'instances/janseon-core.json');
const document = JSON.parse(readFileSync(instancePath, 'utf8'));
const canonFiles = ['Concept.md', 'Design.md', 'Intent.md'];
const canon = canonFiles.map((f) => readFileSync(join(repoRoot, f), 'utf8')).join('\n');

function walk(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(walk);
  if (value && typeof value === 'object') return Object.values(value).flatMap(walk);
  return [];
}

const bodies = [
  ...document.onePage.panels.map((p) => p.body),
  ...document.mechanics.map((p) => p.body),
  ...document.dynamics.map((p) => p.body),
  ...document.aesthetics.map((p) => p.body),
];
const leaked = bodies.filter((s) => !canon.includes(s));
if (leaked.length) {
  console.error(JSON.stringify({ leaked }, null, 2));
  process.exit(1);
}

const dbPath = join(repoRoot, 'design-store', DB_NAME);
putDocument({ dbPath, document });
exportDocumentPage({
  dbPath,
  outPath: join(repoRoot, 'design-store/index.html'),
  documentId: document.id,
});
console.log(JSON.stringify({ ok: true, id: document.id, dbPath, strings: bodies.length }));
