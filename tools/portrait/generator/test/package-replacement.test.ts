import { afterAll, beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Static independent inputs and trusted pins; no production imports or runtime oracle.
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
const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (command: string, args: string[], cwd: string) =>
	new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(done, reject) => {
			const startedAt = new Date().toISOString();
			const child = spawn(command, args, {
				cwd,
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env, NODE_PATH: "" },
			});
			let stdout = "";
			let stderr = "";
			child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
				stdout += chunk;
			});
			child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
				stderr += chunk;
			});
			const deadline = setTimeout(() => child.kill("SIGKILL"), 60_000);
			child.once("error", (error) => {
				clearTimeout(deadline);
				reject(error);
			});
			child.once("close", (code) => {
				clearTimeout(deadline);
				const result = { code, stdout, stderr };
				console.log(
					JSON.stringify({
						command,
						args,
						cwd,
						startedAt,
						endedAt: new Date().toISOString(),
						...result,
					}),
				);
				done(result);
			});
		},
	);
let directory: string;
let consumer: string;
let entry: string;
let installedModule: string;
beforeAll(async () => {
	directory = await mkdtemp(join(tmpdir(), "portrait-package-replacement-"));
	consumer = join(directory, "fresh consumer with spaces");
	await mkdir(consumer);
	const packed = await run(
		"npm",
		["pack", "--json", "--pack-destination", directory],
		packageDirectory,
	);
	expect(packed.code).toBe(0);
	const metadata = JSON.parse(packed.stdout);
	const pack = Array.isArray(metadata)
		? metadata[0]
		: metadata["portrait-generator-preflight"];
	expect(
		pack.files.some((file: { path: string }) =>
			file.path.includes("neutral-package-cli"),
		),
	).toBe(false);
	const installed = await run(
		"npm",
		[
			"install",
			"--ignore-scripts",
			"--no-audit",
			"--no-fund",
			join(directory, pack.filename),
		],
		consumer,
	);
	expect(installed.code).toBe(0);
	for (const name of ["rule", "reference", "look"] as const)
		await writeFile(join(consumer, `${name}.json`), fixture[name]);
	for (const image of fixture.images)
		await writeFile(join(consumer, image.path), new Uint8Array(image.bytes));
	await writeFile(
		join(consumer, "manifest.json"),
		JSON.stringify({
			rule: { path: "rule.json" },
			reference: { path: "reference.json" },
			look: { path: "look.json" },
			referenceImages: fixture.images.map(({ bytes, ...image }) => image),
			composition: fixture.composition,
		}),
	);
	await writeFile(join(consumer, "pins.json"), JSON.stringify(fixture.pins));
	await writeFile(
		join(consumer, "wrong-pins.json"),
		JSON.stringify({ ...fixture.pins, lookSHA: "0".repeat(64) }),
	);
	entry = join(consumer, "node_modules/.bin/portrait-generator");
	installedModule = await realpath(entry);
	expect(installedModule).toBe(
		await realpath(
			join(consumer, "node_modules/portrait-generator-preflight/dist/cli.js"),
		),
	);
	const invoked = await run("node", [entry], consumer);
	expect(invoked.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
}, 120_000);
afterAll(async () => {
	if (directory) await rm(directory, { recursive: true });
});
test("installed help supplies nonempty usage", async () => {
	const result = await run("node", [entry, "--help"], consumer);
	expect(result).toMatchObject({ code: 0, stderr: "" });
	expect(result.stdout.trim().length).toBeGreaterThan(0);
	expect(result.stdout).toContain("Usage:");
});
test("installed offline preflight supplies independent projection hashes", async () => {
	const result = await run(
		"node",
		[entry, "preflight", "--input", "manifest.json", "--pins", "pins.json"],
		consumer,
	);
	expect(result).toMatchObject({ code: 0, stderr: "" });
	expect(result.stdout.trim().length).toBeGreaterThan(0);
	expect(JSON.parse(result.stdout).projection).toEqual(fixture.expected);
});
test("installed preflight rejects wrong trusted look pin", async () => {
	const result = await run(
		"node",
		[
			entry,
			"preflight",
			"--input",
			"manifest.json",
			"--pins",
			"wrong-pins.json",
		],
		consumer,
	);
	expect(result.code).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr).toBe(
		"ARTIFACT_HASH_MISMATCH: ARTIFACT_HASH_MISMATCH\n",
	);
});
test("installed preflight rejects missing arguments", async () => {
	const result = await run("node", [entry, "preflight"], consumer);
	expect(result.code).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr).toBe("INVALID_ARGUMENTS: INVALID_ARGUMENTS\n");
});
for (const runtime of ["node", "bun"])
	test(`${runtime} installed module import remains silent`, async () => {
		const result = await run(
			runtime,
			[
				"--input-type=module",
				"--eval",
				"await import(" +
					JSON.stringify(pathToFileURL(installedModule).href) +
					")",
			],
			consumer,
		);
		expect(result).toEqual({ code: 0, stdout: "", stderr: "" });
	});
