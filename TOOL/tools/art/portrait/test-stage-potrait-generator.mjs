import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { PUBLIC_FILES, stageGenerator } from './stage-potrait-generator.mjs';

test('staging exposes only the new route and browser files, not the asset database', t => {
  const root = mkdtempSync(join(tmpdir(), 'generator-stage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'Design/potrait-generator');
  const output = join(root, 'Wikis/site/dist');
  mkdirSync(source, { recursive: true });
  for (const name of PUBLIC_FILES) writeFileSync(join(source, name), name);
  for (const directory of ['assets/v2', 'data', 'raw', 'config', 'src', 'cache', 'views']) {
    mkdirSync(join(source, directory), { recursive: true });
    writeFileSync(join(source, directory, 'content.json'), directory);
  }
  mkdirSync(join(root, 'Tool/art/portrait'), { recursive: true });
  for (const name of ['portrait-gateway.mjs', 'portrait-attachment-rigs.json']) writeFileSync(join(root, 'Tool/art/portrait', name), name);
  writeFileSync(join(root, 'index.html'), '<a href="potrait-generator/">generator</a>');
  mkdirSync(join(output, 'portrait-demo'), { recursive: true });
  writeFileSync(join(output, 'portrait-demo/index.html'), 'obsolete');
  mkdirSync(join(output, 'play'), { recursive: true });
  writeFileSync(join(output, 'play/index.html'), 'preserved');

  const report = stageGenerator({ repoRoot: root });

  assert.equal(report.route, '/potrait-generator/');
  assert.equal(existsSync(join(output, 'portrait-demo')), false);
  assert.equal(readFileSync(join(output, 'index.html'), 'utf8'), '<a href="potrait-generator/">generator</a>');
  assert.equal(readFileSync(join(output, 'play/index.html'), 'utf8'), 'preserved');
  assert.equal(readFileSync(join(output, 'potrait-generator/assets/v2/content.json'), 'utf8'), 'assets/v2');
  for (const directory of ['data', 'raw', 'config', 'src', 'cache', 'views']) assert.equal(existsSync(join(output, 'potrait-generator', directory)), false);
  assert.ok(existsSync(join(output, 'Tool/art/portrait/portrait-gateway.mjs')));
});
