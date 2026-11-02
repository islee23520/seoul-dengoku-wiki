import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { encodePng } from "../../portrait/acceptance/src/png.ts";

// Closed UI/server handoff fixture. This is not production readiness evidence.
export const nativeMossUIContract = {
	model: "native-moss:recovery16-provisional-v1",
	profileDigest:
		"1b340aab2d91ca70ed0a6d01cfaa84df1f8194d71e9c0900c6874e1fd844c8c6",
	adapterSHA256:
		"50dd8ab132a9d9c67e35e19bb7c1da6770658757df1c7b424d492999d200ca57",
	recipes: [
		"recovery16-native-token-v1",
		"recovery16-native-flow-source045-v1",
		"recovery16-native-flow-source025-v1",
	],
	modes: ["reference-img2img", "token-only"],
} as const;
export function nativeMossCapability(connected = true) {
	return {
		configured: true,
		...nativeMossUIContract,
		preserveOnly: true,
		provisional: true,
		styleStatus: "HOLD",
		generationEnabled: true,
		reason: null,
		connection: connected
			? {
					connectionId: "a336a831-17eb-4d7a-994e-8c6efc484ed6",
					state: "READY",
					expiresAt: 4102444800000,
					protocolVersion: "native-moss-ssh.v1",
					profileDigest: nativeMossUIContract.profileDigest,
				}
			: null,
	};
}

export async function nativeMossBrowserFixture(port = 0) {
	const png = encodePng({
		width: 2,
		height: 2,
		pixels: new Uint8Array([
			60, 70, 80, 255, 60, 70, 80, 255, 60, 70, 80, 255, 60, 70, 80, 255,
		]),
	});
	const imageHash = createHash("sha256").update(png).digest("hex");
	const state = { capability: "configured", connected: false, failure: false };
	const writes: { path: string; body: Record<string, unknown> }[] = [];
	const historicalRequest = {
		provider: "native-moss",
		providerModel: nativeMossUIContract.model,
		nativeRecipe: "recovery16-native-flow-source045-v1",
		inputMode: "reference-img2img",
	};
	const jobs: {
		job: Record<string, unknown> & { id: string };
		source: Record<string, unknown>;
		originalRequest: Record<string, unknown>;
		createdAt: string;
	}[] = [];
	function source(absent = false) {
		return {
			personId: "person-1003",
			characterId: "K1003",
			name: "Native UI fixture",
			detail: { id: "person-1003", name: "Native UI fixture" },
			token: {
				personId: "person-1003",
				characterId: "K1003",
				name: "Native UI fixture",
				image: { sha256: imageHash },
			},
			imageBase64: absent ? null : Buffer.from(png).toString("base64"),
			source: { kind: "live-wiki-http", sha256: "d".repeat(64) },
			sourceHashes: {
				detail: "a".repeat(64),
				token: "b".repeat(64),
				image: imageHash,
			},
			generationEligibility: { eligible: true },
			sourceAcquisition: {
				status: absent ? "intentional-absence" : "acquired",
				eligible: true,
			},
		};
	}
	jobs.push({
		job: {
			id: "e6bb7c76-5934-4a49-aa32-fd3590348c50",
			state: "FAILED",
			reviewStatus: "HOLD",
			imageUrl: null,
			providerModel: nativeMossUIContract.model,
		},
		source: source(),
		originalRequest: historicalRequest,
		createdAt: "2026-10-21T12:00:00Z",
	});
	function connections() {
		const native =
			state.capability === "missing"
				? undefined
				: {
						...nativeMossCapability(state.connected),
						...(state.capability === "offline"
							? { generationEnabled: false, reason: "NATIVE_SSH_NOT_READY" }
							: {}),
					};
		return {
			endpoints: [],
			connection: {
				connectionId: "fddbb28d-a40f-4c52-8efe-91fbb21c72fe",
				state: "READY",
				expiresAt: 4102444800000,
				endpointId: "local-openai",
			},
			provider: null,
			comfyui: {
				available: false,
				workflows: [],
				connection: null,
				readiness: null,
			},
			capabilities: native ? { nativeMoss: native } : {},
		};
	}
	const server = createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		const send = (body: unknown, status = 200) => {
			res.writeHead(status, { "content-type": "application/json" });
			res.end(JSON.stringify(body));
		};
		if (url.pathname === "/fixture/state") {
			state.capability = url.searchParams.get("capability") ?? state.capability;
			state.failure = url.searchParams.get("failure") === "true";
			if (url.searchParams.has("connected"))
				state.connected = url.searchParams.get("connected") === "true";
			return send({ state, writes });
		}
		if (url.pathname === "/fixture/writes") return send(writes);
		if (!url.pathname.startsWith("/tools/api/")) {
			const name =
				url.pathname === "/tools/"
					? "index.html"
					: url.pathname.split("/").at(-1);
			const paths: Record<string, string> = {
				"index.html": "../public/index.html",
				"portal.mjs": "../public/portal.mjs",
				"portal.css": "../public/portal.css",
				"tokens.css": "../../shared-web-ui/src/tokens.css",
			};
			if (!name || !paths[name]) return send({}, 404);
			res.writeHead(200, {
				"content-type": name.endsWith("css")
					? "text/css"
					: name.endsWith("mjs")
						? "text/javascript"
						: "text/html",
			});
			return res.end(await readFile(new URL(paths[name], import.meta.url)));
		}
		const path = url.pathname.replace("/tools/api", "");
		if (path === "/auth/session")
			return send({
				authenticated: true,
				mode: "local",
				csrfToken: "fixture",
				user: { id: "1", login: "fixture" },
			});
		if (path === "/status")
			return send({
				mode: "local",
				ready: true,
				generationReady: true,
				model: "gpt-image-2.5-sunburst",
				missingConfig: [],
			});
		if (path === "/connections" && req.method === "GET")
			return send(connections());
		if (path === "/characters") return send({ characters: [] });
		if (path === "/wiki/people")
			return send({
				people: [
					{
						personId: "person-1003",
						characterId: "K1003",
						name: "Native UI fixture",
						generationEligibility: { eligible: true },
					},
				],
				nextCursor: null,
				source: { kind: "live-wiki-http" },
			});
		if (path === "/wiki/people/person-1003")
			return send(source(url.searchParams.get("inputMode") === "token-only"));
		if (path === "/jobs/events") {
			res.writeHead(200, { "content-type": "text/event-stream" });
			res.write(": fixture\n\n");
			return;
		}
		if (path === "/jobs")
			return send({ history: jobs, lease: { admissionBlocked: false } });
		if (path.startsWith("/jobs/")) {
			const id = path.split("/")[2];
			const entry = jobs.find((row) => row.job.id === id);
			return entry
				? send({
						job: { ...entry.job, originalRequest: entry.originalRequest },
					})
				: send({ error: { code: "NOT_FOUND" } }, 404);
		}
		if (req.method === "POST") {
			let body = "";
			for await (const chunk of req) body += String(chunk);
			const data = JSON.parse(body);
			writes.push({ path, body: data });
			if (path === "/connections") {
				state.connected = true;
				return send(connections(), 201);
			}
			if (path === "/generations") {
				if (state.failure)
					return send({ error: { code: "NATIVE_SSH_NOT_READY" } }, 409);
				const job = {
					id: data.requestId,
					state: "HOLD",
					reviewStatus: "HOLD",
					imageUrl: null,
					providerModel: data.providerModel,
				};
				jobs.push({
					job,
					source: source(data.inputMode === "token-only"),
					originalRequest: data,
					createdAt: new Date().toISOString(),
				});
				return send({ job });
			}
		}
		return send({ error: { code: "NOT_FOUND" } }, 404);
	});
	await new Promise<void>((resolve) =>
		server.listen(port, "127.0.0.1", resolve),
	);
	const address = server.address();
	if (!address || typeof address === "string") throw Error("FIXTURE_ADDRESS");
	return {
		server,
		state,
		writes,
		url: `http://127.0.0.1:${address.port}/tools/`,
	};
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const portKey = "PORT";
	const fixture = await nativeMossBrowserFixture(
		Number(process.env[portKey] ?? 18988),
	);
	console.log(`NATIVE_UI_FIXTURE ${fixture.url}`);
}
