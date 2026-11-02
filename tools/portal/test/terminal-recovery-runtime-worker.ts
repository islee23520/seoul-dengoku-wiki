import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { hash } from "../src/sources.ts";
import { readExecutionJobV1 } from "../src/terminal-rejections.ts";

const [ownerRoot, requestId] = process.argv.slice(2);
if (!ownerRoot || !requestId) throw Error("MISSING_READ_ONLY_JOB");
const dir = join(ownerRoot, "jobs", requestId);
const source = JSON.parse(
	await readFile(join(dir, "source-bytes.json"), "utf8"),
);
const recomputed = transformReferencePng(Buffer.from(source.image, "base64"));
const retained = await readFile(join(dir, "reference-normalized.png"));
const result = await readExecutionJobV1(ownerRoot, requestId);
console.log(
	JSON.stringify({
		runtime: process.versions.bun
			? `Bun ${process.versions.bun}`
			: `Node ${process.version}`,
		zlib: process.versions.zlib,
		result,
		retainedSHA256: hash(retained),
		retainedPixelsSHA256: hash(decodePng(retained).pixels),
		recomputedSHA256: hash(recomputed.rgbaBytes),
		recomputedPixelsSHA256: recomputed.receipt.rgbaPixelsSHA256,
		transform: recomputed.receipt,
	}),
);
