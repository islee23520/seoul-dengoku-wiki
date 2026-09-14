#!/usr/bin/env node
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DB_NAME,
  exportDocumentPage,
  exportIndexPage,
  putDocument,
} from './mda-store.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../..');
const corePath = join(here, 'instances/janseon-core.json');
const catalogPath = join(here, 'instances/catalog.json');
const documents = [
  JSON.parse(readFileSync(corePath, 'utf8')),
  ...JSON.parse(readFileSync(catalogPath, 'utf8')),
];

const canonCache = new Map();
function canonText(sourcePath) {
  if (!canonCache.has(sourcePath)) {
    canonCache.set(sourcePath, readFileSync(join(repoRoot, sourcePath), 'utf8'));
  }
  return canonCache.get(sourcePath);
}

function bodiesOf(doc) {
  return [
    ...doc.onePage.panels.map((p) => ({ kind: 'panel', ...p })),
    ...doc.mechanics.map((p) => ({ kind: 'mechanic', heading: p.name, ...p })),
    ...doc.dynamics.map((p) => ({ kind: 'dynamic', heading: p.name, ...p })),
    ...doc.aesthetics.map((p) => ({ kind: 'aesthetic', heading: p.kind, ...p })),
  ];
}

const leaked = [];
for (const doc of documents) {
  for (const row of bodiesOf(doc)) {
    const text = canonText(row.sourcePath);
    if (!text.includes(row.body)) {
      leaked.push({ documentId: doc.id, kind: row.kind, heading: row.heading, body: row.body, sourcePath: row.sourcePath });
    }
  }
}
if (leaked.length) {
  console.error(JSON.stringify({ leaked }, null, 2));
  process.exit(1);
}

const dbPath = join(repoRoot, 'design-store', DB_NAME);
mkdirSync(dirname(dbPath), { recursive: true });
for (const document of documents) {
  putDocument({ dbPath, document });
}
exportIndexPage({ dbPath, outPath: join(repoRoot, 'design-store/index.html') });
for (const document of documents) {
  exportDocumentPage({
    dbPath,
    outPath: join(repoRoot, 'design-store', document.id, 'index.html'),
    documentId: document.id,
  });
}
console.log(JSON.stringify({ ok: true, documents: documents.map((d) => d.id), dbPath }));
