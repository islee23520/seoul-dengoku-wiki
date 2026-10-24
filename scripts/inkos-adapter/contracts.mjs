import { createHash, randomUUID } from 'node:crypto';

export const VERSION = 1;
export const LIMITS = Object.freeze({ fileBytes: 128 * 1024, replacementBytes: 64 * 1024, sources: 16, citations: 64, depth: 32 });
export function fail(code, detail) { throw Object.assign(new Error(`${code}: ${detail}`), { code }); }
export const sha256Bytes = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Canonical JSON sorts object keys (UTF-16 order), preserves arrays and performs no
// Unicode/whitespace normalization. Bytes hashing is deliberately a separate API.
export function canonicalJson(value) {
  function encode(value, depth) {
    if (depth > LIMITS.depth) fail('E_ADAPTER_LIMIT', 'JSON depth exceeded');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
    if (value && typeof value === 'object') {
      const array = Array.isArray(value);
      const prototype = Object.getPrototypeOf(value);
      if (array ? prototype !== Array.prototype : ![Object.prototype, null].includes(prototype)) fail('E_ADAPTER_SCHEMA', 'JSON prototype required');
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(descriptors);
      // Validate the complete descriptor snapshot before traversing any values.
      for (const key of keys) {
        if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('E_ADAPTER_SCHEMA', 'JSON key forbidden');
        const descriptor = descriptors[key];
        if (!Object.hasOwn(descriptor, 'value')) fail('E_ADAPTER_SCHEMA', 'JSON data property required');
        if (array && key === 'length') {
          if (descriptor.enumerable || descriptor.configurable || !Number.isInteger(descriptor.value) || descriptor.value < 0) fail('E_ADAPTER_SCHEMA', 'array length descriptor required');
        } else if (array && (!descriptor.enumerable || !/^(0|[1-9]\d*)$/u.test(key) || Number(key) >= descriptors.length.value)) {
          fail('E_ADAPTER_SCHEMA', 'enumerable JSON field required');
        }
      }
      if (array) {
        const length = descriptors.length.value;
        if (keys.length !== length + 1) fail('E_ADAPTER_SCHEMA', 'dense JSON array required');
        const items = [];
        for (let i = 0; i < length; i++) items.push(encode(descriptors[i].value, depth + 1));
        return `[${items.join(',')}]`;
      }
      return `{${keys.filter(key => descriptors[key].enumerable).sort().map(key => `${JSON.stringify(key)}:${encode(descriptors[key].value, depth + 1)}`).join(',')}}`;
    }
    fail('E_ADAPTER_SCHEMA', 'canonical JSON value required');
  }
  return encode(value, 0);
}
export const digestJson = (value) => sha256Bytes(Buffer.from(canonicalJson(value), 'utf8'));
export const newPacketId = () => randomUUID();

/** Bounded recursive-descent JSON; object keys are compared after unescaping. */
export function parseStrictJson(input, { maxBytes = LIMITS.fileBytes } = {}) {
  if (typeof input !== 'string' && !Buffer.isBuffer(input) && !(input instanceof Uint8Array)) fail('E_ADAPTER_JSON', 'UTF-8 bytes or string required');
  const bytes = Buffer.from(input);
  if (bytes.length > maxBytes) fail('E_ADAPTER_LIMIT', 'JSON byte limit exceeded');
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { fail('E_ADAPTER_JSON', 'invalid UTF-8'); }
  let i = 0;
  const bad = () => fail('E_ADAPTER_JSON', `invalid JSON at offset ${i}`);
  const ws = () => { while (/[\t\r\n ]/u.test(text[i] ?? '') && i < text.length) i++; };
  const string = () => {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === '\\') { i++; continue; }
      if (c === '"') {
        try { return JSON.parse(text.slice(start, i)); } catch { bad(); }
      }
    }
    bad();
  };
  function value(depth) {
    if (depth > LIMITS.depth) fail('E_ADAPTER_LIMIT', 'JSON depth exceeded');
    ws();
    if (text[i] === '"') return string();
    if (text[i] === '{') {
      i++; ws(); const result = {}; const keys = new Set();
      if (text[i] === '}') { i++; return result; }
      while (i < text.length) {
        if (text[i] !== '"') bad();
        const key = string();
        if (keys.has(key)) fail('E_ADAPTER_DUPLICATE_KEY', 'duplicate JSON object key');
        keys.add(key); ws(); if (text[i++] !== ':') bad();
        Object.defineProperty(result, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
        ws(); const c = text[i++]; if (c === '}') return result; if (c !== ',') bad(); ws();
      }
      bad();
    }
    if (text[i] === '[') {
      i++; ws(); const result = [];
      if (text[i] === ']') { i++; return result; }
      while (i < text.length) { result.push(value(depth + 1)); ws(); const c = text[i++]; if (c === ']') return result; if (c !== ',') bad(); }
      bad();
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u.exec(text.slice(i));
    if (!token) bad();
    i += token[0].length; const result = JSON.parse(token[0]);
    if (typeof result === 'number' && !Number.isFinite(result)) bad();
    return result;
  }
  const result = value(0); ws(); if (i !== text.length) bad(); return result;
}

function exact(value, fields) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).length !== fields.length || fields.some(k => !Object.hasOwn(value, k))) fail('E_ADAPTER_SCHEMA', 'exact object fields required');
}
function text(value) {
  if (typeof value !== 'string' || !value.trim() || /[\u0000\uD800-\uDFFF]/u.test(value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gu, ''))) fail('E_ADAPTER_SCHEMA', 'nonempty Unicode string required');
}
function token(value) { text(value); if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u.test(value)) fail('E_ADAPTER_SCHEMA', 'opaque key required'); }
function hash(value) { if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value)) fail('E_ADAPTER_SCHEMA', 'lowercase SHA256 required'); }
function header(value) { if (value.version !== VERSION) fail('E_ADAPTER_SCHEMA', 'unsupported version'); if (typeof value.packetId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(value.packetId)) fail('E_ADAPTER_SCHEMA', 'host UUID v4 required'); }
function array(value, max, min = 0) { if (!Array.isArray(value) || value.length < min || value.length > max) fail('E_ADAPTER_LIMIT', 'array bounds exceeded'); }
function unique(values) { if (new Set(values).size !== values.length) fail('E_ADAPTER_SCHEMA', 'duplicate identity'); }
function tuple(value) { if (value.corpusKind !== 'current') fail('E_ADAPTER_SCHEMA', 'current corpus required'); text(value.domain); text(value.documentId); }

export function validateSelection(value) {
  exact(value, ['version', 'authorityId', 'target', 'references']);
  if (value.version !== VERSION) fail('E_ADAPTER_SCHEMA', 'unsupported version'); text(value.authorityId);
  exact(value.target, ['corpusKind', 'domain', 'documentId', 'anchor', 'locale']); tuple(value.target); text(value.target.anchor);
  if (value.target.locale !== 'ko') fail('E_ADAPTER_SCHEMA', 'Korean paragraph required');
  array(value.references, LIMITS.sources - 1);
  for (const ref of value.references) { exact(ref, ['corpusKind', 'domain', 'documentId']); tuple(ref); }
  unique([value.target, ...value.references].map(v => canonicalJson([v.corpusKind, v.domain, v.documentId])));
  return value;
}
export function validateSourcePacket(value) {
  exact(value, ['version', 'packetId', 'targetKey', 'sources']); header(value); token(value.targetKey); array(value.sources, LIMITS.sources, 1);
  for (const source of value.sources) {
    exact(source, ['sourceKey', 'excerpts']); token(source.sourceKey); array(source.excerpts, 1024, 1);
    for (const excerpt of source.excerpts) { exact(excerpt, ['anchor', 'text']); text(excerpt.anchor); text(excerpt.text); }
    unique(source.excerpts.map(v => v.anchor));
  }
  unique(value.sources.map(v => v.sourceKey));
  if (!value.sources.some(v => v.sourceKey === value.targetKey)) fail('E_ADAPTER_BINDING', 'target absent');
  return value;
}
export function validateHostManifest(value) {
  exact(value, ['version', 'packetId', 'inputDigest', 'authorityId', 'authorityVersion', 'targetKey', 'targetAnchor', 'sources']);
  header(value); hash(value.inputDigest); text(value.authorityId); token(value.targetKey); text(value.targetAnchor);
  if (![1, 2].includes(value.authorityVersion)) fail('E_ADAPTER_SCHEMA', 'unsupported authority storage version');
  array(value.sources, LIMITS.sources, 1);
  for (const source of value.sources) {
    exact(source, ['sourceKey', 'authorityId', 'corpusKind', 'domain', 'documentId', 'revision', 'semanticSha256', 'admissionDigest', 'anchors']);
    token(source.sourceKey); text(source.authorityId); tuple(source); hash(source.revision); hash(source.semanticSha256); hash(source.admissionDigest);
    if (source.authorityId !== value.authorityId) fail('E_ADAPTER_BINDING', 'authority mismatch');
    array(source.anchors, 1024, 1); source.anchors.forEach(text); unique(source.anchors);
  }
  unique(value.sources.map(v => v.sourceKey));
  unique(value.sources.map(v => canonicalJson([v.authorityId, v.corpusKind, v.domain, v.documentId])));
  if (!value.sources.some(v => v.sourceKey === value.targetKey && v.anchors.includes(value.targetAnchor))) fail('E_ADAPTER_BINDING', 'target anchor absent');
  return value;
}
export function validateCandidate(value, manifest) {
  exact(value, ['version', 'packetId', 'inputDigest', 'targetKey', 'replacementText', 'citations']);
  header(value); hash(value.inputDigest); token(value.targetKey); text(value.replacementText);
  if (Buffer.byteLength(value.replacementText, 'utf8') > LIMITS.replacementBytes) fail('E_ADAPTER_LIMIT', 'replacement byte limit exceeded');
  array(value.citations, LIMITS.citations);
  for (const citation of value.citations) { exact(citation, ['sourceKey', 'anchor']); token(citation.sourceKey); text(citation.anchor); }
  if (manifest !== undefined) {
    validateHostManifest(manifest);
    if (['packetId', 'inputDigest', 'targetKey'].some(k => value[k] !== manifest[k])) fail('E_ADAPTER_BINDING', 'candidate packet mismatch');
    for (const c of value.citations) if (!manifest.sources.some(s => s.sourceKey === c.sourceKey && s.anchors.includes(c.anchor))) fail('E_ADAPTER_BINDING', 'citation absent');
  }
  return value;
}
export const parseCandidate = (bytes, manifest) => validateCandidate(parseStrictJson(bytes), manifest);
export const parseSelection = (bytes) => validateSelection(parseStrictJson(bytes));
export const parseSourcePacket = (bytes) => validateSourcePacket(parseStrictJson(bytes));
export const parseHostManifest = (bytes) => validateHostManifest(parseStrictJson(bytes));
