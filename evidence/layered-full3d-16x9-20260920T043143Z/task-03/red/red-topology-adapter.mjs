// RED-only compatibility adapter: expose the prior monolith under the split-test API.
// This file is copied into the temporary 965ab671 tree; production modules are untouched.
import { assemble, parsePbf, ROUTE_KINDS, haversineM } from './build-subway-topology.mjs';
import { readFileSync } from 'node:fs';

export { assemble, parsePbf, ROUTE_KINDS, haversineM };
export const SUPPORTED_STOP_ROLES = new Set(['stop', 'stop_entry_only', 'stop_exit_only']);

export function normalizeName(value) {
  return String(value).normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function loadLedger(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function buildTopology({ pbfPath, worldGraph, stationInteriors, distanceGuardM = 750 }) {
  const pbf = parsePbf(pbfPath);
  return assemble({ pbf, worldGraph, stationInteriors, distanceLimitM: distanceGuardM });
}

export function assembleFromParsed({ entities, routeRelations, worldGraph, stationInteriors, distanceGuardM = 750 }) {
  const result = assemble({
    pbf: { ...entities, nodes: entities.taggedNodes, relations: routeRelations },
    worldGraph,
    stationInteriors,
    distanceLimitM: distanceGuardM,
  });
  result.topology.stops ??= result.topology.osmStops ?? [];
  result.topology.rejected ??= [];
  result.topology.connections ??= [];
  result.topology.edges ??= [];
  result.topology.stations ??= [];
  return result;
}
