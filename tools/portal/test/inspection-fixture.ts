import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { hash } from "../src/sources.ts";

export async function inspectionFixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "task8-inspection-")),
	);
	const image = encodePng({
		width: 1024,
		height: 1536,
		pixels: new Uint8Array(1024 * 1536 * 4),
	});
	const fixture = createTransportFixture();
	const look = JSON.parse(Buffer.from(fixture.candidate.lookBytes).toString());
	const detail = Buffer.from(
		JSON.stringify({
			id: "person-test",
			name: look.name,
			detailRoute: "/people/person-test",
			familyTree: { personId: look.characterId },
		}),
	);
	const token = Buffer.from(
		JSON.stringify({
			...look,
			personId: "person-test",
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	const events = new EventEmitter();
	const outbound: { requestId: string; bytes: number; sha256: string }[] = [];
	const provider = createServer(async (req, res) => {
		if (req.url !== "/v1/images/edits") {
			res.writeHead(404).end();
			return;
		}
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const bytes = Buffer.concat(chunks);
		outbound.push({
			requestId: payload?.requestId ?? "",
			bytes: bytes.length,
			sha256: hash(bytes),
		});
		events.emit("started");
		// Keep the controlled response open until the staging process is interrupted.
	});
	const ready = once(provider, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	provider.listen(0, "127.0.0.1");
	await ready;
	const address = provider.address();
	if (!address || typeof address === "string") throw Error("FIXTURE_ADDRESS");
	const providerUrl = `http://127.0.0.1:${address.port}/v1`;
	const wikiUrl = `http://127.0.0.1:${address.port}/wiki/`;
	let child: ReturnType<typeof spawn> | null = null;
	let origin = "";
	let headers: Record<string, string> = {};
	let payload: {
		requestId: string;
		connectionId: string;
		sheetId: string;
		providerModel: string;
		size?: string;
		faceMode: { kind: string; variantId: null };
	} | null = null;
	const lifecycle: object[] = [];
	const imports = {
		server: fileURLToPath(new URL("../src/server.ts", import.meta.url)),
		config: fileURLToPath(new URL("../src/config.ts", import.meta.url)),
		fixture: fileURLToPath(
			new URL(
				"../../portrait/generator/test/transport-fixture.ts",
				import.meta.url,
			),
		),
		png: fileURLToPath(
			new URL(
				"../../portrait/acceptance/src/png.ts",
				import.meta.url,
			),
		),
		sources: fileURLToPath(new URL("../src/sources.ts", import.meta.url)),
	};
	async function start() {
		const code = `
import {createPortal} from ${JSON.stringify(imports.server)};
import {loadConfig} from ${JSON.stringify(imports.config)};
import {createTransportFixture} from ${JSON.stringify(imports.fixture)};
import {encodePng} from ${JSON.stringify(imports.png)};
import {hash} from ${JSON.stringify(imports.sources)};
const fixture=createTransportFixture();
const image=encodePng({width:1024,height:1536,pixels:new Uint8Array(1024*1536*4)});
const refs=fixture.candidate.referenceImages.map(r=>({...r,bytes:image,...(r.role==='recipient-appearance-only'?{sourceHash:hash(image)}:{})}));
const template={candidate:{...fixture.candidate,referenceImages:refs},operatorPins:{...fixture.operatorPins,referenceImages:refs.map(r=>({id:r.id,sha256:hash(image)}))}};
const app=await createPortal(loadConfig({PORTAL_MODE:'local',PORTAL_PORT:'0',PORTAL_STORAGE_PATH:${JSON.stringify(join(root, "storage"))},PORTAL_PUBLIC_PATH:${JSON.stringify(fileURLToPath(new URL("../public", import.meta.url)))},PORTAL_TOKENS_PATH:${JSON.stringify(fileURLToPath(new URL("../../shared-web-ui/src/tokens.css", import.meta.url)))},WIKI_BASE_URL:${JSON.stringify(wikiUrl)}}),{template});
const a=await app.listen(); console.log('READY '+a.port);
process.once('SIGTERM',()=>void app.close());
`;
		child = spawn("bun", ["--eval", code], {
			stdio: ["ignore", "pipe", "pipe"],
		});
		const signals = new EventEmitter();
		const announced = once(signals, "ready", {
			signal: AbortSignal.timeout(10000),
		});
		let stdout = "",
			stderr = "";
		child.stdout?.on("data", (chunk) => {
			stdout += String(chunk);
			const match = stdout.match(/READY (\d+)/);
			if (match) signals.emit("ready", Number(match[1]));
		});
		child.stderr?.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.once("exit", (code, signal) =>
			signals.emit("ready", { code, signal, stderr }),
		);
		const [port] = await announced;
		if (typeof port !== "number") throw Error(JSON.stringify(port));
		origin = `http://127.0.0.1:${port}`;
		lifecycle.push({ event: "ready", pid: child.pid, origin });
		const sessionResponse = await fetch(`${origin}/tools/api/auth/session`);
		const session = z
			.object({ csrfToken: z.string() })
			.parse(await sessionResponse.json());
		headers = {
			cookie: sessionResponse.headers.get("set-cookie")?.split(";")[0] ?? "",
			origin,
			"content-type": "application/json",
			"x-csrf-token": session.csrfToken,
		};
	}
	async function request(path: string, input?: unknown) {
		return fetch(`${origin}/tools/api${path}`, {
			headers,
			...(input === undefined
				? {}
				: { method: "POST", body: JSON.stringify(input) }),
			signal: AbortSignal.timeout(10000),
		});
	}
	await start();
	return {
		root,
		events,
		outbound,
		lifecycle,
		get origin() {
			return origin;
		},
		get payload() {
			return payload;
		},
		get headers() {
			return headers;
		},
		inputHashes: {
			detail: hash(detail),
			token: hash(token),
			image: hash(image),
		},
		request,
		interrupt: async (size?: "340x510") => {
			const connection = z
				.object({ connection: z.object({ connectionId: z.uuid() }) })
				.parse(
					await (
						await request("/connections", {
							baseUrl: providerUrl,
							apiKey: "task8-controlled-private-key",
						})
					).json(),
				);
			const sheet = z.object({ sheetId: z.uuid() }).parse(
				await (
					await request("/sheets", {
						detailBase64: detail.toString("base64"),
						tokenBase64: token.toString("base64"),
						imageBase64: Buffer.from(image).toString("base64"),
					})
				).json(),
			);
			payload = {
				requestId: randomUUID(),
				connectionId: connection.connection.connectionId,
				sheetId: sheet.sheetId,
				providerModel: "gpt-image-2.5-sunburst",
				...(size === undefined ? {} : { size }),
				faceMode: { kind: "unique", variantId: null },
			};
			const started = once(events, "started", {
				signal: AbortSignal.timeout(10000),
			});
			const pending = request("/generations", payload).then(
				() => "response",
				(error: unknown) => (error instanceof Error ? error.name : "failure"),
			);
			await started;
			lifecycle.push({
				event: "controlled-request-start",
				calls: outbound.length,
			});
			if (!child) throw Error("FIXTURE_CHILD");
			const exited = once(child, "exit", {
				signal: AbortSignal.timeout(10000),
			});
			child.kill("SIGKILL");
			const exit = await exited;
			lifecycle.push({ event: "exit", code: exit[0], signal: exit[1] });
			await pending;
			child = null;
			provider.closeAllConnections();
			await start();
			return payload;
		},
		state: async () => {
			if (!payload) throw Error("FIXTURE_PAYLOAD");
			const path = join(
				root,
				"storage",
				"1",
				"jobs",
				payload.requestId,
				"job.json",
			);
			return { bytes: await readFile(path), path };
		},
		close: async () => {
			if (child) {
				const exited = once(child, "exit", {
					signal: AbortSignal.timeout(10000),
				});
				child.kill("SIGTERM");
				lifecycle.push({ event: "cleanup-exit", exit: await exited });
			}
			provider.closeAllConnections();
			await new Promise<void>((resolve) => provider.close(() => resolve()));
			await rm(root, { recursive: true, force: true });
		},
	};
}
