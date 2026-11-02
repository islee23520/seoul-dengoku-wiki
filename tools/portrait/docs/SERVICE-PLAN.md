# Current portrait service

Owner decision 2026-09-19 replaces the former provider/2D service plan.

`bin/portrait-gen.ts` drives `pipeline/portrait.ts` and `pipeline/catalog.ts`. The renderer is `tools/character-tool/portrait_render.py` in local Blender. `server/serve.ts` exposes the same render through loopback HTTP; `index.html` consumes it. `pipeline/stage.ts` exports a read-only gallery of valid PNGs.

Acceptance: actual pre-baked 3D source rendered successfully to a valid nonempty PNG is PASS. No external model service, provider credentials, 23-slot schema, pin, split, or 2D ordered approval gates.

Commands and supported formats are documented in the repository README. The former 2D implementation (`legacy-2d`) was deleted. No deployment is implied by running the local server or stage command.
