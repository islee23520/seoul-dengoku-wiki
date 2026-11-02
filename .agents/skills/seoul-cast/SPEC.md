# Seoul cast skill maintenance contract

- Purpose: describe the existing local cast CLI and its identity-preserving handoff to the character image tool.
- Sources relative to this directory: `../../../../tools/cast-cli/bin/seoul-cast.js`, `../../../../tools/cast-cli/package.json`, and `../../../tools/portrait/bin/seoul-character.mjs`.
- Installation: the project `.agents/skills/seoul-cast/` directory. Keep this skill and `../seoul-character-images/SKILL.md` current together whenever the WIKI character-sheet or image-tool contract changes.
- WIKI handoff: retain permanent character/person IDs, name, gender, look selection and validated canonical/birth context. Existing WIKI identities use the explicit WIKI-token route rather than duplicate local registration.
- Reference authoring: preserve published sourced slots and unknown nulls. The historical `bin/author-slots.mjs` reference does not exist in the preserved package; do not invoke it or treat source images as canonical activation or DB persistence.
- Verification: read the actual command implementation, verify supported flags and report exact local process results. Describe GUI, MCP, provider, publication and regeneration behavior as available only at the scope actually verified. A successful help command or fixture model projection does not prove real image fidelity.
- Language: keep both skill guides and this supporting contract in English.
- Boundaries: no automatic canon admission, stored user secrets, inferred appearance from game statistics, or official-rule claims for unverified GURPS cost tables.
