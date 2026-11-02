import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeNativeMossPackage } from "./native-moss-package.ts";
import { createReleasePackage } from "./release-package.ts";
import {
	loadTrainingStyles,
	trainingStyleProfile,
} from "./training-generation.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputKey = "PORTAL_BUILD_OUTPUT";
const nativeSourceKey = "PORTAL_BUILD_NATIVE_SOURCE";
const output = process.env[outputKey]
	? resolve(process.env[outputKey] as string)
	: resolve(root, "dist");
await mkdir(resolve(output, "public"), { recursive: true });
const result = await Bun.build({
	entrypoints: [resolve(root, "src/main.ts")],
	target: "node",
	outdir: output,
	naming: "server.mjs",
});
if (!result.success)
	throw new AggregateError(result.logs, "PORTAL_BUILD_FAILED");
// Private owner executable: never part of the public or downloadable CLI package.
const collector = await Bun.build({
	entrypoints: [resolve(root, "../local-ai/worker-broker-collector.ts")],
	target: "node",
	outdir: output,
	naming: "local-ai-collector.mjs",
});
if (!collector.success)
	throw new AggregateError(collector.logs, "LOCAL_AI_COLLECTOR_BUILD_FAILED");
const cli = await Bun.build({
	entrypoints: [resolve(root, "src/cli.ts")],
	target: "node",
	outdir: output,
	naming: "cli.mjs",
});
if (!cli.success) throw new AggregateError(cli.logs, "PORTAL_CLI_BUILD_FAILED");
const mcp = await Bun.build({
	entrypoints: [resolve(root, "src/mcp-server.ts")],
	target: "node",
	outdir: output,
	naming: "mcp.mjs",
});
if (!mcp.success) throw new AggregateError(mcp.logs, "PORTAL_MCP_BUILD_FAILED");
const files = [
	"server.mjs",
	"public/index.html",
	"public/portal.css",
	"public/portal.mjs",
	"public/tokens.css",
];
for (const file of files.slice(1)) {
	const source =
		file === "public/tokens.css"
			? resolve(root, "../shared-web-ui/src/tokens.css")
			: resolve(root, file);
	await copyFile(source, resolve(output, file));
}
const artifacts = await Promise.all(
	[...files, "cli.mjs", "mcp.mjs"].map(async (path) => {
		const bytes = await readFile(resolve(output, path));
		return {
			path,
			bytes: bytes.length,
			sha256: createHash("sha256").update(bytes).digest("hex"),
		};
	}),
);
// Private style conditioning assets are never copied into public/. A build
// without imported canonical bytes remains usable with an explicit immutable
// asset root at runtime; it must not silently ship different exemplar bytes.
if (process.env["PORTAL_TRAINING_ASSET_ROOT"]) {
	const styles = await loadTrainingStyles();
	const profile = trainingStyleProfile("shared-target-drawing-v3");
	for (const [index, bytes] of styles.entries()) {
		const exemplar = profile.exemplars[index];
		if (!exemplar) throw new Error("TRAINING_STYLE_BYTES_MISMATCH");
		const path = `private/training/${profile.id}/${exemplar.path}`;
		await mkdir(dirname(resolve(output, path)), {
			recursive: true,
			mode: 0o700,
		});
		await writeFile(resolve(output, path), bytes, { mode: 0o600 });
		artifacts.push({
			path,
			bytes: bytes.length,
			sha256: createHash("sha256").update(bytes).digest("hex"),
		});
	}
}
const nativeFiles = await writeNativeMossPackage(
	process.env[nativeSourceKey]
		? resolve(process.env[nativeSourceKey] as string)
		: resolve(root, "native-moss"),
	output,
);
for (const { data: _, ...artifact } of nativeFiles) artifacts.push(artifact);
await writeFile(
	resolve(output, "release-manifest.json"),
	`${JSON.stringify({ schema: "portal-private-release.v1", runtime: "node>=24", publicFiles: files.slice(1), privateFiles: ["server.mjs", "cli.mjs", "mcp.mjs", ...nativeFiles.map((file) => file.path)], artifacts }, null, 2)}\n`,
);

// Restricted, source-free archives use only regular files and stored ZIP entries.
const releaseFiles = await Promise.all(
	artifacts.map(async (artifact) => ({
		...artifact,
		data: await readFile(resolve(output, artifact.path)),
	})),
);
const releasePackage = createReleasePackage(releaseFiles);
for (const archive of releasePackage.archives)
	await writeFile(resolve(output, archive.path), archive.data, { mode: 0o600 });
await writeFile(
	resolve(output, "ssstool-manifest.json"),
	releasePackage.manifest,
	{ mode: 0o600 },
);
await mkdir(resolve(output, "install"), { recursive: true });
for (const file of ["install.mjs", "ssstool.sh", "ssstool.cmd"])
	await copyFile(
		resolve(root, "install", file),
		resolve(output, "install", file),
	);
console.log(`PORTAL_BUILD_READY artifacts=${artifacts.length}`);
