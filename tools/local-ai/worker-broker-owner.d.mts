export type OwnedWorker = {
  readonly Transport?: 'linux-joined-v1';
  readonly Executable: string;
  readonly Sha256: string;
  readonly Arguments: readonly string[];
  readonly Pins?: readonly { readonly Path: string; readonly Sha256: string }[];
};
export type RetainedLease = {
  readonly runExclusive: (dispatch: (signal: AbortSignal) => Promise<number>) => Promise<number>;
};
export function runOwned(lease: RetainedLease, worker: OwnedWorker, request: object, cancellation?: AbortSignal): Promise<number>;
/** Internal pinned-owner transport; callers use runOwned for pin and lease checks. */
export function runJoinedWorker(worker: OwnedWorker, request: {readonly requestId: string}, signals: readonly AbortSignal[]): Promise<number>;
