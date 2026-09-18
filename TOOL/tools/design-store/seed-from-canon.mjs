#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DB_NAME,
  exportCanonPage,
  exportDocumentPage,
  exportIndexPage,
  ingestCanonDir,
  listCanonFiles,
  putDocument,
} from './mda-store.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const corePath = join(here, 'instances/janseon-core.json');
const catalogPath = join(here, 'instances/catalog.json');
const documents = [
  JSON.parse(readFileSync(corePath, 'utf8')),
  ...JSON.parse(readFileSync(catalogPath, 'utf8')),
];

function findNamedMarkdown(root, fileName) {
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let names;
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const full = join(dir, name);
      if (name === fileName) {
        try {
          readFileSync(full);
          return full;
        } catch {
          continue;
        }
      }
      try {
        if (statSync(full).isDirectory()) stack.push(full);
      } catch {
        /* skip */
      }
    }
  }
  return null;
}

function resolveCanonPath(sourcePath) {
  for (const dir of ['LORE', 'GAME-LOGIC', 'GDD']) {
    const prefix = `${dir}/`;
    if (sourcePath.startsWith(prefix)) {
      const rest = sourcePath.slice(prefix.length);
      const direct = join(repoRoot, dir, rest);
      try {
        readFileSync(direct);
        return direct;
      } catch {
        const nested = findNamedMarkdown(join(repoRoot, dir), rest.split('/').pop());
        if (nested) return nested;
        return direct;
      }
    }
  }
  const legacy = sourcePath.match(/^(?:Wikis|docs)\/game-logic\/(.+)$/);
  if (legacy) {
    const rest = legacy[1];
    const fileName = rest.split('/').pop();
    for (const dir of ['GAME-LOGIC', 'LORE', 'GDD']) {
      const nested = findNamedMarkdown(join(repoRoot, dir), fileName);
      if (nested) return nested;
    }
    return join(repoRoot, 'LORE', rest);
  }
  return join(repoRoot, sourcePath);
}

const canonCache = new Map();
function canonText(sourcePath) {
  if (!canonCache.has(sourcePath)) {
    canonCache.set(sourcePath, readFileSync(resolveCanonPath(sourcePath), 'utf8'));
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
      leaked.push({
        documentId: doc.id,
        kind: row.kind,
        heading: row.heading,
        body: row.body,
        sourcePath: row.sourcePath,
      });
    }
  }
}
if (leaked.length) {
  console.error(JSON.stringify({ leaked }, null, 2));
  process.exit(1);
}

const outRoot = join(repoRoot, 'GDD/design-store');
const dbPath = join(outRoot, DB_NAME);
mkdirSync(outRoot, { recursive: true });
for (const document of documents) {
  putDocument({ dbPath, document });
}
const ingested = ingestCanonDir({
  dbPath,
  canonDomains: [
    { root: join(repoRoot, 'LORE'), prefix: 'LORE' },
    { root: join(repoRoot, 'GAME-LOGIC'), prefix: 'GAME-LOGIC', exclude: (rel) => rel.startsWith('site/') },
    { root: join(repoRoot, 'GDD'), prefix: 'GDD', exclude: (rel) => rel.includes('/') },
  ],
});
exportIndexPage({ dbPath, outPath: join(outRoot, 'index.html') });
for (const document of documents) {
  exportDocumentPage({
    dbPath,
    outPath: join(outRoot, document.id, 'index.html'),
    documentId: document.id,
  });
}
for (const file of listCanonFiles({ dbPath })) {
  exportCanonPage({
    dbPath,
    outPath: join(outRoot, 'canon', file.id, 'index.html'),
    fileId: file.id,
  });
}
console.log(JSON.stringify({
  ok: true,
  documents: documents.map((d) => d.id),
  canon: ingested.files,
  dbPath,
}));
