export const REFERENCE_HOLDER_PATHS = Object.freeze([
  'lore/name-pools/cast-birthdays.json',
  'lore/name-pools/cast-family-trees.json',
  'lore/name-pools/cast-family-parent-status.json',
  'lore/name-pools/cast-family-role-decisions.json',
  'lore/name-pools/cast-household-relations.json',
  'lore/name-pools/household-humanoid-policy.json',
  'lore/relations/relations.json',
  'lore/relations/personal-holdings.json',
  'lore/relations/opening-office-appointments.json',
  'lore/name-pools/cast-prose-contacts.json',
]);

export const REFERENCE_TARGET_PATHS = Object.freeze([
  'lore/World-Narrative-Atlas.json',
  'lore/characters/Cast-Relations.json',
  ...Array.from({ length: 16 }, (_, index) => `lore/characters/Cast-State-${String(index + 1).padStart(2, '0')}.json`),
  'lore/characters/Cast-Unaffiliated.json',
  'lore/characters/Core-Characters.json',
  'lore/chronology/Century-Annals.json',
  'lore/chronology/Scenario-Timeline.json',
  'lore/culture/Faith-Culture-Schism.json',
  'lore/factions/Diaspora-Corridors.json',
  'lore/name-pools/cast-birthdays.json',
  'lore/name-pools/cast-family-trees.json',
  'lore/name-pools/cast-hangnyeol.json',
  'lore/name-pools/diaspora-family-lineages.json',
  'lore/name-pools/hangnyeol-schema.md',
  'lore/name-pools/person-id-registry.json',
  'lore/places/landmark-roles.json',
  'lore/regions/content/11560.json',
  'lore/regions/station-interiors.json',
  'lore/relations/relations.json',
].sort());

export const SOURCE_CLOSURE_TABLE_COLUMNS = Object.freeze({
  reference_source: Object.freeze(['logical_path', 'sha256', 'byte_length', 'source_class']),
  source_reference: Object.freeze(['source_id', 'json_pointer', 'ordinal', 'reference_logical_path', 'reference_anchor', 'anchor_verification']),
});

const TARGET_SET = new Set(REFERENCE_TARGET_PATHS);

function fail(code, message) {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_REFERENCE_OBJECT', label);
  return value;
}

function text(value, label, nullable = false) {
  if (nullable && (value === undefined || value === null)) return null;
  if (typeof value !== 'string') fail('E_REFERENCE_TEXT', label);
  return value;
}

function pointerToken(key) {
  return key.replaceAll('~', '~0').replaceAll('/', '~1');
}

function pointerJoin(base, key) {
  return `${base}/${pointerToken(String(key))}`;
}

function trustedFiles(bundle) {
  const primary = Array.isArray(bundle?.files) ? bundle.files : fail('E_REFERENCE_BUNDLE', 'bundle.files');
  const hashed = Array.isArray(bundle.referenceFiles) ? bundle.referenceFiles : [];
  const index = new Map();
  for (const file of [...primary, ...hashed]) {
    const entry = object(file, 'source file');
    const logical_path = text(entry.logical_path, 'source file logical_path');
    const sha256 = text(entry.sha256, `${logical_path}.sha256`);
    if (!/^[a-f0-9]{64}$/u.test(sha256)) fail('E_REFERENCE_HASH', logical_path);
    if (!Number.isSafeInteger(entry.byte_length) || entry.byte_length < 0) fail('E_REFERENCE_LENGTH', logical_path);
    if (index.has(logical_path)) fail('E_REFERENCE_TARGET_DUPLICATE', logical_path);
    index.set(logical_path, entry);
  }
  return { primary, index };
}

function parsePath(path) {
  if (!path || /[\\:\0]/u.test(path) || path.startsWith('/') || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    fail('E_REFERENCE_PATH', path || '(empty)');
  }
  if (!TARGET_SET.has(path)) fail('E_REFERENCE_ALLOWLIST', path);
  return path;
}

function parseReference(value, label) {
  if (typeof value === 'string') {
    const hash = value.indexOf('#');
    const source_path = parsePath(hash === -1 ? value : value.slice(0, hash));
    return { source_path, source_anchor: hash === -1 ? null : value.slice(hash + 1) || null };
  }
  const ref = object(value, label);
  const source_path = parsePath(text(ref.path, `${label}.path`));
  const source_anchor = text(ref.anchor, `${label}.anchor`, true);
  return { source_path, source_anchor: source_anchor || null };
}

function jsonPointerExists(document, anchor) {
  if (document === null || typeof document !== 'object' || !anchor?.startsWith('/')) return false;
  let current = document;
  for (const encoded of anchor.slice(1).split('/')) {
    if (/~(?:[^01]|$)/u.test(encoded)) fail('E_REFERENCE_ANCHOR', anchor);
    const key = encoded.replaceAll('~1', '/').replaceAll('~0', '~');
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) return null;
    current = current[key];
  }
  return true;
}

function freezeRows(rows) {
  for (const values of Object.values(rows)) {
    values.forEach(Object.freeze);
    Object.freeze(values);
  }
  return Object.freeze(rows);
}

function collectReferences(document, source_id, rows, targetFiles, base = '') {
  if (document === null || typeof document !== 'object') return;
  for (const [key, value] of Object.entries(document)) {
    const json_pointer = pointerJoin(base, key);
    if (key === 'sourceRef') {
      const ref = parseReference(value, json_pointer);
      addReference({ source_id, json_pointer, ordinal: 0, ref, rows, targetFiles });
    }
    if (key === 'sourceRefs') {
      if (!Array.isArray(value)) fail('E_REFERENCE_ARRAY', json_pointer);
      for (const [ordinal, item] of value.entries()) {
        const ref = parseReference(item, pointerJoin(json_pointer, ordinal));
        addReference({ source_id, json_pointer: pointerJoin(json_pointer, ordinal), ordinal, ref, rows, targetFiles });
      }
    }
    collectReferences(value, source_id, rows, targetFiles, json_pointer);
  }
}

function addReference({ source_id, json_pointer, ordinal, ref, rows, targetFiles }) {
  const target = targetFiles.get(ref.source_path);
  if (!target) fail('E_REFERENCE_TARGET_MISSING', ref.source_path);
  const anchor = jsonPointerExists(target.document ?? null, ref.source_anchor);
  const unresolved = ref.source_anchor?.startsWith('/') && ref.source_path.endsWith('.json') && anchor === null;
  rows.source_reference.push({
    source_id, json_pointer, ordinal, reference_logical_path: ref.source_path, reference_anchor: ref.source_anchor,
    anchor_verification: unresolved ? 'json-pointer-unresolved' : anchor ? 'json-pointer-verified' : 'verified-path-only',
  });
}

function addDeclaredReference({ source_id, json_pointer, source_path, source_anchor, rows, targetFiles }) {
  addReference({
    source_id, json_pointer, ordinal: 0,
    ref: { source_path: parsePath(text(source_path, json_pointer)), source_anchor: text(source_anchor, `${json_pointer} anchor`, true) },
    rows, targetFiles,
  });
}

function collectContextReferences(logical_path, document, source_id, rows, targetFiles) {
  if (logical_path === 'lore/relations/relations.json') {
    if (Object.hasOwn(document, 'courtContract')) {
      const contract = object(document.courtContract, 'courtContract');
      if (Object.hasOwn(contract, 'sourcePath')) addDeclaredReference({ source_id, json_pointer: '/courtContract/sourcePath', source_path: contract.sourcePath, source_anchor: contract.sourceAnchor, rows, targetFiles });
    }
    if (Object.hasOwn(document, 'ownerLieges')) {
      const ownerLieges = object(document.ownerLieges, 'ownerLieges');
      if (Object.hasOwn(ownerLieges, 'sourceBasis')) {
        if (!Array.isArray(ownerLieges.sourceBasis)) fail('E_REFERENCE_ARRAY', '/ownerLieges/sourceBasis');
        for (const [ordinal, value] of ownerLieges.sourceBasis.entries()) {
          const basis = object(value, `/ownerLieges/sourceBasis/${ordinal}`);
          if (Object.hasOwn(basis, 'path')) addDeclaredReference({ source_id, json_pointer: `/ownerLieges/sourceBasis/${ordinal}/path`, source_path: basis.path, source_anchor: basis.anchor, rows, targetFiles });
        }
      }
    }
  }
  if (logical_path === 'lore/relations/personal-holdings.json' && Object.hasOwn(document, 'holdings')) {
    if (!Array.isArray(document.holdings)) fail('E_REFERENCE_ARRAY', '/holdings');
    for (const [ordinal, value] of document.holdings.entries()) {
      const holding = object(value, `/holdings/${ordinal}`);
      for (const key of ['stationRef', 'facilityRef', 'landmarkRef']) {
        if (!Object.hasOwn(holding, key)) continue;
        const reference = object(holding[key], `/holdings/${ordinal}/${key}`);
        const base = `/holdings/${ordinal}/${key}`;
        if (Object.hasOwn(reference, 'sourcePath')) addDeclaredReference({ source_id, json_pointer: `${base}/sourcePath`, source_path: reference.sourcePath, source_anchor: null, rows, targetFiles });
        if (Object.hasOwn(reference, 'siteSourcePath')) addDeclaredReference({ source_id, json_pointer: `${base}/siteSourcePath`, source_path: reference.siteSourcePath, source_anchor: reference.siteAnchor, rows, targetFiles });
      }
    }
  }
}

export function mapSourceClosureDomains({ bundle }) {
  const { primary, index } = trustedFiles(bundle);
  const holders = new Map(primary.map((entry) => [entry.logical_path, entry]));
  for (const logical_path of REFERENCE_HOLDER_PATHS) {
    const holder = holders.get(logical_path);
    if (!holder) fail('E_REFERENCE_HOLDER_MISSING', logical_path);
    if (!Number.isSafeInteger(holder.source_id) || holder.source_id < 1) fail('E_REFERENCE_SOURCE_ID', logical_path);
  }
  for (const logical_path of REFERENCE_TARGET_PATHS) {
    if (!index.has(logical_path)) fail('E_REFERENCE_TARGET_MISSING', logical_path);
  }
  const rows = { reference_source: [], source_reference: [] };
  for (const logical_path of REFERENCE_HOLDER_PATHS) {
    const holder = holders.get(logical_path);
    collectReferences(holder.document, holder.source_id, rows, index);
    collectContextReferences(logical_path, holder.document, holder.source_id, rows, index);
  }
  for (const logical_path of REFERENCE_TARGET_PATHS) {
    const target = index.get(logical_path);
    rows.reference_source.push({ logical_path, sha256: target.sha256, byte_length: target.byte_length, source_class: 'reference-hash-only' });
  }
  return freezeRows(rows);
}

export function sourceReferenceHashes({ bundle }) {
  return mapSourceClosureDomains({ bundle }).reference_source;
}
