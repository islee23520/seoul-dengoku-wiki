import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { backendPolicyError } from './catalog.mjs';
import { validateManifest } from './asset-manifest.mjs';

const moduleDir = dirname(fileURLToPath(import.meta.url));
export const defaultRepoRoot = resolve(moduleDir, '..', '..');
export const runtimeSlotContract = JSON.parse(readFileSync(join(moduleDir, 'runtime-slot-contract.json'), 'utf8'));

export const QUARANTINE_PATH_MARKERS = ['/ArtCandidates/', '/ArtSource/', '/Quarantine/', 'StationPropValidation.unity'];

export const PLAYABLE_BUILD_SCENES = [
  'Game/Assets/Scenes/Bootstrap.unity',
  'Game/Assets/Scenes/MainTitle.unity',
  'Game/Assets/Scenes/Foundation.unity',
];

export const CODE_NATIVE_UI_ROOT = 'Game/Assets/Janseon/Foundation/UI';

export const CLASS = {
  A_VALID_PROMOTED: 'A_valid_promoted',
  B_CODE_NATIVE: 'B_code_native_ui_geometry',
  C_PLACEHOLDER: 'C_programmer_placeholder',
  D_QUARANTINED: 'D_quarantined_asset',
  E_UNKNOWN: 'E_unknown',
};

const GUID_RE = /guid:\s*([0-9a-f]{32})/gi;
const USS_URL_RE = /url\s*\(\s*(['"]?)([^)'"]+)\1\s*\)/gi;
const PLACEHOLDER_TEXT_RE = /\b(Button1|TODO|PLACEHOLDER|lorem ipsum|emoji)\b/i;
const BUILTIN_GUID_PREFIX = '0000000000000000';

/**
 * Classify a generation backend string under the provider lock.
 * @returns {{ ok: boolean, code: string, class: string }}
 */
export function classifyBackend(backend, options = {}) {
  const value = String(backend ?? '').trim();
  const code = backendPolicyError({
    asset_class: 'prop', source: 'generate', ...options, generation_backend: value,
  });
  return { ok: code === null, code: code ?? 'backend_eligible', class: CLASS.E_UNKNOWN };

}

/**
 * Decide whether a BOM/manifest asset row is valid for runtime wiring.
 */
export function evaluatePromotedAsset(asset, options = {}) {
  const errors = [];
  if (!asset || typeof asset !== 'object') {
    return { ok: false, class: CLASS.E_UNKNOWN, errors: [{ code: 'missing_asset' }] };
  }

  errors.push(...validateManifest(asset).errors);
  if (asset.status !== 'promoted') errors.push({ code: 'status_not_promoted' });
  const root = options.repoRoot ?? defaultRepoRoot;
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const fileMatches = (path, expected) => {
    if (typeof path !== 'string' || !isSha256(expected)) return false;
    const full = resolve(root, options.runtimeFileSources?.[path] ?? path);
    if (!existsSync(full) || !statSync(full).isFile()) return false;
    if (asset.runtime_slot && (!canonicalRepoPath(path)
      || !realpathSync(full).startsWith(realpathSync(root) + sep))) return false;
    return hash(readFileSync(full)) === expected;
  };
  if (!fileMatches(asset.output_path, asset.output_hash)) errors.push({ code: 'output_hash_mismatch' });
  if (!fileMatches(asset.raw_path, asset.raw_hash)) errors.push({ code: 'raw_hash_mismatch' });
  if (!fileMatches(asset.rights_evidence?.path, asset.rights_evidence?.sha256)) errors.push({ code: 'rights_evidence_unbound' });
  let binding;
  if (fileMatches(asset.source_binding?.path, asset.source_binding?.sha256)) {
    try { binding = JSON.parse(readFileSync(resolve(root, asset.source_binding.path), 'utf8')); } catch { /* invalid binding fails below */ }
  }
  const reviews = asset.review_receipts;
  if (!binding || binding.asset_id !== asset.asset_id || binding.output_hash !== asset.output_hash
    || !Array.isArray(reviews) || reviews.length === 0
    || !Array.isArray(binding.review_hashes)
    || !reviews.every(r => r && fileMatches(r.receipt_path, r.receipt_hash)
      && binding.review_hashes.includes(r.receipt_hash))) errors.push({ code: 'review_receipt_unbound' });
  const paths = Object.entries(asset.runtime_files ?? {});
  if (paths.length === 0 || !paths.every(([path, sha]) => fileMatches(path, sha))) errors.push({ code: 'runtime_files_unbound' });
  if (asset.runtime_slot) errors.push(...evaluateSlotContract(asset, binding, root));
  const ok = errors.length === 0;
  return { ok, class: ok ? CLASS.A_VALID_PROMOTED : CLASS.E_UNKNOWN, errors,
    asset_id: asset.asset_id ?? null, runtime_slot: asset.runtime_slot ?? null,
    source_binding_hash: asset.source_binding?.sha256 ?? null,
    slot_files: asset.runtime_slot_files ?? null,
    generation_backend: asset.generation_backend ?? null,
    paths: paths.map(([p]) => p.startsWith('Assets/') ? 'Game/' + p : p) };
}

function canonicalRepoPath(path) {
  return typeof path === 'string' && path.length > 0 && !path.includes('\\')
    && !path.includes(':') && path.split('/').every(p => p !== '' && p !== '.' && p !== '..');
}

function sameFileMap(a, b) {
  return a !== null && b !== null && typeof a === 'object' && typeof b === 'object'
    && !Array.isArray(a) && !Array.isArray(b)
    && Object.keys(a).length === Object.keys(b).length
    && Object.entries(a).every(([key, value]) => value === b[key]);
}

export function runtimeSlotKeys(slot) {
  const keys = [...slot.runtime_keys];
  if (slot.import === 'character') {
    for (const facing of runtimeSlotContract.character_sheet.facings) {
      for (const action of runtimeSlotContract.character_sheet.actions) {
        keys.push(`${facing}/${action.name}/clip`);
        for (let i = 0; i < action.frames; i++) keys.push(`${facing}/${action.name}/${i}`);
      }
    }
  }
  return keys;
}

function evaluateSlotContract(asset, binding, root) {
  const errors = [];
  const slot = runtimeSlotContract.slots.find(s => s.slot === asset.runtime_slot);
  if (!slot) return [{ code: 'unknown_runtime_slot' }];
  if (asset.asset_class !== slot.asset_class) errors.push({ code: 'slot_asset_class_mismatch' });
  const files = asset.runtime_slot_files;
  const keys = runtimeSlotKeys(slot);
  if (!files || typeof files !== 'object' || Array.isArray(files)
    || Object.keys(files).length !== keys.length
    || !keys.every(key => canonicalRepoPath(files[key]) && files[key].startsWith(slot.destination)
      && !isQuarantinePath(files[key]) && isSha256(asset.runtime_files?.[files[key]])
      && (key.endsWith('/clip') ? files[key].endsWith('.anim') : files[key].endsWith('.png')))) {
    errors.push({ code: 'slot_files_incomplete' });
  }
  if (files?.[slot.primary_key] !== asset.output_path
    || asset.runtime_files?.[asset.output_path] !== asset.output_hash) errors.push({ code: 'slot_output_mismatch' });
  if (!Object.keys(asset.runtime_files ?? {}).every(path => canonicalRepoPath(path)
    && path.startsWith(slot.destination) && !isQuarantinePath(path))) errors.push({ code: 'slot_runtime_path_forbidden' });
  if (!canonicalRepoPath(asset.raw_path)
    || !runtimeSlotContract.source_roots.some(root => asset.raw_path.startsWith(root))) errors.push({ code: 'slot_raw_path_forbidden' });
  if (!binding || binding.runtime_slot !== asset.runtime_slot || binding.raw_hash !== asset.raw_hash
    || !sameFileMap(binding.rights_evidence, asset.rights_evidence)
    || !(sameFileMap(binding.runtime_files, asset.runtime_files)
      || verifyRetargetedClips(asset, binding, root))
    || !sameFileMap(binding.runtime_slot_files, files)) errors.push({ code: 'slot_source_binding_mismatch' });
  return errors;
}

export function verifyRetargetedClips(asset, binding, root) {
  const lineage = asset.generated_from;
  if (!lineage || lineage.kind !== 'sprite-guid-retarget-v1'
    || lineage.source_binding_hash !== asset.source_binding?.sha256
    || !sameFileMap(binding?.runtime_slot_files, asset.runtime_slot_files)
    || Object.keys(binding?.runtime_files ?? {}).length !== Object.keys(asset.runtime_files ?? {}).length) return false;
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const guidMap = new Map();
  const clips = [];
  for (const [key, path] of Object.entries(asset.runtime_slot_files)) {
    const source = lineage.candidate_files?.[path];
    if (!canonicalRepoPath(source) || !source.startsWith(runtimeSlotContract.candidate_root)
      || !existsSync(resolve(root, source)) || !existsSync(resolve(root, path))
      || hash(readFileSync(resolve(root, source))) !== binding.runtime_files[path]) return false;
    if (key.endsWith('/clip')) { clips.push([source, path]); continue; }
    if (asset.runtime_files[path] !== binding.runtime_files[path]) return false;
    if (key === 'atlas') continue;
    const sourceMeta = resolve(root, source + '.meta');
    const runtimeMeta = resolve(root, path + '.meta');
    if (!existsSync(sourceMeta) || !existsSync(runtimeMeta)) return false;
    const from = /^guid: ([a-f0-9]{32})$/m.exec(readFileSync(sourceMeta, 'utf8'))?.[1];
    const to = /^guid: ([a-f0-9]{32})$/m.exec(readFileSync(runtimeMeta, 'utf8'))?.[1];
    if (!from || !to || guidMap.has(from) && guidMap.get(from) !== to) return false;
    guidMap.set(from, to);
  }
  if (clips.length !== 20) return false;
  for (const [source, path] of clips) {
    const before = readFileSync(resolve(root, source), 'utf8');
    const expected = before.replace(/guid: ([a-f0-9]{32})/g, (token, guid) =>
      guidMap.has(guid) ? `guid: ${guidMap.get(guid)}` : token);
    if (readFileSync(resolve(root, path), 'utf8') !== expected) return false;
  }
  return true;
}

export function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

export function isQuarantinePath(pathLike) {
  const normalized = String(pathLike).replace(/\\/g, '/');
  return QUARANTINE_PATH_MARKERS.some((marker) => normalized.includes(marker.replace(/\//g, sep)))
;
}

export function isCodeNativeUiPath(repoRelativePath) {
  const n = repoRelativePath.replace(/\\/g, '/');
  return n.startsWith(CODE_NATIVE_UI_ROOT)
    || n.startsWith('Game/Assets/Janseon/Foundation/')
    || n.startsWith('Game/Assets/Scenes/');
}

/**
 * Collect guid -> asset path map from Unity .meta files under a root.
 */
export function buildGuidMap(absoluteRoot, repoRoot = defaultRepoRoot) {
  const map = new Map();
  if (!existsSync(absoluteRoot)) return map;
  walk(absoluteRoot, (file) => {
    if (!file.endsWith('.meta')) return;
    const text = readFileSync(file, 'utf8');
    const match = /^guid:\s*([0-9a-f]{32})\s*$/m.exec(text);
    if (!match) return;
    const assetPath = file.slice(0, -'.meta'.length);
    map.set(match[1], relative(repoRoot, assetPath).split(sep).join('/'));
  });
  return map;
}

/**
 * Extract external guid references from a Unity YAML/text asset.
 */
export function extractGuids(text) {
  const guids = new Set();
  for (const match of text.matchAll(GUID_RE)) {
    const guid = match[1].toLowerCase();
    if (guid.startsWith(BUILTIN_GUID_PREFIX.slice(0, 16))) continue;
    // Built-in Unity guids are 0000...
    if (/^0+$/.test(guid)) continue;
    if (guid.startsWith('0000000000000000')) continue;
    guids.add(guid);
  }
  return [...guids];
}

export function extractUssUrls(text) {
  const urls = [];
  for (const match of text.matchAll(USS_URL_RE)) {
    urls.push(match[2].trim());
  }
  return urls;
}

/**
 * Audit playable runtime surfaces for invalid asset references.
 */
export function auditRuntimeProvenance(repoRoot = defaultRepoRoot, options = {}) {
  const violations = [];
  const classifications = [];
  const runtimeReferences = [];

  const buildSettingsPath = join(repoRoot, 'Game/ProjectSettings/EditorBuildSettings.asset');
  const buildSettings = existsSync(buildSettingsPath)
    ? readFileSync(buildSettingsPath, 'utf8')
    : '';

  // Build settings must only enable playable scenes; StationPropValidation is forbidden.
  if (/StationPropValidation/i.test(buildSettings) || /Art\/Props/i.test(buildSettings) || /ArtSource|ArtCandidates|Quarantine/i.test(buildSettings)) {
    violations.push({
      code: 'build_settings_quarantine_leak',
      path: 'Game/ProjectSettings/EditorBuildSettings.asset',
      detail: 'TRELLIS/Art prop validation scene must not be in player build settings',
    });
  }

  const expected = [
    'Assets/Scenes/Bootstrap.unity',
    'Assets/Scenes/MainTitle.unity',
    'Assets/Scenes/Foundation.unity',
  ];
  const enabled = [...buildSettings.matchAll(/^\s+- enabled:\s+(\S+)\r?\n\s+path:\s+(.+?)\r?$/gm)]
    .filter((m) => m[1] === '1')
    .map((m) => m[2].trim());
  if (enabled.length !== expected.length || expected.some((p, i) => enabled[i] !== p)) {
    violations.push({
      code: 'build_settings_unexpected',
      path: 'Game/ProjectSettings/EditorBuildSettings.asset',
      detail: `expected ${expected.join(' -> ')}; got ${enabled.join(' -> ') || 'none'}`,
    });
  }

  const guidMap = buildGuidMap(join(repoRoot, 'Game/Assets/Janseon'), repoRoot);
  // Also map UI Toolkit package-free project assets under Game/Assets (non-Library).
  const assetsGuidMap = buildGuidMap(join(repoRoot, 'Game/Assets'), repoRoot);
  for (const [g, p] of assetsGuidMap) guidMap.set(g, p);

  // BOM inventory: eligibility requires actual source-bound files.
  const bomAssets = [];
  for (const bomRel of ['docs/assets/bom/props/station-prop-bom.json', runtimeSlotContract.bom_path]) {
    const bomPath = join(repoRoot, bomRel);
    if (existsSync(bomPath)) {
      try {
        const bom = JSON.parse(readFileSync(bomPath, 'utf8'));
        for (const asset of bom.assets ?? []) {
          const evaluation = evaluatePromotedAsset(asset, { ...options, repoRoot });
          if (bomRel === runtimeSlotContract.bom_path && !asset.runtime_slot) {
            evaluation.ok = false;
            evaluation.class = CLASS.E_UNKNOWN;
            evaluation.errors.push({ code: 'missing_runtime_slot' });
          }
          bomAssets.push(evaluation);
          classifications.push({
            slot: `bom:${asset.asset_id}`,
            path: bomPathRelative(asset),
            class: evaluation.class,
            generation_backend: asset.generation_backend,
            status: asset.status,
            ok_for_runtime: evaluation.ok,
            errors: evaluation.errors,
          });
        }
      } catch (error) {
        violations.push({ code: 'bom_unreadable', path: bomRel, detail: String(error) });
      }
    }
  }
  for (const slot of runtimeSlotContract.slots) {
    const rows = bomAssets.filter(b => b.runtime_slot === slot.slot);
    if (rows.length > 1) {
      for (const row of rows) {
        row.ok = false;
        row.class = CLASS.E_UNKNOWN;
        row.errors.push({ code: 'duplicate_runtime_slot' });
        for (const classification of classifications.filter(c => c.errors === row.errors)) {
          classification.class = row.class;
          classification.ok_for_runtime = false;
        }
      }
      violations.push({ code: 'duplicate_runtime_slot', path: runtimeSlotContract.bom_path, slot: slot.slot });
    }
  }

  // Scan playable scenes + referenced UI trees for GUID/path leaks.
  const scanTargets = [
    ...PLAYABLE_BUILD_SCENES,
    `${CODE_NATIVE_UI_ROOT}/Screens/MainTitle.uxml`,
    `${CODE_NATIVE_UI_ROOT}/Screens/Gameplay.uxml`,
    `${CODE_NATIVE_UI_ROOT}/Styles/MainTitle.uss`,
    `${CODE_NATIVE_UI_ROOT}/Styles/Gameplay.uss`,
    `${CODE_NATIVE_UI_ROOT}/Styles/JanseonShared.uss`,
    `${CODE_NATIVE_UI_ROOT}/PanelSettings.asset`,
  ];
  if (existsSync(join(repoRoot, runtimeSlotContract.catalog_path))) scanTargets.push(runtimeSlotContract.catalog_path);

  for (const rel of scanTargets) {
    const abs = join(repoRoot, rel);
    if (!existsSync(abs)) {
      violations.push({ code: 'runtime_surface_missing', path: rel });
      classifications.push({ slot: rel, path: rel, class: CLASS.E_UNKNOWN, ok_for_runtime: false });
      continue;
    }

    const text = readFileSync(abs, 'utf8');
    if (rel === runtimeSlotContract.catalog_path) {
      for (const match of text.matchAll(/^\s*- slot: ([^\r\n]+)\r?\n([\s\S]*?)(?=^\s*- slot:|$(?![\s\S]))/gm)) {
        const slot = match[1].trim();
        const body = match[2];
        if (!/^\s*bound: 1\s*$/m.test(body)) continue;
        const row = bomAssets.find(b => b.ok && b.runtime_slot === slot);
        const bindingHash = /^\s*sourceBindingHash: (\S+)\s*$/m.exec(body)?.[1];
        const refs = [...body.matchAll(/^\s*- key: ([^\r\n]+)\r?\n\s*asset: \{[^}]*guid: ([a-f0-9]{32})[^}]*\}/gm)];
        if (!row || row.source_binding_hash !== bindingHash
          || refs.length !== Object.keys(row.slot_files ?? {}).length
          || !refs.every(r => row.slot_files[r[1].trim()] === guidMap.get(r[2]))) {
          violations.push({ code: 'catalog_slot_unprovenanced', path: rel, slot });
        }
      }
    }
    const isUiSource = rel.endsWith('.uxml') || rel.endsWith('.uss');
    classifications.push({
      slot: rel,
      path: rel,
      class: isUiSource || rel.endsWith('.unity') || rel.endsWith('PanelSettings.asset')
        ? CLASS.B_CODE_NATIVE
        : CLASS.E_UNKNOWN,
      ok_for_runtime: true,
      promoted_art: false,
      note: isUiSource
        ? 'Design.md §9 accepted debt: code-native UXML/USS geometry/tokens — NOT promoted generated art'
        : 'playable scene shell (scopes/UIDocument wiring only) — NOT promoted generated art',
    });

    if (PLACEHOLDER_TEXT_RE.test(text) && !rel.endsWith('.unity')) {
      // Allow "TODO" only outside user-facing UXML labels — still flag explicit programmer tokens in UXML/USS.
      if (/\bButton1\b/.test(text) || /text="TODO"/i.test(text) || /placeholder/i.test(text) && rel.endsWith('.uxml')) {
        violations.push({ code: 'programmer_placeholder', path: rel, class: CLASS.C_PLACEHOLDER });
      }
    }

    for (const url of extractUssUrls(text)) {
      // Relative style refs between UXML↔USS under Foundation/UI are code-native.
      if (url.startsWith('project://') || url.startsWith('http')) {
        violations.push({ code: 'external_style_url', path: rel, value: url, class: CLASS.E_UNKNOWN });
        continue;
      }
      if (/\.(png|jpg|jpeg|psd|tga|gif|bmp|tif|tiff|asset)$/i.test(url) || url.includes('Art/') || /trellis/i.test(url)) {
        const resolved = resolveUiUrl(rel, url);
        if (isQuarantinePath(resolved) || (!isCodeNativeUiPath(resolved)
          && !bomAssets.some(b => b.ok && assetPathsInclude(b, resolved)))) {
          violations.push({
            code: 'raster_without_valid_provenance',
            path: rel,
            value: url,
            resolved,
            class: isQuarantinePath(resolved) ? CLASS.D_QUARANTINED : CLASS.E_UNKNOWN,
          });
        }
      }
    }

    const guids = extractGuids(text);
    for (const guid of guids) {
      const target = guidMap.get(guid);
      if (!target) {
        // Unknown project guid — may be package script (VContainer etc.) loaded outside Janseon map.
        // Only fail when the YAML path itself embeds quarantine tokens.
        continue;
      }
      runtimeReferences.push({ from: rel, guid, to: target });
      if (!isQuarantinePath(target) && /\.(asset|prefab|mat|anim|uxml|uss)$/.test(target)
        && !scanTargets.includes(target)) scanTargets.push(target);
      if (isQuarantinePath(target)) {
        violations.push({
          code: 'runtime_references_quarantine_asset',
          path: rel,
          guid,
          target,
          class: CLASS.D_QUARANTINED,
        });
      } else if (
        target.endsWith('.png')
        || target.endsWith('.jpg')
        || target.endsWith('.fbx')
        || target.endsWith('.glb')
        || target.endsWith('.prefab')
        || target.endsWith('.mat')
        || target.endsWith('.anim')
      ) {
        // External raster or mesh must resolve to a source-bound promoted BOM entry.
        const bomHit = bomAssets.find((b) => b.ok && assetPathsInclude(b, target));
        if (!bomHit) {
          // Code-native UI folder should not reference rasters at all today.
          if (target.replace(/\\/g, '/').startsWith(CODE_NATIVE_UI_ROOT) && !/\.(uxml|uss|cs|asset)$/i.test(target)) {
            violations.push({
              code: 'ui_raster_unprovenanced',
              path: rel,
              target,
              class: CLASS.E_UNKNOWN,
            });
          } else if (!isCodeNativeUiPath(target) && !target.includes('/Foundation/') && !target.includes('/Core/')) {
            violations.push({
              code: 'generated_asset_not_valid_promoted',
              path: rel,
              target,
              class: CLASS.E_UNKNOWN,
            });
          }
        }
      }
    }
  }

  // Runtime C# must not load raw source or validation scene paths.
  const runtimeCsRoot = join(repoRoot, 'Game/Assets/Janseon');
  if (existsSync(runtimeCsRoot)) {
    walk(runtimeCsRoot, (file) => {
      if (!file.endsWith('.cs')) return;
      if (file.includes(`${sep}Editor${sep}`)) return;
      if (file.includes(`${sep}Tests${sep}`)) return;
      const rel = relative(repoRoot, file).split(sep).join('/');
      const text = readFileSync(file, 'utf8');
      if (/ArtSource|ArtCandidates|Quarantine|StationPropValidation/i.test(text)) {
        violations.push({
          code: 'runtime_source_quarantine_token',
          path: rel,
          class: CLASS.D_QUARANTINED,
        });
      }
    });
  }

  // Explicit backend policy probes (used by unit tests too).
  const policy = {
    trellis: classifyBackend('trellis_v1', options),
    tripo: classifyBackend('tripo3d', options),
    meshy: classifyBackend('meshygen_plus', options),
    grok: classifyBackend('grok_imagine', options),
  };
  const blockedSlots = deriveBlockedSlots(bomAssets, classifications);

  return {
    ok: violations.length === 0,
    violations,
    classifications,
    runtimeReferences,
    bomEvaluations: bomAssets,
    blockedSlots,
    policy,
    providerLock: { trellis: 'RETAINED_OPTION_NOT_ASSET_APPROVAL', automaticPromotion: false },
  };
}

function bomPathRelative(asset) {
  return asset.prefab_path
    || asset.unity_import_settings?.baseColorTexture
    || `bom:${asset.asset_id}`;
}

function assetPathsInclude(evaluation, target) {
  // Only verified runtime file paths may be referenced.
  return evaluation.paths?.includes(target) === true;
}

function resolveUiUrl(fromRel, url) {
  if (url.startsWith('/') || /^[A-Za-z]:/.test(url)) return url;
  const fromDir = fromRel.split('/').slice(0, -1).join('/');
  const parts = `${fromDir}/${url}`.split('/');
  const out = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

function deriveBlockedSlots(bomAssets) {
  const ids = ['prop:poc-prop-ticket-gate', 'prop:poc-prop-pump-crate', 'prop:poc-prop-shutter',
    'prop:poc-prop-pillar', 'prop:poc-prop-bench', 'prop:poc-prop-cabinet',
    'character-explorer', 'character-medic', 'character-patrol', 'title-art', 'ui-icon-set', 'history-texture'];
  return ids.filter(id => !bomAssets.some(b => b.ok && (id === 'prop:' + b.asset_id || id === b.runtime_slot)))
    .map(slot => ({ slot, reason: 'no_source_bound_runtime_asset', replacement: null }));
}

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'Library' || name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

export function formatAuditFailure(audit) {
  const lines = [`runtime asset provenance gate failed with ${audit.violations.length} violation(s)`];
  for (const v of audit.violations) {
    lines.push(`- ${v.code}: ${v.path || ''}${v.target ? ` -> ${v.target}` : ''}${v.detail ? ` (${v.detail})` : ''}`);
  }
  return lines.join('\n');
}
