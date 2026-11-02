import { afterAll, beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

// Independent literal inputs inherited from the accepted package contract.
// No production prepare/project/evaluator is an oracle or fixture generator.
const fixture = {
	rule: '{"schemaVersion":2,"referenceVersion":"transport-test-reference","adapterSchema":"complete-source-position-rule-adapter.v1","rawReference":{"path":"test-reference","sha256":"78a9826b85fc6cf49d6e850f90fd9bc6166d2a67aa62eaab8b172cb5b82ad2a8","ruleVersion":"transport-test-reference","sourceManifestSHA256":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","observationsSHA256":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"},"concurrence":{"path":"test-concurrence","sha256":"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"},"position":{"unit":"px","sourceCoordinateSystem":"top-left-x-right-y-down","authorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME","measurementProofStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","positionReferenceAuthority":true,"metrics":{"chinY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"crownY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headLeft":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headRight":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"leftPupilX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"leftPupilY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"rightPupilX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"rightPupilY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"eyeY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"topGap":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headCenterX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headCenterY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"}}}}',
	reference:
		'{"schema":"latest-approved16-second-observer-fixed-rules.v2","ruleVersion":"transport-test-reference","sourceManifestSHA256":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","observationsSHA256":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","sourceSetAuthority":"OWNER_RATIFIED_EXACT16","measurementProofStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","framePassAuthority":false,"canvas":[1024,1536],"formulas":{},"metrics":{"chinY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"crownY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headLeft":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headRight":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"leftPupilX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"leftPupilY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"rightPupilX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"rightPupilY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"eyeY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"topGap":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headCenterX":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"headCenterY":{"sampleCount":16,"meanMidpoint":"12/3","meanInterval":["11/3","13/3"],"inner":["10/3","14/3"],"outer":["9/3","15/3"],"measurementStatus":"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS","exactPixelCertification":false,"passAuthority":true,"positionReferenceAuthority":true,"passAuthorityScope":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"}},"rows":[{"id":"source-0"},{"id":"source-1"},{"id":"source-2"},{"id":"source-3"},{"id":"source-4"},{"id":"source-5"},{"id":"source-6"},{"id":"source-7"},{"id":"source-8"},{"id":"source-9"},{"id":"source-10"},{"id":"source-11"},{"id":"source-12"},{"id":"source-13"},{"id":"source-14"},{"id":"source-15"}],"sourceCutPolicy":null,"positionReferenceAuthority":true,"positionMeasurementGaps":[],"authorityScope":{"position":"POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"},"cutAuthority":"FAIL","backgroundAuthority":"UNVERIFIED"}',
	look: '{"schemaVersion":2,"characterId":"test-recipient","name":"Recipient","lookId":"authored-test-look","faceMode":{"kind":"unique","variantId":null},"identity":{"characterId":"test-recipient","name":"Recipient"},"slots":{"face":{"description":{"value":"oval","status":"authored-draft","source":"portrait-tokens/test-recipient.json"},"faceShape":{"value":null,"status":"unknown","source":null},"eyeColor":{"value":null,"status":"unknown","source":null},"eyeShape":{"value":null,"status":"unknown","source":null},"eyebrowShape":{"value":null,"status":"unknown","source":null},"lipColor":{"value":null,"status":"unknown","source":null},"mouthShape":{"value":null,"status":"unknown","source":null},"noseShape":{"value":null,"status":"unknown","source":null},"beardShape":{"value":null,"status":"unknown","source":null}},"hair":{"description":{"value":null,"status":"unknown","source":null},"shape":{"value":null,"status":"unknown","source":null},"color":{"value":null,"status":"unknown","source":null},"length":{"value":null,"status":"unknown","source":null}},"body":{"build":{"value":null,"status":"unknown","source":null},"weight":{"value":60,"status":"approved","source":"portrait-tokens/test-recipient.json","unit":"kg"},"bustSize":{"value":null,"status":"unknown","source":null},"height":{"value":170,"status":"approved","source":"portrait-tokens/test-recipient.json","unit":"cm"},"skin":{"value":null,"status":"unknown","source":null}},"outfit":{"headwear":{"value":null,"status":"unknown","source":null},"upper":{"value":null,"status":"unknown","source":null},"lower":{"value":null,"status":"unknown","source":null},"footwear":{"value":null,"status":"unknown","source":null},"marks":{"value":null,"status":"unknown","source":null},"neckline":{"value":null,"status":"unknown","source":null}},"accessories":{"description":{"value":null,"status":"unknown","source":null},"shape":{"value":null,"status":"unknown","source":null},"color":{"value":null,"status":"unknown","source":null},"material":{"value":null,"status":"unknown","source":null},"mounting":{"value":null,"status":"unknown","source":null}}}}',
	images: [
		{
			id: "recipient",
			role: "recipient-appearance-only",
			sameOwnerRecipient: true,
			allowedProperties: ["hair", "outfit"],
			sourceHash:
				"7192385c3c0605de55bb9476ce1d90748190ecb32a8eed7f5207b30cf6a1fe89",
			path: "image-0.png",
			bytes: [1, 2, 3, 4, 5, 6],
		},
		{
			id: "technique",
			role: "drawing-technique-only",
			allowedProperties: ["linework"],
			path: "image-1.png",
			bytes: [7, 8, 9],
		},
		{
			id: "framing",
			role: "framing-only",
			allowedProperties: ["pose"],
			path: "image-2.png",
			bytes: [10, 11, 12],
		},
	],
	composition: {
		frameContractVersion: "position-reference.v2",
		cameraContractId: "portrait-camera-v2",
		mode: "portrait",
		coordinatedHeadTorso: true,
		viewerRight: true,
		gazeCamera: true,
		fullHeadShoulderConstraints: true,
		referenceVersion: "transport-test-reference",
		referenceSHA:
			"78a9826b85fc6cf49d6e850f90fd9bc6166d2a67aa62eaab8b172cb5b82ad2a8",
		ruleSHA: "50560730ae063c9d98ca5e4f4df34b80502af6dc0de0e9eba0d9e1d52335d86e",
		unit: "px",
		positionMetrics: {
			chinY: {
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
			},
			crownY: {
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
			},
			headLeft: {
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
			},
			headRight: {
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
			},
			leftPupilX: {
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
			},
			leftPupilY: {
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
			},
			rightPupilX: {
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
			},
			rightPupilY: {
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
			},
			eyeY: {
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
			},
			topGap: {
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
			},
			headCenterX: {
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
			},
			headCenterY: {
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
			},
		},
		measuredFrameGuide: {
			sourceHash:
				"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
			metadataSHA:
				"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			landmarkBinding:
				"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			canvas: [1024, 1536],
		},
		wholeFramePassAuthority: false,
		referencePrecedence: "exact position metrics only",
	},
	pins: {
		ruleSHA: "50560730ae063c9d98ca5e4f4df34b80502af6dc0de0e9eba0d9e1d52335d86e",
		positionReferenceSHA:
			"78a9826b85fc6cf49d6e850f90fd9bc6166d2a67aa62eaab8b172cb5b82ad2a8",
		lookSHA: "82e6d5f9d9b0b365df27575ce6e75f030f74cf41ae6162d0e3e6b2633e3aab4e",
		referenceImages: [
			{
				id: "recipient",
				sha256:
					"7192385c3c0605de55bb9476ce1d90748190ecb32a8eed7f5207b30cf6a1fe89",
			},
			{
				id: "technique",
				sha256:
					"66a6757151f8ee55db127716c7e3dce0be8074b64e20eda542e5c1e46ca9c41e",
			},
			{
				id: "framing",
				sha256:
					"9909ec831e2cf6d0c73fb5480f31945a80987a13faee005704166cb53a26ceca",
			},
		],
	},
	expected: {
		textSHA: "bf79d322386326ce3e9c059def874a6a731c7c732f9bc4871c424705dbed13d1",
		renderingSHA:
			"6680bdae605ec36e3fbde84569a40e39f71b00c120955c5c2f30fe4fbdd39e27",
		providerCalls: 0,
		dispatched: false,
	},
};

const hash = (value: string | Uint8Array): string =>
	createHash("sha256").update(value).digest("hex");
const json = (value: unknown): string => JSON.stringify(value);
const bound = () => ({ signal: AbortSignal.timeout(15000) });
const packageDirectory = join(import.meta.dir, "..");
const helper = join(import.meta.dir, "helpers/command-ingress-cli.ts");
let buildDirectory = "";
let emitted = "";
let binary = "";
type Consumer = Readonly<{
	name: string;
	command: string;
	prefix: readonly string[];
}>;
const consumers: Consumer[] = [];
async function run(
	command: string,
	args: readonly string[],
	cwd: string,
	env: NodeJS.ProcessEnv = process.env,
	stdin = "",
) {
	const child = spawn(command, args, {
		cwd,
		env,
		stdio: ["pipe", "pipe", "pipe"],
	});
	const closed = once(child, "close", bound());
	let stdout = "",
		stderr = "";
	child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
		stdout += chunk;
	});
	child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
		stderr += chunk;
	});
	child.stdin.end(stdin);
	try {
		const [code] = await closed;
		const result = {
			code: typeof code === "number" ? code : null,
			stdout,
			stderr,
		};
		console.log(json({ command, args, cwd, ...result }));
		return result;
	} finally {
		if (child.exitCode === null && child.signalCode === null) {
			const stopped = once(child, "close", bound());
			child.kill("SIGKILL");
			await stopped;
		}
	}
}
beforeAll(async () => {
	buildDirectory = await mkdtemp(join(tmpdir(), "u05 candidate entry "));
	emitted = join(buildDirectory, "command.mjs");
	binary = join(buildDirectory, "portrait-command");
	const build = await Bun.build({
		entrypoints: [helper],
		target: "node",
		format: "esm",
		define: { "import.meta.main": "false" },
	});
	expect(build.success).toBe(true);
	const output = build.outputs[0];
	if (!output) throw new Error("No candidate emitted output");
	await writeFile(emitted, await output.text());
	expect(
		await run(
			"bun",
			["build", helper, "--compile", "--outfile", binary],
			packageDirectory,
		),
	).toMatchObject({ code: 0, stderr: "" });
	consumers.push(
		{ name: "Bun source candidate", command: "bun", prefix: [helper] },
		{ name: "Node emitted candidate", command: "node", prefix: [emitted] },
		{ name: "standalone candidate", command: binary, prefix: [] },
		{
			name: "shipped Node parity",
			command: "node",
			prefix: [join(packageDirectory, "dist/cli.js")],
		},
	);
}, 30000);
afterAll(async () => {
	if (buildDirectory) await rm(buildDirectory, { recursive: true });
});

function png(): Buffer {
	const crc = (bytes: Uint8Array) => {
		let value = 0xffffffff;
		for (const byte of bytes) {
			value ^= byte;
			for (let i = 0; i < 8; i++)
				value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
		}
		return (value ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Uint8Array) => {
		const bytes = Buffer.alloc(12 + data.length);
		bytes.writeUInt32BE(data.length);
		bytes.write(type, 4);
		bytes.set(data, 8);
		bytes.writeUInt32BE(
			crc(bytes.subarray(4, 8 + data.length)),
			8 + data.length,
		);
		return bytes;
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024);
	header.writeUInt32BE(1536, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const rows = Buffer.alloc(1536 * (1 + 1024 * 4));
	rows.set([80, 100, 120, 255], 500 * (1 + 1024 * 4) + 1 + 500 * 4);
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(rows)),
		chunk("IEND", Buffer.alloc(0)),
	]);
}
const image = png();
const imageSHA = hash(image);
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (value !== null && typeof value === "object")
		return (
			"{" +
			Object.keys(value)
				.sort()
				.map((key) => `${json(key)}:${canonical(Reflect.get(value, key))}`)
				.join(",") +
			"}"
		);
	return json(value);
}
const observation = {
	imageSHA,
	actualImageMeasured: true,
	canvas: [1024, 1536],
	bodyType: "u05-technical-fixture",
	landmarks: {
		crown: [512, 100],
		chin: [512, 500],
		headLeft: [412, 300],
		headRight: [612, 300],
		faceTop: [512, 160],
		faceLeft: [452, 300],
		faceRight: [572, 300],
		leftPupil: [472, 260],
		rightPupil: [552, 260],
		leftShoulder: [362, 560],
		rightShoulder: [662, 560],
		torsoLeft: [412, 620],
		torsoRight: [612, 620],
	},
};
const measurement = json(observation);
const profilePayload = {
	schema: "portrait-proportion-profile.v1",
	canvas: [1024, 1536],
	bodyType: "u05-technical-fixture",
	commonSourceSHA: imageSHA,
	bodySourceSHA: imageSHA,
	commonMeasurementSHA: hash(measurement),
	bodyMeasurementSHA: hash(measurement),
	targets: {
		headWidth: 200,
		headHeight: 400,
		faceWidth: 120,
		faceHeight: 340,
		eyeY: 260,
		headCenterX: 512,
		crownY: 100,
	},
	ratios: { shoulderToHead: 1.5, torsoToHead: 1 },
	tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: hash(measurement) },
};
const profile = {
	...profilePayload,
	profileSHA: hash(canonical(profilePayload)),
};
const evidence =
	"U05 independent technical evidence, not owner or release approval";
const authority = {
	referenceVersion: "u05-fixture",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const review = {
	characterId: "U05",
	requestId: "previous-u05",
	sha256: imageSHA,
	actualImageViewed: true,
	technicalVerdict: "pass",
	acceptanceSchema: "portrait-integrated-acceptance.v1",
	positionReference: authority,
	criteria: Object.fromEntries(
		[
			"Q01",
			"Q02",
			"Q03",
			"Q04",
			"Q05",
			"Q06",
			"Q07",
			"Q08",
			"Q09",
			"Q10",
			"authoredIdentity",
			"approvedPositionIntervals",
			"opaqueInterior",
			"naturalSilhouette",
			"defringe",
		].map((name) => [
			name,
			{
				verdict: "pass",
				scope: "whole-image",
				imageSHA,
				evidenceSHA: hash(evidence),
			},
		]),
	),
	evidence: [{ path: "evidence.bin", sha256: hash(evidence) }],
};
const manifest = {
	rule: { path: "rule.json" },
	reference: { path: "reference.json" },
	look: { path: "look.json" },
	referenceImages: fixture.images.map(({ bytes, ...descriptor }) => {
		void bytes;
		return descriptor;
	}),
	composition: fixture.composition,
};
const rendering = {
	...JSON.parse(fixture.look),
	output: {
		width: 1024,
		height: 1536,
		unit: "px",
		format: "png",
		background: "transparent",
	},
	position: Object.fromEntries(
		Object.keys(fixture.composition.positionMetrics).map((name) => [
			name,
			{
				meanMidpoint: "12/3",
				meanInterval: ["11/3", "13/3"],
				inner: ["10/3", "14/3"],
				outer: ["9/3", "15/3"],
			},
		]),
	),
	references: fixture.images.map((item, index) => ({
		id: item.id,
		role: item.role,
		properties: item.allowedProperties,
		sourceSHA: fixture.pins.referenceImages[index]?.sha256,
	})),
};
const text = `${JSON.stringify(rendering, null, 2).replaceAll("\n", "\r\n")}\r\n`;
const expectedPreflight = {
	conditions: {
		artifactHashes: {
			rule: fixture.pins.ruleSHA,
			positionReference: fixture.pins.positionReferenceSHA,
			look: fixture.pins.lookSHA,
			referenceImages: fixture.pins.referenceImages.map((item) => item.sha256),
		},
		positionMetrics: fixture.composition.positionMetrics,
		providerCalls: 0,
		dispatched: false,
	},
	projection: fixture.expected,
};
const usage =
	"Usage: portrait-generator preflight --input <manifest.json> --pins <operator-pins.json>\n       portrait-generator generate --input <manifest.json> --pins <operator-pins.json> --connection <connection.json> --request-id <id> --output <portrait.png>\n       portrait-generator generate-reviewed --input <manifest.json> --pins <next-operator-pins.json> --connection <connection.json> --request-id <id> --output <portrait.png> --previous <terminal.json> --review <review.json> --profile <profile.json> --profile-sha <sha256> --measurement <measurement.json> --position-reference <authority-triple.json>\n       portrait-generator --help\n";
type Wire = {
	method: string | undefined;
	url: string | undefined;
	authorization: string | undefined;
	contentType: string | undefined;
	body: Buffer;
};
async function withFixture(
	action: (f: Awaited<ReturnType<typeof fixtureFiles>>) => Promise<void>,
) {
	const f = await fixtureFiles();
	try {
		await action(f);
	} finally {
		const closed = once(f.server, "close", bound());
		f.server.closeAllConnections();
		f.server.close();
		await closed;
		await rm(f.root, { recursive: true });
	}
}
async function fixtureFiles() {
	const root = await mkdtemp(join(tmpdir(), "u05 real command "));
	const path = (name: string) => join(root, name);
	const requests: Wire[] = [];
	const server = createServer((request, response) => {
		const chunks: Buffer[] = [];
		request.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});
		request.on("end", () => {
			requests.push({
				method: request.method,
				url: request.url,
				authorization: request.headers.authorization,
				contentType: request.headers["content-type"],
				body: Buffer.concat(chunks),
			});
			response.writeHead(200, { "content-type": "application/json" });
			response.end(json({ data: [{ b64_json: image.toString("base64") }] }));
		});
	});
	const listening = once(server, "listening", bound());
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("TCP fixture required");
	const connection = {
		baseUrl: `http://127.0.0.1:${address.port}`,
		apiKeyEnv: "U05_TEST_KEY",
	};
	await Promise.all([
		...(["rule", "reference", "look"] as const).map((name) =>
			writeFile(path(`${name}.json`), fixture[name]),
		),
		...fixture.images.map((item) =>
			writeFile(path(item.path), new Uint8Array(item.bytes)),
		),
		writeFile(path("manifest.json"), json(manifest)),
		writeFile(path("pins.json"), json(fixture.pins)),
		writeFile(path("connection.json"), json(connection)),
		writeFile(path("previous.png"), image),
		writeFile(
			path("terminal.json"),
			json({
				id: "U05",
				requestId: "previous-u05",
				status: "COMPLETED",
				result: { path: "previous.png" },
			}),
		),
		writeFile(path("review.json"), json(review)),
		writeFile(path("profile.json"), json(profile)),
		writeFile(path("measurement.json"), measurement),
		writeFile(path("authority.json"), json(authority)),
		writeFile(path("evidence.bin"), evidence),
	]);
	const preflight = [
		"preflight",
		"--input",
		path("manifest.json"),
		"--pins",
		path("pins.json"),
	];
	const generate = [
		"generate",
		"--input",
		path("manifest.json"),
		"--pins",
		path("pins.json"),
		"--connection",
		path("connection.json"),
		"--request-id",
		"u05-exact-request",
		"--output",
		path("next.png"),
	];
	const reviewed = [...generate];
	reviewed[0] = "generate-reviewed";
	reviewed.push(
		"--previous",
		path("terminal.json"),
		"--review",
		path("review.json"),
		"--profile",
		path("profile.json"),
		"--profile-sha",
		hash(json(profile)),
		"--measurement",
		path("measurement.json"),
		"--position-reference",
		path("authority.json"),
	);
	return {
		root,
		path,
		requests,
		server,
		connection,
		preflight,
		generate,
		reviewed,
	};
}
type Fixture = Awaited<ReturnType<typeof fixtureFiles>>;
const env = {
	...process.env,
	U05_TEST_KEY: "u05-local-secret",
	U05_EMPTY_KEY: "",
};
async function invoke(c: Consumer, f: Fixture, args: readonly string[]) {
	const result = await run(c.command, [...c.prefix, ...args], f.root, env);
	console.log(
		json({ consumer: c.name, args, result, requests: f.requests.length }),
	);
	return result;
}
async function absent(f: Fixture) {
	for (const suffix of ["", ".request.json", ".receipt.json"])
		await expect(readFile(f.path(`next.png${suffix}`))).rejects.toMatchObject({
			code: "ENOENT",
		});
	expect(f.requests).toEqual([]);
}
async function checkGeneration(c: Consumer, f: Fixture, args: string[]) {
	// Subscribe before invocation; subprocess close is the exact no-request neutral endpoint.
	const controller = new AbortController();
	const requested = once(f.server, "request", {
		signal: controller.signal,
	}).then(
		() => true,
		() => false,
	);
	try {
		const action = invoke(c, f, args);
		await Promise.race([requested, action]);
		expect(await action).toEqual({ code: 0, stdout: "", stderr: "" });
		expect(f.requests).toHaveLength(1);
		const wire = f.requests[0];
		if (!wire) throw new Error("Expected one portrait request");
		expect(wire.method).toBe("POST");
		expect(wire.url).toBe("/images/edits");
		expect(wire.authorization).toBe("Bearer u05-local-secret");
		const form = await new Response(wire.body, {
			headers: { "content-type": wire.contentType ?? "" },
		}).formData();
		expect([...form.keys()]).toEqual([
			"model",
			"prompt",
			"size",
			"n",
			"image[]",
			"image[]",
			"image[]",
		]);
		expect(form.get("model")).toBe("gpt-image-2.5-sunburst");
		expect(form.get("prompt")).toBe(text);
		expect(form.get("size")).toBe("1024x1536");
		expect(form.get("n")).toBe("1");
		const images = form.getAll("image[]");
		for (const [index, expected] of fixture.images.entries()) {
			const file = images[index];
			if (!(file instanceof File)) throw new Error("Multipart image missing");
			expect(file.name).toBe(`reference-${index + 1}.png`);
			expect(Buffer.from(await file.arrayBuffer())).toEqual(
				Buffer.from(expected.bytes),
			);
		}
		expect(new Uint8Array(await readFile(f.path("next.png")))).toEqual(
			new Uint8Array(image),
		);
		const record = {
			requestId: "u05-exact-request",
			model: "gpt-image-2.5-sunburst",
			prompt: text,
			rendering,
			textSHA: fixture.expected.textSHA,
			renderingSHA: fixture.expected.renderingSHA,
			sourceSHA: fixture.pins.lookSHA,
			referenceHashes: fixture.pins.referenceImages.map((pin) => pin.sha256),
			referenceImages: fixture.images.map((item) =>
				Buffer.from(item.bytes).toString("base64"),
			),
		};
		expect(await readFile(f.path("next.png.request.json"), "utf8")).toBe(
			`${JSON.stringify(record, null, 2)}\n`,
		);
		expect(await readFile(f.path("next.png.receipt.json"), "utf8")).toBe(
			`${JSON.stringify(
				{
					...record,
					status: 200,
					responseSHA: imageSHA,
					reviewStatus: "candidate-unreviewed",
				},
				null,
				2,
			)}\n`,
		);
	} finally {
		controller.abort();
		await requested;
	}
}

type Negative = {
	name: string;
	code: string;
	change: (f: Fixture) => Promise<string[]>;
};
const negatives: Negative[] = [
	{ name: "no command", code: "INVALID_ARGUMENTS", change: async () => [] },
	{
		name: "unknown command",
		code: "INVALID_ARGUMENTS",
		change: async () => ["unknown"],
	},
	{
		name: "unknown flag",
		code: "INVALID_ARGUMENTS",
		change: async (f) => [...f.preflight, "--unknown", "x"],
	},
	{
		name: "duplicate input",
		code: "INVALID_ARGUMENTS",
		change: async (f) => [...f.preflight, "--input", f.path("manifest.json")],
	},
	{
		name: "odd flag",
		code: "INVALID_ARGUMENTS",
		change: async (f) => [...f.preflight, "--output"],
	},
	{
		name: "help trailing",
		code: "INVALID_ARGUMENTS",
		change: async () => ["--help", "extra"],
	},
	{
		name: "request begins flag",
		code: "INVALID_ARGUMENTS",
		change: async (f) =>
			f.generate.map((x) => (x === "u05-exact-request" ? "--bad" : x)),
	},
	{
		name: "missing manifest",
		code: "FILE_READ_FAILED",
		change: async (f) =>
			f.preflight.map((x) =>
				x === f.path("manifest.json") ? f.path("absent.json") : x,
			),
	},
	{
		name: "directory manifest",
		code: "FILE_READ_FAILED",
		change: async (f) =>
			f.preflight.map((x) => (x === f.path("manifest.json") ? f.root : x)),
	},
	{
		name: "malformed manifest",
		code: "INVALID_JSON",
		change: async (f) => {
			await writeFile(f.path("manifest.json"), "{");
			return f.preflight;
		},
	},
	{
		name: "UTF8 manifest",
		code: "INVALID_JSON",
		change: async (f) => {
			await writeFile(f.path("manifest.json"), new Uint8Array([0xc3, 0x28]));
			return f.preflight;
		},
	},
	{
		name: "duplicate manifest key",
		code: "DUPLICATE_JSON_KEY",
		change: async (f) => {
			await writeFile(f.path("manifest.json"), '{"rule":1,"rule":2}');
			return f.preflight;
		},
	},
	{
		name: "manifest shape",
		code: "INVALID_MANIFEST",
		change: async (f) => {
			await writeFile(f.path("manifest.json"), "{}");
			return f.preflight;
		},
	},
	{
		name: "manifest strict extra",
		code: "INVALID_MANIFEST",
		change: async (f) => {
			await writeFile(
				f.path("manifest.json"),
				json({ ...manifest, extra: true }),
			);
			return f.preflight;
		},
	},
	{
		name: "missing asset",
		code: "FILE_READ_FAILED",
		change: async (f) => {
			await rm(f.path("look.json"));
			return f.preflight;
		},
	},
	{
		name: "wrong look pin",
		code: "ARTIFACT_HASH_MISMATCH",
		change: async (f) => {
			await writeFile(
				f.path("pins.json"),
				json({ ...fixture.pins, lookSHA: "0".repeat(64) }),
			);
			return f.preflight;
		},
	},
	{
		name: "pins shape",
		code: "OPERATOR_PIN_MISMATCH",
		change: async (f) => {
			await writeFile(f.path("pins.json"), "{}");
			return f.preflight;
		},
	},
	{
		name: "artifact composition",
		code: "INVALID_ARTIFACT",
		change: async (f) => {
			await writeFile(
				f.path("manifest.json"),
				json({ ...manifest, composition: {} }),
			);
			return f.preflight;
		},
	},
	{
		name: "malformed connection",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(f.path("connection.json"), "{}");
			return f.generate;
		},
	},
	{
		name: "literal credential forbidden",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, apiKey: "literal" }),
			);
			return f.generate;
		},
	},
	{
		name: "invalid env identifier",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, apiKeyEnv: "bad-key" }),
			);
			return f.generate;
		},
	},
	{
		name: "unavailable env key",
		code: "MISSING_API_KEY",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, apiKeyEnv: "U05_DEFINITELY_ABSENT" }),
			);
			return f.generate;
		},
	},
	{
		name: "empty env key",
		code: "MISSING_API_KEY",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, apiKeyEnv: "U05_EMPTY_KEY" }),
			);
			return f.generate;
		},
	},
	{
		name: "URL user info",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, baseUrl: "http://name:secret@127.0.0.1" }),
			);
			return f.generate;
		},
	},
	{
		name: "URL query",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, baseUrl: `${f.connection.baseUrl}?x=1` }),
			);
			return f.generate;
		},
	},
	{
		name: "remote HTTP",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ ...f.connection, baseUrl: "http://example.invalid" }),
			);
			return f.generate;
		},
	},
	{
		name: "loopback lacks opt-in",
		code: "INVALID_CONNECTION",
		change: async (f) => {
			await writeFile(
				f.path("connection.json"),
				json({ baseUrl: f.connection.baseUrl }),
			);
			return f.generate;
		},
	},
];
for (const flag of [
	"--input",
	"--pins",
	"--connection",
	"--request-id",
	"--output",
	"--previous",
	"--review",
	"--profile",
	"--profile-sha",
	"--measurement",
	"--position-reference",
]) {
	negatives.push({
		name: `empty ${flag}`,
		code: "INVALID_ARGUMENTS",
		change: async (f) =>
			[
				...f.preflight,
				...(flag === "--input" || flag === "--pins" ? [] : [flag, ""]),
			].map((value, index, array) =>
				index > 0 && array[index - 1] === flag ? "" : value,
			),
	});
	negatives.push({
		name: `duplicate ${flag}`,
		code: "INVALID_ARGUMENTS",
		change: async (f) => [...f.reviewed, flag, "x"],
	});
	if (flag !== "--profile-sha" && flag !== "--pins")
		negatives.push({
			name: `missing reviewed ${flag}`,
			code: "INVALID_ARGUMENTS",
			change: async (f) => {
				const index = f.reviewed.indexOf(flag);
				return f.reviewed.filter((_, i) => i !== index && i !== index + 1);
			},
		});
}
for (const descriptor of ["rule", "reference", "look", "image"]) {
	for (const value of [
		"/absolute.json",
		"../outside.json",
		"..\\outside.json",
		".",
	]) {
		negatives.push({
			name: `${descriptor} confined ${value}`,
			code: "INVALID_MANIFEST_PATH",
			change: async (f) => {
				const changed = structuredClone(manifest);
				if (descriptor === "image") {
					const item = changed.referenceImages[0];
					if (!item) throw new Error("reference fixture absent");
					item.path = value;
				} else Reflect.set(changed, descriptor, { path: value });
				await writeFile(f.path("manifest.json"), json(changed));
				return f.preflight;
			},
		});
	}
}
const holds: Negative[] = [
	{
		name: "unknown terminal",
		code: "TERMINAL_RECONCILIATION_REQUIRED",
		change: async (f) => {
			await writeFile(
				f.path("terminal.json"),
				json({
					id: "U05",
					requestId: "previous-u05",
					status: "DISPATCHED_RESPONSE_UNKNOWN",
				}),
			);
			return f.reviewed;
		},
	},
	{
		name: "failed terminal",
		code: "TERMINAL_RECONCILIATION_REQUIRED",
		change: async (f) => {
			await writeFile(
				f.path("terminal.json"),
				json({ id: "U05", requestId: "previous-u05", status: "FAILED" }),
			);
			return f.reviewed;
		},
	},
	{
		name: "missing terminal result",
		code: "TERMINAL_RECONCILIATION_REQUIRED",
		change: async (f) => {
			await writeFile(
				f.path("terminal.json"),
				json({ id: "U05", requestId: "previous-u05" }),
			);
			return f.reviewed;
		},
	},
	{
		name: "missing next pins",
		code: "OPERATOR_PINS_REQUIRED",
		change: async (f) => {
			const index = f.reviewed.indexOf("--pins");
			return f.reviewed.filter((_, i) => i !== index && i !== index + 1);
		},
	},
	{
		name: "missing profile pin",
		code: "OPERATOR_PINS_REQUIRED",
		change: async (f) => {
			const index = f.reviewed.indexOf("--profile-sha");
			return f.reviewed.filter((_, i) => i !== index && i !== index + 1);
		},
	},
	{
		name: "wrong authority",
		code: "ACCEPTANCE_FAILED",
		change: async (f) => {
			await writeFile(
				f.path("authority.json"),
				json({ ...authority, referenceSHA: "c".repeat(64) }),
			);
			return f.reviewed;
		},
	},
	{
		name: "authority extra key",
		code: "INVALID_INPUT",
		change: async (f) => {
			await writeFile(
				f.path("authority.json"),
				json({ ...authority, extra: true }),
			);
			return f.reviewed;
		},
	},
	{
		name: "wrong profile pin",
		code: "PROFILE_PIN_MISMATCH",
		change: async (f) =>
			f.reviewed.map((x) => (x === hash(json(profile)) ? "f".repeat(64) : x)),
	},
	{
		name: "failed review",
		code: "ACCEPTANCE_FAILED",
		change: async (f) => {
			await writeFile(
				f.path("review.json"),
				json({
					...review,
					criteria: {
						...review.criteria,
						naturalSilhouette: {
							verdict: "fail",
							scope: "whole-image",
							imageSHA,
							evidenceSHA: hash(evidence),
						},
					},
				}),
			);
			return f.reviewed;
		},
	},
	{
		name: "missing review",
		code: "INVALID_ARTIFACT",
		change: async (f) => {
			await rm(f.path("review.json"));
			return f.reviewed;
		},
	},
];
for (const [index, name] of [
	"Bun source candidate",
	"Node emitted candidate",
	"standalone candidate",
	"shipped Node parity",
].entries()) {
	const consumer = () => {
		const c = consumers[index];
		if (!c) throw new Error("Consumer was not built");
		return c;
	};
	test(`${name} help full stream`, () =>
		withFixture(async (f) =>
			expect(await invoke(consumer(), f, ["--help"])).toEqual({
				code: 0,
				stdout: usage,
				stderr: "",
			}),
		));
	test(`${name} preflight exact full JSON`, () =>
		withFixture(async (f) => {
			expect(hash(text)).toBe(fixture.expected.textSHA);
			expect(hash(json(rendering))).toBe(fixture.expected.renderingSHA);
			expect(await invoke(consumer(), f, f.preflight)).toEqual({
				code: 0,
				stdout: `${json(expectedPreflight)}\n`,
				stderr: "",
			});
			await absent(f);
		}));
	test(`${name} preflight ignores unrelated known flags`, () =>
		withFixture(async (f) => {
			const args = [
				...f.preflight,
				"--connection",
				"absent",
				"--request-id",
				"--accepted",
				"--output",
				"absent",
				"--previous",
				"absent",
				"--review",
				"absent",
				"--profile",
				"absent",
				"--profile-sha",
				"not-a-sha",
				"--measurement",
				"absent",
				"--position-reference",
				"absent",
			];
			expect(await invoke(consumer(), f, args)).toEqual({
				code: 0,
				stdout: `${json(expectedPreflight)}\n`,
				stderr: "",
			});
			await absent(f);
		}));
	test(`${name} generate exactly one request and original PNG`, () =>
		withFixture((f) => checkGeneration(consumer(), f, f.generate)));
	test(`${name} reviewed PASS exactly one unreviewed next candidate`, () =>
		withFixture((f) => checkGeneration(consumer(), f, f.reviewed)));
	for (const item of [...negatives, ...holds])
		test(`${name} ${item.name}`, () =>
			withFixture(async (f) => {
				const args = await item.change(f);
				expect(await invoke(consumer(), f, args)).toEqual({
					code: 1,
					stdout: "",
					stderr: `${item.code}: ${item.code}\n`,
				});
				await absent(f);
			}));
}
for (const runtime of ["node", "bun"])
	for (const surface of ["source", "emitted"])
		for (const mode of ["eval", "stdin"])
			test(`${runtime} ${surface} ${mode} silent module import`, async () => {
				const entry =
					surface === "source"
						? join(packageDirectory, "src/command-runner.ts")
						: emitted;
				const script = `await import(${json(pathToFileURL(entry).href)})`;
				const args =
					mode === "eval"
						? ["--input-type=module", "--eval", script]
						: runtime === "bun"
							? ["--input-type=module", "-"]
							: ["--input-type=module"];
				expect(
					await run(
						runtime,
						args,
						buildDirectory,
						process.env,
						mode === "stdin" ? script : "",
					),
				).toEqual({ code: 0, stdout: "", stderr: "" });
			});

// V3 additions preserve all original 364 cases and exercise the actual wrappers.
const v3NodeRuntimes = [
	{
		name: "Node 24.19",
		command:
			"/Users/ilseoblee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
	},
	{ name: "Node 26.4", command: "/opt/homebrew/bin/node" },
];
const v3ImportSurfaces = [
	...v3NodeRuntimes.flatMap((runtime) => [
		{ ...runtime, owner: "candidate emitted", entry: () => emitted },
		{
			...runtime,
			owner: "shipped emitted",
			entry: () => join(packageDirectory, "dist/cli.js"),
		},
	]),
	{
		name: "Bun",
		command: "bun",
		owner: "candidate source",
		entry: () => helper,
	},
	{
		name: "Bun",
		command: "bun",
		owner: "shipped source",
		entry: () => join(packageDirectory, "src/cli.ts"),
	},
];
for (const surface of v3ImportSurfaces) {
	for (const mode of [
		"-e positional help",
		"--eval= positional preflight",
		"-e rewritten generate",
		"explicit stdin help",
		"explicit stdin rewritten generate",
	]) {
		test(`V3 ${surface.name} ${surface.owner} import ${mode}`, () =>
			withFixture(async (f) => {
				const entry = surface.entry();
				const tail = mode.includes("help")
					? ["--help"]
					: mode.includes("preflight")
						? f.preflight
						: f.generate;
				const script = `${mode.includes("rewritten") ? `process.argv=[process.execPath,${json(entry)},...${json(tail)}];` : ""}await import(${json(pathToFileURL(entry).href)});`;
				const args = mode.startsWith("explicit")
					? ["--input-type=module", "-", entry, ...tail]
					: mode.startsWith("--eval=")
						? ["--input-type=module", `--eval=${script}`, entry, ...tail]
						: ["--input-type=module", "-e", script, entry, ...tail];
				const controller = new AbortController();
				const requested = once(f.server, "request", {
					signal: controller.signal,
				}).then(
					() => true,
					() => false,
				);
				try {
					const result = await run(
						surface.command,
						args,
						f.root,
						env,
						mode.startsWith("explicit") ? script : "",
					);
					console.log(
						json({
							v3: surface.name,
							owner: surface.owner,
							mode,
							entry,
							result,
							requests: f.requests.length,
						}),
					);
					// No request/file assertion is hidden by a preceding stream assertion.
					await absent(f);
					expect(result).toEqual({ code: 0, stdout: "", stderr: "" });
				} finally {
					controller.abort();
					await requested;
				}
			}));
	}
}
const v3DirectSurfaces = [
	...v3NodeRuntimes.flatMap((runtime) => [
		{ ...runtime, owner: "candidate emitted", prefix: () => ["--", emitted] },
		{
			...runtime,
			owner: "shipped emitted",
			prefix: () => ["--", join(packageDirectory, "dist/cli.js")],
		},
	]),
	{
		name: "standalone",
		command: () => binary,
		owner: "candidate compiled",
		prefix: () => [],
	},
	{
		name: "standalone",
		command: () => join(packageDirectory, "dist/portrait-generator"),
		owner: "shipped compiled",
		prefix: () => [],
	},
];
for (const surface of v3DirectSurfaces)
	for (const mode of ["help", "invalid command", "preflight", "generate"]) {
		test(`V3 ${surface.name} ${surface.owner} direct separator ${mode}`, () =>
			withFixture(async (f) => {
				const command =
					typeof surface.command === "string"
						? surface.command
						: surface.command();
				const c: Consumer = {
					name: `${surface.name} ${surface.owner}`,
					command,
					prefix: surface.prefix(),
				};
				if (mode === "generate") return checkGeneration(c, f, f.generate);
				const args =
					mode === "help"
						? ["--help"]
						: mode === "invalid command"
							? ["not-a-command"]
							: f.preflight;
				const result = await invoke(c, f, args);
				await absent(f);
				expect(result).toEqual(
					mode === "invalid command"
						? {
								code: 1,
								stdout: "",
								stderr: "INVALID_ARGUMENTS: INVALID_ARGUMENTS\n",
							}
						: {
								code: 0,
								stdout:
									mode === "help" ? usage : `${json(expectedPreflight)}\n`,
								stderr: "",
							},
				);
			}));
	}
for (const [index, name] of [
	"Bun source candidate",
	"Node emitted candidate",
	"standalone candidate",
	"shipped Node parity",
].entries())
	for (const status of ["DISPATCHED_RESPONSE_UNKNOWN", "FAILED"]) {
		test(`V3 ${name} ${status} valid result status hold`, () =>
			withFixture(async (f) => {
				const c = consumers[index];
				if (!c) throw new Error("Consumer was not built");
				const terminalBytes = json({
					id: "U05",
					requestId: "previous-u05",
					status,
					result: { path: "previous.png", sha256: imageSHA },
				});
				await writeFile(f.path("terminal.json"), terminalBytes);
				expect(await readFile(f.path("terminal.json"), "utf8")).toBe(
					terminalBytes,
				);
				expect(hash(await readFile(f.path("previous.png")))).toBe(imageSHA);
				console.log(
					json({
						v3Terminal: status,
						raw: terminalBytes,
						sha256: hash(terminalBytes),
						imageSHA,
					}),
				);
				const controller = new AbortController();
				const requested = once(f.server, "request", {
					signal: controller.signal,
				}).then(
					() => true,
					() => false,
				);
				try {
					const result = await invoke(c, f, f.reviewed);
					await absent(f);
					expect(result).toEqual({
						code: 1,
						stdout: "",
						stderr:
							"TERMINAL_RECONCILIATION_REQUIRED: TERMINAL_RECONCILIATION_REQUIRED\n",
					});
				} finally {
					controller.abort();
					await requested;
				}
			}));
	}
