import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC_FILES = Object.freeze([
  'index.html', 'pipeline-archive.html', 'pipeline-archify.html', 'runtime-archify.html', 'portrait.css', 'portrait-curation.css',
  'portrait-ui.mjs', 'portrait-state.mjs', 'portrait-workflow-ui.mjs',
  'portrait-curation.mjs', 'portrait-rig-overlay.mjs',
  'portrait-browser-composite.mjs', 'portrait-browser-png.mjs',
]);

export function stageGenerator({ repoRoot }) {
  const repo = resolve(repoRoot);
  const source = join(repo, 'GAME-REFERENCE/potray-generator');
  const output = join(repo, 'GAME-LOGIC/site/dist');
  const destination = join(output, 'potrait-generator');
  // Only generated service subtrees are replaced; sibling hub services are preserved.
  for (const name of ['portrait-demo', 'potrait-generator']) {
    const generated = join(output, name);
    if (existsSync(generated)) rmSync(generated, { recursive: true });
  }
  mkdirSync(destination, { recursive: true });
  for (const name of PUBLIC_FILES) copyFileSync(join(source, name), join(destination, name));
  cpSync(join(source, 'assets'), join(destination, 'assets'), { recursive: true });
  copyFileSync(join(repo, 'index.html'), join(output, 'index.html'));
  const support = join(output, 'TOOL/tools/art/portrait');
  mkdirSync(support, { recursive: true });
  for (const name of ['portrait-gateway.mjs', 'portrait-attachment-rigs.json']) copyFileSync(join(repo, 'TOOL/tools/art/portrait', name), join(support, name));
  return { route: '/potrait-generator/', output, privatePathsExcluded: ['raw', 'data', 'views', 'cache', 'config', 'src', 'tests'] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(stageGenerator({ repoRoot: resolve(import.meta.dirname, '../../../..') }), null, 2));
}
