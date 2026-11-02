import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import {
	createConnectionRegistry,
	type ProtocolVerifier,
	type RegisteredEndpoint,
} from "../src/connections.ts";

const endpoint: RegisteredEndpoint = {
	endpointId: "reviewed-bridge",
	revision: "deployment-v1",
	protocolVersion: "2025-11-25",
	toolName: "portrait_image_edit",
	toolSchemaDigest: "a".repeat(64),
};
const verified: ProtocolVerifier = async ({ binding, outbound }) => {
	outbound(() => undefined);
	return { ...binding, tools: true };
};

function fixture(verifyProtocol: ProtocolVerifier = verified) {
	let time = 1000;
	const auth = createAuth(
		loadConfig({
			PORTAL_SESSION_SECRET: "connection-fixture-secret-".repeat(3),
			CLIPROXY_API_KEY: "shared-fixture-key",
			CLIPROXY_BASE_URL: "https://shared.example/v1",
			OPENAI_API_KEY: "ambient-fixture-key",
			GITHUB_OAUTH_CLIENT_SECRET: "github-fixture-secret",
		}),
		async () => {
			throw Error("UNEXPECTED_OAUTH");
		},
		() => time,
	);
	const registry = createConnectionRegistry({
		verifySession: auth.verify,
		endpoints: [endpoint],
		verifyProtocol,
		now: () => time,
	});
	const tokenA = auth.issue({ id: "42", login: "same-login" });
	const tokenB = auth.issue({ id: "84", login: "same-login" });
	const a = registry.authenticate(tokenA);
	const b = registry.authenticate(tokenB);
	if (!a || !b) throw Error("INVALID_FIXTURE_AUTH");
	return {
		auth,
		registry,
		tokenA,
		tokenB,
		a,
		b,
		now: () => time,
		advance: () => {
			time += 28800000;
		},
	};
}

const input = (bridgeBearer = "owner-a-private-bearer") => ({
	endpointId: endpoint.endpointId,
	bridgeBearer,
});

describe("exact-session connection authority", () => {
	test("explicit personal provider reserves each owner session while preserving exact-session outbound and logout isolation", async () => {
		const f = fixture();
		const provider = {
			baseUrl: "http://127.0.0.1:1/v1",
			apiKey: "configured-personal-secret",
		};
		const registry = createConnectionRegistry({
			personalProvider: provider,
			verifySession: f.auth.verify,
			endpoints: [{ ...endpoint, endpointId: "local-openai" }],
			verifyProtocol: verified,
			now: f.now,
		});
		const otherToken = f.auth.issue({ id: "42", login: "same-owner" });
		const a = registry.authenticate(f.tokenA);
		const b = registry.authenticate(otherToken);
		if (!a || !b) throw Error("INVALID_FIXTURE_AUTH");
		const [first, second] = await Promise.all([
			registry.connect(a, provider),
			registry.connect(b, provider),
		]);
		expect(first.state).toBe("READY");
		expect(second.state).toBe("READY");
		expect(first.connectionId).not.toBe(second.connectionId);
		await expect(registry.connect(a, provider)).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		for (const [context, foreign] of [
			[a, second],
			[b, first],
		] as const) {
			expect(() =>
				registry.dispatch(context, foreign, () => undefined),
			).toThrow("CONNECTION_NOT_FOUND");
			expect(() => registry.disconnect(context, foreign.connectionId)).toThrow(
				"CONNECTION_NOT_FOUND",
			);
		}
		const calls: string[] = [];
		registry.dispatch(a, first, (_endpoint, key, baseUrl) => {
			expect(baseUrl).toBe(provider.baseUrl);
			calls.push(key);
		});
		registry.revokeSession(a);
		f.auth.logout(f.tokenA);
		expect(() => registry.dispatch(a, first, () => undefined)).toThrow(
			"CONNECTION_NOT_READY",
		);
		registry.dispatch(b, second, (_endpoint, key) => calls.push(key));
		expect(calls).toEqual([provider.apiKey, provider.apiKey]);
		expect(registry.current(b)).toEqual(second);
		expect(JSON.stringify([first, second])).not.toContain(provider.apiKey);
	});

	test("independent owners dispatch only their own memory-only bearer", async () => {
		const f = fixture();
		const a = await f.registry.connect(f.a, input());
		const b = await f.registry.connect(f.b, input("owner-b-private-bearer"));
		const calls: string[] = [];
		f.registry.dispatch(f.a, a, (registered, bearer) => {
			expect(registered).toEqual(endpoint);
			calls.push(bearer);
		});
		f.registry.dispatch(f.b, b, (_registered, bearer) => calls.push(bearer));
		expect(calls).toEqual(["owner-a-private-bearer", "owner-b-private-bearer"]);
		expect(a.ownerId).toBe("42");
		expect(a.sessionFingerprint).toBe(
			createHash("sha256").update(f.tokenA).digest("hex"),
		);
		expect(a.expiresAt).toBe(f.a.expiresAt);
		expect(a.connectionId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
		expect(a.revision).not.toBe(b.revision);
	});

	test("foreign, missing, and same owner different session are indistinguishable", async () => {
		const f = fixture();
		const a = await f.registry.connect(f.a, input());
		const other = f.registry.authenticate(
			f.auth.issue({ id: "42", login: "same-login" }),
		);
		if (!other) throw Error("INVALID_FIXTURE_AUTH");
		for (const context of [f.b, other]) {
			expect(() => f.registry.snapshot(context, a.connectionId)).toThrow(
				"CONNECTION_NOT_FOUND",
			);
			expect(() => f.registry.dispatch(context, a, () => undefined)).toThrow(
				"CONNECTION_NOT_FOUND",
			);
			expect(() => f.registry.disconnect(context, a.connectionId)).toThrow(
				"CONNECTION_NOT_FOUND",
			);
		}
		expect(() => f.registry.snapshot(f.a, crypto.randomUUID())).toThrow(
			"CONNECTION_NOT_FOUND",
		);
		expect(f.registry.current(other)).toBeNull();
	});

	test("payload owner, URL, headers, command and keys cannot supply authority", async () => {
		const f = fixture();
		for (const extra of [
			{ ownerId: "84" },
			{ url: "https://evil.example" },
			{ headers: { authorization: "shared" } },
			{ command: "bridge" },
			{ providerKey: "shared" },
			{ connectionId: crypto.randomUUID() },
		]) {
			await expect(
				f.registry.connect(f.a, { ...input(), ...extra }),
			).rejects.toThrow("INVALID_INPUT");
		}
		expect(f.registry.current(f.a)).toBeNull();
		await expect(f.registry.connect({ ...f.a }, input())).rejects.toThrow(
			"AUTHENTICATION_REQUIRED",
		);
		expect(f.registry.authenticate(`${f.tokenA}tampered`)).toBeNull();
	});

	test("default empty registration never infers shared credentials", async () => {
		const f = fixture();
		const registry = createConnectionRegistry({
			verifySession: f.auth.verify,
			now: f.now,
		});
		const context = registry.authenticate(f.tokenA);
		if (!context) throw Error("INVALID_FIXTURE_AUTH");
		expect(registry.current(context)).toBeNull();
		await expect(registry.connect(context, input())).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		await expect(
			f.registry.connect(f.a, { endpointId: endpoint.endpointId }),
		).rejects.toThrow("INVALID_INPUT");
	});

	test("registration alone cannot claim protocol readiness", async () => {
		const f = fixture();
		const registry = createConnectionRegistry({
			verifySession: f.auth.verify,
			endpoints: [endpoint],
			now: f.now,
		});
		const context = registry.authenticate(f.tokenA);
		if (!context) throw Error("INVALID_FIXTURE_AUTH");
		await expect(registry.connect(context, input())).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		expect(registry.current(context)).toBeNull();
	});

	test("expiry and logout invalidate retained contexts before outbound", async () => {
		for (const invalidate of ["expiry", "logout"] as const) {
			const f = fixture();
			const a = await f.registry.connect(f.a, input());
			if (invalidate === "expiry") f.advance();
			else f.auth.logout(f.tokenA);
			let calls = 0;
			expect(() => f.registry.dispatch(f.a, a, () => calls++)).toThrow(
				"CONNECTION_NOT_READY",
			);
			expect(calls).toBe(0);
			expect(f.registry.snapshot(f.a, a.connectionId).state).toBe("REVOKED");
		}
	});

	test("disconnect and session revoke retain nonready tombstone without substitution", async () => {
		for (const invalidate of ["disconnect", "revoke"] as const) {
			const f = fixture();
			const a = await f.registry.connect(f.a, input());
			if (invalidate === "disconnect")
				f.registry.disconnect(f.a, a.connectionId);
			else f.registry.revokeSession(f.a);
			expect(() => f.registry.dispatch(f.a, a, () => undefined)).toThrow(
				"CONNECTION_NOT_READY",
			);
			const replacement = await f.registry.connect(
				f.a,
				input("replacement-bearer"),
			);
			expect(replacement.connectionId).not.toBe(a.connectionId);
			expect(() => f.registry.dispatch(f.a, a, () => undefined)).toThrow(
				"CONNECTION_NOT_READY",
			);
		}
	});

	test("boot invalidation and a new registry cannot restore old connections", async () => {
		const f = fixture();
		const a = await f.registry.connect(f.a, input());
		f.registry.invalidateBoot();
		expect(() => f.registry.dispatch(f.a, a, () => undefined)).toThrow(
			"CONNECTION_NOT_READY",
		);
		await expect(f.registry.connect(f.a, input())).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		const restarted = createConnectionRegistry({
			verifySession: f.auth.verify,
			endpoints: [endpoint],
			verifyProtocol: verified,
			now: f.now,
		});
		const context = restarted.authenticate(f.tokenA);
		if (!context) throw Error("INVALID_FIXTURE_AUTH");
		expect(restarted.current(context)).toBeNull();
		expect(() => restarted.dispatch(context, a, () => undefined)).toThrow(
			"CONNECTION_NOT_FOUND",
		);
	});

	test("verification result must match the exact revision and capability binding", async () => {
		for (const changed of [
			{ revision: "other" },
			{ toolSchemaDigest: "b".repeat(64) },
			{ protocolVersion: "other" },
			{ toolName: "other" },
			{ tools: false },
		]) {
			const f = fixture(async ({ binding }) => ({
				...binding,
				tools: true,
				...changed,
			}));
			await expect(f.registry.connect(f.a, input())).rejects.toThrow(
				"CONNECTION_NOT_READY",
			);
			expect(f.registry.current(f.a)?.state).toBe("REVOKED");
		}
	});

	test("snapshots and reviewed registration are immutable, secret free and pinned", async () => {
		const registered = { ...endpoint };
		const f = fixture();
		const registry = createConnectionRegistry({
			verifySession: f.auth.verify,
			endpoints: [registered],
			verifyProtocol: verified,
			now: f.now,
		});
		const context = registry.authenticate(f.tokenA);
		if (!context) throw Error("INVALID_FIXTURE_AUTH");
		registered.revision = "mutated";
		const a = await registry.connect(context, input());
		expect(a.endpointRevision).toBe(endpoint.revision);
		expect(Object.isFrozen(a)).toBe(true);
		expect(Object.isFrozen(context)).toBe(true);
		for (const changed of [
			{ revision: "other" },
			{ endpointRevision: "other" },
			{ toolSchemaDigest: "b".repeat(64) },
			{ expiresAt: a.expiresAt + 1 },
		]) {
			expect(() =>
				registry.dispatch(context, { ...a, ...changed }, () => undefined),
			).toThrow("CONNECTION_NOT_READY");
		}
		const serialized = JSON.stringify([
			a,
			context,
			registry.current(context),
			registry,
		]);
		for (const secret of [
			input().bridgeBearer,
			f.tokenA,
			"shared-fixture-key",
			"ambient-fixture-key",
			"github-fixture-secret",
		])
			expect(serialized).not.toContain(secret);
	});

	test("competing connects reserve one session atomically before verification yields", async () => {
		const entered = Promise.withResolvers<void>();
		const release = Promise.withResolvers<void>();
		const f = fixture(async ({ binding }) => {
			entered.resolve();
			await release.promise;
			return { ...binding, tools: true };
		});
		const first = f.registry.connect(f.a, input());
		await entered.promise;
		await expect(
			f.registry.connect(f.a, input("competing-bearer")),
		).rejects.toThrow("CONNECTION_NOT_READY");
		release.resolve();
		const a = await first;
		let bearer = "";
		f.registry.dispatch(f.a, a, (_registered, value) => {
			bearer = value;
		});
		expect(bearer).toBe(input().bridgeBearer);
	});

	test("two signed sessions reserve one owner across CONNECTING and READY without replacing authority", async () => {
		const events = new EventEmitter();
		let verifications = 0;
		const f = fixture(async ({ binding, outbound }) => {
			verifications++;
			outbound(() => undefined);
			if (verifications === 1) {
				const released = once(events, "release", {
					signal: AbortSignal.timeout(5000),
				});
				events.emit("entered");
				await released;
			}
			return { ...binding, tools: true };
		});
		const other = f.registry.authenticate(
			f.auth.issue({ id: "42", login: "second-session" }),
		);
		if (!other) throw Error("INVALID_FIXTURE_AUTH");
		const entered = once(events, "entered", {
			signal: AbortSignal.timeout(5000),
		});
		const first = f.registry.connect(f.a, input());
		try {
			await entered;
			await expect(
				f.registry.connect(other, input("other-bearer")),
			).rejects.toThrow("CONNECTION_NOT_READY");
			expect(verifications).toBe(1);
			expect(f.registry.current(other)).toBeNull();
			expect(f.registry.current(f.a)?.state).toBe("CONNECTING");
			events.emit("release");
			const ready = await first;
			await expect(
				f.registry.connect(other, input("other-bearer")),
			).rejects.toThrow("CONNECTION_NOT_READY");
			expect(verifications).toBe(1);
			expect(f.registry.current(f.a)).toEqual(ready);
			expect(() => f.registry.snapshot(other, ready.connectionId)).toThrow(
				"CONNECTION_NOT_FOUND",
			);
			let bearer = "";
			f.registry.dispatch(f.a, ready, (_registered, value) => {
				bearer = value;
			});
			expect(bearer).toBe(input().bridgeBearer);
			f.registry.disconnect(f.a, ready.connectionId);
			const replacement = await f.registry.connect(
				other,
				input("other-bearer"),
			);
			expect(replacement.connectionId).not.toBe(ready.connectionId);
			expect(f.registry.current(f.a)?.state).toBe("REVOKED");
			expect(() => f.registry.dispatch(f.a, ready, () => undefined)).toThrow(
				"CONNECTION_NOT_READY",
			);
		} finally {
			events.emit("release");
			await first;
		}
	});

	test("owner reservation releases revoked or expired first-session authority for a fresh signed session", async () => {
		for (const invalidate of ["revoke", "logout", "expiry"] as const) {
			const f = fixture();
			const first = await f.registry.connect(f.a, input());
			if (invalidate === "revoke") f.registry.revokeSession(f.a);
			else if (invalidate === "logout") f.auth.logout(f.tokenA);
			else f.advance();
			const other = f.registry.authenticate(
				f.auth.issue({ id: "42", login: "fresh-session" }),
			);
			if (!other) throw Error("INVALID_FIXTURE_AUTH");
			const replacement = await f.registry.connect(
				other,
				input("fresh-bearer"),
			);
			expect(replacement.connectionId).not.toBe(first.connectionId);
			expect(f.registry.snapshot(f.a, first.connectionId).state).toBe(
				"REVOKED",
			);
			expect(() => f.registry.dispatch(f.a, first, () => undefined)).toThrow(
				"CONNECTION_NOT_READY",
			);
		}
	});

	test("revocation during verification cannot revive or initiate another request", async () => {
		const entered = Promise.withResolvers<void>();
		const release = Promise.withResolvers<void>();
		let outboundCalls = 0;
		const f = fixture(async ({ binding, outbound }) => {
			outbound(() => outboundCalls++);
			entered.resolve();
			await release.promise;
			expect(() => outbound(() => outboundCalls++)).toThrow(
				"CONNECTION_NOT_READY",
			);
			return { ...binding, tools: true };
		});
		const first = f.registry.connect(f.a, input());
		await entered.promise;
		const connecting = f.registry.current(f.a);
		if (!connecting) throw Error("MISSING_CONNECTING");
		f.registry.disconnect(f.a, connecting.connectionId);
		release.resolve();
		await expect(first).rejects.toThrow("CONNECTION_NOT_READY");
		expect(outboundCalls).toBe(1);
		expect(f.registry.current(f.a)?.state).toBe("REVOKED");
	});

	test("logout and boot invalidation races are checked after verification", async () => {
		for (const invalidate of ["logout", "boot", "expiry"] as const) {
			const entered = Promise.withResolvers<void>();
			const release = Promise.withResolvers<void>();
			const f = fixture(async ({ binding }) => {
				entered.resolve();
				await release.promise;
				return { ...binding, tools: true };
			});
			const first = f.registry.connect(f.a, input());
			await entered.promise;
			if (invalidate === "logout") f.auth.logout(f.tokenA);
			else if (invalidate === "boot") f.registry.invalidateBoot();
			else f.advance();
			release.resolve();
			await expect(first).rejects.toThrow("CONNECTION_NOT_READY");
		}
	});

	test("protocol failure discards secret and reports only fixed local error", async () => {
		const f = fixture(async () => {
			throw Error(`remote body ${input().bridgeBearer}`);
		});
		await expect(f.registry.connect(f.a, input())).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		expect(JSON.stringify(f.registry.current(f.a))).not.toContain(
			input().bridgeBearer,
		);
	});
});
