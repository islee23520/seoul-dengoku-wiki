import { readFileSync } from 'node:fs';

const PATH_PATTERN = /(?:^|["'`\s(])((?:\.omo\/evidence\/|Design\/|Tool\/)[^"'`\s),]+\.(?:png|jpg|jpeg|webp|psd|xcf|json))/g;
const SHA_PATTERN = /\b[0-9a-f]{64}\b/gi;
const DECISIONS = new Set(['PASS', 'REJECTED', 'PENDING', 'SUPERSEDED', 'UNREVIEWED']);
const NON_APPROVAL_SCOPES = /^(?:transport|numeric(?:_verification)?|integrity|hash|pixel)$/i;

function normalizeDecision(value) {
  const status = String(value ?? '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (DECISIONS.has(status)) return status;
  if (/^(?:FAIL|FAILED|FAILURE|REJECT|OWNER_REJECTED)/.test(status)) return 'REJECTED';
  if (/^(?:PASS|PASSED|APPROVED|ACCEPTED|LEAD_APPROVED|OWNER_ACCEPTED)/.test(status)) return 'PASS';
  if (/^(?:PENDING|BLOCKED|IN_PROGRESS|NOT_VERIFIED)/.test(status)) return 'PENDING';
  if (/^(?:SUPERSEDED|STALE|ARCHIVED)/.test(status)) return 'SUPERSEDED';
  return 'UNREVIEWED';
}

function authorityFrom(path, text = '') {
  if (/OWNER-REJECTION/i.test(path) || /OWNER_(?:ACCEPTED|REJECTED)|OWNER\s+(?:APPROVAL|REJECTION)/i.test(text)) return 'owner';
  if (/LEAD-|LEAD_(?:APPROVED|ACCEPTED|REJECTED)|lead verdict/i.test(path) || /LEAD_(?:APPROVED|ACCEPTED|REJECTED)/i.test(text)) return 'lead';
  if (/independent/i.test(path) || /independent review/i.test(text)) return 'independent';
  if (/acceptance-binding|integration/i.test(path)) return 'integration';
  if (/verification|verdict/i.test(path)) return 'verifier';
  return 'producer';
}

function normalizePath(value) {
  return typeof value === 'string' ? value.replaceAll('\\', '/') : null;
}

function bindingFrom(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const path = normalizePath(value.path ?? value.output_path ?? value.target_path
    ?? (typeof value.output === 'string' ? value.output : null)
    ?? (typeof value.target === 'string' ? value.target : null));
  const sha = value.sha256 ?? value.output_sha256 ?? value.target_sha256;
  if (!path || !/^[0-9a-f]{64}$/i.test(sha ?? '')) return null;
  return { targetPath: path, targetSha: sha.toLowerCase() };
}

function markdownClaim(text, context) {
  const field = name => text.match(new RegExp(`^(?:${name})\\s*:\\s*(?:\\*\\*|\\x60)?([^\\n*\\x60]+)`, 'im'))?.[1]?.trim();
  const rawStatus = field('Status');
  const dimension = field('Scope|Dimension');
  const targetPath = normalizePath(field('Subject|Output|Target'));
  const targetSha = field('SHA256|Subject-SHA256|Output-SHA256|Target-SHA256');
  if (!rawStatus || !dimension || !targetPath || !/^[0-9a-f]{64}$/i.test(targetSha ?? '')) return null;
  const normalizedDimension = dimension.toLowerCase().replaceAll(' ', '_');
  const normalized = normalizeDecision(rawStatus);
  return {
    receiptPath: context.relativePath, receiptSha: context.receiptSha, targetPath, targetSha: targetSha.toLowerCase(),
    decision: NON_APPROVAL_SCOPES.test(normalizedDimension) && normalized === 'PASS' ? 'UNREVIEWED' : normalized,
    authority: context.authority, dimension: normalizedDimension, rawStatus,
    summary: field('Summary') ?? rawStatus, sourceKind: 'structured',
  };
}

function explicitClaims(value, context, output) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const child of value) explicitClaims(child, context, output);
    return;
  }
  const rawStatus = value.status ?? value.decision ?? value.verdict;
  const dimension = value.scope ?? value.dimension;
  const binding = bindingFrom(value.subject) ?? bindingFrom(value.output) ?? bindingFrom(value.target) ?? bindingFrom(value);
  if (rawStatus !== undefined && typeof dimension === 'string' && dimension.trim() && binding) {
    const normalizedDimension = dimension.trim().toLowerCase().replaceAll(' ', '_');
    const normalized = normalizeDecision(rawStatus);
    const decision = NON_APPROVAL_SCOPES.test(normalizedDimension) && normalized === 'PASS' ? 'UNREVIEWED' : normalized;
    output.push({
      receiptPath: context.relativePath,
      receiptSha: context.receiptSha,
      ...binding,
      decision,
      authority: typeof value.authority === 'string' && value.authority.trim() ? value.authority.trim().toLowerCase() : context.authority,
      dimension: normalizedDimension,
      rawStatus: String(rawStatus),
      summary: String(value.summary ?? value.note ?? rawStatus),
      sourceKind: 'structured',
    });
  }
  for (const child of Object.values(value)) explicitClaims(child, context, output);
}

export function parseReceipt({ absolutePath, relativePath, receiptSha }) {
  const text = readFileSync(absolutePath, 'utf8');
  const authority = authorityFrom(relativePath, text);
  const evaluations = [];
  const context = { relativePath, receiptSha, authority };
  if (relativePath.toLowerCase().endsWith('.json')) {
    try {
      explicitClaims(JSON.parse(text), context, evaluations);
    } catch {
      // Malformed receipt text remains discoverable below, but cannot become authoritative.
    }
  } else {
    const claim = markdownClaim(text, context);
    if (claim) evaluations.push(claim);
  }

  const boundPaths = new Set(evaluations.map(claim => claim.targetPath));
  for (const match of text.matchAll(PATH_PATTERN)) {
    const targetPath = match[1].replaceAll('\\', '/');
    if (boundPaths.has(targetPath)) continue;
    evaluations.push({
      receiptPath: relativePath, receiptSha, targetPath, targetSha: null,
      decision: 'UNREVIEWED', authority, dimension: 'reference', rawStatus: 'REFERENCE',
      summary: 'Informational path reference', sourceKind: 'reference',
    });
  }
  if (!evaluations.length) {
    for (const targetSha of new Set(text.match(SHA_PATTERN) ?? [])) evaluations.push({
      receiptPath: relativePath, receiptSha, targetPath: null, targetSha: targetSha.toLowerCase(),
      decision: 'UNREVIEWED', authority, dimension: 'reference', rawStatus: 'REFERENCE',
      summary: 'Informational SHA reference', sourceKind: 'reference',
    });
  }
  return evaluations;
}
