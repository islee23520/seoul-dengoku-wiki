import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gatePath = join('tools', 'architecture', 'check-unity-architecture.mjs');
const bootstrapScene = join('Game', 'Assets', 'Scenes', 'Bootstrap.unity');
const mainTitleScene = join('Game', 'Assets', 'Scenes', 'MainTitle.unity');
const foundationScene = join('Game', 'Assets', 'Scenes', 'Foundation.unity');
const compositionDir = join('Game', 'Assets', 'Janseon', 'Foundation', 'Composition');
const appScopeMeta = join(compositionDir, 'AppLifetimeScope.cs.meta');
const mainTitleScopeMeta = join(compositionDir, 'MainTitleLifetimeScope.cs.meta');
const foundationScopeMeta = join(compositionDir, 'FoundationLifetimeScope.cs.meta');
const buildSettings = join('Game', 'ProjectSettings', 'EditorBuildSettings.asset');

// The gate resolves its repository root from its own module URL, so a fixture that
// contains a copy of the gate is checked as if the fixture were the repository.
const fixtureSources = [
  join('Game', 'Assets', 'Janseon'),
  join('Game', 'Assets', 'Scenes'),
  buildSettings,
  gatePath,
];

const decoyGuid = 'deadbeefdeadbeefdeadbeefdeadbeef';
const appScopeGuid = await readGuid(join(repositoryRoot, appScopeMeta));
const mainTitleScopeGuid = await readGuid(join(repositoryRoot, mainTitleScopeMeta));
const foundationScopeGuid = await readGuid(join(repositoryRoot, foundationScopeMeta));

const scenarios = [
  {
    id: 'clean-fixture',
    description: 'unmodified copy of the production scenes and scripts',
    expectedExit: 0,
    expectedRule: null,
    async mutate() {},
  },
  {
    id: 'app-scope-component-removed',
    description: 'Bootstrap keeps the scope GameObject but loses the AppLifetimeScope component',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, bootstrapScene, (source) => removeDocumentContaining(source, appScopeGuid));
    },
  },
  {
    id: 'script-guid-replaced',
    description: 'Bootstrap scope component points at an unknown script GUID',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, bootstrapScene, (source) => source.replaceAll(appScopeGuid, decoyGuid));
    },
  },
  {
    id: 'disabled-component',
    description: 'Bootstrap scope component is serialized as disabled',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, bootstrapScene, (source) =>
        replaceDocumentContaining(source, appScopeGuid, (document) =>
          document.replace(/^ {2}m_Enabled: 1$/m, '  m_Enabled: 0')));
    },
  },
  {
    id: 'editor-class-identifier-replaced',
    description: 'Bootstrap scope component declares the wrong managed class identifier',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, bootstrapScene, (source) =>
        replaceDocumentContaining(source, appScopeGuid, (document) =>
          document.replace(
            'Janseon.Foundation::Janseon.Foundation.Composition.AppLifetimeScope',
            'Janseon.Foundation::Janseon.Foundation.Composition.FoundationLifetimeScope')));
    },
  },
  {
    id: 'duplicate-expected-scope',
    description: 'Foundation carries a second FoundationLifetimeScope component',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, foundationScene, (source) => {
        const original = documentContaining(source, foundationScopeGuid);
        const originalId = documentId(original);
        const duplicateId = `${originalId}0`;
        const duplicate = original.replace(`&${originalId}`, `&${duplicateId}`);
        const withDuplicate = source.replace(original, `${original}${duplicate}`);

        return replaceDocumentContaining(withDuplicate, 'm_Name: Foundation Lifetime Scope', (document) =>
          document.replace(
            `  - component: {fileID: ${originalId}}\n`,
            `  - component: {fileID: ${originalId}}\n  - component: {fileID: ${duplicateId}}\n`));
      });
    },
  },
  {
    id: 'detached-component-reference',
    description: 'Foundation scope component is not listed by its owning GameObject',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, foundationScene, (source) => {
        const componentId = documentId(documentContaining(source, foundationScopeGuid));

        return replaceDocumentContaining(source, 'm_Name: Foundation Lifetime Scope', (document) =>
          document.replace(`  - component: {fileID: ${componentId}}\n`, ''));
      });
    },
  },
  {
    id: 'name-only-decoy',
    description: 'Foundation keeps the matching GameObject name but replaces its scope with a scriptless decoy',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, foundationScene, (source) =>
        replaceDocumentContaining(source, foundationScopeGuid, (document) =>
          document
            .replace(/^ {2}m_Script: .*$/m, '  m_Script: {fileID: 0}')
            .replace(/^ {2}m_EditorClassIdentifier: .*$/m, '  m_EditorClassIdentifier: ')));
    },
  },
  {
    id: 'malformed-scene-yaml',
    description: 'Bootstrap is truncated inside a document with an unparsable header',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, bootstrapScene, (source) => {
        const cut = source.indexOf('--- !u!114 ');
        assert.notEqual(cut, -1, `${bootstrapScene}: expected a MonoBehaviour document`);

        return `${source.slice(0, cut)}--- !u!114 &\n\tMonoBehaviour: [broken\n`;
      });
    },
  },
  {
    id: 'stale-meta-guid',
    description: 'AppLifetimeScope.cs.meta drifts to a GUID no scene references',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, appScopeMeta, (source) => source.replace(appScopeGuid, decoyGuid));
    },
  },
  {
    id: 'missing-script-meta',
    description: 'AppLifetimeScope.cs.meta is deleted so no GUID can be resolved',
    expectedExit: 1,
    expectedRule: 'SCOPE_SCRIPT_META',
    async mutate(root) {
      await rm(join(root, appScopeMeta));
    },
  },
  {
    id: 'main-title-scope-removed',
    description: 'MainTitle scene loses its MainTitleLifetimeScope component',
    expectedExit: 1,
    expectedRule: 'SCENE_SCOPE_OWNERSHIP',
    async mutate(root) {
      await editFile(root, mainTitleScene, (source) => removeDocumentContaining(source, mainTitleScopeGuid));
    },
  },
  {
    id: 'build-order-swapped',
    description: 'EditorBuildSettings loads Foundation before Bootstrap',
    expectedExit: 1,
    expectedRule: 'SCENE_BUILD_ORDER',
    async mutate(root) {
      await editFile(root, buildSettings, (source) =>
        source
          .replace('path: Assets/Scenes/Bootstrap.unity', 'path: Assets/Scenes/PLACEHOLDER.unity')
          .replace('path: Assets/Scenes/Foundation.unity', 'path: Assets/Scenes/Bootstrap.unity')
          .replace('path: Assets/Scenes/PLACEHOLDER.unity', 'path: Assets/Scenes/Foundation.unity'));
    },
  },
  {
    id: 'bootstrap-build-entry-disabled',
    description: 'EditorBuildSettings lists Bootstrap first but disables the entry',
    expectedExit: 1,
    expectedRule: 'SCENE_BUILD_ORDER',
    async mutate(root) {
      await editFile(root, buildSettings, (source) => source.replace('  - enabled: 1', '  - enabled: 0'));
    },
  },
  {
    id: 'dead-bootstrap-allowlist',
    description: 'a new BootstrapRoot.cs calls DontDestroyOnLoad under the removed allowlist path',
    expectedExit: 1,
    expectedRule: 'DONT_DESTROY_AUTHORITY',
    async mutate(root) {
      await writeFile(
        join(root, compositionDir, 'BootstrapRoot.cs'),
        'namespace Janseon.Foundation.Composition\n'
          + '{\n'
          + '    internal static class BootstrapRoot\n'
          + '    {\n'
          + '        internal static void Keep(UnityEngine.GameObject root)\n'
          + '        {\n'
          + '            UnityEngine.Object.DontDestroyOnLoad(root);\n'
          + '        }\n'
          + '    }\n'
          + '}\n');
    },
  },
  {
    id: 'ui-toolkit-runtime-usage',
    description: 'a runtime script uses UI Toolkit types outside any Editor path',
    expectedExit: 1,
    expectedRule: 'UI_TOOLKIT_BANNED',
    async mutate(root) {
      await writeFile(
        join(root, compositionDir, 'ToolkitPresenter.cs'),
        'using UnityEngine.UIElements;\n'
          + '\n'
          + 'namespace Janseon.Foundation.Composition\n'
          + '{\n'
          + '    internal sealed class ToolkitPresenter\n'
          + '    {\n'
          + '        private readonly UIDocument document;\n'
          + '\n'
          + '        internal VisualElement Root => document.rootVisualElement;\n'
          + '    }\n'
          + '}\n');
    },
  },
];

const temporaryRoot = await mkdtemp(join(tmpdir(), 'janseon-architecture-gate-'));
const rows = [];

// Signals bypass the finally block, so an interrupted run still has to drop its fixtures.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    rmSync(temporaryRoot, { recursive: true, force: true });
    process.exit(130);
  });
}

try {
  for (const scenario of scenarios) {
    const root = await createFixture(scenario.id);
    await scenario.mutate(root);

    const result = await runGate(root);
    const output = `${result.stdout}${result.stderr}`;
    const violations = output.split('\n').filter((line) => /^[A-Z][A-Z_]+: /.test(line));
    const actualRules = [...new Set(violations.map((line) => line.slice(0, line.indexOf(':'))))];
    const problems = [];

    if (result.exitCode !== scenario.expectedExit) {
      problems.push(`expected exit ${scenario.expectedExit}, got ${result.exitCode}`);
    }

    if (scenario.expectedRule === null) {
      if (actualRules.length > 0) problems.push(`expected no violation, got ${actualRules.join(', ')}`);
      if (!result.stdout.includes('unity architecture gate passed')) problems.push('missing pass line');
    } else {
      if (!actualRules.includes(scenario.expectedRule)) {
        problems.push(`expected rule ${scenario.expectedRule}, got ${actualRules.join(', ') || 'none'}`);
      }
      if (output.includes('unity architecture gate passed')) problems.push('printed a misleading pass line');
    }

    if (/^\s+at .+:\d+:\d+\)?$/m.test(result.stderr)) problems.push('gate crashed with a stack trace');

    rows.push({
      id: scenario.id,
      description: scenario.description,
      expectedExit: scenario.expectedExit,
      actualExit: result.exitCode,
      expectedRule: scenario.expectedRule ?? '(none)',
      actualRules: actualRules.join(' ') || '(none)',
      status: problems.length === 0 ? 'OK' : 'FAIL',
      problems,
      violations,
    });

    await rm(root, { recursive: true, force: true });
  }

  printMatrix(rows);

  const repositoryResult = await runGate(repositoryRoot);
  console.log(`\nrepository gate: exit ${repositoryResult.exitCode} :: ${repositoryResult.stdout.trim() || repositoryResult.stderr.trim()}`);

  for (const row of rows) {
    assert.equal(row.status, 'OK', `${row.id}: ${row.problems.join('; ')}`);
  }

  assert.equal(repositoryResult.exitCode, 0, `repository gate must pass:\n${repositoryResult.stderr}`);
  assert.match(repositoryResult.stdout, /unity architecture gate passed/);

  console.log(`unity architecture gate tests passed (${rows.length} scenarios)`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

function printMatrix(matrix) {
  const header = ['scenario', 'expected exit', 'actual exit', 'expected rule', 'actual rules', 'status'];
  const table = [header, ...matrix.map((row) => [
    row.id,
    String(row.expectedExit),
    String(row.actualExit),
    row.expectedRule,
    row.actualRules,
    row.status,
  ])];
  const widths = header.map((_, column) => Math.max(...table.map((row) => row[column].length)));

  console.log('mutation matrix');

  for (const [index, row] of table.entries()) {
    console.log(row.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd());
    if (index === 0) console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  }

  for (const row of matrix) {
    console.log(`\n${row.status === 'OK' ? '.' : '!'} ${row.id}: ${row.description}`);
    for (const violation of row.violations) console.log(`    ${violation}`);
    if (row.violations.length === 0) console.log('    (gate reported no violation)');
    if (row.problems.length > 0) console.log(`    problems: ${row.problems.join('; ')}`);
  }
}

async function createFixture(name) {
  const root = join(temporaryRoot, name);

  for (const relativePath of fixtureSources) {
    const destination = join(root, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(repositoryRoot, relativePath), destination, { recursive: true });
  }

  return root;
}

function runGate(root) {
  return new Promise((settle) => {
    execFile(process.execPath, [join(root, gatePath)], { cwd: root }, (error, stdout, stderr) => {
      const exitCode = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
      settle({ exitCode, stdout, stderr });
    });
  });
}

async function editFile(root, relativePath, transform) {
  const path = join(root, relativePath);
  const before = await readFile(path, 'utf8');
  const after = transform(before);

  assert.notEqual(after, before, `${relativePath}: mutation changed nothing`);
  await writeFile(path, after);
}

async function readGuid(path) {
  const source = await readFile(path, 'utf8');
  const match = /^guid:\s*([0-9a-f]{32})\s*$/m.exec(source);

  assert.notEqual(match, null, `${path}: expected a 32-character guid`);

  return match[1];
}

function splitDocuments(source) {
  return source.split(/^(?=--- !u!)/m);
}

function documentId(document) {
  const match = /^--- !u!\d+ &(-?\d+)/.exec(document);

  assert.notEqual(match, null, 'expected a Unity document header');

  return match[1];
}

function documentContaining(source, needle) {
  const document = splitDocuments(source).find((candidate) =>
    candidate.startsWith('--- !u!') && candidate.includes(needle));

  assert.notEqual(document, undefined, `expected a document containing ${needle}`);

  return document;
}

function replaceDocumentContaining(source, needle, transform) {
  const document = documentContaining(source, needle);

  return source.replace(document, transform(document));
}

function removeDocumentContaining(source, needle) {
  const document = documentContaining(source, needle);

  return source.replace(document, '');
}
