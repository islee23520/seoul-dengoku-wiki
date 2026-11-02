import { createHash, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { requestSha256 } from "../../local-ai/worker-broker-client.ts";
import { loadConfig } from "../src/config.ts";
import {
	type LocalAiWorker,
	localAiRequestSchema,
} from "../src/local-ai-jobs.ts";
import { createPortal } from "../src/server.ts";
export const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
export async function localAiFixture(root: string) {
	const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
	const issuer = "https://fixture.cloudflareaccess.com",
		audience = "a".repeat(64);
	const encode = (value: unknown) =>
		Buffer.from(JSON.stringify(value)).toString("base64url");
	const claims = `${encode({ alg: "RS256", kid: "fixture" })}.${encode({ iss: issuer, aud: [audience], email: "owner@example.com", exp: 9000000000 })}`;
	const assertion = `${claims}.${sign("RSA-SHA256", Buffer.from(claims), pair.privateKey).toString("base64url")}`;
	const bytes = Buffer.from('{"frames":[[0],[1]]}');
	const input = localAiRequestSchema.parse({
		requestId: randomUUID(),
		tool: "unimate",
		assetId: "fixture",
		prompt: "Walk forward.",
		seed: 1,
	});
	const artifact = {
		id: `${input.requestId}-0`,
		name: "motion.json",
		bytes: bytes.length,
		sha256: hash(bytes),
		mime: "application/json" as const,
	};
	let runs = 0;
	const worker: LocalAiWorker = async (request) => {
		switch (request.op) {
			case "admission":
				return { version: 1, op: "admission", configurationEligible: true };
			case "run":
				runs++;
				return {
					version: 1,
					op: "run",
					requestId: request.requestId,
					state: "AWAITING_VALIDATION",
					exitCode: 0,
					requestSha256: requestSha256(request),
				};
			case "result":
				return {
					version: 1,
					op: "result",
					receipt: JSON.stringify({
						version: 1,
						request: input,
						adapterRequestSha256: "a".repeat(64),
						sourceRevision: "fixture",
						runtimeId: "cpu-fixture",
						modelSha256: "b".repeat(64),
						inputSha256: "c".repeat(64),
						artifacts: [artifact],
					}),
				};
			case "get":
				return {
					version: 1,
					op: "get",
					artifactId: artifact.id,
					offset: request.offset,
					total: bytes.length,
					sha256: hash(bytes),
					data: bytes
						.subarray(request.offset, request.offset + request.length)
						.toString("base64"),
				};
			case "probe":
				throw new Error("unused probe");
			default: {
				const exhaustive: never = request;
				throw new Error(String(exhaustive));
			}
		}
	};
	const app = await createPortal(
		loadConfig({
			PORTAL_MODE: "personal",
			PORTAL_PUBLIC_URL: "https://sss.linalab.io/tools",
			PORTAL_OWNER_EMAIL: "owner@example.com",
			PORTAL_ACCESS_ISSUER: issuer,
			PORTAL_ACCESS_AUDIENCE: audience,
			PORTAL_SESSION_SECRET: "fixture-only-secret".repeat(3),
			PORTAL_STORAGE_PATH: join(root, "storage"),
			PORTAL_PORT: "0",
			PORTAL_TEMPLATE_MANIFEST: "/fixture/manifest.json",
			PORTAL_TEMPLATE_PINS: "/fixture/pins.json",
		}),
		{
			template: {
				candidate: createTransportFixture().candidate,
				operatorPins: createTransportFixture().operatorPins,
			},
			accessFetch: async () =>
				Response.json({
					keys: [
						{
							...pair.publicKey.export({ format: "jwk" }),
							kid: "fixture",
							alg: "RS256",
							use: "sig",
						},
					],
				}),
			localAi: {
				worker,
				catalog: [
					{
						tool: "unimate",
						assets: ["fixture"],
						missingModels: [],
						unsupportedRuntime: false,
						licenseRequired: false,
						error: null,
					},
				],
			},
		},
	);

	return { app, input, artifact, assertion, runs: () => runs };
}
