import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
	NATIVE_MOSS_PROTOCOL,
	nativeMossConnectSchema,
	nativeMossEndpoint,
} from "./native-moss-contract.ts";
import {
	comfyWorkflowSchema,
	defaultProviderModel,
	type ProviderModel,
} from "./provider-models.ts";

const protocolVersionSchema = z.enum([
	"2025-11-25",
	"openai-compatible-http.v1",
	"comfyui-http.v1",
	NATIVE_MOSS_PROTOCOL,
]);
export type ProtocolVersion = z.infer<typeof protocolVersionSchema>;
// The ComfyUI transport carries no bearer: its destination is a reviewed
// server-owned endpoint and the registry row only proves owner/session binding.
export const COMFY_PROTOCOL = "comfyui-http.v1" as const;
const endpointSchema = z
	.object({
		endpointId: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
		revision: z.string().min(1).max(128),
		protocolVersion: protocolVersionSchema,
		toolName: z.string().regex(/^[a-zA-Z0-9_.-]{1,128}$/),
		toolSchemaDigest: z.string().regex(/^[a-f0-9]{64}$/),
	})
	.strict();
const connectSchema = z
	.object({
		endpointId: endpointSchema.shape.endpointId,
		bridgeBearer: z
			.string()
			.min(1)
			.max(8192)
			.regex(/^[A-Za-z0-9._~+/-]+=*$/),
	})
	.strict();
export const localConnectSchema = z.strictObject({
	baseUrl: z
		.string()
		.max(2048)
		.refine((value) => {
			try {
				const url = new URL(value);
				return (
					!url.username &&
					!url.password &&
					!url.search &&
					!url.hash &&
					(url.protocol === "https:" ||
						(url.protocol === "http:" &&
							["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)))
				);
			} catch {
				return false;
			}
		}),
	apiKey: z
		.string()
		.min(1)
		.max(8192)
		.regex(/^[\x21-\x7e]+$/),
});
// Explicit ComfyUI connection request: provider and workflow only. No URL, graph
// or credential may come from a browser; readiness is verified server-side.
export const comfyConnectSchema = z.strictObject({
	provider: z.literal("comfyui"),
	workflow: comfyWorkflowSchema,
});

// Deployment supplies only reviewed identities here. Its transport resolves the
// endpointId to an enforced egress destination; clients cannot register endpoints.
export type RegisteredEndpoint = Readonly<z.infer<typeof endpointSchema>>;
export type VerifiedConnectionSession = Readonly<{
	ownerId: string;
	sessionFingerprint: string;
	expiresAt: number;
}>;
export type ConnectionSnapshot = Readonly<{
	connectionId: string;
	ownerId: string;
	sessionFingerprint: string;
	expiresAt: number;
	revision: string;
	endpointId: string;
	endpointRevision: string;
	protocolVersion: ProtocolVersion;
	toolName: string;
	toolSchemaDigest: string;
	state: "CONNECTING" | "READY" | "REVOKED";
}>;
type VerifiedSession = Readonly<{
	id: string;
	expiresAt: number;
	bootId: string;
}>;
type StartOutbound<T> = (
	endpoint: RegisteredEndpoint,
	bridgeBearer: string,
	baseUrl?: string,
	model?: ProviderModel,
) => T;
export type ProtocolVerification = Readonly<{
	revision: string;
	endpointId: string;
	endpointRevision: string;
	protocolVersion: string;
	toolName: string;
	toolSchemaDigest: string;
	tools: boolean;
}>;
export type ProtocolVerifier = (request: {
	binding: ConnectionSnapshot;
	// Initiate each request synchronously inside this callback, with no intervening
	// await. This is the only credential access, and rechecks auth on every call.
	outbound: <T>(start: StartOutbound<T>) => T;
}) => Promise<ProtocolVerification>;

export function createConnectionRegistry(options: {
	local?: boolean;
	nativeMoss?: boolean;
	sessionScoped?: boolean;
	personalProvider?: z.infer<typeof localConnectSchema> | null;
	verifySession: (signedToken: string) => VerifiedSession | null;
	endpoints?: readonly RegisteredEndpoint[];
	verifyProtocol?: ProtocolVerifier;
	now?: () => number;
}) {
	const now = options.now ?? Date.now;
	const endpoints = new Map<string, RegisteredEndpoint>();
	for (const input of options.endpoints ?? []) {
		const parsed = endpointSchema.safeParse(input);
		if (!parsed.success || endpoints.has(parsed.data.endpointId))
			throw Error("INVALID_ENDPOINT_REGISTRATION");
		if (
			(parsed.data.protocolVersion === NATIVE_MOSS_PROTOCOL ||
				parsed.data.endpointId === nativeMossEndpoint.endpointId) &&
			Object.entries(nativeMossEndpoint).some(
				([key, value]) =>
					parsed.data[key as keyof RegisteredEndpoint] !== value,
			)
		)
			throw Error("INVALID_ENDPOINT_REGISTRATION");
		endpoints.set(parsed.data.endpointId, Object.freeze(parsed.data));
	}
	const contexts = new WeakMap<
		VerifiedConnectionSession,
		{ token: string; bootId: string }
	>();
	const rows = new Map<
		string,
		{
			snapshot: ConnectionSnapshot;
			bearer: string | null;
			baseUrl?: string;
			model: ProviderModel;
			context: VerifiedConnectionSession;
		}
	>();
	// One live connection per transport protocol: an OpenAI-compatible and a
	// ComfyUI connection coexist for one session, while same-protocol connects
	// still exclude each other exactly as before.
	const sessions = new Map<string, string>();
	const reservations = new Map<string, string>();
	let bootLive = true;
	const sessionKey = (
		context: VerifiedConnectionSession,
		protocolVersion: ProtocolVersion,
	) => `${context.sessionFingerprint}\n${protocolVersion}`;
	const reservationKey = (
		context: VerifiedConnectionSession,
		protocolVersion: ProtocolVersion,
	) =>
		`${
			options.personalProvider || options.sessionScoped
				? context.sessionFingerprint
				: context.ownerId
		}\n${protocolVersion}`;

	function contextSecret(context: VerifiedConnectionSession) {
		const secret = contexts.get(context);
		if (!secret) throw Error("AUTHENTICATION_REQUIRED");
		return secret;
	}
	function live(context: VerifiedConnectionSession) {
		const secret = contextSecret(context);
		const verified = options.verifySession(secret.token);
		return (
			bootLive &&
			context.expiresAt > now() &&
			verified !== null &&
			verified.id === context.ownerId &&
			verified.expiresAt === context.expiresAt &&
			verified.bootId === secret.bootId
		);
	}
	function revoke(row: {
		snapshot: ConnectionSnapshot;
		bearer: string | null;
		baseUrl?: string;
	}) {
		row.bearer = null;
		delete row.baseUrl;
		row.snapshot = Object.freeze({ ...row.snapshot, state: "REVOKED" });
		const key = reservationKey(row.snapshot, row.snapshot.protocolVersion);
		if (reservations.get(key) === row.snapshot.connectionId)
			reservations.delete(key);
	}
	function owned(context: VerifiedConnectionSession, connectionId: string) {
		contextSecret(context);
		const row = rows.get(connectionId);
		if (
			!row ||
			row.snapshot.ownerId !== context.ownerId ||
			row.snapshot.sessionFingerprint !== context.sessionFingerprint
		)
			throw Error("CONNECTION_NOT_FOUND");
		if (!live(context)) revoke(row);
		return row;
	}
	function matches(actual: ConnectionSnapshot, pinned: ProtocolVerification) {
		return (
			actual.revision === pinned.revision &&
			actual.endpointId === pinned.endpointId &&
			actual.endpointRevision === pinned.endpointRevision &&
			actual.protocolVersion === pinned.protocolVersion &&
			actual.toolName === pinned.toolName &&
			actual.toolSchemaDigest === pinned.toolSchemaDigest
		);
	}
	function outbound<T>(
		context: VerifiedConnectionSession,
		pinned: ConnectionSnapshot,
		state: "CONNECTING" | "READY",
		start: StartOutbound<T>,
	): T {
		const row = owned(context, pinned.connectionId);
		const actual = row.snapshot;
		const registered = endpoints.get(actual.endpointId);
		if (
			actual.state !== state ||
			!registered ||
			(registered.protocolVersion !== COMFY_PROTOCOL &&
				registered.protocolVersion !== NATIVE_MOSS_PROTOCOL &&
				!row.bearer) ||
			actual.ownerId !== pinned.ownerId ||
			actual.sessionFingerprint !== pinned.sessionFingerprint ||
			actual.expiresAt !== pinned.expiresAt ||
			!matches(actual, { ...pinned, tools: true }) ||
			registered.revision !== actual.endpointRevision ||
			registered.protocolVersion !== actual.protocolVersion ||
			registered.toolName !== actual.toolName ||
			registered.toolSchemaDigest !== actual.toolSchemaDigest
		)
			throw Error("CONNECTION_NOT_READY");
		// No await or user callback runs between authorization and request start.
		return start(
			registered,
			row.bearer ?? "",
			row.baseUrl,
			registered.protocolVersion === NATIVE_MOSS_PROTOCOL
				? undefined
				: row.model,
		);
	}

	return {
		authenticate(signedToken: string): VerifiedConnectionSession | null {
			const verified = options.verifySession(signedToken);
			if (!bootLive || !verified || verified.expiresAt <= now()) return null;
			const context = Object.freeze({
				ownerId: verified.id,
				sessionFingerprint: createHash("sha256")
					.update(signedToken)
					.digest("hex"),
				expiresAt: verified.expiresAt,
			});
			contexts.set(context, { token: signedToken, bootId: verified.bootId });
			return context;
		},
		async connect(
			context: VerifiedConnectionSession,
			input: unknown,
			model: ProviderModel = defaultProviderModel,
		): Promise<ConnectionSnapshot> {
			if (!live(context)) throw Error("CONNECTION_NOT_READY");
			const native = nativeMossConnectSchema.safeParse(input);
			if (native.success && !options.nativeMoss)
				throw Error("CONNECTION_NOT_READY");
			const comfy = comfyConnectSchema.safeParse(input);
			const local =
				!native.success &&
				!comfy.success &&
				(options.local || options.personalProvider)
					? localConnectSchema.safeParse(input ?? options.personalProvider)
					: null;
			// A Comfy workflow resolves to the registered Comfy endpoint whose tool
			// name is that workflow; an unregistered workflow has no endpoint.
			const comfyEndpoint = comfy.success
				? [...endpoints.values()].find(
						(entry) =>
							entry.protocolVersion === COMFY_PROTOCOL &&
							entry.toolName === comfy.data.workflow,
					)
				: undefined;
			const parsed = native.success
				? {
						success: true as const,
						data: {
							endpointId: nativeMossEndpoint.endpointId,
							bridgeBearer: null,
						},
					}
				: comfy.success
					? {
							success: true as const,
							data: {
								endpointId: comfyEndpoint?.endpointId ?? "comfyui",
								bridgeBearer: null,
							},
						}
					: local?.success
						? {
								success: true as const,
								data: {
									endpointId: "local-openai",
									bridgeBearer: local.data.apiKey,
								},
							}
						: connectSchema.safeParse(input);
			if (
				!native.success &&
				!comfy.success &&
				(options.local || options.personalProvider) &&
				!local?.success
			)
				throw Error("INVALID_INPUT");
			if (!parsed.success) throw Error("INVALID_INPUT");
			const registered = endpoints.get(parsed.data.endpointId);
			const verifyProtocol = options.verifyProtocol;
			if (!registered || !verifyProtocol) throw Error("CONNECTION_NOT_READY");
			if (
				(registered.protocolVersion === NATIVE_MOSS_PROTOCOL) !==
				native.success
			)
				throw Error("CONNECTION_NOT_READY");
			// A Comfy connection is pinned to the registered workflow it asked for.
			if (
				comfy.success &&
				(registered.protocolVersion !== COMFY_PROTOCOL ||
					registered.toolName !== comfy.data.workflow)
			)
				throw Error("CONNECTION_NOT_READY");
			if (!comfy.success && registered.protocolVersion === COMFY_PROTOCOL)
				throw Error("CONNECTION_NOT_READY");
			const key = reservationKey(context, registered.protocolVersion);
			const previousId = reservations.get(key);
			const previous = previousId ? rows.get(previousId) : undefined;
			if (previous && !live(previous.context)) revoke(previous);
			if (previous && previous.snapshot.state !== "REVOKED")
				throw Error("CONNECTION_NOT_READY");
			const snapshot: ConnectionSnapshot = Object.freeze({
				connectionId: randomUUID(),
				...context,
				revision: randomUUID(),
				endpointId: registered.endpointId,
				endpointRevision: registered.revision,
				protocolVersion: registered.protocolVersion,
				toolName: registered.toolName,
				toolSchemaDigest: registered.toolSchemaDigest,
				state: "CONNECTING",
			});
			const row: {
				snapshot: ConnectionSnapshot;
				bearer: string | null;
				baseUrl?: string;
				model: ProviderModel;
				context: VerifiedConnectionSession;
			} = {
				snapshot,
				bearer: parsed.data.bridgeBearer,
				context,
				model,
				...(local?.success ? { baseUrl: local.data.baseUrl } : {}),
			};
			// Reserve before the verifier can yield; a conflicting connect cannot win.
			rows.set(snapshot.connectionId, row);
			sessions.set(
				sessionKey(context, registered.protocolVersion),
				snapshot.connectionId,
			);
			reservations.set(key, snapshot.connectionId);
			try {
				const proof = await verifyProtocol({
					binding: snapshot,
					outbound: (start) => outbound(context, snapshot, "CONNECTING", start),
				});
				if (
					!live(context) ||
					row.snapshot.state !== "CONNECTING" ||
					proof.tools !== true ||
					!matches(snapshot, proof)
				)
					throw Error("CONNECTION_NOT_READY");
				row.snapshot = Object.freeze({ ...snapshot, state: "READY" });
				return row.snapshot;
			} catch {
				revoke(row);
				// Remote errors may contain bearer or protocol session identifiers.
				throw Error("CONNECTION_NOT_READY");
			}
		},
		// Without a protocol this returns the session's credentialed (MCP or
		// OpenAI-compatible) connection exactly as before; ComfyUI is asked for
		// explicitly so existing callers never receive a Comfy row by surprise.
		current(
			context: VerifiedConnectionSession,
			protocolVersion?: ProtocolVersion,
		): ConnectionSnapshot | null {
			contextSecret(context);
			const protocols: ProtocolVersion[] = protocolVersion
				? [protocolVersion]
				: ["2025-11-25", "openai-compatible-http.v1"];
			for (const protocol of protocols) {
				const id = sessions.get(sessionKey(context, protocol));
				if (id) return owned(context, id).snapshot;
			}
			return null;
		},
		snapshot(context: VerifiedConnectionSession, connectionId: string) {
			return owned(context, connectionId).snapshot;
		},
		dispatch<T>(
			context: VerifiedConnectionSession,
			pinned: ConnectionSnapshot,
			start: StartOutbound<T>,
		): T {
			return outbound(context, pinned, "READY", start);
		},
		disconnect(context: VerifiedConnectionSession, connectionId: string) {
			const row = owned(context, connectionId);
			revoke(row);
			return row.snapshot;
		},
		expire(connectionId: string) {
			const row = rows.get(connectionId);
			if (row && row.snapshot.expiresAt <= now()) revoke(row);
		},
		revokeSession(context: VerifiedConnectionSession) {
			contextSecret(context);
			for (const row of rows.values())
				if (row.snapshot.sessionFingerprint === context.sessionFingerprint)
					revoke(row);
		},
		revokeOwner(
			context: VerifiedConnectionSession,
			protocolVersion?: ProtocolVersion,
		) {
			contextSecret(context);
			for (const row of rows.values())
				if (
					row.snapshot.ownerId === context.ownerId &&
					(!protocolVersion || row.snapshot.protocolVersion === protocolVersion)
				) {
					revoke(row);
					sessions.delete(
						sessionKey(row.snapshot, row.snapshot.protocolVersion),
					);
				}
		},
		invalidateBoot() {
			bootLive = false;
			for (const row of rows.values()) revoke(row);
		},
	};
}
