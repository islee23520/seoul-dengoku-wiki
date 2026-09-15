#!/usr/bin/env node
// Deterministic Oddland donor import: copies owner-authorized graphic/SFX/VFX assets
// (with Unity .meta files) into the quarantine root and writes/verifies a SHA-256 manifest.
//
//   node Tool/art/import-oddland-donor.mjs            # copy + write manifest
//   node Tool/art/import-oddland-donor.mjs --verify   # re-hash payload against manifest
//
// The payload is gitignored (too large for the repository LFS quota); the manifest is tracked.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceRoot = process.env.ODDLAND_ASSETS ?? '/Volumes/gameWorkspace/game-refs/oddland-unity/Assets';
const destinationRoot = join(repoRoot, 'Game', 'Assets', 'Quarantine', 'Oddland');
const manifestPath = join(repoRoot, 'Reference', 'assets', 'bom', 'donor', 'oddland-donor-import.json');
const hashListPath = join(repoRoot, 'Reference', 'assets', 'bom', 'donor', 'oddland-donor-import.sha256');

// Source folder (relative to Oddland Assets/) -> destination folder (relative to Quarantine/Oddland/).
// "Resources" is renamed to "Res" so Unity does not treat the payload as a build-included Resources folder.
const includes = [
  ['Resources/XResource', 'Res/XResource'],
  ['XResource', 'XResource'],
  ['Resources/Textures', 'Res/Textures'],
  ['Resources/Texture', 'Res/Texture'],
  ['Resources/Icons', 'Res/Icons'],
  ['Resources/Atlas', 'Res/Atlas'],
  ['Resources/MailAttachments', 'Res/MailAttachments'],
  ['Resources/MailAttachmentEmpties', 'Res/MailAttachmentEmpties'],
  ['Resources/Sound', 'Res/Sound'],
  ['Resources/UIFx', 'Res/UIFx'],
  ['Resources/Font', 'Res/Font'],
  ['Resources/Shaders', 'Res/Shaders'],
  ['Resources/GameAssets/Equipment', 'Res/GameAssets/Equipment'],
  ['Resources/GameAssets/Materials', 'Res/GameAssets/Materials'],
  ['Resources/GameAssets/Prefabs/Fx', 'Res/GameAssets/Prefabs/Fx'],
  ['Resources/GameAssets/Prefabs/CharacterSpines', 'Res/GameAssets/Prefabs/CharacterSpines'],
  ['Resources/GameAssets/Prefabs/Weapons', 'Res/GameAssets/Prefabs/Weapons'],
  ['Resources/GameAssets/Prefabs/Helmets', 'Res/GameAssets/Prefabs/Helmets'],
  ['Resources/GameAssets/Prefabs/Bags', 'Res/GameAssets/Prefabs/Bags'],
  ['Resources/GameAssets/Prefabs/Obstacles', 'Res/GameAssets/Prefabs/Obstacles'],
  ['Resources/GameAssets/Prefabs/Shadow', 'Res/GameAssets/Prefabs/Shadow'],
  ['Resources/GameAssets/Prefabs/Equipments', 'Res/GameAssets/Prefabs/Equipments'],
  ['Resources/GameAssets/Prefabs/ControllerProjectile', 'Res/GameAssets/Prefabs/ControllerProjectile'],
  ['Resources/Prefabs/Character', 'Res/Prefabs/Character'],
  ['Resources/Prefabs/CharacterSpines', 'Res/Prefabs/CharacterSpines'],
  ['Resources/Prefabs/Environment', 'Res/Prefabs/Environment'],
  ['Resources/Prefabs/EnvironmentCollider', 'Res/Prefabs/EnvironmentCollider'],
  ['Resources/Prefabs/Equipments', 'Res/Prefabs/Equipments'],
  ['Resources/Prefabs/Platformers', 'Res/Prefabs/Platformers'],
  ['Resources/Prefabs/MiniGame', 'Res/Prefabs/MiniGame'],
  ['Shader', 'Shader'],
  ['Post Processing Profiles', 'Post Processing Profiles'],
  ['CharacterMecanimController', 'CharacterMecanimController'],
  ['Spine/Runtime', 'Spine/Runtime'],
  ['Spine/Editor', 'Spine/Editor'],
  ['spine - unity(Custom)', 'SpineCustom'],
];

// Deliberately not imported (game logic, UI screens, scenes, third-party tooling, editor-only data).
const excludes = [
  'Resources/xStageScene', 'StreamingAssets', 'Resources/MetaData', 'Scripts', 'NGUI', '3rd Party Tool', 'Plugins',
  'ProCamera2D', 'PC2D', 'Editor', 'Tests', 'GoogleMobileAds', 'Gizmos', 'AddressableAssetsData', 'Scenes',
  'Resources/Scenes', 'OddlandData', 'Resources/Localiztion', 'Resources/XStageEditor', 'Resources/Persistent',
  'Resources/GameAssets/Prefabs/Popup', 'Resources/GameAssets/Prefabs/Popup_UGUI', 'Resources/Prefabs/Popup',
  'Resources/Prefabs/Popup_UGUI', 'Resources/Prefabs/PopupRoot', 'Resources/Prefabs/Managers', 'Spine/.Editor',
];

// Post-copy patches applied deterministically before hashing (recorded in the manifest).
// spine-unity's SkeletonGraphic compiles against UnityEngine.UI, but the donor asmdef never declared it.
const postCopyPatches = [
  {
    file: 'Spine/Runtime/spine-unity.asmdef',
    reason: 'declare the UnityEngine.UI reference SkeletonGraphic needs (com.unity.ugui, Intent decision 2)',
    apply: (text) => text.replace('"references": [ "spine-csharp" ]', '"references": [ "spine-csharp", "UnityEngine.UI" ]'),
  },
];

const verifyOnly = process.argv.includes('--verify');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function walk(dir, onFile, onDir = () => {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      onDir(path, entry.name);
      walk(path, onFile, onDir);
    } else if (entry.isFile() && entry.name !== '.DS_Store') onFile(path);
  }
}

function copyTree(fromRel, toRel) {
  const from = join(sourceRoot, fromRel);
  const to = join(destinationRoot, toRel);
  if (!existsSync(from)) throw new Error(`missing donor folder: ${from}`);
  mkdirSync(dirname(to), { recursive: true });
  execFileSync('rsync', ['-a', '--delete', '--exclude', '.DS_Store', `${from}${sep}`, `${to}${sep}`], { stdio: 'inherit' });
  const folderMeta = `${from}.meta`;
  if (existsSync(folderMeta)) writeFileSync(`${to}.meta`, readFileSync(folderMeta));
}

function collectPayload() {
  const files = [];
  walk(destinationRoot, (path) => files.push(relative(destinationRoot, path).split(sep).join('/')));
  return files.sort();
}

if (!verifyOnly) {
  if (!existsSync(sourceRoot)) throw new Error(`Oddland source not mounted: ${sourceRoot}`);
  for (const [fromRel, toRel] of includes) copyTree(fromRel, toRel);
  for (const patch of postCopyPatches) {
    const path = join(destinationRoot, patch.file);
    const before = readFileSync(path, 'utf8');
    const after = patch.apply(before);
    if (after === before) throw new Error(`post-copy patch did not apply: ${patch.file}`);
    writeFileSync(path, after);
  }
  // Intermediate folders (Res, Res/GameAssets, ...) have no donor .meta; write deterministic ones so Unity does
  // not generate random GUIDs that would break --verify on the next machine.
  const nestedResources = [];
  walk(destinationRoot, () => {}, (path, name) => {
    if (name === 'Resources') nestedResources.push(path);
    if (!existsSync(`${path}.meta`)) {
      const guid = createHash('sha256').update(relative(destinationRoot, path)).digest('hex').slice(0, 32);
      writeFileSync(`${path}.meta`, `fileFormatVersion: 2\nguid: ${guid}\nfolderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n`);
    }
  });
  if (nestedResources.length > 0) throw new Error(`nested Resources folders would be build-included: ${nestedResources.join(', ')}`);

  const files = collectPayload();
  let bytes = 0;
  const lines = files.map((rel) => {
    const path = join(destinationRoot, rel);
    bytes += statSync(path).size;
    return `${sha256(path)}  ${rel}`;
  });
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(hashListPath, `${lines.join('\n')}\n`);
  const sourceCommit = execFileSync('git', ['-C', dirname(sourceRoot), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const manifest = {
    schema_version: 1,
    donor: 'oddland-unity',
    donor_repository: 'islee23520/oddland-unity',
    donor_commit: sourceCommit,
    donor_editor_version: '6000.5.4f1',
    source_root: sourceRoot,
    destination_root: relative(repoRoot, destinationRoot).split(sep).join('/'),
    rights: {
      status: 'allowed',
      basis: 'owner declaration 2026-09-07: all Oddland graphic assets are owner-owned and free to use in this project',
      spine_runtime: 'spine-unity 4.2.113 (Esoteric Software Spine Runtimes License) — owner Spine editor license required; not a graphic-asset right',
    },
    scope: 'graphic assets, SFX, VFX, shaders, fonts, Spine skeleton data and runtime; no scenes, UI screens, gameplay scripts or metadata',
    includes: includes.map(([from, to]) => ({ from, to })),
    excludes,
    post_copy_patches: postCopyPatches.map(({ file, reason }) => ({ file, reason })),
    file_count: files.length,
    bytes,
    hash_list: relative(repoRoot, hashListPath).split(sep).join('/'),
    payload_tracked_in_git: false,
    imported_at: new Date().toISOString(),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`oddland donor import: ${files.length} files, ${(bytes / 1e6).toFixed(0)} MB -> ${manifest.destination_root}`);
} else {
  // The manifest binds the donor snapshot at copy time. Unity re-serializes YAML assets on import
  // (meta upgrades, URP material remaps), so those are reported as editor-upgraded, not as corruption.
  // Binary sources (fbx/png/psd/wav/...) must match byte-for-byte.
  const editorSerialized = new Set(['.meta', '.mat', '.prefab', '.asset', '.anim', '.controller', '.overridecontroller',
    '.unity', '.physicmaterial', '.physicsmaterial2d', '.spriteatlas', '.playable', '.mask', '.shadergraph', '.shadersubgraph']);
  const extensionOf = (rel) => rel.slice(rel.lastIndexOf('.')).toLowerCase();
  const expected = readFileSync(hashListPath, 'utf8').trim().split('\n').map((line) => line.split('  '));
  const actual = new Set(collectPayload());
  let missing = 0, changedBinary = 0, editorUpgraded = 0;
  for (const [hash, rel] of expected) {
    const path = join(destinationRoot, rel);
    actual.delete(rel);
    if (!existsSync(path)) { missing += 1; continue; }
    if (sha256(path) === hash) continue;
    if (editorSerialized.has(extensionOf(rel))) editorUpgraded += 1;
    else { changedBinary += 1; console.error(`changed binary: ${rel}`); }
  }
  const extraMeta = [...actual].filter((rel) => rel.endsWith('.meta')).length;
  const extraOther = actual.size - extraMeta;
  const summary = `${expected.length} listed, ${editorUpgraded} editor-upgraded, ${extraMeta} editor-added meta`;
  if (missing > 0 || changedBinary > 0 || extraOther > 0) {
    console.error(`oddland donor verify FAILED: ${missing} missing, ${changedBinary} changed binary, ${extraOther} unexpected files (${summary})`);
    process.exit(1);
  }
  console.log(`oddland donor verify OK: ${summary}`);
}
