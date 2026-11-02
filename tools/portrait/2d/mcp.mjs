#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emit, formatPrompt, generate, listCharacters, listOptions, publicPrompt } from './emit-character-prompt.mjs';
import { readFile } from 'node:fs/promises';
import { modularParts } from './modular-parts.mjs';
import { baseSheetPrompt } from './danny-base-sheet.mjs';
import { readFaceCatalog } from './face-selection.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const referencePath = process.env.PORTRAIT_STYLE_REFERENCE;
const outputDir = process.env.PORTRAIT_OUTPUT_DIR;
const canonicalRoot = process.env.PORTRAIT_CANONICAL_ROOT ?? null;
const identityReferences = process.env.PORTRAIT_IDENTITY_MAP ? JSON.parse(await readFile(process.env.PORTRAIT_IDENTITY_MAP, 'utf8')) : {};
const requestSchema = z.object({
  faceMode: z.union([z.object({ kind: z.literal('unique'), variantId: z.null() }).strict(), z.object({ kind: z.literal('template'), variantId: z.string().min(1) }).strict()]),
  faceSelection: z.object({ gender: z.enum(['male', 'female']), ancestry: z.string().min(1), source: z.string().min(1), skinTone: z.object({ value: z.string().min(1), status: z.enum(['approved', 'authored-draft', 'art-proposal']), source: z.string().min(1) }).strict() }).strict().optional(),
  character: z.string().min(1).optional(),
  wikiToken: z.string().min(1).optional(),
  stylePath: z.string().min(1).optional(),
  slotOverrides: z.record(z.string(), z.record(z.string(), z.object({ value: z.union([z.string(), z.number()]).nullable(), status: z.enum(['approved', 'authored-draft', 'art-proposal', 'unknown']), source: z.string().nullable(), unit: z.string().nullable().optional() }).strict())).optional(),
  mode: z.enum(['portrait', 'full-body', 'turntable']),
  view: z.enum(['front', 'profile', 'side', 'back']).optional(),
  mangaStyle: z.literal('owner-reference').optional(),
  slotReplacements: z.record(z.string(), z.record(z.string(), z.object({ value: z.union([z.string(), z.number()]).nullable(), status: z.enum(['approved', 'authored-draft', 'art-proposal', 'unknown']), source: z.string().nullable(), unit: z.string().nullable().optional() }).strict())).optional(),
  selectedReferenceSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  format: z.enum(['json', 'yaml']).optional(),
  part: z.enum([...new Set(['head', 'hair', 'upper', 'lower', 'footwear', 'equipment', ...Object.keys(modularParts)])]).nullable().optional(),
  gender: z.enum(['male', 'female']).optional(),
  ageCategory: z.enum(['adult', 'minor']).optional(),
  mood: z.enum(['calm', 'weary', 'resolute']).optional(),
  occupation: z.enum(['field-contractor', 'courier']).optional(),
  hair: z.enum(['short-black', 'long-wine']).optional(),
  upper: z.enum(['teal-field', 'black-wine-gothic']).optional(),
  variantId: z.string().optional(),
});

export function createPortraitServer() {
  const catalogPath = process.env.PORTRAIT_FACE_CATALOG ?? null;
  let catalogCache;
  const server = new McpServer({ name: 'seoul-portrait-template', version: '0.1.0' });
  const reply = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
  server.registerTool('list_face_variants', { description: 'Read cached authored face variants; absent references mean traits only', inputSchema: z.object({}) }, async () => {
    const data = await (catalogCache ??= readFaceCatalog(catalogPath));
    return reply({ ...data, variants: data.variants.map(({ referenceImagePath, ...variant }) => variant) });
  });
  server.registerTool('list_characters', { description: 'List available portrait character templates', inputSchema: z.object({}) }, async () => reply(await listCharacters()));
  server.registerTool('list_options', { description: 'List wiki-sourced and proposed property choices', inputSchema: z.object({}) }, async () => reply(await listOptions()));
  server.registerTool('list_parts', { description: 'List complete avatar-gen fitting reference slots', inputSchema: z.object({}) }, async () => reply(Object.keys(modularParts)));
  server.registerTool('preview_base_sheet', { description: 'Preview the sourced Danny head and connected-body sheet contract without generating images', inputSchema: z.object({ gender: z.enum(['male', 'female']) }) }, async (a) => reply(await baseSheetPrompt(a.gender)));
  const makeInput = async (a) => {
    if (Boolean(a.character) === Boolean(a.wikiToken)) throw new Error('provide exactly one character or local wikiToken path');
    if (a.character && !(await listCharacters()).some((entry) => entry.key === a.character)) throw new Error('unknown character');
    return { requireFaceMode: true, faceMode: a.faceMode, faceSelection: a.faceSelection, faceVariantCatalogPath: catalogPath, character: a.character ? join(root, 'characters', `${a.character}.json`) : null, wikiToken: a.wikiToken ?? null, canonicalRoot, mode: a.mode, part: a.part ?? null, view: a.view ?? null, mangaStyle: a.mangaStyle ?? 'owner-reference', slotOverrides: a.slotOverrides ?? a.slotReplacements ?? {}, selectedReferenceSha256: a.selectedReferenceSha256 ?? null, referencePath, stylePath: a.stylePath ?? join(root, 'style-lock.json'), overrides: { gender: a.gender, ageCategory: a.ageCategory, mood: a.mood, occupation: a.occupation, hair: a.hair, upper: a.upper, variantId: a.variantId } };
  };
  server.registerTool('preview_prompt', { description: 'Emit JSON for a portrait, full body, or isolated part with locked design tokens', inputSchema: requestSchema }, async (a) => {
    try { return { content: [{ type: 'text', text: formatPrompt(publicPrompt(await emit(await makeInput(a))), a.format ?? 'json') }] }; } catch (e) { return { ...reply({ error: e.message }), isError: true }; }
  });
  server.registerTool('generate_image', { description: 'Execute an explicitly requested candidate generation on the user machine through their AI connection', inputSchema: requestSchema }, async (a) => {
    try {
      if (!outputDir) throw new Error('PORTRAIT_OUTPUT_DIR required');
      const identityKey = a.character ?? JSON.parse(await readFile(a.wikiToken, 'utf8')).characterId;
      const out = join(outputDir, `character-${a.mode}${a.view ? `-${a.view}` : ''}${a.part ? `-${a.part}` : ''}-${randomUUID()}.png`);
      return reply(publicPrompt(await generate(await makeInput(a), { output: out, identityReference: identityReferences[identityKey] ?? null, generator: `${process.env.HOME}/.agents/skills/asset-gen/tools/asset_gen.py` })));
    } catch (e) { return { ...reply({ error: e.message }), isError: true }; }
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!referencePath) { console.error('PORTRAIT_STYLE_REFERENCE required'); process.exit(2); }
  void serveStdio(createPortraitServer);
}
