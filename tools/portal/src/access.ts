import { createPublicKey, type KeyObject, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { z } from "zod";
import type { Config } from "./config.ts";

const issuerSchema = z
	.string()
	.regex(/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/);
export function personalAccessConfig(
	env: Record<string, string | undefined> & {
		PORTAL_OWNER_EMAIL?: string | undefined;
		PORTAL_ACCESS_ISSUER?: string | undefined;
		PORTAL_ACCESS_AUDIENCE?: string | undefined;
		PORTAL_ACCESS_JWKS_FILE?: string | undefined;
	},
) {
	const required = [
		"PORTAL_PUBLIC_URL",
		"PORTAL_SESSION_SECRET",
		"PORTAL_STORAGE_PATH",
		"PORTAL_OWNER_EMAIL",
		"PORTAL_ACCESS_ISSUER",
		"PORTAL_ACCESS_AUDIENCE",
		"PORTAL_TEMPLATE_MANIFEST",
		"PORTAL_TEMPLATE_PINS",
	];
	return {
		missing: required.filter((key) => !env[key]),
		ownerEmail: env.PORTAL_OWNER_EMAIL
			? z.email().parse(env.PORTAL_OWNER_EMAIL)
			: "",
		accessIssuer: env.PORTAL_ACCESS_ISSUER
			? issuerSchema.parse(env.PORTAL_ACCESS_ISSUER)
			: "",
		accessAudience: env.PORTAL_ACCESS_AUDIENCE
			? z
					.string()
					.regex(/^[a-f0-9]{64}$/)
					.parse(env.PORTAL_ACCESS_AUDIENCE)
			: "",
		accessJwksFile: env.PORTAL_ACCESS_JWKS_FILE
			? isAbsolute(env.PORTAL_ACCESS_JWKS_FILE)
				? env.PORTAL_ACCESS_JWKS_FILE
				: errorInvalidJwksFile()
			: "",
	};
}
function errorInvalidJwksFile(): string {
	throw Error("INVALID_ACCESS_JWKS_FILE");
}
export class AccessError extends Error {
	readonly name = "AccessError";
	readonly status = 503;
	constructor(options?: ErrorOptions) {
		super("ACCESS_UNAVAILABLE", options);
	}
}
const headerSchema = z.object({
	alg: z.literal("RS256"),
	kid: z.string().min(1).max(256),
});
const claimsSchema = z.object({
	iss: z.string(),
	aud: z.union([z.string(), z.array(z.string()).min(1).max(32)]),
	email: z.email(),
	exp: z.number().int().positive(),
	nbf: z.number().int().nonnegative().optional(),
});
const jwksSchema = z.object({
	keys: z
		.array(
			z.object({
				kty: z.literal("RSA"),
				kid: z.string().min(1).max(256),
				n: z
					.string()
					.regex(/^[A-Za-z0-9_-]+$/)
					.min(342)
					.max(1366),
				e: z
					.string()
					.regex(/^[A-Za-z0-9_-]+$/)
					.max(16),
				alg: z.literal("RS256").optional(),
				use: z.literal("sig").optional(),
			}),
		)
		.min(1)
		.max(32),
});
export type AccessFetch = (
	input: string,
	init?: RequestInit,
) => Promise<Response>;

// Only issuer-pinned public keys are cached; assertions and identities never are.
export function createAccessVerifier(
	config: Config,
	fetchImpl: AccessFetch = fetch,
	now: () => number = Date.now,
) {
	let keys = new Map<string, KeyObject>();
	let expiresAt = 0;
	let fetchedAt = 0;
	let pending: Promise<void> | null = null;
	function loadPinnedKeys(path: string): void {
		let bytes: Buffer;
		try {
			bytes = readFileSync(path);
		} catch (error) {
			throw new AccessError({ cause: error });
		}
		if (bytes.length > 65536) throw new AccessError();
		const parsed = jwksSchema.parse(JSON.parse(bytes.toString("utf8")));
		const next = new Map<string, KeyObject>();
		for (const jwk of parsed.keys) {
			if (next.has(jwk.kid)) throw new AccessError();
			const key = createPublicKey({
				key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
				format: "jwk",
			});
			if ((key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048)
				throw new AccessError();
			next.set(jwk.kid, key);
		}
		keys = next;
		fetchedAt = now();
		expiresAt = Number.POSITIVE_INFINITY;
	}
	if (config.accessJwksFile) loadPinnedKeys(config.accessJwksFile);
	async function refresh() {
		try {
			const response = await fetchImpl(
				`${config.accessIssuer}/cdn-cgi/access/certs`,
				{
					redirect: "error",
					signal: AbortSignal.timeout(5000),
					headers: { accept: "application/json" },
				},
			);
			if (!response.ok || !response.body) throw new AccessError();
			const reader = response.body.getReader();
			const chunks: Uint8Array[] = [];
			let size = 0;
			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					size += value.length;
					if (size > 65536) {
						await reader.cancel();
						throw new AccessError();
					}
					chunks.push(value);
				}
			} finally {
				reader.releaseLock();
			}
			const parsed = jwksSchema.parse(
				JSON.parse(Buffer.concat(chunks).toString("utf8")),
			);
			const next = new Map<string, KeyObject>();
			for (const jwk of parsed.keys) {
				if (next.has(jwk.kid)) throw new AccessError();
				const key = createPublicKey({
					key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
					format: "jwk",
				});
				if ((key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048)
					throw new AccessError();
				next.set(jwk.kid, key);
			}
			const maxAge = response.headers
				.get("cache-control")
				?.match(/(?:^|,)\s*max-age=(\d+)/)?.[1];
			fetchedAt = now();
			expiresAt =
				fetchedAt +
				Math.min(300000, maxAge === undefined ? 300000 : Number(maxAge) * 1000);
			keys = next;
		} catch (error) {
			if (error instanceof Error) throw new AccessError({ cause: error });
			throw error;
		}
	}
	return async (assertion: string | undefined): Promise<string | null> => {
		if (!assertion || assertion.length > 16384) return null;
		const [header, claims, signature, extra] = assertion.split(".");
		if (
			!header ||
			!claims ||
			!signature ||
			extra !== undefined ||
			![header, claims, signature].every((part) =>
				/^[A-Za-z0-9_-]+$/.test(part),
			)
		)
			return null;
		let parsedHeader: z.infer<typeof headerSchema>;
		let parsedClaims: z.infer<typeof claimsSchema>;
		try {
			parsedHeader = headerSchema.parse(
				JSON.parse(Buffer.from(header, "base64url").toString("utf8")),
			);
			parsedClaims = claimsSchema.parse(
				JSON.parse(Buffer.from(claims, "base64url").toString("utf8")),
			);
		} catch (error) {
			if (error instanceof SyntaxError || error instanceof z.ZodError)
				return null;
			throw error;
		}
		const seconds = now() / 1000;
		if (
			parsedClaims.iss !== config.accessIssuer ||
			!(
				typeof parsedClaims.aud === "string"
					? [parsedClaims.aud]
					: parsedClaims.aud
			).includes(config.accessAudience) ||
			parsedClaims.email !== config.ownerEmail ||
			parsedClaims.exp <= seconds ||
			(parsedClaims.nbf !== undefined && parsedClaims.nbf > seconds)
		)
			return null;
		if (
			!config.accessJwksFile &&
			(expiresAt <= now() ||
				(!keys.has(parsedHeader.kid) && now() - fetchedAt >= 30000))
		) {
			pending ??= refresh().finally(() => {
				pending = null;
			});
			await pending;
		}
		const key = keys.get(parsedHeader.kid);
		return parsedClaims.exp > now() / 1000 &&
			key &&
			verify(
				"RSA-SHA256",
				Buffer.from(`${header}.${claims}`),
				key,
				Buffer.from(signature, "base64url"),
			)
			? parsedClaims.email
			: null;
	};
}
