import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import os, { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { z } from "zod";
import { personalAccessConfig } from "./access.ts";
import { localConnectSchema } from "./connections.ts";

const endpointSchema = z.strictObject({
	endpointId: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
	revision: z.string().min(1).max(128),
	protocolVersion: z.literal("2025-11-25"),
	toolName: z.literal("portrait_image_edit_v1"),
	toolSchemaDigest: z.string().regex(/^[a-f0-9]{64}$/),
	endpoint: z
		.string()
		.max(2048)
		.refine((value) => {
			try {
				const url = new URL(value);
				return (
					url.href === value &&
					url.protocol === "https:" &&
					isIP(url.hostname) === 0 &&
					!url.username &&
					!url.password &&
					!url.search &&
					!url.hash
				);
			} catch {
				return false;
			}
		}),
	origin: z
		.string()
		.max(2048)
		.refine((value) => {
			try {
				const url = new URL(value);
				return url.origin === value && url.protocol === "https:";
			} catch {
				return false;
			}
		}),
	egress: z.strictObject({
		kind: z.literal("public"),
		address: z.string().refine((value) => {
			if (isIP(value) !== 4) return false;
			const [a = 0, b = 0] = value.split(".").map(Number);
			return !(
				a === 0 ||
				a === 10 ||
				a === 127 ||
				a >= 224 ||
				(a === 100 && b >= 64 && b <= 127) ||
				(a === 169 && b === 254) ||
				(a === 172 && b >= 16 && b <= 31) ||
				(a === 192 && (b === 0 || b === 168 || b === 88)) ||
				(a === 198 && (b === 18 || b === 19 || b === 51)) ||
				(a === 203 && b === 0)
			);
		}),
	}),
});

type Environment = Record<string, string | undefined> & {
	PORTAL_MODE?: string | undefined;
	PORTAL_LOCAL_AI_CATALOG?: string | undefined;
	WIKI_BASE_URL?: string | undefined;
	PORTAL_PUBLIC_URL?: string | undefined;
	PORTAL_BASE_PATH?: string | undefined;
	GITHUB_OAUTH_CALLBACK_URL?: string | undefined;
	PORTAL_SESSION_SECRET?: string | undefined;
	PORTAL_MCP_ENDPOINTS?: string | undefined;
	PORTAL_PORT?: string | undefined;
	PORTAL_MAX_STORAGE_BYTES?: string | undefined;
	GITHUB_OAUTH_CLIENT_ID?: string | undefined;
	GITHUB_OAUTH_CLIENT_SECRET?: string | undefined;
	PORTAL_STORAGE_PATH?: string | undefined;
	PORTAL_ORIGINALS_DB?: string | undefined;
	PORTAL_ACCESS_JWKS_FILE?: string | undefined;
	PORTAL_TEMPLATE_MANIFEST?: string | undefined;
	PORTAL_TEMPLATE_PINS?: string | undefined;
	PORTAL_HOST?: string | undefined;
	PORTAL_NETWORK_ACCESS?: string | undefined;
	PORTAL_LOCAL_HOSTNAME?: string | undefined;
	PORTAL_MDNS?: string | undefined;
	PORTAL_PUBLIC_PATH?: string | undefined;
	PORTAL_TOKENS_PATH?: string | undefined;
	PORTAL_PERSONAL_PROVIDER_URL?: string | undefined;
	PORTAL_PERSONAL_PROVIDER_KEY?: string | undefined;
	PORTAL_COMFYUI?: string | undefined;
	PORTAL_NATIVE_MOSS?: string | undefined;
};
export type Config = ReturnType<typeof loadConfig>;
type Interfaces = Record<
	string,
	readonly { address: string; family: string; internal: boolean }[] | undefined
>;
export function validateLocalBinding(
	config: { mode: string; host: string; networkAccess: boolean; mdns: boolean },
	interfaces?: Interfaces,
) {
	if (config.mode !== "local") return null;
	if (!config.networkAccess) {
		if (config.host !== "127.0.0.1") throw Error("INVALID_LOCAL_HOST");
		return null;
	}
	// Only opt-in local network binding requires interface-ownership discovery.
	// Restricted personal/loopback workloads can listen without enumerating it.
	interfaces ??= os.networkInterfaces();
	const [a, b] = config.host.split(".").map(Number);
	const lan =
		a === 10 ||
		(a === 172 && b !== undefined && b >= 16 && b <= 31) ||
		(a === 192 && b === 168);
	const tailnet = a === 100 && b !== undefined && b >= 64 && b <= 127;
	const owned = Object.entries(interfaces).find(([, addresses]) =>
		addresses?.some(
			(address) =>
				address.family === "IPv4" &&
				!address.internal &&
				address.address === config.host,
		),
	);
	if (isIP(config.host) !== 4 || (!lan && !tailnet) || !owned)
		throw Error("INVALID_LOCAL_HOST");
	if (config.mdns && !lan) throw Error("INVALID_MDNS_CONFIG");
	return owned[0];
}
export function loadConfig(
	env: Environment = process.env,
	interfaces?: Interfaces,
) {
	const mode = env.PORTAL_MODE ?? (env.PORTAL_PUBLIC_URL ? "hosted" : "local");
	if (mode !== "local" && mode !== "hosted" && mode !== "personal")
		throw Error("INVALID_MODE");
	const local = mode === "local";
	const personal = mode === "personal";
	let personalProvider: z.infer<typeof localConnectSchema> | null = null;
	if (
		personal &&
		(env.PORTAL_PERSONAL_PROVIDER_URL !== undefined ||
			env.PORTAL_PERSONAL_PROVIDER_KEY !== undefined)
	) {
		const parsed = localConnectSchema.safeParse({
			baseUrl: env.PORTAL_PERSONAL_PROVIDER_URL,
			apiKey: env.PORTAL_PERSONAL_PROVIDER_KEY,
		});
		if (!parsed.success) throw Error("INVALID_PERSONAL_PROVIDER_CONFIG");
		personalProvider = parsed.data;
	}
	// ComfyUI is an explicit opt-in for the owner's own local/personal workload.
	// The destination is a reviewed constant in the server; hosted/MCP
	// deployments never offer it and the browser never supplies it.
	if (
		env.PORTAL_COMFYUI !== undefined &&
		env.PORTAL_COMFYUI !== "true" &&
		env.PORTAL_COMFYUI !== "false"
	)
		throw Error("INVALID_COMFYUI_CONFIG");
	const comfyui = env.PORTAL_COMFYUI === "true";
	if (comfyui && !local && !personal) throw Error("INVALID_COMFYUI_CONFIG");
	if (
		env.PORTAL_NATIVE_MOSS !== undefined &&
		env.PORTAL_NATIVE_MOSS !== "true" &&
		env.PORTAL_NATIVE_MOSS !== "false"
	)
		throw Error("INVALID_NATIVE_MOSS_CONFIG");
	const nativeMoss = env.PORTAL_NATIVE_MOSS === "true";
	if (nativeMoss && !local && !personal)
		throw Error("INVALID_NATIVE_MOSS_CONFIG");
	const access = personal
		? personalAccessConfig(env)
		: {
				missing: [],
				ownerEmail: "",
				accessIssuer: "",
				accessAudience: "",
				accessJwksFile: "",
			};
	if (
		personal &&
		env.PORTAL_STORAGE_PATH &&
		!isAbsolute(env.PORTAL_STORAGE_PATH)
	)
		throw Error("INVALID_STORAGE_PATH");
	const port = Number(env.PORTAL_PORT ?? (local ? 18765 : 8132));
	if (!Number.isInteger(port) || port < 0 || port > 65535)
		throw Error("INVALID_PORT");
	const host = env.PORTAL_HOST ?? "127.0.0.1";
	if (host === "0.0.0.0" && !personal) throw Error("INVALID_LOCAL_HOST");
	for (const [value, code] of [
		[env.PORTAL_NETWORK_ACCESS, "INVALID_NETWORK_ACCESS"],
		[env.PORTAL_MDNS, "INVALID_MDNS_CONFIG"],
	])
		if (value !== undefined && value !== "true" && value !== "false")
			throw Error(code);
	const networkAccess = env.PORTAL_NETWORK_ACCESS === "true";
	const mdns = env.PORTAL_MDNS === "true";
	const localHostname = env.PORTAL_LOCAL_HOSTNAME ?? null;
	if (
		localHostname !== null &&
		!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.local$/.test(localHostname)
	)
		throw Error("INVALID_LOCAL_HOSTNAME");
	if ((networkAccess || mdns || localHostname) && !local)
		throw Error("INVALID_NETWORK_ACCESS");
	if (localHostname && !networkAccess) throw Error("INVALID_LOCAL_HOSTNAME");
	if (mdns && (!networkAccess || !localHostname))
		throw Error("INVALID_MDNS_CONFIG");
	validateLocalBinding({ mode, host, networkAccess, mdns }, interfaces);
	const required = [
		"PORTAL_PUBLIC_URL",
		"PORTAL_SESSION_SECRET",
		"GITHUB_OAUTH_CLIENT_ID",
		"GITHUB_OAUTH_CLIENT_SECRET",
		"GITHUB_OAUTH_CALLBACK_URL",
		"PORTAL_STORAGE_PATH",
	];
	const missing = local
		? []
		: personal
			? access.missing
			: required.filter((k) => !env[k]);
	const publicUrl = local
		? new URL(`http://${host}:${port}`)
		: env.PORTAL_PUBLIC_URL
			? new URL(env.PORTAL_PUBLIC_URL)
			: null;
	const basePath = env.PORTAL_BASE_PATH ?? "/tools";
	if (
		!/^\/[a-z0-9/-]+$/.test(basePath) ||
		basePath.endsWith("/") ||
		basePath.includes("..")
	)
		throw Error("INVALID_BASE_PATH");
	if (
		publicUrl &&
		((!local && publicUrl.protocol !== "https:") ||
			publicUrl.username ||
			publicUrl.password ||
			publicUrl.search ||
			publicUrl.hash)
	)
		throw Error("INVALID_PUBLIC_URL");
	if (
		personal &&
		publicUrl &&
		(publicUrl.pathname !== basePath ||
			publicUrl.href !== env.PORTAL_PUBLIC_URL)
	)
		throw Error("INVALID_PUBLIC_URL");
	const callback =
		mode === "hosted" ? env.GITHUB_OAUTH_CALLBACK_URL : undefined;
	if (
		callback &&
		(!publicUrl ||
			callback !== `${publicUrl.origin + basePath}/api/auth/callback`)
	)
		throw Error("INVALID_CALLBACK_URL");
	const secret = local
		? randomBytes(32).toString("base64url")
		: (env.PORTAL_SESSION_SECRET ?? "");
	if (secret && secret.length < 32) throw Error("INVALID_SESSION_SECRET");
	let mcpEndpoints: z.infer<typeof endpointSchema>[];
	try {
		mcpEndpoints = z
			.array(endpointSchema)
			.max(32)
			.parse(JSON.parse(env.PORTAL_MCP_ENDPOINTS ?? "[]"));
		if (
			new Set(mcpEndpoints.map((entry) => entry.endpointId)).size !==
			mcpEndpoints.length
		)
			throw Error("duplicate");
	} catch {
		throw Error("INVALID_ENDPOINT_REGISTRATION");
	}
	const maxStorageBytes = Number(env.PORTAL_MAX_STORAGE_BYTES ?? 536870912);
	if (!Number.isSafeInteger(maxStorageBytes) || maxStorageBytes < 67108864)
		throw Error("INVALID_STORAGE_LIMIT");
	return {
		mode,
		personalProvider,
		comfyui,
		nativeMoss,
		ownerEmail: access.ownerEmail,
		accessIssuer: access.accessIssuer,
		accessAudience: access.accessAudience,
		accessJwksFile: access.accessJwksFile,
		ready: missing.length === 0,
		wikiBaseUrl: env.WIKI_BASE_URL ?? "https://sss.linalab.io/wiki/",
		missing,
		basePath,
		publicOrigin: publicUrl?.origin ?? null,
		secret,
		clientId: mode === "hosted" ? (env.GITHUB_OAUTH_CLIENT_ID ?? "") : "",
		clientSecret:
			mode === "hosted" ? (env.GITHUB_OAUTH_CLIENT_SECRET ?? "") : "",
		callback: callback ?? "",
		storagePath: env.PORTAL_STORAGE_PATH
			? resolve(env.PORTAL_STORAGE_PATH)
			: local
				? resolve(homedir(), ".seoul-dengoku-tools", "portal")
				: null,
		originalsDb: env.PORTAL_ORIGINALS_DB ?? null,
		templateManifest: env.PORTAL_TEMPLATE_MANIFEST ?? null,
		templatePins: env.PORTAL_TEMPLATE_PINS ?? null,
		mcpEndpoints,
		localAiCatalog: env.PORTAL_LOCAL_AI_CATALOG
			? resolve(env.PORTAL_LOCAL_AI_CATALOG)
			: null,
		port,
		host,
		networkAccess,
		localHostname,
		mdns,
		publicPath: resolve(env.PORTAL_PUBLIC_PATH ?? "public"),
		tokensPath: resolve(
			env.PORTAL_TOKENS_PATH ?? "../shared-web-ui/src/tokens.css",
		),
		maxStorageBytes,
	};
}
