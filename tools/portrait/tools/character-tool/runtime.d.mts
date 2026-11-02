export const root: string;
export class CliError extends Error { readonly code: string; constructor(code: string, message: string) }
export function blenderPath(explicit?: string): Promise<string>;
export function worker(binary: string, request: Readonly<Record<string, unknown>>): Promise<unknown>;
