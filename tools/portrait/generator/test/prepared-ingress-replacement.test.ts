import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
	parseBoundJson as legacyParse,
	PreflightError,
} from "../src/preflight.js";
import { ProjectionError, projectPortrait } from "../src/projection.js";
import {
	assertPreparedProjection,
	parseBoundJson,
} from "../src/projection-ingress.js";
import { createTransportFixture } from "./transport-fixture.js";

const bytes = (text: string) => new TextEncoder().encode(text);
const hash = (value: Uint8Array) =>
	createHash("sha256").update(value).digest("hex");
const failure = (action: () => unknown): unknown => {
	try {
		action();
	} catch (error) {
		return error;
	}
	return undefined;
};

const duplicates = [
	["nested", '{"outer":{"id":1,"id":2}}'],
	["escaped", '{"id":1,"\\u0069d":2}'],
	["after-array", '{"rows":[{"id":1},{"id":2}],"id":1,"id":2}'],
	["array-nested", '[{"inner":{"id":1,"id":2}}]'],
] as const;

describe("neutral bound JSON contract", () => {
	for (const [name, text] of duplicates) {
		test(name, () => {
			const error = failure(() => parseBoundJson(bytes(text), z.unknown()));
			expect(error).toBeInstanceOf(PreflightError);
			expect(error).toEqual(new PreflightError("DUPLICATE_JSON_KEY"));
		});
	}
	for (const [name, text, expected] of [
		["sibling keys", '[{"id":1},{"id":2}]', [{ id: 1 }, { id: 2 }]],
		[
			"string tokens",
			'{"text":"{ \\"id\\": 1, [ : }"}',
			{ text: '{ "id": 1, [ : }' },
		],
		["BOM", '\uFEFF{"id":1}', { id: 1 }],
		["primitive", "42", 42],
		["null", "null", null],
		[
			"prohibited-key scope",
			'{"prompt":1,"__proto__":2,"constructor":3}',
			JSON.parse('{"prompt":1,"__proto__":2,"constructor":3}'),
		],
	] as const) {
		test(name, () =>
			expect(parseBoundJson(bytes(text), z.unknown())).toEqual(expected),
		);
	}
	test("fatal UTF8", () =>
		expect(
			failure(() => parseBoundJson(new Uint8Array([0xc3, 0x28]), z.unknown())),
		).toBeInstanceOf(TypeError));
	test("syntax precedes duplicate scan", () =>
		expect(
			failure(() => parseBoundJson(bytes('{"id":1,"id":2,}'), z.unknown())),
		).toBeInstanceOf(SyntaxError));
	test("shape is real schema error", () =>
		expect(
			failure(() => parseBoundJson(bytes("42"), z.object({ id: z.number() }))),
		).toBeInstanceOf(z.ZodError));
	test("duplicate precedes schema", () =>
		expect(
			failure(() => parseBoundJson(bytes('{"id":1,"id":2}'), z.number())),
		).toEqual(new PreflightError("DUPLICATE_JSON_KEY")));
});

const input = () => {
	const fixture = createTransportFixture();
	return {
		candidate: fixture.candidate,
		operatorPins: fixture.operatorPins,
		prepared: {
			artifactHashes: {
				rule: fixture.operatorPins.ruleSHA,
				positionReference: fixture.operatorPins.positionReferenceSHA,
				look: fixture.operatorPins.lookSHA,
				referenceImages: fixture.operatorPins.referenceImages.map(
					(pin) => pin.sha256,
				),
			},
			positionMetrics: fixture.candidate.composition.positionMetrics,
			providerCalls: 0 as const,
			dispatched: false as const,
		},
	};
};
const mutations: [
	string,
	(value: ReturnType<typeof input>) => unknown,
	string,
][] = [
	[
		"look hash",
		(value) => ({
			...value,
			prepared: {
				...value.prepared,
				artifactHashes: {
					...value.prepared.artifactHashes,
					look: "0".repeat(64),
				},
			},
		}),
		"PREPARED_CONDITIONS_MISMATCH",
	],
	[
		"metric drift",
		(value) => ({
			...value,
			prepared: {
				...value.prepared,
				positionMetrics: {
					...value.prepared.positionMetrics,
					chinY: {
						...value.prepared.positionMetrics.chinY,
						meanMidpoint: "99",
					},
				},
			},
		}),
		"PREPARED_CONDITIONS_MISMATCH",
	],
	[
		"reference hash order",
		(value) => ({
			...value,
			prepared: {
				...value.prepared,
				artifactHashes: {
					...value.prepared.artifactHashes,
					referenceImages: [
						...value.prepared.artifactHashes.referenceImages,
					].reverse(),
				},
			},
		}),
		"PREPARED_CONDITIONS_MISMATCH",
	],
	[
		"missing prepared",
		(value) => ({
			candidate: value.candidate,
			operatorPins: value.operatorPins,
		}),
		"INVALID_PROJECTION_INPUT",
	],
	[
		"malformed hash",
		(value) => ({
			...value,
			prepared: {
				...value.prepared,
				artifactHashes: { ...value.prepared.artifactHashes, look: "bad" },
			},
		}),
		"INVALID_PROJECTION_INPUT",
	],
	[
		"dispatched true",
		(value) => ({
			...value,
			prepared: { ...value.prepared, dispatched: true },
		}),
		"INVALID_PROJECTION_INPUT",
	],
];

describe("neutral prepared ingress", () => {
	test("valid reordered object keys", () => {
		const value = input();
		const prepared = {
			dispatched: false as const,
			providerCalls: 0 as const,
			positionMetrics: Object.fromEntries(
				Object.entries(value.prepared.positionMetrics).reverse(),
			),
			artifactHashes: {
				referenceImages: value.prepared.artifactHashes.referenceImages,
				look: value.prepared.artifactHashes.look,
				positionReference: value.prepared.artifactHashes.positionReference,
				rule: value.prepared.artifactHashes.rule,
			},
		};
		expect(() =>
			assertPreparedProjection({ ...value, prepared }),
		).not.toThrow();
		expect(() => projectPortrait({ ...value, prepared })).not.toThrow();
	});
	for (const [name, change, code] of mutations) {
		test(name, () => {
			const error = failure(() => assertPreparedProjection(change(input())));
			expect(error).toBeInstanceOf(ProjectionError);
			expect(error).toEqual(
				new ProjectionError(
					code === "INVALID_PROJECTION_INPUT"
						? "INVALID_PROJECTION_INPUT"
						: "PREPARED_CONDITIONS_MISMATCH",
				),
			);
		});
		test(`consumer guard ${name}`, () => {
			const error = failure(() =>
				Reflect.apply(projectPortrait, undefined, [change(input())]),
			);
			expect(error).toBeInstanceOf(ProjectionError);
			expect(Reflect.get(Object(error), "code")).toBe(code);
		});
	}
});

const independentOracle = (value: ReturnType<typeof input>) => {
	const look: Record<string, unknown> = JSON.parse(
		new TextDecoder().decode(value.candidate.lookBytes),
	);
	const position = Object.fromEntries(
		[
			"chinY",
			"crownY",
			"headLeft",
			"headRight",
			"leftPupilX",
			"leftPupilY",
			"rightPupilX",
			"rightPupilY",
			"eyeY",
			"topGap",
			"headCenterX",
			"headCenterY",
		].map((name) => [
			name,
			{
				meanMidpoint: "12/3",
				meanInterval: ["11/3", "13/3"],
				inner: ["10/3", "14/3"],
				outer: ["9/3", "15/3"],
			},
		]),
	);
	const expected = {
		...look,
		output: {
			width: 1024,
			height: 1536,
			unit: "px",
			format: "png",
			background: "transparent",
		},
		position,
		references: [
			{
				id: "recipient",
				role: "recipient-appearance-only",
				properties: ["hair", "outfit"],
				sourceSHA: hash(new Uint8Array([1, 2, 3, 4, 5, 6])),
			},
			{
				id: "technique",
				role: "drawing-technique-only",
				properties: ["linework"],
				sourceSHA: hash(new Uint8Array([7, 8, 9])),
			},
			{
				id: "framing",
				role: "framing-only",
				properties: ["pose"],
				sourceSHA: hash(new Uint8Array([10, 11, 12])),
			},
		],
	};
	const text = `${JSON.stringify(expected, null, 2).replaceAll("\n", "\r\n")}\r\n`;
	return {
		rendering: expected,
		text,
		renderingSHA: hash(bytes(JSON.stringify(expected))),
		textSHA: hash(bytes(text)),
	};
};

for (const reordered of [false, true]) {
	test(
		reordered
			? "consumer reordered independent rendering and CRLF bytes"
			: "consumer independent rendering and CRLF bytes",
		() => {
			const value = input();
			const expected = independentOracle(value);
			const prepared = reordered
				? {
						dispatched: false as const,
						providerCalls: 0 as const,
						positionMetrics: Object.fromEntries(
							Object.entries(value.prepared.positionMetrics).reverse(),
						),
						artifactHashes: {
							referenceImages: value.prepared.artifactHashes.referenceImages,
							look: value.prepared.artifactHashes.look,
							positionReference:
								value.prepared.artifactHashes.positionReference,
							rule: value.prepared.artifactHashes.rule,
						},
					}
				: value.prepared;
			const result = projectPortrait({ ...value, prepared });
			expect(result.rendering).toEqual(expected.rendering);
			expect(JSON.parse(result.text)).toEqual(expected.rendering);
			expect(result.text).toBe(expected.text);
			expect(result.renderingSHA).toBe(expected.renderingSHA);
			expect(result.textSHA).toBe(expected.textSHA);
			expect(result.providerCalls).toBe(0);
			expect(result.dispatched).toBe(false);
		},
	);
}

for (const [name, text] of duplicates)
	test(`legacy duplicate guard ${name}`, () =>
		expect(failure(() => legacyParse(bytes(text), z.unknown()))).toEqual(
			new PreflightError("DUPLICATE_JSON_KEY"),
		));

test("emitted preflight CLI independent JSON hashes and zero requests", async () => {
	const value = input();
	const oracle = independentOracle(value);
	const directory = await mkdtemp(join(tmpdir(), "u04-cli-"));
	const requests: string[] = [];
	const server = createServer();
	server.on("request", (request, response) => {
		requests.push(request.url ?? "/");
		response.writeHead(500);
		response.end();
	});
	try {
		const listening = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("TCP address required");
		const candidate = value.candidate;
		await writeFile(join(directory, "rule.json"), candidate.ruleBytes);
		await writeFile(
			join(directory, "reference.json"),
			candidate.positionReferenceBytes,
		);
		await writeFile(join(directory, "look.json"), candidate.lookBytes);
		for (const [index, image] of candidate.referenceImages.entries())
			await writeFile(join(directory, `image-${index}.png`), image.bytes);
		const manifest = {
			rule: { path: "rule.json" },
			reference: { path: "reference.json" },
			look: { path: "look.json" },
			referenceImages: candidate.referenceImages.map(
				({ bytes: ignored, ...image }, index) => {
					void ignored;
					return { ...image, path: `image-${index}.png` };
				},
			),
			composition: candidate.composition,
		};
		await writeFile(join(directory, "manifest.json"), JSON.stringify(manifest));
		await writeFile(
			join(directory, "pins.json"),
			JSON.stringify(value.operatorPins),
		);
		await writeFile(
			join(directory, "connection.json"),
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const names = [
			"chinY",
			"crownY",
			"headLeft",
			"headRight",
			"leftPupilX",
			"leftPupilY",
			"rightPupilX",
			"rightPupilY",
			"eyeY",
			"topGap",
			"headCenterX",
			"headCenterY",
		];
		const metric = {
			sampleCount: 16,
			meanMidpoint: "12/3",
			meanInterval: ["11/3", "13/3"],
			inner: ["10/3", "14/3"],
			outer: ["9/3", "15/3"],
			measurementStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
			exactPixelCertification: false,
			passAuthority: true,
			positionReferenceAuthority: true,
			passAuthorityScope: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
		};
		const expected = {
			conditions: {
				artifactHashes: {
					rule: hash(candidate.ruleBytes),
					positionReference: hash(candidate.positionReferenceBytes),
					look: hash(candidate.lookBytes),
					referenceImages: [
						hash(new Uint8Array([1, 2, 3, 4, 5, 6])),
						hash(new Uint8Array([7, 8, 9])),
						hash(new Uint8Array([10, 11, 12])),
					],
				},
				positionMetrics: Object.fromEntries(
					names.map((name) => [name, metric]),
				),
				providerCalls: 0,
				dispatched: false,
			},
			projection: {
				textSHA: oracle.textSHA,
				renderingSHA: oracle.renderingSHA,
				providerCalls: 0,
				dispatched: false,
			},
		};
		const child = spawn(
			"node",
			[
				fileURLToPath(new URL("../dist/cli.js", import.meta.url)),
				"preflight",
				"--input",
				join(directory, "manifest.json"),
				"--pins",
				join(directory, "pins.json"),
				"--connection",
				join(directory, "connection.json"),
			],
			{ cwd: directory, stdio: ["ignore", "pipe", "pipe"] },
		);
		const closed = once(child, "close", { signal: AbortSignal.timeout(10000) });
		let stdout = "";
		let stderr = "";
		child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
			stderr += chunk;
		});
		try {
			const [code] = await closed;
			expect(code).toBe(0);
			expect(stderr).toBe("");
			expect(JSON.parse(stdout)).toEqual(expected);
			expect(stdout).toBe(`${JSON.stringify(expected)}\n`);
			expect(requests).toEqual([]);
		} finally {
			if (child.exitCode === null && child.signalCode === null) {
				const stopped = once(child, "close", {
					signal: AbortSignal.timeout(5000),
				});
				child.kill("SIGKILL");
				await stopped;
			}
		}
	} finally {
		if (server.listening) {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.close();
			server.closeAllConnections();
			await closed;
		}
		await rm(directory, { recursive: true, force: true });
	}
});
