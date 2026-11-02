import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, mkdir, open, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export const ownerOrigin = "https://sss.linalab.io";
export class RemoteClientError extends Error {
	readonly name = "RemoteClientError";
	constructor(
		readonly code: string,
		readonly status?: number,
		readonly requestId?: string,
	) {
		super(code);
	}
}
export function remoteServer(serverUrl: string, local = false) {
	let server: URL;
	try {
		server = new URL(serverUrl);
	} catch {
		throw new RemoteClientError("INVALID_SERVER_URL");
	}
	const loopback =
		local &&
		/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):[1-9][0-9]{0,4}\/[a-z0-9/-]+\/?$/.test(
			serverUrl,
		) &&
		serverUrl === server.href &&
		server.port !== "" &&
		!server.pathname.includes("..") &&
		!server.pathname.includes("//");
	if (
		(!loopback && server.origin !== ownerOrigin) ||
		server.username ||
		server.password ||
		server.search ||
		server.hash ||
		(!loopback && !["/tools", "/tools/"].includes(server.pathname))
	)
		throw new RemoteClientError("INVALID_SERVER_URL");
	return server;
}
const connectionSchema = z.object({
	connectionId: z.uuid(),
	state: z.string(),
});
const sessionSchema = z.object({
	authenticated: z.literal(true),
	csrfToken: z.string().min(1),
});
const storedSessionSchema = z.strictObject({
	server: z.string(),
	cookie: z.string().regex(/^portal_session=[^;\r\n]+$/),
	csrfToken: z.string().min(1),
	connection: connectionSchema.nullable(),
});
export type RemoteSession = z.infer<typeof storedSessionSchema>;
const journalSchema = z.strictObject({
	schema: z.literal("ssstool-mutation.v1"),
	server: z.string(),
	requestId: z.uuid(),
	method: z.enum(["POST", "DELETE", "PUT", "PATCH"]),
	path: z.string(),
	payload: z.string(),
	payloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type MutationJournal = z.infer<typeof journalSchema>;
type ArtifactBinding = {
	readonly mime: string;
	readonly bytes: number;
	readonly sha256: string;
};
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value)
				.sort(([a], [b]) => a.localeCompare(b, "en"))
				.map(([key, item]) => [key, canonical(item)]),
		);
	return value;
}
async function privateRead(path: string): Promise<string> {
	const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		const stat = await file.stat();
		if (!stat.isFile() || (stat.mode & 0o777) !== 0o600)
			throw new RemoteClientError("PRIVATE_STATE_REQUIRED");
		return await file.readFile("utf8");
	} finally {
		await file.close();
	}
}
async function publish(path: string, bytes: string, exclusive = false) {
	const temporary = `${path}.${randomUUID()}.tmp`;
	try {
		const file = await open(temporary, "wx", 0o600);
		try {
			await file.writeFile(bytes);
			await file.sync();
		} finally {
			await file.close();
		}
		if (exclusive) await link(temporary, path);
		else await rename(temporary, path);
	} finally {
		await rm(temporary, { force: true });
	}
}
export async function cloudflareOwnerToken(
	serverUrl: string,
	signal?: AbortSignal,
) {
	const server = remoteServer(serverUrl);
	const child = spawn(
		"cloudflared",
		["access", "token", "--app", server.href],
		{
			stdio: ["ignore", "pipe", "pipe"],
			signal: AbortSignal.any([
				...(signal ? [signal] : []),
				AbortSignal.timeout(5000),
			]),
		},
	);
	return await new Promise<string>((done, reject) => {
		let token = "";
		child.stdout.on("data", (chunk) => {
			token += String(chunk);
		});
		child.on("error", () => reject(new RemoteClientError("AUTH_REQUIRED")));
		child.on("close", (code) => {
			const assertion = token.trim();
			if (code !== 0 || !assertion || /[\r\n]/.test(assertion))
				reject(new RemoteClientError("AUTH_REQUIRED"));
			else done(assertion);
		});
	});
}
export function createRemoteClient(options: {
	serverUrl: string;
	local?: boolean;
	stateDirectory?: string;
	accessToken?: (signal?: AbortSignal) => Promise<string>;
	fetch?: (
		input: string | URL | Request,
		init?: RequestInit,
	) => Promise<Response>;
	timeoutMs?: number;
}) {
	const server = remoteServer(options.serverUrl, options.local);
	const local = server.protocol === "http:";
	const stateDirectory = options.stateDirectory ?? join(homedir(), ".ssstool");
	const sessionPath = join(stateDirectory, "session.json");
	const journalDirectory = join(stateDirectory, "journal");
	const transport = options.fetch ?? fetch;
	let session: RemoteSession | null = null;
	let assertion = "";
	async function storage() {
		for (const path of [stateDirectory, journalDirectory]) {
			await mkdir(path, { recursive: true, mode: 0o700 });
			const directory = await open(
				path,
				constants.O_RDONLY | constants.O_NOFOLLOW,
			);
			try {
				const stat = await directory.stat();
				if (!stat.isDirectory() || (stat.mode & 0o077) !== 0)
					throw new RemoteClientError("PRIVATE_STATE_REQUIRED");
			} finally {
				await directory.close();
			}
		}
	}
	async function syncDirectory(path: string) {
		const directory = await open(
			path,
			constants.O_RDONLY | constants.O_NOFOLLOW,
		);
		try {
			await directory.sync();
		} finally {
			await directory.close();
		}
	}
	function target(path: string) {
		const url = new URL(`${server.pathname.replace(/\/$/, "")}${path}`, server);
		if (
			!path.startsWith("/api/") ||
			url.origin !== server.origin ||
			!url.pathname.startsWith(`${server.pathname.replace(/\/$/, "")}/api/`) ||
			url.hash
		)
			throw new RemoteClientError("INVALID_PARAMS");
		return url;
	}
	async function request(
		path: string,
		method = "GET",
		payload?: string,
		signal?: AbortSignal,
		binary: boolean | ArtifactBinding = false,
	) {
		const headers: Record<string, string> = {
			...(!local ? { "cf-access-token": assertion } : {}),
			origin: server.origin,
		};
		if (session) {
			const cookieKey = "cookie";
			headers[cookieKey] = session.cookie;
			headers["x-csrf-token"] = session.csrfToken;
		}
		if (payload !== undefined) headers["content-type"] = "application/json";
		try {
			const response = await transport(target(path), {
				method,
				redirect: "manual",
				headers,
				...(payload === undefined ? {} : { body: payload }),
				signal: AbortSignal.any([
					...(signal ? [signal] : []),
					AbortSignal.timeout(options.timeoutMs ?? 5000),
				]),
			});
			if (
				(response.status >= 300 && response.status < 400) ||
				response.status === 401
			)
				throw new RemoteClientError("AUTH_REQUIRED", response.status);
			if (binary && response.ok) {
				const binding = typeof binary === "object" ? binary : null;
				if (
					response.headers.get("content-type")?.split(";")[0] !==
						(binding?.mime ?? "image/png") ||
					(binding &&
						(response.headers.get("content-length") !== String(binding.bytes) ||
							response.headers.get("x-content-sha256") !== binding.sha256))
				)
					throw new RemoteClientError("INVALID_RESPONSE");
				const chunks: Uint8Array[] = [];
				let size = 0;
				if (!response.body) throw new RemoteClientError("INVALID_RESPONSE");
				for await (const chunk of response.body) {
					size += chunk.length;
					if (size > (binding?.bytes ?? 67108864))
						throw new RemoteClientError("INVALID_RESPONSE");
					chunks.push(chunk);
				}
				const body = Buffer.concat(chunks);
				if (
					binding &&
					(size !== binding.bytes ||
						createHash("sha256").update(body).digest("hex") !== binding.sha256)
				)
					throw new RemoteClientError("RESULT_HASH_MISMATCH");
				return { response, body };
			}
			const body: unknown = await response.json();
			if (!response.ok) {
				const parsed = z
					.object({
						error: z.object({ code: z.string().regex(/^[A-Z][A-Z0-9_]*$/) }),
					})
					.safeParse(body);
				const code = parsed.success
					? parsed.data.error.code
					: "HTTP_STATUS_FAILED";
				throw new RemoteClientError(
					[
						"ACCESS_REQUIRED",
						"AUTHENTICATION_REQUIRED",
						"AUTH_EXPIRED",
					].includes(code)
						? "AUTH_REQUIRED"
						: code,
					response.status,
				);
			}
			return { response, body };
		} catch (error) {
			if (error instanceof RemoteClientError) throw error;
			throw new RemoteClientError(
				signal?.aborted ? "REQUEST_ABORTED" : "REMOTE_REQUEST_FAILED",
			);
		}
	}
	async function bootstrap(signal?: AbortSignal): Promise<RemoteSession> {
		await storage();
		session = null;
		assertion = local
			? ""
			: await (
					options.accessToken ?? ((s) => cloudflareOwnerToken(server.href, s))
				)(signal);
		if (!local && (!assertion || /[\r\n]/.test(assertion)))
			throw new RemoteClientError("AUTH_REQUIRED");
		const result = await request("/api/auth/session", "GET", undefined, signal);
		const auth = sessionSchema.parse(result.body);
		const cookie = result.response.headers
			.getSetCookie()
			.find((value) => value.startsWith("portal_session="))
			?.split(";")[0];
		if (!cookie) throw new RemoteClientError("INVALID_RESPONSE");
		session = storedSessionSchema.parse({
			server: server.href,
			cookie,
			csrfToken: auth.csrfToken,
			connection: null,
		});
		try {
			const connections = z
				.object({ connection: connectionSchema.nullable() })
				.parse(
					(await request("/api/connections", "GET", undefined, signal)).body,
				);
			session.connection = connections.connection;
			await publish(sessionPath, JSON.stringify(session));
			await syncDirectory(stateDirectory);
			return session;
		} catch (error) {
			session = null;
			throw error;
		}
	}
	async function restore(signal?: AbortSignal) {
		if (session) return;
		await storage();
		try {
			const stored = storedSessionSchema.parse(
				JSON.parse(await privateRead(sessionPath)),
			);
			if (stored.server !== server.href)
				throw new RemoteClientError("INVALID_SERVER_URL");
			assertion = local
				? ""
				: await (
						options.accessToken ?? ((s) => cloudflareOwnerToken(server.href, s))
					)(signal);
			if (!local && (!assertion || /[\r\n]/.test(assertion)))
				throw new RemoteClientError("AUTH_REQUIRED");
			session = stored;
		} catch (error) {
			if (
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "ENOENT"
			)
				throw error;
		}
	}
	async function read(
		path: string,
		signal?: AbortSignal,
		binary: boolean | ArtifactBinding = false,
	): Promise<unknown> {
		target(path);
		await restore(signal);
		if (!session) await bootstrap(signal);
		try {
			return (await request(path, "GET", undefined, signal, binary)).body;
		} catch (error) {
			if (
				!(error instanceof RemoteClientError) ||
				error.code !== "AUTH_REQUIRED"
			)
				throw error;
			await bootstrap(signal);
			return (await request(path, "GET", undefined, signal, binary)).body;
		}
	}
	async function journal(requestId: string): Promise<MutationJournal> {
		const id = z.uuid().parse(requestId);
		const record = journalSchema.parse(
			JSON.parse(await privateRead(join(journalDirectory, `${id}.json`))),
		);
		if (
			record.requestId !== id ||
			record.server !== server.href ||
			record.payloadSha256 !==
				createHash("sha256").update(record.payload).digest("hex")
		)
			throw new RemoteClientError("INVALID_JOURNAL");
		return record;
	}
	async function mutate(
		path: string,
		input: Record<string, unknown>,
		signal?: AbortSignal,
		method: MutationJournal["method"] = "POST",
		includeRequestId = true,
	): Promise<unknown> {
		target(path);
		const requestIdKey = "requestId";
		const requestId = z.uuid().parse(input[requestIdKey] ?? randomUUID());
		const { requestId: _requestId, ...fields } = input;
		const payload = JSON.stringify(
			canonical(includeRequestId ? { ...fields, requestId } : fields),
		);
		if (Buffer.byteLength(payload) > 12582912)
			throw new RemoteClientError("INVALID_PARAMS");
		const record: MutationJournal = {
			schema: "ssstool-mutation.v1",
			server: server.href,
			requestId,
			method,
			path,
			payload,
			payloadSha256: createHash("sha256").update(payload).digest("hex"),
		};
		await storage();
		try {
			const prior = await journal(requestId);
			if (JSON.stringify(prior) !== JSON.stringify(record))
				throw new RemoteClientError("REQUEST_CONFLICT", 409, requestId);
			throw new RemoteClientError(
				"MUTATION_ALREADY_DISPATCHED",
				409,
				requestId,
			);
		} catch (error) {
			if (
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "ENOENT"
			)
				throw error;
		}
		await restore(signal);
		if (!session) await bootstrap(signal);
		try {
			await publish(
				join(journalDirectory, `${requestId}.json`),
				JSON.stringify(record),
				true,
			);
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				error.code === "EEXIST"
			) {
				const prior = await journal(requestId);
				throw new RemoteClientError(
					prior.payload === payload &&
						prior.path === path &&
						prior.method === method
						? "MUTATION_ALREADY_DISPATCHED"
						: "REQUEST_CONFLICT",
					409,
					requestId,
				);
			}
			throw error;
		}
		await syncDirectory(journalDirectory);
		try {
			return (await request(path, method, payload, signal)).body;
		} catch (error) {
			if (error instanceof RemoteClientError)
				throw new RemoteClientError(error.code, error.status, requestId);
			throw error;
		}
	}
	async function logout(signal?: AbortSignal) {
		try {
			await restore(signal);
			if (session) await request("/api/auth/logout", "POST", "{}", signal);
		} finally {
			session = null;
			assertion = "";
			await rm(sessionPath, { force: true });
		}
	}
	return { bootstrap, read, mutate, journal, logout };
}
