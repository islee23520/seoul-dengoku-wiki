// RED-only compatibility adapter for the pre-split reader API.
import { parsePbf } from './build-subway-topology.mjs';
import { readFileSync } from 'node:fs';

export class PbfLimitError extends Error {
  constructor(code, message = code) { super(`pbf: ${message}`); this.name = 'PbfLimitError'; this.code = code; }
}

export const DEFAULT_LIMITS = {};

export function readRelations(input) {
  const parsed = parsePbf(input);
  return parsed.relations ?? [];
}

export function readEntities(input) {
  const parsed = parsePbf(input);
  return {
    ...parsed,
    taggedNodes: parsed.nodes ?? new Map(),
    nodeCoords: parsed.nodes ?? new Map(),
    ways: parsed.ways ?? new Map(),
  };
}
