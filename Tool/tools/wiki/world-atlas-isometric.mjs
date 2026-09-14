import { posix } from 'node:path';

import {
  CIVIC_HOUSES,
  CORPORATE_HOUSES,
  DIAGRAM_EDGE_FIELDS,
  DIAGRAM_NODE_FIELDS,
  DIAGRAM_REQUIRED_FIELDS,
  HOSTILE_GROUPS,
  ISOMETRIC_CAMERA,
  ISOMETRIC_DIAGRAM_ASSETS,
  LOCKED_HOUSES,
  SOURCE_KINDS,
  STATE_BY_ID,
  STATES,
  SUBWAY_SURFACE_LAYERS,
  THEATERS,
  WIKI_PALETTE,
} from './world-atlas-schema.mjs';

export const ISO_VIEW_WIDTH = 1280;
export const ISO_VIEW_HEIGHT = 720;

const FONT_FAMILY = 'Pretendard, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif';
const COS_30 = Math.sqrt(3) / 2;
const SIN_30 = 0.5;

const HOUSE_NAME = Object.freeze(Object.fromEntries(LOCKED_HOUSES.map((h) => [h.id, h.name])));
const THEATER_NAME = Object.freeze(Object.fromEntries(THEATERS.map((t) => [t.id, t.name])));
const GROUP_NAME = Object.freeze(Object.fromEntries(HOSTILE_GROUPS.map((g) => [g.id, g.name])));
const GROUP_CATEGORY = Object.freeze(Object.fromEntries(HOSTILE_GROUPS.map((g) => [g.id, g.category])));
const CORPORATE_IDS = new Set(CORPORATE_HOUSES.map((h) => h.id));
const CIVIC_IDS = new Set(CIVIC_HOUSES.map((h) => h.id));
const LAYER_NAME = Object.freeze(Object.fromEntries(SUBWAY_SURFACE_LAYERS.map((l) => [l.id, l.name])));

export function projectIsometric(x, y, z, tilePx) {
  return {
    x: (x - y) * COS_30 * tilePx,
    y: (x + y) * SIN_30 * tilePx - z * tilePx,
  };
}

export function fmtCoord(n) {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const SVG_ASSET_DIR = posix.join('Reference', 'assets', 'wiki');
const WIKI_PAGE_DIR = posix.join('GDD', 'game-logic');

export function wikiHrefFromSvgAsset(href) {
  const raw = String(href);
  if (raw.startsWith('#') || raw === '') return raw;
  const hashAt = raw.indexOf('#');
  const pathPart = hashAt === -1 ? raw : raw.slice(0, hashAt);
  const fragment = hashAt === -1 ? '' : raw.slice(hashAt);
  const page = posix.basename(pathPart);
  if (!page || page === '.' || page === '..') {
    throw new Error(`cannot derive wiki page from href ${href}`);
  }
  return `${posix.relative(SVG_ASSET_DIR, posix.join(WIKI_PAGE_DIR, page))}${fragment}`;
}

function requireFields(record, fields, where) {
  for (const field of fields) {
    const value = record?.[field];
    if (value === undefined || value === null || value === '') {
      throw new Error(`diagram field missing ${where}.${field}`);
    }
  }
}

function layerName(diagram, id) {
  const listed = (diagram.layers ?? []).find((layer) => layer.id === id);
  if (listed?.name) return listed.name;
  return LAYER_NAME[id] ?? id;
}

export function nodeDisplayName(atlas, diagram, node) {
  if (node.kind === 'state') return STATE_BY_ID[node.ref]?.name ?? node.ref;
  if (node.kind === 'house') {
    return atlas.houses?.find((h) => h.id === node.ref)?.display_name ?? HOUSE_NAME[node.ref] ?? node.ref;
  }
  if (node.kind === 'theater') {
    return atlas.theaters?.find((t) => t.id === node.ref)?.display_name ?? THEATER_NAME[node.ref] ?? node.ref;
  }
  if (node.kind === 'group') {
    return atlas.hostile_groups?.find((g) => g.id === node.ref)?.display_name ?? GROUP_NAME[node.ref] ?? node.ref;
  }
  if (node.kind === 'layer') return layerName(diagram, node.ref);
  return node.ref;
}

function fitOrigin(nodes, tilePx, box) {
  const points = nodes.map((node) => projectIsometric(node.grid.x, node.grid.y, node.grid.z, tilePx));
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  return {
    x: box.x + box.width / 2 - (minX + maxX) / 2,
    y: box.y + box.height / 2 - (minY + maxY) / 2,
  };
}

function screenPoint(node, tilePx, origin) {
  const p = projectIsometric(node.grid.x + 0.5, node.grid.y + 0.5, node.grid.z, tilePx);
  return { x: origin.x + p.x, y: origin.y + p.y };
}

function tilePoints(node, tilePx, origin) {
  const corners = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]];
  return corners.map(([dx, dy, dz]) => {
    const p = projectIsometric(node.grid.x + dx, node.grid.y + dy, node.grid.z + dz, tilePx);
    return `${fmtCoord(origin.x + p.x)},${fmtCoord(origin.y + p.y)}`;
  }).join(' ');
}

function cubeFaces(node, tilePx, origin) {
  const pt = (dx, dy, dz) => {
    const p = projectIsometric(node.grid.x + dx, node.grid.y + dy, node.grid.z + dz, tilePx);
    return { x: origin.x + p.x, y: origin.y + p.y };
  };
  const a = pt(0, 0, 0);
  const b = pt(1, 0, 0);
  const d = pt(0, 1, 0);
  const e = pt(0, 0, 0.7);
  const f = pt(1, 0, 0.7);
  const g = pt(1, 1, 0.7);
  const h = pt(0, 1, 0.7);
  const poly = (...pts) => pts.map((p) => `${fmtCoord(p.x)},${fmtCoord(p.y)}`).join(' ');
  return {
    left: poly(a, d, h, e),
    right: poly(a, b, f, e),
    top: poly(e, f, g, h),
    center: pt(0.5, 0.5, 0.7),
  };
}

function edgeStyle(kind) {
  switch (kind) {
    case 'obligation':
      return { stroke: WIKI_PALETTE.teal, dash: '', width: 2.4, marker: false };
    case 'contested-corridor':
      return { stroke: WIKI_PALETTE.red, dash: '6 4', width: 1.6, marker: false };
    case 'adjacent':
    case 'layer-stack':
      return { stroke: WIKI_PALETTE.ink, dash: '', width: 2, marker: false };
    case 'pressure':
    case 'theater-link':
      return { stroke: WIKI_PALETTE.red, dash: '8 5', width: 1.8, marker: true };
    case 'migration':
      return { stroke: WIKI_PALETTE.blue, dash: '', width: 2, marker: true };
    case 'energy-flow':
      return { stroke: WIKI_PALETTE.teal, dash: '2 4', width: 2, marker: true };
    case 'material-flow':
      return { stroke: WIKI_PALETTE.ink, dash: '2 4', width: 2, marker: true };
    case 'scenario-hotspot':
      return { stroke: WIKI_PALETTE.red, dash: '', width: 2.2, marker: true };
    default:
      return { stroke: WIKI_PALETTE.ink, dash: '4 4', width: 1.5, marker: false };
  }
}

function shapeForNode(node) {
  if (node.kind === 'state') return 'diamond';
  if (node.kind === 'theater') return 'hexagon';
  if (node.kind === 'layer') return 'stack';
  if (node.kind === 'house') return CORPORATE_IDS.has(node.ref) ? 'cube' : 'cylinder';
  if (node.kind === 'group') {
    const category = GROUP_CATEGORY[node.ref];
    if (category === 'animal-urban') return 'ellipse';
    if (category === 'humanoid-mutant') return 'triangle';
    if (category === 'rogue-robot') return 'square';
    return 'hexagon';
  }
  return 'diamond';
}

function fillForNode(node) {
  if (node.kind === 'state') return node.mark === 'contested' ? WIKI_PALETTE.red : WIKI_PALETTE.blue;
  if (node.kind === 'theater') return WIKI_PALETTE.red;
  if (node.kind === 'layer') return WIKI_PALETTE.teal;
  if (node.kind === 'house') return CIVIC_IDS.has(node.ref) ? WIKI_PALETTE.teal : WIKI_PALETTE.blue;
  if (node.kind === 'group') {
    const category = GROUP_CATEGORY[node.ref];
    if (category === 'animal-urban') return WIKI_PALETTE.teal;
    if (category === 'humanoid-mutant') return WIKI_PALETTE.blue;
    if (category === 'rogue-robot') return WIKI_PALETTE.ink;
    return WIKI_PALETTE.red;
  }
  return WIKI_PALETTE.ink;
}

function hexagonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (30 + i * 60);
    pts.push(`${fmtCoord(cx + r * Math.cos(angle))},${fmtCoord(cy + r * Math.sin(angle))}`);
  }
  return pts.join(' ');
}

function renderShape(node, at, tilePx, origin) {
  const fill = fillForNode(node);
  const shape = shapeForNode(node);
  const ink = WIKI_PALETTE.ink;
  if (node.kind === 'state' || node.kind === 'layer') {
    const poly = tilePoints(node, tilePx, origin);
    const hatch = node.mark === 'contested'
      ? `<polygon id="${escapeXml(node.id)}-hatch" points="${poly}" fill="url(#iso-hatch)" stroke="${ink}" stroke-width="1.8"/>`
      : '';
    return `<polygon id="${escapeXml(node.id)}-shape" points="${poly}" fill="${fill}" stroke="${ink}" stroke-width="1.8"/>${hatch}`;
  }
  if (shape === 'cube') {
    const faces = cubeFaces(node, tilePx, origin);
    return [
      `<polygon points="${faces.left}" fill="${WIKI_PALETTE.ink}" stroke="${ink}" stroke-width="1.2"/>`,
      `<polygon points="${faces.right}" fill="${fill}" stroke="${ink}" stroke-width="1.2"/>`,
      `<polygon points="${faces.top}" fill="${WIKI_PALETTE.paper}" stroke="${ink}" stroke-width="1.2"/>`,
    ].join('');
  }
  if (shape === 'cylinder') {
    const rx = tilePx * 0.28;
    const ry = tilePx * 0.14;
    return [
      `<rect x="${fmtCoord(at.x - rx)}" y="${fmtCoord(at.y - 8)}" width="${fmtCoord(rx * 2)}" height="16" fill="${fill}" stroke="${ink}" stroke-width="1.4"/>`,
      `<ellipse cx="${fmtCoord(at.x)}" cy="${fmtCoord(at.y - 8)}" rx="${fmtCoord(rx)}" ry="${fmtCoord(ry)}" fill="${WIKI_PALETTE.paper}" stroke="${ink}" stroke-width="1.4"/>`,
      `<ellipse cx="${fmtCoord(at.x)}" cy="${fmtCoord(at.y + 8)}" rx="${fmtCoord(rx)}" ry="${fmtCoord(ry)}" fill="${fill}" stroke="${ink}" stroke-width="1.4"/>`,
    ].join('');
  }
  if (shape === 'ellipse') {
    return `<ellipse cx="${fmtCoord(at.x)}" cy="${fmtCoord(at.y)}" rx="${fmtCoord(tilePx * 0.28)}" ry="${fmtCoord(tilePx * 0.16)}" fill="${fill}" stroke="${ink}" stroke-width="1.6"/>`;
  }
  if (shape === 'triangle') {
    const s = tilePx * 0.32;
    const pts = `${fmtCoord(at.x)},${fmtCoord(at.y - s)} ${fmtCoord(at.x + s)},${fmtCoord(at.y + s * 0.6)} ${fmtCoord(at.x - s)},${fmtCoord(at.y + s * 0.6)}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${ink}" stroke-width="1.6"/>`;
  }
  if (shape === 'square') {
    const s = tilePx * 0.22;
    return `<rect x="${fmtCoord(at.x - s)}" y="${fmtCoord(at.y - s)}" width="${fmtCoord(s * 2)}" height="${fmtCoord(s * 2)}" fill="${fill}" stroke="${ink}" stroke-width="1.6"/>`;
  }
  return `<polygon points="${hexagonPoints(at.x, at.y, tilePx * 0.28)}" fill="${fill}" stroke="${ink}" stroke-width="1.8"/>`;
}

function legendSwatch(entry, x, y) {
  const fill = entry.fill ?? WIKI_PALETTE.ink;
  const stroke = entry.stroke ?? WIKI_PALETTE.ink;
  if (entry.shape === 'diamond' || entry.shape === 'stack') {
    return `<polygon points="${x + 12},${y - 8} ${x + 24},${y} ${x + 12},${y + 8} ${x},${y}" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'hexagon') {
    return `<polygon points="${hexagonPoints(x + 12, y, 9)}" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'cube') {
    return `<rect x="${x + 3}" y="${y - 8}" width="16" height="16" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'cylinder' || entry.shape === 'ellipse') {
    return `<ellipse cx="${x + 12}" cy="${y}" rx="10" ry="7" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'triangle') {
    return `<polygon points="${x + 12},${y - 9} ${x + 22},${y + 8} ${x + 2},${y + 8}" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'square') {
    return `<rect x="${x + 4}" y="${y - 8}" width="16" height="16" fill="${fill}" stroke="${WIKI_PALETTE.ink}" stroke-width="1.4"/>`;
  }
  if (entry.shape === 'dashed') {
    return `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${stroke}" stroke-width="3" stroke-dasharray="6 4"/>`;
  }
  if (entry.shape === 'dotted') {
    return `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${stroke}" stroke-width="3" stroke-dasharray="2 4"/>`;
  }
  return `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${stroke}" stroke-width="3"/>`;
}

export function collectSvgIds(svg) {
  return [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

export function collectSvgTexts(svg) {
  const texts = [];
  const re = /<text\b([^>]*)>([^<]*)<\/text>/g;
  let match;
  while ((match = re.exec(svg))) {
    const attrs = match[1];
    const attr = (name) => {
      const found = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
      return found ? found[1] : null;
    };
    texts.push({
      x: Number(attr('x')),
      y: Number(attr('y')),
      fontSize: Number(attr('font-size') ?? 14),
      anchor: attr('text-anchor') ?? 'start',
      text: match[2],
    });
  }
  return texts;
}

export function estimateTextBox(text) {
  let width = 0;
  for (const char of text.text) {
    width += /[가-힣]/.test(char) ? text.fontSize : text.fontSize * 0.62;
  }
  const height = text.fontSize * 1.2;
  let left = text.x;
  if (text.anchor === 'middle') left = text.x - width / 2;
  else if (text.anchor === 'end') left = text.x - width;
  return {
    x: left,
    y: text.y - text.fontSize * 0.9,
    width,
    height,
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function boxInsideView(box) {
  return box.x >= 0 && box.y >= 0 && box.x + box.width <= ISO_VIEW_WIDTH && box.y + box.height <= ISO_VIEW_HEIGHT;
}

function boxInZone(box, zone) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return cx >= zone.x && cx <= zone.x + zone.width && cy >= zone.y && cy <= zone.y + zone.height;
}

export function findGeometryViolations(svg, diagram) {
  const texts = collectSvgTexts(svg).filter((item) => item.text.trim() !== '' && Number.isFinite(item.x) && Number.isFinite(item.y));
  const boxes = texts.map((item) => ({ ...estimateTextBox(item), text: item.text }));
  const zones = diagram.callout_zones ?? [];
  const violations = [];
  for (const box of boxes) {
    if (!boxInsideView(box)) {
      violations.push(`out-of-view ${box.text}`);
    }
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (!rectsOverlap(boxes[i], boxes[j])) continue;
      const inside = zones.some((zone) => boxInZone(boxes[i], zone) && boxInZone(boxes[j], zone));
      if (!inside) violations.push(`overlap ${boxes[i].text} | ${boxes[j].text}`);
    }
  }
  return violations;
}

export function assertIsometricSvgContracts({ svg, diagram, atlas }) {
  if (!svg.includes('viewBox="0 0 1280 720"')) throw new Error('missing viewBox 1280x720');
  if (!/\bwidth="1280"/.test(svg) || !/\bheight="720"/.test(svg)) throw new Error('missing 1280x720 dimensions');
  if (!/\brole="img"/.test(svg)) throw new Error('missing accessibility role');
  if (!/\baria-labelledby="/.test(svg)) throw new Error('missing accessibility aria-labelledby');
  const title = svg.match(/<title\b[^>]*>([^<]*)<\/title>/);
  const desc = svg.match(/<desc\b[^>]*>([^<]*)<\/desc>/);
  if (!title || !/[가-힣]/.test(title[1])) throw new Error('missing Korean title');
  if (!desc || !/[가-힣]/.test(desc[1])) throw new Error('missing Korean desc');
  if (diagram?.title && title[1] !== diagram.title) throw new Error('title does not match Atlas');
  if (diagram?.desc && desc[1] !== diagram.desc) throw new Error('desc does not match Atlas');
  for (const color of Object.values(WIKI_PALETTE)) {
    if (!svg.includes(color)) throw new Error(`missing palette ${color}`);
  }
  if (!svg.includes(String(ISOMETRIC_CAMERA.yawDegrees))) throw new Error('missing yaw 45');
  if (!svg.includes(String(ISOMETRIC_CAMERA.pitchDegrees))) throw new Error('missing pitch 35.264');
  if (!svg.includes('1.5')) throw new Error('missing 1.5m tile');
  for (const cardinal of ISOMETRIC_CAMERA.cardinals) {
    if (!svg.includes(cardinal)) throw new Error(`missing cardinal ${cardinal}`);
  }
  if (!svg.includes(FONT_FAMILY)) throw new Error('missing Korean font stack');
  if (!svg.includes('stroke-dasharray')) throw new Error('missing non-color legend');
  const ids = new Set(collectSvgIds(svg));
  const declared = [...(diagram.nodes ?? []).map((n) => n.id), ...(diagram.edges ?? []).map((e) => e.id)];
  for (const id of declared) {
    if (!ids.has(id)) throw new Error(`dangling id ${id} missing from SVG`);
  }
  for (const id of ids) {
    const declaredHit = declared.some((item) => id === item || id.startsWith(`${item}-`));
    if ((id.startsWith('N-') || id.startsWith('E-')) && !declaredHit) {
      throw new Error(`dangling id ${id} missing from Atlas`);
    }
  }
  for (const node of diagram.nodes ?? []) {
    const name = nodeDisplayName(atlas, diagram, node);
    if (!svg.includes(node.ref) || !svg.includes(name)) {
      throw new Error(`missing accessible id ${node.ref}`);
    }
  }
  const geometry = findGeometryViolations(svg, diagram);
  if (geometry.length > 0) throw new Error(geometry[0]);
  return true;
}

export function verifyDiagramRecords(atlas, fail) {
  const diagrams = atlas.diagrams ?? [];
  if (diagrams.length !== 3) fail('E_DIAGRAM_COUNT', `actual=${diagrams.length}`);
  const assets = diagrams.map((d) => d.asset);
  if (JSON.stringify(assets) !== JSON.stringify([...ISOMETRIC_DIAGRAM_ASSETS])) {
    fail('E_DIAGRAM_ASSET', assets.join(','));
  }
  const houseIds = new Set((atlas.houses ?? []).map((h) => h.id));
  const theaterIds = new Set((atlas.theaters ?? []).map((t) => t.id));
  const groupIds = new Set((atlas.hostile_groups ?? []).map((g) => g.id));
  const stateIds = new Set(STATES.map((s) => s.id));
  for (const diagram of diagrams) {
    requireFieldsSafe(diagram, DIAGRAM_REQUIRED_FIELDS, fail, diagram.id ?? '?');
    if (!SOURCE_KINDS.includes(diagram.source_kind)) fail('E_SOURCE_KIND', diagram.id);
    const camera = diagram.camera ?? {};
    if (camera.projection !== ISOMETRIC_CAMERA.projection) fail('E_DIAGRAM_CAMERA', diagram.id);
    if (Number(camera.yaw_degrees) !== ISOMETRIC_CAMERA.yawDegrees) fail('E_DIAGRAM_CAMERA', `${diagram.id} yaw`);
    if (Number(camera.pitch_degrees) !== ISOMETRIC_CAMERA.pitchDegrees) fail('E_DIAGRAM_CAMERA', `${diagram.id} pitch`);
    if (Number(camera.tile_meters) !== ISOMETRIC_CAMERA.tileMeters) fail('E_DIAGRAM_CAMERA', `${diagram.id} tile`);
    const nodeIds = new Set();
    const refs = { state: new Set(), house: new Set(), theater: new Set(), group: new Set(), layer: new Set() };
    for (const node of diagram.nodes ?? []) {
      requireFieldsSafe(node, DIAGRAM_NODE_FIELDS, fail, `${diagram.id}.${node.id ?? '?'}`);
      if (nodeIds.has(node.id)) fail('E_DIAGRAM_NODE', `duplicate ${node.id}`);
      nodeIds.add(node.id);
      if (!SOURCE_KINDS.includes(node.source_kind)) fail('E_SOURCE_KIND', node.id);
      if (!Number.isFinite(node.grid?.x) || !Number.isFinite(node.grid?.y) || !Number.isFinite(node.grid?.z)) {
        fail('E_DIAGRAM_NODE', `${node.id} grid`);
      }
      if (node.kind === 'state') {
        if (!stateIds.has(node.ref)) fail('E_DANGLING_DIAGRAM_REF', node.ref);
        refs.state.add(node.ref);
      } else if (node.kind === 'house') {
        if (!houseIds.has(node.ref)) fail('E_DANGLING_DIAGRAM_REF', node.ref);
        refs.house.add(node.ref);
      } else if (node.kind === 'theater') {
        if (!theaterIds.has(node.ref)) fail('E_DANGLING_DIAGRAM_REF', node.ref);
        refs.theater.add(node.ref);
      } else if (node.kind === 'group') {
        if (!groupIds.has(node.ref)) fail('E_DANGLING_DIAGRAM_REF', node.ref);
        refs.group.add(node.ref);
      } else if (node.kind === 'layer') {
        if (!(diagram.layers ?? []).some((layer) => layer.id === node.ref)) fail('E_DANGLING_DIAGRAM_REF', node.ref);
        refs.layer.add(node.ref);
      } else fail('E_DIAGRAM_NODE', `${node.id} kind`);
    }
    for (const edge of diagram.edges ?? []) {
      requireFieldsSafe(edge, DIAGRAM_EDGE_FIELDS, fail, `${diagram.id}.${edge.id ?? '?'}`);
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) fail('E_DANGLING_DIAGRAM_EDGE', edge.id);
    }
    if (diagram.asset === 'world-atlas-isometric.svg') {
      for (const state of STATES) {
        if (!refs.state.has(state.id)) fail('E_DIAGRAM_COVERAGE', `state ${state.id}`);
      }
      for (const layer of SUBWAY_SURFACE_LAYERS) {
        if (!refs.layer.has(layer.id)) fail('E_DIAGRAM_COVERAGE', `layer ${layer.id}`);
      }
      for (const theater of THEATERS) {
        if (!refs.theater.has(theater.id)) fail('E_DIAGRAM_COVERAGE', `theater ${theater.id}`);
      }
    }
    if (diagram.asset === 'house-influence-isometric.svg') {
      for (const house of LOCKED_HOUSES) {
        if (!refs.house.has(house.id)) fail('E_DIAGRAM_COVERAGE', `house ${house.id}`);
      }
    }
    if (diagram.asset === 'hostile-ecology-isometric.svg') {
      for (const group of HOSTILE_GROUPS) {
        if (!refs.group.has(group.id)) fail('E_DIAGRAM_COVERAGE', `group ${group.id}`);
      }
    }
  }
}

function requireFieldsSafe(record, fields, fail, where) {
  for (const field of fields) {
    const value = record?.[field];
    if (value === undefined || value === null || value === '') fail('E_DIAGRAM_FIELD', `${where} missing ${field}`);
  }
}

export function renderIsometricSvg(diagram, atlas, atlasHash) {
  requireFields(diagram, DIAGRAM_REQUIRED_FIELDS, diagram.id ?? 'diagram');
  const tilePx = diagram.tile_px;
  const origin = fitOrigin(diagram.nodes, tilePx, diagram.content_box);
  const positions = new Map(diagram.nodes.map((node) => [node.id, screenPoint(node, tilePx, origin)]));

  const edgeMarkup = [...diagram.edges].sort((a, b) => a.id.localeCompare(b.id)).map((edge) => {
    const a = positions.get(edge.from);
    const b = positions.get(edge.to);
    const style = edgeStyle(edge.kind);
    const dash = style.dash ? ` stroke-dasharray="${style.dash}"` : '';
    const marker = style.marker ? ' marker-end="url(#iso-arrow)"' : '';
    return `<line id="${escapeXml(edge.id)}" x1="${fmtCoord(a.x)}" y1="${fmtCoord(a.y)}" x2="${fmtCoord(b.x)}" y2="${fmtCoord(b.y)}" stroke="${style.stroke}" stroke-width="${style.width}"${dash}${marker}/>`;
  }).join('');

  const layerNodes = diagram.nodes.filter((node) => node.kind === 'layer')
    .sort((a, b) => b.grid.z - a.grid.z);
  const otherNodes = diagram.nodes.filter((node) => node.kind !== 'layer')
    .sort((a, b) => (a.grid.x + a.grid.y) - (b.grid.x + b.grid.y) || a.id.localeCompare(b.id));

  const nodeMarkup = [...layerNodes, ...otherNodes].map((node) => {
    const at = positions.get(node.id);
    const name = nodeDisplayName(atlas, diagram, node);
    const label = String(node.callout);
    return `<g id="${escapeXml(node.id)}" data-ref="${escapeXml(node.ref)}" data-kind="${escapeXml(node.kind)}" data-layer="${escapeXml(node.layer)}" data-source-kind="${escapeXml(node.source_kind)}" data-label-priority="${escapeXml(node.label_priority)}">
      <title>${escapeXml(node.ref)} ${escapeXml(name)}</title>
      ${renderShape(node, at, tilePx, origin)}
      <text x="${fmtCoord(at.x)}" y="${fmtCoord(at.y + 4)}" text-anchor="middle" font-size="11" fill="${WIKI_PALETTE.paper}" stroke="${WIKI_PALETTE.ink}" stroke-width="0.6">${escapeXml(label)}</text>
    </g>`;
  }).join('');

  const callouts = [...diagram.nodes].sort((a, b) => a.callout - b.callout);
  const zone = diagram.callout_zones[0];
  const line = callouts.length > 28 ? 12 : 15;
  const rows = Math.max(1, Math.floor(zone.height / line));
  const cols = Math.max(1, Math.ceil(callouts.length / rows));
  const colW = zone.width / cols;
  const calloutMarkup = callouts.map((node, index) => {
    const col = Math.floor(index / rows);
    const row = index % rows;
    const x = zone.x + 8 + col * colW;
    const y = zone.y + 16 + row * line;
    const name = nodeDisplayName(atlas, diagram, node);
    const fill = node.kind === 'theater' || node.mark === 'contested' ? WIKI_PALETTE.red : WIKI_PALETTE.ink;
    return `<a href="#${escapeXml(node.id)}"><text x="${fmtCoord(x)}" y="${fmtCoord(y)}" font-size="12" fill="${fill}">${escapeXml(String(node.callout))} ${escapeXml(node.ref)} ${escapeXml(name)}</text></a>`;
  }).join('');

  const legendZone = diagram.callout_zones[1] ?? diagram.callout_zones[0];
  const legendItems = diagram.legend.map((entry, index) => {
    const y = legendZone.y + 28 + index * 28;
    return `<g id="${escapeXml(entry.id)}">${legendSwatch(entry, legendZone.x + 10, y)}<text x="${fmtCoord(legendZone.x + 40)}" y="${fmtCoord(y + 4)}" font-size="14" fill="${WIKI_PALETTE.ink}">${escapeXml(entry.label)}</text></g>`;
  }).join('');
  const wikiStart = legendZone.y + 28 + diagram.legend.length * 28 + 18;
  const wikiMarkup = diagram.wiki_links.map((link, index) => {
    const y = wikiStart + index * 22;
    return `<a href="${escapeXml(wikiHrefFromSvgAsset(link.href))}"><text x="${fmtCoord(legendZone.x + 10)}" y="${fmtCoord(y)}" font-size="14" fill="${WIKI_PALETTE.blue}">${escapeXml(link.label)}</text></a>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc" xml:lang="ko" data-atlas-hash="${escapeXml(atlasHash)}" data-yaw="${ISOMETRIC_CAMERA.yawDegrees}" data-pitch="${ISOMETRIC_CAMERA.pitchDegrees}" data-tile-meters="${ISOMETRIC_CAMERA.tileMeters}">
  <title id="title">${escapeXml(diagram.title)}</title>
  <desc id="desc">${escapeXml(diagram.desc)}</desc>
  <rect width="1280" height="720" fill="${WIKI_PALETTE.paper}"/>
  <defs>
    <pattern id="iso-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
      <path d="M0 6 6 0" stroke="${WIKI_PALETTE.red}" stroke-width="1.2" fill="none"/>
    </pattern>
    <marker id="iso-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="${WIKI_PALETTE.red}"/>
    </marker>
  </defs>
  <g font-family="${FONT_FAMILY}" fill="${WIKI_PALETTE.ink}">
    <text x="640" y="36" text-anchor="middle" font-size="26" font-weight="700">${escapeXml(diagram.title)}</text>
    <text x="640" y="62" text-anchor="middle" font-size="14" fill="${WIKI_PALETTE.ink}">직교 카메라 · 편각 45° · 앙각 35.264° · 칸 1.5m · 북 동 남 서</text>
    <g id="iso-edges">${edgeMarkup}</g>
    <g id="iso-nodes">${nodeMarkup}</g>
    <g id="iso-callouts">${calloutMarkup}</g>
    <g id="iso-legend">
      <text x="${fmtCoord(legendZone.x + 10)}" y="${fmtCoord(legendZone.y + 4)}" font-size="16" font-weight="700">범례 · 색만으로 구분하지 않음</text>
      ${legendItems}
      ${wikiMarkup}
    </g>
    <g id="iso-compass">
      <text x="640" y="688" text-anchor="middle" font-size="14">카메라: 직교 · Yaw 45° · Pitch 35.264° · 1.5m 칸 · 자유 회전 없음</text>
      <text x="500" y="712" text-anchor="middle" font-size="13">북</text>
      <text x="580" y="712" text-anchor="middle" font-size="13">동</text>
      <text x="660" y="712" text-anchor="middle" font-size="13">남</text>
      <text x="740" y="712" text-anchor="middle" font-size="13">서</text>
    </g>
  </g>
</svg>
`;
}

export function renderAtlasIsometricSvgs(atlas, atlasHash) {
  const out = {};
  const diagrams = atlas.diagrams ?? [];
  for (const asset of ISOMETRIC_DIAGRAM_ASSETS) {
    const diagram = diagrams.find((item) => item.asset === asset);
    if (!diagram) throw new Error(`missing atlas diagram record for ${asset}`);
    out[asset] = renderIsometricSvg(diagram, atlas, atlasHash);
  }
  return out;
}
