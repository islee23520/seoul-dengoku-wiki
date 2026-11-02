import {
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import type { Config } from "./config.ts";

const bootId = randomBytes(32).toString("base64url");
const revoked = new Map<string, number>();
const sessionSchema = z
	.object({
		id: z.string().regex(/^\d+$/),
		login: z.string().min(1),
		csrfToken: z.string().min(32),
		expiresAt: z.number(),
		purpose: z.literal("session"),
		bootId: z.string().min(32),
	})
	.strict();
export type Session = z.infer<typeof sessionSchema>;
export type OAuthFetch = (
	input: string,
	init?: RequestInit,
) => Promise<Response>;
export function createAuth(
	config: Config,
	fetchImpl: OAuthFetch = fetch,
	now: () => number = Date.now,
) {
	const pending = new Map<string, { verifier: string; expiresAt: number }>();
	const mac = (value: string) =>
		createHmac("sha256", config.secret).update(value).digest("base64url");
	const sign = (value: unknown) => {
		const data = Buffer.from(JSON.stringify(value)).toString("base64url");
		return `${data}.${mac(data)}`;
	};
	const unpack = (token: string): unknown => {
		const [body, signature, extra] = token.split(".");
		if (!body || !signature || extra) return null;
		const expected = Buffer.from(mac(body)),
			actual = Buffer.from(signature);
		if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
			return null;
		try {
			return JSON.parse(Buffer.from(body, "base64url").toString());
		} catch (error) {
			if (error instanceof SyntaxError) return null;
			throw error;
		}
	};
	const cookie = (name: string, value: string, maxAge = 28800) =>
		name +
		"=" +
		value +
		"; Path=" +
		config.basePath +
		(config.mode === "local"
			? "/; HttpOnly; SameSite=Strict; Max-Age="
			: config.mode === "personal"
				? "/; HttpOnly; Secure; SameSite=Strict; Max-Age="
				: "/; HttpOnly; Secure; SameSite=Lax; Max-Age=") +
		maxAge;
	const issue = (identity: { id: string; login: string }) =>
		sign(
			sessionSchema.parse({
				...identity,
				csrfToken: randomBytes(32).toString("base64url"),
				expiresAt: now() + 28800000,
				purpose: "session",
				bootId,
			}),
		);
	function login() {
		if (config.mode !== "hosted") throw Error("AUTH_NOT_CONFIGURED");
		if (!config.ready) throw Error("AUTH_NOT_CONFIGURED");
		for (const [key, row] of pending)
			if (row.expiresAt <= now()) pending.delete(key);
		if (pending.size >= 1024) throw Error("AUTH_CAPACITY");
		const state = randomBytes(24).toString("base64url"),
			verifier = randomBytes(32).toString("base64url");
		pending.set(state, { verifier, expiresAt: now() + 600000 });
		const url = new URL("https://github.com/login/oauth/authorize");
		url.searchParams.set("client_id", config.clientId);
		url.searchParams.set("redirect_uri", config.callback);
		url.searchParams.set("state", state);
		url.searchParams.set(
			"code_challenge",
			createHash("sha256").update(verifier).digest("base64url"),
		);
		url.searchParams.set("code_challenge_method", "S256");
		return {
			location: url.toString(),
			cookie: cookie(
				"portal_oauth",
				sign({ state, expiresAt: now() + 600000 }),
				600,
			),
		};
	}
	async function callback(code: string, state: string, stateCookie: string) {
		if (config.mode !== "hosted") throw Error("AUTH_NOT_CONFIGURED");
		const row = pending.get(state);
		pending.delete(state);
		const bound = z
			.object({ state: z.string(), expiresAt: z.number() })
			.safeParse(unpack(stateCookie));
		if (
			!code ||
			!row ||
			row.expiresAt <= now() ||
			!bound.success ||
			bound.data.state !== state ||
			bound.data.expiresAt <= now()
		)
			throw Error("INVALID_OAUTH_STATE");
		const response = await fetchImpl(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					client_id: config.clientId,
					client_secret: config.clientSecret,
					code,
					redirect_uri: config.callback,
					code_verifier: row.verifier,
				}),
				redirect: "error",
				signal: AbortSignal.timeout(15000),
			},
		);
		if (!response.ok) throw Error("OAUTH_EXCHANGE_FAILED");
		const token = z
			.object({ access_token: z.string().min(1) })
			.parse(await response.json());
		const userResponse = await fetchImpl("https://api.github.com/user", {
			headers: {
				accept: "application/vnd.github+json",
				authorization: `Bearer ${token.access_token}`,
				"user-agent": "seoul-dengoku-tools-portal",
			},
			redirect: "error",
			signal: AbortSignal.timeout(15000),
		});
		if (!userResponse.ok) throw Error("OAUTH_IDENTITY_FAILED");
		const user = z
			.object({
				id: z.number().int().positive().safe(),
				login: z.string().min(1),
			})
			.parse(await userResponse.json());
		const session = issue({ id: String(user.id), login: user.login });
		return {
			token: session,
			cookie: cookie("portal_session", session),
			clearState: cookie("portal_oauth", "", 0),
		};
	}
	return {
		login,
		callback,
		issue,
		cookie,
		verify(token: string) {
			for (const [value, expiresAt] of revoked)
				if (expiresAt <= now()) revoked.delete(value);
			if (revoked.has(token) || !config.secret) return null;
			const parsed = sessionSchema.safeParse(unpack(token));
			if (
				!parsed.success ||
				parsed.data.bootId !== bootId ||
				parsed.data.expiresAt <= now() ||
				(config.mode === "personal" &&
					(parsed.data.id !== "1" || parsed.data.login !== config.ownerEmail))
			)
				return null;
			return parsed.data;
		},
		logout(token: string) {
			const parsed = sessionSchema.safeParse(unpack(token));
			if (parsed.success) revoked.set(token, parsed.data.expiresAt);
			return cookie("portal_session", "", 0);
		},
	};
}
