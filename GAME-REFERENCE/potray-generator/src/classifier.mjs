import { basename, extname } from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.psd', '.xcf']);
const RECEIPT_NAMES = /(?:acceptance(?:-binding)?|approval|lead-|status|verdict|receipt|decision|owner-rejection|final-verdict)/i;
const REVIEW_PARTS = /(?:^|\/)(?:review|verification|qa|crops?|masks?|isolates?|composites?|contacts?|previews?|diagnostics?|metrics)(?:\/|$)/i;
const RAW_PARTS = /(?:^|\/)(?:raw|source|sources|original|inputs?|provider|references?|frozen-input)(?:\/|$)/i;
const WORK_PARTS = /(?:^|\/)(?:candidate|candidates|work|working|slots?|plates?|output|final|registered|repairs?)(?:\/|$)/i;
const RUNTIME_EXTENSIONS = new Set(['.log', '.pid', '.exit', '.exit-code', '.stdout', '.pyc']);
const SLOT_IDS = ['clothes_back','headgear_back','hair_back','beard_back','face_base','eyes_white','eyes_color','eyes_shape','headgear_mid','clothes_front','bg','neck','cheeks','chin','mouth','nose','ears','clothes','beard','hair','headgear','acc_eye','frame'];

function inferSex(path) {
  const lower = path.toLowerCase();
  if (/(?:^|[/_-])female(?:[/_.-]|$)/.test(lower)) return 'female';
  if (/(?:^|[/_-])male(?:[/_.-]|$)/.test(lower)) return 'male';
  return null;
}

function inferSlot(path) {
  const normalized = path.toLowerCase().replaceAll('-', '_');
  return [...SLOT_IDS].sort((a, b) => b.length - a.length).find((slot) => normalized.includes(slot)) ?? null;
}

function inferLogicalId(path, sex, slot) {
  const stem = basename(path, extname(path)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${sex ?? 'unknown'}:${slot ?? 'unclassified'}:${stem}`;
}

export function classifyPath(path) {
  const extension = extname(path).toLowerCase();
  const name = basename(path);
  const stage = RECEIPT_NAMES.test(name) && ['.json', '.md', '.txt'].includes(extension)
    ? 'receipt'
    : RUNTIME_EXTENSIONS.has(extension) ? 'runtime'
      : REVIEW_PARTS.test(path) ? 'review'
        : RAW_PARTS.test(path) ? 'raw'
          : WORK_PARTS.test(path) ? 'work'
            : IMAGE_EXTENSIONS.has(extension) ? 'work' : 'runtime';
  const assetClass = IMAGE_EXTENSIONS.has(extension) ? 'image'
    : extension === '.json' || extension === '.jsonl' ? 'json'
      : extension === '.md' || extension === '.txt' ? 'document'
        : extension === '.py' || extension === '.mjs' || extension === '.js' || extension === '.ps1' ? 'code'
          : extension === '.tar' || extension === '.zip' ? 'archive' : 'other';
  const sex = inferSex(path);
  const slot = inferSlot(path);
  const lower = path.toLowerCase();
  const lifecycle = /(?:^|\/)(?:frozen-input|snapshot|proposal-snapshot)(?:\/|$)/.test(lower) ? 'snapshot'
    : /(?:^|\/)(?:stale|stale-[^/]*)(?:\/|$)/.test(lower) ? 'stale'
      : /(?:^|\/)(?:superseded|superseded-[^/]*)(?:\/|$)/.test(lower) ? 'superseded'
        : /(?:^|\/)(?:archive|archive-[^/]*|history)(?:\/|$)/.test(lower) ? 'archived'
          : /(?:^|\/)(?:rejected|rejected-[^/]*|rejects?|reject-[^/]*)(?:\/|$)/.test(lower) ? 'rejected'
            : /(?:^|\/)(?:failure|failures|failed-[^/]*)(?:\/|$)/.test(lower) ? 'failed'
              : /(?:^|\/)(?:attempt-?\d+|attempt[^/]*)(?:\/|$)/.test(lower) ? 'attempt' : 'current';
  const failureRelated = lifecycle === 'rejected' || lifecycle === 'failed' || /OWNER-REJECTION|failure-receipt|\.rej$/i.test(path);
  return { stage, assetClass, lifecycle, failureRelated, sex, slot, logicalId: inferLogicalId(path, sex, slot) };
}

export function mediaType(extension) {
  return ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain', '.xcf': 'image/x-xcf', '.psd': 'image/vnd.adobe.photoshop' })[extension] ?? 'application/octet-stream';
}
