import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

// Independent literal fixture bytes and trusted pins; no runtime production oracle.
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

const packageDirectory = join(import.meta.dir, "..");
const hash = (value: string | Uint8Array) =>
	createHash("sha256").update(value).digest("hex");
const bounded = () => ({ signal: AbortSignal.timeout(15000) });
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
const surfaces = [
	{
		name: "public source",
		entry: join(packageDirectory, "src/cli.ts"),
		call: false,
	},
	{
		name: "public emitted",
		entry: join(packageDirectory, "dist/cli.js"),
		call: false,
	},
	{
		name: "runner source",
		entry: join(packageDirectory, "src/command-runner.ts"),
		call: true,
	},
	{
		name: "runner emitted",
		entry: join(packageDirectory, "dist/command-runner.js"),
		call: true,
	},
	{
		name: "candidate source",
		entry: join(import.meta.dir, "helpers/command-ingress-cli.ts"),
		call: false,
	},
];
for (const surface of surfaces)
	for (const mode of ["help", "preflight", "generate"]) {
		test(`bare Bun stdin ${surface.name} rewritten ${mode}`, async () => {
			const root = await mkdtemp(join(tmpdir(), "u05 bare stdin "));
			const path = (name: string) => join(root, name);
			const requests: string[] = [];
			const server = createServer((request, response) => {
				requests.push(request.url ?? "/");
				response.writeHead(200, { "content-type": "application/json" });
				response.end(
					JSON.stringify({ data: [{ b64_json: image.toString("base64") }] }),
				);
			});
			try {
				const listening = once(server, "listening", bounded());
				server.listen(0, "127.0.0.1");
				await listening;
				const address = server.address();
				if (!address || typeof address === "string")
					throw new Error("TCP address required");
				await Promise.all([
					...(["rule", "reference", "look"] as const).map((name) =>
						writeFile(path(`${name}.json`), fixture[name]),
					),
					...fixture.images.map((item) =>
						writeFile(path(item.path), new Uint8Array(item.bytes)),
					),
					writeFile(path("pins.json"), JSON.stringify(fixture.pins)),
					writeFile(
						path("manifest.json"),
						JSON.stringify({
							rule: { path: "rule.json" },
							reference: { path: "reference.json" },
							look: { path: "look.json" },
							referenceImages: fixture.images.map(
								({ bytes, ...descriptor }) => {
									void bytes;
									return descriptor;
								},
							),
							composition: fixture.composition,
						}),
					),
					writeFile(
						path("connection.json"),
						JSON.stringify({
							baseUrl: `http://127.0.0.1:${address.port}`,
							allowUnauthenticated: true,
						}),
					),
				]);
				const tail =
					mode === "help"
						? ["--help"]
						: mode === "preflight"
							? [
									"preflight",
									"--input",
									path("manifest.json"),
									"--pins",
									path("pins.json"),
								]
							: [
									"generate",
									"--input",
									path("manifest.json"),
									"--pins",
									path("pins.json"),
									"--connection",
									path("connection.json"),
									"--request-id",
									"bare-bun-exact-request",
									"--output",
									path("next.png"),
								];
				const script = `import {writeSync} from "node:fs"; writeSync(3,JSON.stringify({execArgv:process.execArgv,originalArgv:process.argv,reportCommandLine:process.report.getReport().header.commandLine})); process.argv=[process.execPath,${JSON.stringify(surface.entry)},...${JSON.stringify(tail)}]; const loaded=await import(${JSON.stringify(pathToFileURL(surface.entry).href)}); ${surface.call ? "await loaded.runPortraitCommand(process.argv.slice(2));" : ""}`;
				const controller = new AbortController();
				const requested = once(server, "request", {
					signal: controller.signal,
				}).then(
					() => true,
					() => false,
				);
				const child = spawn("bun", ["-"], {
					cwd: root,
					stdio: ["pipe", "pipe", "pipe", "pipe"],
				});
				const closed = once(child, "close", bounded());
				let stdout = "",
					stderr = "",
					metadata = "";
				child.stdout?.setEncoding("utf8").on("data", (chunk: string) => {
					stdout += chunk;
				});
				child.stderr?.setEncoding("utf8").on("data", (chunk: string) => {
					stderr += chunk;
				});
				const pipe = child.stdio[3];
				if (!(pipe instanceof Readable))
					throw new Error("Metadata pipe required");
				pipe.setEncoding("utf8").on("data", (chunk: string) => {
					metadata += chunk;
				});
				child.stdin?.end(script);
				try {
					const [code] = await closed;
					const launch: unknown = JSON.parse(metadata);
					console.log(
						JSON.stringify({
							surface: surface.name,
							mode,
							entry: surface.entry,
							args: ["-"],
							stdin: script,
							launch,
							code,
							stdout,
							stderr,
							requests,
							fixtureImageSHA: hash(image),
						}),
					);
					expect(launch).toEqual({
						execArgv: ["-"],
						originalArgv: [process.execPath, "-"],
						reportCommandLine: ["-"],
					});
					expect(code).toBe(0);
					expect(stderr).toBe("");
					// Command output and side effects are independent real behavior oracles.
					expect(stdout).toBe("");
					expect(requests).toEqual([]);
					for (const suffix of ["", ".request.json", ".receipt.json"])
						await expect(
							readFile(path(`next.png${suffix}`)),
						).rejects.toMatchObject({ code: "ENOENT" });
				} finally {
					controller.abort();
					await requested;
					if (child.exitCode === null && child.signalCode === null) {
						const stopped = once(child, "close", bounded());
						child.kill("SIGKILL");
						await stopped;
					}
				}
			} finally {
				if (server.listening) {
					const closed = once(server, "close", bounded());
					server.closeAllConnections();
					server.close();
					await closed;
				}
				await rm(root, { recursive: true });
			}
		});
	}
