import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const runtimeRoot = join(repositoryRoot, 'Game', 'Assets', 'Janseon');
const scenesRoot = join(repositoryRoot, 'Game', 'Assets', 'Scenes');
const buildSettingsPath = join(repositoryRoot, 'Game', 'ProjectSettings', 'EditorBuildSettings.asset');

const approvedSceneLoader = 'GAME/Assets/Janseon/Foundation/Composition/UnityFoundationSceneLoader.cs';
const engineFreeSegments = ['/Core/', '/Repository/', '/Repositories/'];

const gameObjectClassId = '1';
const monoBehaviourClassId = '114';
const monoScriptFileId = '11500000';
const monoScriptReferenceType = '3';
const documentHeaderPattern = /^--- !u!(\d+) &(-?\d+)(?: stripped)?\s*$/;

const expectedScopes = [
  {
    scene: 'Bootstrap.unity',
    typeName: 'AppLifetimeScope',
    scriptPath: 'GAME/Assets/Janseon/Foundation/Composition/AppLifetimeScope.cs',
    editorClassIdentifier: 'Janseon.Foundation::Janseon.Foundation.Composition.AppLifetimeScope',
  },
  {
    scene: 'MainTitle.unity',
    typeName: 'MainTitleLifetimeScope',
    scriptPath: 'GAME/Assets/Janseon/Foundation/Composition/MainTitleLifetimeScope.cs',
    editorClassIdentifier: 'Janseon.Foundation::Janseon.Foundation.Composition.MainTitleLifetimeScope',
  },
  {
    scene: 'Foundation.unity',
    typeName: 'FoundationLifetimeScope',
    scriptPath: 'GAME/Assets/Janseon/Foundation/Composition/FoundationLifetimeScope.cs',
    editorClassIdentifier: 'Janseon.Foundation::Janseon.Foundation.Composition.FoundationLifetimeScope',
  },
];

const violations = [];
const runtimeFiles = await collectRuntimeFiles();

for (const absolutePath of runtimeFiles) {
  const path = normalize(relative(repositoryRoot, absolutePath));
  const source = await readFile(absolutePath, 'utf8');

  forbidOutsideAllowlist(source, /SceneManager\.LoadScene(?:Async)?\s*\(/g, path, approvedSceneLoader, 'SCENE_LOAD_AUTHORITY');
  forbid(source, /DontDestroyOnLoad\s*\(/g, path, 'DONT_DESTROY_AUTHORITY');

  if (!path.includes('/Editor/')) {
    forbid(source, /\b(?:GameObject\.Find|FindObjectOfType|FindFirstObjectByType|FindAnyObjectByType)\s*</g, path, 'RUNTIME_OBJECT_SEARCH');
    forbid(source, /\b(?:GameObject\.Find|FindObjectOfType|FindFirstObjectByType|FindAnyObjectByType)\s*\(/g, path, 'RUNTIME_OBJECT_SEARCH');
    forbid(source, /\bstatic\s+(?!class\b)(?!readonly\b)[^;=\n]+\b(?:Instance|Current)\b/g, path, 'MUTABLE_STATIC_SERVICE_LOCATOR');
    forbid(source, /\bContainer\.Resolve\s*</g, path, 'SERVICE_LOCATOR_RESOLVE');
    forbid(source, /using\s+UnityEngine\.UIElements\b|\bUIDocument\b|\bVisualElement\b/g, path, 'UI_TOOLKIT_BANNED');
  }

  if (engineFreeSegments.some((segment) => path.includes(segment))) {
    forbid(source, /\busing\s+(?:UnityEngine|VContainer)\b|\b(?:UnityEngine|VContainer)\./g, path, 'UNITY_FREE_BOUNDARY');
  }
}

await verifyBuildOrder();
await verifyLifetimeScopes();

if (violations.length > 0) {
  for (const violation of violations) console.error(violation);
  console.error(`unity architecture gate failed with ${violations.length} violation(s)`);
  process.exitCode = 1;
} else {
  console.log(
    `unity architecture gate passed (${runtimeFiles.length} runtime files, ${expectedScopes.length} scene scopes verified)`,
  );
}

async function verifyBuildOrder() {
  const source = await read(buildSettingsPath);

  if (source === null) {
    violations.push(`SCENE_BUILD_ORDER: ${normalize(relative(repositoryRoot, buildSettingsPath))} is unreadable`);
    return;
  }

  const entries = [...source.matchAll(/^\s+- enabled:\s+(\S+)\r?\n\s+path:\s+(.+?)\r?$/gm)]
    .map((match) => ({ enabled: match[1], path: match[2].trim() }));
  const expected = [
    'Assets/Scenes/Bootstrap.unity',
    'Assets/Scenes/MainTitle.unity',
    'Assets/Scenes/Foundation.unity',
  ];
  const actual = entries.map((entry) => `${entry.path} (${entry.enabled === '1' ? 'enabled' : 'disabled'})`);

  if (
    entries.length !== expected.length
    || entries.some((entry, index) => entry.enabled !== '1' || entry.path !== expected[index])
  ) {
    violations.push(
      `SCENE_BUILD_ORDER: expected enabled ${expected.join(' -> ')}, got ${actual.join(' -> ') || 'none'}`,
    );
  }

  for (const path of expected) {
    if (await read(join(repositoryRoot, 'Game', path)) === null) violations.push(`SCENE_MISSING: Game/${path}`);
  }
}

async function verifyLifetimeScopes() {
  for (const scope of expectedScopes) {
    const guid = await readScriptGuid(scope);
    const source = await read(join(scenesRoot, scope.scene));

    if (source === null) {
      violations.push(`SCENE_SCOPE_OWNERSHIP: ${scope.scene} is unreadable`);
      continue;
    }

    if (guid === null) continue;

    const malformed = source
      .split('\n')
      .filter((line) => line.startsWith('--- ') && !documentHeaderPattern.test(line));

    if (malformed.length > 0) {
      violations.push(`SCENE_SCOPE_OWNERSHIP: ${scope.scene} has ${malformed.length} unparsable document header(s)`);
    }

    verifySceneScope(scope, guid, parseUnityDocuments(source));
  }
}

function verifySceneScope(scope, guid, documents) {
  const rule = 'SCENE_SCOPE_OWNERSHIP';
  const identifiers = new Set(documents.map((document) => document.fileId));
  const gameObjects = new Map(
    documents
      .filter((document) => document.classId === gameObjectClassId && document.type === 'GameObject')
      .map((document) => [document.fileId, document]),
  );
  const behaviours = documents.filter(
    (document) => document.classId === monoBehaviourClassId && document.type === 'MonoBehaviour',
  );

  if (identifiers.size !== documents.length) {
    violations.push(`${rule}: ${scope.scene} contains duplicate document fileIDs`);
  }

  if (gameObjects.size === 0) {
    violations.push(`${rule}: ${scope.scene} has no parsable GameObject document`);
    return;
  }

  const owned = behaviours.filter((behaviour) => readReference(behaviour, 'm_Script').guid === guid);

  if (owned.length !== 1) {
    violations.push(
      `${rule}: ${scope.scene} expects exactly one ${scope.typeName} component with script guid ${guid}, found ${owned.length}`,
    );
  }

  const foreign = behaviours.filter((behaviour) =>
    !owned.includes(behaviour) && /LifetimeScope$/.test(readScalar(behaviour, 'm_EditorClassIdentifier') ?? ''));

  for (const behaviour of foreign) {
    violations.push(
      `${rule}: ${scope.scene} carries an unexpected scope component &${behaviour.fileId} `
        + `(${readScalar(behaviour, 'm_EditorClassIdentifier')})`,
    );
  }

  if (owned.length === 1) verifyScopeComponent(scope, owned[0], gameObjects, identifiers);
}

function verifyScopeComponent(scope, component, gameObjects, identifiers) {
  const rule = 'SCENE_SCOPE_OWNERSHIP';
  const script = readReference(component, 'm_Script');
  const editorClassIdentifier = readScalar(component, 'm_EditorClassIdentifier');
  const ownerId = readReference(component, 'm_GameObject').fileID;
  const owner = ownerId === null ? undefined : gameObjects.get(ownerId);

  if (script.fileID !== monoScriptFileId || script.type !== monoScriptReferenceType) {
    violations.push(
      `${rule}: ${scope.scene} scope component &${component.fileId} has a non-MonoScript reference `
        + `{fileID: ${script.fileID}, type: ${script.type}}`,
    );
  }

  if (readScalar(component, 'm_Enabled') !== '1') {
    violations.push(`${rule}: ${scope.scene} scope component &${component.fileId} is disabled`);
  }

  if (editorClassIdentifier !== scope.editorClassIdentifier) {
    violations.push(
      `${rule}: ${scope.scene} scope component &${component.fileId} declares `
        + `m_EditorClassIdentifier '${editorClassIdentifier ?? ''}', expected '${scope.editorClassIdentifier}'`,
    );
  }

  if (owner === undefined) {
    violations.push(
      `${rule}: ${scope.scene} scope component &${component.fileId} references missing GameObject &${ownerId ?? '0'}`,
    );
    return;
  }

  const ownerName = readScalar(owner, 'm_Name') ?? '';
  const components = readComponentReferences(owner);
  const linkedOwners = [...gameObjects.values()]
    .filter((gameObject) => readComponentReferences(gameObject).includes(component.fileId));

  if (linkedOwners.length !== 1 || linkedOwners[0].fileId !== owner.fileId) {
    violations.push(
      `${rule}: ${scope.scene} scope component &${component.fileId} must be listed only by its owning `
        + `GameObject &${owner.fileId}; linked by `
        + `${linkedOwners.map((gameObject) => `&${gameObject.fileId}`).join(', ') || 'none'}`,
    );
  }

  if (readScalar(owner, 'm_IsActive') !== '1') {
    violations.push(`${rule}: ${scope.scene} GameObject &${owner.fileId} ('${ownerName}') is inactive`);
  }

  for (const reference of components) {
    if (identifiers.has(reference)) continue;

    violations.push(`${rule}: ${scope.scene} GameObject &${owner.fileId} references missing component &${reference}`);
  }
}

async function readScriptGuid(scope) {
  const metaPath = join(repositoryRoot, `${scope.scriptPath}.meta`);

  if (await read(join(repositoryRoot, scope.scriptPath)) === null) {
    violations.push(`SCOPE_SCRIPT_META: ${scope.scriptPath} is missing`);
    return null;
  }

  const meta = await read(metaPath);

  if (meta === null) {
    violations.push(`SCOPE_SCRIPT_META: ${scope.scriptPath}.meta is missing`);
    return null;
  }

  const match = /^guid:\s*([0-9a-f]{32})\s*$/m.exec(meta);

  if (match === null) {
    violations.push(`SCOPE_SCRIPT_META: ${scope.scriptPath}.meta has no 32-character guid`);
    return null;
  }

  return match[1];
}

function parseUnityDocuments(source) {
  const documents = [];
  let current = null;

  for (const line of source.split('\n')) {
    const header = documentHeaderPattern.exec(line);

    if (header !== null) {
      current = { classId: header[1], fileId: header[2], type: null, lines: [] };
      documents.push(current);
      continue;
    }

    if (current === null) continue;

    const type = /^([A-Za-z_][A-Za-z0-9_]*):\s*$/.exec(line);

    if (type !== null && current.type === null) current.type = type[1];
    else current.lines.push(line);
  }

  return documents;
}

function readScalar(document, key) {
  const pattern = new RegExp(`^ {2}${key}:[ \\t]*(.*?)[ \\t]*$`);

  for (const line of document.lines) {
    const match = pattern.exec(line);
    if (match !== null) return match[1];
  }

  return null;
}

function readReference(document, key) {
  const raw = readScalar(document, key) ?? '';
  const reference = { fileID: null, guid: null, type: null };

  for (const [, field, value] of raw.matchAll(/(fileID|guid|type):\s*([^,}\s]+)/g)) {
    reference[field] = value;
  }

  return reference;
}

function readComponentReferences(document) {
  const references = [];
  let inside = false;

  for (const line of document.lines) {
    if (/^ {2}m_Component:\s*$/.test(line)) {
      inside = true;
      continue;
    }

    if (!inside) continue;

    const match = /^ {2}- component: \{fileID: (-?\d+)\}\s*$/.exec(line);

    if (match === null) break;

    references.push(match[1]);
  }

  return references;
}

function forbidOutsideAllowlist(source, pattern, path, allowlist, rule) {
  if (path === allowlist) return;
  forbid(source, pattern, path, rule);
}

function forbid(source, pattern, path, rule) {
  pattern.lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    const line = source.slice(0, match.index).split('\n').length;
    violations.push(`${rule}: ${path}:${line}`);
  }
}

async function collectRuntimeFiles() {
  try {
    return await collectFiles(runtimeRoot, '.cs');
  } catch {
    violations.push(`RUNTIME_ROOT_MISSING: ${normalize(relative(repositoryRoot, runtimeRoot))}`);
    return [];
  }
}

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path, extension));
    else if (extname(entry.name) === extension) files.push(path);
  }

  return files;
}

async function read(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function normalize(path) {
  return path.replaceAll('\\', '/');
}
