# Maintenance contract

- The source of truth for fields, reference hashes, and camera tokens is `tools/portrait/2d/character.schema.json`, `style-lock.json`, and `emit-character-prompt.mjs`.
- The ordered CLI is `generate-character-set.mjs`. Its test covers order, reference chaining, missing footwear, hash mismatch, and no overwrite. Update this skill whenever CLI flags or output receipts change.
- Outputs remain unreviewed 2D candidates. An actual PNG and receipt must exist before reporting generation; never equate a prompt, a successful hash check, or a Tripo-ready reference with an approved 3D asset.
- Credentials remain local. The user selects an OpenAI-compatible local endpoint, subscription gateway or BYOK connection; existing local CLIProxy is the default only when no explicit endpoint is selected. Never switch providers or incur a paid fallback silently. Request receipts contain no credentials.
- Installation and discovery are project-only: `.agents/skills/seoul-character-images/SKILL.md`. The cast adapter reads a caller-selected store and explicit authored look; it never edits the store or promotes a draft.
- `modular-parts.mjs` defines complete avatar-gen fitting slot references. It does not define cut surfaces or severed limbs. Source memory: `character-tool-arp-rig-pipeline-20260928.md` and the existing avatar-gen catalog. Exact Danny prompt text must be distinguished from this implementation's written description.
- `cliproxy-edit.mjs` sends style and identity as distinct image inputs. Receipts bind both hashes. A reference hash proves provenance, not visual identity or style quality.
- Names remain outside images. Generated PNGs must not contain captions, codes or lettering.
