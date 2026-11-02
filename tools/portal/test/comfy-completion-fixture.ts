import { cp, mkdir, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { createAuth } from "../src/auth.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	comfyCompletionRequestSchema,
} from "../src/comfyui-provider.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { finishingProof } from "./comfyui-finishing-fixture.ts";

// Explicit local proof run: copies original retained evidence, never mutates it.
// No endpoint can submit, upload or generate. Fixtures are actual observed bytes.
export async function completionFixture(
	options: {
		directory?: string;
		checkpoint?: (point: "before-commit" | "after-commit") => Promise<void>;
		beforeAssetMeasurement?: () => void;
		readResponse?: (url: string, signal: AbortSignal) => Response | undefined;
	} = {},
) {
	const evidence = process.env["COMFY_COMPLETION_EVIDENCE"];
	const retained = process.env["COMFY_COMPLETION_RETAINED"];
	if (!evidence || !retained)
		throw Error("COMFY_COMPLETION_FIXTURE_PATHS_REQUIRED");
	const directory =
		options.directory ??
		(await realpath(
			await mkdtemp(
				join(process.env["RUN_TMP"] ?? tmpdir(), "comfy-completion-"),
			),
		));
	const ownerRoot = join(directory, "storage", "1"),
		id = basename(retained),
		dir = join(ownerRoot, "jobs", id);
	if (!options.directory) {
		await mkdir(join(ownerRoot, "jobs"), { recursive: true });
		await cp(retained, dir, {
			recursive: true,
			errorOnExist: true,
			force: false,
		});
	}
	const wire = JSON.parse(
		await readFile(
			join(evidence, "comfy-completion-native-history-wire.json"),
			"utf8",
		),
	);
	const historyBytes = Buffer.from(wire.bodyBase64, "base64");
	if (
		wire.encoding !== "base64" ||
		historyBytes.toString("base64") !== wire.bodyBase64 ||
		historyBytes.length !== wire.bytes ||
		hash(historyBytes) !== wire.sha256
	)
		throw Error("FIXTURE_HISTORY_WIRE_MISMATCH");
	const history = JSON.parse(historyBytes.toString());
	const promptId = Object.keys(history)[0];
	if (!promptId) throw Error("FIXTURE_HISTORY_MISSING");
	const entry = history[promptId];
	const clientId = entry.prompt[2]["9"].inputs.filename_prefix.slice(
		"portal_".length,
		-"_finished".length,
	);
	const images: Record<string, Buffer> = {};
	for (const node of ["9", "11", "15", "16"])
		images[node] = await readFile(
			join(evidence, `task-9-source025-node${node}.png`),
		);
	const request = comfyCompletionRequestSchema.parse({
		schema: "comfy-completion-recovery.v1",
		jobSHA256: hash(await readFile(join(dir, "job.json"))),
		promptId,
		clientId,
		historySHA256: hash(historyBytes),
		outputSHA256: Object.fromEntries(
			Object.entries(images).map(([node, bytes]) => [node, hash(bytes)]),
		),
	});
	const state = {
		historyBytes,
		upload: await readFile(join(dir, "reference-conditioning.png")),
		images,
		calls: [] as string[],
		externalGeneration: 0,
	};
	const config = loadConfig({
		PORTAL_MODE: "local",
		PORTAL_PORT: "0",
		PORTAL_STORAGE_PATH: join(directory, "storage"),
		PORTAL_COMFYUI: "true",
	});
	const create = () =>
		createPortal(config, {
			template: createTransportFixture(),
			comfyTransport: {
				webSocket() {
					throw Error("UNEXPECTED_SOCKET");
				},
				async fetch(url, init) {
					init.signal?.throwIfAborted();
					state.calls.push(`${init.method ?? "GET"} ${url}`);
					if (
						!url.startsWith(COMFY_ENDPOINT) ||
						(init.method ?? "GET") !== "GET"
					) {
						state.externalGeneration++;
						throw Error("UNEXPECTED_GENERATION");
					}
					if (init.signal) {
						const response = options.readResponse?.(url, init.signal);
						if (response) return response;
					}
					const parsed = new URL(url);
					if (parsed.pathname === `/history/${promptId}`)
						return new Response(state.historyBytes);
					if (
						parsed.pathname === "/view" &&
						parsed.searchParams.get("type") === "input"
					)
						return new Response(state.upload);
					if (parsed.pathname === "/view") {
						const node = ["9", "11", "15", "16"].find(
							(node) =>
								entry.outputs[node].images[0].filename ===
								parsed.searchParams.get("filename"),
						);
						if (node) return new Response(state.images[node]);
					}
					throw Error("UNEXPECTED_READ");
				},
			},
			comfyMeasureAssets: async (workflow) => {
				options.beforeAssetMeasurement?.();
				return verifyMossAssetProof(
					{
						schema: "moss-runtime-file-sha256.v1",
						method: "server-file-stream-sha256",
						assets: mossWorkflowAssets(workflow ?? "").map(
							({ path: _path, ...asset }) => asset,
						),
					},
					workflow,
				);
			},
			comfyMeasureFinishing: async () => finishingProof(),
			...(options.checkpoint
				? { comfyCompletionCheckpoint: options.checkpoint }
				: {}),
		});
	let app = await create();
	let origin = `http://127.0.0.1:${(await app.listen()).port}`;
	const auth = createAuth(config);
	function headers(owner = "1") {
		const token = auth.issue({ id: owner, login: `owner-${owner}` }),
			session = auth.verify(token);
		if (!session) throw Error("SESSION");
		return {
			cookie: `portal_session=${token}`,
			origin,
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
	}
	return {
		id,
		dir,
		directory,
		request,
		state,
		headers,
		get app() {
			return app;
		},
		get origin() {
			return origin;
		},
		post: (value: unknown = request, h = headers()) =>
			fetch(`${origin}/tools/api/v1/jobs/${id}/comfy-completions`, {
				method: "POST",
				headers: h,
				body: JSON.stringify(value),
			}),
		get: (path: string) =>
			fetch(`${origin}/tools/api${path}`, { headers: headers() }),
		restart: async () => {
			await app.close();
			app = await create();
			origin = `http://127.0.0.1:${(await app.listen()).port}`;
		},
		close: async () => {
			await app.close();
			await rm(directory, { recursive: true, force: true });
		},
	};
}
