import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';

export const FORCED_MODE = 'FORCED_STOP_MANUAL_RESTORE';
export const OPERATOR_SID = 'S-1-5-21-1273894420-2592752089-892309252-1001';
export const AUTHORIZATION = 'task12-maintenance-window-authorized';
const required = (value, code) => { if (!value) throw Object.assign(new Error(code), { code }); };

export async function readForcedApproval(path) {
  required(typeof path === 'string' && isAbsolute(path), 'FORCED_APPROVAL_REQUIRED');
  const { assertPrivate } = await import('./comfy-maintenance-controller.mjs');
  await assertPrivate(path);
  const bytes = await readFile(path);
  const approval = JSON.parse(bytes);
  required(approval.schema === 'local-ai-forced-stop-approval/v1'
    && approval.mode === FORCED_MODE && typeof approval.windowId === 'string' && approval.windowId.length > 0
    && approval.authorizationRecordId === AUTHORIZATION && approval.authorizationRecord === 74
    && approval.operatorSid === OPERATOR_SID && approval.forcedStopAcknowledged === true
    && approval.manualRestoreAcknowledged === true, 'INVALID_FORCED_APPROVAL');
  const created = Date.parse(approval.createdAt), expires = Date.parse(approval.expiresAt);
  required(Number.isFinite(created) && Number.isFinite(expires) && created <= Date.now()
    && expires > Date.now() && expires > created, 'FORCED_APPROVAL_EXPIRED');
  required(Array.isArray(approval.pids) && approval.pids.length > 0
    && approval.pids.every(pid => Number.isInteger(pid) && pid > 0)
    && new Set(approval.pids).size === approval.pids.length, 'INVALID_FORCED_PIDS');
  return { ...approval, path, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function readRestoreConfirmation(path, approval) {
  required(typeof path === 'string' && isAbsolute(path), 'OPERATOR_CONFIRMATION_REQUIRED');
  const { assertPrivate } = await import('./comfy-maintenance-controller.mjs');
  await assertPrivate(path);
  const confirmation = JSON.parse(await readFile(path, 'utf8'));
  required(confirmation.schema === 'local-ai-manual-restore-confirmation/v1'
    && confirmation.windowId === approval.windowId && confirmation.approvalSha256 === approval.sha256
    && confirmation.operatorSid === OPERATOR_SID && confirmation.manuallyRestored === true
    && Date.parse(confirmation.createdAt) >= Date.parse(approval.createdAt)
    && Date.parse(confirmation.createdAt) <= Date.now(), 'INVALID_RESTORE_CONFIRMATION');
  return confirmation;
}
