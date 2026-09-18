import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));
export const defaultRepoRoot = resolve(moduleDir, '..', '..');

/** Providers fully blocked under the final pipeline lock (Todo16). */
export const BLOCKED_GENERATION_BACKENDS = new Set([
  'trellis_v1',
  'comfyui_trellis',
  'trellis',
  'trellis2',
  'TRELLIS',
]);

/** Automatic 3D backends that fail closed until official contract exists. */
export const FAIL_CLOSED_3D_BACKENDS = new Set([
  'meshygen_plus',
  'meshy',
  'MeshyGen',
  'tripo',
  'tripo3d',
]);

/** Paths that are never valid runtime visual evidence under the lock. */
export const QUARANTINE_PATH_MARKERS = [
  `${sep}ArtSource${sep}`,
  `${sep}Art${sep}Props${sep}`,
  'station-prop-bom.json',
  'StationPropValidation.unity',
  'generate_station_props',
  'promote_station_props',
];

export const PLAYABLE_BUILD_SCENES = [
  'Game/Assets/Scenes/Bootstrap.unity',
  'Game/Assets/Scenes/MainTitle.unity',
  'Game/Assets/Scenes/Foundation.unity',
];

export const CODE_NATIVE_UI_ROOT = 'Game/Assets/Janseon/Foundation/UI';

export const CLASS = {
  A_VALID_PROMOTED: 'A_valid_promoted_non_trellis',
  B_CODE_NATIVE: 'B_code_native_ui_geometry',
  C_PLACEHOLDER: 'C_programmer_placeholder',
  D_TRELLIS_INVALID: 'D_trellis_derived_invalid',
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
  if (!value || value === 'none') {
    return { ok: true, code: 'backend_none', class: CLASS.B_CODE_NATIVE };
  }
  if (BLOCKED_GENERATION_BACKENDS.has(value) || /trellis/i.test(value)) {
    return { ok: false, code: 'trellis_blocked', class: CLASS.D_TRELLIS_INVALID };
  }
  if (FAIL_CLOSED_3D_BACKENDS.has(value) || /meshy|tripo/i.test(value)) {
    // Phase 0: Tripo agent paths are impossible regardless of authorization flags.
    if (/tripo/i.test(value)) {
      return { ok: false, code: 'tripo_agent_forbidden', class: CLASS.E_UNKNOWN };
    }
    // MeshyGen Plus remains UNVERIFIED; never ok for runtime.
    if (/meshy/i.test(value)) {
      return { ok: false, code: 'meshygen_unverified', class: CLASS.E_UNKNOWN };
    }
    return { ok: false, code: '3d_backend_fail_closed', class: CLASS.E_UNKNOWN };
  }
  const allow = options.allowedBackends ?? new Set([
    'nanobanana_gemini',
    'grok_imagine',
    'openai_image',
  ]);
  if (allow.has(value)) {
    return { ok: true, code: 'backend_allowlisted', class: CLASS.A_VALID_PROMOTED };
  }
  return { ok: false, code: 'unknown_backend', class: CLASS.E_UNKNOWN };
}

/**
 * Decide whether a BOM/manifest asset row is valid for runtime wiring.
 */
export function evaluatePromotedAsset(asset, options = {}) {
  const errors = [];
  if (!asset || typeof asset !== 'object') {
    return { ok: false, class: CLASS.E_UNKNOWN, errors: [{ code: 'missing_asset' }] };
  }

  const backendResult = classifyBackend(asset.generation_backend, options);
  if (!backendResult.ok) {
    errors.push({ code: backendResult.code, field: 'generation_backend', value: asset.generation_backend });
  }

  if (asset.status !== 'promoted') {
    errors.push({ code: 'status_not_promoted', field: 'status', value: asset.status });
  }
  if (asset.rights_status !== 'allowed') {
    errors.push({ code: 'rights_not_allowed', field: 'rights_status', value: asset.rights_status });
  }

  for (const field of ['prompt_hash', 'raw_hash', 'output_hash']) {
    if (!isSha256(asset[field])) {
      errors.push({ code: 'missing_or_invalid_hash', field });
    }
  }

  if (!asset.asset_id) {
    errors.push({ code: 'missing_field', field: 'asset_id' });
  }
  if (!asset.provider) {
    errors.push({ code: 'missing_field', field: 'provider' });
  }

  // Path/provenance markers that always fail under the lock.
  const pathFields = [
    asset.prefab_path,
    asset.material_path,
    asset.unity_import_settings?.litMaterial,
    asset.unity_import_settings?.baseColorTexture,
  ].filter(Boolean);
  for (const p of pathFields) {
    if (isQuarantinePath(p)) {
      errors.push({ code: 'quarantine_path', field: 'path', value: p });
    }
  }

  const ok = errors.length === 0 && backendResult.ok;
  return {
    ok,
    class: ok ? CLASS.A_VALID_PROMOTED : (backendResult.class === CLASS.D_TRELLIS_INVALID
      ? CLASS.D_TRELLIS_INVALID
      : CLASS.E_UNKNOWN),
    errors,
    asset_id: asset.asset_id ?? null,
    generation_backend: asset.generation_backend ?? null,
  };
}

export function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

export function isQuarantinePath(pathLike) {
  const normalized = String(pathLike).replace(/\//g, sep);
  return QUARANTINE_PATH_MARKERS.some((marker) => normalized.includes(marker.replace(/\//g, sep)))
    || /trellis/i.test(normalized)
    || /poc-prop-/i.test(normalized);
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
  if (/StationPropValidation/i.test(buildSettings) || /Art\/Props/i.test(buildSettings) || /ArtSource/i.test(buildSettings)) {
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

  // BOM inventory — every trellis row is D and invalid for runtime.
  const bomPath = join(repoRoot, 'docs/assets/bom/props/station-prop-bom.json');
  const bomAssets = [];
  if (existsSync(bomPath)) {
    try {
      const bom = JSON.parse(readFileSync(bomPath, 'utf8'));
      for (const asset of bom.assets ?? []) {
        const evaluation = evaluatePromotedAsset(asset, options);
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
        if (evaluation.ok) {
          // Should not happen under lock for current BOM; keep fail-open on true A only.
        } else if (evaluation.class === CLASS.D_TRELLIS_INVALID || evaluation.errors.some((e) => e.code === 'trellis_blocked')) {
          // Expected quarantine — not a runtime violation unless referenced.
        }
      }
    } catch (error) {
      violations.push({ code: 'bom_unreadable', path: 'docs/assets/bom/props/station-prop-bom.json', detail: String(error) });
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

  for (const rel of scanTargets) {
    const abs = join(repoRoot, rel);
    if (!existsSync(abs)) {
      violations.push({ code: 'runtime_surface_missing', path: rel });
      classifications.push({ slot: rel, path: rel, class: CLASS.E_UNKNOWN, ok_for_runtime: false });
      continue;
    }

    const text = readFileSync(abs, 'utf8');
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
        if (isQuarantinePath(resolved) || !isCodeNativeUiPath(resolved)) {
          violations.push({
            code: 'raster_without_valid_provenance',
            path: rel,
            value: url,
            resolved,
            class: isQuarantinePath(resolved) ? CLASS.D_TRELLIS_INVALID : CLASS.E_UNKNOWN,
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
      if (isQuarantinePath(target) || /ArtSource|Art\/Props|poc-prop-/i.test(target)) {
        violations.push({
          code: 'runtime_references_quarantine_asset',
          path: rel,
          guid,
          target,
          class: CLASS.D_TRELLIS_INVALID,
        });
      } else if (
        target.endsWith('.png')
        || target.endsWith('.jpg')
        || target.endsWith('.fbx')
        || target.endsWith('.glb')
        || target.endsWith('.prefab')
        || target.endsWith('.mat')
      ) {
        // External/generated raster or mesh must resolve to a valid non-TRELLIS promoted BOM entry.
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

  // Runtime C# must not Load TRELLIS/ArtSource paths.
  const runtimeCsRoot = join(repoRoot, 'Game/Assets/Janseon');
  if (existsSync(runtimeCsRoot)) {
    walk(runtimeCsRoot, (file) => {
      if (!file.endsWith('.cs')) return;
      if (file.includes(`${sep}Editor${sep}`)) return;
      if (file.includes(`${sep}Tests${sep}`)) return;
      const rel = relative(repoRoot, file).split(sep).join('/');
      const text = readFileSync(file, 'utf8');
      if (/ArtSource|Art\/Props|poc-prop-|trellis_v1|StationPropValidation/i.test(text)) {
        violations.push({
          code: 'runtime_source_quarantine_token',
          path: rel,
          class: CLASS.D_TRELLIS_INVALID,
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
  if (policy.trellis.ok) {
    violations.push({ code: 'policy_trellis_must_fail', detail: 'trellis_v1 must never be ok for runtime' });
  }
  if (policy.tripo.ok || policy.tripo.code !== 'tripo_agent_forbidden') {
    violations.push({ code: 'policy_tripo_must_fail', detail: 'tripo must fail with tripo_agent_forbidden' });
  }
  if (policy.meshy.ok || policy.meshy.code !== 'meshygen_unverified') {
    violations.push({ code: 'policy_meshy_must_fail', detail: 'meshygen must fail with meshygen_unverified' });
  }

  const blockedSlots = deriveBlockedSlots(bomAssets, classifications);

  return {
    ok: violations.length === 0,
    violations,
    classifications,
    runtimeReferences,
    bomEvaluations: bomAssets,
    blockedSlots,
    policy,
    providerLock: {
      trellis: 'FULLY_BLOCKED',
      tripo: 'AGENT_FORBIDDEN',
      meshygen_plus: 'UNVERIFIED_NO_INFERENCE',
      comfyui: 'INTAKE_ONLY_NO_INVOCATION',
      meshyOfficialContractVerified: false,
      tripoUserDirectAuthorized: false,
      allow_inference_meshygen: false,
      allow_inference_trellis: false,
    },
  };
}

function bomPathRelative(asset) {
  return asset.prefab_path
    || asset.unity_import_settings?.baseColorTexture
    || `bom:${asset.asset_id}`;
}

function assetPathsInclude(evaluation, target) {
  // evaluation does not carry paths; callers only use ok A rows (none today).
  return false;
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

function deriveBlockedSlots(bomAssets, classifications) {
  const slots = [];
  // Historical TRELLIS props — blocked as runtime replacements.
  for (const row of bomAssets) {
    if (!row.ok) {
      slots.push({
        slot: `prop:${row.asset_id}`,
        reason: row.errors.map((e) => e.code).join(','),
        class: row.class,
        replacement: null,
        note: 'No valid non-TRELLIS promoted replacement in worktree; do not fake art',
      });
    }
  }
  // Character / icon / title slots expected by later todos — none valid in tree.
  for (const id of ['character-explorer', 'character-medic', 'character-patrol', 'title-art', 'ui-icon-set', 'history-texture']) {
    const existing = classifications.find((c) => c.slot === id);
    if (!existing) {
      slots.push({
        slot: id,
        reason: 'no_valid_promoted_non_trellis_asset_in_worktree',
        class: CLASS.E_UNKNOWN,
        replacement: null,
        note: 'Slot remains blocked; code-native UI debt covers plane-only playable slice (Design.md §9)',
      });
    }
  }
  return slots;
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
