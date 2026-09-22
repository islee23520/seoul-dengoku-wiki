import { renderMermaid } from "../src/mermaid-lazy.js";
const valid = await renderMermaid("graph TD; A-->B");
const invalid = await renderMermaid("not mermaid");
const article = "기사 유지";
if (valid.svg) console.log("VALID_SVG");
else console.log("VALID_UNAVAILABLE");
if (invalid.error === "mermaid-error" && article === "기사 유지") console.log("INVALID_KEPT " + article);
else { console.log("INVALID_LOST"); process.exit(1); }
