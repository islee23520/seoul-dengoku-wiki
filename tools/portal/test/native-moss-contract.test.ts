import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { loadConfig } from "../src/config.ts";
import {
	createConnectionRegistry,
	type RegisteredEndpoint,
} from "../src/connections.ts";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
	NATIVE_MOSS_PROTOCOL,
	nativeMossConnectSchema,
	nativeMossEndpoint,
	nativeMossProfile,
} from "../src/native-moss-contract.ts";
import {
	defaultProviderModel,
	generationProviderModelSchema,
	nativeMossProviderModelSchema,
} from "../src/provider-models.ts";
import {
	type ReferenceGenerationRequest,
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "../src/reference-contract.ts";

function request(): ReferenceGenerationRequest {
	return {
		schemaVersion: 2,
		generationProfile: "native340-v1",
		requestId: randomUUID(),
		personId: "person-1003",
		provider: "native-moss",
		providerModel: NATIVE_MOSS_MODEL,
		nativeRecipe: "recovery16-native-flow-source045-v1",
		inputMode: "reference-img2img",
		sourceSelection: {
			kind: "selected",
			personId: "person-1003",
			sourceSHA256: "a".repeat(64),
		},
		explicitEdits: [],
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	};
}

test("native profile digest binds actual fixed values without inventing a worker bundle", () => {
	expect(NATIVE_MOSS_PROFILE_DIGEST).toBe(
		createHash("sha256")
			.update(JSON.stringify(nativeMossProfile))
			.digest("hex"),
	);
	expect(nativeMossProfile.adapterSHA256).toBe(
		"50dd8ab132a9d9c67e35e19bb7c1da6770658757df1c7b424d492999d200ca57",
	);
	expect(nativeMossProfile.nativeTensorCount).toBe(336);
	expect(nativeMossProfile.canMergeIn).toBe(false);
	expect(
		nativeMossProfile.recipes["recovery16-native-flow-source025-v1"].fullSteps,
	).toBe(100);
	expect(nativeMossProfile).not.toHaveProperty("bundleSHA256");
	expect(defaultProviderModel).toBe("gpt-image-2.5-sunburst");
	expect(nativeMossProviderModelSchema.parse(NATIVE_MOSS_MODEL)).toBe(
		NATIVE_MOSS_MODEL,
	);
	expect(
		generationProviderModelSchema.safeParse(NATIVE_MOSS_MODEL).success,
	).toBe(false);
});

test("native strict v2 reference and token recipes require fixed mode geometry and preserve-only authority", () => {
	const base = request();
	expect(referenceGenerationRequestSchema.parse(base)).toEqual(base);
	expect(
		referenceGenerationRequestSchema.safeParse({
			...base,
			nativeRecipe: "recovery16-native-flow-source025-v1",
		}).success,
	).toBe(true);
	const token: ReferenceGenerationRequest = {
		...base,
		inputMode: "token-only",
		nativeRecipe: "recovery16-native-token-v1",
		sourceSelection: {
			kind: "intentional-absence",
			reason: "no-reference-available",
		},
	};
	expect(referenceGenerationRequestSchema.parse(token)).toEqual(token);
	for (const patch of [
		{ nativeRecipe: undefined },
		{ nativeRecipe: "source-025" },
		{ nativeRecipe: "recovery16-native-token-v1" },
		{ generationProfile: undefined },
		{ generationProfile: "cpa340-padded-v1" },
		{ size: "352x512" },
		{ providerModel: "comfyui:moss-image-sft-style-male.alpha.v1" },
		{ sourceRecipe: "source-045" },
		{
			explicitEdits: [
				{
					field: "outfit.upper.color",
					operation: "replace",
					value: "dark blue",
				},
			],
		},
		{ command: "python" },
		{ output: "E:/other" },
		{ inputMode: "token-only" },
	])
		expect(
			referenceGenerationRequestSchema.safeParse({ ...base, ...patch }).success,
		).toBe(false);
	expect(
		referenceGenerationRequestSchema.safeParse({
			...token,
			nativeRecipe: base.nativeRecipe,
		}).success,
	).toBe(false);
	expect(
		resolveReferenceSource(base, { status: "unresolved" }).generation,
	).toBeNull();
	expect(
		resolveReferenceSource(
			{
				...base,
				explicitEdits: [
					{
						field: "outfit.upper.color",
						operation: "replace",
						value: "dark blue",
					},
				],
			},
			{ status: "unresolved" },
		),
	).toMatchObject({
		errorCode: "NATIVE_EDIT_UNSUPPORTED",
		httpStatus: 422,
		generation: null,
	});
	for (const provider of ["openai-compatible", "comfyui"]) {
		expect(
			referenceGenerationRequestSchema.safeParse({ ...base, provider }).success,
		).toBe(false);
		const { nativeRecipe: _nativeRecipe, ...old } = base;
		expect(
			referenceGenerationRequestSchema.safeParse({ ...old, provider }).success,
		).toBe(true);
	}
});

test("native config optin is local or personal only and leaves legacy defaults unchanged", () => {
	expect(loadConfig({}).nativeMoss).toBe(false);
	expect(loadConfig({ PORTAL_NATIVE_MOSS: "false" }).nativeMoss).toBe(false);
	expect(loadConfig({ PORTAL_NATIVE_MOSS: "true" }).nativeMoss).toBe(true);
	expect(
		loadConfig({ PORTAL_MODE: "personal", PORTAL_NATIVE_MOSS: "true" })
			.nativeMoss,
	).toBe(true);
	expect(() =>
		loadConfig({ PORTAL_MODE: "hosted", PORTAL_NATIVE_MOSS: "true" }),
	).toThrow("INVALID_NATIVE_MOSS_CONFIG");
	expect(() => loadConfig({ PORTAL_NATIVE_MOSS: "yes" })).toThrow(
		"INVALID_NATIVE_MOSS_CONFIG",
	);
});

test("native bearerless fixed endpoint coexists with credentialed and Comfy connections without becoming default", async () => {
	let checks = 0;
	const credentialed: RegisteredEndpoint = {
		endpointId: "reviewed-bridge",
		revision: "v1",
		protocolVersion: "2025-11-25",
		toolName: "portrait",
		toolSchemaDigest: "b".repeat(64),
	};
	const comfy: RegisteredEndpoint = {
		endpointId: "comfy-test",
		revision: "v1",
		protocolVersion: "comfyui-http.v1",
		toolName: "moss-image-sft-text.alpha.v1",
		toolSchemaDigest: "c".repeat(64),
	};
	const verifySession = (token: string) =>
		token === "signed" ? { id: "42", expiresAt: 10000, bootId: "boot" } : null;
	const options = {
		nativeMoss: true,
		verifySession,
		endpoints: [credentialed, comfy, nativeMossEndpoint],
		now: () => 1,
		verifyProtocol: async ({
			binding,
			outbound,
		}: Parameters<
			NonNullable<
				Parameters<typeof createConnectionRegistry>[0]["verifyProtocol"]
			>
		>[0]) => {
			checks++;
			outbound((endpoint, bearer, url) => {
				if (endpoint.protocolVersion === NATIVE_MOSS_PROTOCOL) {
					expect(bearer).toBe("");
					expect(url).toBeUndefined();
				}
			});
			return { ...binding, tools: true };
		},
	};
	const registry = createConnectionRegistry(options);
	const context = registry.authenticate("signed");
	if (!context) throw Error("AUTH_FIXTURE");
	const input = { provider: "native-moss", model: NATIVE_MOSS_MODEL };
	const old = await registry.connect(context, {
		endpointId: credentialed.endpointId,
		bridgeBearer: "private-fixture",
	});
	const com = await registry.connect(context, {
		provider: "comfyui",
		workflow: comfy.toolName,
	});
	const native = await registry.connect(context, input);
	expect(registry.current(context)).toEqual(old);
	expect(registry.current(context, NATIVE_MOSS_PROTOCOL)).toEqual(native);
	expect(registry.current(context, "comfyui-http.v1")).toEqual(com);
	registry.dispatch(context, native, (_endpoint, bearer) =>
		expect(bearer).toBe(""),
	);
	await expect(registry.connect(context, input)).rejects.toThrow(
		"CONNECTION_NOT_READY",
	);
	const before = checks;
	for (const extra of [
		{ endpointId: "other" },
		{ baseUrl: "https://evil.test" },
		{ bridgeBearer: "key" },
		{ command: "python" },
	]) {
		expect(
			nativeMossConnectSchema.safeParse({ ...input, ...extra }).success,
		).toBe(false);
		await expect(
			registry.connect(context, { ...input, ...extra }),
		).rejects.toThrow();
	}
	await expect(
		registry.connect(context, {
			endpointId: nativeMossEndpoint.endpointId,
			bridgeBearer: "key",
		}),
	).rejects.toThrow("CONNECTION_NOT_READY");
	expect(checks).toBe(before);
	expect(() =>
		createConnectionRegistry({
			...options,
			endpoints: [{ ...nativeMossEndpoint, toolName: "unreviewed" }],
		}),
	).toThrow("INVALID_ENDPOINT_REGISTRATION");
	const disabled = createConnectionRegistry({ ...options, nativeMoss: false });
	const disabledContext = disabled.authenticate("signed");
	if (!disabledContext) throw Error("AUTH_FIXTURE");
	await expect(disabled.connect(disabledContext, input)).rejects.toThrow(
		"CONNECTION_NOT_READY",
	);
	registry.disconnect(context, native.connectionId);
	expect(() => registry.dispatch(context, native, () => undefined)).toThrow(
		"CONNECTION_NOT_READY",
	);
	expect(registry.current(context)).toEqual(old);
});
